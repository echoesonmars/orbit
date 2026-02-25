"use client";

export function MapPlaceholder() {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0E17]">
            {/* Animated star field */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0f1a3a_0%,_#0A0E17_70%)]" />

            {/* Grid overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.15) 1px, transparent 1px)
          `,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Diagonal scanning line animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line" />
            </div>

            {/* Glowing orbs (simulate continents/hotspots) */}
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-cyan-400/8 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

            {/* SVG Globe outline */}
            <svg
                viewBox="0 0 800 800"
                className="absolute inset-0 w-full h-full opacity-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="400" cy="400" r="280" stroke="#00F0FF" strokeWidth="1" />
                <ellipse cx="400" cy="400" rx="280" ry="100" stroke="#00F0FF" strokeWidth="0.5" />
                <ellipse cx="400" cy="400" rx="280" ry="200" stroke="#00F0FF" strokeWidth="0.5" />
                <line x1="120" y1="400" x2="680" y2="400" stroke="#00F0FF" strokeWidth="0.5" />
                <line x1="400" y1="120" x2="400" y2="680" stroke="#00F0FF" strokeWidth="0.5" />
                {/* Latitude lines */}
                {[-180, -120, -60, 0, 60, 120, 180].map((lat, i) => (
                    <ellipse
                        key={i}
                        cx="400"
                        cy="400"
                        rx={Math.cos((lat * Math.PI) / 180) * 280}
                        ry={Math.cos((lat * Math.PI) / 180) * 60}
                        stroke="#00F0FF"
                        strokeWidth="0.3"
                    />
                ))}
            </svg>

            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative flex items-center justify-center opacity-30">
                    <div className="absolute w-16 h-px bg-cyan-400" />
                    <div className="absolute h-16 w-px bg-cyan-400" />
                    <div className="w-4 h-4 border border-cyan-400 rotate-45" />
                </div>
            </div>

            {/* Bottom gradient for Panel readability */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0A0E17]/60 to-transparent pointer-events-none" />

            {/* Map placeholder notice */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <p className="text-xs text-slate-500 font-mono">
                    Interactive Satellite Map — Coming Soon
                </p>
            </div>
        </div>
    );
}
