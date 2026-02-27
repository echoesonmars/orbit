"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
    Send, Bot, Loader2, Satellite, Target, Maximize,
    AlertCircle, ChevronLeft, MapPin, X, History,
    Plus, Clock, DollarSign, Trash2, Pencil, Check
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string };

type MissionSpec = {
    orbit_type: string;
    resolution_meters: number;
    sensor_type: string;
    explanation: string;
    estimated_budget_usd?: number;
};

type Session = {
    id: string;
    title: string;
    created_at: string;
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function RegionBanner({ coords, onClear }: { coords: string; onClear: () => void }) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            <MapPin className="h-4 w-4 flex-shrink-0 text-cyan-400" />
            <span className="text-xs font-mono truncate flex-1">{coords}</span>
            <button onClick={onClear} className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function ChatBubble({ msg }: { msg: Message }) {
    const isUser = msg.role === "user";
    return (
        <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mr-3 mt-1">
                    <Bot className="h-4 w-4 text-purple-400" />
                </div>
            )}
            <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                isUser
                    ? "bg-purple-600/20 text-purple-100 border border-purple-500/30"
                    : "bg-slate-800/50 text-slate-300 border border-white/10"
            )}>
                {msg.content}
            </div>
        </div>
    );
}

function StreamTerminal({ text }: { text: string }) {
    if (!text) return null;
    return (
        <div className="rounded-2xl overflow-hidden border border-green-500/30 bg-black/80">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-green-500/20">
                <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-[10px] font-mono text-green-600 uppercase tracking-widest">Processing</span>
            </div>
            <p className="font-mono text-green-400 text-xs px-4 py-3 whitespace-pre-wrap break-all leading-relaxed">
                {text}<span className="animate-pulse">▊</span>
            </p>
        </div>
    );
}

function SpecResultCards({ spec, t }: { spec: MissionSpec; t: any }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {/* Orbit */}
                <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 group hover:border-cyan-500/30 transition-colors">
                    <Target className="h-7 w-7 text-cyan-400 mb-3" />
                    <h3 className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">{t("cardOrbit")}</h3>
                    <p className="text-white font-semibold text-sm">{spec.orbit_type}</p>
                </div>
                {/* Sensor */}
                <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 group hover:border-purple-500/30 transition-colors">
                    <Satellite className="h-7 w-7 text-purple-400 mb-3" />
                    <h3 className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">{t("cardSensor")}</h3>
                    <p className="text-white font-semibold text-sm">{spec.sensor_type}</p>
                </div>
                {/* Resolution */}
                <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 group hover:border-emerald-500/30 transition-colors">
                    <Maximize className="h-7 w-7 text-emerald-400 mb-3" />
                    <h3 className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">{t("cardResolution")}</h3>
                    <p className="text-white font-semibold text-sm">{spec.resolution_meters}m GSD</p>
                </div>
                {/* Budget */}
                <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-5 border-b-2 border-b-green-500/50 group hover:border-green-500/30 transition-colors">
                    <DollarSign className="h-7 w-7 text-green-400 mb-3" />
                    <h3 className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">{t("cardBudget")}</h3>
                    <p className="text-white font-bold text-base">
                        {spec.estimated_budget_usd ? `$${spec.estimated_budget_usd.toLocaleString('en-US')}` : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Reasoning */}
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-[0_0_50px_rgba(147,51,234,0.08)]">
                <h3 className="text-purple-400 text-xs font-bold tracking-wider uppercase mb-3 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    {t("reasoning")}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{spec.explanation}</p>
            </div>
        </div>
    );
}

