import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/types/auth';
import { useState } from 'react';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

interface UpdateProfileData {
  full_name?: string;
  phone?: string | null;
  phone_country_code?: string;
  is_whatsapp?: boolean;
  timezone?: string;
  profile_photo_url?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: UpdateProfileData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single();

      if (error) throw error;

      // Log the update (ignore errors from audit log)
        try {
          await supabase.from('audit_events').insert([{
            user_id: user!.id,
            actor_id: user!.id,
            action: 'profile_updated',
            source: 'profile',
            new_values: JSON.parse(JSON.stringify(updates))
          }]);
        } catch (e) {
      }

      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Avatar upload hook
export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.');
    }

    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo de 5MB.');
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_avatar.${fileExt}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 20, 90));
      }, 200);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setUploadProgress(100);

      // Invalidate profile cache
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      return publicUrl;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteAvatar = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get current profile to find avatar path
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_photo_url')
        .eq('id', user.id)
        .single();

      if (profile?.profile_photo_url) {
        // Extract path from URL
        const urlParts = profile.profile_photo_url.split('/avatars/');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          await supabase.storage.from('avatars').remove([path]);
        }
      }

      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ profile_photo_url: null })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate profile cache
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      return true;
    } catch (err) {
      return false;
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    isUploading,
    uploadProgress,
  };
}
