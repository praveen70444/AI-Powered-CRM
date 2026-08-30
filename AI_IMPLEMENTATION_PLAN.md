# AI-Powered CRM — Implementation Plan

> Based on full codebase analysis.  
> Traditional CRM: ✅ 100% complete (28 DB tables, ~80 APIs, 29 frontend pages)  
> AI Layer: ❌ 0% implemented — this document is the build plan.

---

## What You Already Have (Foundation)

```
Backend (Node.js + Express + PostgreSQL)
├── Auth, roles, JWT ✅
├── Leads, Customers, Deals, Tasks, Activities, Notes ✅
├── Products, Quotes ✅
├── Calendar, Tags, Custom Fields ✅
├── Export (CSV/Excel/PDF), Analytics ✅
├── Webhooks, API Keys ✅
├── Audit Logs, Email, File Upload ✅
└── Rate limiting, Helmet, Winston logging ✅

Frontend (React + Tailwind)
├── 20 employee pages + 9 org admin pages ✅
├── GlobalSearch, ExportMenu, TagsInput ✅
├── Charts (Bar, Donut) ✅
└── Calendar, Analytics, ConvertLeadModal ✅
```

The AI layer builds **on top** of this — no existing code needs to be rewritten.

---

## AI Features to Build (Priority Order)

---

### Feature 1 — AI Lead Scoring
**What it does**: Scores every lead 0–100 based on source quality, engagement activity, value, and how long it has been open. Displayed as a badge on every lead row.

**Why first**: Needs only existing data — no new DB columns needed initially. High visual impact, easy to demo.

**How it works** (rule-based, no external API required):

```
Score = source_score (0-30)
      + recency_score (0-25)      ← days since created
      + value_score (0-25)        ← deal value relative to org average
      + activity_score (0-20)     ← notes + activities logged for this lead
```

**Backend files to create**:
```
server/services/aiLeadScoringService.js
server/controllers/aiController.js       (new, shared AI controller)
```

**New API endpoints**:
```
GET  /api/employee/leads/:id/ai-score
POST /api/employee/leads/ai-score-all        ← bulk score for dashboard
```

**Database changes**:
```sql
ALTER TABLE leads ADD COLUMN ai_score INTEGER DEFAULT NULL;
ALTER TABLE leads ADD COLUMN ai_score_label VARCHAR(20);   -- Hot / Warm / Cold
ALTER TABLE leads ADD COLUMN ai_score_updated_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN ai_score_factors JSONB;       -- breakdown
```

**Frontend changes**:
- `LeadScoreBadge.jsx` — colored pill (🔴 Hot / 🟡 Warm / 🔵 Cold)
- Add score column to `Leads.jsx` table
- Add "Sort by AI Score" option to toolbar

---

### Feature 2 — Deal Health Score & Risk Alerts
**What it does**: Each deal gets a health score (0–100) and risk flags. Shown on the Deals kanban/list.

**Scoring factors**:
```
+ Stage weight          (New=10, Qualified=25, Proposal=40, Negotiation=60, etc.)
+ Days since last activity  (penalty for stale deals)
+ Days to close date    (urgency bonus/penalty)
+ Has linked customer   (bonus)
+ Has notes             (engagement signal)
```

**Risk flags generated**:
- `stale` — no activity in 7+ days
- `overdue` — past close date, not Won/Lost
- `no_contact` — no email or call activity
- `high_value_at_risk` — value > org average AND health < 40

**New API endpoints**:
```
GET /api/employee/deals/:id/ai-health
GET /api/employee/deals/ai-health-summary    ← for dashboard widget
```

**Database changes**:
```sql
ALTER TABLE deals ADD COLUMN ai_health_score INTEGER DEFAULT NULL;
ALTER TABLE deals ADD COLUMN ai_health_label VARCHAR(20);
ALTER TABLE deals ADD COLUMN ai_risk_flags JSONB;           -- array of flag strings
ALTER TABLE deals ADD COLUMN ai_health_updated_at TIMESTAMPTZ;
```

