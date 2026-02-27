"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
    ChevronLeft, Leaf, Loader2, Info, Zap,
    AlertTriangle, CheckCircle2, ChevronDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type PropellantInfo = {
    id: string; label: string; co2_kg_per_kg: number;
    toxicity_score: number; ozone_impact: string;
};

type EsgResult = {
    overall_esg_score: number;
    overall_esg_grade: string;
    grade_color: string;
    environmental_breakdown: {
        carbon: {
            total_co2_tons: number; launch_co2_tons: number;
            bc_co2_equiv_tons: number; manufacturing_co2_tons: number;
            propellant_label: string; propellant_fuel_kg: number;
            toxicity_score: number; ozone_impact: string;
            equivalents: { car_years: number; tree_years_to_offset: number };
        };
        debris: {
            score: number; effective_decay_years: number;
            un_compliant: boolean; compliance: string; zone: string;
        };
    };
    subscores: { environmental: number; social: number; governance: number };
    recommendations: { title: string; detail: string; impact: string }[];
    summary: {
        total_co2_tons: number; debris_compliance: string;
        un_25yr_compliant: boolean; deorbit_years: number;
    };
};

// ─── ESG Donut Chart (Canvas) ─────────────────────────────────────────────────

function GradeDonut({ score, grade, color }: { score: number; grade: string; color: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const W = canvas.width = canvas.offsetWidth * 2;
        const H = canvas.height = canvas.offsetHeight * 2;
        const cx = W / 2, cy = H / 2;
        const R = Math.min(cx, cy) * 0.82;
        const r = R * 0.62;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (score / 100) * 2 * Math.PI;
        ctx.clearRect(0, 0, W, H);
        // Track
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, 2 * Math.PI);
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = (R - r);
        ctx.stroke();
        // Fill
        ctx.beginPath();
        ctx.arc(cx, cy, R, startAngle, endAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = (R - r);
        ctx.lineCap = "round";
        ctx.stroke();
        // Grade text
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.round(R * 0.6)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(grade, cx, cy - R * 0.12);
        ctx.fillStyle = "#64748B";
        ctx.font = `${Math.round(R * 0.22)}px monospace`;
        ctx.fillText(`${score.toFixed(0)}/100`, cx, cy + R * 0.25);
    }, [score, grade, color]);
    return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-mono font-semibold">{value.toFixed(0)}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={cn(
                    "relative w-8 h-4 rounded-full transition-colors",
                    value ? "bg-emerald-500" : "bg-white/10"
                )}
            >
                <span className={cn(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all",
                    value ? "left-4" : "left-0.5"
                )} />
            </button>
        </div>
    );
}

// ─── Slider Row ───────────────────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, unit, format, onChange, color = "#8B5CF6" }: {
    label: string; value: number; min: number; max: number; step: number; unit: string;
    format?: (v: number) => string; onChange: (v: number) => void; color?: string;
}) {
    const display = format ? format(value) : value.toLocaleString();
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">{label}</span>
                <span className="text-white font-mono font-semibold">{display} {!format ? unit : ""}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                              [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full"
                style={{ accentColor: color }} />
        </div>
    );
}

// ─── Impact Badge ─────────────────────────────────────────────────────────────

