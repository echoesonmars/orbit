from fastapi import APIRouter
from app.api.endpoints import predict, data_hub, mission_designer, reports

router = APIRouter()
router.include_router(predict.router, prefix="/api/v1", tags=["Predictions"])
router.include_router(data_hub.router, prefix="/api/v1", tags=["Data Hub"])
router.include_router(mission_designer.router, prefix="/api/v1", tags=["Mission Designer"])
router.include_router(reports.router, prefix="/api/v1", tags=["Reports"])
