import { useCommunityComments } from '@/hooks/useCommunityComments';
import { CommentThread } from './CommentThread';

interface InlineCommentsProps {
  postId: string;
}

export function InlineComments({ postId }: InlineCommentsProps) {
  const {
    comments,
    isLoading,
    createComment,
    toggleCommentLike,
    deleteComment,
  } = useCommunityComments(postId);

  return (
    <div className="pt-4 border-t border-gray-100">
      <CommentThread
        comments={comments}
        onCreateComment={createComment}
        onLikeComment={toggleCommentLike}
        onDeleteComment={deleteComment}
        isLoading={isLoading}
      />
    </div>
  );
}
