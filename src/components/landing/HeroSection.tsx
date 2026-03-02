import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (window.innerWidth < 1200) return;
    const container = imgRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;

    container.style.transform = `perspective(1200px) rotateX(${y}deg) rotateY(${x}deg)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (imgRef.current) {
      imgRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    }
  }, []);

  return (
    <section id="hero-animation">
      <div
        id="landingHero"
        className="relative pt-28 md:pt-40 pb-16 md:pb-24 lg:pb-32 overflow-hidden"
        style={{
          background: 'linear-gradient(138.18deg, #eae8fd 0%, #fce5e6 94.44%)',
          borderRadius: '0 0 2rem 2rem',
        }}
      >
        <img
          src="/images/landing/backgrounds/hero-bg.png"
          alt=""
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full object-cover"
        />
        <div className="container mx-auto max-w-7xl px-4 relative">
          <div className="text-center relative">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4"
              style={{
                background: 'linear-gradient(to right, #28c76f 0%, #5a4aff 47.92%, #ff3739 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shine 2s ease-in-out infinite alternate',
              }}
            >
              Uma plataforma para impulsionar
              <br className="hidden lg:block" />
              sua carreira nos EUA
            </h1>
            <h2 className="text-base md:text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              ResumePass com IA, tradução de títulos, vagas curadas e mentoria
              <br className="hidden lg:block" />
              para profissionais brasileiros no mercado americano.
            </h2>
            <div className="relative inline-block">
              <span className="hidden md:flex absolute -left-44 -top-6 items-center text-sm font-medium text-gray-600 gap-1">
                Junte-se à comunidade
                <img
                  src="/images/landing/icons/Join-community-arrow.png"
                  alt=""
                  className="h-8"
                />
              </span>
              <Link to="/cadastro">
                <Button
                  size="lg"
                  className="bg-landing-primary hover:bg-landing-primary-dark text-white px-8 py-6 text-base rounded-md shadow-lg"
                >
                  Acessar o Hub
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Dashboard Image with Parallax */}
          <div
            className="mt-12 lg:mt-16"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <a href="#landingFeatures" className="block">
              <div ref={imgRef} className="relative transition-transform duration-200">
                <img
                  src="/images/landing/landing-page/hero-dashboard-light.png"
                  alt="Hub Dashboard"
                  className="w-full rounded-lg shadow-2xl"
                />
              </div>
            </a>
          </div>
        </div>
        <div className="h-8 md:h-16 lg:h-24" />
      </div>
    </section>
  );
}
