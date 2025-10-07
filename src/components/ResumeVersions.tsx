import { useState, useEffect } from 'react';
import { Save, FileText, Trash2, Download, Eye, Clock } from 'lucide-react';
import { getResumes, deleteResume, type Resume } from '../services/resumeService';
import { useAuth } from '../hooks/useAuth';

interface ResumeVersionsProps {
  resumeText: string;
  setResumeText: (text: string) => void;
}

export default function ResumeVersions({ resumeText, setResumeText }: ResumeVersionsProps) {
  const { isAuthenticated } = useAuth();
  const [versions, setVersions] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [isAuthenticated]);

  const loadVersions = async () => {
    if (!isAuthenticated) {
      setVersions([]);
      setLoading(false);
      return;
    }

    try {
      const resumes = await getResumes();
      setVersions(resumes);
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersion = (resume: Resume) => {
    setResumeText(resume.content);
    setSelectedId(resume.id);
  };

  const deleteVersion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume version?')) return;

    try {
      await deleteResume(id);
      setVersions(versions.filter(v => v.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume');
    }
  };

  const downloadResume = (resume: Resume) => {
    const blob = new Blob([resume.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resume.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Resume Versions
        </h2>
        <p className="text-sm text-slate-500 text-center py-4">
          Sign in to save and manage resume versions
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Resume Versions ({versions.length})
        </h2>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Loading...</p>
        ) : versions.length > 0 ? (
          versions.map((resume) => (
            <div
              key={resume.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedId === resume.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800">{resume.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(resume.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        {resume.content.length} chars
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadVersion(resume)}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Load
                  </button>

                  <button
                    onClick={() => downloadResume(resume)}
                    className="flex items-center justify-center gap-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    title="Download Resume"
                  >
                    <Download className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => deleteVersion(resume.id)}
                    className="flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    title="Delete Resume"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {selectedId === resume.id && (
                <div className="px-3 pb-3 pt-0">
                  <div className="bg-white border border-blue-200 rounded p-2 max-h-32 overflow-y-auto">
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">
                      {resume.content.slice(0, 300)}
                      {resume.content.length > 300 && '...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">
            No saved resumes yet. Upload and save a resume to get started!
          </p>
        )}
      </div>
    </div>
  );
}
