"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ChevronLeft, DollarSign, Loader2, AlertCircle,
    TrendingUp, MapPin, Cloud, Satellite, Zap, Globe, Flame, Sun, Radio, FileText
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveRun, loadRuns, type ModuleRunRow } from "@/lib/dashboard/useModuleHistory";
import { cn } from "@/lib/utils";
import { ReportModal } from "./ReportModal";

// ─── Types ───────────────────────────────────────────────────────────────────

type Factor = {
    name: string;
    impact: number;
    type: "positive" | "negative" | "crisis";
};

type PredictionResult = {
    value_usd: number;
    confidence: number;
    factors: Factor[];
    area_km2: number;
    cloud_cover_used: number;
    weather_source: string;
    nasa: {
        crisis_detected: boolean;
        crisis_events: string[];
        storm_level: string;
        solar_flares: number;
    };
};

// ─── Land Use Options ────────────────────────────────────────────────────────

const TARGETS = [
    { value: "city", label: "City / Urban", icon: Globe, color: "text-blue-400" },
    { value: "port", label: "Port / Logistics", icon: TrendingUp, color: "text-cyan-400" },
    { value: "agriculture", label: "Agriculture", icon: Zap, color: "text-green-400" },
    { value: "military", label: "Restricted Zone", icon: MapPin, color: "text-red-400" },
    { value: "forest", label: "Forest", icon: Globe, color: "text-emerald-400" },
    { value: "ocean", label: "Ocean", icon: Globe, color: "text-indigo-400" },
    { value: "default", label: "Other", icon: Globe, color: "text-slate-400" },
];

const SENSORS = [
    { value: 10, label: "Sentinel-2 (10m)" },
    { value: 5, label: "Medium Res (5m)" },
    { value: 1, label: "High-Res (1m)" },
    { value: 0.5, label: "Sub-50cm" },
];

// ─── Factor Bar ──────────────────────────────────────────────────────────────

