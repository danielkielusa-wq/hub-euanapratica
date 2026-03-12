import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Eye, Calendar, FileText, FolderOpen, Upload, MessageCircle, Users, Settings } from 'lucide-react';

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
  materialsCount?: number;
  myFilesCount?: number;
  discussionCount?: number;
  showMentorTabs?: boolean;
  studentsCount?: number;
}

export function EspacoStickyTabs({
  activeTab,
  onTabChange,
  pendingTasks,
  upcomingSessions,
  materialsCount = 0,
  myFilesCount = 0,
  discussionCount = 0,
  showMentorTabs = false,
  studentsCount = 0,
}: EspacoStickyTabsProps) {
  const baseTabs: TabItem[] = [
    { value: 'overview', label: 'Visão Geral', icon: <Eye className="h-4 w-4" /> },
    { value: 'sessions', label: 'Sessões', icon: <Calendar className="h-4 w-4" />, badge: upcomingSessions > 0 ? upcomingSessions : undefined },
    { value: 'assignments', label: 'Tarefas', icon: <FileText className="h-4 w-4" />, badge: pendingTasks > 0 ? pendingTasks : undefined },
    { value: 'library', label: 'Materiais', icon: <FolderOpen className="h-4 w-4" />, badge: materialsCount > 0 ? materialsCount : undefined },
    { value: 'my-files', label: 'Meus Arquivos', icon: <Upload className="h-4 w-4" />, badge: myFilesCount > 0 ? myFilesCount : undefined },
    { value: 'discussao', label: 'Discussão', icon: <MessageCircle className="h-4 w-4" />, badge: discussionCount > 0 ? discussionCount : undefined },
  ];

  const mentorTabs: TabItem[] = showMentorTabs ? [
    { value: 'students', label: 'Alunos', icon: <Users className="h-4 w-4" />, badge: studentsCount > 0 ? studentsCount : undefined },
    { value: 'settings', label: 'Config', icon: <Settings className="h-4 w-4" /> },
  ] : [];

  const tabs = [...baseTabs, ...mentorTabs];

  return (
    <div className="sticky top-0 z-20 bg-card border-b border-border">
      <div className="px-4 lg:px-8 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 rounded-full",
                activeTab === tab.value
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {activeTab === tab.value && (
                <motion.div
                  layoutId="espacoActiveTab"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={cn(
                    "ml-1 px-2 py-0.5 text-xs font-semibold rounded-full",
                    activeTab === tab.value
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
