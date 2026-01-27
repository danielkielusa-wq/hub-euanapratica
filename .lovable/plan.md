
# Plan: Fix Invitation Email System Error Handling

## Problem Diagnosis

After investigating the edge function logs and analytics:

1. **Root Cause Identified**: The 401 error was caused by an **expired user session**
   - Analytics show: `POST | 401 | send-espaco-invitation`
   - The user is currently on `/login` page (session expired)
   - When the user tried to send an invitation, their auth token was no longer valid

2. **Secondary Issue**: The error message "Edge Function returned a non-2xx status code" is not user-friendly. The frontend should show a clearer message like "Your session expired. Please log in again."

3. **Good News**: The `RESEND_API_KEY` is already configured and the edge function code is correct

---

## Solution Overview

The fix requires improving error handling on both the **edge function** and **frontend** to provide better feedback when authentication fails.

### Changes Needed

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/send-espaco-invitation/index.ts` | Update | Add better error messages for auth failures |
| `src/hooks/useEspacoInvitations.ts` | Update | Parse error responses and show helpful messages |

---

## Implementation Details

### Phase 1: Improve Edge Function Error Responses

The edge function should return more descriptive error messages that the frontend can use:

```typescript
// When auth header missing or invalid format
return new Response(
  JSON.stringify({ 
    error: "Unauthorized", 
    code: "AUTH_MISSING",
    message: "Sessão não encontrada. Por favor, faça login novamente." 
  }),
  { status: 401, ... }
);

// When token validation fails
return new Response(
  JSON.stringify({ 
    error: "Unauthorized", 
    code: "AUTH_EXPIRED",
    message: "Sua sessão expirou. Por favor, faça login novamente." 
  }),
  { status: 401, ... }
);
```

### Phase 2: Improve Frontend Error Handling

The `useInviteStudent` hook should parse the error response and show user-friendly messages:

```typescript
mutationFn: async (data: InviteStudentData): Promise<InviteResponse> => {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.access_token) {
    throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
  }

  const response = await supabase.functions.invoke('send-espaco-invitation', {
    body: { ... },
  });

  if (response.error) {
    // Parse the error response for better messages
    const errorData = response.error.context?.body 
      ? JSON.parse(response.error.context.body) 
      : null;
    
    const errorMessage = errorData?.message 
      || errorData?.error 
      || 'Erro ao enviar convite';
    
    throw new Error(errorMessage);
  }

  return response.data as InviteResponse;
},
```

---

## Technical Details

### Edge Function Error Codes

| Code | Status | Message |
|------|--------|---------|
| `AUTH_MISSING` | 401 | Sessão não encontrada. Por favor, faça login novamente. |
| `AUTH_EXPIRED` | 401 | Sua sessão expirou. Por favor, faça login novamente. |
| `PERMISSION_DENIED` | 403 | Você não tem permissão para convidar alunos neste espaço. |
| `ESPACO_NOT_FOUND` | 404 | Espaço não encontrado. |
| `INVITATION_EXISTS` | 409 | Já existe um convite pendente para este email. |
| `INVALID_EMAIL` | 400 | Formato de email inválido. |

### Session Expiry Flow

```text
User opens Invite Modal
       ↓
Session token attached to request
       ↓
┌─────────────────────────────────┐
│ Edge Function validates token   │
│ - If expired → 401 + clear msg  │
│ - If valid → proceed            │
└─────────────────────────────────┘
       ↓
Frontend catches error
       ↓
Shows user-friendly toast with login redirect option
```

---

## Expected Results

After implementation:

1. When a user's session expires, they see: "Sua sessão expirou. Por favor, faça login novamente."
2. The toast includes a link/button to the login page
3. Edge function logs include helpful debug information
4. All error cases return proper error codes and messages in Portuguese
5. The invitation flow works correctly when the user is properly authenticated

---

## Testing Checklist

1. [ ] Log in as mentor and navigate to espaco detail page
2. [ ] Open "Convidar Aluno" modal
3. [ ] Enter a valid email and click "Enviar Convite"
4. [ ] Verify email is sent (check edge function logs for "Invitation email sent successfully")
5. [ ] Check recipient's inbox for the invitation email
6. [ ] Click the link in email and verify registration flow works
7. [ ] After registration, verify user is enrolled in the espaco
