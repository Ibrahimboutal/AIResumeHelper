export interface Keyword {
  text: string;
  category: 'technical' | 'soft' | 'tool' | 'certification' | 'custom' | 'other';
  count: number;
  importance?: number;
  context?: string[];
}

let cachedKeywords: {
  technical: string[];
  soft: string[];
  tools: string[];
  certifications: string[];
} | null = null;

async function getAIExtractedKeywords(text: string): Promise<{
  technical: string[];
  soft: string[];
  tools: string[];
  certifications: string[];
}> {
  try {
    const { extractKeywordsWithAI } = await import('../services/geminiService');
    return await extractKeywordsWithAI(text);
  } catch (error) {
    console.error('Error extracting keywords with AI:', error);
    return {
      technical: [],
      soft: [],
      tools: [],
      certifications: []
    };
  }
}

export async function extractKeywords(text: string, customKeywords: string[] = []): Promise<Keyword[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  if (!cachedKeywords) {
    cachedKeywords = await getAIExtractedKeywords(text);
  }

  const keywordMap = new Map<string, Keyword>();
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 0);

  const processKeywords = (keywords: string[], category: Keyword['category']) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        const lowerKeyword = keyword.toLowerCase();
        const context: string[] = [];

        sentences.forEach(sentence => {
          if (new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi').test(sentence)) {
            context.push(sentence.trim().slice(0, 100));
          }
        });

        if (keywordMap.has(lowerKeyword)) {
          const existing = keywordMap.get(lowerKeyword)!;
          existing.count += matches.length;
          existing.context = [...new Set([...(existing.context || []), ...context.slice(0, 3)])];
        } else {
          const importance = calculateImportance(keyword, text, category);
          keywordMap.set(lowerKeyword, {
            text: keyword,
            category,
            count: matches.length,
            importance,
            context: context.slice(0, 3)
          });
        }
      }
    });
  };

  processKeywords(cachedKeywords.technical, 'technical');
  processKeywords(cachedKeywords.soft, 'soft');
  processKeywords(cachedKeywords.tools, 'tool');
  processKeywords(cachedKeywords.certifications, 'certification');
  processKeywords(customKeywords, 'custom');

  const keywords = Array.from(keywordMap.values());
  return keywords.sort((a, b) => {
    const importanceDiff = (b.importance || 0) - (a.importance || 0);
    if (importanceDiff !== 0) return importanceDiff;
    return b.count - a.count;
  });
}

export function extractKeywordsSync(text: string, customKeywords: string[] = []): Keyword[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const TECHNICAL_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'HTML', 'CSS', 'Tailwind', 'Bootstrap',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'Git', 'GitHub', 'CI/CD',
    'REST', 'API', 'GraphQL'
  ];

  const SOFT_SKILLS = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
    'Time Management', 'Collaboration', 'Adaptability'
  ];

  const TOOLS = [
    'VS Code', 'IntelliJ', 'Figma', 'Slack', 'Jira', 'Postman'
  ];

  const CERTIFICATIONS = [
    'AWS Certified', 'Azure Certified', 'PMP', 'Scrum Master',
    'Bachelor\'s', 'Master\'s', 'MBA', 'PhD'
  ];

  const keywordMap = new Map<string, Keyword>();
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 0);

  const processKeywords = (keywords: string[], category: Keyword['category']) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        const lowerKeyword = keyword.toLowerCase();
        const context: string[] = [];

        sentences.forEach(sentence => {
          if (new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi').test(sentence)) {
            context.push(sentence.trim().slice(0, 100));
          }
        });

        if (keywordMap.has(lowerKeyword)) {
          const existing = keywordMap.get(lowerKeyword)!;
          existing.count += matches.length;
          existing.context = [...new Set([...(existing.context || []), ...context.slice(0, 3)])];
        } else {
          const importance = calculateImportance(keyword, text, category);
          keywordMap.set(lowerKeyword, {
            text: keyword,
            category,
            count: matches.length,
            importance,
            context: context.slice(0, 3)
          });
        }
      }
    });
  };

  processKeywords(TECHNICAL_SKILLS, 'technical');
  processKeywords(SOFT_SKILLS, 'soft');
  processKeywords(TOOLS, 'tool');
  processKeywords(CERTIFICATIONS, 'certification');
  processKeywords(customKeywords, 'custom');

  const keywords = Array.from(keywordMap.values());
  return keywords.sort((a, b) => {
    const importanceDiff = (b.importance || 0) - (a.importance || 0);
    if (importanceDiff !== 0) return importanceDiff;
    return b.count - a.count;
  });
}

function calculateImportance(keyword: string, text: string, category: string): number {
  let score = 0;

  if (new RegExp(`required.*${keyword}`, 'gi').test(text)) score += 3;
  if (new RegExp(`must have.*${keyword}`, 'gi').test(text)) score += 3;
  if (new RegExp(`${keyword}.*experience`, 'gi').test(text)) score += 2;
  if (new RegExp(`proficient.*${keyword}`, 'gi').test(text)) score += 2;
  if (new RegExp(`expert.*${keyword}`, 'gi').test(text)) score += 2;

  if (category === 'technical') score += 1;
  if (category === 'certification') score += 1.5;

  const lines = text.split('\n');
  const firstThirdLines = lines.slice(0, Math.floor(lines.length / 3)).join(' ');
  if (new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi').test(firstThirdLines)) {
    score += 1;
  }

  return score;
}

export function categorizeKeywords(keywords: Keyword[]): Record<string, Keyword[]> {
  return keywords.reduce((acc, keyword) => {
    if (!acc[keyword.category]) {
      acc[keyword.category] = [];
    }
    acc[keyword.category].push(keyword);
    return acc;
  }, {} as Record<string, Keyword[]>);
}

export function extractYearsOfExperience(text: string): number | null {
  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
    /experience\s+(?:of\s+)?(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*yrs?\s+experience/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numbers = match.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
      return Math.max(...numbers);
    }
  }
  return null;
}

export function extractEducationRequirements(text: string): string[] {
  const requirements: string[] = [];
  const eduKeywords = ['Bachelor', 'Master', 'PhD', 'Doctorate', 'Associate', 'MBA', 'degree'];

  eduKeywords.forEach(keyword => {
    const regex = new RegExp(`[^.]*${keyword}[^.]*`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      requirements.push(...matches.map(m => m.trim()));
    }
  });

  return [...new Set(requirements)].slice(0, 3);
}

export function extractSalaryRange(text: string): { min?: number; max?: number; currency: string } | null {
  const patterns = [
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)[\s-]+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    /(\d{1,3}(?:,\d{3})*)k?[\s-]+(\d{1,3}(?:,\d{3})*)k/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numbers = match[0].match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        return {
          min: parseInt(numbers[0].replace(/,/g, '')),
          max: parseInt(numbers[1].replace(/,/g, '')),
          currency: 'USD'
        };
      }
    }
  }
  return null;
}

export function calculateKeywordDensity(keywords: Keyword[], totalWords: number): Record<string, number> {
  const density: Record<string, number> = {};

  keywords.forEach(keyword => {
    const keywordWords = keyword.text.split(/\s+/).length;
    const occurrences = keyword.count * keywordWords;
    density[keyword.text] = totalWords > 0 ? (occurrences / totalWords) * 100 : 0;
  });

  return density;
}