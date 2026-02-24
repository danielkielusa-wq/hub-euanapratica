# Hub EuNaPrática — Partner Ecosystem & Monetization Strategy
**Date**: 2026-02-23
**Status**: Draft for internal review

---

## Core Thesis

> We're not just a career platform — we're a **qualified lead engine** for the entire Brazilian-to-US professional services ecosystem.

Our career evaluation captures 80+ data points per lead: income, investment willingness, English level, experience, barriers (visa, financial, English, family, time), readiness scores, and recommended products. Every business serving this audience needs exactly what we already have — access to **scored, profiled, high-intent professionals**.

---

## Platform Assets (What We Bring to Partners)

| Asset | Details |
|---|---|
| Qualified audience | Brazilian professionals actively investing in US career transitions |
| Lead scoring engine | ROTA phases, readiness scores, LTV estimates, barrier classification |
| AI profiling | 80+ field evaluations with AI-generated insights and product recommendations |
| Communication infrastructure | Email + WhatsApp nurturing already operational |
| Recommendation engine | `analyze-post-for-upsell` + `recommend-product` — AI matches users to services |
| Marketplace infrastructure | `espacos`, `mentor_services`, `bookings`, `mentor_availability` — fully built |
| Community | Forum with gamification, high engagement, multiple touchpoints |
| Job listings | Prime Jobs — existing inventory and filtering infrastructure |
| Cost-optimized AI | Fallback system + cost tracking — competitive margin advantage |

---

## Revenue Channel 1: Affiliate & Referral Partnerships

The fastest to implement. Our `hub_services` table already supports `recommendation`, `booking`, `link`, and `landing_page` types. The `recommend-product` edge function already assigns services to users. Adding partners is a **configuration change, not a rebuild**.

### Priority Partner Categories

| Category | Partners to Target | Barrier Matched | Revenue Model | Est. Monthly |
|---|---|---|---|---|
| English schools | EF, Cambly, Open English, Wise Up | English barrier | CPA R$50–150/enrollment or 15–25% rev-share | R$5–15K |
| Immigration lawyers | Law firms specializing in O1, EB, L1 visas | Visa barrier | CPA R$300–800/consultation | R$8–20K |
| Resume writing | TopResume, ZipJob, local BR services | Gap from resume analysis | CPA R$100–200 or 20% rev-share | R$3–8K |
| US credential evaluation | WES, ECE | Experience/credential gap | CPA R$50–100/application | R$2–5K |
| Relocation services | Housing, banking setup, SIM cards | "Ready to move" (ROTA A phase) | CPA R$100–300 | R$4–10K |
| LinkedIn coaching | Independent coaches, platforms | Profile optimization output | CPA or 20% rev-share | R$3–8K |

**Total estimated range**: R$25–66K/month

### How to activate
1. Add partner service to `hub_services` with partner checkout URL
2. Set service type and scoring criteria
3. `recommend-product` engine starts assigning it to matching leads automatically
4. Track conversions via `upsell_impressions` and `orders` tables

---

## Revenue Channel 2: B2B Lead Marketplace

We can sell qualified, scored leads directly to companies. The key differentiator: **we're not selling contact info — we're selling structured career profiles** with readiness scores, barrier analysis, and recommended next steps. That's 5–10x more valuable than a form fill.

### Lead Buyer Segments

| Buyer Type | Lead Criteria | Price per Lead | Est. Monthly Volume |
|---|---|---|---|
| Immigration law firms | High readiness + visa barrier | R$300–600 | 50–150 leads |
| English schools | English barrier + investment capacity | R$50–120 | 200–500 leads |
| US-based recruitment agencies | Specific industries, senior+ experience | R$200–500 | 30–80 leads |
| Financial advisors (intl. transfers) | Financial planning barrier + income bracket | R$150–300 | 40–100 leads |
| US MBA / university programs | Career change intent + education appetite | R$200–400 | 20–50 leads |

### Lead Delivery Options
- **Webhook** — real-time notification when a lead matches partner criteria
- **CSV export** — periodic batch delivery via admin
- **API access** — partner pulls leads on demand with our scoring data
- **Portal access** — read-only admin view for the partner to manage their leads

