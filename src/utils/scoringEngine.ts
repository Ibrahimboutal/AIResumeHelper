import { Keyword } from './keywordExtractor';
import { extractActionVerbs } from './textFormatter';

export interface ScoringResult {
  overallScore: number;
  breakdown: ScoreBreakdown;
  recommendations: string[];
  rank: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface ScoreBreakdown {
  keywordMatch: number;
  technicalSkills: number;
  experience: number;
  formatting: number;
  atsCompatibility: number;
}

export function calculateComprehensiveScore(
  resumeText: string,
  jobText: string,
  matchedKeywords: Keyword[],
  missingKeywords: Keyword[],
  allJobKeywords: Keyword[]
): ScoringResult {
  if (!resumeText?.trim() || !jobText?.trim()) {
    return {
      overallScore: 0,
      breakdown: { keywordMatch: 0, technicalSkills: 0, experience: 0, formatting: 0, atsCompatibility: 0 },
      recommendations: ['Please provide both resume and job posting text.'],
      rank: 'Poor'
    };
  }
  const breakdown: ScoreBreakdown = {
    keywordMatch: calculateKeywordMatchScore(matchedKeywords, allJobKeywords),
    technicalSkills: calculateTechnicalSkillsScore(matchedKeywords, allJobKeywords),
    experience: calculateExperienceScore(resumeText, jobText),
    formatting: calculateFormattingScore(resumeText),
    atsCompatibility: calculateATSCompatibility(resumeText, matchedKeywords)
  };

  const weights = {
    keywordMatch: 0.35,
    technicalSkills: 0.25,
    experience: 0.20,
    formatting: 0.08,
    atsCompatibility: 0.12
  };

  const overallScore = Math.round(
    breakdown.keywordMatch * weights.keywordMatch +
    breakdown.technicalSkills * weights.technicalSkills +
    breakdown.experience * weights.experience +
    breakdown.formatting * weights.formatting +
    breakdown.atsCompatibility * weights.atsCompatibility
  );

  const rank = determineRank(overallScore);
  const recommendations = generateRecommendations(breakdown, missingKeywords, resumeText, jobText, matchedKeywords, allJobKeywords);

  return {
    overallScore,
    breakdown,
    recommendations,
    rank
  };
}

function calculateKeywordMatchScore(matched: Keyword[], allJobKeywords: Keyword[]): number {
  if (!allJobKeywords || allJobKeywords.length === 0) return 100;
  if (!matched || matched.length === 0) return 0;

  let totalImportance = 0;
  let matchedImportance = 0;

  allJobKeywords.forEach(keyword => {
    const importance = Math.max(keyword.importance || 1, 0.1);
    totalImportance += importance;

    const isMatched = matched.some(m => m.text?.toLowerCase() === keyword.text?.toLowerCase());
    if (isMatched) {
      matchedImportance += importance;
    }
  });

  return totalImportance > 0 ? Math.min(Math.round((matchedImportance / totalImportance) * 100), 100) : 0;
}

function calculateTechnicalSkillsScore(matched: Keyword[], allJobKeywords: Keyword[]): number {
  if (!matched || !allJobKeywords) return 0;

  const technicalMatched = matched.filter(k => k?.category === 'technical');
  const technicalTotal = allJobKeywords.filter(k => k?.category === 'technical');

  if (technicalTotal.length === 0) return 100;
  if (technicalMatched.length === 0) return 0;

  const matchRate = (technicalMatched.length / technicalTotal.length) * 100;

  const highImportanceTech = technicalTotal.filter(k => (k?.importance || 0) > 2);
  const highImportanceMatched = technicalMatched.filter(k =>
    highImportanceTech.some(h => h?.text?.toLowerCase() === k?.text?.toLowerCase())
  );

  const criticalMatchBonus = highImportanceTech.length > 0
    ? (highImportanceMatched.length / highImportanceTech.length) * 20
    : 0;

  return Math.min(100, Math.round(matchRate * 0.8 + criticalMatchBonus));
}

function calculateExperienceScore(resumeText: string, jobText: string): number {
  if (!resumeText?.trim() || !jobText?.trim()) return 0;

  let score = 40;

  const jobYearsMatch = jobText.match(/(\d+)\+?\s*years?/gi);
  const resumeYearsMatch = resumeText.match(/(\d+)\+?\s*years?/gi);

  if (jobYearsMatch && resumeYearsMatch) {
    const jobYears = Math.max(...jobYearsMatch.map(m => parseInt(m.match(/\d+/)?.[0] || '0')));
    const resumeYears = Math.max(...resumeYearsMatch.map(m => parseInt(m.match(/\d+/)?.[0] || '0')));

    if (resumeYears >= jobYears) {
      score += 35;
    } else if (resumeYears >= jobYears * 0.8) {
      score += 25;
    } else if (resumeYears >= jobYears * 0.6) {
      score += 15;
    } else {
      score += 8;
    }
  } else if (resumeYearsMatch && !jobYearsMatch) {
    score += 15;
  }

  const actionVerbs = extractActionVerbs(resumeText);
  if (actionVerbs.length >= 20) score += 25;
  else if (actionVerbs.length >= 15) score += 20;
  else if (actionVerbs.length >= 10) score += 15;
  else if (actionVerbs.length >= 5) score += 10;
  else if (actionVerbs.length >= 3) score += 5;

  const metricsPatterns = [
    /\d+%/g,
    /\$\d{1,3}(?:,\d{3})*/g,
    /\d+x\s+(?:increase|improvement|growth)/gi,
    /(?:increased|reduced|improved|enhanced|optimized|accelerated)\s+(?:by\s+)?\d+/gi
  ];

  let metricsCount = 0;
  metricsPatterns.forEach(pattern => {
    const matches = resumeText.match(pattern);
    if (matches) metricsCount += matches.length;
  });

  if (metricsCount >= 8) score += 15;
  else if (metricsCount >= 5) score += 12;
  else if (metricsCount >= 3) score += 8;
  else if (metricsCount >= 1) score += 5;

  return Math.min(100, score);
}

function calculateFormattingScore(resumeText: string): number {
  if (!resumeText?.trim()) return 0;

  let score = 0;

  const standardSections = /(experience|education|skills|summary|projects|certifications)/gi;
  const sectionMatches = resumeText.match(standardSections);
  const sectionCount = sectionMatches ? new Set(sectionMatches.map(s => s.toLowerCase())).size : 0;

  if (sectionCount >= 4) score += 30;
  else if (sectionCount >= 3) score += 25;
  else if (sectionCount >= 2) score += 15;

  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText);
  const hasPhone = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(resumeText);
  if (hasEmail && hasPhone) score += 20;
  else if (hasEmail || hasPhone) score += 10;

  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount >= 400 && wordCount <= 700) score += 20;
  else if (wordCount >= 300 && wordCount <= 900) score += 15;
  else if (wordCount >= 200 && wordCount <= 1100) score += 10;
  else if (wordCount >= 100) score += 5;

  const lines = resumeText.split('\n');
  const hasConsistentSpacing = lines.filter(line => line.trim().length > 0).length > 10;
  if (hasConsistentSpacing) score += 10;

  const bulletPoints = resumeText.match(/[•\-\*]/g);
  const bulletCount = bulletPoints ? bulletPoints.length : 0;
  if (bulletCount >= 10) score += 15;
  else if (bulletCount >= 5) score += 10;
  else if (bulletCount >= 3) score += 5;

  const hasProperCapitalization = /[A-Z][a-z]+/.test(resumeText) &&
                                 !/[a-z][A-Z]/.test(resumeText);
  if (hasProperCapitalization) score += 5;

  return Math.min(100, score);
}

