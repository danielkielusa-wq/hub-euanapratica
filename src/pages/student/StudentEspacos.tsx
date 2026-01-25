import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useEspacos } from '@/hooks/useEspacos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Calendar, 
  Users, 
  ChevronRight,
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const categoryLabels: Record<string, string> = {
  immersion: 'Imersão',
  group_mentoring: 'Mentoria em Grupo',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  course: 'Curso',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600',
  inactive: 'bg-muted text-muted-foreground',
  completed: 'bg-blue-500/10 text-blue-600',
};

const statusLabels: Record<string, string> = {
  active: 'Em Andamento',
  inactive: 'Inativo',
  completed: 'Concluído',
};

export default function StudentEspacos() {
  const { data: espacos, isLoading } = useEspacos();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Espaços</h1>
          <p className="text-muted-foreground">
            Espaços de aprendizado em que você está matriculado
          </p>
        </div>

        {/* Espacos Grid */}
        {espacos && espacos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {espacos.map((espaco) => (
              <Card 
                key={espaco.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/biblioteca`)}
              >
                {espaco.cover_image_url && (
                  <div className="h-32 overflow-hidden rounded-t-lg">
                    <img 
                      src={espaco.cover_image_url} 
                      alt={espaco.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className={!espaco.cover_image_url ? 'pt-6' : ''}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{espaco.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {espaco.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[espaco.status || 'active']}>
                      {statusLabels[espaco.status || 'active']}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      <span>{categoryLabels[espaco.category || 'course'] || espaco.category}</span>
                    </div>
                    {espaco.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(espaco.start_date), "MMM yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Acessar
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum espaço encontrado</h3>
              <p className="text-muted-foreground mt-1 text-center">
                Você ainda não está matriculado em nenhum espaço de aprendizado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
