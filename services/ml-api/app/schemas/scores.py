from typing import Optional, List
from pydantic import BaseModel, Field


# ─── Request ─────────────────────────────────────────────────────────────────

class OrbitScoreParams(BaseModel):
    altitude_km: float = Field(..., gt=100, lt=100_000)
    inclination_deg: float = Field(..., ge=0, le=180)
    eccentricity: float = Field(0.0, ge=0.0, lt=1.0)
    satellite_name: str = Field("Satellite A", max_length=50)


class ScoreOrbitRequest(BaseModel):
    orbits: List[OrbitScoreParams] = Field(..., min_length=1, max_length=4)
    business_goal: str = Field(..., description="Business goal ID from predefined list")
    target_latitude: float = Field(45.0, ge=-90, le=90, description="Target area latitude for coverage check")
    user_id: Optional[str] = Field(None)


# ─── Response ─────────────────────────────────────────────────────────────────

class RadarPoint(BaseModel):
    metric: str
    score: float
    weight: float


class MetricBreakdownItem(BaseModel):
    score: float
    detail: str


class MetricBreakdown(BaseModel):
    coverage: MetricBreakdownItem
    revisit: MetricBreakdownItem
    latency: MetricBreakdownItem
    resolution: MetricBreakdownItem
    radiation: MetricBreakdownItem


class OrbitScoreResult(BaseModel):
    satellite_name: str
    suitability_score: float
    grade: str
    grade_color: str
    business_goal: str
    business_goal_label: str
    altitude_km: float
    inclination_deg: float
    eccentricity: float
    radar: List[RadarPoint]
    breakdown: MetricBreakdown


class GoalProfile(BaseModel):
    id: str
    label: str
    description: str
    emoji: str


class ScoreOrbitResponse(BaseModel):
    results: List[OrbitScoreResult]
    business_goal: str
    business_goal_label: str
    target_latitude: float
    winner: Optional[str] = None  # Name of highest-scoring orbit


class GoalProfilesResponse(BaseModel):
    profiles: List[GoalProfile]
