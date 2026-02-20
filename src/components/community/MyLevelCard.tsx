import { UserGamification, getNextLevelProgress, getLevelTitle } from '@/types/community';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MyLevelCardProps {
  userStats: UserGamification | null;
  isLoading?: boolean;
}

export function MyLevelCard({ userStats, isLoading }: MyLevelCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
        <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-4 w-32 mx-auto mb-2" />
        <Skeleton className="h-3 w-40 mx-auto mb-4" />
        <Skeleton className="h-2 w-full rounded-full" />
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
  const xpRemaining = progress.next - userStats.total_points;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center relative">
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        onClick={() => navigate('/perfil')}
      >
        <Settings className="w-5 h-5" />
      </button>
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-white shadow-sm">
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
        <h2 className="text-lg font-bold">{fullName}</h2>
        <p className="text-xs font-medium text-brand-600 mb-4">
          Nivel {userStats.level} &bull; {title}
        </p>

        <div className="w-full space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
            <span>XP Atual</span>
            <span>{userStats.total_points} / {progress.next}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {userStats.level < 5 && (
            <p className="text-[10px] text-gray-500 font-medium">
              Faltam {xpRemaining} XP para o Nivel {userStats.level + 1}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
