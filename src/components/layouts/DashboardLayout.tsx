import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackFloatingButton } from '@/components/feedback/FeedbackFloatingButton';
import { AdminAssistantButton } from '@/components/admin/assistant';
import { DunningBanner } from '@/components/subscription/DunningBanner';
import { SpotlightSearch } from './SpotlightSearch';
import { SidebarNav } from './SidebarNav';
import { SidebarUserCard } from './SidebarUserCard';
import { DashboardTopbar } from './DashboardTopbar';
import { HeaderCreditIndicator } from './HeaderCreditIndicator';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { usePlanAccess } from '@/hooks/usePlanAccess';

interface DashboardLayoutProps {
  children: ReactNode;
  rootClassName?: string;
  contentClassName?: string;
}

export function DashboardLayout({ children, rootClassName, contentClassName }: DashboardLayoutProps) {
  const { user, logout, isImpersonating } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const { logoHorizontal } = usePlatformLogo();
  const { planId, planName, planAccess, isLoading: planLoading } = usePlanAccess();

  if (!user) return null;
  
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  const toggleCollapsed = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className={rootClassName ?? "min-h-screen bg-[#F8F9FB]"}>
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
        <div className="ml-auto">
          <HeaderCreditIndicator
            remaining={planAccess?.remaining ?? 0}
            monthlyLimit={planAccess?.monthlyLimit ?? 5}
            usedThisMonth={planAccess?.usedThisMonth ?? 0}
            planId={planId}
            planName={planName}
            isLoading={planLoading}
          />
        </div>
      </header>
      
      {/* Sidebar - Floating Glassmorphism Design */}
      <aside className={cn(
        "fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-out",
        // Desktop: Floating with margin
        "lg:m-4 lg:h-[calc(100vh-32px)]",
        // Width — collapsed on desktop = 72px, expanded = 300px
        sidebarCollapsed ? "lg:w-[72px] w-[300px]" : "w-[300px]",
        // Glassmorphism style
        "bg-white/95 backdrop-blur-xl",
        "border border-gray-100/80",
        "lg:rounded-[24px]",
        "shadow-lg shadow-gray-200/50",
        // Mobile behavior
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100/80">
            <Link to="/" className={cn("flex items-center", sidebarCollapsed && "lg:hidden")}>
              <img
                src={logoHorizontal}
                alt="EUA na Prática"
                className="h-8 w-auto object-contain"
              />
            </Link>

            {/* Collapse toggle — Desktop only */}
            <button
              onClick={toggleCollapsed}
              className={cn(
                "hidden lg:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors",
                sidebarCollapsed && "mx-auto"
              )}
              title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>

            {/* Close button - Mobile only */}
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Spotlight Search */}
          <SpotlightSearch onNavigate={closeSidebar} collapsed={sidebarCollapsed} />

          {/* Navigation Groups */}
          <SidebarNav onNavigate={closeSidebar} collapsed={sidebarCollapsed} />

          {/* User Card Footer */}
          <SidebarUserCard onLogout={handleLogout} collapsed={sidebarCollapsed} />
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
        // Desktop: margin for floating sidebar (300+32 or 72+32)
        sidebarCollapsed ? "lg:ml-[104px]" : "lg:ml-[332px]",
        "min-h-screen transition-[margin] duration-300 ease-out",
        // Mobile: padding for fixed header
        "pt-16 lg:pt-0",
        // Impersonation adjustment
        isImpersonating && "pt-24 lg:pt-10"
      )}>
        {/* Desktop topbar */}
        <div className="hidden lg:block">
          <DashboardTopbar />
        </div>
        <div className={contentClassName ?? "p-4 lg:p-6"}>
          <DunningBanner />
          {children}
        </div>
      </main>

      {/* Botão flutuante de feedback */}
      <FeedbackFloatingButton />
      <AdminAssistantButton />
    </div>
  );
}
