import { Filter, Star, FileText, Video, Link as LinkIcon } from 'lucide-react';
import { LibraryFilters, LibraryItemType } from '@/types/global-library';

interface GlobalLibraryFiltersProps {
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
}

export function GlobalLibraryFilters({ filters, onChange }: GlobalLibraryFiltersProps) {
  const toggleItemType = (type: LibraryItemType) => {
    const current = filters.itemTypes || [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({ ...filters, itemTypes: next.length ? next : undefined });
  };

  const isFileActive = filters.itemTypes?.includes('file');
  const isLinkActive = filters.itemTypes?.includes('link');
  const isFavoritesActive = filters.favoritesOnly;

  // Determine "all" active state: no specific type filters and no favorites
  const isAllActive = !isFileActive && !isLinkActive && !isFavoritesActive;

  const handleAllClick = () => {
    onChange({ ...filters, itemTypes: undefined, favoritesOnly: false });
  };

  const filterButtons = [
    {
      id: 'all',
      label: 'Todos',
      icon: undefined,
      isActive: isAllActive,
      onClick: handleAllClick,
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: Star,
      isActive: isFavoritesActive,
      onClick: () => onChange({ ...filters, favoritesOnly: !filters.favoritesOnly }),
    },
    {
      id: 'file',
      label: 'Documentos',
      icon: FileText,
      isActive: isFileActive,
      onClick: () => toggleItemType('file'),
    },
    {
      id: 'link',
      label: 'Links',
      icon: LinkIcon,
      isActive: isLinkActive,
      onClick: () => toggleItemType('link'),
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      <Filter className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
      {filterButtons.map((btn) => (
        <button
          key={btn.id}
          onClick={btn.onClick}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border
            ${
              btn.isActive
                ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }
          `}
        >
          {btn.icon && (
            <btn.icon
              className={`w-3 h-3 ${btn.isActive ? 'fill-current' : ''}`}
            />
          )}
          {btn.label}
        </button>
      ))}
    </div>
  );
}
