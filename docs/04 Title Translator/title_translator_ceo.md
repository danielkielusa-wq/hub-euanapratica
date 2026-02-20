# Title Translator — Executive Brief

**Last Updated:** February 19, 2026
**Audience:** Executive Leadership
**Status:** Production (Beta Label)

---

## What Title Translator Does

Title Translator is an AI-powered tool that converts Brazilian job titles into their American market equivalents. A user enters their Brazilian title (e.g., "Coordenador de TI"), optionally adds context about their responsibilities and experience, and receives three ranked US title suggestions with confidence scores, salary ranges, example companies that use those titles, and sample job description snippets. The tool recommends the best match and explains why it fits their specific profile.

This is one of several career transition tools within the EUA na Prática platform, which helps Brazilian professionals prepare for and secure jobs in the United States.

---

## Target User & Problem Solved

**Who:** Brazilian professionals (ages 25-45) actively pursuing US career opportunities across Technology, Finance, Marketing, Operations, Engineering, Sales, Product, and Design.

**Problem:** Job titles in Brazil often don't translate directly to the American market. A "Coordenador" in Brazil might be a "Team Lead," "Manager," or "Supervisor" in the US depending on actual scope of work. Using the wrong title on resumes and LinkedIn profiles causes:
- Missed opportunities (wrong title = wrong search results for recruiters)
- Lowball salary offers (misaligned seniority expectations)
- Confusion during interviews (candidates and employers talking past each other)

**Solution:** Title Translator provides data-driven, context-aware translations that help users position themselves accurately in the US market, increasing their visibility to recruiters and setting appropriate salary expectations.

---

## Current Product State

**Status:** Production-ready, revenue-generating, labeled as "Beta Tool" in the UI.

The feature launched in February 2026 and is actively used. It integrates with the existing subscription system (Basic/Pro/VIP plans) and shares the same credit/quota infrastructure as other platform tools like ResumePass AI.

**User Flow:** Users access the tool from the main dashboard navigation. The interface is polished and matches the platform's design system. Results are instant (typically 5-10 seconds) and visually presented with clear hierarchy: recommended title at the top, alternatives below.

**Technical Maturity:** Fully functional with proper error handling, quota enforcement, usage tracking, audit logging, and admin configuration controls. No critical bugs or open blockers identified in the codebase.

---

## External Dependencies & Business Risks

⚠️ **Critical Dependency: OpenAI API**
We use OpenAI's GPT-4o-mini model as the default AI provider for title translation. If OpenAI changes pricing, rate limits, or model availability, it directly impacts our ability to deliver this service.

- **Current Cost Structure:** Pay-per-token model (~$0.15 per 1M input tokens, $0.60 per 1M output tokens)
- **Fallback Option:** We have Anthropic Claude Haiku configured as an alternative provider, switchable by admins without code changes
- **Risk Mitigation:** Multi-provider architecture allows us to switch APIs if one becomes unavailable or too expensive

⚠️ **API Key Security**
API credentials are stored encrypted in the Supabase database. If the encryption key is compromised or if database access is breached, API keys could be exposed, leading to unauthorized usage charges.

⚠️ **Rate Limiting Risk**
If we experience viral growth or usage spikes, we could hit OpenAI's rate limits, causing temporary service disruptions. Currently no queuing system in place for failed requests.

---

## Revenue Model & Monetization

**Pricing Model:** Credit-based system tied to subscription tiers

- **Basic Plan (Free):** 1 translation/month
- **Pro Plan:** 10 translations/month
- **VIP Plan:** 999 translations/month (effectively unlimited)

**Monetization Logic:**
1. Users hit their credit limit
2. System displays upgrade modal prompting them to move to Pro or VIP
3. Upgrade flow redirects to plan selection page with payment integration (Ticto)

**Revenue Impact:**
Title Translator serves as a **feature differentiator** and **upgrade driver** rather than a standalone revenue stream. It's part of the value stack that justifies the Pro/VIP tier pricing.

