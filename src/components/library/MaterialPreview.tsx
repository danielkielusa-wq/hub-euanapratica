import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Material } from '@/types/library';
import { isImageType } from '@/lib/file-utils';
import { FileIcon } from './FileIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDownloadFile } from '@/hooks/useFileUpload';

interface MaterialPreviewProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export function MaterialPreview({ material, isOpen, onClose, onDownload }: MaterialPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const { getSignedUrl } = useDownloadFile();

  useEffect(() => {
    if (!material || !isOpen) {
      setImageUrl(null);
      setPdfUrl(null);
      setLoading(true);
      setZoom(1);
      return;
    }

    const loadPreview = async () => {
      setLoading(true);
      try {
        const url = await getSignedUrl(material.file_url);
        
        if (isImageType(material.file_type)) {
          setImageUrl(url);
        } else if (material.file_type === 'pdf') {
          setPdfUrl(url);
        }
      } catch (error) {
        console.error('Error loading preview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [material, isOpen]);

  if (!material) return null;

  const isImage = isImageType(material.file_type);
  const isPdf = material.file_type === 'pdf';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileIcon fileType={material.file_type} size={24} />
              <DialogTitle className="truncate">
                {material.title || material.filename}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {isImage && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={onDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 bg-muted/50 min-h-[400px] max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : isImage && imageUrl ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={imageUrl}
                alt={material.title || material.filename}
                className="max-w-full object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          ) : isPdf && pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1`}
              className="w-full h-full min-h-[600px] rounded-lg border"
              title={material.title || material.filename}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileIcon fileType={material.file_type} size={64} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Preview não disponível</p>
              <p className="text-sm mt-1">Clique em "Baixar" para visualizar o arquivo</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
