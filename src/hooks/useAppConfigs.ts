import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppConfig {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export function useAppConfigs() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_configs')
        .select('*')
        .order('key');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (key: string, value: string) => {
    try {
      setIsSaving(true);

      const { data: { user } } = await supabase.auth.getUser();

      // Use upsert to insert if key doesn't exist, or update if it does
      const { error } = await supabase
        .from('app_configs')
        .upsert({
          key,
          value,
          updated_by: user?.id
        }, {
          onConflict: 'key',
          ignoreDuplicates: false
        });

      if (error) throw error;

      // Refetch to ensure local state is in sync with database
      await fetchConfigs();

      toast({
        title: 'Configuração salva',
        description: 'A configuração foi atualizada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const getConfigValue = (key: string) => {
    return configs.find(c => c.key === key)?.value || '';
  };

  return {
    configs,
    isLoading,
    isSaving,
    updateConfig,
    getConfigValue,
    refetch: fetchConfigs,
  };
}
