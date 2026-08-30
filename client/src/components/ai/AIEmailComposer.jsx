import { useState } from "react";
import { Sparkles, Copy, Loader2, RefreshCw } from "lucide-react";
import { composeEmail, improveEmail } from "../../services/aiService";

const AIEmailComposer = ({ entityType, entityId, entityName, onClose }) => {
  const [purpose, setPurpose] = useState("follow_up");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const purposes = [
    { value: "follow_up", label: "Follow Up" },
    { value: "introduction", label: "Introduction" },
    { value: "proposal", label: "Proposal" },
    { value: "check_in", label: "Check-In" },
    { value: "meeting_request", label: "Meeting Request" },
    { value: "thank_you", label: "Thank You" },
  ];

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "friendly", label: "Friendly" },
    { value: "formal", label: "Formal" },
    { value: "casual", label: "Casual" },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const response = await composeEmail(entityType, entityId, purpose, tone);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate email");
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    if (!result) return;

    setLoading(true);
    setError(null);

    try {
      const response = await improveEmail(
        result.subject,
        result.body,
        "Make it more concise and compelling"
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to improve email");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;

    const emailText = `Subject: ${result.subject}\n\n${result.body}`;
    navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">AI Email Composer</h2>
                <p className="text-sm text-violet-100 mt-1">
                  Generate personalized email for {entityName}
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
          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={loading}
              >
                {purposes.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={loading}
              >
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Email
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Generated Email</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleImprove}
                      disabled={loading}
                      className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Improve
                    </button>
                    <button
                      onClick={handleCopy}
                      className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    SUBJECT
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-900 font-medium">{result.subject}</p>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    BODY
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {result.body}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                {result.tokensUsed && (
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-3">
                    <span>Model: {result.model}</span>
                    <span>•</span>
                    <span>Tokens: {result.tokensUsed}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIEmailComposer;
