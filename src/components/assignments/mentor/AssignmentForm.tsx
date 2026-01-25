import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CalendarIcon, Loader2, Save, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEspacos } from '@/hooks/useEspacos';
import { useCreateAssignment, useUpdateAssignment } from '@/hooks/useAssignments';
import type { Assignment, SubmissionType, AssignmentStatus } from '@/types/assignments';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  espaco_id: z.string().min(1, 'Selecione uma turma'),
  due_date: z.date({ required_error: 'Prazo é obrigatório' }),
  due_time: z.string().default('12:00'),
  submission_type: z.enum(['file', 'text', 'both']),
  max_file_size: z.number().default(10485760),
  allowed_file_types: z.array(z.string()).default(['pdf', 'docx', 'xlsx', 'zip']),
  allow_late_submission: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface AssignmentFormProps {
  assignment?: Assignment;
  onSuccess?: () => void;
  defaultEspacoId?: string;
}

export function AssignmentForm({ assignment, onSuccess, defaultEspacoId }: AssignmentFormProps) {
  const { data: espacos, isLoading: espacosLoading } = useEspacos();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  
  const isEditing = !!assignment;

  // Parse existing due date if editing
  const existingDueDate = assignment?.due_date ? new Date(assignment.due_date) : undefined;
  // Default time to 12:00 PM (noon) instead of 23:59 for better UX
  const existingDueTime = existingDueDate 
    ? format(existingDueDate, 'HH:mm')
    : '12:00';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: assignment?.title || '',
      description: assignment?.description || '',
      instructions: assignment?.instructions || '',
      espaco_id: assignment?.espaco_id || defaultEspacoId || '',
      due_date: existingDueDate,
      due_time: existingDueTime,
      submission_type: assignment?.submission_type || 'both',
      max_file_size: assignment?.max_file_size || 10485760,
      allowed_file_types: assignment?.allowed_file_types || ['pdf', 'docx', 'xlsx', 'zip'],
      allow_late_submission: assignment?.allow_late_submission || false,
    },
  });

  const onSubmit = async (data: FormData, status: AssignmentStatus) => {
    // Combine date and time
    const [hours, minutes] = data.due_time.split(':').map(Number);
    const dueDate = new Date(data.due_date);
    dueDate.setHours(hours, minutes, 0, 0);

    const payload = {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      espaco_id: data.espaco_id,
      due_date: dueDate.toISOString(),
      submission_type: data.submission_type as SubmissionType,
      max_file_size: data.max_file_size,
      allowed_file_types: data.allowed_file_types,
      allow_late_submission: data.allow_late_submission,
      status,
    };

    if (isEditing) {
      await updateAssignment.mutateAsync({ id: assignment.id, ...payload });
    } else {
      await createAssignment.mutateAsync(payload);
    }

    onSuccess?.();
  };

  const isPending = createAssignment.isPending || updateAssignment.isPending;

  const fileSizeOptions = [
    { value: 5242880, label: '5 MB' },
    { value: 10485760, label: '10 MB' },
    { value: 26214400, label: '25 MB' },
    { value: 52428800, label: '50 MB' },
  ];

  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' },
    { value: 'xlsx', label: 'XLSX' },
    { value: 'zip', label: 'ZIP' },
  ];

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Trabalho Final - Módulo 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="espaco_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a tarefa em detalhes..."
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Suporta formatação markdown
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instruções de Entrega</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: O arquivo deve estar no formato PDF, com no máximo 10 páginas..."
                      className="min-h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Due date */}
        <Card>
          <CardHeader>
            <CardTitle>Prazo de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Data *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
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
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_time"
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allow_late_submission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Permitir entregas atrasadas</FormLabel>
                    <FormDescription>
                      Alunos poderão enviar após o prazo
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
          </CardContent>
        </Card>

        {/* Submission settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="submission_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de entrega aceita</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="file" id="file" />
                        <Label htmlFor="file">Apenas arquivo</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="text" />
                        <Label htmlFor="text">Apenas texto</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both">Arquivo ou texto</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(form.watch('submission_type') === 'file' || form.watch('submission_type') === 'both') && (
              <>
                <FormField
                  control={form.control}
                  name="max_file_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho máximo do arquivo</FormLabel>
                      <Select 
                        onValueChange={(v) => field.onChange(Number(v))} 
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fileSizeOptions.map((opt) => (
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

                <FormField
                  control={form.control}
                  name="allowed_file_types"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tipos de arquivo aceitos</FormLabel>
                      <div className="flex flex-wrap gap-4">
                        {fileTypeOptions.map((type) => (
                          <FormField
                            key={type.value}
                            control={form.control}
                            name="allowed_file_types"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(type.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, type.value]);
                                      } else {
                                        field.onChange(current.filter((v) => v !== type.value));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <Label className="text-sm font-normal">
                                  {type.label}
                                </Label>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit((data) => onSubmit(data, 'draft'))}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar como Rascunho
          </Button>
          
          <Button
            type="button"
            onClick={form.handleSubmit((data) => onSubmit(data, 'published'))}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Salvar e Publicar' : 'Publicar Tarefa'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