### Notes
- Always respect user consent — add opt-in language in career evaluation form
- Leads can be exclusive (sold once) or shared (sold to multiple buyers at lower price)
- Consider lead freshness pricing — newer leads command a premium

---

## Revenue Channel 3: Advertising & Sponsored Content

Our AI touches users at the highest-intent moments. Strategic placement opportunities already exist in the product flow.

### Native Advertising Touchpoints

| Moment | User Context | Placement | Model |
|---|---|---|---|
| Resume analysis results | Just learned their gaps | "Recommended: [Partner] interview coaching" | CPA or CPM |
| Title translation results | Exploring US roles | "Companies hiring for this role: [Partner]" | CPC or CPA |
| Career evaluation report | Full profile revealed | Tailored recommendations per barrier | CPA per signup |
| Prime Jobs listings | Actively job searching | Featured/sponsored job listings | CPL |
| Community categories | Topic-specific discussions | Sponsored category ("Powered by [Partner]") | Monthly flat fee |

**Note**: `upsell_impressions` already tracks views and conversions — our ad analytics layer is already built.

### Sponsored Learning Spaces (Espacos)

Partners create branded learning experiences inside our platform:
- US bank → "Financial Planning for Immigrants" space
- Recruitment agency → "Tech Interview Prep" cohort
- English school → "Business English Bootcamp" series

**Revenue model**: Sponsorship fee (R$2–8K/month) + access to enrolled student profiles as leads.

**Infrastructure already exists**: `espacos`, `espaco_invitations`, `assignments`, `submissions`, `session_attendance`.

---

## Revenue Channel 4: Lead Generation as a Service (LGaaS)

Potentially our highest-margin opportunity. We run the evaluation funnel; partners get the leads.

### Co-Branded Evaluation Funnels

Create partner-specific variants of the career evaluation form:
- "Assess your readiness for a US tech career" → co-branded with tech recruiter
- "Is your English ready for the US workplace?" → co-branded with English school
- "Immigration readiness check" → co-branded with law firm

**How it works**:
1. Partner promotes the co-branded funnel to their audience
2. Leads complete our career evaluation (we capture all data)
3. Matching leads are shared with the partner
4. We keep all leads in our nurturing pipeline regardless

**Revenue**: Setup fee (R$3–8K) + R$50–300 per qualified lead passed.

### API Access for Partners

`format-lead-report` generates rich structured career profiles. We can:
- Offer **API access** to lead scoring/profiling as a paid service
- Provide **webhooks** — when a lead matches criteria, notify partner instantly
- Build **partner dashboards** — white-labeled read-only admin views

---

## Revenue Channel 5: External Mentor Marketplace

Our booking and availability infrastructure supports an open marketplace. Currently limited to our own mentors — this can scale infinitely by onboarding external coaches.

### How the Marketplace Works
1. Vetted external mentors apply to join the platform
2. They set up `mentor_services`, `mentor_availability`, and booking policies
3. Users discover and book them through existing UI
4. Platform takes 20–30% commission on every booking

### Mentor Categories to Recruit
- Career coaches (US market specialization)
- Technical interview prep coaches (FAANG, startups)
- Industry specialists (healthcare, finance, engineering)
- Networking and personal branding coaches
- Immigration consultants (non-legal guidance)

### Mentor Tiers
| Tier | Fee | Benefits |
|---|---|---|
| Basic Mentor | 25% platform commission only | Listed in marketplace, booking tools, basic analytics |
| Featured Mentor | R$300/mo + 20% commission | Featured placement, priority in AI recommendations |
| Partner Mentor | R$600/mo + 15% commission | Dedicated profile page, co-marketing, lead access |

**Revenue potential**: At 100 external mentor bookings/month at avg R$400/session → R$8–12K/month in platform commissions at scale.

---

## Partner Program Tiers

Structured tiers to simplify sales conversations:

| Tier | Monthly Fee | What They Get |
|---|---|---|
| **Referral Partner** (Free) | Revenue share only | Listed in `hub_services`, AI recommendation engine, basic conversion analytics |
| **Growth Partner** | R$500/mo + rev-share | Co-branded content, community access, lead notifications, monthly performance reports |
| **Strategic Partner** | R$2,000/mo + rev-share | Branded learning space, API access, featured AI placement, dedicated lead funnel, custom reports |
| **Enterprise** | Custom | White-label evaluations, bulk lead access, exclusive category rights, co-development roadmap |

