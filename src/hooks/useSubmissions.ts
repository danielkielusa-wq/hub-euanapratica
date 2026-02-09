import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  Submission, 
  SubmissionFilters, 
  SubmitAssignmentData, 
  ReviewSubmissionData,
  AssignmentStats,
  SubmissionStatus,
  ReviewResult,
  SubmissionMessage
} from '@/types/assignments';

// Get my submission for an assignment
export function useMySubmission(assignmentId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['submission', assignmentId, user?.id],
    queryFn: async (): Promise<Submission | null> => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as Submission | null;
    },
    enabled: !!assignmentId && !!user?.id
  });
}

// Save draft
export function useSaveDraft() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SubmitAssignmentData) => {
      const submissionData = {
        assignment_id: data.assignment_id,
        user_id: user!.id,
        status: 'draft' as SubmissionStatus,
        file_url: data.file_url || null,
        file_name: data.file_name || null,
        file_size: data.file_size || null,
        text_content: data.text_content || null,
        draft_saved_at: new Date().toISOString()
      };

      const { data: submission, error } = await supabase
        .from('submissions')
        .upsert(submissionData, { 
          onConflict: 'assignment_id,user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      return submission;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission', variables.assignment_id] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    }
  });
}

// Submit assignment
export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: SubmitAssignmentData) => {
      const submissionData = {
        assignment_id: data.assignment_id,
        user_id: user!.id,
        status: 'submitted' as SubmissionStatus,
        file_url: data.file_url || null,
        file_name: data.file_name || null,
        file_size: data.file_size || null,
        text_content: data.text_content || null,
        submitted_at: new Date().toISOString()
      };

      const { data: submission, error } = await supabase
        .from('submissions')
        .upsert(submissionData, { 
          onConflict: 'assignment_id,user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      return submission;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submission', variables.assignment_id] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Tarefa entregue com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao entregar tarefa');
    }
  });
}

// Get all submissions for an assignment (mentor view)
export function useAssignmentSubmissions(assignmentId: string, filters?: SubmissionFilters) {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId, filters],
    queryFn: async (): Promise<Submission[]> => {
      // First get users enrolled in the espaco
      const { data: assignment } = await supabase
        .from('assignments')
        .select('espaco_id')
        .eq('id', assignmentId)
        .single();

      if (!assignment) return [];

      // Get enrolled users
      const { data: enrollments } = await supabase
        .from('user_espacos')
        .select('user_id')
        .eq('espaco_id', assignment.espaco_id)
        .eq('status', 'active');

      const enrolledUserIds = enrollments?.map(e => e.user_id) || [];

      // Get submissions
      let query = supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data: submissions, error } = await query;

      if (error) throw error;

      // Get profiles for users
      const userIds = [...new Set([
        ...enrolledUserIds,
        ...(submissions?.map(s => s.user_id) || [])
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build result with all enrolled students
      const result: Submission[] = [];
      
      for (const userId of enrolledUserIds) {
        const submission = submissions?.find(s => s.user_id === userId);
        const profile = profileMap.get(userId);
        
        if (submission) {
          result.push({
            ...submission,
            user: profile ? { full_name: profile.full_name, email: profile.email } : undefined
          } as Submission);
        } else if (filters?.submitted !== 'yes') {
          // Add placeholder for students who haven't submitted
          result.push({
            id: `placeholder-${userId}`,
            assignment_id: assignmentId,
            user_id: userId,
            status: 'draft',
            file_url: null,
            file_name: null,
            file_size: null,
            text_content: null,
            draft_saved_at: null,
            submitted_at: null,
            reviewed_by: null,
            reviewed_at: null,
            review_result: null,
            feedback: null,
            created_at: '',
            updated_at: '',
            user: profile ? { full_name: profile.full_name, email: profile.email } : undefined
          } as Submission);
        }
      }

      // Filter based on submitted filter
      if (filters?.submitted === 'yes') {
        return result.filter(s => s.submitted_at);
      } else if (filters?.submitted === 'no') {
        return result.filter(s => !s.submitted_at);
      }

      return result;
    },
    enabled: !!assignmentId
  });
}

