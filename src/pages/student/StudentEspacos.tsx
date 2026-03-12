import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Input } from '@/components/ui/input';
import { useStudentEspacosWithStats } from '@/hooks/useStudentEspacosWithStats';
import { NetflixEspacoCard } from '@/components/espacos/NetflixEspacoCard';
import { ExploreCoursesCard } from '@/components/espacos/StudentEspacoCard';
import { EspacosEmptyState } from '@/components/espacos/EspacosEmptyState';
import { Loader2, Search } from 'lucide-react';

type FilterType = 'in_progress' | 'completed' | 'all';

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
        active ? 'bg-muted text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

export default function StudentEspacos() {
  const { data: espacos, isLoading } = useStudentEspacosWithStats();
  const [filter, setFilter] = useState<FilterType>('in_progress');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const hasNoEspacosAtAll = !espacos || espacos.length === 0;

  // Filter espacos based on status and search
  const filteredEspacos = espacos?.filter(espaco => {
    const matchesSearch = !search || espaco.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'completed') return espaco.status === 'completed';
    if (filter === 'in_progress') return espaco.status === 'active' || !espaco.status;
    return true;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center flex-1 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minha Jornada</h1>
            <p className="text-muted-foreground text-sm">Seus espaços exclusivos de mentoria e acompanhamento.</p>
          </div>

          <div className="flex bg-card p-1 rounded-lg border border-border shadow-sm">
            <TabButton label="Em andamento" active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} />
            <TabButton label="Concluídos" active={filter === 'completed'} onClick={() => setFilter('completed')} />
            <TabButton label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar espaço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Cards Grid */}
        {filteredEspacos && filteredEspacos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
            {filteredEspacos.map((espaco) => (
              <NetflixEspacoCard key={espaco.id} espaco={espaco} role="student" />
            ))}
          </div>
        ) : hasNoEspacosAtAll && filter === 'all' && !search ? (
          <EspacosEmptyState onExplore={() => navigate('/dashboard/hub')} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum espaço encontrado</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {search
                ? 'Tente ajustar sua busca.'
                : `Nenhum espaço ${filter === 'completed' ? 'concluído' : 'em andamento'} no momento.`}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
