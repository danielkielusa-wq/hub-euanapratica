import { cn } from '@/lib/utils';
import { Eye, Calendar, FileText, Library, MessageCircle, Users, Settings } from 'lucide-react';

interface TabItem {
  value: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface EspacoStickyTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingTasks: number;
  upcomingSessions: number;
  discussionCount?: number;
  showMentorTabs?: boolean;
  studentsCount?: number;
}

export function EspacoStickyTabs({
  activeTab,
  onTabChange,
  pendingTasks,
  upcomingSessions,
  discussionCount = 0,
  showMentorTabs = false,
  studentsCount = 0,
}: EspacoStickyTabsProps) {
  const baseTabs: TabItem[] = [
    { value: 'overview', label: 'Visão Geral', icon: <Eye className="h-4 w-4" /> },
    { value: 'sessions', label: 'Sessões', icon: <Calendar className="h-4 w-4" />, badge: upcomingSessions > 0 ? upcomingSessions : undefined },
    { value: 'assignments', label: 'Tarefas', icon: <FileText className="h-4 w-4" />, badge: pendingTasks > 0 ? pendingTasks : undefined },
    { value: 'library', label: 'Biblioteca', icon: <Library className="h-4 w-4" /> },
    { value: 'discussao', label: 'Discussão', icon: <MessageCircle className="h-4 w-4" />, badge: discussionCount > 0 ? discussionCount : undefined },
  ];

  const mentorTabs: TabItem[] = showMentorTabs ? [
    { value: 'students', label: 'Alunos', icon: <Users className="h-4 w-4" />, badge: studentsCount > 0 ? studentsCount : undefined },
    { value: 'settings', label: 'Config', icon: <Settings className="h-4 w-4" /> },
  ] : [];

  const tabs = [...baseTabs, ...mentorTabs];

  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40 animate-fade-slide-up" style={{ animationDelay: '150ms' }}>
      <div className="max-w-6xl mx-auto">
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
              <span className="hidden sm:inline">{tab.label}</span>
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