// Submit feedback (mentor)
export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ submission_id, review_result, feedback }: ReviewSubmissionData) => {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status: 'reviewed' as SubmissionStatus,
          review_result: review_result as ReviewResult,
          feedback,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', data.assignment_id] });
      queryClient.invalidateQueries({ queryKey: ['submission', data.assignment_id] });
      toast.success('Feedback enviado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar feedback');
    }
  });
}

// Get assignment statistics
export function useAssignmentStats(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment-stats', assignmentId],
    queryFn: async (): Promise<AssignmentStats> => {
      // Get assignment
      const { data: assignment } = await supabase
        .from('assignments')
        .select('espaco_id, due_date')
        .eq('id', assignmentId)
        .single();

      if (!assignment) {
        return {
          total_students: 0,
          submitted_count: 0,
          reviewed_count: 0,
          pending_count: 0,
          on_time_count: 0,
          late_count: 0,
          submission_rate: 0
        };
      }

      // Get total enrolled students
      const { count: totalStudents } = await supabase
        .from('user_espacos')
        .select('*', { count: 'exact', head: true })
        .eq('espaco_id', assignment.espaco_id)
        .eq('status', 'active');

      // Get submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('status, submitted_at, review_result')
        .eq('assignment_id', assignmentId)
        .neq('status', 'draft');

      const dueDate = new Date(assignment.due_date);
      const submitted = submissions?.filter(s => s.submitted_at) || [];
      const reviewed = submissions?.filter(s => s.status === 'reviewed') || [];
      const onTime = submitted.filter(s => new Date(s.submitted_at!) <= dueDate);
      const late = submitted.filter(s => new Date(s.submitted_at!) > dueDate);

      const total = totalStudents || 0;

      return {
        total_students: total,
        submitted_count: submitted.length,
        reviewed_count: reviewed.length,
        pending_count: submitted.length - reviewed.length,
        on_time_count: onTime.length,
        late_count: late.length,
        submission_rate: total > 0 ? Math.round((submitted.length / total) * 100) : 0
      };
    },
    enabled: !!assignmentId
  });
}

// Upload submission file
export function useUploadSubmissionFile() {
  return useMutation({
    mutationFn: async ({ file, assignmentId, userId }: { file: File; assignmentId: string; userId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${assignmentId}/${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('submissions')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Use signed URL since bucket is private
      const { data: urlData, error: urlError } = await supabase.storage
        .from('submissions')
        .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days

      if (urlError) throw urlError;

      return {
        url: urlData.signedUrl,
        path: data.path,
        name: file.name,
        size: file.size
      };
    },
    onError: (error) => {
      toast.error('Erro ao fazer upload do arquivo');
    }
  });
}

// Get signed URL for file download (since bucket is private)
export function useDownloadSubmissionFile() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      // Extract the path from the full URL if needed
      let path = filePath;
      
      // If it's a full URL, extract just the path part
      if (filePath.includes('/storage/v1/object/')) {
        const match = filePath.match(/\/storage\/v1\/object\/(?:public|sign)\/submissions\/(.+)/);
        if (match) {
          path = match[1];
        }
      }
      
      const { data, error } = await supabase.storage
        .from('submissions')
        .createSignedUrl(path, 60 * 60); // 1 hour

      if (error) {
        throw new Error('Não foi possível gerar o link de download');
      }

      return data.signedUrl;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar link de download');
    }
  });
}

// Get messages for a submission
export function useSubmissionMessages(submissionId: string) {
  return useQuery({
    queryKey: ['submission-messages', submissionId],
    queryFn: async (): Promise<SubmissionMessage[]> => {
      const { data: messages, error } = await supabase
        .from('submission_messages')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
      
      if (senderIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (messages || []).map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id)
      })) as SubmissionMessage[];
    },
    enabled: !!submissionId && !submissionId.startsWith('placeholder-')
  });
}

// Send a message for a submission
export function useSendSubmissionMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ submission_id, message }: { submission_id: string; message: string }) => {
      const { data, error } = await supabase
        .from('submission_messages')
        .insert({
          submission_id,
          sender_id: user!.id,
          message
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission-messages', data.submission_id] });
      toast.success('Mensagem enviada!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar mensagem');
    }
  });
}
