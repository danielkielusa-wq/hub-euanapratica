import {
  FileText,
  Link as LinkIcon,
  Download,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { LibraryItem } from '@/types/global-library';
import { formatFileSize, getFileIcon, FILE_TYPE_COLORS } from '@/lib/file-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileType } from '@/types/library';

interface LibraryItemCardProps {
  item: LibraryItem;
  onEdit: (item: LibraryItem) => void;
  onDelete: (item: LibraryItem) => void;
}

export function LibraryItemCard({ item, onEdit, onDelete }: LibraryItemCardProps) {
  const isFile = item.item_type === 'file';
  const isLink = item.item_type === 'link';

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
    <Card className="group hover:shadow-md transition-shadow">
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
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Type badge */}
              <Badge variant="outline" className="text-xs">
                {isFile ? (item.file_type?.toUpperCase() || 'FILE') : 'LINK'}
              </Badge>

              {/* File size */}
              {isFile && item.file_size && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(item.file_size)}
                </span>
              )}

              {/* Download count */}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Download className="h-3 w-3" />
                {item.download_count || 0}
              </span>

              {/* Tags */}
              {item.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(item)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(item)}
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
