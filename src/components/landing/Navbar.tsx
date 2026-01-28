import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoHorizontal from '@/assets/logo-horizontal.png';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logoHorizontal} alt="EUA Na Prática" className="h-8" />
        </Link>

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
