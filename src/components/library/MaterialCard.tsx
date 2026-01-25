import { format, isAfter, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Eye, ExternalLink } from 'lucide-react';
import { Material } from '@/types/library';
import { formatFileSize, isPreviewable } from '@/lib/file-utils';
import { FileIcon } from './FileIcon';
import { FavoriteButton } from './FavoriteButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MaterialCardProps {
  material: Material;
  isFavorite: boolean;
  onDownload: () => void;
  onPreview: () => void;
  onToggleFavorite: () => void;
  showFolder?: boolean;
}

export function MaterialCard({
  material,
  isFavorite,
  onDownload,
  onPreview,
  onToggleFavorite,
  showFolder = false,
}: MaterialCardProps) {
  const isNew = isAfter(new Date(material.uploaded_at), subDays(new Date(), 7));
  const isLink = material.file_type === 'link';
  const canPreview = isPreviewable(material.file_type);

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 p-2 bg-muted rounded-lg">
            <FileIcon fileType={material.file_type} size={24} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium truncate">
                  {material.title || material.filename}
                </h4>
                {material.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {material.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                {isNew && (
                  <Badge variant="secondary" className="text-xs">
                    Novo
                  </Badge>
                )}
                <FavoriteButton
                  isFavorite={isFavorite}
                  onToggle={onToggleFavorite}
                  size="sm"
                />
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {!isLink && material.file_size && (
                <span>{formatFileSize(material.file_size)}</span>
              )}
              <span>
                {format(new Date(material.uploaded_at), "dd MMM yyyy", { locale: ptBR })}
              </span>
              {showFolder && material.folders && (
                <span className="truncate">
                  {material.folders.espacos?.name} / {material.folders.name}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              {isLink ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir Link
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                    className="gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Baixar
                  </Button>
                  {canPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onPreview}
                      className="gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Visualizar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
