"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMapStore } from "@/lib/store/mapStore";
import {
    Square,
    TrendingUp,
    FileText,
    X,
    MapPin,
    Crosshair,
    ZoomIn,
    ZoomOut,
    Satellite,
    Map,
    Navigation,
    Search,
    Loader2,
    Database
} from "lucide-react";
import { cn } from "@/lib/utils";

type BBox = {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
};

type SearchResult = {
    lat: string;
    lon: string;
    display_name: string;
};

export function InteractiveMap() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const drawnItemsRef = useRef<any>(null);
    const tileLayerRef = useRef<any>(null);
    const drawControlRef = useRef<any>(null);

    const [isLocating, setIsLocating] = useState(false);

    const t = useTranslations("Dashboard.map");

    const TILE_LAYERS = {
        satellite: {
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            label: t("layerSatellite"),
            icon: Satellite,
        },
        dark: {
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            label: t("layerDark"),
            icon: Map,
        },
    };

    const {
        bbox,
        isDrawing,
        tileMode,
        targetLocation,
        setBbox,
        setIsDrawing,
        setTileMode,
        setTargetLocation,
        clearBBox,
    } = useMapStore();

    // Zoom controls
    const zoomIn = () => mapRef.current?.zoomIn();
    const zoomOut = () => mapRef.current?.zoomOut();

    // Geolocation
    const locateUser = () => {
        if (!mapRef.current) return;
        setIsLocating(true);
        mapRef.current.locate({ setView: true, maxZoom: 8 });

        mapRef.current.once('locationfound', () => {
            setIsLocating(false);
        });

        mapRef.current.once('locationerror', () => {
            setIsLocating(false);
            alert("Could not find your location.");
        });
    };

    // Listen to global targetLocation changes (from Header Search Bar)
    useEffect(() => {
        if (targetLocation && mapRef.current) {
            mapRef.current.flyTo([targetLocation.lat, targetLocation.lon], 10);
            setTargetLocation(null);
        }
    }, [targetLocation, setTargetLocation]);

    // Activate rectangle draw mode
    const startDraw = () => {
        const map = mapRef.current;
        if (!map) return;
        setIsDrawing(true);
        clearBBox();
        import("leaflet").then(({ default: L }) => {
            import("leaflet-draw").then(() => {
                const drawer = new (L as any).Draw.Rectangle(map, {
                    shapeOptions: {
                        color: "#00F0FF",
                        weight: 2,
                        fillOpacity: 0.08,
                        dashArray: "6 4",
                    },
                });
                drawer.enable();
                drawControlRef.current = drawer;
            });
        });
    };

    // Switch tile layer
    const switchTile = useCallback((mode: "satellite" | "dark") => {
        const map = mapRef.current;
        if (!map) return;
        import("leaflet").then(({ default: L }) => {
            if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
            const layer = L.tileLayer(TILE_LAYERS[mode].url, {
                attribution: "",
                subdomains: "abcd",
                maxZoom: 12,
            }).addTo(map);
            tileLayerRef.current = layer;
        });
        setTileMode(mode);
    }, [setTileMode]);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const initMap = async () => {
            const L = (await import("leaflet")).default;
            await import("leaflet-draw");

            delete (L.Icon.Default.prototype as any)._getIconUrl;

            const map = L.map(mapContainerRef.current!, {
                center: [48.0, 67.0], // Centered roughly on Kazakhstan/Central Asia
                zoom: 4,
                minZoom: 2,
                maxZoom: 12,
                zoomControl: false,
                attributionControl: false,
                worldCopyJump: true,
                maxBounds: [
                    [-90, -180 * 100], // Allow 100 worlds of continuous horizontal panning
                    [90, 180 * 100],
                ],
                maxBoundsViscosity: 1.0, // Hard stop at the edges
            });
            mapRef.current = map;

            // Default tile layer
            const baseLayer = L.tileLayer(TILE_LAYERS.satellite.url, {
                subdomains: "abcd",
                maxZoom: 12,
            }).addTo(map);
            tileLayerRef.current = baseLayer;

            // Drawn items layer
            const drawnItems = new L.FeatureGroup();
            drawnItemsRef.current = drawnItems;
            map.addLayer(drawnItems);

            // Listen for draw:created
            map.on((L as any).Draw.Event.CREATED, (e: any) => {
                drawnItems.clearLayers();
                drawnItems.addLayer(e.layer);
                const bounds = e.layer.getBounds();
                setBbox({
                    northEast: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
                    southWest: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
                });
                setIsDrawing(false);
            });

            map.on((L as any).Draw.Event.DRAWSTOP, () => {
                setIsDrawing(false);
            });
        };

        const timer = setTimeout(() => {
            initMap().catch(console.error);
        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        };
    }, []);

    return (
        <>
            {/* Map canvas */}
            <div ref={mapContainerRef} className="absolute inset-0 z-0" style={{ background: "#0A0E17" }} />

            {/* === LEFT TOOLBAR (custom React buttons) === */}
            <div className="absolute left-6 top-24 z-20 flex flex-col gap-3">
                {/* Draw BBox */}
                <button
                    onClick={startDraw}
                    title={t("draw")}
                    className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        "bg-slate-900/80 backdrop-blur-md border",
                        isDrawing
                            ? "border-cyan-400 text-cyan-400 shadow-[0_0_14px_rgba(0,240,255,0.4)]"
                            : "border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-400/5"
                    )}
                >
                    <Square className="h-5 w-5" />
                </button>

                {/* Zoom In */}
                <button
                    onClick={zoomIn}
                    title={t("zoomIn")}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                >
                    <ZoomIn className="h-5 w-5" />
                </button>

                {/* Zoom Out */}
                <button
                    onClick={zoomOut}
                    title={t("zoomOut")}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                >
                    <ZoomOut className="h-5 w-5" />
                </button>

                {/* My Location */}
                <button
                    onClick={locateUser}
                    title={t("myLocation")}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all mt-2"
                >
                    {isLocating ? (
                        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                    ) : (
                        <Navigation className="h-5 w-5" />
                    )}
                </button>

                {/* Tile toggle */}
                <div className="flex flex-col gap-1 mt-2 rounded-xl overflow-hidden border border-white/10 bg-slate-900/80 backdrop-blur-md">
                    {(["dark", "satellite"] as const).map((mode) => {
                        const Icon = TILE_LAYERS[mode].icon;
                        return (
                            <button
                                key={mode}
                                onClick={() => switchTile(mode)}
                                title={TILE_LAYERS[mode].label}
                                className={cn(
                                    "w-12 h-12 flex items-center justify-center transition-all",
                                    tileMode === mode
                                        ? "text-cyan-400 bg-cyan-400/10"
                                        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* === DRAWING HINT === */}
            {isDrawing && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                    <div className="flex items-center gap-2 rounded-full bg-cyan-400/10 backdrop-blur-md border border-cyan-500/30 px-4 py-2">
                        <Crosshair className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                        <span className="text-xs text-cyan-300 font-mono">{t("drawHint")}</span>
                    </div>
                </div>
            )}

            {/* === NO BBOX: idle hint === */}
            {!bbox && !isDrawing && (
                <div className="absolute bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <div className="flex items-center gap-2 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 px-4 py-2">
                        <Square className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-400 font-mono">
                            {t("idleHint")}
                        </span>
                    </div>
                </div>
            )}

            {/* === BBOX SELECTED: Action panel === */}
            {bbox && (
                <div className="absolute bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-20 w-[92vw] max-w-lg">
                    <div className="rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 p-4 shadow-2xl">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-white">{t("areaSelected")}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        SW {bbox.southWest.lat.toFixed(3)}°, {bbox.southWest.lng.toFixed(3)}° →
                                        NE {bbox.northEast.lat.toFixed(3)}°, {bbox.northEast.lng.toFixed(3)}°
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { clearBBox(); drawnItemsRef.current?.clearLayers(); }} className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5 flex-shrink-0">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(() => {
                                const bboxParams = bbox
                                    ? `?swLat=${bbox.southWest.lat.toFixed(5)}&swLng=${bbox.southWest.lng.toFixed(5)}&neLat=${bbox.northEast.lat.toFixed(5)}&neLng=${bbox.northEast.lng.toFixed(5)}`
                                    : "";
                                return (
                                    <>
                                        <Link href={`/dashboard/data-hub${bboxParams}`} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all">
                                            <Database className="h-5 w-5 text-orange-400" />
                                            <span className="text-[11px] font-medium text-orange-400 text-center leading-tight">{t("btnDataHub")}</span>
                                        </Link>
                                        <Link href={`/dashboard/value-predictor${bboxParams}`} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-cyan-400/10 border border-cyan-500/30 hover:bg-cyan-400/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all">
                                            <TrendingUp className="h-5 w-5 text-cyan-400" />
                                            <span className="text-[11px] font-medium text-cyan-400 text-center leading-tight">{t("btnAnalyze")}</span>
                                        </Link>
                                        <Link href={`/dashboard/mission-designer${bboxParams}`} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(157,78,221,0.2)] transition-all">
                                            <Crosshair className="h-5 w-5 text-purple-400" />
                                            <span className="text-[11px] font-medium text-purple-400 text-center leading-tight">{t("btnMission")}</span>
                                        </Link>
                                        <Link href={`/dashboard/reports${bboxParams}`} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all">
                                            <FileText className="h-5 w-5 text-emerald-400" />
                                            <span className="text-[11px] font-medium text-emerald-400 text-center leading-tight">{t("btnReport")}</span>
                                        </Link>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Minimal Leaflet CSS overrides (remove default controls styling) */}
            <style>{`
                .leaflet-control-container { display: none !important; }
                .leaflet-draw-section { display: none !important; }
            `}</style>
        </>
    );
}
