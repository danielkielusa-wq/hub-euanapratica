import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GraduationCap, User, LogOut, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Início', href: '/dashboard' },
  { label: 'Meus Espaços', href: '/dashboard/espacos' },
  { label: 'Conteúdo', href: '/dashboard/conteudo' },
  { label: 'Atividades', href: '/dashboard/tarefas' },
];

export function StudentHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="hidden lg:flex h-16 items-center justify-between px-6 border-b border-border bg-card">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-foreground">EUA Na Prática</span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 pl-2 pr-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profile_photo_url} alt={user?.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user ? getInitials(user.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
              {user?.full_name?.split(' ')[0]}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
          <DropdownMenuItem asChild>
            <Link to="/dashboard/perfil" className="flex items-center gap-2 cursor-pointer">
              <User className="w-4 h-4" />
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
