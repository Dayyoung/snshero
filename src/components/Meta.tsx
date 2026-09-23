import React, { useEffect } from 'react';
import { getRouteMeta } from '../routes';

interface MetaProps {
  view: string;
  language: string;
}

export const Meta: React.FC<MetaProps> = ({ view, language }) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      const meta = getRouteMeta(view, language);
      if (meta?.title) {
        document.title = meta.title;
      }
    } catch {}
  }, [view, language]);

  return null;
};

export default Meta;
