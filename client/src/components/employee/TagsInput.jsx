import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import api from "../../services/api";

function TagsInput({ entityType, entityId, readOnly = false }) {
  const [entityTags, setEntityTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!entityId) return;
    Promise.all([
      api.get(`/employee/tags/${entityType}/${entityId}`),
      api.get("/employee/tags"),
    ]).then(([entityRes, allRes]) => {
      setEntityTags(entityRes.data.data || []);
      setAllTags(allRes.data.data || []);
    }).catch(() => {});
  }, [entityType, entityId]);

  useEffect(() => {
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setDropdownOpen(false); }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  async function addTag(tagId) {
    try {
      await api.post(`/employee/tags/${entityType}/${entityId}/${tagId}`);
      const tag = allTags.find(t => t.id === tagId);
      if (tag) setEntityTags(prev => [...prev, tag]);
    } catch {}
  }

  async function removeTag(tagId) {
    try {
      await api.delete(`/employee/tags/${entityType}/${entityId}/${tagId}`);
      setEntityTags(prev => prev.filter(t => t.id !== tagId));
    } catch {}
  }

  async function createAndAdd() {
    if (!newTagName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/employee/tags", { name: newTagName.trim(), color: newTagColor });
      const newTag = res.data.data;
      setAllTags(prev => [...prev, newTag]);
      await api.post(`/employee/tags/${entityType}/${entityId}/${newTag.id}`);
      setEntityTags(prev => [...prev, newTag]);
      setNewTagName(""); setNewTagColor("#3B82F6"); setDropdownOpen(false);
    } catch {} finally { setLoading(false); }
  }

  const existingTagIds = new Set(entityTags.map(t => t.id));
  const availableTags = allTags.filter(t => !existingTagIds.has(t.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5" ref={ref}>
      {entityTags.map(tag => (
        <span key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: tag.color || "#3B82F6" }}>
          {tag.name}
          {!readOnly && (
            <button onClick={() => removeTag(tag.id)} className="hover:opacity-75 ml-0.5" title="Remove tag">
              <X size={10} />
            </button>
          )}
        </span>
      ))}

      {!readOnly && entityId && (
        <div className="relative">
          <button onClick={() => setDropdownOpen(v => !v)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            <Plus size={10} /> Tag
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-7 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1">
              {availableTags.length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Add tag</p>
                  {availableTags.map(tag => (
                    <button key={tag.id} onClick={() => { addTag(tag.id); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color || "#3B82F6" }} />
                      {tag.name}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                </>
              )}
              <p className="px-3 pt-1 pb-1 text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Create new</p>
              <div className="px-3 py-2 space-y-2">
                <input value={newTagName} onChange={e => setNewTagName(e.target.value)}
                  placeholder="Tag name" onKeyDown={e => e.key === "Enter" && createAndAdd()}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <div className="flex items-center gap-2">
                  <input type="color" value={newTagColor} onChange={e => setNewTagColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
                  <button onClick={createAndAdd} disabled={loading || !newTagName.trim()}
                    className="flex-1 bg-blue-600 text-white text-xs rounded-lg px-2 py-1.5 hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {loading ? "..." : "Create & Add"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TagsInput;
