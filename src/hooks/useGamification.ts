import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserGamification, GamificationRule, RankingMember, Badge, UserBadge } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useGamification() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserGamification | null>(null);
  const [ranking, setRanking] = useState<RankingMember[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*, profiles:user_id (id, full_name, profile_photo_url)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116' && error.status !== 406) {
        console.error('[Gamification] fetchUserStats error:', error);
      }

      if (data) {
        setUserStats(data);
      } else {
        // No gamification row yet — fetch profile separately for the card
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, profile_photo_url')
          .eq('id', user.id)
          .maybeSingle();

        setUserStats({
          user_id: user.id,
          total_points: 0,
          level: 1,
          posts_count: 0,
          comments_count: 0,
          likes_received: 0,
          last_activity_at: new Date().toISOString(),
          profiles: profile || undefined,
        });
      }
    } catch (err) {
      console.error('[Gamification] fetchUserStats failed:', err);
    }
  }, [user]);

  const fetchRanking = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_community_ranking', { p_limit: 10 });

      if (error) throw error;

      setRanking(data || []);
    } catch (err) {
      console.error('[Gamification] fetchRanking failed:', err);
    }
  }, []);

  const fetchUserBadges = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116' && error.status !== 406) {
        throw error;
      }

      setUserBadges(data || []);
    } catch (err) {
    }
  }, [user]);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUserStats(),
        fetchRanking(),
        fetchUserBadges(),
      ]);
      setIsLoading(false);
    };

    fetchAll();
  }, [fetchUserStats, fetchRanking, fetchUserBadges]);

  return {
    userStats,
    ranking,
    userBadges,
    isLoading,
    refetch: async () => {
      await Promise.all([fetchUserStats(), fetchRanking(), fetchUserBadges()]);
    },
  };
}

// Admin hook for managing gamification rules
export function useGamificationRules() {
  const [rules, setRules] = useState<GamificationRule[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_rules')
        .select('*')
        .order('action_type');

      if (error) throw error;
      setRules(data || []);
    } catch (err) {
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('condition_type');

      if (error) throw error;
      setBadges(data || []);
    } catch (err) {
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchRules(), fetchBadges()]);
      setIsLoading(false);
    };
    load();
  }, [fetchRules, fetchBadges]);

  const updateRule = async (id: string, points: number) => {
    try {
      const { error } = await supabase
        .from('gamification_rules')
        .update({ points })
        .eq('id', id);

      if (error) throw error;

      setRules(prev => prev.map(r => r.id === id ? { ...r, points } : r));
      toast({ title: 'Regra atualizada!' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  };

  const createBadge = async (badge: Omit<Badge, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert(badge)
        .select()
        .single();

      if (error) throw error;

      setBadges(prev => [...prev, data]);
      toast({ title: 'Badge criada!' });
      return data;
    } catch (err: any) {
      toast({ title: 'Erro ao criar badge', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const updateBadge = async (id: string, updates: Partial<Badge>) => {
    try {
      const { error } = await supabase
        .from('badges')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setBadges(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      toast({ title: 'Badge atualizada!' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  };

  const deleteBadge = async (id: string) => {
    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBadges(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Badge removida!' });
    } catch (err: any) {
      toast({ title: 'Erro ao remover', description: err.message, variant: 'destructive' });
    }
  };

  return {
    rules,
    badges,
    isLoading,
    updateRule,
    createBadge,
    updateBadge,
    deleteBadge,
    refetch: async () => {
      await Promise.all([fetchRules(), fetchBadges()]);
    },
  };
}
