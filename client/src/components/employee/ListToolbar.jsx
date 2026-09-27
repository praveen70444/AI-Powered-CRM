import { Search, Plus } from "lucide-react";
function ListToolbar({ searchValue, onSearchChange, searchPlaceholder = "Search...", filters, bulkActions, onAddClick, addLabel }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 px-6 py-4 border-b border-gray-100">
      <div className="relative flex-1 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {bulkActions}
        {filters}
      </div>
      {addLabel && (
        <button
          onClick={onAddClick}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <Plus size={16} />
          {addLabel}
        </button>
      )}
    </div>
  );
}
export default ListToolbar;
