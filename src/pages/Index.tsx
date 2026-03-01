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
    <div className="min-h-screen bg-white" data-bs-spy="scroll">
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
