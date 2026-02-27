"""
Module 8: Failure Forensics — Anomaly detection on satellite telemetry CSV.
Uses Isolation Forest (unsupervised ML) to find anomalies without labeled data.
"""
import io
import json
import math
import os
import traceback
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# OpenAI for insight generation
try:
    from openai import OpenAI as _OpenAI
    _openai_client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
    _openai_available = bool(os.getenv("OPENAI_API_KEY"))
except Exception:
    _openai_client = None
    _openai_available = False


# ─── Helpers ──────────────────────────────────────────────────────────────────

SUPPORTED_SENSOR_KEYWORDS = [
    "temp", "temperature", "voltage", "volt", "current", "amp",
    "rpm", "pressure", "power", "signal", "rate", "flux", "level",
    "battery", "solar", "reaction", "wheel", "gyro", "acc",
]


def _identify_sensor_columns(df: pd.DataFrame) -> list[str]:
    """Auto-detect numeric sensor columns (exclude timestamp/id columns)."""
    exclude = {"timestamp", "time", "date", "id", "index", "label", "class"}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    sensor_cols = [
        c for c in numeric_cols
        if c.lower() not in exclude
        and not any(ex in c.lower() for ex in ["id", "index"])
    ]
    return sensor_cols[:20]  # Limit to 20 sensors max


def _preprocess_csv(raw_bytes: bytes) -> tuple[pd.DataFrame, str | None]:
    """
    Load and clean telemetry CSV.
    - Detect timestamp column
    - Interpolate NaN values (sensor dropouts from comm interference)
    - Return cleaned DataFrame and timestamp column name
    """
    try:
        df = pd.read_csv(io.BytesIO(raw_bytes))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV: {e}")

    if df.empty:
        raise ValueError("CSV file is empty")

    if len(df) < 10:
        raise ValueError("CSV must have at least 10 rows")

    # Detect timestamp column
    ts_col = None
    for col in df.columns:
        if col.lower() in {"timestamp", "time", "date", "datetime", "ts"}:
            ts_col = col
            break

    # Interpolate numeric NaN values (sensor packet loss)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].interpolate(method="linear", limit_direction="both")
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

    return df, ts_col


def _run_isolation_forest(df: pd.DataFrame, sensor_cols: list[str],
                           contamination: float = 0.03) -> tuple[np.ndarray, np.ndarray]:
    """
    Run Isolation Forest on sensor data.
    Returns (anomaly_mask, anomaly_scores).
    contamination=0.03 means "expect ~3% anomalies".
    """
    X = df[sensor_cols].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=100,
        contamination=contamination,
        random_state=42,
        n_jobs=-1,
    )
    preds = model.fit_predict(X_scaled)      # -1 = anomaly, 1 = normal
    scores = model.score_samples(X_scaled)   # more negative = more anomalous

    anomaly_mask = preds == -1
    return anomaly_mask, scores


def _classify_severity(score: float, min_score: float, max_score: float) -> str:
    """Classify anomaly as Warning / Critical / Fatal based on isolation score."""
    if max_score == min_score:
        return "Warning"
    normalized = (score - min_score) / (max_score - min_score)
    if normalized < 0.2:
        return "Fatal"
    elif normalized < 0.45:
        return "Critical"
    else:
        return "Warning"


def _generate_openai_insight(anomaly_sensors: dict, severity: str, timestamp: str) -> str:
    """Use OpenAI to generate a human-readable explanation of the anomaly."""
    if not _openai_available or not _openai_client:
        # Fallback deterministic insight
        sensors_str = ", ".join(f"{k}={v:.2f}" for k, v in list(anomaly_sensors.items())[:3])
        return (
            f"[{severity}] Anomaly detected at {timestamp}. "
            f"Sensor readings deviated significantly: {sensors_str}. "
            f"Recommend manual inspection of affected subsystems."
        )

    sensors_str = json.dumps(anomaly_sensors, indent=2)
    try:
        response = _openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": (
                    "You are a spacecraft telemetry analyst. "
                    "Given anomalous sensor readings, provide a concise 1-2 sentence technical explanation "
                    "of the likely failure cause and recommended action. Be specific and technical."
                )},
                {"role": "user", "content": (
                    f"Timestamp: {timestamp}\n"
                    f"Severity: {severity}\n"
                    f"Anomalous sensor readings:\n{sensors_str}\n"
                    f"What is likely failing and what should engineers investigate?"
                )},
            ],
            max_tokens=120,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return (
            f"[{severity}] Anomaly at {timestamp}: "
            f"Sensor deviations detected. Manual subsystem review recommended."
        )


