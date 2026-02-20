import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Youtube } from 'lucide-react';
import logoHorizontal from '@/assets/logo-horizontal.png';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-landing-navy">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="grid gap-8 py-12 sm:py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center">
              <img
                src={logoHorizontal}
                alt="EUA Na Prática"
                className="h-8 brightness-0 invert"
              />
            </Link>
            <p className="text-xs leading-relaxed text-white/40 sm:text-sm">
              Transformando o sonho americano em um plano de carreira sólido e executável.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 sm:mb-4">
              Plataforma
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {['ResumePass', 'Title Translator', 'Prime Jobs', 'Comunidade'].map((item) => (
                <li key={item}>
                  <Link
                    to="/login"
                    className="text-xs text-white/50 transition-colors hover:text-white sm:text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 sm:mb-4">
              Empresa
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {['Sobre Nós', 'Carreiras', 'Imprensa'].map((item) => (
                <li key={item}>
                  <Link
                    to="/login"
                    className="text-xs text-white/50 transition-colors hover:text-white sm:text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 sm:mb-4">
              Social
            </h4>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: 'https://instagram.com/danielkielusa' },
                { icon: Linkedin, href: 'https://www.linkedin.com/in/danielkiel/' },
                { icon: Youtube, href: 'https://www.youtube.com/@eua_na_pratica' },
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:border-white/30 hover:text-white sm:h-10 sm:w-10"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/5 py-6 sm:py-8">
          <p className="text-center text-[10px] text-white/25 sm:text-xs">
            &copy; 2026 EUA Na Prática. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