function SessionsSidebar({
    sessions, activeId, onSelect, onNew, onDelete, onRename, isOpen, onClose
}: {
    sessions: Session[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
    onRename: (id: string, title: string) => void;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    const startRename = (e: React.MouseEvent, s: Session) => {
        e.stopPropagation();
        setEditingId(s.id);
        setEditTitle(s.title);
    };

    const confirmRename = (id: string) => {
        if (editTitle.trim()) onRename(id, editTitle.trim());
        setEditingId(null);
    };

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />}
            <aside className={cn(
                "fixed md:relative top-0 left-0 h-full z-50 md:z-auto w-60",
                "bg-[#0A0E17] border-r border-white/5 flex flex-col",
                "transition-transform duration-300",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <History className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Sessions</span>
                    </div>
                    <button onClick={onNew} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors" title="New">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                    {sessions.length === 0 ? (
                        <p className="text-slate-600 text-xs text-center py-8">No sessions yet</p>
                    ) : sessions.map(s => (
                        <div
                            key={s.id}
                            onClick={() => { if (editingId !== s.id) onSelect(s.id); }}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer group",
                                activeId === s.id
                                    ? "bg-purple-500/15 text-white border border-purple-500/20"
                                    : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
                            )}
                        >
                            {editingId === s.id ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        autoFocus
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") confirmRename(s.id); if (e.key === "Escape") setEditingId(null); }}
                                        className="flex-1 bg-transparent text-xs text-white outline-none border-b border-purple-500/50 py-0.5"
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <button onClick={(e) => { e.stopPropagation(); confirmRename(s.id); }} className="p-0.5 text-green-400 hover:text-green-300">
                                        <Check className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs font-medium truncate">{s.title}</p>
                            )}
                            <div className="flex items-center justify-between mt-0.5">
                                <div className="flex items-center gap-1 text-slate-600">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span className="text-[10px]">{new Date(s.created_at).toLocaleDateString()}</span>
                                </div>
                                {editingId !== s.id && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => startRename(e, s)} className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white" title="Rename">
                                            <Pencil className="h-2.5 w-2.5" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400" title="Delete">
                                            <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
}

// ─── Main Inner Page ─────────────────────────────────────────────────────────

function MissionDesignerInner() {
    const t = useTranslations("Dashboard.missionDesigner");
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Read bbox from URL params (passed by QuickActionsPanel when user draws on map)
    const swLat = searchParams.get("swLat");
    const swLng = searchParams.get("swLng");
    const neLat = searchParams.get("neLat");
    const neLng = searchParams.get("neLng");
    const hasBbox = !!(swLat && swLng && neLat && neLng);

    const [bboxStr, setBboxStr] = useState<string | null>(
        hasBbox ? `${Number(swLat).toFixed(3)}°, ${Number(swLng).toFixed(3)}° → ${Number(neLat).toFixed(3)}°, ${Number(neLng).toFixed(3)}°` : null
    );

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [rawStream, setRawStream] = useState("");
    const [spec, setSpec] = useState<MissionSpec | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Pre-fill the prompt with coordinates if bbox came from the map
    useEffect(() => {
        if (hasBbox && messages.length === 0) {
            setPrompt(`Analyze region: SW(${Number(swLat).toFixed(4)}°, ${Number(swLng).toFixed(4)}°) NE(${Number(neLat).toFixed(4)}°, ${Number(neLng).toFixed(4)}°). `);
        }
    }, []);

    // Scroll chat to bottom
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, rawStream]);

    // Load sessions
    useEffect(() => { loadSessions(); }, []);

    const loadSessions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("mission_chat_sessions").select("id, title, created_at")
            .eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
        if (data) setSessions(data);
    };

    const loadSession = async (sessionId: string) => {
        setActiveSessionId(sessionId); setSidebarOpen(false); setSpec(null); setRawStream(""); setError(null);
        const { data } = await supabase
            .from("mission_chat_messages").select("role, content, result_json")
            .eq("session_id", sessionId).order("created_at", { ascending: true });
        if (data) {
            setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
            const lastSpec = [...data].reverse().find(m => m.result_json);
            if (lastSpec?.result_json) setSpec(lastSpec.result_json as MissionSpec);
        }
    };

    const startNewSession = () => {
        setActiveSessionId(null); setMessages([]); setSpec(null); setRawStream(""); setError(null); setPrompt(""); setSidebarOpen(false);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const bboxContext = (hasBbox && bboxStr)
            ? `\n[Region: SW(${swLat}°, ${swLng}°) NE(${neLat}°, ${neLng}°)]`
            : "";
        const fullPrompt = prompt.trim() + bboxContext;

        const newMessages: Message[] = [...messages, { role: "user", content: fullPrompt }];
        setMessages(newMessages); setPrompt(""); setIsLoading(true); setError(null); setSpec(null); setRawStream("");

        try {
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || "";
            const { data: { user } } = await supabase.auth.getUser();

            // Create Supabase session on first message
            let sessionId = activeSessionId;
            if (!sessionId && user) {
                const { data: newSession } = await supabase
                    .from("mission_chat_sessions")
                    .insert({ user_id: user.id, title: fullPrompt.slice(0, 60) })
                    .select("id").single();
                if (newSession) { sessionId = newSession.id; setActiveSessionId(sessionId); loadSessions(); }
            }

            // Save user message
            if (sessionId) {
                await supabase.from("mission_chat_messages").insert({ session_id: sessionId, role: "user", content: fullPrompt });
            }

            const response = await fetch(`${gatewayUrl}/api/v1/mission-designer/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!response.ok) throw new Error(`Server error ${response.status}`);
            if (!response.body) throw new Error("No stream body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;
                setRawStream(prev => prev + chunk);
            }

            // Try to parse as JSON (mission spec) — if it fails, it's a plain text chat reply
            let assistantContent = accumulated;
            let parsedSpec: MissionSpec | null = null;
            try {
                const parsed = JSON.parse(accumulated);
                if (parsed.orbit_type && parsed.explanation) {
                    parsedSpec = parsed;
                    assistantContent = parsed.explanation;
                    setSpec(parsed);
                }
            } catch {
                // Not JSON — it's a normal text response, which is fine
            }

            setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
            setRawStream("");

            // Save assistant response
            if (sessionId) {
                await supabase.from("mission_chat_messages").insert({
                    session_id: sessionId, role: "assistant", content: assistantContent, result_json: parsedSpec
                });
            }
        } catch (err: any) {
            console.error("Mission Designer error:", err);
            setError(err.message || "Unexpected error");
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSession = async (id: string) => {
        await supabase.from("mission_chat_messages").delete().eq("session_id", id);
        await supabase.from("mission_chat_sessions").delete().eq("id", id);
        if (activeSessionId === id) startNewSession();
        loadSessions();
    };

    const renameSession = async (id: string, title: string) => {
        await supabase.from("mission_chat_sessions").update({ title }).eq("id", id);
        loadSessions();
    };

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex overflow-hidden">
            {/* Sidebar */}
            <SessionsSidebar
                sessions={sessions} activeId={activeSessionId}
                onSelect={loadSession} onNew={startNewSession}
                onDelete={deleteSession} onRename={renameSession}
                isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
            />

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar */}
                <header className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0">
                    <Link href="/dashboard" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors md:hidden">
                        <History className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <Bot className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-white font-bold text-sm truncate">{t("title")}</h1>
                            <p className="text-slate-500 text-[11px] truncate hidden sm:block">{t("subtitle")}</p>
                        </div>
                    </div>
                </header>

                {/* Chat Scroll Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
                        {/* Empty state */}
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-4">
                                    <Bot className="h-8 w-8 text-purple-400" />
                                </div>
                                <h2 className="text-white font-bold text-xl mb-2">{t("title")}</h2>
                                <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">{t("subtitle")}</p>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}

                        {/* Streaming Terminal */}
                        {isLoading && rawStream && <StreamTerminal text={rawStream} />}
                        {isLoading && !rawStream && (
                            <div className="flex items-center gap-3 py-4">
                                <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />
                                <p className="text-purple-300 font-mono text-xs tracking-widest uppercase">{t("calculating")}</p>
                            </div>
                        )}

                        {/* Results */}
                        {!isLoading && spec && <SpecResultCards spec={spec} t={t} />}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Input Bar (bottom) */}
                <div className="flex-shrink-0 border-t border-white/5 bg-[#0A0E17]/80 backdrop-blur-md">
                    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 space-y-2">
                        {bboxStr && <RegionBanner coords={bboxStr} onClear={() => setBboxStr(null)} />}

                        <form onSubmit={handleGenerate} className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-15 group-hover:opacity-30 transition duration-500" />
                            <div className="relative bg-slate-900 border border-white/10 rounded-2xl flex items-end p-2 gap-2 shadow-2xl">
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder={messages.length > 0 ? t("chatInputPlaceholder") : t("chatInputInitial")}
                                    className="w-full bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none px-3 py-3 text-sm min-h-[44px] max-h-[120px]"
                                    rows={1}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(e); }
                                    }}
                                    onInput={e => {
                                        const el = e.currentTarget;
                                        el.style.height = "auto";
                                        el.style.height = Math.min(el.scrollHeight, 120) + "px";
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !prompt.trim()}
                                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl p-3 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] disabled:shadow-none flex-shrink-0"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Exported Page ───────────────────────────────────────────────────────────

export default function MissionDesignerPage() {
    return (
        <Suspense fallback={
            <div className="absolute inset-0 z-30 bg-[#0A0E17]/95 backdrop-blur-3xl flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            </div>
        }>
            <MissionDesignerInner />
        </Suspense>
    );
}
