function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-5">
        <Icon size={28} />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 max-w-xs leading-relaxed">{description}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-5 h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
