import { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { FileType, MaterialFilters } from '@/types/library';
import { FILE_TYPE_LABELS } from '@/lib/file-utils';

interface MaterialFiltersProps {
  filters: MaterialFilters;
  onChange: (filters: MaterialFilters) => void;
}

const FILE_TYPES: FileType[] = ['pdf', 'docx', 'xlsx', 'pptx', 'zip', 'png', 'jpg', 'link'];

export function MaterialFiltersBar({ filters, onChange }: MaterialFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounce search
    const timeout = setTimeout(() => {
      onChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timeout);
  };

  const handleTypeToggle = (type: FileType) => {
    const current = filters.fileTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onChange({ ...filters, fileTypes: updated.length ? updated : undefined });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [MaterialFilters['sortBy'], MaterialFilters['sortOrder']];
    onChange({ ...filters, sortBy, sortOrder });
  };

  const clearFilters = () => {
    setSearchValue('');
    onChange({});
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.fileTypes?.length) count++;
    if (filters.favoritesOnly) count++;
    return count;
  }, [filters]);

  const sortValue = `${filters.sortBy || 'uploaded_at'}-${filters.sortOrder || 'desc'}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* File Type Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Tipo
              {filters.fileTypes?.length ? (
                <Badge variant="secondary" className="ml-1">
                  {filters.fileTypes.length}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3">Tipo de Arquivo</p>
              {FILE_TYPES.map(type => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.fileTypes?.includes(type) || false}
                    onCheckedChange={() => handleTypeToggle(type)}
                  />
                  <span className="text-sm">{FILE_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Select value={sortValue} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uploaded_at-desc">Mais recentes</SelectItem>
            <SelectItem value="uploaded_at-asc">Mais antigos</SelectItem>
            <SelectItem value="filename-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="filename-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="file_size-desc">Maior tamanho</SelectItem>
            <SelectItem value="file_size-asc">Menor tamanho</SelectItem>
          </SelectContent>
        </Select>

        {/* Favorites Toggle */}
        <Button
          variant={filters.favoritesOnly ? 'default' : 'outline'}
          onClick={() => onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })}
        >
          ★ Favoritos
        </Button>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{filters.search}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchValue('');
                  onChange({ ...filters, search: undefined });
                }}
              />
            </Badge>
          )}
          
          {filters.fileTypes?.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {FILE_TYPE_LABELS[type]}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTypeToggle(type)}
              />
            </Badge>
          ))}
          
          {filters.favoritesOnly && (
            <Badge variant="secondary" className="gap-1">
              Apenas favoritos
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onChange({ ...filters, favoritesOnly: false })}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}
