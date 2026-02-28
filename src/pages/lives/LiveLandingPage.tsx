import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Users, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveBySlug } from '@/hooks/useLives';
import { LiveAccessCTA } from '@/components/lives/LiveAccessCTA';
import { LiveShareButtons } from '@/components/lives/LiveShareButtons';
import { ACCESS_TYPE_LABELS, ACCESS_TYPE_COLORS } from '@/types/live';

export default function LiveLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: live, isLoading } = useLiveBySlug(slug);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!live) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto text-center py-16">
          <Radio className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Live não encontrada</h2>
          <p className="text-gray-500">Este link pode estar incorreto ou a live foi removida.</p>
        </div>
      </DashboardLayout>
    );
  }

  const dt = parseISO(live.scheduled_at);
  const isLive = live.status === 'live';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden">
          {live.thumbnail_url || live.og_image_url ? (
            <img
              src={live.og_image_url || live.thumbnail_url || ''}
              alt={live.title}
              className="w-full aspect-video object-cover"
            />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
              <Radio className="h-16 w-16 text-indigo-300" />
            </div>
          )}

          {isLive && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full animate-pulse">
              <Radio className="h-4 w-4" />
              AO VIVO
            </div>
          )}
        </div>

        {/* Title + Badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border',
              ACCESS_TYPE_COLORS[live.access_type]
            )}>
              {ACCESS_TYPE_LABELS[live.access_type]}
            </span>
            {live.access_type === 'paid' && live.price > 0 && (
              <span className="text-sm font-bold text-amber-700">
                R$ {live.price.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {live.title}
          </h1>

          {live.description && (
            <p className="text-gray-600 text-lg">{live.description}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(dt, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {live.duration_minutes} minutos
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {live.registration_count} inscritos
              {live.max_attendees ? ` / ${live.max_attendees}` : ''}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="sticky top-4 z-10">
          <LiveAccessCTA live={live} />
        </div>

        {/* Long Description */}
        {live.long_description && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sobre esta Live</h2>
            <div className="prose prose-sm prose-gray max-w-none whitespace-pre-wrap">
              {live.long_description}
            </div>
          </div>
        )}

        {/* Share */}
        <LiveShareButtons liveTitle={live.title} slug={live.slug} status={live.status} />

        {/* Mentor Card */}
        {live.mentor && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Apresentado por</h2>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={live.mentor.profile_photo_url || undefined} />
                <AvatarFallback className="bg-indigo-50 text-indigo-600 text-lg font-bold">
                  {live.mentor.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-gray-900 text-lg">{live.mentor.full_name}</p>
                <p className="text-gray-500 text-sm">Mentor</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
