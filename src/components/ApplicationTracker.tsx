import { useState, useEffect } from 'react';
import { Briefcase, Trash2 } from 'lucide-react';

interface TrackedApp {
  jobTitle: string;
  company: string;
  date: string;
}

export default function ApplicationTracker() {
  const [apps, setApps] = useState<TrackedApp[]>([]);

  useEffect(() => {
    chrome.storage.local.get(['trackedApps'], (result) => {
      if (result.trackedApps) {
        setApps(result.trackedApps);
      }
    });
  }, []);

  const removeApp = (index: number) => {
    const newApps = [...apps];
    newApps.splice(index, 1);
    setApps(newApps);
    chrome.storage.local.set({ trackedApps: newApps });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Briefcase className="w-4 h-4" />
        Tracked Applications
      </h2>
      <div className="space-y-2">
        {apps.length > 0 ? (
          apps.map((app, index) => (
            <div key={index} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
              <div>
                <p className="font-semibold text-sm">{app.jobTitle}</p>
                <p className="text-xs text-slate-500">{app.company} - {app.date}</p>
              </div>
              <button 
              title='Remove Application'
              onClick={() => removeApp(index)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No tracked applications yet.</p>
        )}
      </div>
    </div>
  );
}