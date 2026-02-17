import { useState, useEffect } from 'react';
import {
  Zap,
  Users,
  Crown,
  Percent,
  Save,
  Copy,
  Briefcase,
  Ticket,
  Languages,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FullPlanConfig, PlanFeatures, PlanDiscounts, PlanTheme } from '@/types/plans';

interface PlanCardProps {
  plan: FullPlanConfig;
  onSave: (plan: FullPlanConfig) => Promise<void>;
  isSaving: boolean;
}

const FEATURE_TOGGLES = [
  { key: 'community', label: 'Comunidade Exclusiva' },
  { key: 'hotseats', label: 'Hotseats Mensais' },
  { key: 'library', label: 'Biblioteca de Materiais' },
  { key: 'masterclass', label: 'Masterclass Mensal' },
] as const;

const DISCOUNT_FIELDS = [
  { key: 'base', label: 'Ofertas Base' },
  { key: 'consulting', label: 'Consultoria' },
  { key: 'curriculum', label: 'CV & LinkedIn' },
  { key: 'mentorship_group', label: 'Mentoria Grupo' },
  { key: 'mentorship_individual', label: 'Mentoria Individual' },
] as const;

function getHeaderGradient(theme: PlanTheme) {
  switch (theme) {
    case 'purple': return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white';
    case 'blue': return 'bg-primary text-primary-foreground';
    default: return 'bg-muted text-foreground';
  }
}

function getThemeClasses(theme: PlanTheme) {
  switch (theme) {
    case 'purple': return 'border-purple-200 shadow-purple-100';
    case 'blue': return 'border-primary/20 shadow-primary/10';
    default: return 'border-border';
  }
}

