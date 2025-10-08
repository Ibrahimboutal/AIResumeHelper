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
  const breakdown: ScoreBreakdown = {
    keywordMatch: calculateKeywordMatchScore(matchedKeywords, allJobKeywords),
    technicalSkills: calculateTechnicalSkillsScore(matchedKeywords, allJobKeywords),
    experience: calculateExperienceScore(resumeText, jobText),
    formatting: calculateFormattingScore(resumeText),
    atsCompatibility: calculateATSCompatibility(resumeText, matchedKeywords)
  };

  const weights = {
    keywordMatch: 0.30,
    technicalSkills: 0.25,
    experience: 0.20,
    formatting: 0.10,
    atsCompatibility: 0.15
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
  if (allJobKeywords.length === 0) return 100;

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

  return Math.round((matchedImportance / totalImportance) * 100);
}

function calculateTechnicalSkillsScore(matched: Keyword[], allJobKeywords: Keyword[]): number {
  const technicalMatched = matched.filter(k => k.category === 'technical');
  const technicalTotal = allJobKeywords.filter(k => k.category === 'technical');

  if (technicalTotal.length === 0) return 100;

  const matchRate = (technicalMatched.length / technicalTotal.length) * 100;

  const highImportanceTech = technicalTotal.filter(k => (k.importance || 0) > 2);
  const highImportanceMatched = technicalMatched.filter(k =>
    highImportanceTech.some(h => h.text.toLowerCase() === k.text.toLowerCase())
  );

  const criticalMatchBonus = highImportanceTech.length > 0
    ? (highImportanceMatched.length / highImportanceTech.length) * 20
    : 0;

  return Math.min(100, Math.round(matchRate * 0.8 + criticalMatchBonus));
}

function calculateExperienceScore(resumeText: string, jobText: string): number {
  let score = 50;

  const jobYearsMatch = jobText.match(/(\d+)\+?\s*years?/gi);
  const resumeYearsMatch = resumeText.match(/(\d+)\+?\s*years?/gi);

  if (jobYearsMatch && resumeYearsMatch) {
    const jobYears = Math.max(...jobYearsMatch.map(m => parseInt(m.match(/\d+/)?.[0] || '0')));
    const resumeYears = Math.max(...resumeYearsMatch.map(m => parseInt(m.match(/\d+/)?.[0] || '0')));

    if (resumeYears >= jobYears) {
      score += 30;
    } else if (resumeYears >= jobYears * 0.7) {
      score += 20;
    } else {
      score += 10;
    }
  }

  const actionVerbs = extractActionVerbs(resumeText);
  if (actionVerbs.length >= 10) score += 15;
  else if (actionVerbs.length >= 5) score += 10;
  else if (actionVerbs.length >= 3) score += 5;

  const hasMetrics = /\d+%|\$\d+|increased|reduced|improved|enhanced/.test(resumeText);
  if (hasMetrics) score += 5;

  return Math.min(100, score);
}

function calculateFormattingScore(resumeText: string): number {
  let score = 0;

  const hasSections = /(experience|education|skills|summary)/gi.test(resumeText);
  if (hasSections) score += 25;

  const hasContactInfo = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText) ||
                        /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(resumeText);
  if (hasContactInfo) score += 20;

  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount >= 300 && wordCount <= 800) score += 20;
  else if (wordCount >= 200 && wordCount <= 1000) score += 15;
  else if (wordCount >= 100) score += 10;

  const hasConsistentFormatting = !/(  {2,})/g.test(resumeText);
  if (hasConsistentFormatting) score += 15;

  const hasBulletPoints = /[•\-\*]/.test(resumeText);
  if (hasBulletPoints) score += 10;

  const hasProperCapitalization = /[A-Z][a-z]+/.test(resumeText);
  if (hasProperCapitalization) score += 10;

  return Math.min(100, score);
}

function calculateATSCompatibility(resumeText: string, matchedKeywords: Keyword[]): number {
  let score = 0;

  const hasStandardSections = /\b(EXPERIENCE|EDUCATION|SKILLS)\b/i.test(resumeText);
  if (hasStandardSections) score += 25;

  const keywordDensity = matchedKeywords.length / (resumeText.split(/\s+/).length / 100);
  if (keywordDensity >= 2 && keywordDensity <= 5) score += 25;
  else if (keywordDensity >= 1 && keywordDensity <= 7) score += 20;
  else if (keywordDensity > 0) score += 10;

  const hasSimpleFormatting = !/[^\x00-\x7F]/.test(resumeText);
  if (hasSimpleFormatting) score += 15;

  const hasNoTables = !/\|/.test(resumeText);
  if (hasNoTables) score += 10;

  const hasContactAtTop = resumeText.slice(0, 200).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (hasContactAtTop) score += 15;

  const hasDateFormats = /\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(resumeText);
  if (hasDateFormats) score += 10;

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
