import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateFeedback } from '@/hooks/useFeedback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bug, Lightbulb, Loader2 } from 'lucide-react';
import type { FeedbackType, FeedbackPriority } from '@/types/feedback';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const location = useLocation();
  const { user } = useAuth();
  const createFeedback = useCreateFeedback();

  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [pageUrl, setPageUrl] = useState(location.pathname);

  const resetForm = () => {
    setType('bug');
    setTitle('');
    setDescription('');
    setPriority('medium');
    setPageUrl(location.pathname);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    await createFeedback.mutateAsync({
      type,
      title,
      description,
      page_url: pageUrl,
      user_role: user.role,
      priority,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setPageUrl(location.pathname);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enviar Feedback</DialogTitle>
            <DialogDescription>
              Relate um bug ou sugira uma melhoria para a plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo de Feedback */}
            <div className="space-y-2">
              <Label>Tipo de Feedback *</Label>
              <RadioGroup
                value={type}
                onValueChange={(value) => setType(value as FeedbackType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bug" id="type-bug" />
                  <Label htmlFor="type-bug" className="flex items-center gap-2 cursor-pointer">
                    <Bug className="h-4 w-4 text-destructive" />
                    Bug
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enhancement" id="type-enhancement" />
                  <Label htmlFor="type-enhancement" className="flex items-center gap-2 cursor-pointer">
                    <Lightbulb className="h-4 w-4 text-warning" />
                    Sugestão de Melhoria
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'bug' ? 'Ex: Erro ao baixar arquivo' : 'Ex: Adicionar filtro de busca'}
                maxLength={100}
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Descreva:\n• O que você tentou fazer\n• O que esperava acontecer\n• O que aconteceu de fato'
                    : 'Descreva sua sugestão em detalhes. Como você imagina que essa melhoria funcionaria?'
                }
                rows={5}
                required
              />
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as FeedbackPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Página/Rota */}
            <div className="space-y-2">
              <Label htmlFor="pageUrl">Página/Rota (preenchido automaticamente)</Label>
              <Input
                id="pageUrl"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="/dashboard"
              />
            </div>

            {/* Informações do Usuário (somente leitura) */}
            {user && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p><strong>Usuário:</strong> {user.full_name}</p>
                <p><strong>Tipo:</strong> {user.role === 'student' ? 'Aluno' : user.role === 'mentor' ? 'Mentor' : 'Admin'}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createFeedback.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createFeedback.isPending || !title || !description}>
              {createFeedback.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
