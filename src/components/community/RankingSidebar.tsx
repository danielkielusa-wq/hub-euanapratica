import { RankingMember } from '@/types/community';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankingSidebarProps {
  ranking: RankingMember[];
  isLoading?: boolean;
  currentUserId?: string;
}

export function RankingSidebar({ ranking, isLoading, currentUserId }: RankingSidebarProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-[24px] p-6 border border-border/50">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-amber-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-700" />;
      default:
        return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{position}</span>;
    }
  };

  const getLevelBadgeColor = (level: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-600',
      2: 'bg-green-100 text-green-700',
      3: 'bg-blue-100 text-blue-700',
      4: 'bg-purple-100 text-purple-700',
      5: 'bg-amber-100 text-amber-700',
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  return (
    <div className="bg-card rounded-[24px] p-6 border border-border/50">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="font-bold text-foreground">Membros Ativos</h3>
      </div>

      <div className="space-y-3">
        {ranking.map((member, index) => {
          const isCurrentUser = member.user_id === currentUserId;
          const initials = member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

          return (
            <div
              key={member.user_id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-xl transition-colors',
                isCurrentUser && 'bg-primary/5 border border-primary/20',
                index < 3 && 'py-3'
              )}
            >
              <div className="w-6 flex justify-center">
                {getPositionIcon(index + 1)}
              </div>
              
              <Avatar className={cn('h-8 w-8', index < 3 && 'h-10 w-10')}>
                <AvatarImage src={member.profile_photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium text-foreground truncate',
                  index < 3 ? 'text-sm' : 'text-xs'
                )}>
                  {member.full_name}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 text-amber-500" />
                  {member.total_points} XP
                </div>
              </div>

              <div className={cn(
                'text-xs font-bold rounded-full px-2 py-0.5',
                getLevelBadgeColor(member.level)
              )}>
                Lv.{member.level}
              </div>
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum membro ainda
        </p>
      )}
    </div>
  );
}
