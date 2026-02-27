"""
Module 4: Report Generator Endpoint
POST /api/v1/reports/generate - starts background PDF generation
GET  /api/v1/reports/{task_id}/status - polls completion status
"""
import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.schemas.reports import GenerateReportRequest, GenerateReportResponse, ReportStatusResponse
from app.modules.report_generator import (
    generate_pdf, upload_pdf_to_storage,
    create_report_record, update_report_status, get_report_record
)

router = APIRouter()


@router.post("/reports/generate", response_model=GenerateReportResponse)
async def generate_report(request: GenerateReportRequest, background_tasks: BackgroundTasks):
    """
    Kick off PDF report generation as a background task.
    Returns immediately with task_id — client should poll /reports/{id}/status.
    """
    report_id = str(uuid.uuid4())

    # Flatten request to dict for the report engine
    data = {
        "bbox": list(request.bbox),
        "target": request.target,
        "value_usd": request.value_usd,
        "confidence": request.confidence,
        "area_km2": request.area_km2,
        "factors": [f.model_dump() for f in request.factors],
        "cloud_cover_used": request.cloud_cover_used,
        "weather_source": request.weather_source,
        "nasa": request.nasa,
    }

    # Insert DB record (status: processing)
    create_report_record(report_id, request.user_id, request.mission_id, data)

    # Schedule background PDF generation
    background_tasks.add_task(_run_report_generation, report_id, data)

    return GenerateReportResponse(
        task_id=report_id,
        status="processing",
        message="Report generation started. Poll /reports/{id}/status for updates."
    )


@router.get("/reports/{task_id}/status", response_model=ReportStatusResponse)
async def get_report_status(task_id: str):
    """Poll for report completion status."""
    record = get_report_record(task_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Report {task_id} not found")

    return ReportStatusResponse(
        task_id=task_id,
        status=record.get("status", "unknown"),
        file_url=record.get("file_url"),
        created_at=str(record.get("created_at", "")),
    )


# ─── Background Worker ────────────────────────────────────────────────────────

def _run_report_generation(report_id: str, data: dict):
    """Runs in background: generate PDF → upload → update DB."""
    try:
        print(f"[ReportGenerator] Starting generation for {report_id}")

        # 1. Generate PDF bytes
        pdf_bytes = generate_pdf(report_id, data)

        # 2. Upload to Supabase Storage
        file_url = upload_pdf_to_storage(pdf_bytes, report_id)

        if file_url:
            update_report_status(report_id, "completed", file_url)
            print(f"[ReportGenerator] ✓ Completed {report_id} → {file_url[:60]}...")
        else:
            update_report_status(report_id, "failed")
            print(f"[ReportGenerator] ✗ Storage upload failed for {report_id}")

    except Exception as e:
        import traceback
        print(f"[ReportGenerator] ✗ Generation error for {report_id}: {e}")
        print(traceback.format_exc())
        update_report_status(report_id, "failed")
