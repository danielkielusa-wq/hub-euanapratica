import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { useCommunityComments } from '@/hooks/useCommunityComments';
import { PostCard } from '@/components/community/PostCard';
import { CommentThread } from '@/components/community/CommentThread';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const { posts, isLoading: postLoading, toggleLike } = useCommunityPosts({ limit: 1 });
  const { comments, isLoading: commentsLoading, createComment, toggleCommentLike, deleteComment } = useCommunityComments(postId || '');

  // Find the specific post (we'd ideally fetch by ID, but using client-side filter for now)
  const post = posts.find(p => p.id === postId);

  if (postLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-[24px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Link to="/comunidade">
          <Button variant="ghost" className="gap-2 mb-6 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Comunidade
          </Button>
        </Link>

        {post ? (
          <div className="space-y-8">
            <PostCard post={post} onLike={toggleLike} showFull />
            
            <div className="bg-card rounded-[24px] p-6 border border-border/50">
              <h3 className="font-bold text-foreground mb-6">
                Comentários ({post.comments_count})
              </h3>
              <CommentThread
                comments={comments}
                onCreateComment={createComment}
                onLikeComment={toggleCommentLike}
                onDeleteComment={deleteComment}
                isLoading={commentsLoading}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Discussão não encontrada</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
