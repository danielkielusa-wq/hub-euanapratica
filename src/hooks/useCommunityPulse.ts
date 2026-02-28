import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunityPulse } from '@/types/hub';

const EMPTY_PULSE: CommunityPulse = {
  postsToday: 0,
  topPost: null,
  userLatestPost: null,
};

export function useCommunityPulse(trendingDays = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['community-pulse', user?.id, trendingDays],
    queryFn: async (): Promise<CommunityPulse> => {
      const now = new Date();
      const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const trendingISO = new Date(now.getTime() - trendingDays * 86400000).toISOString();

      // Run 3 queries in parallel
      const [countResult, topResult, userResult] = await Promise.all([
        // 1. Posts today count
        supabase
          .from('community_posts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayISO),

        // 2. Top post in trending period
        supabase
          .from('community_posts')
          .select('id, title, likes_count, comments_count, profiles!inner(full_name)')
          .gte('created_at', trendingISO)
          .order('likes_count', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // 3. User's latest post
        user?.id
          ? supabase
              .from('community_posts')
              .select('id, title, likes_count, comments_count, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const postsToday = countResult.count ?? 0;

      const topPost = topResult.data
        ? {
            id: topResult.data.id,
            title: topResult.data.title,
            likes_count: topResult.data.likes_count ?? 0,
            comments_count: topResult.data.comments_count ?? 0,
            author_name: (topResult.data.profiles as any)?.full_name ?? 'Anônimo',
          }
        : null;

      const userLatestPost = userResult.data
        ? {
            id: userResult.data.id,
            title: userResult.data.title,
            likes_count: userResult.data.likes_count ?? 0,
            comments_count: userResult.data.comments_count ?? 0,
            created_at: userResult.data.created_at ?? '',
          }
        : null;

      return { postsToday, topPost, userLatestPost };
    },
    staleTime: 2 * 60 * 1000,
  });
}
