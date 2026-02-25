import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, BookOpen, Film, Search } from 'lucide-react';
import { useStudentCourses } from '@/hooks/useCoursePlayer';

export default function StudentCourses() {
  const navigate = useNavigate();
  const { data: courses = [], isLoading } = useStudentCourses();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Cursos</h1>
          <p className="text-muted-foreground mt-1">
            Continue de onde parou
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold">Nenhum curso ainda</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              Explore nosso catálogo e encontre o curso ideal para você
            </p>
            <Button
              className="mt-4 rounded-full"
              onClick={() => navigate('/catalogo')}
            >
              <Search className="h-4 w-4 mr-2" />
              Explorar Cursos
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="rounded-[20px] overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all group"
                onClick={() => navigate(`/curso/${course.id}`)}
              >
                {/* Cover */}
                <div className="aspect-[16/9] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 relative overflow-hidden">
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="h-12 w-12 text-white/40" />
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <PlayCircle className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Progress pill */}
                  {course.progressPercent > 0 && (
                    <div className="absolute top-3 right-3">
                      <Badge
                        className="bg-black/60 backdrop-blur-sm text-white border-0 text-xs font-semibold"
                      >
                        {course.progressPercent}%
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                    {course.name}
                  </h3>

                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Film className="h-3 w-3" />
                        {course.completedLessons}/{course.totalLessons} aulas
                      </span>
                      <span className="font-medium text-foreground">
                        {course.progressPercent}%
                      </span>
                    </div>
                    <Progress
                      value={course.progressPercent}
                      className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-primary/80"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Explore card */}
            <Card
              className="rounded-[20px] border-2 border-dashed border-muted-foreground/15 cursor-pointer hover:border-primary/30 transition-all flex items-center justify-center min-h-[280px]"
              onClick={() => navigate('/catalogo')}
            >
              <div className="text-center space-y-2 p-6">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Explorar mais cursos
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
