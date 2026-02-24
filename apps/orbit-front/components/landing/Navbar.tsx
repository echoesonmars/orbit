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
        { label: "Модули", href: "#features" },
        { label: "Как работает", href: "#how-it-works" },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? "bg-[#0A0E17]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
                    : "bg-transparent"
                }`}
        >
            <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#9D4EDD] flex items-center justify-center text-[#0A0E17] font-bold text-sm shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-shadow duration-300">
                        🛰
                    </div>
                    <span className="font-semibold text-white tracking-tight text-lg">
                        Orbit<span className="text-[#00F0FF]">AI</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        href="/auth/login"
                        className="text-sm text-white/60 hover:text-white px-4 py-2 transition-colors"
                    >
                        Войти
                    </Link>
                    <Link
                        href="/auth/register"
                        className="text-sm px-5 py-2 rounded-md border border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300"
                    >
                        Начать бесплатно
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden text-white/70 hover:text-white"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <div className="flex flex-col gap-1.5 w-6">
                        <span className={`h-px bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                        <span className={`h-px bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
                        <span className={`h-px bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                    </div>
                </button>
            </nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-[#0A0E17]/95 backdrop-blur-xl border-b border-white/10 px-6 pb-6"
                    >
                        <div className="flex flex-col gap-4 pt-4">
                            {links.map((link) => (
                                <Link key={link.label} href={link.href} className="text-white/60 hover:text-white text-sm">
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/auth/register"
                                className="text-sm px-5 py-2 rounded-md border border-[#00F0FF] text-[#00F0FF] text-center hover:bg-[#00F0FF]/10 transition-all"
                            >
                                Начать бесплатно
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
