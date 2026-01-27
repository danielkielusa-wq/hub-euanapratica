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
      console.error('Error fetching configs:', error);
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
      
      const { error } = await supabase
        .from('app_configs')
        .update({ 
          value,
          updated_by: user?.id 
        })
        .eq('key', key);

      if (error) throw error;

      // Update local state
      setConfigs(prev => 
        prev.map(c => c.key === key ? { ...c, value, updated_at: new Date().toISOString() } : c)
      );

      toast({
        title: 'Configuração salva',
        description: 'A configuração foi atualizada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error updating config:', error);
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
