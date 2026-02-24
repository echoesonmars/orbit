"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

// Magic UI AnimatedNumber — count up on enter
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        const duration = 1500;
        const startTime = performance.now();
        const raf = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
    }, [inView, target]);

    return (
        <span ref={ref} className="tabular-nums">
            {count}
            {suffix}
        </span>
    );
}

const stats = [
    { value: 10, suffix: "", label: "ИИ-модулей на платформе", color: "#00F0FF" },
    { value: 3, suffix: "", label: "независимых сервиса", color: "#9D4EDD" },
    { value: 99, suffix: "%", label: "точность физических расчетов", color: "#10B981" },
    { value: 0, suffix: "$", label: "затрат на данные (открытые API)", color: "#00F0FF" },
];

export default function StatsSection() {
    return (
        <section id="stats" className="relative py-24 px-6 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 border-y border-white/5" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,240,255,0.03),transparent)]" />

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="flex flex-col items-center justify-center py-12 px-6 bg-[#0A0E17] text-center"
                        >
                            <div
                                className="text-4xl md:text-5xl font-semibold mb-3 tracking-tighter"
                                style={{ color: stat.color }}
                            >
                                {stat.suffix === "$" ? (
                                    <>
                                        <AnimatedNumber target={stat.value} />
                                        {stat.suffix}
                                    </>
                                ) : (
                                    <>
                                        <AnimatedNumber target={stat.value} />
                                        {stat.suffix}
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-white/40 leading-snug max-w-[120px]">
                                {stat.label}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
