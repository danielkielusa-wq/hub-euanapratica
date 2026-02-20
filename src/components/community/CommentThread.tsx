import { useState } from 'react';
import { CommunityComment } from '@/types/community';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Reply, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface CommentThreadProps {
  comments: CommunityComment[];
  onCreateComment: (content: string, parentId?: string) => Promise<any>;
  onLikeComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  isLoading?: boolean;
}

export function CommentThread({
  comments,
  onCreateComment,
  onLikeComment,
  onDeleteComment,
  isLoading,
}: CommentThreadProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    const result = await onCreateComment(newComment);
    if (result) {
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    const result = await onCreateComment(replyContent, parentId);
    if (result) {
      setReplyContent('');
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  const renderComment = (comment: CommunityComment, isReply = false) => {
    const author = comment.profiles;
    const initials = author?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
      addSuffix: true,
      locale: ptBR,
    });
    const isOwner = user?.id === comment.user_id;

    return (
      <div key={comment.id} className={cn('group', isReply && 'ml-10 pl-4 border-l-2 border-border/50')}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={author?.profile_photo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground">
                {author?.full_name || 'Anônimo'}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo}
              </span>
            </div>
            
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
              {comment.content}
            </p>
            
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLikeComment(comment.id)}
                className={cn(
                  'h-7 px-2 gap-1 text-xs',
                  comment.user_has_liked && 'text-red-500'
                )}
              >
                <Heart className={cn('h-3 w-3', comment.user_has_liked && 'fill-current')} />
                {comment.likes_count > 0 && comment.likes_count}
              </Button>
              
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="h-7 px-2 gap-1 text-xs"
                >
                  <Reply className="h-3 w-3" />
                  Responder
                </Button>
              )}
              
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteComment(comment.id)}
                  className="h-7 px-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="min-h-[60px] rounded-xl text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="rounded-xl"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* New comment form */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.profile_photo_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
            {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="min-h-[80px] rounded-xl"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="rounded-xl"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Comentar
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Carregando comentários...
        </p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Seja o primeiro a comentar!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
