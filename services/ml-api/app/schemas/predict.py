from typing import List, Optional
from pydantic import BaseModel, conlist

class PredictValueRequest(BaseModel):
    bbox: conlist(float, min_length=4, max_length=4)
    target: str = "default"
    cloud_cover: float = -1  # -1 = auto-detect via Open-Meteo
    gsd_meters: float = 10.0
    crisis: bool = False
    captured_date: Optional[str] = None

class PredictValueFactor(BaseModel):
    name: str
    impact: float
    type: str  # "positive" | "negative" | "crisis"

class NasaData(BaseModel):
    crisis_detected: bool
    crisis_events: List[str]
    storm_level: str
    solar_flares: int

class PredictValueResponse(BaseModel):
    value_usd: float
    confidence: float
    factors: List[PredictValueFactor]
    area_km2: float
    bbox: List[float]
    cloud_cover_used: float
    weather_source: str
    nasa: NasaData
