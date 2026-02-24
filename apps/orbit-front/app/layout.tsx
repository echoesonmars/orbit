import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrbitAI — Монетизация космических данных с помощью ИИ",
  description:
    "Модульная AI-платформа для принятия решений в космической отрасли. Оценивает ценность снимков, оптимизирует орбиты, генерирует ТЗ миссий и многое другое.",
  keywords: ["SpaceTech", "AI", "спутники", "геоданные", "ML", "OrbitAI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#0A0E17] text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
