import { create } from 'zustand';

export type BBox = {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
};

interface MapState {
    bbox: BBox | null;
    isDrawing: boolean;
    tileMode: 'satellite' | 'dark';
    targetLocation: { lat: number; lon: number } | null;
    setBbox: (bbox: BBox | null) => void;
    setIsDrawing: (isDrawing: boolean) => void;
    setTileMode: (tileMode: 'satellite' | 'dark') => void;
    setTargetLocation: (location: { lat: number; lon: number } | null) => void;
    clearBBox: () => void;
}

export const useMapStore = create<MapState>((set) => ({
    bbox: null,
    isDrawing: false,
    tileMode: 'satellite',
    targetLocation: null,
    setBbox: (bbox) => set({ bbox }),
    setIsDrawing: (isDrawing) => set({ isDrawing }),
    setTileMode: (tileMode) => set({ tileMode }),
    setTargetLocation: (targetLocation) => set({ targetLocation }),
    clearBBox: () => set({ bbox: null }),
}));
