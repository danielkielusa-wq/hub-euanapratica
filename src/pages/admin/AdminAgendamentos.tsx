import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CalendarCheck,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  Clock,
  Ban,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  UserCircle,
  Save,
} from 'lucide-react';
import {
  useAdminBookings,
  useAdminMentorServices,
  useAdminMentorAvailability,
  useAdminMentorBlockedTimes,
  useAdminBookingPolicy,
  useUpsertMentorService,
  useDeleteMentorService,
  useUpsertAvailability,
  useDeleteAvailability,
  useCreateBlockedTime,
  useDeleteBlockedTime,
  useUpdateBookingPolicy,
  useAdminCancelBooking,
  useAdminCompleteBooking,
  useAdminMarkNoShow,
  useMentors,
  type AdminBookingFilters,
  type MentorServiceExtended,
} from '@/hooks/useAdminBookings';
import { useHubServices } from '@/hooks/useHubServices';
import { BOOKING_STATUS_CONFIG, DAY_OF_WEEK_LABELS, type BookingStatus, type DayOfWeek, type BookingWithDetails } from '@/types/booking';

// ============================================
// MAIN PAGE
// ============================================

export default function AdminAgendamentos() {
  return (
    <DashboardLayout>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <CalendarCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Agendamentos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie agendamentos, disponibilidade de mentores e políticas
            </p>
          </div>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">Agendamentos</TabsTrigger>
            <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
            <TabsTrigger value="policies">Políticas</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityTab />
          </TabsContent>

          <TabsContent value="policies">
            <PoliciesTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ============================================
// BOOKINGS TAB
// ============================================

function BookingsTab() {
  const [filters, setFilters] = useState<AdminBookingFilters>({});
  const { data: bookings, isLoading } = useAdminBookings(filters);
  const { data: mentors } = useMentors();

  // Action state
  const [cancelBooking, setCancelBooking] = useState<BookingWithDetails | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [completeBooking, setCompleteBooking] = useState<BookingWithDetails | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [noShowBooking, setNoShowBooking] = useState<BookingWithDetails | null>(null);

  const cancelMutation = useAdminCancelBooking();
  const completeMutation = useAdminCompleteBooking();
  const noShowMutation = useAdminMarkNoShow();

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) => setFilters(f => ({ ...f, status: v as BookingStatus | 'all' }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="no_show">No-show</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.mentor_id || 'all'}
              onValueChange={(v) => setFilters(f => ({ ...f, mentor_id: v === 'all' ? undefined : v }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Mentor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os mentores</SelectItem>
                {mentors?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!bookings || bookings.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum agendamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map(booking => {
                  const statusConf = BOOKING_STATUS_CONFIG[booking.status];
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.student?.full_name || '—'}
                      </TableCell>
                      <TableCell>{booking.service?.name || '—'}</TableCell>
                      <TableCell>{booking.mentor?.full_name || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(booking.scheduled_start)}
                      </TableCell>
                      <TableCell>{booking.duration_minutes}min</TableCell>
                      <TableCell>
                        <Badge className={`${statusConf.bgColor} ${statusConf.color} ${statusConf.borderColor} border`}>
                          {statusConf.labelPt}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.status === 'confirmed' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setCompleteBooking(booking); setCompleteNotes(''); }}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Marcar Concluída
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setCancelBooking(booking); setCancelReason(''); }}>
                                <Ban className="mr-2 h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setNoShowBooking(booking)}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Marcar No-show
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Complete Dialog */}
      <Dialog open={!!completeBooking} onOpenChange={(open) => !open && setCompleteBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Sessão</DialogTitle>
            <DialogDescription>
              Marcar a sessão com {completeBooking?.student?.full_name} como concluída.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notas da sessão (opcional)</Label>
              <Textarea
                value={completeNotes}
                onChange={e => setCompleteNotes(e.target.value)}
                placeholder="Observações sobre a sessão..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteBooking(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!completeBooking) return;
                completeMutation.mutate(
                  { booking_id: completeBooking.id, mentor_notes: completeNotes || undefined },
                  { onSuccess: () => setCompleteBooking(null) }
                );
              }}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel AlertDialog */}
      <AlertDialog open={!!cancelBooking} onOpenChange={(open) => !open && setCancelBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelar a sessão de {cancelBooking?.student?.full_name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo do cancelamento..."
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!cancelBooking) return;
                cancelMutation.mutate(
                  { booking_id: cancelBooking.id, reason: cancelReason || undefined },
                  { onSuccess: () => setCancelBooking(null) }
                );
              }}
            >
              Cancelar Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No-show AlertDialog */}
      <AlertDialog open={!!noShowBooking} onOpenChange={(open) => !open && setNoShowBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar como No-show</AlertDialogTitle>
            <AlertDialogDescription>
              Marcar {noShowBooking?.student?.full_name} como não compareceu? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!noShowBooking) return;
                noShowMutation.mutate(
                  { booking_id: noShowBooking.id },
                  { onSuccess: () => setNoShowBooking(null) }
                );
              }}
            >
              Confirmar No-show
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// AVAILABILITY TAB
// ============================================

