import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import { Folder } from '@/types/library';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FolderTreeProps {
  folders: Folder[];
  currentFolderId?: string | null;
  onFolderSelect?: (folder: Folder) => void;
}

interface FolderItemProps {
  folder: Folder;
  level: number;
  currentFolderId?: string | null;
  onFolderSelect?: (folder: Folder) => void;
}

function FolderItem({ folder, level, currentFolderId, onFolderSelect }: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isActive = folder.id === currentFolderId;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors',
          isActive 
            ? 'bg-primary/10 text-primary' 
            : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
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

        <Link
          to={`/biblioteca/pasta/${folder.id}`}
          className="flex items-center gap-2 flex-1 min-w-0"
          onClick={() => onFolderSelect?.(folder)}
        >
          <FolderIcon className={cn(
            'h-4 w-4 shrink-0',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )} />
          <span className="truncate text-sm">{folder.name}</span>
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ folders, currentFolderId, onFolderSelect }: FolderTreeProps) {
  if (folders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FolderIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma pasta encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {folders.map(folder => (
        <FolderItem
          key={folder.id}
          folder={folder}
          level={0}
          currentFolderId={currentFolderId}
          onFolderSelect={onFolderSelect}
        />
      ))}
    </div>
  );
}
