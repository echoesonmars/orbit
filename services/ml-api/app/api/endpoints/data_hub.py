from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.modules.data_hub import search_scenes

router = APIRouter()

class BBox(BaseModel):
    southWest: dict
    northEast: dict

class SearchRequest(BaseModel):
    bbox: BBox
    filters: dict | None = None

@router.post("/data-hub/search")
async def search_data_hub(request: SearchRequest):
    try:
        # Extract bbox into [min_lon, min_lat, max_lon, max_lat] format
        raw_bbox = [
            request.bbox.southWest["lng"],
            request.bbox.southWest["lat"],
            request.bbox.northEast["lng"],
            request.bbox.northEast["lat"]
        ]
        
        # We cap the search to a max cloud cover if not provided
        max_cloud_cover = 100
        if request.filters and "cloudCover" in request.filters:
            max_cloud_cover = request.filters["cloudCover"]
            
        scenes = search_scenes(bbox=raw_bbox, max_cloud_cover=max_cloud_cover)
        return scenes
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
