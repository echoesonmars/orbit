"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Send, Bot, Loader2, Satellite, Target, Maximize, AlertCircle, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Message = {
    role: "user" | "assistant";
    content: string;
};

export default function MissionDesignerPage() {
    const t = useTranslations("Dashboard.missionDesigner");
    const [messages, setMessages] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [rawStream, setRawStream] = useState("");
    const [spec, setSpec] = useState<MissionSpec & { estimated_budget_usd?: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const newMessages = [...messages, { role: "user" as const, content: prompt.trim() }];
        setMessages(newMessages);
        setPrompt("");
        setIsLoading(true);
        setError(null);
        setSpec(null);
        setRawStream("");

        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';

            const response = await fetch(`${gatewayUrl}/api/v1/mission-designer/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!response.ok) {
                throw new Error(`Failed to generate mission. Server responded with ${response.status}`);
            }

            if (!response.body) throw new Error("No readable stream in response");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedJson = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedJson += chunk;
                // Show the raw typing effect
                setRawStream((prev) => prev + chunk);
            }

            try {
                // Try parsing the final accumulated string
                const parsedSpec = JSON.parse(accumulatedJson);
                setSpec(parsedSpec);
                // Also add the assistant's final response to the visual history
                setMessages(prev => [...prev, { role: "assistant", content: parsedSpec.explanation }]);
                // Hide the raw stream terminal
                setRawStream("");
            } catch (parseError) {
                console.error("Failed to parse JSON stream", parseError);
                setError("AI returned invalid data format.");
            }

        } catch (err: any) {
            console.error("Mission Designer error:", err);
            setError(err.message || "An unexpected error occurred while generating the mission.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl overflow-y-auto no-scrollbar pointer-events-auto flex flex-col">
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 relative flex-grow w-full flex flex-col">
                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="absolute top-4 left-4 md:top-8 md:left-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>

                {/* Header Section */}
                <div className="text-center mb-6 mt-8 md:mt-0">
                    <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4">
                        <Bot className="h-8 w-8 text-purple-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold font-sans text-white mb-3">{t("title")}</h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Chat History View */}
                {messages.length > 0 && (
                    <div className="max-w-3xl mx-auto mb-8 w-full space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "p-4 rounded-2xl max-w-[85%]",
                                msg.role === "user"
                                    ? "bg-purple-600/20 text-purple-100 ml-auto border border-purple-500/30"
                                    : "bg-slate-800/50 text-slate-300 border border-slate-700 mr-auto"
                            )}>
                                <span className="block text-xs uppercase tracking-wide opacity-50 mb-1">{msg.role}</span>
                                {msg.content}
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Section */}
                <div className="max-w-3xl mx-auto mb-8 w-full sticky top-4 z-40">
                    <form onSubmit={handleGenerate} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative bg-slate-900 border border-white/10 rounded-3xl flex flex-col sm:flex-row items-end sm:items-center p-2 gap-2 shadow-2xl">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={messages.length > 0 ? t("chatInputPlaceholder") : t("chatInputInitial")}
                                className="w-full bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none px-4 py-4 min-h-[60px] max-h-[150px] text-sm md:text-base"
                                rows={messages.length > 0 ? 1 : 2}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleGenerate(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || prompt.trim().length === 0}
                                className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl p-4 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] disabled:shadow-none flex-shrink-0 m-1"
                            >
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Streaming Terminal Section */}
                {isLoading && rawStream && (
                    <div className="max-w-4xl mx-auto w-full mb-8">
                        <div className="bg-black/80 border border-green-500/30 rounded-xl p-4 overflow-hidden relative">
                            <div className="absolute top-2 right-2 flex items-center gap-2">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            </div>
                            <p className="font-mono text-green-400 text-sm whitespace-pre-wrap break-words">
                                {rawStream}
                                <span className="animate-pulse">_</span>
                            </p>
                        </div>
                    </div>
                )}
                {isLoading && !rawStream && (
                    <div className="mt-4 text-center flex flex-col items-center justify-center animate-pulse">
                        <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-2" />
                        <p className="text-purple-300 font-mono text-xs tracking-widest uppercase">{t("calculating")}</p>
                    </div>
                )}

                {/* Results Section */}
                {!isLoading && spec && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-4xl mx-auto w-full">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {/* Card 1: Orbit */}
                            <div className="bg-slate-800/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                <Target className="h-6 w-6 text-cyan-400 mb-3" />
                                <h3 className="text-slate-400 text-[10px] md:text-xs font-bold tracking-wider uppercase mb-1">{t("cardOrbit")}</h3>
                                <p className="text-white font-semibold text-sm md:text-base leading-tight">{spec.orbit_type}</p>
                            </div>

                            {/* Card 2: Sensor */}
                            <div className="bg-slate-800/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                <Satellite className="h-6 w-6 text-purple-400 mb-3" />
                                <h3 className="text-slate-400 text-[10px] md:text-xs font-bold tracking-wider uppercase mb-1">{t("cardSensor")}</h3>
                                <p className="text-white font-semibold text-sm md:text-base leading-tight">{spec.sensor_type}</p>
                            </div>

                            {/* Card 3: Resolution */}
                            <div className="bg-slate-800/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                                <Maximize className="h-6 w-6 text-emerald-400 mb-3" />
                                <h3 className="text-slate-400 text-[10px] md:text-xs font-bold tracking-wider uppercase mb-1">{t("cardResolution")}</h3>
                                <p className="text-white font-semibold text-sm md:text-base leading-tight">{spec.resolution_meters}m</p>
                            </div>

                            {/* Card 4: Budget */}
                            <div className="bg-slate-800/40 border-b-2 border-green-500 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="h-6 text-green-400 font-mono font-bold mb-3">$</div>
                                <h3 className="text-slate-400 text-[10px] md:text-xs font-bold tracking-wider uppercase mb-1">{t("cardBudget")}</h3>
                                <p className="text-white font-bold text-lg md:text-xl leading-tight">
                                    {spec.estimated_budget_usd ? spec.estimated_budget_usd.toLocaleString('en-US') : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Reasoning / Explanation panel */}
                        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(147,51,234,0.1)]">
                            <h3 className="text-purple-400 text-sm font-bold tracking-wider uppercase mb-4 flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                {t("reasoning")}
                            </h3>
                            <p className="text-slate-300 text-base leading-relaxed">
                                {spec.explanation}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
