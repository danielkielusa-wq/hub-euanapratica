import { useState, useCallback } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, Film, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { VideoStatus } from '@/types/course';
import { VIDEO_STATUS_CONFIG } from '@/types/course';

interface VideoUploaderProps {
  lessonId: string;
  currentVideoId: string | null;
  videoStatus: VideoStatus;
  thumbnailUrl: string | null;
  onUploadComplete?: () => void;
  libraryId?: string | null;
}

export function VideoUploader({
  lessonId,
  currentVideoId,
  videoStatus,
  thumbnailUrl,
  onUploadComplete,
  libraryId,
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thumbError, setThumbError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get TUS credentials from Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('create-video-upload', {
        body: { lessonId, title: file.name },
      });

      if (fnError) {
        // Extract error from FunctionsHttpError
        let serverMsg = fnError.message || 'Failed to create upload';
        try {
          const ctx = fnError.context;
          if (ctx && typeof ctx.json === 'function') {
            // context is a Response object (newer supabase-js)
            const body = await ctx.json();
            serverMsg = body?.error || body?.message || serverMsg;
          } else if (ctx?.error) {
            serverMsg = ctx.error;
          } else if (typeof ctx === 'string') {
            serverMsg = ctx;
          }
        } catch { /* keep default message */ }
        throw new Error(serverMsg);
      }
      if (!data?.videoId) throw new Error(data?.error || 'No videoId returned');

      const { videoId, libraryId, expirationTime, signature, tusEndpoint } = data;

      // Step 2: Upload via TUS
      const { Upload: TusUpload } = await import('tus-js-client');

      await new Promise<void>((resolve, reject) => {
        const upload = new TusUpload(file, {
          endpoint: tusEndpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: String(expirationTime),
            VideoId: videoId,
            LibraryId: String(libraryId),
          },
          metadata: {
            filetype: file.type,
            title: file.name,
          },
          onProgress: (bytesUploaded: number, bytesTotal: number) => {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onSuccess: () => resolve(),
          onError: (err: Error) => reject(err),
        });
        upload.start();
      });

      // TUS upload done — file is on Bunny, now Bunny will transcode
      setProgress(100);

      // Transition status: uploading → processing
      await supabase
        .from('course_lessons')
        .update({ video_status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', lessonId);

      onUploadComplete?.();
    } catch (err: any) {
      if (err?.context) console.error('Error context:', err.context);
      const msg = err?.message || 'Upload failed';
      setError(msg);
      const { toast } = await import('sonner');
      toast.error('Erro no upload: ' + msg);

      // Revert status on failure so admin can retry
      await supabase
        .from('course_lessons')
        .update({ video_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', lessonId)
        .then(() => onUploadComplete?.());
    } finally {
      setUploading(false);
    }
  }, [lessonId, onUploadComplete]);

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUpload(file);
    };
    input.click();
  };

  const statusConfig = VIDEO_STATUS_CONFIG[videoStatus];

  // Has a video already
  if (currentVideoId && !uploading) {
    return (
      <div className="space-y-3">
        {/* Video preview / thumbnail */}
        {videoStatus === 'ready' && showPreview ? (
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
            <iframe
              src={`https://iframe.mediadelivery.net/embed/${libraryId || ''}/${currentVideoId}?autoplay=false&preload=true`}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Video preview"
              style={{ border: 0 }}
              onError={() => setShowPreview(false)}
            />
          </div>
        ) : thumbnailUrl && videoStatus === 'ready' && !thumbError ? (
          <div
            className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 cursor-pointer group"
            onClick={() => setShowPreview(true)}
          >
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              onError={() => setThumbError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-6 w-6 text-gray-900 ml-1" />
              </div>
            </div>
          </div>
        ) : videoStatus === 'ready' ? (
          <div
            className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 cursor-pointer group flex items-center justify-center"
            onClick={() => setShowPreview(true)}
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto group-hover:bg-white/20 transition-colors">
                <Play className="h-6 w-6 text-white ml-1" />
              </div>
              <p className="text-xs text-white/60">Clique para visualizar</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            {(videoStatus === 'processing' || videoStatus === 'uploading') ? (
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <div className="flex-1">
              <p className={cn("text-sm font-medium", statusConfig.color)}>
                {statusConfig.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                ID: {currentVideoId}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleFileSelect}
          disabled={videoStatus === 'uploading'}
        >
          <Upload className="h-4 w-4 mr-2" />
          {videoStatus === 'uploading' ? 'Upload em andamento...' : 'Substituir vídeo'}
        </Button>

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 flex-shrink-0" /> {error}
          </p>
        )}
      </div>
    );
  }

  // Upload in progress
  if (uploading) {
    return (
      <div className="space-y-3 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Enviando vídeo...</p>
            <p className="text-xs text-muted-foreground">{progress}% concluído</p>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    );
  }

  // No video — upload prompt
  return (
    <div className="space-y-2">
      <button
        onClick={handleFileSelect}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-2 p-6",
          "rounded-xl border-2 border-dashed border-muted-foreground/25",
          "hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer",
          error && "border-red-300 bg-red-50"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          Clique para enviar um vídeo
        </p>
        <p className="text-xs text-muted-foreground/70">
          MP4, MOV, MKV, AVI (upload direto para Bunny.net)
        </p>
      </button>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
