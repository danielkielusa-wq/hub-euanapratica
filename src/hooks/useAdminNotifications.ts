/**
 * Hook for managing notification type configurations in admin UI.
 * Pattern: TanStack Query + mutations + toast (same as useAdminAutomations).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NotificationTypeConfig {
  id: string;
  type_key: string;
  display_name: string;
  description: string | null;
  icon: string;
  category: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ── Query: All notification type configs ────────────────────────────
export function useNotificationTypeConfigs() {
  return useQuery<NotificationTypeConfig[]>({
    queryKey: ['notification-type-configs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notification_type_configs')
        .select('*')
        .order('category')
        .order('display_name');
      if (error) throw error;
      return (data || []) as NotificationTypeConfig[];
    },
  });
}

// ── Mutation: Toggle in_app_enabled ─────────────────────────────────
export function useToggleInApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, in_app_enabled }: { id: string; in_app_enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from('notification_type_configs')
        .update({ in_app_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { in_app_enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['notification-type-configs'] });
      toast({ title: in_app_enabled ? 'Notificacao in-app ativada' : 'Notificacao in-app desativada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao alterar', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Toggle email_enabled ──────────────────────────────────
export function useToggleEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, email_enabled }: { id: string; email_enabled: boolean }) => {
      const { error } = await (supabase as any)
        .from('notification_type_configs')
        .update({ email_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { email_enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['notification-type-configs'] });
      toast({ title: email_enabled ? 'Notificacao por email ativada' : 'Notificacao por email desativada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao alterar', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutation: Update config details ─────────────────────────────────
export function useUpdateNotificationConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      display_name?: string;
      description?: string | null;
      icon?: string;
    }) => {
      const { id, ...updates } = input;
      const { error } = await (supabase as any)
        .from('notification_type_configs')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-type-configs'] });
      toast({ title: 'Configuracao atualizada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Query: Notification stats (sent count per type) ─────────────────
export function useNotificationStats() {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('type')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;

      // Count per type
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.type] = (counts[row.type] || 0) + 1;
      }
      return counts;
    },
    refetchInterval: 60000,
  });
}
