import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Check, Briefcase, Target, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Option constants (accent-free, matching LeadFormPage) ─────────────────

const AREAS = ['Tecnologia', 'Engenharia', 'Negocios / Administracao', 'Marketing / Comunicacao', 'Saude', 'Estudante', 'Outro'];
const EXPERIENCE = ['Menos de 2 anos', '2 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'];
const ENGLISH = ['Basico', 'Intermediario', 'Avancado', 'Fluente'];
const OBJECTIVES = ['Emprego remoto em dolar', 'Imigrar / Green Card trabalhando na minha area', 'Estudar nos EUA como porta de entrada', 'Ainda nao tenho clareza, quero entender minhas opcoes'];
const VISA_STATUS = ['Ja tenho visto de trabalho ou Green Card', 'Processo de visto / imigracao em andamento', 'Tenho/tive apenas visto de turista', 'Ainda nao iniciei nada'];
const TIMELINE = ['Ja estou em movimento / proximos 3 meses', 'Entre 3 e 6 meses', 'Entre 6 e 12 meses', 'Ainda nao tenho prazo definido'];
const FAMILY = ['Sozinho(a)', 'Com conjuge / companheiro(a)', 'Com familia e filhos', 'Ainda nao pensei sobre isso'];
const INCOME = ['Ate R$ 5 mil', 'De R$ 5 mil a R$ 10 mil', 'De R$ 10 mil a R$ 20 mil', 'Acima de R$ 20 mil', 'Prefiro nao responder'];
const INVESTMENTS = ['Ate R$500', 'De R$500 a R$2.000', 'De R$2.000 a R$5.000', 'Acima de R$5.000', 'Prefiro nao responder'];
const OBSTACLES = ['Nenhum - estou pronto(a)', 'Financeiro', 'Tempo / rotina', 'Ingles', 'Medo de tomar uma decisao errada', 'Falta de apoio do conjuge / familia', 'Outro'];

// ─── Types ─────────────────────────────────────────────────────────────────

interface CareerAssessmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Record<string, string | null>;
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

interface FormData {
  area_profissional: string;
  cargo_atual: string;
  trabalha_internacional: string;
  anos_experiencia: string;
  nivel_ingles: string;
  objetivo: string;
  status_visto: string;
  prazo_movimento: string;
  composicao_familiar: string;
  faixa_renda: string;
  faixa_investimento: string;
  principal_obstaculo: string;
  maior_duvida: string;
}

const STEP_CONFIG = [
  { step: 1 as Step, title: 'Perfil Profissional', subtitle: 'Conte-nos sobre sua trajetoria', Icon: Briefcase },
  { step: 2 as Step, title: 'Objetivos e Momento', subtitle: 'Qual o melhor caminho para voce?', Icon: Target },
  { step: 3 as Step, title: 'Investimento e Desafios', subtitle: 'Ultima etapa para sua analise!', Icon: DollarSign },
];

// ─── Helper: matches value against options (handles accented vs non-accented) ──

