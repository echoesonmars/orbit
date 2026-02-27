"""
Module 9: Scenario Simulator — Monte Carlo method for satellite investment risk analysis.
Runs 10,000 virtual satellite life-cycles and reports P10/P50/P90 ROI percentiles.
Pure math: NumPy random distributions, no ML required.
"""
import math
import numpy as np


# ─── Default Risk Profiles ────────────────────────────────────────────────────

MISSION_PROFILES = {
    "earth_observation": {
        "label": "Earth Observation",
        "base_revenue_per_clear_day_usd": 1_250,
        "clear_days_per_year_mu": 200,
        "clear_days_per_year_sigma": 40,
    },
    "telecommunications": {
        "label": "Telecommunications",
        "base_revenue_per_clear_day_usd": 8_000,
        "clear_days_per_year_mu": 365,
        "clear_days_per_year_sigma": 10,
    },
    "surveillance": {
        "label": "Surveillance / Intelligence",
        "base_revenue_per_clear_day_usd": 5_000,
        "clear_days_per_year_mu": 150,
        "clear_days_per_year_sigma": 50,
    },
    "iot_connectivity": {
        "label": "IoT / M2M Connectivity",
        "base_revenue_per_clear_day_usd": 2_000,
        "clear_days_per_year_mu": 365,
        "clear_days_per_year_sigma": 5,
    },
    "weather": {
        "label": "Weather Monitoring",
        "base_revenue_per_clear_day_usd": 3_000,
        "clear_days_per_year_mu": 365,
        "clear_days_per_year_sigma": 15,
    },
}


# ─── Monte Carlo Simulation ───────────────────────────────────────────────────

def run_monte_carlo(
    n_simulations: int,
    mission_duration_years: int,
    total_budget_usd: float,
    launch_cost_usd: float,
    satellite_cost_usd: float,
    launch_failure_prob: float,         # 0.0-1.0
    annual_failure_prob: float,         # probability satellite dies each year
    revenue_per_clear_day_usd: float,
    clear_days_mu: float,               # mean clear revenue days per year
    clear_days_sigma: float,            # std dev
    ops_cost_per_year_usd: float,
    revenue_growth_pct_per_year: float, # e.g. 0.05 = 5% annual revenue growth
    rng_seed: int = 42,
) -> dict:
    """
    Monte Carlo loop: simulate n_simulations satellite life-cycles.
    Returns distribution statistics and percentile outcomes.
    """
    rng = np.random.default_rng(rng_seed)
    total_investment = launch_cost_usd + satellite_cost_usd

    net_profits = np.zeros(n_simulations)

    for i in range(n_simulations):
        # ── Event 1: Launch success/failure ────────────────────────────
        if rng.random() < launch_failure_prob:
            # Total loss of investment
            net_profits[i] = -(total_investment)
            continue

        # Satellite launched successfully — start yearly life simulation
        remaining_budget = total_budget_usd - total_investment
        cumulative_revenue = 0.0
        satellite_alive = True

        for year in range(mission_duration_years):
            if not satellite_alive:
                # Ops costs still charged for deorbit/closedown
                remaining_budget -= ops_cost_per_year_usd * 0.1
                break

            # ── Event 2: Annual failure check ──────────────────────────
            if rng.random() < annual_failure_prob:
                satellite_alive = False
                remaining_budget -= ops_cost_per_year_usd
                continue

            # ── Event 3: Revenue generation ────────────────────────────
            clear_days = max(0.0, rng.normal(clear_days_mu, clear_days_sigma))
            growth_factor = (1 + revenue_growth_pct_per_year) ** year

            year_revenue = clear_days * revenue_per_clear_day_usd * growth_factor
            # Add noise (±15% revenue variance)
            year_revenue *= rng.uniform(0.85, 1.15)

            cumulative_revenue += year_revenue
            remaining_budget -= ops_cost_per_year_usd

        net_profits[i] = cumulative_revenue - total_investment - (ops_cost_per_year_usd * mission_duration_years)

    return net_profits


