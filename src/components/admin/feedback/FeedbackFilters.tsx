import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { FeedbackFilters } from '@/types/feedback';

interface FeedbackFiltersProps {
  filters: FeedbackFilters;
  onFiltersChange: (filters: FeedbackFilters) => void;
}

export function FeedbackFiltersComponent({ filters, onFiltersChange }: FeedbackFiltersProps) {
  const handleChange = (key: keyof FeedbackFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      status: 'all',
      priority: 'all',
      userRole: 'all',
      search: '',
    });
  };

  const hasActiveFilters = 
    (filters.type && filters.type !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    (filters.userRole && filters.userRole !== 'all') ||
    filters.search;

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex flex-wrap gap-4">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, descrição ou rota..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tipo */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(v) => handleChange('type', v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="enhancement">Melhoria</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(v) => handleChange('status', v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="new">Novo</SelectItem>
            <SelectItem value="in_review">Em Análise</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="considered_no_action">Considerado</SelectItem>
            <SelectItem value="discarded">Desconsiderado</SelectItem>
          </SelectContent>
        </Select>

        {/* Prioridade */}
        <Select
          value={filters.priority || 'all'}
          onValueChange={(v) => handleChange('priority', v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>

        {/* Role */}
        <Select
          value={filters.userRole || 'all'}
          onValueChange={(v) => handleChange('userRole', v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Reportado por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="student">Aluno</SelectItem>
            <SelectItem value="mentor">Mentor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
