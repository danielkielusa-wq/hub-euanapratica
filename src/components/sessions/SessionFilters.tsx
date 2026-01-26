import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  return (
    <div className="flex items-center gap-3 justify-end">
      <Select
        value={selectedEspacoId || 'all'}
        onValueChange={(value) => onEspacoChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[180px] rounded-lg border-gray-200 bg-white">
          <SelectValue placeholder="Todos os espaços" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
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
        <SelectTrigger className="w-[160px] rounded-lg border-gray-200 bg-white">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="scheduled">Agendada</SelectItem>
          <SelectItem value="live">Ao Vivo</SelectItem>
          <SelectItem value="completed">Concluída</SelectItem>
          <SelectItem value="cancelled">Cancelada</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
