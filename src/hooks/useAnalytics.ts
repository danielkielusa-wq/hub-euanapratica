import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LogEventInput {
  event_type: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function useAnalytics() {
  const logEvent = useCallback(async (input: LogEventInput) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id || null;

    if (!userId) {
      return;
    }

    const { error } = await supabase.rpc('record_analytics_event', {
      p_event_type: input.event_type,
      p_entity_type: input.entity_type || null,
      p_entity_id: input.entity_id || null,
      p_metadata: input.metadata || null,
    });

    if (error) {
    }
  }, []);

  return { logEvent };
}
