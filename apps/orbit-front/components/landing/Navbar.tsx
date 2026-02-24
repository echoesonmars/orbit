"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const links = [
        { label: "Продукт", href: "#features" },
        { label: "Как работает", href: "#how-it-works" },
        { label: "О платформе", href: "#stats" },
    ];

    const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith("#")) {
            e.preventDefault();
            const el = document.querySelector(href);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setMenuOpen(false);
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? "bg-[#0A0E17]/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
                    : "bg-transparent"
                }`}
            style={{ borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none" }}
        >
            <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#9D4EDD] flex items-center justify-center text-[#0A0E17] font-bold text-sm shadow-[0_0_15px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-shadow duration-300">
                        🛰
                    </div>
                    <span className="font-semibold text-white tracking-tight text-lg">
                        Orbit<span className="text-[#00F0FF]">AI</span>
                    </span>
                </Link>

                {/* Desktop nav — centered absolutely */}
                <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={(e) => handleSmoothScroll(e, link.href)}
                            className="text-sm text-white/55 hover:text-white transition-colors duration-200 cursor-pointer"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Desktop right CTA */}
                <div className="hidden md:flex items-center gap-3 shrink-0">
                    <Link
                        href="/auth/login"
                        className="text-sm text-white/55 hover:text-white px-3 py-2 transition-colors"
                    >
                        Войти
                    </Link>
                    <Link
                        href="/auth/register"
                        className="text-sm px-5 py-2 rounded-md border border-[#00F0FF]/70 text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:border-[#00F0FF] hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] transition-all duration-300"
                    >
                        Начать бесплатно
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden text-white/70 hover:text-white p-1"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Открыть меню"
                >
                    <div className="flex flex-col gap-1.5 w-5">
                        <span
                            className={`h-px bg-current transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""
                                }`}
                        />
                        <span className={`h-px bg-current transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                        <span
                            className={`h-px bg-current transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
                                }`}
                        />
                    </div>
                </button>
            </nav>

            {/* Mobile dropdown */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="md:hidden bg-[#0A0E17]/95 backdrop-blur-2xl overflow-hidden"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <div className="flex flex-col gap-3 px-6 py-6">
                            {links.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={(e) => handleSmoothScroll(e, link.href)}
                                    className="text-white/60 hover:text-white text-sm py-1 transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
                                <Link href="/auth/login" className="text-white/60 text-sm hover:text-white transition-colors">
                                    Войти
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="text-sm px-5 py-2.5 rounded-md border border-[#00F0FF]/70 text-[#00F0FF] text-center hover:bg-[#00F0FF]/10 transition-all"
                                >
                                    Начать бесплатно
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
