-- ============================================================================
-- PATCH SCRIPT — Run this on an existing DB that was created by the app
-- Safely adds all missing columns, tables, indexes without touching existing data
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS — add missing columns
-- ============================================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry        VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website         VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone           VARCHAR(30);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address         TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city            VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state           VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country         VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code     VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone        VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency        VARCHAR(3)  DEFAULT 'USD';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS date_format     VARCHAR(20) DEFAULT 'YYYY-MM-DD';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url        TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_uploaded_at TIMESTAMPTZ;

-- ============================================================================
-- 2. USERS — add missing columns
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone                 VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department            VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location              VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url            TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_uploaded_at    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at   TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until  TIMESTAMPTZ;

-- ============================================================================
-- 3. LEADS — add missing columns (conversion + search + AI)
-- ============================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_customer_id BIGINT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at             TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversion_notes         TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS search_vector            tsvector;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score                 INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_label           VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_factors         JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score_updated_at      TIMESTAMPTZ;

-- Add FK for conversion (safe — only if customers table exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'leads_converted_fk'
    ) THEN
        ALTER TABLE leads ADD CONSTRAINT leads_converted_fk
            FOREIGN KEY (converted_to_customer_id) REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END$$;

-- ============================================================================
-- 4. CUSTOMERS — add missing columns (search + AI)
-- ============================================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS search_vector        tsvector;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_risk        VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_factors     JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_churn_updated_at  TIMESTAMPTZ;

-- ============================================================================
-- 5. DEALS — add missing columns (search + AI)
-- ============================================================================
ALTER TABLE deals ADD COLUMN IF NOT EXISTS search_vector         tsvector;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_score       INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_label       VARCHAR(20);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_risk_flags         JSONB;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS ai_health_updated_at  TIMESTAMPTZ;

-- ============================================================================
-- 6. NOTIFICATIONS — add missing columns + fix constraint
-- ============================================================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority    VARCHAR(20) DEFAULT 'normal';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at     TIMESTAMPTZ;

-- Widen the type check to include new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('lead','task','deal','customer','invitation','system','reminder','alert'));

-- ============================================================================
-- 7. NEW TABLES (all use IF NOT EXISTS — safe to run multiple times)
-- ============================================================================

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT      REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       BIGINT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_logs_action_check
        CHECK (action IN ('create','update','delete','login','logout','password_change','permission_change'))
);

-- Login history
CREATE TABLE IF NOT EXISTS login_history (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT      REFERENCES users(id) ON DELETE CASCADE,
    ip_address     VARCHAR(45),
    user_agent     TEXT,
    success        BOOLEAN     NOT NULL,
    failure_reason VARCHAR(100),
    logged_in_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
    id               BIGSERIAL PRIMARY KEY,
    organization_id  BIGINT      REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by      BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    related_type     VARCHAR(50),
    related_id       BIGINT,
    file_name        VARCHAR(255) NOT NULL,
    file_type        VARCHAR(100),
    file_size        BIGINT,
    file_url         TEXT         NOT NULL,
    storage_provider VARCHAR(50)  DEFAULT 'local',
    is_public        BOOLEAN      DEFAULT FALSE,
    created_at       TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attachments_storage_check CHECK (storage_provider IN ('local','s3','azure'))
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT      REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    subject         TEXT         NOT NULL,
    body            TEXT         NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    variables       JSONB,
    created_by      BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_templates_type_check
        CHECK (type IN ('invitation','follow_up','marketing','welcome','password_reset','notification'))
);