function AvailabilityTab() {
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const { data: mentors, isLoading: loadingMentors } = useMentors();
  const { data: mentorServices, isLoading: loadingMS } = useAdminMentorServices();
  const { data: availability } = useAdminMentorAvailability(selectedMentorId || undefined);
  const { data: blockedTimes } = useAdminMentorBlockedTimes(selectedMentorId || undefined);
  const { data: hubServices } = useHubServices();

  // Dialogs
  const [msDialogOpen, setMsDialogOpen] = useState(false);
  const [editingMs, setEditingMs] = useState<MentorServiceExtended | null>(null);
  const [availDialogOpen, setAvailDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteMs, setDeleteMs] = useState<string | null>(null);

  // Form state
  const [msForm, setMsForm] = useState({
    mentor_id: '', service_id: '', slot_duration_minutes: '60',
    buffer_minutes: '15', default_meeting_link: '',
  });
  const [availForm, setAvailForm] = useState({
    day_of_week: 'monday' as DayOfWeek, start_time: '09:00', end_time: '17:00',
  });
  const [blockForm, setBlockForm] = useState({
    start_datetime: '', end_datetime: '', reason: '',
  });

  const upsertMs = useUpsertMentorService();
  const deleteMsMutation = useDeleteMentorService();
  const upsertAvail = useUpsertAvailability();
  const deleteAvail = useDeleteAvailability();
  const createBlock = useCreateBlockedTime();
  const deleteBlock = useDeleteBlockedTime();

  const liveMentoringServices = hubServices?.filter(s => s.service_type === 'live_mentoring') ?? [];

  const openMsDialog = (ms?: MentorServiceExtended) => {
    if (ms) {
      setEditingMs(ms);
      setMsForm({
        mentor_id: ms.mentor_id,
        service_id: ms.service_id,
        slot_duration_minutes: String(ms.slot_duration_minutes),
        buffer_minutes: String(ms.buffer_minutes),
        default_meeting_link: ms.default_meeting_link || '',
      });
    } else {
      setEditingMs(null);
      setMsForm({
        mentor_id: selectedMentorId || '', service_id: '',
        slot_duration_minutes: '60', buffer_minutes: '15', default_meeting_link: '',
      });
    }
    setMsDialogOpen(true);
  };

  const handleSaveMs = () => {
    upsertMs.mutate({
      id: editingMs?.id,
      mentor_id: msForm.mentor_id,
      service_id: msForm.service_id,
      slot_duration_minutes: parseInt(msForm.slot_duration_minutes) || 60,
      buffer_minutes: parseInt(msForm.buffer_minutes) || 15,
      default_meeting_link: msForm.default_meeting_link || undefined,
    }, {
      onSuccess: () => setMsDialogOpen(false),
    });
  };

  const handleSaveAvail = () => {
    if (!selectedMentorId) return;
    upsertAvail.mutate({
      mentor_id: selectedMentorId,
      day_of_week: availForm.day_of_week,
      start_time: availForm.start_time,
      end_time: availForm.end_time,
    }, {
      onSuccess: () => setAvailDialogOpen(false),
    });
  };

  const handleSaveBlock = () => {
    if (!selectedMentorId || !blockForm.start_datetime || !blockForm.end_datetime) return;
    createBlock.mutate({
      mentor_id: selectedMentorId,
      start_datetime: new Date(blockForm.start_datetime).toISOString(),
      end_datetime: new Date(blockForm.end_datetime).toISOString(),
      reason: blockForm.reason || undefined,
    }, {
      onSuccess: () => {
        setBlockDialogOpen(false);
        setBlockForm({ start_datetime: '', end_datetime: '', reason: '' });
      },
    });
  };

  const filteredMentorServices = selectedMentorId
    ? mentorServices?.filter(ms => ms.mentor_id === selectedMentorId)
    : mentorServices;

  const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="space-y-6">
      {/* Mentor Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="font-medium">Mentor:</Label>
            <Select value={selectedMentorId || 'all'} onValueChange={v => setSelectedMentorId(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione um mentor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os mentores</SelectItem>
                {mentors?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mentor ↔ Service Assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mentores e Serviços</CardTitle>
              <CardDescription>Atribua mentores a serviços de mentoria ao vivo</CardDescription>
            </div>
            <Button onClick={() => openMsDialog()} className="gap-2">
              <Plus className="h-4 w-4" /> Atribuir Mentor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMS ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filteredMentorServices?.length ? (
            <p className="text-center py-8 text-muted-foreground">Nenhuma atribuição encontrada</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredMentorServices.map(ms => (
                <div key={ms.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{ms.mentor?.full_name || 'Mentor'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ms.service?.name || 'Serviço'}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span><Clock className="inline h-3 w-3 mr-1" />{ms.slot_duration_minutes}min</span>
                      {ms.default_meeting_link && (
                        <span><LinkIcon className="inline h-3 w-3 mr-1" />Link configurado</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={ms.is_active ? 'default' : 'secondary'}>
                      {ms.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openMsDialog(ms)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteMs(ms.id)}
                        >
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Availability */}
      {selectedMentorId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Disponibilidade Semanal</CardTitle>
                <CardDescription>Horários recorrentes do mentor</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setAvailForm({ day_of_week: 'monday', start_time: '09:00', end_time: '17:00' });
                  setAvailDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Adicionar Horário
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!availability?.length ? (
              <p className="text-center py-6 text-muted-foreground">
                Nenhum horário configurado. Adicione os horários disponíveis do mentor.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...availability]
                    .sort((a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week))
                    .map(slot => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">
                        {DAY_OF_WEEK_LABELS[slot.day_of_week].full}
                      </TableCell>
                      <TableCell>{slot.start_time.slice(0, 5)}</TableCell>
                      <TableCell>{slot.end_time.slice(0, 5)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={slot.is_active}
                          onCheckedChange={(checked) => {
                            upsertAvail.mutate({
                              id: slot.id,
                              mentor_id: selectedMentorId,
                              day_of_week: slot.day_of_week,
                              start_time: slot.start_time,
                              end_time: slot.end_time,
                              is_active: checked,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteAvail.mutate({ id: slot.id, mentor_id: selectedMentorId })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Blocked Times */}
      {selectedMentorId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Bloqueios de Agenda</CardTitle>
                <CardDescription>Períodos em que o mentor não atende (férias, feriados, etc.)</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setBlockForm({ start_datetime: '', end_datetime: '', reason: '' });
                  setBlockDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Adicionar Bloqueio
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!blockedTimes?.length ? (
              <p className="text-center py-6 text-muted-foreground">Nenhum bloqueio futuro</p>
            ) : (
              <div className="space-y-2">
                {blockedTimes.map(bt => (
                  <div key={bt.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(bt.start_datetime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {new Date(bt.end_datetime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {bt.reason && <p className="text-xs text-muted-foreground">{bt.reason}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteBlock.mutate({ id: bt.id, mentor_id: selectedMentorId })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mentor Service Dialog */}
      <Dialog open={msDialogOpen} onOpenChange={setMsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMs ? 'Editar Atribuição' : 'Atribuir Mentor a Serviço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mentor</Label>
              <Select value={msForm.mentor_id} onValueChange={v => setMsForm(f => ({ ...f, mentor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o mentor" /></SelectTrigger>
                <SelectContent>
                  {mentors?.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Serviço (Mentoria ao Vivo)</Label>
              <Select value={msForm.service_id} onValueChange={v => setMsForm(f => ({ ...f, service_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                <SelectContent>
                  {liveMentoringServices.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  value={msForm.slot_duration_minutes}
                  onChange={e => setMsForm(f => ({ ...f, slot_duration_minutes: e.target.value }))}
                />
              </div>
              <div>
                <Label>Buffer entre sessões (min)</Label>
                <Input
                  type="number"
                  value={msForm.buffer_minutes}
                  onChange={e => setMsForm(f => ({ ...f, buffer_minutes: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Link da reunião padrão</Label>
              <Input
                value={msForm.default_meeting_link}
                onChange={e => setMsForm(f => ({ ...f, default_meeting_link: e.target.value }))}
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMs} disabled={upsertMs.isPending || !msForm.mentor_id || !msForm.service_id}>
              {upsertMs.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={availDialogOpen} onOpenChange={setAvailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Horário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dia da semana</Label>
              <Select
                value={availForm.day_of_week}
                onValueChange={v => setAvailForm(f => ({ ...f, day_of_week: v as DayOfWeek }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dayOrder.map(d => (
                    <SelectItem key={d} value={d}>{DAY_OF_WEEK_LABELS[d].full}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início</Label>
                <Input
                  type="time"
                  value={availForm.start_time}
                  onChange={e => setAvailForm(f => ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={availForm.end_time}
                  onChange={e => setAvailForm(f => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAvail} disabled={upsertAvail.isPending}>
              {upsertAvail.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blocked Time Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Bloqueio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Início</Label>
              <Input
                type="datetime-local"
                value={blockForm.start_datetime}
                onChange={e => setBlockForm(f => ({ ...f, start_datetime: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fim</Label>
              <Input
                type="datetime-local"
                value={blockForm.end_datetime}
                onChange={e => setBlockForm(f => ({ ...f, end_datetime: e.target.value }))}
              />
            </div>
            <div>
              <Label>Motivo (opcional)</Label>
              <Input
                value={blockForm.reason}
                onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Ex: Férias, feriado..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveBlock}
              disabled={createBlock.isPending || !blockForm.start_datetime || !blockForm.end_datetime}
            >
              {createBlock.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Mentor Service AlertDialog */}
      <AlertDialog open={!!deleteMs} onOpenChange={(open) => !open && setDeleteMs(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Atribuição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta atribuição de mentor? Os agendamentos existentes não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteMs) {
                  deleteMsMutation.mutate(deleteMs, { onSuccess: () => setDeleteMs(null) });
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// POLICIES TAB
// ============================================

function PoliciesTab() {
  const { data: policy, isLoading } = useAdminBookingPolicy();
  const updatePolicy = useUpdateBookingPolicy();

  const [form, setForm] = useState({
    max_concurrent_bookings: 3,
    max_reschedules_per_booking: 2,
    min_notice_hours: 48,
    max_advance_days: 30,
    cancellation_window_hours: 24,
    default_duration_minutes: 60,
    slot_interval_minutes: 30,
  });
  const [initialized, setInitialized] = useState(false);

  if (policy && !initialized) {
    setForm({
      max_concurrent_bookings: policy.max_concurrent_bookings,
      max_reschedules_per_booking: policy.max_reschedules_per_booking,
      min_notice_hours: policy.min_notice_hours,
      max_advance_days: policy.max_advance_days,
      cancellation_window_hours: policy.cancellation_window_hours,
      default_duration_minutes: policy.default_duration_minutes,
      slot_interval_minutes: policy.slot_interval_minutes,
    });
    setInitialized(true);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = () => {
    if (!policy) return;
    updatePolicy.mutate({ id: policy.id, ...form });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Política Global de Agendamento</CardTitle>
        <CardDescription>
          Regras aplicadas a todos os serviços que não possuem política própria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label>Máximo de agendamentos simultâneos</Label>
            <Input
              type="number"
              min={1}
              value={form.max_concurrent_bookings}
              onChange={e => setForm(f => ({ ...f, max_concurrent_bookings: parseInt(e.target.value) || 1 }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quantos bookings confirmados um aluno pode ter ao mesmo tempo
            </p>
          </div>
          <div>
            <Label>Máximo de reagendamentos por booking</Label>
            <Input
              type="number"
              min={0}
              value={form.max_reschedules_per_booking}
              onChange={e => setForm(f => ({ ...f, max_reschedules_per_booking: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <Label>Antecedência mínima (horas)</Label>
            <Input
              type="number"
              min={1}
              value={form.min_notice_hours}
              onChange={e => setForm(f => ({ ...f, min_notice_hours: parseInt(e.target.value) || 1 }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo de horas antes da sessão para permitir agendamento
            </p>
          </div>
          <div>
            <Label>Antecedência máxima (dias)</Label>
            <Input
              type="number"
              min={1}
              value={form.max_advance_days}
              onChange={e => setForm(f => ({ ...f, max_advance_days: parseInt(e.target.value) || 1 }))}
            />
          </div>
          <div>
            <Label>Janela de cancelamento (horas)</Label>
            <Input
              type="number"
              min={1}
              value={form.cancellation_window_hours}
              onChange={e => setForm(f => ({ ...f, cancellation_window_hours: parseInt(e.target.value) || 1 }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cancelamentos dentro desta janela são marcados como no-show
            </p>
          </div>
          <div>
            <Label>Duração padrão (minutos)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={form.default_duration_minutes}
              onChange={e => setForm(f => ({ ...f, default_duration_minutes: parseInt(e.target.value) || 60 }))}
            />
          </div>
          <div>
            <Label>Intervalo de slots (minutos)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={form.slot_interval_minutes}
              onChange={e => setForm(f => ({ ...f, slot_interval_minutes: parseInt(e.target.value) || 30 }))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Intervalo entre início de slots (ex: 30 = slots a cada 30min)
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} disabled={updatePolicy.isPending} className="gap-2">
            {updatePolicy.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Política
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
