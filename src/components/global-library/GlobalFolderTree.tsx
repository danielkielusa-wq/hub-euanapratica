import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder as FolderIcon, Lock } from 'lucide-react';
import { LibraryFolder } from '@/types/global-library';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface GlobalFolderTreeProps {
  folders: LibraryFolder[];
  currentFolderId?: string | null;
}

interface FolderItemProps {
  folder: LibraryFolder;
  level: number;
  currentFolderId?: string | null;
}

function FolderItem({ folder, level, currentFolderId }: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isActive = folder.id === currentFolderId;

  const renderIcon = () => {
    if (folder.icon) {
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
          to={`/biblioteca-global/pasta/${folder.id}`}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {renderIcon()}
          <span className="truncate text-sm">{folder.name}</span>
          {folder.access_level === 'restricted' && (
            <Lock className="h-3 w-3 text-amber-500 shrink-0" />
          )}
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function GlobalFolderTree({ folders, currentFolderId }: GlobalFolderTreeProps) {
  if (folders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FolderIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma pasta disponivel</p>
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
        />
      ))}
    </div>
  );
}
