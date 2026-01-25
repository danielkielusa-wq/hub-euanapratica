import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/types/auth';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

interface UpdateProfileData {
  full_name?: string;
  phone?: string | null;
  phone_country_code?: string;
  is_whatsapp?: boolean;
  timezone?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single();

      if (error) throw error;

      // Log the update (ignore errors from audit log)
      try {
        await supabase.from('user_audit_logs').insert([{
          user_id: user!.id,
          changed_by_user_id: user!.id,
          action: 'profile_updated',
          new_values: JSON.parse(JSON.stringify(updates))
        }]);
      } catch (e) {
        console.error('Failed to log profile update:', e);
      }

      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
