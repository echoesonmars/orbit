import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MapPlaceholder } from "@/components/dashboard/MapPlaceholder";
import { StatsOverlay } from "@/components/dashboard/StatsOverlay";
import { QuickActionsPanel } from "@/components/dashboard/QuickActionsPanel";

export default function DashboardPage() {
    return (
        <>
            {/* Layer 0: Full-screen map background */}
            <MapPlaceholder />

            {/* Layer 1: Floating header */}
            <DashboardHeader />

            {/* Layer 1: Quick action cards (right side, below header) */}
            <QuickActionsPanel />

            {/* Layer 1: Stats overlay (bottom-right corner) */}
            <StatsOverlay />
        </>
    );
}
