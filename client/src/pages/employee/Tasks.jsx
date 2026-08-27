import { useEffect, useMemo, useState } from "react";
import { ListChecks, CalendarDays } from "lucide-react";
import ListToolbar from "../../components/employee/ListToolbar";
import FilterSelect from "../../components/employee/FilterSelect";
import StatusBadge from "../../components/employee/StatusBadge";
import RowActions from "../../components/employee/RowActions";
import EmptyState from "../../components/employee/EmptyState";
import Modal from "../../components/employee/Modal";
import ExportMenu from "../../components/employee/ExportMenu";
import { TASK_STATUSES, TASK_PRIORITIES } from "../../mock/tasks";
import { getTasks, createTask, updateTask, deleteTask, exportTasks } from "../../services/employeeService";
const TABS = ["All", "Pending", "In Progress", "Completed"];
function Tasks() {
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
    return () => {
      isMounted = false;
    };
  }, []);
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchesTab = tab === "All" ? true : t.status === tab;
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.relatedTo || "").toLowerCase().includes(search.toLowerCase());
      const matchesPriority = priority ? t.priority === priority : true;
      return matchesTab && matchesSearch && matchesPriority;
    });
  }, [tasks, tab, search, priority]);
  function openAddModal() {
    setActiveTask(null);
    setModalOpen(true);
  }
  function openEditModal(task) {
    setActiveTask(task);
    setModalOpen(true);
  }
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
    setError("");
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
  async function toggleStatus(task) {
    const next = task.status === "Completed" ? "Pending" : task.status === "Pending" ? "In Progress" : "Completed";
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
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-1 px-6 pt-4 justify-between">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
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
        onSearchChange={setSearch}
        searchPlaceholder="Search tasks..."
        addLabel="Add Task"
        onAddClick={openAddModal}
        filters={<FilterSelect value={priority} onChange={setPriority} options={TASK_PRIORITIES} allLabel="All Priorities" />}
      />
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-6 text-sm text-gray-500">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks found"
          description="Nothing matches this filter yet. Add a task to keep track of your next steps."
          actionLabel="Add Task"
          onAction={openAddModal}
        />
      ) : (
        <ul className="divide-y divide-gray-50">
          {filtered.map((task) => (
            <li key={task.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
              <input
                type="checkbox"
                checked={task.status === "Completed"}
                onChange={() => toggleStatus(task)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === "Completed" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {task.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{task.type} · {task.relatedTo}</p>
              </div>
              <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                <CalendarDays size={13} /> {task.dueDate}
              </span>
              <StatusBadge value={task.priority} />
              <StatusBadge value={task.status} />
              <RowActions onEdit={() => openEditModal(task)} onDelete={() => setDeleteTarget(task)} />
            </li>
          ))}
        </ul>
      )}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeTask ? "Edit Task" : "Add Task"}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" form="task-form" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeTask ? "Save Changes" : "Add Task"}
            </button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Task Title</label>
            <input name="title" defaultValue={activeTask?.title} required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Related To</label>
            <input name="relatedTo" defaultValue={activeTask?.relatedTo} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Type</label>
              <select name="type" defaultValue={activeTask?.type || "Lead"} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                <option>Lead</option>
                <option>Customer</option>
                <option>Deal</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Priority</label>
              <select name="priority" defaultValue={activeTask?.priority || TASK_PRIORITIES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select name="status" defaultValue={activeTask?.status || TASK_STATUSES[0]} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Due Date</label>
              <input type="date" name="dueDate" defaultValue={activeTask?.dueDate} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
          </div>
        </form>
      </Modal>
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Task"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
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
    </div>
  );
}
export default Tasks;
