import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Radio } from 'lucide-react';
import { useLives } from '@/hooks/useLives';
import { LiveCard } from '@/components/lives/LiveCard';
import type { LiveAccessType } from '@/types/live';

export default function LivesDiscovery() {
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<string>('all');

  const { data: lives, isLoading } = useLives();

  const filteredLives = (lives || []).filter(live => {
    const matchesSearch = live.title.toLowerCase().includes(search.toLowerCase())
      || (live.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesAccess = accessFilter === 'all' || live.access_type === accessFilter;
    return matchesSearch && matchesAccess;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Radio className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-foreground">Lives</h1>
          </div>
          <p className="text-muted-foreground">
            Participe de eventos ao vivo com mentores e especialistas
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={accessFilter} onValueChange={setAccessFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Acesso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="free">Gratuitas</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
              <SelectItem value="subscribers">Assinantes</SelectItem>
              <SelectItem value="pro">Pro / VIP</SelectItem>
              <SelectItem value="vip">Apenas VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLives.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma live disponível
            </h3>
            <p className="text-muted-foreground">
              {search || accessFilter !== 'all'
                ? 'Tente ajustar seus filtros.'
                : 'Novas lives serão publicadas em breve!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLives.map((live) => (
              <LiveCard key={live.id} live={live} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
