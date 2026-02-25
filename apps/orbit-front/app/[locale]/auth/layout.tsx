import { Meteors } from "@/components/magicui/meteors";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#030712] overflow-hidden selection:bg-indigo-500/30">
            {/* MagicUI Meteors Background */}
            <Meteors number={30} />

            {/* Content wrapper with higher z-index to stay above meteors */}
            <div className="relative z-10 w-full max-w-md p-6">
                {children}
            </div>
        </div>
    );
}
