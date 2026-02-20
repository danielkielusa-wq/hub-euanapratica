import { RankingMember } from '@/types/community';
import { Skeleton } from '@/components/ui/skeleton';

interface RankingSidebarProps {
  ranking: RankingMember[];
  isLoading?: boolean;
  currentUserId?: string;
}

export function RankingSidebar({ ranking, isLoading }: RankingSidebarProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <Skeleton className="h-5 w-28 mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-8">
      {/* Top Helpers */}
      <div>
        <h3 className="text-sm font-bold mb-6">Top Helpers</h3>
        <div className="space-y-6">
          {ranking.slice(0, 5).map((member, idx) => {
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
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gray-50 text-gray-600 overflow-hidden">
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
                    {idx === 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold">
                        1
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold group-hover:text-brand-600 transition-colors">
                      {member.full_name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold">
                      {member.total_points} XP
                    </p>
                  </div>
                </div>
                {idx === 0 && (
                  <div className="w-6 h-6 bg-brand-600 text-white text-[10px] font-bold rounded-md flex items-center justify-center">
                    {initials}
                  </div>
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

      </div>
    </div>
  );
}
