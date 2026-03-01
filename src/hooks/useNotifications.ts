import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  action_url: string | null;
  icon: string | null;
  category: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string | null;
}

export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unread_notification_count');
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Fallback: refetch every 60s
  });

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate both count and list
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
          queryClient.invalidateQueries({ queryKey: ['notifications-list'] });

          // Show toast for the new notification
          const newNotif = payload.new as Notification;
          if (newNotif?.title) {
            toast(newNotif.title, {
              description: newNotif.message || undefined,
              action: newNotif.action_url
                ? { label: 'Ver', onClick: () => window.location.assign(newNotif.action_url!) }
                : undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

export function useNotificationsList(filter: 'all' | 'unread' = 'all') {
  const { user } = useAuth();

  return useQuery<Notification[]>({
    queryKey: ['notifications-list', user?.id, filter],
    queryFn: async () => {
      let query = (supabase as any)
        .from('notifications')
        .select('id, user_id, type, title, message, action_url, icon, category, metadata, read_at, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'unread') {
        query = query.is('read_at', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    enabled: !!user?.id,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });
}
