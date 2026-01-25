import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEspacoCoverUpload } from '@/hooks/useEspacoCoverUpload';
import { getEspacoGradient } from '@/lib/gradients';
import { cn } from '@/lib/utils';

interface CoverImageUploadProps {
  currentImage?: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
  espacoId?: string;
  className?: string;
}

export function CoverImageUpload({
  currentImage,
  onUpload,
  onRemove,
  espacoId,
  className,
}: CoverImageUploadProps) {
  const { uploadCover, deleteCover, uploading, progress } = useEspacoCoverUpload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Create local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Upload to storage
    const url = await uploadCover(file, espacoId);
    
    if (url) {
      onUpload(url);
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadCover, onUpload, espacoId]);

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
    if (currentImage) {
      await deleteCover(currentImage);
    }
    onRemove();
  };

  const displayImage = previewUrl || currentImage;
  const fallbackGradient = espacoId ? getEspacoGradient(espacoId) : getEspacoGradient('default');

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative aspect-[3/4] max-w-[200px] rounded-[24px] border-2 border-dashed transition-all cursor-pointer overflow-hidden',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          uploading && 'pointer-events-none opacity-70'
        )}
      >
        <input {...getInputProps()} />
        
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt="Cover preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
            style={{ background: fallbackGradient }}
          >
            <ImagePlus className="h-10 w-10 text-white/80 mb-2" />
            <p className="text-sm font-medium text-white">
              {isDragActive ? 'Solte aqui' : 'Arraste uma imagem'}
            </p>
            <p className="text-xs text-white/70 mt-1">ou clique para selecionar</p>
            <p className="text-xs text-white/50 mt-2">3:4 • Max 5MB</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
            <Progress value={progress} className="w-3/4 h-2" />
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
          Remover imagem
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Recomendado: 600×800px (3:4). Se não definir, um gradiente será usado.
      </p>
    </div>
  );
}
