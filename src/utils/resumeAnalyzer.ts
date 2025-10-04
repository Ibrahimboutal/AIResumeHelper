import { extractKeywords, type Keyword } from './keywordExtractor';

export interface ResumeAnalysis {
  score: number;
  matchedKeywords: Keyword[];
  missingKeywords: Keyword[];
  suggestions: string[];
}

export function analyzeResume(resumeText: string, jobText: string): ResumeAnalysis {
  const jobKeywords = extractKeywords(jobText);
  const resumeKeywords = extractKeywords(resumeText);

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
    suggestions.push('Your resume has significant gaps compared to the job requirements. Consider tailoring it more closely.');
  } else if (score < 75) {
    suggestions.push('Good match, but there is room for improvement.');
  } else {
    suggestions.push('Excellent match! Your resume aligns well with the job requirements.');
  }

  const technicalMissing = missingKeywords.filter(k => k.category === 'technical').slice(0, 3);
  if (technicalMissing.length > 0) {
    suggestions.push(
      `Add technical skills: ${technicalMissing.map(k => k.text).join(', ')}`
    );
  }

  const softMissing = missingKeywords.filter(k => k.category === 'soft').slice(0, 3);
  if (softMissing.length > 0) {
    suggestions.push(
      `Highlight soft skills: ${softMissing.map(k => k.text).join(', ')}`
    );
  }

  const certMissing = missingKeywords.filter(k => k.category === 'certification').slice(0, 2);
  if (certMissing.length > 0) {
    suggestions.push(
      `Consider mentioning: ${certMissing.map(k => k.text).join(', ')}`
    );
  }

  if (missingKeywords.length > 0) {
    suggestions.push('Use action verbs and quantify achievements where possible.');
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
