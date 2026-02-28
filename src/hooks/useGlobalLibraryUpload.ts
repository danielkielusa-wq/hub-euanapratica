import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCreateLibraryItem } from './useAdminGlobalLibrary';
import { validateFile, getFileTypeFromMime } from '@/lib/file-utils';
import { UploadProgress } from '@/types/library';

interface GlobalLibraryUploadOptions {
  folderId: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export function useGlobalLibraryUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const createItem = useCreateLibraryItem();

  const updateUpload = (file: File, updates: Partial<UploadProgress>) => {
    setUploads(prev =>
      prev.map(u => (u.file === file ? { ...u, ...updates } : u))
    );
  };

  const uploadFile = async (file: File, options: GlobalLibraryUploadOptions) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      updateUpload(file, { status: 'error', error: validation.error });
      throw new Error(validation.error);
    }

    setUploads(prev => [...prev, { file, progress: 0, status: 'uploading' }]);

    try {
      const timestamp = Date.now();
      const uniqueId = crypto.randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `global-library/${options.folderId}/${timestamp}_${uniqueId}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      updateUpload(file, { progress: 80 });

      const fileType = getFileTypeFromMime(file.type);

      await createItem.mutateAsync({
        folder_id: options.folderId,
        title: options.title || file.name.replace(/\.[^/.]+$/, ''),
        description: options.description,
        item_type: 'file',
        file_url: uploadData.path,
        file_size: file.size,
        file_type: fileType,
        filename: file.name,
        tags: options.tags,
      });

      updateUpload(file, { progress: 100, status: 'completed' });
      return uploadData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload';
      updateUpload(file, { status: 'error', error: errorMessage });
      throw error;
    }
  };

  const uploadMultiple = async (files: File[], options: GlobalLibraryUploadOptions) => {
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

  const clearUploads = () => setUploads([]);

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
