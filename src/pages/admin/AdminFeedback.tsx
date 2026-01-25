import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminFeedback, useFeedbackStats } from '@/hooks/useFeedback';
import { FeedbackFiltersComponent } from '@/components/admin/feedback/FeedbackFilters';
import { FeedbackTable } from '@/components/admin/feedback/FeedbackTable';
import { FeedbackDetailDrawer } from '@/components/admin/feedback/FeedbackDetailDrawer';
import { StatCard } from '@/components/admin/shared/StatCard';
import { Bug, Lightbulb, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { FeedbackFilters } from '@/types/feedback';

export default function AdminFeedback() {
  const [filters, setFilters] = useState<FeedbackFilters>({
    type: 'all',
    status: 'all',
    priority: 'all',
    userRole: 'all',
    search: '',
  });
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const { data: feedbackItems, isLoading } = useAdminFeedback(filters);
  const { data: stats } = useFeedbackStats();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bugs & Melhorias</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os feedbacks reportados pelos usuários da plataforma
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total"
            value={stats?.total ?? 0}
            icon={AlertCircle}
            tooltip="Total de feedbacks registrados"
          />
          <StatCard
            title="Novos"
            value={stats?.new ?? 0}
            icon={AlertCircle}
            variant={stats?.new && stats.new > 0 ? 'warning' : 'default'}
            tooltip="Feedbacks aguardando análise"
          />
          <StatCard
            title="Em Análise"
            value={stats?.inReview ?? 0}
            icon={AlertCircle}
            tooltip="Feedbacks sendo analisados"
          />
          <StatCard
            title="Bugs"
            value={stats?.bugs ?? 0}
            icon={Bug}
            tooltip="Total de bugs reportados"
          />
          <StatCard
            title="Melhorias"
            value={stats?.enhancements ?? 0}
            icon={Lightbulb}
            tooltip="Total de sugestões de melhoria"
          />
        </div>

        {/* Filtros */}
        <FeedbackFiltersComponent filters={filters} onFiltersChange={setFilters} />

        {/* Tabela de Feedbacks */}
        <Card>
          <CardHeader>
            <CardTitle>Feedbacks</CardTitle>
            <CardDescription>
              {feedbackItems?.length ?? 0} {feedbackItems?.length === 1 ? 'item encontrado' : 'itens encontrados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <FeedbackTable
                items={feedbackItems || []}
                onViewDetails={(id) => setSelectedFeedbackId(id)}
              />
            )}
          </CardContent>
        </Card>

        {/* Drawer de Detalhes */}
        <FeedbackDetailDrawer
          feedbackId={selectedFeedbackId}
          onClose={() => setSelectedFeedbackId(null)}
        />
      </div>
    </DashboardLayout>
  );
}
