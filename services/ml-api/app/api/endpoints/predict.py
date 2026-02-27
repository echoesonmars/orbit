from fastapi import APIRouter, HTTPException
from app.schemas.predict import PredictValueRequest, PredictValueResponse
from app.modules.value_predictor import predict_value
import os

router = APIRouter()

@router.post("/predict/value", response_model=PredictValueResponse)
async def predict_value_endpoint(request: PredictValueRequest):
    try:
        result = predict_value(
            bbox=list(request.bbox),
            target=request.target,
            cloud_cover=request.cloud_cover,
            gsd_meters=request.gsd_meters,
            crisis=request.crisis,
            captured_date=request.captured_date,
        )

        # Fire-and-forget: save to predictions_history in Supabase
        _save_prediction(result, request)

        return result
    except Exception as e:
        import traceback
        print(f"[ML-API] Error in predict_value_endpoint: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Engine Error: {str(e)}")


def _save_prediction(result: dict, request: PredictValueRequest):
    """Save prediction to DB (best-effort, won't crash the endpoint)."""
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            return
        from supabase import create_client
        sb = create_client(supabase_url, supabase_key)
        import json
        sb.table("predictions_history").insert({
            "bbox": json.dumps(list(request.bbox)),
            "value_usd": result["value_usd"],
            "confidence": result["confidence"],
            "factors": json.dumps(result["factors"]),
        }).execute()
    except Exception as e:
        print(f"[ValuePredictor] Warning: failed to save prediction: {e}")
