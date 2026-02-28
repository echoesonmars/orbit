"""
Module 5: Launch Delay Predictor
Deterministic risk engine using Launch Library 2 + Open-Meteo weather data.
Phase 1: Math-based. Phase 2: CatBoost Classifier.
"""
import os
import requests
from datetime import datetime, timezone
from typing import Optional


# ─── Known Rocket Reliability Data ────────────────────────────────────────────
# Historical success rates (approximated)
ROCKET_RELIABILITY = {
    "falcon 9":         0.97,
    "falcon heavy":     0.85,
    "starship":         0.30,
    "electron":         0.92,
    "soyuz":            0.97,
    "ariane 5":         0.96,
    "ariane 6":         0.60,
    "atlas v":          0.98,
    "vulcan centaur":   0.50,
    "h-iia":            0.98,
    "long march 5":     0.90,
    "long march 2d":    0.97,
    "pslv":             0.94,
    "vega":             0.92,
    "vega-c":           0.50,
    "new glenn":        0.30,
}

# Known spaceport weather risk (seasonal/historical)
SPACEPORT_WEATHER_RISK = {
    "cape canaveral":          0.35,
    "kennedy space center":    0.35,
    "vandenberg":              0.15,
    "baikonur":                0.20,
    "kourou":                  0.25,
    "tanegashima":             0.30,
    "mahia peninsula":         0.25,
    "satish dhawan":           0.30,
    "xichang":                 0.20,
    "wenchang":                0.25,
    "plesetsk":                0.15,
    "wallops":                 0.20,
}


# ─── Launch Library 2 ─────────────────────────────────────────────────────────

def get_upcoming_launches(limit: int = 15) -> list:
    """Fetch upcoming launches from The Space Devs API (Launch Library 2)."""
    url = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/"
    try:
        resp = requests.get(url, params={
            "limit": limit,
            "mode": "detailed",
            "hide_recent_previous": True,
        }, timeout=15)

        if resp.status_code != 200:
            print(f"[DelayPredictor] LL2 API returned {resp.status_code}")
            return []

        data = resp.json()
        launches = []

        for i, launch in enumerate(data.get("results", [])):
            try:
                pad = launch.get("pad") or {}
                location = pad.get("location") or {}

                lat, lon = 28.6, -80.6
                try:
                    lat = float(pad.get("latitude") or 0)
                    lon = float(pad.get("longitude") or 0)
                except (TypeError, ValueError):
                    pass

                rocket_cfg = launch.get("rocket") or {}
                config = rocket_cfg.get("configuration") or {}
                rocket_name = config.get("name", "Unknown")

                mission_obj = launch.get("mission")
                mission_name = mission_obj.get("name") if isinstance(mission_obj, dict) else None

                status_obj = launch.get("status") or {}
                status_abbrev = status_obj.get("abbrev", "TBD") if isinstance(status_obj, dict) else "TBD"

                launches.append({
                    "id": str(launch.get("id", "")),
                    "name": launch.get("name", "Unknown") or "Unknown",
                    "rocket": rocket_name,
                    "mission": mission_name,
                    "spaceport": {
                        "name": location.get("name", "Unknown") or "Unknown",
                        "country": location.get("country_code", "??") or "??",
                        "latitude": lat,
                        "longitude": lon,
                    },
                    "net_date": launch.get("net", "") or "",
                    "status": status_abbrev,
                    "image_url": launch.get("image"),
                    "webcast_url": None,
                })

                vids = launch.get("vidURLs") or []
                if vids and len(vids) > 0:
                    first_vid = vids[0] if isinstance(vids[0], dict) else {}
                    launches[-1]["webcast_url"] = first_vid.get("url")
            except Exception as row_e:
                print(f"[DelayPredictor] Error parsing launch at index {i}: {row_e}")
                continue

        return launches

    except Exception as e:
        print(f"[DelayPredictor] Error fetching launches: {e}")
        return []


# ─── Open-Meteo Weather ──────────────────────────────────────────────────────

