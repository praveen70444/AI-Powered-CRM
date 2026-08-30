-- Quick Dummy Data for Testing AI Features
-- Works with existing schema and users

-- Use existing users (IDs 5-10 from previous seed)
-- Org 1: IDs 5,6,7,8 (John=admin, Sarah, Mike, Emily)
-- Org 2: IDs 9,10 (Robert=admin, Lisa)

-- ============================================================================
-- LEADS (for AI scoring testing)
-- ============================================================================
INSERT INTO leads (organization_id, owner_id, name, company, email, phone, status, source, value, created_at) VALUES
-- HOT LEADS (high value, good source)
(1, 6, 'Alex Martinez', 'Enterprise Tech', 'alex@enttech.com', '+1-555-1001', 'Qualified', 'Referral', 75000, NOW() - INTERVAL '5 days'),
(1, 6, 'Jessica Brown', 'Innovation Labs', 'jessica@innovlabs.com', '+1-555-1002', 'Qualified', 'Website', 65000, NOW() - INTERVAL '3 days'),

-- WARM LEADS (medium value)
(1, 7, 'David Wilson', 'CloudScale Inc', 'david@cloudscale.com', '+1-555-1003', 'Contacted', 'Website', 35000, NOW() - INTERVAL '7 days'),
(1, 7, 'Karen Lee', 'MidSize Co', 'karen@midsize.com', '+1-555-1004', 'New', 'Social Media', 25000, NOW() - INTERVAL '2 days'),

-- COLD LEADS (low value, bad source)
(1, 8, 'Peter Jones', 'Small Biz', 'peter@smallbiz.com', '+1-555-1005', 'New', 'Cold Call', 8000, NOW() - INTERVAL '15 days'),
(1, 8, 'Nancy White', 'Local Services', 'nancy@local.com', '+1-555-1006', 'Unqualified', 'Advertisement', 5000, NOW() - INTERVAL '20 days');

-- ============================================================================
-- CUSTOMERS (for churn risk testing)
-- ============================================================================
INSERT INTO customers (organization_id, owner_id, name, company, email, phone, status, created_at) VALUES
-- ACTIVE (recent activity)
(1, 6, 'Michael Johnson', 'Tech Innovators', 'michael@techinno.com', '+1-555-3001', 'Active', NOW() - INTERVAL '180 days'),
(1, 6, 'Susan Williams', 'Digital Solutions', 'susan@digsol.com', '+1-555-3002', 'Active', NOW() - INTERVAL '90 days'),

-- AT RISK (no activity 60+ days)
(1, 7, 'Patricia Martinez', 'Legacy Systems', 'patricia@legacy.com', '+1-555-3003', 'At Risk', NOW() - INTERVAL '120 days'),
(1, 7, 'Robert Thompson', 'Old Guard Corp', 'robert@oldguard.com', '+1-555-3004', 'At Risk', NOW() - INTERVAL '150 days'),

-- INACTIVE
(1, 8, 'Linda Garcia', 'Past Client LLC', 'linda@pastclient.com', '+1-555-3005', 'Inactive', NOW() - INTERVAL '400 days');

-- ============================================================================
-- DEALS (for health scoring)
-- ============================================================================
INSERT INTO deals (organization_id, owner_id, customer_id, title, value, stage, close_date, created_at) VALUES
-- WON
(1, 6, 20, 'Annual License Renewal', 50000, 'Won', NOW() - INTERVAL '30 days', NOW() - INTERVAL '90 days'),

-- ACTIVE (closing soon)
(1, 6, 20, 'Q4 Upgrade Package', 75000, 'Negotiation', NOW() + INTERVAL '15 days', NOW() - INTERVAL '45 days'),
(1, 7, 21, 'Cloud Migration Project', 95000, 'Negotiation', NOW() + INTERVAL '20 days', NOW() - INTERVAL '30 days'),

-- STALE (overdue, no activity)
(1, 6, 22, 'Legacy System Upgrade', 45000, 'Proposal', NOW() - INTERVAL '10 days', NOW() - INTERVAL '80 days'),

-- LOST
(1, 8, 24, 'Small Business Package', 8000, 'Lost', NOW() - INTERVAL '20 days', NOW() - INTERVAL '90 days');

-- ============================================================================
-- TASKS (for reminders)
-- ============================================================================
INSERT INTO tasks (organization_id, owner_id, title, due_date, priority, status, related_to, created_at) VALUES
-- OVERDUE
(1, 6, 'Follow up with Tech Innovators', NOW() - INTERVAL '2 days', 'High', 'Pending', 'Michael Johnson', NOW() - INTERVAL '10 days'),
(1, 6, 'Send proposal to Enterprise Tech', NOW() - INTERVAL '1 day', 'High', 'Pending', 'Alex Martinez', NOW() - INTERVAL '5 days'),

