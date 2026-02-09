import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  Assignment, 
  AssignmentWithSubmission, 
  AssignmentFilters, 
  CreateAssignmentData, 
  UpdateAssignmentData,
  AssignmentStatus
} from '@/types/assignments';

// Fetch assignments with optional filters
export function useAssignments(filters?: AssignmentFilters) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['assignments', filters, user?.id],
    queryFn: async (): Promise<AssignmentWithSubmission[]> => {
      if (!user) {
        return [];
      }

      // For students, only fetch assignments from their enrolled espacos
      if (user.role === 'student') {
        const { data: enrollments, error: enrollError } = await supabase
          .from('user_espacos')
          .select('espaco_id')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (enrollError) throw enrollError;

        if (!enrollments || enrollments.length === 0) {
          return [];
        }

        const espacoIds = enrollments.map(e => e.espaco_id);

        // If a specific espaco is requested but user isn't enrolled, return empty
        if (filters?.espaco_id && !espacoIds.includes(filters.espaco_id)) {
          return [];
        }

        let query = supabase
          .from('assignments')
          .select(`
            *,
            espaco:espacos(name),
            materials:assignment_materials(*)
          `)
          .in('espaco_id', espacoIds)
          .order('due_date', { ascending: true });

        if (filters?.espaco_id) {
          query = query.eq('espaco_id', filters.espaco_id);
        }

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        const { data: assignments, error } = await query;

        if (error) throw error;

        const { data: submissions } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .in('assignment_id', (assignments || []).map(a => a.id));

        return (assignments || []).map(assignment => ({
          ...assignment,
          my_submission: submissions?.find(s => s.assignment_id === assignment.id) || null
        })) as AssignmentWithSubmission[];
      }

      let query = supabase
        .from('assignments')
        .select(`
          *,
          espaco:espacos(name),
          materials:assignment_materials(*)
        `)
        .order('due_date', { ascending: true });

      if (filters?.espaco_id) {
        query = query.eq('espaco_id', filters.espaco_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data: assignments, error } = await query;

      if (error) throw error;

      // Get user's submissions for these assignments
      if (user?.id && assignments) {
        const { data: submissions } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', user.id)
          .in('assignment_id', assignments.map(a => a.id));

        // Merge submissions with assignments
        return assignments.map(assignment => ({
          ...assignment,
          my_submission: submissions?.find(s => s.assignment_id === assignment.id) || null
        })) as AssignmentWithSubmission[];
      }

      return assignments as AssignmentWithSubmission[];
    },
    enabled: !!user
  });
}

// Fetch single assignment with materials
export function useAssignment(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assignment', id],
    queryFn: async (): Promise<AssignmentWithSubmission | null> => {
      const { data: assignment, error } = await supabase
        .from('assignments')
        .select(`
          *,
          espaco:espacos(name),
          materials:assignment_materials(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get user's submission
      if (user?.id) {
        const { data: submission } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignment_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        return {
          ...assignment,
          my_submission: submission
        } as AssignmentWithSubmission;
      }

      return assignment as AssignmentWithSubmission;
    },
    enabled: !!id && !!user
  });
}

// Create assignment (mentor)
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAssignmentData) => {
      const { data: assignment, error } = await supabase
        .from('assignments')
        .insert({
          ...data,
          created_by: user?.id,
          published_at: data.status === 'published' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;
      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Tarefa criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar tarefa');
    }
  });
}

// Update assignment
export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAssignmentData) => {
      const updateData: Record<string, unknown> = { ...data };
      
      // Set published_at when publishing
      if (data.status === 'published') {
        const { data: current } = await supabase
          .from('assignments')
          .select('published_at')
          .eq('id', id)
          .single();
        
        if (!current?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data: assignment, error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return assignment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', variables.id] });
      toast.success('Tarefa atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar tarefa');
    }
  });
}

// Delete assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if there are submissions
      const { count } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', id)
        .neq('status', 'draft');

      if (count && count > 0) {
        throw new Error('Não é possível excluir uma tarefa com entregas');
      }

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Tarefa excluída com sucesso!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir tarefa');
    }
  });
}

// Publish assignment
export function usePublishAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('assignments')
        .update({ 
          status: 'published' as AssignmentStatus,
          published_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', id] });
      toast.success('Tarefa publicada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao publicar tarefa');
    }
  });
}

// Duplicate assignment to another espaco
export function useDuplicateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ assignmentId, targetEspacoId }: { assignmentId: string; targetEspacoId: string }) => {
      // Get original assignment
      const { data: original, error: fetchError } = await supabase
        .from('assignments')
        .select('*, materials:assignment_materials(*)')
        .eq('id', assignmentId)
        .single();

      if (fetchError) throw fetchError;

      // Create new assignment
      const { data: newAssignment, error: createError } = await supabase
        .from('assignments')
        .insert({
          espaco_id: targetEspacoId,
          title: original.title,
          description: original.description,
          instructions: original.instructions,
          due_date: original.due_date,
          submission_type: original.submission_type,
          max_file_size: original.max_file_size,
          allowed_file_types: original.allowed_file_types,
          allow_late_submission: original.allow_late_submission,
          status: 'draft',
          created_by: user?.id
        })
        .select()
        .single();

      if (createError) throw createError;

      // Copy materials if any
      if (original.materials && original.materials.length > 0) {
        const materials = original.materials.map((m: { title: string; file_url: string; file_size: number; file_type: string }) => ({
          assignment_id: newAssignment.id,
          title: m.title,
          file_url: m.file_url,
          file_size: m.file_size,
          file_type: m.file_type
        }));

        await supabase.from('assignment_materials').insert(materials);
      }

      return newAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Tarefa duplicada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao duplicar tarefa');
    }
  });
}

// Add material to assignment
export function useAddAssignmentMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      title, 
      fileUrl, 
      fileSize, 
      fileType 
    }: { 
      assignmentId: string; 
      title: string; 
      fileUrl: string; 
      fileSize?: number; 
      fileType?: string;
    }) => {
      const { data, error } = await supabase
        .from('assignment_materials')
        .insert({
          assignment_id: assignmentId,
          title,
          file_url: fileUrl,
          file_size: fileSize,
          file_type: fileType
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignment', variables.assignmentId] });
    }
  });
}

// Delete material
export function useDeleteAssignmentMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, assignmentId }: { id: string; assignmentId: string }) => {
      const { error } = await supabase
        .from('assignment_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return assignmentId;
    },
    onSuccess: (assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    }
  });
}
