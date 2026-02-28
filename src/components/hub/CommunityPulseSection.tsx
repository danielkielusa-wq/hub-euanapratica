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
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-gray-900">Comunidade</h2>
          {pulse.postsToday > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
              {pulse.postsToday} hoje
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/comunidade')}
          className="text-xs font-bold text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          Abrir <ArrowRight size={14} />
        </button>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
        {/* Top post */}
        {config.community_pulse.show_top_post && pulse.topPost && (
          <button
            onClick={() => navigate(`/comunidade/post/${pulse.topPost!.id}`)}
            className="w-full text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Destaque da Semana</p>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                  {pulse.topPost.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">{pulse.topPost.author_name}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Heart size={11} /> {pulse.topPost.likes_count}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MessageCircle size={11} /> {pulse.topPost.comments_count}
                  </span>
                </div>
              </div>
            </div>
          </button>
        )}

        {/* Separator if both sections */}
        {config.community_pulse.show_top_post && pulse.topPost && <div className="border-t border-gray-50" />}

        {/* User engagement or CTA */}
        <div className="flex items-center justify-between">
          {pulse.userLatestPost ? (
            <p className="text-sm text-gray-500">
              Seu último post recebeu{' '}
              <span className="font-bold text-gray-700">{pulse.userLatestPost.likes_count}</span>{' '}
              curtida{pulse.userLatestPost.likes_count !== 1 ? 's' : ''}.
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {config.community_pulse.no_activity_cta || 'Faça seu primeiro post!'}
            </p>
          )}
          <button
            onClick={() => navigate('/comunidade')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 flex-shrink-0"
          >
            {pulse.userLatestPost ? 'Postar' : 'Participar'} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
