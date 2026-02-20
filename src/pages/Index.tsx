import {
  Navbar,
  HeroSection,
  TrustLogos,
  BentoGrid,
  AIPreview,
  Testimonials,
  SuccessPath,
  WaitlistSection,
  Footer,
} from '@/components/landing';

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <TrustLogos />
      <BentoGrid />
      <AIPreview />
      <Testimonials />
      <SuccessPath />
      <WaitlistSection />
      <Footer />
    </div>
  );
}
