"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Crosshair, TrendingUp, FileText, Plus, Rocket } from "lucide-react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/lib/store/mapStore";

export function QuickActionsPanel() {
    const pathname = usePathname();
    const t = useTranslations("Dashboard.quickActions");
    const { bbox } = useMapStore();

    // Build hrefs with optional bbox params
    const bboxParams = bbox
        ? `?swLat=${bbox.southWest.lat.toFixed(5)}&swLng=${bbox.southWest.lng.toFixed(5)}&neLat=${bbox.northEast.lat.toFixed(5)}&neLng=${bbox.northEast.lng.toFixed(5)}`
        : "";

    const missionDesignerHref = `/dashboard/mission-designer${bboxParams}`;
    const valuePredictorHref = `/dashboard/value-predictor${bboxParams}`;

    const ACTIONS = [
        {
            label: t("newMission.title"),
            description: t("newMission.desc"),
            icon: Plus,
            href: missionDesignerHref,
            accent: "text-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]",
            border: "hover:border-cyan-500/40",
            active: true,
        },
        {
            label: t("analyze.title"),
            description: t("analyze.desc"),
            icon: Crosshair,
            href: valuePredictorHref,
            accent: "text-purple-400 hover:shadow-[0_0_20px_rgba(157,78,221,0.3)]",
            border: "hover:border-purple-500/40",
            active: false,
        },
        {
            label: t("report.title"),
            description: t("report.desc"),
            icon: FileText,
            href: "/dashboard/reports",
            accent: "text-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
            border: "hover:border-emerald-500/40",
            active: false,
        },
        {
            label: "Launches",
            description: "Track & predict delays",
            icon: Rocket,
            href: "/dashboard/launch-delay",
            accent: "text-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]",
            border: "hover:border-orange-500/40",
            active: false,
        },
    ];

    return (
        <div className="absolute top-16 right-4 z-10 flex flex-col gap-2 w-56">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">
                {t("title")}
            </p>
            {ACTIONS.map((action) => {
                const isActive = pathname.includes("/mission-designer") && action.href.includes("/mission-designer") || pathname.includes(action.href);
                return (
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
                        {isActive && <BorderBeam size={120} duration={8} />}
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
                );
            })}
        </div>
    );
}


