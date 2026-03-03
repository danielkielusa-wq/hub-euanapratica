import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MenuRole = 'student' | 'mentor';

export type StudentMenuKey =
  | 'hub' | 'comunidade' | 'agendamentos' | 'catalogo' | 'cursos' | 'espacos'
  | 'dashboard' | 'biblioteca' | 'tarefas'
  | 'curriculo' | 'title_translator' | 'prime_jobs'
  | 'pricing' | 'assinatura' | 'perfil' | 'pedidos' | 'suporte';

export type MentorMenuKey =
  | 'dashboard' | 'espacos' | 'agendamentos' | 'disponibilidade' | 'agenda' | 'tarefas'
  | 'biblioteca'
  | 'perfil' | 'suporte';

export type MenuVisibilityConfig = {
  student: Record<StudentMenuKey, boolean>;
  mentor: Record<MentorMenuKey, boolean>;
};

const DEFAULT_CONFIG: MenuVisibilityConfig = {
  student: {
    hub: true, comunidade: true, agendamentos: true, catalogo: true, cursos: true, espacos: true,
    dashboard: true, biblioteca: true, tarefas: true,
    curriculo: true, title_translator: true, prime_jobs: true,
    pricing: true, assinatura: true, perfil: true, pedidos: true, suporte: true,
  },
  mentor: {
    dashboard: true, espacos: true, agendamentos: true, disponibilidade: true, agenda: true, tarefas: true,
    biblioteca: true,
    perfil: true, suporte: true,
  },
};

async function fetchMenuVisibility(): Promise<MenuVisibilityConfig> {
  const { data, error } = await supabase
    .from('app_configs')
    .select('value')
    .eq('key', 'menu_visibility')
    .maybeSingle();

  if (error || !data?.value) return DEFAULT_CONFIG;

  try {
    const parsed = JSON.parse(data.value) as MenuVisibilityConfig;
    // Merge with defaults so new keys default to true
    return {
      student: { ...DEFAULT_CONFIG.student, ...parsed.student },
      mentor: { ...DEFAULT_CONFIG.mentor, ...parsed.mentor },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useMenuVisibility() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config = DEFAULT_CONFIG, isLoading } = useQuery({
    queryKey: ['menu-visibility'],
    queryFn: fetchMenuVisibility,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isItemVisible = useCallback(
    (role: MenuRole, key: string): boolean => {
      const roleConfig = config[role] as Record<string, boolean>;
      // If key not in config, default to visible
      return roleConfig[key] !== false;
    },
    [config]
  );

  const updateVisibility = useCallback(
    async (role: MenuRole, key: string, visible: boolean) => {
      const newConfig: MenuVisibilityConfig = {
        ...config,
        [role]: {
          ...(config[role] as Record<string, boolean>),
          [key]: visible,
        },
      };

      // Optimistic update
      queryClient.setQueryData(['menu-visibility'], newConfig);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('app_configs')
          .upsert(
            { key: 'menu_visibility', value: JSON.stringify(newConfig), updated_by: user?.id },
            { onConflict: 'key', ignoreDuplicates: false }
          );

        if (error) throw error;
      } catch (err: any) {
        // Rollback on error
        queryClient.setQueryData(['menu-visibility'], config);
        toast({
          title: 'Erro ao salvar',
          description: err.message,
          variant: 'destructive',
        });
      }
    },
    [config, queryClient, toast]
  );

  return { config, isLoading, isItemVisible, updateVisibility };
}
