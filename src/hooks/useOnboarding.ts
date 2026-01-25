import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingProfile } from '@/types/onboarding';
import { useState, useCallback } from 'react';

export function useOnboardingProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          has_completed_onboarding,
          full_name,
          preferred_name,
          birth_date,
          email,
          alternative_email,
          phone_country_code,
          phone,
          is_whatsapp,
          linkedin_url,
          resume_url,
          current_country,
          current_state,
          current_city,
          target_country,
          timezone
        `)
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return data as OnboardingProfile;
    },
    enabled: !!user,
  });
}

interface UpdateOnboardingData {
  full_name?: string;
  preferred_name?: string | null;
  birth_date?: string | null;
  alternative_email?: string | null;
  phone_country_code?: string;
  phone?: string | null;
  is_whatsapp?: boolean;
  linkedin_url?: string | null;
  resume_url?: string | null;
  current_country?: string;
  current_state?: string | null;
  current_city?: string | null;
  target_country?: string;
  timezone?: string;
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: UpdateOnboardingData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-profile'] });
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Refresh user to update has_completed_onboarding in context
      if (refreshUser) {
        await refreshUser();
      }
    },
  });
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function useResumeUpload() {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadResume = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;

    // Validate file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setUploadState({ isUploading: false, progress: 0, error: 'Formato não suportado. Use PDF, DOC ou DOCX.' });
      return null;
    }

    if (file.size > maxSize) {
      setUploadState({ isUploading: false, progress: 0, error: 'Arquivo muito grande. Máximo 10MB.' });
      return null;
    }

    setUploadState({ isUploading: true, progress: 0, error: null });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_resume.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      setUploadState({ isUploading: false, progress: 100, error: null });
      return data.path;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar arquivo';
      setUploadState({ isUploading: false, progress: 0, error: message });
      return null;
    }
  }, [user]);

  const deleteResume = useCallback(async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('resumes')
        .remove([path]);

      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  }, []);

  const getResumeUrl = useCallback(async (path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 3600); // 1 hour

      if (error) throw error;
      return data.signedUrl;
    } catch {
      return null;
    }
  }, []);

  return {
    uploadResume,
    deleteResume,
    getResumeUrl,
    ...uploadState,
  };
}
