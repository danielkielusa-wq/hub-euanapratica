import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCreateMaterial } from './useMaterials';
import { getFileTypeFromMime, validateFile } from '@/lib/file-utils';
import { FileType, AccessLevel, UploadProgress } from '@/types/library';

interface UploadOptions {
  folderId: string;
  title?: string;
  description?: string;
  accessLevel?: AccessLevel;
  availableAt?: string;
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const createMaterial = useCreateMaterial();

  const updateUpload = (file: File, updates: Partial<UploadProgress>) => {
    setUploads(prev =>
      prev.map(u =>
        u.file === file ? { ...u, ...updates } : u
      )
    );
  };

  const uploadFile = async (file: File, options: UploadOptions) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      updateUpload(file, { status: 'error', error: validation.error });
      throw new Error(validation.error);
    }

    // Add to uploads list
    setUploads(prev => [
      ...prev,
      { file, progress: 0, status: 'uploading' },
    ]);

    try {
      // Generate unique path
      const timestamp = Date.now();
      const uniqueId = crypto.randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${options.folderId}/${timestamp}_${uniqueId}_${safeName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      updateUpload(file, { progress: 80 });

      // Create material record
      const fileType = getFileTypeFromMime(file.type) as FileType;

      await createMaterial.mutateAsync({
        folder_id: options.folderId,
        filename: file.name,
        title: options.title || file.name,
        description: options.description,
        file_url: uploadData.path,
        file_size: file.size,
        file_type: fileType,
        access_level: options.accessLevel || 'restricted',
        available_at: options.availableAt || new Date().toISOString(),
      });

      updateUpload(file, { progress: 100, status: 'completed' });

      return uploadData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload';
      updateUpload(file, { status: 'error', error: errorMessage });
      throw error;
    }
  };

  const uploadMultiple = async (files: File[], options: UploadOptions) => {
    const results = [];

    for (const file of files) {
      try {
        const result = await uploadFile(file, options);
        results.push({ file, success: true, data: result });
      } catch (error) {
        results.push({ file, success: false, error });
      }
    }

    return results;
  };

  const clearUploads = () => {
    setUploads([]);
  };

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(u => u.file !== file));
  };

  return {
    uploads,
    uploadFile,
    uploadMultiple,
    clearUploads,
    removeUpload,
    isUploading: uploads.some(u => u.status === 'uploading'),
  };
}

export function useDownloadFile() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadFile = async (fileUrl: string, filename: string) => {
    setIsDownloading(true);

    try {
      // Check if it's an external link
      if (fileUrl.startsWith('http')) {
        window.open(fileUrl, '_blank');
        return;
      }

      // Download from Supabase storage
      const { data, error } = await supabase.storage
        .from('materials')
        .download(fileUrl);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const getPublicUrl = (fileUrl: string) => {
    if (fileUrl.startsWith('http')) return fileUrl;

    const { data } = supabase.storage
      .from('materials')
      .getPublicUrl(fileUrl);

    return data.publicUrl;
  };

  const getSignedUrl = async (fileUrl: string) => {
    if (fileUrl.startsWith('http')) return fileUrl;

    const { data, error } = await supabase.storage
      .from('materials')
      .createSignedUrl(fileUrl, 3600); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    downloadFile,
    getPublicUrl,
    getSignedUrl,
    isDownloading,
  };
}