**Frontend changes**:
- `DealHealthBadge.jsx` — health bar with label
- Risk flag chips on deal cards
- "At Risk Deals" widget on DashboardHome

---

### Feature 3 — Smart Next-Action Recommendations
**What it does**: For each lead/customer/deal, the AI suggests the single most impactful next action to take.

**Logic**:
```
Lead logic:
  - status=New + no activities → "Make first contact"
  - status=Contacted + no follow-up in 3 days → "Send follow-up email"
  - status=Qualified + no deal linked → "Create a deal"
  - value > threshold + status=Qualified → "Schedule a demo"

Deal logic:
  - stage=Proposal + no quote linked → "Send a quote"
  - stage=Negotiation + no activity in 5 days → "Follow up on proposal"
  - close_date in 3 days + stage != Won/Lost → "Urgently follow up"

Customer logic:
  - last_activity > 30 days → "Schedule check-in call"
  - total_spend high + no recent deal → "Explore upsell opportunity"
```

**New API endpoint**:
```
GET /api/employee/ai/next-actions          ← top 10 across all modules
GET /api/employee/leads/:id/ai-next-action
GET /api/employee/deals/:id/ai-next-action
GET /api/employee/customers/:id/ai-next-action
```

**Frontend changes**:
- `NextActionBanner.jsx` — blue suggestion bar inside detail views
- "Today's Actions" panel on DashboardHome (replaces static upcoming tasks)

---

### Feature 4 — AI Email Composer (OpenAI)
**What it does**: Generates a professional email draft for a lead or customer with one click.

**This is the first feature requiring OpenAI API key.**

**Backend flow**:
```
POST /api/employee/ai/compose-email
Body: { entityType: "lead", entityId: 5, purpose: "follow_up", tone: "professional" }

1. Fetch entity data from DB (name, company, status, last activity)
2. Build a prompt with context
3. Call OpenAI Chat Completions API
4. Return { subject, body, generatedAt }
```

**OpenAI prompt template**:
```
You are a professional sales assistant. Write an email to {name} from {company}.
Purpose: {purpose}
Tone: {tone}
Context: Lead status is {status}. Last activity was {lastActivity}.
Keep it concise (under 150 words). Output JSON: { "subject": "...", "body": "..." }
```

**Backend files**:
```
server/services/aiEmailService.js      ← OpenAI integration
server/services/openaiClient.js        ← shared OpenAI client wrapper
```

**New API endpoints**:
```
POST /api/employee/ai/compose-email
POST /api/employee/ai/improve-email     ← rewrite a draft the user typed
```

**Database changes**:
```sql
CREATE TABLE ai_generated_emails (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id),
  user_id BIGINT REFERENCES users(id),
  entity_type VARCHAR(50),
  entity_id BIGINT,
  purpose VARCHAR(100),
  subject TEXT,
  body TEXT,
  model_used VARCHAR(100),
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Frontend changes**:
- `AIEmailComposer.jsx` — modal with purpose dropdown, tone selector, "Generate" button
- Integrates into Lead detail view and Customer detail view
- Copy-to-clipboard button on generated output

**Environment variable needed**:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini        # cheaper, fast, great for email
```

---

### Feature 5 — Revenue Forecasting
**What it does**: Predicts next 3-month revenue using deal pipeline data. Shown as a panel on the Analytics page (which already exists).

**Algorithm** (no ML library needed — weighted pipeline model):
```
For each deal not Won/Lost:
  weighted_value = deal.value × stage_probability

Stage probabilities:
  New          → 10%
  Qualified    → 25%
  Proposal     → 50%
  Negotiation  → 75%

Monthly forecast = SUM(weighted_value WHERE close_date IN that month)
Confidence interval = ±15% (low variance) or ±30% (high variance based on spread)
```

**New API endpoint**:
```
GET /api/employee/ai/forecast?months=3
```

