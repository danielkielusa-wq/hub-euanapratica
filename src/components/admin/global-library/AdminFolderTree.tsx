import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  FolderPlus,
  Pencil,
  Trash2,
  Lock,
  Globe,
} from 'lucide-react';
import { LibraryFolder } from '@/types/global-library';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminFolderTreeProps {
  folders: LibraryFolder[];
  currentFolderId?: string | null;
  onFolderSelect: (folder: LibraryFolder) => void;
  onCreateSubfolder: (parentId: string) => void;
  onEditFolder: (folder: LibraryFolder) => void;
  onDeleteFolder: (folder: LibraryFolder) => void;
}

interface FolderItemProps {
  folder: LibraryFolder;
  level: number;
  currentFolderId?: string | null;
  onFolderSelect: (folder: LibraryFolder) => void;
  onCreateSubfolder: (parentId: string) => void;
  onEditFolder: (folder: LibraryFolder) => void;
  onDeleteFolder: (folder: LibraryFolder) => void;
}

function FolderItem({
  folder,
  level,
  currentFolderId,
  onFolderSelect,
  onCreateSubfolder,
  onEditFolder,
  onDeleteFolder,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isActive = folder.id === currentFolderId;

  const renderIcon = () => {
    if (folder.icon) {
      // If icon starts with a letter, it's likely an emoji
      return <span className="text-sm shrink-0">{folder.icon}</span>;
    }
    return (
      <FolderIcon
        className={cn(
          'h-4 w-4 shrink-0',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      />
    );
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onFolderSelect(folder)}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}

        {renderIcon()}
        <span className="truncate text-sm flex-1">{folder.name}</span>

        {folder.access_level === 'restricted' && (
          <Lock className="h-3 w-3 text-amber-500 shrink-0" />
        )}

        {/* Hover actions */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubfolder(folder.id);
            }}
            title="Criar subpasta"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onEditFolder(folder);
            }}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder);
            }}
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
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
  if (folders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FolderIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma pasta criada</p>
        <p className="text-xs mt-1">Crie a primeira pasta para comecar</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          level={0}
          currentFolderId={currentFolderId}
          onFolderSelect={onFolderSelect}
          onCreateSubfolder={onCreateSubfolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
}
