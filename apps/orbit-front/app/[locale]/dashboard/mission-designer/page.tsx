"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Send, Bot, Loader2, Satellite, Target, Maximize, AlertCircle, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MissionSpec = {
    orbit_type: string;
    resolution_meters: number;
    sensor_type: string;
    explanation: string;
};

export default function MissionDesignerPage() {
    const t = useTranslations("Dashboard.missionDesigner");
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [spec, setSpec] = useState<MissionSpec | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setSpec(null);

        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';

            const response = await fetch(`${gatewayUrl}/api/v1/mission-designer/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error(`Failed to generate mission. Server responded with ${response.status}`);
            }

            const data = await response.json();
            setSpec(data);

        } catch (err: any) {
            console.error("Mission Designer error:", err);
            setError(err.message || "An unexpected error occurred while generating the mission.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl overflow-y-auto no-scrollbar pointer-events-auto">
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 relative">
                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="absolute top-4 left-4 md:top-8 md:left-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>

                {/* Header Section */}
                <div className="text-center mb-10 mt-8 md:mt-0">
                    <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4">
                        <Bot className="h-8 w-8 text-purple-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold font-sans text-white mb-3">{t("title")}</h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Input Section */}
                <div className="max-w-3xl mx-auto mb-12">
                    <form onSubmit={handleGenerate} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative bg-slate-900 border border-white/10 rounded-3xl flex flex-col sm:flex-row items-end sm:items-center p-2 gap-2 shadow-2xl">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={t("placeholder")}
                                className="w-full bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none px-4 py-4 min-h-[60px] max-h-[150px] text-sm md:text-base"
                                rows={2}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleGenerate(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || prompt.trim().length === 0}
                                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl p-4 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] disabled:shadow-none flex-shrink-0 m-1"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {isLoading && (
                    <div className="mt-12 text-center flex flex-col items-center justify-center animate-pulse">
                        <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                        <p className="text-purple-300 font-mono text-sm tracking-widest uppercase">{t("calculating")}</p>
                    </div>
                )}

                {!isLoading && spec && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Card 1: Orbit */}
                            <div className="bg-slate-800/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-white to-transparent rounded-full w-32 h-32 -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
                                <Target className="h-8 w-8 text-cyan-400 mb-4" />
                                <h3 className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1">{t("cardOrbit")}</h3>
                                <p className="text-white font-semibold text-lg">{spec.orbit_type}</p>
                            </div>

                            {/* Card 2: Sensor */}
                            <div className="bg-slate-800/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-white to-transparent rounded-full w-32 h-32 -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
                                <Satellite className="h-8 w-8 text-purple-400 mb-4" />
                                <h3 className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1">{t("cardSensor")}</h3>
                                <p className="text-white font-semibold text-lg">{spec.sensor_type}</p>
                            </div>

                            {/* Card 3: Resolution */}
                            <div className="bg-slate-800/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-bl from-white to-transparent rounded-full w-32 h-32 -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
                                <Maximize className="h-8 w-8 text-emerald-400 mb-4" />
                                <h3 className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-1">{t("cardResolution")}</h3>
                                <p className="text-white font-semibold text-lg">{spec.resolution_meters} meters</p>
                            </div>
                        </div>

                        {/* Reasoning / Explanation panel */}
                        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(147,51,234,0.1)]">
                            <h3 className="text-purple-400 text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                {t("reasoning")}
                            </h3>
                            <p className="text-slate-300 text-base leading-relaxed">
                                {spec.explanation}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
