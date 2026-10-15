import React, { useEffect } from 'react';
import { getRouteMeta } from '../routes';
import type { ViewType, Language } from '../types';

interface MetaProps {
  view: string;
  language: string;
}

const upsertMetaTag = (selector: string, attrName: 'name' | 'property', attrValue: string, content: string) => {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertCanonicalLink = (href: string) => {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

export const Meta: React.FC<MetaProps> = ({ view, language }) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      const meta = getRouteMeta(view as ViewType, (language as Language) || 'ko');
      if (meta?.title) {
        document.title = meta.title;
        upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', meta.title);
        upsertMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
      }
      if (meta?.description) {
        upsertMetaTag('meta[name="description"]', 'name', 'description', meta.description);
        upsertMetaTag('meta[property="og:description"]', 'property', 'og:description', meta.description);
        upsertMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
      }
      if (meta?.url) {
        upsertCanonicalLink(meta.url);
        upsertMetaTag('meta[property="og:url"]', 'property', 'og:url', meta.url);
        upsertMetaTag('meta[name="twitter:url"]', 'name', 'twitter:url', meta.url);
      }
    } catch {}
  }, [view, language]);

  return null;
};

export default Meta;

