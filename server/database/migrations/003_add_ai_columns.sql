-- Migration 003: Add AI columns to leads, deals, customers + create ai_settings table
-- Run: node scripts/runMigration.js  (or psql manually)

-- Lead AI columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_label VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_factors JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_updated_at TIMESTAMPTZ;

-- Deal AI columns
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_score INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_label VARCHAR(20);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_risk_flags JSONB;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_updated_at TIMESTAMPTZ;

-- Customer AI columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_risk VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_factors JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_updated_at TIMESTAMPTZ;

-- AI Email log
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

-- AI Settings per organization
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

-- Indices for AI columns
CREATE INDEX IF NOT EXISTS idx_leads_ai_score ON leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_leads_ai_label ON leads(ai_score_label);
CREATE INDEX IF NOT EXISTS idx_deals_ai_health ON deals(ai_health_score);
CREATE INDEX IF NOT EXISTS idx_deals_ai_label ON deals(ai_health_label);
CREATE INDEX IF NOT EXISTS idx_customers_ai_churn ON customers(ai_churn_risk);
CREATE INDEX IF NOT EXISTS idx_ai_emails_org ON ai_generated_emails(organization_id);
