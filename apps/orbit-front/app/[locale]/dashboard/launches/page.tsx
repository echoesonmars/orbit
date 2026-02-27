"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    ChevronLeft, Rocket, MapPin, Calendar, Wind, Cloud, Droplets,
    Thermometer, AlertTriangle, CheckCircle2, Loader2, ChevronDown,
    ExternalLink, RefreshCw, Radio, Shield
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Spaceport = { name: string; country: string; latitude: number; longitude: number };

type LaunchInfo = {
    id: string;
    name: string;
    rocket: string;
    mission: string | null;
    spaceport: Spaceport;
    net_date: string;
    status: string;
    image_url: string | null;
    webcast_url: string | null;
};

type DelayFactor = { name: string; risk: number; detail: string };

type Weather = {
    wind_speed_kmh: number;
    wind_gusts_kmh: number;
    cloud_cover_pct: number;
    precipitation_prob_pct: number;
    temperature_c: number;
    description: string;
};

type DelayPrediction = {
    launch_id: string;
    launch_name: string;
    rocket: string;
    spaceport: string;
    net_date: string;
    delay_probability: number;
    risk_level: string;
    factors: DelayFactor[];
    weather: Weather;
    recommendation: string;
};

// ─── Risk Gauge SVG ──────────────────────────────────────────────────────────

function RiskGauge({ probability }: { probability: number }) {
    const pct = Math.min(probability, 100);
    const angle = (pct / 100) * 180;
    const rad = (angle * Math.PI) / 180;
    const r = 80;
    const cx = 100, cy = 95;
    const x = cx - r * Math.cos(rad);
    const y = cy - r * Math.sin(rad);
    const large = angle > 180 ? 1 : 0;

    const color =
        pct > 70 ? "#EF4444" :
            pct > 45 ? "#F59E0B" :
                pct > 25 ? "#3B82F6" : "#10B981";

    return (
        <svg viewBox="0 0 200 115" className="w-full max-w-[220px]">
            {/* Background arc */}
            <path d={`M 20 95 A 80 80 0 0 1 180 95`}
                fill="none" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
            {/* Filled arc */}
            {pct > 0 && (
                <path d={`M 20 95 A 80 80 0 ${large} 1 ${x} ${y}`}
                    fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
            )}
            {/* Value */}
            <text x={cx} y={cy - 15} textAnchor="middle" fill={color}
                fontSize="28" fontWeight="bold" fontFamily="monospace">
                {pct.toFixed(0)}%
            </text>
            <text x={cx} y={cy + 5} textAnchor="middle" fill="#64748B" fontSize="10">
                Delay Risk
            </text>
        </svg>
    );
}

// ─── Weather Card ───────────────────────────────────────────────────────────