**Response**:
```json
{
  "forecast": [
    { "month": "Sep 2026", "predicted": 42000, "low": 35700, "high": 48300, "dealsCount": 8 },
    { "month": "Oct 2026", "predicted": 61000, "low": 51850, "high": 70150, "dealsCount": 12 },
    { "month": "Nov 2026", "predicted": 38000, "low": 32300, "high": 43700, "dealsCount": 7 }
  ],
  "pipelineTotal": 141000,
  "weightedTotal": 74450,
  "methodology": "weighted_stage_probability"
}
```

**Frontend changes**:
- New "Revenue Forecast" chart section in `Analytics.jsx`
- Forecasted bars shown in a different color from actual revenue
- Confidence range shown as shaded area

---

### Feature 6 — Churn Risk Detection
**What it does**: Identifies customers that show signs of going inactive.

**Risk signals**:
```
HIGH RISK if:
  - status = 'At Risk'
  - OR no activity in 60+ days AND total_spend > 0
  - OR previously active deal went Lost recently

MEDIUM RISK if:
  - no activity in 30–59 days
  - OR status = 'Inactive'

LOW RISK: everything else
```

**New API endpoint**:
```
GET /api/employee/ai/churn-risk          ← list with risk levels
```

**Database changes**:
```sql
ALTER TABLE customers ADD COLUMN ai_churn_risk VARCHAR(20);   -- HIGH / MEDIUM / LOW
ALTER TABLE customers ADD COLUMN ai_churn_factors JSONB;
ALTER TABLE customers ADD COLUMN ai_churn_updated_at TIMESTAMPTZ;
```

**Frontend changes**:
- "At Risk Customers" widget on DashboardHome
- Churn risk badge on Customers list
- Filter: "Show only at-risk customers"

---

### Feature 7 — AI-Powered Natural Language Search (OpenAI)
**What it does**: User types a plain English query and gets filtered CRM results.

```
"Show me leads from tech companies worth over 10k"
→ { entity: "leads", filters: { industry: "tech", value_gt: 10000 } }

"Deals closing this month that are in negotiation"
→ { entity: "deals", filters: { stage: "Negotiation", close_date_month: "current" } }
```

**Backend flow**:
```
POST /api/employee/ai/search
Body: { query: "leads from tech companies worth over 10k" }

1. Send query to OpenAI with a structured prompt
2. OpenAI returns JSON filter spec
3. Backend converts spec to a PostgreSQL query
4. Execute query and return results
```

**OpenAI prompt**:
```
You are a CRM query parser. Parse this user query into a JSON filter:
Query: "{userQuery}"
Entities: leads, customers, deals, tasks
Available filters: status, source, value_gt, value_lt, stage, company, industry, close_date_before, close_date_after
Return ONLY valid JSON like: { "entity": "leads", "filters": { "value_gt": 10000 } }
```

**New API endpoints**:
```
POST /api/employee/ai/search
```

**Frontend changes**:
- Upgrade `GlobalSearch.jsx` with an "AI Search" tab
- Show parsed filter interpretation below results: `"Showing leads where value > $10,000"`

---

### Feature 8 — Daily AI Briefing
**What it does**: At the top of the employee dashboard, a personalized AI-generated summary of what to focus on today.

**Content (no OpenAI needed for basic version)**:
```
Generated text format:
"You have 3 overdue tasks, 2 deals closing this week, and 1 high-risk customer.
Your top lead 'Acme Corp' has been in Qualified status for 8 days — consider moving it forward."
```

**For enhanced version (with OpenAI)**:
- Send stats to GPT → get a natural language briefing paragraph

**New API endpoint**:
```
GET /api/employee/ai/daily-briefing
```

**Response**:
```json
{
  "briefing": "Good morning. You have 3 urgent tasks due today...",
  "highlights": [
    { "type": "urgent", "message": "2 deals closing this week need attention" },
    { "type": "opportunity", "message": "Lead 'Acme Corp' is ready for next stage" },
    { "type": "risk", "message": "Customer 'TechVentures' hasn't been contacted in 45 days" }
  ],
  "generatedAt": "2026-08-27T08:00:00Z"
}
```

