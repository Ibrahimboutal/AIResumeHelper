import { supabase } from '../lib/supabase';

declare global {
  interface Window {
    ai?: {
      languageModel?: {
        create(options?: LanguageModelOptions): Promise<LanguageModelSession>;
        capabilities(): Promise<LanguageModelCapabilities>;
      };
    };
    translation?: {
      createTranslator(options: TranslationOptions): Promise<Translator>;
      canTranslate(options: TranslationOptions): Promise<string>;
    };
  }
}

interface LanguageModelOptions {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}

interface LanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

interface LanguageModelSession {
  prompt(input: string | PromptInput): Promise<string>;
  promptStreaming(input: string | PromptInput): ReadableStream;
  destroy(): void;
}

interface PromptInput {
  text: string;
  image?: Blob;
  audio?: Blob;
}

interface TranslationOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

interface Translator {
  translate(text: string): Promise<string>;
  destroy(): void;
}

export type LocalAIFeatureType =
  | 'prompt'
  | 'proofread'
  | 'summarize'
  | 'translate'
  | 'write'
  | 'rewrite'
  | 'image_analysis'
  | 'audio_analysis';

let session: LanguageModelSession | null = null;

async function checkChromeAIAvailability(): Promise<boolean> {
  if (!window.ai?.languageModel) {
    return false;
  }

  try {
    const capabilities = await window.ai.languageModel.capabilities();
    return capabilities.available === 'readily' || capabilities.available === 'after-download';
  } catch {
    return false;
  }
}

async function initializeSession(): Promise<LanguageModelSession> {
  if (session) {
    return session;
  }

  const available = await checkChromeAIAvailability();
  if (!available) {
    throw new Error('Chrome on-device AI is not available. Please ensure you are using Chrome 138+ with Gemini Nano enabled.');
  }

  if (!window.ai?.languageModel) {
    throw new Error('Language Model API not available');
  }

  session = await window.ai.languageModel.create({
    temperature: 0.7,
    topK: 40,
  });

  return session;
}

async function checkUsageLimit(featureType: LocalAIFeatureType): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('can_use_local_ai_feature', {
    p_user_id: user.id,
    p_feature_type: featureType,
  });

  if (error) {
    console.error('Error checking usage limit:', error);
    throw new Error('Failed to check usage limit');
  }

  if (!data.allowed) {
    throw new Error(data.reason || 'Usage limit exceeded');
  }
}

async function recordUsage(featureType: LocalAIFeatureType, inputLength: number = 0): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase.rpc('record_local_ai_usage', {
    p_user_id: user.id,
    p_feature_type: featureType,
    p_input_length: inputLength,
  });

  if (error) {
    console.error('Error recording usage:', error);
  }
}

export async function promptUser(prompt: string): Promise<string> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  await checkUsageLimit('prompt');
  const aiSession = await initializeSession();
  const result = await aiSession.prompt(prompt);
  await recordUsage('prompt', prompt.length);

  return result;
}

export async function proofreadText(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  await checkUsageLimit('proofread');

  const prompt = `You are a professional proofreader. Carefully review the following text and correct any grammar, spelling, punctuation, and style errors. Maintain the original meaning and tone. Return only the corrected text without explanations.

Text to proofread:
${text}

Corrected text:`;

  const aiSession = await initializeSession();
  const result = await aiSession.prompt(prompt);
  await recordUsage('proofread', text.length);

  return result.trim();
}

export async function summarizeText(text: string, type: 'short' | 'medium' | 'detailed' = 'medium'): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  await checkUsageLimit('summarize');

  const lengthMap = {
    short: '2-3 sentences',
    medium: '1 paragraph (4-6 sentences)',
    detailed: '2-3 paragraphs with key points',
  };

  const prompt = `Summarize the following text in ${lengthMap[type]}. Focus on the main points and key information.

Text:
${text}

Summary:`;

  const aiSession = await initializeSession();
  const result = await aiSession.prompt(prompt);
  await recordUsage('summarize', text.length);

  return result.trim();
}