export function PlanCard({ plan, onSave, isSaving }: PlanCardProps) {
  const [localPlan, setLocalPlan] = useState<FullPlanConfig>(plan);

  useEffect(() => {
    setLocalPlan(plan);
  }, [plan]);

  const updateField = <K extends keyof FullPlanConfig>(field: K, value: FullPlanConfig[K]) => {
    setLocalPlan(prev => ({ ...prev, [field]: value }));
  };

  const updateFeature = <K extends keyof PlanFeatures>(key: K, value: PlanFeatures[K]) => {
    setLocalPlan(prev => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }));
  };

  const updateDiscount = (key: keyof PlanDiscounts, value: number) => {
    setLocalPlan(prev => ({
      ...prev,
      features: {
        ...prev.features,
        discounts: { ...prev.features.discounts, [key]: value },
      },
    }));
  };

  const handleSave = async () => {
    await onSave(localPlan);
  };

  const annualDiscount = localPlan.price_monthly > 0 
    ? Math.round((1 - (localPlan.price_annual / (localPlan.price_monthly * 12))) * 100)
    : 0;

  return (
    <div className={cn(
      "relative bg-card rounded-[32px] border shadow-sm transition-all overflow-hidden flex flex-col",
      !localPlan.is_active && "opacity-60 grayscale",
      getThemeClasses(localPlan.theme)
    )}>
      {/* Header */}
      <div className={cn("p-6 relative", getHeaderGradient(localPlan.theme))}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Input
              type="text"
              value={localPlan.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={cn(
                "bg-transparent text-xl font-black border-b border-transparent focus:border-white/40 transition-all w-full px-0",
                localPlan.theme === 'gray' ? 'text-foreground' : 'text-white'
              )}
            />
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                localPlan.theme === 'gray' 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-white/20 text-white'
              )}>
                {localPlan.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
          <Switch
            checked={localPlan.is_active}
            onCheckedChange={(checked) => updateField('is_active', checked)}
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className={cn(
            "p-3 rounded-xl",
            localPlan.theme === 'gray' ? 'bg-background' : 'bg-white/10 backdrop-blur-sm'
          )}>
            <label className={cn(
              "text-[9px] font-bold uppercase tracking-widest mb-1 block",
              localPlan.theme === 'gray' ? 'text-muted-foreground' : 'text-white/70'
            )}>
              Mensal (R$)
            </label>
            <Input
              type="number"
              value={localPlan.price_monthly}
              onChange={(e) => updateField('price_monthly', Number(e.target.value))}
              className={cn(
                "bg-transparent font-bold text-lg px-0 border-0",
                localPlan.theme === 'gray' ? 'text-foreground' : 'text-white'
              )}
            />
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            localPlan.theme === 'gray' ? 'bg-background' : 'bg-white/10 backdrop-blur-sm'
          )}>
            <label className={cn(
              "text-[9px] font-bold uppercase tracking-widest mb-1 block",
              localPlan.theme === 'gray' ? 'text-muted-foreground' : 'text-white/70'
            )}>
              Anual (R$)
            </label>
            <div className="flex items-center">
              <Input
                type="number"
                value={localPlan.price_annual}
                onChange={(e) => updateField('price_annual', Number(e.target.value))}
                className={cn(
                  "bg-transparent font-bold text-lg px-0 border-0 flex-1",
                  localPlan.theme === 'gray' ? 'text-foreground' : 'text-white'
                )}
              />
              {annualDiscount > 0 && (
                <span className={cn(
                  "text-[9px] font-bold ml-1",
                  localPlan.theme === 'gray' ? 'text-green-600' : 'text-green-300'
                )}>
                  -{annualDiscount}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 space-y-8 flex-1 overflow-y-auto max-h-[600px]">
        
        {/* 1. ResumePass AI */}
        <section>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap size={14} className="text-primary" /> ResumePass AI
          </h3>
          <div className="bg-muted/50 rounded-2xl p-4 border border-border">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-foreground">Limite Mensal</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localPlan.features.resume_pass_limit}
                  onChange={(e) => updateFeature('resume_pass_limit', Number(e.target.value))}
                  className="w-16 text-center font-bold"
                />
                <span className="text-xs text-muted-foreground font-medium">análises</span>
              </div>
            </div>
          </div>
        </section>

        {/* 1b. Title Translator */}
        <section>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Languages size={14} className="text-primary" /> Title Translator
          </h3>
          <div className="bg-muted/50 rounded-2xl p-4 border border-border">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-foreground">Limite Mensal</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={localPlan.features.title_translator_limit}
                  onChange={(e) => updateFeature('title_translator_limit', Number(e.target.value))}
                  className="w-16 text-center font-bold"
                />
                <span className="text-xs text-muted-foreground font-medium">traduções</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Features */}
        <section>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={14} className="text-primary" /> Acesso & Features
          </h3>
          <div className="space-y-3">
            {FEATURE_TOGGLES.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors">
                <span className="text-sm font-medium text-muted-foreground">{feature.label}</span>
                <Switch
                  checked={localPlan.features[feature.key]}
                  onCheckedChange={(checked) => updateFeature(feature.key, checked)}
                />
              </div>
            ))}

            {/* Job Concierge */}
            <div className="border-t border-border pt-3 mt-1">
              <div className="flex items-center justify-between p-3">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase size={14} /> Job Concierge
                </span>
                <Switch
                  checked={localPlan.features.job_concierge}
                  onCheckedChange={(checked) => updateFeature('job_concierge', checked)}
                />
              </div>
              {localPlan.features.job_concierge && (
                <div className="px-3 pb-2 animate-fade-in">
                  <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg">
                    <span className="text-xs text-muted-foreground font-bold">Vagas Curadas/Mês:</span>
                    <Input
                      type="number"
                      value={localPlan.features.job_concierge_count}
                      onChange={(e) => updateFeature('job_concierge_count', Number(e.target.value))}
                      className="w-16 text-center text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Priority & VIP */}
        <section>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Crown size={14} className="text-amber-500" /> Prioridade & Status
          </h3>
          <div className={cn(
            "rounded-2xl border p-4",
            localPlan.theme === 'purple' ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30' : 'bg-muted/50 border-border'
          )}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Prioridade nos Hotseats</span>
                <input
                  type="checkbox"
                  checked={localPlan.features.hotseat_priority}
                  onChange={(e) => updateFeature('hotseat_priority', e.target.checked)}
                  className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Garantia de Vaga</span>
                <input
                  type="checkbox"
                  checked={localPlan.features.hotseat_guaranteed}
                  onChange={(e) => updateFeature('hotseat_guaranteed', e.target.checked)}
                  className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Discounts & Coupons */}
        <section>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Percent size={14} className="text-green-500" /> Descontos Automáticos (%)
          </h3>
          
          {/* Coupon Code */}
          <div className="mb-4 bg-green-50/50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-800/30">
            <label className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase mb-2 flex items-center gap-1">
              <Ticket size={12} /> Cupom Aplicado (Checkout)
            </label>
            <Input
              type="text"
              placeholder="EX: VIP20OFF"
              value={localPlan.features.coupon_code}
              onChange={(e) => updateFeature('coupon_code', e.target.value.toUpperCase())}
              className="bg-background border-green-200 dark:border-green-800 font-black placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="space-y-2">
            {DISCOUNT_FIELDS.map((d) => (
              <div key={d.key} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                <span className="text-xs font-medium text-muted-foreground">{d.label}</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={localPlan.features.discounts[d.key]}
                    onChange={(e) => updateDiscount(d.key, Number(e.target.value))}
                    className="w-12 p-1 text-right text-xs font-bold"
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border bg-muted/30 flex justify-between items-center">
        <button className="text-muted-foreground hover:text-foreground transition-colors" title="Duplicar Plano">
          <Copy size={18} />
        </button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
