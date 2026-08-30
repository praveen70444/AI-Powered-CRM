import { useState, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { summarizeNotes } from "../../services/aiService";

const NoteSummary = ({ entityType, entityId, noteCount }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-generate summary if there are 3+ notes
  useEffect(() => {
    if (noteCount >= 3 && !summary) {
      handleGenerateSummary();
    }
  }, [noteCount]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await summarizeNotes(entityType, entityId);
      setSummary(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  // Don't show if fewer than 3 notes
  if (noteCount < 3) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">AI Notes Summary</h3>
            </div>
            <div className="flex items-center gap-2">
              {summary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={loading}
                  className="text-white/90 hover:text-white text-sm flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-white/90 hover:text-white text-lg leading-none"
              >
                {collapsed ? "+" : "−"}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-purple-700">Analyzing {noteCount} notes...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={handleGenerateSummary}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {summary && !loading && (
              <div className="space-y-4">
                {/* Summary */}
                <div>
                  <p className="text-gray-800 leading-relaxed">{summary.summary}</p>
                </div>

                {/* Insights */}
                {summary.insights && summary.insights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Insights:</h4>
                    <ul className="space-y-1">
                      {summary.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Action */}
                {summary.recommendedAction && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Recommended Next Action:
                    </p>
                    <p className="text-sm text-blue-800">{summary.recommendedAction}</p>
                  </div>
                )}

                {/* Metadata */}
                {summary.tokensUsed && (
                  <div className="text-xs text-gray-500 pt-2 border-t border-purple-200">
                    Analyzed {summary.noteCount} notes • Model: {summary.model} • Tokens: {summary.tokensUsed}
                  </div>
                )}
              </div>
            )}

            {!summary && !loading && !error && (
              <div className="text-center py-4">
                <button
                  onClick={handleGenerateSummary}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  Generate AI Summary
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteSummary;
