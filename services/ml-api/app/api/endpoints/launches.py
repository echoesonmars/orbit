"""
Module 5: Launch Delay Predictor Endpoints
GET  /api/v1/launches/upcoming      - list upcoming launches
POST /api/v1/launches/predict-delay  - predict delay probability for a launch
"""
from fastapi import APIRouter, HTTPException

from app.schemas.launches import (
    UpcomingLaunchesResponse, LaunchInfo, SpaceportInfo,
    PredictDelayRequest, PredictDelayResponse,
    WeatherAtSpaceport, DelayFactor,
)
from app.modules.delay_predictor import get_upcoming_launches, predict_delay

router = APIRouter()


@router.get("/launches/upcoming", response_model=UpcomingLaunchesResponse)
async def upcoming_launches():
    """Return list of upcoming rocket launches from Launch Library 2."""
    try:
        launches_raw = get_upcoming_launches(limit=15)

        launches = []
        for l in launches_raw:
            sp = l.get("spaceport", {})
            launches.append(LaunchInfo(
                id=l["id"],
                name=l["name"],
                rocket=l["rocket"],
                mission=l.get("mission"),
                spaceport=SpaceportInfo(
                    name=sp.get("name", "Unknown"),
                    country=sp.get("country", "??"),
                    latitude=sp.get("latitude", 0),
                    longitude=sp.get("longitude", 0),
                ),
                net_date=l["net_date"],
                status=l["status"],
                image_url=l.get("image_url"),
                webcast_url=l.get("webcast_url"),
            ))

        return UpcomingLaunchesResponse(count=len(launches), launches=launches)

    except Exception as e:
        print(f"[Launches] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/launches/predict-delay", response_model=PredictDelayResponse)
async def predict_launch_delay(request: PredictDelayRequest):
    """Predict delay probability for a specific upcoming launch."""
    try:
        result = predict_delay(request.launch_id)

        return PredictDelayResponse(
            launch_id=result["launch_id"],
            launch_name=result["launch_name"],
            rocket=result["rocket"],
            spaceport=result["spaceport"],
            net_date=result["net_date"],
            delay_probability=result["delay_probability"],
            risk_level=result["risk_level"],
            factors=[DelayFactor(**f) for f in result["factors"]],
            weather=WeatherAtSpaceport(**result["weather"]),
            recommendation=result["recommendation"],
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[Launches] Predict error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
