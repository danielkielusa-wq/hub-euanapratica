import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CATEGORY_LABELS, VISIBILITY_LABELS, type EspacoCategory, type EspacoVisibility } from '@/types/admin';
import { useMentors } from '@/hooks/useAdminEspacos';
import { Loader2 } from 'lucide-react';
import { CoverImageUpload } from './CoverImageUpload';

interface EspacoFormData {
  name: string;
  description?: string;
  category: EspacoCategory;
  visibility: EspacoVisibility;
  max_students: number;
  mentor_id?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  cover_image_url?: string;
}

interface EspacoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EspacoFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<EspacoFormData> & { id?: string };
  mode?: 'create' | 'edit';
}

export function EspacoForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  initialData,
  mode = 'create'
}: EspacoFormProps) {
  const { data: mentors } = useMentors();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EspacoFormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || 'immersion',
      visibility: initialData?.visibility || 'private',
      max_students: initialData?.max_students || 30,
      mentor_id: initialData?.mentor_id || '',
      start_date: initialData?.start_date || '',
      end_date: initialData?.end_date || '',
      status: initialData?.status || 'active',
      cover_image_url: initialData?.cover_image_url || '',
    }
  });

  const category = watch('category');
  const visibility = watch('visibility');
  const status = watch('status');
  const mentorId = watch('mentor_id');
  const coverImageUrl = watch('cover_image_url');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Espaço' : 'Editar Espaço'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Preencha os dados para criar um novo espaço.'
              : 'Atualize os dados do espaço.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Imagem de Capa</Label>
            <CoverImageUpload
              currentImage={coverImageUrl || undefined}
              onUpload={(url) => setValue('cover_image_url', url)}
              onRemove={() => setValue('cover_image_url', '')}
              espacoId={initialData?.id}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Espaço *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              placeholder="Ex: Imersão EUA 2025"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição detalhada da turma"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={(value) => setValue('category', value as EspacoCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <Select
                value={visibility}
                onValueChange={(value) => setValue('visibility', value as EspacoVisibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_students">Capacidade Máxima</Label>
              <Input
                id="max_students"
                type="number"
                min={1}
                {...register('max_students', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mentor Responsável</Label>
            <Select
              value={mentorId || ''}
              onValueChange={(value) => setValue('mentor_id', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um mentor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {mentors?.map((mentor: any) => (
                  <SelectItem key={mentor.id} value={mentor.id}>
                    {mentor.full_name} ({mentor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Criar Espaço' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
