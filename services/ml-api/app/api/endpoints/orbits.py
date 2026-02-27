"""
Module 6: Orbit Optimizer Endpoint
POST /api/v1/orbits/optimize  — calculate optimal transfer between two orbits
"""
import os
import traceback
from fastapi import APIRouter, HTTPException
from supabase import create_client

from app.schemas.orbits import (
    OptimizeOrbitRequest, OptimizeOrbitResponse,
    ManeuverBurn, OrbitTrajectory, OrbitPoint,
)
from app.modules.orbit_optimizer import optimize_orbit

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _get_supabase():
    if SUPABASE_URL and SUPABASE_KEY:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    return None


@router.post("/orbits/optimize", response_model=OptimizeOrbitResponse)
async def optimize(request: OptimizeOrbitRequest):
    """Calculate optimal orbital transfer maneuver and save to DB."""
    try:
        result = optimize_orbit(
            initial_alt_km=request.initial_orbit.altitude_km,
            target_alt_km=request.target_orbit.altitude_km,
            initial_inc_deg=request.initial_orbit.inclination_deg,
            target_inc_deg=request.target_orbit.inclination_deg,
            satellite_mass_kg=request.satellite_mass_kg,
            isp_s=request.isp_s,
            fuel_cost_per_kg=request.fuel_cost_per_kg,
        )

        # ── Save to Supabase (non-blocking — failure doesn't break response) ──
        if request.user_id:
            try:
                sb = _get_supabase()
                if sb:
                    sb.table("orbit_maneuvers").insert({
                        "user_id": request.user_id,
                        "satellite_mass_kg": request.satellite_mass_kg,
                        "initial_orbit_json": {
                            "altitude_km": request.initial_orbit.altitude_km,
                            "inclination_deg": request.initial_orbit.inclination_deg,
                        },
                        "target_orbit_json": {
                            "altitude_km": request.target_orbit.altitude_km,
                            "inclination_deg": request.target_orbit.inclination_deg,
                        },
                        "delta_v_ms": result["total_delta_v_ms"],
                        "fuel_kg": result["fuel_mass_kg"],
                        "fuel_cost_usd": result["fuel_cost_usd"],
                        "transfer_time_hours": result["transfer_time_hours"],
                        "maneuver_type": result["maneuver_type"],
                    }).execute()
                    print(f"[OrbitOptimizer] Saved maneuver for user {request.user_id}")
            except Exception as db_err:
                print(f"[OrbitOptimizer] DB save failed (non-fatal): {db_err}")

        return OptimizeOrbitResponse(
            total_delta_v_ms=result["total_delta_v_ms"],
            fuel_mass_kg=result["fuel_mass_kg"],
            fuel_cost_usd=result["fuel_cost_usd"],
            transfer_time_hours=result["transfer_time_hours"],
            maneuver_type=result["maneuver_type"],
            burns=[ManeuverBurn(**b) for b in result["burns"]],
            trajectories=[
                OrbitTrajectory(
                    label=t["label"],
                    color=t["color"],
                    points=[OrbitPoint(**p) for p in t["points"]],
                )
                for t in result["trajectories"]
            ],
            initial_altitude_km=result["initial_altitude_km"],
            target_altitude_km=result["target_altitude_km"],
            initial_inclination_deg=result["initial_inclination_deg"],
            target_inclination_deg=result["target_inclination_deg"],
            satellite_mass_kg=result["satellite_mass_kg"],
        )

    except Exception as e:
        print(f"[OrbitOptimizer] Error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
