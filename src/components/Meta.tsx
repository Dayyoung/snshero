import React, { useEffect } from 'react';
import { ViewType, Language } from '../types';
import { t } from '../lib/i18n';
import {
  getCardKeywords,
  getCardSeoDescription,
  getCardSeoTitle,
  getCardShareImageUrl,
  getWikiSeoDescription,
  getWikiSeoTitle,
  joinKeywords,
} from '../lib/seoContent';

interface MetaProps {
  view: ViewType;
  language: Language;
  /** 카드 상세 페이지용 cardId (wiki-card view 시 사용) */
  cardId?: number;
}

const DEFAULT_SHARE_IMAGE = 'https://snshero.com/logo.jpg';

const getOrCreateMetaTag = (selector: string, attribute: 'name' | 'property', value: string) => {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, value);
    document.head.appendChild(tag);
  }
  return tag;
};

const getOrCreateCanonicalLink = () => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  return link;
};

const buildStructuredData = (view: ViewType, language: Language, title: string, description: string, canonicalUrl: string, shareImage: string, resolvedCardId: number | null) => {
  const baseEntity = {
    '@context': 'https://schema.org',
    '@id': canonicalUrl,
    inLanguage: language,
    url: canonicalUrl,
    name: title,
    description,
    image: shareImage,
    isPartOf: {
      '@type': 'WebSite',
      name: 'SNSHero',
      url: 'https://snshero.com',
    },
  };

  if (view === 'wiki-card' && resolvedCardId) {
    return {
      ...baseEntity,
      '@type': 'Article',
      headline: title,
      articleSection: language === 'ko' ? '카드 도감' : 'Card Encyclopedia',
      keywords: getCardKeywords(resolvedCardId, language),
      about: {
        '@type': 'Thing',
        name: title,
      },
    };
  }

  if (view === 'wiki-howtoplay') {
    return {
      ...baseEntity,
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: t('wiki_howtoplay_faq_q1', language),
          acceptedAnswer: {
            '@type': 'Answer',
            text: language === 'ko' ? t('wiki_howtoplay_faq_a1_ko', language) : t('wiki_howtoplay_faq_a1_en', language),
          },
        },
        {
          '@type': 'Question',
          name: t('wiki_howtoplay_faq_q2', language),
          acceptedAnswer: {
            '@type': 'Answer',
            text: language === 'ko' ? t('wiki_howtoplay_faq_a2_ko', language) : t('wiki_howtoplay_faq_a2_en', language),
          },
        },
      ],
    };
  }

  if (view === 'wiki-tip') {
    return {
      ...baseEntity,
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: t('wiki_tip_faq_q1', language),
          acceptedAnswer: {
            '@type': 'Answer',
            text: language === 'ko' ? t('wiki_tip_faq_a1_ko', language) : t('wiki_tip_faq_a1_en', language),
          },
        },
        {
          '@type': 'Question',
          name: t('wiki_tip_faq_q2', language),
          acceptedAnswer: {
            '@type': 'Answer',
            text: language === 'ko' ? t('wiki_tip_faq_a2_ko', language) : t('wiki_tip_faq_a2_en', language),
          },
        },
      ],
    };
  }

  if (view === 'wiki') {
    return {
      ...baseEntity,
      '@type': 'CollectionPage',
    };
  }

  return {
    ...baseEntity,
    '@type': 'SoftwareApplication',
    operatingSystem: 'All modern web browsers (HTML5)',
    applicationCategory: 'GameApplication',
    genre: 'AI Web Card Game',
    browserRequirements: 'Requires JavaScript. Requires HTML5 Canvas.',
    softwareVersion: '2.1.0',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'SNSHero Team',
      url: 'https://snshero.com',
    },
    featureList: [
      'Instant play via Google Sign-In with 100% no installation or client registration required',
      'Generative AI opponents for comfortable real-time card battles without PvP stress',
      'Supports Bitcoin (BTC), Ethereum (ETH), USDC and global card payments',
      '100 free card draws to collect over 110 charmingly illustrated cards',
      'Instant 1,000 SNS Points reward upon initial login',
    ],
  };
};

