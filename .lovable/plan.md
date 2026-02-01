

# Plano: Corrigir CTAs Não Exibidos na Página Pública de Relatório

## Diagnóstico do Problema

O lead `diegogferreira@msn.com` **já possui recommendations** no banco de dados:

```json
"recommendations": [
  { "service_id": "27ab13f3-...", "type": "PRIMARY", "reason": "..." },
  { "service_id": "872e0a00-...", "type": "SECONDARY", "reason": "..." },
  { "service_id": "f043b815-...", "type": "UPGRADE", "reason": "..." }
]
```

**Porém, os CTAs não aparecem porque:**

O componente `RecommendationsCTA.tsx` faz uma query direta ao `hub_services`:

```tsx
supabase
  .from('hub_services')
  .select('id, name, ...')
  .in('id', serviceIds)
```

A RLS do `hub_services` **bloqueia usuários não autenticados**:

```sql
Policy: "Authenticated users can view visible hub services"
Using Expression: (is_visible_in_hub = true) AND (auth.role() = 'authenticated')
```

Como visitantes da página pública `/report/[token]` **não estão logados**, a query retorna **vazio** e os CTAs não são renderizados.

---

## Solução Proposta

### Abordagem: Incluir Detalhes dos Serviços no `formatted_report`

Em vez de buscar os serviços no frontend, a Edge Function já tem acesso via `service role key`. Vamos enriquecer as recommendations com os dados necessários para renderização:

---

## 1. Modificar Edge Function `format-lead-report/index.ts`

### Após receber a resposta da IA, enriquecer recommendations:

```typescript
// Após parsear formattedReport
if (formattedReport.recommendations?.length && hubServices?.length) {
  formattedReport.recommendations = formattedReport.recommendations.map(rec => {
    const service = hubServices.find(s => s.id === rec.service_id);
    return {
      ...rec,
      // Dados do serviço para renderização frontend
      service_name: service?.name || null,
      service_description: service?.description || null,
      service_price_display: service?.price_display || null,
      service_cta_text: service?.cta_text || null,
      service_checkout_url: service?.ticto_checkout_url || null
    };
  }).filter(rec => rec.service_name); // Remove se serviço não existe
}
```

### Buscar campo adicional `cta_text` e `ticto_checkout_url`:

```typescript
const { data: hubServices } = await supabase
  .from("hub_services")
  .select("id, name, description, category, service_type, price, price_display, cta_text, ticto_checkout_url")
  .eq("status", "available")
  .eq("is_visible_in_hub", true);
```

---

## 2. Atualizar Tipos em `src/types/leads.ts`

```typescript
export interface ServiceRecommendation {
  service_id: string;
  type: 'PRIMARY' | 'SECONDARY' | 'UPGRADE';
  reason: string;
  // Dados enriquecidos pela edge function
  service_name?: string;
  service_description?: string | null;
  service_price_display?: string | null;
  service_cta_text?: string | null;
  service_checkout_url?: string | null;
}
```

---

## 3. Modificar `RecommendationsCTA.tsx`

### Usar dados inline, sem query ao Supabase:

```tsx
export function RecommendationsCTA({ recommendations }: RecommendationsCTAProps) {
  // Filtrar apenas recommendations que já vêm com dados do serviço
  const validRecs = recommendations.filter(r => r.service_name);
  
  if (validRecs.length === 0) return null;

  const primary = validRecs.filter(r => r.type === 'PRIMARY');
  const others = validRecs.filter(r => r.type !== 'PRIMARY');

  return (
    <section className="...">
      {primary.map((rec) => (
        <div key={rec.service_id}>
          <h4>{rec.service_name}</h4>
          <p>{rec.reason}</p>
          {rec.service_price_display && <Badge>{rec.service_price_display}</Badge>}
          <Button onClick={() => rec.service_checkout_url && window.open(rec.service_checkout_url, '_blank')}>
            {rec.service_cta_text || 'Garantir Minha Vaga'}
          </Button>
        </div>
      ))}
      {/* ... */}
    </section>
  );
}
```

---

## 4. Forçar Regeneração de Relatórios Existentes

Como o lead `diegogferreira@msn.com` já tem `formatted_report` cacheado **sem os dados enriquecidos**, precisamos:

1. Usar o botão "Refresh" na tabela de leads (admin)
2. Ou limpar `formatted_report` para forçar regeneração

---

## Arquivos a Modificar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Modificar | `supabase/functions/format-lead-report/index.ts` | Enriquecer recommendations com dados do serviço |
| Modificar | `src/types/leads.ts` | Adicionar campos opcionais de serviço |
| Modificar | `src/components/report/RecommendationsCTA.tsx` | Remover query Supabase, usar dados inline |

---

## Fluxo Após Correção

```text
Prompt AI executa
        │
        ▼
Edge function recebe recommendations com service_id
        │
        ▼
Edge function busca detalhes dos services (via service role - ignora RLS)
        │
        ▼
Enriquece recommendations com name, price, cta_text, checkout_url
        │
        ▼
Salva formatted_report com dados completos
        │
        ▼
Frontend renderiza CTAs sem precisar query adicional ✅
```

---

## Garantia: CTAs SEMPRE aparecem

Com esta abordagem:
- A Edge Function **sempre** injeta os dados dos serviços
- O frontend **não depende de RLS** para exibir
- Mesmo relatórios antigos podem ser regenerados via "Refresh"

