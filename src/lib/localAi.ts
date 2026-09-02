import { Language } from '../types';
import { getRelevantGameKnowledge, getUserGameStateContext } from './gameKnowledgeBase';

export type LocalAiProvider = 'chrome-built-in-ai' | 'smart-fallback';
export type LocalAiState = 'ready' | 'downloadable' | 'downloading' | 'unavailable' | 'error';

export interface LocalAiCapabilityStatus {
  supported: boolean;
  state: LocalAiState;
  provider: LocalAiProvider | null;
  availability: string;
}

interface BuiltInLanguageModelSession {
  prompt: (input: string) => Promise<string>;
  destroy?: () => void;
}

interface BuiltInLanguageModelAPI {
  availability?: () => Promise<string> | string;
  create?: () => Promise<BuiltInLanguageModelSession>;
}

interface BuiltInAiWindow extends Window {
  LanguageModel?: BuiltInLanguageModelAPI;
  ai?: {
    languageModel?: BuiltInLanguageModelAPI;
  };
}

export interface LocalAiPromptOptions {
  prompt: string;
  language: Language;
}

export interface LocalAiPromptResult {
  ok: boolean;
  text: string;
  provider: LocalAiProvider | null;
  capability: LocalAiCapabilityStatus;
  error?: string;
}

const FALLBACK_CAPABILITY: LocalAiCapabilityStatus = {
  supported: false,
  state: 'unavailable',
  provider: null,
  availability: 'unavailable',
};

const RESPONSE_LIMIT = 450;

const getApi = (): BuiltInLanguageModelAPI | null => {
  if (typeof window === 'undefined') return null;

  const builtinWindow = window as BuiltInAiWindow;
  return builtinWindow.LanguageModel ?? builtinWindow.ai?.languageModel ?? null;
};

const normalizeAvailability = (value: string | undefined): LocalAiCapabilityStatus => {
  const normalized = (value ?? 'unavailable').toLowerCase();

  if (normalized === 'readily' || normalized === 'available' || normalized === 'ready') {
    return {
      supported: true,
      state: 'ready',
      provider: 'chrome-built-in-ai',
      availability: normalized,
    };
  }

  if (normalized === 'downloadable' || normalized === 'after-download') {
    return {
      supported: true,
      state: 'downloadable',
      provider: 'chrome-built-in-ai',
      availability: normalized,
    };
  }

  if (normalized === 'downloading') {
    return {
      supported: true,
      state: 'downloading',
      provider: 'chrome-built-in-ai',
      availability: normalized,
    };
  }

  return {
    supported: false,
    state: 'unavailable',
    provider: null,
    availability: normalized,
  };
};

/**
 * Build rich prompt incorporating SNSHero Game Knowledge Base & User State
 */
const buildPrompt = ({ prompt, language }: LocalAiPromptOptions): string => {
  const responseLanguage = language === 'ko' ? 'Korean' : 'English';
  const gameKnowledge = getRelevantGameKnowledge(prompt, language);
  const userContext = getUserGameStateContext(language);

  return [
    'You are the official SNSHero AI Gaming Guide and tactical assistant.',
    `Reply strictly in ${responseLanguage}.`,
    'Answer the user message accurately and concisely using ONLY the provided SNSHero game knowledge base below.',
    'Be enthusiastic, tactical, and friendly like a battle companion.',
    'Keep your response under 3 short sentences or bullet points.',
    '',
    '=== OFFICIAL SNSHERO GAME KNOWLEDGE BASE ===',
    gameKnowledge,
    '',
    userContext ? `=== CURRENT PLAYER STATE ===\n${userContext}\n` : '',
    '=== USER MESSAGE ===',
    prompt,
    '',
    `Your concise ${responseLanguage} answer:`
  ].filter(Boolean).join('\n');
};

const trimResponse = (value: string): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= RESPONSE_LIMIT) return normalized;
  return `${normalized.slice(0, RESPONSE_LIMIT - 1).trimEnd()}…`;
};

export const getLocalAiCapabilityStatus = async (): Promise<LocalAiCapabilityStatus> => {
  const api = getApi();
  if (!api?.availability || !api.create) {
    return FALLBACK_CAPABILITY;
  }

  try {
    const rawAvailability = await api.availability();
    return normalizeAvailability(rawAvailability);
  } catch (error) {
    console.warn('Chrome built-in AI availability check failed:', error);
    return {
      supported: false,
      state: 'error',
      provider: null,
      availability: 'error',
    };
  }
};

/**
 * Generate smart knowledge-base guided reply for fallback environments
 */
export const generateSmartKnowledgeReply = (options: LocalAiPromptOptions): string => {
  const { prompt, language } = options;
  const isEn = language !== 'ko';
  const knowledge = getRelevantGameKnowledge(prompt, language);

  if (isEn) {
    return `[SNSHero Tactical Guide] 💡 ${knowledge.split('\n')[1] || knowledge}`;
  } else {
    const firstDetail = knowledge.split('\n')[1] || knowledge;
    return `[SNS히어로 가이드] 💡 ${firstDetail.replace(/^-\s*/, '')}`;
  }
};

export const requestLocalAiReply = async (options: LocalAiPromptOptions): Promise<LocalAiPromptResult> => {
  const api = getApi();
  const capability = await getLocalAiCapabilityStatus();

  if (!api?.create || capability.state !== 'ready') {
    return {
      ok: false,
      text: '',
      provider: null,
      capability,
      error: capability.state,
    };
  }

  let session: BuiltInLanguageModelSession | null = null;

  try {
    session = await api.create();
    const rawResponse = await session.prompt(buildPrompt(options));
    const text = trimResponse(rawResponse);

    return {
      ok: Boolean(text),
      text,
      provider: 'chrome-built-in-ai',
      capability,
    };
  } catch (error) {
    console.warn('Chrome built-in AI prompt failed:', error);
    return {
      ok: false,
      text: '',
      provider: null,
      capability: {
        ...capability,
        state: 'error',
      },
      error: error instanceof Error ? error.message : 'unknown-error',
    };
  } finally {
    try {
      session?.destroy?.();
    } catch (destroyError) {
      console.warn('Chrome built-in AI session cleanup failed:', destroyError);
    }
  }
};