function calculateATSCompatibility(resumeText: string, matchedKeywords: Keyword[]): number {
  if (!resumeText?.trim()) return 0;
  if (!matchedKeywords) matchedKeywords = [];

  let score = 0;

  const standardSectionHeaders = /\b(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE)\b/i;
  const hasStandardSections = standardSectionHeaders.test(resumeText);
  if (hasStandardSections) score += 25;

  const wordCount = resumeText.split(/\s+/).length;
  const keywordDensity = (matchedKeywords.length / wordCount) * 100;
  if (keywordDensity >= 2 && keywordDensity <= 4) score += 25;
  else if (keywordDensity >= 1.5 && keywordDensity <= 5) score += 20;
  else if (keywordDensity >= 1 && keywordDensity <= 6) score += 15;
  else if (keywordDensity > 0) score += 10;

  const hasSimpleFormatting = !/[^\x00-\x7F]/.test(resumeText.slice(0, 500));
  if (hasSimpleFormatting) score += 10;

  const hasMinimalTables = (resumeText.match(/\|/g) || []).length < 5;
  if (hasMinimalTables) score += 10;

  const topSection = resumeText.slice(0, 300);
  const hasContactAtTop = topSection.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (hasContactAtTop) score += 10;

  const hasDateFormats = /\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i.test(resumeText);
  if (hasDateFormats) score += 10;

  const hasLinkedInOrPortfolio = /linkedin\.com|github\.com|portfolio/i.test(resumeText);
  if (hasLinkedInOrPortfolio) score += 5;

  const avoidedProblematicFormatting = !/\t{2,}|\s{4,}/.test(resumeText);
  if (avoidedProblematicFormatting) score += 5;

  return Math.min(100, score);
}

