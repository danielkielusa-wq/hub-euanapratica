import { useNavigate } from 'react-router-dom';
import { MessageSquare, Heart, TrendingUp, User } from 'lucide-react';
import type { CommunityPulse, HubDashboardConfig } from '@/types/hub';

interface CommunityPulseSectionProps {
  pulse: CommunityPulse;
  config: HubDashboardConfig;
}

function DiscussionItem({
  title,
  authorName,
  likes,
  comments,
  tags,
  onClick,
}: {
  title: string;
  authorName: string;
  likes: number;
  comments: number;
  tags?: string[];
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-4 items-start text-left">
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
        <User className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900 dark:text-foreground">{authorName}</span>
        </div>
        <h4 className="text-sm font-medium text-gray-800 dark:text-foreground/80 mb-2 leading-snug truncate">{title}</h4>
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {tags.map((tag) => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
            <Heart className="w-3.5 h-3.5" /> {likes}
          </div>
          <div className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> {comments}
          </div>
        </div>
      </div>
    </button>
  );
}

export function CommunityPulseSection({ pulse, config }: CommunityPulseSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-foreground">Comunidade</h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            {pulse.postsToday > 0 ? `${pulse.postsToday} post${pulse.postsToday !== 1 ? 's' : ''} hoje` : 'Últimas discussões'}
          </p>
        </div>
        <button
          onClick={() => navigate('/comunidade')}
          className="text-sm text-indigo-600 font-bold hover:underline"
        >
          Ver tudo
        </button>
      </div>

      {/* Discussion items */}
      <div className="divide-y divide-gray-50 dark:divide-white/5">
        {/* Top post */}
        {config.community_pulse.show_top_post && pulse.topPost && (
          <DiscussionItem
            title={pulse.topPost.title}
            authorName={pulse.topPost.author_name}
            likes={pulse.topPost.likes_count}
            comments={pulse.topPost.comments_count}
            tags={['Destaque']}
            onClick={() => navigate(`/comunidade/post/${pulse.topPost!.id}`)}
          />
        )}

        {/* User's latest post */}
        {pulse.userLatestPost && (
          <DiscussionItem
            title={pulse.userLatestPost.title}
            authorName="Você"
            likes={pulse.userLatestPost.likes_count}
            comments={pulse.userLatestPost.comments_count}
            tags={['Seu post']}
            onClick={() => navigate(`/comunidade/post/${pulse.userLatestPost!.id}`)}
          />
        )}

        {/* CTA when no posts */}
        {!pulse.topPost && !pulse.userLatestPost && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground mb-3">
              {config.community_pulse.no_activity_cta || 'Faça seu primeiro post!'}
            </p>
            <button
              onClick={() => navigate('/comunidade')}
              className="text-sm font-bold text-indigo-600 hover:underline"
            >
              Participar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
