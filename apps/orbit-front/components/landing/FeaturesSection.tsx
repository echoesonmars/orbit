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
            "Платформа автоматически каждые 24 часа обходит открытые каталоги NASA, ESA и Celestrak, скачивает миллионы записей о спутниках и снимках Земли и складывает их в единую пространственную базу. Вы просто рисуете квадрат на карте — система мгновенно найдет все снимки за любой период.",
        color: "#00F0FF",
        gradient: "from-[#00F0FF]/20 to-transparent",
    },
    {
        id: 1,
        icon: "🧠",
        title: "Mission Designer",
        tagline: "Бизнес-язык → инженерное ТЗ",
        description:
            "Напишите обычным текстом: «Хочу следить за урожайностью пшеничных полей в Казахстане раз в неделю». Система переведет это в готовое техническое задание для инженеров: тип орбиты, угол съемки, режим сенсора, оптимальное время пролета.",
        color: "#9D4EDD",
        gradient: "from-[#9D4EDD]/20 to-transparent",
    },
    {
        id: 2,
        icon: "💎",
        title: "Capture Value Predictor",
        tagline: "Цена снимка — до его создания",
        description:
            "Укажите координаты и дату планируемой съемки. ИИ учтет прогноз облачности, тип местности, сезонный спрос и текущие рыночные цены — и за секунду скажет, за сколько долларов этот снимок можно будет продать на бирже данных.",
        color: "#10B981",
        gradient: "from-[#10B981]/20 to-transparent",
    },
    {
        id: 3,
        icon: "📄",
        title: "Report Generator",
        tagline: "PDF-отчет с объяснением каждого решения",
        description:
            "Нажмите одну кнопку — через минуту скачивается профессиональный PDF. Внутри: карта зоны съемки, график рисков с разбивкой по факторам, текстовое резюме от ИИ и диаграммы, которые объясняют, почему система приняла именно такое решение.",
        color: "#00F0FF",
        gradient: "from-[#00F0FF]/20 to-transparent",
    },
    {
        id: 4,
        icon: "🚀",
        title: "Launch Delay Predictor",
        tagline: "Знайте о переносе за 72 часа",
        description:
            "Система отслеживает все запланированные запуски ракет, проверяет погоду на космодроме и статистику ракеты. Если шанс переноса высокий — вы увидите красную шкалу с объяснением причин. Перестройте логистику до объявления официальной задержки.",
        color: "#EF4444",
        gradient: "from-[#EF4444]/20 to-transparent",
    },
    {
        id: 5,
        icon: "🛰",
        title: "Orbit Optimizer",
        tagline: "Каждый литр топлива на счету",
        description:
            "Укажите текущую и целевую орбиту вашего спутника. Система рассчитает самый экономный маршрут маневрирования, скажет сколько килограммов топлива сгорит и переведет это в доллары. Интерактивный 3D-глобус покажет траекторию перелета.",
        color: "#9D4EDD",
        gradient: "from-[#9D4EDD]/20 to-transparent",
    },
    {
        id: 6,
        icon: "🎯",
        title: "Orbit Suitability Scorer",
        tagline: "Подходит ли эта орбита для вашего бизнеса?",
        description:
            "Введите параметры предложенной орбиты и опишите бизнес-задачу. Система выдаст оценку от 0 до 100 по каждому критерию: покрытие нужных регионов, задержка сигнала, частота пролетов. Диаграмма-«паутина» покажет сильные и слабые стороны.",
        color: "#10B981",
        gradient: "from-[#10B981]/20 to-transparent",
    },
    {
        id: 7,
        icon: "🕵️",
        title: "Failure Forensics",
        tagline: "Найдем причину сбоя по логам",
        description:
            "Загрузите CSV с телеметрией спутника — система за секунды проанализирует тысячи строк и подсветит красным те миллисекунды, когда поведение аппарата стало аномальным. Рядом — текстовая версия: что именно произошло и какой узел мог дать сбой.",
        color: "#EF4444",
        gradient: "from-[#EF4444]/20 to-transparent",
    },
    {
        id: 8,
        icon: "🎲",
        title: "Scenario Simulator",
        tagline: "Проиграем ваш бизнес 10 000 раз",
        description:
            "Введите бюджет, стоимость запуска и целевой регион. Симулятор за несколько секунд прокрутит 10 000 виртуальных жизней вашего спутника с разными погодными и рыночными условиями. On экране появится «конус вероятности»: медианная прибыль и риск убытка.",
        color: "#00F0FF",
        gradient: "from-[#00F0FF]/20 to-transparent",
    },
    {
        id: 9,
        icon: "🌿",
        title: "ESG Assessor",
        tagline: "Экологический паспорт вашей миссии",
        description:
            "Введите параметры ракеты и орбиты — система рассчитает углеродный след запуска, риск образования космического мусора и присвоит ESG-рейтинг от A+ до F. ИИ подскажет конкретные инженерные изменения, которые поднимут рейтинг для инвесторов.",
        color: "#10B981",
        gradient: "from-[#10B981]/20 to-transparent",
    },
];

