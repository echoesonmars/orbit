"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    index: number;
    accentColor?: string;
}

export default function FeatureCard({
    icon,
    title,
    description,
    index,
    accentColor = "#00F0FF",
}: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.07 }}
            className="group relative p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl hover:border-white/20 transition-all duration-500 cursor-default overflow-hidden"
        >
            {/* Hover glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{
                    background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accentColor}08, transparent 60%)`,
                }}
            />

            {/* Top border beam on hover */}
            <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
                }}
            />

            {/* Icon */}
            <div className="text-2xl mb-4 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10">
                {icon}
            </div>

            {/* Index badge */}
            <div
                className="absolute top-5 right-5 text-xs font-mono tabular-nums opacity-30"
                style={{ color: accentColor }}
            >
                {String(index + 1).padStart(2, "0")}
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-white mb-2 tracking-tight">
                {title}
            </h3>

            {/* Description */}
            <p className="text-xs text-white/45 leading-relaxed">{description}</p>
        </motion.div>
    );
}
