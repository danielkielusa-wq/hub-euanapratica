import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { JourneyCard, PlanToolCard } from './JourneyCard';
import { LiveHubCard } from './LiveHubCard';
import { useMyHub, usePlanTools } from '@/hooks/useMyHub';
import { useMyLives } from '@/hooks/useMyLives';

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

function EmptyJourneyCard() {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-col">
      <div className="p-6 border-b border-gray-100 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground">Sua Jornada</h3>
        <p className="text-sm text-gray-500 dark:text-muted-foreground">Gerencie suas atividades</p>
      </div>
      <div className="p-6 flex flex-col items-center text-center gap-4 py-10">
        <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
          <Compass className="w-7 h-7 text-indigo-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-foreground">
            Você ainda não iniciou nenhuma jornada
          </p>
          <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
            Conheça nossos serviços e comece sua transformação de carreira
          </p>
        </div>
        <button
          onClick={() => navigate('/catalogo')}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#7367F0] hover:bg-[#6254e0] rounded-lg transition-colors"
        >
          Explorar Serviços <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface MyJourneySectionProps {
  excludeHistory?: boolean;
}

export function MyJourneySection({ excludeHistory = false }: MyJourneySectionProps) {
  const { data: sections, isLoading: hubLoading } = useMyHub();
  const { data: planTools, isLoading: toolsLoading } = usePlanTools();
  const { data: myLives, isLoading: livesLoading } = useMyLives();
  const [activeTab, setActiveTab] = useState<'ongoing' | 'lives'>('ongoing');

  const isLoading = hubLoading || toolsLoading || livesLoading;

  const hasServices = (sections && sections.length > 0) || (planTools && planTools.length > 0);
  const hasLives = myLives && myLives.length > 0;
  const hasAnything = hasServices || hasLives;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <SectionSkeleton />
      </div>
    );
  }

  if (!hasAnything) {
    return <EmptyJourneyCard />;
  }

  // Flatten all services into a single list
  const allItems = sections
    ?.filter((s) => !(excludeHistory && s.id === 'history'))
    .flatMap((s) => s.items) ?? [];

  // Sort lives: live > scheduled > completed
  const sortedLives = myLives ? [...myLives].sort((a, b) => {
    const STATUS_PRIORITY: Record<string, number> = { live: 0, scheduled: 1, completed: 2 };
    const pa = STATUS_PRIORITY[a.live.status] ?? 3;
    const pb = STATUS_PRIORITY[b.live.status] ?? 3;
    if (pa !== pb) return pa - pb;
    return new Date(a.live.scheduled_at).getTime() - new Date(b.live.scheduled_at).getTime();
  }) : [];

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-col">
      {/* Header with tabs */}
      <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground">Sua Jornada</h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">Gerencie suas atividades</p>
        </div>
        {hasLives && (
          <div className="flex bg-gray-100 dark:bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'ongoing'
                  ? 'bg-white dark:bg-card text-[#7367F0] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Em Andamento
            </button>
            <button
              onClick={() => setActiveTab('lives')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'lives'
                  ? 'bg-white dark:bg-card text-[#7367F0] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Minhas Lives
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {activeTab === 'ongoing' ? (
          <>
            {allItems.map((item) => (
              <JourneyCard key={item.user_service_id} item={item} />
            ))}
            {planTools && planTools.map((tool) => (
              <PlanToolCard key={tool.service.id} tool={tool} />
            ))}
            {allItems.length === 0 && (!planTools || planTools.length === 0) && (
              <p className="text-sm text-gray-400 dark:text-muted-foreground text-center py-4">
                Nenhuma atividade em andamento
              </p>
            )}
          </>
        ) : (
          <>
            {sortedLives.map((item) => (
              <LiveHubCard key={item.registration_id} item={item} />
            ))}
            {sortedLives.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-muted-foreground text-center py-4">
                Nenhuma live registrada
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
