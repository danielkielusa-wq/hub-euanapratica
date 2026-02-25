import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, RotateCw } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

async function getCroppedImage(
  image: HTMLImageElement,
  crop: PixelCrop,
  rotation: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const outputSize = 400;
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Apply rotation
  ctx.translate(outputSize / 2, outputSize / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-outputSize / 2, -outputSize / 2);

  // Draw the cropped portion scaled to the output size
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao processar imagem'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.9,
    );
  });
}

export function ImageCropDialog({ open, imageSrc, onConfirm, onCancel }: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(centerAspectCrop(naturalWidth, naturalHeight));
    setScale(1);
    setRotation(0);
  }, []);

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;

    setIsProcessing(true);
    try {
      // If scaled, we need to adjust crop coordinates to the natural image size
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const adjustedCrop: PixelCrop = {
        ...completedCrop,
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
        unit: 'px',
      };

      const blob = await getCroppedImage(image, adjustedCrop, rotation);
      onConfirm(blob);
    } catch {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
          <DialogDescription>
            Arraste para posicionar e redimensione a area de corte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop area */}
          {imageSrc && (
            <div className="flex justify-center bg-muted/50 rounded-lg p-2 overflow-hidden max-h-[50vh]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-[45vh]"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Imagem para recortar"
                  onLoad={onImageLoad}
                  style={{
                    transform: `scale(${scale}) rotate(${rotation}deg)`,
                    maxHeight: '45vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                />
              </ReactCrop>
            </div>
          )}

          {/* Zoom control */}
          <div className="flex items-center gap-3 px-1">
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={[scale]}
              min={0.5}
              max={3}
              step={0.05}
              onValueChange={([val]) => setScale(val)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Rotate button */}
          <div className="flex items-center gap-2 px-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="h-4 w-4 mr-1" />
              Girar
            </Button>
            {rotation > 0 && (
              <span className="text-xs text-muted-foreground">{rotation}°</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing || !completedCrop}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
