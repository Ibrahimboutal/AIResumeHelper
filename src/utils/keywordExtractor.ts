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
  if (!text?.trim()) {
    return [];
  }

  const normalizedText = text.trim();
  if (normalizedText.length === 0) {
    return [];
  }

  const TECHNICAL_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'Scala',
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'FastAPI',
    'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Sass', 'SCSS',
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
    'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins',
    'REST', 'API', 'GraphQL', 'gRPC', 'WebSocket',
    'Testing', 'Jest', 'Mocha', 'Cypress', 'Selenium'
  ];

  const SOFT_SKILLS = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Collaboration', 'Adaptability', 'Creativity', 'Attention to Detail',
    'Organization', 'Project Management', 'Analytical', 'Strategic', 'Initiative'
  ];

  const TOOLS = [
    'VS Code', 'Visual Studio', 'IntelliJ', 'Eclipse', 'Figma', 'Sketch', 'Adobe XD',
    'Slack', 'Jira', 'Confluence', 'Trello', 'Asana', 'Postman', 'Insomnia'
  ];

  const CERTIFICATIONS = [
    'AWS Certified', 'Azure Certified', 'GCP Certified', 'PMP', 'Scrum Master', 'CSM',
    'Bachelor\'s', 'Master\'s', 'MBA', 'PhD', 'Doctorate', 'Associate Degree'
  ];

  const keywordMap = new Map<string, Keyword>();
  const sentences = normalizedText.split(/[.!?\n]+/).filter(s => s.trim().length > 0);

  const processKeywords = (keywords: string[], category: Keyword['category']) => {
    keywords.forEach(keyword => {
      if (!keyword || keyword.trim().length === 0) return;

      try {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
        const matches = normalizedText.match(regex);

        if (matches && matches.length > 0) {
          const lowerKeyword = keyword.toLowerCase();
          const context: string[] = [];

          sentences.forEach(sentence => {
            if (sentence && new RegExp(`\\b${escapedKeyword}\\b`, 'gi').test(sentence)) {
              const trimmed = sentence.trim();
              if (trimmed.length > 0) {
                context.push(trimmed.slice(0, 100));
              }
            }
          });

          if (keywordMap.has(lowerKeyword)) {
            const existing = keywordMap.get(lowerKeyword)!;
            existing.count += matches.length;
            existing.context = [...new Set([...(existing.context || []), ...context.slice(0, 3)])];
          } else {
            const importance = calculateImportance(keyword, normalizedText, category);
            keywordMap.set(lowerKeyword, {
              text: keyword,
              category,
              count: matches.length,
              importance,
              context: context.slice(0, 3)
            });
          }
        }
      } catch (error) {
        console.warn(`Error processing keyword "${keyword}":`, error);
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
  if (!keyword || !text) return 1;

  let score = 1;

  try {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (new RegExp(`required.*${escapedKeyword}`, 'gi').test(text)) score += 3;
    if (new RegExp(`must have.*${escapedKeyword}`, 'gi').test(text)) score += 3;
    if (new RegExp(`essential.*${escapedKeyword}`, 'gi').test(text)) score += 2.5;
    if (new RegExp(`${escapedKeyword}.*experience`, 'gi').test(text)) score += 2;
    if (new RegExp(`proficient.*${escapedKeyword}`, 'gi').test(text)) score += 2;
    if (new RegExp(`expert.*${escapedKeyword}`, 'gi').test(text)) score += 2;
    if (new RegExp(`strong.*${escapedKeyword}`, 'gi').test(text)) score += 1.5;

    if (category === 'technical') score += 1;
    if (category === 'certification') score += 1.5;
    if (category === 'custom') score += 0.5;

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const firstThirdLines = lines.slice(0, Math.max(Math.floor(lines.length / 3), 1)).join(' ');
    if (new RegExp(`\\b${escapedKeyword}\\b`, 'gi').test(firstThirdLines)) {
      score += 1;
    }
  } catch (error) {
    console.warn(`Error calculating importance for "${keyword}":`, error);
  }

  return Math.max(score, 0.1);
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
  if (!text?.trim()) return null;

  const patterns = [
    /(\d+)\+?\s*years?\s+(?:of\s+)?experience/gi,
    /experience\s+(?:of\s+)?(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*yrs?\s+experience/gi,
    /(\d+)\+?\s*year\s+experience/gi,
  ];

  const numbers: number[] = [];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const numMatch = match.match(/\d+/);
        if (numMatch) {
          const num = parseInt(numMatch[0], 10);
          if (!isNaN(num) && num >= 0 && num <= 50) {
            numbers.push(num);
          }
        }
      });
    }
  }

  return numbers.length > 0 ? Math.max(...numbers) : null;
}

export function extractEducationRequirements(text: string): string[] {
  if (!text?.trim()) return [];

  const requirements: string[] = [];
  const eduKeywords = ['Bachelor', 'Master', 'PhD', 'Doctorate', 'Associate', 'MBA', 'degree', 'B.S.', 'M.S.', 'B.A.', 'M.A.'];

  eduKeywords.forEach(keyword => {
    try {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`[^.]*${escapedKeyword}[^.]*`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        requirements.push(...matches.map(m => m.trim()).filter(r => r.length > 0 && r.length < 200));
      }
    } catch (error) {
      console.warn(`Error extracting education for "${keyword}":`, error);
    }
  });

  return [...new Set(requirements)].filter(r => r.length > 0).slice(0, 5);
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