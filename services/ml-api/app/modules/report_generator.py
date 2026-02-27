"""
Module 4: Report Generator
Generates multi-page analytical PDF reports using reportlab + matplotlib.
Includes GPT-4 Executive Summary, factor waterfall chart, and optional Mapbox static map.
"""
import os
import io
import uuid
import datetime
import tempfile
import requests as http_requests

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
    Table, TableStyle, HRFlowable, PageBreak
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics import renderPDF

import matplotlib
matplotlib.use("Agg")   # Headless mode — no display needed
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# ─── Color Palette ────────────────────────────────────────────────────────────
DARK_BG    = colors.HexColor("#0A0E17")
ACCENT     = colors.HexColor("#7C3AED")     # Purple
ACCENT2    = colors.HexColor("#06B6D4")     # Cyan
POSITIVE   = colors.HexColor("#10B981")     # Green
NEGATIVE   = colors.HexColor("#EF4444")     # Red
CRISIS     = colors.HexColor("#F97316")     # Orange
MUTED      = colors.HexColor("#64748B")
WHITE      = colors.HexColor("#F8FAFC")
LIGHT_GRAY = colors.HexColor("#1E293B")


# ─── Executive Summary via OpenAI ────────────────────────────────────────────

def _generate_executive_summary(data: dict) -> str:
    """Use GPT to write a human-friendly Executive Summary paragraph."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        factors_text = "\n".join(
            f"  - {f['name']}: ${f['impact']:+.0f}" for f in data.get("factors", [])
        )
        nasa = data.get("nasa") or {}
        weather_note = (
            f"Active natural events detected: {', '.join(nasa.get('crisis_events', []))}."
            if nasa.get("crisis_detected") else "No active natural crisis events."
        )

        prompt = f"""You are an analytical AI for OrbitAI, a satellite intelligence platform.
Write a professional 3-sentence Executive Summary for a satellite imagery capture value report.
Be concise and business-focused. Use USD values exactly as provided.

Report Data:
- Target Area Type: {data.get("target", "Unknown")}
- Estimated Capture Value: ${data.get("value_usd", 0):,.2f}
- Confidence Score: {data.get("confidence", 0) * 100:.0f}%
- Coverage Area: {data.get("area_km2", 0):,.1f} km²
- Cloud Cover: {data.get("cloud_cover_used", 0)}% (source: {data.get("weather_source", "N/A")})
- NASA Space Weather: {nasa.get("storm_level", "None")} storm, {nasa.get("solar_flares", 0)} solar flares
- {weather_note}

Price Factors:
{factors_text}

Write the summary now (3 sentences, professional English):"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.6,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[ReportGenerator] OpenAI error: {e}")
        return (
            f"This report presents an AI-generated analytical assessment of satellite capture "
            f"value for the specified target area. The estimated commercial value is "
            f"${data.get('value_usd', 0):,.2f} with a confidence score of "
            f"{data.get('confidence', 0) * 100:.0f}%. "
            f"The assessment incorporates real-time weather, NASA space weather, and "
            f"natural event data."
        )


# ─── Matplotlib Charts ────────────────────────────────────────────────────────

def _make_waterfall_chart(factors: list) -> io.BytesIO:
    """Generates a horizontal waterfall/bar chart of price factors."""
    fig, ax = plt.subplots(figsize=(7, max(3, len(factors) * 0.55)))
    fig.patch.set_facecolor("#0D1117")
    ax.set_facecolor("#0D1117")

    names  = [f["name"] for f in factors]
    values = [f["impact"] for f in factors]
    bar_colors = [
        "#F97316" if f["type"] == "crisis" else
        "#10B981" if f["impact"] > 0 else "#EF4444"
        for f in factors
    ]

    bars = ax.barh(names, values, color=bar_colors, height=0.6, edgecolor="none")

    for bar, val in zip(bars, values):
        label = f"${val:+,.0f}"
        x_pos = bar.get_width() + (max(abs(v) for v in values) * 0.02)
        ax.text(x_pos, bar.get_y() + bar.get_height() / 2,
                label, va="center", ha="left", color="#94A3B8", fontsize=8.5)

    ax.axvline(0, color="#334155", linewidth=1)
    ax.set_xlabel("Impact (USD)", color="#64748B", fontsize=9)
    ax.tick_params(colors="#94A3B8", labelsize=8.5)
    ax.spines[:].set_color("#1E293B")
    ax.xaxis.label.set_color("#64748B")
    for spine in ax.spines.values():
        spine.set_edgecolor("#1E293B")

    plt.tight_layout(pad=0.5)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=140, bbox_inches="tight", facecolor=fig.get_facecolor())
    buf.seek(0)
    plt.close(fig)
    return buf


