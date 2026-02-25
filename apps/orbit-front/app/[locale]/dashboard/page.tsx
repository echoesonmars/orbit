import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsOverlay } from "@/components/dashboard/StatsOverlay";
import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";
import { MapClient } from "@/components/dashboard/MapClient";

export default function DashboardPage() {
    return (
        <>
            {/* Layer 0: Full-screen interactive map (client component, Leaflet) */}
            <MapClient />

            {/* Layer 1: Floating header */}
            <DashboardHeader />

            {/* Layer 1: Quick action cards (right side, below header) */}
            <QuickActionsPanel />

            {/* Layer 1: Stats overlay (bottom-right corner) */}
            <StatsOverlay />
        </>
    );
}
