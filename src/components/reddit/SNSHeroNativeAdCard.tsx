/**
 * SNSHeroNativeAdCard.tsx
 * 노골적인 광고 대신 카드 공략, 공식 웹툰, 시네마틱 영화, 인터랙티브 웹소설, 게임 아레나를
 * 네이티브하게 간접 소개하는 고품질 스폰서드 콘텐츠 쇼케이스 카드
 */

import React, { useMemo, useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  BookOpen, 
  Film, 
  Gamepad2, 
  Check, 
  Eye, 
  Star 
} from 'lucide-react';

export type NativeAdType = 'card' | 'webtoon' | 'movie' | 'novel' | 'game';

interface NativeAdItem {
  type: NativeAdType;
  badge: { ko: string; en: string };
  flair: { ko: string; en: string; color: string };
  title: { ko: string; en: string };
  snippet: { ko: string; en: string };
  imageUrl: string;
  ctaText: { ko: string; en: string };
  tags: string[];
  rating: string;
  targetView: string;
  score: number;
  comments: number;
}

const NATIVE_ADS: NativeAdItem[] = [
  {
    type: 'card',
    badge: { ko: '영웅 카드 메타 분석', en: 'Hero Card Spotlight' },
    flair: { ko: '🃏 카드 공략 / Guide', en: '🃏 Strategy Guide', color: '#8B5CF6' },
    title: {
      ko: '이번 시즌 아레나 랭커들의 원픽! [카단 & 아케인 에코] 하이브리드 시너지 덱 완벽 가이드',
      en: 'Season 1 Ranked Meta: [Kadan & Arcane Echo] Hybrid Synergy Deck Full Strategy Guide',
    },
    snippet: {
      ko: '전방 물리 탱킹과 후방 광역 연쇄 마법 폭딜을 동시에 챙기는 국민 덱 세팅입니다. 특히 3성 잠재력 개방 시 해금되는 "시공 왜곡" 패시브가 치명타율을 45%까지 끌어올립니다. 도감에서 카드 스킬 확인하고 나만의 마이덱을 편성해보세요!',
      en: 'A meta-defining hybrid setup balancing physical frontline defense and explosive backline AoE magic. Unlocking the 3-star passive "Time Distortion" boosts team critical rate by +45%. Explore the card codex and forge your ultimate deck!',
    },
    imageUrl: '/banner_snshero_legend.jpg',
    ctaText: { ko: '카드 도감 & 마이덱 공략 보기', en: 'View Card Codex & My Deck' },
    tags: ['전투력 S+', '하이브리드 덱', '무료 육성'],
    rating: '★ 4.9 (1.2k+ 리뷰)',
    targetView: 'mydeck',
    score: 14800,
    comments: 420,
  },
  {
    type: 'webtoon',
    badge: { ko: '공식 웹툰 프리뷰', en: 'Official Webtoon Premiere' },
    flair: { ko: '🎨 공식 웹툰 / Webtoon', en: '🎨 Official Webtoon', color: '#10B981' },
    title: {
      ko: '[웹툰 1화 무료 공개] "카단과 시공의 균열: 기억을 잃은 전설의 기사와 인공지능 요정" - 정주행 시작하기',
      en: '[Ep. 1 Free] "Kadan & The Rift of Time: The Amnesiac Knight and AI Fairy" - Read Now',
    },
    snippet: {
      ko: '멸망 위기에 처한 디지털 대륙을 구하기 위해 깨어난 소년 카단. 왜 그의 검에는 잃어버린 기억의 파편이 깃들어 있을까? 매주 수/일 연재되는 SNSHero 오리지널 웹툰의 첫 에피소드를 지금 무료로 감상해보세요.',
      en: 'Awakened to save a digital realm on the brink of ruin, why does young Kadan possess shards of forgotten memories in his blade? Dive into Episode 1 of SNSHero official full-color webtoon series for free today.',
    },
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    ctaText: { ko: '웹툰 1화 무료 감상하기', en: 'Read Episode 1 for Free' },
    tags: ['풀컬러 고화질', '주 2회 연재', '평점 9.9'],
    rating: '★ 4.95 (3.4k+ 독자)',
    targetView: 'webtoon',
    score: 21500,
    comments: 680,
  },
  {
    type: 'movie',
    badge: { ko: '3D 시네마틱 극장', en: '3D Cinematic Theater' },
    flair: { ko: '🎥 시네마틱 / Movie', en: '🎥 Cinematic Movie', color: '#EF4444' },
    title: {
      ko: '[공식 4K 클립] 극장판 시네마틱 오프닝: 아케인 타워의 최후 결전 & 드래곤 소환 명장면 프리뷰',
      en: '[Official 4K] Cinematic Movie Opening: The Final Siege of Arcane Tower & Dragon Awakening',
    },
    snippet: {
      ko: '압도적인 3D 연출과 웅장한 오케스트라 사운드트랙! 시공의 수호자들과 암흑 드래곤 군단의 격돌을 담아낸 SNSHero 공식 시네마틱 무비 클립을 풀스크린으로 감상하세요.',
      en: 'Breathtaking 3D animation paired with an orchestral soundtrack! Watch the full-screen cinematic preview depicting the clash between Guardians of Time and the Dark Dragon Legion.',
    },
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
    ctaText: { ko: '시네마틱 영상 감상하기', en: 'Watch Cinematic Movie' },
    tags: ['4K UHD', '극장판 애니', '돌비 사운드'],
    rating: '★ 4.98 (5.1k+ 추천)',
    targetView: 'movie',
    score: 32400,
    comments: 890,
  },
  {
    type: 'novel',
    badge: { ko: '인터랙티브 웹소설', en: 'Interactive Web Novel' },
    flair: { ko: '📖 웹소설 / Novel', en: '📖 Fantasy Novel', color: '#6366F1' },
    title: {
      ko: '[인기 판타지 소설] "차원 유랑 히어로의 은퇴 생활" 1화: 차원을 넘나드는 기사단장의 비밀',
      en: '[Trending Novel] "Retired Life of the Dimensional Hero" Ch. 1: The Commander\'s Secret',
    },
    snippet: {
      ko: '‘세계를 구하고 마침내 은퇴했는데... 또 다른 차원의 소환진이 열렸다?!’ 독자의 선택에 따라 전개가 달라지는 인터랙티브 웹소설을 만나보세요. 1~3화 무료 정주행 가능!',
      en: '"I saved the universe and finally retired... only to be summoned by another dimension?!" Experience an interactive web novel where your choices shape the narrative. Free chapters available now!',
    },
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
    ctaText: { ko: '웹소설 1화 정주행하기', en: 'Read Chapter 1 Now' },
    tags: ['인터랙티브', '스토리 뷰어', '무료 열람'],
    rating: '★ 4.88 (890+ 서평)',
    targetView: 'novel',
    score: 18900,
    comments: 310,
  },
  {
    type: 'game',
    badge: { ko: '캐주얼 게임 아레나', en: 'Casual Game Arena' },
    flair: { ko: '🎮 게임 아레나 / Arcade', en: '🎮 Mini-Game Arena', color: '#F59E0B' },
    title: {
      ko: '[점심시간 3분 컷] 설치 없이 브라우저에서 바로 즐기는 110가지 원터치 모바일 미니게임 배틀 모음',
      en: '[Zero Download 3-Min Play] 110 Mobile One-Touch Casual Mini-Games Battle Arena',
    },
    snippet: {
      ko: '카드 러시, 소서리, 퍼즐, 점퍼까지! 조이스틱 없이 터치 한 번으로 즐기는 모바일 100% 최적화 미니게임 110종이 전면 무료로 제공됩니다. 매일 쏟아지는 SNS 포인트 보상과 시즌 랭킹에 도전해보세요.',
      en: 'Card Rush, Sorcery, Flip, Puzzle, and Jumper! Enjoy 110 pure touch-optimized mini-games playable instantly without downloading. Earn daily SNS points and climb seasonal leaderboards.',
    },
    imageUrl: '/banner_snshero_legend.jpg',
    ctaText: { ko: '지금 미니게임 플레이하기', en: 'Play Mini-Games Now' },
    tags: ['설치 0초', '110개 게임', '일일 보상'],
    rating: '★ 4.92 (12k+ 플레이)',
    targetView: 'play',
    score: 28400,
    comments: 950,
  },
];

