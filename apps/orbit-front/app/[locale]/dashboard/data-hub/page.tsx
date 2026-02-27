"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useMapStore } from "@/lib/store/mapStore";
import Link from "next/link";
import {
    ChevronLeft,
    Cloud,
    Calendar,
    Leaf,
    Satellite,
    Loader2,
    ShoppingCart,
    Info,
    Database,
    Search,
    Image as ImageIcon
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
    fullres: string;
    price: number;
    areaSqKm: number;
};

import { createClient } from "@/lib/supabase/client";

// Fetch real scenes from Gateway API
const fetchScenesFromAPI = async (bbox: { southWest: { lat: number; lng: number }; northEast: { lat: number; lng: number } }): Promise<SatelliteScene[]> => {
    try {
        const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';

        // Get real Supabase token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';

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

    // Filters & UI State
    const [maxCloudCover, setMaxCloudCover] = useState(20);
    const [selectedScene, setSelectedScene] = useState<SatelliteScene | null>(null);

    const handleSearch = useCallback(async () => {
        if (!bbox) return;
        setIsLoading(true);
        setHasSearched(true);
        try {
            // In a full implementation, you'd pass date ranges here too.
            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || '';

            const response = await fetch(`${gatewayUrl}/api/v1/data-hub/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bbox: bbox,
                    filters: { cloudCover: maxCloudCover }
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            setScenes(data);
        } catch (error) {
            console.error("Failed to fetch scenes", error);
            // In a real app, trigger a toast notification here
        } finally {
            setIsLoading(false);
        }
    }, [bbox, maxCloudCover]);

    useEffect(() => {
        if (bbox && !hasSearched) {
            handleSearch();
        }
    }, [bbox, hasSearched, handleSearch]);

    // Mock purchase handler
    const handleBuy = (scene: SatelliteScene) => {
        // Here you would use a toast library like Sonner
        alert(`Added Scene ${scene.id} to cart for $${scene.price}`);
    };

    return (
        <div className="absolute inset-0 z-30 bg-[#0A0E17]/80 backdrop-blur-xl pointer-events-auto flex flex-col">
            {/* Top Bar / Filters */}
            <div className="bg-slate-900/60 border-b border-white/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Database className="h-6 w-6 text-orange-400" />
                            {t("title")}
                        </h2>
                        {bbox && (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                <span className="text-[11px] font-mono text-orange-300">
                                    BBOX: {bbox.southWest.lat.toFixed(2)}, {bbox.southWest.lng.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {bbox && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-medium">Max Cloud Cover: {maxCloudCover}%</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={maxCloudCover}
                                onChange={(e) => setMaxCloudCover(Number(e.target.value))}
                                className="w-24 md:w-32 accent-orange-500"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {t("searchBtn")}
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
                {!bbox ? (
                    // EMPTY STATE
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-6 shadow-2xl">
                            <ImageIcon className="h-10 w-10 text-slate-500" />
                        </div>
                        <h3 className="text-2xl text-white font-semibold mb-3">{t("emptyTitle")}</h3>
                        <p className="text-slate-400 text-base leading-relaxed mb-8">
                            {t("emptyDesc")}
                        </p>
                        <Link
                            href="/dashboard"
                            className="bg-white hover:bg-slate-200 text-slate-900 px-8 py-3 rounded-full text-sm font-bold transition-colors shadow-lg"
                        >
                            {t("emptyBtn")}
                        </Link>
                    </div>
                ) : (
                    // RESULTS
                    <div>
                        {isLoading ? (
                            // SKELETON GRID
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-slate-800/30 rounded-2xl border border-white/5 p-4 animate-pulse">
                                        <div className="w-full aspect-square bg-slate-700/50 rounded-xl mb-4" />
                                        <div className="h-4 bg-slate-700/50 rounded-full w-3/4 mb-2" />
                                        <div className="h-3 bg-slate-700/50 rounded-full w-1/2 mb-4" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="h-8 bg-slate-700/50 rounded-lg" />
                                            <div className="h-8 bg-slate-700/50 rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // REAL DATA GRID
                            <div className="space-y-4">
                                <div className="text-sm text-slate-400 font-medium">
                                    {t("resultsFound", { count: scenes.length })}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {scenes.map((scene) => (
                                        <div
                                            key={scene.id}
                                            className="group bg-slate-800/40 border border-white/10 hover:border-orange-500/50 rounded-2xl overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)] flex flex-col"
                                        >
                                            {/* Thumbnail Container */}
                                            <div
                                                className="relative w-full aspect-square bg-slate-900 overflow-hidden cursor-pointer"
                                                onClick={() => setSelectedScene(scene)}
                                            >
                                                {scene.thumbnail ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={scene.thumbnail}
                                                        alt={scene.id}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                                                        <Satellite className="h-12 w-12 text-slate-700" />
                                                    </div>
                                                )}

                                                {/* Price Badge Overlay */}
                                                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30">
                                                    <span className="text-emerald-400 font-mono text-sm font-bold">${scene.price}</span>
                                                </div>

                                                {/* Zoom Icon Overlay that appears on hover */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-full">
                                                        <Search className="h-6 w-6 text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Data Card */}
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h4 className="text-slate-200 font-semibold text-sm truncate mb-3" title={scene.id}>
                                                    {scene.id}
                                                </h4>

                                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                                        <span className="truncate">{scene.date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <Satellite className="h-3.5 w-3.5 text-slate-500" />
                                                        <span className="truncate">{scene.sensor}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <Cloud className="h-3.5 w-3.5 text-slate-500" />
                                                        <span className={cn(scene.cloudCover > 20 ? "text-red-400" : "text-emerald-400")}>
                                                            {scene.cloudCover}% CC
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <Leaf className="h-3.5 w-3.5 text-slate-500" />
                                                        <span className="truncate">{scene.ndvi} NDVI</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => setSelectedScene(scene)}
                                                        className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors border border-white/5 flex items-center justify-center gap-1.5"
                                                    >
                                                        <Info className="h-3.5 w-3.5" />
                                                        Details
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleBuy(scene); }}
                                                        className="py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold transition-colors border border-orange-500/20 flex items-center justify-center gap-1.5"
                                                    >
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                        Buy
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LIGHTBOX / IMAGE MODAL */}
            {selectedScene && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedScene(null)}>
                    <div
                        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl max-h-full overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,0,0,0.5)] transform scale-100 transition-transform"
                        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
                    >
                        {/* Image Section (Left) */}
                        <div className="w-full md:w-2/3 bg-black flex items-center justify-center relative group min-h-[300px]">
                            {(selectedScene.fullres || selectedScene.thumbnail) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={selectedScene.fullres || selectedScene.thumbnail}
                                    alt={selectedScene.id}
                                    className="max-w-full max-h-[80vh] object-contain"
                                    loading="eager"
                                />
                            ) : (
                                <Satellite className="h-24 w-24 text-slate-700" />
                            )}
                            <button
                                onClick={() => setSelectedScene(null)}
                                className="absolute top-4 left-4 md:hidden bg-black/50 p-2 rounded-full text-white/70 hover:text-white"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Details Section (Right) */}
                        <div className="w-full md:w-1/3 flex flex-col p-6 bg-slate-900 border-l border-white/5 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6 hidden md:flex">
                                <h3 className="text-white font-bold text-lg">Scene Details</h3>
                                <button
                                    onClick={() => setSelectedScene(null)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <span className="sr-only">Close</span>
                                    &times; {/* Simple X or use Lucas icon */}
                                </button>
                            </div>

                            <h4 className="text-slate-300 font-mono text-xs break-all mb-6 pb-4 border-b border-white/10">
                                {selectedScene.id}
                            </h4>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Acquisition Date</span>
                                    <span className="text-white font-medium">{selectedScene.date}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Sensor</span>
                                    <span className="text-white font-medium">{selectedScene.sensor}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Cloud Cover</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full", selectedScene.cloudCover > 20 ? "bg-red-500" : "bg-emerald-500")}
                                                style={{ width: `${Math.min(100, selectedScene.cloudCover)}%` }}
                                            />
                                        </div>
                                        <span className={cn("font-medium", selectedScene.cloudCover > 20 ? "text-red-400" : "text-emerald-400")}>
                                            {selectedScene.cloudCover}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Est. NDVI</span>
                                    <span className="text-white font-medium">{selectedScene.ndvi}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Total Price</p>
                                    <p className="text-emerald-400 text-3xl font-bold font-mono">${selectedScene.price}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        handleBuy(selectedScene);
                                        setSelectedScene(null);
                                    }}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all flex items-center gap-2"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
