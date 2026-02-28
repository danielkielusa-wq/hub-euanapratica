# Career Assessment no Onboarding — Manual de Testes E2E

**Última atualização:** 2026-02-26
**Escopo:** Fluxo de onboarding simplificado (5 etapas) com avaliação de carreira (step 4) + bridge automático de leads

---

## Pré-requisitos

### Dados de Teste

| Entidade | Requisito |
|----------|-----------|
| **Usuário novo** | Conta criada mas `has_completed_onboarding = false` e sem career fields em `profiles` |
| **Lead existente** | Registro em `career_evaluations` com email igual ao do usuário de teste, campos `area`, `english_level`, `objetivo`, `timeline` preenchidos |
| **Admin** | Usuário com role `admin` para consultas SQL de verificação |

### Verificação rápida via SQL

```sql
-- Verificar estado atual de um usuário no onboarding
SELECT id, email, full_name, has_completed_onboarding,
       phone, phone_country_code, is_whatsapp,
       area_profissional, nivel_ingles, objetivo, prazo_movimento
FROM profiles
WHERE email = '<email_do_usuario>';

-- Verificar se existe lead correspondente na career_evaluations
SELECT id, email, area, english_level, objetivo, timeline, created_at
FROM career_evaluations
WHERE LOWER(email) = LOWER('<email_do_usuario>')
ORDER BY created_at DESC
LIMIT 1;

-- Resetar onboarding para reteste
UPDATE profiles
SET has_completed_onboarding = false,
    area_profissional = NULL,
    nivel_ingles = NULL,
    objetivo = NULL,
    prazo_movimento = NULL
WHERE email = '<email_do_usuario>';
```

### Campos da etapa de carreira

| Campo DB (`profiles`) | Opções válidas |
|---|---|
| `area_profissional` | Tecnologia / Engenharia / Negócios / Administração / Marketing / Comunicação / Saúde / Estudante / Outro |
| `nivel_ingles` | Básico / Intermediário / Avançado / Fluente |
| `objetivo` | Emprego remoto em dólar / Imigrar / Green Card trabalhando na minha área / Estudar nos EUA como porta de entrada / Ainda não tenho clareza, quero entender minhas opções |
| `prazo_movimento` | Já estou em movimento / próximos 3 meses / Entre 3 e 6 meses / Entre 6 e 12 meses / Ainda não tenho prazo definido |

---

## Cenário 1 — Novo usuário sem dados de lead (fluxo padrão)

**Pré-condição:** Usuário com `has_completed_onboarding = false`, sem career fields, sem registro em `career_evaluations` com o mesmo email.

### TC-1.1: Navegação pelos 5 passos

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como usuário de teste | — |
| 2 | Navegar para `/onboarding` | Stepper horizontal exibe 5 etapas: INÍCIO · PERFIL · DESTINO · CARREIRA · FINAL |
| 3 | Verificar step 1 (Bem-vindo) | Tela de boas-vindas com botão "Começar". Stepper mostra círculo 1 ativo |
| 4 | Clicar "Começar" | Avança para step 2 (Sobre você) |
| 5 | Preencher nome, data de nascimento e telefone → "Próximo" | Avança para step 3 (Destino) |
| 6 | Selecionar país atual e país de destino → "Próximo" | **Avança para step 4 (Sobre sua carreira)** |
| 7 | Verificar step 4 | Título "Sobre sua carreira", 4 cards com Select: Área de atuação, Nível de inglês, Objetivo, Prazo |
| 8 | Clicar "Próximo" sem preencher nada | 4 mensagens de erro: "Selecione sua área de atuação", "Selecione seu nível de inglês", "Selecione seu objetivo", "Selecione seu prazo" |
| 9 | Preencher os 4 campos → "Próximo" | Avança para step 5 (Confirmação) |
| 10 | Clicar "Acessar Meu Hub" | Redireciona para `/dashboard/hub` |

### TC-1.2: Persistência dos dados de carreira e telefone

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Após completar TC-1.1, consultar o banco | `profiles.area_profissional`, `nivel_ingles`, `objetivo`, `prazo_movimento` preenchidos com os valores selecionados |
| 2 | Verificar `has_completed_onboarding` | `true` |
| 3 | Verificar telefone | `phone`, `phone_country_code`, `is_whatsapp` preenchidos |

