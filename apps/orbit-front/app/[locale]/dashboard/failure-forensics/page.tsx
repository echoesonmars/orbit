"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
    ChevronLeft, AlertTriangle, Upload, FileText, Loader2,
    Zap, CheckCircle2, XCircle, ChevronDown, RefreshCw, Info
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "Warning" | "Critical" | "Fatal";

type Anomaly = {
    index: number;
    timestamp: string;
    severity: Severity;
    anomaly_score: number;
    sensor_values: Record<string, number>;
    insight: string;
};

type ChartPoint = { x: string | number; y: number; anomaly: boolean };

type AnalysisResult = {
    total_rows: number;
    total_anomalies: number;
    anomaly_rate_pct: number;
    sensor_columns: string[];
    chart_sensors: string[];
    summary: { fatal: number; critical: number; warning: number };
    anomalies: Anomaly[];
    chart_series: Record<string, ChartPoint[]>;
};

// ─── Mini Time-Series Chart (Canvas) ────────────────────────────────────────

const SENSOR_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

function TimeSeriesChart({ series, label, color }: {
    series: ChartPoint[]; label: string; color: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !series.length) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width = canvas.offsetWidth * 2;
        const H = canvas.height = canvas.offsetHeight * 2;

        const w = W / 2, h = H / 2;
        const padL = 8, padR = 8, padT = 12, padB = 12;
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;

        const ys = series.map((p) => p.y);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const rangeY = maxY - minY || 1;

        const toX = (i: number) => padL + (i / (series.length - 1)) * chartW;
        const toY = (v: number) => padT + (1 - (v - minY) / rangeY) * chartH;

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 0.5;
        for (let y = 0; y <= 4; y++) {
            const gy = padT + (y / 4) * chartH;
            ctx.beginPath();
            ctx.moveTo(padL, gy);
            ctx.lineTo(w - padR, gy);
            ctx.stroke();
        }

        // Line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        series.forEach((p, i) => {
            const x = toX(i), y = toY(p.y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Anomaly dots
        series.forEach((p, i) => {
            if (!p.anomaly) return;
            const x = toX(i), y = toY(p.y);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = "#EF4444";
            ctx.fill();
            // Red vertical line
            ctx.strokeStyle = "rgba(239,68,68,0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, padT);
            ctx.lineTo(x, h - padB);
            ctx.stroke();
        });

        // Label
        ctx.fillStyle = "#64748B";
        ctx.font = "clamp(8px, 10px, 11px) monospace";
        ctx.fillText(label, padL + 2, padT + 10);
    }, [series, label, color]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-24 rounded-xl"
            style={{ imageRendering: "auto" }}
        />
    );
}

// ─── Anomaly Card ─────────────────────────────────────────────────────────────

const severityConfig: Record<Severity, { color: string; icon: typeof AlertTriangle; bg: string }> = {
    Fatal: { color: "text-red-400", bg: "border-red-500/20 bg-red-500/5", icon: XCircle },
    Critical: { color: "text-orange-400", bg: "border-orange-500/20 bg-orange-500/5", icon: AlertTriangle },
    Warning: { color: "text-yellow-400", bg: "border-yellow-500/20 bg-yellow-500/5", icon: Info },
};

