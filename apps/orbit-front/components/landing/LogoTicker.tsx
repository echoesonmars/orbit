"use client";

// Magic UI Marquee — infinite logo ticker
const logos = [
    { name: "SpaceX", icon: "🚀" },
    { name: "NASA", icon: "🌍" },
    { name: "ESA", icon: "🛸" },
    { name: "Rocket Lab", icon: "⚡" },
    { name: "Roscosmos", icon: "🌌" },
    { name: "Planet Labs", icon: "🛰" },
    { name: "Maxar", icon: "📡" },
    { name: "Airbus Defence", icon: "✈️" },
];

function LogoItem({ name, icon }: { name: string; icon: string }) {
    return (
        <div className="flex items-center gap-2.5 px-6 py-3 mx-4 rounded-xl border border-white/10 bg-white/5 text-white/50 text-sm font-medium whitespace-nowrap select-none hover:text-white/80 hover:border-white/20 transition-colors duration-300">
            <span className="text-base">{icon}</span>
            {name}
        </div>
    );
}

export default function LogoTicker() {
    // Double the array to create seamless loop
    const doubled = [...logos, ...logos];

    return (
        <section className="relative py-16 overflow-hidden border-y border-white/5">
            {/* Edge fades */}
            <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[#0A0E17] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[#0A0E17] to-transparent pointer-events-none" />

            <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-8">
                Доверяют лидеры отрасли
            </p>

            {/* Marquee track */}
            <div className="flex animate-marquee">
                {doubled.map((logo, i) => (
                    <LogoItem key={i} name={logo.name} icon={logo.icon} />
                ))}
            </div>
        </section>
    );
}
