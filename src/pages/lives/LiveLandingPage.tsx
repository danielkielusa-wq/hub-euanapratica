import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Calendar, Clock, Users, Share2, Play, Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveBySlug } from '@/hooks/useLives';
import { LiveAccessCTA } from '@/components/lives/LiveAccessCTA';
import { LiveShareButtons } from '@/components/lives/LiveShareButtons';
import { ACCESS_TYPE_LABELS, ACCESS_TYPE_COLORS } from '@/types/live';

export default function LiveLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: live, isLoading } = useLiveBySlug(slug);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!live) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 max-w-[1200px] mx-auto text-center py-16">
          <div className="w-14 h-14 bg-gray-50 dark:bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Video className="h-7 w-7 text-gray-300 dark:text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-foreground mb-2">Live não encontrada</h2>
          <p className="text-gray-500 dark:text-muted-foreground">Este link pode estar incorreto ou a live foi removida.</p>
        </div>
      </DashboardLayout>
    );
  }

  const dt = parseISO(live.scheduled_at);
  const isLive = live.status === 'live';
  const isScheduled = live.status === 'scheduled';

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate('/lives')}
          className="flex items-center gap-2 text-gray-500 dark:text-muted-foreground hover:text-[#7367F0] transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lives
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Hero / Thumbnail */}
            <div className="relative rounded-2xl overflow-hidden aspect-video group shadow-lg">
              {live.thumbnail_url || live.og_image_url ? (
                <img
                  src={live.og_image_url || live.thumbnail_url || ''}
                  alt={live.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-800 flex items-center justify-center p-8">
                  <span className="text-white/10 text-4xl md:text-6xl font-bold text-center leading-tight select-none line-clamp-3">
                    {live.title}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-[2px]">
                {isLive ? (
                  <div className="bg-red-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-lg animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    Ao Vivo
                  </div>
                ) : isScheduled ? (
                  <div className="bg-[#7367F0] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
                    Em Breve
                  </div>
                ) : null}
                <h1 className="text-2xl md:text-4xl font-bold mb-4 max-w-xl leading-tight">
                  {live.title}
                </h1>
                <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium flex-wrap justify-center">
                  <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-md">
                    <Calendar className="w-4 h-4" />
                    {format(dt, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-md">
                    <Clock className="w-4 h-4" />
                    {format(dt, 'HH:mm')} • {live.duration_minutes}min
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/10">
              <h2 className="text-xl font-bold text-gray-800 dark:text-foreground mb-4">Sobre esta Live</h2>
              {live.description && (
                <p className="text-gray-600 dark:text-muted-foreground text-sm leading-relaxed mb-4">
                  {live.description}
                </p>
              )}
              {live.long_description && (
                <div className="prose prose-sm prose-gray dark:prose-invert max-w-none whitespace-pre-wrap text-gray-600 dark:text-muted-foreground">
                  {live.long_description}
                </div>
              )}

              {/* Access badge + meta */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={cn(
                    'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border',
                    ACCESS_TYPE_COLORS[live.access_type]
                  )}>
                    {ACCESS_TYPE_LABELS[live.access_type]}
                  </span>
                  {live.access_type === 'paid' && live.price > 0 && (
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      R$ {live.price.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {live.registration_count} inscritos
                    {live.max_attendees ? ` / ${live.max_attendees}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Share */}
            <LiveShareButtons liveTitle={live.title} slug={live.slug} status={live.status} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Action Card */}
            <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-500/20 sticky top-6">
              {isScheduled && <CountdownTimer targetDate={dt} />}
              {isLive && (
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full" />
                    Ao Vivo Agora
                  </div>
                </div>
              )}

              <LiveAccessCTA live={live} />

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-muted-foreground pt-4 mt-4 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="font-bold text-gray-800 dark:text-foreground">{live.registration_count}</span> inscritos
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/live/${live.slug}`);
                    toast({ title: 'Link copiado!' });
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mentor Card */}
            {live.mentor && (
              <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase mb-4">Mentor</h3>
                <div className="flex items-center gap-4 mb-4">
                  {live.mentor.profile_photo_url ? (
                    <img
                      src={live.mentor.profile_photo_url}
                      alt={live.mentor.full_name}
                      className="w-16 h-16 rounded-full border-2 border-indigo-100 dark:border-indigo-500/20 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                      {live.mentor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-foreground text-lg">{live.mentor.full_name}</h4>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Mentor</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recording link */}
            {live.recording_url && live.status === 'completed' && (
              <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                <h3 className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase mb-4">Gravação</h3>
                <button
                  onClick={() => window.open(live.recording_url!, '_blank')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Play className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-foreground group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                      Assistir Gravação
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─── Countdown Timer ─── */
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = differenceInSeconds(targetDate, new Date());
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="text-center mb-6">
      <p className="text-sm text-gray-500 dark:text-muted-foreground mb-1">A live começa em</p>
      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
        {timeLeft}
      </div>
    </div>
  );
}
