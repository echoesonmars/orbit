"use client";

import { motion } from "framer-motion";
import { Link } from "../../i18n/routing";
import { useTranslations } from "next-intl";

export default function CtaSection() {
    const t = useTranslations("Cta");

    return (
        <section className="relative py-40 px-6 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(0,240,255,0.07),transparent)]" />
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(0,240,255,0.08) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                    opacity: 0.4,
                }}
            />

            {/* Magic UI Border Beam on the card */}
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="relative rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-16 text-center overflow-hidden"
                >
                    {/* Animated top border beam */}
                    <div className="absolute top-0 left-0 right-0">
                        <div className="h-px bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-70 animate-pulse" />
                    </div>

                    {/* Corner glows */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#00F0FF]/10 blur-3xl rounded-full" />

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/5 text-xs text-[#00F0FF] mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                        {t("badge")}
                    </div>

                    <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tighter mb-6 leading-[1.1]">
                        {t("titleLine1")}
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#9D4EDD]">
                            {t("titleGradient")}
                        </span>
                    </h2>

                    <p className="text-white/45 text-base mb-12 max-w-md mx-auto leading-relaxed">
                        {t("description")}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/auth/register"
                            className="px-10 py-4 rounded-md bg-[#00F0FF] text-[#0A0E17] font-semibold text-sm hover:bg-[#00F0FF]/90 hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all duration-300"
                        >
                            {t("buttonStart")}
                        </Link>
                        <a
                            href="#features"
                            className="px-10 py-4 rounded-md border border-white/15 text-white/60 text-sm hover:border-white/30 hover:text-white transition-all duration-300 cursor-pointer"
                        >
                            {t("buttonExplore")}
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
