import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  category: z.enum(['immersion', 'group_mentoring', 'workshop', 'bootcamp', 'course']),
  visibility: z.enum(['public', 'private']),
  max_students: z.coerce.number().min(1).max(500),
  status: z.enum(['active', 'inactive', 'completed', 'arquivado']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const categoryLabels = {
  immersion: 'Imersão',
  group_mentoring: 'Mentoria em Grupo',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  course: 'Curso',
};

interface CreateEspacoFormProps {
  isMentor?: boolean;
  espacoId?: string;
}

export function CreateEspacoForm({ isMentor = false, espacoId }: CreateEspacoFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEspaco, setIsLoadingEspaco] = useState(!!espacoId);
  const isEditing = !!espacoId;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'immersion',
      visibility: 'private',
      max_students: 30,
      status: 'active',
      start_date: '',
      end_date: '',
    },
  });

  useEffect(() => {
    if (!espacoId) return;
    (async () => {
      const { data, error } = await supabase
        .from('espacos')
        .select('*')
        .eq('id', espacoId)
        .maybeSingle();
      if (error || !data) {
        toast.error('Espaço não encontrado');
        navigate(isMentor ? '/mentor/espacos' : '/admin/espacos');
        return;
      }
      form.reset({
        name: data.name || '',
        description: data.description || '',
        category: (data.category as FormData['category']) || 'immersion',
        visibility: (data.visibility as FormData['visibility']) || 'private',
        max_students: data.max_students ?? 30,
        status: (data.status as FormData['status']) || 'active',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
      });
      setIsLoadingEspaco(false);
    })();
  }, [espacoId]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('espacos')
          .update({
            name: data.name,
            description: data.description || null,
            category: data.category,
            visibility: data.visibility,
            max_students: data.max_students,
            status: data.status,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
          })
          .eq('id', espacoId);

        if (error) throw error;
        toast.success('Espaço atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('espacos')
          .insert({
            name: data.name,
            description: data.description || null,
            category: data.category,
            visibility: data.visibility,
            max_students: data.max_students,
            status: data.status,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            mentor_id: isMentor ? user.id : null,
          });

        if (error) throw error;
        toast.success('Espaço criado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['mentor-espacos'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-espaco'] });
      queryClient.invalidateQueries({ queryKey: ['admin-espacos'] });

      if (isMentor) {
        navigate(isEditing ? `/mentor/espacos/${espacoId}` : '/mentor/espacos');
      } else {
        navigate('/admin/espacos');
      }
    } catch (error) {
      toast.error(isEditing ? 'Erro ao atualizar espaço' : 'Erro ao criar espaço');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backPath = isMentor
    ? (isEditing ? `/mentor/espacos/${espacoId}` : '/mentor/espacos')
    : '/admin/espacos';

  if (isLoadingEspaco) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6 p-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? 'Editar Espaço' : 'Criar Espaço'}</h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Altere as informações do espaço' : 'Preencha as informações do novo espaço'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Informações do Espaço
            </CardTitle>
            <CardDescription>
              Defina os detalhes básicos do espaço
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Espaço *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Imersão EUA 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o objetivo e conteúdo deste espaço..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibilidade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="private">Privado</SelectItem>
                            <SelectItem value="public">Público</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="max_students"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de Alunos</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={500} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isEditing ? 'Status' : 'Status Inicial'}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            {isEditing && (
                              <>
                                <SelectItem value="completed">Concluído</SelectItem>
                                <SelectItem value="arquivado">Arquivado</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>Opcional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>Opcional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate(backPath)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Salvar Alterações' : 'Criar Espaço'}
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
