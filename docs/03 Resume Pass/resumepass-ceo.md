# ResumePass AI — Executive Brief

**Date:** February 19, 2026
**Audience:** Executive Leadership

---

## What It Is

ResumePass AI analyzes resumes against US job descriptions and produces a detailed compatibility report with scoring, improvement suggestions, and interview preparation guidance. Users upload their resume (PDF or Word), paste a job description, and receive an AI-powered analysis within seconds that tells them how well their resume matches the role and what to fix.

This is a revenue-generating feature within the larger EU NA PRÁTICA Hub platform, targeted at Brazilians seeking US employment opportunities.

## Product State

**Production-ready and monetized.** The product is live with a working three-tier subscription model:

- **Básico (Free tier):** 1 analysis per month, basic scoring only
- **Pro:** 10 analyses per month with improvement suggestions and interview prep ($X/month — pricing visible in database)
- **VIP:** Unlimited analyses (999/month cap) with all features plus priority support

The core AI engine, database schema, usage tracking, and plan enforcement are fully implemented and operational. Reports are saved to the database for future reference. PDF export is available for paying customers.

## Target User & Problem

**Who:** Brazilian professionals applying to US tech jobs, particularly those unfamiliar with ATS (Applicant Tracking Systems) and American resume conventions.

**Problem they face:** Brazilian resumes follow different formatting standards, use different terminology, and often get automatically rejected by US hiring systems before a human ever sees them. Users don't know why they're getting rejected or how to fix it.

**What we solve:** We bridge the cultural and technical gap — explaining why their resume scores poorly (ATS compatibility, keyword density, action verb usage, length), translating their Brazilian job titles to US equivalents, estimating their US market salary, and providing specific before/after improvement examples.

## Revenue Model

Subscription-based SaaS with tiered feature gating:

- **Monthly analysis quotas** enforced at both client and server levels (cannot be bypassed)
- **Feature stripping** via AI prompt modification — free users don't receive improvement suggestions or interview prep, even if they hack the frontend
- **Usage tracking** is critical — every analysis execution is logged to a `usage_logs` table with retry logic to prevent free usage if logging fails

Revenue protection is strong: quota enforcement happens server-side in the edge function (not just the UI), and usage recording uses exponential backoff retries. If we can't record usage after 3 attempts, the request fails — this prevents giving away free analyses during database outages.

## Key External Dependencies (Business Risks)

### OpenAI API — CRITICAL DEPENDENCY
- **What we rely on:** OpenAI's `gpt-4.1-mini` model powers the entire analysis engine. Every analysis is a real-time API call.
- **Business risk:**
  - Pricing changes directly affect our unit economics
  - Rate limits or availability issues break the product entirely
  - Model behavior changes could degrade output quality
- **Mitigation status:** ⚠️ Single vendor dependency, no fallback AI provider configured

### Supabase (Database + Auth + Storage) — CRITICAL DEPENDENCY
- **What we rely on:** User authentication, subscription data, usage logs, file storage
- **Business risk:** Infrastructure outage = complete product downtime
- **Mitigation status:** Standard cloud SaaS risk, no multi-cloud redundancy

### API Configuration Table
- **What it is:** AI system prompts are stored in the database (`app_configs` table) and can be edited by admins
- **Business risk:** A compromised admin account could modify the AI prompt to produce harmful output or exfiltrate data
- **Mitigation status:** ⚠️ Admin access controls should be audited

## What's Working Well

1. **Revenue protection is robust** — dual-layer quota enforcement (client + server) and retry-based usage logging make it very difficult to abuse the free tier
2. **Plan feature gating at AI level** — premium features are stripped via prompt modification, so even if someone bypasses the UI locks, they get empty data from the backend
3. **User experience is smooth** — localStorage bridging between pages, auto-save to database, client-side quota checks for instant feedback
4. **Reports are persistent** — users can access their analysis history, not just the most recent one

## What Needs Investment

### 1. Single Point of Failure — OpenAI
**Impact:** High revenue risk
We have zero fallback if OpenAI changes pricing, degrades service, or modifies model behavior. Consider:
- Adding a secondary AI provider (Anthropic Claude, etc.)
- Implementing cost monitoring and per-user spending caps
- Caching common job description + resume patterns to reduce API calls

### 2. Feature Stripping Relies on Prompt Compliance
**Impact:** Medium revenue leakage risk
Premium features are gated by telling the AI "return empty arrays for improvements." This works today but is not guaranteed — AI models occasionally ignore instructions.
**Fix needed:** Server-side post-processing to force-empty premium fields for free users, regardless of AI output.

### 3. No File Size Limits
**Impact:** Low operational risk
Users can upload arbitrarily large files, potentially causing edge function timeouts or memory issues.
**Fix needed:** Client-side and server-side file size validation (suggest 10MB max).

### 4. Fire-and-Forget Report Saving
**Impact:** Low user experience risk
Reports are auto-saved after analysis, but if the save fails, users aren't notified. They rely on localStorage backup.
**Fix needed:** Make save operation awaited and show a toast notification if it fails.

### 5. Orphaned Files in Storage
**Impact:** Low cost risk
If the analysis fails mid-process, temporary resume files remain in the `temp-resumes` storage bucket indefinitely.
**Fix needed:** Implement a cleanup job or TTL policy for files older than 24 hours.

## Critical Questions for Leadership

1. **OpenAI cost monitoring:** Do we have dashboards tracking per-analysis cost and monthly AI spend? What's our unit economics target?

2. **Plan pricing:** The Pro and VIP plan pricing exists in the database but isn't visible in this codebase review. What are the actual dollar amounts, and are conversion rates being tracked?

3. **Competitive positioning:** Are we seeing users complete one free analysis and churn, or are they converting to paid plans? What's the free-to-paid conversion rate?

4. **Market validation:** Is the Brazilian → US job seeker segment large enough to scale this into a standalone product, or is it best positioned as a value-add within the broader hub?

5. **Technical debt prioritization:** Should we invest in the fallback AI provider and post-processing security before adding new features?

---

**Bottom line:** The product is technically sound and revenue-protected, but carries single-vendor risk on OpenAI. Usage tracking and quota enforcement are production-grade. The main investment needed is operational resilience (AI fallback, cost monitoring, cleanup jobs) and tightening feature leakage prevention. Product-market fit question is open — conversion data would clarify whether this should scale independently or remain a hub feature.
