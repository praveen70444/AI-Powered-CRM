-- Migration: Add Missing Features
-- Date: 2024-01-XX
-- Description: Adds email templates, attachments, password reset, audit logs, and other missing features

-- ===================================
-- 1. EMAIL TEMPLATES & LOGS
-- ===================================

CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    variables JSONB,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_templates_type_check CHECK (
        type IN ('invitation', 'follow_up', 'marketing', 'welcome', 'password_reset', 'notification')
    )
);

CREATE TABLE IF NOT EXISTS email_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    to_email VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    subject TEXT,
    body TEXT,
    template_id BIGINT REFERENCES email_templates(id) ON DELETE SET NULL,
    related_type VARCHAR(50),
    related_id BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_logs_status_check CHECK (
        status IN ('sent', 'failed', 'bounced', 'opened', 'clicked', 'pending')
    )
);

CREATE INDEX IF NOT EXISTS idx_email_logs_organization ON email_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);

-- ===================================
-- 2. FILE ATTACHMENTS
-- ===================================

CREATE TABLE IF NOT EXISTS attachments (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    related_type VARCHAR(50),
    related_id BIGINT,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'local',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attachments_storage_check CHECK (
        storage_provider IN ('local', 's3', 'azure')
    )
);

CREATE INDEX IF NOT EXISTS idx_attachments_organization ON attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_attachments_related ON attachments(related_type, related_id);

-- Add avatar fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_uploaded_at TIMESTAMPTZ;

-- Add avatar fields to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_uploaded_at TIMESTAMPTZ;

-- ===================================
-- 3. PASSWORD MANAGEMENT
-- ===================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ;

-- ===================================
-- 4. AUDIT TRAIL & LOGIN HISTORY
-- ===================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_logs_action_check CHECK (
        action IN ('create', 'update', 'delete', 'login', 'logout', 'password_change', 'permission_change')
    )
);

CREATE TABLE IF NOT EXISTS login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    logged_in_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);

-- ===================================
-- 5. LEAD CONVERSION TRACKING
-- ===================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_to_customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversion_notes TEXT;

-- ===================================
-- 6. TAGS SYSTEM
-- ===================================

CREATE TABLE IF NOT EXISTS tags (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS entity_tags (
    id BIGSERIAL PRIMARY KEY,
    tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tag_id, entity_type, entity_id),
    CONSTRAINT entity_tags_type_check CHECK (
        entity_type IN ('lead', 'customer', 'deal', 'task')
    )
);

CREATE INDEX IF NOT EXISTS idx_tags_organization ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tags(entity_type, entity_id);

-- ===================================
-- 7. CUSTOM FIELDS (for flexibility)
-- ===================================

CREATE TABLE IF NOT EXISTS custom_fields (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(150) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    field_options JSONB,
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT custom_fields_entity_check CHECK (
        entity_type IN ('lead', 'customer', 'deal', 'task')
    ),
    CONSTRAINT custom_fields_type_check CHECK (
        field_type IN ('text', 'number', 'date', 'dropdown', 'checkbox', 'textarea')
    ),
    UNIQUE(organization_id, entity_type, field_name)
);

CREATE TABLE IF NOT EXISTS custom_field_values (
    id BIGSERIAL PRIMARY KEY,
    custom_field_id BIGINT REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id BIGINT NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(custom_field_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_organization ON custom_fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_id);

-- ===================================
-- 8. ORGANIZATION SETTINGS
-- ===================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD';

-- ===================================
-- 9. ENHANCED NOTIFICATIONS
-- ===================================

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add new notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
    type IN ('lead', 'task', 'deal', 'customer', 'invitation', 'system', 'reminder', 'alert')
);

-- ===================================
-- 10. DUPLICATE DETECTION HELPERS
-- ===================================

-- Add search-optimized indices
CREATE INDEX IF NOT EXISTS idx_leads_email_lower ON leads(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON customers(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ===================================
-- 11. IMPROVED SEARCH
-- ===================================

-- Add full-text search capabilities (PostgreSQL specific)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create trigger functions for automatic search vector updates
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

-- Create triggers
DROP TRIGGER IF EXISTS lead_search_vector_update ON leads;
CREATE TRIGGER lead_search_vector_update 
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_lead_search_vector();

DROP TRIGGER IF EXISTS customer_search_vector_update ON customers;
CREATE TRIGGER customer_search_vector_update 
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_customer_search_vector();

DROP TRIGGER IF EXISTS deal_search_vector_update ON deals;
CREATE TRIGGER deal_search_vector_update 
    BEFORE INSERT OR UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_deal_search_vector();

-- Create GIN indices for fast full-text search
CREATE INDEX IF NOT EXISTS idx_leads_search ON leads USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_deals_search ON deals USING GIN(search_vector);

-- Update existing records
UPDATE leads SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(company, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(phone, '')), 'C');

UPDATE customers SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(company, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(industry, '')), 'C');

UPDATE deals SET search_vector = 
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(company, '')), 'A');

-- ===================================
-- COMPLETED MIGRATION
-- ===================================
