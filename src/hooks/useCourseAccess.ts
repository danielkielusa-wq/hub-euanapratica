import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useCourseAccess(espacoId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['course-access', espacoId, user?.id],
    queryFn: async () => {
      if (!user?.id) return { hasAccess: false, enrollment: null };

      // Admin always has access
      if (user.role === 'admin') {
        return { hasAccess: true, enrollment: null };
      }

      const { data: enrollment } = await supabase
        .from('user_espacos')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('espaco_id', espacoId)
        .eq('status', 'active')
        .maybeSingle();

      return {
        hasAccess: !!enrollment,
        enrollment,
      };
    },
    enabled: !!espacoId && !!user?.id,
  });
}
