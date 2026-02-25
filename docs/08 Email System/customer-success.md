# Email System — Customer Success Guide

## Overview

The platform sends automated emails at key moments in the customer journey. This guide explains which emails go out, when, and what to do when a customer says they didn't receive one.

---

## Automated Emails — When and Why

### Welcome Email

| Email | When It Sends | What It Contains |
|-------|--------------|-----------------|
| **Boas-Vindas** | Immediately when a new user completes the onboarding (6 steps) | Personalized greeting, platform feature highlights, link to the Hub |

### Subscription Emails

| Email | When It Sends | What It Contains |
|-------|--------------|-----------------|
| **Confirmação de Assinatura** | Immediately when a subscription is activated | Welcome message, plan name, link to the Hub |
| **Lembrete de Renovação** | 3 days before automatic billing | Renewal date, link to manage subscription |
| **Falha no Pagamento** | When a payment attempt fails | Explanation, link to update payment method |
| **Cancelamento Confirmado** | After cancellation is processed | Confirmation, access end date, option to reactivate |

### Booking Emails

| Email | When It Sends | What It Contains |
|-------|--------------|-----------------|
| **Agendamento Confirmado** | Immediately when a booking is created | Date, time, mentor name, duration, link to manage bookings |
| **Lembrete 24h** | ~24 hours before the session | Session details, meeting link (if available) |
| **Lembrete 1h** | ~1 hour before the session | Session details, meeting link (if available) |
| **Sessão Reagendada** | When a booking is rescheduled | Old date (crossed out) + new date and time |
| **Agendamento Cancelado** | When a booking is cancelled | Session details, cancellation reason (if provided) |
| **Não Comparecimento** | When a student misses a session | Notice that it was logged as a no-show, policy reminder |

### Espaço Emails

| Email | When It Sends | What It Contains |
|-------|--------------|-----------------|
| **Convite para Espaço** | When a mentor invites a student | Mentor's name, Espaço name, unique registration link, 7-day expiry notice |

---

## When a Customer Says They Didn't Receive an Email

Work through this checklist in order:

### 1. Check the spam/junk folder
Ask the customer to check their spam or junk folder and search for emails from `noreply@euanapratica.com`. This resolves the majority of cases.

### 2. Confirm the correct email address
Verify that the email address on their account matches what they expect. Customers sometimes register with a work email and check a personal one, or vice versa.

### 3. Check if the template is enabled
Go to **Admin → Templates de Email**. Look up the relevant template and confirm the toggle is **enabled** (green). If it's disabled, the email was intentionally or accidentally turned off.

### 4. Check the email log
Go to **Admin → Saúde do Sistema** and check the email section. Every email attempt (sent, failed, or skipped) is logged in the `email_logs` table. If the email doesn't appear in the logs at all, the trigger never fired. If it shows as `failed` or `skipped`, there's a technical issue.

You can also query the database directly:
```
Admin → Saúde do Sistema → Emails section
```

### 5. Check if the trigger fired
- **Welcome email**: Confirm the user's `has_completed_onboarding` flag is `true` in the `profiles` table — if false, they may have abandoned the onboarding before finishing
- **Subscription emails**: Confirm the subscription event actually occurred (activation, cancellation, etc.) in the subscriptions table
- **Booking emails**: Confirm the booking exists and has the correct status (`confirmed` for reminders, `cancelled` for cancellations, etc.)
- **Booking reminders**: These run on a 15-minute automated schedule. If a booking reminder was missed, it may be because the booking was created less than 24h/1h before the session, or the scheduled job encountered an issue
- **Invitation emails**: Confirm an invitation record exists for the customer's email address in `espaco_invitations`

### 6. Escalate to the dev team
If all the above checks out and the email still wasn't received, escalate with:
- Customer's user ID
- The email address on their account
- The template name (e.g., `booking_confirmation`)
- The approximate date/time when it should have sent
- Any relevant booking or subscription ID
- Whether the email appears in `email_logs` (and what status it shows)

---

## Resending Emails

Currently, emails are not resendable from the admin panel directly. Options:

| Scenario | What to Do |
|----------|-----------|
| Customer missed a booking confirmation | Have them check bookings page — all info is there. If needed, escalate to dev to trigger the function manually |
| Invitation email not received | Go to the Espaço → Membros and re-send the invitation — this generates a new email |
| Payment failure email missed | Customer can be directed to their subscription page directly: `hub.euanapratica.com/dashboard/assinatura` |

---

## Invitation Links — Important Details

Invitation emails contain a **unique link** that expires after **7 days**. If a customer clicks an expired link:
- They will see an error during registration
- Go to the Espaço settings and re-send the invitation to generate a new link

Each re-invitation resets the 7-day timer.

---

## Email Address for Customers

All automated emails come from:
**EUA na Prática** `<noreply@euanapratica.com>`

This address does not receive replies. If a customer replies to an automated email, it will not be received. Direct customers to use the support channel instead.

---

## Updating Email Content

If a customer points out an error in an email (wrong information, broken link, typo):

1. Note the template name from the table above
2. Forward the feedback to Marketing or anyone with admin access
3. They can fix it immediately in **Admin → Templates de Email** without developer involvement

Changes take effect on the very next send.
