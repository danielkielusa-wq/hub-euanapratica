import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';

const navLinks = [
  { label: 'Início', href: '#landingHero' },
  { label: 'Funcionalidades', href: '#landingFeatures' },
  { label: 'Equipe', href: '#landingTeam' },
  { label: 'FAQ', href: '#landingFAQ' },
  { label: 'Contato', href: '#landingContact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logoHorizontal } = usePlatformLogo();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 py-0 transition-all duration-200',
        scrolled || mobileOpen
          ? 'bg-white/95 backdrop-blur-xl shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between px-3 py-3 md:px-8">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden border-0 p-0"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? (
                <X className="h-6 w-6 text-landing-text" />
              ) : (
                <Menu className="h-6 w-6 text-landing-text" />
              )}
            </button>
            <a href="#landingHero" className="flex items-center gap-2" onClick={() => handleNavClick('#landingHero')}>
              <img
                src={logoHorizontal}
                alt="EUA na Prática"
                className="h-8"
              />
            </a>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-4 py-2 text-sm font-medium text-landing-text-muted hover:text-landing-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Login Button */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button className="bg-landing-primary hover:bg-landing-primary-dark text-white rounded-md px-5">
                <LogIn className="mr-2 h-4 w-4 scale-x-[-1]" />
                <span className="hidden md:inline">Entrar</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Nav */}
        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300',
            mobileOpen ? 'max-h-[400px] pb-4' : 'max-h-0'
          )}
        >
          <div className="flex flex-col gap-1 px-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="px-4 py-2 text-sm font-medium text-landing-text-muted hover:text-landing-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[-1] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </nav>
  );
}
