import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  Pencil,
  Radio,
  Users,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMentorLiveById, useLiveRegistrations, useToggleAttended, useUpdateLive } from '@/hooks/useMentorLives';
import { toast } from '@/hooks/use-toast';
import { ACCESS_TYPE_LABELS, ACCESS_TYPE_COLORS, STATUS_LABELS, STATUS_COLORS } from '@/types/live';
import { LiveShareButtons } from '@/components/lives/LiveShareButtons';

export default function MentorLiveDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: live, isLoading } = useMentorLiveById(id);
  const { data: registrations, isLoading: loadingRegs } = useLiveRegistrations(id);
  const toggleAttended = useToggleAttended();
  const updateLive = useUpdateLive();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCopyUrl = () => {
    if (!live) return;
    navigator.clipboard.writeText(`${window.location.origin}/live/${live.slug}`);
    toast({ title: 'URL copiada!' });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!live) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Live não encontrada.</p>
          <Button variant="outline" onClick={() => navigate('/mentor/lives')} className="mt-4">
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const dt = parseISO(live.scheduled_at);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/mentor/lives')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{live.title}</h1>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full',
                    STATUS_COLORS[live.status]
                  )}>
                    {STATUS_LABELS[live.status]}
                  </span>
                  <span className={cn(
                    'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                    ACCESS_TYPE_COLORS[live.access_type]
                  )}>
                    {ACCESS_TYPE_LABELS[live.access_type]}
                  </span>
                </div>

                {live.description && (
                  <p className="text-sm text-gray-500">{live.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(dt, "EEEE, dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {live.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {registrations?.length || 0} inscritos
                    {live.max_attendees ? ` / ${live.max_attendees}` : ''}
                  </span>
                </div>

                {live.meeting_link && (
                  <p className="text-xs text-gray-400 truncate">
                    Link: {live.meeting_link}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {live.status === 'scheduled' && (
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => updateLive.mutate({ id: live.id, status: 'live' })}
                  >
                    <Radio className="h-3 w-3 mr-1" />
                    Go Live
                  </Button>
                )}
                {live.status === 'live' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateLive.mutate({ id: live.id, status: 'completed' })}
                  >
                    Encerrar Live
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => navigate(`/mentor/lives/${id}/editar`)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar URL
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(`/live/${live.slug}`, '_blank')}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Landing Page
                </Button>
                {!['completed', 'cancelled'].includes(live.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share buttons */}
        <LiveShareButtons liveTitle={live.title} slug={live.slug} status={live.status} />

        {/* Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Inscritos ({registrations?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRegs ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !registrations?.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">Nenhum inscrito ainda.</p>
            ) : (
              <div className="divide-y">
                {registrations.map((reg) => (
                  <div key={reg.id} className="flex items-center gap-3 py-3">
                    <Checkbox
                      checked={reg.attended}
                      onCheckedChange={(checked) =>
                        toggleAttended.mutate({
                          registrationId: reg.id,
                          attended: !!checked,
                        })
                      }
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reg.profile?.profile_photo_url || undefined} />
                      <AvatarFallback className="text-xs bg-gray-100">
                        {(reg.profile?.full_name || '?')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {reg.profile?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {reg.profile?.email}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(parseISO(reg.registered_at), 'dd/MM HH:mm')}
                    </div>
                    {reg.attended && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Presente
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar live?</AlertDialogTitle>
            <AlertDialogDescription>
              A live <strong>"{live.title}"</strong> será marcada como cancelada e não aparecerá mais como disponível para os inscritos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                updateLive.mutate({ id: live.id, status: 'cancelled' });
                setShowCancelDialog(false);
              }}
            >
              Sim, cancelar live
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
