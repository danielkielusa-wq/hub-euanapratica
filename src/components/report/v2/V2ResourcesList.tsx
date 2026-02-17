import { Badge } from '@/components/ui/badge';
import { Youtube, Instagram, FileText, BookOpen, Link, ExternalLink } from 'lucide-react';
import type { V2Resource } from '@/types/leads';

interface V2ResourcesListProps {
  resources: V2Resource[];
}

const resourceIcons: Record<string, typeof Youtube> = {
  youtube: Youtube,
  instagram: Instagram,
  guide: FileText,
  articles: BookOpen,
  ebook: BookOpen,
};

const resourceColors: Record<string, string> = {
  youtube: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400',
  instagram: 'bg-pink-50 text-pink-600 hover:bg-pink-100 dark:bg-pink-950/30 dark:text-pink-400',
  guide: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400',
  articles: 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400',
  ebook: 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400',
};

export function V2ResourcesList({ resources }: V2ResourcesListProps) {
  if (!resources || resources.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        📚 Recursos Recomendados
      </h3>

      <div className="flex flex-wrap gap-3">
        {resources.map((resource, index) => {
          const Icon = resourceIcons[resource.type] || Link;
          const colorClass = resourceColors[resource.type] || 'bg-gray-50 text-gray-600 hover:bg-gray-100';

          const content = (
            <>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{resource.title}</span>
              {resource.price && (
                <Badge variant="secondary" className="text-[9px] ml-1">
                  {resource.price}
                </Badge>
              )}
              {resource.url && (
                <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
              )}
            </>
          );

          if (resource.url) {
            return (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${colorClass}`}
              >
                {content}
              </a>
            );
          }

          return (
            <span
              key={index}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium ${colorClass}`}
            >
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
