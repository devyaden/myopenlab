import EngagementSection from "@/components/landing/engagement-section";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import Navbar from "@/components/landing/navbar";
import PricingSection from "@/components/landing/pricing-section";
import TrustSection from "@/components/landing/trust-section";

export default async function Index() {
  return (
    <>             
      <Navbar />
      <Hero />
      <Features />
      <EngagementSection />
      <PricingSection />
      <TrustSection />
      <Footer />
    </>
  );
}
