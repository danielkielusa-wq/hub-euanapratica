import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';
import { useStudentEspacosWithStats } from '@/hooks/useStudentEspacosWithStats';
import { StudentEspacoCard, ExploreCoursesCard } from '@/components/espacos/StudentEspacoCard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'in_progress' | 'completed';

export default function StudentEspacos() {
  const { data: espacos, isLoading } = useStudentEspacosWithStats();
  const [filter, setFilter] = useState<FilterType>('all');

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
          <DashboardTopHeader />
          <div className="flex items-center justify-center flex-1 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <DashboardTopHeader />
        
        <div className="flex-1 p-6 lg:p-8 bg-muted/30">
          {/* Page Header with Filters */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meus Espaços</h1>
              <p className="text-muted-foreground">Seus cursos e mentorias ativos</p>
            </div>
            
            {/* Filter Pills */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={filter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setFilter('in_progress')}
              >
                Em andamento
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setFilter('completed')}
              >
                Concluídos
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredEspacos && filteredEspacos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEspacos.map((espaco) => (
                <StudentEspacoCard key={espaco.id} espaco={espaco} />
              ))}
              <ExploreCoursesCard />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum espaço encontrado</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {filter === 'all' 
                  ? 'Você ainda não está matriculado em nenhum espaço de aprendizado.'
                  : `Nenhum espaço ${filter === 'completed' ? 'concluído' : 'em andamento'} no momento.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