function WeatherCard({ weather }: { weather: Weather }) {
    const items = [
        { icon: Wind, label: "Wind", value: `${weather.wind_speed_kmh} km/h`, sub: `Gusts: ${weather.wind_gusts_kmh} km/h` },
        { icon: Cloud, label: "Clouds", value: `${weather.cloud_cover_pct}%`, sub: null },
        { icon: Droplets, label: "Precip", value: `${weather.precipitation_prob_pct}%`, sub: "probability" },
        { icon: Thermometer, label: "Temp", value: `${weather.temperature_c}°C`, sub: null },
    ];

    return (
        <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/3 border border-white/5">
                    <item.icon className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs text-white font-semibold">{item.value}</p>
                        {item.sub && <p className="text-[9px] text-slate-600">{item.sub}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Factor Bar ─────────────────────────────────────────────────────────────

function FactorBar({ factor }: { factor: DelayFactor }) {
    const color =
        factor.risk > 0.7 ? "bg-red-500" :
            factor.risk > 0.4 ? "bg-yellow-500" :
                factor.risk > 0.2 ? "bg-blue-500" : "bg-emerald-500";

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-400">{factor.name}</span>
                <span className="text-slate-500 font-mono">{(factor.risk * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-700", color)}
                    style={{ width: `${factor.risk * 100}%` }} />
            </div>
            <p className="text-[10px] text-slate-600">{factor.detail}</p>
        </div>
    );
}

// ─── Launch Row ─────────────────────────────────────────────────────────────

function LaunchRow({ launch }: { launch: LaunchInfo }) {
    const [expanded, setExpanded] = useState(false);
    const [prediction, setPrediction] = useState<DelayPrediction | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const riskColors: Record<string, string> = {
        Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        Medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        High: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
        Critical: "text-red-400 bg-red-500/10 border-red-500/20",
    };

    const statusColors: Record<string, string> = {
        Go: "text-emerald-400",
        TBD: "text-slate-500",
        TBC: "text-yellow-400",
        Hold: "text-red-400",
    };

    const formatDate = (iso: string) => {
        try {
            return new Intl.DateTimeFormat("en-US", {
                month: "short", day: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", timeZoneName: "short",
            }).format(new Date(iso));
        } catch { return iso; }
    };

    const handleExpand = async () => {
        setExpanded(!expanded);
        if (!expanded && !prediction) {
            setIsLoading(true);
            try {
                const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token || "";

                const resp = await fetch(`${gatewayUrl}/api/v1/launches/predict-delay`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ launch_id: launch.id }),
                });

                if (resp.ok) {
                    const data: DelayPrediction = await resp.json();
                    setPrediction(data);
                }
            } catch (e) {
                console.error("Failed to predict delay", e);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden transition-all">
            {/* Main Row */}
            <button
                onClick={handleExpand}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-white/3 transition-colors text-left"
            >
                {/* Rocket Image */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center">
                    {launch.image_url ? (
                        <img src={launch.image_url} alt={launch.rocket}
                            className="w-full h-full object-cover" />
                    ) : (
                        <Rocket className="h-5 w-5 text-purple-400" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{launch.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Rocket className="h-3 w-3" /> {launch.rocket}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" /> {launch.spaceport.name}
                        </span>
                    </div>
                </div>

                {/* Date + Status */}
                <div className="flex-shrink-0 text-right hidden sm:block">
                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />
                        {formatDate(launch.net_date)}
                    </p>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", statusColors[launch.status] || "text-slate-600")}>
                        {launch.status}
                    </span>
                </div>

                {/* Prediction badge (if available) */}
                {prediction && (
                    <div className={cn(
                        "flex-shrink-0 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider",
                        riskColors[prediction.risk_level] || riskColors.Medium
                    )}>
                        {prediction.delay_probability.toFixed(0)}%
                    </div>
                )}

                {/* Expand arrow */}
                <ChevronDown className={cn(
                    "h-4 w-4 text-slate-600 flex-shrink-0 transition-transform",
                    expanded && "rotate-180"
                )} />
            </button>

            {/* Expanded Detail */}
            {expanded && (
                <div className="px-4 pb-5 border-t border-white/5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 gap-2">
                            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                            <span className="text-sm text-slate-500">Calculating delay risk...</span>
                        </div>
                    ) : prediction ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            {/* Left: Gauge + Recommendation */}
                            <div className="space-y-4">
                                <div className="flex flex-col items-center">
                                    <RiskGauge probability={prediction.delay_probability} />
                                    <div className={cn(
                                        "mt-2 px-3 py-1 rounded-full text-xs font-bold border",
                                        riskColors[prediction.risk_level] || ""
                                    )}>
                                        {prediction.risk_level} Risk
                                    </div>
                                </div>

                                {/* Recommendation */}
                                <div className="rounded-xl border border-white/5 bg-white/2 p-3">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Shield className="h-3 w-3" /> AI Recommendation
                                    </p>
                                    <p className="text-xs text-slate-300 leading-relaxed">{prediction.recommendation}</p>
                                </div>

                                {/* Weather Card */}
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Radio className="h-3 w-3 text-cyan-400" /> Weather at Spaceport
                                    </p>
                                    <WeatherCard weather={prediction.weather} />
                                    <p className="text-[10px] text-slate-600 italic mt-1.5">{prediction.weather.description}</p>
                                </div>
                            </div>

                            {/* Right: Risk Factors */}
                            <div className="space-y-4">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-yellow-400" /> Risk Factor Breakdown
                                </p>
                                <div className="space-y-4">
                                    {prediction.factors.map((f) => (
                                        <FactorBar key={f.name} factor={f} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-sm text-slate-600">Unable to load prediction data</p>
                        </div>
                    )}

                    {/* Webcast link */}
                    {launch.webcast_url && (
                        <a
                            href={launch.webcast_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <ExternalLink className="h-3 w-3" />
                            Watch Live
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LaunchesPage() {
    const [launches, setLaunches] = useState<LaunchInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchLaunches = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            const resp = await fetch(`${gatewayUrl}/api/v1/launches/upcoming`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!resp.ok) throw new Error(`Server error ${resp.status}`);

            const data = await resp.json();
            setLaunches(data.launches || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => { fetchLaunches(); }, [fetchLaunches]);

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0">
                <Link href="/dashboard" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-purple-400" />
                    <h1 className="text-white font-semibold text-sm">Launch Delay Predictor</h1>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-mono hidden sm:block">
                        Powered by Launch Library 2 + Open-Meteo
                    </span>
                    <button
                        onClick={fetchLaunches}
                        className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {/* Title row */}
                <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-slate-600 font-mono uppercase tracking-wider">
                        Upcoming Launches
                    </p>
                    {launches.length > 0 && (
                        <p className="text-[10px] text-slate-700">{launches.length} missions</p>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                        <p className="text-slate-500 text-sm">Fetching launch schedule...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-3xl border border-red-500/20 bg-red-500/5">
                        <AlertTriangle className="h-8 w-8 text-red-400" />
                        <p className="text-red-400 text-sm">{error}</p>
                        <button onClick={fetchLaunches}
                            className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-xs hover:bg-white/5">
                            Retry
                        </button>
                    </div>
                ) : launches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-3xl border border-white/5 bg-white/2">
                        <Rocket className="h-10 w-10 text-purple-400/40" />
                        <p className="text-slate-500 text-sm">No upcoming launches found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {launches.map((launch) => (
                            <LaunchRow key={launch.id} launch={launch} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
