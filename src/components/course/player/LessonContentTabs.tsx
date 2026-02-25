import { useState } from 'react';
import { FileText, Paperclip, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLessonAttachments } from '@/hooks/useAdminCourses';
import type { CourseLesson } from '@/types/course';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface LessonContentTabsProps {
  lesson: CourseLesson;
}

type Tab = 'content' | 'materials';

const FILE_ICONS: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  xlsx: '📊',
  xls: '📊',
  pptx: '📈',
  ppt: '📈',
  zip: '📦',
  png: '🖼️',
  jpg: '🖼️',
  jpeg: '🖼️',
};

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LessonContentTabs({ lesson }: LessonContentTabsProps) {
  const [tab, setTab] = useState<Tab>('content');
  const { data: attachments = [] } = useLessonAttachments(lesson.id);

  const hasContent = !!lesson.content_html;
  const hasAttachments = attachments.length > 0;

  // If nothing to show, don't render
  if (!hasContent && !hasAttachments) return null;

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [];
  if (hasContent) tabs.push({ key: 'content', label: 'Conteúdo', icon: FileText });
  if (hasAttachments) tabs.push({ key: 'materials', label: 'Materiais', icon: Paperclip, count: attachments.length });

  // Auto-select first available tab
  if (tabs.length > 0 && !tabs.find((t) => t.key === tab)) {
    setTab(tabs[0].key);
  }

  if (tabs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Tab pills */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-muted/50 p-1 rounded-full w-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  tab === t.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {t.count !== undefined && (
                  <span className="text-xs text-muted-foreground">({t.count})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content tab */}
      {tab === 'content' && hasContent && (
        <div
          className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(lesson.content_html!),
          }}
        />
      )}

      {/* Materials tab */}
      {tab === 'materials' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {attachments.map((att) => (
            <a
              key={att.id}
              href={att.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-muted/50 transition-all group"
            >
              <span className="text-2xl">
                {FILE_ICONS[att.file_type || ''] || '📎'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {att.file_name}
                </p>
                {att.file_size && (
                  <p className="text-xs text-muted-foreground">
                    {formatSize(att.file_size)}
                  </p>
                )}
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
