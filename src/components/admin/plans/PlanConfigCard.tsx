import { useState, useEffect } from 'react';
import { TrendingUp, Zap, GraduationCap, Download, Eye, MousePointer, Star, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PlanConfig, PlanFeatures } from '@/hooks/useAdminPlans';

interface PlanConfigCardProps {
  plan: PlanConfig;
  onSave: (plan: PlanConfig) => Promise<void>;
  isSaving: boolean;
}

const LIMIT_OPTIONS = [
  { value: '1', label: '1' },
  { value: '3', label: '3' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '999', label: 'Ilimitado' },
];

interface FeatureToggleProps {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FeatureToggle({ icon: Icon, label, checked, onChange }: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function PlanConfigCard({ plan, onSave, isSaving }: PlanConfigCardProps) {
  const [localPlan, setLocalPlan] = useState<PlanConfig>(plan);

  // Sync local state when plan prop changes
  useEffect(() => {
    setLocalPlan(plan);
  }, [plan]);

  const updateFeature = (key: keyof PlanFeatures, value: boolean) => {
    setLocalPlan(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }));
  };

  const handleSave = async () => {
    await onSave(localPlan);
  };

  const isVip = plan.id === 'vip';
  const isPro = plan.id === 'pro';

  return (
    <div className={cn(
      "relative bg-card rounded-[24px] border border-border shadow-sm overflow-hidden flex flex-col",
      isPro && "ring-2 ring-primary/20"
    )}>
      {/* PRO badge */}
      {isPro && (
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-b-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-current" />
            Mais Escolhido
          </div>
        </div>
      )}

      {/* VIP gradient header */}
      {isVip && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-bold text-lg">Plano VIP</span>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className={cn("p-6 flex-1 flex flex-col", isPro && "pt-10")}>
        {/* Plan Name (only for non-VIP) */}
        {!isVip && (
          <h3 className="text-lg font-bold mb-6">{plan.name}</h3>
        )}

        {/* Price Input */}
        <div className="space-y-2 mb-4">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Preço Mensal (R$)
          </label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={localPlan.price}
            onChange={(e) => setLocalPlan(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            className="rounded-xl bg-muted/30"
          />
        </div>

        {/* Limit Select */}
        <div className="space-y-2 mb-6">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Limite de Análises/Mês
          </label>
          <Select
            value={String(localPlan.monthly_limit)}
            onValueChange={(v) => setLocalPlan(prev => ({ ...prev, monthly_limit: parseInt(v, 10) }))}
          >
            <SelectTrigger className="rounded-xl bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Features Section */}
        <div className="space-y-4 mb-6 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Funcionalidades
          </div>

          {/* App: Currículo USA */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-primary/80 mb-2">App: Currículo USA</div>
            <div className="space-y-0.5">
              <FeatureToggle
                icon={TrendingUp}
                label="Melhorias de Impacto"
                checked={localPlan.features.show_improvements}
                onChange={(v) => updateFeature('show_improvements', v)}
              />
              <FeatureToggle
                icon={Zap}
                label="Power Verbs"
                checked={localPlan.features.show_power_verbs}
                onChange={(v) => updateFeature('show_power_verbs', v)}
              />
              <FeatureToggle
                icon={GraduationCap}
                label="Guia de Entrevistas"
                checked={localPlan.features.show_cheat_sheet}
                onChange={(v) => updateFeature('show_cheat_sheet', v)}
              />
              <FeatureToggle
                icon={Download}
                label="Exportar PDF"
                checked={localPlan.features.allow_pdf}
                onChange={(v) => updateFeature('allow_pdf', v)}
              />
            </div>
          </div>

          {/* App: Job Marketplace (Future) */}
          <div className="space-y-1 opacity-50">
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              App: Job Marketplace
              <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded">Em breve</span>
            </div>
            <div className="space-y-0.5 pointer-events-none">
              <FeatureToggle
                icon={Eye}
                label="Ver Nomes de Empresas"
                checked={false}
                onChange={() => {}}
              />
              <FeatureToggle
                icon={MousePointer}
                label="Botão Aplicar Direto"
                checked={false}
                onChange={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Marketing Features */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recursos Marketing
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Bullets que aparecem na página de preços (separados por vírgula)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Textarea
            value={localPlan.display_features.join(', ')}
            onChange={(e) => setLocalPlan(prev => ({
              ...prev,
              display_features: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
            }))}
            className="rounded-xl text-sm bg-muted/30 min-h-[80px]"
            placeholder="Feature 1, Feature 2, Feature 3..."
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-xl py-3 font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
}
