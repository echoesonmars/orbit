"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Loader2, CheckCircle2, XCircle, Download, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Factor = { name: string; impact: number; type: string };

interface ReportModalProps {
    onClose: () => void;
    predictionData: {
        bbox: number[];
        target: string;
        value_usd: number;
        confidence: number;
        area_km2: number;
        factors: Factor[];
        cloud_cover_used: number;
        weather_source: string;
        nasa?: any;
    };
}

type GenerationStatus = "idle" | "starting" | "processing" | "completed" | "failed";

export function ReportModal({ onClose, predictionData }: ReportModalProps) {
    const [status, setStatus] = useState<GenerationStatus>("idle");
    const [taskId, setTaskId] = useState<string | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    // ── Start generation ─────────────────────────────────────────────────────
    const startGeneration = useCallback(async () => {
        setStatus("starting");
        setError(null);

        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";

            const resp = await fetch(`${gatewayUrl}/api/v1/reports/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(predictionData),
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || `Server error ${resp.status}`);
            }

            const data = await resp.json();
            setTaskId(data.task_id);
            setStatus("processing");
        } catch (e: any) {
            setError(e.message || "Failed to start generation");
            setStatus("failed");
        }
    }, [predictionData, supabase]);

    // ── Poll for status ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!taskId || status !== "processing") return;

        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";

        const poll = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token || "";

                const resp = await fetch(`${gatewayUrl}/api/v1/reports/${taskId}/status`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!resp.ok) return;

                const data = await resp.json();
                if (data.status === "completed" && data.file_url) {
                    setFileUrl(data.file_url);
                    setStatus("completed");
                } else if (data.status === "failed") {
                    setError("Report generation failed on the server.");
                    setStatus("failed");
                }
            } catch { /* ignore poll errors */ }
        };

        const interval = setInterval(poll, 2500);
        poll(); // immediate first poll
        return () => clearInterval(interval);
    }, [taskId, status, supabase]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 rounded-3xl border border-white/10 bg-[#0A0E17] p-6 shadow-2xl">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-emerald-500/10">
                        <FileText className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-sm">Generate PDF Report</h2>
                        <p className="text-xs text-slate-500">Multi-page analytical report with charts</p>
                    </div>
                </div>

                {/* Content */}
                {status === "idle" && (
                    <div className="space-y-4">
                        {/* Preview of what's included */}
                        <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-2">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Report Includes</p>
                            {[
                                "Executive Summary (GPT-4)",
                                "Price Factor Waterfall Chart",
                                "Confidence Gauge",
                                "NASA Live Intelligence Data",
                                "Methodology & Disclaimer",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>

                        {/* Value summary */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-purple-500/5 border border-purple-500/15">
                            <span className="text-xs text-slate-500">Estimated Value</span>
                            <span className="text-sm font-bold text-white">
                                ${predictionData.value_usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                            </span>
                        </div>

                        <button
                            onClick={startGeneration}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            Generate Report
                        </button>
                    </div>
                )}

                {(status === "starting" || status === "processing") && (
                    <div className="flex flex-col items-center gap-4 py-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
                                <Loader2 className="h-7 w-7 text-emerald-400 animate-spin" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-white font-semibold text-sm">
                                {status === "starting" ? "Starting generation..." : "Generating report..."}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {status === "processing"
                                    ? "Building charts, fetching AI summary, compiling PDF..."
                                    : "Connecting to server..."}
                            </p>
                        </div>
                        {/* Progress dots */}
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {status === "completed" && fileUrl && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-semibold">Report Ready!</p>
                            <p className="text-xs text-slate-500 mt-1">Your PDF has been generated and is ready to download.</p>
                        </div>
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                    </div>
                )}

                {status === "failed" && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-red-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-semibold">Generation Failed</p>
                            <p className="text-xs text-red-400 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => { setStatus("idle"); setError(null); }}
                            className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