function AnomalyCard({ anomaly, index }: { anomaly: Anomaly; index: number }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = severityConfig[anomaly.severity] || severityConfig.Warning;

    return (
        <div className={cn("rounded-xl border overflow-hidden", cfg.bg)}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/3 transition-colors"
            >
                <cfg.icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", cfg.color)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.color)}>
                            {anomaly.severity}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">{anomaly.timestamp}</span>
                        <span className="text-[10px] text-slate-700">score: {anomaly.anomaly_score.toFixed(3)}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed line-clamp-2">{anomaly.insight}</p>
                </div>
                <ChevronDown className={cn("h-3.5 w-3.5 text-slate-600 flex-shrink-0 transition-transform", expanded && "rotate-180")} />
            </button>

            {expanded && (
                <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-1">
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Sensor readings at anomaly:</p>
                    <div className="grid grid-cols-2 gap-1">
                        {Object.entries(anomaly.sensor_values).slice(0, 8).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[10px] px-1.5 py-0.5 rounded bg-white/3">
                                <span className="text-slate-500 truncate">{k}</span>
                                <span className="text-white font-mono ml-2">{typeof v === "number" ? v.toFixed(3) : v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (f: File) => void }) {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files[0];
                if (f?.name.endsWith(".csv")) onFile(f);
            }}
            className={cn(
                "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center gap-4 transition-all cursor-pointer",
                isDragging
                    ? "border-purple-500/60 bg-purple-500/10"
                    : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/3"
            )}
        >
            <div className={cn("p-4 rounded-2xl transition-all", isDragging ? "bg-purple-500/20" : "bg-white/5")}>
                <Upload className={cn("h-8 w-8 transition-colors", isDragging ? "text-purple-400" : "text-slate-500")} />
            </div>
            <div className="text-center">
                <p className="text-sm text-white font-medium">Drop telemetry CSV here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse · max 50 MB</p>
            </div>
            <input
                type="file" accept=".csv" className="hidden"
                id="csv-input"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
            />
            <label
                htmlFor="csv-input"
                className="px-5 py-2 rounded-xl border border-white/15 text-slate-400 text-xs hover:bg-white/5 cursor-pointer transition-colors"
            >
                Browse Files
            </label>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FailureForensicsPage() {
    const [file, setFile] = useState<File | null>(null);
    const [satelliteId, setSatelliteId] = useState("SAT-001");
    const [contamination, setContamination] = useState(0.03);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSensor, setActiveSensor] = useState<string | null>(null);
    const supabase = createClient();

    const handleAnalyze = useCallback(async () => {
        if (!file) return;
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            const formData = new FormData();
            formData.append("file", file);
            formData.append("contamination", String(contamination));
            formData.append("satellite_id", satelliteId);

            const resp = await fetch(`${gatewayUrl}/api/v1/forensics/analyze`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
                throw new Error(err.error || `Server error ${resp.status}`);
            }

            const data: AnalysisResult = await resp.json();
            setResult(data);
            if (data.chart_sensors.length > 0) {
                setActiveSensor(data.chart_sensors[0]);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [file, satelliteId, contamination, supabase]);

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0">
                <Link href="/dashboard" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <h1 className="text-white font-semibold text-sm">Failure Forensics</h1>
                </div>
                <span className="ml-auto text-[10px] text-slate-600 font-mono hidden sm:block">
                    Isolation Forest · Anomaly Detection
                </span>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Upload + Config */}
                <div className="w-80 flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 space-y-4">

                    {/* File zone */}
                    {file ? (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                            <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-white font-semibold truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-600">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => { setFile(null); setResult(null); }}
                                className="text-slate-600 hover:text-red-400 transition-colors ml-auto flex-shrink-0">
                                <XCircle className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <DropZone onFile={setFile} />
                    )}

                    {/* Config */}
                    <div className="space-y-3">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Satellite ID</p>
                            <input
                                value={satelliteId}
                                onChange={(e) => setSatelliteId(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-purple-500/50"
                                placeholder="SAT-001"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-1.5">
                                <span className="text-slate-500 uppercase tracking-wider">Sensitivity</span>
                                <span className="text-white font-mono">{(contamination * 100).toFixed(0)}% expected anomalies</span>
                            </div>
                            <input
                                type="range" min={0.01} max={0.15} step={0.01} value={contamination}
                                onChange={(e) => setContamination(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                                           [&::-webkit-slider-thumb]:bg-red-500"
                            />
                        </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={!file || isLoading}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold text-sm
                                   hover:opacity-90 disabled:opacity-40 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]
                                   flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                        ) : (
                            <><Zap className="h-4 w-4" /> Run Analysis</>
                        )}
                    </button>

                    {error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Result summary */}
                    {result && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Analysis Summary</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: "Total Rows", v: result.total_rows.toLocaleString(), color: "text-white" },
                                    { label: "Anomaly Rate", v: `${result.anomaly_rate_pct}%`, color: "text-orange-400" },
                                    { label: "Fatal", v: result.summary.fatal, color: "text-red-400" },
                                    { label: "Critical", v: result.summary.critical, color: "text-orange-400" },
                                    { label: "Warning", v: result.summary.warning, color: "text-yellow-400" },
                                    { label: "Sensors", v: result.sensor_columns.length, color: "text-cyan-400" },
                                ].map((item) => (
                                    <div key={item.label} className="px-2.5 py-2 rounded-xl border border-white/5 bg-white/2 text-center">
                                        <p className={cn("text-base font-bold font-mono", item.color)}>{item.v}</p>
                                        <p className="text-[9px] text-slate-600">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Charts + Anomaly list */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {result ? (
                        <>
                            {/* Sensor selector + Charts */}
                            <div className="border-b border-white/5 p-4 space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sensor Channel:</p>
                                    {result.chart_sensors.map((s, i) => (
                                        <button
                                            key={s}
                                            onClick={() => setActiveSensor(s)}
                                            style={{ borderColor: activeSensor === s ? SENSOR_COLORS[i] : "transparent" }}
                                            className={cn(
                                                "px-2 py-0.5 rounded-lg border text-[10px] font-mono transition-all",
                                                activeSensor === s ? "text-white bg-white/5" : "text-slate-600 hover:text-slate-400"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>

                                {activeSensor && result.chart_series[activeSensor] && (
                                    <div className="bg-white/2 rounded-2xl border border-white/5 p-3">
                                        <p className="text-[9px] text-slate-600 mb-2">
                                            {result.chart_series[activeSensor].length} data points
                                            · <span className="text-red-400">Red dots = anomalies</span>
                                        </p>
                                        <TimeSeriesChart
                                            series={result.chart_series[activeSensor]}
                                            label={activeSensor}
                                            color={SENSOR_COLORS[result.chart_sensors.indexOf(activeSensor)] || "#3B82F6"}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Anomaly list */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        Detected Anomalies ({result.anomalies.length})
                                    </p>
                                </div>
                                {result.anomalies.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                        <p className="text-sm text-emerald-400 font-semibold">No anomalies detected!</p>
                                        <p className="text-xs text-slate-600">All telemetry within normal operating range</p>
                                    </div>
                                ) : (
                                    result.anomalies.map((a, i) => (
                                        <AnomalyCard key={i} anomaly={a} index={i} />
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
                            <div className="relative">
                                <AlertTriangle className="h-20 w-20 text-red-400/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap className="h-8 w-8 text-red-400/40" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 text-sm font-medium">AI-Powered Anomaly Detection</p>
                                <p className="text-slate-600 text-xs mt-1">Upload a telemetry CSV to begin forensic analysis</p>
                            </div>
                            <div className="text-[10px] text-slate-700 space-y-1 text-center">
                                <p>• Supports any CSV with numeric sensor columns</p>
                                <p>• NaN values automatically interpolated</p>
                                <p>• IsolationForest unsupervised ML algorithm</p>
                                <p>• AI-generated insights for each anomaly</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