function determineRank(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
}

function generateRecommendations(breakdown: ScoreBreakdown, missingKeywords: Keyword[], resumeText?: string, jobText?: string, matched?: Keyword[], allJobKeywords?: Keyword[]): string[] {
  const recommendations: string[] = [];

  // Prevent circular dependency by checking if we have all required data
  const hasAllData = resumeText && jobText && matched && allJobKeywords;

  if (breakdown.keywordMatch < 70) {
    const topMissing = missingKeywords
      .filter(k => (k.importance || 0) > 1.5)
      .slice(0, 5)
      .map(k => k.text);
    if (topMissing.length > 0) {
      recommendations.push(`Add these important keywords: ${topMissing.join(', ')}`);
    }
  }

  if (breakdown.technicalSkills < 70) {
    recommendations.push('Strengthen technical skills section with more relevant technologies and tools');
  }

  if (breakdown.experience < 70) {
    recommendations.push('Add more quantifiable achievements and use strong action verbs');
    recommendations.push('Include specific metrics and results from your experience');
  }

  if (breakdown.formatting < 70) {
    recommendations.push('Improve resume structure with clear sections: Summary, Experience, Education, Skills');
    recommendations.push('Use bullet points and consistent formatting throughout');
  }

  if (breakdown.atsCompatibility < 70) {
    recommendations.push('Use standard section headers that ATS systems can recognize');
    recommendations.push('Include more keywords naturally in your content');
    recommendations.push('Avoid complex formatting, tables, and special characters');
  }

  if (hasAllData) {
    const result = calculateComprehensiveScore(resumeText!, jobText!, matched!, missingKeywords, allJobKeywords!);
    if (result.overallScore === 100 || (breakdown.keywordMatch >= 90 && breakdown.technicalSkills >= 90)) {
      recommendations.push('Your resume is excellent! Consider tailoring the summary for this specific role');
    }
  } else if (breakdown.keywordMatch >= 90 && breakdown.technicalSkills >= 90) {
    recommendations.push('Your resume is excellent! Consider tailoring the summary for this specific role');
  }

  return recommendations;
}

export function compareResumeVersions(
  version1: { text: string; keywords: Keyword[] },
  version2: { text: string; keywords: Keyword[] }
): {
  keywordsAdded: string[];
  keywordsRemoved: string[];
  lengthChange: number;
  scoreChange: number;
} {
  const keywords1 = new Set(version1.keywords.map(k => k.text.toLowerCase()));
  const keywords2 = new Set(version2.keywords.map(k => k.text.toLowerCase()));

  const keywordsAdded = [...keywords2].filter(k => !keywords1.has(k));
  const keywordsRemoved = [...keywords1].filter(k => !keywords2.has(k));

  const lengthChange = version2.text.split(/\s+/).length - version1.text.split(/\s+/).length;

  const scoreChange = version2.keywords.length - version1.keywords.length;

  return {
    keywordsAdded,
    keywordsRemoved,
    lengthChange,
    scoreChange
  };
}

export function generateOptimizationPlan(
  _currentScore: number,
  breakdown: ScoreBreakdown,
  missingKeywords: Keyword[]
): Array<{ priority: 'High' | 'Medium' | 'Low'; action: string; impact: string }> {
  const plan: Array<{ priority: 'High' | 'Medium' | 'Low'; action: string; impact: string }> = [];

  if (breakdown.keywordMatch < 60) {
    plan.push({
      priority: 'High',
      action: `Add ${missingKeywords.slice(0, 5).map(k => k.text).join(', ')} to your resume`,
      impact: '+15-20 points'
    });
  }

  if (breakdown.technicalSkills < 60) {
    plan.push({
      priority: 'High',
      action: 'Expand technical skills section with project examples',
      impact: '+10-15 points'
    });
  }

  if (breakdown.experience < 70) {
    plan.push({
      priority: 'Medium',
      action: 'Add quantifiable metrics to your achievements',
      impact: '+8-12 points'
    });
  }

  if (breakdown.atsCompatibility < 70) {
    plan.push({
      priority: 'Medium',
      action: 'Restructure with standard ATS-friendly section headers',
      impact: '+10-15 points'
    });
  }

  if (breakdown.formatting < 70) {
    plan.push({
      priority: 'Low',
      action: 'Improve formatting consistency and add bullet points',
      impact: '+5-8 points'
    });
  }

  return plan.sort((a, b) => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