def _get_spaceport_weather(lat: float, lon: float, date_str: str) -> dict:
    """Fetch weather forecast at spaceport coordinates for launch date."""
    default = {
        "wind_speed_kmh": 15.0,
        "wind_gusts_kmh": 25.0,
        "cloud_cover_pct": 30.0,
        "precipitation_prob_pct": 10.0,
        "temperature_c": 22.0,
        "description": "Data unavailable — using defaults",
    }

    try:
        # Parse launch date
        launch_dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        target_date = launch_dt.strftime("%Y-%m-%d")

        # Open-Meteo only forecasts ~16 days ahead
        days_ahead = (launch_dt - datetime.now(timezone.utc)).days
        if days_ahead > 16 or days_ahead < 0:
            default["description"] = f"Launch {days_ahead}d away — beyond forecast range, using historical averages"
            return default

        url = "https://api.open-meteo.com/v1/forecast"
        resp = requests.get(url, params={
            "latitude": lat,
            "longitude": lon,
            "daily": "wind_speed_10m_max,wind_gusts_10m_max,precipitation_probability_max,cloud_cover_mean,temperature_2m_max",
            "start_date": target_date,
            "end_date": target_date,
            "timezone": "UTC",
        }, timeout=10)

        if resp.status_code != 200:
            return default

        daily = resp.json().get("daily", {})

        wind = daily.get("wind_speed_10m_max", [15.0])[0] or 15.0
        gusts = daily.get("wind_gusts_10m_max", [25.0])[0] or 25.0
        precip = daily.get("precipitation_probability_max", [10.0])[0] or 10.0
        clouds = daily.get("cloud_cover_mean", [30.0])[0] or 30.0
        temp = daily.get("temperature_2m_max", [22.0])[0] or 22.0

        # Generate description
        conditions = []
        if wind > 50:
            conditions.append("Very strong winds")
        elif wind > 35:
            conditions.append("Strong winds")
        if precip > 60:
            conditions.append("High precipitation chance")
        elif precip > 30:
            conditions.append("Moderate precipitation chance")
        if clouds > 80:
            conditions.append("Heavy cloud cover")
        if temp < 2:
            conditions.append("Near-freezing temperatures")

        desc = ", ".join(conditions) if conditions else "Generally favorable conditions"

        return {
            "wind_speed_kmh": round(wind, 1),
            "wind_gusts_kmh": round(gusts, 1),
            "cloud_cover_pct": round(clouds, 1),
            "precipitation_prob_pct": round(precip, 1),
            "temperature_c": round(temp, 1),
            "description": desc,
        }
    except Exception as e:
        print(f"[DelayPredictor] Weather error: {e}")
        return default


# ─── Risk Engine ──────────────────────────────────────────────────────────────

def _find_launch_by_id(launch_id: str, launches: list) -> dict | None:
    """Find a specific launch from the list by ID."""
    for launch in launches:
        if launch["id"] == launch_id:
            return launch
    return None


