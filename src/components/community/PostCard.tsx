import { CommunityPost } from '@/types/community';
import { Heart, MessageCircle, MoreHorizontal, Zap, Share2, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePostUpsell } from '@/hooks/usePostUpsell';
import { UpsellCard } from './UpsellCard';
import { toast } from '@/hooks/use-toast';

const TRENDING_THRESHOLD = 10;

interface PostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showFull?: boolean;
}

export function PostCard({ post, onLike, showFull = false }: PostCardProps) {
  const { logEvent } = useAnalytics();
  const { data: upsellData } = usePostUpsell(post.id);
  const author = post.profiles;
  const category = post.community_categories;
  const initials = author?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const timeAgo = post.is_pinned
    ? 'Fixado'
    : formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: ptBR,
      });

  const content = showFull ? post.content : post.content.slice(0, 200);
  const hasMore = !showFull && post.content.length > 200;
  const isTrending = post.likes_count >= TRENDING_THRESHOLD;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/comunidade/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link copiado!' });
  };

  return (
    <div
      className={cn(
        'bg-white rounded-[32px] p-6 md:p-8 border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group',
        post.is_pinned
          ? 'border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20'
          : 'border-gray-100'
      )}
    >
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="absolute top-0 right-0 p-4">
          <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full transform rotate-12 shadow-sm">
            <Zap size={16} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Post Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-sm ring-gray-200 text-gray-600 bg-gray-50 overflow-hidden">
            {author?.profile_photo_url ? (
              <img
                src={author.profile_photo_url}
                className="w-full h-full rounded-full object-cover"
                alt=""
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {author?.full_name || 'Anonimo'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-300 hover:text-gray-600 p-2 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-6 relative z-10">
        <Link
          to={`/comunidade/${post.id}`}
          className="block group/link"
          onClick={() =>
            logEvent({
              event_type: 'community_post_open',
              entity_type: 'community_post',
              entity_id: post.id,
              metadata: { source: 'card' },
            })
          }
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight group-hover/link:text-brand-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm mb-4">
            {content}
            {hasMore && (
              <span className="text-brand-600 font-medium">... ver mais</span>
            )}
          </p>
        </Link>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {category && (
            <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-gray-100">
              #{category.name}
            </span>
          )}
          {isTrending && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-100">
              <Flame size={10} fill="currentColor" /> Trending
            </span>
          )}
        </div>
      </div>

      {/* Upsell Card */}
      {upsellData && (
        <div className="mb-6 relative z-10">
          <UpsellCard data={upsellData} />
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50 relative z-10">
        <div className="flex gap-6">
          {/* Like button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLike(post.id);
            }}
            className={cn(
              'flex items-center gap-2 text-sm font-bold transition-all group/btn',
              post.user_has_liked
                ? 'text-red-500'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <div
              className={cn(
                'p-2 rounded-full group-hover/btn:bg-red-50 transition-colors',
                post.user_has_liked && 'bg-red-50'
              )}
            >
              <Heart
                size={18}
                className={cn(
                  'group-hover/btn:scale-110 transition-transform',
                  post.user_has_liked && 'fill-red-500'
                )}
              />
            </div>
            {post.likes_count}
          </button>

          {/* Comment button */}
          <Link
            to={`/comunidade/${post.id}`}
            onClick={() =>
              logEvent({
                event_type: 'community_post_open',
                entity_type: 'community_post',
                entity_id: post.id,
                metadata: { source: 'comment_button' },
              })
            }
          >
            <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-all group/btn">
              <div className="p-2 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                <MessageCircle
                  size={18}
                  className="group-hover/btn:scale-110 transition-transform"
                />
              </div>
              {post.comments_count}
            </button>
          </Link>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="text-gray-400 hover:text-brand-600 transition-colors p-2 hover:bg-brand-50 rounded-full"
        >
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}
