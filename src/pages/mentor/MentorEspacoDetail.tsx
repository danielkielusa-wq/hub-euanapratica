import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMentorEspaco,
  useEspacoStats,
  useEspacoStudents,
  useArchiveEspaco,
  useRemoveStudent,
  useUpdateStudentNotes,
  useMentorActivityFeed,
  useEspacoKanbanSubmissions,
} from '@/hooks/useMentorEspacos';
import { useGenerateStudentSuggestion } from '@/hooks/useMentorAI';
import { useSessions } from '@/hooks/useSessions';
import { useAssignments } from '@/hooks/useAssignments';
import { useFolders } from '@/hooks/useFolders';
import { useEspacoDiscussionCount } from '@/hooks/useSessionPosts';
import { EspacoLibrary } from '@/components/library/EspacoLibrary';
import {
  EspacoHeroHeader,
  EspacoMetricsRow,
  EspacoStickyTabs,
  SessionTimeline,
  TaskListGrouped,
  OverviewContent,
  DiscussionSessionsList,
  QuickActionsGrid,
  EngagementCircle,
  MentorActivityFeed,
  SubmissionKanban,
  AISessionPrepCard,
  AISessionSummaryDialog,
  MyFilesTab,
} from '@/components/espacos/detail';
import { InviteStudentModal } from '@/components/mentor/InviteStudentModal';
import { useEspacoInvitations, useCancelInvitation } from '@/hooks/useEspacoInvitations';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { GRADIENT_PRESETS, type GradientPresetKey, resolveGradient } from '@/lib/gradients';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { EspacoStudent } from '@/hooks/useMentorEspacos';
import {
  Plus,
  MoreHorizontal,
  UserMinus,
  Archive,
  RefreshCw,
  Settings,
  AlertCircle,
  BookOpen,
  UserPlus,
  Search,
  Calendar,
  ClipboardCheck,
  Send,
  HelpCircle,
  Edit3,
  Activity,
  Download,
  Mail,
  LayoutGrid,
  List,
  Sparkles,
  Loader2,
  GraduationCap,
  Palette,
  ImageIcon,
  X,
  Clock,
  XCircle,
  RotateCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoryLabels: Record<string, string> = {
  immersion: 'Imersão',
  group_mentoring: 'Mentoria em Grupo',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  course: 'Curso',
};

// Animation variants
const tabContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function MentorEspacoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  const [studentSearch, setStudentSearch] = useState('');
  const [drawerStudent, setDrawerStudent] = useState<EspacoStudent | null>(null);
  const [drawerNotes, setDrawerNotes] = useState('');
  const [assignmentView, setAssignmentView] = useState<'kanban' | 'list'>('kanban');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [studentToRemove, setStudentToRemove] = useState<EspacoStudent | null>(null);

  const queryClient = useQueryClient();
  const archiveMutation = useArchiveEspaco();
  const removeStudentMutation = useRemoveStudent();
  const notesMutation = useUpdateStudentNotes();
  const suggestionMutation = useGenerateStudentSuggestion();
  const [studentSuggestion, setStudentSuggestion] = useState<string | null>(null);

  // Settings tab inline edit state
  const [settingsName, setSettingsName] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsCategory, setSettingsCategory] = useState('immersion');
  const [settingsVisibility, setSettingsVisibility] = useState('private');
  const [settingsMaxStudents, setSettingsMaxStudents] = useState(30);
  const [settingsStatus, setSettingsStatus] = useState('active');
  const [settingsStartDate, setSettingsStartDate] = useState('');
  const [settingsEndDate, setSettingsEndDate] = useState('');
  const [settingsGradientPreset, setSettingsGradientPreset] = useState<GradientPresetKey | null>(null);
  const [settingsCoverImageUrl, setSettingsCoverImageUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { data: espaco, isLoading: espacoLoading } = useMentorEspaco(id || '');
  const { data: stats } = useEspacoStats(id || '');
  const { data: students } = useEspacoStudents(id || '');
  const { data: sessions, isLoading: sessionsLoading } = useSessions(id);
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments({ espaco_id: id });
  const { data: folders } = useFolders(id || '');
  const { data: discussionCount = 0 } = useEspacoDiscussionCount(id);
  const { data: activityFeed, isLoading: feedLoading } = useMentorActivityFeed(id || '');
  const { data: invitations } = useEspacoInvitations(id || '');
  const cancelInvitation = useCancelInvitation();
  const { data: kanbanSubmissions, isLoading: kanbanLoading } = useEspacoKanbanSubmissions(id || '');

  const openDrawer = useCallback((student: EspacoStudent) => {
    setDrawerStudent(student);
    setDrawerNotes(student.notes || '');
    setStudentSuggestion(null);
  }, []);

  const saveNotes = useCallback(() => {
    if (!drawerStudent || !id) return;
    notesMutation.mutate({ enrollmentId: drawerStudent.id, notes: drawerNotes, espacoId: id });
  }, [drawerStudent, drawerNotes, id]);

  const filteredStudents = students?.filter(s =>
    !studentSearch || s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  const pendingInvitations = invitations?.filter(inv =>
    inv.status === 'pending' &&
    (!studentSearch || inv.email.toLowerCase().includes(studentSearch.toLowerCase()) || (inv.invited_name || '').toLowerCase().includes(studentSearch.toLowerCase()))
  ) || [];

  const toggleStudentSelection = useCallback((studentId: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }, []);

  const toggleAllStudents = useCallback(() => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  }, [filteredStudents, selectedStudents.size]);

  const exportStudentsCsv = useCallback(() => {
    const selected = filteredStudents.filter(s => selectedStudents.has(s.id));
    const rows = selected.length > 0 ? selected : filteredStudents;
    const header = 'Nome,Email,Matrícula,Sessões,Último Acesso';
    const csvRows = rows.map(s =>
      `"${s.fullName}","${s.email}","${s.enrolledAt ? format(new Date(s.enrolledAt), 'dd/MM/yyyy') : ''}","${s.sessionsAttended}/${s.totalSessions}","${s.lastAccessAt ? format(new Date(s.lastAccessAt), 'dd/MM/yyyy HH:mm') : 'Nunca'}"`
    );
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alunos-${espaco?.name || 'espaco'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredStudents, selectedStudents, espaco?.name]);

  const getSelectedEmails = useCallback(() => {
    const selected = filteredStudents.filter(s => selectedStudents.has(s.id));
    return selected.map(s => s.email);
  }, [filteredStudents, selectedStudents]);

  // Filter upcoming sessions
  const upcomingSessions = sessions?.filter(s => 
    new Date(s.datetime) >= new Date() && 
    (s.status === 'scheduled' || s.status === 'live')
  ) || [];

  // Get pending submissions for mentor (assignments needing review)
  const pendingSubmissions = stats?.pendingReviews || 0;

  // Get next session with meeting link
  const nextSessionWithLink = upcomingSessions.find(s => s.meeting_link);

  // Populate settings form when espaco loads
  useEffect(() => {
    if (!espaco) return;
    setSettingsName(espaco.name || '');
    setSettingsDescription(espaco.description || '');
    setSettingsCategory(espaco.category || 'immersion');
    setSettingsVisibility(espaco.visibility || 'private');
    setSettingsMaxStudents(espaco.max_students ?? 30);
    setSettingsStatus(espaco.status || 'active');
    setSettingsStartDate(espaco.start_date || '');
    setSettingsEndDate(espaco.end_date || '');
    if (espaco.gradient_preset && espaco.gradient_preset in GRADIENT_PRESETS) {
      setSettingsGradientPreset(espaco.gradient_preset as GradientPresetKey);
    }
    if (espaco.cover_image_url) setSettingsCoverImageUrl(espaco.cover_image_url);
  }, [espaco]);

  const handleCoverUpload = async (file: File) => {
    if (!user) return;
    setIsUploadingCover(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `espaco-covers/${user.id}/${Date.now()}_${safeName}`;
      const { data: uploadData, error } = await supabase.storage
        .from('materials')
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(uploadData.path);
      setSettingsCoverImageUrl(publicUrl);
      toast.success('Imagem carregada com sucesso!');
    } catch {
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!id || !settingsName.trim()) {
      toast.error('Nome do espaço é obrigatório');
      return;
    }
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('espacos')
        .update({
          name: settingsName.trim(),
          description: settingsDescription || null,
          category: settingsCategory,
          visibility: settingsVisibility,
          max_students: settingsMaxStudents,
          status: settingsStatus,
          start_date: settingsStartDate || null,
          end_date: settingsEndDate || null,
          gradient_preset: settingsCoverImageUrl ? null : (settingsGradientPreset || null),
          cover_image_url: settingsCoverImageUrl || null,
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Espaço atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['mentor-espaco'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-espacos'] });
    } catch {
      toast.error('Erro ao atualizar espaço');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    const isArchived = espaco?.status === 'arquivado';
    archiveMutation.mutate({
      espacoId: id,
      archive: !isArchived
    });
  };

  if (espacoLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-muted/30">
          <motion.div
            className="space-y-4 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Skeleton className="h-48 rounded-2xl" />
            <motion.div
              className="flex gap-3 overflow-hidden"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={staggerItem}><Skeleton className="h-20 w-36 rounded-2xl shrink-0" /></motion.div>
              <motion.div variants={staggerItem}><Skeleton className="h-20 w-36 rounded-2xl shrink-0" /></motion.div>
              <motion.div variants={staggerItem}><Skeleton className="h-20 w-36 rounded-2xl shrink-0" /></motion.div>
              <motion.div variants={staggerItem}><Skeleton className="h-20 w-36 rounded-2xl shrink-0" /></motion.div>
            </motion.div>
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!espaco) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <div className="text-center py-12 px-6 max-w-sm mx-auto rounded-3xl bg-card/70 backdrop-blur-sm border border-border/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">Espaço não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Este espaço não existe ou você não tem acesso a ele.
            </p>
            <Button 
              onClick={() => navigate('/mentor/espacos')}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl"
            >
              Voltar para Meus Espaços
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30">
        {/* Hero Header - Role aware */}
        <EspacoHeroHeader
          espaco={espaco}
          nextSession={nextSessionWithLink}
          role="mentor"
          studentsCount={stats?.enrolledCount}
          studentAvatars={students?.slice(0, 4).map(s => ({
            id: s.id,
            name: s.fullName,
            photoUrl: s.profilePhotoUrl,
          })) || []}
          onSettingsClick={() => setActiveTab('settings')}
          onInviteClick={() => setInviteModalOpen(true)}
        />

        {/* Invite Modal */}
        <InviteStudentModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          espacoId={id || ''}
          espacoName={espaco.name}
        />

        {/* Metrics Row - Mentor specific */}
        <EspacoMetricsRow
          sessionsCount={upcomingSessions.length}
          tasksCount={pendingSubmissions}
          materialsCount={folders?.length || 0}
          maxStudents={stats?.enrolledCount ?? espaco.max_students}
          isMentor
        />

        {/* Sticky Tabs - Extended for mentor */}
        <EspacoStickyTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingTasks={pendingSubmissions}
          upcomingSessions={upcomingSessions.length}
          discussionCount={discussionCount}
          showMentorTabs
          studentsCount={stats?.enrolledCount}
        />

        {/* Tab Content */}
        <div className="px-4 py-6 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <motion.div className="space-y-6" variants={staggerContainer} initial="hidden" animate="visible">
                {/* Row 1: Sessions + Quick Actions */}
                <motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-3 items-stretch">
                  <div className="lg:col-span-2 flex">
                    <OverviewContent
                      upcomingSessions={upcomingSessions}
                      pendingAssignments={[]}
                      sessionsLoading={sessionsLoading}
                      assignmentsLoading={false}
                      onViewAllSessions={() => setActiveTab('sessions')}
                      onViewAllAssignments={() => setActiveTab('assignments')}
                      isMentor
                      espacoId={id}
                      variant="sessions-only"
                    />
                  </div>
                  <div className="flex">
                    <QuickActionsGrid actions={[
                      { icon: Calendar, label: 'Agendar Sessão', onClick: () => navigate(`/mentor/sessao/nova?espaco=${id}`) },
                      { icon: ClipboardCheck, label: 'Nova Tarefa', onClick: () => navigate(`/mentor/tarefas/nova?espaco=${id}`) },
                      { icon: UserPlus, label: 'Convidar Aluno', onClick: () => setInviteModalOpen(true), colSpan: 2 },
                    ]} />
                  </div>
                </motion.div>

                {/* Row 2: Assignments + Engagement */}
                <motion.div variants={staggerItem} className="grid gap-6 lg:grid-cols-3 items-stretch">
                  <div className="lg:col-span-2 flex">
                    <OverviewContent
                      upcomingSessions={[]}
                      pendingAssignments={assignments?.filter(a => a.status === 'published') || []}
                      sessionsLoading={false}
                      assignmentsLoading={assignmentsLoading}
                      onViewAllSessions={() => setActiveTab('sessions')}
                      onViewAllAssignments={() => setActiveTab('assignments')}
                      isMentor
                      espacoId={id}
                      variant="assignments-only"
                    />
                  </div>
                  <div className="flex">
                    <EngagementCircle
                      percentage={stats?.avgAttendance || 0}
                      enrolledCount={stats?.enrolledCount || 0}
                    />
                  </div>
                </motion.div>

                {/* Row 3: AI Prep (conditional) */}
                {upcomingSessions.length > 0 && (
                  <motion.div variants={staggerItem}>
                    <AISessionPrepCard
                      sessionId={upcomingSessions[0].id}
                      sessionTitle={upcomingSessions[0].title}
                      espacoId={id || ''}
                    />
                  </motion.div>
                )}

                <motion.div variants={staggerItem}>
                  <MentorActivityFeed activities={activityFeed || []} isLoading={feedLoading} />
                </motion.div>
              </motion.div>
              </motion.div>
            )}

            {activeTab === 'sessions' && (
              <motion.div key="sessions" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Sessões</h2>
                  <div className="flex items-center gap-2">
                    {sessions?.some(s => s.status === 'completed') && (
                      <AISessionSummaryDialog
                        sessionId={sessions.filter(s => s.status === 'completed').sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0]?.id || ''}
                        sessionTitle={sessions.filter(s => s.status === 'completed').sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0]?.title || ''}
                        espacoId={id || ''}
                      />
                    )}
                    <Button
                      onClick={() => navigate(`/mentor/sessao/nova?espaco=${id}`)}
                      className="rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Sessão
                    </Button>
                  </div>
                </div>
                <SessionTimeline
                  sessions={sessions}
                  isLoading={sessionsLoading}
                  isMentor
                />
              </div>
              </motion.div>
            )}

            {activeTab === 'assignments' && (
              <motion.div key="assignments" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Tarefas & Correções</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl border border-border/50 p-0.5">
                      <Button
                        variant={assignmentView === 'kanban' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-lg px-3 h-8"
                        onClick={() => setAssignmentView('kanban')}
                      >
                        <LayoutGrid className="h-4 w-4 mr-1.5" />
                        Kanban
                      </Button>
                      <Button
                        variant={assignmentView === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-lg px-3 h-8"
                        onClick={() => setAssignmentView('list')}
                      >
                        <List className="h-4 w-4 mr-1.5" />
                        Lista
                      </Button>
                    </div>
                    <Button
                      onClick={() => navigate(`/mentor/tarefas/nova?espaco=${id}`)}
                      className="rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Tarefa
                    </Button>
                  </div>
                </div>
                {assignmentView === 'kanban' ? (
                  <SubmissionKanban
                    submissions={kanbanSubmissions}
                    isLoading={kanbanLoading}
                  />
                ) : (
                  <TaskListGrouped
                    assignments={assignments}
                    isLoading={assignmentsLoading}
                    isMentor
                  />
                )}
              </div>
              </motion.div>
            )}

            {activeTab === 'library' && (
              <motion.div key="library" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <EspacoLibrary
                espacoId={id!}
                espacoName={espaco.name}
                userRole="mentor"
              />
              </motion.div>
            )}

            {activeTab === 'my-files' && (
              <motion.div key="my-files" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <MyFilesTab
                espacoId={id!}
                espacoName={espaco.name}
              />
              </motion.div>
            )}

            {activeTab === 'discussao' && (
              <motion.div key="discussao" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <DiscussionSessionsList
                sessions={sessions}
                isLoading={sessionsLoading}
              />
              </motion.div>
            )}

            {activeTab === 'students' && (
              <motion.div key="students" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    Alunos Matriculados
                    {pendingInvitations.length > 0 && (
                      <Badge variant="outline" className="ml-2 border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 text-xs font-normal">
                        {pendingInvitations.length} pendente{pendingInvitations.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </h2>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar aluno..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={exportStudentsCsv}
                          className="rounded-xl shrink-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exportar CSV {selectedStudents.size > 0 ? `(${selectedStudents.size} selecionados)` : '(todos)'}</TooltipContent>
                    </Tooltip>
                    <Button
                      variant="outline"
                      onClick={() => setInviteModalOpen(true)}
                      className="rounded-xl gap-2 shrink-0"
                    >
                      <UserPlus className="h-4 w-4" />
                      Convidar
                    </Button>
                  </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedStudents.size > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-sm font-medium text-primary">
                      {selectedStudents.size} aluno{selectedStudents.size > 1 ? 's' : ''} selecionado{selectedStudents.size > 1 ? 's' : ''}
                    </span>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5"
                      onClick={() => {
                        const emails = getSelectedEmails();
                        window.open(`mailto:${emails.join(',')}`, '_blank');
                      }}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Enviar Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5"
                      onClick={exportStudentsCsv}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-muted-foreground"
                      onClick={() => setSelectedStudents(new Set())}
                    >
                      Limpar
                    </Button>
                  </div>
                )}

                {(filteredStudents.length > 0 || pendingInvitations.length > 0) ? (
                  <Card className="rounded-[24px] overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                              onCheckedChange={toggleAllStudents}
                            />
                          </TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              Progresso
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[260px] text-xs">
                                  <p className="font-semibold mb-1">Progresso de sessões</p>
                                  <p>Sessões confirmadas como presentes pelo aluno em relação ao total de sessões realizadas no espaço.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              Engajamento
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[280px] text-xs">
                                  <p className="font-semibold mb-1">Score de engajamento (0-100%)</p>
                                  <p>Presença em sessões passadas, entregas de tarefas vencidas e frequência de acesso à plataforma.</p>
                                  <p className="mt-1 text-muted-foreground">Passe o mouse no % de cada aluno para ver o detalhamento.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead>
                            <div className="flex items-center gap-1">
                              Último Acesso
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[260px] text-xs">
                                  <p className="font-semibold mb-1">Último acesso ao espaço</p>
                                  <p>Data e hora em que o aluno acessou este espaço pela última vez. Atualiza automaticamente a cada visita.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Pending Invitations */}
                        {pendingInvitations.map((inv) => (
                          <TableRow key={`inv-${inv.id}`} className="bg-amber-50/50 dark:bg-amber-500/5">
                            <TableCell className="w-10" />
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                    <Clock className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-muted-foreground">{inv.invited_name || inv.email.split('@')[0]}</p>
                                  <p className="text-sm text-muted-foreground">{inv.email}</p>
                                </div>
                                <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/10 text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pendente
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                Convite {format(new Date(inv.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </TableCell>
                            <TableCell><span className="text-sm text-muted-foreground">—</span></TableCell>
                            <TableCell><span className="text-sm text-muted-foreground">—</span></TableCell>
                            <TableCell><span className="text-sm text-muted-foreground">—</span></TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`${window.location.origin}/cadastro?token=${inv.token}&espaco_id=${inv.espaco_id}`);
                                      toast.success('Link de convite copiado!');
                                    }}
                                  >
                                    <Send className="h-4 w-4" />
                                    Copiar Link
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => {
                                      supabase.functions.invoke('send-espaco-invitation', {
                                        body: { espaco_id: inv.espaco_id, email: inv.email, invited_name: inv.invited_name },
                                      });
                                      toast.success('Convite reenviado!');
                                    }}
                                  >
                                    <RotateCw className="h-4 w-4" />
                                    Reenviar Convite
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer text-destructive"
                                    onClick={() => cancelInvitation.mutate({ invitationId: inv.id, espacoId: inv.espaco_id })}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Cancelar Convite
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Enrolled Students */}
                        {filteredStudents.map((student) => (
                          <TableRow
                            key={student.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest('button, [role=checkbox]')) return;
                              openDrawer(student);
                            }}
                          >
                            <TableCell className="w-10">
                              <Checkbox
                                checked={selectedStudents.has(student.id)}
                                onCheckedChange={() => toggleStudentSelection(student.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={student.profilePhotoUrl || undefined} />
                                  <AvatarFallback>
                                    {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{student.fullName}</p>
                                  <p className="text-sm text-muted-foreground">{student.email}</p>
                                </div>
                                {student.needsAttention && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-4 w-4 text-orange-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>Este aluno pode precisar de atenção</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(student.enrolledAt), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={student.totalSessions > 0 ? (student.sessionsAttended / student.totalSessions) * 100 : 0}
                                  className="w-16 h-2"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {student.sessionsAttended}/{student.totalSessions}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs font-semibold cursor-help",
                                      student.churnRisk === 'high' && "border-pink-300 text-pink-700 bg-pink-50 dark:border-pink-500/30 dark:text-pink-400 dark:bg-pink-500/10",
                                      student.churnRisk === 'medium' && "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/10",
                                      student.churnRisk === 'low' && "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10",
                                    )}
                                  >
                                    {student.churnScore}%
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[300px] text-xs">
                                  {student.scoreBreakdown.explanation.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                  ))}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              {student.lastAccessAt
                                ? formatDistanceToNow(new Date(student.lastAccessAt), { addSuffix: true, locale: ptBR })
                                : 'Nunca'
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); openDrawer(student); }}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer text-destructive"
                                    onClick={(e) => { e.stopPropagation(); setStudentToRemove(student); }}
                                  >
                                    <UserMinus className="h-4 w-4" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ) : (students && students.length > 0) || (invitations && invitations.some(i => i.status === 'pending')) ? (
                  <Card className="rounded-[24px]">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhum aluno encontrado para "{studentSearch}"
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-[24px]">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Nenhum aluno matriculado</h3>
                      <p className="text-muted-foreground mt-1">
                        Convide alunos para começar sua turma.
                      </p>
                      <Button
                        className="mt-4 rounded-xl"
                        onClick={() => setInviteModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar Aluno
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Student Detail Drawer */}
                <Sheet open={!!drawerStudent} onOpenChange={(open) => !open && setDrawerStudent(null)}>
                  <SheetContent className="w-full max-w-md overflow-y-auto">
                    {drawerStudent && (
                      <>
                        <SheetHeader className="pb-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={drawerStudent.profilePhotoUrl || undefined} />
                              <AvatarFallback className="text-lg">
                                {drawerStudent.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <SheetTitle className="text-lg">{drawerStudent.fullName}</SheetTitle>
                              <p className="text-sm text-muted-foreground">{drawerStudent.email}</p>
                              <Badge variant="outline" className="mt-1">
                                {drawerStudent.status === 'active' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                        </SheetHeader>

                        <div className="space-y-6 pt-4">
                          {/* Progress */}
                          <div>
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Progresso</h3>
                            <div className="flex items-center gap-4">
                              <Progress
                                value={drawerStudent.totalSessions > 0 ? (drawerStudent.sessionsAttended / drawerStudent.totalSessions) * 100 : 0}
                                className="flex-1 h-3"
                              />
                              <span className="text-lg font-bold text-foreground">
                                {drawerStudent.totalSessions > 0
                                  ? Math.round((drawerStudent.sessionsAttended / drawerStudent.totalSessions) * 100)
                                  : 0}%
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {drawerStudent.sessionsAttended} de {drawerStudent.totalSessions} sessões
                            </p>
                          </div>

                          {/* Churn Score */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Engajamento</h3>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[300px] text-xs">
                                  {drawerStudent.scoreBreakdown.explanation.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                  ))}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "text-2xl font-bold",
                                drawerStudent.churnRisk === 'high' && "text-pink-600 dark:text-pink-400",
                                drawerStudent.churnRisk === 'medium' && "text-amber-600 dark:text-amber-400",
                                drawerStudent.churnRisk === 'low' && "text-emerald-600 dark:text-emerald-400",
                              )}>
                                {drawerStudent.churnScore}%
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  drawerStudent.churnRisk === 'high' && "border-pink-300 text-pink-700 dark:border-pink-500/30 dark:text-pink-400",
                                  drawerStudent.churnRisk === 'medium' && "border-amber-300 text-amber-700 dark:border-amber-500/30 dark:text-amber-400",
                                  drawerStudent.churnRisk === 'low' && "border-emerald-300 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400",
                                )}
                              >
                                {drawerStudent.churnRisk === 'high' ? 'Risco Alto' : drawerStudent.churnRisk === 'medium' ? 'Risco Médio' : 'Saudável'}
                              </Badge>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-muted/50">
                              <p className="text-xs text-muted-foreground">Matrícula</p>
                              <p className="text-sm font-semibold">{format(new Date(drawerStudent.enrolledAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50">
                              <p className="text-xs text-muted-foreground">Último Acesso</p>
                              <p className="text-sm font-semibold">
                                {drawerStudent.lastAccessAt
                                  ? formatDistanceToNow(new Date(drawerStudent.lastAccessAt), { addSuffix: true, locale: ptBR })
                                  : 'Nunca'}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50">
                              <p className="text-xs text-muted-foreground">Tarefas Entregues</p>
                              <p className="text-sm font-semibold">{drawerStudent.submissionsCount}/{drawerStudent.totalAssignments}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/50">
                              <p className="text-xs text-muted-foreground">Sessões Presentes</p>
                              <p className="text-sm font-semibold">{drawerStudent.sessionsAttended}/{drawerStudent.totalSessions}</p>
                            </div>
                          </div>

                          {/* AI Suggestion */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="h-4 w-4 text-violet-500" />
                              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Sugestão IA</h3>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[240px]">
                                  Gera sugestões personalizadas de engajamento com base nos dados do aluno. O prompt é configurável pelo admin.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            {studentSuggestion ? (
                              <div className="rounded-xl bg-violet-50/50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/20 p-3">
                                <div
                                  className="prose prose-sm dark:prose-invert max-h-[200px] overflow-y-auto text-sm"
                                  dangerouslySetInnerHTML={{ __html: studentSuggestion
                                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/^- (.+)$/gm, '<li>$1</li>')
                                    .replace(/\n/g, '<br/>')
                                  }}
                                />
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full rounded-xl gap-2 border-violet-200 dark:border-violet-500/20 hover:bg-violet-50 dark:hover:bg-violet-500/5"
                                onClick={() => {
                                  if (!drawerStudent || !id) return;
                                  suggestionMutation.mutate(
                                    { studentId: drawerStudent.userId, espacoId: id },
                                    { onSuccess: (data) => setStudentSuggestion(data.suggestion) }
                                  );
                                }}
                                disabled={suggestionMutation.isPending}
                              >
                                {suggestionMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4 text-violet-500" />
                                )}
                                {suggestionMutation.isPending ? 'Gerando...' : 'Gerar Sugestão de Engajamento'}
                              </Button>
                            )}
                          </div>

                          {/* Private Notes */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Edit3 className="h-4 w-4 text-muted-foreground" />
                              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Anotações Privadas</h3>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-[240px]">
                                  Notas visíveis apenas para você. O aluno não tem acesso a essas anotações.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Textarea
                              value={drawerNotes}
                              onChange={e => setDrawerNotes(e.target.value)}
                              placeholder="Adicione notas sobre o aluno..."
                              className="min-h-[100px] rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20"
                            />
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={saveNotes}
                                disabled={notesMutation.isPending}
                                className="rounded-xl"
                              >
                                {notesMutation.isPending ? 'Salvando...' : 'Salvar Anotações'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </SheetContent>
                </Sheet>

                {/* Remove Student Confirmation Dialog */}
                <AlertDialog open={!!studentToRemove} onOpenChange={(open) => !open && setStudentToRemove(null)}>
                  <AlertDialogContent className="sm:rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover aluno</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover <span className="font-semibold text-foreground">{studentToRemove?.fullName}</span> do espaço? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          if (studentToRemove && id) {
                            removeStudentMutation.mutate({
                              enrollmentId: studentToRemove.id,
                              espacoId: id,
                            });
                            setDrawerStudent(null);
                            setStudentToRemove(null);
                          }
                        }}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remover Aluno
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Editar Espaço</h2>
                  <p className="text-sm text-muted-foreground mt-1">Altere as informações do espaço</p>
                </div>

                {/* Informações do Espaço */}
                <Card className="rounded-[24px]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Informações do Espaço</CardTitle>
                        <CardDescription>Defina os detalhes básicos do espaço</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nome do Espaço *</label>
                      <Input
                        value={settingsName}
                        onChange={e => setSettingsName(e.target.value)}
                        placeholder="Ex: Imersão EUA 2024"
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
                      <Textarea
                        value={settingsDescription}
                        onChange={e => setSettingsDescription(e.target.value)}
                        placeholder="Descreva o objetivo e conteúdo deste espaço..."
                        className="min-h-[100px] rounded-xl"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Categoria *</label>
                        <Select value={settingsCategory} onValueChange={setSettingsCategory}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Visibilidade</label>
                        <Select value={settingsVisibility} onValueChange={setSettingsVisibility}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Privado</SelectItem>
                            <SelectItem value="public">Público</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Máximo de Alunos</label>
                        <Input
                          type="number"
                          min={1}
                          max={500}
                          value={settingsMaxStudents}
                          onChange={e => setSettingsMaxStudents(Number(e.target.value))}
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                        <Select value={settingsStatus} onValueChange={setSettingsStatus}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="arquivado">Arquivado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Data de Início</label>
                        <Input
                          type="date"
                          value={settingsStartDate}
                          onChange={e => setSettingsStartDate(e.target.value)}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Opcional</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Data de Término</label>
                        <Input
                          type="date"
                          value={settingsEndDate}
                          onChange={e => setSettingsEndDate(e.target.value)}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Opcional</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('overview')}
                        className="rounded-xl"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveSettings}
                        disabled={isSavingSettings}
                        className="rounded-xl"
                      >
                        {isSavingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Aparência do Cabeçalho */}
                <Card className="rounded-[24px]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Palette className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <CardTitle>Aparência do Cabeçalho</CardTitle>
                        <CardDescription>Escolha um gradiente ou faça upload de uma imagem de capa.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Preview */}
                    <div
                      className="w-full h-32 rounded-2xl overflow-hidden relative"
                      style={
                        settingsCoverImageUrl
                          ? { backgroundImage: `url(${settingsCoverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { background: resolveGradient(settingsGradientPreset, null, null, 'preview') }
                      }
                    >
                      {settingsCoverImageUrl && <div className="absolute inset-0 bg-black/40" />}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">Pré-visualização</span>
                      </div>
                    </div>

                    {/* Gradient Presets */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3">Gradiente</p>
                      <div className="flex flex-wrap gap-3">
                        {(Object.entries(GRADIENT_PRESETS) as [GradientPresetKey, typeof GRADIENT_PRESETS[GradientPresetKey]][]).map(([key, preset]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { setSettingsGradientPreset(key); setSettingsCoverImageUrl(null); }}
                            className={cn(
                              "relative w-20 h-12 rounded-xl overflow-hidden transition-all focus:outline-none",
                              settingsGradientPreset === key && !settingsCoverImageUrl
                                ? 'ring-2 ring-offset-2 ring-primary scale-105'
                                : 'opacity-80 hover:opacity-100 hover:scale-105'
                            )}
                            style={{ background: preset.css }}
                            title={preset.name}
                          >
                            <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-semibold text-white/90 drop-shadow leading-tight px-1">
                              {preset.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                        {/* Auto option */}
                        <button
                          type="button"
                          onClick={() => { setSettingsGradientPreset(null); setSettingsCoverImageUrl(null); }}
                          className={cn(
                            "relative w-20 h-12 rounded-xl overflow-hidden transition-all focus:outline-none border-2 border-dashed flex items-center justify-center",
                            !settingsGradientPreset && !settingsCoverImageUrl
                              ? 'border-primary ring-2 ring-offset-2 ring-primary scale-105 bg-primary/10'
                              : 'border-muted-foreground/30 hover:border-muted-foreground/60 hover:scale-105'
                          )}
                        >
                          <span className="text-[10px] font-medium text-muted-foreground">Auto</span>
                        </button>
                      </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div className="pt-4">
                      <p className="text-sm font-medium text-foreground mb-1">Imagem de Capa</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Dimensão ideal: <strong>1440 × 400 px</strong> (proporção 3.6:1, horizontal).
                        Mínimo recomendado: 900 × 250 px. Formatos: JPG, PNG ou WebP. Máx: 2 MB.
                      </p>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverUpload(file);
                          e.target.value = '';
                        }}
                      />
                      {settingsCoverImageUrl ? (
                        <div className="space-y-2">
                          <div className="relative w-full rounded-xl overflow-hidden border border-border" style={{ aspectRatio: '3.6 / 1' }}>
                            <img
                              src={settingsCoverImageUrl}
                              alt="Capa do espaço"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/55 to-black/75 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSettingsCoverImageUrl(null)}
                                className="text-white hover:text-white hover:bg-white/20 gap-1.5"
                              >
                                <X className="h-4 w-4" />
                                Remover imagem
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">Passe o mouse sobre a imagem para removê-la.</p>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 rounded-xl"
                          disabled={isUploadingCover}
                          onClick={() => coverInputRef.current?.click()}
                        >
                          {isUploadingCover ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                          {isUploadingCover ? 'Enviando...' : 'Upload de Imagem'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <div className={cn(
                  "rounded-[24px] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6",
                  espaco.status === 'arquivado'
                    ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30"
                    : "bg-destructive/5 border border-destructive/20"
                )}>
                  <div>
                    <h3 className={cn(
                      "text-lg font-bold mb-1",
                      espaco.status === 'arquivado'
                        ? "text-emerald-900 dark:text-emerald-400"
                        : "text-destructive"
                    )}>
                      {espaco.status === 'arquivado' ? 'Restaurar Espaço' : 'Arquivar Espaço'}
                    </h3>
                    <p className={cn(
                      "text-sm",
                      espaco.status === 'arquivado'
                        ? "text-emerald-700 dark:text-emerald-300/80"
                        : "text-destructive/80"
                    )}>
                      {espaco.status === 'arquivado'
                        ? 'Restaure o espaço para torná-lo visível para os alunos novamente.'
                        : 'O espaço não ficará mais visível para os alunos, mas os dados serão mantidos.'
                      }
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleArchive}
                    disabled={archiveMutation.isPending}
                    className={cn(
                      "rounded-xl gap-2 shrink-0",
                      espaco.status === 'arquivado'
                        ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        : "border-destructive/30 text-destructive hover:bg-destructive/5"
                    )}
                  >
                    {archiveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : espaco.status === 'arquivado' ? (
                      <RefreshCw className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    {espaco.status === 'arquivado' ? 'Restaurar Espaço' : 'Arquivar Espaço'}
                  </Button>
                </div>
              </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
