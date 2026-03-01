import { useState } from 'react';
import { CommunityPost } from '@/types/community';
import { Heart, MessageSquare, MoreHorizontal, Share2, Flame, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePostUpsell } from '@/hooks/usePostUpsell';
import { UpsellCard } from './UpsellCard';
import { InlineComments } from './InlineComments';
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
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(showFull);
  const author = post.profiles;
  const category = post.community_categories;
  const initials = author?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const content = isExpanded ? post.content : post.content.slice(0, 200);
  const hasMore = !isExpanded && post.content.length > 200;
  const isTrending = post.likes_count >= TRENDING_THRESHOLD;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/comunidade/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link copiado!' });
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-4 sm:p-6">
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-muted-foreground mb-3 uppercase tracking-wider">
          <MapPin className="w-3 h-3" /> Fixado
        </div>
      )}

      {/* Post Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-white/10 overflow-hidden">
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
            <h4 className="font-bold text-gray-800 dark:text-foreground text-sm">
              {author?.full_name || 'Anonimo'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        <Link
          to={`/comunidade/${post.id}`}
          className="group/link"
          onClick={() =>
            logEvent({
              event_type: 'community_post_open',
              entity_type: 'community_post',
              entity_id: post.id,
              metadata: { source: 'card' },
            })
          }
        >
          <h3 className="text-sm font-bold text-gray-800 dark:text-foreground mb-1 leading-tight group-hover/link:text-indigo-600 transition-colors">
            {post.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-700 dark:text-foreground/80 leading-relaxed mb-4 whitespace-pre-line">
          {content}
          {hasMore && (
            <button
              onClick={() => {
                setIsExpanded(true);
                logEvent({
                  event_type: 'community_post_open',
                  entity_type: 'community_post',
                  entity_id: post.id,
                  metadata: { source: 'expand' },
                });
              }}
              className="text-indigo-600 font-medium hover:underline"
            >
              ... ver mais
            </button>
          )}
          {isExpanded && !showFull && post.content.length > 200 && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-indigo-600 font-medium hover:underline ml-1"
            >
              ver menos
            </button>
          )}
        </p>
      </div>

      {/* Post Image */}
      {post.image_url && (
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 dark:border-white/10">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-auto object-cover max-h-96"
          />
        </div>
      )}

      {/* Tags */}
      {category && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
            #{category.name}
          </span>
        </div>
      )}

      {/* Trending badge */}
      {isTrending && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-100 dark:border-amber-500/20">
            <Flame size={10} fill="currentColor" /> Trending
          </span>
        </div>
      )}

      {/* Upsell Card */}
      {upsellData && (
        <div className="mb-4">
          <UpsellCard data={upsellData} />
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-4 sm:gap-6 pt-3 sm:pt-4 border-t border-gray-50 dark:border-white/5">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onLike(post.id);
          }}
          className={cn(
            'flex items-center gap-2 transition-colors text-sm group',
            post.user_has_liked
              ? 'text-red-500'
              : 'text-gray-500 hover:text-red-500'
          )}
        >
          <Heart
            className="w-4 h-4 group-hover:fill-red-500"
            fill={post.user_has_liked ? 'currentColor' : 'none'}
          />
          <span>{post.likes_count}</span>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowComments(!showComments);
            logEvent({
              event_type: 'community_post_open',
              entity_type: 'community_post',
              entity_id: post.id,
              metadata: { source: 'comment_button' },
            });
          }}
          className={cn(
            'flex items-center gap-2 transition-colors text-sm',
            showComments
              ? 'text-blue-500'
              : 'text-gray-500 hover:text-blue-500'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{post.comments_count}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors text-sm"
        >
          <Share2 className="w-4 h-4" />
          <span>0</span>
        </button>
      </div>

      {/* Inline Comments */}
      {showComments && (
        <InlineComments postId={post.id} />
      )}
    </div>
  );
}
