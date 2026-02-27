from fastapi import APIRouter
from app.api.endpoints import predict, data_hub

router = APIRouter()
router.include_router(predict.router, prefix="/api/v1", tags=["Predictions"])
router.include_router(data_hub.router, prefix="/api/v1", tags=["Data Hub"])
