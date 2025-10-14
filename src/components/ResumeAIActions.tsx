import { useState } from 'react';
import { Sparkles, Languages, FileEdit, Loader2, AlertCircle } from 'lucide-react';
import { proofreadText, rewriteText, isLocalAIAvailable } from '../services/localAIService';
import { canUseLocalAIFeature } from '../services/subscriptionService';
import OutputViewer from './OutputViewer';

interface ResumeAIActionsProps {
  resumeText: string;
  onResumeUpdate?: (text: string) => void;
}

export default function ResumeAIActions({ resumeText, onResumeUpdate }: ResumeAIActionsProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [aiAvailable, setAIAvailable] = useState<boolean | null>(null);

  useState(() => {
    isLocalAIAvailable().then(setAIAvailable);
  });

  const handleProofread = async () => {
    if (!resumeText) {
      setError('Please upload your resume first.');
      return;
    }

    setLoading(true);
    setAction('Proofreading');
    setError('');
    setShowOutput(false);

    try {
      const canUse = await canUseLocalAIFeature('proofread');
      if (!canUse.allowed) {
        setError(canUse.reason || 'Usage limit exceeded');
        return;
      }

      const proofread = await proofreadText(resumeText);
      setOutput(proofread);
      setShowOutput(true);
      if (onResumeUpdate) {
        onResumeUpdate(proofread);
      }
    } catch (err) {
      console.error('Proofread error:', err);
      setError(err instanceof Error ? err.message : 'Failed to proofread resume');
    } finally {
      setLoading(false);
      setAction('');
    }
  };

  const handleRewrite = async (style?: 'professional' | 'concise') => {
    if (!resumeText) {
      setError('Please upload your resume first.');
      return;
    }

    setLoading(true);
    setAction(style ? `Rewriting (${style})` : 'Rewriting');
    setError('');
    setShowOutput(false);

    try {
      const canUse = await canUseLocalAIFeature('rewrite');
      if (!canUse.allowed) {
        setError(canUse.reason || 'Usage limit exceeded');
        return;
      }

      const rewritten = await rewriteText(resumeText, style);
      setOutput(rewritten);
      setShowOutput(true);
      if (onResumeUpdate) {
        onResumeUpdate(rewritten);
      }
    } catch (err) {
      console.error('Rewrite error:', err);
      setError(err instanceof Error ? err.message : 'Failed to rewrite resume');
    } finally {
      setLoading(false);
      setAction('');
    }
  };

  if (aiAvailable === false) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800 mb-1">
              Chrome AI Not Available
            </p>
            <p className="text-xs text-amber-700">
              Local AI features require Chrome 138+ with Gemini Nano enabled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-semibold text-slate-700 uppercase">Local AI Actions</h3>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2">
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleProofread}
          disabled={loading || !resumeText}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium transition-colors"
        >
          {loading && action === 'Proofreading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileEdit className="w-3.5 h-3.5" />
          )}
          Proofread
        </button>

        <button
          onClick={() => handleRewrite('professional')}
          disabled={loading || !resumeText}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium transition-colors"
        >
          {loading && action.includes('professional') ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Languages className="w-3.5 h-3.5" />
          )}
          Polish
        </button>

        <button
          onClick={() => handleRewrite('concise')}
          disabled={loading || !resumeText}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium transition-colors col-span-2"
        >
          {loading && action.includes('concise') ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileEdit className="w-3.5 h-3.5" />
          )}
          Make Concise
        </button>
      </div>

      {loading && action && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            {action}...
          </p>
        </div>
      )}

      {showOutput && output && (
        <OutputViewer
          originalText={resumeText}
          newText={output}
          title="AI Enhanced Resume"
          showActions={true}
        />
      )}
    </div>
  );
}
