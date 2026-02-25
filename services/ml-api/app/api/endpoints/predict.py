from fastapi import APIRouter
from app.schemas.predict import PredictValueRequest, PredictValueResponse

router = APIRouter()

@router.post("/predict/value", response_model=PredictValueResponse)
async def predict_value(request: PredictValueRequest):
    # Mocking the AI calculation
    # In reality, this would be a LightGBM model inferencing logic
    return {
        "value_score": 85.5,
        "factors": [
            {"name": "cloud_cover", "impact": -5},
            {"name": "target_demand", "impact": 20}
        ],
        "bbox": request.bbox
    }