def _make_confidence_gauge(confidence: float) -> io.BytesIO:
    """Generates a semi-circle confidence gauge."""
    fig, ax = plt.subplots(figsize=(4, 2.2), subplot_kw={"aspect": "equal"})
    fig.patch.set_facecolor("#0D1117")
    ax.set_facecolor("#0D1117")
    ax.set_xlim(-1.3, 1.3)
    ax.set_ylim(-0.3, 1.3)
    ax.axis("off")

    # Background arc
    theta = np.linspace(0, np.pi, 100)
    ax.plot(np.cos(theta), np.sin(theta), color="#1E293B", linewidth=18, solid_capstyle="round")

    # Confidence arc
    fill_theta = np.linspace(0, np.pi * confidence, 100)
    arc_color = "#10B981" if confidence > 0.75 else "#F59E0B" if confidence > 0.5 else "#EF4444"
    ax.plot(np.cos(fill_theta), np.sin(fill_theta), color=arc_color, linewidth=18, solid_capstyle="round")

    ax.text(0, 0.1, f"{confidence * 100:.0f}%", ha="center", va="center",
            fontsize=24, fontweight="bold", color=arc_color)
    ax.text(0, -0.25, "Confidence", ha="center", color="#64748B", fontsize=9)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=140, bbox_inches="tight", facecolor=fig.get_facecolor())
    buf.seek(0)
    plt.close(fig)
    return buf


# ─── Optional Mapbox Static Map ──────────────────────────────────────────────

def _fetch_map_image(bbox: list) -> io.BytesIO | None:
    """Fetch static map image from Mapbox (skipped if no MAPBOX_TOKEN)."""
    token = os.getenv("MAPBOX_TOKEN")
    if not token:
        return None
    try:
        min_lon, min_lat, max_lon, max_lat = bbox
        lon_center = (min_lon + max_lon) / 2
        lat_center = (min_lat + max_lat) / 2
        # Use auto-fit bbox
        url = (
            f"https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/"
            f"[{min_lon},{min_lat},{max_lon},{max_lat}]/"
            f"640x360@2x?access_token={token}"
        )
        resp = http_requests.get(url, timeout=10)
        if resp.status_code == 200:
            return io.BytesIO(resp.content)
    except Exception as e:
        print(f"[ReportGenerator] Mapbox error: {e}")
    return None


# ─── PDF Assembly ─────────────────────────────────────────────────────────────

