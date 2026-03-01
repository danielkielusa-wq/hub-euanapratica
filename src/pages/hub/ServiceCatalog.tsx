import { useState, useEffect, useRef } from 'react';
import { Search, LayoutGrid, MessageCircle } from 'lucide-react';
import { useUpdateGuidedTourState } from '@/hooks/useGuidedTour';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useHubServices, useUserHubAccess } from '@/hooks/useHubServices';
import { CatalogCard } from '@/components/hub/CatalogCard';
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

  // Mark catalog as visited for the getting-started checklist
  const updateTourState = useUpdateGuidedTourState();
  const hasMarkedRef = useRef(false);
  useEffect(() => {
    if (!hasMarkedRef.current) {
      hasMarkedRef.current = true;
      updateTourState.mutate({ catalog_visited: true });
    }
  }, []);
  const { data: userAccess = [] } = useUserHubAccess();

  // Filter services
  const filteredServices = services?.filter((service) => {
    const matchesSearch =
      !searchQuery ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchQuery.toLowerCase());

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
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-foreground mb-2">Catálogo de Serviços</h2>
            <p className="text-gray-500 dark:text-muted-foreground text-sm max-w-xl">
              Explore nossas soluções premium para acelerar sua carreira internacional.
              Ferramentas de IA, mentorias exclusivas e consultoria especializada.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar serviços..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full transition-all bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground shadow-sm"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                selectedCategory === cat.value
                  ? 'bg-[#7367F0] text-white shadow-md shadow-indigo-200 dark:shadow-none'
                  : 'bg-white dark:bg-card text-gray-600 dark:text-muted-foreground border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[420px] w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Services Grid */}
        {!isLoading && filteredServices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <CatalogCard
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
            <div className="w-14 h-14 bg-gray-50 dark:bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="h-7 w-7 text-gray-300 dark:text-muted-foreground" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-foreground text-lg mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-gray-500 dark:text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              Tente ajustar seus filtros ou buscar por outro termo.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="bg-white dark:bg-card text-gray-600 dark:text-muted-foreground px-5 py-2.5 rounded-lg font-medium border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-sm"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl shadow-indigo-200 dark:shadow-none">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Não encontrou o que procurava?</h3>
            <p className="text-indigo-100 mb-8 text-lg">
              Fale com um de nossos especialistas e descubra qual é o melhor caminho para o seu momento atual.
            </p>
            <button
              onClick={() => window.open('https://chat.whatsapp.com/I7Drkh80c1b9ULOmnwPOwg', '_blank')}
              className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg inline-flex items-center gap-2 mx-auto"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com Especialista
            </button>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

      </div>
    </DashboardLayout>
  );
}
