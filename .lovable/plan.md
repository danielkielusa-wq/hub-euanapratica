

# Plano: CTAs Dinâmicos na Página Pública do Relatório

## Objetivo

Adicionar uma seção de "Próximos Passos" com CTAs dinâmicos baseados em `hub_services` no final da página pública de relatório (`/report/[token]`), reutilizando a lógica já implementada no modal administrativo.

---

## Análise do Estado Atual

| Componente | Situação |
|------------|----------|
| Edge function `format-lead-report` | Já gera `recommendations[]` com `service_id`, `type` e `reason` |
| `FormattedReportData.recommendations` | Tipo já definido em `src/types/leads.ts` |
| `LeadReportModal.tsx` (admin) | Já renderiza CTAs dinâmicos corretamente |
| `FormattedReport.tsx` (público) | Não exibe recommendations, apenas `ResourcesPills` |

---

## Arquivos a Modificar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Criar | `src/components/report/RecommendationsCTA.tsx` | Componente de CTAs para público |
| Modificar | `src/components/report/FormattedReport.tsx` | Integrar o novo componente |

---

## 1. Novo Componente: `RecommendationsCTA.tsx`

### Estrutura Visual

```text
┌─────────────────────────────────────────────────────────────┐
│  📍 Próximos Passos Estratégicos                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  ┌───────────────┐   │
│  │  PRIMARY (ocupando 2 colunas)    │  │  SECONDARY    │   │
│  │  Card escuro com destaque        │  │               │   │
│  │  Ícone + Nome + Reason           │  │  Nome + CTA   │   │
│  │  Botão CTA principal             │  ├───────────────┤   │
│  │                                   │  │  UPGRADE      │   │
│  │                                   │  │  Card premium │   │
│  └──────────────────────────────────┘  └───────────────┘   │
│                                                              │
│  Garantia de 7 dias | Atendimento exclusivo                 │
└─────────────────────────────────────────────────────────────┘
```

### Funcionalidade

- Recebe `recommendations` do `reportData`
- Busca detalhes dos serviços via query à `hub_services` usando os IDs
- Renderiza cards com:
  - PRIMARY: Card escuro ocupando 2 colunas, botão de destaque
  - SECONDARY: Card padrão empilhado
  - UPGRADE: Card com gradiente premium
- Links apontam para `ticto_checkout_url` de cada serviço

### Props

```typescript
interface RecommendationsCTAProps {
  recommendations: ServiceRecommendation[];
}
```

---

## 2. Modificar `FormattedReport.tsx`

### Importar o novo componente

```typescript
import { RecommendationsCTA } from './RecommendationsCTA';
```

### Renderizar após ActionPlanList

```tsx
{/* Action Plan */}
<ActionPlanList actionPlan={reportData.action_plan} />

{/* Service Recommendations CTAs */}
{reportData.recommendations && reportData.recommendations.length > 0 && (
  <RecommendationsCTA recommendations={reportData.recommendations} />
)}

{/* Resources */}
<ResourcesPills ... />
```

---

## 3. Design do Componente

### Mapeamento de cores (consistente com projeto)

| Elemento | Classe |
|----------|--------|
| Seção container | `bg-muted/30 rounded-[40px] p-8 md:p-10 border` |
| PRIMARY card | `bg-foreground dark:bg-slate-800 text-background rounded-[32px]` |
| PRIMARY botão | `bg-background text-foreground hover:bg-primary/10` |
| SECONDARY card | `bg-card border rounded-[32px]` |
| UPGRADE card | `bg-gradient-to-br from-primary/5 to-indigo-500/5 border-primary/20` |
| Badge PRIMARY | `bg-primary text-primary-foreground` |
| Badge UPGRADE | `bg-primary` com ícone Crown |

---

## 4. Código do Componente

