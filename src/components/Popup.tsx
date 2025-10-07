import { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, File as FileEdit, Mail, Loader2, Copy, Save, Briefcase, MousePointerClick, LayoutGrid, Library, Settings, LogOut, User, PartyPopper } from 'lucide-react';
import { summarizeJob, tailorResume, generateCoverLetter } from '../utils/aiMocks';
import { extractKeywords, type Keyword } from '../utils/keywordExtractor';
import { analyzeResume, type ResumeAnalysis } from '../utils/resumeAnalyzer';
import KeywordSidebar from './KeywordSidebar';
import ResumeScore from './ResumeScore';
import CustomKeywords from './CustomKeywords';
import ApplicationTracker from './ApplicationTracker';
import ResumeVersions from './ResumeVersions';
import AuthModal from './AuthModal';
import Dashboard from './Dashboard';
import { useAuth } from '../hooks/useAuth';
import { saveResume, getResumes } from '../services/resumeService';
import { saveJobApplication } from '../services/applicationService';

type Tab = 'analysis' | 'data' | 'settings';

export default function Popup() {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [jobText, setJobText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);

  useEffect(() => {
    // Listen for storage changes to keep custom keywords in sync
   if (chrome && chrome.storage && chrome.storage.sync) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'sync' && changes.customKeywords) {
        setCustomKeywords(changes.customKeywords.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    
    // Initial load
    chrome.storage.sync.get(['customKeywords'], (result) => {
      if (result.customKeywords) {
        setCustomKeywords(result.customKeywords);
      }
    });

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    }
    }
  }, []);

  // --- All your handler functions (extractJobPosting, handleFileUpload, etc.) remain the same ---
  // ... (keeping them hidden for brevity, no changes needed to their logic)
  const extractJobPosting = async () => {
    setLoading(true);
    setActiveAction('extract');
    setOutput('');

    try {
      const response = await chrome.runtime.sendMessage({ action: 'extractJobPosting' });
      if (response.success) {
        setJobText(response.text);
        const extractedKeywords = extractKeywords(response.text, customKeywords);
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

    const manualSelect = async () => {
    setLoading(true);
    setActiveAction('manualSelect');
    setOutput('');

    try {
      await chrome.runtime.sendMessage({ action: 'startManualSelection' });
      setOutput('Manual selection mode activated. Click on any element on the page to extract its content.');

      const messageListener = (message: any) => {
        if (message.action === 'manualSelectionComplete') {
          setJobText(message.text);
          const extractedKeywords = extractKeywords(message.text, customKeywords);
          setKeywords(extractedKeywords);
          setOutput(`Job posting extracted via manual selection!\n\nPreview:\n${message.text.slice(0, 500)}...`);
          setLoading(false);
          setActiveAction('');
          chrome.runtime.onMessage.removeListener(messageListener);
        } else if (message.action === 'selectionCancelled') {
          setOutput('Manual selection cancelled.');
          setLoading(false);
          setActiveAction('');
          chrome.runtime.onMessage.removeListener(messageListener);
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);
    } catch (error) {
      setOutput('Error: Could not start manual selection mode.');
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

  const trackApplication = async () => {
    if (!jobText) {
      setOutput('Please extract a job posting first.');
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    let jobTitle = 'Unknown Job Title';
    let company = 'Unknown Company';
    const titleMatch = jobText.match(/job title:?\s*(.*)/i);
    const companyMatch = jobText.match(/company:?\s*(.*)/i);
    if (titleMatch && titleMatch[1]) jobTitle = titleMatch[1].split('\n')[0];
    if (companyMatch && companyMatch[1]) company = companyMatch[1].split('\n')[0];

    try {
      await saveJobApplication(jobTitle, company, undefined, jobText);
      setOutput(`Application tracked successfully!\n\nJob: ${jobTitle}\nCompany: ${company}\nDate: ${new Date().toLocaleDateString()}`);
    } catch (error) {
      setOutput('Error: Could not save application. Please try again.');
    }
  };

  const handleSaveResume = async () => {
    if (!resumeText) {
      setOutput('Please upload a resume first.');
      return;
    }

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const resumeName = prompt('Enter a name for this resume:');
    if (!resumeName) return;

    try {
      await saveResume(resumeName, resumeText);
      setOutput(`Resume "${resumeName}" saved successfully!`);
    } catch (error) {
      setOutput('Error: Could not save resume. Please try again.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const downloadAsTxt = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-generated-content.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
    
  useEffect(() => {
    if (jobText && resumeText) {
      const resumeAnalysis = analyzeResume(resumeText, jobText, customKeywords);
      setAnalysis(resumeAnalysis);
    } else {
      setAnalysis(null);
    }
  }, [jobText, resumeText, customKeywords]);

  const TabButton = ({ tab, icon, label }: { tab: Tab, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-medium border-b-2 transition-colors ${
        activeTab === tab
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-slate-500 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
  const renderEmptyState = () => {
    if (!jobText) {
      return (
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Welcome to Smart Resume Assistant!</h3>
          <p className="text-slate-500 mt-2 mb-4">Start by extracting a job posting from your current page.</p>
          <button onClick={extractJobPosting} disabled={loading} className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed">
            {loading && activeAction === 'extract' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Extract Job Posting
          </button>
        </div>
      );
    }
    if (!resumeText) {
      return (
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <PartyPopper className="w-10 h-10 mx-auto text-emerald-500" />
          <h3 className="text-lg font-semibold text-slate-800 mt-2">Job Posting Loaded!</h3>
          <p className="text-slate-500 mt-2 mb-4">Now, upload your resume to see your match score and unlock AI actions.</p>
          <label htmlFor="resume-upload" className="inline-flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer">
            <FileText className="w-5 h-5" />
            Upload Your Resume
          </label>
           <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" id="resume-upload" disabled={loading} />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="w-[800px] h-[700px] bg-slate-50 flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Smart Resume Assistant</h1>
              <p className="text-blue-100 text-xs">AI-powered career tools</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user?.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
      
      <nav className="flex border-b border-slate-200 bg-white">
        <TabButton tab="analysis" icon={<LayoutGrid className="w-4 h-4" />} label="Analysis" />
        <TabButton tab="data" icon={<Library className="w-4 h-4" />} label="My Data" />
        <TabButton tab="settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
      </nav>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'analysis' && (
          renderEmptyState() ? renderEmptyState() : (
          <>
          
          
            {/* Step 1: Inputs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">1. Inputs</h2>
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={extractJobPosting} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed">
                    {loading && activeAction === 'extract' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Extract Job Posting
                  </button>
                   <button onClick={manualSelect} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed">
                    <MousePointerClick className="w-4 h-4" />
                    Manual Select
                  </button>
              </div>
              <div className="relative">
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" id="resume-upload" disabled={loading} />
                <label htmlFor="resume-upload" className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <FileText className="w-4 h-4" />
                  Upload Resume
                </label>
              </div>
              {resumeText && (
                <button
                  onClick={handleSaveResume}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Save Resume
                </button>
              )}
            </div>

            {/* Step 2: Analysis */}
            {analysis && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">2. Analysis</h2>
                <div className="grid grid-cols-2 gap-4">
                  <ResumeScore analysis={analysis} />
                  <KeywordSidebar keywords={keywords} title="Job Keywords" />
                </div>
              </div>
            )}

            {/* Step 3: AI Actions & Output */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">3. AI Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleTailorResume} disabled={loading || !jobText || !resumeText} className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed">
                  {loading && activeAction === 'tailor' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileEdit className="w-4 h-4" />}
                  Tailor Resume
                </button>
                <button onClick={handleGenerateCoverLetter} disabled={loading || !jobText || !resumeText} className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed">
                  {loading && activeAction === 'coverLetter' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Generate Cover Letter
                </button>
                <button onClick={handleSummarizeJob} disabled={loading || !jobText} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed">
                  {loading && activeAction === 'summarize' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Summarize Job
                </button>
                 <button onClick={trackApplication} disabled={!jobText} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed">
                  <Briefcase className="w-4 h-4" />
                  Track Application
                </button>
              </div>
              {output && (
                <div className="pt-4 mt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-slate-600">Output</h3>
                      <div className="flex gap-3">
                          <button onClick={copyToClipboard} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
                              <Copy className="w-3 h-3" /> Copy
                          </button>
                          <button onClick={downloadAsTxt} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
                              <Save className="w-3 h-3" /> Download
                          </button>
                      </div>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {output}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </>
          )
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <Dashboard />
            <div className="grid grid-cols-2 gap-4">
              <ResumeVersions resumeText={resumeText} setResumeText={setResumeText} />
              <ApplicationTracker />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <CustomKeywords />
        )}
      </div>

      <div className="bg-slate-100 border-t border-slate-200 px-4 py-2">
          <p className="text-xs text-slate-500 text-center">
            Status: {jobText ? '✓ Job loaded' : '○ No job'} | {resumeText ? '✓ Resume loaded' : '○ No resume'}
          </p>
      </div>
    </div>
  );
}