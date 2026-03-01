import { Link } from 'react-router-dom';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';

export default function Footer() {
  const { logoHorizontal } = usePlatformLogo();

  return (
    <footer className="bg-[#282c3f] text-white/80">
      <div className="relative overflow-hidden z-10">
        <img
          src="/images/landing/backgrounds/footer-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover -z-10"
        />
        <div className="container mx-auto max-w-7xl px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand + Newsletter */}
            <div className="lg:col-span-5">
              <a href="#landingHero" className="inline-flex items-center gap-2 mb-6">
                <img
                  src={logoHorizontal}
                  alt="EUA na Prática"
                  className="h-8 brightness-0 invert"
                />
              </a>
              <p className="text-white/60 text-sm mb-6 max-w-sm">
                A plataforma mais completa para profissionais brasileiros que querem construir carreiras de sucesso nos Estados Unidos.
              </p>
            </div>

            {/* Links */}
            <div className="lg:col-span-2">
              <h6 className="text-white font-semibold text-sm mb-4 lg:mb-6">Plataforma</h6>
              <ul className="space-y-3">
                <li><Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">ResumePass</Link></li>
                <li><Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Title Translator</Link></li>
                <li><Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Prime Jobs</Link></li>
                <li><Link to="/login" className="text-white/60 hover:text-white text-sm transition-colors">Comunidade</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-5">
              <h6 className="text-white font-semibold text-sm mb-4 lg:mb-6">Legal</h6>
              <ul className="space-y-3">
                <li><Link to="/termos" className="text-white/60 hover:text-white text-sm transition-colors">Termos de Assinatura</Link></li>
                <li><Link to="/privacidade" className="text-white/60 hover:text-white text-sm transition-colors">Política de Privacidade</Link></li>
                <li><Link to="/cancelamento" className="text-white/60 hover:text-white text-sm transition-colors">Política de Cancelamento</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4">
        <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="text-white/50 text-sm">
            &copy; {new Date().getFullYear()}{' '}
            <a href="https://euanapratica.com" target="_blank" rel="noreferrer" className="text-white font-medium">
              EUA na Prática,
            </a>{' '}
            Feito com dedicação para sua carreira.
          </div>
          <div className="flex items-center gap-3">
            <a href="https://instagram.com/euanapratica" target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 19" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5869 6.33973C17.5774 5.62706 17.444 4.9215 17.1926 4.25456C16.9747 3.69202 16.6418 3.18112 16.2152 2.75453C15.7886 2.32793 15.2776 1.995 14.7151 1.77703C14.0568 1.5299 13.3613 1.39627 12.6582 1.38183C11.753 1.34137 11.466 1.33008 9.16819 1.33008C6.87039 1.33008 6.57586 1.33008 5.67725 1.38183C4.97451 1.39637 4.27932 1.53 3.62127 1.77703C3.05863 1.99485 2.54765 2.32772 2.12103 2.75434C1.69442 3.18096 1.36155 3.69193 1.14373 4.25456C0.896101 4.91242 0.76276 5.60776 0.749471 6.31056C0.70901 7.2167 0.696777 7.50368 0.696777 9.8015C0.696777 12.0993 0.696777 12.3928 0.749471 13.2924C0.763585 13.9963 0.89626 14.6907 1.14373 15.3503C1.36192 15.9128 1.69503 16.4236 2.1218 16.85C2.54855 17.2765 3.05957 17.6091 3.6222 17.8269C4.27846 18.084 4.97377 18.2272 5.67819 18.2504C6.58433 18.2908 6.87133 18.303 9.16913 18.303C11.4669 18.303 11.7615 18.303 12.6601 18.2504C13.3632 18.2365 14.0587 18.1032 14.717 17.8561C15.2794 17.6378 15.7902 17.3048 16.2167 16.8782C16.6433 16.4517 16.9763 15.941 17.1945 15.3785C17.442 14.7198 17.5746 14.0254 17.5888 13.3207C17.6293 12.4155 17.6414 12.1285 17.6414 9.82973C17.6396 7.53191 17.6396 7.24021 17.5869 6.33973ZM9.16255 14.1468C6.75935 14.1468 4.81251 12.2 4.81251 9.79679C4.81251 7.39359 6.75935 5.44676 9.16255 5.44676C10.3163 5.44676 11.4227 5.90506 12.2385 6.72085C13.0543 7.53664 13.5126 8.64309 13.5126 9.79679C13.5126 10.9505 13.0543 12.057 12.2385 12.8727C11.4227 13.6885 10.3163 14.1468 9.16255 14.1468ZM13.6857 6.3002C13.1258 6.3002 12.6723 5.84666 12.6723 5.28585C12.6723 4.72504 13.1258 4.27197 13.6857 4.27197C14.2456 4.27197 14.6991 4.72504 14.6991 5.28585C14.6991 5.84666 14.2456 6.3002 13.6857 6.3002Z" />
                <path d="M9.16296 12.6226C10.7236 12.6226 11.9887 11.3575 11.9887 9.79688C11.9887 8.23629 10.7236 6.97119 9.16296 6.97119C7.60238 6.97119 6.33728 8.23629 6.33728 9.79688C6.33728 11.3575 7.60238 12.6226 9.16296 12.6226Z" />
              </svg>
            </a>
            <a href="https://linkedin.com/company/euanapratica" target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>
            <a href="https://youtube.com/@euanapratica" target="_blank" rel="noreferrer" className="text-white/60 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
