import { Search, Star, SlidersHorizontal } from 'lucide-react';
import { LibraryFilters, LibraryItemType } from '@/types/global-library';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GlobalLibraryFiltersProps {
  filters: LibraryFilters;
  onChange: (filters: LibraryFilters) => void;
}

const TYPE_OPTIONS: { value: LibraryItemType; label: string }[] = [
  { value: 'file', label: 'Arquivos' },
  { value: 'link', label: 'Links' },
];

export function GlobalLibraryFilters({ filters, onChange }: GlobalLibraryFiltersProps) {
  const handleSearchChange = (search: string) => {
    onChange({ ...filters, search: search || undefined });
  };

  const handleTypeToggle = (type: LibraryItemType) => {
    const current = filters.itemTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onChange({ ...filters, itemTypes: updated.length > 0 ? updated : undefined });
  };

  const handleFavoritesToggle = () => {
    onChange({ ...filters, favoritesOnly: !filters.favoritesOnly });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar materiais..."
          className="pl-9"
        />
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {TYPE_OPTIONS.map(({ value, label }) => (
          <Badge
            key={value}
            variant={filters.itemTypes?.includes(value) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => handleTypeToggle(value)}
          >
            {label}
          </Badge>
        ))}

        {/* Favorites toggle */}
        <Button
          variant={filters.favoritesOnly ? 'default' : 'outline'}
          size="sm"
          onClick={handleFavoritesToggle}
          className="gap-1"
        >
          <Star className={cn('h-3.5 w-3.5', filters.favoritesOnly && 'fill-current')} />
          Favoritos
        </Button>
      </div>
    </div>
  );
}
