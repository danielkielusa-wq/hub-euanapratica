import { cn } from '@/lib/utils';
import { Eye, Calendar, FileText, Library, MessageCircle } from 'lucide-react';

type TabValue = 'overview' | 'sessions' | 'assignments' | 'library' | 'discussao';

interface TabItem {
  value: TabValue;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface EspacoStickyTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  pendingTasks: number;
  upcomingSessions: number;
  discussionCount?: number;
}

export function EspacoStickyTabs({
  activeTab,
  onTabChange,
  pendingTasks,
  upcomingSessions,
  discussionCount = 0,
}: EspacoStickyTabsProps) {
  const tabs: TabItem[] = [
    { value: 'overview', label: 'Visão Geral', icon: <Eye className="h-4 w-4" /> },
    { value: 'sessions', label: 'Sessões', icon: <Calendar className="h-4 w-4" />, badge: upcomingSessions > 0 ? upcomingSessions : undefined },
    { value: 'assignments', label: 'Tarefas', icon: <FileText className="h-4 w-4" />, badge: pendingTasks > 0 ? pendingTasks : undefined },
    { value: 'library', label: 'Biblioteca', icon: <Library className="h-4 w-4" /> },
    { value: 'discussao', label: 'Discussão', icon: <MessageCircle className="h-4 w-4" />, badge: discussionCount > 0 ? discussionCount : undefined },
  ];

  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40 animate-fade-slide-up" style={{ animationDelay: '150ms' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                "border-b-2 min-h-[48px]",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