export const Meta: React.FC<MetaProps> = ({ view, language, cardId }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyMetadata = () => {
      const currentUrl = new URL(window.location.href);
      const urlCardId = Number(currentUrl.searchParams.get('cardId'));
      const currentCardId = view === 'wiki-card'
        ? (cardId ?? (Number.isFinite(urlCardId) && urlCardId > 0 ? urlCardId : null))
        : null;

      let title = getWikiSeoTitle(view, language);
      let description = getWikiSeoDescription(view, language);
      let shareImage = DEFAULT_SHARE_IMAGE;
      let keywords = '';

      if (view === 'wiki-card' && currentCardId) {
        title = getCardSeoTitle(currentCardId, language);
        description = getCardSeoDescription(currentCardId, language);
        shareImage = getCardShareImageUrl(currentCardId);
        keywords = joinKeywords(getCardKeywords(currentCardId, language));
      } else if (view === 'wiki' || view === 'wiki-howtoplay' || view === 'wiki-tip') {
        keywords = language === 'ko'
          ? '웹 카드게임, 브라우저 카드게임, SNS히어로, 카드 도감, 공략 위키'
          : 'web card game, browser card game, SNSHero, card encyclopedia, strategy wiki';
      }

      currentUrl.searchParams.delete('lang');
      const canonicalUrl = `${currentUrl.origin}${currentUrl.pathname}${currentUrl.search}`;

      document.title = title;

      const metaDescription = getOrCreateMetaTag('meta[name="description"]', 'name', 'description');
      metaDescription.setAttribute('content', description);

      const metaKeywords = getOrCreateMetaTag('meta[name="keywords"]', 'name', 'keywords');
      metaKeywords.setAttribute('content', keywords);

      const ogTitle = getOrCreateMetaTag('meta[property="og:title"]', 'property', 'og:title');
      ogTitle.setAttribute('content', title);

      const ogDescription = getOrCreateMetaTag('meta[property="og:description"]', 'property', 'og:description');
      ogDescription.setAttribute('content', description);

      const ogUrl = getOrCreateMetaTag('meta[property="og:url"]', 'property', 'og:url');
      ogUrl.setAttribute('content', canonicalUrl);

      const ogType = getOrCreateMetaTag('meta[property="og:type"]', 'property', 'og:type');
      ogType.setAttribute('content', view === 'wiki-card' ? 'article' : 'website');

      const ogImage = getOrCreateMetaTag('meta[property="og:image"]', 'property', 'og:image');
      ogImage.setAttribute('content', shareImage);

      const twitterCard = getOrCreateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card');
      twitterCard.setAttribute('content', 'summary_large_image');

      const twitterTitle = getOrCreateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title');
      twitterTitle.setAttribute('content', title);

      const twitterDescription = getOrCreateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description');
      twitterDescription.setAttribute('content', description);

      const twitterImage = getOrCreateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image');
      twitterImage.setAttribute('content', shareImage);

      const canonicalLink = getOrCreateCanonicalLink();
      canonicalLink.setAttribute('href', canonicalUrl);

      let jsonLdScript = document.getElementById('geo-structured-data');
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.setAttribute('id', 'geo-structured-data');
        jsonLdScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLdScript);
      }

      jsonLdScript.textContent = JSON.stringify(
        buildStructuredData(view, language, title, description, canonicalUrl, shareImage, currentCardId),
      );
    };

    applyMetadata();
    window.addEventListener('popstate', applyMetadata);
    window.addEventListener('snshero:meta-refresh', applyMetadata);

    return () => {
      window.removeEventListener('popstate', applyMetadata);
      window.removeEventListener('snshero:meta-refresh', applyMetadata);
    };
  }, [view, language, cardId]);

  return null;
};
