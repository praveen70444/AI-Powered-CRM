-- ============================================================================
-- CRM COMPLETE DATABASE SCHEMA
-- Run this once on a fresh database to set up everything.
-- Includes: all tables, constraints, indexes, triggers, AI columns
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    status          VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    industry        VARCHAR(100),
    website         VARCHAR(255),
    phone           VARCHAR(30),
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    country         VARCHAR(100),
    postal_code     VARCHAR(20),
    timezone        VARCHAR(50)  DEFAULT 'UTC',
    currency        VARCHAR(3)   DEFAULT 'USD',
    date_format     VARCHAR(20)  DEFAULT 'YYYY-MM-DD',
    logo_url        TEXT,
    logo_uploaded_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT organizations_status_check
        CHECK (status IN ('ACTIVE','SUSPENDED','INACTIVE'))
);

-- ============================================================================
-- 2. USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id                    BIGSERIAL PRIMARY KEY,
    organization_id       BIGINT       NOT NULL,
    name                  VARCHAR(100) NOT NULL,
    email                 VARCHAR(255) NOT NULL,
    password_hash         TEXT,
    role                  VARCHAR(50)  NOT NULL DEFAULT 'SALES_EXECUTIVE',
    status                VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    phone                 VARCHAR(30),
    department            VARCHAR(100),
    location              VARCHAR(150),
    avatar_url            TEXT,
    avatar_uploaded_at    TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ,
    force_password_change BOOLEAN      DEFAULT FALSE,
    failed_login_attempts INTEGER      DEFAULT 0,
    account_locked_until  TIMESTAMPTZ,
    last_login_at         TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_role_check
        CHECK (role IN ('ORG_ADMIN','SALES_MANAGER','SALES_EXECUTIVE','SUPPORT_AGENT')),
    CONSTRAINT users_status_check
        CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED'))
);

CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);

