const pool = require("../config/db");
const { createNotification } = require("./notificationService");
const TASK_TYPES = ["Lead", "Customer", "Deal"];
const TASK_PRIORITIES = ["Low", "Medium", "High"];
const TASK_STATUSES = ["Pending", "In Progress", "Completed"];
const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  relatedTo: row.related_to,
  type: row.type,
  priority: row.priority,
  status: row.status,
  dueDate: row.due_date,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const getTasks = async (organizationId, ownerId, { page = 1, limit = 200, search = '', status = '', priority = '' } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = ['organization_id = $1', 'owner_id = $2'];
  const params = [organizationId, ownerId];
  let idx = 3;
  if (search) { conditions.push(`title ILIKE $${idx}`); params.push(`%${search}%`); idx++; }
  if (status) { conditions.push(`status = $${idx}`); params.push(status); idx++; }
  if (priority) { conditions.push(`priority = $${idx}`); params.push(priority); idx++; }
  const where = conditions.join(' AND ');
  const [dataRes, countRes] = await Promise.all([
    pool.query(`SELECT * FROM tasks WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limit, offset]),
    pool.query(`SELECT COUNT(*) FROM tasks WHERE ${where}`, params),
  ]);
  return {
    data: dataRes.rows.map(mapTask),
    pagination: { page, limit, total: parseInt(countRes.rows[0].count), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) },
  };
};
const getTaskById = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM tasks
    WHERE id = $1
      AND organization_id = $2
      AND owner_id = $3
    `,
    [id, organizationId, ownerId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }
  return mapTask(result.rows[0]);
};
const createTask = async (organizationId, ownerId, payload) => {
  const { title, relatedTo, type, priority, status, dueDate } = payload;
  if (!title) {
    const error = new Error("Task title is required");
    error.statusCode = 400;
    throw error;
  }
  const finalType = type || "Lead";
  const finalPriority = priority || "Medium";
  const finalStatus = status || "Pending";
  if (!TASK_TYPES.includes(finalType)) {
    const error = new Error("Invalid task type");
    error.statusCode = 400;
    throw error;
  }
  if (!TASK_PRIORITIES.includes(finalPriority)) {
    const error = new Error("Invalid task priority");
    error.statusCode = 400;
    throw error;
  }
  if (!TASK_STATUSES.includes(finalStatus)) {
    const error = new Error("Invalid task status");
    error.statusCode = 400;
    throw error;
  }
  const result = await pool.query(
    `
    INSERT INTO tasks (
      organization_id, owner_id, title, related_to, type, priority, status, due_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [organizationId, ownerId, title, relatedTo || null, finalType, finalPriority, finalStatus, dueDate || null]
  );
  const task = await getTaskById(result.rows[0].id, organizationId, ownerId);
  await createNotification(organizationId, ownerId, {
    type: "task",
    title: "New task assigned",
    description: `${task.title} was added to your tasks`,
  });
  return task;
};
const updateTask = async (id, organizationId, ownerId, payload) => {
  const { title, relatedTo, type, priority, status, dueDate } = payload;
  if (type && !TASK_TYPES.includes(type)) {
    const error = new Error("Invalid task type");
    error.statusCode = 400;
    throw error;
  }
  if (priority && !TASK_PRIORITIES.includes(priority)) {
    const error = new Error("Invalid task priority");
    error.statusCode = 400;
    throw error;
  }
  if (status && !TASK_STATUSES.includes(status)) {
    const error = new Error("Invalid task status");
    error.statusCode = 400;
    throw error;
  }
  const existingTask = await getTaskById(id, organizationId, ownerId);
  const result = await pool.query(
    `
    UPDATE tasks
    SET
      title = COALESCE($1, title),
      related_to = COALESCE($2, related_to),
      type = COALESCE($3, type),
      priority = COALESCE($4, priority),
      status = COALESCE($5, status),
      due_date = COALESCE($6, due_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
      AND organization_id = $8
      AND owner_id = $9
    RETURNING id
    `,
    [
      title || null,
      relatedTo || null,
      type || null,
      priority || null,
      status || null,
      dueDate || null,
      id,
      organizationId,
      ownerId,
    ]
  );
  if (result.rows.length === 0) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }
  const updatedTask = await getTaskById(id, organizationId, ownerId);
  if (status && status !== existingTask.status && status === "Completed") {
    await createNotification(organizationId, ownerId, {
      type: "task",
      title: "Task completed",
      description: `${updatedTask.title} was marked as completed`,
    });
  }
  return updatedTask;
};
const deleteTask = async (id, organizationId, ownerId) => {
  const result = await pool.query(
    `
    DELETE FROM tasks
    WHERE id = $1
      AND organization_id = $2
      AND owner_id = $3
    RETURNING id
    `,
    [id, organizationId, ownerId]
  );
  if (result.rows.length === 0) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }
  return { id };
};

const getAllTasks = async (organizationId, ownerId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM tasks
    WHERE organization_id = $1
      AND owner_id = $2
    ORDER BY created_at DESC
    `,
    [organizationId, ownerId]
  );
  return result.rows.map(mapTask);
};

module.exports = {
  TASK_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllTasks,
};