⚠️ **Inferred — needs verification:** No direct tracking of upgrade conversions attributed specifically to Title Translator hitting limits. Recommend adding conversion attribution to measure ROI.

**Cost Structure:**
- Basic users (1 translation/month): ~$0.002 per user/month in AI costs
- Pro users (10 translations/month): ~$0.02 per user/month in AI costs
- VIP users: Variable, but likely under $0.20/user/month unless heavily used

**Margin:** Extremely high gross margin (>99%) assuming normal usage patterns.

---

## Critical Risks & Open Questions

1. **No Usage Analytics Dashboard**
   We're tracking usage in the database but don't have a CEO-level dashboard showing:
   - How many users are actually using Title Translator
   - Average translations per active user
   - Conversion rate from free → paid after hitting limits
   - User satisfaction or accuracy feedback

2. **AI Accuracy Not Validated**
   No systematic quality assurance process for AI outputs. We're trusting the model to produce accurate titles, salary ranges, and company examples. A bad suggestion could harm user credibility in the job market.

3. **Competitor Differentiation Unclear**
   Users could manually Google "Brazilian job title in USA" or use ChatGPT directly for free. What makes our solution worth paying for? The context-aware analysis and integration with our resume/job tools is valuable, but this positioning isn't explicitly documented or marketed.

4. **Localization Gaps**
   All UI text is in Portuguese, but AI prompts request data formatted for the US market (salary in USD, company names in English). This works for the target user, but edge cases (users who want European market titles, or non-Brazilian Portuguese speakers) would fail.

5. **No Historical Insights**
   Translation history is stored in the database but not surfaced to users. We could provide "Your Translation History" to add value and encourage repeat usage, but this isn't built yet.

---

## What's Working Well

✅ **Clean Integration:** Fits naturally into the platform's existing plan/quota system. No special-case logic needed.

✅ **Low Operating Cost:** AI costs are negligible relative to subscription revenue. Even VIP unlimited users are unlikely to exceed a few dollars per month in API costs.

✅ **Multi-Provider Flexibility:** Admin can switch between OpenAI and Anthropic Claude without developer intervention. This de-risks vendor lock-in.

✅ **User Experience:** Based on UI review, the interface is polished, intuitive, and fast. Copy-to-clipboard functionality for titles makes it frictionless to use the output.

✅ **Compliance & Security:** Proper row-level security policies, audit logging, and quota enforcement prevent abuse and ensure fair access.

---

## What Needs Investment

**High Priority:**
- **Analytics Dashboard:** Build CEO/admin view of Title Translator usage, conversion funnel, and ROI metrics
- **Quality Assurance:** Implement spot-checking or user feedback mechanism to validate AI accuracy
- **Marketing Assets:** Create case studies, blog posts, or video demos showing Title Translator in action to drive awareness

**Medium Priority:**
- **Translation History UI:** Let users view past translations to increase perceived value and stickiness
- **Bulk Translation:** Allow Pro/VIP users to upload multiple titles at once (consumes multiple credits)
- **Email Upsell:** When Basic users hit their 1 translation limit, send automated email nudging upgrade

**Low Priority:**
- **European Market Support:** Expand beyond US market to UK, Canada, Australia, Germany
- **API Access:** Let enterprise customers access Title Translator via API for integration into their own tools

---

## Bottom Line

Title Translator is a well-executed feature that solves a real pain point for our target user base. It's production-ready, low-cost to operate, and architecturally sound. The primary risk is our dependency on third-party AI providers, which is mitigated by multi-provider support.

The main gap is **visibility**: we don't yet know if this feature is driving upgrades or just a nice-to-have. Recommend investing in analytics and user feedback loops to measure impact and guide future investment decisions.

If this feature proves to be a conversion driver, we should double down on marketing it and potentially build related features (e.g., "Resume Bullet Point Translator," "Cover Letter US-ifier"). If usage is low, we can deprioritize enhancements and maintain it as-is as part of the broader value proposition.
