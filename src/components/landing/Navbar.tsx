import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoHorizontal from '@/assets/logo-horizontal.png';

const NAV_LINKS = [
  { label: 'Serviços', href: '#servicos' },
  { label: 'Tecnologia', href: '#ia' },
  { label: 'Metodologia', href: '#metodologia' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        scrolled || mobileOpen
          ? 'border-b border-landing-border bg-white/80 shadow-sm backdrop-blur-xl'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:h-[72px]">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logoHorizontal} alt="EUA Na Prática" className="h-7 sm:h-8" />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-landing-text-muted transition-colors hover:text-landing-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs + Mobile hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className="hidden sm:block">
            <Button
              variant="ghost"
              className="text-xs font-medium text-landing-text-muted hover:bg-transparent hover:text-landing-text sm:text-sm"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/cadastro" className="hidden sm:block">
            <Button className="rounded-full bg-landing-primary px-4 text-xs font-medium text-white transition-all hover:bg-landing-primary-dark hover:shadow-lg hover:shadow-landing-primary/20 sm:px-6 sm:text-sm">
              Acessar Hub
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-landing-text md:hidden hover:bg-gray-100 transition-colors"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white/95 backdrop-blur-xl",
          mobileOpen ? "max-h-[400px] border-t border-landing-border" : "max-h-0"
        )}
      >
        <nav className="container mx-auto px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-landing-text-muted hover:text-landing-text hover:bg-gray-50 transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full rounded-xl text-sm">
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro" onClick={() => setMobileOpen(false)}>
              <Button className="w-full rounded-xl bg-landing-primary text-sm text-white hover:bg-landing-primary-dark">
                Acessar Hub
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
