"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { User } from "@supabase/supabase-js";
import { useMapStore } from "@/lib/store/mapStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, User as UserIcon, Search, Loader2, MapPin } from "lucide-react";

type SearchResult = {
    lat: string;
    lon: string;
    display_name: string;
};

export function DashboardHeader() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const supabase = createClient();
    const t = useTranslations("Dashboard.header");
    const tMap = useTranslations("Dashboard.map");
    const setTargetLocation = useMapStore((state) => state.setTargetLocation);

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
            const data = await res.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const jumpToLocation = (lat: string, lon: string) => {
        setTargetLocation({ lat: parseFloat(lat), lon: parseFloat(lon) });
        setSearchResults([]);
        setSearchQuery("");
    };

    const initials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : "??";

    const emailDisplay = user?.email || "Loading...";

    return (
        <header className="absolute top-0 left-0 right-0 z-[100] h-14 flex items-center justify-between px-4 md:px-6 pointer-events-none">
            {/* Background gradient for top edge visibility */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none -z-10" />

            {/* Left: Live Status */}
            <div className="flex items-center gap-4 pointer-events-auto">
                {/* Mobile: Logo */}
                <div className="md:hidden flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">O</span>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 px-3 py-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs text-slate-300 font-mono">{t("apiOnline")}</span>
                </div>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-md mx-4 pointer-events-auto relative hidden md:block">
                <form onSubmit={handleSearch} className="relative group">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tMap("searchPlaceholder")}
                        className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-full py-1.5 pl-4 pr-10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:bg-slate-900/80 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors disabled:cursor-not-allowed"
                    >
                        {isSearching ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Search className="h-3.5 w-3.5" />
                        )}
                    </button>
                </form>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl divide-y divide-white/5 z-50">
                        {searchResults.map((result, idx) => (
                            <button
                                key={idx}
                                onClick={() => jumpToLocation(result.lat, result.lon)}
                                className="w-full flex items-start gap-3 text-left px-4 py-3 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <MapPin className="h-4 w-4 mt-0.5 text-cyan-400 flex-shrink-0" />
                                <span className="line-clamp-2 leading-tight">{result.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-3 pointer-events-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-full p-1 hover:bg-white/5 transition-colors outline-none">
                            <Avatar className="h-8 w-8 border border-white/20 hover:border-cyan-400/50 transition-colors">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-52 bg-slate-900/90 backdrop-blur-xl border border-white/10 text-slate-200 mt-2"
                    >
                        <DropdownMenuLabel className="text-xs text-slate-400 font-mono">
                            {emailDisplay}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="gap-2 hover:bg-white/5 hover:text-white cursor-pointer">
                            <UserIcon className="h-4 w-4" />
                            {t("profile")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 hover:bg-white/5 hover:text-white cursor-pointer">
                            <Settings className="h-4 w-4" />
                            {t("settings")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            className="gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            {t("logout")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
