"""
Module 3: Capture Value Predictor
Math-based pricing engine (Phase 1). ML model will replace _calculate_value() in Phase 2.
"""
import math
import datetime
from typing import Optional


# ─── Pricing Constants ────────────────────────────────────────────────────────

BASE_VALUE = 200.0              # Starting price per scene ($)
BASE_CLOUD_PENALTY = 6.0        # $ lost per 1% cloud cover
BASE_AREA_PRICE = 0.8           # $ per km² (capped at 500 km²)
FRESHNESS_PREMIUM = 200.0       # $ bonus if captured < 7 days ago
CRISIS_MULTIPLIER = 5.0         # Crisis zones cost 5x more

# Land-use type → commercial value multiplier
LAND_USE_MULTIPLIERS = {
    "city":         2.5,   # Dense urban — high demand
    "port":         3.0,   # Ports/logistics — premium intel
    "agriculture":  1.8,   # Crop monitoring — broadscale demand
    "military":     4.0,   # Restricted zones — very high premium
    "forest":       1.2,   # Environmental monitoring
    "desert":       0.4,   # Low commercial interest
    "ocean":        0.15,  # Almost no commercial value
    "default":      1.0,
}

# Month → season multiplier (Northern hemisphere harvest seasons)
SEASON_MULTIPLIERS = {
    1:  1.0, 2:  1.0, 3:  1.1,   # Winter / early spring
    4:  1.2, 5:  1.2, 6:  1.25,  # Spring growth
    7:  1.3, 8:  1.3, 9:  1.35,  # Peak summer / early harvest
    10: 1.3, 11: 1.1, 12: 1.0,   # Late harvest / winter
}

# Sensor resolution → multiplier
def _resolution_multiplier(gsd_meters: float) -> float:
    if gsd_meters < 0.5:  return 5.0    # Sub-50cm (Maxar class)
    if gsd_meters < 1.0:  return 4.0    # High-res commercial
    if gsd_meters < 5.0:  return 2.0    # Medium-res
    return 1.0                           # 10m+ (Sentinel class)


# ─── Area Helper ─────────────────────────────────────────────────────────────

def _bbox_area_km2(bbox: list[float]) -> float:
    """Estimate bbox area in km²."""
    min_lon, min_lat, max_lon, max_lat = bbox
    lat_mid = math.radians((min_lat + max_lat) / 2)
    dx = abs(max_lon - min_lon) * math.cos(lat_mid) * 111.32
    dy = abs(max_lat - min_lat) * 111.32
    return dx * dy


# ─── Core Predictor ──────────────────────────────────────────────────────────

def predict_value(
    bbox: list[float],
    target: str = "default",
    cloud_cover: float = 20.0,
    gsd_meters: float = 10.0,
    crisis: bool = False,
    captured_date: Optional[str] = None,
) -> dict:
    """
    Predict commercial value of a satellite capture.
    Returns price_usd, confidence, and detailed factor breakdown.
    """
    area_km2 = min(_bbox_area_km2(bbox), 500.0)   # cap at 500 km²
    month = datetime.datetime.now().month

    # ── Calculate each factor ──────────────────────────────────────────────
    land_multiplier     = LAND_USE_MULTIPLIERS.get(target.lower(), LAND_USE_MULTIPLIERS["default"])
    resolution_mult     = _resolution_multiplier(gsd_meters)
    season_mult         = SEASON_MULTIPLIERS[month]
    crisis_mult         = CRISIS_MULTIPLIER if crisis else 1.0
    cloud_penalty       = cloud_cover * BASE_CLOUD_PENALTY
    area_bonus          = area_km2 * BASE_AREA_PRICE

    # Freshness bonus
    freshness_bonus = 0.0
    if captured_date:
        try:
            dt = datetime.datetime.strptime(captured_date.split("T")[0], "%Y-%m-%d")
            age_days = (datetime.datetime.now() - dt).days
            if age_days <= 7:
                freshness_bonus = FRESHNESS_PREMIUM * (1 - age_days / 7)
        except ValueError:
            pass

    # ── Assemble final value ───────────────────────────────────────────────
    raw_value = (
        BASE_VALUE
        * land_multiplier
        * resolution_mult
        * season_mult
        * crisis_mult
        + area_bonus
        + freshness_bonus
        - cloud_penalty
    )
    value_usd = round(max(10.0, min(raw_value, 50_000.0)), 2)

    # ── Confidence score ───────────────────────────────────────────────────
    # Lower confidence when: high clouds, tiny area, no date info
    confidence_penalties = 0.0
    if cloud_cover > 50: confidence_penalties += 0.3
    elif cloud_cover > 25: confidence_penalties += 0.1
    if area_km2 < 10: confidence_penalties += 0.2
    if not captured_date: confidence_penalties += 0.05
    confidence = round(max(0.3, min(1.0 - confidence_penalties, 0.98)), 2)

    # ── Factor breakdown (for the UI pie chart) ────────────────────────────
    factors = [
        {
            "name": "Base Location Value",
            "impact": round(BASE_VALUE * land_multiplier, 2),
            "type": "positive"
        },
        {
            "name": "Area Coverage",
            "impact": round(area_bonus, 2),
            "type": "positive"
        },
        {
            "name": "Resolution Premium",
            "impact": round(BASE_VALUE * land_multiplier * (resolution_mult - 1), 2),
            "type": "positive"
        },
        {
            "name": "Seasonal Demand",
            "impact": round(BASE_VALUE * land_multiplier * season_mult - BASE_VALUE * land_multiplier, 2),
            "type": "positive"
        },
        {
            "name": "Freshness Premium",
            "impact": round(freshness_bonus, 2),
            "type": "positive"
        },
        {
            "name": "Cloud Cover Penalty",
            "impact": round(-cloud_penalty, 2),
            "type": "negative"
        },
    ]

    if crisis:
        factors.append({
            "name": "Crisis Zone Premium",
            "impact": round(value_usd * (1 - 1 / CRISIS_MULTIPLIER), 2),
            "type": "crisis"
        })

    # Filter out zero-impact factors
    factors = [f for f in factors if abs(f["impact"]) > 0.01]

    return {
        "value_usd": value_usd,
        "confidence": confidence,
        "factors": factors,
        "area_km2": round(area_km2, 1),
        "bbox": bbox,
    }