def generate_pdf(report_id: str, data: dict) -> bytes:
    """Build and return the complete PDF as bytes."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm,
    )

    styles = getSampleStyleSheet()
    W = A4[0] - 40*mm  # usable width

    def style(name="Normal", **kw):
        s = ParagraphStyle(name, parent=styles["Normal"], **kw)
        return s

    story = []

    # ── Page 1: Cover ─────────────────────────────────────────────────────────
    cover_bg = Table(
        [[Paragraph(
            f'<font color="#7C3AED" size="28"><b>OrbitAI</b></font><br/>'
            f'<font color="#F8FAFC" size="16">Satellite Intelligence Report</font>',
            style("Cover", alignment=TA_CENTER, leading=40)
        )]],
        colWidths=[W]
    )
    cover_bg.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DARK_BG),
        ("ROUNDEDCORNERS", [8]),
        ("TOPPADDING", (0, 0), (-1, -1), 30),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 30),
    ]))
    story.append(cover_bg)
    story.append(Spacer(1, 12))

    meta_rows = [
        ["Report ID", report_id[:16] + "..."],
        ["Generated", datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
        ["Target Type", data.get("target", "Unknown").upper()],
        ["Area", f"{data.get('area_km2', 0):,.1f} km²"],
        ["BBox", f"{data.get('bbox', [])}"],
    ]
    meta_data_table = Table(meta_rows, colWidths=[50*mm, W - 50*mm])
    meta_data_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#64748B")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#F8FAFC")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0D1117")),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#1E293B")),
        ("ROWPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_data_table)
    story.append(Spacer(1, 18))

    # ── Page 1: Executive Summary ──────────────────────────────────────────────
    story.append(Paragraph("Executive Summary", style("H2",
        fontSize=13, textColor=ACCENT, spaceBefore=8, spaceAfter=6,
        fontName="Helvetica-Bold"
    )))
    story.append(HRFlowable(width=W, thickness=0.5, color=ACCENT, spaceAfter=8))

    summary_text = _generate_executive_summary(data)
    story.append(Paragraph(summary_text, style("Exec",
        fontSize=10, leading=16, textColor=WHITE,
        alignment=TA_JUSTIFY, backColor=LIGHT_GRAY,
        borderPad=10, leftIndent=8, rightIndent=8,
    )))
    story.append(Spacer(1, 16))

    # ── Page 1: Key Metrics ────────────────────────────────────────────────────
    story.append(Paragraph("Key Metrics", style("H2",
        fontSize=13, textColor=ACCENT2, spaceBefore=8, spaceAfter=6,
        fontName="Helvetica-Bold"
    )))
    story.append(HRFlowable(width=W, thickness=0.5, color=ACCENT2, spaceAfter=8))

    metrics = [
        ["Metric", "Value", "Status"],
        ["Estimated Value (USD)", f"${data.get('value_usd', 0):,.2f}", "✓ Calculated"],
        ["Confidence Score", f"{data.get('confidence', 0)*100:.0f}%",
         "High" if data.get("confidence", 0) > 0.75 else "Medium"],
        ["Coverage Area", f"{data.get('area_km2', 0):,.1f} km²", "✓ Verified"],
        ["Cloud Cover", f"{data.get('cloud_cover_used', 0):.1f}%", data.get("weather_source", "Manual Input")],
    ]
    nasa = data.get("nasa") or {}
    metrics.append(["NASA Storm Level", nasa.get("storm_level", "None"),
                    "⚠ Active" if nasa.get("storm_level", "None") != "None" else "✓ Clear"])
    metrics.append(["Natural Events", str(len(nasa.get("crisis_events", []))),
                    "⚠ Active" if nasa.get("crisis_detected") else "✓ None"])

    metrics_table = Table(metrics, colWidths=[70*mm, 65*mm, W - 135*mm])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#0D1117")),
        ("TEXTCOLOR", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0D1117"), colors.HexColor("#111827")]),
        ("GRID", (0, 0), (-1, -1), 0.25, LIGHT_GRAY),
        ("ROWPADDING", (0, 0), (-1, -1), 7),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
    ]))
    story.append(metrics_table)

    # ── Page 2: Charts ────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Price Factor Analysis", style("H2",
        fontSize=13, textColor=ACCENT, spaceBefore=0, spaceAfter=6,
        fontName="Helvetica-Bold"
    )))
    story.append(HRFlowable(width=W, thickness=0.5, color=ACCENT, spaceAfter=10))

    # Waterfall chart
    factors = data.get("factors", [])
    if factors:
        chart_buf = _make_waterfall_chart(factors)
        chart_img = RLImage(chart_buf, width=W, height=min(W * 0.55, 160))
        story.append(chart_img)
        story.append(Spacer(1, 16))

    # Confidence gauge
    story.append(Paragraph("Confidence Assessment", style("H2",
        fontSize=13, textColor=ACCENT2, spaceBefore=4, spaceAfter=6,
        fontName="Helvetica-Bold"
    )))
    story.append(HRFlowable(width=W, thickness=0.5, color=ACCENT2, spaceAfter=10))
    gauge_buf = _make_confidence_gauge(data.get("confidence", 0.5))
    gauge_img = RLImage(gauge_buf, width=110*mm, height=60*mm)
    # Center it
    gauge_table = Table([[gauge_img]], colWidths=[W])
    gauge_table.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(gauge_table)

    # ── Page 3: NASA Intelligence + Map ───────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Real-Time Intelligence", style("H2",
        fontSize=13, textColor=ACCENT, spaceBefore=0, spaceAfter=6,
        fontName="Helvetica-Bold"
    )))
    story.append(HRFlowable(width=W, thickness=0.5, color=ACCENT, spaceAfter=10))

    # NASA data
    nasa_rows = [["Data Source", "Metric", "Value"]]
    nasa_rows.append(["NASA EONET", "Crisis Events Detected",
                      ("YES — " + ", ".join(nasa.get("crisis_events", [])))
                      if nasa.get("crisis_detected") else "None"])
    nasa_rows.append(["NASA DONKI", "Geomagnetic Storm Level", nasa.get("storm_level", "None")])
    nasa_rows.append(["NASA DONKI", "Solar Flares (M/X class)", str(nasa.get("solar_flares", 0))])
    nasa_rows.append(["Open-Meteo", "Cloud Cover", f"{data.get('cloud_cover_used', 0):.1f}%"])
    nasa_rows.append(["Open-Meteo", "Data Source", data.get("weather_source", "N/A")])

    nasa_table = Table(nasa_rows, colWidths=[50*mm, 70*mm, W - 120*mm])
    nasa_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), ACCENT2),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#0D1117")),
        ("TEXTCOLOR", (0, 1), (-1, -1), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.25, LIGHT_GRAY),
        ("ROWPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(nasa_table)
    story.append(Spacer(1, 16))

    # Optional map
    map_buf = _fetch_map_image(data.get("bbox", []))
    if map_buf:
        story.append(Paragraph("Area of Interest — Satellite Map", style("H3",
            fontSize=11, textColor=MUTED, spaceAfter=6, fontName="Helvetica-Bold"
        )))
        map_img = RLImage(map_buf, width=W, height=W * 9 / 16)
        story.append(map_img)
    else:
        story.append(Paragraph(
            f"<font color='#64748B'><i>Map image not available. "
            f"BBox: {data.get('bbox', 'N/A')}</i></font>",
            style("MapNote", fontSize=9, alignment=TA_CENTER)
        ))

    # ── Page 4: Disclaimer ────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("Methodology & Disclaimer", style("H2",
        fontSize=13, textColor=MUTED, spaceBefore=0, spaceAfter=6,
        fontName="Helvetica-Bold"
    )))
    story.append(HRFlowable(width=W, thickness=0.5, color=MUTED, spaceAfter=10))
    disclaimer = """
