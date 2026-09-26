-- Migration 005: Customer follow-up notes table
CREATE TABLE IF NOT EXISTS customer_followups (
    id                 BIGSERIAL PRIMARY KEY,
    organization_id    BIGINT       NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id        BIGINT       NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    author_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    note               TEXT         NOT NULL,
    followup_date      DATE         NOT NULL DEFAULT CURRENT_DATE,
    next_followup_date DATE,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_followups_customer ON customer_followups(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_followups_org      ON customer_followups(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_followups_author   ON customer_followups(author_id);
CREATE INDEX IF NOT EXISTS idx_customer_followups_date     ON customer_followups(followup_date);
