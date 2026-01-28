import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Youtube } from 'lucide-react';
import logoHorizontal from '@/assets/logo-horizontal.png';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center">
              <img src={logoHorizontal} alt="EUA Na Prática" className="h-8" />
            </Link>
            <p className="text-sm text-muted-foreground">
              Transformando o sonho americano em um plano de carreira sólido e executável.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Plataforma
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Portal do Aluno
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Currículo AI
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Mentores
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Empresa
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Carreiras
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Imprensa
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Siga-nos
            </h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/euanapratica"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/euanapratica"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/@euanapratica"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 EUA Na Prática. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
