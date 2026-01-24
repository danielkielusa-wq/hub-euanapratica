import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEspacos } from '@/hooks/useEspacos';
import { useCreateSession } from '@/hooks/useSessions';
import { toast } from '@/hooks/use-toast';

const sessionSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(100),
  description: z.string().max(500).optional(),
  date: z.date({ required_error: 'Selecione uma data' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  duration_minutes: z.number().min(15).max(240),
  espaco_id: z.string().uuid('Selecione um espaço'),
  meeting_link: z.string().url('URL inválida').optional().or(z.literal('')),
  is_recurring: z.boolean().default(false),
  notify_students: z.boolean().default(true),
});

type SessionFormData = z.infer<typeof sessionSchema>;

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora e 30 minutos' },
  { value: 120, label: '2 horas' },
];

export default function CreateSession() {
  const navigate = useNavigate();
  const { data: espacos, isLoading: espacosLoading } = useEspacos();
  const createSession = useCreateSession();

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: '',
      description: '',
      time: '10:00',
      duration_minutes: 60,
      is_recurring: false,
      notify_students: true,
      meeting_link: '',
    },
  });

  const onSubmit = async (data: SessionFormData) => {
    try {
      const [hours, minutes] = data.time.split(':').map(Number);
      const datetime = new Date(data.date);
      datetime.setHours(hours, minutes, 0, 0);

      await createSession.mutateAsync({
        title: data.title,
        description: data.description || null,
        datetime: datetime.toISOString(),
        duration_minutes: data.duration_minutes,
        espaco_id: data.espaco_id,
        meeting_link: data.meeting_link || null,
        is_recurring: data.is_recurring,
        status: 'scheduled',
      });

      toast({
        title: 'Sessão criada!',
        description: 'A sessão foi agendada com sucesso.',
      });

      navigate('/mentor/agenda');
    } catch (error) {
      toast({
        title: 'Erro ao criar sessão',
        description: 'Não foi possível criar a sessão. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Sessão</h1>
            <p className="text-muted-foreground">Agende um novo encontro</p>
          </div>
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
                        <Input placeholder="Ex: Preparação para Entrevistas" {...field} />
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
                          placeholder="Descreva o conteúdo da sessão..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            Enviar notificação por e-mail sobre a nova sessão
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
                    className="flex-1"
                  >
                    {createSession.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Criar Sessão
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
