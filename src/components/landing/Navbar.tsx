import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 items-center gap-1.5 rounded-lg bg-[hsl(224,76%,33%)] px-2.5 py-1">
            <span className="text-sm font-bold text-white">USA</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Na Prática</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/curriculo-usa" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Currículo AI
          </Link>
          <Link to="#servicos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Serviços
          </Link>
          <Link to="#metodologia" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Metodologia
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" className="text-[hsl(224,76%,33%)]">
              Entrar
            </Button>
          </Link>
          <Link to="/cadastro">
            <Button className="rounded-xl bg-foreground text-background hover:bg-foreground/90">
              Acessar Hub
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
