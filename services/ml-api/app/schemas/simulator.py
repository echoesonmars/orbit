from typing import Optional
from pydantic import BaseModel, Field


class SimulateRequest(BaseModel):
    # Financial
    total_budget_usd: float = Field(10_000_000, gt=0, description="Total mission budget in USD")
    launch_cost_usd: float = Field(2_000_000, gt=0, description="Launch vehicle cost in USD")
    satellite_cost_usd: float = Field(3_000_000, gt=0, description="Satellite build cost in USD")
    ops_cost_per_year_usd: float = Field(500_000, gt=0, description="Annual operations cost in USD")
    # Risk
    launch_failure_prob: float = Field(0.05, ge=0, le=1, description="Launch failure probability (0-1)")
    annual_failure_prob: float = Field(0.02, ge=0, le=1, description="Annual in-orbit failure probability (0-1)")
    # Revenue
    revenue_per_clear_day_usd: float = Field(1_250, gt=0, description="Revenue per operational day in USD")
    clear_days_mu: float = Field(200, gt=0, le=365, description="Mean operational days per year")
    clear_days_sigma: float = Field(40, ge=0, description="Std deviation of operational days per year")
    revenue_growth_pct_per_year: float = Field(0.05, ge=0, le=1, description="Annual revenue growth rate")
    # Simulation
    mission_duration_years: int = Field(5, ge=1, le=20, description="Mission duration in years")
    n_simulations: int = Field(10_000, ge=100, le=50_000, description="Number of Monte Carlo iterations")
    mission_type: str = Field("earth_observation")
    # Auth
    user_id: Optional[str] = Field(None)
