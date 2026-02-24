"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const modules = [
    {
        id: 0,
        icon: "🌐",
        title: "Data Hub",
        tagline: "Сырые данные превращаются в активы",
        description:
            "Каждые 24 часа платформа автоматически обходит открытые каталоги NASA, ESA и Celestrak, скачивает миллионы записей о спутниках и снимках Земли и складывает их в единую пространственную базу. Вы просто рисуете квадрат на карте — система мгновенно находит все снимки за любой период.",
        color: "#00F0FF",
        bg: "from-[#00F0FF]/10 via-transparent to-transparent",
        stat: { label: "Обновление данных", value: "24ч" },
    },
    {
        id: 1,
        icon: "🧠",
        title: "Mission Designer",
        tagline: "Бизнес-язык → инженерное ТЗ",
        description:
            "Напишите обычным текстом: «Хочу следить за урожайностью полей в Казахстане раз в неделю». Система переведет это в готовое техническое задание: тип орбиты, угол съемки, режим сенсора, оптимальное время пролета.",
        color: "#9D4EDD",
        bg: "from-[#9D4EDD]/10 via-transparent to-transparent",
        stat: { label: "Время генерации ТЗ", value: "< 5 сек" },
    },
    {
        id: 2,
        icon: "💎",
        title: "Capture Value Predictor",
        tagline: "Цена снимка — до его создания",
        description:
            "Укажите координаты и дату съемки. ИИ учтет прогноз облачности, тип местности, сезонный спрос и рыночные цены — и скажет, за сколько долларов этот снимок можно продать на бирже данных. До запуска спутника.",
        color: "#10B981",
        bg: "from-[#10B981]/10 via-transparent to-transparent",
        stat: { label: "Точность прогноза", value: "87%" },
    },
    {
        id: 3,
        icon: "📄",
        title: "Report Generator",
        tagline: "PDF-отчет с объяснением каждого решения",
        description:
            "Нажмите одну кнопку — через минуту скачивается профессиональный PDF с картой зоны, графиком рисков, текстовым резюме от ИИ и диаграммами, которые объясняют почему система приняла именно такое решение (XAI).",
        color: "#00F0FF",
        bg: "from-[#00F0FF]/10 via-transparent to-transparent",
        stat: { label: "Время генерации", value: "~60 сек" },
    },
    {
        id: 4,
        icon: "🚀",
        title: "Launch Delay Predictor",
        tagline: "Узнайте о переносе за 72 часа",
        description:
            "Система мониторит все запланированные запуски, проверяет погоду на космодроме и историческую статистику ракеты. Красная шкала предупреждает о шансе задержки с объяснением причин — до официального объявления.",
        color: "#EF4444",
        bg: "from-[#EF4444]/10 via-transparent to-transparent",
        stat: { label: "Горизонт прогноза", value: "72 часа" },
    },
    {
        id: 5,
        icon: "🛰",
        title: "Orbit Optimizer",
        tagline: "Каждый литр топлива на счету",
        description:
            "Укажите текущую и целевую орбиту. Система рассчитает самый экономный маршрут маневра (Маневр Гомана), скажет сколько кг топлива сгорит и переведет это в доллары. Интерактивный 3D-глобус покажет траекторию.",
        color: "#9D4EDD",
        bg: "from-[#9D4EDD]/10 via-transparent to-transparent",
        stat: { label: "Экономия топлива", value: "до 40%" },
    },
    {
        id: 6,
        icon: "🎯",
        title: "Orbit Suitability Scorer",
        tagline: "Подходит ли орбита для вашего бизнеса?",
        description:
            "Введите параметры предложенной орбиты и бизнес-задачу. Система оценит по критериям: охват регионов, задержка сигнала, частота пролетов. Диаграмма-«паутина» покажет сильные и слабые стороны орбиты.",
        color: "#10B981",
        bg: "from-[#10B981]/10 via-transparent to-transparent",
        stat: { label: "Метрик анализа", value: "12" },
    },
    {
        id: 7,
        icon: "🕵️",
        title: "Failure Forensics",
        tagline: "Найдет причину сбоя по логам",
        description:
            "Загрузите CSV с телеметрией — система за секунды проанализирует тысячи строк и подсветит аномальные миллисекунды. Рядом будет текстовая версия: что именно произошло и какой именно узел дал сбой.",
        color: "#EF4444",
        bg: "from-[#EF4444]/10 via-transparent to-transparent",
        stat: { label: "Скорость анализа", value: "< 3 сек" },
    },
    {
        id: 8,
        icon: "🎲",
        title: "Scenario Simulator",
        tagline: "Проиграем ваш бизнес 10 000 раз",
        description:
            "Введите бюджет, стоимость запуска и целевой регион. Симулятор за секунды прогоняет 10 000 виртуальных жизней спутника с разными условиями. Конус вероятности покажет медианную прибыль и реальный риск убытка.",
        color: "#00F0FF",
        bg: "from-[#00F0FF]/10 via-transparent to-transparent",
        stat: { label: "Сценариев за расчет", value: "10 000" },
    },
    {
        id: 9,
        icon: "🌿",
        title: "ESG Assessor",
        tagline: "Экологический паспорт миссии",
        description:
            "Введите параметры ракеты и орбиты — система рассчитает углеродный след, риск образования мусора и присвоит ESG-рейтинг от A+ до F. ИИ подскажет конкретные инженерные изменения для улучшения рейтинга.",
        color: "#10B981",
        bg: "from-[#10B981]/10 via-transparent to-transparent",
        stat: { label: "Рейтинговая шкала", value: "A+ → F" },
    },
];

export default function FeaturesSection() {
    const [activeId, setActiveId] = useState(0);
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
                        10 модулей
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tighter mb-4">
                        Что умеет платформа
                    </h2>
                    <p className="text-white/45 text-base max-w-xl mx-auto leading-relaxed">
                        Выберите любой модуль чтобы узнать что он делает
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
