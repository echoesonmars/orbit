from typing import List
from pydantic import BaseModel, conlist

class PredictValueRequest(BaseModel):
    bbox: conlist(float, min_length=4, max_length=4)
    target: str

class PredictValueResponseFactor(BaseModel):
    name: str
    impact: float

class PredictValueResponse(BaseModel):
    value_score: float
    factors: List[PredictValueResponseFactor]
    bbox: List[float]
