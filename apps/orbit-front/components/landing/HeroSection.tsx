"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// ── Magic UI: Meteors ─────────────────────────────────────────────
function Meteors({ number = 14 }: { number?: number }) {
    return (
        <>
            {Array.from({ length: number }).map((_, i) => (
                <span
                    key={i}
                    className="absolute h-px rounded-full bg-gradient-to-r from-[#00F0FF] to-transparent pointer-events-none"
                    style={{
                        top: `${Math.random() * 90}%`,
                        left: `${Math.random() * 90}%`,
                        width: `${80 + Math.random() * 150}px`,
                        transform: "rotate(215deg)",
                        animationName: "meteor",
                        animationDuration: `${3 + Math.random() * 4}s`,
                        animationDelay: `${Math.random() * 6}s`,
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                        boxShadow: "0 0 4px 0 rgba(0,240,255,0.4)",
                        opacity: 0,
                    }}
                />
            ))}
        </>
    );
}

// ── Magic UI: GridPattern (dot grid) ─────────────────────────────
function GridPattern() {
    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: `radial-gradient(circle, rgba(0,240,255,0.12) 1px, transparent 1px)`,
                backgroundSize: "44px 44px",
                opacity: 0.25,
                maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
                WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
            }}
        />
    );
}

// ── Magic UI: Particles (floating dots) ──────────────────────────
function Particles({ count = 30 }: { count?: number }) {
    const particles = Array.from({ length: count });
    return (
        <>
            {particles.map((_, i) => (
                <span
                    key={i}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        width: `${1 + Math.random() * 2}px`,
                        height: `${1 + Math.random() * 2}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        background: i % 3 === 0 ? "#9D4EDD" : "#00F0FF",
                        opacity: 0.15 + Math.random() * 0.2,
                        animationName: "pulse-glow",
                        animationDuration: `${2 + Math.random() * 4}s`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationTimingFunction: "ease-in-out",
                        animationIterationCount: "infinite",
                    }}
                />
            ))}
        </>
    );
}

// ── Glow blob ────────────────────────────────────────────────────
function GlowBlob({ className }: { className?: string }) {
    return (
        <div
            className={`absolute rounded-full blur-[130px] animate-pulse-glow pointer-events-none ${className}`}
        />
    );
}

// ── Framer Motion variant ─────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (d = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.65, delay: d, ease: "easeOut" as const },
    }),
};

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 pt-24 pb-16">
            {/* Layered backgrounds */}
            <div className="absolute inset-0 bg-[#0A0E17]" />
            <GridPattern />
            <div className="absolute inset-0 overflow-hidden">
                <Meteors number={16} />
                <Particles count={35} />
            </div>

            {/* Glow blobs */}
            <GlowBlob className="w-[700px] h-[700px] bg-[#00F0FF]/8 -top-40 -left-20 opacity-60" />
            <GlowBlob className="w-[500px] h-[500px] bg-[#9D4EDD]/12 bottom-0 right-0 opacity-70" />
            <GlowBlob className="w-[300px] h-[300px] bg-[#00F0FF]/6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            {/* Radial vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-5%,rgba(0,240,255,0.07),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_105%,rgba(157,78,221,0.06),transparent)]" />

            {/* Content */}
            <div className="relative z-10 max-w-4xl w-full text-center">
                {/* Badge */}
                <motion.div
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F0FF]/25 bg-[#00F0FF]/5 text-xs text-[#00F0FF] mb-8"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                    <span className="hidden sm:inline">10 ИИ-модулей · Спутниковые данные · </span>Орбитальная аналитика
                </motion.div>

                {/* H1 */}
                <motion.h1
                    custom={0.1}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="text-4xl sm:text-6xl md:text-7xl font-semibold text-white leading-[1.08] tracking-tighter mb-6"
                >
                    Превратите{" "}
                    <span
                        className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#9D4EDD] to-[#00F0FF] bg-[length:200%_100%] animate-gradient-x"
                    >
                        космос
                    </span>
                    <br />
                    <span className="sm:inline">в прибыль</span>
                </motion.h1>

                {/* Sub */}
                <motion.p
                    custom={0.2}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="text-base sm:text-lg text-white/50 leading-relaxed max-w-2xl mx-auto mb-10 px-2"
                >
                    OrbitAI — AI-платформа для монетизации спутниковых данных.
                    Оцениваем снимки, оптимизируем орбиты и генерируем инженерные ТЗ
                    до запуска миссии.
                </motion.p>

                {/* CTA */}
                <motion.div
                    custom={0.3}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full"
                >
                    <Link
                        href="/auth/register"
                        className="w-full sm:w-auto px-8 py-3.5 rounded-md bg-[#00F0FF] text-[#0A0E17] font-semibold text-sm hover:brightness-110 hover:shadow-[0_0_35px_rgba(0,240,255,0.45)] transition-all duration-300"
                    >
                        Запустить демо
                    </Link>
                    <a
                        href="#features"
                        onClick={(e) => {
                            e.preventDefault();
                            document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-md border border-white/15 text-white/60 text-sm hover:border-white/35 hover:text-white transition-all duration-300 cursor-pointer"
                    >
                        Смотреть модули →
                    </a>
                </motion.div>

                {/* Stats */}
                <motion.div
                    custom={0.42}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="mt-20 flex items-center justify-center gap-6 sm:gap-14"
                >
                    {[
                        { value: "10", label: "ИИ-модулей" },
                        { value: "3", label: "сервиса" },
                        { value: "∞", label: "возможностей" },
                    ].map((s) => (
                        <div key={s.label} className="text-center">
                            <div className="text-2xl sm:text-3xl font-semibold text-white tabular-nums">{s.value}</div>
                            <div className="text-white/35 text-xs mt-1">{s.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
