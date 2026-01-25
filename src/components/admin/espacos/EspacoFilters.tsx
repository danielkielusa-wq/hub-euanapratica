import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORY_LABELS, type EspacoCategory, type EspacoFilters } from '@/types/admin';
import { useMentors } from '@/hooks/useAdminEspacos';
import { Search } from 'lucide-react';

interface EspacoFiltersProps {
  filters: EspacoFilters;
  onChange: (filters: EspacoFilters) => void;
}

export function EspacoFiltersComponent({ filters, onChange }: EspacoFiltersProps) {
  const { data: mentors } = useMentors();
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Debounce search
    const timeout = setTimeout(() => {
      onChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timeout);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onChange({ ...filters, status: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="active">Ativa</SelectItem>
          <SelectItem value="inactive">Inativa</SelectItem>
          <SelectItem value="completed">Concluída</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.category || 'all'}
        onValueChange={(value) => onChange({ ...filters, category: value === 'all' ? undefined : value as EspacoCategory })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as Categorias</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.mentor_id || 'all'}
        onValueChange={(value) => onChange({ ...filters, mentor_id: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Mentor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Mentores</SelectItem>
          {mentors?.map((mentor: any) => (
            <SelectItem key={mentor.id} value={mentor.id}>
              {mentor.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
