"""
Module 7: Orbit Suitability Scorer — weighted expert scoring engine.
Scores an orbit (altitude, inclination, eccentricity) against a business goal.
Uses math-based metrics: coverage, revisit time, latency, resolution.
No ML required — pure deterministic scoring.
"""
import math

# ─── Constants ────────────────────────────────────────────────────────────────

R_EARTH_KM = 6371.0   # Earth radius km
C_km_s = 299_792.458  # Speed of light km/s

# ─── Business Goal Weight Profiles ──────────────────────────────────────────

# Weights must sum to 1.0
# Metrics: coverage, revisit, latency, resolution, radiation
GOAL_PROFILES = {
    "earth_observation": {
        "label": "Earth Observation",
        "description": "Agriculture, forestry, disaster monitoring",
        "weights": {
            "coverage": 0.30,
            "revisit": 0.30,
            "latency": 0.05,
            "resolution": 0.30,
            "radiation": 0.05,
        },
        "emoji": "🌍",
    },
    "telecommunications": {
        "label": "Telecommunications",
        "description": "Broadband internet, voice relay",
        "weights": {
            "coverage": 0.35,
            "revisit": 0.10,
            "latency": 0.40,
            "resolution": 0.05,
            "radiation": 0.10,
        },
        "emoji": "📡",
    },
    "navigation_gps": {
        "label": "Navigation / GPS",
        "description": "Positioning, timing services",
        "weights": {
            "coverage": 0.40,
            "revisit": 0.15,
            "latency": 0.25,
            "resolution": 0.05,
            "radiation": 0.15,
        },
        "emoji": "🗺️",
    },
    "surveillance": {
        "label": "Surveillance / Intelligence",
        "description": "High-resolution imaging, reconnaissance",
        "weights": {
            "coverage": 0.10,
            "revisit": 0.25,
            "latency": 0.05,
            "resolution": 0.55,
            "radiation": 0.05,
        },
        "emoji": "🔭",
    },
    "weather": {
        "label": "Weather Monitoring",
        "description": "Meteorology, storm tracking",
        "weights": {
            "coverage": 0.45,
            "revisit": 0.30,
            "latency": 0.05,
            "resolution": 0.10,
            "radiation": 0.10,
        },
        "emoji": "☁️",
    },
    "iot_connectivity": {
        "label": "IoT / M2M Connectivity",
        "description": "Low-power device connectivity, asset tracking",
        "weights": {
            "coverage": 0.30,
            "revisit": 0.20,
            "latency": 0.30,
            "resolution": 0.05,
            "radiation": 0.15,
        },
        "emoji": "🔌",
    },
    "science": {
        "label": "Scientific Research",
        "description": "Space physics, atmospheric studies",
        "weights": {
            "coverage": 0.20,
            "revisit": 0.10,
            "latency": 0.10,
            "resolution": 0.25,
            "radiation": 0.35,
        },
        "emoji": "🔬",
    },
    "starlink_like": {
        "label": "Mega-Constellation (e.g. Starlink)",
        "description": "Global low-latency broadband",
        "weights": {
            "coverage": 0.35,
            "revisit": 0.05,
            "latency": 0.50,
            "resolution": 0.05,
            "radiation": 0.05,
        },
        "emoji": "⭐",
    },
}


# ─── Metric Calculators (each returns 0.0-1.0) ───────────────────────────────

def score_coverage(altitude_km: float, inclination_deg: float) -> tuple[float, str]:
    """
    Coverage score: how much of Earth's surface can the orbit cover?
    Higher altitude + higher inclination = better global coverage.
    """
    # Swath half-angle (nadir angle) ≈ arcsin(R/(R+h))
    nadir_rad = math.asin(R_EARTH_KM / (R_EARTH_KM + altitude_km))
    # Earth half-angle
    earth_angle_rad = math.acos(R_EARTH_KM / (R_EARTH_KM + altitude_km))
    swath_km = 2 * R_EARTH_KM * earth_angle_rad

    # Latitude coverage (inclination determines max latitude)
    lat_coverage = min(inclination_deg / 90.0, 1.0)

    # Altitude bonus: higher = better coverage per pass (capped at GEO)
    alt_factor = min(altitude_km / 36_000.0, 1.0) ** 0.3

    score = min((lat_coverage * 0.6 + alt_factor * 0.4), 1.0)
    return round(score, 3), f"Swath: {swath_km:.0f} km, Max latitude coverage: {inclination_deg:.1f}°"


