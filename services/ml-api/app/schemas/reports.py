from typing import List, Optional, Any
from pydantic import BaseModel


class ReportFactor(BaseModel):
    name: str
    impact: float
    type: str  # "positive" | "negative" | "crisis"


class GenerateReportRequest(BaseModel):
    bbox: List[float]                    # [minLon, minLat, maxLon, maxLat]
    target: str = "default"
    value_usd: float
    confidence: float
    area_km2: float
    factors: List[ReportFactor]
    cloud_cover_used: float = 20.0
    weather_source: str = "Manual Input"
    nasa: Optional[Any] = None           # NASA intelligence data
    mission_id: Optional[str] = None
    user_id: Optional[str] = None


class GenerateReportResponse(BaseModel):
    task_id: str
    status: str     # "processing"
    message: str


class ReportStatusResponse(BaseModel):
    task_id: str
    status: str     # "processing" | "completed" | "failed"
    file_url: Optional[str] = None
    created_at: Optional[str] = None