```sql
SELECT area_profissional, nivel_ingles, objetivo, prazo_movimento,
       phone, phone_country_code, is_whatsapp, has_completed_onboarding
FROM profiles
WHERE email = '<email_do_usuario>';
```

### TC-1.3: Validação campo a campo (step 2 — Perfil)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No step 2, deixar todos em branco → "Próximo" | 3 erros: nome, data de nascimento, telefone |
| 2 | Preencher apenas nome (< 3 chars) → "Próximo" | Erro: "Nome completo é obrigatório (mínimo 3 caracteres)" |
| 3 | Preencher nome válido + data de nascimento → "Próximo" | 1 erro: telefone |
| 4 | Preencher telefone → "Próximo" | Avança para step 3 sem erros |

### TC-1.4: Validação campo a campo (step 4 — Carreira)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No step 4, selecionar apenas "Área de atuação" → "Próximo" | 3 erros: nível de inglês, objetivo e prazo |
| 2 | Selecionar também "Nível de inglês" → "Próximo" | 2 erros: objetivo e prazo |
| 3 | Selecionar "Objetivo" → "Próximo" | 1 erro: prazo |
| 4 | Selecionar "Prazo" → "Próximo" | Avança para step 5 sem erros |

### TC-1.5: Navegação com botão "Voltar"

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Chegar ao step 4 | — |
| 2 | Clicar "Voltar" | Retorna ao step 3 (Destino) |
| 3 | Clicar "Próximo" no step 3 | Retorna ao step 4 com os campos ainda em branco (ou com o que foi selecionado antes) |

### TC-1.6: Validação de telefone duplicado

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No step 2, preencher um telefone já cadastrado por outro usuário | — |
| 2 | Clicar "Próximo" | Erro: "Este número de telefone já está cadastrado no sistema." |

### TC-1.7: WhatsApp toggle

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | No step 2, preencher telefone | Campo de telefone com checkbox "Este número é WhatsApp" |
| 2 | Marcar o checkbox → completar onboarding | `profiles.is_whatsapp = true` no banco |
| 3 | Resetar e repetir sem marcar o checkbox | `profiles.is_whatsapp = false` no banco |

---

## Cenário 2 — Usuário com lead em career_evaluations (bridge automático)

**Pré-condição:** Existe um registro em `career_evaluations` com o mesmo email do usuário, com `area`, `english_level`, `objetivo` e `timeline` preenchidos. O usuário nunca completou o onboarding.

```sql
-- Criar lead de teste (se não existir)
INSERT INTO career_evaluations (user_id, name, email, area, english_level, objetivo, timeline, report_content)
VALUES (
  '<user_id_placeholder>',
  'Lead Teste',
  '<email_do_usuario>',
  'Tecnologia',
  'Avançado',
  'Emprego remoto em dólar',
  'Entre 3 e 6 meses',
  'Relatório de teste'
);
```

### TC-2.1: Step 4 é pulado automaticamente

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como o usuário que tem lead correspondente | — |
| 2 | Navegar para `/onboarding` | Stepper de 5 etapas exibido normalmente |
| 3 | Percorrer steps 1 e 2 normalmente | — |
| 4 | Preencher step 3 (Destino) → "Próximo" | **Step 4 é pulado. Avança diretamente para step 5 (Confirmação)** |
| 5 | Completar o onboarding | — |

### TC-2.2: Dados do lead foram pré-carregados no profiles

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Após TC-2.1, consultar o banco | `profiles.area_profissional = 'Tecnologia'`, `nivel_ingles = 'Avançado'`, `objetivo = 'Emprego remoto em dólar'`, `prazo_movimento = 'Entre 3 e 6 meses'` (ou os valores que estavam no career_evaluations) |

```sql
SELECT area_profissional, nivel_ingles, objetivo, prazo_movimento
FROM profiles
WHERE email = '<email_do_usuario>';
```

### TC-2.3: Botão "Voltar" no step 5 pula step 4

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Chegar ao step 5 (Confirmação) via bridge automático | — |
| 2 | Clicar "Voltar" | Retorna ao step 3 (Destino). Step 4 é ignorado no retorno também |
| 3 | Clicar "Próximo" no step 3 | Avança diretamente para step 5. Step 4 não aparece |

### TC-2.4: Normalização de acentos (valores do form externo)

