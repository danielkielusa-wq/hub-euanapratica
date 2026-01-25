import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMentorEspacos } from '@/hooks/useMentorEspacos';
import { Loader2, Search, Users, Calendar, GraduationCap, ArrowRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels: Record<string, string> = {
  immersion: 'Imersão',
  group_mentoring: 'Mentoria em Grupo',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  course: 'Curso',
};

const statusLabels: Record<string, string> = {
  active: 'Em Andamento',
  inactive: 'Inativo',
  completed: 'Concluído',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export default function MentorEspacos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const { data: espacos, isLoading } = useMentorEspacos();

  const filteredEspacos = (espacos || []).filter(espaco => {
    const matchesSearch = espaco.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || espaco.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || espaco.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Meus Espaços</h1>
            <p className="text-muted-foreground">
              Gerencie suas mentorias, imersões e programas
            </p>
          </div>
          <Button onClick={() => navigate('/mentor/espacos/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Espaço
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar espaço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Em Andamento</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEspacos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum espaço encontrado</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {search || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Você ainda não possui espaços. Clique em "Criar Espaço" para começar.'}
              </p>
              {!search && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button className="mt-4" onClick={() => navigate('/mentor/espacos/novo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Espaço
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full md:grid md:grid-cols-2 lg:grid-cols-3">
            {filteredEspacos.map((espaco) => (
              <div key={espaco.id} className="w-full max-w-[90%] md:max-w-none mx-auto md:mx-0">
                <Card 
                  className="group hover:shadow-md transition-all cursor-pointer h-full"
                  onClick={() => navigate(`/mentor/espacos/${espaco.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {espaco.name}
                        </h3>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {categoryLabels[espaco.category] || espaco.category}
                        </Badge>
                      </div>
                      <Badge className={`${statusColors[espaco.status]} shrink-0 ml-2`}>
                        {statusLabels[espaco.status] || espaco.status}
                      </Badge>
                    </div>
                    
                    {espaco.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {espaco.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{espaco.enrolled_count || 0} alunos</span>
                      </div>
                      {espaco.start_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(espaco.start_date), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Ver detalhes
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
