import { TrendingUp, Users, Heart, MessageSquare, Crown } from 'lucide-react';
import { RankingMember, CommunityPost } from '@/types/community';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RankingSidebarProps {
  ranking: RankingMember[];
  posts: CommunityPost[];
  isLoading?: boolean;
  currentUserId?: string;
}

export function RankingSidebar({ ranking, posts, isLoading }: RankingSidebarProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Trending posts: sort by engagement (likes + comments), take top 3
  const trendingPosts = [...posts]
    .sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Trending Posts */}
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-800 dark:text-foreground">Em Alta</h3>
        </div>
        <div className="space-y-4">
          {trendingPosts.length > 0 ? (
            trendingPosts.map((post) => {
              const timeAgo = formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: ptBR,
              });
              const categoryName = post.community_categories?.name;

              return (
                <Link
                  key={post.id}
                  to={`/comunidade/${post.id}`}
                  className="block group"
                >
                  <div className="font-semibold text-gray-800 dark:text-foreground text-sm group-hover:text-indigo-600 transition-colors leading-tight mb-1 line-clamp-2">
                    {post.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-muted-foreground">
                    {categoryName && (
                      <>
                        <span className="text-indigo-600 font-medium">#{categoryName}</span>
                        <span>&middot;</span>
                      </>
                    )}
                    <span>{timeAgo}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {post.comments_count}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 dark:text-muted-foreground text-center py-2">
              Sem posts ainda
            </p>
          )}
        </div>
      </div>

      {/* Top Members (Suggestion-style) */}
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6">
        <h3 className="font-bold text-gray-800 dark:text-foreground mb-4">Top Membros</h3>
        <div className="space-y-4">
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
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-muted-foreground overflow-hidden">
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
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-card font-bold">
                        1
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-800 dark:text-foreground text-sm">
                        {member.full_name}
                      </span>
                      {member.special_badge && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/20">
                          <Crown size={8} /> {member.special_badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-muted-foreground">
                      {member.total_points} XP
                    </div>
                  </div>
                </div>
                <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-colors">
                  <Users className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {ranking.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-muted-foreground text-center py-4">
              Nenhum membro ainda
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
