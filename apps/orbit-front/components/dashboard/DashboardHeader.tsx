"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, User as UserIcon, Dot } from "lucide-react";

export function DashboardHeader() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    const initials = user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : "??";

    const emailDisplay = user?.email || "Loading...";

    return (
        <header className="absolute top-0 left-0 right-0 z-10 h-14 flex items-center justify-between px-4 md:px-6">
            {/* Left: Live Status */}
            <div className="flex items-center gap-4">
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
                    <span className="text-xs text-slate-300 font-mono">API Gateway Online</span>
                </div>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-2">
                <Badge
                    variant="outline"
                    className="hidden sm:flex border-purple-500/30 text-purple-400 bg-purple-500/10 font-mono text-xs"
                >
                    Beta v0.1
                </Badge>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-full p-1 hover:bg-white/5 transition-colors outline-none">
                            <Avatar className="h-8 w-8 border border-white/20">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden md:block text-sm text-slate-300 max-w-[140px] truncate">
                                {emailDisplay}
                            </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-52 bg-slate-900/90 backdrop-blur-xl border border-white/10 text-slate-200"
                    >
                        <DropdownMenuLabel className="text-xs text-slate-400 font-mono">
                            {emailDisplay}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="gap-2 hover:bg-white/5 hover:text-white cursor-pointer">
                            <UserIcon className="h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 hover:bg-white/5 hover:text-white cursor-pointer">
                            <Settings className="h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                            className="gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
