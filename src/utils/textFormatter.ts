export function formatResumeText(text: string): string {
  let formatted = text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');

  formatted = formatted.replace(/\b(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROJECTS|CERTIFICATIONS)\b/gi,
    match => `\n\n${match.toUpperCase()}\n`);

  return formatted;
}

export function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionHeaders = [
    'SUMMARY', 'OBJECTIVE', 'EXPERIENCE', 'WORK EXPERIENCE',
    'EDUCATION', 'SKILLS', 'TECHNICAL SKILLS', 'PROJECTS',
    'CERTIFICATIONS', 'AWARDS', 'LANGUAGES'
  ];

  const lines = text.split('\n');
  let currentSection = 'HEADER';
  let currentContent: string[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim().toUpperCase();
    const matchedHeader = sectionHeaders.find(header =>
      trimmedLine === header || trimmedLine.startsWith(header)
    );

    if (matchedHeader) {
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = matchedHeader;
      currentContent = [];
    } else {
      currentContent.push(line);
    }

    if (index === lines.length - 1 && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
  });

  return sections;
}

export function highlightKeywords(text: string, keywords: string[]): string {
  let highlighted = text;

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    highlighted = highlighted.replace(regex, match => `**${match}**`);
  });

  return highlighted;
}

export function calculateReadabilityScore(text: string): {
  score: number;
  level: string;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;

  const countSyllables = (word: string): number => {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    const vowels = word.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;
    if (word.endsWith('e')) count--;
    return Math.max(count, 1);
  };

  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgSyllablesPerWord = words.length > 0 ? totalSyllables / words.length : 0;

  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const score = Math.max(0, Math.min(100, Math.round(fleschScore)));

  let level: string;
  if (score >= 90) level = 'Very Easy';
  else if (score >= 80) level = 'Easy';
  else if (score >= 70) level = 'Fairly Easy';
  else if (score >= 60) level = 'Standard';
  else if (score >= 50) level = 'Fairly Difficult';
  else if (score >= 30) level = 'Difficult';
  else level = 'Very Difficult';

  return {
    score,
    level,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10
  };
}

export function extractCompanyInfo(jobText: string): {
  company?: string;
  location?: string;
  jobType?: string;
  remote?: boolean;
} {
  const info: {
    company?: string;
    location?: string;
    jobType?: string;
    remote?: boolean;
  } = {};

  const companyMatch = jobText.match(/(?:company|employer):\s*([^\n]+)/i);
  if (companyMatch) {
    info.company = companyMatch[1].trim();
  }

  const locationMatch = jobText.match(/(?:location|based in):\s*([^\n]+)/i);
  if (locationMatch) {
    info.location = locationMatch[1].trim();
  }

  const remoteKeywords = ['remote', 'work from home', 'wfh', 'distributed'];
  info.remote = remoteKeywords.some(keyword =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(jobText)
  );

  const jobTypePatterns = [
    { pattern: /\b(full[- ]?time)\b/i, type: 'Full-time' },
    { pattern: /\b(part[- ]?time)\b/i, type: 'Part-time' },
    { pattern: /\b(contract|contractor)\b/i, type: 'Contract' },
    { pattern: /\b(internship|intern)\b/i, type: 'Internship' },
    { pattern: /\b(temporary|temp)\b/i, type: 'Temporary' },
  ];

  for (const { pattern, type } of jobTypePatterns) {
    if (pattern.test(jobText)) {
      info.jobType = type;
      break;
    }
  }

  return info;
}

export function generateResumeFileName(resumeName: string, jobTitle?: string): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitize = (str: string) => str.replace(/[^a-z0-9]/gi, '-').toLowerCase();

  if (jobTitle) {
    return `${sanitize(resumeName)}-${sanitize(jobTitle)}-${date}.txt`;
  }
  return `${sanitize(resumeName)}-${date}.txt`;
}

export function calculateCompatibilityScore(
  resumeKeywords: string[],
  jobKeywords: string[]
): {
  score: number;
  commonKeywords: string[];
  uniqueToResume: string[];
  uniqueToJob: string[];
} {
  const resumeSet = new Set(resumeKeywords.map(k => k.toLowerCase()));
  const jobSet = new Set(jobKeywords.map(k => k.toLowerCase()));

  const commonKeywords = [...resumeSet].filter(k => jobSet.has(k));
  const uniqueToResume = [...resumeSet].filter(k => !jobSet.has(k));
  const uniqueToJob = [...jobSet].filter(k => !resumeSet.has(k));

  const score = jobSet.size > 0
    ? Math.round((commonKeywords.length / jobSet.size) * 100)
    : 0;

  return {
    score,
    commonKeywords,
    uniqueToResume,
    uniqueToJob
  };
}

export function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

export function extractActionVerbs(text: string): string[] {
  const actionVerbs = [
    'achieved', 'administered', 'analyzed', 'architected', 'automated',
    'built', 'collaborated', 'completed', 'coordinated', 'created',
    'delivered', 'demonstrated', 'designed', 'developed', 'directed',
    'drove', 'enhanced', 'established', 'executed', 'expanded',
    'facilitated', 'founded', 'generated', 'implemented', 'improved',
    'increased', 'initiated', 'integrated', 'launched', 'led',
    'managed', 'mentored', 'optimized', 'organized', 'partnered',
    'performed', 'planned', 'produced', 'reduced', 'resolved',
    'scaled', 'spearheaded', 'streamlined', 'supervised', 'transformed'
  ];

  const found: string[] = [];
  actionVerbs.forEach(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      found.push(verb);
    }
  });

  return found;
}
