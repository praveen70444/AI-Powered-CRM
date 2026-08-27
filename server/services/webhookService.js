const crypto = require('crypto');
const http = require('http');
const https = require('https');
const pool = require('../config/db');
const logger = require('./loggerService');

const getWebhooks = async (organizationId) => {
  const result = await pool.query(`SELECT * FROM webhooks WHERE organization_id=$1 ORDER BY created_at DESC`, [organizationId]);
  return result.rows;
};

const createWebhook = async (organizationId, userId, { name, url, events = [], secret_key }) => {
  if (!name || !url) { const e = new Error('Name and URL are required'); e.statusCode = 400; throw e; }
  const result = await pool.query(
    `INSERT INTO webhooks (organization_id, name, url, events, secret_key, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [organizationId, name, url, events, secret_key || crypto.randomBytes(16).toString('hex'), userId]
  );
  return result.rows[0];
};

const updateWebhook = async (id, organizationId, payload) => {
  const { name, url, events, is_active } = payload;
  const result = await pool.query(
    `UPDATE webhooks SET name=COALESCE($1,name), url=COALESCE($2,url), events=COALESCE($3,events), is_active=COALESCE($4,is_active), updated_at=CURRENT_TIMESTAMP WHERE id=$5 AND organization_id=$6 RETURNING *`,
    [name||null, url||null, events||null, is_active!=null?is_active:null, id, organizationId]
  );
  if (!result.rows[0]) { const e = new Error('Webhook not found'); e.statusCode = 404; throw e; }
  return result.rows[0];
};

const deleteWebhook = async (id, organizationId) => {
  const result = await pool.query(`DELETE FROM webhooks WHERE id=$1 AND organization_id=$2 RETURNING id`, [id, organizationId]);
  if (!result.rows[0]) { const e = new Error('Webhook not found'); e.statusCode = 404; throw e; }
  return { id };
};

const triggerWebhook = async (organizationId, eventType, payload) => {
  const result = await pool.query(
    `SELECT * FROM webhooks WHERE organization_id=$1 AND is_active=TRUE AND $2 = ANY(events)`,
    [organizationId, eventType]
  );
  for (const webhook of result.rows) {
    try {
      const body = JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), data: payload });
      const sig = crypto.createHmac('sha256', webhook.secret_key || '').update(body).digest('hex');
      const urlObj = new URL(webhook.url);
      const mod = urlObj.protocol === 'https:' ? https : http;
      await new Promise((resolve, reject) => {
        const req = mod.request({ hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname + urlObj.search, method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CRM-Signature': sig, 'X-CRM-Event': eventType } }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            pool.query(`INSERT INTO webhook_deliveries (webhook_id, event_type, payload, response_status, response_body) VALUES ($1,$2,$3,$4,$5)`,
              [webhook.id, eventType, payload, res.statusCode, data.slice(0, 500)]);
            resolve();
          });
        });
        req.on('error', (err) => {
          pool.query(`INSERT INTO webhook_deliveries (webhook_id, event_type, payload, error_message) VALUES ($1,$2,$3,$4)`,
            [webhook.id, eventType, payload, err.message]);
          reject(err);
        });
        req.setTimeout(5000, () => req.destroy());
        req.write(body); req.end();
      });
    } catch (err) { logger.error('Webhook delivery failed', { webhookId: webhook.id, error: err.message }); }
  }
};

const getApiKeys = async (organizationId) => {
  const result = await pool.query(`SELECT id, key_name, api_key, permissions, is_active, last_used_at, expires_at, created_at FROM api_keys WHERE organization_id=$1 ORDER BY created_at DESC`, [organizationId]);
  return result.rows.map(r => ({ ...r, api_key: r.api_key.slice(0, 8) + '...' + r.api_key.slice(-4) }));
};

const createApiKey = async (organizationId, userId, { key_name, permissions = ['read'], expires_at }) => {
  if (!key_name) { const e = new Error('Key name is required'); e.statusCode = 400; throw e; }
  const key = 'crm_' + crypto.randomBytes(24).toString('hex');
  const result = await pool.query(
    `INSERT INTO api_keys (organization_id, key_name, api_key, permissions, created_by, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [organizationId, key_name, key, permissions, userId, expires_at || null]
  );
  return { ...result.rows[0], api_key: key }; // Return full key only on creation
};

const revokeApiKey = async (id, organizationId) => {
  const result = await pool.query(`UPDATE api_keys SET is_active=FALSE WHERE id=$1 AND organization_id=$2 RETURNING id`, [id, organizationId]);
  if (!result.rows[0]) { const e = new Error('API key not found'); e.statusCode = 404; throw e; }
  return { id };
};

module.exports = { getWebhooks, createWebhook, updateWebhook, deleteWebhook, triggerWebhook, getApiKeys, createApiKey, revokeApiKey };
