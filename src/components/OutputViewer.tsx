import { useState } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';

interface OutputViewerProps {
  originalText: string;
  newText: string;
}

export default function OutputViewer({ originalText, newText }: OutputViewerProps) {
  const [showDiff, setShowDiff] = useState(true);

  return (
    <div className="pt-4 mt-4 border-t border-slate-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-600">Output</h3>
        <div className="flex items-center gap-2 bg-slate-200 p-1 rounded-lg">
           <button 
             onClick={() => setShowDiff(false)} 
             className={`px-3 py-1 text-xs rounded-md ${!showDiff ? 'bg-white shadow-sm' : ''}`}
           >
             Final
           </button>
           <button 
             onClick={() => setShowDiff(true)}
             className={`px-3 py-1 text-xs rounded-md ${showDiff ? 'bg-white shadow-sm' : ''}`}
           >
            Changes
           </button>
        </div>
      </div>

      <div className="bg-slate-100 rounded-lg p-3 max-h-96 overflow-y-auto text-xs">
        {showDiff ? (
          <ReactDiffViewer
            oldValue={originalText}
            newValue={newText}
            splitView={false}
            compareMethod={DiffMethod.WORDS}
            hideLineNumbers={true}
          />
        ) : (
          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
            {newText}
          </pre>
        )}
      </div>
    </div>
  );
}