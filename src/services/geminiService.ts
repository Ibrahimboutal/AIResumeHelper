const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

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
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { technical: [], soft: [], tools: [], certifications: [] };
  } catch (error) {
    console.error('Error extracting keywords with AI:', error);
    return { technical: [], soft: [], tools: [], certifications: [] };
  }
}

export async function summarizeJob(jobText: string): Promise<string> {
  const prompt = `Summarize the following job posting, highlighting the key requirements, responsibilities, and qualifications.

Job Posting:
${jobText}

Provide a clear, structured summary with:
- Key Requirements
- Main Responsibilities
- Required Qualifications

Keep the summary concise but comprehensive.`;

  try {
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error summarizing job:', error);
    throw error;
  }
}

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

  try {
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error tailoring resume:', error);
    throw error;
  }
}

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

  try {
    return await callGeminiAPI(prompt);
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
}

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
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {
      score: 0,
      strengths: [],
      weaknesses: [],
      suggestions: []
    };
  } catch (error) {
    console.error('Error analyzing resume match:', error);
    return {
      score: 0,
      strengths: [],
      weaknesses: [],
      suggestions: ['Unable to analyze resume at this time. Please try again.']
    };
  }
}
