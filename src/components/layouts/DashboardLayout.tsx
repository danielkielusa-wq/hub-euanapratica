import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  GraduationCap,
  ClipboardList,
  UserCog,
  Calendar,
  MessageCircle,
  Library,
  FlaskConical,
  MessageSquarePlus
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FeedbackFloatingButton } from '@/components/feedback/FeedbackFloatingButton';

interface DashboardLayoutProps {
  children: ReactNode;
}

const roleNavItems = {
  student: [
    { label: 'Início', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Meus Espaços', href: '/dashboard/espacos', icon: GraduationCap },
    { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
    { label: 'Atividades', href: '/dashboard/tarefas', icon: ClipboardList },
    { label: 'Suporte', href: '/dashboard/suporte', icon: MessageCircle },
  ],
  mentor: [
    { label: 'Dashboard', href: '/mentor/dashboard', icon: LayoutDashboard },
    { label: 'Meus Espaços', href: '/mentor/espacos', icon: GraduationCap },
    { label: 'Agenda', href: '/mentor/agenda', icon: Calendar },
    { label: 'Biblioteca', href: '/biblioteca', icon: Library },
    { label: 'Tarefas', href: '/mentor/tarefas', icon: ClipboardList },
    { label: 'Perfil', href: '/perfil', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Espaços', href: '/admin/espacos', icon: GraduationCap },
    { label: 'Biblioteca', href: '/biblioteca', icon: Library },
    { label: 'Usuários', href: '/admin/usuarios', icon: Users },
    { label: 'Produtos', href: '/admin/produtos', icon: BookOpen },
    { label: 'Matrículas', href: '/admin/matriculas', icon: ClipboardList },
    { label: 'Relatórios', href: '/admin/relatorios', icon: UserCog },
    { label: 'Feedback', href: '/admin/feedback', icon: MessageSquarePlus },
    { label: 'Testes E2E', href: '/admin/testes-e2e', icon: FlaskConical },
  ],
};

const roleLabels = {
  student: 'Aluno',
  mentor: 'Mentor',
  admin: 'Administrador',
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  if (!user) return null;
  
  const navItems = roleNavItems[user.role];
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="ml-4 font-semibold text-foreground">EUA Na Prática</span>
      </header>
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 transition-transform duration-200",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">EUA Na Prática</span>
            </Link>
          </div>
          
          {/* User info */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-foreground/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Botão flutuante de feedback */}
      <FeedbackFloatingButton />
    </div>
  );
}
