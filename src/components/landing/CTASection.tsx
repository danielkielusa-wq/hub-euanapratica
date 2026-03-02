import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section id="landingCTA" className="relative py-12 lg:py-0 pb-0 overflow-hidden">
      <img
        src="/images/landing/backgrounds/cta-bg-light.png"
        alt=""
        className="absolute bottom-0 right-0 h-full w-full -z-10 object-cover"
      />
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center sm:text-center lg:text-left py-8 lg:py-16">
            <h3 className="text-2xl md:text-3xl font-bold text-landing-primary mb-2">
              Pronto para Começar?
            </h3>
            <h5 className="text-gray-600 text-base md:text-lg mb-8">
              Comece com acesso gratuito ao Hub
            </h5>
            <Link to="/cadastro">
              <Button
                size="lg"
                className="bg-landing-primary hover:bg-landing-primary-dark text-white px-8 py-6 text-base rounded-md"
              >
                Começar Agora
              </Button>
            </Link>
          </div>
          <div className="text-center lg:text-right pt-0 lg:pt-12">
            <img
              src="/images/landing/landing-page/cta-dashboard.png"
              alt="Hub Dashboard"
              className="max-w-full mt-0 lg:mt-4 inline-block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
