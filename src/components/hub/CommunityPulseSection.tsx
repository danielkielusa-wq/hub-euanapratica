import { useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, ArrowRight, TrendingUp } from 'lucide-react';
import type { CommunityPulse, HubDashboardConfig } from '@/types/hub';

interface CommunityPulseSectionProps {
  pulse: CommunityPulse;
  config: HubDashboardConfig;
}

export function CommunityPulseSection({ pulse, config }: CommunityPulseSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-md border-0 shadow-md p-6 space-y-4">
      {/* Header inside card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-foreground">Comunidade</h2>
          {pulse.postsToday > 0 && (
            <span className="vuexy-badge-warning text-[10px]">
              {pulse.postsToday} hoje
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/comunidade')}
          className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Abrir <ArrowRight size={14} />
        </button>
      </div>

      {/* Top post */}
      {config.community_pulse.show_top_post && pulse.topPost && (
        <button
          onClick={() => navigate(`/comunidade/post/${pulse.topPost!.id}`)}
          className="w-full text-left group"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-[#fff3e8] text-[#ff9f43] flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-0.5">Destaque da Semana</p>
              <p className="text-sm font-medium text-foreground group-hover:text-[#7367f0] transition-colors truncate">
                {pulse.topPost.title}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground">{pulse.topPost.author_name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart size={11} /> {pulse.topPost.likes_count}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle size={11} /> {pulse.topPost.comments_count}
                </span>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Separator if both sections */}
      {config.community_pulse.show_top_post && pulse.topPost && <div className="border-t border-border/30" />}

      {/* User engagement or CTA */}
      <div className="flex items-center justify-between">
        {pulse.userLatestPost ? (
          <p className="text-[13px] text-muted-foreground">
            Seu último post recebeu{' '}
            <span className="font-medium text-foreground">{pulse.userLatestPost.likes_count}</span>{' '}
            curtida{pulse.userLatestPost.likes_count !== 1 ? 's' : ''}.
          </p>
        ) : (
          <p className="text-[13px] text-muted-foreground">
            {config.community_pulse.no_activity_cta || 'Faça seu primeiro post!'}
          </p>
        )}
        <button
          onClick={() => navigate('/comunidade')}
          className="text-[13px] font-medium text-[#7367f0] hover:text-[#7367f0]/80 flex items-center gap-1 flex-shrink-0"
        >
          {pulse.userLatestPost ? 'Postar' : 'Participar'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
