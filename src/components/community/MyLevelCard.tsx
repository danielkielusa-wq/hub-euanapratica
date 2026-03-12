import { UserGamification, getNextLevelProgress, getLevelTitle } from '@/types/community';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MyLevelCardProps {
  userStats: UserGamification | null;
  isLoading?: boolean;
}

export function MyLevelCard({ userStats, isLoading }: MyLevelCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <Skeleton className="h-24 w-full" />
        <div className="px-6 pb-6 text-center">
          <Skeleton className="h-20 w-20 rounded-full mx-auto -mt-10 mb-3" />
          <Skeleton className="h-4 w-32 mx-auto mb-2" />
          <Skeleton className="h-3 w-40 mx-auto mb-4" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (!userStats) return null;

  const fullName = userStats.profiles?.full_name || 'Membro';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = userStats.profiles?.profile_photo_url;
  const progress = getNextLevelProgress(userStats.total_points, userStats.level);
  const title = getLevelTitle(userStats.level);

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
      {/* Gradient Header */}
      <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
        <button
          className="absolute top-3 right-3 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          onClick={() => navigate('/perfil')}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6 text-center relative">
        {/* Avatar overlapping header */}
        <div className="w-20 h-20 mx-auto -mt-10 rounded-full border-4 border-white dark:border-card overflow-hidden bg-white dark:bg-card">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="w-full h-full rounded-full object-cover"
              alt=""
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-2xl">
              {initials}
            </div>
          )}
        </div>

        <h3 className="mt-3 font-bold text-gray-800 dark:text-foreground">{fullName}</h3>
        {userStats.profiles?.special_badge && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-200 dark:border-amber-500/20">
            <Crown size={10} /> {userStats.profiles.special_badge}
          </span>
        )}
        <p className="text-xs text-gray-500 dark:text-muted-foreground mb-4 mt-1">
          Nivel {userStats.level} &bull; {title}
        </p>

        {/* Stats row */}
        <div className="flex justify-center gap-6 border-t border-gray-50 dark:border-white/10 pt-4">
          <div>
            <div className="font-bold text-gray-800 dark:text-foreground">{userStats.total_points}</div>
            <div className="text-xs text-gray-400 dark:text-muted-foreground">XP</div>
          </div>
          <div>
            <div className="font-bold text-gray-800 dark:text-foreground">{Math.round(progress.percent)}%</div>
            <div className="text-xs text-gray-400 dark:text-muted-foreground">Progresso</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {userStats.level < 5 && (
            <p className="text-[10px] text-gray-400 dark:text-muted-foreground mt-1.5">
              {progress.next - userStats.total_points} XP para o Nivel {userStats.level + 1}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
