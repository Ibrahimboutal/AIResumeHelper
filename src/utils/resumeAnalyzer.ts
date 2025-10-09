import { extractKeywordsSync, extractYearsOfExperience, extractEducationRequirements, type Keyword } from './keywordExtractor';

export interface ResumeAnalysis {
  score: number;
  matchedKeywords: Keyword[];
  missingKeywords: Keyword[];
  suggestions: string[];
  detailedAnalysis?: DetailedAnalysis;
}

export interface DetailedAnalysis {
  technicalMatch: number;
  softSkillsMatch: number;
  experienceMatch: boolean;
  educationMatch: boolean;
  overallFit: 'excellent' | 'good' | 'fair' | 'poor';
  strengthAreas: string[];
  weaknessAreas: string[];
  atsScore: number;
}

export function analyzeResume(resumeText: string, jobText: string, customKeywords: string[] = []): ResumeAnalysis {
  if (!resumeText || !jobText) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: [],
      suggestions: ['Please provide both resume and job posting text.'],
      detailedAnalysis: undefined
    };
  }

  const jobKeywords = extractKeywordsSync(jobText, customKeywords);
  const resumeKeywords = extractKeywordsSync(resumeText, customKeywords);

  const resumeKeywordSet = new Set(
    resumeKeywords.map(k => k.text.toLowerCase())
  );

  const matchedKeywords: Keyword[] = [];
  const missingKeywords: Keyword[] = [];

  jobKeywords.forEach(jobKeyword => {
    if (resumeKeywordSet.has(jobKeyword.text.toLowerCase())) {
      const resumeMatch = resumeKeywords.find(k => k.text.toLowerCase() === jobKeyword.text.toLowerCase());
      matchedKeywords.push({
        ...jobKeyword,
        count: resumeMatch?.count || 0
      });
    } else {
      missingKeywords.push(jobKeyword);
    }
  });


  const weightedScore = calculateWeightedScore(matchedKeywords, missingKeywords, jobKeywords);
  const score = Math.round(weightedScore);

  const detailedAnalysis = performDetailedAnalysis(
    resumeText,
    jobText,
    matchedKeywords,
    missingKeywords,
    jobKeywords
  );

  const suggestions = generateSuggestions(missingKeywords, score, detailedAnalysis);

  return {
    score,
    matchedKeywords,
    missingKeywords,
    suggestions,
    detailedAnalysis
  };
}

function calculateWeightedScore(matched: Keyword[], missing: Keyword[], allJobKeywords: Keyword[]): number {
  let totalImportance = 0;
  let matchedImportance = 0;

  allJobKeywords.forEach(keyword => {
    const importance = keyword.importance || 1;
    totalImportance += importance;

    const isMatched = matched.some(m => m.text.toLowerCase() === keyword.text.toLowerCase());
    if (isMatched) {
      matchedImportance += importance;
    }
  });

  return totalImportance > 0 ? (matchedImportance / totalImportance) * 100 : 0;
}

function performDetailedAnalysis(
  resumeText: string,
  jobText: string,
  matched: Keyword[],
  _missing: Keyword[],
  allJobKeywords: Keyword[]
): DetailedAnalysis {
  const technicalMatched = matched.filter(k => k.category === 'technical');
  const technicalTotal = allJobKeywords.filter(k => k.category === 'technical');
  const technicalMatch = technicalTotal.length > 0
    ? (technicalMatched.length / technicalTotal.length) * 100
    : 100;

  const softMatched = matched.filter(k => k.category === 'soft');
  const softTotal = allJobKeywords.filter(k => k.category === 'soft');
  const softSkillsMatch = softTotal.length > 0
    ? (softMatched.length / softTotal.length) * 100
    : 100;

  const jobExperience = extractYearsOfExperience(jobText);
  const resumeExperience = extractYearsOfExperience(resumeText);
  const experienceMatch = !jobExperience || (resumeExperience !== null && resumeExperience >= jobExperience);

  const jobEducation = extractEducationRequirements(jobText);
  const educationMatch = jobEducation.length === 0 ||
    jobEducation.some(req => new RegExp(req.split(/\s+/).slice(0, 2).join('.*'), 'i').test(resumeText));

  const overallScore = (technicalMatch + softSkillsMatch) / 2;
  let overallFit: 'excellent' | 'good' | 'fair' | 'poor';
  if (overallScore >= 80) overallFit = 'excellent';
  else if (overallScore >= 60) overallFit = 'good';
  else if (overallScore >= 40) overallFit = 'fair';
  else overallFit = 'poor';

  const strengthAreas: string[] = [];
  const weaknessAreas: string[] = [];

  if (technicalMatch >= 70) strengthAreas.push('Technical Skills');
  else if (technicalMatch < 50) weaknessAreas.push('Technical Skills');

  if (softSkillsMatch >= 70) strengthAreas.push('Soft Skills');
  else if (softSkillsMatch < 50) weaknessAreas.push('Soft Skills');

  if (experienceMatch) strengthAreas.push('Experience Level');
  else weaknessAreas.push('Experience Level');

  if (educationMatch) strengthAreas.push('Education');
  else weaknessAreas.push('Education');

  const atsScore = calculateATSScore(resumeText, matched, allJobKeywords);

  return {
    technicalMatch,
    softSkillsMatch,
    experienceMatch,
    educationMatch,
    overallFit,
    strengthAreas,
    weaknessAreas,
    atsScore
  };
}

