const pool = require('../config/db');

const mapEvent = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  eventType: row.event_type,
  startTime: row.start_time,
  endTime: row.end_time,
  location: row.location,
  isAllDay: row.is_all_day,
  reminderMinutes: row.reminder_minutes,
  relatedType: row.related_type,
  relatedId: row.related_id,
  status: row.status,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  // keep snake_case for frontend datetime-local inputs
  start_time: row.start_time,
  end_time: row.end_time,
  event_type: row.event_type,
});

const getEvents = async (organizationId, ownerId, { start, end } = {}) => {
  let query = `SELECT * FROM calendar_events WHERE organization_id=$1 AND owner_id=$2`;
  const params = [organizationId, ownerId];
  if (start) { query += ` AND start_time >= $3`; params.push(start); }
  if (end) { query += ` AND start_time <= $${params.length + 1}`; params.push(end); }
  query += ` ORDER BY start_time ASC`;
  const result = await pool.query(query, params);
  const events = result.rows.map(mapEvent);

  // Fetch tasks and merge them as all-day events
  let taskQuery = `SELECT * FROM tasks WHERE organization_id=$1 AND owner_id=$2 AND due_date IS NOT NULL`;
  if (start) { taskQuery += ` AND due_date >= $3`; }
  if (end) { taskQuery += ` AND due_date <= $${params.length + 1}`; }
  const taskResult = await pool.query(taskQuery, params);
  
  const taskEvents = taskResult.rows.map(row => {
    // Treat due date as 9 AM
    const taskDate = new Date(row.due_date);
    taskDate.setHours(9, 0, 0, 0);
    return {
      id: `task_${row.id}`,
      title: `Task: ${row.title}`,
      description: `Related to: ${row.related_to || 'None'}\nPriority: ${row.priority}\nStatus: ${row.status}`,
      eventType: 'Task',
      startTime: taskDate.toISOString(),
      endTime: taskDate.toISOString(),
      location: null,
      isAllDay: true,
      reminderMinutes: 0,
      relatedType: 'task',
      relatedId: row.id,
      status: row.status,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      start_time: taskDate.toISOString(),
      end_time: taskDate.toISOString(),
      event_type: 'Task',
    };
  });

  return [...events, ...taskEvents].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
};

const getEventById = async (id, organizationId) => {
  const result = await pool.query(`SELECT * FROM calendar_events WHERE id=$1 AND organization_id=$2`, [id, organizationId]);
  if (!result.rows[0]) { const e = new Error('Event not found'); e.statusCode = 404; throw e; }
  return mapEvent(result.rows[0]);
};

const createEvent = async (organizationId, ownerId, payload) => {
  const { title, description, event_type = 'Meeting', start_time, end_time, location, is_all_day = false, reminder_minutes = 30, related_type, related_id } = payload;
  if (!title || !start_time || !end_time) { const e = new Error('Title, start time and end time are required'); e.statusCode = 400; throw e; }
  const result = await pool.query(
    `INSERT INTO calendar_events (organization_id, owner_id, title, description, event_type, start_time, end_time, location, is_all_day, reminder_minutes, related_type, related_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [organizationId, ownerId, title, description||null, event_type, start_time, end_time, location||null, is_all_day, reminder_minutes, related_type||null, related_id||null]
  );
  return mapEvent(result.rows[0]);
};

const updateEvent = async (id, organizationId, payload) => {
  const { title, description, event_type, start_time, end_time, location, is_all_day, reminder_minutes, status } = payload;
  const result = await pool.query(
    `UPDATE calendar_events SET title=COALESCE($1,title), description=COALESCE($2,description), event_type=COALESCE($3,event_type),
     start_time=COALESCE($4,start_time), end_time=COALESCE($5,end_time), location=COALESCE($6,location),
     is_all_day=COALESCE($7,is_all_day), reminder_minutes=COALESCE($8,reminder_minutes), status=COALESCE($9,status),
     updated_at=CURRENT_TIMESTAMP WHERE id=$10 AND organization_id=$11 RETURNING *`,
    [title||null, description||null, event_type||null, start_time||null, end_time||null, location||null, is_all_day!=null?is_all_day:null, reminder_minutes||null, status||null, id, organizationId]
  );
  if (!result.rows[0]) { const e = new Error('Event not found'); e.statusCode = 404; throw e; }
  return mapEvent(result.rows[0]);
};

const deleteEvent = async (id, organizationId) => {
  const result = await pool.query(`DELETE FROM calendar_events WHERE id=$1 AND organization_id=$2 RETURNING id`, [id, organizationId]);
  if (!result.rows[0]) { const e = new Error('Event not found'); e.statusCode = 404; throw e; }
  return { id };
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };
