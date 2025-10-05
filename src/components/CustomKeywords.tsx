import { useState, useEffect } from 'react';
import { Tag, Plus, X } from 'lucide-react';

export default function CustomKeywords() {
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(['customKeywords'], (result) => {
      if (result.customKeywords) {
        setCustomKeywords(result.customKeywords);
      }
    });
  }, []);

  const handleAddKeyword = () => {
    if (newKeyword && !customKeywords.includes(newKeyword)) {
      const updatedKeywords = [...customKeywords, newKeyword];
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Custom Keywords
      </h2>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Add a keyword..."
          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm"
        />
        <button
          onClick={handleAddKeyword}
          title="Add Keyword"
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {customKeywords.map((keyword, index) => (
          <span
            key={index}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-medium"
          >
            {keyword}
            <button 
            title='Remove Keyword'
            onClick={() => handleRemoveKeyword(keyword)}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}