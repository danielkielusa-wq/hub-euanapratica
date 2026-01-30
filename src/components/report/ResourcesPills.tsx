import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Youtube, Instagram, FileText, BookOpen, Link, MessageCircle } from 'lucide-react';

interface ResourcesPillsProps {
  resources: Array<{
    type: 'youtube' | 'instagram' | 'guide' | 'articles' | 'ebook';
    label: string;
    url?: string;
  }>;
  whatsappKeyword: string;
}

const resourceIcons = {
  youtube: Youtube,
  instagram: Instagram,
  guide: FileText,
  articles: BookOpen,
  ebook: BookOpen,
};

const resourceColors = {
  youtube: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400',
  instagram: 'bg-pink-50 text-pink-600 hover:bg-pink-100 dark:bg-pink-950/30 dark:text-pink-400',
  guide: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400',
  articles: 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-400',
  ebook: 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400',
};

export function ResourcesPills({ resources, whatsappKeyword }: ResourcesPillsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        📚 Recursos Recomendados
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {resources.map((resource, index) => {
          const Icon = resourceIcons[resource.type] || Link;
          const colorClass = resourceColors[resource.type] || 'bg-gray-50 text-gray-600';
          
          const Wrapper = resource.url ? 'a' : 'span';
          const wrapperProps = resource.url ? { 
            href: resource.url, 
            target: '_blank', 
            rel: 'noopener noreferrer' 
          } : {};
          
          return (
            <Wrapper
              key={index}
              {...wrapperProps}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${colorClass}`}
            >
              <Icon className="w-4 h-4" />
              {resource.label}
            </Wrapper>
          );
        })}
      </div>
      
      {/* WhatsApp Keyword Highlight */}
      {whatsappKeyword && (
        <Card className="rounded-[24px] bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 shadow-lg shadow-emerald-500/20">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white/90 text-sm mb-1">
                  Envie a palavra-chave no WhatsApp para receber material exclusivo:
                </p>
                <Badge className="bg-white text-emerald-700 font-bold text-lg px-4 py-1 hover:bg-white/90">
                  {whatsappKeyword}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
