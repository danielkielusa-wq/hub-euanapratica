import { useState, useEffect, useCallback, useRef } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 30000, // 30 seconds default
  enabled = true
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const dataRef = useRef(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Manual save function
  const save = useCallback(async () => {
    if (!enabled) return;
    
    setStatus('saving');
    setError(null);
    
    try {
      await onSave(dataRef.current);
      if (isMountedRef.current) {
        setStatus('saved');
        setLastSaved(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Erro ao salvar');
      }
    }
  }, [onSave, enabled]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      await save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Reset status after showing "saved" for a while
  useEffect(() => {
    if (status === 'saved') {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setStatus('idle');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    status,
    lastSaved,
    error,
    save, // Manual save trigger
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    hasError: status === 'error'
  };
}
