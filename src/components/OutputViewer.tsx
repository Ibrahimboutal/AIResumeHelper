import { useState } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { Copy, Download, Save, Eye, FileText, Maximize2 } from 'lucide-react';

interface OutputViewerProps {
  originalText: string;
  newText: string;
  title?: string;
  showActions?: boolean;
  onCopy?: () => void;
  onDownload?: () => void;
}

type ViewMode = 'final' | 'diff' | 'split' | 'original';

export default function OutputViewer({
  originalText,
  newText,
  title = 'Output',
  showActions = true,
  onCopy,
  onDownload
}: OutputViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('diff');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(newText);
    if (onCopy) onCopy();
  };

  const handleDownload = () => {
    const blob = new Blob([newText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    if (onDownload) onDownload();
  };

  const getChangeStats = () => {
    const originalWords = originalText.trim().split(/\s+/);
    const newWords = newText.trim().split(/\s+/);
    const added = newWords.length - originalWords.length;
    return { added, originalCount: originalWords.length, newCount: newWords.length };
  };

  const stats = getChangeStats();

  const customStyles = {
    variables: {
      dark: {
        diffViewerBackground: '#1e293b',
        addedBackground: '#064e3b',
        addedColor: '#d1fae5',
        removedBackground: '#7f1d1d',
        removedColor: '#fecaca',
        wordAddedBackground: '#065f46',
        wordRemovedBackground: '#991b1b',
        addedGutterBackground: '#064e3b',
        removedGutterBackground: '#7f1d1d',
        gutterBackground: '#0f172a',
        gutterBackgroundDark: '#0f172a',
        highlightBackground: '#1e40af',
        highlightGutterBackground: '#1e3a8a',
      },
      light: {
        diffViewerBackground: '#f8fafc',
        addedBackground: '#dcfce7',
        addedColor: '#166534',
        removedBackground: '#fee2e2',
        removedColor: '#991b1b',
        wordAddedBackground: '#bbf7d0',
        wordRemovedBackground: '#fecaca',
        addedGutterBackground: '#dcfce7',
        removedGutterBackground: '#fee2e2',
        gutterBackground: '#e2e8f0',
        gutterBackgroundDark: '#cbd5e1',
        highlightBackground: '#dbeafe',
        highlightGutterBackground: '#bfdbfe',
      },
    },
  };

  return (
    <div className="pt-4 mt-4 border-t border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="bg-slate-200 px-2 py-0.5 rounded">
              {stats.newCount} words
            </span>
            {stats.added !== 0 && (
              <span className={`px-2 py-0.5 rounded ${
                stats.added > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {stats.added > 0 ? '+' : ''}{stats.added}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showActions && (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-2 py-1.5 rounded transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-2 py-1.5 rounded transition-colors"
                title="Download as text file"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-2 py-1.5 rounded transition-colors"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mb-3">
        <button
          onClick={() => setViewMode('diff')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
            viewMode === 'diff'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Changes
        </button>
        <button
          onClick={() => setViewMode('split')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
            viewMode === 'split'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Split
        </button>
        <button
          onClick={() => setViewMode('final')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
            viewMode === 'final'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          Final
        </button>
        <button
          onClick={() => setViewMode('original')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
            viewMode === 'original'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Original
        </button>
      </div>

      <div
        className={`bg-white rounded-lg border border-slate-200 overflow-hidden transition-all ${
          isExpanded ? 'max-h-[600px]' : 'max-h-96'
        }`}
      >
        <div className="overflow-y-auto h-full">
          {viewMode === 'diff' && (
            <ReactDiffViewer
              oldValue={originalText}
              newValue={newText}
              splitView={false}
              compareMethod={DiffMethod.WORDS}
              hideLineNumbers={false}
              showDiffOnly={false}
              useDarkTheme={false}
              styles={customStyles}
              leftTitle="Original"
              rightTitle="Modified"
            />
          )}
          {viewMode === 'split' && (
            <ReactDiffViewer
              oldValue={originalText}
              newValue={newText}
              splitView={true}
              compareMethod={DiffMethod.WORDS}
              hideLineNumbers={false}
              showDiffOnly={false}
              useDarkTheme={false}
              styles={customStyles}
              leftTitle="Original"
              rightTitle="Modified"
            />
          )}
          {viewMode === 'final' && (
            <div className="p-4">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {newText}
              </pre>
            </div>
          )}
          {viewMode === 'original' && (
            <div className="p-4">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {originalText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}