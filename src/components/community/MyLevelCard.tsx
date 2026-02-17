import { UserGamification, getNextLevelProgress, getLevelTitle } from '@/types/community';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@supabase/supabase-js';

interface MyLevelCardProps {
  userStats: UserGamification | null;
  user: User | null;
  isLoading?: boolean;
}

export function MyLevelCard({ userStats, user, isLoading }: MyLevelCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
        <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-4 w-32 mx-auto mb-2" />
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
    );
  }

  if (!userStats || !user) return null;

  const fullName = (user.user_metadata?.full_name as string) || 'Membro';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const progress = getNextLevelProgress(userStats.total_points, userStats.level);
  const title = getLevelTitle(userStats.level);
  const xpRemaining = progress.next - userStats.total_points;

  return (
    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-600 to-indigo-600 opacity-10" />
      <div className="relative z-10 -mt-2">
        <div className="w-24 h-24 mx-auto rounded-full p-1 bg-white border-4 border-brand-100 shadow-xl mb-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              className="w-full h-full rounded-full object-cover"
              alt=""
            />
          ) : (
            <div className="w-full h-full rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-2xl">
              {initials}
            </div>
          )}
        </div>
        <h3 className="font-black text-gray-900 text-lg">{fullName}</h3>
        <p className="text-xs text-brand-600 font-bold uppercase tracking-widest mb-6">
          Nivel {userStats.level} &bull; {title}
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
            <span>XP Atual</span>
            <span>
              {userStats.total_points} / {progress.next}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {userStats.level < 5 && (
            <p className="text-[10px] text-gray-400 mt-2 text-right">
              Faltam {xpRemaining} XP para o Nivel {userStats.level + 1}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
