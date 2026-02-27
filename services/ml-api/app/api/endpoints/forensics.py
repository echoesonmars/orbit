"""
Module 8: Failure Forensics Endpoint
POST /api/v1/forensics/analyze  — upload CSV, get anomaly analysis
"""
import os
import json
import traceback
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from app.modules.forensics import analyze_telemetry

try:
    from supabase import create_client as _sb_create
    _sb_url = os.getenv("SUPABASE_URL", "")
    _sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    _sb = _sb_create(_sb_url, _sb_key) if (_sb_url and _sb_key) else None
except Exception:
    _sb = None

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/forensics/analyze")
async def analyze(
    file: UploadFile = File(...),
    contamination: float = Form(0.03),
    satellite_id: str = Form("unknown"),
    user_id: str = Form(""),
):
    """
    Upload a CSV of satellite telemetry. Returns anomaly timestamps,
    insights, and chart data for time-series visualization.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    raw = await file.read()

    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit")

    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    try:
        result = analyze_telemetry(
            raw_bytes=raw,
            contamination=min(max(contamination, 0.01), 0.2),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"[Forensics] Analysis error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Analysis failed: " + str(e))

    # ── Save to Supabase (non-blocking) ───────────────────────────────────
    if _sb and user_id:
        try:
            analysis_id = str(uuid.uuid4())

            # Save satellite log summary
            _sb.table("telemetry_logs").insert({
                "satellite_id": satellite_id,
                "user_id": user_id,
                "total_rows": result["total_rows"],
                "total_anomalies": result["total_anomalies"],
                "anomaly_rate_pct": result["anomaly_rate_pct"],
                "sensor_columns": result["sensor_columns"],
                "analysis_id": analysis_id,
            }).execute()

            # Save each anomaly
            if result["anomalies"]:
                _sb.table("detected_anomalies").insert([
                    {
                        "analysis_id": analysis_id,
                        "satellite_id": satellite_id,
                        "user_id": user_id,
                        "timestamp_str": a["timestamp"],
                        "severity": a["severity"],
                        "anomaly_score": a["anomaly_score"],
                        "sensor_values": a["sensor_values"],
                        "description": a["insight"],
                    }
                    for a in result["anomalies"][:20]  # Save top 20 to DB
                ]).execute()

        except Exception as db_err:
            print(f"[Forensics] DB save failed (non-fatal): {db_err}")

    return JSONResponse(content=result)
