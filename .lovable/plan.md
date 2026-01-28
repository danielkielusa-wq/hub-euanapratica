
# Plano: Bloqueio Pre-Analise e Economia de Creditos de IA

## Resumo do Problema

O sistema atual permite upload e analise, mas bloqueia o resultado final. Isso desperdi creditos de IA porque a chamada ao Gemini ja foi feita. O objetivo e bloquear ANTES da chamada a API.

## Analise Tecnica

### O que ja funciona:
1. **Edge Function (analyze-resume)**: Ja tem gatekeeper na linha 80 que retorna 402 se `currentUsage >= plan.monthly_limit` - ANTES de chamar Gemini
2. **Hook (useCurriculoAnalysis)**: Ja verifica quota na linha 71 e bloqueia se `quota.remaining <= 0`
3. **QuotaDisplay**: Ja mostra creditos reais com barra de progresso colorida

### O que precisa melhorar:
1. **Botao "Analisar"**: Nao mostra feedback visual quando desabilitado por falta de creditos
2. **ResumeUploadCard**: Nao abre modal de upgrade ao tentar arrastar arquivo sem creditos
3. **QuotaDisplay**: Nao tem alerta visual vermelho quando creditos = 0

---

## Parte 1: Botao "Analisar" com Estados Dinamicos

### Arquivo: `src/pages/curriculo/CurriculoUSA.tsx`

Alterar o botao para:
- Mostrar texto diferente quando sem creditos: "Limite Mensal Atingido - Faca Upgrade"
- Cor cinza/opacidade reduzida
- Tooltip ao passar o mouse explicando o limite
- Ao clicar, abrir UpgradeModal ao inves de tentar analisar

```typescript
import { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';

export default function CurriculoUSA() {
  const {
    status,
    uploadedFile,
    jobDescription,
    setFile,
    setJobDescription,
    analyze,
    canAnalyze,
    quota,
    showUpgradeModal,
    setShowUpgradeModal,
  } = useCurriculoAnalysis();

  const hasCredits = quota ? quota.remaining > 0 : true;
  const hasRequiredFields = !!uploadedFile && !!jobDescription.trim();
  
  // Determinar estado do botao
  const getButtonConfig = () => {
    if (!hasCredits) {
      return {
        text: 'Limite Mensal Atingido - Faça Upgrade',
        icon: Lock,
        variant: 'secondary' as const,
        disabled: false, // Permite clique para abrir modal
        onClick: () => setShowUpgradeModal(true),
        tooltip: `Você já usou seu limite de ${quota?.monthlyLimit} análise(s) este mês no plano ${quota?.planName}.`,
      };
    }
    return {
      text: status === 'error' ? 'Tentar Novamente' : 'Analisar Compatibilidade Agora',
      icon: Sparkles,
      variant: 'default' as const,
      disabled: !hasRequiredFields,
      onClick: analyze,
      tooltip: null,
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    // ... JSX com botao condicional e tooltip
  );
}
```

---

## Parte 2: ResumeUploadCard com Bloqueio de Drag

### Arquivo: `src/components/curriculo/ResumeUploadCard.tsx`

Adicionar prop `disabled` e callback `onBlockedDrop`:

```typescript
interface ResumeUploadCardProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  onBlockedDrop?: () => void;
}

export function ResumeUploadCard({ 
  file, 
  onFileChange, 
  disabled = false,
  onBlockedDrop 
}: ResumeUploadCardProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Verificar se esta desabilitado
    if (disabled) {
      onBlockedDrop?.();
      return;
    }
    // ... resto da logica
  }, [onFileChange, disabled, onBlockedDrop]);

  // Adicionar overlay visual quando disabled
  return (
    <div className="relative">
      {disabled && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-[32px] z-10 
                        flex items-center justify-center cursor-not-allowed"
             onClick={onBlockedDrop}>
          <div className="text-center p-4">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Limite de creditos atingido</p>
          </div>
        </div>
      )}
      {/* ... dropzone existente */}
    </div>
  );
}
```

### Atualizacao em CurriculoUSA.tsx:

```typescript
<ResumeUploadCard 
  file={uploadedFile} 
  onFileChange={setFile}
  disabled={!hasCredits}
  onBlockedDrop={() => setShowUpgradeModal(true)}
/>
```

---

## Parte 3: QuotaDisplay com Alerta Visual

### Arquivo: `src/components/curriculo/QuotaDisplay.tsx`

Adicionar animacao pulsante e cor vermelha quando creditos = 0:

