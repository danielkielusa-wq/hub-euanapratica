
# Plano: Ajustes Landing Page, Onboarding e Redes Sociais

## Alteracoes Solicitadas

1. **Redes Sociais na Landing Page** - Atualizar URLs corretas
2. **Onboarding Step 1** - Remover botao duplicado "Comecar"
3. **Validacao de Telefone** - Verificar duplicidade no sistema
4. **Resume Upload** - Garantir salvamento no perfil
5. **Ultima Etapa** - Redirecionar para "Meu Hub"

---

## PARTE 1: Redes Sociais (Footer.tsx)

**Arquivo:** `src/components/landing/Footer.tsx`

**Alteracoes nas linhas 74-97:**

| Rede Social | URL Atual | URL Correta |
|-------------|-----------|-------------|
| Instagram | `https://instagram.com/euanapratica` | `https://instagram.com/danielkielusa` |
| LinkedIn | `https://linkedin.com/company/euanapratica` | `https://www.linkedin.com/in/danielkiel/` |
| YouTube | `https://youtube.com/@euanapratica` | `https://www.youtube.com/@eua_na_pratica` |

---

## PARTE 2: Remover Botao Duplicado no Onboarding

**Problema Identificado:**
Na tela do step 1 (Welcome), existem DOIS botoes de navegacao:
1. "Configurar meu Perfil →" (dentro do WelcomeStep)
2. "Comecar →" (no footer do OnboardingLayout)

Ambos fazem a mesma coisa (`handleNext`), criando confusao visual.

**Solucao:**
Ocultar o botao de navegacao do footer quando estivermos no step 1, ja que o WelcomeStep tem seu proprio CTA.

**Arquivo:** `src/components/onboarding/OnboardingLayout.tsx`

**Alteracao na linha 76-84:**
Adicionar condicao para nao renderizar o botao "Proximo" quando `currentStep === 1`:

```tsx
{/* Next Button - Hide on step 1 since WelcomeStep has its own CTA */}
{currentStep !== 1 && (
  <button
    onClick={onNext}
    disabled={!canGoNext}
    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold..."
  >
    {nextLabel || (isLastStep ? 'Ir para Meu Hub' : 'Próximo')}
    <ArrowRight className="h-4 w-4" />
  </button>
)}
```

Adicionalmente, precisamos passar `currentStep` como prop para verificar a condicao.

---

## PARTE 3: Validacao de Telefone Unico

**Problema:**
Atualmente nao existe validacao de unicidade de telefone. Dois usuarios podem cadastrar o mesmo numero.

**Solucao em 2 Partes:**

### 3.1 Constraint Unico no Banco de Dados

**Migracao SQL:**
```sql
-- Criar indice unico composto para telefone (codigo + numero)
-- Apenas para telefones nao nulos
CREATE UNIQUE INDEX idx_profiles_phone_unique 
ON public.profiles (phone_country_code, phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Funcao auxiliar para verificar duplicidade
CREATE OR REPLACE FUNCTION public.is_phone_available(
  p_country_code TEXT,
  p_phone TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone_country_code = p_country_code
    AND phone = p_phone
    AND (p_user_id IS NULL OR id != p_user_id)
  );
END;
$$;
```

### 3.2 Validacao no Frontend

**Arquivo:** `src/pages/Onboarding.tsx`

**Alterar funcao `validateStep` (linha 91-129):**

Adicionar verificacao assincrona de duplicidade ao validar step 3:

```tsx
const validateStep = useCallback(async (step: OnboardingStep): Promise<boolean> => {
  const newErrors: Record<string, string> = {};

  // ... validacoes existentes para step 2 ...

  if (step === 3) {
    if (!formData.phone?.trim() || formData.phone.trim().length < 8) {
      newErrors.phone = 'Telefone é obrigatório (mínimo 8 dígitos)';
    } else {
      // Verificar duplicidade no banco
      const { data: isAvailable, error } = await supabase.rpc('is_phone_available', {
        p_country_code: formData.phone_country_code || '+55',
        p_phone: formData.phone,
        p_user_id: user?.id
      });
      
      if (error) {
        console.error('Error checking phone:', error);
      } else if (!isAvailable) {
        newErrors.phone = 'Este número de telefone já está cadastrado no sistema.';
      }
    }
    // ... resto das validacoes ...
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}, [formData, user?.id]);
```

**Nota:** Precisamos tornar `validateStep` async e ajustar `handleNext` para usar await.

---

## PARTE 4: Garantir Salvamento do Curriculo no Perfil

**Analise do Codigo Atual:**

