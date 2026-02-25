"use client";

import Link from "next/link";
import { Crosshair, TrendingUp, FileText, Plus } from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { cn } from "@/lib/utils";

const ACTIONS = [
    {
        label: "New Mission",
        description: "Design a mission from scratch",
        icon: Plus,
        href: "/dashboard/mission-designer",
        accent: "text-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]",
        border: "hover:border-cyan-500/40",
        active: true,
    },
    {
        label: "Analyze Area",
        description: "Run Capture Value Predictor",
        icon: Crosshair,
        href: "/dashboard/value-predictor",
        accent: "text-purple-400 hover:shadow-[0_0_20px_rgba(157,78,221,0.3)]",
        border: "hover:border-purple-500/40",
        active: false,
    },
    {
        label: "Generate Report",
        description: "Export PDF summary",
        icon: FileText,
        href: "/dashboard/reports",
        accent: "text-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        border: "hover:border-emerald-500/40",
        active: false,
    },
];

export function QuickActionsPanel() {
    return (
        <div className="absolute top-16 right-4 z-10 flex flex-col gap-2 w-56">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">
                Quick Launch
            </p>
            {ACTIONS.map((action) => (
                <Link
                    key={action.label}
                    href={action.href}
                    className={cn(
                        "relative flex items-center gap-3 rounded-xl p-3 overflow-hidden",
                        "bg-slate-900/60 backdrop-blur-md border border-white/10",
                        "transition-all duration-200 group",
                        action.border
                    )}
                >
                    {action.active && <BorderBeam size={120} duration={8} />}
                    <div className={cn("p-1.5 rounded-lg bg-white/5 flex-shrink-0", action.accent)}>
                        <action.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className={cn("text-sm font-semibold leading-tight", action.accent)}>
                            {action.label}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{action.description}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