**Frontend changes**:
- `AIBriefingCard.jsx` — card at top of DashboardHome
- Dismiss/refresh button
- Animated sparkle icon to signal AI content

---

### Feature 9 — AI Note Summarization (OpenAI)
**What it does**: When a lead/customer/deal has 3+ notes, an AI summary of all notes is shown at the top.

**Example**:
```
3 notes on Acme Corp lead:
- "Called John, interested in enterprise plan"
- "Sent pricing sheet, follow up next week"  
- "John escalated to VP of Sales for approval"

AI Summary: "Acme Corp is engaged and has escalated to VP level. Budget approval is pending. 
Recommended next step: schedule a closing call."
```

**New API endpoint**:
```
POST /api/employee/ai/summarize-notes
Body: { entityType: "lead", entityId: 5 }
```

**Frontend changes**:
- Auto-shown summary block in Notes tab of lead/customer/deal detail
- "Regenerate summary" button

---

### Feature 10 — AI Settings Panel (Org Admin)
**What it does**: Organization admin can enable/disable AI features and configure them.

**New page**: `OrganizationAISettingsPage.jsx`

**Settings available**:
```
✅ Enable AI Lead Scoring
✅ Enable Deal Health Scores  
✅ Enable Next-Action Recommendations
✅ Enable Email Composer (requires API key)
✅ Enable Natural Language Search (requires API key)
✅ Enable Daily Briefing
✅ Enable Note Summarization (requires API key)
[ API Key field — encrypted, never shown after save ]
```

**New API endpoints**:
```
GET /api/organization/ai-settings
PUT /api/organization/ai-settings
```

