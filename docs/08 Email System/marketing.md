# Email System — Marketing Guide

## Where to Find It

Go to the admin panel and navigate to **Configurações → Templates de Email** (or directly to `/admin/email-templates`).

---

## What You Can Edit

Every automated transactional email the platform sends is listed here. You have full control over:

- **Subject line** — including emoji, personalization variables, and A/B-friendly copy
- **Email body** — full visual editing with the drag-and-drop Unlayer editor
- **On/off toggle** — disable any template without deleting it

### The 12 Templates

| Template Name | When It Sends |
|---------------|--------------|
| Boas-Vindas - Onboarding | Immediately after a new user completes the onboarding flow |
| Assinatura - Confirmação | Immediately after a new subscription is activated |
| Assinatura - Lembrete de Renovação | 3 days before automatic renewal |
| Assinatura - Falha no Pagamento | When a payment charge fails |
| Assinatura - Cancelamento | After a subscription is cancelled |
| Agendamento - Confirmação | Immediately after a booking is created |
| Agendamento - Lembrete 24h | 24 hours before the session |
| Agendamento - Lembrete 1h | 1 hour before the session |
| Agendamento - Reagendado | When a booking is rescheduled |
| Agendamento - Cancelado | When a booking is cancelled |
| Agendamento - Não Comparecimento | When a student misses a session |
| Espaço - Convite | When a mentor invites a student |

---

## How to Edit a Template

1. Click the **pencil icon** (✏️) next to any template
2. Update the **subject line** at the top if needed
3. Use the **Unlayer visual editor** to make changes to the email body:
   - Drag in text blocks, images, buttons, dividers
   - Edit directly by clicking any element
   - Use the right panel to change colors, fonts, padding, and alignment
4. Click **Salvar Template** when done

Changes go live **immediately** — no developer needed, no deployment.

---

## Personalization Variables

Each template supports dynamic variables that are automatically filled in when the email sends. You can use them anywhere in the subject line or body — just type them exactly as shown, including the `{{ }}` braces.

### Welcome / Onboarding Email
| Variable | What It Shows |
|----------|--------------|
| `{{firstName}}` | User's first name (or preferred name if set) |
| `{{dashboardLink}}` | Link to the Hub dashboard |

### Subscription Emails
| Variable | What It Shows |
|----------|--------------|
| `{{name}}` | Subscriber's full name |
| `{{planName}}` | Name of their subscription plan |
| `{{expiresAt}}` | Date the subscription expires or renews |
| `{{changeCardUrl}}` | Link to update payment method (payment failure emails only) |

### Booking Emails
| Variable | What It Shows |
|----------|--------------|
| `{{studentName}}` | Student's full name |
| `{{serviceName}}` | Name of the booked service |
| `{{formattedDate}}` | Full date in Portuguese (e.g., "segunda-feira, 24 de março de 2026") |
| `{{formattedTime}}` | Time in HH:MM format, in the student's timezone |
| `{{mentorName}}` | Mentor's full name |
| `{{durationMinutes}}` | Session length in minutes |
| `{{manageBookingLink}}` | Link to the student's bookings page |
| `{{meetingLinkSection}}` | Meeting link button (auto-inserted when available) |
| `{{oldDateSection}}` | Previous date block shown in reschedule emails |
| `{{cancellationReasonSection}}` | Cancellation reason block (shown when provided) |

### Espaco Invitation
| Variable | What It Shows |
|----------|--------------|
| `{{invitedNameGreeting}}` | Invited person's name (if provided) |
| `{{mentorName}}` | Mentor's name |
| `{{espacoName}}` | Name of the Espaço |
| `{{inviteLink}}` | The unique invitation link |

**Example subject line:**
```
🎉 Bem-vindo ao {{planName}}, {{name}}!
```

---

## Enabling and Disabling Templates

Use the **toggle switch** in the template list to turn any email on or off.

- **Disabled** templates are silently skipped — the system won't throw an error, the email just won't be sent
- Useful for pausing a template while you redesign it, or during a promotional period when you want to suppress certain automatics

---

## Important: What NOT to Remove

Some templates contain `{{variable}}` placeholders that are critical to the email's function — like `{{inviteLink}}` in the invitation email. Removing these will cause the email to send without the link.

The **Variables** column in the template list shows which variables each template uses. Make sure they remain in the body when editing.

If you're unsure, use the **eye icon** (👁) to preview the template HTML before saving.

---

## Tips for the Editor

- Use **columns** for side-by-side content layouts
- The **button block** is ideal for CTAs — set the link to the relevant URL or to a `{{variable}}`
- Test your subject line length: aim for under 50 characters to avoid mobile truncation
- Keep the email width at 600px (the default) for best inbox compatibility
- Avoid background images in the header — they don't render in all email clients
