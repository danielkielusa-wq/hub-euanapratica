import { useState } from 'react';
import { ChevronRight, ChevronDown, Lock, Globe, MoreVertical, Plus } from 'lucide-react';
import { LibraryFolder } from '@/types/global-library';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AdminFolderTreeProps {
  folders: LibraryFolder[];
  currentFolderId: string | null;
  onFolderSelect: (folder: LibraryFolder) => void;
  onCreateSubfolder: (parentId: string) => void;
  onEditFolder: (folder: LibraryFolder) => void;
  onDeleteFolder: (folder: LibraryFolder) => void;
}

function FolderTreeItem({
  folder,
  currentFolderId,
  depth,
  onFolderSelect,
  onCreateSubfolder,
  onEditFolder,
  onDeleteFolder,
}: {
  folder: LibraryFolder;
  currentFolderId: string | null;
  depth: number;
  onFolderSelect: (folder: LibraryFolder) => void;
  onCreateSubfolder: (parentId: string) => void;
  onEditFolder: (folder: LibraryFolder) => void;
  onDeleteFolder: (folder: LibraryFolder) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = currentFolderId === folder.id;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md py-1.5 cursor-pointer text-sm group',
          isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '4px' }}
        onClick={() => onFolderSelect(folder)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="shrink-0"
          >
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className="shrink-0 text-base leading-none">
          {folder.icon || (isSelected ? '📂' : '📁')}
        </span>

        <span className="flex-1 truncate">{folder.name}</span>

        {folder.access_level === 'restricted'
          ? <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
          : <Globe className="h-3 w-3 text-muted-foreground/60 shrink-0" />
        }

        {typeof folder.item_count === 'number' && folder.item_count > 0 && (
          <Badge variant="secondary" className="h-4 px-1 text-xs font-normal shrink-0">
            {folder.item_count}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folder.id); }}
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Nova subpasta
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
            >
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
              className="text-destructive focus:text-destructive"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasChildren && expanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              currentFolderId={currentFolderId}
              depth={depth + 1}
              onFolderSelect={onFolderSelect}
              onCreateSubfolder={onCreateSubfolder}
              onEditFolder={onEditFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminFolderTree({
  folders,
  currentFolderId,
  onFolderSelect,
  onCreateSubfolder,
  onEditFolder,
  onDeleteFolder,
}: AdminFolderTreeProps) {
  if (!folders.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma pasta criada ainda.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {folders.map((folder) => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          currentFolderId={currentFolderId}
          depth={0}
          onFolderSelect={onFolderSelect}
          onCreateSubfolder={onCreateSubfolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
}