export default function FeaturesSection() {
    const [activeId, setActiveId] = useState(0);
    const active = modules[activeId];

    return (
        <section id="features" className="relative py-32 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(0,240,255,0.04),transparent)]" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#9D4EDD]/30 bg-[#9D4EDD]/5 text-xs text-[#9D4EDD] mb-6">
                        10 модулей
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tighter mb-5">
                        Что умеет платформа
                    </h2>
                    <p className="text-white/45 text-lg max-w-xl mx-auto leading-relaxed">
                        Каждый модуль решает конкретную задачу. Выберите любой чтобы узнать подробнее.
                    </p>
                </motion.div>

                {/* Interactive Gallery */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
                    {/* Left: tab list — horizontal scroll on mobile */}
                    <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
                        {modules.map((mod) => (
                            <motion.button
                                key={mod.id}
                                onClick={() => setActiveId(mod.id)}
                                whileHover={{ x: 4 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 w-full group ${activeId === mod.id
                                    ? "bg-white/8 border border-white/15"
                                    : "border border-transparent hover:bg-white/5"
                                    }`}
                            >
                                <span className="text-base shrink-0">{mod.icon}</span>
                                <div className="min-w-0">
                                    <div
                                        className="text-sm font-medium transition-colors duration-200 truncate"
                                        style={{ color: activeId === mod.id ? mod.color : "rgba(255,255,255,0.7)" }}
                                    >
                                        {mod.title}
                                    </div>
                                    {activeId === mod.id && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-white/35 truncate mt-0.5"
                                        >
                                            {mod.tagline}
                                        </motion.div>
                                    )}
                                </div>
                                {activeId === mod.id && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="ml-auto w-1 h-6 rounded-full shrink-0"
                                        style={{ background: mod.color }}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Right: detail panel */}
                    <div className="sticky top-24">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeId}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="relative rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden p-8 md:p-10 min-h-[320px]"
                            >
                                {/* Background gradient */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${active.gradient} opacity-30`}
                                />
                                {/* Top beam */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-px"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${active.color}80, transparent)`,
                                    }}
                                />

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Badge row */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-white/10 bg-white/5"
                                            style={{ boxShadow: `0 0 20px ${active.color}25` }}
                                        >
                                            {active.icon}
                                        </div>
                                        <div>
                                            <div
                                                className="text-xs font-mono mb-1"
                                                style={{ color: active.color }}
                                            >
                                                Модуль {String(activeId + 1).padStart(2, "0")}
                                            </div>
                                            <h3 className="text-xl font-semibold text-white tracking-tight">
                                                {active.title}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Tagline */}
                                    <p
                                        className="text-sm font-medium mb-4"
                                        style={{ color: active.color }}
                                    >
                                        {active.tagline}
                                    </p>

                                    {/* Description */}
                                    <p className="text-white/60 leading-relaxed text-sm">
                                        {active.description}
                                    </p>

                                    {/* Progress dots */}
                                    <div className="flex gap-1.5 mt-8">
                                        {modules.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveId(i)}
                                                className="h-1 rounded-full transition-all duration-300"
                                                style={{
                                                    width: i === activeId ? "24px" : "6px",
                                                    background: i === activeId ? active.color : "rgba(255,255,255,0.2)",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
}
