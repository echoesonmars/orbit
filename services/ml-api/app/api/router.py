from fastapi import APIRouter
from app.api.endpoints import predict, data_hub, mission_designer, reports, launches, orbits, scores

router = APIRouter()
router.include_router(predict.router, prefix="/api/v1", tags=["Predictions"])
router.include_router(data_hub.router, prefix="/api/v1", tags=["Data Hub"])
router.include_router(mission_designer.router, prefix="/api/v1", tags=["Mission Designer"])
router.include_router(reports.router, prefix="/api/v1", tags=["Reports"])
router.include_router(launches.router, prefix="/api/v1", tags=["Launches"])
router.include_router(orbits.router, prefix="/api/v1", tags=["Orbits"])
router.include_router(scores.router, prefix="/api/v1", tags=["Scores"])
