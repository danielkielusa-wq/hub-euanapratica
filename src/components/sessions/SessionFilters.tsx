import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Espaco {
  id: string;
  name: string;
}

interface SessionFiltersProps {
  espacos: Espaco[];
  selectedEspacoId: string | null;
  selectedStatus: string | null;
  onEspacoChange: (espacoId: string | null) => void;
  onStatusChange: (status: string | null) => void;
}

export function SessionFilters({
  espacos,
  selectedEspacoId,
  selectedStatus,
  onEspacoChange,
  onStatusChange,
}: SessionFiltersProps) {
  const hasFilters = selectedEspacoId || selectedStatus;

  const clearFilters = () => {
    onEspacoChange(null);
    onStatusChange(null);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select
        value={selectedEspacoId || 'all'}
        onValueChange={(value) => onEspacoChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos os espaços" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os espaços</SelectItem>
          {espacos.map((espaco) => (
            <SelectItem key={espaco.id} value={espaco.id}>
              {espaco.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selectedStatus || 'all'}
        onValueChange={(value) => onStatusChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="scheduled">Agendada</SelectItem>
          <SelectItem value="live">Ao Vivo</SelectItem>
          <SelectItem value="completed">Concluída</SelectItem>
          <SelectItem value="cancelled">Cancelada</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
