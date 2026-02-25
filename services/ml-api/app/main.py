from fastapi import FastAPI
from app.api.endpoints import predict

app = FastAPI(
    title="OrbitAI ML-API",
    description="Machine Learning Core API for Space Missions",
    version="1.0.0"
)

# Connect endpoints
app.include_router(predict.router, prefix="/api/v1", tags=["Predictions"])

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "ml-api"}
