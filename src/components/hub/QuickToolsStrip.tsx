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
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-black text-gray-900">Ferramentas</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const stat = tool.getStat(props);
          return (
            <button
              key={tool.key}
              onClick={() => navigate(tool.route)}
              className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 md:p-5 hover:shadow-md hover:border-indigo-100 transition-all group text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tool.iconBg} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{tool.label}</p>
              <p className="text-xs text-gray-400 font-medium">{stat}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