# ─── Main Analysis Function ───────────────────────────────────────────────────

def analyze_telemetry(
    raw_bytes: bytes,
    contamination: float = 0.03,
    max_anomalies: int = 50,
) -> dict:
    """
    Full pipeline: load CSV → preprocess → IsolationForest → format results.
    Returns structured JSON with anomalies, chart data, and insight texts.
    """
    # ── Step 1: Preprocess ────────────────────────────────────────────────
    df, ts_col = _preprocess_csv(raw_bytes)
    sensor_cols = _identify_sensor_columns(df)

    if not sensor_cols:
        raise ValueError("No numeric sensor columns found in CSV")

    n_rows = len(df)

    # ── Step 2: Run Isolation Forest ──────────────────────────────────────
    anomaly_mask, scores = _run_isolation_forest(df, sensor_cols, contamination)

    anomaly_indices = np.where(anomaly_mask)[0].tolist()
    anomaly_scores = scores[anomaly_mask]

    # Score range for severity classification
    min_score = float(scores.min())
    max_score = float(scores.max())

    # ── Step 3: Build anomaly records (top N by most anomalous) ──────────
    if len(anomaly_indices) > max_anomalies:
        # Sort by score ascending (most anomalous first)
        sorted_idx = sorted(
            zip(anomaly_indices, [float(scores[i]) for i in anomaly_indices]),
            key=lambda x: x[1]
        )[:max_anomalies]
        anomaly_indices = [x[0] for x in sorted_idx]

    anomalies = []
    for idx in anomaly_indices:
        row = df.iloc[idx]
        sensor_vals = {col: round(float(row[col]), 4) for col in sensor_cols}
        severity = _classify_severity(float(scores[idx]), min_score, max_score)
        timestamp = str(row[ts_col]) if ts_col else f"Row {idx}"

        insight = _generate_openai_insight(sensor_vals, severity, timestamp)

        anomalies.append({
            "index": int(idx),
            "timestamp": timestamp,
            "severity": severity,
            "anomaly_score": round(float(scores[idx]), 4),
            "sensor_values": sensor_vals,
            "insight": insight,
        })

    # Sort by severity then index
    severity_order = {"Fatal": 0, "Critical": 1, "Warning": 2}
    anomalies.sort(key=lambda a: (severity_order.get(a["severity"], 9), a["index"]))

    # ── Step 4: Build chart data (downsample to 500 points max) ──────────
    step = max(1, n_rows // 500)
    chart_indices = list(range(0, n_rows, step))

    # Anomaly index set for fast lookup
    anomaly_set = set(anomaly_indices)

    # Build chart series for first 5 sensors
    chart_sensors = sensor_cols[:5]
    chart_series = {}
    for col in chart_sensors:
        values = []
        for i in chart_indices:
            values.append({
                "x": str(df.iloc[i][ts_col]) if ts_col else i,
                "y": round(float(df.iloc[i][col]), 4),
                "anomaly": any(
                    ai in anomaly_set
                    for ai in range(max(0, i - step // 2), min(n_rows, i + step // 2 + 1))
                ),
            })
        chart_series[col] = values

    # ── Step 5: Summary stats ─────────────────────────────────────────────
    total_anomalies = int(anomaly_mask.sum())
    fatal_count = sum(1 for a in anomalies if a["severity"] == "Fatal")
    critical_count = sum(1 for a in anomalies if a["severity"] == "Critical")
    warning_count = sum(1 for a in anomalies if a["severity"] == "Warning")

    return {
        "total_rows": n_rows,
        "total_anomalies": total_anomalies,
        "anomaly_rate_pct": round(total_anomalies / n_rows * 100, 2),
        "sensor_columns": sensor_cols,
        "chart_sensors": chart_sensors,
        "summary": {
            "fatal": fatal_count,
            "critical": critical_count,
            "warning": warning_count,
        },
        "anomalies": anomalies[:max_anomalies],
        "chart_series": chart_series,
        "contamination_used": contamination,
    }
