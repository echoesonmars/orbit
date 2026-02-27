from typing import List, Optional, Any
from pydantic import BaseModel


# ─── Upcoming Launches ────────────────────────────────────────────────────────

class SpaceportInfo(BaseModel):
    name: str
    country: str
    latitude: float
    longitude: float


class LaunchInfo(BaseModel):
    id: str
    name: str
    rocket: str
    mission: Optional[str] = None
    spaceport: SpaceportInfo
    net_date: str                  # No Earlier Than (ISO date)
    status: str                    # "Go" | "TBD" | "TBC" | "Hold"
    image_url: Optional[str] = None
    webcast_url: Optional[str] = None


class UpcomingLaunchesResponse(BaseModel):
    count: int
    launches: List[LaunchInfo]


# ─── Delay Prediction ─────────────────────────────────────────────────────────

class PredictDelayRequest(BaseModel):
    launch_id: str


class WeatherAtSpaceport(BaseModel):
    wind_speed_kmh: float
    wind_gusts_kmh: float
    cloud_cover_pct: float
    precipitation_prob_pct: float
    temperature_c: float
    description: str


class DelayFactor(BaseModel):
    name: str
    risk: float              # 0.0 - 1.0
    detail: str


class PredictDelayResponse(BaseModel):
    launch_id: str
    launch_name: str
    rocket: str
    spaceport: str
    net_date: str
    delay_probability: float        # 0-100
    risk_level: str                 # "Low" | "Medium" | "High" | "Critical"
    factors: List[DelayFactor]
    weather: WeatherAtSpaceport
    recommendation: str
