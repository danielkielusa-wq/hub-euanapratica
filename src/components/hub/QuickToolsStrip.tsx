import { useNavigate } from 'react-router-dom';
import { FileSearch, Languages, Briefcase } from 'lucide-react';
import type { HubDashboardConfig } from '@/types/hub';

interface QuickToolsStripProps {
  config: HubDashboardConfig;
  remainingCredits: number;
  primeJobsNewCount?: number;
}

interface ToolDef {
  key: string;
  label: string;
  icon: typeof FileSearch;
  route: string;
  iconBg: string;
  getStat: (props: QuickToolsStripProps) => string;
}

const TOOL_DEFS: ToolDef[] = [
  {
    key: 'resume_pass',
    label: 'ResumePass AI',
    icon: FileSearch,
    route: '/curriculo',
    iconBg: 'bg-indigo-50 text-indigo-600',
    getStat: (p) => `${p.remainingCredits} crédito${p.remainingCredits !== 1 ? 's' : ''}`,
  },
  {
    key: 'title_translator',
    label: 'Title Translator',
    icon: Languages,
    route: '/title-translator',
    iconBg: 'bg-violet-50 text-violet-600',
    getStat: () => 'Ilimitado',
  },
  {
    key: 'prime_jobs',
    label: 'Prime Jobs',
    icon: Briefcase,
    route: '/prime-jobs',
    iconBg: 'bg-emerald-50 text-emerald-600',
    getStat: (p) =>
      p.primeJobsNewCount != null && p.primeJobsNewCount > 0
        ? `${p.primeJobsNewCount} nova${p.primeJobsNewCount !== 1 ? 's' : ''}`
        : 'Explorar',
  },
];

export function QuickToolsStrip(props: QuickToolsStripProps) {
  const navigate = useNavigate();
  const { config } = props;

  const tools = TOOL_DEFS.filter((t) => config.quick_tools.includes(t.key));
  if (tools.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-medium text-foreground mb-4">Ferramentas</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const stat = tool.getStat(props);
          return (
            <button
              key={tool.key}
              onClick={() => navigate(tool.route)}
              className="bg-card rounded-md border-0 shadow-md hover:shadow-lg transition-all duration-200 p-5 group text-left"
            >
              <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center mb-3 ${tool.iconBg}`}>
                <Icon size={20} />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">{tool.label}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
