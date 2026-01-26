import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  LogOut,
  Menu,
  X,
  GraduationCap,
  ClipboardList,
  Calendar,
  MessageCircle,
  Library,
  FlaskConical,
  MessageSquarePlus,
  Users,
  BookOpen,
  UserCog,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackFloatingButton } from '@/components/feedback/FeedbackFloatingButton';
import logoHorizontal from '@/assets/logo-horizontal.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const roleNavSections: Record<string, NavSection[]> = {
  student: [
    {
      label: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Meus Espaços', href: '/dashboard/espacos', icon: GraduationCap },
        { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
        { label: 'Tarefas', href: '/dashboard/tarefas', icon: ClipboardList },
      ],
    },
    {
      label: 'SOCIAL',
      items: [
        { label: 'Suporte', href: '/dashboard/suporte', icon: MessageCircle },
      ],
    },
  ],
  mentor: [
    {
      label: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/mentor/dashboard', icon: LayoutDashboard },
        { label: 'Meus Espaços', href: '/mentor/espacos', icon: GraduationCap },
        { label: 'Agenda', href: '/mentor/agenda', icon: Calendar },
        { label: 'Biblioteca', href: '/biblioteca', icon: Library },
        { label: 'Tarefas', href: '/mentor/tarefas', icon: ClipboardList },
      ],
    },
    {
      label: 'CONFIGURAÇÕES',
      items: [
        { label: 'Perfil', href: '/perfil', icon: Settings },
      ],
    },
  ],
  admin: [
    {
      label: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Espaços', href: '/admin/espacos', icon: GraduationCap },
        { label: 'Biblioteca', href: '/biblioteca', icon: Library },
        { label: 'Usuários', href: '/admin/usuarios', icon: Users },
        { label: 'Produtos', href: '/admin/produtos', icon: BookOpen },
        { label: 'Matrículas', href: '/admin/matriculas', icon: ClipboardList },
      ],
    },
    {
      label: 'RELATÓRIOS',
      items: [
        { label: 'Relatórios', href: '/admin/relatorios', icon: UserCog },
        { label: 'Feedback', href: '/admin/feedback', icon: MessageSquarePlus },
        { label: 'Testes E2E', href: '/admin/testes-e2e', icon: FlaskConical },
      ],
    },
  ],
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  if (!user) return null;
  
  const navSections = roleNavSections[user.role] || roleNavSections.student;
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) => location.pathname === href;
  
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
        <img src={logoHorizontal} alt="EUA Na Prática" className="ml-4 h-8" />
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
            <Link to="/" className="flex items-center">
              <img src={logoHorizontal} alt="EUA Na Prática" className="h-8" />
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navSections.map((section, sectionIdx) => (
              <div key={section.label} className={cn(sectionIdx > 0 && "mt-6")}>
                <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          
          {/* Bottom Actions */}
          <div className="p-4 border-t border-border space-y-1">
            <Link
              to="/perfil"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive('/perfil')
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings className="w-5 h-5" />
              Configurações
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
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
        {children}
      </main>

      {/* Botão flutuante de feedback */}
      <FeedbackFloatingButton />
    </div>
  );
}
