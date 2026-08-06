import React from 'react';
import { useTranslate } from '../lib/useTranslate';
import { Language } from '../types';

interface TranslatedTextProps {
  text: string;
  language: Language;
  className?: string;
  as?: any;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  text, 
  language, 
  className = '', 
  as: Component = 'span' 
}) => {
  const { translated, loading } = useTranslate(text, language);

  return (
    <Component className={className}>
      {loading ? (
        <span className="opacity-50 animate-pulse">...</span>
      ) : (
        translated
      )}
    </Component>
  );
};
