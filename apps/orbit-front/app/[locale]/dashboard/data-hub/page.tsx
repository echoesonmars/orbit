"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMapStore } from "@/lib/store/mapStore";
import Link from "next/link";
import {
    ChevronLeft,
    Image as ImageIcon,
    Cloud,
    Calendar,
    Leaf,
    Satellite,
    Loader2,
    ShoppingCart,
    Info,
    Database
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data Structure
type SatelliteScene = {
    id: string;
    date: string;
    cloudCover: number;
    ndvi: number;
    sensor: string;
    thumbnail: string;
    price: number;
};

// Fetch real scenes from Gateway API
const fetchScenesFromAPI = async (bbox: { southWest: { lat: number; lng: number }; northEast: { lat: number; lng: number } }): Promise<SatelliteScene[]> => {
    try {
        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';

        // Use a dummy token or retrieve from actual auth state
        const token = localStorage.getItem('supabase.auth.token') || 'dummy-token';

        const response = await fetch(`${gatewayUrl}/api/v1/data-hub/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bbox: bbox,
                filters: {
                    cloudCover: 20 // Default max 20% cloud cover
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch scenes from Gateway:', error);
        return []; // Return empty array on failure
    }
};

export default function DataHubPage() {
    const t = useTranslations("Dashboard.dataHub");
    const { bbox } = useMapStore();

    const [scenes, setScenes] = useState<SatelliteScene[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!bbox) return;
        setIsLoading(true);
        setHasSearched(true);
        try {
            const data = await fetchScenesFromAPI(bbox);
            setScenes(data);
        } catch (error) {
            console.error("Failed to fetch scenes", error);
        } finally {
            setIsLoading(false);
        }
    }, [bbox]);

    useEffect(() => {
        // Automatically search when bbox is present and page loads
        if (bbox && !hasSearched) {
            handleSearch();
        }
    }, [bbox, hasSearched, handleSearch]);

    return (
        <div className="absolute right-0 top-14 bottom-0 w-full md:w-[480px] bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-30 flex flex-col pointer-events-auto transform transition-transform duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                            <Database className="h-5 w-5 text-orange-400" />
                            {t("title")}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{t("subtitle")}</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                {!bbox ? (
                    // EMPTY STATE (NO BBOX)
                    <div className="h-full flex flex-col items-center justify-center text-center px-6 pb-12">
                        <div className="w-16 h-16 rounded-2xl border border-dashed border-slate-600 flex items-center justify-center mb-4 bg-slate-800/50">
                            <ImageIcon className="h-8 w-8 text-slate-500" />
                        </div>
                        <h3 className="text-slate-200 font-medium mb-2">{t("emptyTitle")}</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            {t("emptyDesc")}
                        </p>
                        <Link
                            href="/dashboard"
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                        >
                            {t("emptyBtn")}
                        </Link>
                    </div>
                ) : (
                    // RESULTS OR LOADING STATE
                    <div className="space-y-4">
                        {/* BBox Info Summary */}
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                                <span className="text-xs font-mono text-orange-300">
                                    BBOX ACTIVE: {bbox.southWest.lat.toFixed(2)}, {bbox.southWest.lng.toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isLoading}
                                className="text-xs text-orange-400 hover:text-orange-300 transition-colors px-3 py-1.5 rounded-md bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                                ) : (
                                    t("searchBtn")
                                )}
                            </button>
                        </div>

                        {/* List */}
                        {isLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
                                    <Loader2 className="h-8 w-8 text-orange-400 animate-spin relative z-10" />
                                </div>
                                <p className="text-sm text-slate-400 animate-pulse">{t("loadingData")}</p>
                            </div>
                        ) : (
                            <div className="space-y-3 mt-4">
                                {scenes.length > 0 && (
                                    <div className="text-xs text-slate-400 font-medium mb-3 pl-1">
                                        {t("resultsFound", { count: scenes.length })}
                                    </div>
                                )}

                                {scenes.map((scene) => (
                                    <div
                                        key={scene.id}
                                        className="group bg-slate-800/40 border border-white/5 hover:border-orange-500/30 rounded-xl overflow-hidden transition-all hover:shadow-[0_4px_20px_rgba(249,115,22,0.1)]"
                                    >
                                        <div className="p-3 flex gap-4">
                                            {/* Thumbnail Mock */}
                                            <div className={cn(
                                                "w-20 h-20 rounded-lg flex-shrink-0 bg-gradient-to-br border border-white/10",
                                                scene.thumbnail
                                            )} />

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-slate-200 font-medium text-sm truncate pr-2">
                                                        {scene.id}
                                                    </h4>
                                                    <span className="text-emerald-400 font-mono text-xs font-semibold shrink-0">
                                                        ${scene.price}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-y-2 gap-x-1 mt-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <Calendar className="h-3 w-3 text-slate-500 shrink-0" />
                                                        <span className="truncate">{scene.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <Satellite className="h-3 w-3 text-slate-500 shrink-0" />
                                                        <span className="truncate">{scene.sensor}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <Cloud className="h-3 w-3 text-slate-500 shrink-0" />
                                                        <span className={cn(
                                                            "truncate",
                                                            scene.cloudCover > 20 ? "text-red-400" : "text-slate-300"
                                                        )}>
                                                            {scene.cloudCover}% CC
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <Leaf className="h-3 w-3 text-slate-500 shrink-0" />
                                                        <span className="truncate">{scene.ndvi} NDVI</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center border-t border-white/5 divide-x divide-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                                                <Info className="h-3 w-3" />
                                                {t("viewDetails")}
                                            </button>
                                            <button className="flex-1 py-2 flex items-center justify-center gap-1.5 text-[11px] text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-colors font-medium">
                                                <ShoppingCart className="h-3 w-3" />
                                                {t("buyScene")}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
