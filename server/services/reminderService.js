const cron = require('node-cron');
const pool = require('../config/db');
const { sendNotificationEmail } = require('./emailService');
const logger = require('./loggerService');

async function sendTaskReminders() {
  try {
    const result = await pool.query(`
      SELECT t.id, t.title, t.due_date, t.organization_id, t.owner_id,
             u.name as owner_name, u.email as owner_email
      FROM tasks t
      JOIN users u ON t.owner_id = u.id
      WHERE t.status != 'Completed'
        AND t.due_date IS NOT NULL
        AND t.due_date::date = CURRENT_DATE + INTERVAL '1 day'
    `);
    for (const task of result.rows) {
      try {
        await sendNotificationEmail({
          email: task.owner_email,
          subject: `Task Due Tomorrow: ${task.title}`,
          message: `Hi ${task.owner_name},<br><br>Your task <strong>"${task.title}"</strong> is due tomorrow.<br>Log in to the CRM to complete it.`,
          organizationId: task.organization_id,
          userId: task.owner_id,
        });
        await pool.query(`INSERT INTO notifications (organization_id, user_id, type, title, description) VALUES ($1,$2,'reminder',$3,$4)`,
          [task.organization_id, task.owner_id, 'Task Due Tomorrow', `"${task.title}" is due tomorrow`]);
      } catch (err) { logger.error('Task reminder failed', { taskId: task.id, error: err.message }); }
    }
    if (result.rows.length) logger.info(`Sent ${result.rows.length} task due-tomorrow reminders`);
  } catch (err) { logger.error('sendTaskReminders error', { error: err.message }); }
}

async function sendDealCloseReminders() {
  try {
    const result = await pool.query(`
      SELECT d.id, d.title, d.close_date, d.value, d.organization_id, d.owner_id,
             u.name as owner_name, u.email as owner_email
      FROM deals d JOIN users u ON d.owner_id = u.id
      WHERE d.stage NOT IN ('Won','Lost')
        AND d.close_date IS NOT NULL
        AND d.close_date::date = CURRENT_DATE + INTERVAL '3 days'
    `);
    for (const deal of result.rows) {
      try {
        await sendNotificationEmail({
          email: deal.owner_email,
          subject: `Deal Closing in 3 Days: ${deal.title}`,
          message: `Hi ${deal.owner_name},<br><br>The deal <strong>"${deal.title}"</strong> is expected to close in 3 days.<br>Pipeline value: ₹${Number(deal.value).toLocaleString('en-IN')}`,
          organizationId: deal.organization_id,
          userId: deal.owner_id,
        });
        await pool.query(`INSERT INTO notifications (organization_id, user_id, type, title, description) VALUES ($1,$2,'reminder',$3,$4)`,
          [deal.organization_id, deal.owner_id, 'Deal Closing Soon', `"${deal.title}" closes in 3 days`]);
      } catch (err) { logger.error('Deal close reminder failed', { dealId: deal.id, error: err.message }); }
    }
    if (result.rows.length) logger.info(`Sent ${result.rows.length} deal close reminders`);
  } catch (err) { logger.error('sendDealCloseReminders error', { error: err.message }); }
}

async function createOverdueNotifications() {
  try {
    const result = await pool.query(`
      SELECT t.id, t.title, t.due_date, t.organization_id, t.owner_id
      FROM tasks t
      WHERE t.status != 'Completed' AND t.due_date IS NOT NULL AND t.due_date::date < CURRENT_DATE
    `);
    for (const task of result.rows) {
      try {
        // Avoid duplicate notifications within 24 hours
        await pool.query(`
          INSERT INTO notifications (organization_id, user_id, type, title, description)
          SELECT $1, $2, 'alert', $3, $4
          WHERE NOT EXISTS (
            SELECT 1 FROM notifications WHERE user_id=$2 AND title=$3
            AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
          )`,
          [task.organization_id, task.owner_id, 'Overdue Task', `"${task.title}" was due on ${task.due_date}`]);
      } catch (err) { logger.error('Overdue notification failed', { taskId: task.id }); }
    }
  } catch (err) { logger.error('createOverdueNotifications error', { error: err.message }); }
}

function startReminderScheduler() {
  // 8am daily — task reminders + deal close reminders
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running daily reminder jobs');
    await sendTaskReminders();
    await sendDealCloseReminders();
  });

  // Every hour — overdue task notifications
  cron.schedule('0 * * * *', createOverdueNotifications);

  logger.info('Reminder scheduler started (daily @8am + hourly overdue check)');
}

module.exports = { startReminderScheduler, sendTaskReminders, sendDealCloseReminders, createOverdueNotifications };
