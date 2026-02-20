import { useState } from 'react';
import { CommunityPost } from '@/types/community';
import { Heart, MessageCircle, MoreHorizontal, Zap, Share2, Flame, ChevronDown } from 'lucide-react';
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
        'bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden',
        post.is_pinned
          ? 'border-indigo-100'
          : 'border-gray-100'
      )}
    >
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="absolute top-0 right-0 p-3">
          <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-full">
            <Zap size={14} fill="currentColor" />
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-gray-600 bg-gray-50 overflow-hidden">
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
              <h4 className="text-sm font-bold">
                {author?.full_name || 'Anonimo'}
              </h4>
              <p className="text-[10px] text-gray-400">{timeAgo}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
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
          <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight group-hover/link:text-brand-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            {content}
            {hasMore && (
              <span className="text-brand-600 font-medium">... ver mais</span>
            )}
            {category && (
              <span className="text-blue-500 font-medium"> #{category.name}</span>
            )}
          </p>
        </Link>

        {/* Post Image */}
        {post.image_url && (
          <div className="rounded-xl overflow-hidden mb-4">
            <img
              src={post.image_url}
              alt="Post"
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}

        {/* Trending badge */}
        {isTrending && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-100">
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
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLike(post.id);
              }}
              className={cn(
                'flex items-center gap-2 transition-colors',
                post.user_has_liked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              )}
            >
              <Heart
                className="w-5 h-5"
                fill={post.user_has_liked ? 'currentColor' : 'none'}
              />
              <span className="text-xs font-bold">{post.likes_count}</span>
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
                'flex items-center gap-2 transition-colors',
                showComments
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
              )}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-bold">{post.comments_count}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Inline Comments */}
        {showComments && (
          <InlineComments postId={post.id} />
        )}
      </div>
    </div>
  );
}
