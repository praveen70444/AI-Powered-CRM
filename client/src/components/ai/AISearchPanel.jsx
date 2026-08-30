import { useState } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { naturalLanguageSearch } from "../../services/aiService";
import { useNavigate } from "react-router-dom";

const AISearchPanel = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const examples = [
    "Show me all leads from tech companies worth over $10,000",
    "Find deals closing this month in negotiation stage",
    "Active customers who have spent more than $50,000",
    "High priority tasks due this week",
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await naturalLanguageSearch(query);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to perform search");
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
  };

  const handleResultClick = (item) => {
    const { entity } = result;
    const routes = {
      leads: `/employee/leads`,
      customers: `/employee/customers`,
      deals: `/employee/deals`,
      tasks: `/employee/tasks`,
    };
    
    if (routes[entity]) {
      navigate(routes[entity]);
      onClose?.();
    }
  };

  const getEntityLabel = (entity) => {
    const labels = {
      leads: "Lead",
      customers: "Customer",
      deals: "Deal",
      tasks: "Task",
    };
    return labels[entity] || entity;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">AI-Powered Search</h2>
                <p className="text-sm text-blue-100 mt-1">
                  Search your CRM using natural language
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything about your CRM data..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </form>

          {/* Examples */}
          {!result && !loading && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Try these examples:</p>
              <div className="space-y-2">
                {examples.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm text-gray-700 hover:text-blue-700 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Interpretation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Showing:</span> {result.interpretation}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Found {result.count} {getEntityLabel(result.entity)}
                  {result.count !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Results List */}
              {result.results.length > 0 ? (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {result.results.slice(0, 20).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultClick(item)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.name || item.title || `${getEntityLabel(result.entity)} #${item.id}`}
                          </p>
                          {item.company && (
                            <p className="text-sm text-gray-600 mt-1">{item.company}</p>
                          )}
                          {item.status && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {item.status}
                            </span>
                          )}
                          {item.stage && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              {item.stage}
                            </span>
                          )}
                        </div>
                        {(item.value || item.total_spent) && (
                          <div className="text-right ml-4">
                            <p className="font-semibold text-gray-900">
                              ${(item.value || item.total_spent || 0).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No results found matching your criteria</p>
                </div>
              )}

              {result.results.length > 20 && (
                <p className="text-sm text-gray-500 text-center">
                  Showing first 20 of {result.count} results
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISearchPanel;