interface SNSHeroNativeAdCardProps {
  isDark: boolean;
  isKo?: boolean;
  adIndex?: number;
  onNavigateView: (view: string) => void;
}

export const SNSHeroNativeAdCard: React.FC<SNSHeroNativeAdCardProps> = ({
  isDark,
  isKo = true,
  adIndex = 0,
  onNavigateView,
}) => {
  const [userScoreDelta, setUserScoreDelta] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // adIndex에 따라 5대 간접광고 템플릿 순환 노출
  const ad = useMemo(() => {
    const idx = Math.abs(adIndex) % NATIVE_ADS.length;
    return NATIVE_ADS[idx];
  }, [adIndex]);

  const handleVote = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    setUserScoreDelta((prev) => (prev === delta ? 0 : delta));
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.origin + '/' + ad.targetView);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardClick = () => {
    onNavigateView(ad.targetView);
  };

  const displayScore = ad.score + userScoreDelta;

  return (
    <article
      onClick={handleCardClick}
      className={`group relative rounded-2xl border mb-3.5 transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md select-none ${
        isDark
          ? 'bg-[#15191C] hover:bg-[#181D21] border-[#2A3035] text-[#D7DADC]'
          : 'bg-white hover:bg-slate-50 border-gray-200 text-[#1C1C1C]'
      }`}
    >
      <div className="flex">
        {/* 1. 좌측 보팅 컬럼 (Reddit 네이티브 스타일) */}
        <div className={`hidden sm:flex flex-col items-center py-3 px-2 w-12 flex-shrink-0 ${
          isDark ? 'bg-[#101315]/60' : 'bg-gray-50/70'
        }`}>
          <button
            type="button"
            onClick={(e) => handleVote(e, 1)}
            title={isKo ? '추천' : 'Upvote'}
            className={`p-1 rounded hover:bg-black/10 transition-colors cursor-pointer ${
              userScoreDelta === 1 ? 'text-[#FF4500]' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <span className={`text-[11px] font-bold my-1 ${
            userScoreDelta === 1 ? 'text-[#FF4500]' : userScoreDelta === -1 ? 'text-[#7193FF]' : 'opacity-80'
          }`}>
            {displayScore > 1000 ? `${(displayScore / 1000).toFixed(1)}k` : displayScore}
          </span>
          <button
            type="button"
            onClick={(e) => handleVote(e, -1)}
            title={isKo ? '비추천' : 'Downvote'}
            className={`p-1 rounded hover:bg-black/10 transition-colors cursor-pointer ${
              userScoreDelta === -1 ? 'text-[#7193FF]' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* 2. 우측 콘텐츠 영역 */}
        <div className="flex-1 p-3.5 sm:p-4 min-w-0">
          {/* 상단 메타 바 */}
          <div className="flex items-center justify-between text-xs mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* 스폰서드 / 프로모티드 마커 */}
              <span className="font-extrabold text-[11px] text-[#FF4500] flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 animate-pulse" />
                r/SNSHero
              </span>
              <span className="opacity-40">•</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                {isKo ? '추천 콘텐츠' : 'Promoted'}
              </span>
              <span className="opacity-40">•</span>
              <span className="text-[11px] opacity-60">u/SNSHero_Official</span>

              {/* 카테고리 플레어 */}
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white ml-1"
                style={{ backgroundColor: ad.flair.color }}
              >
                {isKo ? ad.flair.ko : ad.flair.en}
              </span>
            </div>

            {/* 평점 / 뱃지 */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span>{ad.rating}</span>
            </div>
          </div>

          {/* 제목 */}
          <h3 className="font-extrabold text-sm sm:text-base leading-snug mb-2 group-hover:text-[#FF4500] transition-colors">
            {isKo ? ad.title.ko : ad.title.en}
          </h3>

          {/* 본문 요약 (간접 소개 텍스트) */}
          <p className="text-xs sm:text-sm opacity-80 leading-relaxed mb-3 line-clamp-3 font-sans">
            {isKo ? ad.snippet.ko : ad.snippet.en}
          </p>

          {/* 미디어 이미지 (고화질 썸네일) */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl overflow-hidden mb-3 border border-inherit/30 bg-black/60 shadow-inner">
            <img
              src={ad.imageUrl}
              alt={isKo ? ad.title.ko : ad.title.en}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/banner_snshero_legend.jpg';
              }}
            />
            {/* 호버 시 은은한 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-white text-xs font-bold flex items-center gap-1.5 drop-shadow">
                <Eye className="w-3.5 h-3.5" />
                {isKo ? '클릭하여 자세히 보기' : 'Click to explore'}
              </span>
            </div>
          </div>

          {/* 하단 태그 및 액션 CTA 버튼 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-inherit/20">
            {/* 태그 리스트 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {ad.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* CTA 액션 버튼 */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 rounded-lg hover:bg-black/10 text-xs font-semibold opacity-70 hover:opacity-100 flex items-center gap-1 transition-all"
                title={isKo ? '공유하기' : 'Share'}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? (isKo ? '복사됨' : 'Copied') : (isKo ? '공유' : 'Share')}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateView(ad.targetView);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#FF4500] hover:bg-[#FF5414] text-white font-extrabold text-xs shadow-sm hover:shadow transition-all cursor-pointer group/btn"
              >
                <span>{isKo ? ad.ctaText.ko : ad.ctaText.en}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
