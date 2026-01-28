import {
  Navbar,
  HeroSection,
  TrustLogos,
  BentoGrid,
  AIPreview,
  SuccessPath,
  WaitlistSection,
  Footer,
} from '@/components/landing';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TrustLogos />
      <BentoGrid />
      <AIPreview />
      <SuccessPath />
      <WaitlistSection />
      <Footer />
    </div>
  );
}
