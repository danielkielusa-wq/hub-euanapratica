import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useStudentEspacosWithStats } from '@/hooks/useStudentEspacosWithStats';
import { StudentEspacoCard, ExploreCoursesCard } from '@/components/espacos/StudentEspacoCard';
import { EspacosEmptyState } from '@/components/espacos/EspacosEmptyState';
import { Loader2 } from 'lucide-react';

type FilterType = 'in_progress' | 'completed' | 'all';

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
        active ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

export default function StudentEspacos() {
  const { data: espacos, isLoading } = useStudentEspacosWithStats();
  const [filter, setFilter] = useState<FilterType>('in_progress');
  const navigate = useNavigate();

  const hasNoEspacosAtAll = !espacos || espacos.length === 0;

  // Filter espacos based on status
  const filteredEspacos = espacos?.filter(espaco => {
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
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Minha Jornada</h2>
            <p className="text-gray-500 text-sm">Seus espaços exclusivos de mentoria e acompanhamento.</p>
          </div>

          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <TabButton label="Em andamento" active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} />
            <TabButton label="Concluídos" active={filter === 'completed'} onClick={() => setFilter('completed')} />
            <TabButton label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
          </div>
        </div>

        {/* Cards Grid */}
        {filteredEspacos && filteredEspacos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEspacos.map((espaco) => (
              <StudentEspacoCard key={espaco.id} espaco={espaco} />
            ))}
            <ExploreCoursesCard />
          </div>
        ) : hasNoEspacosAtAll && filter === 'all' ? (
          <EspacosEmptyState onExplore={() => navigate('/dashboard/hub')} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Nenhum espaço encontrado</h3>
            <p className="text-gray-500 text-center max-w-sm">
              {`Nenhum espaço ${filter === 'completed' ? 'concluído' : 'em andamento'} no momento.`}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
