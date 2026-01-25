import { useState, useEffect } from 'react';
import { useFeedbackDetail, useUpdateFeedback } from '@/hooks/useFeedback';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Bug, Lightbulb, Loader2, ExternalLink, Calendar, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { FeedbackStatus, FeedbackPriority } from '@/types/feedback';
import {
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUS_COLORS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_PRIORITY_COLORS,
} from '@/types/feedback';

interface FeedbackDetailDrawerProps {
  feedbackId: string | null;
  onClose: () => void;
}

const roleLabels: Record<string, string> = {
  student: 'Aluno',
  mentor: 'Mentor',
  admin: 'Admin',
};

export function FeedbackDetailDrawer({ feedbackId, onClose }: FeedbackDetailDrawerProps) {
  const { data: feedback, isLoading } = useFeedbackDetail(feedbackId || undefined);
  const updateFeedback = useUpdateFeedback();

  const [status, setStatus] = useState<FeedbackStatus>('new');
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [adminNotes, setAdminNotes] = useState('');

  // Atualizar estados quando os dados chegarem
  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setPriority(feedback.priority);
      setAdminNotes(feedback.admin_notes || '');
    }
  }, [feedback]);

  const handleSave = async () => {
    if (!feedbackId) return;

    await updateFeedback.mutateAsync({
      id: feedbackId,
      status,
      priority,
      admin_notes: adminNotes,
    });
  };

  const hasChanges = feedback && (
    status !== feedback.status ||
    priority !== feedback.priority ||
    adminNotes !== (feedback.admin_notes || '')
  );

  return (
    <Sheet open={!!feedbackId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : feedback ? (
          <>
            <SheetHeader className="space-y-4">
              {/* Tipo + Título */}
              <div className="flex items-start gap-3">
                {feedback.type === 'bug' ? (
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Bug className="h-5 w-5 text-destructive" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <SheetTitle className="text-left">{feedback.title}</SheetTitle>
                  <SheetDescription className="text-left">
                    {feedback.type === 'bug' ? 'Relatório de Bug' : 'Sugestão de Melhoria'}
                  </SheetDescription>
                </div>
              </div>

              {/* Badges atuais */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className={cn('text-xs', FEEDBACK_STATUS_COLORS[feedback.status])}>
                  {FEEDBACK_STATUS_LABELS[feedback.status]}
                </Badge>
                <Badge variant="secondary" className={cn('text-xs', FEEDBACK_PRIORITY_COLORS[feedback.priority])}>
                  {FEEDBACK_PRIORITY_LABELS[feedback.priority]}
                </Badge>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Informações do Reporter */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Reportado por
                </h4>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={feedback.profiles?.profile_photo_url || ''} />
                    <AvatarFallback>
                      {feedback.profiles?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{feedback.profiles?.full_name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">{feedback.profiles?.email}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {roleLabels[feedback.user_role] || feedback.user_role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Criado em: {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate" title={feedback.page_url}>{feedback.page_url}</span>
                </div>
              </div>

              <Separator />

              {/* Descrição */}
              <div>
                <Label className="text-sm font-medium">Descrição</Label>
                <div className="mt-2 p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                  {feedback.description}
                </div>
              </div>

              {/* Anexo (se houver) */}
              {feedback.attachment_url && (
                <div>
                  <Label className="text-sm font-medium">Anexo</Label>
                  <div className="mt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={feedback.attachment_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {feedback.attachment_name || 'Ver anexo'}
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Formulário de Edição Admin */}
              <div className="space-y-4">
                <h4 className="font-medium">Ações do Administrador</h4>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as FeedbackStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="in_review">Em Análise</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="considered_no_action">Considerado (Sem Ação)</SelectItem>
                      <SelectItem value="discarded">Desconsiderado</SelectItem>
                    </SelectContent>
                  </Select>
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

                {/* Notas Internas */}
                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Notas Internas</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Registre decisões, referências a issues, motivos de status..."
                    rows={4}
                  />
                </div>

                {/* Botão Salvar */}
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateFeedback.isPending}
                  className="w-full"
                >
                  {updateFeedback.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Feedback não encontrado.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
