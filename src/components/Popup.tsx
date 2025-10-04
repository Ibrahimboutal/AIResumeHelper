import { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, File as FileEdit, Mail, Loader2 } from 'lucide-react';
import { summarizeJob, tailorResume, generateCoverLetter } from '../utils/aiMocks';
import { extractKeywords, type Keyword } from '../utils/keywordExtractor';
import { analyzeResume, type ResumeAnalysis } from '../utils/resumeAnalyzer';
import KeywordSidebar from './KeywordSidebar';
import ResumeScore from './ResumeScore';

export default function Popup() {
  const [jobText, setJobText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const extractJobPosting = async () => {
    setLoading(true);
    setActiveAction('extract');
    setOutput('');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'extractJobPosting' });
      if (response.success) {
        setJobText(response.text);
        const extractedKeywords = extractKeywords(response.text);
        setKeywords(extractedKeywords);
        setOutput(`Job posting extracted successfully!\n\nPreview:\n${response.text.slice(0, 500)}...`);
      } else {
        setOutput('Error: Could not extract job posting from current page.');
      }
    } catch (error) {
      setOutput('Error: Make sure you are on a job posting page and try again.');
    } finally {
      setLoading(false);
      setActiveAction('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setResumeText(text);
      setOutput(`Resume uploaded successfully: ${file.name}\n\nPreview:\n${text.slice(0, 500)}...`);
    };
    reader.readAsText(file);
  };

  const handleSummarizeJob = async () => {
    if (!jobText) {
      setOutput('Please extract a job posting first.');
      return;
    }

    setLoading(true);
    setActiveAction('summarize');
    setOutput('');

    try {
      const summary = await summarizeJob(jobText);
      setOutput(summary);
    } catch (error) {
      setOutput('Error: Could not summarize job posting.');
    } finally {
      setLoading(false);
      setActiveAction('');
    }
  };

  const handleTailorResume = async () => {
    if (!jobText) {
      setOutput('Please extract a job posting first.');
      return;
    }
    if (!resumeText) {
      setOutput('Please upload your resume first.');
      return;
    }

    setLoading(true);
    setActiveAction('tailor');
    setOutput('');

    try {
      const tailored = await tailorResume(resumeText, jobText);
      setOutput(tailored);
    } catch (error) {
      setOutput('Error: Could not tailor resume.');
    } finally {
      setLoading(false);
      setActiveAction('');
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!jobText) {
      setOutput('Please extract a job posting first.');
      return;
    }
    if (!resumeText) {
      setOutput('Please upload your resume first.');
      return;
    }

    setLoading(true);
    setActiveAction('coverLetter');
    setOutput('');

    try {
      const coverLetter = await generateCoverLetter(resumeText, jobText);
      setOutput(coverLetter);
    } catch (error) {
      setOutput('Error: Could not generate cover letter.');
    } finally {
      setLoading(false);
      setActiveAction('');
    }
  };

  useEffect(() => {
    if (jobText && resumeText) {
      const resumeAnalysis = analyzeResume(resumeText, jobText);
      setAnalysis(resumeAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [jobText, resumeText]);

  return (
    <div className="w-[900px] h-[700px] bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <div className="flex-1 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Smart Resume Assistant</h1>
              <p className="text-blue-100 text-sm mt-1">AI-powered career tools at your fingertips</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Input Actions</h2>

            <button
              onClick={extractJobPosting}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            >
              {loading && activeAction === 'extract' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Extract Job Posting
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
                disabled={loading}
              />
              <label
                htmlFor="resume-upload"
                className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                Upload Resume
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">AI Actions</h2>

            <button
              onClick={handleSummarizeJob}
              disabled={loading || !jobText}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            >
              {loading && activeAction === 'summarize' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Summarize Job
            </button>

            <button
              onClick={handleTailorResume}
              disabled={loading || !jobText || !resumeText}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            >
              {loading && activeAction === 'tailor' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileEdit className="w-4 h-4" />
              )}
              Tailor Resume
            </button>

            <button
              onClick={handleGenerateCoverLetter}
              disabled={loading || !jobText || !resumeText}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            >
              {loading && activeAction === 'coverLetter' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Generate Cover Letter
            </button>
          </div>

          <div className="flex-1 min-h-0">
            {output && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full flex flex-col">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Output</h2>
                <div className="bg-slate-50 rounded-lg p-4 flex-1 overflow-y-auto">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {output}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3">
          <p className="text-xs text-slate-500 text-center">
            Status: {jobText ? '✓ Job loaded' : '○ No job'} | {resumeText ? '✓ Resume loaded' : '○ No resume'}
          </p>
        </div>
      </div>

      <div className="w-80 border-l border-slate-200 bg-white/50 overflow-y-auto p-4 space-y-4">
        <KeywordSidebar keywords={keywords} title="Job Keywords" />
        <ResumeScore analysis={analysis} />
      </div>
    </div>
  );
}
