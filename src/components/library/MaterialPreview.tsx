import { Download, ExternalLink, X } from 'lucide-react';
import { Material } from '@/types/library';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MaterialPreviewProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export function MaterialPreview({ material, isOpen, onClose, onDownload }: MaterialPreviewProps) {
  if (!material) return null;

  const isLink = material.file_type === 'link';
  const isPdf = material.file_type === 'pdf';
  const isImage = material.file_type === 'png' || material.file_type === 'jpg';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="pr-8 line-clamp-1">
              {material.title || material.filename}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-md bg-muted flex items-center justify-center">
          {isPdf && material.file_url ? (
            <iframe
              src={material.file_url}
              className="w-full h-full rounded-md"
              title={material.title || material.filename}
            />
          ) : isImage && material.file_url ? (
            <img
              src={material.file_url}
              alt={material.title || material.filename}
              className="max-w-full max-h-full object-contain rounded-md"
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground text-sm mb-4">
                {isLink
                  ? 'Este material é um link externo.'
                  : 'Visualização não disponível para este tipo de arquivo.'}
              </p>
              <Button onClick={onDownload}>
                {isLink ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir link
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar arquivo
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {(isPdf || isImage) && (
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
