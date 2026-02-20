import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useCommunityComments } from '@/hooks/useCommunityComments';
import { PostCard } from '@/components/community/PostCard';
import { CommentThread } from '@/components/community/CommentThread';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityPost } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAnalyzePost } from '@/hooks/useAnalyzePost';
import { usePostUpsell } from '@/hooks/usePostUpsell';
import { toast } from '@/hooks/use-toast';

export default function PostDetail() {
  const { id: postId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { logEvent } = useAnalytics();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const { comments, isLoading: commentsLoading, createComment, toggleCommentLike, deleteComment } = useCommunityComments(postId || '');
  const queryClient = useQueryClient();
  const analyzePost = useAnalyzePost();
  const { data: upsellData, isLoading: upsellLoading } = usePostUpsell(postId || '');
  const upsellAnalyzed = useRef(false);

  // Lazy upsell analysis: analyze existing posts that have no impression yet
  useEffect(() => {
    const shouldAnalyze = post && user && postId &&
      (upsellData === null || upsellData === undefined) && !upsellLoading &&
      !upsellAnalyzed.current && !analyzePost.isPending;

    if (shouldAnalyze) {
      upsellAnalyzed.current = true;
      analyzePost.mutate(
        { postId: post.id, title: post.title, content: post.content, userId: user.id },
        {
          onSuccess: (result) => {
            if (result.match) {
              queryClient.invalidateQueries({ queryKey: ['post-upsell', post.id] });
            }
          },
        }
      );
    }
  }, [post, user, postId, upsellData, upsellLoading]);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setPost(null);
      setPostLoading(false);
      return;
    }

    try {
      setPostLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (id, full_name, profile_photo_url),
          community_categories:category_id (*)
        `)
        .eq('id', postId)
        .maybeSingle();

      if (error) throw error;

      if (user && data) {
        const { data: likeRow } = await supabase
          .from('community_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', data.id)
          .maybeSingle();

        setPost({ ...data, user_has_liked: Boolean(likeRow) });
      } else {
        setPost(data || null);
      }
    } catch (err) {
      setPost(null);
    } finally {
      setPostLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    if (!post) return;
    logEvent({
      event_type: 'community_post_view',
      entity_type: 'community_post',
      entity_id: post.id,
      metadata: {
        source: 'detail'
      }
    });
  }, [post, logEvent]);

  const toggleLike = async (targetPostId: string) => {
    if (!user) {
      toast({ title: 'Você precisa estar logado', variant: 'destructive' });
      return;
    }

    if (!post || post.id !== targetPostId) return;

    const isLiked = Boolean(post.user_has_liked);
    logEvent({
      event_type: 'community_post_like',
      entity_type: 'community_post',
      entity_id: targetPostId,
      metadata: {
        action: isLiked ? 'unlike' : 'like',
        source: 'detail'
      }
    });
    setPost(prev => prev ? {
      ...prev,
      user_has_liked: !isLiked,
      likes_count: isLiked ? prev.likes_count - 1 : prev.likes_count + 1,
    } : prev);

    try {
      const { data: existing } = await supabase
        .from('community_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', targetPostId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('community_likes')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_likes')
          .insert({ user_id: user.id, post_id: targetPostId });
        if (error) throw error;
      }
    } catch (err) {
      setPost(prev => prev ? {
        ...prev,
        user_has_liked: isLiked,
        likes_count: isLiked ? prev.likes_count + 1 : prev.likes_count - 1,
      } : prev);
      toast({ title: 'Erro ao curtir', variant: 'destructive' });
    }
  };

  if (postLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-[24px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Link to="/comunidade">
          <Button variant="ghost" className="gap-2 mb-6 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Comunidade
          </Button>
        </Link>

        {post ? (
          <div className="space-y-8">
            <PostCard post={post} onLike={toggleLike} showFull />
            
            <div className="bg-card rounded-[24px] p-6 border border-border/50">
              <h3 className="font-bold text-foreground mb-6">
                Comentários ({post.comments_count})
              </h3>
              <CommentThread
                comments={comments}
                onCreateComment={createComment}
                onLikeComment={toggleCommentLike}
                onDeleteComment={deleteComment}
                isLoading={commentsLoading}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Discussão não encontrada</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