**Database changes**:
```sql
CREATE TABLE ai_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  lead_scoring_enabled BOOLEAN DEFAULT TRUE,
  deal_health_enabled BOOLEAN DEFAULT TRUE,
  next_actions_enabled BOOLEAN DEFAULT TRUE,
  email_composer_enabled BOOLEAN DEFAULT FALSE,
  nl_search_enabled BOOLEAN DEFAULT FALSE,
  daily_briefing_enabled BOOLEAN DEFAULT TRUE,
  note_summarization_enabled BOOLEAN DEFAULT FALSE,
  openai_api_key_hash TEXT,                   -- SHA-256 hash only; key stored encrypted
  openai_api_key_set BOOLEAN DEFAULT FALSE,   -- whether key exists
  openai_model VARCHAR(100) DEFAULT 'gpt-4o-mini',
  monthly_token_limit INTEGER DEFAULT 100000,
  tokens_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## Complete File Structure After AI Integration

### New Backend Files
```
server/
├── services/
│   ├── openaiClient.js                  ← shared OpenAI wrapper
│   ├── aiLeadScoringService.js          ← Feature 1
│   ├── aiDealHealthService.js           ← Feature 2
│   ├── aiNextActionService.js           ← Feature 3
│   ├── aiEmailService.js                ← Feature 4
│   ├── aiForecastService.js             ← Feature 5
│   ├── aiChurnRiskService.js            ← Feature 6
│   ├── aiSearchService.js               ← Feature 7
│   ├── aiBriefingService.js             ← Feature 8
│   └── aiSummarizationService.js        ← Feature 9
│
├── controllers/
│   └── aiController.js                  ← handles all AI routes
│
└── routes/
    └── aiRoutes.js                      ← /api/employee/ai/* and /api/organization/ai-settings
```

### New Frontend Files
```
client/src/
├── components/ai/
│   ├── AIBriefingCard.jsx               ← Feature 8
│   ├── LeadScoreBadge.jsx               ← Feature 1
│   ├── DealHealthBadge.jsx              ← Feature 2
│   ├── NextActionBanner.jsx             ← Feature 3
│   ├── AIEmailComposer.jsx              ← Feature 4
│   ├── ChurnRiskBadge.jsx               ← Feature 6
│   └── AISearchPanel.jsx                ← Feature 7
│
└── pages/organization/
    └── OrganizationAISettingsPage.jsx   ← Feature 10
```

---

## Database Migration (Full)

```sql
-- Feature 1: Lead Scoring
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_label VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_factors JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_updated_at TIMESTAMPTZ;

-- Feature 2: Deal Health
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_score INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_label VARCHAR(20);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_risk_flags JSONB;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_updated_at TIMESTAMPTZ;

-- Feature 6: Churn Risk
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_risk VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_factors JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_updated_at TIMESTAMPTZ;

-- Feature 4: Email Composer Logs
CREATE TABLE IF NOT EXISTS ai_generated_emails (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  purpose VARCHAR(100),
  subject TEXT,
  body TEXT,
  model_used VARCHAR(100),
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Feature 10: AI Settings
CREATE TABLE IF NOT EXISTS ai_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  lead_scoring_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  deal_health_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  next_actions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_composer_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  nl_search_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  daily_briefing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  note_summarization_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  openai_api_key_encrypted TEXT,
  openai_api_key_set BOOLEAN NOT NULL DEFAULT FALSE,
  openai_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
  monthly_token_limit INTEGER NOT NULL DEFAULT 100000,
  tokens_used_this_month INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_leads_ai_score ON leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_deals_ai_health ON deals(ai_health_score);
CREATE INDEX IF NOT EXISTS idx_customers_ai_churn ON customers(ai_churn_risk);
CREATE INDEX IF NOT EXISTS idx_ai_emails_org ON ai_generated_emails(organization_id);
```

---

## New API Routes Summary

```
/api/employee/ai/
  GET  leads/:id/ai-score
  POST leads/ai-score-all
  GET  deals/:id/ai-health
  GET  deals/ai-health-summary
  GET  leads/:id/ai-next-action
  GET  deals/:id/ai-next-action
  GET  customers/:id/ai-next-action
  GET  ai/next-actions                  ← top 10 cross-module
  POST ai/compose-email
  POST ai/improve-email
  GET  ai/forecast
  GET  ai/churn-risk
  POST ai/search                        ← natural language search
  GET  ai/daily-briefing
  POST ai/summarize-notes

/api/organization/
  GET  ai-settings
  PUT  ai-settings
```

---

## New npm Dependencies Needed

```bash
# Server only
npm install openai        # Official OpenAI Node.js SDK
```

That is the only new dependency. Everything else (Express, pg, Winston, etc.) is already installed.

```json
"openai": "^4.56.0"
```

---

## Environment Variables to Add

```env
# server/.env additions

# OpenAI (required for Features 4, 7, 9)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini

# AI Feature Flags (fallback if no ai_settings row yet)
AI_LEAD_SCORING_ENABLED=true
AI_DEAL_HEALTH_ENABLED=true
AI_EMAIL_COMPOSER_ENABLED=false
AI_NL_SEARCH_ENABLED=false
```

---

## Implementation Order (Recommended)

| Week | Feature | Requires OpenAI | Complexity |
|------|---------|-----------------|------------|
| 1 | AI Lead Scoring | ❌ No | Low |
| 1 | Deal Health Score | ❌ No | Low |
| 2 | Next-Action Recommendations | ❌ No | Low |
| 2 | Revenue Forecasting | ❌ No | Medium |
| 3 | Churn Risk Detection | ❌ No | Low |
| 3 | Daily AI Briefing (basic) | ❌ No | Medium |
| 4 | AI Settings Panel | ❌ No | Medium |
| 4 | AI Email Composer | ✅ Yes | Medium |
| 5 | Natural Language Search | ✅ Yes | Medium |
| 5 | Note Summarization | ✅ Yes | Low |
| 6 | Daily Briefing (enhanced) | ✅ Yes | Low |

**Weeks 1–3**: All rule-based AI (no API key needed, can demo offline)  
**Weeks 4–6**: OpenAI-powered features (needs `OPENAI_API_KEY`)

---

## What Each Feature Looks Like in the UI

### Lead List (after Feature 1 + 3)
```
┌──────────────────────────────────────────────────────────────────┐
│ Name          Company       Status      AI Score  Next Action     │
├──────────────────────────────────────────────────────────────────┤
│ John Smith    Acme Corp     Qualified   🔴 87      Schedule Demo  │
│ Jane Doe      TechCo        New         🟡 52      Make Contact   │
│ Bob Jones     StartupXYZ    Contacted   🔵 31      Follow Up      │
└──────────────────────────────────────────────────────────────────┘
```

### Deal Card (after Feature 2)
```
┌─────────────────────────────────┐
│ Acme Corp — Enterprise Deal     │
│ $45,000 · Negotiation           │
│ ██████████░░ 78%  ⚠ Stale      │
│ "No activity in 8 days"         │
└─────────────────────────────────┘
```

### Dashboard (after Feature 8)
```
┌─────────────────────────────────────────────────────────┐
│ ✨ AI Briefing                              [Refresh]    │
│ You have 2 hot leads ready to convert,                  │
│ 3 deals closing this week, and 1 at-risk                │
│ customer needing a check-in call.                       │
└─────────────────────────────────────────────────────────┘
```

### Email Composer (after Feature 4)
```
┌─────────────────────────────────────────────────────────┐
│ ✨ AI Email Composer                                     │
│ Purpose: [Follow Up ▼]   Tone: [Professional ▼]        │
│                                     [Generate Email]    │
├─────────────────────────────────────────────────────────┤
│ Subject: Following up on your interest in our platform  │
│                                                         │
│ Hi John,                                                │
│ I wanted to follow up on our recent conversation...     │
│                                          [Copy] [Edit]  │
└─────────────────────────────────────────────────────────┘
```

---

## Cost Estimate (OpenAI)

| Feature | Model | Avg tokens/call | Calls/day (100 users) | Monthly cost |
|---------|-------|-----------------|----------------------|--------------|
| Email Composer | gpt-4o-mini | ~500 | 50 | ~$0.75 |
| NL Search | gpt-4o-mini | ~200 | 100 | ~$0.60 |
| Note Summary | gpt-4o-mini | ~800 | 30 | ~$0.72 |
| Daily Briefing | gpt-4o-mini | ~300 | 100 | ~$0.90 |
| **Total** | | | | **~$3–5/month** |

gpt-4o-mini pricing (as of 2026): $0.15/1M input tokens, $0.60/1M output tokens.  
For 100 active users, AI costs are negligible.

---

## Features NOT Planned (Out of Scope)

| Feature | Reason |
|---------|--------|
| Custom ML model training | Needs Python infra + data science expertise |
| Voice assistant | Requires native browser audio permissions + streaming |
| Call transcription | Requires audio recording infrastructure |
| Predictive lead conversion (ML) | Not enough data in early-stage CRM to train meaningfully |
| Social media monitoring | Separate product category |
| AI chatbot on landing page | Different deployment context |

These are valid long-term features once the AI foundation above is built and the CRM has 6+ months of data.

---

## Success Metrics

After AI integration, track these to measure impact:

- **Lead Score Accuracy**: % of Hot leads that convert vs Cold leads
- **Deal Health Accuracy**: % of flagged deals that go Lost vs unflagged
- **Email Composer Usage**: adoption rate, copy rate
- **Daily Briefing Opens**: click-through on highlighted items
- **NL Search Queries**: volume and user satisfaction
- **Time-to-Next-Contact**: reduction vs pre-AI baseline
- **Overall Conversion Rate**: month-over-month after AI rollout

---

## Summary

**10 AI features. 1 new npm package. 1 new API key.**

No separate Python microservice. No vector database. No infrastructure changes.  
Everything runs in the existing Node.js/PostgreSQL stack.

Features 1–6 work **without any OpenAI key** — they're rule-based using your existing data.  
Features 4, 7, 9 use OpenAI and cost approximately **$3–5/month** for 100 users.

---

**Document Version**: 1.0  
**Date**: August 2026  
**Status**: Ready to implement
