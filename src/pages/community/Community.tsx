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
import { NewPostModal } from '@/components/community/NewPostModal';
import { UpgradePrompt } from '@/components/guards/FeatureGate';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Clock, MessageCircle } from 'lucide-react';
import { PostFilter } from '@/types/community';
import { useAuth } from '@/contexts/AuthContext';

export default function Community() {
  const { user } = useAuth();
  const { hasFeature } = usePlanAccess();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<PostFilter>('recent');
  const [showNewPost, setShowNewPost] = useState(false);

  const { categories, activeCategories, isLoading: categoriesLoading } = useCommunityCategories();
  const { posts, isLoading: postsLoading, createPost, toggleLike } = useCommunityPosts({
    categoryId: selectedCategory,
    filter,
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

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Comunidade</h1>
              <p className="text-sm text-muted-foreground">Conecte-se com outros membros</p>
            </div>
          </div>
          
          {userStats && (
            <div className="bg-card rounded-2xl p-4 border border-border/50 min-w-[200px]">
              <UserLevelBadge 
                level={userStats.level} 
                totalPoints={userStats.total_points} 
              />
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Categories */}
          <div className="col-span-12 lg:col-span-3">
            <CategorySidebar
              categories={activeCategories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onNewPost={() => setShowNewPost(true)}
              isLoading={categoriesLoading}
            />
          </div>

          {/* Main Feed */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            {/* Filters */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as PostFilter)}>
              <TabsList className="rounded-xl h-11">
                <TabsTrigger value="recent" className="gap-2 rounded-lg">
                  <Clock className="h-4 w-4" />
                  Recentes
                </TabsTrigger>
                <TabsTrigger value="popular" className="gap-2 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                  Populares
                </TabsTrigger>
                <TabsTrigger value="unanswered" className="gap-2 rounded-lg">
                  <MessageCircle className="h-4 w-4" />
                  Sem Resposta
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Posts */}
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 w-full rounded-[24px]" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-card rounded-[24px] p-12 text-center border border-border/50">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nenhuma discussão ainda</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Seja o primeiro a iniciar uma conversa!
                </p>
                <Button onClick={() => setShowNewPost(true)} className="rounded-xl">
                  Criar Discussão
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
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

          {/* Right Sidebar - Ranking */}
          <div className="col-span-12 lg:col-span-3">
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
