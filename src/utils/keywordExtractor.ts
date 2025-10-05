export interface Keyword {
  text: string;
  category: 'technical' | 'soft' | 'tool' | 'certification' | 'custom' | 'other';
  count: number;
}

const TECHNICAL_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Rails',
  'HTML', 'CSS', 'Sass', 'LESS', 'Tailwind', 'Bootstrap',
  'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'DynamoDB',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD',
  'Git', 'GitHub', 'GitLab', 'Bitbucket',
  'REST', 'GraphQL', 'API', 'Microservices',
  'Machine Learning', 'AI', 'Deep Learning', 'NLP', 'Computer Vision',
  'TensorFlow', 'PyTorch', 'scikit-learn',
  'Agile', 'Scrum', 'Kanban', 'Jira'
];

const SOFT_SKILLS = [
  'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
  'Time Management', 'Collaboration', 'Adaptability', 'Creativity', 'Initiative',
  'Analytical', 'Detail-Oriented', 'Self-Motivated', 'Organized', 'Flexible',
  'Interpersonal', 'Presentation', 'Negotiation', 'Mentoring', 'Coaching'
];

const TOOLS = [
  'Visual Studio Code', 'VS Code', 'IntelliJ', 'Eclipse', 'Xcode',
  'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator',
  'Slack', 'Teams', 'Zoom', 'Confluence', 'Notion',
  'Postman', 'Swagger', 'Tableau', 'Power BI'
];

const CERTIFICATIONS = [
  'AWS Certified', 'Azure Certified', 'Google Cloud Certified',
  'PMP', 'Scrum Master', 'CSM', 'CSPO',
  'CompTIA', 'CISSP', 'Security+',
  'CPA', 'CFA', 'MBA', 'PhD', 'Master\'s', 'Bachelor\'s'
];

export function extractKeywords(text: string, customKeywords: string[] = []): Keyword[] {
  const keywordMap = new Map<string, Keyword>();

  const processKeywords = (keywords: string[], category: Keyword['category']) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        const lowerKeyword = keyword.toLowerCase();
        if (keywordMap.has(lowerKeyword)) {
          const existing = keywordMap.get(lowerKeyword)!;
          existing.count += matches.length;
        } else {
          keywordMap.set(lowerKeyword, {
            text: keyword,
            category,
            count: matches.length
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
  return keywords.sort((a, b) => b.count - a.count);
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