function calculateATSScore(resumeText: string, matched: Keyword[], allJobKeywords: Keyword[]): number {
  let score = 0;

  const keywordDensity = matched.length / (resumeText.split(/\s+/).length / 100);
  if (keywordDensity >= 2 && keywordDensity <= 5) score += 25;
  else if (keywordDensity > 0) score += 15;

  const hasContactInfo = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeText) &&
                        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(resumeText);
  if (hasContactInfo) score += 15;

  const hasStructuredSections = /(experience|education|skills|projects)/gi.test(resumeText);
  if (hasStructuredSections) score += 20;

  const matchRate = matched.length / allJobKeywords.length;
  score += matchRate * 40;

  return Math.min(Math.round(score), 100);
}

function generateSuggestions(missingKeywords: Keyword[], score: number, analysis?: DetailedAnalysis): string[] {
  const suggestions: string[] = [];

  if (score < 50) {
    suggestions.push('Your resume needs significant improvements. Focus on aligning with key job requirements.');
  } else if (score < 70) {
    suggestions.push('Good foundation! Address the missing keywords to strengthen your application.');
  } else if (score < 85) {
    suggestions.push('Strong match! A few tweaks will make your resume even more competitive.');
  } else {
    suggestions.push('Excellent alignment! Your resume matches this job very well.');
  }

  const highPriorityMissing = missingKeywords
    .filter(k => (k.importance || 0) > 2)
    .slice(0, 3)
    .map(k => k.text);

  if (highPriorityMissing.length > 0) {
    suggestions.push(`Critical skills to add: ${highPriorityMissing.join(', ')}. These are highly important for this role.`);
  }

  const technicalMissing = missingKeywords.filter(k => k.category === 'technical').slice(0, 3);
  if (technicalMissing.length > 0) {
    suggestions.push(
      `Technical skills to highlight: ${technicalMissing.map(k => k.text).join(', ')}. Include specific projects or achievements with these technologies.`
    );
  }

  const softMissing = missingKeywords.filter(k => k.category === 'soft').slice(0, 2);
  if (softMissing.length > 0) {
    suggestions.push(
      `Soft skills to emphasize: ${softMissing.map(k => k.text).join(' and ')}. Use concrete examples to demonstrate these qualities.`
    );
  }

  const certMissing = missingKeywords.filter(k => k.category === 'certification').slice(0, 2);
  if (certMissing.length > 0) {
    suggestions.push(
      `Consider obtaining certifications: ${certMissing.map(k => k.text).join(', ')}.`
    );
  }

  if (analysis) {
    if (analysis.atsScore < 70) {
      suggestions.push('Improve ATS compatibility: Use standard section headers (Experience, Education, Skills) and include more relevant keywords naturally.');
    }

    if (analysis.weaknessAreas.length > 0) {
      suggestions.push(`Focus on improving: ${analysis.weaknessAreas.join(', ')}. These areas need more attention.`);
    }
  }

  suggestions.push('Quantify achievements with metrics (e.g., "increased efficiency by 40%", "led team of 5").');
  suggestions.push('Use action verbs at the start of bullet points (e.g., Developed, Implemented, Managed, Led).');

  return suggestions;
}

export function getMatchPercentage(matchedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((matchedCount / totalCount) * 100);
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-600';
  if (score >= 30) return 'text-orange-600';
  return 'text-rose-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-emerald-100';
  if (score >= 50) return 'bg-amber-100';
  return 'bg-rose-100';
}

export function analyzeResumeFormat(resumeText: string): {
  hasContactInfo: boolean;
  hasSections: boolean;
  hasActionVerbs: boolean;
  hasQuantifiableResults: boolean;
  wordCount: number;
} {
  const hasContactInfo = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeText) ||
                        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(resumeText);

  const hasSections = /(experience|education|skills|summary|projects)/gi.test(resumeText);

  const actionVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed', 'improved', 'increased', 'reduced'];
  const hasActionVerbs = actionVerbs.some(verb => new RegExp(`\\b${verb}\\b`, 'i').test(resumeText));

  const hasQuantifiableResults = /\d+%|\$\d+|\d+\+/.test(resumeText);

  const wordCount = resumeText.trim().split(/\s+/).length;

  return {
    hasContactInfo,
    hasSections,
    hasActionVerbs,
    hasQuantifiableResults,
    wordCount
  };
}

export function generateKeywordRecommendations(matched: Keyword[], missing: Keyword[]): {
  keep: string[];
  add: string[];
  emphasize: string[];
} {
  const keep = matched
    .filter(k => (k.importance || 0) > 1.5)
    .slice(0, 10)
    .map(k => k.text);

  const add = missing
    .filter(k => (k.importance || 0) > 2)
    .slice(0, 8)
    .map(k => k.text);

  const emphasize = matched
    .filter(k => k.count === 1 && (k.importance || 0) > 2)
    .slice(0, 5)
    .map(k => k.text);

  return { keep, add, emphasize };
}