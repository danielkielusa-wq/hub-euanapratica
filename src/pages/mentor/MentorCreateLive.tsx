import { useEffect } from 'react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ArrowLeft, Loader2, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateLive, useUpdateLive, useMentorLiveById } from '@/hooks/useMentorLives';
import type { LiveAccessType, LiveStatus } from '@/types/live';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const liveSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(120),
  slug: z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  description: z.string().max(300).optional(),
  long_description: z.string().max(5000).optional(),
  date: z.date({ required_error: 'Selecione uma data' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  duration_minutes: z.number().min(15).max(480),
  meeting_link: z.string().url('URL inválida').optional().or(z.literal('')),
  access_type: z.enum(['free', 'paid', 'subscribers', 'pro', 'vip']),
  price: z.number().min(0).optional(),
  ticto_product_id: z.string().optional(),
  ticto_checkout_url: z.string().url('URL inválida').optional().or(z.literal('')),
  max_attendees: z.number().int().min(0).optional(),
  thumbnail_url: z.string().url('URL inválida').optional().or(z.literal('')),
  og_image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  status: z.enum(['draft', 'scheduled']),
});

type LiveFormValues = z.infer<typeof liveSchema>;

export default function MentorCreateLive() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: existingLive, isLoading: loadingLive } = useMentorLiveById(id);
  const createLive = useCreateLive();
  const updateLive = useUpdateLive();

  const form = useForm<LiveFormValues>({
    resolver: zodResolver(liveSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      long_description: '',
      date: undefined,
      time: '19:00',
      duration_minutes: 60,
      meeting_link: '',
      access_type: 'free',
      price: 0,
      ticto_product_id: '',
      ticto_checkout_url: '',
      max_attendees: 0,
      thumbnail_url: '',
      og_image_url: '',
      status: 'scheduled',
    },
  });

  const accessType = form.watch('access_type');
  const title = form.watch('title');

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      const currentSlug = form.getValues('slug');
      const generatedSlug = slugify(title);
      if (!currentSlug || currentSlug === slugify(form.getValues('title').slice(0, -1))) {
        form.setValue('slug', generatedSlug);
      }
    }
  }, [title, isEditing, form]);

  // Load existing live data for editing
  useEffect(() => {
    if (existingLive && isEditing) {
      const dt = new Date(existingLive.scheduled_at);
      form.reset({
        title: existingLive.title,
        slug: existingLive.slug,
        description: existingLive.description || '',
        long_description: existingLive.long_description || '',
        date: dt,
        time: format(dt, 'HH:mm'),
        duration_minutes: existingLive.duration_minutes,
        meeting_link: existingLive.meeting_link || '',
        access_type: existingLive.access_type as LiveAccessType,
        price: existingLive.price || 0,
        ticto_product_id: existingLive.ticto_product_id || '',
        ticto_checkout_url: existingLive.ticto_checkout_url || '',
        max_attendees: existingLive.max_attendees || 0,
        thumbnail_url: existingLive.thumbnail_url || '',
        og_image_url: existingLive.og_image_url || '',
        status: existingLive.status === 'draft' ? 'draft' : 'scheduled',
      });
    }
  }, [existingLive, isEditing, form]);

  const onSubmit = (values: LiveFormValues) => {
    const [hours, minutes] = values.time.split(':').map(Number);
    const scheduledAt = new Date(values.date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const payload = {
      title: values.title,
      slug: values.slug,
      description: values.description || undefined,
      long_description: values.long_description || undefined,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: values.duration_minutes,
      meeting_link: values.meeting_link || undefined,
      access_type: values.access_type as LiveAccessType,
      price: values.access_type === 'paid' ? (values.price || 0) : 0,
      ticto_product_id: values.access_type === 'paid' ? (values.ticto_product_id || undefined) : undefined,
      ticto_checkout_url: values.access_type === 'paid' ? (values.ticto_checkout_url || undefined) : undefined,
      max_attendees: values.max_attendees && values.max_attendees > 0 ? values.max_attendees : null,
      thumbnail_url: values.thumbnail_url || undefined,
      og_image_url: values.og_image_url || undefined,
      status: values.status as LiveStatus,
    };

    if (isEditing) {
      updateLive.mutate({ id, ...payload }, {
        onSuccess: () => navigate('/mentor/lives'),
      });
    } else {
      createLive.mutate(payload, {
        onSuccess: () => navigate('/mentor/lives'),
      });
    }
  };

  if (isEditing && loadingLive) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/mentor/lives')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold">{isEditing ? 'Editar Live' : 'Criar Live'}</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic info */}
            <Card>
              <CardHeader><CardTitle className="text-base">Informações Básicas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input placeholder="Ex: Como Conseguir Emprego nos EUA" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL)</FormLabel>
                    <FormControl><Input placeholder="como-conseguir-emprego-nos-eua" {...field} /></FormControl>
                    <FormDescription>URL: /live/{field.value || '...'}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição curta</FormLabel>
                    <FormControl><Textarea placeholder="Resumo para cards e previews" className="min-h-[80px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="long_description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição completa (landing page)</FormLabel>
                    <FormControl><Textarea placeholder="Detalhes completos que aparecerão na landing page..." className="min-h-[150px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader><CardTitle className="text-base">Agendamento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                              {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
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
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="duration_minutes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (minutos)</FormLabel>
                      <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                          <SelectItem value="90">90 min</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                          <SelectItem value="180">3 horas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="meeting_link" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link da Reunião</FormLabel>
                      <FormControl><Input placeholder="https://zoom.us/j/..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Access */}
            <Card>
              <CardHeader><CardTitle className="text-base">Acesso e Monetização</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="access_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Acesso</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Gratuita - Qualquer usuário logado</SelectItem>
                        <SelectItem value="paid" disabled>Paga - Em breve (integração Ticto)</SelectItem>
                        <SelectItem value="subscribers">Assinantes - Qualquer plano ativo</SelectItem>
                        <SelectItem value="pro">Pro / VIP - Plano Pro ou superior</SelectItem>
                        <SelectItem value="vip">Apenas VIP - Plano VIP exclusivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {accessType === 'paid' && (
                  <>
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="ticto_product_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticto Product ID</FormLabel>
                        <FormControl><Input placeholder="ID do produto no Ticto" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="ticto_checkout_url" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticto Checkout URL</FormLabel>
                        <FormControl><Input placeholder="https://pay.ticto.com.br/..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                <FormField control={form.control} name="max_attendees" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Vagas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0 = ilimitado"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Deixe 0 para vagas ilimitadas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader><CardTitle className="text-base">Imagens (opcional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="thumbnail_url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormDescription>Imagem exibida nos cards (recomendado: 16:9)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="og_image_url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>OG Image URL</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormDescription>Imagem para compartilhamento em redes sociais</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Status + Submit */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Salvar como Rascunho</SelectItem>
                          <SelectItem value="scheduled">Publicar Agendada</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  <Button
                    type="submit"
                    disabled={createLive.isPending || updateLive.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {(createLive.isPending || updateLive.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {isEditing ? 'Salvar Alterações' : 'Criar Live'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
