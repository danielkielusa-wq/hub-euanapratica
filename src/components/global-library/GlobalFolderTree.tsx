import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Folder, Lock, ChevronRight, ChevronDown } from 'lucide-react';
import { LibraryFolder } from '@/types/global-library';

interface GlobalFolderTreeProps {
  folders: LibraryFolder[];
  currentFolderId?: string;
  hasFullAccess: boolean;
  onRestrictedClick: () => void;
}

function FolderItem({
  folder,
  currentFolderId,
  hasFullAccess,
  depth,
  onRestrictedClick,
}: {
  folder: LibraryFolder;
  currentFolderId?: string;
  hasFullAccess: boolean;
  depth: number;
  onRestrictedClick: () => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = currentFolderId === folder.id;
  const isLocked = folder.access_level === 'restricted' && !hasFullAccess;

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      onRestrictedClick();
      return;
    }
    if (hasChildren) setExpanded(true);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLocked) setExpanded(!expanded);
  };

  const content = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3 overflow-hidden">
        {isLocked ? (
          <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <Folder
            className={`w-4 h-4 flex-shrink-0 ${
              isSelected
                ? 'fill-indigo-200 text-indigo-600'
                : 'fill-gray-100 text-gray-400 group-hover:text-gray-500'
            }`}
          />
        )}
        <span
          className={`text-sm font-medium truncate ${
            isSelected ? 'text-indigo-700' : 'text-gray-700'
          }`}
        >
          {folder.icon ? `${folder.icon} ` : ''}
          {folder.name}
        </span>
      </div>

      {hasChildren && !isLocked && (
        <button onClick={handleChevronClick} className="text-gray-400 flex-shrink-0 ml-2">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );

  const itemClass = `
    flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
    ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}
    ${isLocked ? 'opacity-60 cursor-not-allowed hover:bg-transparent' : ''}
  `;

  return (
    <div className="mb-1">
      {isLocked ? (
        <div
          className={itemClass}
          style={{ marginLeft: `${depth * 12}px` }}
          onClick={handleClick}
        >
          {content}
        </div>
      ) : (
        <Link
          to={`/biblioteca/pasta/${folder.id}`}
          className={itemClass}
          style={{ marginLeft: `${depth * 12}px` }}
          onClick={handleClick}
        >
          {content}
        </Link>
      )}

      {hasChildren && expanded && !isLocked && (
        <div className="overflow-hidden">
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              currentFolderId={currentFolderId}
              hasFullAccess={hasFullAccess}
              depth={depth + 1}
              onRestrictedClick={onRestrictedClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function GlobalFolderTree({
  folders,
  currentFolderId,
  hasFullAccess,
  onRestrictedClick,
}: GlobalFolderTreeProps) {
  if (!folders.length) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Nenhuma pasta disponível.
      </p>
    );
  }

  return (
    <div>
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          currentFolderId={currentFolderId}
          hasFullAccess={hasFullAccess}
          depth={0}
          onRestrictedClick={onRestrictedClick}
        />
      ))}
    </div>
  );
}
