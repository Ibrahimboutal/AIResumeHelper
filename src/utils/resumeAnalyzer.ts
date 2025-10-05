import { extractKeywords, type Keyword } from './keywordExtractor';

export interface ResumeAnalysis {
  score: number;
  matchedKeywords: Keyword[];
  missingKeywords: Keyword[];
  suggestions: string[];
}

export function analyzeResume(resumeText: string, jobText: string, customKeywords: string[] = []): ResumeAnalysis {
  const jobKeywords = extractKeywords(jobText, customKeywords);
  const resumeKeywords = extractKeywords(resumeText, customKeywords);

  const resumeKeywordSet = new Set(
    resumeKeywords.map(k => k.text.toLowerCase())
  );

  const matchedKeywords: Keyword[] = [];
  const missingKeywords: Keyword[] = [];

  jobKeywords.forEach(jobKeyword => {
    if (resumeKeywordSet.has(jobKeyword.text.toLowerCase())) {
      matchedKeywords.push(jobKeyword);
    } else {
      missingKeywords.push(jobKeyword);
    }
  });

  const totalKeywords = jobKeywords.length;
  const matchedCount = matchedKeywords.length;
  const score = totalKeywords > 0
    ? Math.round((matchedCount / totalKeywords) * 100)
    : 0;

  const suggestions = generateSuggestions(missingKeywords, score);

  return {
    score,
    matchedKeywords,
    missingKeywords,
    suggestions
  };
}

function generateSuggestions(missingKeywords: Keyword[], score: number): string[] {
  const suggestions: string[] = [];

  if (score < 50) {
    suggestions.push('Your resume could be better aligned. Focus on adding the top missing keywords.');
  } else if (score < 75) {
    suggestions.push('Good match! Add a few more key skills to make your resume even stronger.');
  } else {
    suggestions.push('Excellent match! Your resume is well-aligned with this job.');
  }

  const topMissing = missingKeywords.slice(0, 5).map(k => k.text);
    if (topMissing.length > 0) {
        suggestions.push(`Integrate these top keywords: ${topMissing.join(', ')}.`);
    }

  const technicalMissing = missingKeywords.filter(k => k.category === 'technical').slice(0, 3);
  if (technicalMissing.length > 0) {
    suggestions.push(
      `Showcase your experience with: ${technicalMissing.map(k => k.text).join(', ')}.`
    );
  }

  const softMissing = missingKeywords.filter(k => k.category === 'soft').slice(0, 2);
  if (softMissing.length > 0) {
    suggestions.push(
      `Highlight soft skills like: ${softMissing.map(k => k.text).join(' and ')}.`
    );
  }

  if (missingKeywords.length > 0) {
    suggestions.push('Quantify your achievements with numbers and metrics to show impact.');
  }

  return suggestions;
}

export function getMatchPercentage(matchedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((matchedCount / totalCount) * 100);
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-emerald-100';
  if (score >= 50) return 'bg-amber-100';
  return 'bg-rose-100';
}