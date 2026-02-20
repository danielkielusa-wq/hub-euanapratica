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
import { ChevronDown, MessageCircle } from 'lucide-react';
import { PostFilter } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';

const SORT_OPTIONS: { value: PostFilter; label: string }[] = [
  { value: 'popular', label: 'Top' },
  { value: 'recent', label: 'Recentes' },
  { value: 'unanswered', label: 'Sem Resposta' },
];

export default function Community() {
  const { user } = useAuth();
  const { hasFeature } = usePlanAccess();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<PostFilter>('popular');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { activeCategories, isLoading: categoriesLoading } = useCommunityCategories();
  const { posts, isLoading: postsLoading, createPost, toggleLike } = useCommunityPosts({
    categoryId: selectedCategory,
    filter: sortBy,
  });
  const { userStats, ranking, isLoading: gamificationLoading } = useGamification();

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

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Top';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <aside className="hidden md:block md:col-span-3">
            <div className="space-y-6">
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
            </div>
          </aside>

          {/* Main Feed */}
          <section className="col-span-1 md:col-span-6">
            <div className="space-y-6">
              {/* Inline Post Creator */}
              <InlinePostCreator
                categories={activeCategories}
                userStats={userStats}
                onSubmit={createPost}
              />

              {/* Sort By */}
              <div className="flex justify-end relative">
                <button
                  className="flex items-center gap-1 text-xs font-bold text-gray-400"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  Ordenar por : <span className="text-gray-600">{currentSortLabel}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 min-w-[140px]">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                          sortBy === option.value
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-gray-600 hover:bg-gray-50'
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
                    <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">Nenhuma discussao ainda</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Seja o primeiro a iniciar uma conversa!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={toggleLike}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <RankingSidebar
              ranking={ranking}
              isLoading={gamificationLoading}
              currentUserId={user?.id}
            />
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
