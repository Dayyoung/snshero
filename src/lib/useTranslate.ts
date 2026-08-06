import { Language } from '../types';

export const useTranslate = (text: string, language: Language) => {
  return { translated: text, loading: false };
};
