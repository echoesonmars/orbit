from typing import List, Optional
from pydantic import BaseModel, Field


# ─── Request ──────────────────────────────────────────────────────────────────

class OrbitParams(BaseModel):
    altitude_km: float = Field(..., gt=100, lt=100_000, description="Orbital altitude in km above Earth's surface")
    inclination_deg: float = Field(0.0, ge=0, le=180, description="Orbital inclination in degrees")


class OptimizeOrbitRequest(BaseModel):
    initial_orbit: OrbitParams
    target_orbit: OrbitParams
    satellite_mass_kg: float = Field(..., gt=0, lt=500_000, description="Satellite dry mass in kg")
    isp_s: float = Field(320.0, gt=50, lt=5000, description="Engine specific impulse in seconds")
    fuel_cost_per_kg: float = Field(5000.0, gt=0, description="Cost of propellant per kg in USD")
    user_id: Optional[str] = Field(None, description="User ID for saving to DB")


# ─── Response ─────────────────────────────────────────────────────────────────

class ManeuverBurn(BaseModel):
    name: str
    delta_v_ms: float
    description: str


class OrbitPoint(BaseModel):
    x: float
    y: float
    z: float


class OrbitTrajectory(BaseModel):
    label: str
    color: str
    points: List[OrbitPoint]


class OptimizeOrbitResponse(BaseModel):
    # Summary
    total_delta_v_ms: float
    fuel_mass_kg: float
    fuel_cost_usd: float
    transfer_time_hours: float
    maneuver_type: str

    # Detailed burns
    burns: List[ManeuverBurn]

    # 3D visualization data
    trajectories: List[OrbitTrajectory]

    # Input echo
    initial_altitude_km: float
    target_altitude_km: float
    initial_inclination_deg: float
    target_inclination_deg: float
    satellite_mass_kg: float
