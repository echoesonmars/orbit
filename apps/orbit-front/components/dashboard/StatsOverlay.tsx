"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Activity, Target, FileBarChart, TrendingUp, Loader2 } from "lucide-react";

type DashboardStats = {
    missionsTotal: number;
    missionsToday: number;
    predictionsCount: number;
    avgScore: number;
};

type StatConfig = {
    key: keyof DashboardStats;
    labelKey: string;
    unit: string;
    icon: typeof Target;
    color: string;
    glow: string;
};

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

function StatCard({
    stat,
    value,
    label,
}: {
    stat: StatConfig;
    value: number;
    label: string;
}) {
    const count = useCountUp(value);
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
                <p className="text-[11px] text-slate-400 leading-tight">{label}</p>
            </div>
        </Card>
    );
}

export function StatsOverlay() {
    const t = useTranslations("Dashboard.stats");
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchStats() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setStats({ missionsTotal: 0, missionsToday: 0, predictionsCount: 0, avgScore: 0 });
                    return;
                }

                const todayStart = new Date();
                todayStart.setUTCHours(0, 0, 0, 0);
                const todayIso = todayStart.toISOString();

                const [missionsRes, missionsTodayRes, predictionsRes] = await Promise.all([
                    supabase.from("missions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
                    supabase.from("missions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", todayIso),
                    supabase.from("predictions").select("value_score").limit(1000),
                ]);

                const missionsTotal = missionsRes.count ?? 0;
                const missionsToday = missionsTodayRes.count ?? 0;
                const predictionsData = predictionsRes.data ?? [];
                const predictionsCount = predictionsData.length;
                const avgScore =
                    predictionsCount > 0
                        ? Math.round(
                              predictionsData.reduce((acc, p) => acc + Number(p.value_score), 0) / predictionsCount
                          )
                        : 0;

                setStats({
                    missionsTotal,
                    missionsToday,
                    predictionsCount,
                    avgScore,
                });
            } catch (error) {
                console.error("[StatsOverlay] Error fetching stats:", error);
                setStats({ missionsTotal: 0, missionsToday: 0, predictionsCount: 0, avgScore: 0 });
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const STATS_CONFIG: StatConfig[] = [
        { key: "missionsTotal", labelKey: t("missions"), unit: "", icon: Target, color: "text-cyan-400", glow: "shadow-[0_0_12px_rgba(0,240,255,0.15)]" },
        { key: "missionsToday", labelKey: t("missionsToday"), unit: "", icon: TrendingUp, color: "text-purple-400", glow: "shadow-[0_0_12px_rgba(157,78,221,0.15)]" },
        { key: "predictionsCount", labelKey: t("predictions"), unit: "", icon: FileBarChart, color: "text-emerald-400", glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]" },
        { key: "avgScore", labelKey: t("avgScore"), unit: "%", icon: Activity, color: "text-amber-400", glow: "shadow-[0_0_12px_rgba(251,191,36,0.15)]" },
    ];

    if (loading) {
        return (
            <div className="absolute bottom-20 md:bottom-6 right-4 z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10 p-4 min-w-[150px]">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    <span className="text-xs text-slate-400">{t("loading")}</span>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="absolute bottom-20 md:bottom-6 right-4 z-10 flex flex-col gap-2">
            {STATS_CONFIG.map((statConfig) => (
                <StatCard
                    key={statConfig.key}
                    stat={statConfig}
                    value={stats[statConfig.key]}
                    label={statConfig.labelKey}
                />
            ))}
        </div>
    );
}
