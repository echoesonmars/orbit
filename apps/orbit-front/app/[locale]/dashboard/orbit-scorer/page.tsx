"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    ChevronLeft, Target, Loader2, Plus, Trash2, ChevronDown,
    Trophy, Star, AlertTriangle, MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalProfile = { id: string; label: string; description: string; emoji: string };

type RadarPoint = { metric: string; score: number; weight: number };

type OrbitResult = {
    satellite_name: string;
    suitability_score: number;
    grade: string;
    grade_color: string;
    altitude_km: number;
    inclination_deg: number;
    eccentricity: number;
    radar: RadarPoint[];
    breakdown: {
        coverage: { score: number; detail: string };
        revisit: { score: number; detail: string };
        latency: { score: number; detail: string };
        resolution: { score: number; detail: string };
        radiation: { score: number; detail: string };
    };
};

type ScoreResponse = {
    results: OrbitResult[];
    business_goal: string;
    business_goal_label: string;
    target_latitude: number;
    winner: string | null;
};

// ─── Radar Chart (Canvas) ────────────────────────────────────────────────────

const ORBIT_COLORS = ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

function RadarChart({ results }: { results: OrbitResult[] }) {
    const metrics = results[0]?.radar ?? [];
    const n = metrics.length;
    if (n < 3) return null;

    const W = 240, H = 240;
    const cx = W / 2, cy = H / 2;
    const R = 90;

    const angleStep = (2 * Math.PI) / n;
    const getPoint = (idx: number, r: number) => {
        const a = idx * angleStep - Math.PI / 2;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };

    const toPath = (pts: { x: number; y: number }[]) =>
        pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

    // Grid rings
    const rings = [0.25, 0.5, 0.75, 1.0];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[280px]">
            {/* Grid */}
            {rings.map((r) => {
                const pts = metrics.map((_, i) => getPoint(i, R * r));
                return <path key={r} d={toPath(pts)} fill="none" stroke="#1E293B" strokeWidth="1" />;
            })}
            {/* Axes */}
            {metrics.map((_, i) => {
                const pt = getPoint(i, R);
                return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#1E293B" strokeWidth="1" />;
            })}
            {/* Labels */}
            {metrics.map((m, i) => {
                const pt = getPoint(i, R + 16);
                return (
                    <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
                        fontSize="7" fill="#64748B" fontFamily="monospace">
                        {m.metric.split(" ")[0]}
                    </text>
                );
            })}
            {/* Data polygons */}
            {results.map((result, ri) => {
                const pts = result.radar.map((r, i) => getPoint(i, R * (r.score / 100)));
                return (
                    <g key={ri}>
                        <path d={toPath(pts)} fill={ORBIT_COLORS[ri] + "30"} stroke={ORBIT_COLORS[ri]}
                            strokeWidth="1.5" strokeLinejoin="round" />
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Score Card ──────────────────────────────────────────────────────────────

function ScoreCard({ result, color, isWinner }: { result: OrbitResult; color: string; isWinner: boolean }) {
    const [expanded, setExpanded] = useState(false);

    const breakdownItems = [
        { key: "coverage", label: "Coverage" },
        { key: "revisit", label: "Revisit Time" },
        { key: "latency", label: "Low Latency" },
        { key: "resolution", label: "Resolution" },
        { key: "radiation", label: "Radiation Safety" },
    ] as const;

    return (
        <div className={cn(
            "rounded-xl border overflow-hidden",
            isWinner ? "border-purple-500/20 bg-purple-500/5" : "border-white/5 bg-white/3"
        )}>
            {/* Header */}
            <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold flex items-center gap-2">
                        {result.satellite_name}
                        {isWinner && <Trophy className="h-3.5 w-3.5 text-yellow-400" />}
                    </p>
                    <p className="text-[10px] text-slate-500">
                        {result.altitude_km} km · {result.inclination_deg}° · e={result.eccentricity}
                    </p>
                </div>
                {/* Big score */}
                <div className="text-right">
                    <p className="text-2xl font-black font-mono" style={{ color: result.grade_color }}>
                        {result.suitability_score.toFixed(0)}
                    </p>
                    <p className="text-[9px] text-slate-600">/100 · {result.grade}</p>
                </div>
            </div>

            {/* Score bar */}
            <div className="h-1 bg-white/5">
                <div className="h-full transition-all duration-700"
                    style={{ width: `${result.suitability_score}%`, backgroundColor: result.grade_color }} />
            </div>

            {/* Expand */}
            <button onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-center py-2 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
                <span className="ml-1">Breakdown</span>
            </button>

            {expanded && (
                <div className="px-4 pb-3 space-y-2.5 border-t border-white/5 pt-3">
                    {breakdownItems.map((item) => {
                        const data = result.breakdown[item.key];
                        return (
                            <div key={item.key}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">{item.label}</span>
                                    <span className="text-white font-mono">{data.score.toFixed(0)}</span>
                                </div>
                                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                    <div className="h-full rounded-full bg-purple-500 transition-all duration-700"
                                        style={{ width: `${data.score}%` }} />
                                </div>
                                <p className="text-xs text-slate-700 mt-0.5 leading-tight">{data.detail}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Orbit Input Row ─────────────────────────────────────────────────────────

type OrbitInput = { name: string; altitude_km: number; inclination_deg: number; eccentricity: number };

function OrbitInputRow({ orbit, color, index, onChange, onRemove, canRemove }: {
    orbit: OrbitInput; color: string; index: number;
    onChange: (o: OrbitInput) => void; onRemove: () => void; canRemove: boolean;
}) {
    return (
        <div className="rounded-xl border border-white/5 bg-white/3 p-3 space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <input
                    value={orbit.name}
                    onChange={(e) => onChange({ ...orbit, name: e.target.value })}
                    className="flex-1 bg-transparent text-xs text-white font-semibold outline-none placeholder-slate-700"
                    placeholder={`Orbit ${index + 1}`}
                />
                {canRemove && (
                    <button onClick={onRemove} className="text-slate-700 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: "Alt (km)", key: "altitude_km" as const, min: 100, max: 36000, step: 50 },
                    { label: "Inc (°)", key: "inclination_deg" as const, min: 0, max: 180, step: 0.5 },
                    { label: "Ecc", key: "eccentricity" as const, min: 0, max: 0.9, step: 0.01 },
                ].map((field) => (
                    <div key={field.key}>
                        <p className="text-xs text-slate-600 uppercase mb-0.5">{field.label}</p>
                        <input
                            type="number"
                            value={orbit[field.key]}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            onChange={(e) => onChange({ ...orbit, [field.key]: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-2 py-1 text-xs text-white font-mono outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OrbitScorerPage() {
    const [goals, setGoals] = useState<GoalProfile[]>([]);
    const [selectedGoal, setSelectedGoal] = useState("earth_observation");
    const [targetLat, setTargetLat] = useState(45);
    const [orbits, setOrbits] = useState<OrbitInput[]>([
        { name: "ISS-like", altitude_km: 400, inclination_deg: 51.6, eccentricity: 0 },
        { name: "Sun-Sync", altitude_km: 600, inclination_deg: 97.8, eccentricity: 0 },
    ]);
    const [result, setResult] = useState<ScoreResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    // Fetch goal profiles on mount
    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
                const { data: { session } } = await supabase.auth.getSession();
                const resp = await fetch(`${gatewayUrl}/api/v1/orbits/goals`, {
                    headers: { Authorization: `Bearer ${session?.access_token || ""}` },
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setGoals(data.profiles || []);
                }
            } catch { /* silent */ }
        };
        fetchGoals();
    }, [supabase]);

    const handleScore = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            const resp = await fetch(`${gatewayUrl}/api/v1/orbits/score`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    orbits: orbits.map((o) => ({
                        altitude_km: o.altitude_km,
                        inclination_deg: o.inclination_deg,
                        eccentricity: o.eccentricity,
                        satellite_name: o.name,
                    })),
                    business_goal: selectedGoal,
                    target_latitude: targetLat,
                }),
            });

            if (!resp.ok) throw new Error(`Server error ${resp.status}`);
            const data: ScoreResponse = await resp.json();
            setResult(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [orbits, selectedGoal, targetLat, supabase]);

    const addOrbit = () => {
        if (orbits.length < 4) {
            setOrbits([...orbits, { name: `Orbit ${orbits.length + 1}`, altitude_km: 800, inclination_deg: 45, eccentricity: 0 }]);
        }
    };

    const selectedGoalProfile = goals.find((g) => g.id === selectedGoal);

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-4 px-6 py-4 border-b border-white/5 flex-shrink-0">
                <Link href="/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    <h1 className="text-white font-semibold text-base">Orbit Suitability Scorer</h1>
                </div>
                <span className="ml-auto text-[10px] text-slate-600 font-mono hidden sm:block">
                    Coverage · Revisit · Latency · Resolution · Radiation
                </span>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Inputs */}
                <div className="w-80 flex-shrink-0 border-r border-white/5 overflow-y-auto p-5 space-y-6">

                    {/* Business Goal + Target Latitude */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Business Goal</p>
                        <div className="relative">
                            <select
                                value={selectedGoal}
                                onChange={(e) => setSelectedGoal(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white
                                           appearance-none outline-none focus:border-purple-500/50 cursor-pointer"
                            >
                                {goals.length > 0 ? goals.map((g) => (
                                    <option key={g.id} value={g.id}>{g.emoji} {g.label}</option>
                                )) : (
                                    <option value="earth_observation">🌍 Earth Observation</option>
                                )}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                        </div>
                        {selectedGoalProfile && (
                            <p className="text-xs text-slate-600 mt-1.5 px-1">{selectedGoalProfile.description}</p>
                        )}
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-3 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Target Latitude
                        </p>
                        <div className="flex items-center gap-2">
                            <input
                                type="range" min={-90} max={90} step={1} value={targetLat}
                                onChange={(e) => setTargetLat(Number(e.target.value))}
                                className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                                           [&::-webkit-slider-thumb]:bg-purple-500
                                           [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(139,92,246,0.25)]"
                            />
                            <span className="text-xs text-white font-mono w-10 text-right">{targetLat}°</span>
                        </div>
                    </div>

                    {/* Orbit Inputs */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
                        <div className="flex items-center justify-between mb-0">
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Orbits to Compare</p>
                            {orbits.length < 4 && (
                                <button onClick={addOrbit}
                                    className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300">
                                    <Plus className="h-3 w-3" /> Add Orbit
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {orbits.map((orbit, i) => (
                                <OrbitInputRow
                                    key={i} orbit={orbit} color={ORBIT_COLORS[i]} index={i}
                                    onChange={(o) => setOrbits(orbits.map((x, j) => j === i ? o : x))}
                                    onRemove={() => setOrbits(orbits.filter((_, j) => j !== i))}
                                    canRemove={orbits.length > 1}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Score Button */}
                    <button
                        onClick={handleScore}
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold text-sm
                                   hover:opacity-90 disabled:opacity-50 transition-colors shadow-[0_0_12px_rgba(139,92,246,0.2)]
                                   flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Scoring...</>
                        ) : (
                            <><Star className="h-4 w-4" /> Score Orbits</>
                        )}
                    </button>

                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                </div>

                {/* Right: Results */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-5 space-y-5">
                    {result ? (
                        <>
                            {/* Winner Banner */}
                            {result.winner && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-yellow-500/15 bg-yellow-500/5">
                                    <Trophy className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                                    <p className="text-sm text-white">
                                        <span className="text-yellow-400 font-bold">{result.winner}</span>
                                        {" "}is best suited for{" "}
                                        <span className="text-purple-400 font-semibold">{result.business_goal_label}</span>
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col lg:flex-row gap-4">
                                {/* Radar Chart in container */}
                                <div className="flex-shrink-0 rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col items-center gap-3">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Radar Comparison</p>
                                    <RadarChart results={result.results} />
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {result.results.map((r, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ORBIT_COLORS[i] }} />
                                                {r.satellite_name}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Score Cards in grid */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                                    {result.results
                                        .slice()
                                        .sort((a, b) => b.suitability_score - a.suitability_score)
                                        .map((r) => (
                                            <ScoreCard
                                                key={r.satellite_name}
                                                result={r}
                                                color={ORBIT_COLORS[result.results.findIndex((x) => x.satellite_name === r.satellite_name)]}
                                                isWinner={r.satellite_name === result.winner}
                                            />
                                        ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-white/5 bg-white/[0.02]">
                            <Target className="h-16 w-16 text-purple-400/20" />
                            <p className="text-slate-500 text-sm text-center">
                                Add orbits, select a business goal, and click Score Orbits
                            </p>
                            <p className="text-xs text-slate-700 text-center">
                                Radar chart comparison will appear here
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