```tsx
// src/components/report/RecommendationsCTA.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Sparkles, ArrowRight, Crown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceRecommendation } from '@/types/leads';

interface HubService {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  price_display: string | null;
  cta_text: string | null;
  ticto_checkout_url: string | null;
}

interface RecommendationsCTAProps {
  recommendations: ServiceRecommendation[];
}

export function RecommendationsCTA({ recommendations }: RecommendationsCTAProps) {
  const [services, setServices] = useState<HubService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const serviceIds = recommendations.map(r => r.service_id);
    if (serviceIds.length === 0) return;

    supabase
      .from('hub_services')
      .select('id, name, description, icon_name, price_display, cta_text, ticto_checkout_url')
      .in('id', serviceIds)
      .then(({ data }) => {
        if (data) setServices(data);
        setIsLoading(false);
      });
  }, [recommendations]);

  const getService = (id: string) => services.find(s => s.id === id);

  if (isLoading || services.length === 0) return null;

  const primary = recommendations.filter(r => r.type === 'PRIMARY');
  const others = recommendations.filter(r => r.type !== 'PRIMARY');

  return (
    <section className="bg-muted/30 rounded-[40px] p-8 md:p-10 border print:hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-primary text-primary-foreground rounded-xl">
          <Zap size={22} className="fill-current" />
        </div>
        <h3 className="text-2xl font-black tracking-tight">
          Próximos Passos Estratégicos
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRIMARY */}
        {primary.map((rec) => {
          const service = getService(rec.service_id);
          if (!service) return null;
          
          return (
            <div 
              key={rec.service_id} 
              className="lg:col-span-2 bg-foreground dark:bg-slate-800 text-background rounded-[32px] p-8 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                  <Sparkles size={12} className="fill-current" /> Recomendação Para Você
                </div>
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-background/10 rounded-2xl border border-background/10">
                    <FileText size={24} className="text-primary/80" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black mb-1">{service.name}</h4>
                    <p className="text-primary/60 text-sm">{rec.reason}</p>
                  </div>
                </div>

                {service.price_display && (
                  <Badge variant="secondary" className="mb-4">{service.price_display}</Badge>
                )}

                <Button 
                  className="w-full bg-background text-foreground hover:bg-primary/10 font-black py-4 rounded-2xl mt-4 group"
                  onClick={() => service.ticto_checkout_url && window.open(service.ticto_checkout_url, '_blank')}
                >
                  {service.cta_text || 'Garantir Minha Vaga'} 
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          );
        })}

        {/* SECONDARY & UPGRADE */}
        <div className="flex flex-col gap-6">
          {others.map((rec) => {
            const service = getService(rec.service_id);
            if (!service) return null;
            
            return (
              <div 
                key={rec.service_id} 
                className={cn(
                  "flex-1 rounded-[32px] p-6 border transition-all flex flex-col justify-between",
                  rec.type === 'UPGRADE' 
                    ? "bg-gradient-to-br from-primary/5 to-indigo-500/5 border-primary/20" 
                    : "bg-card"
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant={rec.type === 'UPGRADE' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                      {rec.type === 'UPGRADE' ? 'Acompanhamento' : 'Estratégia'}
                    </Badge>
                    {rec.type === 'UPGRADE' && <Crown size={16} className="text-primary" />}
                  </div>
                  <h4 className="font-bold text-sm mb-2">{service.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{rec.reason}</p>
                </div>
                
                <Button 
                  variant={rec.type === 'UPGRADE' ? 'default' : 'outline'}
                  className="w-full rounded-xl text-xs font-bold"
                  onClick={() => service.ticto_checkout_url && window.open(service.ticto_checkout_url, '_blank')}
                >
                  {service.cta_text || 'Saiba mais'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
        Todos os serviços contam com garantia de satisfação de 7 dias.
      </p>
    </section>
  );
}
```

---

## 5. Fluxo Completo

```text
Usuário acessa /report/[token]
         │
         ▼
Verifica email → Carrega evaluation
         │
         ▼
Chama format-lead-report (se necessário)
         │
         ▼
Retorna JSON com `recommendations[]`
         │
         ▼
FormattedReport parseia e passa para RecommendationsCTA
         │
         ▼
RecommendationsCTA busca detalhes dos services via ID
         │
         ▼
Renderiza cards com CTAs (links para ticto_checkout_url)
```

---

## Resumo de Mudanças

| Arquivo | Linhas Estimadas |
|---------|------------------|
| `src/components/report/RecommendationsCTA.tsx` | ~140 linhas (novo) |
| `src/components/report/FormattedReport.tsx` | ~5 linhas modificadas |

