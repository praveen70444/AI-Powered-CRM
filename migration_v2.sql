-- 1. Add Plot area units column to the three tables
ALTER TABLE construction_leads ADD COLUMN plot_area_units VARCHAR(50);
ALTER TABLE redevelopment_leads ADD COLUMN plot_area_units VARCHAR(50);
ALTER TABLE maintenance_leads ADD COLUMN plot_area_units VARCHAR(50);

-- 2. Create industry_lead_followups table for the Side Panel notes/updates
CREATE TABLE IF NOT EXISTS industry_lead_followups (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL,
  lead_type VARCHAR(50) NOT NULL,
  author_id BIGINT REFERENCES users(id),
  note TEXT NOT NULL,
  followup_date DATE,
  next_followup_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
