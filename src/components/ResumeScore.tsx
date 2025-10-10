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

  const { score, matchedKeywords, missingKeywords, suggestions, detailedAnalysis } = analysis;

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
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-emerald-700 uppercase">Matched</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700" aria-label={`${matchedKeywords.length} matched keywords`}>
            {matchedKeywords.length}
          </p>
          <p className="text-xs text-emerald-600 mt-1">Keywords found</p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-rose-600" aria-hidden="true" />
            <span className="text-xs font-semibold text-rose-700 uppercase">Missing</span>
          </div>
          <p className="text-2xl font-bold text-rose-700" aria-label={`${missingKeywords.length} missing keywords`}>
            {missingKeywords.length}
          </p>
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

      {detailedAnalysis && (
        <div className="pt-2 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">
            Detailed Match Analysis
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Technical Skills</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${Math.min(detailedAnalysis.technicalMatch, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.min(Math.round(detailedAnalysis.technicalMatch), 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Technical skills match percentage"
                    
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-10 text-right">
                  {Math.min(Math.round(detailedAnalysis.technicalMatch), 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Soft Skills</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.min(detailedAnalysis.softSkillsMatch, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.min(Math.round(detailedAnalysis.softSkillsMatch), 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Soft skills match percentage"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-10 text-right">
                  {Math.min(Math.round(detailedAnalysis.softSkillsMatch), 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">ATS Compatibility</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${detailedAnalysis.atsScore >= 70 ? 'bg-emerald-600' : detailedAnalysis.atsScore >= 50 ? 'bg-amber-600' : 'bg-rose-600'}`}
                    style={{ width: `${Math.min(detailedAnalysis.atsScore, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.min(detailedAnalysis.atsScore, 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="ATS compatibility score"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-10 text-right">
                  {Math.min(detailedAnalysis.atsScore, 100)}%
                </span>
              </div>
            </div>
          </div>
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
                key={`missing-${index}-${keyword.text}`}
                className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-medium inline-flex items-center gap-1"
                title={`Importance: ${keyword.importance?.toFixed(1) || '0'} - ${keyword.category}`}
              >
                {keyword.text}
                {keyword.importance && keyword.importance > 2 && (
                  <span className="text-rose-500 text-xs font-bold" aria-label="High importance">!</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {matchedKeywords.length > 0 && (
        <div className="pt-2 border-t border-slate-200">
          <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">
            Top Matched Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.slice(0, 6).map((keyword, index) => (
              <span
                key={`matched-${index}-${keyword.text}`}
                className="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium inline-flex items-center gap-1"
                title={`Count: ${keyword.count} - ${keyword.category}`}
              >
                {keyword.text}
                {keyword.count > 1 && (
                  <span className="text-emerald-600 text-xs font-semibold bg-white/50 px-1 rounded" aria-label={`Appears ${keyword.count} times`}>
                    ×{keyword.count}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
