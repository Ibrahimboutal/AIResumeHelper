import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// You need Supabase URL and anon/public key for your extension

// Initialize Supabase client


const supabase = createClient(supabaseUrl, supabaseAnonKey);

const functionUrl = supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
const SUPABASE_FUNCTION_URL = `${functionUrl}/gemini`;

async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    // Get the current session (if user is logged in)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Set headers
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Optional: fallback to anon key if you allow public access
      headers["Authorization"] = `Bearer ${supabaseAnonKey}`;
    }

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase Function error: ${response.status} ${response.statusText} - ${text}`);
    }

    const data = (await response.json()) as { output?: string; error?: string };

    if (data.error) throw new Error(data.error);
    if (!data.output) throw new Error("No output from Gemini function");

    return data.output;
  } catch (error: any) {
    console.error("Error calling Gemini via Edge Function:", error);
    throw error;
  }
}


/**
 * Extract keywords from a job posting
 */
export async function extractKeywordsWithAI(jobText: string): Promise<{
  technical: string[];
  soft: string[];
  tools: string[];
  certifications: string[];
}> {
  const prompt = `Analyze the following job posting and extract relevant keywords in JSON format.

Job Posting:
${jobText}

Please provide a JSON response with the following structure:
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
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { technical: [], soft: [], tools: [], certifications: [] };
  } catch (error) {
    console.error("Error extracting keywords with AI:", error);
    return { technical: [], soft: [], tools: [], certifications: [] };
  }
}

/**
 * Summarize a job posting
 */
export async function summarizeJob(jobText: string): Promise<string> {
  const prompt = `Summarize the following job posting, highlighting the key requirements, responsibilities, and qualifications.

Job Posting:
${jobText}

Provide a clear, structured summary with:
- Key Requirements
- Main Responsibilities
- Required Qualifications

Keep the summary concise but comprehensive.`;

  return callGeminiAPI(prompt);
}

/**
 * Tailor a resume to a job posting
 */
export async function tailorResume(resumeText: string, jobText: string): Promise<string> {
  const prompt = `You are an expert resume writer. Tailor the following resume to match the job posting below.

Resume:
${resumeText}

Job Posting:
${jobText}

Instructions:
1. Keep all factual information accurate - don't fabricate experience
2. Reorder and emphasize relevant skills and experience that match the job
3. Use keywords from the job posting naturally
4. Maintain professional tone and formatting
5. Quantify achievements where possible
6. Use action verbs appropriate for the role

Provide the tailored resume in a well-formatted text format.`;

  return callGeminiAPI(prompt);
}

/**
 * Generate a cover letter from resume + job posting
 */
export async function generateCoverLetter(resumeText: string, jobText: string): Promise<string> {
  const prompt = `Write a professional cover letter based on the following resume and job posting.

Resume:
${resumeText}

Job Posting:
${jobText}

Instructions:
1. Create a compelling opening that shows enthusiasm for the role
2. Highlight 2-3 key qualifications that match the job requirements
3. Include specific examples from the resume that demonstrate fit
4. Show knowledge of the company/role (based on job posting)
5. Close with a strong call to action
6. Keep it to 3-4 paragraphs
7. Use a professional but personable tone

Provide the cover letter text.`;

  return callGeminiAPI(prompt);
}

/**
 * Analyze how well a resume matches a job posting
 */
export async function analyzeResumeMatch(resumeText: string, jobText: string): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  const prompt = `Analyze how well this resume matches the job posting and provide detailed feedback.

Resume:
${resumeText}

Job Posting:
${jobText}

Provide a JSON response with:
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
    return jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { score: 0, strengths: [], weaknesses: [], suggestions: [] };
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
