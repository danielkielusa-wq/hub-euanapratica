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
      console.log('[Upsell] Invoking edge function with:', { postId: params.postId, title: params.title });

      const { data, error } = await supabase.functions.invoke('analyze-post-for-upsell', {
        body: params,
      });

      if (error) {
        console.error('[Upsell] Edge function invocation failed:', error);
        throw error;
      }

      // Edge function returns error in body for 500 responses
      if (data?.error) {
        console.error('[Upsell] Edge function returned error:', data.error);
        throw new Error(data.error);
      }

      console.log('[Upsell] Edge function response:', data);
      return data as AnalyzePostResponse;
    },
  });
}