-- Email logs
CREATE TABLE IF NOT EXISTS email_logs (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT      REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    to_email        VARCHAR(255) NOT NULL,
    from_email      VARCHAR(255) NOT NULL,
    subject         TEXT,
    body            TEXT,
    template_id     BIGINT      REFERENCES email_templates(id) ON DELETE SET NULL,
    related_type    VARCHAR(50),
    related_id      BIGINT,
    status          VARCHAR(50)  NOT NULL DEFAULT 'sent',
    sent_at         TIMESTAMPTZ,
    opened_at       TIMESTAMPTZ,
    clicked_at      TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_logs_status_check
        CHECK (status IN ('sent','failed','bounced','opened','clicked','pending'))
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    color           VARCHAR(7)   DEFAULT '#3B82F6',
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

-- Entity tags
CREATE TABLE IF NOT EXISTS entity_tags (
    id          BIGSERIAL PRIMARY KEY,
    tag_id      BIGINT      REFERENCES tags(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   BIGINT      NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tag_id, entity_type, entity_id),
    CONSTRAINT entity_tags_type_check CHECK (entity_type IN ('lead','customer','deal','task'))
);

-- Custom fields
CREATE TABLE IF NOT EXISTS custom_fields (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50)  NOT NULL,
    field_name      VARCHAR(100) NOT NULL,
    field_label     VARCHAR(150) NOT NULL,
    field_type      VARCHAR(50)  NOT NULL,
    field_options   JSONB,
    is_required     BOOLEAN      DEFAULT FALSE,
    display_order   INTEGER      DEFAULT 0,
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT custom_fields_entity_check CHECK (entity_type IN ('lead','customer','deal','task')),
    CONSTRAINT custom_fields_type_check   CHECK (field_type IN ('text','number','date','dropdown','checkbox','textarea')),
    UNIQUE(organization_id, entity_type, field_name)
);

-- Custom field values
CREATE TABLE IF NOT EXISTS custom_field_values (
    id              BIGSERIAL PRIMARY KEY,
    custom_field_id BIGINT      REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id       BIGINT      NOT NULL,
    value           TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(custom_field_id, entity_id)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT        REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(150)  NOT NULL,
    description     TEXT,
    sku             VARCHAR(100),
    category        VARCHAR(100),
    unit_price      NUMERIC(14,2) NOT NULL DEFAULT 0,
    cost_price      NUMERIC(14,2),
    is_active       BOOLEAN       DEFAULT TRUE,
    created_by      BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, sku)
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT        REFERENCES organizations(id) ON DELETE CASCADE,
    deal_id         BIGINT        REFERENCES deals(id) ON DELETE SET NULL,
    customer_id     BIGINT        REFERENCES customers(id) ON DELETE SET NULL,
    owner_id        BIGINT        REFERENCES users(id) ON DELETE RESTRICT,
    quote_number    VARCHAR(50)   NOT NULL,
    status          VARCHAR(30)   NOT NULL DEFAULT 'Draft',
    total_amount    NUMERIC(14,2) DEFAULT 0,
    discount_amount NUMERIC(14,2) DEFAULT 0,
    tax_amount      NUMERIC(14,2) DEFAULT 0,
    valid_until     DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, quote_number),
    CONSTRAINT quotes_status_check CHECK (status IN ('Draft','Sent','Accepted','Rejected','Expired'))
);

-- Quote line items
CREATE TABLE IF NOT EXISTS quote_line_items (
    id               BIGSERIAL PRIMARY KEY,
    quote_id         BIGINT        REFERENCES quotes(id) ON DELETE CASCADE,
    product_id       BIGINT        REFERENCES products(id) ON DELETE SET NULL,
    description      VARCHAR(255),
    quantity         INTEGER       NOT NULL DEFAULT 1,
    unit_price       NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2)  DEFAULT 0,
    line_total       NUMERIC(14,2) NOT NULL DEFAULT 0
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    url             TEXT         NOT NULL,
    events          TEXT[]       NOT NULL DEFAULT '{}',
    secret_key      TEXT,
    is_active       BOOLEAN      DEFAULT TRUE,
    created_by      BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- Webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id              BIGSERIAL PRIMARY KEY,
    webhook_id      BIGINT      REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type      VARCHAR(100),
    payload         JSONB,
    response_status INTEGER,
    response_body   TEXT,
    error_message   TEXT,
    delivered_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- API keys
