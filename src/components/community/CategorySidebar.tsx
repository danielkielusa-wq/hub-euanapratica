import { CommunityCategory } from '@/types/community';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Hash, Briefcase, Users, Home, HelpCircle, Plane, Globe } from 'lucide-react';
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
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
        <Skeleton className="h-12 w-full rounded-2xl mb-6" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm sticky top-28">
      <button
        onClick={onNewPost}
        className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-2 mb-8 hover:-translate-y-0.5"
      >
        <Plus size={20} /> Nova Discussao
      </button>

      <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">
        Canais
      </p>
      <nav className="space-y-1">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
            !selectedCategoryId
              ? 'bg-brand-50 text-brand-600'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Hash size={18} />
          Todas as Discussoes
        </button>

        {categories.map(category => {
          const Icon = iconMap[category.icon_name] || Hash;
          const isActive = selectedCategoryId === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={18} />
              {category.name}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-gray-50">
        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-bold text-gray-600">Apenas Mentores</span>
          <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer hover:bg-gray-300 transition-colors">
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
