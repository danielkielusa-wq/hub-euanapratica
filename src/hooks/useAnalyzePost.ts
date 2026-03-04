import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnalyzePostResponse } from '@/types/upsell';

interface AnalyzePostParams {
  postId: string;
  title: string;
  content: string;
  userId: string;
}

export function useAnalyzePost() {
  return useMutation({
    mutationFn: async (params: AnalyzePostParams): Promise<AnalyzePostResponse> => {

      const { data, error } = await supabase.functions.invoke('analyze-post-for-upsell', {
        body: params,
      });

      if (error) {
        throw error;
      }

      // Edge function returns error in body for 500 responses
      if (data?.error) {
        throw new Error(data.error);
      }

      return data as AnalyzePostResponse;
    },
  });
}