const impactColors: Record<string, string> = {
    High: "text-red-400 border-red-500/30 bg-red-500/10",
    Medium: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    Low: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EsgAssessorPage() {
    // Inputs
    const [mass, setMass] = useState(100);
    const [propellant, setPropellant] = useState("kerosene_rp1");
    const [vehicleClass, setVehicleClass] = useState("medium");
    const [altitude, setAltitude] = useState(550);
    const [hasDeorbit, setHasDeorbit] = useState(false);
    const [lifetime, setLifetime] = useState(5);
    const [hasSolar, setHasSolar] = useState(true);
    const [benefitScore, setBenefitScore] = useState(70);

    // State
    const [propellants, setPropellants] = useState<PropellantInfo[]>([]);
    const [result, setResult] = useState<EsgResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    // Fetch propellant list
    useEffect(() => {
        const fetchPropellants = async () => {
            try {
                const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
                const { data: { session } } = await supabase.auth.getSession();
                const resp = await fetch(`${gatewayUrl}/api/v1/esg/propellants`, {
                    headers: { Authorization: `Bearer ${session?.access_token || ""}` },
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setPropellants(data.propellants || []);
                }
            } catch { /* silent */ }
        };
        fetchPropellants();
    }, [supabase]);

    const handleAssess = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const resp = await fetch(`${gatewayUrl}/api/v1/esg/assess`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || ""}` },
                body: JSON.stringify({
                    satellite_mass_kg: mass,
                    propellant_type: propellant,
                    launch_vehicle_class: vehicleClass,
                    altitude_km: altitude,
                    has_deorbit_system: hasDeorbit,
                    expected_lifetime_years: lifetime,
                    has_solar_power: hasSolar,
                    mission_benefit_score: benefitScore,
                }),
            });
            if (!resp.ok) throw new Error(`Server error ${resp.status}`);
            const data: EsgResult = await resp.json();
            setResult(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [mass, propellant, vehicleClass, altitude, hasDeorbit, lifetime, hasSolar, benefitScore, supabase]);

    const selectedProp = propellants.find((p) => p.id === propellant);

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0">
                <Link href="/dashboard" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-emerald-400" />
                    <h1 className="text-white font-semibold text-sm">ESG Assessor</h1>
                </div>
                <span className="ml-auto text-[10px] text-slate-600 font-mono hidden sm:block">
                    Environmental · Social · Governance
                </span>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Inputs */}
                <div className="w-72 flex-shrink-0 border-r border-white/5 overflow-y-auto p-4 space-y-4">

                    {/* Propellant */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Propellant Type</p>
                        <div className="relative">
                            <select value={propellant} onChange={(e) => setPropellant(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white
                                               appearance-none outline-none focus:border-emerald-500/50 cursor-pointer">
                                {propellants.length > 0
                                    ? propellants.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)
                                    : <>
                                        <option value="kerosene_rp1">Kerosene (RP-1)</option>
                                        <option value="methane_ch4">Liquid Methane (CH₄)</option>
                                        <option value="hydrogen_lh2">Liquid Hydrogen (LH₂)</option>
                                        <option value="hydrazine_n2h4">Hydrazine (N₂H₄)</option>
                                        <option value="solid_srb">Solid Rocket Booster</option>
                                        <option value="xenon_ion">Xenon (Ion Thruster)</option>
                                    </>
                                }
                            </select>
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                        </div>
                        {selectedProp && (
                            <div className="mt-1 flex gap-2 flex-wrap">
                                <span className="text-[9px] text-slate-600">
                                    CO₂: {selectedProp.co2_kg_per_kg} kg/kg
                                </span>
                                <span className="text-[9px] text-slate-600">
                                    Toxicity: {"●".repeat(selectedProp.toxicity_score)}{"○".repeat(5 - selectedProp.toxicity_score)}
                                </span>
                                <span className="text-[9px] text-slate-600">
                                    Ozone: {selectedProp.ozone_impact}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Launch Vehicle */}
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Launch Vehicle Class</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {[
                                { id: "small", label: "Small" },
                                { id: "medium", label: "Medium" },
                                { id: "heavy", label: "Heavy" },
                                { id: "super_heavy", label: "Super Heavy" },
                            ].map((v) => (
                                <button key={v.id} onClick={() => setVehicleClass(v.id)}
                                    className={cn(
                                        "py-1.5 rounded-lg text-[10px] border transition-all",
                                        vehicleClass === v.id
                                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                            : "border-white/10 text-slate-500 hover:border-white/20"
                                    )}>
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mission Parameters</p>
                        <SliderRow label="Satellite Mass" value={mass} min={1} max={10_000} step={5} unit="kg" onChange={setMass} />
                        <SliderRow label="Orbital Altitude" value={altitude} min={100} max={36_000} step={50} unit="km" onChange={setAltitude} />
                        <SliderRow label="Mission Lifetime" value={lifetime} min={0.5} max={25} step={0.5} unit="yrs" onChange={setLifetime} />
                        <SliderRow label="Social Benefit" value={benefitScore} min={0} max={100} step={1} unit=""
                            format={(v) => `${v}%`} color="#10B981" onChange={setBenefitScore} />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 border border-white/5 rounded-xl p-3 bg-white/2">
                        <Toggle value={hasDeorbit} onChange={setHasDeorbit} label="Active Deorbit System / Drag Sail" />
                        <Toggle value={hasSolar} onChange={setHasSolar} label="Solar Power (not nuclear/battery)" />
                    </div>

                    {/* Assess Button */}
                    <button onClick={handleAssess} disabled={isLoading}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm
                                       hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]
                                       flex items-center justify-center gap-2">
                        {isLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Assessing...</>
                        ) : (
                            <><Leaf className="h-4 w-4" /> Assess ESG</>
                        )}
                    </button>

                    {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                </div>

                {/* Right: Results */}
                <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 gap-4">
                    {result ? (
                        <>
                            {/* Top row: Donut + subscores */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Grade Donut */}
                                <div className="flex-shrink-0 w-full sm:w-48 h-48 flex flex-col items-center gap-2">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">ESG Grade</p>
                                    <div className="flex-1 w-full">
                                        <GradeDonut
                                            score={result.overall_esg_score}
                                            grade={result.overall_esg_grade}
                                            color={result.grade_color}
                                        />
                                    </div>
                                </div>

                                {/* Subscores + Summary */}
                                <div className="flex-1 space-y-3">
                                    <div className="rounded-2xl border border-white/8 bg-white/3 p-3 space-y-2.5">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Score Breakdown</p>
                                        <ScoreBar label="Environmental (50%)" value={result.subscores.environmental} color="#10B981" />
                                        <ScoreBar label="Social (30%)" value={result.subscores.social} color="#3B82F6" />
                                        <ScoreBar label="Governance (20%)" value={result.subscores.governance} color="#8B5CF6" />
                                    </div>

                                    {/* Key flags */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className={cn(
                                            "px-3 py-2 rounded-xl border text-center",
                                            result.summary.un_25yr_compliant
                                                ? "border-emerald-500/20 bg-emerald-500/5"
                                                : "border-red-500/20 bg-red-500/5"
                                        )}>
                                            {result.summary.un_25yr_compliant
                                                ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-0.5" />
                                                : <AlertTriangle className="h-4 w-4 text-red-400 mx-auto mb-0.5" />}
                                            <p className={cn("text-[9px] font-bold",
                                                result.summary.un_25yr_compliant ? "text-emerald-400" : "text-red-400")}>
                                                UN 25-yr Rule
                                            </p>
                                            <p className="text-[9px] text-slate-600">
                                                {result.summary.un_25yr_compliant ? "Compliant" : "VIOLATION"}
                                            </p>
                                        </div>
                                        <div className="px-3 py-2 rounded-xl border border-white/8 bg-white/3 text-center">
                                            <Zap className="h-4 w-4 text-orange-400 mx-auto mb-0.5" />
                                            <p className="text-orange-400 text-[9px] font-bold">
                                                {result.summary.total_co2_tons.toFixed(1)}t CO₂
                                            </p>
                                            <p className="text-[9px] text-slate-600">Carbon Footprint</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Carbon + Debris detail */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Carbon */}
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-3 space-y-2">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        Carbon Footprint (LCA)
                                    </p>
                                    {[
                                        { label: "Launch Emissions", value: `${result.environmental_breakdown.carbon.launch_co2_tons.toFixed(1)}t`, color: "text-orange-400" },
                                        { label: "Black Carbon (CO₂-eq)", value: `${result.environmental_breakdown.carbon.bc_co2_equiv_tons.toFixed(1)}t`, color: "text-red-400" },
                                        { label: "Manufacturing", value: `${result.environmental_breakdown.carbon.manufacturing_co2_tons.toFixed(1)}t`, color: "text-yellow-400" },
                                        { label: "Total", value: `${result.environmental_breakdown.carbon.total_co2_tons.toFixed(1)}t`, color: "text-white font-bold" },
                                    ].map((row) => (
                                        <div key={row.label} className="flex justify-between text-[10px]">
                                            <span className="text-slate-500">{row.label}</span>
                                            <span className={row.color}>{row.value}</span>
                                        </div>
                                    ))}
                                    <div className="pt-1 border-t border-white/5 text-[9px] text-slate-600 space-y-0.5">
                                        <p>≈ {result.environmental_breakdown.carbon.equivalents.car_years.toFixed(0)} car-years of driving</p>
                                        <p>≈ {result.environmental_breakdown.carbon.equivalents.tree_years_to_offset.toFixed(0)} tree-years to offset</p>
                                        <p>Propellant: {result.environmental_breakdown.carbon.propellant_label}</p>
                                    </div>
                                </div>

                                {/* Debris */}
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-3 space-y-2">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Space Debris Risk</p>
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl font-black font-mono"
                                            style={{ color: result.environmental_breakdown.debris.score > 60 ? "#EF4444" : result.environmental_breakdown.debris.score > 30 ? "#F59E0B" : "#10B981" }}>
                                            {result.environmental_breakdown.debris.score.toFixed(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-white font-semibold">{result.environmental_breakdown.debris.compliance}</p>
                                            <p className="text-[9px] text-slate-600">{result.environmental_breakdown.debris.zone}</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${result.environmental_breakdown.debris.score}%`,
                                                backgroundColor: result.environmental_breakdown.debris.score > 60 ? "#EF4444" : result.environmental_breakdown.debris.score > 30 ? "#F59E0B" : "#10B981"
                                            }} />
                                    </div>
                                    <div className="text-[9px] text-slate-600 space-y-0.5">
                                        <p>Estimated deorbit: {result.environmental_breakdown.debris.effective_decay_years >= 9999 ? "Never (natural)" : `${result.environmental_breakdown.debris.effective_decay_years} years`}</p>
                                        <p>UN 25yr rule: {result.environmental_breakdown.debris.un_compliant ? "✓ Compliant" : "✗ Violation"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            {result.recommendations.length > 0 && (
                                <div className="rounded-2xl border border-white/8 bg-white/3 p-3 space-y-2">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        AI Recommendations to Improve Grade
                                    </p>
                                    <div className="space-y-2">
                                        {result.recommendations.map((rec, i) => (
                                            <div key={i} className="flex gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/2">
                                                <span className="text-emerald-400 font-bold text-sm flex-shrink-0">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-xs text-white font-semibold">{rec.title}</p>
                                                        <span className={cn("text-[9px] border rounded px-1 py-px", impactColors[rec.impact] || impactColors.Low)}>
                                                            {rec.impact}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{rec.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
                            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/10">
                                <Leaf className="h-16 w-16 text-emerald-400/30" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm font-medium">ESG Life Cycle Assessment</p>
                                <p className="text-slate-600 text-xs mt-1">Configure your mission and click Assess ESG</p>
                            </div>
                            <div className="text-[10px] text-slate-700 space-y-1">
                                <p>• Carbon footprint: launch + manufacturing LCA</p>
                                <p>• Debris risk based on altitude + deorbit system</p>
                                <p>• UN IADC 25-year compliance check</p>
                                <p>• AI recommendations to improve grade</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
