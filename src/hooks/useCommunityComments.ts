import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityComment } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';

export function useCommunityComments(postId: string) {
  const { user } = useAuth();
  const { logEvent } = useAnalytics();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          profiles:user_id (id, full_name, profile_photo_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check likes and nest replies
      if (user && data) {
        const commentIds = data.map(c => c.id);
        const { data: userLikes } = await supabase
          .from('community_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        const likedCommentIds = new Set(userLikes?.map(l => l.comment_id));

        // Build nested structure
        const commentsMap = new Map<string, CommunityComment>();
        const rootComments: CommunityComment[] = [];

        data.forEach(comment => {
          const enriched = {
            ...comment,
            user_has_liked: likedCommentIds.has(comment.id),
            replies: [],
          };
          commentsMap.set(comment.id, enriched);
        });

        data.forEach(comment => {
          const enriched = commentsMap.get(comment.id)!;
          if (comment.parent_id) {
            const parent = commentsMap.get(comment.parent_id);
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(enriched);
            } else {
              rootComments.push(enriched);
            }
          } else {
            rootComments.push(enriched);
          }
        });

        setComments(rootComments);
      } else {
        setComments(data || []);
      }
    } catch (err) {
      console.error('[Community] fetchComments failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = async (content: string, parentId?: string) => {
    if (!user) {
      toast({ title: 'Você precisa estar logado', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId || null,
        })
        .select(`
          *,
          profiles:user_id (id, full_name, profile_photo_url)
        `)
        .single();

      if (error) throw error;

      logEvent({
        event_type: 'community_comment_created',
        entity_type: 'community_post',
        entity_id: postId,
        metadata: {
          comment_id: data.id,
          parent_id: parentId || null
        }
      });

      await fetchComments();
      toast({ title: 'Comentário adicionado!' });
      return data;
    } catch (err: any) {
      toast({ title: 'Erro ao comentar', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) {
      toast({ title: 'Você precisa estar logado', variant: 'destructive' });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('community_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

      logEvent({
        event_type: 'community_comment_like',
        entity_type: 'community_comment',
        entity_id: commentId,
        metadata: {
          action: existing ? 'unlike' : 'like'
        }
      });

      if (existing) {
        await supabase
          .from('community_likes')
          .delete()
          .eq('id', existing.id);
      } else {
        await supabase
          .from('community_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId,
          });
      }

      await fetchComments();
    } catch (err: any) {
      console.error('[Community] toggleCommentLike failed:', err);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!postId) return;
    try {
      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
      toast({ title: 'Comentário removido!' });
    } catch (err: any) {
      toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' });
    }
  };

  return {
    comments,
    isLoading,
    refetch: fetchComments,
    createComment,
    toggleCommentLike,
    deleteComment,
  };
}
