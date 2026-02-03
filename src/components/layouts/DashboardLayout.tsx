import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackFloatingButton } from '@/components/feedback/FeedbackFloatingButton';
import { SpotlightSearch } from './SpotlightSearch';
import { SidebarNav } from './SidebarNav';
import { SidebarUserCard } from './SidebarUserCard';
import logoHorizontal from '@/assets/logo-horizontal.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isImpersonating } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  if (!user) return null;
  
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const closeSidebar = () => setSidebarOpen(false);
  
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-foreground"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <img src={logoHorizontal} alt="USA Hub" className="ml-4 h-8" />
      </header>
      
      {/* Sidebar - Floating Glassmorphism Design */}
      <aside className={cn(
        "fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-out",
        // Desktop: Floating with margin
        "lg:m-4 lg:h-[calc(100vh-32px)]",
        // Width
        "w-[300px]",
        // Glassmorphism style
        "bg-white/95 backdrop-blur-xl",
        "border border-gray-100/80",
        "lg:rounded-[24px]",
        "shadow-lg shadow-gray-200/50",
        // Mobile behavior
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100/80">
            <Link to="/" className="flex items-center">
              <img
                src={logoHorizontal}
                alt="EUA na Prática"
                className="h-8 w-auto object-contain"
              />
            </Link>
            
            {/* Close button - Mobile only */}
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Spotlight Search */}
          <SpotlightSearch onNavigate={closeSidebar} />
          
          {/* Navigation Groups */}
          <SidebarNav onNavigate={closeSidebar} />
          
          {/* User Card Footer */}
          <SidebarUserCard onLogout={handleLogout} />
        </div>
      </aside>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30"
          onClick={closeSidebar}
        />
      )}
      
      {/* Main content */}
      <main className={cn(
        // Desktop: margin for floating sidebar
        "lg:ml-[332px] min-h-screen",
        // Mobile: padding for fixed header
        "pt-16 lg:pt-0",
        // Impersonation adjustment
        isImpersonating && "pt-24 lg:pt-10"
      )}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Botão flutuante de feedback */}
      <FeedbackFloatingButton />
    </div>
  );
}
