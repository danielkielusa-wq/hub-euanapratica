import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Plus, Radio, Calendar, Users, ExternalLink, MoreVertical, Pencil, Trash2, Copy, XCircle, CalendarClock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useMentorLives, useDeleteLive, useUpdateLive } from '@/hooks/useMentorLives';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ACCESS_TYPE_LABELS, ACCESS_TYPE_COLORS, STATUS_LABELS, STATUS_COLORS } from '@/types/live';
import type { Live, LiveStatus } from '@/types/live';

export default function MentorLives() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: lives, isLoading } = useMentorLives();
  const deleteLive = useDeleteLive();
  const updateLive = useUpdateLive();
  const [cancelTarget, setCancelTarget] = useState<Live | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const filteredLives = (lives || []).filter(live => {
    const matchesSearch = live.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || live.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopyUrl = (slug: string) => {
    const url = `${window.location.origin}/live/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'URL copiada!' });
  };

  const handleStatusChange = (live: Live, newStatus: LiveStatus) => {
    updateLive.mutate({ id: live.id, status: newStatus });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Lives</h1>
            <p className="text-muted-foreground">
              Crie e gerencie suas lives e eventos ao vivo
            </p>
          </div>
          <Button variant="gradient" onClick={() => navigate('/mentor/lives/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Live
          </Button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="scheduled">Agendada</SelectItem>
              <SelectItem value="live">Ao Vivo</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLives.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search || statusFilter !== 'all' ? 'Nenhuma live encontrada' : 'Nenhuma live criada'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search || statusFilter !== 'all'
                ? 'Tente ajustar seus filtros.'
                : 'Crie sua primeira live para atrair estudantes e leads.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button onClick={() => navigate('/mentor/lives/nova')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Live
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLives.map((live) => {
              const dt = parseISO(live.scheduled_at);
              return (
                <div
                  key={live.id}
                  className={cn(
                    'bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4',
                    'hover:shadow-md transition-shadow',
                    live.status === 'live' && 'ring-2 ring-red-400'
                  )}
                >
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="font-bold text-gray-900 text-sm truncate cursor-pointer hover:text-indigo-600"
                        onClick={() => navigate(`/mentor/lives/${live.id}`)}
                      >
                        {live.title}
                      </h3>
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap',
                        STATUS_COLORS[live.status]
                      )}>
                        {STATUS_LABELS[live.status]}
                      </span>
                      <span className={cn(
                        'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border whitespace-nowrap',
                        ACCESS_TYPE_COLORS[live.access_type]
                      )}>
                        {ACCESS_TYPE_LABELS[live.access_type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(dt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {live.max_attendees ? `${live.max_attendees} vagas` : 'Ilimitado'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {live.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleStatusChange(live, 'live')}
                      >
                        <Radio className="h-3 w-3 mr-1" />
                        Go Live
                      </Button>
                    )}
                    {live.status === 'live' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleStatusChange(live, 'completed')}
                      >
                        Encerrar
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/mentor/lives/${live.id}`)}>
                          <Users className="h-4 w-4 mr-2" />
                          Ver Inscritos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/mentor/lives/${live.id}/editar`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyUrl(live.slug)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/live/${live.slug}`, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Landing Page
                        </DropdownMenuItem>
                        {live.status === 'expired' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => navigate(`/mentor/lives/${live.id}/editar`)}
                            >
                              <CalendarClock className="h-4 w-4 mr-2" />
                              Reagendar
                            </DropdownMenuItem>
                          </>
                        )}
                        {!['completed', 'cancelled', 'expired'].includes(live.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setCancelTarget(live)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar Live
                            </DropdownMenuItem>
                          </>
                        )}
                        {live.status === 'draft' && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteLive.mutate(live.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => { if (!open && !isCancelling) { setCancelTarget(null); setCancelReason(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar live?</AlertDialogTitle>
            <AlertDialogDescription>
              A live <strong>"{cancelTarget?.title}"</strong> será marcada como cancelada e os inscritos serão notificados por email. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="cancel-reason" className="text-sm font-medium">
              Motivo do cancelamento <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Ex: Problema de agenda, será reagendada para a próxima semana..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
              rows={3}
              disabled={isCancelling}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isCancelling}
              onClick={async (e) => {
                e.preventDefault();
                if (!cancelTarget) return;
                setIsCancelling(true);
                try {
                  // 1. Update status to cancelled
                  handleStatusChange(cancelTarget, 'cancelled');

                  // 2. Send cancellation emails (fire-and-forget with error logging)
                  supabase.functions
                    .invoke('send-live-cancelled', {
                      body: {
                        live_id: cancelTarget.id,
                        cancellation_reason: cancelReason.trim() || undefined,
                      },
                    })
                    .then(({ error }) => {
                      if (error) console.error('Live cancellation email error:', error);
                    });

                  toast({
                    title: 'Live cancelada',
                    description: 'Os inscritos serão notificados por email.',
                  });
                } finally {
                  setIsCancelling(false);
                  setCancelTarget(null);
                  setCancelReason('');
                }
              }}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sim, cancelar live'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
