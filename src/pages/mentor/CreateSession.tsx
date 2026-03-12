import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ArrowLeft, Loader2, Users, Globe, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEspacos } from '@/hooks/useEspacos';
import { useCreateSession } from '@/hooks/useSessions';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import { getTimezoneLabel } from '@/lib/timezone';
import { toast } from '@/hooks/use-toast';

type EventType = 'espaco_session' | 'standalone';

const sessionSchema = z
  .object({
    title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(100),
    description: z.string().max(500).optional(),
    date: z.date({ required_error: 'Selecione uma data' }),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
    duration_minutes: z.number().min(15).max(240),
    espaco_id: z.string().optional(),
    meeting_link: z.string().url('URL inválida').optional().or(z.literal('')),
    is_recurring: z.boolean().default(false),
    notify_students: z.boolean().default(true),
    is_public: z.boolean().default(false),
    capacity: z.number().int().min(0).default(0),
    price: z.number().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    // espaco_id is required for espaco_session — enforced in onSubmit via eventType state
    // schema itself allows optional to avoid type errors; validation handled by eventType check
  });

type SessionFormData = z.infer<typeof sessionSchema>;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora e 30 minutos' },
  { value: 120, label: '2 horas' },
];

export default function CreateSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEspaco = searchParams.get('espaco') || undefined;
  const [eventType, setEventType] = useState<EventType>('espaco_session');
  const { data: espacos, isLoading: espacosLoading } = useEspacos();
  const createSession = useCreateSession();
  const userTimezone = useUserTimezone();

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: '',
      description: '',
      time: '10:00',
      duration_minutes: 60,
      espaco_id: preselectedEspaco,
      is_recurring: false,
      notify_students: true,
      meeting_link: '',
      is_public: false,
      capacity: 0,
      price: 0,
    },
  });

  const onSubmit = async (data: SessionFormData) => {
    // Validate espaco_id for espaco_session type
    if (eventType === 'espaco_session' && !data.espaco_id) {
      form.setError('espaco_id', { message: 'Selecione um espaço' });
      return;
    }

    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const datetime = new Date(data.date);
      datetime.setHours(hours, minutes, 0, 0);

      await createSession.mutateAsync({
        title: data.title,
        description: data.description || null,
        datetime: datetime.toISOString(),
        duration_minutes: data.duration_minutes,
        espaco_id:
          eventType === 'espaco_session' && data.espaco_id && data.espaco_id !== 'none'
            ? data.espaco_id
            : null,
        meeting_link: data.meeting_link || null,
        is_recurring: data.is_recurring,
        status: 'scheduled',
        is_public: eventType === 'standalone' ? data.is_public : false,
        capacity: eventType === 'standalone' ? data.capacity : null,
        price: eventType === 'standalone' ? data.price : 0,
      });

      toast({
        title: eventType === 'standalone' ? 'Evento criado!' : 'Sessão criada!',
        description:
          eventType === 'standalone'
            ? 'O evento foi criado com sucesso.'
            : 'A sessão foi agendada com sucesso.',
      });

      navigate(preselectedEspaco ? `/mentor/espacos/${preselectedEspaco}` : '/mentor/agenda');
    } catch {
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const isStandalone = eventType === 'standalone';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Novo Evento</h1>
            <p className="text-muted-foreground">Agende um encontro ou evento aberto</p>
          </div>
        </div>

        {/* Event Type Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setEventType('espaco_session')}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-colors',
              eventType === 'espaco_session'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className="flex items-center gap-2">
              <Users
                className={cn(
                  'h-5 w-5',
                  eventType === 'espaco_session' ? 'text-indigo-600' : 'text-gray-400'
                )}
              />
              <span
                className={cn(
                  'font-semibold text-sm',
                  eventType === 'espaco_session' ? 'text-indigo-700' : 'text-gray-700'
                )}
              >
                Sessão em Espaço
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vinculada a um Espaço — visível para os inscritos
            </p>
          </button>

          <button
            type="button"
            onClick={() => setEventType('standalone')}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-colors',
              eventType === 'standalone'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className="flex items-center gap-2">
              <Globe
                className={cn(
                  'h-5 w-5',
                  eventType === 'standalone' ? 'text-blue-600' : 'text-gray-400'
                )}
              />
              <span
                className={cn(
                  'font-semibold text-sm',
                  eventType === 'standalone' ? 'text-blue-700' : 'text-gray-700'
                )}
              >
                Evento Aberto
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Hotseat, masterclass, live — pode ser gratuito ou pago
            </p>
          </button>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isStandalone ? 'Detalhes do Evento' : 'Detalhes da Sessão'}
            </CardTitle>
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
                        <Input
                          placeholder={
                            isStandalone
                              ? 'Ex: Hotseat Gratuito — Revisão de Currículo'
                              : 'Ex: Preparação para Entrevistas'
                          }
                          {...field}
                        />
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
                        <Textarea
                          placeholder={
                            isStandalone
                              ? 'O que os participantes vão aprender ou experienciar...'
                              : 'Descreva o conteúdo da sessão...'
                          }
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Espaco (always shown, required only for espaco_session) */}
                <FormField
                  control={form.control}
                  name="espaco_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isStandalone ? 'Espaço (opcional)' : 'Espaço *'}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isStandalone
                                  ? 'Sem espaço vinculado'
                                  : 'Selecione um espaço'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isStandalone && (
                            <SelectItem value="none">Sem espaço vinculado</SelectItem>
                          )}
                          {espacos?.map((espaco) => (
                            <SelectItem key={espaco.id} value={espaco.id}>
                              {espaco.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isStandalone && (
                        <FormDescription>
                          Vincule a um Espaço para notificar os inscritos, ou deixe em branco para um evento aberto independente.
                        </FormDescription>
                      )}
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
                              disabled={(date) => date < new Date()}
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
                      <FormItem className="flex flex-col">
                        <FormLabel>Horario *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[280px]">
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Timezone Notice */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Fuso horário: <strong>{getTimezoneLabel(userTimezone)}</strong>.
                    Você pode alterar nas configurações do seu perfil.
                  </span>
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
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a duração" />
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
                        <Input
                          type="url"
                          placeholder="https://meet.google.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Link do Zoom, Google Meet ou outra plataforma
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Standalone-only fields */}
                {isStandalone && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-4">
                    <p className="text-sm font-medium text-blue-800">Configurações do Evento Aberto</p>

                    {/* is_public switch */}
                    <FormField
                      control={form.control}
                      name="is_public"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div>
                            <FormLabel>Visível para todos os alunos</FormLabel>
                            <FormDescription>
                              Aparece na agenda de qualquer aluno da plataforma
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* capacity + price */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacidade</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                placeholder="0 = ilimitada"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>0 = sem limite</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0,00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>0 = gratuito</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Checkboxes */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notify_students"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Notificar alunos</FormLabel>
                          <FormDescription>
                            Enviar notificação por e-mail sobre{' '}
                            {isStandalone ? 'o novo evento' : 'a nova sessão'}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createSession.isPending}
                    className={cn(
                      'flex-1',
                      isStandalone
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    )}
                  >
                    {createSession.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isStandalone ? 'Criar Evento' : 'Criar Sessão'}
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
