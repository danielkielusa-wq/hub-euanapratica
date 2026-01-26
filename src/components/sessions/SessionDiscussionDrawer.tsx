import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessionPosts, useCreatePost, useVotePost, useDeletePost } from '@/hooks/useSessionPosts';
import { EmptyDiscussionState } from './EmptyDiscussionState';
import { DiscussionPost } from './DiscussionPost';
import { PostComposer } from './PostComposer';

interface SessionDiscussionDrawerProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
}

export function SessionDiscussionDrawer({ 
  open, 
  onClose, 
  sessionId, 
  sessionTitle 
}: SessionDiscussionDrawerProps) {
  const isMobile = useIsMobile();
  const { data: posts, isLoading } = useSessionPosts(sessionId);
  const createPost = useCreatePost();
  const votePost = useVotePost();
  const deletePost = useDeletePost();

  const handleCreatePost = async (content: string) => {
    await createPost.mutateAsync({ sessionId, content });
  };

  const handleVote = async (postId: string, hasVoted: boolean) => {
    await votePost.mutateAsync({ postId, sessionId, hasVoted });
  };

  const handleDelete = async (postId: string) => {
    await deletePost.mutateAsync({ postId, sessionId });
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Posts Feed - Scrollable */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-[20px] bg-muted/30 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4 pb-4">
            {posts.map((post, index) => (
              <div 
                key={post.id} 
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DiscussionPost 
                  post={post}
                  onVote={handleVote}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyDiscussionState />
        )}
      </ScrollArea>
      
      {/* Composer - Fixed Bottom */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
        <PostComposer 
          onSubmit={handleCreatePost}
          isSubmitting={createPost.isPending}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="h-[90vh] max-h-[90vh]">
          <DrawerHeader className="border-b border-border/40 pb-4">
            <DrawerTitle className="text-lg font-semibold">{sessionTitle}</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              Discussão da sessão
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
          <SheetTitle className="text-lg font-semibold">{sessionTitle}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Discussão da sessão
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
