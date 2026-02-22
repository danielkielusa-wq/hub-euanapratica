import { Copy, ExternalLink, Check, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { PriorityItem } from '@/hooks/useAIDailyPriorities';
import { cn } from '@/lib/utils';

const TEMP_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'muito-quente': { bg: 'bg-red-100', text: 'text-red-700', label: 'Muito Quente' },
  'quente': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Quente' },
  'morno': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Morno' },
  'frio': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Frio' },
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-400',
  low: 'border-l-gray-300',
};

interface PriorityCardProps {
  item: PriorityItem;
  isCompleted: boolean;
  onMarkDone: (item: PriorityItem) => void;
}

export function PriorityCard({ item, isCompleted, onMarkDone }: PriorityCardProps) {
  const { toast } = useToast();

  const tempStyle = TEMP_STYLES[item.temperature] || TEMP_STYLES['morno'];
  const borderStyle = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES['medium'];

  const copyMessage = () => {
    if (!item.suggested_message) return;
    navigator.clipboard.writeText(item.suggested_message).then(() => {
      toast({ title: 'Mensagem copiada!' });
    }).catch(() => {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    });
  };

  const openWhatsApp = () => {
    if (!item.lead_phone) {
      toast({ title: 'Telefone não disponível', variant: 'destructive' });
      return;
    }
    const phone = item.lead_phone.replace(/\D/g, '');
    const text = encodeURIComponent(item.suggested_message || '');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-4 space-y-3 border-l-4 transition-all',
        borderStyle,
        isCompleted && 'opacity-50'
      )}
    >
      {/* Header: name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold text-sm text-gray-900', isCompleted && 'line-through')}>
            {item.lead_name}
          </p>
          <p className="text-xs text-gray-400 truncate">{item.lead_email}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border-0', tempStyle.bg, tempStyle.text)}>
            {tempStyle.label}
          </Badge>
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">
            {item.score ?? '–'}
          </span>
        </div>
      </div>

      {/* Reason + action */}
      <div className="space-y-1">
        <p className="text-xs text-gray-600 leading-relaxed">{item.reason}</p>
        <p className="text-xs font-medium text-indigo-700">{item.suggested_action}</p>
      </div>

      {/* Product badge */}
      {item.product_to_offer && (
        <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">
          {item.product_to_offer}
        </Badge>
      )}

      {/* Suggested message (collapsible) */}
      {item.suggested_message && (
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed border border-gray-100">
          <p className="font-medium text-gray-500 mb-1 text-[10px] uppercase tracking-wider">
            Mensagem sugerida:
          </p>
          {item.suggested_message}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {item.suggested_message && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs rounded-xl gap-1.5"
            onClick={copyMessage}
            disabled={isCompleted}
          >
            <Copy className="w-3 h-3" />
            Copiar
          </Button>
        )}

        {item.lead_phone && item.channel === 'whatsapp' && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs rounded-xl gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
            onClick={openWhatsApp}
            disabled={isCompleted}
          >
            <MessageSquare className="w-3 h-3" />
            WhatsApp
          </Button>
        )}

        {item.lead_phone && item.channel !== 'whatsapp' && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs rounded-xl gap-1.5"
            onClick={openWhatsApp}
            disabled={isCompleted}
          >
            <ExternalLink className="w-3 h-3" />
            WhatsApp
          </Button>
        )}

        <div className="flex-1" />

        {isCompleted ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Check className="w-3.5 h-3.5" />
            Feito
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs rounded-xl gap-1.5 text-emerald-700 hover:bg-emerald-50"
            onClick={() => onMarkDone(item)}
          >
            <Check className="w-3 h-3" />
            Feito
          </Button>
        )}
      </div>
    </div>
  );
}