def compute_simulation(
    # Financial parameters
    total_budget_usd: float = 10_000_000,
    launch_cost_usd: float = 2_000_000,
    satellite_cost_usd: float = 3_000_000,
    ops_cost_per_year_usd: float = 500_000,
    # Risk parameters
    launch_failure_prob: float = 0.05,
    annual_failure_prob: float = 0.02,
    # Revenue parameters
    revenue_per_clear_day_usd: float = 1_250,
    clear_days_mu: float = 200,
    clear_days_sigma: float = 40,
    revenue_growth_pct_per_year: float = 0.05,
    # Simulation parameters
    mission_duration_years: int = 5,
    n_simulations: int = 10_000,
    mission_type: str = "earth_observation",
) -> dict:
    """
    Full Monte Carlo simulation pipeline.
    Returns percentiles, distribution histogram, and key insights.
    """
    net_profits = run_monte_carlo(
        n_simulations=n_simulations,
        mission_duration_years=mission_duration_years,
        total_budget_usd=total_budget_usd,
        launch_cost_usd=launch_cost_usd,
        satellite_cost_usd=satellite_cost_usd,
        launch_failure_prob=launch_failure_prob,
        annual_failure_prob=annual_failure_prob,
        revenue_per_clear_day_usd=revenue_per_clear_day_usd,
        clear_days_mu=clear_days_mu,
        clear_days_sigma=clear_days_sigma,
        ops_cost_per_year_usd=ops_cost_per_year_usd,
        revenue_growth_pct_per_year=revenue_growth_pct_per_year,
    )

    # ── Percentiles ───────────────────────────────────────────────────────
    p5  = float(np.percentile(net_profits, 5))
    p10 = float(np.percentile(net_profits, 10))
    p25 = float(np.percentile(net_profits, 25))
    p50 = float(np.percentile(net_profits, 50))
    p75 = float(np.percentile(net_profits, 75))
    p90 = float(np.percentile(net_profits, 90))
    p95 = float(np.percentile(net_profits, 95))

    # ── Probability of profit ─────────────────────────────────────────────
    profitable_pct = float(np.mean(net_profits > 0) * 100)
    total_loss_pct = float(np.mean(net_profits <= -(launch_cost_usd + satellite_cost_usd)) * 100)

    # ── Histogram (30 bins) for distribution chart ────────────────────────
    counts, bin_edges = np.histogram(net_profits, bins=30)
    histogram = [
        {
            "bin_start": round(float(bin_edges[i]) / 1_000_000, 3),
            "bin_end":   round(float(bin_edges[i + 1]) / 1_000_000, 3),
            "count":     int(counts[i]),
            "pct":       round(float(counts[i]) / n_simulations * 100, 2),
            "is_profit": float(bin_edges[i]) > 0,
        }
        for i in range(len(counts))
    ]

    # ── Fan chart: cumulative year-by-year P10/P50/P90 ───────────────────
    # Run a simplified year-by-year simulation for the fan chart
    fan_chart = _build_fan_chart(
        n_simulations=min(n_simulations, 2000),  # Use 2000 for speed
        mission_duration_years=mission_duration_years,
        total_investment=launch_cost_usd + satellite_cost_usd,
        launch_failure_prob=launch_failure_prob,
        annual_failure_prob=annual_failure_prob,
        revenue_per_clear_day_usd=revenue_per_clear_day_usd,
        clear_days_mu=clear_days_mu,
        clear_days_sigma=clear_days_sigma,
        ops_cost_per_year_usd=ops_cost_per_year_usd,
    )

    # ── ROI calculation ───────────────────────────────────────────────────
    total_investment = launch_cost_usd + satellite_cost_usd
    roi_p50 = (p50 / total_investment * 100) if total_investment > 0 else 0

    # ── Verdict ───────────────────────────────────────────────────────────
    if profitable_pct >= 70:
        verdict = "Strong Investment"
        verdict_color = "#10B981"
    elif profitable_pct >= 50:
        verdict = "Moderate Risk"
        verdict_color = "#F59E0B"
    elif profitable_pct >= 30:
        verdict = "High Risk"
        verdict_color = "#EF4444"
    else:
        verdict = "Very High Risk"
        verdict_color = "#6B7280"

    return {
        "n_simulations": n_simulations,
        "mission_duration_years": mission_duration_years,
        "mission_type": mission_type,
        "total_investment_usd": total_investment,
        "profitable_pct": round(profitable_pct, 1),
        "total_loss_pct": round(total_loss_pct, 1),
        "verdict": verdict,
        "verdict_color": verdict_color,
        "roi_p50_pct": round(roi_p50, 1),
        "percentiles": {
            "p5":  round(p5  / 1_000_000, 3),
            "p10": round(p10 / 1_000_000, 3),
            "p25": round(p25 / 1_000_000, 3),
            "p50": round(p50 / 1_000_000, 3),
            "p75": round(p75 / 1_000_000, 3),
            "p90": round(p90 / 1_000_000, 3),
            "p95": round(p95 / 1_000_000, 3),
        },
        "histogram": histogram,
        "fan_chart": fan_chart,
    }


def _build_fan_chart(
    n_simulations: int,
    mission_duration_years: int,
    total_investment: float,
    launch_failure_prob: float,
    annual_failure_prob: float,
    revenue_per_clear_day_usd: float,
    clear_days_mu: float,
    clear_days_sigma: float,
    ops_cost_per_year_usd: float,
) -> list[dict]:
    """Build year-by-year cumulative net profit distribution for fan chart."""
    rng = np.random.default_rng(99)
    yearly_profits = np.zeros((n_simulations, mission_duration_years + 1))

    # Year 0: initial investment
    yearly_profits[:, 0] = -total_investment

    for i in range(n_simulations):
        if rng.random() < launch_failure_prob:
            yearly_profits[i, :] = -total_investment
            continue

        cumulative = -total_investment
        alive = True
        for year in range(1, mission_duration_years + 1):
            if not alive:
                yearly_profits[i, year] = cumulative
                continue
            if rng.random() < annual_failure_prob:
                alive = False
                cumulative -= ops_cost_per_year_usd
                yearly_profits[i, year] = cumulative
                continue
            clear_days = max(0.0, rng.normal(clear_days_mu, clear_days_sigma))
            cumulative += clear_days * revenue_per_clear_day_usd - ops_cost_per_year_usd
            yearly_profits[i, year] = cumulative

    fan = []
    for year in range(mission_duration_years + 1):
        col = yearly_profits[:, year]
        fan.append({
            "year": year,
            "p10": round(float(np.percentile(col, 10)) / 1_000_000, 3),
            "p25": round(float(np.percentile(col, 25)) / 1_000_000, 3),
            "p50": round(float(np.percentile(col, 50)) / 1_000_000, 3),
            "p75": round(float(np.percentile(col, 75)) / 1_000_000, 3),
            "p90": round(float(np.percentile(col, 90)) / 1_000_000, 3),
        })
    return fan
