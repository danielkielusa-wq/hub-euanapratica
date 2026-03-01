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
  iconColor: string;
  iconBg: string;
  barColor: string;
  getValues: (props: QuickToolsStripProps) => { value: string; total: string; percent: number };
}

const TOOL_DEFS: ToolDef[] = [
  {
    key: 'resume_pass',
    label: 'ResumePass AI',
    icon: FileSearch,
    route: '/curriculo',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100',
    barColor: 'bg-blue-500',
    getValues: (p) => {
      const total = 20; // typical plan total
      const used = total - p.remainingCredits;
      return {
        value: String(p.remainingCredits),
        total: String(total),
        percent: Math.min(100, Math.round((used / total) * 100)),
      };
    },
  },
  {
    key: 'title_translator',
    label: 'Translator',
    icon: Languages,
    route: '/title-translator',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-100',
    barColor: 'bg-purple-500',
    getValues: () => ({ value: '∞', total: '∞', percent: 100 }),
  },
  {
    key: 'prime_jobs',
    label: 'Prime Jobs',
    icon: Briefcase,
    route: '/prime-jobs',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100',
    barColor: 'bg-green-500',
    getValues: (p) => {
      const count = p.primeJobsNewCount ?? 0;
      return {
        value: count > 0 ? String(count) : '—',
        total: 'novas',
        percent: count > 0 ? 60 : 0,
      };
    },
  },
];

export function QuickToolsStrip(props: QuickToolsStripProps) {
  const navigate = useNavigate();
  const { config } = props;

  const tools = TOOL_DEFS.filter((t) => config.quick_tools.includes(t.key));
  if (tools.length === 0) return null;

  return (
    <div className="bg-white dark:bg-card rounded-xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-700 dark:text-foreground font-semibold">Créditos</h3>
      </div>

      <div className="space-y-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const vals = tool.getValues(props);
          return (
            <button
              key={tool.key}
              onClick={() => navigate(tool.route)}
              className="w-full text-left"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tool.iconBg} ${tool.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-foreground">{tool.label}</div>
                    <div className="text-xs text-gray-400 dark:text-muted-foreground">{vals.value} / {vals.total}</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-600 dark:text-muted-foreground">{vals.percent}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${tool.barColor} rounded-full transition-all duration-700`}
                  style={{ width: `${vals.percent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
