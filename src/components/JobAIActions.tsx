import { useState } from 'react';
import { FileText, Languages, Loader2, AlertCircle } from 'lucide-react';
import { summarizeText, translateText, isLocalAIAvailable } from '../services/localAIService';
import { canUseLocalAIFeature } from '../services/subscriptionService';

interface JobAIActionsProps {
  jobText: string;
}

export default function JobAIActions({ jobText }: JobAIActionsProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [aiAvailable, setAIAvailable] = useState<boolean | null>(null);

  useState(() => {
    isLocalAIAvailable().then(setAIAvailable);
  });

  const handleSummarize = async (type: 'short' | 'medium' | 'detailed') => {
    if (!jobText) {
      setError('Please extract a job posting first.');
      return;
    }

    setLoading(true);
    setAction(`Summarizing (${type})`);
    setError('');
    setOutput('');

    try {
      const canUse = await canUseLocalAIFeature('summarize');
      if (!canUse.allowed) {
        setError(canUse.reason || 'Usage limit exceeded');
        return;
      }

      const summary = await summarizeText(jobText, type);
      setOutput(summary);
    } catch (err) {
      console.error('Summarize error:', err);
      setError(err instanceof Error ? err.message : 'Failed to summarize job posting');
    } finally {
      setLoading(false);
      setAction('');
    }
  };

  const handleTranslate = async (lang: 'en' | 'es' | 'ja') => {
    if (!jobText) {
      setError('Please extract a job posting first.');
      return;
    }

    setLoading(true);
    setAction(`Translating to ${lang === 'es' ? 'Spanish' : lang === 'ja' ? 'Japanese' : 'English'}`);
    setError('');
    setOutput('');

    try {
      const canUse = await canUseLocalAIFeature('translate');
      if (!canUse.allowed) {
        setError(canUse.reason || 'Usage limit exceeded');
        return;
      }

      const translated = await translateText(jobText, lang);
      setOutput(translated);
    } catch (err) {
      console.error('Translate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to translate job posting');
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
        <FileText className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-semibold text-slate-700 uppercase">Job AI Actions</h3>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2">
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">Summarize</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSummarize('short')}
              disabled={loading || !jobText}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors"
            >
              {loading && action.includes('short') ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Short'
              )}
            </button>
            <button
              onClick={() => handleSummarize('medium')}
              disabled={loading || !jobText}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors"
            >
              {loading && action.includes('medium') ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Medium'
              )}
            </button>
            <button
              onClick={() => handleSummarize('detailed')}
              disabled={loading || !jobText}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors"
            >
              {loading && action.includes('detailed') ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                'Detailed'
              )}
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">Translate</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleTranslate('en')}
              disabled={loading || !jobText}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors"
            >
              {loading && action.includes('English') ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><Languages className="w-3 h-3" /> EN</>
              )}
            </button>
            <button
              onClick={() => handleTranslate('es')}
              disabled={loading || !jobText}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors"
            >
              {loading && action.includes('Spanish') ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><Languages className="w-3 h-3" /> ES</>
              )}
            </button>
            <button
              onClick={() => handleTranslate('ja')}
              disabled={loading || !jobText}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded text-xs font-medium transition-colors"
            >
              {loading && action.includes('Japanese') ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <><Languages className="w-3 h-3" /> JA</>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading && action && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            {action}...
          </p>
        </div>
      )}

      {output && (
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