def score_revisit(altitude_km: float) -> tuple[float, str]:
    """
    Revisit time score: how often does the satellite pass over a point?
    LEO = frequent passes but narrow swath. MEO/GEO = continuous but higher.
    """
    # Orbital period in hours
    mu = 3.986004418e14  # m³/s²
    r_m = (R_EARTH_KM + altitude_km) * 1000.0
    period_h = 2 * math.pi * math.sqrt(r_m**3 / mu) / 3600.0

    # Approximate revisit time for a single satellite
    # LEO (~400km): period ~1.5h, revisit ~14 passes/day over equator
    orbit_per_day = 24.0 / period_h

    # Score: best at LEO, drops off heavily above MEO
    if altitude_km < 600:
        score = 0.95
    elif altitude_km < 1200:
        score = 0.80
    elif altitude_km < 2000:
        score = 0.60
    elif altitude_km < 10000:
        score = 0.35
    elif altitude_km < 36000:
        score = 0.55  # MEO (GPS) has decent revisit
    else:
        score = 0.70  # GEO is continuous — good for coverage, "always watching"

    return round(score, 3), f"Orbital period: {period_h:.2f} h ({orbit_per_day:.1f} orbits/day)"


def score_latency(altitude_km: float) -> tuple[float, str]:
    """
    Latency score: one-way signal propagation time (lower = better).
    Latency = altitude / speed_of_light.
    """
    one_way_ms = (altitude_km / C_km_s) * 1000.0
    round_trip_ms = one_way_ms * 2

    # Threshold: < 10ms = perfect, > 600ms = terrible (GEO)
    if round_trip_ms < 20:
        score = 1.0
    elif round_trip_ms < 50:
        score = 0.90
    elif round_trip_ms < 100:
        score = 0.75
    elif round_trip_ms < 200:
        score = 0.50
    elif round_trip_ms < 400:
        score = 0.25
    elif round_trip_ms < 600:
        score = 0.10
    else:
        score = 0.02  # GEO 600+ ms is terrible for interactive comms

    return round(score, 3), f"One-way: {one_way_ms:.1f} ms, Round-trip: {round_trip_ms:.1f} ms"


def score_resolution(altitude_km: float) -> tuple[float, str]:
    """
    Ground resolution: lower orbit = better image resolution.
    Assumption: diffraction-limited 30cm aperture camera.
    """
    # Approximate GSD (Ground Sample Distance) in meters
    # GSD ≈ (altitude_km * pixel_pitch) / focal_length
    # Simplified: GSD ≈ altitude_km * 0.0003 (with a typical sensor)
    gsd_m = altitude_km * 0.0003

    # Score: <0.5m = 1.0, >100m = 0.0
    if gsd_m < 0.5:
        score = 1.0
    elif gsd_m < 1.0:
        score = 0.90
    elif gsd_m < 3.0:
        score = 0.75
    elif gsd_m < 10.0:
        score = 0.55
    elif gsd_m < 30.0:
        score = 0.35
    elif gsd_m < 100.0:
        score = 0.15
    else:
        score = 0.02

    return round(score, 3), f"Est. ground resolution: {gsd_m:.1f} m/pixel"


def score_radiation(altitude_km: float, inclination_deg: float) -> tuple[float, str]:
    """
    Radiation environment score: Van Allen belts cause satellite degradation.
    LEO below 1000km + low inclination = safest zone.
    """
    # Van Allen inner belt: 1000-6000 km
    if 1000 <= altitude_km <= 6000:
        belt_penalty = 1.0  # Deep in the belt
    elif altitude_km < 1000:
        belt_penalty = 0.0  # Below belts (relatively safe)
    elif altitude_km < 8000:
        belt_penalty = 0.5  # Outer edge
    else:
        belt_penalty = 0.3  # Above most of inner belt (GEO, MEO)

    # Polar orbits (high inclination) pass through polar horns = more radiation
    polar_penalty = min(inclination_deg / 180.0, 1.0) * 0.3

    raw_penalty = min(belt_penalty + polar_penalty, 1.0)
    score = 1.0 - raw_penalty

    env = "Safe (below Van Allen belts)" if altitude_km < 1000 else \
          "Dangerous (Van Allen inner belt)" if 1000 <= altitude_km <= 6000 else \
          "Moderate (above inner belt)"

    return round(score, 3), env