function normalizeForMatch(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function findMatchingOption(value: string | null, options: string[]): string {
  if (!value) return '';
  const norm = normalizeForMatch(value);
  return options.find((opt) => normalizeForMatch(opt) === norm) || value;
}

// ─── Select Card ───────────────────────────────────────────────────────────

function SelectCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 text-left w-full p-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-[#7367F0] bg-[#7367F0]/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          selected ? 'border-[#7367F0] bg-[#7367F0]' : 'border-gray-300'
        }`}
      >
        {selected && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <span className="text-sm text-gray-800 flex-1 leading-tight">{label}</span>
    </button>
  );
}

// ─── Step Components ───────────────────────────────────────────────────────

function Step1({ data, onChange, errors }: { data: FormData; onChange: (f: keyof FormData, v: string) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Qual sua area de atuacao?</Label>
        <div className="grid grid-cols-1 gap-2">
          {AREAS.map((a) => (
            <SelectCard key={a} label={a} selected={data.area_profissional === a} onClick={() => onChange('area_profissional', a)} />
          ))}
        </div>
        {errors.area_profissional && <p className="text-xs text-destructive">{errors.area_profissional}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Qual seu cargo atual?</Label>
        <Input
          value={data.cargo_atual}
          onChange={(e) => onChange('cargo_atual', e.target.value)}
          placeholder="Ex: Desenvolvedor Senior, Gerente de Projeto..."
          className={errors.cargo_atual ? 'border-destructive' : ''}
        />
        {errors.cargo_atual && <p className="text-xs text-destructive">{errors.cargo_atual}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Voce trabalha para uma empresa internacional?</Label>
        <div className="grid grid-cols-2 gap-2">
          <SelectCard label="Sim" selected={data.trabalha_internacional === 'true'} onClick={() => onChange('trabalha_internacional', 'true')} />
          <SelectCard label="Nao" selected={data.trabalha_internacional === 'false'} onClick={() => onChange('trabalha_internacional', 'false')} />
        </div>
        {errors.trabalha_internacional && <p className="text-xs text-destructive">{errors.trabalha_internacional}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Quantos anos de experiencia?</Label>
        <div className="grid grid-cols-2 gap-2">
          {EXPERIENCE.map((e) => (
            <SelectCard key={e} label={e} selected={data.anos_experiencia === e} onClick={() => onChange('anos_experiencia', e)} />
          ))}
        </div>
        {errors.anos_experiencia && <p className="text-xs text-destructive">{errors.anos_experiencia}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Qual seu nivel de ingles?</Label>
        <div className="grid grid-cols-2 gap-2">
          {ENGLISH.map((e) => (
            <SelectCard key={e} label={e} selected={data.nivel_ingles === e} onClick={() => onChange('nivel_ingles', e)} />
          ))}
        </div>
        {errors.nivel_ingles && <p className="text-xs text-destructive">{errors.nivel_ingles}</p>}
      </div>
    </div>
  );
}

function Step2({ data, onChange, errors }: { data: FormData; onChange: (f: keyof FormData, v: string) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">O que voce busca nos proximos 6-12 meses?</Label>
        <div className="grid grid-cols-1 gap-2">
          {OBJECTIVES.map((o) => (
            <SelectCard key={o} label={o} selected={data.objetivo === o} onClick={() => onChange('objetivo', o)} />
          ))}
        </div>
        {errors.objetivo && <p className="text-xs text-destructive">{errors.objetivo}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Sua situacao em relacao a vistos?</Label>
        <div className="grid grid-cols-1 gap-2">
          {VISA_STATUS.map((v) => (
            <SelectCard key={v} label={v} selected={data.status_visto === v} onClick={() => onChange('status_visto', v)} />
          ))}
        </div>
        {errors.status_visto && <p className="text-xs text-destructive">{errors.status_visto}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Quando pretende dar o proximo passo?</Label>
        <div className="grid grid-cols-1 gap-2">
          {TIMELINE.map((t) => (
            <SelectCard key={t} label={t} selected={data.prazo_movimento === t} onClick={() => onChange('prazo_movimento', t)} />
          ))}
        </div>
        {errors.prazo_movimento && <p className="text-xs text-destructive">{errors.prazo_movimento}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Voce pensa em ir para os EUA:</Label>
        <div className="grid grid-cols-1 gap-2">
          {FAMILY.map((f) => (
            <SelectCard key={f} label={f} selected={data.composicao_familiar === f} onClick={() => onChange('composicao_familiar', f)} />
          ))}
        </div>
        {errors.composicao_familiar && <p className="text-xs text-destructive">{errors.composicao_familiar}</p>}
      </div>
    </div>
  );
}

function Step3({ data, onChange, errors }: { data: FormData; onChange: (f: keyof FormData, v: string) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Faixa de renda mensal atual?</Label>
        <div className="grid grid-cols-1 gap-2">
          {INCOME.map((i) => (
            <SelectCard key={i} label={i} selected={data.faixa_renda === i} onClick={() => onChange('faixa_renda', i)} />
          ))}
        </div>
        {errors.faixa_renda && <p className="text-xs text-destructive">{errors.faixa_renda}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Faixa de investimento para acelerar sua carreira?</Label>
        <div className="grid grid-cols-1 gap-2">
          {INVESTMENTS.map((i) => (
            <SelectCard key={i} label={i} selected={data.faixa_investimento === i} onClick={() => onChange('faixa_investimento', i)} />
          ))}
        </div>
        {errors.faixa_investimento && <p className="text-xs text-destructive">{errors.faixa_investimento}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Qual seria seu principal obstaculo para comecar?</Label>
        <div className="grid grid-cols-1 gap-2">
          {OBSTACLES.map((o) => (
            <SelectCard key={o} label={o} selected={data.principal_obstaculo === o} onClick={() => onChange('principal_obstaculo', o)} />
          ))}
        </div>
        {errors.principal_obstaculo && <p className="text-xs text-destructive">{errors.principal_obstaculo}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Maior duvida ou preocupacao hoje
          <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
        </Label>
        <Textarea
          value={data.maior_duvida}
          onChange={(e) => onChange('maior_duvida', e.target.value)}
          placeholder="Ex: Tenho receio de nao conseguir validar meu diploma..."
          rows={3}
          maxLength={500}
        />
      </div>
    </div>
  );
}

// ─── Progress Indicator ────────────────────────────────────────────────────

function StepProgress({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEP_CONFIG.map((s, i) => {
        const isCompleted = s.step < currentStep;
        const isCurrent = s.step === currentStep;
        const StepIcon = s.Icon;

        return (
          <div key={s.step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-[#7367F0] text-white shadow-md scale-110'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isCurrent ? 'text-[#7367F0]' : 'text-gray-400'}`}>
                {s.title.split(' ')[0]}
              </span>
            </div>
            {i < STEP_CONFIG.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function CareerAssessmentSheet({ open, onOpenChange, initialData, onComplete }: CareerAssessmentSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Initialize form from profile data, normalizing accented values to match options
  const [formData, setFormData] = useState<FormData>(() => ({
    area_profissional: findMatchingOption(initialData.area_profissional, AREAS),
    cargo_atual: initialData.cargo_atual || '',
    trabalha_internacional: initialData.trabalha_internacional || '',
    anos_experiencia: findMatchingOption(initialData.anos_experiencia, EXPERIENCE),
    nivel_ingles: findMatchingOption(initialData.nivel_ingles, ENGLISH),
    objetivo: findMatchingOption(initialData.objetivo, OBJECTIVES),
    status_visto: findMatchingOption(initialData.status_visto, VISA_STATUS),
    prazo_movimento: findMatchingOption(initialData.prazo_movimento, TIMELINE),
    composicao_familiar: findMatchingOption(initialData.composicao_familiar, FAMILY),
    faixa_renda: findMatchingOption(initialData.faixa_renda, INCOME),
    faixa_investimento: findMatchingOption(initialData.faixa_investimento, INVESTMENTS),
    principal_obstaculo: findMatchingOption(initialData.principal_obstaculo, OBSTACLES),
    maior_duvida: initialData.maior_duvida || '',
  }));

  const [currentStep, setCurrentStep] = useState<Step>(() => {
    // Start on the first step that has missing required fields
    const step1Fields = ['area_profissional', 'cargo_atual', 'trabalha_internacional', 'anos_experiencia', 'nivel_ingles'] as const;
    const step2Fields = ['objetivo', 'status_visto', 'prazo_movimento', 'composicao_familiar'] as const;

    const step1Missing = step1Fields.some((f) => !initialData[f] || initialData[f]!.trim() === '');
    if (step1Missing) return 1;

    const step2Missing = step2Fields.some((f) => !initialData[f] || initialData[f]!.trim() === '');
    if (step2Missing) return 2;

    return 3;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.area_profissional) errs.area_profissional = 'Selecione uma opcao';
      if (formData.cargo_atual.trim().length < 2) errs.cargo_atual = 'Informe seu cargo atual';
      if (!formData.trabalha_internacional) errs.trabalha_internacional = 'Selecione uma opcao';
      if (!formData.anos_experiencia) errs.anos_experiencia = 'Selecione uma opcao';
      if (!formData.nivel_ingles) errs.nivel_ingles = 'Selecione uma opcao';
    }
    if (currentStep === 2) {
      if (!formData.objetivo) errs.objetivo = 'Selecione uma opcao';
      if (!formData.status_visto) errs.status_visto = 'Selecione uma opcao';
      if (!formData.prazo_movimento) errs.prazo_movimento = 'Selecione uma opcao';
      if (!formData.composicao_familiar) errs.composicao_familiar = 'Selecione uma opcao';
    }
    if (currentStep === 3) {
      if (!formData.faixa_renda) errs.faixa_renda = 'Selecione uma opcao';
      if (!formData.faixa_investimento) errs.faixa_investimento = 'Selecione uma opcao';
      if (!formData.principal_obstaculo) errs.principal_obstaculo = 'Selecione uma opcao';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getStepFields = (step: Step): Partial<FormData> => {
    if (step === 1) {
      return {
        area_profissional: formData.area_profissional,
        cargo_atual: formData.cargo_atual,
        trabalha_internacional: formData.trabalha_internacional,
        anos_experiencia: formData.anos_experiencia,
        nivel_ingles: formData.nivel_ingles,
      };
    }
    if (step === 2) {
      return {
        objetivo: formData.objetivo,
        status_visto: formData.status_visto,
        prazo_movimento: formData.prazo_movimento,
        composicao_familiar: formData.composicao_familiar,
      };
    }
    return {
      faixa_renda: formData.faixa_renda,
      faixa_investimento: formData.faixa_investimento,
      principal_obstaculo: formData.principal_obstaculo,
      maior_duvida: formData.maior_duvida,
    };
  };

  const saveStepToProfile = async (step: Step) => {
    if (!user?.id) return;
    const fields = getStepFields(step);
    const { error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', user.id);
    if (error) throw error;
  };

  const handleNext = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await saveStepToProfile(currentStep);

      if (currentStep < 3) {
        setCurrentStep((s) => (s + 1) as Step);
      } else {
        // Final step: trigger report generation
        const { data, error } = await supabase.rpc('generate_career_report_from_profile', {
          p_user_id: user!.id,
        });

        if (error) {
          toast.error('Erro ao gerar relatorio: ' + error.message);
          return;
        }

        const result = data as unknown as Array<{ evaluation_id: string; status: string }>;
        const status = result?.[0]?.status;

        if (status === 'already_exists') {
          toast.info('Voce ja possui um diagnostico gerado!');
        } else {
          toast.success('Seu relatorio esta sendo gerado! Voce sera notificado quando estiver pronto.');
        }

        queryClient.invalidateQueries({ queryKey: ['career-assessment-profile'] });
        queryClient.invalidateQueries({ queryKey: ['career-insights'] });
        queryClient.invalidateQueries({ queryKey: ['career-evaluation-status'] });
        onComplete();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => (s - 1) as Step);
  };

  const stepConfig = STEP_CONFIG[currentStep - 1];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
        <div className="flex-shrink-0 px-6 pt-6 pb-2">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-bold">{stepConfig.title}</SheetTitle>
            <p className="text-sm text-muted-foreground">{stepConfig.subtitle}</p>
          </SheetHeader>

          <StepProgress currentStep={currentStep} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {currentStep === 1 && <Step1 data={formData} onChange={handleChange} errors={errors} />}
          {currentStep === 2 && <Step2 data={formData} onChange={handleChange} errors={errors} />}
          {currentStep === 3 && <Step3 data={formData} onChange={handleChange} errors={errors} />}
        </div>

        {/* Sticky bottom nav */}
        <div className="flex-shrink-0 p-4 bg-white dark:bg-card border-t flex items-center gap-3">
          {currentStep > 1 && (
            <Button variant="ghost" onClick={handleBack} disabled={isSaving}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
          <Button
            className="flex-1 bg-[#7367F0] hover:bg-[#6358e0] text-white"
            onClick={handleNext}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : currentStep === 3 ? (
              <Sparkles className="w-4 h-4 mr-2" />
            ) : null}
            {isSaving
              ? 'Salvando...'
              : currentStep === 3
              ? 'Gerar Meu Diagnostico'
              : 'Proximo'}
            {!isSaving && currentStep < 3 && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
