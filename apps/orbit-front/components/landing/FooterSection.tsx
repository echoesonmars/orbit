"use client";

import { Link } from "../../i18n/routing";
import { useTranslations } from "next-intl";

export default function FooterSection() {
    const t = useTranslations("Footer");

    const footerLinks = {
        [t("platform")]: [
            { label: "Data Hub", href: "#" },
            { label: "Mission Designer", href: "#" },
            { label: "Value Predictor", href: "#" },
            { label: "Report Generator", href: "#" },
            { label: "Orbit Optimizer", href: "#" },
        ],
        [t("company")]: [
            { label: t("links.about"), href: "#" },
            { label: t("links.blog"), href: "#" },
            { label: t("links.careers"), href: "#" },
            { label: t("links.press"), href: "#" },
        ],
        [t("docs")]: [
            { label: t("links.api"), href: "#" },
            { label: t("links.quickstart"), href: "#" },
            { label: t("links.examples"), href: "#" },
            { label: t("links.changelog"), href: "#" },
        ],
        [t("legal")]: [
            { label: t("links.privacy"), href: "#" },
            { label: t("links.terms"), href: "#" },
            { label: t("links.cookies"), href: "#" },
        ],
    };

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
                            {t("tagline")}
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
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-xs text-white/35 hover:text-white/70 transition-colors duration-200"
                                        >
                                            {link.label}
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
                        {t("rights")}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-xs text-white/25">
                            {t("status")}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
