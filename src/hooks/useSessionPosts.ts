import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface SessionPostAuthor {
  full_name: string;
  profile_photo_url: string | null;
}

export interface SessionPost {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  is_mentor_post: boolean;
  created_at: string;
  vote_count: number;
  has_voted: boolean;
  author: SessionPostAuthor;
}

// Fetch posts with vote counts for a session
export function useSessionPosts(sessionId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['session-posts', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      // Fetch posts with author info
      const { data: posts, error: postsError } = await supabase
        .from('session_posts')
        .select(`
          id,
          session_id,
          user_id,
          content,
          is_mentor_post,
          created_at
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(posts.map(p => p.user_id))];

      // Fetch profiles for authors
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch vote counts for all posts
      const postIds = posts.map(p => p.id);
      const { data: votes, error: votesError } = await supabase
        .from('session_post_votes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      if (votesError) throw votesError;

      // Calculate vote counts and check if current user voted
      const voteCountMap = new Map<string, number>();
      const userVotedMap = new Map<string, boolean>();

      postIds.forEach(id => {
        voteCountMap.set(id, 0);
        userVotedMap.set(id, false);
      });

      votes?.forEach(vote => {
        voteCountMap.set(vote.post_id, (voteCountMap.get(vote.post_id) || 0) + 1);
        if (vote.user_id === user?.id) {
          userVotedMap.set(vote.post_id, true);
        }
      });

      // Combine all data
      const enrichedPosts: SessionPost[] = posts.map(post => ({
        id: post.id,
        session_id: post.session_id,
        user_id: post.user_id,
        content: post.content,
        is_mentor_post: post.is_mentor_post || false,
        created_at: post.created_at,
        vote_count: voteCountMap.get(post.id) || 0,
        has_voted: userVotedMap.get(post.id) || false,
        author: profileMap.get(post.user_id) || { full_name: 'Usuário', profile_photo_url: null }
      }));

      // Sort by vote count (most voted first)
      return enrichedPosts.sort((a, b) => b.vote_count - a.vote_count);
    },
    enabled: !!sessionId && !!user
  });

  // Real-time subscription for posts and votes
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session_posts_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_posts',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['session-posts', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['session-post-count', sessionId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_post_votes'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['session-posts', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  return query;
}

// Get total post count for all sessions in an espaco (for badge display on Discussão tab)
export function useEspacoDiscussionCount(espacoId: string | undefined) {
  return useQuery({
    queryKey: ['espaco-discussion-count', espacoId],
    queryFn: async () => {
      if (!espacoId) return 0;

      // Get all session IDs for this espaco
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .eq('espaco_id', espacoId);

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return 0;

      const sessionIds = sessions.map(s => s.id);

      // Count posts for these sessions
      const { count, error } = await supabase
        .from('session_posts')
        .select('*', { count: 'exact', head: true })
        .in('session_id', sessionIds);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!espacoId
  });
}

// Get post count for a session (for badge display)
export function useSessionPostCount(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-post-count', sessionId],
    queryFn: async () => {
      if (!sessionId) return 0;

      const { count, error } = await supabase
        .from('session_posts')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!sessionId
  });
}

// Create a new post
export function useCreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      if (!user) throw new Error('User not authenticated');

      const isMentor = user.role === 'mentor' || user.role === 'admin';

      const { data, error } = await supabase
        .from('session_posts')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          content: content.trim(),
          is_mentor_post: isMentor
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-posts', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session-post-count', variables.sessionId] });
    }
  });
}

// Toggle vote on a post
export function useVotePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, sessionId, hasVoted }: { postId: string; sessionId: string; hasVoted: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('session_post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase
          .from('session_post_votes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-posts', variables.sessionId] });
    }
  });
}

// Delete a post
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, sessionId }: { postId: string; sessionId: string }) => {
      const { error } = await supabase
        .from('session_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-posts', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session-post-count', variables.sessionId] });
    }
  });
}
