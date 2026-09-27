import { useEffect, useMemo, useState } from "react";
import { ListChecks, CalendarDays, Clock, AlertCircle, Pencil, Trash2, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import StatusBadge from "../../components/employee/StatusBadge";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import { TASK_STATUSES, TASK_PRIORITIES } from "../../mock/tasks";
import { getTasks, createTask, updateTask, deleteTask } from "../../services/employeeService";
import { exportTasks } from "../../services/exportService";

const TABS = ["All", "Pending", "In Progress", "Completed"];

// ── Date grouping helpers ─────────────────────────────────────────────────
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const yesterday = () => {
  const d = today();
  d.setDate(d.getDate() - 1);
  return d;
};
const tomorrow = () => {
  const d = today();
  d.setDate(d.getDate() + 1);
  return d;
};

const getTaskGroup = (task) => {
  if (task.status === "Completed") return "Completed";
  if (!task.dueDate) return "No Due Date";
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const t = today().getTime();
  const y = yesterday().getTime();
  const tom = tomorrow().getTime();
  const dueT = due.getTime();
  if (dueT === t) return "Today";
  if (dueT === y) return "Yesterday";
  if (dueT === tom) return "Tomorrow";
  if (dueT < t) return "Overdue";
  return "Upcoming";
};

const GROUP_ORDER = ["Overdue", "Yesterday", "Today", "Tomorrow", "Upcoming", "No Due Date", "Completed"];

const GROUP_STYLES = {
  Overdue:      { dot: "bg-red-500",    label: "text-red-600",    badge: "bg-red-50 border-red-100",    icon: AlertCircle },
  Yesterday:    { dot: "bg-gray-400",   label: "text-gray-500",   badge: "bg-gray-50 border-gray-100",  icon: CalendarDays },
  Today:        { dot: "bg-blue-500",   label: "text-blue-700",   badge: "bg-blue-50 border-blue-100",  icon: Clock },
  Tomorrow:     { dot: "bg-amber-500",  label: "text-amber-700",  badge: "bg-amber-50 border-amber-100",icon: CalendarDays },
  Upcoming:     { dot: "bg-emerald-500",label: "text-emerald-700",badge: "bg-emerald-50 border-emerald-100",icon: CalendarDays },
  "No Due Date":{ dot: "bg-gray-300",   label: "text-gray-400",   badge: "bg-gray-50 border-gray-100",  icon: CalendarDays },
  Completed:    { dot: "bg-green-500",  label: "text-green-700",  badge: "bg-green-50 border-green-100",icon: ListChecks },
};

function formatDueDate(dueDateStr) {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const t = today().getTime();
  const y = yesterday().getTime();
  const tom = tomorrow().getTime();
  const dueT = due.getTime();
  if (dueT === t) return "Today";
  if (dueT === y) return "Yesterday";
  if (dueT === tom) return "Tomorrow";
  return due.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadTasks() {
      try {
        setLoading(true);
        setError("");
        const response = await getTasks();
        if (!isMounted) return;
        setTasks(response.data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.friendlyMessage || "Unable to load tasks.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTasks();
    return () => { isMounted = false; };
  }, []);

  // Filter then group by date
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchesTab = tab === "All" ? true : t.status === tab;
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.relatedTo || "").toLowerCase().includes(search.toLowerCase());
      const matchesPriority = priority ? t.priority === priority : true;
      return matchesTab && matchesSearch && matchesPriority;
    });
  }, [tasks, tab, search, priority]);

  // Group tasks by date label
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const group = getTaskGroup(t);
      if (!map[group]) map[group] = [];
      map[group].push(t);
    });
    // Sort within each group by due date then title
    Object.keys(map).forEach((g) => {
      map[g].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    });
    // Return in defined order
    return GROUP_ORDER.filter((g) => map[g]).map((g) => ({ group: g, tasks: map[g] }));
  }, [filtered]);

  function openAddModal() { setActiveTask(null); setModalOpen(true); }
  function openEditModal(task) { setActiveTask(task); setModalOpen(true); }

  async function handleSave(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      title: form.get("title"),
      relatedTo: form.get("relatedTo"),
      type: form.get("type"),
      priority: form.get("priority"),
      status: form.get("status"),
      dueDate: form.get("dueDate") || null,
    };
    setSaving(true);
    setError("");
    try {
      if (activeTask) {
        const response = await updateTask(activeTask.id, payload);
        setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? response.data : t)));
      } else {
        const response = await createTask(payload);
        setTasks((prev) => [response.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.friendlyMessage || "Unable to delete task.");
    } finally {
      setSaving(false);
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} tasks?`)) return;
    setSaving(true);
    try {
      await Promise.all(selectedIds.map(id => deleteTask(id)));
      setTasks(prev => prev.filter(t => !selectedIds.includes(t.id)));
      setSelectedIds([]);
    } catch (err) {
      setError("Failed to bulk delete tasks.");
    } finally { setSaving(false); }
  };

  async function toggleStatus(task) {
    const next =
      task.status === "Completed" ? "Pending"
      : task.status === "Pending" ? "In Progress"
      : "Completed";
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      const response = await updateTask(task.id, { status: next });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? response.data : t)));
    } catch (err) {
      setTasks(previous);
      setError(err.friendlyMessage || "Unable to update task.");
    }
  }

  const todayCount = useMemo(
    () => tasks.filter((t) => getTaskGroup(t) === "Today").length,
    [tasks]
  );
  const overdueCount = useMemo(
    () => tasks.filter((t) => getTaskGroup(t) === "Overdue").length,
    [tasks]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Summary bar */}
      {(todayCount > 0 || overdueCount > 0) && (
        <div className="flex items-center gap-4 px-6 pt-4 pb-0">
          {todayCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-700">
              <Clock size={12} /> {todayCount} due today
            </span>
          )}
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full text-xs font-medium text-red-600">
              <AlertCircle size={12} /> {overdueCount} overdue
            </span>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-6 pt-4 justify-between">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="pr-2">
          <ExportMenu onExport={exportTasks} />
        </div>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setSelectedIds([]); }}
        searchPlaceholder="Search tasks..."
        addLabel="Add Task"
        onAddClick={openAddModal}
        bulkActions={selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors">
            {saving ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
          </button>
        )}
        filters={
          <FilterSelect value={priority} onChange={setPriority} options={TASK_PRIORITIES} allLabel="All Priorities" />
        }
      />

      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks found"
          description="Nothing matches this filter. Add a task to keep track of next steps."
          actionLabel="Add Task" onAction={openAddModal}
        />
      ) : (
        <div className="divide-y divide-gray-50">
          {grouped.map(({ group, tasks: groupTasks }) => {
            const style = GROUP_STYLES[group] || GROUP_STYLES["No Due Date"];
            const Icon = style.icon;
            return (
              <div key={group}>
                {/* Group header */}
                <div className={`flex items-center gap-2 px-6 py-2 border-b ${style.badge}`}>
                  <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    checked={groupTasks.length > 0 && groupTasks.every(t => selectedIds.includes(t.id))}
                    onChange={(e) => {
                      const ids = groupTasks.map(t => t.id);
                      setSelectedIds(prev => e.target.checked ? [...new Set([...prev, ...ids])] : prev.filter(id => !ids.includes(id)));
                    }}
                  />
                  <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <Icon size={13} className={style.label} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${style.label}`}>
                    {group}
                  </span>
                  <span className={`text-xs ${style.label} opacity-70`}>
                    · {groupTasks.length} task{groupTasks.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Tasks in group */}
                <ul>
                  {groupTasks.map((task) => {
                    const isOverdue = group === "Overdue" && task.status !== "Completed";
                    return (
                      <li key={task.id}
                        onClick={() => setDetailTask(task)}
                        className={`flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors group ${
                          isOverdue ? "border-l-2 border-red-400" : ""
                        }`}
                      >
                        <input type="checkbox" className="w-4 h-4 rounded accent-blue-600 cursor-pointer mr-2"
                          checked={selectedIds.includes(task.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedIds(prev => e.target.checked ? [...prev, task.id] : prev.filter(id => id !== task.id));
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="checkbox"
                          checked={task.status === "Completed"}
                          onChange={(e) => { e.stopPropagation(); toggleStatus(task); }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium group-hover:text-blue-700 transition-colors ${
                            task.status === "Completed" ? "text-gray-400 line-through" : "text-gray-900"
                          }`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{task.type} · {task.relatedTo || "—"}</p>
                        </div>
                        {/* Due date chip */}
                        <span className={`hidden sm:flex items-center gap-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          group === "Today"    ? "bg-blue-50 text-blue-600" :
                          group === "Overdue"  ? "bg-red-50 text-red-500"  :
                          group === "Tomorrow" ? "bg-amber-50 text-amber-600" :
                          "text-gray-400"
                        }`}>
                          <CalendarDays size={11} />
                          {formatDueDate(task.dueDate) || "No date"}
                        </span>
                        <StatusBadge value={task.priority} />
                        <StatusBadge value={task.status} />
                        {/* Inline edit / delete — no 3-dot */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { openEditModal(task); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          ><Pencil size={13} /></button>
                          <button
                            onClick={() => setDeleteTarget(task)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          ><Trash2 size={13} /></button>
                        </div>
                        <ChevronRight size={14} className="text-gray-200 group-hover:text-blue-300 transition-colors shrink-0" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeTask ? "Edit Task" : "Add Task"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="task-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeTask ? "Save Changes" : "Add Task"}
            </button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Task Title</label>
            <input name="title" defaultValue={activeTask?.title} required
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Related To</label>
            <input name="relatedTo" defaultValue={activeTask?.relatedTo}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Type</label>
              <select name="type" defaultValue={activeTask?.type || "Lead"}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option>Lead</option><option>Customer</option><option>Deal</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Priority</label>
              <select name="priority" defaultValue={activeTask?.priority || TASK_PRIORITIES[0]}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select name="status" defaultValue={activeTask?.status || TASK_STATUSES[0]}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Due Date</label>
              <input type="date" name="dueDate" defaultValue={activeTask?.dueDate}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Task"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {saving ? "Deleting..." : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium text-gray-900">{deleteTarget?.title}</span>?
        </p>
      </Modal>

      {/* Task Detail Panel */}
      {detailTask && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDetailTask(null)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate">{detailTask.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{detailTask.type} · {detailTask.relatedTo || "—"}</p>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <button onClick={() => { openEditModal(detailTask); setDetailTask(null); }}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => { setDeleteTarget(detailTask); setDetailTask(null); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setDetailTask(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <StatusBadge value={detailTask.status} />
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Priority</p>
                  <StatusBadge value={detailTask.priority} />
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Due Date</p>
                  <p className="text-sm font-medium text-gray-800">
                    {detailTask.dueDate ? new Date(detailTask.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No date"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Type</p>
                  <p className="text-sm font-medium text-gray-800">{detailTask.type}</p>
                </div>
              </div>
              {detailTask.relatedTo && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Related To</p>
                  <p className="text-sm font-medium text-gray-800">{detailTask.relatedTo}</p>
                </div>
              )}
              {/* Quick status toggle */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Quick Update Status</p>
                <div className="flex gap-2">
                  {TASK_STATUSES.map((s) => (
                    <button key={s} onClick={() => { toggleStatus({ ...detailTask, status: s === detailTask.status ? detailTask.status : s }); setDetailTask((p) => ({ ...p, status: s })); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        s === detailTask.status ? "bg-blue-600 text-white border-blue-600" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
