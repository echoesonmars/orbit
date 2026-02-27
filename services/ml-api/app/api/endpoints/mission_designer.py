from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.modules.mission_designer import generate_mission_spec

router = APIRouter()

class MissionRequest(BaseModel):
    prompt: str

@router.post("/mission-designer/generate")
async def generate_mission(request: MissionRequest):
    try:
        spec = generate_mission_spec(request.prompt)
        return spec
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error generating mission spec")
