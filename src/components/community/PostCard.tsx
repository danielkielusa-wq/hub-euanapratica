import { CommunityPost } from '@/types/community';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, MoreHorizontal, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showFull?: boolean;
}

export function PostCard({ post, onLike, showFull = false }: PostCardProps) {
  const author = post.profiles;
  const category = post.community_categories;
  const initials = author?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const content = showFull ? post.content : post.content.slice(0, 200);
  const hasMore = !showFull && post.content.length > 200;

  return (
    <div className={cn(
      'bg-card rounded-[24px] p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow',
      post.is_pinned && 'border-primary/30 bg-primary/5'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author?.profile_photo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-sm">
                {author?.full_name || 'Anônimo'}
              </p>
              {post.is_pinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Category Badge */}
      {category && (
        <Badge variant="secondary" className="mb-3 rounded-full text-xs font-medium">
          #{category.name}
        </Badge>
      )}

      {/* Content */}
      <Link to={`/comunidade/${post.id}`} className="block group">
        <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {content}
          {hasMore && <span className="text-primary font-medium">... ver mais</span>}
        </p>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onLike(post.id)}
          className={cn(
            'gap-2 h-9 px-3 rounded-xl',
            post.user_has_liked && 'text-red-500 hover:text-red-600'
          )}
        >
          <Heart className={cn('h-4 w-4', post.user_has_liked && 'fill-current')} />
          <span className="font-medium">{post.likes_count}</span>
        </Button>
        
        <Link to={`/comunidade/${post.id}`}>
          <Button variant="ghost" size="sm" className="gap-2 h-9 px-3 rounded-xl">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{post.comments_count}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
