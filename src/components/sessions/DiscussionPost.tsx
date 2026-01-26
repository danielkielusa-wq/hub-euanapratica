import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ThumbsUp, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SessionPost } from '@/hooks/useSessionPosts';
import { useAuth } from '@/contexts/AuthContext';

interface DiscussionPostProps {
  post: SessionPost;
  onVote: (postId: string, hasVoted: boolean) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
}

export function DiscussionPost({ post, onVote, onDelete }: DiscussionPostProps) {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [animateVote, setAnimateVote] = useState(false);

  const initials = post.author.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const canDelete = user?.id === post.user_id || user?.role === 'admin' || user?.role === 'mentor';

  const handleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);
    
    // Trigger animation
    if (!post.has_voted) {
      setAnimateVote(true);
      setTimeout(() => setAnimateVote(false), 200);
    }

    try {
      await onVote(post.id, post.has_voted);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className={cn(
        "p-4 rounded-[20px] border transition-all animate-fade-slide-up",
        post.is_mentor_post 
          ? "bg-primary/5 dark:bg-primary/10 border-primary/20" 
          : "bg-card/70 backdrop-blur-sm border-border/40"
      )}
    >
      {/* Header: Avatar + Name + Mentor Badge + Time */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={post.author.profile_photo_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">
              {post.author.full_name}
            </span>
            {post.is_mentor_post && (
              <Badge className="bg-primary/10 text-primary border-0 text-xs px-2 py-0.5">
                Mentor
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { locale: ptBR, addSuffix: true })}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-3">
        {post.content}
      </p>
      
      {/* Actions: Upvote Button + Delete */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVote}
          disabled={isVoting}
          className={cn(
            "rounded-xl transition-all h-9 px-3",
            post.has_voted && "bg-primary/10 text-primary hover:bg-primary/20",
            animateVote && "animate-[pop_0.2s_ease-out]"
          )}
        >
          <ThumbsUp className={cn(
            "h-4 w-4 mr-1.5 transition-all",
            post.has_voted && "fill-current"
          )} />
          <span className="font-medium">{post.vote_count}</span>
        </Button>

        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
