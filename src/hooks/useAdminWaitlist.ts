import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WaitlistItem {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  status: 'waiting' | 'contacted' | 'enrolled' | 'declined';
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  enrolled_at: string | null;
  has_report?: boolean;
}

export interface WaitlistFilters {
  status: string;
  search: string;
}

export function useWaitlist(filters?: WaitlistFilters) {
  return useQuery<WaitlistItem[]>({
    queryKey: ['admin-waitlist', filters],
    queryFn: async () => {
      let query = supabase
        .from('waitlist_mentoriarota' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,whatsapp.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const items = (data || []) as WaitlistItem[];

      // Enrich with career_evaluations — check who has a report
      const emails = items.map((i) => i.email).filter(Boolean);
      if (emails.length > 0) {
        const { data: evals } = await supabase
          .from('career_evaluations')
          .select('email, processing_status')
          .in('email', emails)
          .eq('processing_status', 'completed');

        const evalEmails = new Set((evals || []).map((e: any) => e.email));
        items.forEach((item) => {
          item.has_report = evalEmails.has(item.email);
        });
      }

      return items;
    },
  });
}

export function useUpdateWaitlistStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: Record<string, any> = { status };
      if (status === 'contacted') updateData.contacted_at = new Date().toISOString();
      if (status === 'enrolled') updateData.enrolled_at = new Date().toISOString();
      if (notes !== undefined) updateData.notes = notes;

      const { error } = await supabase
        .from('waitlist_mentoriarota' as any)
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] });
      toast.success('Status atualizado');
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
