import { MorphingText } from "@/components/magicui/morphing-text";
import AnimatedLine from "./animations/AnimatedLine";
import HeroSection from "./sections/HeroSection";
import ServicesSection from "./sections/ServicesSection";
import PricingBuilder from "./sections/PricingBuilder";
import ProcessSection from "./sections/ProcessSection";
import AboubakrNavBar from "./ui/AboubakrNav";
import SlidingFooter from "./ui/FooterWithReveal";
import FaqSection from "./sections/FaqSection";
import NavBar from "./ui/AboubakrNavBar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative">
      <AnimatedLine />
      {/* <NavBar /> */}
      <NavBar/>
      <HeroSection />
      <ServicesSection />
      <PricingBuilder />
      <ProcessSection />
      <FaqSection/>
      <SlidingFooter/>
    </main>
  );
}