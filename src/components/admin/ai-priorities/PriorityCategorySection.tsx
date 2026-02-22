import {
  Flame, Clock, Users, DollarSign, Bell, MessageSquare, Phone,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PriorityCard } from './PriorityCard';
import type { PriorityCategory, PriorityItem, MentoringGroupItem } from '@/hooks/useAIDailyPriorities';

const ICON_MAP: Record<string, LucideIcon> = {
  'flame': Flame,
  'clock': Clock,
  'users': Users,
  'dollar-sign': DollarSign,
  'bell': Bell,
  'message-square': MessageSquare,
  'phone': Phone,
};

interface PriorityCategorySectionProps {
  category: PriorityCategory;
  completedItems: Set<string>;
  onMarkDone: (item: PriorityItem) => void;
}

function isMentoringGroup(item: any): item is MentoringGroupItem {
  return 'group_theme' in item && 'leads' in item;
}

function MentoringGroupCard({ group }: { group: MentoringGroupItem }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 border-l-4 border-l-indigo-400">
      <div className="space-y-1">
        <p className="font-semibold text-sm text-gray-900">{group.group_theme}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
            Fase {group.rota_phase}
          </Badge>
          <span className="text-xs text-gray-400">{group.leads.length} leads</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {group.leads.map((lead) => (
          <div key={lead.lead_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
            <span className="text-xs font-medium text-gray-700">{lead.lead_name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{lead.phase}</span>
              <span className="text-[10px] font-bold text-gray-500 bg-white rounded-full px-1.5 py-0.5">
                {lead.score}
              </span>
            </div>
          </div>
        ))}
      </div>

      {group.suggested_session_topic && (
        <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700 leading-relaxed border border-indigo-100">
          <p className="font-medium text-indigo-500 mb-1 text-[10px] uppercase tracking-wider">
            Tópico sugerido:
          </p>
          {group.suggested_session_topic}
        </div>
      )}
    </div>
  );
}

export function PriorityCategorySection({ category, completedItems, onMarkDone }: PriorityCategorySectionProps) {
  const Icon = ICON_MAP[category.icon] || Bell;

  if (!category.items || category.items.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-gray-400">Nenhum item nesta categoria hoje.</p>
      </div>
    );
  }

  // Check if this is the mentoring_groups category
  const isMentoringCategory = category.id === 'mentoring_groups';

  return (
    <div className="space-y-3">
      {/* Category header */}
      <div className="flex items-center gap-2 pb-1">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{category.title}</span>
        <Badge variant="outline" className="text-[10px] rounded-full px-1.5 py-0 bg-gray-50">
          {category.items.length}
        </Badge>
      </div>

      {category.description && (
        <p className="text-xs text-gray-400 -mt-1">{category.description}</p>
      )}

      {/* Items */}
      <div className="space-y-3">
        {isMentoringCategory
          ? (category.items as MentoringGroupItem[]).map((group, i) => (
              <MentoringGroupCard key={i} group={group} />
            ))
          : (category.items as PriorityItem[]).map((item) => (
              <PriorityCard
                key={item.lead_id}
                item={item}
                isCompleted={completedItems.has(item.lead_id)}
                onMarkDone={onMarkDone}
              />
            ))
        }
      </div>
    </div>
  );
}
