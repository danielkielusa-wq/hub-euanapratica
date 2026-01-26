import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMentorEspacosWithStats } from '@/hooks/useMentorEspacosWithStats';
import { NetflixEspacoCard } from '@/components/espacos/NetflixEspacoCard';
import { Loader2, Search, GraduationCap, Plus, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function MentorEspacos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const { data: espacos, isLoading } = useMentorEspacosWithStats();

  const filteredEspacos = (espacos || []).filter(espaco => {
    const matchesSearch = espaco.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || espaco.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || espaco.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Espaços</h1>
            <p className="text-muted-foreground">
              Gerencie suas mentorias, imersões e programas
            </p>
          </div>
          <Button variant="gradient" onClick={() => navigate('/mentor/espacos/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Espaço
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar espaço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="space-y-0">
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Em Andamento</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="arquivado">Arquivados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    <SelectItem value="immersion">Imersão</SelectItem>
                    <SelectItem value="group_mentoring">Mentoria em Grupo</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="bootcamp">Bootcamp</SelectItem>
                    <SelectItem value="course">Curso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEspacos.length === 0 ? (
          <Card className="rounded-[24px]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum espaço encontrado</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {search || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Você ainda não possui espaços. Clique em "Criar Espaço" para começar.'}
              </p>
              {!search && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button className="mt-4 rounded-xl" onClick={() => navigate('/mentor/espacos/novo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Espaço
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
            {filteredEspacos.map((espaco) => (
              <NetflixEspacoCard key={espaco.id} espaco={espaco} role="mentor" />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
