import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveThumbnailUpload } from '@/hooks/useLiveThumbnailUpload';
import { cn } from '@/lib/utils';

interface LiveThumbnailUploadProps {
  currentImage?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  liveId?: string;
}

export function LiveThumbnailUpload({
  currentImage,
  onUpload,
  onRemove,
  liveId,
}: LiveThumbnailUploadProps) {
  const { uploadThumbnail, deleteThumbnail, uploading, progress } = useLiveThumbnailUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const url = await uploadThumbnail(file, liveId);

    if (url) {
      onUpload(url);
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadThumbnail, onUpload, liveId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleRemove = async () => {
    if (currentImage && currentImage.includes('live-thumbnails')) {
      await deleteThumbnail(currentImage);
    }
    onRemove();
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative aspect-video max-w-[400px] rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-muted-foreground/25 hover:border-indigo-400',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        <input {...getInputProps()} />

        {displayImage ? (
          <img
            src={displayImage}
            alt="Thumbnail preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-muted/30">
            <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              {isDragActive ? 'Solte aqui' : 'Arraste uma imagem'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground/50 mt-2">16:9 · JPEG, PNG, WebP · Max 5MB</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {displayImage && !uploading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4 mr-1" />
          Remover thumbnail
        </Button>
      )}
    </div>
  );
}
