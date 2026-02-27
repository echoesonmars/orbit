"""
Module 3: Capture Value Predictor
Math-based pricing engine with real NASA data enrichment.
Phase 2: Auto crisis detection (EONET) + space weather confidence (DONKI).
"""
import math
import datetime
from typing import Optional

from app.modules.nasa_adapter import check_crisis_zone, get_space_weather
from app.modules.weather_adapter import get_actual_cloud_cover

# ─── Pricing Constants ────────────────────────────────────────────────────────

BASE_VALUE = 200.0
BASE_CLOUD_PENALTY = 6.0
BASE_AREA_PRICE = 0.8
FRESHNESS_PREMIUM = 200.0
CRISIS_MULTIPLIER = 5.0

LAND_USE_MULTIPLIERS = {
    "city":         2.5,
    "port":         3.0,
    "agriculture":  1.8,
    "military":     4.0,
    "forest":       1.2,
    "desert":       0.4,
    "ocean":        0.15,
    "default":      1.0,
}

SEASON_MULTIPLIERS = {
    1:  1.0, 2:  1.0, 3:  1.1,
    4:  1.2, 5:  1.2, 6:  1.25,
    7:  1.3, 8:  1.3, 9:  1.35,
    10: 1.3, 11: 1.1, 12: 1.0,
}

def _resolution_multiplier(gsd_meters: float) -> float:
    if gsd_meters < 0.5: return 5.0
    if gsd_meters < 1.0: return 4.0
    if gsd_meters < 5.0: return 2.0
    return 1.0

def _bbox_area_km2(bbox: list[float]) -> float:
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
    crisis: bool = False,            # manual override from user
    captured_date: Optional[str] = None,
) -> dict:
    area_km2 = min(_bbox_area_km2(bbox), 500.0)
    month = datetime.datetime.now().month

    # ── Weather Enrichment (Open-Meteo) ───────────────────────────────────
    # If cloud_cover is < 0 or default 20.0 (and we have bbox), try auto-detect
    final_cloud_cover = cloud_cover
    weather_source = "Manual Input"
    
    # Only auto-detect when the frontend explicitly sends cloud_cover = -1
    if cloud_cover < 0:
        actual_clouds = get_actual_cloud_cover(bbox)
        if actual_clouds is not None:
            final_cloud_cover = actual_clouds
            weather_source = "Open-Meteo Real-time"

    # ── NASA Enrichment (real-time, parallel-ish) ──────────────────────────
    # 1. EONET: auto-detect crisis zone by bbox intersection
    eonet = check_crisis_zone(bbox)
    nasa_crisis = eonet["is_crisis"]
    crisis_events = eonet["events"]

    # 2. DONKI: space weather confidence penalty
    space_wx = get_space_weather()
    sw_penalty = space_wx["confidence_penalty"]
    storm_level = space_wx["storm_level"]
    solar_flares = space_wx["solar_flares"]

    # Final crisis flag: either user set it OR NASA detected an event
    is_crisis = crisis or nasa_crisis
    crisis_mult = CRISIS_MULTIPLIER if is_crisis else 1.0

    # ── Standard factors ───────────────────────────────────────────────────
    land_multiplier = LAND_USE_MULTIPLIERS.get(target.lower(), LAND_USE_MULTIPLIERS["default"])
    resolution_mult = _resolution_multiplier(gsd_meters)
    season_mult     = SEASON_MULTIPLIERS[month]
    cloud_penalty   = final_cloud_cover * BASE_CLOUD_PENALTY
    area_bonus      = area_km2 * BASE_AREA_PRICE

    freshness_bonus = 0.0
    if captured_date:
        try:
            dt = datetime.datetime.strptime(captured_date.split("T")[0], "%Y-%m-%d")
            age_days = (datetime.datetime.now() - dt).days
            if age_days <= 7:
                freshness_bonus = FRESHNESS_PREMIUM * (1 - age_days / 7)
        except ValueError:
            pass

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

    # ── Confidence ─────────────────────────────────────────────────────────
    conf_penalties = 0.0
    if final_cloud_cover > 50: conf_penalties += 0.3
    elif final_cloud_cover > 25: conf_penalties += 0.1
    if area_km2 < 10: conf_penalties += 0.2
    if not captured_date: conf_penalties += 0.05
    conf_penalties += sw_penalty           # NASA DONKI penalty
    confidence = round(max(0.3, min(1.0 - conf_penalties, 0.98)), 2)

    # ── Factor breakdown ───────────────────────────────────────────────────
    factors = [
        {"name": "Base Location Value", "impact": round(BASE_VALUE * land_multiplier, 2), "type": "positive"},
        {"name": "Area Coverage",       "impact": round(area_bonus, 2),                   "type": "positive"},
        {"name": "Resolution Premium",  "impact": round(BASE_VALUE * land_multiplier * (resolution_mult - 1), 2), "type": "positive"},
        {"name": "Seasonal Demand",     "impact": round(BASE_VALUE * land_multiplier * season_mult - BASE_VALUE * land_multiplier, 2), "type": "positive"},
        {"name": "Freshness Premium",   "impact": round(freshness_bonus, 2),               "type": "positive"},
        {"name": "Cloud Cover Penalty", "impact": round(-cloud_penalty, 2),                "type": "negative"},
    ]

    if is_crisis:
        crisis_label = f"Crisis Zone: {', '.join(crisis_events[:2])}" if crisis_events else "Crisis Zone Premium"
        factors.append({
            "name": crisis_label,
            "impact": round(value_usd * (1 - 1 / CRISIS_MULTIPLIER), 2),
            "type": "crisis"
        })

    if storm_level != "None":
        factors.append({
            "name": f"Space Weather Risk ({storm_level} Storm)",
            "impact": round(-value_usd * sw_penalty * 0.3, 2),
            "type": "negative"
        })

    if solar_flares > 0:
        factors.append({
            "name": f"Solar Activity ({solar_flares} M/X flares)",
            "impact": round(-value_usd * 0.02 * solar_flares, 2),
            "type": "negative"
        })

    factors = [f for f in factors if abs(f["impact"]) > 0.01]

    return {
        "value_usd": value_usd,
        "confidence": confidence,
        "factors": factors,
        "area_km2": round(area_km2, 1),
        "bbox": bbox,
        "cloud_cover_used": round(final_cloud_cover, 1),
        "weather_source": weather_source,
        "nasa": {
            "crisis_detected": nasa_crisis,
            "crisis_events": crisis_events,
            "storm_level": storm_level,
            "solar_flares": solar_flares,
        },
    }
