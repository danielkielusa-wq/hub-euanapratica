import { useState, useCallback, useRef, useEffect } from "react";
import { LeadFormData, initialFormData, MOTIVATIONAL_MESSAGES } from "./types";
import ProgressBar from "./ProgressBar";
import Step1Personal from "./Step1Personal";
import Step2Professional from "./Step2Professional";
import Step3Objectives from "./Step3Objectives";
import Step4Investment from "./Step4Investment";
import Step5Closing from "./Step5Closing";
import Step6Confirmation from "./Step6Confirmation";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";

const STORAGE_KEY = "lead_form_progress";

const loadSavedData = (): { data: LeadFormData; step: number } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { data: initialFormData, step: 0 };
};

const LeadForm = () => {
  const saved = useRef(loadSavedData());
  const [currentStep, setCurrentStep] = useState(saved.current.step);
  const [formData, setFormData] = useState<LeadFormData>(saved.current.data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [motivationalMsg, setMotivationalMsg] = useState("");
  const startTime = useRef(Date.now());

  // Save progress
  useEffect(() => {
    if (currentStep < 5) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: formData, step: currentStep }));
    }
  }, [formData, currentStep]);

  const handleChange = useCallback(
    (field: keyof LeadFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 0) {
      if (formData.nome.trim().length < 3) errs.nome = "Mínimo 3 caracteres";
      if (formData.whatsapp.replace(/\D/g, "").length < 10) errs.whatsapp = "Número inválido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "E-mail inválido";
      if (!formData.consentimento_marketing) errs.consentimento_marketing = "Consentimento obrigatório";
    }
    if (currentStep === 1) {
      if (!formData.area_profissional) errs.area_profissional = "Selecione uma opção";
      if (!formData.anos_experiencia) errs.anos_experiencia = "Selecione uma opção";
      if (!formData.nivel_ingles) errs.nivel_ingles = "Selecione uma opção";
    }
    if (currentStep === 2) {
      if (!formData.objetivo) errs.objetivo = "Selecione uma opção";
      if (!formData.status_visto) errs.status_visto = "Selecione uma opção";
      if (!formData.prazo_movimento) errs.prazo_movimento = "Selecione uma opção";
      if (!formData.composicao_familiar) errs.composicao_familiar = "Selecione uma opção";
    }
    if (currentStep === 3) {
      if (!formData.faixa_investimento) errs.faixa_investimento = "Selecione uma opção";
    }
    if (currentStep === 4) {
      if (!formData.principal_obstaculo) errs.principal_obstaculo = "Selecione uma opção";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    setSubmitting(true);
    const tempoSec = Math.round((Date.now() - startTime.current) / 1000);
    const device = window.innerWidth < 768 ? "mobile" : "desktop";

    try {
      await supabase.from("leads_report").insert({
        nome: formData.nome.trim(),
        whatsapp: formData.whatsapp,
        email: formData.email.trim().toLowerCase(),
        consentimento_marketing: formData.consentimento_marketing,
        area_profissional: formData.area_profissional,
        anos_experiencia: formData.anos_experiencia,
        nivel_ingles: formData.nivel_ingles,
        objetivo: formData.objetivo,
        status_visto: formData.status_visto,
        prazo_movimento: formData.prazo_movimento,
        composicao_familiar: formData.composicao_familiar,
        faixa_investimento: formData.faixa_investimento,
        principal_obstaculo: formData.principal_obstaculo,
        maior_duvida: formData.maior_duvida || null,
        tempo_conclusao: tempoSec,
        dispositivo_usado: device,
        ultima_etapa_visualizada: 6,
      });

      localStorage.removeItem(STORAGE_KEY);
      setCurrentStep(5);
    } catch {
      // Still advance to confirmation
      setCurrentStep(5);
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!validate()) return;

    if (currentStep === 4) {
      submit();
      return;
    }

    setMotivationalMsg(MOTIVATIONAL_MESSAGES[currentStep] || "");
    setTimeout(() => {
      setMotivationalMsg("");
      setCurrentStep((s) => s + 1);
    }, 800);
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const isStep1Valid =
    formData.nome.trim().length >= 3 &&
    formData.whatsapp.replace(/\D/g, "").length >= 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.consentimento_marketing;

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Step1Personal data={formData} onChange={handleChange} errors={errors} />;
      case 1: return <Step2Professional data={formData} onChange={handleChange} errors={errors} />;
      case 2: return <Step3Objectives data={formData} onChange={handleChange} errors={errors} />;
      case 3: return <Step4Investment data={formData} onChange={handleChange} errors={errors} />;
      case 4: return <Step5Closing data={formData} onChange={handleChange} errors={errors} />;
      case 5: return <Step6Confirmation />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="card-elevated p-5 sm:p-8 space-y-6">
          {/* Progress */}
          {currentStep < 5 && <ProgressBar currentStep={currentStep} totalSteps={6} />}

          {/* Motivational Toast */}
          {motivationalMsg && (
            <div className="text-center py-3 px-4 rounded-xl bg-primary/5 text-primary font-semibold text-sm slide-up">
              {motivationalMsg}
            </div>
          )}

          {/* Step Content */}
          <div key={currentStep}>{renderStep()}</div>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="flex items-center gap-3 pt-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={submitting || (currentStep === 0 && !isStep1Valid)}
                className={`btn-primary-gradient flex-1 flex items-center justify-center gap-2 py-3.5 text-sm ${
                  currentStep === 4 ? "btn-pulse" : ""
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === 4 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Finalizar análise e ver resultado
                  </>
                ) : currentStep === 0 ? (
                  isStep1Valid ? (
                    <>
                      Iniciar Análise
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Preencha os dados acima"
                  )
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          © {new Date().getFullYear()} EUA Na Prática — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default LeadForm;
