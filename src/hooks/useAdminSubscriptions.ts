import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserWithUsage {
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  plan_id: string;
  plan_name: string;
  monthly_limit: number;
  used_this_month: number;
  last_usage_at: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  monthly_limit: number;
}

interface UseAdminSubscriptionsReturn {
  users: UserWithUsage[];
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  changePlan: (userId: string, newPlanId: string) => Promise<boolean>;
  resetUsage: (userId: string) => Promise<boolean>;
}

export function useAdminSubscriptions(): UseAdminSubscriptionsReturn {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithUsage[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('admin_get_users_with_usage');

      if (rpcError) {
        setError('Erro ao carregar usuários');
        return;
      }

      setUsers(data || []);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price, monthly_limit')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      setPlans((data || []).map(p => ({
        ...p,
        price: Number(p.price) || 0,
      })));
    } catch (err) {
    }
  }, []);

  const changePlan = useCallback(async (userId: string, newPlanId: string): Promise<boolean> => {
    try {
      const { error: rpcError } = await supabase.rpc('admin_change_user_plan', {
        p_user_id: userId,
        p_new_plan_id: newPlanId,
      });

      if (rpcError) {
        toast({
          title: 'Erro ao alterar plano',
          description: rpcError.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Plano alterado',
        description: 'O plano do usuário foi atualizado com sucesso.',
      });

      // Refresh user list
      await fetchUsers();
      return true;
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o plano.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchUsers]);

  const resetUsage = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { error: rpcError } = await supabase.rpc('admin_reset_user_usage', {
        p_user_id: userId,
      });

      if (rpcError) {
        toast({
          title: 'Erro ao resetar uso',
          description: rpcError.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Uso resetado',
        description: 'O contador de uso do mês foi zerado.',
      });

      // Refresh user list
      await fetchUsers();
      return true;
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar o uso.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchUsers]);

  return {
    users,
    plans,
    isLoading,
    error,
    fetchUsers,
    fetchPlans,
    changePlan,
    resetUsage,
  };
}
