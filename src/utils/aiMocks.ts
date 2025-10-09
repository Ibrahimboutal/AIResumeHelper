export async function summarizeJob(text: string): Promise<string> {
  const { summarizeJob: geminiSummarizeJob } = await import('../services/geminiService');

  try {
    return await geminiSummarizeJob(text);
  } catch (error) {
    console.error('Error using Gemini API for job summary:', error);
    throw new Error('Failed to summarize job posting. Please check your API configuration.');
  }
}

export async function tailorResume(resume: string, job: string): Promise<string> {
  const { tailorResume: geminiTailorResume } = await import('../services/geminiService');

  try {
    return await geminiTailorResume(resume, job);
  } catch (error) {
    console.error('Error using Gemini API for resume tailoring:', error);
    throw new Error('Failed to tailor resume. Please check your API configuration.');
  }
}

export async function generateCoverLetter(resume: string, job: string): Promise<string> {
  const { generateCoverLetter: geminiGenerateCoverLetter } = await import('../services/geminiService');

  try {
    return await geminiGenerateCoverLetter(resume, job);
  } catch (error) {
    console.error('Error using Gemini API for cover letter generation:', error);
    throw new Error('Failed to generate cover letter. Please check your API configuration.');
  }
}
