import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logoHorizontal from '@/assets/logo-horizontal.png';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-landing-border bg-white/80 shadow-sm backdrop-blur-xl'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:h-[72px]">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logoHorizontal} alt="EUA Na Prática" className="h-7 sm:h-8" />
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          {[
            { label: 'Serviços', href: '#servicos' },
            { label: 'Tecnologia', href: '#ia' },
            { label: 'Metodologia', href: '#metodologia' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-landing-text-muted transition-colors hover:text-landing-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login">
            <Button
              variant="ghost"
              className="text-xs font-medium text-landing-text-muted hover:bg-transparent hover:text-landing-text sm:text-sm"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/cadastro">
            <Button className="rounded-full bg-landing-primary px-4 text-xs font-medium text-white transition-all hover:bg-landing-primary-dark hover:shadow-lg hover:shadow-landing-primary/20 sm:px-6 sm:text-sm">
              Acessar Hub
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
