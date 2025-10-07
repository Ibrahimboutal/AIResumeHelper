import { useState, useEffect } from 'react';
import { Tag, Plus, X, Upload, Download, Sparkles } from 'lucide-react';

const PRESET_CATEGORIES = {
  'Software Engineering': [
    'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes',
    'REST API', 'GraphQL', 'Microservices', 'Agile', 'CI/CD'
  ],
  'Data Science': [
    'Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Pandas',
    'Data Analysis', 'Statistics', 'Deep Learning', 'NLP'
  ],
  'Product Management': [
    'Product Strategy', 'Roadmap', 'Agile', 'Scrum', 'User Research', 'A/B Testing',
    'Analytics', 'Product Launch', 'Stakeholder Management'
  ],
  'Marketing': [
    'SEO', 'Content Marketing', 'Social Media', 'Analytics', 'Campaign Management',
    'Brand Strategy', 'Marketing Automation', 'Lead Generation'
  ]
};

export default function CustomKeywords() {
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(['customKeywords'], (result) => {
      if (result.customKeywords) {
        setCustomKeywords(result.customKeywords);
      }
    });
  }, []);

  const handleAddKeyword = () => {
    if (newKeyword && !customKeywords.includes(newKeyword.trim())) {
      const updatedKeywords = [...customKeywords, newKeyword.trim()];
      setCustomKeywords(updatedKeywords);
      chrome.storage.sync.set({ customKeywords: updatedKeywords });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const updatedKeywords = customKeywords.filter(k => k !== keywordToRemove);
    setCustomKeywords(updatedKeywords);
    chrome.storage.sync.set({ customKeywords: updatedKeywords });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddKeyword();
    }
  };

  const addPresetCategory = (category: string) => {
    const presets = PRESET_CATEGORIES[category as keyof typeof PRESET_CATEGORIES];
    const newKeywords = presets.filter(k => !customKeywords.includes(k));
    const updatedKeywords = [...customKeywords, ...newKeywords];
    setCustomKeywords(updatedKeywords);
    chrome.storage.sync.set({ customKeywords: updatedKeywords });
  };

  const exportKeywords = () => {
    const data = JSON.stringify(customKeywords, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-keywords.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importKeywords = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const merged = [...new Set([...customKeywords, ...imported])];
          setCustomKeywords(merged);
          chrome.storage.sync.set({ customKeywords: merged });
        }
      } catch (error) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all custom keywords?')) {
      setCustomKeywords([]);
      chrome.storage.sync.set({ customKeywords: [] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Custom Keywords ({customKeywords.length})
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Presets
            </button>

            <input
              type="file"
              accept=".json"
              onChange={importKeywords}
              className="hidden"
              id="import-keywords"
            />
            <label
              htmlFor="import-keywords"
              className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Import
            </label>

            <button
              onClick={exportKeywords}
              disabled={customKeywords.length === 0}
              className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1 rounded disabled:opacity-50 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-3">
          Add custom keywords to enhance job posting analysis. These will be highlighted alongside built-in keywords.
        </p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a custom keyword..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleAddKeyword}
            disabled={!newKeyword.trim()}
            title="Add Keyword"
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showPresets && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-2">Quick Add by Category:</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRESET_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => addPresetCategory(category)}
                  className="text-xs bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 min-h-[60px] max-h-64 overflow-y-auto">
          {customKeywords.length > 0 ? (
            customKeywords.map((keyword, index) => (
              <span
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-medium"
              >
                {keyword}
                <button
                  title="Remove Keyword"
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="hover:text-blue-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic w-full text-center py-4">
              No custom keywords yet. Add some to enhance job analysis!
            </p>
          )}
        </div>

        {customKeywords.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <button
              onClick={clearAll}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              Clear All Keywords
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