**Contexto:** A form.euanapratica.com pode armazenar valores sem acento (ex: `"Basico"` em vez de `"Básico"`).

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Criar lead com `english_level = 'Basico'` (sem acento) no `career_evaluations` | — |
| 2 | Fazer onboarding com esse usuário | Step 4 é pulado (dados detectados) |
| 3 | Verificar `profiles.nivel_ingles` no banco | `'Básico'` (com acento normalizado), não `'Basico'` |

```sql
-- Verificar normalização
SELECT nivel_ingles FROM profiles WHERE email = '<email_do_usuario>';
-- Deve retornar: 'Básico'
```

---

## Cenário 3 — Usuário que já completou onboarding com career data

**Pré-condição:** Usuário com `has_completed_onboarding = true` e `area_profissional` já preenchido.

### TC-3.1: Onboarding não é exibido (redirecionamento)

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como usuário que já completou o onboarding | — |
| 2 | Tentar acessar `/onboarding` | Redireciona imediatamente para `/dashboard/hub` |

---

## Cenário 4 — Usuário com career data parcial em profiles

**Pré-condição:** Usuário com `has_completed_onboarding = false` mas `area_profissional` já preenchido (e outros nulos). Simulação de dado salvo parcialmente.

```sql
UPDATE profiles
SET area_profissional = 'Tecnologia'
WHERE email = '<email_do_usuario>';
```

### TC-4.1: Step 4 é pulado se qualquer campo career estiver preenchido

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Logar como usuário com career data parcial | — |
| 2 | Percorrer onboarding até step 3 → "Próximo" | Step 4 é pulado. Avança para step 5 |

> **Nota:** A lógica de detecção considera "dados existentes" quando qualquer um dos 4 campos (`area_profissional`, `nivel_ingles`, `objetivo`, `prazo_movimento`) está preenchido. Isso evita exibir o step para usuários que já iniciaram o preenchimento.

---

## Cenário 5 — Stepper visual e UX

### TC-5.1: Labels do stepper

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Acessar `/onboarding` como novo usuário | Stepper desktop exibe: INÍCIO · PERFIL · DESTINO · CARREIRA · FINAL |
| 2 | Confirmar que são 5 círculos no stepper | 5 círculos numerados de 1 a 5 |

### TC-5.2: Progresso visual no step 4

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Chegar ao step 4 | Círculo 4 ativo (destaque). Círculos 1–3 com check (completo). Círculo 5 cinza |
| 2 | No mobile, verificar barra de progresso | 4 de 5 dots preenchidos/ativos |

### TC-5.3: Indicador de salvamento

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Selecionar valores no step 4 → clicar "Próximo" | Exibe "Salvando..." brevemente |
| 2 | Após salvar | Exibe "Salvo às HH:mm" |

---

## Cenário 6 — Email de boas-vindas (não regressão)

### TC-6.1: Email enviado ao completar onboarding via step 5

| # | Passo | Resultado Esperado |
|---|-------|-------------------|
| 1 | Completar onboarding (fluxo normal ou com bridge) | — |
| 2 | Verificar caixa de email do usuário | Email de boas-vindas `onboarding_welcome` recebido |
| 3 | Verificar logs no Supabase (ou Resend dashboard) | Log de envio bem-sucedido para o email do usuário |

```sql
-- Verificar se o welcome email foi enviado
SELECT * FROM n8n_webhook_logs
WHERE payload::text ILIKE '%onboarding%'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Checklist de Regressão Rápida

Após qualquer alteração nos arquivos do onboarding, verificar:

- [ ] Stepper exibe 5 círculos com labels corretos (INÍCIO · PERFIL · DESTINO · CARREIRA · FINAL)
- [ ] Step 2 coleta nome, data de nascimento e telefone (com WhatsApp toggle)
- [ ] Step 4 (career) aparece para novos usuários
- [ ] Step 4 é pulado para usuários com lead em `career_evaluations`
- [ ] Step 4 é pulado para usuários com career data em `profiles`
- [ ] Botão "Voltar" do step 5 vai para step 3 quando bridge ativo
- [ ] Botão "Voltar" do step 5 vai para step 4 quando não há bridge
- [ ] Validação impede avançar sem preencher os 4 campos de carreira
- [ ] Validação impede avançar sem nome, nascimento e telefone
- [ ] Dados salvos corretamente em `profiles` após step 2 e step 4
- [ ] `has_completed_onboarding = true` após step 5
- [ ] Email de boas-vindas enviado
- [ ] Usuário com onboarding completo não acessa `/onboarding` (redirecionado)
