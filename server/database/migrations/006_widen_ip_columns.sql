-- Migration 006: Widen ip_address columns to handle IPv6 + forwarded-for chains
ALTER TABLE login_history ALTER COLUMN ip_address TYPE VARCHAR(100);
ALTER TABLE audit_logs    ALTER COLUMN ip_address TYPE VARCHAR(100);
