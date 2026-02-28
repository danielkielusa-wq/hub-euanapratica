import { useState } from 'react';
import { formatDateTimeBr, localInputToUTC, getTimezoneLabel, getTimezoneAbbr } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  Loader2,
  Plus,
  Trash2,
  Save,
  LinkIcon,
} from 'lucide-react';
import {
  useMyMentorServices,
  useMyAvailability,
  useMyBlockedTimes,
  useUpsertMyAvailability,
  useDeleteMyAvailability,
  useCreateMyBlockedTime,
  useDeleteMyBlockedTime,
  useUpdateMyMeetingLink,
} from '@/hooks/useMentorAvailability';
import { DAY_OF_WEEK_LABELS, type DayOfWeek } from '@/types/booking';

const dayOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function MentorDisponibilidade() {
  const tz = useUserTimezone();
  const { data: mentorServices, isLoading: loadingMS } = useMyMentorServices();
  const { data: availability, isLoading: loadingAvail } = useMyAvailability();
  const { data: blockedTimes } = useMyBlockedTimes();

  const [availDialogOpen, setAvailDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [availForm, setAvailForm] = useState({
    day_of_week: 'monday' as DayOfWeek,
    start_time: '09:00',
    end_time: '17:00',
  });
  const [blockForm, setBlockForm] = useState({
    start_datetime: '',
    end_datetime: '',
    reason: '',
  });
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({});

  const upsertAvail = useUpsertMyAvailability();
  const deleteAvail = useDeleteMyAvailability();
  const createBlock = useCreateMyBlockedTime();
  const deleteBlock = useDeleteMyBlockedTime();
  const updateLink = useUpdateMyMeetingLink();

  const isLoading = loadingMS || loadingAvail;

  if (isLoading) {
    return (
      <DashboardLayout>

        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minha Disponibilidade</h1>
            <p className="text-sm text-muted-foreground">
              Configure seus horários e bloqueios de agenda
            </p>
          </div>
        </div>

        {/* Meeting Links */}
        {mentorServices && mentorServices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Link da Reunião
              </CardTitle>
              <CardDescription>
                Link padrão que será enviado automaticamente nos emails de confirmação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mentorServices.map(ms => (
                <div key={ms.id} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">{ms.service?.name || 'Serviço'}</Label>
                    <Input
                      value={meetingLinks[ms.id] ?? ms.default_meeting_link ?? ''}
                      onChange={e => setMeetingLinks(prev => ({ ...prev, [ms.id]: e.target.value }))}
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = meetingLinks[ms.id] ?? ms.default_meeting_link ?? '';
                      updateLink.mutate({ id: ms.id, default_meeting_link: link });
                    }}
                    disabled={updateLink.isPending}
                  >
                    {updateLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Weekly Availability */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Horários Semanais</CardTitle>
                <CardDescription>Seus horários recorrentes de atendimento</CardDescription>
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
                Nenhum horário configurado. Adicione seus horários disponíveis.
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
                          onClick={() => deleteAvail.mutate(slot.id)}
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

        {/* Blocked Times */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Bloqueios de Agenda</CardTitle>
                <CardDescription>Períodos em que você não pode atender</CardDescription>
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
                        {formatDateTimeBr(bt.start_datetime, tz)}
                        {' — '}
                        {formatDateTimeBr(bt.end_datetime, tz)}
                        {' ('}{getTimezoneAbbr(tz)}{')'}
                      </p>
                      {bt.reason && <p className="text-xs text-muted-foreground">{bt.reason}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteBlock.mutate(bt.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
              <Button
                onClick={() => {
                  upsertAvail.mutate(availForm, {
                    onSuccess: () => setAvailDialogOpen(false),
                  });
                }}
                disabled={upsertAvail.isPending}
              >
                {upsertAvail.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Block Dialog */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Bloqueio</DialogTitle>
              <p className="text-sm text-muted-foreground">Horários interpretados no fuso: {getTimezoneLabel(tz)}</p>
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
                onClick={() => {
                  if (!blockForm.start_datetime || !blockForm.end_datetime) return;
                  createBlock.mutate({
                    start_datetime: localInputToUTC(blockForm.start_datetime, tz),
                    end_datetime: localInputToUTC(blockForm.end_datetime, tz),
                    reason: blockForm.reason || undefined,
                  }, {
                    onSuccess: () => {
                      setBlockDialogOpen(false);
                      setBlockForm({ start_datetime: '', end_datetime: '', reason: '' });
                    },
                  });
                }}
                disabled={createBlock.isPending || !blockForm.start_datetime || !blockForm.end_datetime}
              >
                {createBlock.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
