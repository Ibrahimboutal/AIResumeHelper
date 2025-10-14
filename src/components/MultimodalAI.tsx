import { useState } from 'react';
import { Image, Mic, Upload, Loader2, AlertCircle, X } from 'lucide-react';
import { analyzeImage, analyzeAudio, isLocalAIAvailable } from '../services/localAIService';
import { canUseLocalAIFeature } from '../services/subscriptionService';

export default function MultimodalAI() {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiAvailable, setAIAvailable] = useState<boolean | null>(null);

  useState(() => {
    isLocalAIAvailable().then(setAIAvailable);
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setSelectedFile(file);
    setError('');
    setOutput('');
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setAction('Analyzing image');
    setError('');

    try {
      const canUse = await canUseLocalAIFeature('image_analysis');
      if (!canUse.allowed) {
        setError(canUse.reason || 'Usage limit exceeded');
        return;
      }

      const analysis = await analyzeImage(selectedFile, notes);
      setOutput(analysis);
    } catch (err) {
      console.error('Image analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setLoading(false);
      setAction('');
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file');
      return;
    }

    setLoading(true);
    setAction('Analyzing audio');
    setError('');
    setOutput('');

    try {
      const canUse = await canUseLocalAIFeature('audio_analysis');
      if (!canUse.allowed) {
        setError(canUse.reason || 'Usage limit exceeded');
        return;
      }

      const analysis = await analyzeAudio(file);
      setOutput(analysis);
    } catch (err) {
      console.error('Audio analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze audio');
    } finally {
      setLoading(false);
      setAction('');
      event.target.value = '';
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setNotes('');
    setOutput('');
    setError('');
  };

  if (aiAvailable === false) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800 mb-1">
              Chrome AI Not Available
            </p>
            <p className="text-xs text-amber-700">
              Multimodal AI features require Chrome 138+ with Gemini Nano enabled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-slate-700 uppercase mb-2 flex items-center gap-2">
          <Image className="w-4 h-4 text-blue-600" />
          Image Analysis
        </h3>
        <p className="text-xs text-slate-600 mb-3">
          Upload screenshots, diagrams, or documents for AI analysis
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        )}

        {selectedFile ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">{selectedFile.name}</span>
              </div>
              <button
                onClick={clearImage}
                title="Remove image"
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context or specific questions about the image..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-2"
              rows={2}
            />

            <button
              onClick={handleAnalyzeImage}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Image className="w-4 h-4" />
                  Analyze Image
                </>
              )}
            </button>
          </div>
        ) : (
          <label className="block w-full cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Upload className="w-6 h-6 text-slate-400" />
              <p className="text-xs font-medium text-slate-600">Upload Image</p>
              <p className="text-xs text-slate-500">PNG, JPG, or WebP</p>
            </div>
          </label>
        )}
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-xs font-semibold text-slate-700 uppercase mb-2 flex items-center gap-2">
          <Mic className="w-4 h-4 text-emerald-600" />
          Audio Analysis
        </h3>
        <p className="text-xs text-slate-600 mb-3">
          Upload audio recordings for transcription and analysis
        </p>

        <label className="block w-full cursor-pointer">
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            disabled={loading}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
            <Upload className="w-6 h-6 text-slate-400" />
            <p className="text-xs font-medium text-slate-600">Upload Audio</p>
            <p className="text-xs text-slate-500">MP3, WAV, or OGG</p>
          </div>
        </label>
      </div>

      {loading && action && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            {action}...
          </p>
        </div>
      )}

      {output && (
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Analysis Result</h4>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