CREATE TABLE IF NOT EXISTS api_keys (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       REFERENCES organizations(id) ON DELETE CASCADE,
    key_name        VARCHAR(150) NOT NULL,
    api_key         TEXT         UNIQUE NOT NULL,
    permissions     JSONB        DEFAULT '["read"]',
    is_active       BOOLEAN      DEFAULT TRUE,
    created_by      BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
    id               BIGSERIAL PRIMARY KEY,
    organization_id  BIGINT       REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id         BIGINT       REFERENCES users(id) ON DELETE RESTRICT,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    event_type       VARCHAR(50)  NOT NULL DEFAULT 'Meeting',
    start_time       TIMESTAMPTZ  NOT NULL,
    end_time         TIMESTAMPTZ  NOT NULL,
    location         VARCHAR(255),
    is_all_day       BOOLEAN      DEFAULT FALSE,
    reminder_minutes INTEGER      DEFAULT 30,
    related_type     VARCHAR(50),
    related_id       BIGINT,
    status           VARCHAR(30)  DEFAULT 'Scheduled',
    created_at       TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT calendar_events_type_check   CHECK (event_type IN ('Meeting','Call','Demo','Task','Reminder','Other')),
    CONSTRAINT calendar_events_status_check CHECK (status IN ('Scheduled','Completed','Cancelled'))
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id                       BIGSERIAL PRIMARY KEY,
    user_id                  BIGINT   REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_on_lead            BOOLEAN  DEFAULT TRUE,
    email_on_task_due        BOOLEAN  DEFAULT TRUE,
    email_on_deal_won        BOOLEAN  DEFAULT TRUE,
    email_on_deal_close_soon BOOLEAN  DEFAULT TRUE,
    email_daily_digest       BOOLEAN  DEFAULT FALSE,
    in_app_lead              BOOLEAN  DEFAULT TRUE,
    in_app_task              BOOLEAN  DEFAULT TRUE,
    in_app_deal              BOOLEAN  DEFAULT TRUE,
    in_app_customer          BOOLEAN  DEFAULT TRUE,
    updated_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AI settings
CREATE TABLE IF NOT EXISTS ai_settings (
    id                         BIGSERIAL PRIMARY KEY,
    organization_id            BIGINT  REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    lead_scoring_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    deal_health_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    next_actions_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    email_composer_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    nl_search_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
    daily_briefing_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    note_summarization_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    openai_api_key_encrypted   TEXT,
    openai_api_key_set         BOOLEAN NOT NULL DEFAULT FALSE,
    openai_model               VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
    monthly_token_limit        INTEGER NOT NULL DEFAULT 100000,
    tokens_used_this_month     INTEGER NOT NULL DEFAULT 0,
    created_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                 TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- AI generated emails
CREATE TABLE IF NOT EXISTS ai_generated_emails (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT      REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    entity_type     VARCHAR(50),
    entity_id       BIGINT,
    purpose         VARCHAR(100),
    subject         TEXT,
    body            TEXT,
    model_used      VARCHAR(100),
    tokens_used     INTEGER,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. INDEXES (all IF NOT EXISTS — safe to re-run)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_email_lower      ON leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_leads_phone            ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_ai_score         ON leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_leads_ai_label         ON leads(ai_score_label);
CREATE INDEX IF NOT EXISTS idx_leads_search           ON leads USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_customers_email_lower  ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_phone        ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_ai_churn     ON customers(ai_churn_risk);
CREATE INDEX IF NOT EXISTS idx_customers_search       ON customers USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_deals_ai_health        ON deals(ai_health_score);
CREATE INDEX IF NOT EXISTS idx_deals_ai_label         ON deals(ai_health_label);
CREATE INDEX IF NOT EXISTS idx_deals_search           ON deals USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_password_reset_user    ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user         ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action       ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity       ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user      ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_organization ON attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_attachments_related      ON attachments(related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_organization  ON email_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status        ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_tags_organization        ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity       ON entity_tags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_organization  ON custom_fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity  ON custom_field_values(entity_id);
CREATE INDEX IF NOT EXISTS idx_products_organization    ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_organization      ON quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_deal              ON quotes(deal_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer          ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote        ON quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_organization    ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization    ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key             ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org      ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_owner    ON calendar_events(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start    ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_ai_emails_org            ON ai_generated_emails(organization_id);

-- ============================================================================
-- 9. FULL-TEXT SEARCH TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_lead_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.company, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.phone, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_customer_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.company, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.industry, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_deal_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.company, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lead_search_vector_update     ON leads;
DROP TRIGGER IF EXISTS customer_search_vector_update ON customers;
DROP TRIGGER IF EXISTS deal_search_vector_update     ON deals;

CREATE TRIGGER lead_search_vector_update
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_lead_search_vector();

CREATE TRIGGER customer_search_vector_update
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_customer_search_vector();

CREATE TRIGGER deal_search_vector_update
    BEFORE INSERT OR UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_deal_search_vector();

-- ============================================================================
-- DONE
-- ============================================================================
SELECT '✅ Patch applied — all missing columns, tables and indexes are ready.' AS result;
