import { Gauge, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { type ResumeAnalysis } from '../utils/resumeAnalyzer';
import { getScoreColor, getScoreBgColor } from '../utils/resumeAnalyzer';

interface ResumeScoreProps {
  analysis: ResumeAnalysis | null;
}

export default function ResumeScore({ analysis }: ResumeScoreProps) {
  if (!analysis) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Resume Match Score
        </h2>
        <p className="text-sm text-slate-500 text-center py-4">
          Upload your resume and extract a job posting to see your match score.
        </p>
      </div>
    );
  }

  const { score, matchedKeywords, missingKeywords, suggestions } = analysis;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Resume Match Score
        </h2>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getScoreBgColor(score)}`}>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 uppercase">Matched</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{matchedKeywords.length}</p>
          <p className="text-xs text-emerald-600 mt-1">Keywords found</p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-semibold text-rose-700 uppercase">Missing</span>
          </div>
          <p className="text-2xl font-bold text-rose-700">{missingKeywords.length}</p>
          <p className="text-xs text-rose-600 mt-1">Keywords to add</p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 uppercase">Suggestions</span>
          </div>
          <ul className="space-y-1.5">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-xs text-amber-700 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span className="flex-1">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingKeywords.length > 0 && (
        <div className="pt-2 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">
            Top Missing Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.slice(0, 8).map((keyword, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-medium"
              >
                {keyword.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