# ─── Main Scoring Function ────────────────────────────────────────────────────

def score_orbit(
    altitude_km: float,
    inclination_deg: float,
    eccentricity: float,
    business_goal: str,
    target_latitude: float = 45.0,
    satellite_name: str = "Satellite",
) -> dict:
    """
    Score an orbit against a business goal.
    Returns a 0-100 score with detailed metric breakdown.
    """
    profile = GOAL_PROFILES.get(business_goal, GOAL_PROFILES["earth_observation"])
    weights = profile["weights"]

    # ── Calculate all metrics ─────────────────────────────────────────────
    cov_score, cov_detail = score_coverage(altitude_km, inclination_deg)
    rev_score, rev_detail = score_revisit(altitude_km)
    lat_score, lat_detail = score_latency(altitude_km)
    res_score, res_detail = score_resolution(altitude_km)
    rad_score, rad_detail = score_radiation(altitude_km, inclination_deg)

    # ── Apply coverage latitude check ────────────────────────────────────
    # If inclination < target latitude, orbit never reaches target area
    if inclination_deg < abs(target_latitude) - 5:
        cov_score *= 0.05  # Orbit can't even reach target latitude
        cov_detail = f"⚠️ Orbit (i={inclination_deg}°) never reaches target lat {target_latitude}°! " + cov_detail

    # ── Eccentricity penalty ─────────────────────────────────────────────
    ecc_factor = max(0.0, 1.0 - eccentricity * 2.0)  # High eccentricity = variable alt = worse in most cases
    cov_score *= ecc_factor
    rev_score *= ecc_factor

    # ── Weighted sum ─────────────────────────────────────────────────────
    weighted = (
        cov_score * weights["coverage"] +
        rev_score * weights["revisit"] +
        lat_score * weights["latency"] +
        res_score * weights["resolution"] +
        rad_score * weights["radiation"]
    )

    final_score = round(weighted * 100, 1)

    # ── Radar chart data ─────────────────────────────────────────────────
    radar = [
        {"metric": "Coverage", "score": round(cov_score * 100, 1), "weight": weights["coverage"]},
        {"metric": "Revisit Time", "score": round(rev_score * 100, 1), "weight": weights["revisit"]},
        {"metric": "Low Latency", "score": round(lat_score * 100, 1), "weight": weights["latency"]},
        {"metric": "Resolution", "score": round(res_score * 100, 1), "weight": weights["resolution"]},
        {"metric": "Radiation Safety", "score": round(rad_score * 100, 1), "weight": weights["radiation"]},
    ]

    # ── Grade ─────────────────────────────────────────────────────────────
    if final_score >= 80:
        grade, grade_color = "Excellent", "#10B981"
    elif final_score >= 65:
        grade, grade_color = "Good", "#3B82F6"
    elif final_score >= 45:
        grade, grade_color = "Average", "#F59E0B"
    elif final_score >= 25:
        grade, grade_color = "Poor", "#EF4444"
    else:
        grade, grade_color = "Unsuitable", "#6B7280"

    return {
        "satellite_name": satellite_name,
        "suitability_score": final_score,
        "grade": grade,
        "grade_color": grade_color,
        "business_goal": business_goal,
        "business_goal_label": profile["label"],
        "altitude_km": altitude_km,
        "inclination_deg": inclination_deg,
        "eccentricity": eccentricity,
        "radar": radar,
        "breakdown": {
            "coverage": {"score": round(cov_score * 100, 1), "detail": cov_detail},
            "revisit": {"score": round(rev_score * 100, 1), "detail": rev_detail},
            "latency": {"score": round(lat_score * 100, 1), "detail": lat_detail},
            "resolution": {"score": round(res_score * 100, 1), "detail": res_detail},
            "radiation": {"score": round(rad_score * 100, 1), "detail": rad_detail},
        },
    }
