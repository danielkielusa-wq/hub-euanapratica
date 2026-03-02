import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useCommunityCategories } from '@/hooks/useCommunityCategories';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useGamification } from '@/hooks/useGamification';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { CategorySidebar } from '@/components/community/CategorySidebar';
import { PostCard } from '@/components/community/PostCard';
import { RankingSidebar } from '@/components/community/RankingSidebar';
import { MyLevelCard } from '@/components/community/MyLevelCard';
import { InlinePostCreator } from '@/components/community/InlinePostCreator';
import { UpgradePrompt } from '@/components/guards/FeatureGate';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronDown, MessageCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostFilter } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';

const SORT_OPTIONS: { value: PostFilter; label: string }[] = [
  { value: 'popular', label: 'Top' },
  { value: 'recent', label: 'Recentes' },
  { value: 'unanswered', label: 'Sem Resposta' },
];

export default function Community() {
  const { user } = useAuth();
  const { hasFeature, isLoading: planLoading } = usePlanAccess();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<PostFilter>('popular');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { activeCategories, isLoading: categoriesLoading } = useCommunityCategories();
  const { posts, isLoading: postsLoading, createPost, toggleLike } = useCommunityPosts({
    categoryId: selectedCategory,
    filter: sortBy,
  });
  const { userStats, ranking, isLoading: gamificationLoading } = useGamification();

  // Check community access — wait for plan data before showing upgrade prompt
  if (!planLoading && !hasFeature('community')) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8">
          <UpgradePrompt feature="community" />
        </div>
      </DashboardLayout>
    );
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Top';

  // Simple client-side search filter
  const filteredPosts = searchQuery.trim()
    ? posts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-foreground">Comunidade</h2>
            <p className="text-gray-500 dark:text-muted-foreground text-sm">Conecte-se, compartilhe e cresça com outros profissionais.</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar na comunidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full md:w-64 transition-all bg-white dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Mobile Category Filter */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0',
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-white/20'
              )}
            >
              <MessageSquare className="w-3 h-3" />
              Todos
            </button>
            {activeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0',
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-white/20'
                )}
              >
                #{cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <MyLevelCard
              userStats={userStats}
              isLoading={gamificationLoading}
            />
            <CategorySidebar
              categories={activeCategories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onNewPost={() => {}}
              isLoading={categoriesLoading}
            />
          </aside>

          {/* Main Feed */}
          <section className="col-span-1 lg:col-span-6 space-y-4 sm:space-y-6">
            {/* Create Post */}
            <InlinePostCreator
              categories={activeCategories}
              userStats={userStats}
              onSubmit={createPost}
            />

            {/* Sort By */}
            <div className="flex justify-end relative">
              <button
                className="flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-muted-foreground"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                Ordenar por : <span className="text-gray-600 dark:text-foreground">{currentSortLabel}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showSortMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-card rounded-xl shadow-lg border border-gray-100 dark:border-white/10 py-1 z-30 min-w-[140px]">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                        sortBy === option.value
                          ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10'
                          : 'text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Posts */}
            {postsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-card rounded-xl p-8 sm:p-12 text-center border border-gray-100 dark:border-white/10 shadow-sm">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 dark:text-foreground mb-2">
                  {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma discussao ainda'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">
                  {searchQuery ? 'Tente buscar por outro termo.' : 'Seja o primeiro a iniciar uma conversa!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={toggleLike}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <RankingSidebar
              ranking={ranking}
              posts={posts}
              isLoading={gamificationLoading}
              currentUserId={user?.id}
            />
          </aside>

        </div>
      </div>
    </DashboardLayout>
  );
}
