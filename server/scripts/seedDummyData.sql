-- ============================================================================
-- CRM Dummy Data Seeding Script (CORRECTED for actual schema)
-- Run this after migrations to populate the database with test data
-- ============================================================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE activities, notes, tasks, deals, customers, leads, users, organizations CASCADE;

-- ============================================================================
-- 1. ORGANIZATIONS
-- ============================================================================
INSERT INTO organizations (name, industry, website, phone, address, city, state, country, postal_code, timezone, currency, created_at) VALUES
('TechCorp Solutions', 'Technology', 'https://techcorp.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'CA', 'USA', '94102', 'America/Los_Angeles', 'USD', CURRENT_TIMESTAMP),
('Global Ventures Inc', 'Finance', 'https://globalventures.com', '+1-555-0202', '456 Finance Ave', 'New York', 'NY', 'USA', '10001', 'America/New_York', 'USD', CURRENT_TIMESTAMP),
('Digital Marketing Hub', 'Marketing', 'https://digitalmarketinghub.com', '+1-555-0303', '789 Marketing Blvd', 'Austin', 'TX', 'USA', '73301', 'America/Chicago', 'USD', CURRENT_TIMESTAMP);

-- ============================================================================
-- 2. USERS (Employees + Org Admins)
-- ============================================================================
-- Password for all: "Password123" (bcrypt hash below)
-- Role values: ORG_ADMIN, SALES_MANAGER, SALES_EXECUTIVE, SUPPORT_AGENT
-- Status values: ACTIVE, INACTIVE, SUSPENDED

-- Org 1 Users
INSERT INTO users (organization_id, name, email, password_hash, role, status, created_at) VALUES
(1, 'John Smith', 'john@techcorp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'ORG_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP),
(1, 'Sarah Johnson', 'sarah@techcorp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'SALES_EXECUTIVE', 'ACTIVE', CURRENT_TIMESTAMP),
(1, 'Mike Chen', 'mike@techcorp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'SALES_EXECUTIVE', 'ACTIVE', CURRENT_TIMESTAMP),
(1, 'Emily Davis', 'emily@techcorp.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'SALES_EXECUTIVE', 'ACTIVE', CURRENT_TIMESTAMP);

-- Org 2 Users
INSERT INTO users (organization_id, name, email, password_hash, role, status, created_at) VALUES
(2, 'Robert Taylor', 'robert@globalventures.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'ORG_ADMIN', 'ACTIVE', CURRENT_TIMESTAMP),
(2, 'Lisa Anderson', 'lisa@globalventures.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'SALES_EXECUTIVE', 'ACTIVE', CURRENT_TIMESTAMP);

-- ============================================================================
-- 3. LEADS (with variety for AI scoring)
-- ============================================================================
INSERT INTO leads (organization_id, owner_id, name, company, email, phone, status, source, value, created_at) VALUES
-- Hot Leads (High Value + Good Source)
(1, 6, 'Alex Martinez', 'Enterprise Tech Corp', 'alex@enterprisetech.com', '+1-555-1001', 'Qualified', 'Referral', 75000, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, 6, 'Jessica Brown', 'Innovation Labs', 'jessica@innovationlabs.com', '+1-555-1002', 'Qualified', 'Website', 65000, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(1, 7, 'David Wilson', 'CloudScale Inc', 'david@cloudscale.com', '+1-555-1003', 'Contacted', 'Referral', 85000, CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Warm Leads (Medium Value)
(1, 6, 'Karen Lee', 'MidSize Consulting', 'karen@midsizeconsulting.com', '+1-555-1004', 'Contacted', 'Website', 35000, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(1, 7, 'Tom Harris', 'Startup Ventures', 'tom@startupventures.com', '+1-555-1005', 'New', 'Social Media', 25000, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 8, 'Rachel Green', 'GreenTech Solutions', 'rachel@greentech.com', '+1-555-1006', 'Contacted', 'Event', 40000, CURRENT_TIMESTAMP - INTERVAL '10 days'),

-- Cold Leads (Low Value + Poor Source)
(1, 6, 'Peter Jones', 'Small Business Co', 'peter@smallbiz.com', '+1-555-1007', 'New', 'Cold Call', 8000, CURRENT_TIMESTAMP - INTERVAL '15 days'),
(1, 7, 'Nancy White', 'Local Services', 'nancy@localservices.com', '+1-555-1008', 'Unqualified', 'Advertisement', 5000, CURRENT_TIMESTAMP - INTERVAL '20 days'),
(1, 8, 'Chris Moore', 'Budget Corp', 'chris@budgetcorp.com', '+1-555-1009', 'New', 'Cold Call', 12000, CURRENT_TIMESTAMP - INTERVAL '12 days'),

-- Org 2 Leads
(2, 10, 'Amanda Clark', 'Financial Partners LLC', 'amanda@finpartners.com', '+1-555-2001', 'Qualified', 'Referral', 95000, CURRENT_TIMESTAMP - INTERVAL '4 days'),
(2, 10, 'Brian Scott', 'Investment Group', 'brian@investmentgroup.com', '+1-555-2002', 'Contacted', 'Website', 55000, CURRENT_TIMESTAMP - INTERVAL '6 days');

-- ============================================================================
-- 4. CUSTOMERS (converted leads + existing customers)
-- ============================================================================
-- Status values: Active, Inactive, At Risk
INSERT INTO customers (organization_id, owner_id, name, company, email, phone, status, created_at) VALUES
-- Active Customers
(1, 6, 'Michael Johnson', 'Tech Innovators Inc', 'michael@techinnovators.com', '+1-555-3001', 'Active', CURRENT_TIMESTAMP - INTERVAL '180 days'),
(1, 6, 'Susan Williams', 'Digital Solutions Ltd', 'susan@digitalsolutions.com', '+1-555-3002', 'Active', CURRENT_TIMESTAMP - INTERVAL '365 days'),
(1, 7, 'James Anderson', 'Cloud Services Pro', 'james@cloudservicespro.com', '+1-555-3003', 'Active', CURRENT_TIMESTAMP - INTERVAL '120 days'),

-- At Risk / Inactive Customers (for churn risk)
(1, 6, 'Patricia Martinez', 'Legacy Systems Inc', 'patricia@legacysystems.com', '+1-555-3004', 'At Risk', CURRENT_TIMESTAMP - INTERVAL '90 days'),
(1, 7, 'Robert Thompson', 'Old Guard Corp', 'robert@oldguard.com', '+1-555-3005', 'At Risk', CURRENT_TIMESTAMP - INTERVAL '75 days'),
(1, 8, 'Linda Garcia', 'Past Client LLC', 'linda@pastclient.com', '+1-555-3006', 'Inactive', CURRENT_TIMESTAMP - INTERVAL '400 days'),

-- Org 2 Customers
(2, 10, 'William Brown', 'Finance First Group', 'william@financefirst.com', '+1-555-4001', 'Active', CURRENT_TIMESTAMP - INTERVAL '200 days'),
(2, 10, 'Elizabeth Davis', 'Investment Pro LLC', 'elizabeth@investmentpro.com', '+1-555-4002', 'Active', CURRENT_TIMESTAMP - INTERVAL '150 days');

-- ============================================================================
-- 5. DEALS (Various stages for pipeline testing)
-- ============================================================================
INSERT INTO deals (organization_id, owner_id, customer_id, title, value, stage, close_date, created_at) VALUES
-- Won Deals
(1, 2, 1, 'Annual License Renewal', 50000, 'Won', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '90 days'),
(1, 2, 2, 'Enterprise Expansion', 125000, 'Won', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '120 days'),

-- Active Deals (Negotiation)
(1, 2, 1, 'Q4 Upgrade Package', 75000, 'Negotiation', CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(1, 3, 3, 'Cloud Migration Project', 95000, 'Negotiation', CURRENT_TIMESTAMP + INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '60 days'),

-- Active Deals (Proposal)
(1, 2, 1, 'Additional Modules', 35000, 'Proposal', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(1, 3, 3, 'Training Services', 25000, 'Proposal', CURRENT_TIMESTAMP + INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),

-- Active Deals (Qualified)
(1, 4, 1, 'API Integration', 15000, 'Qualified', CURRENT_TIMESTAMP + INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '10 days'),

-- Stale Deals (Old, No Recent Activity)
(1, 2, 4, 'Legacy System Upgrade', 45000, 'Proposal', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '80 days'),

-- Lost Deals
(1, 3, 6, 'Small Business Package', 8000, 'Lost', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '90 days'),

-- Org 2 Deals
(2, 6, 7, 'Investment Portfolio Management', 150000, 'Negotiation', CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '50 days'),
(2, 6, 8, 'Financial Analytics Platform', 85000, 'Proposal', CURRENT_TIMESTAMP + INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '35 days');

-- ============================================================================
-- 6. TASKS (Various priorities and statuses)
-- ============================================================================
INSERT INTO tasks (organization_id, owner_id, title, due_date, priority, status, related_to, created_at) VALUES
-- Overdue Tasks
(1, 2, 'Follow up with Tech Innovators', CURRENT_TIMESTAMP - INTERVAL '2 days', 'High', 'Pending', 'Michael Johnson', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 2, 'Send proposal to Enterprise Tech', CURRENT_TIMESTAMP - INTERVAL '1 day', 'High', 'Pending', 'Alex Martinez', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Due Today
(1, 3, 'Call CloudScale Inc', CURRENT_TIMESTAMP, 'High', 'Pending', 'David Wilson', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(1, 2, 'Review contract terms', CURRENT_TIMESTAMP, 'Medium', 'Pending', 'Susan Williams', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Upcoming Tasks
(1, 3, 'Prepare demo presentation', CURRENT_TIMESTAMP + INTERVAL '3 days', 'High', 'Pending', 'Jessica Brown', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 4, 'Send pricing information', CURRENT_TIMESTAMP + INTERVAL '5 days', 'Medium', 'Pending', 'Rachel Green', CURRENT_TIMESTAMP),
(1, 2, 'Schedule training session', CURRENT_TIMESTAMP + INTERVAL '10 days', 'Low', 'Pending', 'Michael Johnson', CURRENT_TIMESTAMP),

-- Completed Tasks
(1, 2, 'Initial contact with lead', CURRENT_TIMESTAMP - INTERVAL '7 days', 'Medium', 'Completed', 'Alex Martinez', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 3, 'Send welcome email', CURRENT_TIMESTAMP - INTERVAL '5 days', 'Low', 'Completed', 'James Anderson', CURRENT_TIMESTAMP - INTERVAL '8 days'),

-- Org 2 Tasks
(2, 6, 'Close Investment Portfolio deal', CURRENT_TIMESTAMP + INTERVAL '2 days', 'High', 'Pending', 'William Brown', CURRENT_TIMESTAMP);

-- ============================================================================
-- 7. ACTIVITIES (Calls, Meetings, Emails)
-- ============================================================================
INSERT INTO activities (organization_id, owner_id, type, title, activity_date, duration, related_to, created_at) VALUES
-- Recent Activities
(1, 2, 'Call', 'Discovery Call with Alex Martinez', CURRENT_TIMESTAMP - INTERVAL '2 days', 45, 'Alex Martinez', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(1, 2, 'Email', 'Sent proposal to Enterprise Tech', CURRENT_TIMESTAMP - INTERVAL '3 days', 15, 'Alex Martinez', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(1, 2, 'Meeting', 'Demo for Jessica Brown', CURRENT_TIMESTAMP - INTERVAL '4 days', 60, 'Jessica Brown', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(1, 3, 'Call', 'Check-in with James Anderson', CURRENT_TIMESTAMP - INTERVAL '5 days', 30, 'James Anderson', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, 3, 'Meeting', 'Kickoff meeting for Cloud Migration', CURRENT_TIMESTAMP - INTERVAL '7 days', 90, 'David Wilson', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(1, 2, 'Email', 'Follow-up with Tech Innovators', CURRENT_TIMESTAMP - INTERVAL '10 days', 10, 'Michael Johnson', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 2, 'Call', 'Contract negotiation with Digital Solutions', CURRENT_TIMESTAMP - INTERVAL '15 days', 60, 'Susan Williams', CURRENT_TIMESTAMP - INTERVAL '15 days'),

-- Old Activities (for churn risk detection)
(1, 2, 'Call', 'Last contact with Legacy Systems', CURRENT_TIMESTAMP - INTERVAL '65 days', 20, 'Patricia Martinez', CURRENT_TIMESTAMP - INTERVAL '65 days'),

-- Org 2 Activities
(2, 6, 'Meeting', 'Strategy session with Finance First', CURRENT_TIMESTAMP - INTERVAL '3 days', 120, 'William Brown', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(2, 6, 'Call', 'Demo for Investment Group', CURRENT_TIMESTAMP - INTERVAL '6 days', 45, 'Brian Scott', CURRENT_TIMESTAMP - INTERVAL '6 days');

-- ============================================================================
-- 8. NOTES (For AI summarization testing)
-- ============================================================================
INSERT INTO notes (organization_id, author_id, content, related_to, related_type, created_at) VALUES
-- Multiple notes for lead (for AI summarization)
(1, 2, 'Initial contact made. Alex is very interested in our enterprise solution. Budget approved at $75k.', 'Alex Martinez', 'Lead', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, 2, 'Demo scheduled for next week. Alex mentioned they need integration with Salesforce.', 'Alex Martinez', 'Lead', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(1, 2, 'Demo went excellent! Alex loved the reporting features. Requested formal proposal.', 'Alex Martinez', 'Lead', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(1, 2, 'Proposal sent. Alex will review with VP and get back by end of week.', 'Alex Martinez', 'Lead', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Notes for customer
(1, 2, 'Michael mentioned interest in upgrading to premium tier during renewal discussion.', 'Michael Johnson', 'Customer', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(1, 2, 'Follow-up: Michael confirmed upgrade. Procurement working on paperwork.', 'Michael Johnson', 'Customer', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(1, 2, 'Contract signed! Upgrade effective next month.', 'Michael Johnson', 'Customer', CURRENT_TIMESTAMP - INTERVAL '5 days'),

-- Notes for deal
(1, 3, 'CloudScale very serious about cloud migration. Timeline: Q1 next year.', 'Cloud Migration Project', 'Deal', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(1, 3, 'Technical requirements gathered. Custom integration needed.', 'Cloud Migration Project', 'Deal', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(1, 3, 'Pricing approved by David. Moving to contract phase.', 'Cloud Migration Project', 'Deal', CURRENT_TIMESTAMP - INTERVAL '7 days'),

-- Single notes
(1, 3, 'Jessica from Innovation Labs is looking for analytics capabilities. Very impressed with our ML features.', 'Jessica Brown', 'Lead', CURRENT_TIMESTAMP - INTERVAL '4 days'),
(1, 4, 'Rachel needs integrations with HubSpot and Mailchimp. Sent technical specs.', 'Rachel Green', 'Lead', CURRENT_TIMESTAMP - INTERVAL '10 days'),

-- Org 2 Notes
(2, 6, 'William is a key decision maker. Has been with us for 2 years. Very satisfied.', 'William Brown', 'Customer', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(2, 6, 'Investment Portfolio deal in final stages. William wants to close before year-end.', 'Investment Portfolio Management', 'Deal', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- ============================================================================
-- 9. PRODUCTS (For quotes)
-- ============================================================================
INSERT INTO products (organization_id, name, description, unit_price, cost_price, category, sku, is_active, created_at) VALUES
(1, 'Basic CRM License', 'Single user CRM license with core features', 49.00, 25.00, 'Software License', 'CRM-BASIC-001', true, CURRENT_TIMESTAMP),
(1, 'Professional CRM License', 'Single user with advanced features and integrations', 99.00, 50.00, 'Software License', 'CRM-PRO-001', true, CURRENT_TIMESTAMP),
(1, 'Enterprise CRM License', 'Full-featured enterprise license with priority support', 199.00, 100.00, 'Software License', 'CRM-ENT-001', true, CURRENT_TIMESTAMP),
(1, 'Training Package - Basic', '4 hours of onboarding and training', 500.00, 250.00, 'Services', 'TRN-BASIC-001', true, CURRENT_TIMESTAMP),
(1, 'Training Package - Advanced', '8 hours of comprehensive training', 1000.00, 500.00, 'Services', 'TRN-ADV-001', true, CURRENT_TIMESTAMP),
(1, 'Custom Integration', 'Custom API integration development', 5000.00, 2500.00, 'Services', 'INT-CUSTOM-001', true, CURRENT_TIMESTAMP),
(1, 'Premium Support', 'Annual premium support package', 2500.00, 1250.00, 'Support', 'SUP-PREM-001', true, CURRENT_TIMESTAMP),

-- Org 2 Products
(2, 'Portfolio Analytics Basic', 'Basic portfolio analytics tools', 299.00, 150.00, 'Software', 'PA-BASIC-001', true, CURRENT_TIMESTAMP),
(2, 'Portfolio Analytics Pro', 'Advanced analytics with AI insights', 599.00, 300.00, 'Software', 'PA-PRO-001', true, CURRENT_TIMESTAMP),
(2, 'Financial Consulting', 'Per hour consulting services', 250.00, 125.00, 'Services', 'CON-FIN-001', true, CURRENT_TIMESTAMP);

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 'Dummy data seeded successfully!' AS message,
       '3 Organizations' AS organizations,
       '6 Users' AS users,
       '11 Leads' AS leads,
       '8 Customers' AS customers,
       '11 Deals' AS deals,
       '10 Tasks' AS tasks,
       '10 Activities' AS activities,
       '13 Notes' AS notes,
       '10 Products' AS products;
