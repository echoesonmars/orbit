"""
Module 7: Orbit Scorer Endpoint
POST /api/v1/orbits/score   — score one or more orbits for a business goal
GET  /api/v1/orbits/goals   — list available business goal profiles
"""
import os
import traceback
from fastapi import APIRouter, HTTPException
from supabase import create_client

from app.schemas.scores import (
    ScoreOrbitRequest, ScoreOrbitResponse, GoalProfilesResponse,
    OrbitScoreResult, RadarPoint, MetricBreakdown, MetricBreakdownItem,
    GoalProfile,
)
from app.modules.orbit_scorer import score_orbit, GOAL_PROFILES

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def _get_supabase():
    if SUPABASE_URL and SUPABASE_KEY:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    return None


@router.get("/orbits/goals", response_model=GoalProfilesResponse)
async def get_goal_profiles():
    """Return list of available business goal profiles."""
    profiles = [
        GoalProfile(id=k, label=v["label"], description=v["description"], emoji=v["emoji"])
        for k, v in GOAL_PROFILES.items()
    ]
    return GoalProfilesResponse(profiles=profiles)


@router.post("/orbits/score", response_model=ScoreOrbitResponse)
async def score(request: ScoreOrbitRequest):
    """Score one or more orbits for the selected business goal."""
    try:
        if request.business_goal not in GOAL_PROFILES:
            raise HTTPException(status_code=400, detail=f"Unknown business goal: {request.business_goal}")

        results = []
        for orbit_params in request.orbits:
            raw = score_orbit(
                altitude_km=orbit_params.altitude_km,
                inclination_deg=orbit_params.inclination_deg,
                eccentricity=orbit_params.eccentricity,
                business_goal=request.business_goal,
                target_latitude=request.target_latitude,
                satellite_name=orbit_params.satellite_name,
            )

            result = OrbitScoreResult(
                satellite_name=raw["satellite_name"],
                suitability_score=raw["suitability_score"],
                grade=raw["grade"],
                grade_color=raw["grade_color"],
                business_goal=raw["business_goal"],
                business_goal_label=raw["business_goal_label"],
                altitude_km=raw["altitude_km"],
                inclination_deg=raw["inclination_deg"],
                eccentricity=raw["eccentricity"],
                radar=[RadarPoint(**r) for r in raw["radar"]],
                breakdown=MetricBreakdown(
                    coverage=MetricBreakdownItem(**raw["breakdown"]["coverage"]),
                    revisit=MetricBreakdownItem(**raw["breakdown"]["revisit"]),
                    latency=MetricBreakdownItem(**raw["breakdown"]["latency"]),
                    resolution=MetricBreakdownItem(**raw["breakdown"]["resolution"]),
                    radiation=MetricBreakdownItem(**raw["breakdown"]["radiation"]),
                ),
            )
            results.append(result)

            # ── Save to DB ───────────────────────────────────────────────
            if request.user_id:
                try:
                    sb = _get_supabase()
                    if sb:
                        sb.table("orbit_scores").insert({
                            "user_id": request.user_id,
                            "business_goal_id": request.business_goal,
                            "orbit_parameters_json": {
                                "altitude_km": orbit_params.altitude_km,
                                "inclination_deg": orbit_params.inclination_deg,
                                "eccentricity": orbit_params.eccentricity,
                                "satellite_name": orbit_params.satellite_name,
                            },
                            "suitability_score": raw["suitability_score"],
                            "breakdown_json": raw["breakdown"],
                        }).execute()
                except Exception as db_err:
                    print(f"[OrbitScorer] DB save failed (non-fatal): {db_err}")

        # Find winner (highest score)
        winner = max(results, key=lambda r: r.suitability_score).satellite_name if len(results) > 1 else None
        profile = GOAL_PROFILES[request.business_goal]

        return ScoreOrbitResponse(
            results=results,
            business_goal=request.business_goal,
            business_goal_label=profile["label"],
            target_latitude=request.target_latitude,
            winner=winner,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[OrbitScorer] Error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