-- ============================================================================
-- 3. INVITATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS invitations (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       NOT NULL,
    email           VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'SALES_EXECUTIVE',
    token_hash      TEXT         NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    status          VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    invited_by      BIGINT       NOT NULL,
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invitations_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT invitations_invited_by_fk
        FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT invitations_role_check
        CHECK (role IN ('SALES_MANAGER','SALES_EXECUTIVE','SUPPORT_AGENT')),
    CONSTRAINT invitations_status_check
        CHECK (status IN ('PENDING','ACCEPTED','EXPIRED','CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email           ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status          ON invitations(status);

-- ============================================================================
-- 4. LEADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id                       BIGSERIAL PRIMARY KEY,
    organization_id          BIGINT       NOT NULL,
    owner_id                 BIGINT       NOT NULL,
    name                     VARCHAR(150) NOT NULL,
    company                  VARCHAR(150) NOT NULL,
    email                    VARCHAR(255) NOT NULL,
    phone                    VARCHAR(30),
    status                   VARCHAR(30)  NOT NULL DEFAULT 'New',
    source                   VARCHAR(30),
    value                    NUMERIC(14,2) NOT NULL DEFAULT 0,
    -- Conversion tracking
    converted_to_customer_id BIGINT,
    converted_at             TIMESTAMPTZ,
    conversion_notes         TEXT,
    -- Full-text search
    search_vector            tsvector,
    -- AI columns
    ai_score                 INTEGER,
    ai_score_label           VARCHAR(20),
    ai_score_factors         JSONB,
    ai_score_updated_at      TIMESTAMPTZ,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT leads_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT leads_owner_fk
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT leads_status_check
        CHECK (status IN ('New','Contacted','Qualified','Unqualified','Converted')),
    CONSTRAINT leads_source_check
        CHECK (source IS NULL OR source IN ('Website','Referral','Cold Call','Social Media','Advertisement','Event'))
);

CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id        ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status          ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email_lower     ON leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_leads_phone           ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_ai_score        ON leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_leads_ai_label        ON leads(ai_score_label);
CREATE INDEX IF NOT EXISTS idx_leads_search          ON leads USING GIN(search_vector);

-- ============================================================================
-- 5. CUSTOMERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
    id               BIGSERIAL PRIMARY KEY,
    organization_id  BIGINT       NOT NULL,
    owner_id         BIGINT       NOT NULL,
    name             VARCHAR(150) NOT NULL,
    company          VARCHAR(150) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    phone            VARCHAR(30),
    status           VARCHAR(30)  NOT NULL DEFAULT 'Active',
    industry         VARCHAR(100),
    total_spend      NUMERIC(14,2) NOT NULL DEFAULT 0,
    customer_since   DATE          NOT NULL DEFAULT CURRENT_DATE,
    -- Full-text search
    search_vector    tsvector,
    -- AI columns
    ai_churn_risk         VARCHAR(20),
    ai_churn_factors      JSONB,
    ai_churn_updated_at   TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customers_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT customers_owner_fk
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT customers_status_check
        CHECK (status IN ('Active','Inactive','At Risk'))
);

-- Now add the FK that references customers (circular with leads)
ALTER TABLE leads ADD CONSTRAINT leads_converted_fk
    FOREIGN KEY (converted_to_customer_id) REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_organization_id ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id        ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_status          ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_email_lower     ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_phone           ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_ai_churn        ON customers(ai_churn_risk);
CREATE INDEX IF NOT EXISTS idx_customers_search          ON customers USING GIN(search_vector);

-- ============================================================================
-- 6. DEALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS deals (
    id                   BIGSERIAL PRIMARY KEY,
    organization_id      BIGINT       NOT NULL,
    owner_id             BIGINT       NOT NULL,
    customer_id          BIGINT,
    title                VARCHAR(150) NOT NULL,
    company              VARCHAR(150),
    stage                VARCHAR(30)  NOT NULL DEFAULT 'New',
    value                NUMERIC(14,2) NOT NULL DEFAULT 0,
    close_date           DATE,
    -- Full-text search
    search_vector        tsvector,
    -- AI columns
    ai_health_score      INTEGER,
    ai_health_label      VARCHAR(20),
    ai_risk_flags        JSONB,
    ai_health_updated_at TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deals_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT deals_owner_fk
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT deals_customer_fk
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    CONSTRAINT deals_stage_check
        CHECK (stage IN ('New','Qualified','Proposal','Negotiation','Won','Lost'))
);

CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id        ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_customer_id     ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage           ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_ai_health       ON deals(ai_health_score);
CREATE INDEX IF NOT EXISTS idx_deals_ai_label        ON deals(ai_health_label);
CREATE INDEX IF NOT EXISTS idx_deals_search          ON deals USING GIN(search_vector);

-- ============================================================================
-- 7. TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       NOT NULL,
    owner_id        BIGINT       NOT NULL,
    title           VARCHAR(200) NOT NULL,
    related_to      VARCHAR(150),
    type            VARCHAR(30)  NOT NULL DEFAULT 'Lead',
    priority        VARCHAR(30)  NOT NULL DEFAULT 'Medium',
    status          VARCHAR(30)  NOT NULL DEFAULT 'Pending',
    due_date        DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT tasks_owner_fk
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT tasks_type_check
        CHECK (type IN ('Lead','Customer','Deal')),
    CONSTRAINT tasks_priority_check
        CHECK (priority IN ('Low','Medium','High')),
    CONSTRAINT tasks_status_check
        CHECK (status IN ('Pending','In Progress','Completed'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id        ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status          ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date        ON tasks(due_date);

-- ============================================================================
-- 8. ACTIVITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       NOT NULL,
    owner_id        BIGINT       NOT NULL,
    title           VARCHAR(200) NOT NULL,
    related_to      VARCHAR(150),
    type            VARCHAR(30)  NOT NULL DEFAULT 'Call',
    occurred_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT activities_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT activities_owner_fk
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT activities_type_check
        CHECK (type IN ('Call','Email','Meeting','Lead Update','Customer Update','Deal Update'))
);

CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner_id        ON activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_occurred_at     ON activities(occurred_at);

-- ============================================================================
-- 9. NOTES
-- ============================================================================
CREATE TABLE IF NOT EXISTS notes (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       NOT NULL,
    author_id       BIGINT       NOT NULL,
    related_to      VARCHAR(150) NOT NULL,
    related_type    VARCHAR(30)  NOT NULL DEFAULT 'Lead',
    content         TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notes_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT notes_author_fk
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT notes_related_type_check
        CHECK (related_type IN ('Lead','Customer','Deal'))
);

CREATE INDEX IF NOT EXISTS idx_notes_organization_id ON notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_notes_author_id       ON notes(author_id);

-- ============================================================================
-- 10. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT       NOT NULL,
    user_id         BIGINT       NOT NULL,
    type            VARCHAR(30)  NOT NULL DEFAULT 'lead',
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    action_url      TEXT,
    priority        VARCHAR(20)  DEFAULT 'normal',
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT notifications_user_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_type_check
        CHECK (type IN ('lead','task','deal','customer','invitation','system','reminder','alert'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id         ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read         ON notifications(is_read);

-- ============================================================================
-- 11. NOTIFICATION PREFERENCES
-- ============================================================================
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

-- ============================================================================
-- 12. PASSWORD RESET TOKENS
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user    ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

-- ============================================================================
-- 13. AUDIT LOGS
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user         ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action       ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity       ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- 14. LOGIN HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_history (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT      REFERENCES users(id) ON DELETE CASCADE,
    ip_address     VARCHAR(45),
    user_agent     TEXT,
    success        BOOLEAN     NOT NULL,
    failure_reason VARCHAR(100),
    logged_in_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);

-- ============================================================================
-- 15. TAGS & ENTITY TAGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT      REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    color           VARCHAR(7)   DEFAULT '#3B82F6',
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS entity_tags (
    id          BIGSERIAL PRIMARY KEY,
    tag_id      BIGINT     REFERENCES tags(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   BIGINT      NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tag_id, entity_type, entity_id),
    CONSTRAINT entity_tags_type_check
        CHECK (entity_type IN ('lead','customer','deal','task'))
);

CREATE INDEX IF NOT EXISTS idx_tags_organization   ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity  ON entity_tags(entity_type, entity_id);

-- ============================================================================
-- 16. ATTACHMENTS
-- ============================================================================
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
    CONSTRAINT attachments_storage_check
        CHECK (storage_provider IN ('local','s3','azure'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_organization ON attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_attachments_related      ON attachments(related_type, related_id);

-- ============================================================================
-- 17. EMAIL TEMPLATES & LOGS
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_email_logs_organization ON email_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status       ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email     ON email_logs(to_email);

-- ============================================================================
-- 18. CUSTOM FIELDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_fields (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT      REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type     VARCHAR(50)  NOT NULL,
    field_name      VARCHAR(100) NOT NULL,
    field_label     VARCHAR(150) NOT NULL,
    field_type      VARCHAR(50)  NOT NULL,
    field_options   JSONB,
    is_required     BOOLEAN      DEFAULT FALSE,
    display_order   INTEGER      DEFAULT 0,
    created_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT custom_fields_entity_check
        CHECK (entity_type IN ('lead','customer','deal','task')),
    CONSTRAINT custom_fields_type_check
        CHECK (field_type IN ('text','number','date','dropdown','checkbox','textarea')),
    UNIQUE(organization_id, entity_type, field_name)
);

CREATE TABLE IF NOT EXISTS custom_field_values (
    id              BIGSERIAL PRIMARY KEY,
    custom_field_id BIGINT      REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id       BIGINT      NOT NULL,
    value           TEXT,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(custom_field_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_organization  ON custom_fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity  ON custom_field_values(entity_id);

-- ============================================================================
-- 19. PRODUCTS & QUOTES
-- ============================================================================
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
    CONSTRAINT quotes_status_check
        CHECK (status IN ('Draft','Sent','Accepted','Rejected','Expired'))
);

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

CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_organization   ON quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_deal           ON quotes(deal_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer       ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote     ON quote_line_items(quote_id);

-- ============================================================================
-- 20. WEBHOOKS & API KEYS
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_webhooks_organization ON webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key          ON api_keys(api_key);

-- ============================================================================
-- 21. CALENDAR EVENTS
-- ============================================================================
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
    CONSTRAINT calendar_events_type_check
        CHECK (event_type IN ('Meeting','Call','Demo','Task','Reminder','Other')),
    CONSTRAINT calendar_events_status_check
        CHECK (status IN ('Scheduled','Completed','Cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_org   ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_owner ON calendar_events(owner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);

-- ============================================================================
-- 22. AI SETTINGS & EMAIL LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_settings (
    id                        BIGSERIAL PRIMARY KEY,
    organization_id           BIGINT  REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    lead_scoring_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    deal_health_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    next_actions_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    email_composer_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    nl_search_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    daily_briefing_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    note_summarization_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    openai_api_key_encrypted  TEXT,
    openai_api_key_set        BOOLEAN NOT NULL DEFAULT FALSE,
    openai_model              VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
    monthly_token_limit       INTEGER NOT NULL DEFAULT 100000,
    tokens_used_this_month    INTEGER NOT NULL DEFAULT 0,
    created_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_ai_emails_org ON ai_generated_emails(organization_id);

-- ============================================================================
-- 23. FULL-TEXT SEARCH TRIGGERS
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
SELECT '✅ CRM schema created successfully — all 28 tables ready.' AS result;
