import { useTranslations } from "next-intl";
import Link from "next/link";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Send } from "lucide-react";

export default function RegisterPage() {
    const t = useTranslations("Auth.register");

    return (
        <div className="w-full relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-lg animate-fade-in-up">
                <div className="relative rounded-2xl bg-black/40 border border-white/10 p-10 backdrop-blur-xl shadow-2xl text-center overflow-hidden">
                    <BorderBeam duration={15} size={400} />

                    <div className="relative z-10">
                        {/* Lock/Globe Icon area */}
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-white mb-4">
                            {t("titleLine1")}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                {t("titleGradient")}
                            </span>
                        </h1>

                        <p className="text-base text-slate-300 mb-10 leading-relaxed">
                            {t("description")}
                        </p>

                        {/* Telegram CTA Button */}
                        <a
                            href="https://t.me/echoesonmars"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-md bg-indigo-600 px-8 py-4 font-medium text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:bg-indigo-700 hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)]"
                        >
                            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                                <div className="relative h-full w-8 bg-white/20" />
                            </div>
                            <Send className="mr-2 h-5 w-5" />
                            <span>{t("ctaButton")} (Telegram)</span>
                        </a>

                        <div className="mt-8">
                            <Link
                                href="/auth/login"
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                ← {t("backToLogin")}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