function FactorBar({ factor, maxAbsImpact }: { factor: Factor; maxAbsImpact: number }) {
    const pct = Math.round((Math.abs(factor.impact) / maxAbsImpact) * 100);
    const isNeg = factor.impact < 0;
    const colorClass = factor.type === "crisis"
        ? "bg-orange-500/80"
        : isNeg ? "bg-red-500/60" : "bg-purple-500/70";

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-slate-400 truncate max-w-[180px]">{factor.name}</span>
                <span className={cn("font-mono font-semibold", isNeg ? "text-red-400" : "text-emerald-400")}>
                    {isNeg ? "−" : "+"}${Math.abs(factor.impact).toFixed(0)}
                </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-700", colorClass)}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ─── Inner Page ──────────────────────────────────────────────────────────────

function ValuePredictorInner() {
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Inputs
    const [target, setTarget] = useState("city");
    const [cloudCover, setCloudCover] = useState(20);
    const [isAutoCloud, setIsAutoCloud] = useState(true);
    const [gsd, setGsd] = useState(10);
    const [crisis, setCrisis] = useState(false);

    // BBox from URL params (from map)
    const swLat = searchParams.get("swLat");
    const swLng = searchParams.get("swLng");
    const neLat = searchParams.get("neLat");
    const neLng = searchParams.get("neLng");
    const hasBbox = !!(swLat && swLng && neLat && neLng);
    const bboxArr = hasBbox
        ? [Number(swLng), Number(swLat), Number(neLng), Number(neLat)]
        : null;

    // Result state
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [historyRuns, setHistoryRuns] = useState<ModuleRunRow[]>([]);

    useEffect(() => {
        loadRuns("value-predictor").then(({ data }) => setHistoryRuns(data));
    }, []);

    const handlePredict = async () => {
        if (!bboxArr) return;
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            const response = await fetch(`${gatewayUrl}/api/v1/predict/value`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    bbox: bboxArr,
                    target,
                    cloud_cover: isAutoCloud ? -1 : cloudCover,
                    gsd_meters: gsd,
                    crisis,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Server error ${response.status}`);
            }

            const data = await response.json();
            setResult(data);

            // Persist mission + prediction for dashboard stats and reopen
            const { data: { user } } = await supabase.auth.getUser();
            if (user && hasBbox && swLat != null && swLng != null && neLat != null && neLng != null) {
                try {
                    const { data: missionId, error: rpcError } = await supabase.rpc("create_mission_from_bbox", {
                        p_sw_lat: Number(swLat),
                        p_sw_lng: Number(swLng),
                        p_ne_lat: Number(neLat),
                        p_ne_lng: Number(neLng),
                        p_user_id: user.id,
                        p_title: `Value prediction SW(${Number(swLat).toFixed(2)}°, ${Number(swLng).toFixed(2)}°) NE(${Number(neLat).toFixed(2)}°, ${Number(neLng).toFixed(2)}°)`,
                        p_target_type: target,
                    });
                    if (!rpcError && missionId) {
                        const valueScore = Math.round((data.confidence ?? 0.5) * 100);
                        await supabase.from("predictions").insert({
                            mission_id: missionId,
                            value_score: valueScore,
                            factors: data.factors ?? [],
                        });
                        const title = `Value $${(data.value_usd ?? 0).toLocaleString()} · ${(data.confidence ?? 0) * 100}%`;
                        await saveRun("value-predictor", title, { ...data, bbox: bboxArr });
                        loadRuns("value-predictor").then(({ data: runs }) => setHistoryRuns(runs));
                    }
                } catch (_) {
                    // Non-blocking: result already shown; stats may not update until next run
                }
            }
        } catch (err: any) {
            setError(err.message || "Unexpected error");
        } finally {
            setIsLoading(false);
        }
    };

    const maxAbsImpact = result
        ? Math.max(...result.factors.map(f => Math.abs(f.impact)), 1)
        : 1;

    const content = (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex overflow-hidden">
            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar */}
                <header className="flex items-center gap-4 px-6 py-4 border-b border-white/5 flex-shrink-0">
                    <Link href="/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-purple-400" />
                        <h1 className="text-white font-semibold text-base">Value Predictor</h1>
                    </div>
                    <span className="text-xs text-slate-600 bg-white/3 px-2.5 py-1 rounded-lg uppercase tracking-wider ml-auto border border-white/5">
                        Math Engine v1
                    </span>
                </header>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col lg:flex-row gap-5">
                    {/* ─── Left Panel: Inputs ─── */}
                    <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
                        {/* BBox status */}
                        <div className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl border",
                            hasBbox
                                ? "bg-purple-500/10 border-purple-500/20 text-purple-300"
                                : "bg-white/3 border-white/5 text-slate-500"
                        )}>
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">
                                {hasBbox
                                    ? `Region: ${Number(swLat).toFixed(3)}°, ${Number(swLng).toFixed(3)}° → ${Number(neLat).toFixed(3)}°, ${Number(neLng).toFixed(3)}°`
                                    : "No region selected — go to Dashboard and draw a bbox on the map"
                                }
                            </span>
                        </div>

                        {/* Target (Land Use) */}
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 uppercase tracking-wider">Land Use Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {TARGETS.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTarget(t.value)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors border",
                                            target === t.value
                                                ? "bg-purple-500/20 border-purple-500/30 text-white"
                                                : "bg-white/3 border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300"
                                        )}
                                    >
                                        <t.icon className={cn("h-4 w-4 flex-shrink-0", t.color)} />
                                        <span className="truncate">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cloud Cover */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Cloud className="h-4 w-4" /> Cloud Cover
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsAutoCloud(!isAutoCloud)}
                                        className={cn(
                                            "text-xs px-2.5 py-1 rounded-lg border transition-colors",
                                            isAutoCloud
                                                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                                                : "bg-white/3 border-white/5 text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        {isAutoCloud ? "Real-time" : "Manual"}
                                    </button>
                                    <span className={cn(
                                        "text-sm font-mono font-bold",
                                        isAutoCloud ? "text-emerald-400" : (cloudCover < 50 ? "text-yellow-400" : "text-red-400")
                                    )}>
                                        {isAutoCloud
                                            ? (result ? `${result.cloud_cover_used}%` : isLoading ? "Fetching…" : "—")
                                            : `${cloudCover}%`}
                                    </span>
                                </div>
                            </div>
                            {!isAutoCloud && (
                                <>
                                    <input
                                        type="range" min={0} max={100} value={cloudCover}
                                        onChange={e => setCloudCover(Number(e.target.value))}
                                        className="w-full accent-purple-500 h-1.5"
                                    />
                                    <div className="flex justify-between text-xs text-slate-600">
                                        <span>Clear</span><span>Overcast</span>
                                    </div>
                                </>
                            )}
                            {isAutoCloud && (
                                <p className="text-xs text-slate-600 italic">Real-time data from Open-Meteo</p>
                            )}
                        </div>

                        {/* Sensor / Resolution */}
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Satellite className="h-4 w-4" /> Sensor Resolution
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {SENSORS.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => setGsd(s.value)}
                                        className={cn(
                                            "px-3 py-2.5 rounded-xl text-sm transition-colors border",
                                            gsd === s.value
                                                ? "bg-cyan-500/20 border-cyan-500/30 text-white"
                                                : "bg-white/3 border-white/5 text-slate-500 hover:bg-white/5 hover:text-slate-300"
                                        )}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Crisis toggle */}
                        <div
                            onClick={() => setCrisis(!crisis)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                                crisis
                                    ? "bg-orange-500/15 border-orange-500/25 text-orange-300"
                                    : "bg-white/3 border-white/5 text-slate-400 hover:bg-white/5"
                            )}
                        >
                            <Zap className={cn("h-4 w-4", crisis ? "text-orange-400" : "text-slate-500")} />
                            <div>
                                <p className="text-sm font-semibold">Crisis Zone</p>
                                <p className="text-xs text-slate-500">Active conflict / disaster × 5 premium</p>
                            </div>
                            <div className={cn(
                                "ml-auto w-8 h-4 rounded-full transition-colors flex items-center px-0.5",
                                crisis ? "bg-orange-500" : "bg-white/10"
                            )}>
                                <div className={cn(
                                    "w-3 h-3 rounded-full bg-white transition-transform",
                                    crisis ? "translate-x-4" : "translate-x-0"
                                )} />
                            </div>
                        </div>

                        {/* Predict button */}
                        <button
                            onClick={handlePredict}
                            disabled={isLoading || !hasBbox}
                            className={cn(
                                "w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors",
                                hasBbox
                                    ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:opacity-90"
                                    : "bg-white/3 text-slate-500 cursor-not-allowed border border-white/5"
                            )}
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <DollarSign className="h-5 w-5" />}
                            {isLoading ? "Calculating…" : "Predict Value"}
                        </button>

                        {/* Recent predictions */}
                        {historyRuns.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-400 uppercase tracking-wider">Recent predictions</p>
                                <ul className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-white/5 bg-white/3 divide-y divide-white/5">
                                    {historyRuns.map((run) => {
                                        const p = run.payload as Record<string, unknown> & { value_usd?: number; confidence?: number };
                                        const label = run.title || (p?.value_usd != null ? `$${Number(p.value_usd).toLocaleString()}` : run.created_at);
                                        return (
                                            <li key={run.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const { bbox: _b, ...rest } = p;
                                                        setResult(rest as PredictionResult);
                                                        setError(null);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex justify-between items-center gap-2"
                                                >
                                                    <span className="truncate">{label}</span>
                                                    <span className="text-xs text-slate-500 flex-shrink-0">
                                                        {new Date(run.created_at).toLocaleDateString()}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* ─── Right Panel: Results ─── */}
                    <div className="flex-1 flex flex-col gap-4">
                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/15 text-red-300 text-base">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {isLoading && (
                            <div className="rounded-xl border border-white/5 bg-white/3 p-8 flex flex-col items-center gap-4 animate-pulse">
                                <div className="w-40 h-12 bg-white/5 rounded-xl" />
                                <div className="w-24 h-4 bg-white/5 rounded-full" />
                                <div className="w-full space-y-3 mt-4">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-6 bg-white/5 rounded-full" />)}
                                </div>
                            </div>
                        )}

                        {/* Result card */}
                        {result && !isLoading && (
                            <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-6 space-y-5">
                                {/* Main price */}
                                <div className="text-center">
                                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-1">Estimated Capture Value</p>
                                    <div className="text-5xl font-bold text-white tracking-tight">
                                        ${result.value_usd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </div>
                                    <div className="flex items-center justify-center gap-3 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "w-2.5 h-2.5 rounded-full",
                                                result.confidence > 0.75 ? "bg-emerald-400" : result.confidence > 0.5 ? "bg-yellow-400" : "bg-red-400"
                                            )} />
                                            <span className="text-sm text-slate-400">
                                                Confidence: {Math.round(result.confidence * 100)}%
                                            </span>
                                        </div>
                                        <span className="text-slate-700">·</span>
                                        <span className="text-sm text-slate-400">{result.area_km2.toLocaleString()} km²</span>
                                    </div>
                                </div>

                                {/* Factor breakdown */}
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500 uppercase tracking-widest mb-3">Price Breakdown</p>
                                    <div className="space-y-3">
                                        {result.factors.map((f, i) => (
                                            <FactorBar key={i} factor={f} maxAbsImpact={maxAbsImpact} />
                                        ))}
                                    </div>
                                </div>

                                {/* NASA Live Intelligence */}
                                {result.nasa && (
                                    <div className="rounded-xl border border-white/5 bg-white/3 p-4 space-y-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Radio className="h-4 w-4 text-blue-400" />
                                            NASA Live Intelligence
                                        </p>

                                        {/* Crisis events */}
                                        <div className={cn(
                                            "flex items-start gap-2 text-sm rounded-xl px-3 py-2 border",
                                            result.nasa.crisis_detected
                                                ? "bg-orange-500/10 border-orange-500/15 text-orange-300"
                                                : "bg-white/3 border-white/5 text-slate-500"
                                        )}>
                                            <Flame className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", result.nasa.crisis_detected ? "text-orange-400" : "text-slate-600")} />
                                            <div>
                                                <span className="font-medium">
                                                    {result.nasa.crisis_detected ? "Active Events Detected" : "No Active Crisis Events"}
                                                </span>
                                                {result.nasa.crisis_events.length > 0 && (
                                                    <p className="text-xs text-orange-400/70 mt-0.5">
                                                        {result.nasa.crisis_events.slice(0, 3).join(" · ")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Space weather */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={cn(
                                                "flex items-center gap-2 text-sm rounded-xl px-3 py-2 border",
                                                result.nasa.storm_level !== "None"
                                                    ? "bg-yellow-500/10 border-yellow-500/15 text-yellow-300"
                                                    : "bg-white/3 border-white/5 text-slate-500"
                                            )}>
                                                <Zap className={cn("h-4 w-4", result.nasa.storm_level !== "None" ? "text-yellow-400" : "text-slate-600")} />
                                                <div>
                                                    <p className="font-medium">Magnetic Storm</p>
                                                    <p className="text-xs">{result.nasa.storm_level}</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-2 text-sm rounded-xl px-3 py-2 border",
                                                result.nasa.solar_flares > 0
                                                    ? "bg-red-500/10 border-red-500/15 text-red-300"
                                                    : "bg-white/3 border-white/5 text-slate-500"
                                            )}>
                                                <Sun className={cn("h-4 w-4", result.nasa.solar_flares > 0 ? "text-red-400" : "text-slate-600")} />
                                                <div>
                                                    <p className="font-medium">Solar Flares</p>
                                                    <p className="text-xs">{result.nasa.solar_flares} M/X class</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Weather Intelligence (Open-Meteo) */}
                                {result.cloud_cover_used !== undefined && (
                                    <div className="rounded-xl border border-white/5 bg-white/3 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Cloud className="h-4 w-4 text-cyan-400" />
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-widest leading-none">Actual Cloud Cover</p>
                                                <p className="text-sm font-semibold text-white mt-1">{result.cloud_cover_used}%</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 uppercase tracking-widest leading-none">Source</p>
                                            <p className="text-xs text-cyan-400 mt-1">{result.weather_source}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Note */}
                                <p className="text-xs text-slate-600 text-center">
                                    Powered by NASA EONET &amp; DONKI · Math Engine v1
                                </p>

                                {/* Generate Report CTA */}
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-base font-semibold hover:bg-emerald-500/10 transition-colors"
                                >
                                    <FileText className="h-5 w-5" />
                                    Generate PDF Report
                                </button>
                            </div>
                        )}

                        {/* Empty state */}
                        {!result && !isLoading && !error && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 rounded-xl border border-white/5 bg-white/3 p-12">
                                <div className="w-16 h-16 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <DollarSign className="h-8 w-8 text-purple-400/50" />
                                </div>
                                <div>
                                    <p className="text-base font-medium text-slate-400">No prediction yet</p>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {hasBbox
                                            ? "Configure the parameters and click Predict Value"
                                            : "Go to the Dashboard, draw a bounding box on the map, then open Value Predictor"
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {content}
            {showReportModal && result && (
                <ReportModal
                    onClose={() => setShowReportModal(false)}
                    predictionData={{
                        bbox: bboxArr!,
                        target,
                        value_usd: result.value_usd,
                        confidence: result.confidence,
                        area_km2: result.area_km2,
                        factors: result.factors,
                        cloud_cover_used: result.cloud_cover_used ?? 20,
                        weather_source: result.weather_source ?? "Manual Input",
                        nasa: result.nasa,
                    }}
                />
            )}
        </>
    );
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function ValuePredictorPage() {
    return (
        <Suspense fallback={<div className="absolute inset-0 bg-[#0A0E17]" />}>
            <ValuePredictorInner />
        </Suspense>
    );
}
