import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Modal from "../../components/employee/Modal";
import api from "../../services/api";

const EVENT_COLORS = {
  Meeting: "bg-blue-500", Call: "bg-green-500", Demo: "bg-amber-500",
  Task: "bg-purple-500", Reminder: "bg-red-400", Other: "bg-gray-400",
};
const EVENT_TYPES = ["Meeting", "Call", "Demo", "Task", "Reminder", "Other"];

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    setLoading(true);
    api.get(`/employee/calendar?start=${start}&end=${end}`)
      .then(res => setEvents(res.data.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const today = new Date();
  const isToday = (d) => d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  function getEventsForDay(d) {
    return events.filter(e => {
      const dt = new Date(e.start_time || e.startTime);
      return dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === d;
    });
  }

  function buildLocalISO(y, m, d, h = 10, min = 0) {
    return new Date(y, m, d, h, min).toISOString().slice(0, 16);
  }

  function openAdd(day) {
    setError("");
    setActiveEvent({
      title: "", event_type: "Meeting", description: "", location: "",
      start_time: buildLocalISO(year, month, day, 10),
      end_time: buildLocalISO(year, month, day, 11),
    });
    setDayDetailOpen(false);
    setModalOpen(true);
  }

  function openDayDetail(day) {
    setActiveDay(day);
    setDayDetailOpen(true);
  }

  function openEdit(ev) {
    setError("");
    const st = ev.start_time || ev.startTime;
    const et = ev.end_time || ev.endTime;
    setActiveEvent({
      ...ev,
      start_time: st ? new Date(st).toISOString().slice(0, 16) : "",
      end_time: et ? new Date(et).toISOString().slice(0, 16) : "",
    });
    setDayDetailOpen(false);
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!activeEvent.title?.trim()) { setError("Title is required"); return; }
    if (!activeEvent.start_time || !activeEvent.end_time) { setError("Start and end time are required"); return; }
    setSaving(true); setError("");
    try {
      if (activeEvent.id) {
        const res = await api.put(`/employee/calendar/${activeEvent.id}`, activeEvent);
        setEvents(prev => prev.map(ev => ev.id === activeEvent.id ? res.data.data : ev));
      } else {
        const res = await api.post("/employee/calendar", activeEvent);
        setEvents(prev => [...prev, res.data.data]);
      }
      setModalOpen(false);
    } catch (err) { setError(err.response?.data?.message || "Failed to save event"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!activeEvent?.id || !window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/employee/calendar/${activeEvent.id}`);
      setEvents(prev => prev.filter(ev => ev.id !== activeEvent.id));
      setModalOpen(false);
    } catch { setError("Failed to delete event"); }
  }

  // Build grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            Today
          </button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-gray-400">Loading calendar...</div>
      ) : (
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            return (
              <div key={i}
                className={`min-h-[96px] p-1.5 border-b border-r border-gray-100 last:border-r-0 ${day ? "cursor-pointer hover:bg-gray-50/70" : "bg-gray-50/30"} ${isToday(day) ? "bg-blue-50/40" : ""}`}
                onClick={() => day && openDayDetail(day)}>
                {day && (
                  <>
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <button key={ev.id}
                          onClick={e => { e.stopPropagation(); openEdit(ev); }}
                          className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate ${EVENT_COLORS[ev.event_type || ev.eventType] || "bg-gray-400"}`}>
                          {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[9px] text-gray-400 px-1">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-6 py-3 border-t border-gray-100">
        {EVENT_TYPES.map(t => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${EVENT_COLORS[t]}`} />{t}
          </span>
        ))}
      </div>

      {/* Event Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={activeEvent?.id ? "Edit Event" : "Add Event"}
        footer={
          <>
            {activeEvent?.id && (
              <button onClick={handleDelete} className="mr-auto px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50">
                Delete
              </button>
            )}
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancel</button>
            <button type="submit" form="event-form" disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : activeEvent?.id ? "Save Changes" : "Add Event"}
            </button>
          </>
        }>
        {error && <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {activeEvent && (
          <form id="event-form" onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Title *</label>
              <input value={activeEvent.title || ""}
                onChange={e => setActiveEvent(p => ({ ...p, title: e.target.value }))}
                required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Type</label>
                <select value={activeEvent.event_type || "Meeting"}
                  onChange={e => setActiveEvent(p => ({ ...p, event_type: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Location</label>
                <input value={activeEvent.location || ""} placeholder="Optional"
                  onChange={e => setActiveEvent(p => ({ ...p, location: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Start Time *</label>
                <input type="datetime-local" value={activeEvent.start_time || ""}
                  onChange={e => setActiveEvent(p => ({ ...p, start_time: e.target.value }))}
                  required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">End Time *</label>
                <input type="datetime-local" value={activeEvent.end_time || ""}
                  onChange={e => setActiveEvent(p => ({ ...p, end_time: e.target.value }))}
                  required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Reminder (minutes before)</label>
              <input type="number" min="0" value={activeEvent.reminder_minutes ?? 30}
                onChange={e => setActiveEvent(p => ({ ...p, reminder_minutes: parseInt(e.target.value) }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Description</label>
              <textarea rows={2} value={activeEvent.description || ""}
                onChange={e => setActiveEvent(p => ({ ...p, description: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none" />
            </div>
          </form>
        )}
      </Modal>

      {/* Day Detail Modal */}
      <Modal open={dayDetailOpen} onClose={() => setDayDetailOpen(false)}
        title={activeDay ? `${new Date(year, month, activeDay).toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : ""}
        footer={
          <button onClick={() => openAdd(activeDay)} className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Plus size={16} /> Add Event
          </button>
        }>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
          {activeDay && getEventsForDay(activeDay).length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No events or tasks scheduled for this day.</p>
          ) : activeDay && getEventsForDay(activeDay).map(ev => (
            <div key={ev.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-blue-200 transition-colors cursor-pointer" onClick={() => openEdit(ev)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${EVENT_COLORS[ev.event_type || ev.eventType] || "bg-gray-400"}`} />
                    <p className="font-semibold text-gray-900 truncate">{ev.title}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${EVENT_COLORS[ev.event_type || ev.eventType] || "bg-gray-400"} text-white bg-opacity-90`}>{ev.event_type || ev.eventType}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    {new Date(ev.start_time || ev.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {!ev.is_all_day && !ev.isAllDay && " - "}
                    {!ev.is_all_day && !ev.isAllDay && new Date(ev.end_time || ev.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {ev.description && (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{ev.description}</p>
                  )}
                  {ev.location && (
                    <p className="text-xs text-gray-400 mt-2">📍 {ev.location}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default Calendar;
