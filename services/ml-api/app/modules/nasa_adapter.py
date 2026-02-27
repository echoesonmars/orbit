"""
NASA Data Adapter
Provides two data sources for enriching satellite capture value predictions:
  - EONET: Real-time natural events (wildfires, storms, floods) → Crisis Zone detection
  - DONKI: Space weather (geomagnetic storms, solar flares) → Reliability impact
"""

import os
import math
import datetime
import requests
from typing import Optional

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
EONET_URL    = "https://eonet.gsfc.nasa.gov/api/v3/events"
DONKI_BASE   = "https://api.nasa.gov/DONKI"

# ─── EONET: Natural Events ────────────────────────────────────────────────────

# EONET category IDs that qualify as "crisis" (high demand for imagery)
CRISIS_CATEGORY_IDS = {
    "wildfires",
    "severeStorms",
    "floods",
    "earthquakes",
    "volcanoes",
    "landslides",
    "dustHaze",
}

def check_crisis_zone(bbox: list[float], lookback_days: int = 14) -> dict:
    """
    Query NASA EONET for active natural events that intersect the given bbox.
    Returns:
      - is_crisis: bool — True if a crisis event is detected within the bbox
      - events: list of event names found
      - source: "NASA EONET"
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    result = {"is_crisis": False, "events": [], "source": "NASA EONET"}
    
    try:
        end = datetime.datetime.utcnow()
        start = end - datetime.timedelta(days=lookback_days)
        
        params = {
            "status": "open",
            "start": start.strftime("%Y-%m-%d"),
            "end": end.strftime("%Y-%m-%d"),
            "limit": 100,
        }
        resp = requests.get(EONET_URL, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        
        for event in data.get("events", []):
            # Check if category is crisis-relevant
            categories = {c["id"] for c in event.get("categories", [])}
            if not categories & CRISIS_CATEGORY_IDS:
                continue
            
            # Check if any geometry point falls within our bbox
            for geometry in event.get("geometry", []):
                coords = geometry.get("coordinates", [])
                if not coords:
                    continue
                
                # Point events: [lon, lat]
                if geometry.get("type") == "Point":
                    lon, lat = coords[0], coords[1]
                    if (min_lon <= lon <= max_lon) and (min_lat <= lat <= max_lat):
                        result["is_crisis"] = True
                        result["events"].append(event.get("title", "Unknown Event"))
                        break
                # Polygon/track events: [[lon, lat], ...]
                elif geometry.get("type") == "Polygon" and coords:
                    for point in coords[0]:
                        if len(point) >= 2:
                            lon, lat = point[0], point[1]
                            if (min_lon <= lon <= max_lon) and (min_lat <= lat <= max_lat):
                                result["is_crisis"] = True
                                result["events"].append(event.get("title", "Unknown Event"))
                                break
        
        result["events"] = list(set(result["events"]))  # deduplicate
        
    except Exception as e:
        print(f"[NASA EONET] Warning: {e}")
    
    return result


# ─── DONKI: Space Weather ─────────────────────────────────────────────────────

# Geomagnetic storm Kp-index thresholds
GST_SEVERITY = {
    "G1": 0.05,  # Minor — small confidence penalty
    "G2": 0.10,
    "G3": 0.20,
    "G4": 0.30,
    "G5": 0.45,  # Extreme — major satellite disruption risk
}

def get_space_weather(lookback_days: int = 7) -> dict:
    """
    Query NASA DONKI for recent geomagnetic storms and solar flares.
    Returns:
      - confidence_penalty: float (0.0 – 0.45) — reduce confidence by this much
      - storm_level: str — e.g. "G3" or "None"
      - solar_flares: int — number of M/X class flares in the period
      - source: "NASA DONKI"
    """
    result = {
        "confidence_penalty": 0.0,
        "storm_level": "None",
        "solar_flares": 0,
        "source": "NASA DONKI",
    }
    
    try:
        end = datetime.datetime.utcnow()
        start = end - datetime.timedelta(days=lookback_days)
        
        date_params = {
            "startDate": start.strftime("%Y-%m-%d"),
            "endDate":   end.strftime("%Y-%m-%d"),
            "api_key":   NASA_API_KEY,
        }
        
        # Geomagnetic storms
        gst_resp = requests.get(f"{DONKI_BASE}/GST", params=date_params, timeout=8)
        if gst_resp.status_code == 200:
            storms = gst_resp.json() or []
            max_penalty = 0.0
            max_kp = "None"
            for storm in storms:
                for kp_data in storm.get("allKpIndex", []):
                    kp_str = f"G{int(kp_data.get('kpIndex', 0) // 5)}"
                    penalty = GST_SEVERITY.get(kp_str, 0.0)
                    if penalty > max_penalty:
                        max_penalty = penalty
                        max_kp = kp_str
            result["confidence_penalty"] = max_penalty
            result["storm_level"] = max_kp
        
        # Solar flares (count M and X class)
        flr_resp = requests.get(f"{DONKI_BASE}/FLR", params=date_params, timeout=8)
        if flr_resp.status_code == 200:
            flares = flr_resp.json() or []
            mx_flares = [f for f in flares if f.get("classType", "").startswith(("M", "X"))]
            result["solar_flares"] = len(mx_flares)
            if mx_flares and result["confidence_penalty"] < 0.10:
                result["confidence_penalty"] = max(result["confidence_penalty"], 0.05)
        
    except Exception as e:
        print(f"[NASA DONKI] Warning: {e}")
    
    return result
