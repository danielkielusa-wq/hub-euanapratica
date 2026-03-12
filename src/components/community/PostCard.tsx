import { useState } from 'react';
import { CommunityPost } from '@/types/community';
import { Heart, MessageSquare, MoreHorizontal, Share2, Flame, MapPin, Crown, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePostUpsell } from '@/hooks/usePostUpsell';
import { useAuth } from '@/contexts/AuthContext';
import { UpsellCard } from './UpsellCard';
import { InlineComments } from './InlineComments';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TRENDING_THRESHOLD = 10;

interface PostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onEdit?: (postId: string, title: string, content: string) => Promise<unknown>;
  onDelete?: (postId: string) => void;
  showFull?: boolean;
}

export function PostCard({ post, onLike, onEdit, onDelete, showFull = false }: PostCardProps) {
  const { user } = useAuth();
  const { logEvent } = useAnalytics();
  const { data: upsellData } = usePostUpsell(post.id);
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(showFull);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const isAuthor = user?.id === post.user_id;
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
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-gray-800 dark:text-foreground text-sm">
                {author?.full_name || 'Anonimo'}
              </h4>
              {author?.special_badge && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-200 dark:border-amber-500/20">
                  <Crown size={10} /> {author.special_badge}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(post.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3 mb-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm font-bold border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-700 dark:text-foreground/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <div className="flex gap-2">
            <button
              disabled={isSaving || !editTitle.trim() || !editContent.trim()}
              onClick={async () => {
                if (!onEdit) return;
                setIsSaving(true);
                await onEdit(post.id, editTitle.trim(), editContent.trim());
                setIsSaving(false);
                setIsEditing(false);
              }}
              className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => {
                setEditTitle(post.title);
                setEditContent(post.content);
                setIsEditing(false);
              }}
              className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
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
      )}

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
