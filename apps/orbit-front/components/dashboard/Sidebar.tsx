"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Globe,
    Crosshair,
    TrendingUp,
    FileText,
    Satellite,
    BarChart3,
    BadgeCheck,
    AlertTriangle,
    Cpu,
    Settings,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
    { id: "map", label: "Interactive Map", icon: Globe, href: "/dashboard" },
    { id: "mission-designer", label: "Mission Designer", icon: Crosshair, href: "/dashboard/mission-designer" },
    { id: "value-predictor", label: "Value Predictor", icon: TrendingUp, href: "/dashboard/value-predictor" },
    { id: "reports", label: "Report Generator", icon: FileText, href: "/dashboard/reports" },
    { id: "launch-delay", label: "Launch Delay Predictor", icon: Satellite, href: "/dashboard/launch-delay" },
    { id: "orbit-optimizer", label: "Orbit Optimizer", icon: BarChart3, href: "/dashboard/orbit-optimizer" },
    { id: "esg", label: "ESG Assessor", icon: BadgeCheck, href: "/dashboard/esg" },
    { id: "failure-forensics", label: "Failure Forensics", icon: AlertTriangle, href: "/dashboard/failure-forensics" },
    { id: "scenario-simulator", label: "Scenario Simulator", icon: Cpu, href: "/dashboard/scenario-simulator" },
];

const BOTTOM_ITEMS = [
    { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname.endsWith("/dashboard");
        return pathname.includes(href);
    };

    return (
        <TooltipProvider delayDuration={100}>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col h-screen sticky top-0 z-20",
                    "bg-slate-900/60 backdrop-blur-md border-r border-white/10",
                    "transition-all duration-300 ease-in-out",
                    collapsed ? "w-16" : "w-56"
                )}
            >
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
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-all duration-200 group relative",
                                            active
                                                ? "bg-cyan-400/10 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {active && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r-full" />
                                        )}
                                        <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-cyan-400")} />
                                        {!collapsed && (
                                            <span className="truncate">{item.label}</span>
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                {collapsed && (
                                    <TooltipContent side="right" className="bg-slate-800 border-white/10 text-white">
                                        {item.label}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* Bottom Items */}
                <div className="py-4 px-2 border-t border-white/10 space-y-1">
                    {BOTTOM_ITEMS.map((item) => (
                        <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            </TooltipTrigger>
                            {collapsed && (
                                <TooltipContent side="right" className="bg-slate-800 border-white/10 text-white">
                                    {item.label}
                                </TooltipContent>
                            )}
                        </Tooltip>
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
                                <span className="text-xs">Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2">
                {NAV_ITEMS.slice(0, 5).map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-md transition-all",
                                active ? "text-cyan-400" : "text-slate-500"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium truncate max-w-[48px] text-center leading-none">
                                {item.label.split(" ")[0]}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </TooltipProvider>
    );
}