---

## Data & Intelligence (Long-Term Play)

With thousands of career evaluations and 80+ fields each, we have a proprietary dataset for market intelligence.

### Products to build
- **"Brazilian Professional Migration Trends" reports** — quarterly, sold to HR consultancies, universities, policy orgs (R$2–10K per report)
- **Salary benchmarking tool** — BR vs US, by industry/role/experience (B2B subscription)
- **Skill gap analysis** — by sector, sold to training providers and recruiters
- **Candidate readiness API** — "how does this candidate compare to 10K+ evaluated professionals?" (B2B)

---

## Revenue Potential Summary

```
Current:          Subscriptions + One-time Hub Services
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  Affiliate Referrals    Advertising +       Lead Sales (B2B)
  (English, Legal,       Sponsored Content   (Qualified leads
   Relocation, Resume)   (Jobs, AI, Espacos)  to partners)

  R$25–66K/mo            R$5–15K/mo          R$20–60K/mo
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    Mentor Marketplace
                    (External coaches, 20–30% take)
                    R$8–20K/mo at scale
                              │
                              ▼
                     Data & Intelligence
                     (Reports, API, benchmarks)
                     R$5–15K/mo
```

**Total addressable partner revenue: R$63–176K/month** on top of existing subscriptions.

---

## Competitive Moat

What makes our partner ecosystem defensible:

- **AI-powered lead scoring** — partners can't replicate our 80+ field evaluation + AI profiling internally
- **WhatsApp + Email infrastructure** — we warm leads before passing them, increasing partner close rates
- **Community stickiness** — gamification keeps users engaged, increasing partner exposure over time
- **Cost-optimized AI** — our fallback system + cost tracking enables margins competitors can't match
- **Subscription lock-in** — paying users have high switching costs, partners benefit from a captive audience
- **First-party data** — no reliance on third-party cookies or ad platforms

---

## Quick Wins (Prioritized by Effort vs. Impact)

| # | Initiative | Effort | Impact | Start With |
|---|---|---|---|---|
| 1 | English school affiliate (e.g. Cambly) | Low — add to `hub_services` | High | Contact 2–3 schools this week |
| 2 | Immigration lawyer referral program | Low — add to `hub_services` + CPA agreement | Very High | 1 firm, test conversion first |
| 3 | Sponsored Prime Jobs listings | Low — add `sponsored` flag to `jobs` table | Medium | Direct outreach to 5 US companies |
| 4 | External mentor marketplace | Medium — partner onboarding flow | High | Invite 5 vetted coaches to test |
| 5 | Co-branded career evaluation funnel | Medium — duplicate form + branding | Very High | 1 partner, validate the model |
| 6 | Lead sale pilot | Medium — export + consent flow | Very High | Pilot with 1 immigration firm |
| 7 | Sponsored learning spaces | High — content production + sales | High | Only after mentor marketplace validated |
| 8 | Data & intelligence reports | High — data aggregation + design | Medium | Q3/Q4 2026 |

---

## Open Questions to Resolve

- [ ] Do we have explicit user consent to share lead data with third parties? (Required before any lead sales)
- [ ] What's our current lead volume per month? (Determines B2B lead sales viability)
- [ ] Do we want to stay Brazil-focused or expand the partner ecosystem internationally?
- [ ] What's the right commission split for the mentor marketplace?
- [ ] Do we build a self-serve partner portal or manage partnerships manually at first?
- [ ] Which verticals should we pursue exclusively to create category lock-in?
- [ ] Are there competitive conflicts between partners (e.g. two English schools)?
- [ ] What legal structure handles the lead sale/sharing agreements (LGPD compliance)?

---

## Next Steps

1. **Validate demand** — talk to 3–5 potential partners before building anything
2. **Map consent language** — review career evaluation form for data sharing opt-in
3. **Define partner pitch deck** — lead volume, quality metrics, scoring methodology
4. **Pick one Quick Win** — run a 30-day pilot with one partner before scaling
5. **Set up tracking** — define KPIs: leads referred, conversion rate, revenue per partner

---

*Generated from platform analysis on 2026-02-23. Platform: hub-euanapratica.*
