-- Migration 004: Add real-estate specific fields to leads + lead follow-up notes table

-- ===========================
-- LEAD EXTRA FIELDS
-- ===========================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS purpose_of_purchase VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS plot_size           VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget              VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS plan_to_purchase    VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS site_visit          VARCHAR(30);

-- ===========================
-- LEAD FOLLOW-UP NOTES
-- (separate from generic notes — typed follow-up log per lead)
-- ===========================
CREATE TABLE IF NOT EXISTS lead_followups (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id         BIGINT       NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    author_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    note            TEXT         NOT NULL,
    followup_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
    next_followup_date DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_followups_lead     ON lead_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_org      ON lead_followups(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_author   ON lead_followups(author_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_date     ON lead_followups(followup_date);
