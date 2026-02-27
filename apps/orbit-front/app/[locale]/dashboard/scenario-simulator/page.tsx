"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
    ChevronLeft, Cpu, Loader2, TrendingUp, TrendingDown,
    DollarSign, Percent, AlertTriangle, CheckCircle2, Info
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Percentiles = { p5: number; p10: number; p25: number; p50: number; p75: number; p90: number; p95: number };
type HistoBin = { bin_start: number; bin_end: number; count: number; pct: number; is_profit: boolean };
type FanPoint = { year: number; p10: number; p25: number; p50: number; p75: number; p90: number };

type SimResult = {
    n_simulations: number;
    mission_duration_years: number;
    total_investment_usd: number;
    profitable_pct: number;
    total_loss_pct: number;
    verdict: string;
    verdict_color: string;
    roi_p50_pct: number;
    percentiles: Percentiles;
    histogram: HistoBin[];
    fan_chart: FanPoint[];
};

// ─── Fan Chart (Canvas) ───────────────────────────────────────────────────────

function FanChart({ data, years }: { data: FanPoint[]; years: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data.length) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width = canvas.offsetWidth * 2;
        const H = canvas.height = canvas.offsetHeight * 2;
        const w = W / 2, h = H / 2;
        const padL = 48, padR = 16, padT = 16, padB = 32;
        const cW = w - padL - padR, cH = h - padT - padB;

        const allVals = data.flatMap((d) => [d.p10, d.p90]);
        const minY = Math.min(...allVals);
        const maxY = Math.max(...allVals);
        const rangeY = maxY - minY || 1;

        const toX = (year: number) => padL + (year / years) * cW;
        const toY = (val: number) => padT + (1 - (val - minY) / rangeY) * cH;

        ctx.clearRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padT + (i / 4) * cH;
            ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
            const val = maxY - (i / 4) * rangeY;
            ctx.fillStyle = "#475569";
            ctx.font = "9px monospace";
            ctx.textAlign = "right";
            ctx.fillText(`$${val.toFixed(1)}M`, padL - 4, y + 3);
        }
        // Zero line
        if (minY < 0 && maxY > 0) {
            const zy = toY(0);
            ctx.strokeStyle = "#475569";
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(padL, zy); ctx.lineTo(w - padR, zy); ctx.stroke();
            ctx.setLineDash([]);
        }

        // X-axis labels
        ctx.fillStyle = "#475569";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        for (let i = 0; i <= years; i++) {
            ctx.fillText(`Y${i}`, toX(i), h - padB + 14);
        }

        // Fan areas
        const drawBand = (upper: (d: FanPoint) => number, lower: (d: FanPoint) => number, color: string, alpha: number) => {
            ctx.beginPath();
            data.forEach((d, i) => {
                const x = toX(d.year), y = toY(upper(d));
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            [...data].reverse().forEach((d) => ctx.lineTo(toX(d.year), toY(lower(d))));
            ctx.closePath();
            ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, "0");
            ctx.fill();
        };

        drawBand((d) => d.p90, (d) => d.p75, "#10B981", 0.12);
        drawBand((d) => d.p75, (d) => d.p25, "#10B981", 0.2);
        drawBand((d) => d.p25, (d) => d.p10, "#EF4444", 0.12);

        // P50 line (median)
        ctx.beginPath();
        ctx.strokeStyle = "#10B981";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        data.forEach((d, i) => {
            const x = toX(d.year), y = toY(d.p50);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // P10 line (worst)
        ctx.beginPath();
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        data.forEach((d, i) => {
            const x = toX(d.year), y = toY(d.p10);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // P90 line (best)
        ctx.beginPath();
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        data.forEach((d, i) => {
            const x = toX(d.year), y = toY(d.p90);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
    }, [data, years]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ─── Histogram (Canvas) ───────────────────────────────────────────────────────

function Histogram({ bins }: { bins: HistoBin[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !bins.length) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width = canvas.offsetWidth * 2;
        const H = canvas.height = canvas.offsetHeight * 2;
        const w = W / 2, h = H / 2;
        const padL = 8, padR = 8, padT = 8, padB = 20;
        const cW = w - padL - padR, cH = h - padT - padB;

        const maxCount = Math.max(...bins.map((b) => b.count));
        const barW = cW / bins.length - 1;

        ctx.clearRect(0, 0, w, h);

        bins.forEach((bin, i) => {
            const barH = (bin.count / maxCount) * cH;
            const x = padL + i * (cW / bins.length);
            const y = padT + cH - barH;

            ctx.fillStyle = bin.is_profit ? "#10B981" : "#EF4444";
            ctx.globalAlpha = 0.8;
            ctx.fillRect(x, y, Math.max(barW, 1), barH);
        });
        ctx.globalAlpha = 1;

        // Labels
        ctx.fillStyle = "#475569";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        const first = bins[0];
        const last = bins[bins.length - 1];
        ctx.fillText(`$${first.bin_start}M`, padL + barW / 2, h - 4);
        ctx.fillText(`$${last.bin_end}M`, w - padR - barW / 2, h - 4);
        ctx.fillText("$0", padL + (cW / 2), h - 4);
    }, [bins]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ─── Param Slider ──────────────────────────────────────────────────────────────

function ParamRow({ label, value, min, max, step, unit, format, onChange }: {
    label: string; value: number; min: number; max: number; step: number; unit: string;
    format?: (v: number) => string;
    onChange: (v: number) => void;
}) {
    const display = format ? format(value) : value.toLocaleString();
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">{label}</span>
                <span className="text-white font-mono font-semibold">{display} {unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                              [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-purple-500" />
        </div>
    );
}

const fmt$ = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`;
const fmtPct = (v: number) => `${(v * 100).toFixed(0)}%`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScenarioSimulatorPage() {
    // Financial params
    const [budget, setBudget] = useState(10_000_000);
    const [launchCost, setLaunchCost] = useState(2_000_000);
    const [satCost, setSatCost] = useState(3_000_000);
    const [opsCost, setOpsCost] = useState(500_000);
    // Risk params
    const [launchFailure, setLaunchFailure] = useState(0.05);
    const [annualFailure, setAnnualFailure] = useState(0.02);
    // Revenue params
    const [revenuePerDay, setRevenuePerDay] = useState(1_250);
    const [clearDaysMu, setClearDaysMu] = useState(200);
    const [growth, setGrowth] = useState(0.05);
    // Sim params
    const [years, setYears] = useState(5);
    const [nSim, setNSim] = useState(10_000);
    const [missionType] = useState("earth_observation");

    const [result, setResult] = useState<SimResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const supabase = createClient();

    const handleRun = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setProgress(0);

        // Animate progress bar (simulation takes ~2-5s)
        const progInterval = setInterval(() => {
            setProgress((p) => Math.min(p + Math.random() * 8, 90));
        }, 200);

        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            const resp = await fetch(`${gatewayUrl}/api/v1/simulator/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    total_budget_usd: budget,
                    launch_cost_usd: launchCost,
                    satellite_cost_usd: satCost,
                    ops_cost_per_year_usd: opsCost,
                    launch_failure_prob: launchFailure,
                    annual_failure_prob: annualFailure,
                    revenue_per_clear_day_usd: revenuePerDay,
                    clear_days_mu: clearDaysMu,
                    clear_days_sigma: 40,
                    revenue_growth_pct_per_year: growth,
                    mission_duration_years: years,
                    n_simulations: nSim,
                    mission_type: missionType,
                }),
            });

            if (!resp.ok) throw new Error(`Server error ${resp.status}`);
            const data: SimResult = await resp.json();
            clearInterval(progInterval);
            setProgress(100);
            setTimeout(() => setResult(data), 300);
        } catch (e: any) {
            clearInterval(progInterval);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [budget, launchCost, satCost, opsCost, launchFailure, annualFailure,
        revenuePerDay, clearDaysMu, growth, years, nSim, missionType, supabase]);

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0">
                <Link href="/dashboard" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-purple-400" />
                    <h1 className="text-white font-semibold text-sm">Scenario Simulator</h1>
                </div>
                <span className="ml-auto text-[10px] text-slate-600 font-mono hidden sm:block">
                    Monte Carlo · {nSim.toLocaleString()} simulations
                </span>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Sliders */}
                <div className="w-72 flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 space-y-4">

                    {/* Financial */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Financials</p>
                        <div className="space-y-3">
                            <ParamRow label="Total Budget" value={budget} min={1_000_000} max={100_000_000} step={500_000} unit="" format={fmt$} onChange={setBudget} />
                            <ParamRow label="Launch Cost" value={launchCost} min={500_000} max={20_000_000} step={250_000} unit="" format={fmt$} onChange={setLaunchCost} />
                            <ParamRow label="Satellite Cost" value={satCost} min={500_000} max={50_000_000} step={250_000} unit="" format={fmt$} onChange={setSatCost} />
                            <ParamRow label="Ops / Year" value={opsCost} min={50_000} max={5_000_000} step={50_000} unit="" format={fmt$} onChange={setOpsCost} />
                        </div>
                    </div>

                    {/* Risk */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Risk Parameters</p>
                        <div className="space-y-3">
                            <ParamRow label="Launch Failure" value={launchFailure} min={0.01} max={0.30} step={0.01} unit="" format={fmtPct} onChange={setLaunchFailure} />
                            <ParamRow label="Annual Failure" value={annualFailure} min={0.005} max={0.15} step={0.005} unit="" format={fmtPct} onChange={setAnnualFailure} />
                        </div>
                    </div>

                    {/* Revenue */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Revenue</p>
                        <div className="space-y-3">
                            <ParamRow label="Revenue / Op Day" value={revenuePerDay} min={100} max={50_000} step={100} unit="$" onChange={setRevenuePerDay} />
                            <ParamRow label="Op Days / Year (avg)" value={clearDaysMu} min={10} max={365} step={5} unit="days" onChange={setClearDaysMu} />
                            <ParamRow label="Annual Growth" value={growth} min={0} max={0.3} step={0.01} unit="" format={fmtPct} onChange={setGrowth} />
                        </div>
                    </div>

                    {/* Simulation */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Simulation</p>
                        <div className="space-y-3">
                            <ParamRow label="Mission Duration" value={years} min={1} max={20} step={1} unit="yrs" onChange={setYears} />
                            <ParamRow label="Iterations" value={nSim} min={1000} max={50_000} step={1000} unit="" onChange={setNSim} />
                        </div>
                    </div>

                    {/* Run Button */}
                    <button onClick={handleRun} disabled={isLoading}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm
                                       hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]
                                       flex items-center justify-center gap-2">
                        {isLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Simulating...</>
                        ) : (
                            <><Cpu className="h-4 w-4" /> Run Simulation</>
                        )}
                    </button>

                    {/* Progress bar */}
                    {isLoading && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[9px] text-slate-600">
                                <span>Processing {nSim.toLocaleString()} life-cycles...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full transition-all duration-200"
                                    style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                </div>

                {/* Right: Results */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 gap-4">
                    {result ? (
                        <>
                            {/* Verdict row */}
                            <div className="flex flex-wrap gap-3">
                                {/* Verdict badge */}
                                <div className="flex-1 min-w-[140px] px-4 py-3 rounded-2xl border"
                                    style={{ borderColor: result.verdict_color + "40", backgroundColor: result.verdict_color + "10" }}>
                                    <p className="text-[10px] text-slate-500 uppercase mb-1">Verdict</p>
                                    <p className="text-lg font-black" style={{ color: result.verdict_color }}>
                                        {result.verdict}
                                    </p>
                                </div>
                                {[
                                    { label: "Profitable", value: `${result.profitable_pct}%`, icon: Percent, color: result.profitable_pct >= 50 ? "#10B981" : "#EF4444" },
                                    { label: "Median ROI", value: `${result.roi_p50_pct}%`, icon: TrendingUp, color: result.roi_p50_pct >= 0 ? "#3B82F6" : "#EF4444" },
                                    { label: "Total Loss Risk", value: `${result.total_loss_pct}%`, icon: AlertTriangle, color: "#F59E0B" },
                                    { label: "Investment", value: `$${(result.total_investment_usd / 1_000_000).toFixed(1)}M`, icon: DollarSign, color: "#8B5CF6" },
                                ].map((m) => (
                                    <div key={m.label} className="flex-1 min-w-[110px] px-3 py-3 rounded-2xl border border-white/8 bg-white/3 text-center">
                                        <m.icon className="h-4 w-4 mx-auto mb-1" style={{ color: m.color }} />
                                        <p className="text-base font-black font-mono" style={{ color: m.color }}>{m.value}</p>
                                        <p className="text-[9px] text-slate-600">{m.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Percentile table */}
                            <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
                                <div className="grid grid-cols-7 text-center">
                                    {[
                                        { pct: "P5", val: result.percentiles.p5, label: "Disaster", color: "#6B7280" },
                                        { pct: "P10", val: result.percentiles.p10, label: "Worst", color: "#EF4444" },
                                        { pct: "P25", val: result.percentiles.p25, label: "Bad", color: "#F59E0B" },
                                        { pct: "P50", val: result.percentiles.p50, label: "Median", color: "#10B981" },
                                        { pct: "P75", val: result.percentiles.p75, label: "Good", color: "#3B82F6" },
                                        { pct: "P90", val: result.percentiles.p90, label: "Best", color: "#8B5CF6" },
                                        { pct: "P95", val: result.percentiles.p95, label: "Excellent", color: "#EC4899" },
                                    ].map((p) => (
                                        <div key={p.pct} className="py-3 px-1 border-r border-white/5 last:border-r-0">
                                            <p className="text-[9px] text-slate-600">{p.label}</p>
                                            <p className="text-xs font-bold font-mono mt-0.5" style={{ color: p.color }}>
                                                ${p.val.toFixed(1)}M
                                            </p>
                                            <p className="text-[9px] text-slate-600">{p.pct}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-3 flex flex-col">
                                    <div className="flex items-center gap-4 mb-2">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Uncertainty Fan Chart</p>
                                        <div className="flex items-center gap-3 ml-auto">
                                            {[{ c: "#10B981", l: "Median" }, { c: "#3B82F6", l: "P90 Best" }, { c: "#EF4444", l: "P10 Worst" }].map((x) => (
                                                <div key={x.l} className="flex items-center gap-1 text-[9px] text-slate-600">
                                                    <span className="w-4 h-px" style={{ backgroundColor: x.c, display: "inline-block" }} />
                                                    {x.l}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-h-[200px]">
                                        <FanChart data={result.fan_chart} years={result.mission_duration_years} />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-3 flex flex-col">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                                        Profit Distribution ({result.n_simulations.toLocaleString()} runs)
                                        <span className="ml-2 text-emerald-400">■</span> Profit
                                        <span className="ml-1 text-red-400">■</span> Loss
                                    </p>
                                    <div className="flex-1 min-h-[200px]">
                                        <Histogram bins={result.histogram} />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-5">
                            <div className="relative">
                                <Cpu className="h-20 w-20 text-purple-400/20" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-400 text-sm font-medium">Monte Carlo Investment Simulator</p>
                                <p className="text-slate-600 text-xs mt-1">Configure parameters and click Run Simulation</p>
                            </div>
                            <div className="text-[10px] text-slate-700 space-y-1 text-center">
                                <p>• Runs 10,000 virtual satellite life-cycles</p>
                                <p>• Simulates launch failures, satellite death, weather</p>
                                <p>• Returns P10/P50/P90 return on investment</p>
                                <p>• Fan chart shows uncertainty cone over time</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
