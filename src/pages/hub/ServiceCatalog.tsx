import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, LayoutGrid, MessageCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHubServices, useUserHubAccess } from '@/hooks/useHubServices';
import { ServiceCard } from '@/components/hub/ServiceCard';
import { SERVICE_TYPE_LABELS, ServiceType } from '@/types/hub';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'ai_tool', label: 'Ferramentas IA' },
  { value: 'live_mentoring', label: 'Mentoria' },
  { value: 'consulting', label: 'Consultoria' },
  { value: 'recorded_course', label: 'Cursos' },
];

export default function ServiceCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: services, isLoading } = useHubServices();
  const { data: userAccess = [] } = useUserHubAccess();

  // Filter services
  const filteredServices = services?.filter((service) => {
    // Search filter
    const matchesSearch = 
      !searchQuery ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter
    const matchesCategory = 
      selectedCategory === 'all' || 
      service.service_type === selectedCategory;

    return matchesSearch && matchesCategory;
  }) || [];

  // Check access
  const hasAccess = (serviceId: string, status: string) => {
    if (status === 'available') return true;
    return userAccess.includes(serviceId);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/dashboard/hub" 
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Hub
            </Link>
            
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                  Catálogo de Serviços
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Explore todos os serviços e ferramentas disponíveis
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar serviços..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl pl-10"
                />
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="mb-8 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  'rounded-full',
                  selectedCategory === cat.value && 'bg-primary text-primary-foreground'
                )}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-72 rounded-[32px]" />
              ))}
            </div>
          )}

          {/* Services Grid */}
          {!isLoading && filteredServices.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  hasAccess={hasAccess(service.id, service.status)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredServices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Nenhum serviço encontrado
              </h3>
              <p className="mb-4 text-muted-foreground">
                Tente ajustar seus filtros ou buscar por outro termo.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-12 rounded-3xl bg-gradient-to-r from-primary/10 to-indigo-100 p-8 text-center dark:from-primary/5 dark:to-indigo-900/20">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Não encontrou o que procurava?
            </h3>
            <p className="mb-4 text-muted-foreground">
              Fale com um de nossos especialistas e descubra como podemos ajudar.
            </p>
            <Button 
              className="gap-2"
              onClick={() => window.open('https://chat.whatsapp.com/I7Drkh80c1b9ULOmnwPOwg', '_blank')}
            >
              <MessageCircle className="h-4 w-4" />
              Falar com Especialista
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
