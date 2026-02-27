from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from app.modules.mission_designer import generate_mission_spec

router = APIRouter()

class MissionRequest(BaseModel):
    messages: List[Dict[str, Any]]

@router.post("/mission-designer/generate")
async def generate_mission(request: MissionRequest):
    try:
        generator = generate_mission_spec(request.messages)
        return StreamingResponse(generator, media_type="text/event-stream")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error generating mission spec")
