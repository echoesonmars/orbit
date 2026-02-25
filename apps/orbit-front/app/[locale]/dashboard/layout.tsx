import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-[#0A0E17]">
            {/* Collapsible sidebar (desktop) */}
            <Sidebar />

            {/* Main content area - relative so overlays can be absolute within it */}
            <main className="flex-1 relative overflow-hidden pb-16 md:pb-0">
                {children}
            </main>
        </div>
    );
}
