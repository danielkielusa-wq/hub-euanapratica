import { FileText, Link, MoreVertical, Download, Pencil, Trash2 } from 'lucide-react';
import { LibraryItem } from '@/types/global-library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LibraryItemCardProps {
  item: LibraryItem;
  onEdit: (item: LibraryItem) => void;
  onDelete: (item: LibraryItem) => void;
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-red-500/10 text-red-600',
  docx: 'bg-blue-500/10 text-blue-600',
  doc: 'bg-blue-500/10 text-blue-600',
  xlsx: 'bg-green-500/10 text-green-600',
  xls: 'bg-green-500/10 text-green-600',
  pptx: 'bg-orange-500/10 text-orange-600',
  ppt: 'bg-orange-500/10 text-orange-600',
  zip: 'bg-yellow-500/10 text-yellow-600',
  png: 'bg-purple-500/10 text-purple-600',
  jpg: 'bg-purple-500/10 text-purple-600',
  jpeg: 'bg-purple-500/10 text-purple-600',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function LibraryItemCard({ item, onEdit, onDelete }: LibraryItemCardProps) {
  const isLink = item.item_type === 'link';
  const fileExt = item.file_type?.toUpperCase() || item.filename?.split('.').pop()?.toUpperCase();
  const iconColorClass = isLink
    ? 'bg-gray-500/10 text-gray-600'
    : FILE_TYPE_COLORS[item.file_type?.toLowerCase() || ''] || 'bg-muted text-muted-foreground';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconColorClass}`}>
            {isLink ? <Link className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="font-medium text-sm truncate flex-1">{item.title}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Pencil className="h-3.5 w-3.5 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {item.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
            )}

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {fileExt && (
                <Badge variant="outline" className="h-4 px-1 text-xs font-normal">
                  {fileExt}
                </Badge>
              )}
              {item.file_size && (
                <span className="text-xs text-muted-foreground">{formatBytes(item.file_size)}</span>
              )}
              {typeof item.download_count === 'number' && item.download_count > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Download className="h-3 w-3" />
                  {item.download_count}
                </span>
              )}
              {item.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="h-4 px-1 text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
