from fastapi import FastAPI
from app.api import router as api_router

app = FastAPI(
    title="OrbitAI ML-API",
    description="Machine Learning Core API for Space Missions",
    version="1.0.0"
)

# Connect endpoints
app.include_router(api_router.router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "ml-api"}
