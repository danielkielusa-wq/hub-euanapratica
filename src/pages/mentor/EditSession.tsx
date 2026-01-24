import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEspacos } from '@/hooks/useEspacos';
import { useSession, useUpdateSession, useDeleteSession } from '@/hooks/useSessions';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const sessionSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(100),
  description: z.string().max(500).optional(),
  date: z.date({ required_error: 'Selecione uma data' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  duration_minutes: z.number().min(15).max(240),
  espaco_id: z.string().uuid('Selecione um espaço'),
  meeting_link: z.string().url('URL inválida').optional().or(z.literal('')),
  recording_url: z.string().url('URL inválida').optional().or(z.literal('')),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']),
});

type SessionFormData = z.infer<typeof sessionSchema>;

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora e 30 minutos' },
  { value: 120, label: '2 horas' },
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendada' },
  { value: 'live', label: 'Ao Vivo' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
];

export default function EditSession() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading: sessionLoading } = useSession(id || '');
  const { data: espacos } = useEspacos();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: '',
      description: '',
      time: '10:00',
      duration_minutes: 60,
      status: 'scheduled',
      meeting_link: '',
      recording_url: '',
    },
  });

  useEffect(() => {
    if (session) {
      const sessionDate = new Date(session.datetime);
      form.reset({
        title: session.title,
        description: session.description || '',
        date: sessionDate,
        time: format(sessionDate, 'HH:mm'),
        duration_minutes: session.duration_minutes || 60,
        espaco_id: session.espaco_id,
        meeting_link: session.meeting_link || '',
        recording_url: session.recording_url || '',
        status: session.status || 'scheduled',
      });
    }
  }, [session, form]);

  const onSubmit = async (data: SessionFormData) => {
    if (!id) return;

    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const datetime = new Date(data.date);
      datetime.setHours(hours, minutes, 0, 0);

      await updateSession.mutateAsync({
        id,
        title: data.title,
        description: data.description || null,
        datetime: datetime.toISOString(),
        duration_minutes: data.duration_minutes,
        espaco_id: data.espaco_id,
        meeting_link: data.meeting_link || null,
        recording_url: data.recording_url || null,
        status: data.status,
      });

      toast({
        title: 'Sessão atualizada!',
        description: 'As alterações foram salvas com sucesso.',
      });

      navigate('/mentor/agenda');
    } catch (error) {
      toast({
        title: 'Erro ao atualizar sessão',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteSession.mutateAsync(id);

      toast({
        title: 'Sessão excluída',
        description: 'A sessão foi removida com sucesso.',
      });

      navigate('/mentor/agenda');
    } catch (error) {
      toast({
        title: 'Erro ao excluir sessão',
        description: 'Não foi possível excluir a sessão. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (sessionLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Sessão não encontrada</h2>
          <p className="text-muted-foreground mt-2">A sessão solicitada não existe.</p>
          <Button onClick={() => navigate('/mentor/agenda')} className="mt-4">
            Voltar para Agenda
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Editar Sessão</h1>
              <p className="text-muted-foreground">{session.title}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/mentor/sessao/${id}/presenca`)}
          >
            Ver Presença
          </Button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Espaco */}
                <FormField
                  control={form.control}
                  name="espaco_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espaço *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um espaço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {espacos?.map((espaco) => (
                            <SelectItem key={espaco.id} value={espaco.id}>
                              {espaco.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: ptBR })
                                ) : (
                                  <span>Selecione</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Duration */}
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração *</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DURATION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Meeting Link */}
                <FormField
                  control={form.control}
                  name="meeting_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link da Reunião</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Recording URL */}
                <FormField
                  control={form.control}
                  name="recording_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link da Gravação</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Adicione o link após a sessão ser concluída
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive">
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A sessão será permanentemente
                          removida.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="flex-1" />

                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateSession.isPending}>
                    {updateSession.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
