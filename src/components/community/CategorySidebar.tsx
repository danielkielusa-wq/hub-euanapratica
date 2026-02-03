import { CommunityCategory } from '@/types/community';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Hash, Briefcase, Users, Home, HelpCircle, Plane, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  hash: Hash,
  briefcase: Briefcase,
  users: Users,
  home: Home,
  'help-circle': HelpCircle,
  passport: Plane,
  globe: Globe,
};

interface CategorySidebarProps {
  categories: CommunityCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onNewPost: () => void;
  isLoading?: boolean;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onNewPost,
  isLoading,
}: CategorySidebarProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button 
        onClick={onNewPost}
        className="w-full rounded-2xl gap-2 h-12 font-bold"
      >
        <PlusCircle className="h-5 w-5" />
        Nova Discussão
      </Button>

      <div className="space-y-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-3">
          Categorias
        </p>
        
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            !selectedCategoryId 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Hash className="h-4 w-4" />
          Todas as Discussões
        </button>

        {categories.map(category => {
          const Icon = iconMap[category.icon_name] || Hash;
          const isActive = selectedCategoryId === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
