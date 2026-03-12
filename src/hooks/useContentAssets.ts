/**
 * Hooks for content visual assets: templates, generated assets, and rendering.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { renderSlideToBlob, type TemplateConfig, type SlideData } from '@/components/content/SlideRenderer';
import type { ScriptSection, CarouselSlide } from '@/hooks/useAdminContentFactory';

// ── Types ────────────────────────────────────────────────────────────────

export interface VisualTemplate {
  id: string;
  name: string;
  display_name: string;
  type: string;
  html_template: string;
  css: string;
  variables: unknown[];
  colors: Record<string, string>;
  fonts: Record<string, string>;
  is_default: boolean;
  is_active: boolean;
}

export interface ContentAsset {
  id: string;
  piece_id: string;
  type: string;
  template_id: string | null;
  storage_path: string;
  public_url: string | null;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Queries ──────────────────────────────────────────────────────────────

export function useVisualTemplates() {
  return useQuery<VisualTemplate[]>({
    queryKey: ['content-visual-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_visual_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return (data || []) as VisualTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useContentAssets(pieceId: string | undefined) {
  return useQuery<ContentAsset[]>({
    queryKey: ['content-assets', pieceId],
    queryFn: async () => {
      if (!pieceId) return [];
      const { data, error } = await (supabase as any)
        .from('content_assets')
        .select('*')
        .eq('piece_id', pieceId)
        .order('position');
      if (error) throw error;
      return (data || []) as ContentAsset[];
    },
    enabled: !!pieceId,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

export interface GenerateAssetsInput {
  pieceId: string;
  templateId: string;
  template: TemplateConfig;
  carouselSlides: CarouselSlide[];
  title: string;
  onProgress?: (current: number, total: number) => void;
}

export function useGenerateAssets() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      pieceId,
      templateId,
      template,
      carouselSlides,
      title,
      onProgress,
    }: GenerateAssetsInput) => {
      // 1. Delete existing assets for this piece
      const { data: existingAssets } = await (supabase as any)
        .from('content_assets')
        .select('storage_path')
        .eq('piece_id', pieceId);

      if (existingAssets?.length) {
        const paths = existingAssets.map((a: any) => a.storage_path);
        await supabase.storage.from('content-assets').remove(paths);
        await (supabase as any)
          .from('content_assets')
          .delete()
          .eq('piece_id', pieceId);
      }

      const totalSlides = carouselSlides.length;
      const assets: ContentAsset[] = [];
      const cacheBust = Date.now();

      // 2. Render each carousel slide as a PNG
      for (let i = 0; i < carouselSlides.length; i++) {
        const cs = carouselSlides[i];
        onProgress?.(i + 1, totalSlides);

        const slideData: SlideData = {
          headline: cs.headline,
          body: cs.body,
          slideNumber: cs.slide_number,
          totalSlides,
          slideType: cs.slide_type,
          accentText: cs.accent_text,
          footnote: cs.footnote,
        };

        const blob = await renderSlideToBlob(template, slideData);
        const storagePath = `${pieceId}/slide-${i + 1}.png`;

        const { error: uploadError } = await supabase.storage
          .from('content-assets')
          .upload(storagePath, blob, {
            contentType: 'image/png',
            upsert: true,
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('content-assets')
          .getPublicUrl(storagePath);

        const { data: asset, error: insertError } = await (supabase as any)
          .from('content_assets')
          .insert({
            piece_id: pieceId,
            type: 'slide',
            template_id: templateId,
            storage_path: storagePath,
            public_url: `${urlData.publicUrl}?v=${cacheBust}`,
            position: i + 1,
            metadata: {
              headline: cs.headline,
              slide_type: cs.slide_type,
              width: 1080,
              height: 1080,
            },
          })
          .select()
          .single();
        if (insertError) throw insertError;
        assets.push(asset);
      }

      // 3. Generate thumbnail from first slide (cover)
      if (carouselSlides.length > 0) {
        const cover = carouselSlides[0];
        const thumbData: SlideData = {
          headline: title || cover.headline,
          body: '',
          slideNumber: 1,
          totalSlides: 1,
          slideType: 'cover',
          accentText: cover.accent_text,
        };
        const thumbBlob = await renderSlideToBlob(template, thumbData);
        const thumbPath = `${pieceId}/thumb.png`;

        await supabase.storage
          .from('content-assets')
          .upload(thumbPath, thumbBlob, { contentType: 'image/png', upsert: true });

        const { data: thumbUrl } = supabase.storage
          .from('content-assets')
          .getPublicUrl(thumbPath);

        await (supabase as any)
          .from('content_assets')
          .insert({
            piece_id: pieceId,
            type: 'thumbnail',
            template_id: templateId,
            storage_path: thumbPath,
            public_url: `${thumbUrl.publicUrl}?v=${cacheBust}`,
            position: 0,
            metadata: { title, width: 1080, height: 1080 },
          });
      }

      return assets;
    },
    onSuccess: (_, { pieceId }) => {
      queryClient.invalidateQueries({ queryKey: ['content-assets', pieceId] });
      toast({ title: 'Visuais gerados com sucesso' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao gerar visuais', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Generate Carousel Content (LLM) ──────────────────────────────────────

export function useGenerateCarousel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pieceId: string) => {
      const { data, error } = await supabase.functions.invoke('content-carousel-generate', {
        body: { piece_id: pieceId },
      });
      if (error) {
        let detail = error.message;
        try {
          const resp = (error as any).context;
          if (resp?.json) {
            const body = await Promise.race([
              resp.json(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
            ]);
            detail = (body as any)?.error || detail;
          }
        } catch {
          // use original error.message
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      return data as { carousel_slides: CarouselSlide[]; count: number };
    },
    onSuccess: (_, pieceId) => {
      queryClient.invalidateQueries({ queryKey: ['content-pieces'] });
      toast({ title: 'Conteudo de carrossel gerado' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao gerar carrossel', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAssets() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pieceId: string) => {
      const { data: existing } = await (supabase as any)
        .from('content_assets')
        .select('storage_path')
        .eq('piece_id', pieceId);

      if (existing?.length) {
        const paths = existing.map((a: any) => a.storage_path);
        await supabase.storage.from('content-assets').remove(paths);
        await (supabase as any)
          .from('content_assets')
          .delete()
          .eq('piece_id', pieceId);
      }
    },
    onSuccess: (_, pieceId) => {
      queryClient.invalidateQueries({ queryKey: ['content-assets', pieceId] });
      toast({ title: 'Visuais removidos' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover visuais', description: error.message, variant: 'destructive' });
    },
  });
}
