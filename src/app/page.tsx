import { MorphingText } from "@/components/magicui/morphing-text";
import AnimatedLine from "./animations/AnimatedLine";
import NavBar from "./ui/NavBar";
import HeroSection from "./sections/HeroSection";
import ServicesSection from "./sections/ServicesSection";
import PricingBuilder from "./sections/PricingBuilder";
import ProcessSection from "./sections/ProcessSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative">
      <AnimatedLine />
      <NavBar />
      <HeroSection />
      <ServicesSection />
      <PricingBuilder />
      <ProcessSection />
    </main>
  );
}