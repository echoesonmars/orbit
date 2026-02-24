import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
    title: "OrbitAI — Монетизация космических данных с помощью ИИ",
    description:
        "Модульная AI-платформа для принятия решений в космической отрасли. Оцениваем спутниковые снимки, оптимизируем орбитальные маневры, предсказываем переносы запусков с помощью машинного обучения.",
    keywords: ["SpaceTech", "AI", "спутники", "геоданные", "ML", "OrbitAI"],
};

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    if (!(routing.locales as readonly string[]).includes(locale)) {
        notFound();
    }

    const messages = await getMessages();

    return (
        <html lang={locale} className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} bg-[#0A0E17] text-foreground antialiased`}
            >
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