def predict_delay(launch_id: str) -> dict:
    """
    Calculate delay probability for a specific launch.
    Returns a full risk assessment with weather and factor breakdown.
    """
    # 1. Fetch upcoming launches and find the one we need
    launches = get_upcoming_launches(limit=25)
    launch = _find_launch_by_id(launch_id, launches)

    if not launch:
        raise ValueError(f"Launch {launch_id} not found in upcoming launches")

    # 2. Get weather forecast at spaceport
    sp = launch["spaceport"]
    weather = _get_spaceport_weather(sp["latitude"], sp["longitude"], launch["net_date"])

    # 3. Calculate risk factors
    factors = []
    total_risk = 0.0

    # Factor 1: Wind Speed (weight: 0.30)
    wind = weather["wind_speed_kmh"]
    if wind > 60:
        wind_risk = 0.95
        wind_detail = f"Extreme winds ({wind} km/h) — launch almost certainly scrubbed"
    elif wind > 45:
        wind_risk = 0.75
        wind_detail = f"Very strong winds ({wind} km/h) — high probability of delay"
    elif wind > 35:
        wind_risk = 0.50
        wind_detail = f"Strong winds ({wind} km/h) — marginal conditions"
    elif wind > 25:
        wind_risk = 0.25
        wind_detail = f"Moderate winds ({wind} km/h) — generally acceptable"
    else:
        wind_risk = 0.05
        wind_detail = f"Light winds ({wind} km/h) — excellent conditions"
    factors.append({"name": "Wind Speed", "risk": wind_risk, "detail": wind_detail})
    total_risk += wind_risk * 0.30

    # Factor 2: Precipitation (weight: 0.25)
    precip = weather["precipitation_prob_pct"]
    if precip > 70:
        precip_risk = 0.90
        precip_detail = f"Very high precipitation chance ({precip}%) — likely scrub"
    elif precip > 50:
        precip_risk = 0.65
        precip_detail = f"Significant precipitation chance ({precip}%)"
    elif precip > 30:
        precip_risk = 0.35
        precip_detail = f"Moderate precipitation chance ({precip}%)"
    else:
        precip_risk = 0.10
        precip_detail = f"Low precipitation chance ({precip}%) — favorable"
    factors.append({"name": "Precipitation", "risk": precip_risk, "detail": precip_detail})
    total_risk += precip_risk * 0.25

    # Factor 3: Cloud Cover (weight: 0.10)
    clouds = weather["cloud_cover_pct"]
    if clouds > 90:
        cloud_risk = 0.70
        cloud_detail = f"Near-total cloud cover ({clouds}%) — poor tracking"
    elif clouds > 70:
        cloud_risk = 0.40
        cloud_detail = f"Heavy clouds ({clouds}%) — marginal for tracking"
    elif clouds > 50:
        cloud_risk = 0.20
        cloud_detail = f"Moderate clouds ({clouds}%) — acceptable"
    else:
        cloud_risk = 0.05
        cloud_detail = f"Clear skies ({clouds}%) — ideal conditions"
    factors.append({"name": "Cloud Cover", "risk": cloud_risk, "detail": cloud_detail})
    total_risk += cloud_risk * 0.10

    # Factor 4: Rocket Reliability (weight: 0.20)
    rocket_name = launch["rocket"].lower()
    reliability = 0.85  # default
    for key, val in ROCKET_RELIABILITY.items():
        if key in rocket_name:
            reliability = val
            break
    rocket_risk = 1.0 - reliability
    rocket_detail = f"{launch['rocket']} — {reliability*100:.0f}% historical success rate"
    factors.append({"name": "Rocket Reliability", "risk": rocket_risk, "detail": rocket_detail})
    total_risk += rocket_risk * 0.20

    # Factor 5: Spaceport Historical Risk (weight: 0.15)
    sp_name = sp["name"].lower()
    sp_risk = 0.20  # default
    for key, val in SPACEPORT_WEATHER_RISK.items():
        if key in sp_name:
            sp_risk = val
            break
    sp_detail = f"{sp['name']} — {sp_risk*100:.0f}% historical weather delay rate"
    factors.append({"name": "Spaceport Weather History", "risk": sp_risk, "detail": sp_detail})
    total_risk += sp_risk * 0.15

    # 4. Calculate final probability
    delay_probability = round(min(total_risk * 100, 99.0), 1)

    # 5. Risk level
    if delay_probability > 70:
        risk_level = "Critical"
        recommendation = "High probability of delay. Consider contingency planning and backup launch windows."
    elif delay_probability > 45:
        risk_level = "High"
        recommendation = "Significant delay risk. Monitor weather updates closely in the 24 hours before launch."
    elif delay_probability > 25:
        risk_level = "Medium"
        recommendation = "Moderate risk. Conditions are marginally acceptable. Watch for weather changes."
    else:
        risk_level = "Low"
        recommendation = "Conditions look favorable. Low probability of weather-related delay."

    return {
        "launch_id": launch["id"],
        "launch_name": launch["name"],
        "rocket": launch["rocket"],
        "spaceport": sp["name"],
        "net_date": launch["net_date"],
        "delay_probability": delay_probability,
        "risk_level": risk_level,
        "factors": factors,
        "weather": weather,
        "recommendation": recommendation,
    }
