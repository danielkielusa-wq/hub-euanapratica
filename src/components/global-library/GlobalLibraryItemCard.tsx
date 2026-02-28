import {
  FileText,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Eye,
  Star,
} from 'lucide-react';
import { LibraryItem } from '@/types/global-library';
import { formatFileSize, getFileIcon, FILE_TYPE_COLORS, isPreviewable } from '@/lib/file-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileType } from '@/types/library';

interface GlobalLibraryItemCardProps {
  item: LibraryItem;
  isFavorite: boolean;
  onDownload: () => void;
  onPreview?: () => void;
  onToggleFavorite: () => void;
}

export function GlobalLibraryItemCard({
  item,
  isFavorite,
  onDownload,
  onPreview,
  onToggleFavorite,
}: GlobalLibraryItemCardProps) {
  const isFile = item.item_type === 'file';
  const isLink = item.item_type === 'link';
  const canPreview = isFile && item.file_type && isPreviewable(item.file_type as FileType);

  const getIcon = () => {
    if (isLink) return LinkIcon;
    if (item.file_type && item.file_type in FILE_TYPE_COLORS) {
      return getFileIcon(item.file_type as FileType);
    }
    return FileText;
  };

  const getIconColor = () => {
    if (isLink) return 'text-cyan-500';
    if (item.file_type && item.file_type in FILE_TYPE_COLORS) {
      return FILE_TYPE_COLORS[item.file_type as FileType];
    }
    return 'text-gray-500';
  };

  const Icon = getIcon();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn('p-2 rounded-lg bg-muted shrink-0', getIconColor())}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{item.title}</h4>

            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {isFile ? (item.file_type?.toUpperCase() || 'FILE') : 'LINK'}
              </Badge>

              {isFile && item.file_size && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(item.file_size)}
                </span>
              )}

              {item.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', isFavorite && 'text-yellow-500')}
              onClick={onToggleFavorite}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star className={cn('h-4 w-4', isFavorite && 'fill-current')} />
            </Button>

            {canPreview && onPreview && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onPreview}
                title="Visualizar"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {isFile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            {isLink && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDownload}
                title="Abrir link"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
