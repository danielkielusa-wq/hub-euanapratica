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

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading,
}: CategorySidebarProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allChannels = [
    { id: null as string | null, name: 'Todas as Discussoes' },
    ...categories.map(c => ({ id: c.id as string | null, name: c.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canais</h3>
        </div>
        <div className="space-y-4">
          {allChannels.map((channel) => {
            const isActive = channel.id === selectedCategoryId;
            return (
              <div
                key={channel.id ?? 'all'}
                className="flex items-center justify-between group cursor-pointer"
                onClick={() => onSelectCategory(channel.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full bg-brand-600'
                      )}
                    />
                  </div>
                  <p
                    className={cn(
                      'text-sm font-bold transition-colors',
                      isActive
                        ? 'text-brand-600'
                        : 'group-hover:text-brand-600'
                    )}
                  >
                    {channel.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 text-[10px] text-gray-400 space-y-1">
        <div className="flex gap-2">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Advertising</a>
          <a href="#" className="hover:underline">Cookies</a>
        </div>
        <p>EUA na Pratica &copy; 2025</p>
      </div>
    </div>
  );
}
