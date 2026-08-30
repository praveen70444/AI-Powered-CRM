-- ============================================================================
-- DEMO DATA SEED — Adjusted for Demo Corp org
-- Reads org/user IDs dynamically — works on any database
-- Run AFTER inserting the org admin + 5 employees
-- ============================================================================

-- Pull IDs into variables so everything is consistent
DO $$
DECLARE
    v_org_id      BIGINT;
    v_admin_id    BIGINT;
    v_emp1_id     BIGINT;  -- Sarah Johnson
    v_emp2_id     BIGINT;  -- Mike Chen
    v_emp3_id     BIGINT;  -- Emily Davis
    v_emp4_id     BIGINT;  -- Raj Patel
    v_emp5_id     BIGINT;  -- Lisa Anderson

    v_cust1_id    BIGINT;
    v_cust2_id    BIGINT;
    v_cust3_id    BIGINT;
    v_cust4_id    BIGINT;
    v_cust5_id    BIGINT;

BEGIN
    -- ── Resolve org & users ────────────────────────────────────────────────
    SELECT id INTO v_org_id   FROM organizations WHERE name = 'Demo Corp' LIMIT 1;
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@democorp.com' LIMIT 1;
    SELECT id INTO v_emp1_id  FROM users WHERE email = 'sarah@democorp.com' LIMIT 1;
    SELECT id INTO v_emp2_id  FROM users WHERE email = 'mike@democorp.com'  LIMIT 1;
    SELECT id INTO v_emp3_id  FROM users WHERE email = 'emily@democorp.com' LIMIT 1;
    SELECT id INTO v_emp4_id  FROM users WHERE email = 'raj@democorp.com'   LIMIT 1;
    SELECT id INTO v_emp5_id  FROM users WHERE email = 'lisa@democorp.com'  LIMIT 1;

    RAISE NOTICE 'org=% admin=% emp1=% emp2=% emp3=% emp4=% emp5=%',
        v_org_id, v_admin_id, v_emp1_id, v_emp2_id, v_emp3_id, v_emp4_id, v_emp5_id;

    -- ── LEADS ─────────────────────────────────────────────────────────────
    -- HOT leads (high value, good source) — owned by Sarah
    INSERT INTO leads (organization_id, owner_id, name, company, email, phone, status, source, value, created_at) VALUES
    (v_org_id, v_emp1_id, 'Alex Martinez',  'Enterprise Tech',  'alex@enttech.com',      '+1-555-1001', 'Qualified',   'Referral',       75000, NOW() - INTERVAL '5 days'),
    (v_org_id, v_emp1_id, 'Jessica Brown',  'Innovation Labs',  'jessica@innovlabs.com', '+1-555-1002', 'Qualified',   'Website',        65000, NOW() - INTERVAL '3 days'),

    -- WARM leads — owned by Mike
    (v_org_id, v_emp2_id, 'David Wilson',   'CloudScale Inc',   'david@cloudscale.com',  '+1-555-1003', 'Contacted',   'Website',        35000, NOW() - INTERVAL '7 days'),
    (v_org_id, v_emp2_id, 'Karen Lee',      'MidSize Co',       'karen@midsize.com',     '+1-555-1004', 'New',         'Social Media',   25000, NOW() - INTERVAL '2 days'),

    -- COLD leads — owned by Emily
    (v_org_id, v_emp3_id, 'Peter Jones',    'Small Biz',        'peter@smallbiz.com',    '+1-555-1005', 'New',         'Cold Call',       8000, NOW() - INTERVAL '15 days'),
    (v_org_id, v_emp3_id, 'Nancy White',    'Local Services',   'nancy@local.com',       '+1-555-1006', 'Unqualified', 'Advertisement',   5000, NOW() - INTERVAL '20 days'),

    -- Extra leads for Raj and Lisa
    (v_org_id, v_emp4_id, 'Tom Harris',     'Startup Ventures', 'tom@startup.com',       '+1-555-1007', 'Contacted',   'Event',          42000, NOW() - INTERVAL '4 days'),
    (v_org_id, v_emp5_id, 'Rachel Green',   'GreenTech',        'rachel@greentech.com',  '+1-555-1008', 'New',         'Referral',       58000, NOW() - INTERVAL '1 day');

    -- ── CUSTOMERS ─────────────────────────────────────────────────────────
    -- ACTIVE
    INSERT INTO customers (organization_id, owner_id, name, company, email, phone, status, created_at)
    VALUES (v_org_id, v_emp1_id, 'Michael Johnson', 'Tech Innovators', 'michael@techinno.com',  '+1-555-3001', 'Active',   NOW() - INTERVAL '180 days')
    RETURNING id INTO v_cust1_id;

    INSERT INTO customers (organization_id, owner_id, name, company, email, phone, status, created_at)
    VALUES (v_org_id, v_emp1_id, 'Susan Williams',  'Digital Solutions', 'susan@digsol.com',   '+1-555-3002', 'Active',   NOW() - INTERVAL '90 days')
    RETURNING id INTO v_cust2_id;

    -- AT RISK
    INSERT INTO customers (organization_id, owner_id, name, company, email, phone, status, created_at)
    VALUES (v_org_id, v_emp2_id, 'Patricia Martinez', 'Legacy Systems',  'patricia@legacy.com',  '+1-555-3003', 'At Risk', NOW() - INTERVAL '120 days')
    RETURNING id INTO v_cust3_id;

    INSERT INTO customers (organization_id, owner_id, name, company, email, phone, status, created_at)
    VALUES (v_org_id, v_emp2_id, 'Robert Thompson',   'Old Guard Corp',  'robert@oldguard.com',  '+1-555-3004', 'At Risk', NOW() - INTERVAL '150 days')
    RETURNING id INTO v_cust4_id;

    -- INACTIVE
    INSERT INTO customers (organization_id, owner_id, name, company, email, phone, status, created_at)
    VALUES (v_org_id, v_emp3_id, 'Linda Garcia',      'Past Client LLC', 'linda@pastclient.com', '+1-555-3005', 'Inactive', NOW() - INTERVAL '400 days')
    RETURNING id INTO v_cust5_id;

    -- ── DEALS ─────────────────────────────────────────────────────────────
    INSERT INTO deals (organization_id, owner_id, customer_id, title, value, stage, close_date, created_at) VALUES
    -- WON
    (v_org_id, v_emp1_id, v_cust1_id, 'Annual License Renewal',  50000, 'Won',         NOW() - INTERVAL '30 days',  NOW() - INTERVAL '90 days'),
    -- NEGOTIATION — closing soon
    (v_org_id, v_emp1_id, v_cust1_id, 'Q4 Upgrade Package',       75000, 'Negotiation', NOW() + INTERVAL '15 days',  NOW() - INTERVAL '45 days'),
    (v_org_id, v_emp2_id, v_cust2_id, 'Cloud Migration Project',  95000, 'Negotiation', NOW() + INTERVAL '20 days',  NOW() - INTERVAL '30 days'),
    -- PROPOSAL
    (v_org_id, v_emp3_id, v_cust2_id, 'Analytics Module Add-on',  28000, 'Proposal',    NOW() + INTERVAL '35 days',  NOW() - INTERVAL '15 days'),
    -- STALE (overdue, no activity)
    (v_org_id, v_emp1_id, v_cust3_id, 'Legacy System Upgrade',    45000, 'Proposal',    NOW() - INTERVAL '10 days',  NOW() - INTERVAL '80 days'),
    -- LOST
    (v_org_id, v_emp3_id, v_cust5_id, 'Small Business Package',    8000, 'Lost',         NOW() - INTERVAL '20 days',  NOW() - INTERVAL '90 days'),
    -- QUALIFIED
    (v_org_id, v_emp4_id, v_cust1_id, 'API Integration Project',  18000, 'Qualified',   NOW() + INTERVAL '60 days',  NOW() - INTERVAL '5 days');

    -- ── TASKS ─────────────────────────────────────────────────────────────
    INSERT INTO tasks (organization_id, owner_id, title, due_date, priority, status, related_to, created_at) VALUES
    -- OVERDUE
    (v_org_id, v_emp1_id, 'Follow up with Tech Innovators',   NOW() - INTERVAL '2 days',  'High',   'Pending',   'Michael Johnson', NOW() - INTERVAL '10 days'),
    (v_org_id, v_emp1_id, 'Send proposal to Enterprise Tech', NOW() - INTERVAL '1 day',   'High',   'Pending',   'Alex Martinez',   NOW() - INTERVAL '5 days'),
    -- DUE TODAY
    (v_org_id, v_emp2_id, 'Call CloudScale Inc',              NOW(),                        'High',   'Pending',   'David Wilson',    NOW() - INTERVAL '3 days'),
    (v_org_id, v_emp3_id, 'Review contract terms',            NOW(),                        'Medium', 'Pending',   'Susan Williams',  NOW() - INTERVAL '2 days'),
    -- UPCOMING
    (v_org_id, v_emp2_id, 'Prepare demo presentation',        NOW() + INTERVAL '3 days',   'High',   'Pending',   'Jessica Brown',   NOW() - INTERVAL '1 day'),
    (v_org_id, v_emp4_id, 'Send pricing to GreenTech',        NOW() + INTERVAL '5 days',   'Medium', 'Pending',   'Rachel Green',    NOW()),
    (v_org_id, v_emp3_id, 'Schedule training session',        NOW() + INTERVAL '10 days',  'Low',    'Pending',   'Michael Johnson', NOW()),
    (v_org_id, v_emp5_id, 'Onboarding call with new client',  NOW() + INTERVAL '7 days',   'Medium', 'Pending',   'Tom Harris',      NOW()),
    -- COMPLETED
    (v_org_id, v_emp1_id, 'Initial contact with lead',        NOW() - INTERVAL '7 days',   'Medium', 'Completed', 'Alex Martinez',   NOW() - INTERVAL '10 days'),
    (v_org_id, v_emp2_id, 'Send welcome email',               NOW() - INTERVAL '5 days',   'Low',    'Completed', 'Michael Johnson', NOW() - INTERVAL '8 days');

    -- ── ACTIVITIES ────────────────────────────────────────────────────────
    INSERT INTO activities (organization_id, owner_id, type, title, related_to, created_at) VALUES
    -- RECENT (last 7 days)
    (v_org_id, v_emp1_id, 'Call',    'Discovery Call with Alex',           'Alex Martinez',    NOW() - INTERVAL '2 days'),
    (v_org_id, v_emp1_id, 'Email',   'Sent proposal to Enterprise Tech',   'Alex Martinez',    NOW() - INTERVAL '3 days'),
    (v_org_id, v_emp1_id, 'Meeting', 'Demo for Jessica Brown',             'Jessica Brown',    NOW() - INTERVAL '4 days'),
    (v_org_id, v_emp2_id, 'Call',    'Kickoff call with CloudScale',       'David Wilson',     NOW() - INTERVAL '5 days'),
    (v_org_id, v_emp4_id, 'Meeting', 'Intro meeting with Tom Harris',      'Tom Harris',       NOW() - INTERVAL '2 days'),
    -- MEDIUM (8-30 days ago)
    (v_org_id, v_emp1_id, 'Call',    'Quarterly check-in Tech Innovators', 'Michael Johnson',  NOW() - INTERVAL '15 days'),
    (v_org_id, v_emp1_id, 'Email',   'Renewal reminder sent',              'Michael Johnson',  NOW() - INTERVAL '20 days'),
    (v_org_id, v_emp2_id, 'Meeting', 'Contract review with Susan',         'Susan Williams',   NOW() - INTERVAL '18 days'),
    -- OLD (60+ days — triggers churn detection)
    (v_org_id, v_emp1_id, 'Call',    'Last contact — Legacy Systems',      'Patricia Martinez',NOW() - INTERVAL '65 days'),
    (v_org_id, v_emp2_id, 'Email',   'Last email — Old Guard Corp',        'Robert Thompson',  NOW() - INTERVAL '80 days');

    -- ── NOTES (3+ per entity for AI summarization) ─────────────────────────
    INSERT INTO notes (organization_id, author_id, content, related_to, related_type, created_at) VALUES
    -- 4 notes for Alex Martinez (lead) — enough for AI summarization
    (v_org_id, v_emp1_id, 'Initial contact made. Very interested in our enterprise solution. Budget approved at $75k.', 'Alex Martinez', 'Lead', NOW() - INTERVAL '5 days'),
    (v_org_id, v_emp1_id, 'Demo scheduled for next week. Alex mentioned they need Salesforce integration.',             'Alex Martinez', 'Lead', NOW() - INTERVAL '4 days'),
    (v_org_id, v_emp1_id, 'Demo went excellent! Loved the reporting features. Requested formal proposal.',               'Alex Martinez', 'Lead', NOW() - INTERVAL '3 days'),
    (v_org_id, v_emp1_id, 'Proposal sent. Alex will review with VP and get back by end of week.',                        'Alex Martinez', 'Lead', NOW() - INTERVAL '2 days'),

    -- 3 notes for Michael Johnson (customer)
    (v_org_id, v_emp1_id, 'Michael mentioned interest in upgrading to premium tier during renewal discussion.',          'Michael Johnson', 'Customer', NOW() - INTERVAL '15 days'),
    (v_org_id, v_emp1_id, 'Upgrade confirmed. Procurement team is working on paperwork.',                                'Michael Johnson', 'Customer', NOW() - INTERVAL '10 days'),
    (v_org_id, v_emp1_id, 'Contract signed! Upgrade effective next month. Very happy customer.',                         'Michael Johnson', 'Customer', NOW() - INTERVAL '5 days'),

    -- 3 notes for Cloud Migration Project (deal)
    (v_org_id, v_emp2_id, 'CloudScale very serious about migration. Timeline: Q1 next year.',                           'Cloud Migration Project', 'Deal', NOW() - INTERVAL '20 days'),
    (v_org_id, v_emp2_id, 'Technical requirements gathered. Custom integration needed for legacy systems.',              'Cloud Migration Project', 'Deal', NOW() - INTERVAL '15 days'),
    (v_org_id, v_emp2_id, 'Pricing approved by David. Moving to contract phase this week.',                              'Cloud Migration Project', 'Deal', NOW() - INTERVAL '7 days'),

    -- Single notes for other records
    (v_org_id, v_emp2_id, 'Karen needs integrations with HubSpot and Mailchimp. Sent technical specs.',                 'Karen Lee',        'Lead', NOW() - INTERVAL '2 days'),
    (v_org_id, v_emp4_id, 'Tom is evaluating 3 vendors. We are top 2. Follow up after their board meeting.',            'Tom Harris',       'Lead', NOW() - INTERVAL '1 day'),
    (v_org_id, v_emp5_id, 'Rachel confirmed $58k budget. Decision in 2 weeks.',                                         'Rachel Green',     'Lead', NOW());

    -- ── PRODUCTS ──────────────────────────────────────────────────────────
    INSERT INTO products (organization_id, name, description, unit_price, cost_price, category, sku, is_active, created_at) VALUES
    (v_org_id, 'Basic CRM License',    'Single user CRM license',          49.00,   25.00,   'Software', 'CRM-BASIC', true, NOW()),
    (v_org_id, 'Pro CRM License',      'Advanced features + integrations',  99.00,   50.00,   'Software', 'CRM-PRO',   true, NOW()),
    (v_org_id, 'Enterprise CRM',       'Full suite with priority support',  199.00,  100.00,  'Software', 'CRM-ENT',   true, NOW()),
    (v_org_id, 'Training Package',     '8 hours onboarding + training',    1000.00,  500.00,  'Services', 'TRN-001',   true, NOW()),
    (v_org_id, 'Custom Integration',   'Custom API integration dev work',  5000.00, 2500.00,  'Services', 'INT-001',   true, NOW()),
    (v_org_id, 'Premium Support',      'Annual premium support package',   2500.00, 1250.00,  'Support',  'SUP-001',   true, NOW());

    RAISE NOTICE '✅ Demo data loaded successfully!';
END$$;

-- ── Verify ────────────────────────────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM leads     WHERE organization_id = (SELECT id FROM organizations WHERE name='Demo Corp')) AS leads,
    (SELECT COUNT(*) FROM customers WHERE organization_id = (SELECT id FROM organizations WHERE name='Demo Corp')) AS customers,
    (SELECT COUNT(*) FROM deals     WHERE organization_id = (SELECT id FROM organizations WHERE name='Demo Corp')) AS deals,
    (SELECT COUNT(*) FROM tasks     WHERE organization_id = (SELECT id FROM organizations WHERE name='Demo Corp')) AS tasks,
    (SELECT COUNT(*) FROM activities WHERE organization_id= (SELECT id FROM organizations WHERE name='Demo Corp')) AS activities,
    (SELECT COUNT(*) FROM notes     WHERE organization_id = (SELECT id FROM organizations WHERE name='Demo Corp')) AS notes,
    (SELECT COUNT(*) FROM products  WHERE organization_id = (SELECT id FROM organizations WHERE name='Demo Corp')) AS products;
