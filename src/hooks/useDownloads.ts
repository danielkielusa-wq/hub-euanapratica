import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Material } from '@/types/library';
import { toast } from 'sonner';

export function useRecordDownload() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from('material_downloads')
        .insert({
          material_id: materialId,
          user_id: user!.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-analytics'] });
    },
  });
}

export function useDownloadFile() {
  const recordDownload = useRecordDownload();

  return useMutation({
    mutationFn: async (material: Material) => {
      // Record download
      await recordDownload.mutateAsync(material.id);

      // Get signed URL if it's a storage URL
      let downloadUrl = material.file_url;
      
      if (!material.file_url.startsWith('http://') && !material.file_url.startsWith('https://')) {
        const { data } = await supabase.storage
          .from('materials')
          .createSignedUrl(material.file_url, 60);
        
        if (data?.signedUrl) {
          downloadUrl = data.signedUrl;
        }
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = material.filename || material.title || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onSuccess: () => {
      toast.success('Download iniciado');
    },
    onError: () => {
      toast.error('Erro ao baixar arquivo');
    },
  });
}

export function useMaterialDownloadCount(materialId: string) {
  return useQuery({
    queryKey: ['material-download-count', materialId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('material_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('material_id', materialId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!materialId,
  });
}

export function useLibraryAnalytics(espacoId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['library-analytics', espacoId],
    queryFn: async () => {
      // Get total materials
      let materialsQuery = supabase
        .from('materials')
        .select('id, folder_id, folders!inner(espaco_id)', { count: 'exact', head: true });

      if (espacoId) {
        materialsQuery = materialsQuery.eq('folders.espaco_id', espacoId);
      }

      const { count: totalMaterials } = await materialsQuery;

      // Get total downloads
      const { count: totalDownloads } = await supabase
        .from('material_downloads')
        .select('*', { count: 'exact', head: true });

      // Get most downloaded materials
      const { data: topMaterials } = await supabase
        .from('material_downloads')
        .select(`
          material_id,
          materials (
            id,
            filename,
            title,
            file_type
          )
        `)
        .limit(100);

      // Count downloads per material
      const downloadCounts: Record<string, { material: any; count: number }> = {};
      topMaterials?.forEach(d => {
        const id = d.material_id;
        if (!downloadCounts[id]) {
          downloadCounts[id] = { material: d.materials, count: 0 };
        }
        downloadCounts[id].count++;
      });

      const sortedTop = Object.values(downloadCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get downloads in last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { count: recentDownloads } = await supabase
        .from('material_downloads')
        .select('*', { count: 'exact', head: true })
        .gte('downloaded_at', weekAgo.toISOString());

      return {
        totalMaterials: totalMaterials || 0,
        totalDownloads: totalDownloads || 0,
        recentDownloads: recentDownloads || 0,
        topMaterials: sortedTop,
      };
    },
    enabled: !!user,
  });
}

export function useUserDownloads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-downloads', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_downloads')
        .select(`
          *,
          materials (
            id,
            filename,
            title,
            file_type,
            folders (
              name,
              espacos (name)
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('downloaded_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
