import { useState, useEffect } from 'react';
import { Save, FileText, Trash2 } from 'lucide-react';

interface ResumeVersionsProps {
  resumeText: string;
  setResumeText: (text: string) => void;
}

export default function ResumeVersions({ resumeText, setResumeText }: ResumeVersionsProps) {
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [versionName, setVersionName] = useState('');

  useEffect(() => {
    chrome.storage.local.get(['resumeVersions'], (result) => {
      if (result.resumeVersions) {
        setVersions(result.resumeVersions);
      }
    });
  }, []);

  const saveVersion = () => {
    if (versionName && resumeText) {
      const newVersions = { ...versions, [versionName]: resumeText };
      setVersions(newVersions);
      chrome.storage.local.set({ resumeVersions: newVersions });
      setVersionName('');
    }
  };

  const loadVersion = (name: string) => {
    setResumeText(versions[name]);
  };

    const deleteVersion = (name: string) => {
    const newVersions = { ...versions };
    delete newVersions[name];
    setVersions(newVersions);
    chrome.storage.local.set({ resumeVersions: newVersions });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Resume Versions</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          placeholder="Version Name..."
          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
        />
        <button 
        title='Save Version'
        onClick={saveVersion} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md">
          <Save className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {Object.keys(versions).map((name) => (
          <div key={name} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
            <button onClick={() => loadVersion(name)} className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" />
                {name}
            </button>
            <button 
            title='Delete Version'
            onClick={() => deleteVersion(name)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}