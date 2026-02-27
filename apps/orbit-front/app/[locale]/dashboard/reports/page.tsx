"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ChevronLeft, FileText, Download, Clock, CheckCircle2,
    XCircle, Loader2, RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ReportRecord = {
    id: string;
    status: "processing" | "completed" | "failed";
    file_url: string | null;
    report_data: any;
    created_at: string;
};

const STATUS_CONFIG = {
    processing: {
        icon: Loader2,
        label: "Processing",
        className: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
        iconClass: "animate-spin",
    },
    completed: {
        icon: CheckCircle2,
        label: "Completed",
        className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        iconClass: "",
    },
    failed: {
        icon: XCircle,
        label: "Failed",
        className: "text-red-400 bg-red-500/10 border-red-500/20",
        iconClass: "",
    },
};

export default function ReportsPage() {
    const [reports, setReports] = useState<ReportRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setReports([]);
                return;
            }
            const { data, error } = await supabase
                .from("generated_reports")
                .select("id, status, file_url, report_data, created_at")
                .order("created_at", { ascending: false })
                .limit(50);

            if (!error && data) {
                setReports(data as ReportRecord[]);
            }
        } catch (e) {
            console.error("Failed to fetch reports", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const formatDate = (iso: string) => {
        try {
            return new Intl.DateTimeFormat("en-US", {
                year: "numeric", month: "short", day: "2-digit",
                hour: "2-digit", minute: "2-digit",
            }).format(new Date(iso));
        } catch { return iso; }
    };

    const getReportSummary = (data: any) => {
        if (!data) return "—";
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        const value = parsed.value_usd ? `$${Number(parsed.value_usd).toLocaleString()}` : "—";
        const target = parsed.target ? parsed.target.charAt(0).toUpperCase() + parsed.target.slice(1) : "Unknown";
        return `${target} · ${value}`;
    };

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0">
                <Link href="/dashboard" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-400" />
                    <h1 className="text-white font-semibold text-sm">Report History</h1>
                </div>
                <button
                    onClick={fetchReports}
                    className="ml-auto p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                        <p className="text-slate-500 text-sm">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-3xl border border-white/5 bg-white/2">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-emerald-400/40" />
                        </div>
                        <div className="text-center">
                            <p className="text-slate-400 font-medium text-sm">No reports yet</p>
                            <p className="text-slate-600 text-xs mt-1">
                                Generate a report from the{" "}
                                <Link href="/dashboard/value-predictor" className="text-emerald-400 hover:underline">
                                    Value Predictor
                                </Link>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-600 font-mono uppercase tracking-wider px-1">
                            {reports.length} report{reports.length !== 1 ? "s" : ""}
                        </p>

                        {reports.map((report) => {
                            const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.processing;
                            const Icon = cfg.icon;
                            return (
                                <div
                                    key={report.id}
                                    className="flex items-center gap-4 px-4 py-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all"
                                >
                                    {/* Status icon */}
                                    <div className={cn(
                                        "flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center",
                                        cfg.className
                                    )}>
                                        <Icon className={cn("h-4 w-4", cfg.iconClass)} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {getReportSummary(report.report_data)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Clock className="h-3 w-3 text-slate-600 flex-shrink-0" />
                                            <span className="text-xs text-slate-500">{formatDate(report.created_at)}</span>
                                            <span className="text-slate-700">·</span>
                                            <span className={cn(
                                                "text-[10px] font-medium uppercase tracking-wider",
                                                cfg.className.split(" ")[0]
                                            )}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-700 font-mono mt-0.5 truncate">
                                            {report.id}
                                        </p>
                                    </div>

                                    {/* Download */}
                                    {report.status === "completed" && report.file_url ? (
                                        <a
                                            href={report.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            PDF
                                        </a>
                                    ) : (
                                        <div className="flex-shrink-0 px-3 py-2 rounded-xl border border-white/5 text-slate-600 text-xs">
                                            {report.status === "processing" ? "Generating..." : "–"}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
