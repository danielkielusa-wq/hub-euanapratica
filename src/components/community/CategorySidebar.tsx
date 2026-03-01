import { MessageSquare, Hash, Users, Calendar, Briefcase } from 'lucide-react';
import { CommunityCategory } from '@/types/community';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CategorySidebarProps {
  categories: CommunityCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onNewPost: () => void;
  isLoading?: boolean;
}

// Default icons for categories; falls back to Hash
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  feed: MessageSquare,
  networking: Users,
  eventos: Calendar,
  vagas: Briefcase,
};

function getCategoryIcon(name: string): React.ElementType {
  const key = name.toLowerCase().replace(/\s+/g, '');
  return CATEGORY_ICONS[key] || Hash;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading,
}: CategorySidebarProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-4">
        <div className="space-y-1">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Menu */}
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-4">
        <nav className="space-y-1">
          {/* "All" feed item */}
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              selectedCategoryId === null
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                : 'text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/5'
            )}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>Feed Principal</span>
            </div>
          </button>

          {/* Dynamic categories as menu items */}
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            const isActive = category.id === selectedCategoryId;
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600'
                    : 'text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Popular Tags */}
      {categories.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6">
          <h4 className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider mb-4">Topicos Populares</h4>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="text-xs font-medium px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-muted-foreground rounded-full hover:bg-gray-200 dark:hover:bg-white/20 cursor-pointer transition-colors"
              >
                #{cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 text-[10px] text-gray-400 dark:text-muted-foreground space-y-1">
        <div className="flex gap-2">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
        <p>EUA na Pratica &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
