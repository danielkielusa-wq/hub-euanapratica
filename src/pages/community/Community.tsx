import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useCommunityCategories } from '@/hooks/useCommunityCategories';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useGamification } from '@/hooks/useGamification';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { CategorySidebar } from '@/components/community/CategorySidebar';
import { PostCard } from '@/components/community/PostCard';
import { RankingSidebar } from '@/components/community/RankingSidebar';
import { UserLevelBadge } from '@/components/community/UserLevelBadge';
import { MyLevelCard } from '@/components/community/MyLevelCard';
import { NewPostModal } from '@/components/community/NewPostModal';
import { UpgradePrompt } from '@/components/guards/FeatureGate';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Sparkles, Clock, MessageSquare, MessageCircle } from 'lucide-react';
import { PostFilter } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';

type TabId = 'foryou' | 'recent' | 'unanswered';

const TAB_TO_FILTER: Record<TabId, PostFilter> = {
  foryou: 'popular',
  recent: 'recent',
  unanswered: 'unanswered',
};

export default function Community() {
  const { user } = useAuth();
  const { hasFeature } = usePlanAccess();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('foryou');
  const [showNewPost, setShowNewPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { categories, activeCategories, isLoading: categoriesLoading } = useCommunityCategories();
  const { posts, isLoading: postsLoading, createPost, toggleLike } = useCommunityPosts({
    categoryId: selectedCategory,
    filter: TAB_TO_FILTER[activeTab],
  });
  const { userStats, ranking, isLoading: gamificationLoading } = useGamification();

  // Client-side search filtering
  const filteredPosts = searchQuery.trim()
    ? posts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  // User initials for pill badge
  const fullName = (user?.user_metadata?.full_name as string) || '';
  const userInitials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  // Check community access
  if (!hasFeature('community')) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8">
          <UpgradePrompt feature="community" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Comunidade</h2>
            <p className="text-gray-500 mt-1">O hub social da sua carreira internacional.</p>
          </div>

          {userStats && (
            <UserLevelBadge
              level={userStats.level}
              totalPoints={userStats.total_points}
              variant="pill"
              initials={userInitials}
            />
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Sidebar - Categories (hidden below xl) */}
          <div className="hidden xl:block xl:col-span-3">
            <CategorySidebar
              categories={activeCategories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onNewPost={() => setShowNewPost(true)}
              isLoading={categoriesLoading}
            />
          </div>

          {/* Main Feed */}
          <div className="xl:col-span-6 space-y-6">
            {/* Command Bar / Search */}
            <div className="bg-white rounded-[24px] p-2 border border-gray-100 shadow-sm flex items-center gap-3 focus-within:ring-2 focus-within:ring-brand-100 transition-all relative z-20">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Sobre qual empresa ou assunto voce quer saber hoje?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-700 placeholder-gray-400 outline-none h-full"
              />
              <div className="hidden sm:flex items-center gap-2 pr-2">
                <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-400">
                  Cmd K
                </span>
              </div>
            </div>

            {/* Smart Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {([
                { id: 'foryou' as TabId, label: 'Para Voce', icon: Sparkles },
                { id: 'recent' as TabId, label: 'Recentes', icon: Clock },
                { id: 'unanswered' as TabId, label: 'Sem Resposta', icon: MessageSquare },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border
                    ${activeTab === tab.id
                      ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  {tab.id === 'foryou' && (
                    <Sparkles
                      size={14}
                      className={activeTab === 'foryou' ? 'text-amber-300' : 'text-amber-500'}
                      fill="currentColor"
                    />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Post Mobile */}
            <div
              className="xl:hidden bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer"
              onClick={() => setShowNewPost(true)}
            >
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-gray-400 text-sm font-medium truncate">
                Compartilhe sua jornada...
              </div>
            </div>

            {/* Posts */}
            {postsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 w-full rounded-[32px]" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white rounded-[32px] p-12 text-center border border-gray-100 shadow-sm">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Nenhuma discussao ainda</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Seja o primeiro a iniciar uma conversa!
                </p>
                <button
                  onClick={() => setShowNewPost(true)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-colors"
                >
                  Criar Discussao
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={toggleLike}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - Gamification (hidden below xl) */}
          <div className="hidden xl:block xl:col-span-3 space-y-8">
            <MyLevelCard
              userStats={userStats}
              user={user}
              isLoading={gamificationLoading}
            />
            <RankingSidebar
              ranking={ranking}
              isLoading={gamificationLoading}
              currentUserId={user?.id}
            />
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      <NewPostModal
        open={showNewPost}
        onOpenChange={setShowNewPost}
        categories={activeCategories}
        onSubmit={createPost}
      />
    </DashboardLayout>
  );
}