```typescript
export function QuotaDisplay({ className = '' }: QuotaDisplayProps) {
  const { quota, isLoading } = useSubscription();
  
  // ... codigo existente ...

  const isExhausted = quota.remaining <= 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 text-sm",
            isExhausted && "animate-pulse",
            className
          )}>
            {getPlanIcon()}
            <span className={cn(
              "text-muted-foreground",
              isExhausted && "text-destructive"
            )}>
              <span className={cn(
                "font-semibold",
                isExhausted ? "text-destructive" : "text-foreground"
              )}>
                {quota.remaining}
              </span>
              /{quota.monthlyLimit} analises
            </span>
            {/* Barra de progresso com alerta */}
            <div className={cn(
              "w-12 h-1.5 rounded-full overflow-hidden",
              isExhausted ? "bg-destructive/20" : "bg-muted"
            )}>
              <div 
                className={cn(
                  "h-full transition-all",
                  isExhausted ? "bg-destructive" : getProgressColor()
                )}
                style={{ width: `${Math.max(5, (quota.remaining / quota.monthlyLimit) * 100)}%` }}
              />
            </div>
            {/* Icone de alerta quando zerado */}
            {isExhausted && (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isExhausted ? (
            <p className="text-destructive font-medium">
              Limite atingido! Faca upgrade para continuar.
            </p>
          ) : (
            <>
              <p className="font-medium">{quota.planName}</p>
              <p className="text-muted-foreground">
                {quota.usedThisMonth} de {quota.monthlyLimit} analises usadas este mes
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## Parte 4: Mensagem no UpgradeModal

### Arquivo: `src/components/curriculo/UpgradeModal.tsx`

Atualizar mensagem do header quando aberto por limite atingido:

```typescript
interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string;
  reason?: 'limit_reached' | 'upgrade';
}

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  currentPlanId = 'basic',
  reason = 'upgrade' 
}: UpgradeModalProps) {
  // ... codigo existente ...

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="text-center pb-4">
          {reason === 'limit_reached' ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <DialogTitle className="text-2xl font-bold">
                  Voce Atingiu Seu Limite!
                </DialogTitle>
              </div>
              <p className="text-muted-foreground">
                Nao gaste sua chance. Atualize seu plano para continuar 
                otimizando seu curriculo agora mesmo.
              </p>
            </>
          ) : (
            // ... header padrao existente ...
          )}
        </DialogHeader>
        {/* ... resto do modal ... */}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Parte 5: Protecao na Edge Function (Confirmacao)

### Arquivo: `supabase/functions/analyze-resume/index.ts`

O gatekeeper JA EXISTE nas linhas 79-92:

```typescript
// 3. Check if quota exceeded - ANTES de chamar Gemini
if (currentUsage >= plan.monthly_limit) {
  return new Response(
    JSON.stringify({
      error_code: "LIMIT_REACHED",
      error: "Limite mensal atingido",
      error_message: `Voce atingiu o limite de ${plan.monthly_limit} analise(s) do seu plano este mes.`,
      plan_id: planId,
      monthly_limit: plan.monthly_limit,
      used: currentUsage,
    }),
    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**NENHUMA ALTERACAO NECESSARIA** - O edge function ja bloqueia ANTES de chamar a API do Gemini, economizando creditos.

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/curriculo/CurriculoUSA.tsx` | Botao com estados dinamicos, tooltip, UpgradeModal |
| `src/components/curriculo/ResumeUploadCard.tsx` | Prop `disabled`, overlay de bloqueio |
| `src/components/curriculo/QuotaDisplay.tsx` | Alerta vermelho pulsante quando 0 creditos |
| `src/components/curriculo/UpgradeModal.tsx` | Mensagem especial para limite atingido |

---

## Fluxo de Usuario Final

```text
1. Usuario com 0 creditos acessa /curriculo
   → Contador mostra "0/1" em vermelho pulsante
   → Botao mostra "Limite Mensal Atingido - Faca Upgrade"
   → Tooltip explica: "Voce ja usou seu limite de 1 analise este mes no plano Basico"

2. Usuario tenta arrastar arquivo
   → Card de upload mostra overlay de bloqueio
   → Clique abre UpgradeModal

3. Usuario clica no botao
   → UpgradeModal abre com mensagem: "Voce Atingiu Seu Limite! Nao gaste sua chance..."

4. Usuario com creditos (1/1 restante)
   → Contador mostra "1/1" em verde
   → Botao normal: "Analisar Compatibilidade Agora"
   → Pode fazer upload e analisar normalmente

5. Protecao backend (seguranca nivel 2)
   → Edge function verifica quota ANTES de chamar Gemini
   → Retorna 402 se limite atingido, sem gastar creditos de IA
```

---

## Ordem de Implementacao

1. `QuotaDisplay.tsx` - Alerta visual vermelho
2. `ResumeUploadCard.tsx` - Bloqueio de drag/drop
3. `UpgradeModal.tsx` - Mensagem de limite atingido
4. `CurriculoUSA.tsx` - Integrar tudo com botao dinamico
