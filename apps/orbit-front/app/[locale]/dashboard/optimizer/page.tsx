"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
    ChevronLeft, Orbit, Loader2, Fuel, DollarSign, Clock,
    Zap, ChevronDown, Globe2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ManeuverBurn = { name: string; delta_v_ms: number; description: string };
type OrbitPoint = { x: number; y: number; z: number };
type OrbitTrajectory = { label: string; color: string; points: OrbitPoint[] };

type OptimizeResult = {
    total_delta_v_ms: number;
    fuel_mass_kg: number;
    fuel_cost_usd: number;
    transfer_time_hours: number;
    maneuver_type: string;
    burns: ManeuverBurn[];
    trajectories: OrbitTrajectory[];
    initial_altitude_km: number;
    target_altitude_km: number;
    initial_inclination_deg: number;
    target_inclination_deg: number;
    satellite_mass_kg: number;
};

// ─── 3D Canvas (Three.js via CDN) ───────────────────────────────────────────

function OrbitViewer({ trajectories }: { trajectories: OrbitTrajectory[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width = canvas.offsetWidth * 2;
        const H = canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);  // HiDPI

        const w = W / 2, h = H / 2;
        const cx = w / 2, cy = h / 2;
        const scale = Math.min(w, h) * 0.035; // Scale factor for orbit radii

        let angle = 0;

        const draw = () => {
            ctx.clearRect(0, 0, w, h);

            // Background
            ctx.fillStyle = "#060A12";
            ctx.fillRect(0, 0, w, h);

            // Stars
            for (let i = 0; i < 80; i++) {
                const sx = (Math.sin(i * 127.1 + 311.7) * 0.5 + 0.5) * w;
                const sy = (Math.sin(i * 269.5 + 183.3) * 0.5 + 0.5) * h;
                const brightness = 0.2 + Math.sin(angle * 0.3 + i) * 0.15;
                ctx.fillStyle = `rgba(255,255,255,${brightness})`;
                ctx.fillRect(sx, sy, 1, 1);
            }

            // Earth
            const earthR = R_EARTH_SCALED * scale;
            const gradient = ctx.createRadialGradient(cx - earthR * 0.2, cy - earthR * 0.2, 0, cx, cy, earthR);
            gradient.addColorStop(0, "#1E40AF");
            gradient.addColorStop(0.5, "#1E3A5F");
            gradient.addColorStop(1, "#0F172A");
            ctx.beginPath();
            ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Atmosphere glow
            const glowGrad = ctx.createRadialGradient(cx, cy, earthR * 0.9, cx, cy, earthR * 1.15);
            glowGrad.addColorStop(0, "rgba(59,130,246,0.0)");
            glowGrad.addColorStop(0.5, "rgba(59,130,246,0.08)");
            glowGrad.addColorStop(1, "rgba(59,130,246,0.0)");
            ctx.beginPath();
            ctx.arc(cx, cy, earthR * 1.15, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();

            // Draw orbits
            const cosA = Math.cos(angle * 0.3);
            const sinA = Math.sin(angle * 0.3);

            trajectories.forEach((traj) => {
                if (traj.points.length < 2) return;

                ctx.beginPath();
                ctx.strokeStyle = traj.color;
                ctx.lineWidth = traj.label.includes("Transfer") ? 2.5 : 1.5;
                ctx.globalAlpha = traj.label.includes("Transfer") ? 0.9 : 0.6;

                let firstDraw = true;
                for (const p of traj.points) {
                    // Simple 3D→2D projection with rotation
                    const rx = p.x * cosA - p.z * sinA;
                    const rz = p.x * sinA + p.z * cosA;
                    const screenX = cx + rx * scale;
                    const screenY = cy - p.y * scale;

                    if (firstDraw) {
                        ctx.moveTo(screenX, screenY);
                        firstDraw = false;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                }
                ctx.stroke();
                ctx.globalAlpha = 1.0;

                // Satellite dot on initial and target orbits (animated)
                if (!traj.label.includes("Transfer") && traj.points.length > 10) {
                    const idx = Math.floor((angle * 2) % traj.points.length);
                    const sp = traj.points[idx];
                    const srx = sp.x * cosA - sp.z * sinA;
                    const sx = cx + srx * scale;
                    const sy = cy - sp.y * scale;

                    ctx.beginPath();
                    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                    ctx.fillStyle = traj.color;
                    ctx.fill();

                    // Glow
                    const satGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
                    satGlow.addColorStop(0, traj.color + "80");
                    satGlow.addColorStop(1, traj.color + "00");
                    ctx.beginPath();
                    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
                    ctx.fillStyle = satGlow;
                    ctx.fill();
                }
            });

            angle += 0.005;
            frameRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(frameRef.current);
    }, [trajectories]);

    return (
        <canvas ref={canvasRef} className="w-full h-full rounded-2xl" style={{ imageRendering: "auto" }} />
    );
}

const R_EARTH_SCALED = 6.371; // Earth radius in our coordinate system (thousands of km)

// ─── Slider Component ───────────────────────────────────────────────────────

function ParamSlider({ label, value, min, max, step, unit, onChange }: {
    label: string; value: number; min: number; max: number; step: number; unit: string;
    onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-mono font-semibold">{value.toLocaleString()} {unit}</span>
            </div>
            <input
                type="range"
                min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500
                           [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(147,51,234,0.5)]"
            />
            <div className="flex justify-between text-[9px] text-slate-700">
                <span>{min.toLocaleString()}</span>
                <span>{max.toLocaleString()}</span>
            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OptimizerPage() {
    // Inputs
    const [initAlt, setInitAlt] = useState(400);
    const [targetAlt, setTargetAlt] = useState(800);
    const [initInc, setInitInc] = useState(51.6);
    const [targetInc, setTargetInc] = useState(51.6);
    const [mass, setMass] = useState(500);
    const [isp, setIsp] = useState(320);
    const [fuelCost, setFuelCost] = useState(5000);

    // State
    const [result, setResult] = useState<OptimizeResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const supabase = createClient();

    const handleOptimize = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            const resp = await fetch(`${gatewayUrl}/api/v1/orbits/optimize`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    initial_orbit: { altitude_km: initAlt, inclination_deg: initInc },
                    target_orbit: { altitude_km: targetAlt, inclination_deg: targetInc },
                    satellite_mass_kg: mass,
                    isp_s: isp,
                    fuel_cost_per_kg: fuelCost,
                }),
            });

            if (!resp.ok) throw new Error(`Server error ${resp.status}`);

            const data: OptimizeResult = await resp.json();
            setResult(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [initAlt, targetAlt, initInc, targetInc, mass, isp, fuelCost, supabase]);

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0">
                <Link href="/dashboard" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <Globe2 className="h-5 w-5 text-purple-400" />
                    <h1 className="text-white font-semibold text-sm">Orbit Optimizer</h1>
                </div>
                <span className="ml-auto text-[10px] text-slate-600 font-mono hidden sm:block">
                    Hohmann Transfer · Tsiolkovsky Equation
                </span>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Controls */}
                <div className="w-80 flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 space-y-5">
                    {/* Initial Orbit */}
                    <div>
                        <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-3 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Initial Orbit
                        </p>
                        <div className="space-y-4">
                            <ParamSlider label="Altitude" value={initAlt} min={150} max={36000} step={50}
                                unit="km" onChange={setInitAlt} />
                            <ParamSlider label="Inclination" value={initInc} min={0} max={180} step={0.1}
                                unit="°" onChange={setInitInc} />
                        </div>
                    </div>

                    {/* Target Orbit */}
                    <div>
                        <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-3 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Target Orbit
                        </p>
                        <div className="space-y-4">
                            <ParamSlider label="Altitude" value={targetAlt} min={150} max={36000} step={50}
                                unit="km" onChange={setTargetAlt} />
                            <ParamSlider label="Inclination" value={targetInc} min={0} max={180} step={0.1}
                                unit="°" onChange={setTargetInc} />
                        </div>
                    </div>

                    {/* Satellite */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-semibold">
                            Satellite
                        </p>
                        <ParamSlider label="Mass" value={mass} min={10} max={10000} step={10}
                            unit="kg" onChange={setMass} />
                    </div>

                    {/* Advanced */}
                    <button onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                        <ChevronDown className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")} />
                        Advanced Parameters
                    </button>

                    {showAdvanced && (
                        <div className="space-y-4 pb-2">
                            <ParamSlider label="Specific Impulse (Isp)" value={isp} min={100} max={4500} step={10}
                                unit="s" onChange={setIsp} />
                            <ParamSlider label="Fuel Cost" value={fuelCost} min={500} max={50000} step={500}
                                unit="$/kg" onChange={setFuelCost} />
                        </div>
                    )}

                    {/* Calculate Button */}
                    <button
                        onClick={handleOptimize}
                        disabled={isLoading}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold text-sm
                                   hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]
                                   flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Computing...</>
                        ) : (
                            <><Zap className="h-4 w-4" /> Calculate Transfer</>
                        )}
                    </button>

                    {error && (
                        <p className="text-xs text-red-400 text-center">{error}</p>
                    )}
                </div>

                {/* Right: Visualization + Results */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* 3D Orbit View */}
                    <div className="flex-1 relative min-h-[300px]">
                        {result ? (
                            <OrbitViewer trajectories={result.trajectories} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                <Globe2 className="h-16 w-16 text-purple-400/20" />
                                <p className="text-sm text-slate-600">Configure orbits and click Calculate Transfer</p>
                                <p className="text-[10px] text-slate-700">3D orbit visualization will appear here</p>
                            </div>
                        )}

                        {/* Legend */}
                        {result && (
                            <div className="absolute top-4 left-4 space-y-1">
                                {result.trajectories.map((t) => (
                                    <div key={t.label} className="flex items-center gap-2 text-[10px]">
                                        <span className="w-3 h-0.5 rounded" style={{ backgroundColor: t.color }} />
                                        <span className="text-slate-500">{t.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Results Panel */}
                    {result && (
                        <div className="border-t border-white/5 p-4 space-y-4 overflow-y-auto max-h-[280px]">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { icon: Zap, label: "Total ΔV", value: `${result.total_delta_v_ms.toLocaleString()} m/s`, color: "text-purple-400" },
                                    { icon: Fuel, label: "Fuel Mass", value: `${result.fuel_mass_kg.toLocaleString()} kg`, color: "text-orange-400" },
                                    { icon: DollarSign, label: "Fuel Cost", value: `$${result.fuel_cost_usd.toLocaleString()}`, color: "text-emerald-400" },
                                    { icon: Clock, label: "Transfer Time", value: `${result.transfer_time_hours} hrs`, color: "text-cyan-400" },
                                ].map((m) => (
                                    <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                                        <m.icon className={cn("h-4 w-4 mx-auto mb-1", m.color)} />
                                        <p className="text-white font-bold text-sm">{m.value}</p>
                                        <p className="text-[10px] text-slate-600">{m.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Maneuver Type */}
                            <div className="rounded-xl border border-white/5 bg-white/2 px-3 py-2 flex items-center gap-2">
                                <Orbit className="h-3.5 w-3.5 text-purple-400" />
                                <span className="text-xs text-slate-400">Maneuver:</span>
                                <span className="text-xs text-white font-semibold">{result.maneuver_type}</span>
                            </div>

                            {/* Burns */}
                            <div className="space-y-2">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Burn Sequence</p>
                                {result.burns.map((b, i) => (
                                    <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px] text-purple-400 font-bold">
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-white font-semibold">{b.name}</p>
                                                <span className="text-[10px] text-purple-400 font-mono">
                                                    ΔV {b.delta_v_ms.toFixed(1)} m/s
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-600 mt-0.5">{b.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
