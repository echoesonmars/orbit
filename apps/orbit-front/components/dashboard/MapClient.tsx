"use client";

import dynamic from "next/dynamic";

// SSR disabled here because Leaflet requires window — only allowed in Client Components
const InteractiveMap = dynamic(
    () => import("@/components/dashboard/InteractiveMap").then((m) => m.InteractiveMap),
    {
        ssr: false,
        loading: () => <div className="absolute inset-0 bg-[#0A0E17]" />,
    }
);

export function MapClient() {
    return <InteractiveMap />;
}
