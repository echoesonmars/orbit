"""
Module 10: ESG Assessor Endpoint
POST /api/v1/esg/assess
"""
import os
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.modules.esg_calculator import assess_esg, PROPELLANT_FACTORS, PAYLOAD_FRACTION_TO_FUEL_RATIO

try:
    from supabase import create_client as _sb_create
    _sb = _sb_create(os.getenv("SUPABASE_URL", ""), os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")) \
        if os.getenv("SUPABASE_URL") else None
except Exception:
    _sb = None

router = APIRouter()


class EsgRequest(BaseModel):
    # Satellite properties
    satellite_mass_kg: float = Field(100.0, gt=0, le=100_000, description="Satellite mass in kg")
    propellant_type: str = Field("kerosene_rp1", description="Propellant type ID")
    launch_vehicle_class: str = Field("medium", description="small | medium | heavy | super_heavy")
    # Orbital parameters
    altitude_km: float = Field(550.0, gt=0, le=100_000, description="Operational orbital altitude in km")
    has_deorbit_system: bool = Field(False, description="Satellite has active deorbit propulsion or drag sail")
    expected_lifetime_years: float = Field(5.0, gt=0, le=30, description="Planned mission lifetime in years")
    # Mission context
    has_solar_power: bool = Field(True, description="Satellite is solar-powered (not nuclear/battery only)")
    mission_benefit_score: float = Field(70.0, ge=0, le=100, description="Social benefit score 0-100")
    mission_description: str = Field("", max_length=500)
    # Auth
    user_id: Optional[str] = Field(None)


@router.post("/esg/assess")
async def assess(request: EsgRequest):
    """Run ESG Life Cycle Assessment on a satellite mission."""
    if request.propellant_type not in PROPELLANT_FACTORS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown propellant type. Valid: {list(PROPELLANT_FACTORS.keys())}"
        )
    if request.launch_vehicle_class not in PAYLOAD_FRACTION_TO_FUEL_RATIO:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown launch vehicle class. Valid: {list(PAYLOAD_FRACTION_TO_FUEL_RATIO.keys())}"
        )

    try:
        result = assess_esg(
            satellite_mass_kg=request.satellite_mass_kg,
            propellant_type=request.propellant_type,
            launch_vehicle_class=request.launch_vehicle_class,
            altitude_km=request.altitude_km,
            has_deorbit_system=request.has_deorbit_system,
            expected_lifetime_years=request.expected_lifetime_years,
            has_solar_power=request.has_solar_power,
            mission_benefit_score=request.mission_benefit_score,
            mission_description=request.mission_description,
        )
    except Exception as e:
        print(f"[ESG] Calculation error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

    # ── Save to Supabase ──────────────────────────────────────────────────
    if _sb and request.user_id:
        try:
            _sb.table("esg_assessments").insert({
                "user_id": request.user_id,
                "satellite_mass_kg": request.satellite_mass_kg,
                "propellant_type": request.propellant_type,
                "altitude_km": request.altitude_km,
                "has_deorbit_system": request.has_deorbit_system,
                "carbon_footprint_tons": result["summary"]["total_co2_tons"],
                "debris_risk_score": result["environmental_breakdown"]["debris"]["score"],
                "overall_esg_grade": result["overall_esg_grade"],
                "overall_esg_score": result["overall_esg_score"],
            }).execute()
        except Exception as db_err:
            print(f"[ESG] DB save failed (non-fatal): {db_err}")

    return result


@router.get("/esg/propellants")
async def get_propellants():
    """List all available propellant types with metadata."""
    return {
        "propellants": [
            {
                "id": k,
                "label": v["label"],
                "co2_kg_per_kg": v["co2_kg_per_kg"],
                "toxicity_score": v["toxicity_score"],
                "ozone_impact": v["ozone_impact"],
            }
            for k, v in PROPELLANT_FACTORS.items()
        ],
        "launch_vehicle_classes": list(PAYLOAD_FRACTION_TO_FUEL_RATIO.keys()),
    }
