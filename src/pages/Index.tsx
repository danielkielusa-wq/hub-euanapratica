import {
  Navbar,
  HeroSection,
  FeaturesSection,
  ReviewsSection,
  TeamSection,
  PricingSection,
  FunFactsSection,
  FAQSection,
  CTASection,
  ContactSection,
  Footer,
} from '@/components/landing';

export default function Index() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden" data-bs-spy="scroll">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ReviewsSection />
      <TeamSection />
      <PricingSection />
      <FunFactsSection />
      <FAQSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
}
