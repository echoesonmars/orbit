"use client";

import Link from "next/link";

const footerLinks = {
    Платформа: ["Data Hub", "Mission Designer", "Value Predictor", "Report Generator", "Orbit Optimizer"],
    Компания: ["О нас", "Блог", "Карьера", "Пресса"],
    Документация: ["API Reference", "Быстрый старт", "Примеры", "Changelog"],
    Правовые: ["Политика конфиденциальности", "Условия использования", "Cookies"],
};

export default function FooterSection() {
    return (
        <footer className="relative border-t border-white/5 py-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#9D4EDD] flex items-center justify-center text-[#0A0E17] font-bold text-sm">
                                🛰
                            </div>
                            <span className="font-semibold text-white tracking-tight">
                                Orbit<span className="text-[#00F0FF]">AI</span>
                            </span>
                        </Link>
                        <p className="text-xs text-white/35 leading-relaxed max-w-[180px]">
                            Превращаем спутниковые данные в бизнес-решения с помощью ИИ.
                        </p>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-5">
                                {category}
                            </h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-xs text-white/35 hover:text-white/70 transition-colors duration-200"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/25">
                        © 2026 OrbitAI. Все права защищены.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-xs text-white/25">
                            Все системы работают нормально
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
