import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useStudentEspacosWithStats } from '@/hooks/useStudentEspacosWithStats';
import { NetflixEspacoCard } from '@/components/espacos/NetflixEspacoCard';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function StudentEspacos() {
  const { data: espacos, isLoading } = useStudentEspacosWithStats();

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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Espaços</h1>
          <p className="text-muted-foreground">
            Espaços de aprendizado em que você está matriculado
          </p>
        </div>

        {/* Netflix-style Grid */}
        {espacos && espacos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {espacos.map((espaco) => (
              <div key={espaco.id} className="flex justify-center sm:justify-start">
                <div className="w-full max-w-[280px]">
                  <NetflixEspacoCard espaco={espaco} />
                </div>
              </div>
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
