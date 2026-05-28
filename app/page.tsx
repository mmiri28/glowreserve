import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import HowItWorks from "@/components/landing/HowItWorks";
import TopSalons from "@/components/landing/TopSalons";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <CategoriesSection />
      <HowItWorks />
      <TopSalons />
      <Footer />
    </main>
  );
}

export const dynamic = "force-dynamic";
