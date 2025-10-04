import { Tag, TrendingUp, Award, Wrench, Brain } from 'lucide-react';
import { type Keyword } from '../utils/keywordExtractor';

interface KeywordSidebarProps {
  keywords: Keyword[];
  title?: string;
}

export default function KeywordSidebar({ keywords, title = 'Key Skills' }: KeywordSidebarProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return <TrendingUp className="w-3 h-3" />;
      case 'soft':
        return <Brain className="w-3 h-3" />;
      case 'tool':
        return <Wrench className="w-3 h-3" />;
      case 'certification':
        return <Award className="w-3 h-3" />;
      default:
        return <Tag className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'soft':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'tool':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'certification':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical':
        return 'Technical';
      case 'soft':
        return 'Soft Skill';
      case 'tool':
        return 'Tool';
      case 'certification':
        return 'Certification';
      default:
        return 'Other';
    }
  };

  const groupedKeywords = keywords.reduce((acc, keyword) => {
    if (!acc[keyword.category]) {
      acc[keyword.category] = [];
    }
    acc[keyword.category].push(keyword);
    return acc;
  }, {} as Record<string, Keyword[]>);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        {title}
      </h2>

      {keywords.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          No keywords detected yet. Extract a job posting to see key skills.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedKeywords).map(([category, categoryKeywords]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2 flex items-center gap-1">
                {getCategoryIcon(category)}
                {getCategoryLabel(category)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {categoryKeywords.map((keyword, index) => (
                  <div
                    key={index}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(keyword.category)}`}
                  >
                    <span>{keyword.text}</span>
                    {keyword.count > 1 && (
                      <span className="text-xs opacity-75">×{keyword.count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
