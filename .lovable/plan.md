

# Plan: Fix Invitation Email System

## Problem Summary

The invitation system is creating database records but **not sending emails** because the `RESEND_API_KEY` secret is not configured. When a mentor clicks "Enviar Convite", the invitation is saved but the recipient never receives the email.

## Root Cause Analysis

1. **Missing Secret**: The `RESEND_API_KEY` environment variable is not set in Supabase Secrets
2. **Misleading Toast**: The frontend always shows "Um email foi enviado" even when `emailSent: false`
3. **No Email Domain**: Resend requires a verified domain to send emails from

## Solution Overview

### Step 1: Configure Resend Integration

You will need to:
1. Create a Resend account at https://resend.com
2. Add and verify your domain (euanapratica.com) at https://resend.com/domains
3. Create an API key at https://resend.com/api-keys
4. Add the secret to the project

### Step 2: Update Edge Function

Improve error handling and logging in the edge function to better diagnose issues.

### Step 3: Update Frontend Toast Messages

Fix the toast to accurately reflect whether the email was sent or not.

### Step 4: Enhance Email Template

Improve the email design with clearer call-to-action and instructions.

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `RESEND_API_KEY` | Add Secret | Configure Resend API key |
| `supabase/functions/send-espaco-invitation/index.ts` | Update | Better logging and error handling |
| `src/hooks/useEspacoInvitations.ts` | Update | Handle emailSent response properly |
| `src/pages/Register.tsx` | Update | Improve invitation flow handling |

---

## Detailed Implementation

### Phase 1: Configure Resend API Key

The system will prompt you to add your Resend API key. You need to:

1. Go to https://resend.com and sign up
2. Verify your domain `euanapratica.com` at https://resend.com/domains
   - Add DNS records (TXT, DKIM) to your domain
   - Wait for verification (usually a few minutes)
3. Create an API key at https://resend.com/api-keys
4. Provide the API key when prompted

### Phase 2: Update Edge Function

**Improvements:**
- Add detailed logging for debugging
- Validate domain is verified before sending
- Return clear error messages if email fails
- Include invitation link in response for fallback

```typescript
// Key changes:
// 1. Log when RESEND_API_KEY is missing
if (!resendApiKey) {
  console.warn("RESEND_API_KEY not configured - email will not be sent");
}

// 2. Log full response from Resend for debugging
const emailResponse = await fetch(...);
const emailResult = await emailResponse.json();
console.log("Resend response:", JSON.stringify(emailResult));

// 3. Return invitation link for manual fallback
return new Response(JSON.stringify({
  success: true,
  emailSent,
  inviteLink: emailSent ? undefined : inviteLink, // Fallback link
}));
```

### Phase 3: Update Frontend Toast

**Current behavior (misleading):**
```typescript
// Always shows success message
toast({
  title: 'Convite enviado!',
  description: `Um email foi enviado para ${variables.email}`,
});
```

**Fixed behavior:**
```typescript
onSuccess: (response, variables) => {
  if (response.emailSent) {
    toast({
      title: 'Convite enviado!',
      description: `Um email foi enviado para ${variables.email}`,
    });
  } else {
    // Show warning with manual link option
    toast({
      title: 'Convite criado',
      description: `Email não configurado. Copie o link de convite manualmente.`,
      variant: 'warning',
      action: <CopyLinkButton link={response.inviteLink} />
    });
  }
}
```

### Phase 4: Improve Email Template

The current email is good but could be enhanced:

```html
<!-- Add clear step-by-step instructions -->
<p>Para começar:</p>
<ol>
  <li>Clique no botão abaixo</li>
  <li>Complete seu cadastro</li>
  <li>Preencha o onboarding</li>
  <li>Acesse "Meus Espaços"</li>
</ol>

<!-- More prominent CTA button -->
<a href="${inviteLink}" style="
  display: inline-block;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 18px 40px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 18px;
  text-decoration: none;
">
  Aceitar Convite e Criar Conta
</a>

<!-- Add fallback link text -->
<p style="color: #71717a; font-size: 12px; margin-top: 20px;">
  Se o botão não funcionar, copie e cole este link no navegador:<br>
  <a href="${inviteLink}">${inviteLink}</a>
</p>
```

---

## Technical Details

### Email Flow After Fix

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Mentor clicks "Enviar Convite"                               │
├─────────────────────────────────────────────────────────────────┤
│ 2. Frontend calls send-espaco-invitation edge function          │
├─────────────────────────────────────────────────────────────────┤
│ 3. Edge function:                                               │
│    a. Validates mentor permissions                              │
│    b. Creates/updates invitation in database                    │
│    c. Calls Resend API with RESEND_API_KEY                      │
│    d. Returns { success: true, emailSent: true }                │
├─────────────────────────────────────────────────────────────────┤
│ 4. Frontend shows accurate toast message                        │
└─────────────────────────────────────────────────────────────────┘
```

### Registration Flow After Email

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks link in email                                    │
│    → /register?token=<uuid>&espaco_id=<uuid>                    │
├─────────────────────────────────────────────────────────────────┤
│ 2. Register page:                                               │
│    a. Fetches invitation data by token                          │
│    b. Pre-fills email and name from invitation                  │
│    c. Shows "Você foi convidado!" with space name               │
│    d. Stores token in localStorage                              │
├─────────────────────────────────────────────────────────────────┤
│ 3. User completes registration                                  │
├─────────────────────────────────────────────────────────────────┤
│ 4. After registration:                                          │
│    a. Calls process-invitation with stored token                │
│    b. Creates enrollment in user_espacos                        │
│    c. Marks invitation as "accepted"                            │
├─────────────────────────────────────────────────────────────────┤
│ 5. User redirected to /dashboard → onboarding (if not done)     │
├─────────────────────────────────────────────────────────────────┤
│ 6. After onboarding → "Meus Espaços" shows the enrolled space   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before I can implement this fix, you need to:

1. **Create Resend Account**
   - Go to https://resend.com
   - Sign up for a free account

2. **Verify Your Domain**
   - Go to https://resend.com/domains
   - Add `euanapratica.com`
   - Add the required DNS records (DKIM, SPF)
   - Wait for verification

3. **Create API Key**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Name it something like "EUA Na Pratica Production"
   - Copy the key (it starts with `re_`)

4. **Provide the API Key**
   - When implementation begins, I will prompt you to add the secret

---

## Expected Results

After implementation:

1. Invitations send real emails via Resend
2. Recipients receive professionally formatted emails with clear CTAs
3. Clicking the email link takes them to a pre-filled registration page
4. After registration, they're automatically enrolled in the space
5. After completing onboarding, they see the space in "Meus Espaços"
6. Frontend shows accurate feedback about email delivery status
7. Fallback link available if email delivery fails

