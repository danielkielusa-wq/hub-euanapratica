import { Search, Moon, Sun, Globe, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { HeaderCreditIndicator } from './HeaderCreditIndicator';

function IconButton({ icon: Icon, onClick, children }: { icon: React.ElementType; onClick?: () => void; children?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-500 hover:bg-gray-100 hover:text-[#7367F0] rounded-full transition-colors"
    >
      <Icon className="w-5 h-5" />
      {children}
    </button>
  );
}

export function DashboardTopbar() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { planName, isVipPlan, isPremiumPlan, planId, planAccess, isLoading: planLoading } = usePlanAccess();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Restore theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const triggerSearch = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  };

  const userName = user?.full_name || 'Usuário';

  // Initials fallback
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarGradient = isVipPlan
    ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
    : isPremiumPlan
    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
    : 'bg-gradient-to-br from-gray-400 to-gray-500';

  return (
    <nav className="h-[64px] px-4 md:px-6 bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Left: Search trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={triggerSearch}
          className="hidden md:flex items-center gap-2 text-gray-400 dark:text-muted-foreground bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 px-3 py-2 rounded-lg transition-colors cursor-pointer w-64"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Buscar (Ctrl+K)</span>
        </button>
        <button
          onClick={triggerSearch}
          className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-full"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-1">
        <IconButton icon={Globe} />
        <IconButton icon={isDark ? Sun : Moon} onClick={toggleDarkMode} />
        <IconButton icon={LayoutGrid} onClick={() => navigate('/catalogo')} />
        <NotificationCenter />

        {/* Credits */}
        <div className="ml-1">
          <HeaderCreditIndicator
            remaining={planAccess?.remaining ?? 0}
            monthlyLimit={planAccess?.monthlyLimit ?? 5}
            usedThisMonth={planAccess?.usedThisMonth ?? 0}
            planId={planId}
            planName={planName}
            isLoading={planLoading}
          />
        </div>

        {/* User */}
        <button
          onClick={() => navigate('/perfil')}
          className="ml-2 pl-3 border-l border-gray-200 dark:border-white/10 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-700 dark:text-foreground">{userName}</div>
            <div className="text-[11px] text-gray-500 dark:text-muted-foreground">{planName}</div>
          </div>
          <div className="relative">
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-card shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs border-2 border-white dark:border-card shadow-sm',
                avatarGradient
              )}>
                {initials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-card rounded-full" />
          </div>
        </button>
      </div>
    </nav>
  );
}
