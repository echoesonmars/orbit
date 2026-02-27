"""
Weather Adapter (Open-Meteo)
Provides real-time cloud cover data without requiring an API key.
"""

import requests
from typing import Optional

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def get_actual_cloud_cover(bbox: list[float]) -> Optional[float]:
    """
    Fetch current cloud cover percentage for the center of the bbox.
    Uses Open-Meteo (Open-source, no API key required).
    """
    try:
        # Calculate center point of bbox [min_lon, min_lat, max_lon, max_lat]
        lat = (bbox[1] + bbox[3]) / 2
        lon = (bbox[0] + bbox[2]) / 2

        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "cloud_cover",
            "timezone": "auto",
        }
        
        resp = requests.get(OPEN_METEO_URL, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        
        return data.get("current", {}).get("cloud_cover")
    except Exception as e:
        print(f"[WeatherAdapter] Warning: Failed to fetch cloud cover: {e}")
        return None
