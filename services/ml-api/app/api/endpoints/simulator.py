"""
Module 9: Scenario Simulator Endpoint
POST /api/v1/simulator/run  — run Monte Carlo simulation
"""
import os
import traceback
from fastapi import APIRouter, HTTPException

from app.schemas.simulator import SimulateRequest
from app.modules.simulator import compute_simulation

try:
    from supabase import create_client as _sb_create
    _sb = _sb_create(os.getenv("SUPABASE_URL", ""), os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")) \
        if os.getenv("SUPABASE_URL") else None
except Exception:
    _sb = None

router = APIRouter()


@router.post("/simulator/run")
async def run_simulation(request: SimulateRequest):
    """Run Monte Carlo satellite investment simulation."""
    try:
        result = compute_simulation(
            total_budget_usd=request.total_budget_usd,
            launch_cost_usd=request.launch_cost_usd,
            satellite_cost_usd=request.satellite_cost_usd,
            ops_cost_per_year_usd=request.ops_cost_per_year_usd,
            launch_failure_prob=request.launch_failure_prob,
            annual_failure_prob=request.annual_failure_prob,
            revenue_per_clear_day_usd=request.revenue_per_clear_day_usd,
            clear_days_mu=request.clear_days_mu,
            clear_days_sigma=request.clear_days_sigma,
            revenue_growth_pct_per_year=request.revenue_growth_pct_per_year,
            mission_duration_years=request.mission_duration_years,
            n_simulations=request.n_simulations,
            mission_type=request.mission_type,
        )

        # ── Save to Supabase ──────────────────────────────────────────────
        if _sb and request.user_id:
            try:
                _sb.table("simulation_results").insert({
                    "user_id": request.user_id,
                    "parameters_json": {
                        "total_budget_usd": request.total_budget_usd,
                        "launch_cost_usd": request.launch_cost_usd,
                        "satellite_cost_usd": request.satellite_cost_usd,
                        "launch_failure_prob": request.launch_failure_prob,
                        "annual_failure_prob": request.annual_failure_prob,
                        "mission_duration_years": request.mission_duration_years,
                        "n_simulations": request.n_simulations,
                        "mission_type": request.mission_type,
                    },
                    "p50_roi": result["percentiles"]["p50"],
                    "p90_roi": result["percentiles"]["p90"],
                    "profitable_pct": result["profitable_pct"],
                    "verdict": result["verdict"],
                    "mission_type": request.mission_type,
                }).execute()
            except Exception as db_err:
                print(f"[Simulator] DB save failed (non-fatal): {db_err}")

        return result

    except Exception as e:
        print(f"[Simulator] Error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
