"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
    Globe,
    Database,
    Crosshair,
    TrendingUp,
    FileText,
    Satellite,
    BarChart3,
    Target,
    AlertTriangle,
    Cpu,
    BadgeCheck,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const t = useTranslations("Dashboard.sidebar");

    const NAV_ITEMS = [
        { id: "map", label: t("map"), icon: Globe, href: "/dashboard" },
        { id: "data-hub", label: t("dataHub"), icon: Database, href: "/dashboard/data-hub" },
        { id: "mission-designer", label: t("missionDesigner"), icon: Crosshair, href: "/dashboard/mission-designer" },
        { id: "value-predictor", label: t("valuePredictor"), icon: TrendingUp, href: "/dashboard/value-predictor" },
        { id: "reports", label: t("reports"), icon: FileText, href: "/dashboard/reports" },
        { id: "launch-delay", label: t("launchDelay"), icon: Satellite, href: "/dashboard/launch-delay" },
        { id: "orbit-optimizer", label: t("orbitOptimizer"), icon: BarChart3, href: "/dashboard/orbit-optimizer" },
        { id: "orbit-scorer", label: t("orbitScorer"), icon: Target, href: "/dashboard/orbit-scorer" },
        { id: "failure-forensics", label: t("failureForensics"), icon: AlertTriangle, href: "/dashboard/failure-forensics" },
        { id: "scenario-simulator", label: t("scenarioSimulator"), icon: Cpu, href: "/dashboard/scenario-simulator" },
        { id: "esg", label: t("esg"), icon: BadgeCheck, href: "/dashboard/esg" },
    ];

    const BOTTOM_ITEMS = [
        { id: "settings", label: t("settings"), icon: Settings, href: "/dashboard/settings" },
    ];

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname.endsWith("/dashboard");
        return pathname.includes(href);
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col h-screen sticky top-0 z-20",
                    "bg-slate-900/60 backdrop-blur-md border-r border-white/10",
                    "transition-all duration-300 ease-in-out",
                    collapsed ? "w-0 min-w-0 overflow-hidden border-r-0" : "w-56"
                )}
            >
                <div className={cn(
                    "flex flex-col h-full min-w-0",
                    collapsed && "opacity-0 pointer-events-none"
                )}>
                {/* Logo */}
                <div className={cn(
                    "flex items-center h-16 px-4 border-b border-white/10",
                    collapsed ? "justify-center" : "gap-3"
                )}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex-shrink-0 flex items-center justify-center">
                        <Satellite className="h-4 w-4 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-white tracking-tight text-sm">OrbitAI</span>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 space-y-1 px-2 overflow-hidden">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-all duration-200 group relative",
                                    active
                                        ? "bg-white/5 text-slate-200"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {active && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/30 rounded-r-full" />
                                )}
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && (
                                    <span className="truncate">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Items */}
                <div className="py-4 px-2 border-t border-white/10 space-y-1">
                    {BOTTOM_ITEMS.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    ))}

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center gap-3 rounded-md px-2 py-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-200"
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <>
                                <ChevronLeft className="h-4 w-4" />
                                <span className="text-xs">{t("collapse")}</span>
                            </>
                        )}
                    </button>
                </div>
                </div>
            </aside>

            {/* Floating "Open sidebar" button when collapsed (desktop only) */}
            {collapsed && (
                <button
                    type="button"
                    onClick={() => setCollapsed(false)}
                    className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-14 items-center justify-center rounded-r-md bg-slate-900/80 backdrop-blur-md border border-l-0 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                    aria-label={t("expand")}
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            )}

            {/* Mobile Bottom Navigation (Scrollable) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex items-center overflow-x-auto overflow-y-hidden px-2 no-scrollbar snap-x">
                <div className="flex items-center gap-2 min-w-max mx-auto px-2">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-all snap-center w-16",
                                    active ? "text-white" : "text-slate-500"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-[10px] font-medium truncate w-full text-center leading-none">
                                    {item.label.split(" ")[0]}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