-- DUE TODAY
(1, 7, 'Call CloudScale Inc', NOW(), 'High', 'Pending', 'David Wilson', NOW() - INTERVAL '3 days'),

-- UPCOMING
(1, 7, 'Prepare demo presentation', NOW() + INTERVAL '3 days', 'High', 'Pending', 'Jessica Brown', NOW() - INTERVAL '1 day'),
(1, 8, 'Schedule training session', NOW() + INTERVAL '10 days', 'Low', 'Pending', 'Michael Johnson', NOW()),

-- COMPLETED
(1, 6, 'Initial contact with lead', NOW() - INTERVAL '7 days', 'Medium', 'Completed', 'Alex Martinez', NOW() - INTERVAL '10 days');

-- ============================================================================
-- ACTIVITIES (for relationship tracking)
-- ============================================================================
INSERT INTO activities (organization_id, owner_id, type, title, related_to, created_at) VALUES
-- RECENT (last 7 days)
(1, 6, 'Call', 'Discovery Call with Alex', 'Alex Martinez', NOW() - INTERVAL '2 days'),
(1, 6, 'Email', 'Sent proposal to Enterprise Tech', 'Alex Martinez', NOW() - INTERVAL '3 days'),
(1, 6, 'Meeting', 'Demo for Jessica', 'Jessica Brown', NOW() - INTERVAL '4 days'),

-- MEDIUM (8-30 days ago)
(1, 7, 'Call', 'Check-in with James', 'Michael Johnson', NOW() - INTERVAL '15 days'),
(1, 6, 'Email', 'Follow-up with Tech Innovators', 'Michael Johnson', NOW() - INTERVAL '20 days'),

-- OLD (for churn detection - 60+ days)
(1, 6, 'Call', 'Last contact with Legacy Systems', 'Patricia Martinez', NOW() - INTERVAL '65 days');

-- ============================================================================
-- NOTES (for AI summarization - 3+ notes)
-- ============================================================================
INSERT INTO notes (organization_id, author_id, content, related_to, related_type, created_at) VALUES
-- Multiple notes for Alex (for summarization testing)
(1, 6, 'Initial contact. Very interested in enterprise solution. Budget approved at $75k.', 'Alex Martinez', 'Lead', NOW() - INTERVAL '5 days'),
(1, 6, 'Demo scheduled. Needs Salesforce integration.', 'Alex Martinez', 'Lead', NOW() - INTERVAL '4 days'),
(1, 6, 'Demo went excellent! Loved reporting features.', 'Alex Martinez', 'Lead', NOW() - INTERVAL '3 days'),
(1, 6, 'Proposal sent. Will review with VP and get back by end of week.', 'Alex Martinez', 'Lead', NOW() - INTERVAL '2 days'),

-- Notes for Michael (customer)
(1, 6, 'Interested in upgrading to premium tier.', 'Michael Johnson', 'Customer', NOW() - INTERVAL '15 days'),
(1, 6, 'Upgrade confirmed. Procurement working on paperwork.', 'Michael Johnson', 'Customer', NOW() - INTERVAL '10 days'),
(1, 6, 'Contract signed! Upgrade effective next month.', 'Michael Johnson', 'Customer', NOW() - INTERVAL '5 days');

-- ============================================================================
-- PRODUCTS
-- ============================================================================
INSERT INTO products (organization_id, name, description, unit_price, cost_price, category, sku, is_active, created_at) VALUES
(1, 'Basic CRM License', 'Single user license', 49.00, 25.00, 'Software', 'CRM-BASIC', true, NOW()),
(1, 'Pro CRM License', 'Advanced features', 99.00, 50.00, 'Software', 'CRM-PRO', true, NOW()),
(1, 'Enterprise CRM', 'Full suite with support', 199.00, 100.00, 'Software', 'CRM-ENT', true, NOW()),
(1, 'Training Package', '8 hours training', 1000.00, 500.00, 'Services', 'TRN-001', true, NOW()),
(1, 'Premium Support', 'Annual support', 2500.00, 1250.00, 'Support', 'SUP-001', true, NOW());

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
    (SELECT COUNT(*) FROM leads) AS leads_count,
    (SELECT COUNT(*) FROM customers WHERE id > 2) AS new_customers,
    (SELECT COUNT(*) FROM deals) AS deals_count,
    (SELECT COUNT(*) FROM tasks) AS tasks_count,
    (SELECT COUNT(*) FROM activities) AS activities_count,
    (SELECT COUNT(*) FROM notes) AS notes_count,
    (SELECT COUNT(*) FROM products WHERE organization_id > 0) AS products_count,
    'Dummy data loaded successfully!' AS message;
