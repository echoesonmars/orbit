"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, Satellite, Zap, Target } from "lucide-react";

const STATS = [
    {
        label: "Missions Today",
        value: 12,
        unit: "",
        icon: Target,
        color: "text-cyan-400",
        glow: "shadow-[0_0_12px_rgba(0,240,255,0.15)]",
    },
    {
        label: "Active Satellites",
        value: 847,
        unit: "",
        icon: Satellite,
        color: "text-purple-400",
        glow: "shadow-[0_0_12px_rgba(157,78,221,0.15)]",
    },
    {
        label: "API Calls / hr",
        value: 2341,
        unit: "",
        icon: Zap,
        color: "text-emerald-400",
        glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    },
    {
        label: "Avg Score",
        value: 87,
        unit: "%",
        icon: Activity,
        color: "text-amber-400",
        glow: "shadow-[0_0_12px_rgba(251,191,36,0.15)]",
    },
];

function useCountUp(target: number, duration = 1200) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return count;
}

function StatCard({ stat }: { stat: (typeof STATS)[number] }) {
    const count = useCountUp(stat.value);
    return (
        <Card
            className={cn(
                "bg-slate-900/60 backdrop-blur-md border border-white/10 p-3",
                "rounded-xl flex items-center gap-3 min-w-[150px]",
                stat.glow
            )}
        >
            <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                <stat.icon className="h-4 w-4" />
            </div>
            <div>
                <p className={cn("text-lg font-bold font-mono tabular-nums", stat.color)}>
                    {count.toLocaleString()}{stat.unit}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">{stat.label}</p>
            </div>
        </Card>
    );
}

export function StatsOverlay() {
    return (
        <div className="absolute bottom-20 md:bottom-6 right-4 z-10 flex flex-col gap-2">
            {STATS.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
            ))}
        </div>
    );
}
