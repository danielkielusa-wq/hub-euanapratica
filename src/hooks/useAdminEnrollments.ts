import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EnrollmentExtended, EnrollmentFilters } from '@/types/admin';
import { toast } from 'sonner';

export function useAdminEnrollments(filters?: EnrollmentFilters) {
  return useQuery({
    queryKey: ['admin-enrollments', filters],
    queryFn: async () => {
      let query = supabase
        .from('user_espacos')
        .select(`
          id,
          user_id,
          espaco_id,
          enrolled_at,
          status,
          access_expires_at,
          enrolled_by,
          notes,
          last_access_at
        `)
        .order('enrolled_at', { ascending: false });

      if (filters?.espaco_id) {
        query = query.eq('espaco_id', filters.espaco_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.expiring_soon) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        query = query
          .not('access_expires_at', 'is', null)
          .lte('access_expires_at', thirtyDaysFromNow.toISOString())
          .gte('access_expires_at', now.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch related data
      const userIds = [...new Set(data.map(e => e.user_id))];
      const espacoIds = [...new Set(data.map(e => e.espaco_id))];

      const [usersResult, espacosResult] = await Promise.all([
        userIds.length > 0
          ? supabase.from('profiles').select('id, full_name, email, profile_photo_url').in('id', userIds)
          : { data: [] },
        espacoIds.length > 0
          ? supabase.from('espacos').select('id, name').in('id', espacoIds)
          : { data: [] }
      ]);

      const userMap = Object.fromEntries((usersResult.data ?? []).map(u => [u.id, u]));
      const espacoMap = Object.fromEntries((espacosResult.data ?? []).map(e => [e.id, e]));

      return data.map(enrollment => ({
        ...enrollment,
        user: userMap[enrollment.user_id],
        espaco: espacoMap[enrollment.espaco_id]
      })) as unknown as EnrollmentExtended[];
    }
  });
}

export function useEspacoStudents(espacoId: string) {
  return useQuery({
    queryKey: ['espaco-students', espacoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_espacos')
        .select('*')
        .eq('espaco_id', espacoId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      const userIds = data.map(e => e.user_id);
      if (userIds.length === 0) return [];

      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, profile_photo_url')
        .in('id', userIds);

      const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]));

      return data.map(enrollment => ({
        ...enrollment,
        user: userMap[enrollment.user_id]
      }));
    },
    enabled: !!espacoId
  });
}

interface EnrollStudentData {
  user_id: string;
  espaco_id: string;
  access_expires_at?: string;
  notes?: string;
  send_welcome_email?: boolean;
}

export function useEnrollStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnrollStudentData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase
        .from('user_espacos')
        .insert({
          user_id: data.user_id,
          espaco_id: data.espaco_id,
          access_expires_at: data.access_expires_at || null,
          notes: data.notes || null,
          enrolled_by: user.user?.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este aluno já está matriculado nesta turma');
        }
        throw error;
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['espaco-students', variables.espaco_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-espaco', variables.espaco_id] });
      toast.success('Aluno matriculado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao matricular: ' + error.message);
    }
  });
}

interface BulkEnrollData {
  espaco_id: string;
  user_ids: string[];
  access_expires_at?: string;
}

export function useBulkEnroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkEnrollData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const enrollments = data.user_ids.map(user_id => ({
        user_id,
        espaco_id: data.espaco_id,
        access_expires_at: data.access_expires_at || null,
        enrolled_by: user.user?.id,
        status: 'active'
      }));

      const { data: result, error } = await supabase
        .from('user_espacos')
        .upsert(enrollments, { onConflict: 'user_id,espaco_id', ignoreDuplicates: true })
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['espaco-students', variables.espaco_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-espaco', variables.espaco_id] });
      toast.success('Alunos matriculados com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao matricular em lote: ' + error.message);
    }
  });
}

interface TransferStudentData {
  enrollment_id: string;
  from_espaco_id: string;
  to_espaco_id: string;
}

export function useTransferStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransferStudentData) => {
      // Get the current enrollment
      const { data: enrollment, error: fetchError } = await supabase
        .from('user_espacos')
        .select('*')
        .eq('id', data.enrollment_id)
        .single();

      if (fetchError) throw fetchError;

      // Cancel old enrollment
      await supabase
        .from('user_espacos')
        .update({ status: 'cancelled' })
        .eq('id', data.enrollment_id);

      // Create new enrollment
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase
        .from('user_espacos')
        .insert({
          user_id: enrollment.user_id,
          espaco_id: data.to_espaco_id,
          access_expires_at: enrollment.access_expires_at,
          enrolled_by: user.user?.id,
          notes: `Transferido de outra turma`,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['espaco-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-espaco'] });
      toast.success('Aluno transferido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao transferir: ' + error.message);
    }
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('user_espacos')
        .update({ status: 'cancelled' })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['espaco-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-espaco'] });
      toast.success('Matrícula cancelada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cancelar: ' + error.message);
    }
  });
}

interface ExtendAccessData {
  enrollment_id: string;
  new_expiry_date: string;
}

export function useExtendAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ExtendAccessData) => {
      const { error } = await supabase
        .from('user_espacos')
        .update({ 
          access_expires_at: data.new_expiry_date,
          status: 'active' // Reactivate if expired
        })
        .eq('id', data.enrollment_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['espaco-students'] });
      toast.success('Acesso estendido com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao estender acesso: ' + error.message);
    }
  });
}

export function useEnrollmentHistory(userId: string) {
  return useQuery({
    queryKey: ['enrollment-history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch espaco names
      const espacoIds = [...new Set(data.map(h => h.espaco_id))];
      const { data: espacos } = await supabase
        .from('espacos')
        .select('id, name')
        .in('id', espacoIds);

      const espacoMap = Object.fromEntries((espacos ?? []).map(e => [e.id, e]));

      return data.map(h => ({
        ...h,
        espaco: espacoMap[h.espaco_id]
      }));
    },
    enabled: !!userId
  });
}
