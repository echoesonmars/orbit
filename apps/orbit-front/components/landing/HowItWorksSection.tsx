"use client";

import { motion } from "framer-motion";

const steps = [
    {
        number: "01",
        icon: "🌐",
        title: "Данные",
        subtitle: "Data Hub",
        description:
            "Платформа автоматически собирает спутниковые снимки, TLE-орбиты и метеоданные из открытых каталогов (Sentinel, Landsat, Celestrak) и пишет их в PostGIS.",
        color: "#00F0FF",
    },
    {
        number: "02",
        icon: "🤖",
        title: "ИИ-анализ",
        subtitle: "ML Models",
        description:
            "Обученные модели (LightGBM, CatBoost) и физические алгоритмы анализируют данные: оценивают ценность снимка, предсказывают задержки запуска, оптимизируют маневры.",
        color: "#9D4EDD",
    },
    {
        number: "03",
        icon: "📊",
        title: "Инсайты",
        subtitle: "Reports & Scores",
        description:
            "Система формирует понятные бизнес-метрики: оценки от 0 до 100, прогнозы ROI с доверительным интервалом, PDF-отчеты с объяснением каждого решения ИИ (XAI).",
        color: "#10B981",
    },
    {
        number: "04",
        icon: "💰",
        title: "Прибыль",
        subtitle: "Business Value",
        description:
            "Инвестор принимает взвешенное решение: закупать снимок или нет, на какую орбиту запускать, как избежать переноса старта — с цифрами и фактами, а не интуицией.",
        color: "#00F0FF",
    },
];

export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(157,78,221,0.06),transparent)]" />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/5 text-xs text-[#10B981] mb-6">
                        Процесс
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tighter mb-5">
                        Как это работает
                    </h2>
                    <p className="text-white/45 text-lg max-w-xl mx-auto">
                        От сырых спутниковых данных до инвестиционного решения за секунды.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connector line */}
                    <div className="absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: i * 0.12 }}
                                className="relative flex flex-col"
                            >
                                {/* Step icon with ring */}
                                <div className="relative mb-6">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-white/10 bg-white/5 backdrop-blur-sm relative z-10"
                                        style={{ boxShadow: `0 0 20px ${step.color}20` }}
                                    >
                                        {step.icon}
                                    </div>
                                    {/* Number badge */}
                                    <div
                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-mono flex items-center justify-center z-20"
                                        style={{ background: step.color, color: "#0A0E17" }}
                                    >
                                        {i + 1}
                                    </div>
                                </div>

                                {/* Subtitle */}
                                <div className="text-xs mb-2" style={{ color: step.color }}>
                                    {step.subtitle}
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-semibold text-white mb-3 tracking-tight">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-xs text-white/45 leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
