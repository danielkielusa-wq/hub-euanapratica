import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApiConfig {
  id: string;
  name: string;
  api_key: string;
  base_url: string | null;
  credentials: Record<string, string>; // Frontend vê valores mascarados
  parameters: Record<string, any>;
  description: string | null;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface ApiConfigInput {
  name: string;
  api_key: string;
  base_url?: string;
  credentials: Record<string, string>; // Frontend envia em plaintext, backend criptografa
  parameters?: Record<string, any>;
  description?: string;
  is_active?: boolean;
}

/**
 * Hook para gerenciar configurações de APIs no admin
 */
export function useAdminApis() {
  const { toast } = useToast();
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  const fetchApis = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('api_configs')
        .select('*')
        .order('name');

      if (error) throw error;

      // Mascarar credenciais para exibição
      const maskedApis = (data || []).map(api => ({
        ...api,
        credentials: maskCredentials(api.credentials as Record<string, string> | null),
        parameters: (api.parameters || {}) as Record<string, any>,
      })) as ApiConfig[];

      setApis(maskedApis);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar APIs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createApi = useCallback(async (input: ApiConfigInput) => {
    try {
      setIsSaving('creating');
      const { data: { user } } = await supabase.auth.getUser();

      // Step 1: Insere a API sem credenciais
      const { data: insertData, error: insertError } = await supabase
        .from('api_configs')
        .insert({
          name: input.name,
          api_key: input.api_key,
          base_url: input.base_url || null,
          parameters: input.parameters || {},
          description: input.description || null,
          is_active: input.is_active !== false,
          updated_by: user?.id,
        })
        .select();

      if (insertError) throw insertError;


      // Step 2: Se tem credenciais, usa RPC para salvar
      const hasCredentials = input.credentials && Object.keys(input.credentials).length > 0;
      if (hasCredentials) {
        const { error: rpcError } = await supabase.rpc('admin_update_api_credentials', {
          p_api_key: input.api_key,
          p_credentials_json: input.credentials,
        });

        if (rpcError) {
          throw new Error(`API criada mas erro ao salvar credenciais: ${rpcError.message}`);
        }
      }

      toast({
        title: 'API configurada',
        description: `${input.name} foi adicionada com sucesso.`,
      });

      await fetchApis();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar API',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(null);
    }
  }, [toast, fetchApis]);

  const updateApi = useCallback(async (id: string, input: Partial<ApiConfigInput>) => {
    try {
      setIsSaving(id);
      const { data: { user } } = await supabase.auth.getUser();

      const hasCredentials = input.credentials && Object.keys(input.credentials).length > 0;

      if (hasCredentials) {
      }

      // Step 1: Atualiza campos normais via update direto
      const { data, error } = await supabase
        .from('api_configs')
        .update({
          name: input.name,
          base_url: input.base_url || null,
          parameters: input.parameters || {},
          description: input.description || null,
          is_active: input.is_active,
          updated_by: user?.id || null,
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhum registro foi atualizado. Verifique permissões de admin.');
      }

      // Step 2: Se tem credenciais, usa RPC (SECURITY DEFINER) para salvar
      if (hasCredentials && input.api_key) {

        const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_api_credentials', {
          p_api_key: input.api_key,
          p_credentials_json: input.credentials as any,
        });


        if (rpcError) {
          throw new Error(`Erro ao salvar credenciais: ${rpcError.message}`);
        }

        // Verifica se foi salvo
        const { data: verifyData, error: verifyError } = await supabase
          .from('api_configs')
          .select('credentials, api_key')
          .eq('id', id)
          .single();


        if (verifyData?.credentials) {
          const credKeys = Object.keys(verifyData.credentials as any);
        } else {
        }
      }

      toast({
        title: 'API atualizada',
        description: hasCredentials
          ? 'Configurações e credenciais foram salvas com sucesso.'
          : 'As configurações foram salvas com sucesso.',
      });

      await fetchApis();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar API',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(null);
    }
  }, [toast, fetchApis]);

  const deleteApi = useCallback(async (id: string) => {
    try {
      setIsSaving(id);
      const { error } = await supabase
        .from('api_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'API removida',
        description: 'A configuração foi removida com sucesso.',
      });

      await fetchApis();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover API',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(null);
    }
  }, [toast, fetchApis]);

  const testConnection = useCallback(async (apiKey: string) => {
    try {
      setIsTesting(apiKey);
      const { data, error } = await supabase.functions.invoke('test-api-connection', {
        body: { api_key: apiKey },
      });

      if (error) throw error;

      toast({
        title: data.success ? '✅ Conexão bem-sucedida' : '❌ Falha na conexão',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });

      return data.success;
    } catch (error: any) {
      toast({
        title: 'Erro ao testar conexão',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsTesting(null);
    }
  }, [toast]);

  useEffect(() => {
    fetchApis();
  }, [fetchApis]);

  return {
    apis,
    isLoading,
    isSaving,
    isTesting,
    createApi,
    updateApi,
    deleteApi,
    testConnection,
    refetch: fetchApis,
  };
}

/**
 * Mascara credenciais para exibição segura no frontend
 */
function maskCredentials(credentials: Record<string, string> | null | undefined): Record<string, string> {
  if (!credentials || typeof credentials !== 'object') return {};

  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(credentials)) {
    const strValue = String(value || '');
    if (strValue.length > 8) {
      masked[key] = strValue.substring(0, 4) + '***' + strValue.substring(strValue.length - 4);
    } else if (strValue.length > 0) {
      masked[key] = '***';
    }
  }
  return masked;
}
