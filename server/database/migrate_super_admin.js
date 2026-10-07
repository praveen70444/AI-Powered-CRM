require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});
const sql = `
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPER_ADMIN','ORG_ADMIN','SALES_MANAGER','SALES_EXECUTIVE','SUPPORT_AGENT'));
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS construction_leads (
    id                       BIGSERIAL PRIMARY KEY,
    organization_id          BIGINT       NOT NULL,
    owner_id                 BIGINT       NOT NULL,
    name                     VARCHAR(150) NOT NULL,
    whatsapp_number          VARCHAR(30),
    goal                     VARCHAR(100),
    plot_size                VARCHAR(100),
    pincode                  VARCHAR(20),
    budget                   VARCHAR(100),
    timeline                 VARCHAR(100),
    status                   VARCHAR(30)  NOT NULL DEFAULT 'New',
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cleads_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT cleads_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT cleads_status_check CHECK (status IN ('New','Contacted','Qualified','Unqualified','Converted'))
);

CREATE TABLE IF NOT EXISTS redevelopment_leads (
    id                       BIGSERIAL PRIMARY KEY,
    organization_id          BIGINT       NOT NULL,
    owner_id                 BIGINT       NOT NULL,
    name                     VARCHAR(150) NOT NULL,
    whatsapp_number          VARCHAR(30),
    reason                   VARCHAR(255),
    building_age             VARCHAR(50),
    no_of_owners             INTEGER,
    no_of_floors             INTEGER,
    goal                     VARCHAR(100),
    plot_size                VARCHAR(100),
    pincode                  VARCHAR(20),
    budget                   VARCHAR(100),
    timeline                 VARCHAR(100),
    status                   VARCHAR(30)  NOT NULL DEFAULT 'New',
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rleads_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT rleads_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT rleads_status_check CHECK (status IN ('New','Contacted','Qualified','Unqualified','Converted'))
);

CREATE TABLE IF NOT EXISTS maintenance_leads (
    id                       BIGSERIAL PRIMARY KEY,
    organization_id          BIGINT       NOT NULL,
    owner_id                 BIGINT       NOT NULL,
    name                     VARCHAR(150) NOT NULL,
    whatsapp_number          VARCHAR(30),
    service_required         VARCHAR(100),
    property_type            VARCHAR(100),
    plot_size                VARCHAR(100),
    pincode                  VARCHAR(20),
    budget                   VARCHAR(100),
    timeline                 VARCHAR(100),
    status                   VARCHAR(30)  NOT NULL DEFAULT 'New',
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT mleads_organization_fk FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT mleads_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT mleads_status_check CHECK (status IN ('New','Contacted','Qualified','Unqualified','Converted'))
);
`;
pool.query(sql).then(() => {
  console.log('Migration successful');
  process.exit(0);
}).catch(e => {
  console.error('Migration failed', e);
  process.exit(1);
});
