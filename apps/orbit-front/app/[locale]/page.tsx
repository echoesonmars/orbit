import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LogoTicker from "@/components/landing/LogoTicker";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import StatsSection from "@/components/landing/StatsSection";
import CtaSection from "@/components/landing/CtaSection";
import FooterSection from "@/components/landing/FooterSection";

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-[#0A0E17] text-white">
            <Navbar />
            <HeroSection />
            <LogoTicker />
            <FeaturesSection />
            <HowItWorksSection />
            <StatsSection />
            <CtaSection />
            <FooterSection />
        </main>
    );
}
