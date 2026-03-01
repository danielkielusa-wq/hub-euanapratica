import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isThisWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Play, Calendar, Clock, Users, Share2,
  ChevronRight, Video,
} from 'lucide-react';
import { useLives } from '@/hooks/useLives';
import { LiveCard } from '@/components/lives/LiveCard';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { LiveWithMentor } from '@/types/live';

const DAY_SHORT: Record<number, string> = { 0: 'DOM', 1: 'SEG', 2: 'TER', 3: 'QUA', 4: 'QUI', 5: 'SEX', 6: 'SÁB' };

type TabKey = 'upcoming' | 'recorded';

export default function LivesDiscovery() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const navigate = useNavigate();

  const { data: lives, isLoading } = useLives();

  // Separate featured (first live/scheduled), upcoming, and recorded
  const { featured, upcoming, recorded } = useMemo(() => {
    const all = lives || [];
    const liveLive = all.find(l => l.status === 'live');
    const feat = liveLive || all[0] || null;
    const rest = all.filter(l => l.id !== feat?.id);
    return {
      featured: feat,
      upcoming: rest.filter(l => l.status === 'scheduled' || l.status === 'live'),
      recorded: rest.filter(l => l.status === 'completed'),
    };
  }, [lives]);

  // Weekly schedule (lives this week)
  const weeklySchedule = useMemo(() => {
    return (lives || [])
      .filter(l => l.status === 'scheduled' && isThisWeek(parseISO(l.scheduled_at), { weekStartsOn: 0 }))
      .slice(0, 4);
  }, [lives]);

  // Unique mentors
  const topMentors = useMemo(() => {
    const map = new Map<string, { name: string; role: string; photo: string | null }>();
    (lives || []).forEach(l => {
      if (l.mentor && !map.has(l.mentor.id)) {
        map.set(l.mentor.id, {
          name: l.mentor.full_name,
          role: 'Mentor',
          photo: l.mentor.profile_photo_url,
        });
      }
    });
    return Array.from(map.values()).slice(0, 4);
  }, [lives]);

  // Filter by search + tab
  const filteredList = useMemo(() => {
    const source = activeTab === 'recorded' ? recorded : upcoming;
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(l =>
      l.title.toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q)
    );
  }, [activeTab, upcoming, recorded, search]);

  const handleCardClick = (live: LiveWithMentor) => {
    navigate(`/live/${live.slug}`);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-foreground flex items-center gap-2">
              Lives & Workshops
              {(lives || []).some(l => l.status === 'live') && (
                <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                  Ao Vivo
                </span>
              )}
            </h2>
            <p className="text-gray-500 dark:text-muted-foreground text-sm">
              Aprenda em tempo real com especialistas do mercado americano.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar lives..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar lives..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full transition-all bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
          />
        </div>

        {/* Featured Live (Hero) */}
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        ) : featured ? (
          <FeaturedHero live={featured} onClick={() => handleCardClick(featured)} />
        ) : null}

        {/* Content Tabs + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main List */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-white/10">
              <TabButton label="Próximas" active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} />
              <TabButton label="Gravadas" active={activeTab === 'recorded'} onClick={() => setActiveTab('recorded')} />
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-[340px] w-full rounded-xl" />
                ))}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-gray-50 dark:bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Video className="h-7 w-7 text-gray-300 dark:text-muted-foreground" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-foreground text-lg mb-2">
                  Nenhuma live disponível
                </h3>
                <p className="text-gray-500 dark:text-muted-foreground text-sm">
                  {search ? 'Tente ajustar sua busca.' : 'Novas lives serão publicadas em breve!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredList.map(live => (
                  <LiveCard key={live.id} live={live} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Widgets */}
          <div className="w-full lg:w-80 space-y-6 flex-shrink-0">

            {/* Calendar Widget */}
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6">
              <h3 className="font-bold text-gray-800 dark:text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Agenda Semanal
              </h3>
              {weeklySchedule.length > 0 ? (
                <div className="space-y-3">
                  {weeklySchedule.map(live => {
                    const dt = parseISO(live.scheduled_at);
                    return (
                      <div
                        key={live.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => handleCardClick(live)}
                      >
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg p-2 text-center min-w-[50px]">
                          <div className="text-[10px] font-bold">{DAY_SHORT[getDay(dt)]}</div>
                          <div className="text-lg font-bold leading-none">{format(dt, 'dd')}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-800 dark:text-foreground line-clamp-1">{live.title}</div>
                          <div className="text-xs text-gray-500 dark:text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {format(dt, 'HH:mm')}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-muted-foreground">Nenhuma live agendada esta semana.</p>
              )}
            </div>

            {/* Top Mentors */}
            {topMentors.length > 0 && (
              <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6">
                <h3 className="font-bold text-gray-800 dark:text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Top Mentores
                </h3>
                <div className="space-y-3">
                  {topMentors.map((mentor, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                      {mentor.photo ? (
                        <img
                          src={mentor.photo}
                          alt={mentor.name}
                          className="w-10 h-10 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-muted-foreground font-bold">
                          {mentor.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-800 dark:text-foreground">{mentor.name}</div>
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">{mentor.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

/* ─── Featured Hero ─── */
function FeaturedHero({ live, onClick }: { live: LiveWithMentor; onClick: () => void }) {
  const isLive = live.status === 'live';
  const dt = parseISO(live.scheduled_at);

  return (
    <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/10 grid grid-cols-1 lg:grid-cols-3">
      {/* Thumbnail */}
      <div className="lg:col-span-2 bg-gray-900 relative min-h-[250px] sm:min-h-[300px] group cursor-pointer" onClick={onClick}>
        {live.thumbnail_url || live.og_image_url ? (
          <img
            src={live.og_image_url || live.thumbnail_url || ''}
            alt={live.title}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-800 flex items-center justify-center p-6">
            <span className="text-white/10 text-3xl sm:text-5xl font-bold text-center leading-tight select-none line-clamp-3">
              {live.title}
            </span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-indigo-600 ml-1" />
            </div>
          </div>
        </div>
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          {isLive ? (
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              AO VIVO AGORA
            </span>
          ) : (
            <span className="bg-[#7367F0] text-white text-xs font-bold px-3 py-1 rounded-full">
              Em Breve
            </span>
          )}
          {live.registration_count > 0 && (
            <span className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" />
              {live.registration_count} inscritos
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-6 lg:p-8 flex flex-col justify-center">
        {live.mentor && (
          <div className="flex items-center gap-2 mb-4">
            {live.mentor.profile_photo_url ? (
              <img
                src={live.mentor.profile_photo_url}
                alt={live.mentor.full_name}
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-muted-foreground">
                {live.mentor.full_name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-foreground">{live.mentor.full_name}</p>
              <p className="text-[10px] text-gray-500 dark:text-muted-foreground">Mentor</p>
            </div>
          </div>
        )}

        <h1
          className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-foreground mb-3 leading-tight cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          onClick={onClick}
        >
          {live.title}
        </h1>
        {live.description && (
          <p className="text-gray-500 dark:text-muted-foreground text-sm mb-6 line-clamp-3">
            {live.description}
          </p>
        )}

        <div className="flex items-center gap-3 mb-6 text-xs text-gray-500 dark:text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(dt, "dd/MM 'às' HH:mm", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {live.duration_minutes} min
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onClick}
            className="flex-1 bg-[#7367F0] text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none text-sm"
          >
            {isLive ? 'Assistir Agora' : 'Ver Detalhes'}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/live/${live.slug}`);
              toast({ title: 'Link copiado!' });
            }}
            className="p-3 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab Button ─── */
function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'pb-3 text-sm font-bold border-b-2 transition-colors',
        active
          ? 'border-[#7367F0] text-[#7367F0]'
          : 'border-transparent text-gray-500 dark:text-muted-foreground hover:text-gray-700 dark:hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}