export async function translateText(text: string, targetLang: 'en' | 'es' | 'ja'): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  await checkUsageLimit('translate');

  const langMap = {
    en: 'English',
    es: 'Spanish',
    ja: 'Japanese',
  };

  if (window.translation?.createTranslator) {
    try {
      const canTranslate = await window.translation.canTranslate({
        sourceLanguage: 'en',
        targetLanguage: targetLang,
      });

      if (canTranslate === 'readily' || canTranslate === 'after-download') {
        const translator = await window.translation.createTranslator({
          sourceLanguage: 'en',
          targetLanguage: targetLang,
        });
        const result = await translator.translate(text);
        translator.destroy();
        await recordUsage('translate', text.length);
        return result;
      }
    } catch (error) {
      console.warn('Translation API failed, falling back to prompt API:', error);
    }
  }

  const prompt = `Translate the following text to ${langMap[targetLang]}. Maintain the tone, style, and formatting. Return only the translation without explanations.

Text to translate:
${text}

Translation:`;

  const aiSession = await initializeSession();
  const result = await aiSession.prompt(prompt);
  await recordUsage('translate', text.length);

  return result.trim();
}

export async function writeText(prompt: string, context?: string): Promise<string> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  await checkUsageLimit('write');

  const fullPrompt = context
    ? `${context}\n\nWrite the following:\n${prompt}`
    : `Write the following:\n${prompt}`;

  const aiSession = await initializeSession();
  const result = await aiSession.prompt(fullPrompt);
  await recordUsage('write', prompt.length);

  return result.trim();
}

export async function rewriteText(text: string, style?: 'professional' | 'casual' | 'concise' | 'detailed'): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  await checkUsageLimit('rewrite');

  const styleInstructions = {
    professional: 'Rewrite in a professional, formal tone suitable for business communications.',
    casual: 'Rewrite in a casual, conversational tone while maintaining clarity.',
    concise: 'Rewrite in a concise manner, removing unnecessary words while keeping all key information.',
    detailed: 'Rewrite with more detail and elaboration, expanding on key points.',
  };

  const instruction = style ? styleInstructions[style] : 'Rewrite with improved clarity and flow.';

  const prompt = `${instruction}

Original text:
${text}

Rewritten text:`;

  const aiSession = await initializeSession();
  const result = await aiSession.prompt(prompt);
  await recordUsage('rewrite', text.length);

  return result.trim();
}

export async function analyzeImage(file: File, notes?: string): Promise<string> {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Invalid image file');
  }

  await checkUsageLimit('image_analysis');

  const aiSession = await initializeSession();

  const basePrompt = 'Analyze this image and provide a detailed description. Focus on relevant details for a job application or resume context.';
  const fullPrompt = notes
    ? `${basePrompt}\n\nAdditional context: ${notes}\n\nAnalysis:`
    : `${basePrompt}\n\nAnalysis:`;

  try {
    const result = await aiSession.prompt({
      text: fullPrompt,
      image: file,
    });
    await recordUsage('image_analysis', file.size);
    return result.trim();
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error('Failed to analyze image. Multimodal support may not be available.');
  }
}

export async function analyzeAudio(file: File): Promise<string> {
  if (!file || !file.type.startsWith('audio/')) {
    throw new Error('Invalid audio file');
  }

  await checkUsageLimit('audio_analysis');

  const aiSession = await initializeSession();

  const prompt = 'Transcribe and analyze this audio recording. Provide the transcription and any relevant insights for job application purposes.';

  try {
    const result = await aiSession.prompt({
      text: prompt,
      audio: file,
    });
    await recordUsage('audio_analysis', file.size);
    return result.trim();
  } catch (error) {
    console.error('Audio analysis error:', error);
    throw new Error('Failed to analyze audio. Multimodal support may not be available.');
  }
}

export async function getLocalAIUsageStats(): Promise<Record<LocalAIFeatureType, { used: number; limit: number | null }>> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('get_local_ai_usage_stats', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching usage stats:', error);
    throw new Error('Failed to fetch usage stats');
  }

  return data || {};
}

export async function isLocalAIAvailable(): Promise<boolean> {
  return checkChromeAIAvailability();
}

export function destroySession(): void {
  if (session) {
    session.destroy();
    session = null;
  }
}
