import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useHubServices, useUserHubAccess } from '@/hooks/useHubServices';
import { HubServiceCard } from '@/components/hub/HubServiceCard';
import { Loader2, LayoutGrid, Sparkles } from 'lucide-react';
import { HubService } from '@/types/hub';

export default function StudentHub() {
  const { data: services, isLoading } = useHubServices();
  const { data: userAccess = [] } = useUserHubAccess();

  // Separate active services (available or has access) from locked/coming soon
  const activeServices =
    services?.filter(
      (s) => s.status === 'available' || userAccess.includes(s.id)
    ) || [];
  const exploreServices =
    services?.filter(
      (s) =>
        (s.status === 'premium' && !userAccess.includes(s.id)) ||
        s.status === 'coming_soon'
    ) || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">SEU ECOSSISTEMA</span>
            </div>
            <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
              Meu Hub de Serviços
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Centralize sua jornada internacional. Acesse ferramentas de IA, mentorias e recursos
              exclusivos para acelerar sua carreira nos EUA.
            </p>
          </div>

          {/* Active Services */}
          {activeServices.length > 0 && (
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">Meus Serviços Ativos</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeServices.map((service) => (
                  <HubServiceCard
                    key={service.id}
                    service={service as HubService}
                    hasAccess={userAccess.includes(service.id) || service.status === 'available'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Explore & Upgrade */}
          {exploreServices.length > 0 && (
            <section>
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                <h2 className="text-lg font-semibold text-foreground">Explorar & Contratar</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {exploreServices.map((service) => (
                  <HubServiceCard
                    key={service.id}
                    service={service as HubService}
                    hasAccess={false}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!activeServices.length && !exploreServices.length && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Nenhum serviço disponível
              </h3>
              <p className="text-muted-foreground">
                Novos serviços serão exibidos aqui em breve.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
