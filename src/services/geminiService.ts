import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const functionUrl = supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
const SUPABASE_FUNCTION_URL = `${functionUrl}/gemini`;

async function callGeminiAPI(prompt: string, retries = 2): Promise<string> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
      }

      const data = (await response.json()) as { output?: string; error?: string };

      if (data.error) throw new Error(data.error);
      if (!data.output) throw new Error("No output received");

      return data.output;
    } catch (error: any) {
      lastError = error;
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to call Gemini API');
}


export async function extractKeywordsWithAI(jobText: string): Promise<{
  technical: string[];
  soft: string[];
  tools: string[];
  certifications: string[];
}> {
  if (!jobText || jobText.trim().length < 50) {
    return { technical: [], soft: [], tools: [], certifications: [] };
  }

  const prompt = `Analyze the following job posting and extract relevant keywords in JSON format.

Job Posting:
${jobText.slice(0, 3000)}

Provide a JSON response with this exact structure:
{
  "technical": ["list of technical skills like programming languages, frameworks, databases"],
  "soft": ["list of soft skills like communication, leadership, teamwork"],
  "tools": ["list of tools and software like IDEs, design tools, project management tools"],
  "certifications": ["list of certifications or education requirements"]
}

Only return valid JSON, no additional text.`;

  try {
    const response = await callGeminiAPI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        technical: Array.isArray(parsed.technical) ? parsed.technical : [],
        soft: Array.isArray(parsed.soft) ? parsed.soft : [],
        tools: Array.isArray(parsed.tools) ? parsed.tools : [],
        certifications: Array.isArray(parsed.certifications) ? parsed.certifications : []
      };
    }
    return { technical: [], soft: [], tools: [], certifications: [] };
  } catch (error) {
    console.error("Error extracting keywords with AI:", error);
    return { technical: [], soft: [], tools: [], certifications: [] };
  }
}

export async function summarizeJob(jobText: string): Promise<string> {
  if (!jobText || jobText.trim().length < 50) {
    throw new Error('Job posting text is too short to summarize');
  }

  const prompt = `Summarize the following job posting, highlighting the key requirements, responsibilities, and qualifications.

Job Posting:
${jobText.slice(0, 5000)}

Provide a clear, structured summary with:
- Key Requirements
- Main Responsibilities
- Required Qualifications

Keep the summary concise but comprehensive.`;

  return callGeminiAPI(prompt);
}

export async function tailorResume(resumeText: string, jobText: string): Promise<string> {
  if (!resumeText || resumeText.trim().length < 100) {
    throw new Error('Resume text is too short to tailor');
  }
  if (!jobText || jobText.trim().length < 50) {
    throw new Error('Job posting text is too short');
  }

  const prompt = `You are an expert resume writer. Tailor the following resume to match the job posting below.

Resume:
${resumeText.slice(0, 8000)}

Job Posting:
${jobText.slice(0, 3000)}

Instructions:
1. Keep all factual information accurate - never fabricate experience
2. Reorder and emphasize relevant skills and experience that match the job
3. Use keywords from the job posting naturally throughout
4. Maintain professional tone and formatting
5. Quantify achievements where possible
6. Use strong action verbs appropriate for the role
7. Ensure the resume remains authentic and honest

Provide the tailored resume in a well-formatted text format.`;

  return callGeminiAPI(prompt);
}

export async function generateCoverLetter(resumeText: string, jobText: string): Promise<string> {
  if (!resumeText || resumeText.trim().length < 100) {
    throw new Error('Resume text is too short to generate a cover letter');
  }
  if (!jobText || jobText.trim().length < 50) {
    throw new Error('Job posting text is too short');
  }

  const prompt = `Write a professional cover letter based on the following resume and job posting.

Resume:
${resumeText.slice(0, 8000)}

Job Posting:
${jobText.slice(0, 3000)}

Instructions:
1. Create a compelling opening that shows genuine enthusiasm for the role
2. Highlight 2-3 key qualifications that directly match the job requirements
3. Include specific, concrete examples from the resume that demonstrate fit
4. Show knowledge of the company/role based on the job posting
5. Close with a strong, actionable call to action
6. Keep it to 3-4 well-structured paragraphs
7. Use a professional but personable tone
8. Avoid generic phrases and cliches

Provide the cover letter text.`;

  return callGeminiAPI(prompt);
}

export async function analyzeResumeMatch(resumeText: string, jobText: string): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  if (!resumeText || resumeText.trim().length < 100) {
    throw new Error('Resume text is too short to analyze');
  }
  if (!jobText || jobText.trim().length < 50) {
    throw new Error('Job posting text is too short');
  }

  const prompt = `Analyze how well this resume matches the job posting and provide detailed feedback.

Resume:
${resumeText.slice(0, 8000)}

Job Posting:
${jobText.slice(0, 3000)}

Provide a JSON response with this exact structure:
{
  "score": <number 0-100>,
  "strengths": ["list of 3-5 key strengths/matches"],
  "weaknesses": ["list of 3-5 gaps or areas to improve"],
  "suggestions": ["list of 5-7 specific actionable suggestions"]
}

Only return valid JSON, no additional text.`;

  try {
    const response = await callGeminiAPI(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
      };
    }
    return { score: 0, strengths: [], weaknesses: [], suggestions: [] };
  } catch (error) {
    console.error("Error analyzing resume match:", error);
    return {
      score: 0,
      strengths: [],
      weaknesses: [],
      suggestions: ["Unable to analyze resume at this time. Please try again."],
    };
  }
}