O fluxo atual JA salva o curriculo corretamente:
1. `LinkedInResumeStep` chama `uploadResume(file)` que faz upload para o bucket 'resumes'
2. `uploadResume` retorna o `path` do arquivo
3. `onChange('resume_url', path)` atualiza o formData local
4. `saveProgress()` eh chamado ao clicar "Proximo" e salva o `resume_url` no perfil

**Problema Potencial:**
Se o usuario fizer upload mas nao clicar "Proximo", o curriculo fica no storage mas nao no perfil.

**Solucao - Salvamento Imediato:**

**Arquivo:** `src/components/onboarding/steps/LinkedInResumeStep.tsx`

**Modificar funcao `onDrop` (linha 20-30):**

Alem de chamar `onChange`, tambem salvar imediatamente no banco:

```tsx
const onDrop = useCallback(async (acceptedFiles: File[]) => {
  const file = acceptedFiles[0];
  if (!file) return;

  setUploadedFileName(file.name);
  const path = await uploadResume(file);
  if (path) {
    onChange('resume_url', path);
    
    // Salvar imediatamente no perfil
    try {
      await supabase
        .from('profiles')
        .update({ resume_url: path })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving resume to profile:', error);
    }
  } else {
    setUploadedFileName(null);
  }
}, [uploadResume, onChange, user?.id]);
```

Para isso, precisamos passar o `user` como prop ou usar o hook `useAuth` dentro do componente.

---

## PARTE 5: Redirecionar para "Meu Hub" na Ultima Etapa

**Arquivos a Modificar:**

### 5.1 ConfirmationStep.tsx

**Alterar texto do botao (linha 67):**

```tsx
{isCompleting ? 'Finalizando...' : 'Acessar Meu Hub →'}
```

### 5.2 Onboarding.tsx

**Alterar funcao `getDashboardPath` (linha 61-77):**

Para estudantes, redirecionar para `/dashboard/hub` ao inves de `/dashboard`:

```tsx
const getDashboardPath = useCallback(() => {
  // Check if there's a pending espaco_id from invitation flow
  const pendingEspacoId = localStorage.getItem('pending_espaco_id');
  if (pendingEspacoId) {
    localStorage.removeItem('pending_espaco_id');
    return `/dashboard/espacos/${pendingEspacoId}`;
  }
  
  switch (user?.role) {
    case 'admin':
      return '/admin/dashboard';
    case 'mentor':
      return '/mentor/dashboard';
    default:
      return '/dashboard/hub';  // <-- Alterado de '/dashboard' para '/dashboard/hub'
  }
}, [user?.role]);
```

### 5.3 OnboardingLayout.tsx

**Alterar label do botao (linha 81):**

```tsx
{nextLabel || (isLastStep ? 'Acessar Meu Hub' : 'Próximo')}
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteracoes |
|---------|------------|
| `src/components/landing/Footer.tsx` | URLs das redes sociais |
| `src/components/onboarding/OnboardingLayout.tsx` | Ocultar botao step 1, alterar label ultimo step |
| `src/pages/Onboarding.tsx` | Validacao async telefone, redirecionar para Hub |
| `src/components/onboarding/steps/LinkedInResumeStep.tsx` | Salvamento imediato do curriculo |
| `src/components/onboarding/steps/ConfirmationStep.tsx` | Texto do botao CTA |
| **Nova Migracao SQL** | Constraint unica telefone + funcao RPC |

---

## Detalhes Tecnicos

### Validacao Assincrona no Onboarding

A funcao `validateStep` sera convertida para async:

```tsx
// Antes
const validateStep = useCallback((step: OnboardingStep): boolean => {

// Depois  
const validateStep = useCallback(async (step: OnboardingStep): Promise<boolean> => {
```

E `handleNext` sera ajustado:

```tsx
// Antes
if (!validateStep(currentStep)) {
  return;
}

// Depois
const isValid = await validateStep(currentStep);
if (!isValid) {
  return;
}
```

### Experiencia do Usuario - Erro de Telefone

Quando o usuario inserir um telefone duplicado, ele vera uma mensagem de erro vermelha abaixo do campo:

"Este numero de telefone ja esta cadastrado no sistema."

O usuario podera corrigir o numero antes de prosseguir.

---

## Ordem de Implementacao

1. Migracao SQL para constraint de telefone unico
2. Atualizar Footer.tsx com URLs corretas
3. Modificar OnboardingLayout.tsx (ocultar botao step 1, label Hub)
4. Modificar Onboarding.tsx (validacao async, redirect Hub)
5. Modificar LinkedInResumeStep.tsx (salvamento imediato)
6. Modificar ConfirmationStep.tsx (texto botao)
