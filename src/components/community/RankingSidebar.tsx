import { RankingMember } from '@/types/community';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp } from 'lucide-react';

interface RankingSidebarProps {
  ranking: RankingMember[];
  isLoading?: boolean;
  currentUserId?: string;
}

export function RankingSidebar({ ranking, isLoading, currentUserId }: RankingSidebarProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="text-brand-500" size={20} />
        <h3 className="font-bold text-gray-900">Top Helpers</h3>
      </div>

      <div className="space-y-4">
        {ranking.map((member, idx) => {
          const initials = member.full_name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || '?';

          return (
            <div
              key={member.user_id}
              className="flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm overflow-hidden ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white ${
                      idx === 0 ? 'bg-amber-400' : 'bg-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                    {member.full_name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {member.total_points} XP
                  </p>
                </div>
              </div>
              {idx < 2 && (
                <TrendingUp size={14} className="text-green-500" />
              )}
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          Nenhum membro ainda
        </p>
      )}

      {ranking.length > 0 && (
        <button className="w-full mt-6 py-2 text-xs font-bold text-gray-400 hover:text-brand-600 transition-colors">
          Ver Ranking Completo
        </button>
      )}
    </div>
  );
}
