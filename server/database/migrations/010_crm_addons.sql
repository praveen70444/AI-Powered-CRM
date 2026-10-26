-- =============================================================================
-- Migration 010: CRM Add-ons (Real Estate & Construction)
-- SAFE: All statements are idempotent (IF NOT EXISTS), non-destructive.
-- Existing data is 100% preserved.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- GLOBAL: Editable Dropdown Options Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dropdown_options (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vertical VARCHAR(50) NOT NULL,  -- 'real_estate', 'construction', 'both'
    category VARCHAR(100) NOT NULL, -- e.g. 'lead_language', 'lead_location', 'service_type'
    value VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, vertical, category, value)
);

CREATE INDEX IF NOT EXISTS idx_dropdown_options_lookup 
    ON dropdown_options(organization_id, vertical, category);

-- ---------------------------------------------------------------------------
-- B1/B2: leads new columns
-- ---------------------------------------------------------------------------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS language VARCHAR(50);

-- Location multi-select array (Safe creation or migration from legacy text)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'location'
    ) THEN
        ALTER TABLE leads ADD COLUMN location TEXT[];
    ELSIF (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'location'
    ) = 'text' THEN
        ALTER TABLE leads ALTER COLUMN location TYPE TEXT[] 
        USING CASE 
            WHEN location IS NULL THEN NULL
            WHEN location = '' THEN ARRAY[]::TEXT[]
            WHEN location LIKE '[%' THEN (
                SELECT ARRAY_AGG(x)::TEXT[] FROM jsonb_array_elements_text(location::jsonb) AS x
            )
            ELSE string_to_array(location, ',')
        END;
    END IF;
END $$;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type VARCHAR(30) DEFAULT 'Flat Buyer';  -- Flat Buyer | Plot Buyer | Land Buyer
ALTER TABLE leads ADD COLUMN IF NOT EXISTS bhk_requirement VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_status VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS purchase_timeline VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS purpose VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS plot_size_sqyd NUMERIC(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS land_size TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS land_size_unit VARCHAR(30);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS other_requirements TEXT;

-- Preferred Locations multi-select array
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'preferred_locations'
    ) THEN
        ALTER TABLE leads ADD COLUMN preferred_locations TEXT[];
    ELSIF (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'preferred_locations'
    ) = 'text' THEN
        ALTER TABLE leads ALTER COLUMN preferred_locations TYPE TEXT[] 
        USING CASE 
            WHEN preferred_locations IS NULL THEN NULL
            WHEN preferred_locations = '' THEN ARRAY[]::TEXT[]
            WHEN preferred_locations LIKE '[%' THEN (
                SELECT ARRAY_AGG(x)::TEXT[] FROM jsonb_array_elements_text(preferred_locations::jsonb) AS x
            )
            ELSE string_to_array(preferred_locations, ',')
        END;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- B3: products new columns
-- ---------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS village VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_plot_size VARCHAR(100);

-- ---------------------------------------------------------------------------
-- B4: owners_detail table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS owners_detail (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(30),
    person VARCHAR(30),        -- Mediator | Owner
    property_type VARCHAR(30), -- Land | Flat
    size VARCHAR(100),
    purpose VARCHAR(100),
    price_or_jd TEXT,          -- price or joint dev terms
    village VARCHAR(150),
    features TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owners_detail_org   ON owners_detail(organization_id);
CREATE INDEX IF NOT EXISTS idx_owners_detail_owner ON owners_detail(owner_id);

-- ---------------------------------------------------------------------------
-- C1: subcontractors table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subcontractors (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    contractor_name VARCHAR(200) NOT NULL,
    service_type VARCHAR(150),
    contact_person VARCHAR(150),
    contact_number VARCHAR(30),
    location VARCHAR(200),
    years_experience VARCHAR(50),
    workforce_capacity VARCHAR(100),
    previous_projects TEXT,
    projects_completed INTEGER,
    rating_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subcontractors_org   ON subcontractors(organization_id);
CREATE INDEX IF NOT EXISTS idx_subcontractors_owner ON subcontractors(owner_id);

-- ---------------------------------------------------------------------------
-- C2: material_suppliers table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS material_suppliers (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    supplier_name VARCHAR(200) NOT NULL,
    material_category VARCHAR(150),
    contact_person VARCHAR(150),
    contact_number VARCHAR(30),
    location VARCHAR(200),
    supplier_type VARCHAR(100),
    brands_products TEXT,
    wholesale_price TEXT,
    moq VARCHAR(100),
    rating_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_material_suppliers_org   ON material_suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_material_suppliers_owner ON material_suppliers(owner_id);

-- ---------------------------------------------------------------------------
-- C3: construction_customers table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS construction_customers (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    whatsapp_number VARCHAR(30),
    service_project_name VARCHAR(200),
    property_type VARCHAR(150),
    city_pincode VARCHAR(150),
    deal_value NUMERIC(14,2) DEFAULT 0,
    amount_received NUMERIC(14,2) DEFAULT 0,
    -- amount_pending is computed: deal_value - amount_received
    date_started DATE,
    date_ended DATE,
    warranty TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_construction_customers_org   ON construction_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_construction_customers_owner ON construction_customers(owner_id);

-- ---------------------------------------------------------------------------
-- Backfill existing leads from legacy purpose_of_purchase
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'purpose_of_purchase'
    ) THEN
        UPDATE leads 
        SET purpose = purpose_of_purchase 
        WHERE purpose IS NULL AND purpose_of_purchase IS NOT NULL;
    END IF;
END $$;

COMMIT;
