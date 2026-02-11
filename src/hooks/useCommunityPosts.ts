import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommunityPost, PostFilter } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAnalyzePost } from '@/hooks/useAnalyzePost';
import { useQueryClient } from '@tanstack/react-query';

interface UseCommunityPostsOptions {
  categoryId?: string | null;
  filter?: PostFilter;
  limit?: number;
}

export function useCommunityPosts(options: UseCommunityPostsOptions = {}) {
  const { categoryId, filter = 'recent', limit = 20 } = options;
  const { user } = useAuth();
  const { logEvent } = useAnalytics();
  const analyzePost = useAnalyzePost();
  const queryClient = useQueryClient();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (id, full_name, profile_photo_url),
          community_categories:category_id (*)
        `)
        .limit(limit);

      // Apply category filter
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Apply sorting based on filter
      switch (filter) {
        case 'popular':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'unanswered':
          query = query.eq('comments_count', 0).order('created_at', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Check if user has liked each post
      if (user && data) {
        const postIds = data.map(p => p.id);
        const { data: userLikes } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        const likedPostIds = new Set(userLikes?.map(l => l.post_id));
        
        const postsWithLikeStatus = data.map(post => ({
          ...post,
          user_has_liked: likedPostIds.has(post.id),
        }));
        
        setPosts(postsWithLikeStatus);
      } else {
        setPosts(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, filter, limit, user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (title: string, content: string, categoryId?: string) => {
    if (!user) {
      toast({ title: 'Você precisa estar logado', variant: 'destructive' });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          title,
          content,
          category_id: categoryId || null,
        })
        .select(`
          *,
          profiles:user_id (id, full_name, profile_photo_url),
          community_categories:category_id (*)
        `)
        .single();

      if (error) throw error;

      setPosts(prev => [{ ...data, user_has_liked: false }, ...prev]);
      logEvent({
        event_type: 'community_post_created',
        entity_type: 'community_post',
        entity_id: data.id,
        metadata: {
          category_id: categoryId || null
        }
      });

      // Análise de upsell (assíncrono, não bloqueia)
      analyzePost.mutate(
        {
          postId: data.id,
          title,
          content,
          userId: user.id,
        },
        {
          onSuccess: (result) => {
            if (result.match) {
              console.log('[Upsell] Card created:', result.impression_id, result.service);
              queryClient.invalidateQueries({ queryKey: ['post-upsell', data.id] });
            } else {
              console.warn('[Upsell] No match. Reason:', result.reason || 'unknown', result);
            }
          },
          onError: (error) => {
            console.error('[Upsell] Analysis failed:', error);
          },
        }
      );

      toast({ title: 'Discussão criada com sucesso!' });
      return data;
    } catch (err: any) {
      toast({ title: 'Erro ao criar discussão', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({ title: 'Você precisa estar logado', variant: 'destructive' });
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.user_has_liked;

    logEvent({
      event_type: 'community_post_like',
      entity_type: 'community_post',
      entity_id: postId,
      metadata: {
        action: isLiked ? 'unlike' : 'like'
      }
    });

    // Optimistic update
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { 
            ...p, 
            user_has_liked: !isLiked, 
            likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1 
          }
        : p
    ));

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('community_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('community_likes')
          .insert({
            user_id: user.id,
            post_id: postId,
          });
        
        if (error) throw error;
      }
    } catch (err: any) {
      // Revert on error
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              user_has_liked: isLiked, 
              likes_count: isLiked ? p.likes_count : p.likes_count - 1 
            }
          : p
      ));
      toast({ title: 'Erro ao curtir', description: err.message, variant: 'destructive' });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({ title: 'Discussão removida!' });
    } catch (err: any) {
      toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' });
    }
  };

  return {
    posts,
    isLoading,
    error,
    refetch: fetchPosts,
    createPost,
    toggleLike,
    deletePost,
  };
}
