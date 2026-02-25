# Email System — Executive Summary

## What Was Built

We replaced 6 separate hardcoded email templates scattered across the codebase with a single, centralized **Email Template Manager** accessible directly from the admin panel.

---

## The Problem Before

Every time an email needed to be updated — a subject line, a greeting, a link, a policy notice — a developer had to:
1. Find the right file in the codebase
2. Edit raw HTML code
3. Deploy the change to production
4. Wait for deployment to complete

This created bottlenecks, delayed time-sensitive communications, and introduced risk every time the templates touched production infrastructure.

---

## What's Different Now

**Anyone with admin access can edit any email template in under 2 minutes**, with no developer involvement and no deployment required.

Changes go live immediately after saving.

---

## What the System Covers

Every automated email the platform sends is now managed through this system:

| Category | Emails |
|----------|--------|
| **Onboarding** | Welcome email (sent after completing the 6-step setup flow) |
| **Subscriptions** | Welcome / activation, Renewal reminder, Payment failure, Cancellation confirmed |
| **Bookings** | Booking confirmed, Reminder (24h before), Reminder (1h before), Rescheduled, Cancelled, No-show |
| **Espaços** | Student invitation |

**12 templates total**, all editable from the admin panel at `/admin/email-templates`.

---

## Business Impact

**Speed** — Marketing or Customer Success can update email content the moment a decision is made. No sprint planning, no dev ticket, no waiting.

**Control** — Each template can be individually enabled or disabled. If an email is causing issues, it can be turned off in seconds without touching code.

**Flexibility** — Adding a new automated email in the future requires no code changes. The team inserts a new template row in the admin panel, and the system handles the rest.

**Risk reduction** — The previous system had templates embedded directly in server functions, where a typo in the HTML could break the entire email pipeline for that notification type. Now, the sending logic and the content are separated. Content mistakes are isolated and easily corrected.

---

## What It Does Not Change

- Email delivery still uses **Resend** (our existing provider)
- Deliverability, sender reputation, and domain settings are unchanged

---

## Automated Triggers (Updated Feb 2026)

All email triggers are now fully wired up. Previously, some email functions existed but were never called — this was fixed in the Feb 24 2026 update.

| Trigger Type | How It Works |
|-------------|-------------|
| **Welcome** | Sent automatically when a new user completes onboarding |
| **Booking emails** | Triggered from the Hub frontend when users create, cancel, or reschedule bookings |
| **Booking reminders** | Sent automatically by a scheduled job every 15 minutes (24h and 1h before sessions) |
| **Subscription emails** | Triggered automatically when Ticto processes a payment event (activation, failure, cancellation) |
| **Cancellation email** | Triggered when a user cancels their subscription from the account page |
| **Espaço invitation** | Triggered when a mentor invites a student |
| **Prime Jobs digest** | Sent automatically every Monday morning to active subscribers |

---

## Cost

No additional infrastructure cost. The system runs on the existing Supabase database and Edge Function setup. The email editor (Unlayer) is integrated at no additional cost on the free tier.
