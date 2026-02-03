import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface SidebarUserCardProps {
  onLogout: () => void;
}

export function SidebarUserCard({ onLogout }: SidebarUserCardProps) {
  const { user } = useAuth();
  const { planName, isVipPlan, isPremiumPlan, theme } = usePlanAccess();
  const navigate = useNavigate();

  if (!user) return null;

  // Get user initials from full_name
  const initials = user.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // Plan badge colors
  const planBadgeClasses = isVipPlan
    ? 'bg-purple-100 text-purple-700'
    : isPremiumPlan
    ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-600';

  const avatarClasses = isVipPlan
    ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
    : isPremiumPlan
    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
    : 'bg-gradient-to-br from-gray-400 to-gray-500';

  return (
    <div className="p-4 border-t border-gray-100">
      {/* User Card */}
      <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl mb-3">
        {/* Avatar */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
          avatarClasses
        )}>
          {initials}
        </div>

        {/* Name and Plan */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user.full_name || 'Usuário'}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
              planBadgeClasses
            )}>
              {planName}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Upgrade Button - Only show if not VIP */}
      {!isVipPlan && (
        <button
          onClick={() => navigate('/dashboard/hub')}
          className="w-full py-2.5 px-4 border-2 border-blue-600 text-blue-600 text-xs font-bold uppercase tracking-wide rounded-xl hover:bg-blue-50 transition-colors"
        >
          Upgrade para VIP
        </button>
      )}
    </div>
  );
}