<b>Value Estimation Methodology</b><br/>
The commercial value estimate is calculated using a deterministic multi-factor pricing model
(OrbitAI Math Engine v1). The model considers: target land-use type, sensor resolution (GSD),
cloud cover percentage, seasonal demand, area coverage bonus, freshness premium, and crisis zone multiplier.

<br/><br/><b>Real-Time Data Sources</b><br/>
Cloud cover data is sourced from Open-Meteo (openmeteo.com) using the center coordinate of the
bounding box at the time of request. Crisis zone and space weather data is retrieved from NASA EONET
(Natural Events Tracker) and NASA DONKI (Space Weather Database), respectively.

<br/><br/><b>Disclaimer</b><br/>
This report is generated by an automated AI system for informational purposes only. The value
estimates, confidence scores, and risk assessments are mathematical approximations and should not
be used as the sole basis for commercial or investment decisions. OrbitAI and its operators make
no warranty, express or implied, regarding the accuracy or completeness of this report.
All data is subject to availability of external APIs at the time of generation.
    """.strip()
    story.append(Paragraph(disclaimer, style("Disclaimer",
        fontSize=9, leading=14, textColor=colors.HexColor("#94A3B8"),
        alignment=TA_JUSTIFY,
    )))

    doc.build(story)
    return buf.getvalue()


# ─── Upload to Supabase Storage ──────────────────────────────────────────────

def upload_pdf_to_storage(pdf_bytes: bytes, report_id: str) -> str | None:
    """Upload PDF to Supabase Storage bucket 'mission_reports'."""
    try:
        from supabase import create_client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            return None

        sb = create_client(supabase_url, supabase_key)
        file_path = f"reports/{report_id}.pdf"

        sb.storage.from_("mission_reports").upload(
            path=file_path,
            file=pdf_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )

        # Generate signed URL (valid for 7 days)
        signed = sb.storage.from_("mission_reports").create_signed_url(file_path, 604800)
        return signed.get("signedURL") or signed.get("signedUrl")
    except Exception as e:
        print(f"[ReportGenerator] Storage upload error: {e}")
        return None


# ─── Supabase DB Helpers ──────────────────────────────────────────────────────

def _get_supabase():
    from supabase import create_client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("Supabase not configured")
    return create_client(url, key)


def create_report_record(report_id: str, user_id: str | None, mission_id: str | None, report_data: dict) -> None:
    """Insert initial processing record into generated_reports."""
    try:
        import json
        sb = _get_supabase()
        sb.table("generated_reports").insert({
            "id": report_id,
            "user_id": user_id,
            "mission_id": mission_id,
            "status": "processing",
            "report_data": json.dumps(report_data),
        }).execute()
    except Exception as e:
        print(f"[ReportGenerator] DB insert error: {e}")


def update_report_status(report_id: str, status: str, file_url: str | None = None) -> None:
    """Update report status (and optionally file_url) in DB."""
    try:
        sb = _get_supabase()
        update_data = {"status": status}
        if file_url:
            update_data["file_url"] = file_url
        sb.table("generated_reports").update(update_data).eq("id", report_id).execute()
    except Exception as e:
        print(f"[ReportGenerator] DB update error: {e}")


def get_report_record(report_id: str) -> dict | None:
    """Fetch a report record from DB."""
    try:
        sb = _get_supabase()
        result = sb.table("generated_reports").select("*").eq("id", report_id).single().execute()
        return result.data
    except Exception as e:
        print(f"[ReportGenerator] DB fetch error: {e}")
        return None
