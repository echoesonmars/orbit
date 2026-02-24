"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "../../i18n/routing";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const locales = [
    { code: "ru", label: "RU" },
    { code: "en", label: "EN" },
    { code: "kk", label: "KK" },
];

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const switchLocale = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
        setIsOpen(false);
    };

    const currentLabel = locales.find((l) => l.code === locale)?.label || "RU";

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-white/70 hover:text-white transition-colors bg-white/5 border border-white/10 hover:border-white/20"
            >
                {currentLabel}
                <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-16 bg-[#0c121e] border border-white/10 rounded-lg shadow-xl overflow-hidden"
                    >
                        {locales.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => switchLocale(l.code)}
                                className={`w-full text-center px-3 py-2 text-sm transition-colors ${locale === l.code
                                        ? "bg-[#00F0FF]/10 text-[#00F0FF]"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
