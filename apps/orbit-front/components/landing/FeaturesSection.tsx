"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

export default function FeaturesSection() {
    const t = useTranslations("Features");
    const [activeId, setActiveId] = useState(0);

    const modules = [
        {
            id: 0,
            icon: "🌐",
            title: t("modules.dataHub.title"),
            tagline: t("modules.dataHub.tagline"),
            description: t("modules.dataHub.description"),
            color: "#00F0FF",
            bg: "from-[#00F0FF]/10 via-transparent to-transparent",
            stat: { label: t("modules.dataHub.statLabel"), value: t("modules.dataHub.statValue") },
        },
        {
            id: 1,
            icon: "🧠",
            title: t("modules.missionDesigner.title"),
            tagline: t("modules.missionDesigner.tagline"),
            description: t("modules.missionDesigner.description"),
            color: "#9D4EDD",
            bg: "from-[#9D4EDD]/10 via-transparent to-transparent",
            stat: { label: t("modules.missionDesigner.statLabel"), value: t("modules.missionDesigner.statValue") },
        },
        {
            id: 2,
            icon: "💎",
            title: t("modules.captureValuePredictor.title"),
            tagline: t("modules.captureValuePredictor.tagline"),
            description: t("modules.captureValuePredictor.description"),
            color: "#10B981",
            bg: "from-[#10B981]/10 via-transparent to-transparent",
            stat: { label: t("modules.captureValuePredictor.statLabel"), value: t("modules.captureValuePredictor.statValue") },
        },
        {
            id: 3,
            icon: "📄",
            title: t("modules.reportGenerator.title"),
            tagline: t("modules.reportGenerator.tagline"),
            description: t("modules.reportGenerator.description"),
            color: "#00F0FF",
            bg: "from-[#00F0FF]/10 via-transparent to-transparent",
            stat: { label: t("modules.reportGenerator.statLabel"), value: t("modules.reportGenerator.statValue") },
        },
        {
            id: 4,
            icon: "🚀",
            title: t("modules.launchDelayPredictor.title"),
            tagline: t("modules.launchDelayPredictor.tagline"),
            description: t("modules.launchDelayPredictor.description"),
            color: "#EF4444",
            bg: "from-[#EF4444]/10 via-transparent to-transparent",
            stat: { label: t("modules.launchDelayPredictor.statLabel"), value: t("modules.launchDelayPredictor.statValue") },
        },
        {
            id: 5,
            icon: "🛰",
            title: t("modules.orbitOptimizer.title"),
            tagline: t("modules.orbitOptimizer.tagline"),
            description: t("modules.orbitOptimizer.description"),
            color: "#9D4EDD",
            bg: "from-[#9D4EDD]/10 via-transparent to-transparent",
            stat: { label: t("modules.orbitOptimizer.statLabel"), value: t("modules.orbitOptimizer.statValue") },
        },
        {
            id: 6,
            icon: "🎯",
            title: t("modules.orbitSuitabilityScorer.title"),
            tagline: t("modules.orbitSuitabilityScorer.tagline"),
            description: t("modules.orbitSuitabilityScorer.description"),
            color: "#10B981",
            bg: "from-[#10B981]/10 via-transparent to-transparent",
            stat: { label: t("modules.orbitSuitabilityScorer.statLabel"), value: t("modules.orbitSuitabilityScorer.statValue") },
        },
        {
            id: 7,
            icon: "🕵️",
            title: t("modules.failureForensics.title"),
            tagline: t("modules.failureForensics.tagline"),
            description: t("modules.failureForensics.description"),
            color: "#EF4444",
            bg: "from-[#EF4444]/10 via-transparent to-transparent",
            stat: { label: t("modules.failureForensics.statLabel"), value: t("modules.failureForensics.statValue") },
        },
        {
            id: 8,
            icon: "🎲",
            title: t("modules.scenarioSimulator.title"),
            tagline: t("modules.scenarioSimulator.tagline"),
            description: t("modules.scenarioSimulator.description"),
            color: "#00F0FF",
            bg: "from-[#00F0FF]/10 via-transparent to-transparent",
            stat: { label: t("modules.scenarioSimulator.statLabel"), value: t("modules.scenarioSimulator.statValue") },
        },
        {
            id: 9,
            icon: "🌿",
            title: t("modules.esgAssessor.title"),
            tagline: t("modules.esgAssessor.tagline"),
            description: t("modules.esgAssessor.description"),
            color: "#10B981",
            bg: "from-[#10B981]/10 via-transparent to-transparent",
            stat: { label: t("modules.esgAssessor.statLabel"), value: t("modules.esgAssessor.statValue") },
        },
    ];

    const active = modules[activeId];

    return (
        <section id="features" className="relative py-28 px-4 sm:px-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(0,240,255,0.03),transparent)]" />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#9D4EDD]/30 bg-[#9D4EDD]/5 text-xs text-[#9D4EDD] mb-5">
                        {t("badge")}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tighter mb-4">
                        {t("title")}
                    </h2>
                    <p className="text-white/45 text-base max-w-xl mx-auto leading-relaxed">
                        {t("subtitle")}
                    </p>
                </motion.div>

                {/* Pill tabs — wrapping row */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex flex-wrap justify-center gap-2 mb-8"
                >
                    {modules.map((mod) => (
                        <button
                            key={mod.id}
                            onClick={() => setActiveId(mod.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border"
                            style={
                                activeId === mod.id
                                    ? {
                                        background: `${mod.color}18`,
                                        borderColor: `${mod.color}70`,
                                        color: mod.color,
                                        boxShadow: `0 0 12px ${mod.color}25`,
                                    }
                                    : {
                                        background: "transparent",
                                        borderColor: "rgba(255,255,255,0.1)",
                                        color: "rgba(255,255,255,0.5)",
                                    }
                            }
                        >
                            <span>{mod.icon}</span>
                            <span>{mod.title}</span>
                        </button>
                    ))}
                </motion.div>

                {/* Large Feature Showcase Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeId}
                        initial={{ opacity: 0, y: 20, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.99 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="relative rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-2xl overflow-hidden"
                    >
                        {/* Top accent beam */}
                        <div
                            className="absolute top-0 left-0 right-0 h-px"
                            style={{
                                background: `linear-gradient(90deg, transparent 0%, ${active.color}90 30%, ${active.color}90 70%, transparent 100%)`,
                            }}
                        />

                        {/* Background gradient blob */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${active.bg} pointer-events-none`}
                        />

                        {/* Corner glow */}
                        <div
                            className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                            style={{ background: active.color }}
                        />

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-0">
                            {/* LEFT: Main info */}
                            <div className="p-8 md:p-10 md:border-r border-white/8">
                                {/* Module badge */}
                                <div className="flex items-center gap-3 mb-8">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-white/10 bg-white/5 flex-shrink-0"
                                        style={{ boxShadow: `0 0 24px ${active.color}30` }}
                                    >
                                        {active.icon}
                                    </div>
                                    <div>
                                        <div
                                            className="text-xs font-mono tracking-widest uppercase mb-1"
                                            style={{ color: active.color }}
                                        >
                                            Модуль {String(activeId + 1).padStart(2, "0")}
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
                                            {active.title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Tagline */}
                                <p
                                    className="text-sm font-medium mb-4 leading-snug"
                                    style={{ color: active.color }}
                                >
                                    {active.tagline}
                                </p>

                                {/* Description */}
                                <p className="text-white/55 leading-relaxed text-sm md:text-base">
                                    {active.description}
                                </p>

                                {/* CTA */}
                                <button
                                    className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200"
                                    style={{
                                        borderColor: `${active.color}50`,
                                        color: active.color,
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = `${active.color}12`;
                                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${active.color}25`;
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = "transparent";
                                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                                    }}
                                >
                                    Узнать больше
                                    <span>→</span>
                                </button>
                            </div>

                            {/* RIGHT: Visual stat + mini module grid */}
                            <div className="p-8 md:p-10 flex flex-col gap-6">
                                {/* Big stat highlight */}
                                <div
                                    className="rounded-2xl border p-6"
                                    style={{ borderColor: `${active.color}25`, background: `${active.color}08` }}
                                >
                                    <div
                                        className="text-4xl md:text-5xl font-semibold tracking-tighter mb-2 tabular-nums"
                                        style={{ color: active.color }}
                                    >
                                        {active.stat.value}
                                    </div>
                                    <div className="text-xs text-white/40">{active.stat.label}</div>
                                </div>

                                {/* Other modules mini grid */}
                                <div>
                                    <p className="text-xs text-white/30 uppercase tracking-widest mb-3">
                                        Другие модули
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {modules
                                            .filter((m) => m.id !== activeId)
                                            .slice(0, 6)
                                            .map((mod) => (
                                                <button
                                                    key={mod.id}
                                                    onClick={() => setActiveId(mod.id)}
                                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15 transition-all duration-200 text-center"
                                                >
                                                    <span className="text-lg">{mod.icon}</span>
                                                    <span className="text-[10px] text-white/40 leading-tight">
                                                        {mod.title}
                                                    </span>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom progress navigation */}
                        <div className="relative z-10 px-8 md:px-10 py-4 border-t border-white/8 flex items-center justify-between gap-4">
                            <div className="flex gap-1.5">
                                {modules.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveId(i)}
                                        className="h-1 rounded-full transition-all duration-300"
                                        style={{
                                            width: i === activeId ? "28px" : "6px",
                                            background:
                                                i === activeId ? active.color : "rgba(255,255,255,0.15)",
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveId((p) => (p - 1 + modules.length) % modules.length)}
                                    className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25 transition-all text-sm"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={() => setActiveId((p) => (p + 1) % modules.length)}
                                    className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25 transition-all text-sm"
                                >
                                    →
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
