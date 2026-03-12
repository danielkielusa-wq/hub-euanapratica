import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorEspacos } from '@/hooks/useMentorEspacos';
import { useUpcomingSessions } from '@/hooks/useSessions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ChevronLeft, ChevronRight, AlertCircle,
  CheckCircle2, Plus, GraduationCap, Calendar,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Gradient color palette for espaco avatars ──
const ESPACO_COLORS = [
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-violet-500 to-purple-500',
];

function getEspacoColor(index: number) {
  return ESPACO_COLORS[index % ESPACO_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Mini Calendar ──
function MiniCalendar({ sessionDates }: { sessionDates: Date[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const hasSession = (day: Date) => sessionDates.some(sd => isSameDay(sd, day));

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold text-foreground">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[11px] font-bold text-muted-foreground">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}
        {days.map(day => {
          const today = isToday(day);
          const session = hasSession(day);
          return (
            <div key={day.toISOString()} className="flex justify-center items-center h-8">
              <div className={`
                w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium relative cursor-pointer transition-colors
                ${today ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 dark:text-foreground hover:bg-gray-100 dark:hover:bg-muted'}
                ${session && !today ? 'font-bold' : ''}
              `}>
                {day.getDate()}
                {session && (
                  <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${today ? 'bg-white' : 'bg-indigo-600 dark:bg-primary'}`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Student list item ──
interface MentorStudent {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  espaco_name: string;
}

// ── Main Dashboard ──
export default function MentorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showStudentsSheet, setShowStudentsSheet] = useState(false);

  const { data: espacos, isLoading: loadingEspacos } = useMentorEspacos();
  const { data: upcomingSessions, isLoading: loadingSessions } = useUpcomingSessions(5);

  const { data: mentorStats, isLoading: loadingStats } = useQuery({
    queryKey: ['mentor-dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: mentorEspacos } = await supabase
        .from('espacos')
        .select('id')
        .eq('mentor_id', user.id);

      const espacoIds = mentorEspacos?.map(e => e.id) || [];

      if (espacoIds.length === 0) {
        return { totalStudents: 0, pendingSubmissions: 0, upcomingSessionsCount: 0, pendingSubmissionsList: [] };
      }

      const { count: totalStudents } = await supabase
        .from('user_espacos')
        .select('id', { count: 'exact', head: true })
        .in('espaco_id', espacoIds)
        .eq('status', 'active');

      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title, espaco_id')
        .in('espaco_id', espacoIds)
        .eq('status', 'published');

      const assignmentIds = assignments?.map(a => a.id) || [];

      let pendingSubmissionsList: any[] = [];
      let pendingSubmissions = 0;

      if (assignmentIds.length > 0) {
        const { data: submissions, count } = await supabase
          .from('submissions')
          .select('id, submitted_at, user_id, assignment_id', { count: 'exact' })
          .in('assignment_id', assignmentIds)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false })
          .limit(5);

        pendingSubmissions = count || 0;

        if (submissions && submissions.length > 0) {
          const userIds = submissions.map(s => s.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
          const assignmentMap = new Map(assignments?.map(a => [a.id, a.title]) || []);

          pendingSubmissionsList = submissions.map(s => ({
            id: s.id,
            studentName: profileMap.get(s.user_id) || 'Aluno',
            taskTitle: assignmentMap.get(s.assignment_id) || 'Tarefa',
            submittedAt: s.submitted_at,
            assignmentId: s.assignment_id,
          }));
        }
      }

      const { count: upcomingSessionsCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .in('espaco_id', espacoIds)
        .gte('datetime', new Date().toISOString())
        .eq('status', 'scheduled');

      return { totalStudents: totalStudents || 0, pendingSubmissions, upcomingSessionsCount: upcomingSessionsCount || 0, pendingSubmissionsList };
    },
    enabled: !!user?.id,
  });

  // Fetch students list (only when sheet is open)
  const { data: studentsList } = useQuery<MentorStudent[]>({
    queryKey: ['mentor-all-students', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: mentorEspacos } = await supabase
        .from('espacos')
        .select('id, name')
        .eq('mentor_id', user.id);

      if (!mentorEspacos || mentorEspacos.length === 0) return [];

      const espacoIds = mentorEspacos.map(e => e.id);
      const espacoMap = new Map(mentorEspacos.map(e => [e.id, e.name]));

      const { data: enrollments } = await supabase
        .from('user_espacos')
        .select('user_id, espaco_id')
        .in('espaco_id', espacoIds)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) return [];

      const userIds = [...new Set(enrollments.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, profile_photo_url')
        .in('id', userIds);

      if (!profiles) return [];

      const profileMap = new Map(profiles.map(p => [p.id, p]));

      return enrollments.map(e => {
        const profile = profileMap.get(e.user_id);
        return {
          id: e.user_id,
          full_name: profile?.full_name || 'Aluno',
          profile_photo_url: profile?.profile_photo_url || null,
          espaco_name: espacoMap.get(e.espaco_id) || '',
        };
      }).sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
    enabled: showStudentsSheet && !!user?.id,
  });

  const isLoading = loadingEspacos || loadingSessions || loadingStats;

  const sessionDates = useMemo(
    () => (upcomingSessions || []).map(s => new Date(s.datetime)),
    [upcomingSessions],
  );

  const todayFormatted = format(new Date(), "dd 'de' MMMM, EEEE", { locale: ptBR });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Row 1: Hero Banner + Profile Card ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Banner */}
          <div className="lg:col-span-2 flex flex-col justify-end">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-foreground">Bem-vindo, {user?.full_name?.split(' ')[0]}</h1>
              <p className="text-sm text-muted-foreground capitalize">{todayFormatted}</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white flex items-center justify-between shadow-sm relative overflow-hidden">
              <div className="relative z-10 flex-1">
                <p className="text-lg font-medium mb-1">
                  Você tem <span className="font-bold text-yellow-300">{mentorStats?.totalStudents || 0} alunos</span> em {espacos?.length || 0} espaços.
                </p>
                <p className="text-sm text-indigo-100">
                  {(mentorStats?.pendingSubmissions || 0) > 0
                    ? `${mentorStats!.pendingSubmissions} tarefas aguardam sua correção.`
                    : 'Todas as tarefas foram corrigidas!'}
                </p>
              </div>
              <button
                onClick={() => navigate('/mentor/sessao/nova')}
                className="relative z-10 shrink-0 ml-4 px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Sessão
              </button>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 transform translate-x-8" />
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm p-6 flex items-center gap-4 h-full mt-auto">
            <Avatar className="w-16 h-16 shrink-0">
              <AvatarImage src={user?.profile_photo_url || undefined} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {getInitials(user?.full_name || 'M')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-lg truncate">{user?.full_name}</h3>
              <p className="text-xs text-muted-foreground truncate mb-3">{user?.email}</p>
              <div className="flex gap-3">
                <div className="bg-gray-50 dark:bg-muted px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 dark:text-foreground">
                  Turmas: <span className="text-indigo-600 dark:text-primary">{espacos?.length || 0}</span>
                </div>
                <div className="bg-gray-50 dark:bg-muted px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 dark:text-foreground">
                  Alunos: <span className="text-indigo-600 dark:text-primary">{mentorStats?.totalStudents || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Stat Cards (3 cards, no icons) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total de Alunos — clickable, opens sheet */}
          <button
            onClick={() => setShowStudentsSheet(true)}
            className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm p-5 text-left hover:border-indigo-200 dark:hover:border-primary/30 hover:shadow-md transition-all"
          >
            <p className="text-2xl font-bold text-foreground">{mentorStats?.totalStudents || 0}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Total de Alunos</p>
            <p className="text-xs mt-1 text-muted-foreground">Em {espacos?.length || 0} espaços</p>
          </button>

          {/* Tarefas Pendentes — clickable, navigates */}
          <button
            onClick={() => navigate('/mentor/tarefas')}
            className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm p-5 text-left hover:border-indigo-200 dark:hover:border-primary/30 hover:shadow-md transition-all"
          >
            <p className="text-2xl font-bold text-foreground">{mentorStats?.pendingSubmissions || 0}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Tarefas Pendentes</p>
            <p className={`text-xs mt-1 ${(mentorStats?.pendingSubmissions || 0) > 5 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              {(mentorStats?.pendingSubmissions || 0) > 5 ? 'Urgente' : 'Pendentes'}
            </p>
          </button>

          {/* Próximas Sessões */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm p-5">
            <p className="text-2xl font-bold text-foreground">{mentorStats?.upcomingSessionsCount || 0}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Próximas Sessões</p>
            <p className="text-xs mt-1 text-muted-foreground">
              {upcomingSessions?.[0] ? `Próxima: ${format(new Date(upcomingSessions[0].datetime), 'dd/MM', { locale: ptBR })}` : 'Nenhuma agendada'}
            </p>
          </div>
        </div>

        {/* ── Row 3: Espaços + Sessões + Calendário ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Meus Espaços */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-foreground">Meus Espaços</h2>
              <button
                onClick={() => navigate('/mentor/espacos')}
                className="text-xs font-bold text-indigo-600 dark:text-primary bg-indigo-50 dark:bg-primary/10 px-3 py-1 rounded-full hover:bg-indigo-100 dark:hover:bg-primary/20 transition-colors"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-3 flex-1">
              {espacos && espacos.length > 0 ? (
                espacos.slice(0, 4).map((espaco, idx) => (
                  <div
                    key={espaco.id}
                    onClick={() => navigate(`/mentor/espacos/${espaco.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/40"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getEspacoColor(idx)} flex items-center justify-center text-white font-bold shadow-sm text-xs`}>
                      {getInitials(espaco.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{espaco.name}</h4>
                      <p className="text-xs text-muted-foreground">{espaco.enrolled_count || 0} alunos</p>
                    </div>
                    <Badge variant={espaco.status === 'active' ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
                      {espaco.status === 'active' ? 'Ativo' : espaco.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <GraduationCap className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum espaço criado</p>
                </div>
              )}
            </div>
          </div>

          {/* Próximas Sessões */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-foreground">Próximas Sessões</h2>
              <button
                onClick={() => navigate('/mentor/agenda')}
                className="text-xs font-bold text-indigo-600 dark:text-primary bg-indigo-50 dark:bg-primary/10 px-3 py-1 rounded-full hover:bg-indigo-100 dark:hover:bg-primary/20 transition-colors"
              >
                Calendário
              </button>
            </div>
            <div className="space-y-3 flex-1">
              {upcomingSessions && upcomingSessions.length > 0 ? (
                upcomingSessions.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/mentor/sessao/${session.id}`)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-border/40 cursor-pointer"
                  >
                    <div className="bg-white dark:bg-card px-3 py-2 rounded-lg text-center shadow-sm shrink-0 min-w-[52px]">
                      <div className="text-xs font-bold text-foreground">
                        {format(new Date(session.datetime), 'HH:mm')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(session.datetime), 'dd/MM')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{session.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{session.espacos?.name}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {session.duration_minutes || 60}min
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma sessão agendada</p>
                </div>
              )}
            </div>
          </div>

          {/* Mini Calendário */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm p-6 flex flex-col">
            <MiniCalendar sessionDates={sessionDates} />
          </div>
        </div>

        {/* ── Row 4: Tarefas para Corrigir (full width table) ── */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-foreground">Tarefas para Corrigir</h2>
            <button
              onClick={() => navigate('/mentor/tarefas')}
              className="text-xs font-bold text-indigo-600 dark:text-primary bg-indigo-50 dark:bg-primary/10 px-3 py-1 rounded-full hover:bg-indigo-100 dark:hover:bg-primary/20 transition-colors"
            >
              Todas as tarefas
            </button>
          </div>

          {mentorStats?.pendingSubmissionsList && mentorStats.pendingSubmissionsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border/40">
                    <th className="pb-3 font-medium">Tarefa</th>
                    <th className="pb-3 font-medium">Entregue em</th>
                    <th className="pb-3 font-medium">Aluno</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {mentorStats.pendingSubmissionsList.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5">
                        <span className="text-sm font-medium text-foreground">{item.taskTitle}</span>
                      </td>
                      <td className="py-3.5 text-sm text-muted-foreground">
                        {item.submittedAt && format(new Date(item.submittedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                            {getInitials(item.studentName)}
                          </div>
                          <span className="text-sm text-foreground">{item.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase">
                          <AlertCircle className="w-3 h-3" />
                          Pendente
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs rounded-lg"
                          onClick={() => navigate(`/mentor/tarefas/${item.assignmentId}/entregas`)}
                        >
                          Corrigir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhuma tarefa pendente</p>
              <p className="text-sm mt-1">Todas as entregas foram corrigidas!</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Students Sheet ── */}
      <Sheet open={showStudentsSheet} onOpenChange={setShowStudentsSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Alunos Ativos</SheetTitle>
            <SheetDescription>
              {mentorStats?.totalStudents || 0} alunos em {espacos?.length || 0} espaços
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
            {studentsList && studentsList.length > 0 ? (
              studentsList.map((student, idx) => (
                <div
                  key={`${student.id}-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarImage src={student.profile_photo_url || undefined} />
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {getInitials(student.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{student.espaco_name}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Nenhum aluno encontrado</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
