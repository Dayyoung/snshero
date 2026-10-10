/**
 * RedditSidebarLeft.tsx
 * 오리지널 레딧 좌측 내비게이션 바 및 모바일 슬라이드 드로어 (한국어 기본 지원)
 */

import React from 'react';
import { 
  Home, 
  TrendingUp, 
  Globe, 
  Gamepad2, 
  Image, 
  Film, 
  BookOpen, 
  Tv, 
  Layers, 
  Swords, 
  Gift, 
  Trophy, 
  Award, 
  Plus, 
  FileText, 
  ShieldCheck, 
  X,
  Sparkles,
  ExternalLink,
  Newspaper
} from 'lucide-react';
import { RedditUserDataState } from '../../lib/reddit/redditTypes';
import { SEED_SUBREDDITS } from '../../data/redditSeedData';
import { RedditPolicyModal } from './RedditPolicyModal';

interface RedditSidebarLeftProps {
  isOpen: boolean;
  currentSubreddit: string;
  userState: RedditUserDataState;
  onSelectSubreddit: (sub: string) => void;
  onClose: () => void;
  onOpenSubmitModal: () => void;
  onOpenCreateCommunity?: () => void;
  onNavigateView?: (view: string) => void;
}

export const RedditSidebarLeft: React.FC<RedditSidebarLeftProps> = ({
  isOpen,
  currentSubreddit,
  userState,
  onSelectSubreddit,
  onClose,
  onOpenSubmitModal,
  onOpenCreateCommunity,
  onNavigateView,
}) => {
  const [policyModalType, setPolicyModalType] = React.useState<'rules' | 'privacy' | null>(null);
  const isDark = userState.theme !== 'light';
  const isKo = userState.language !== 'en';

  // /home 화면에서 제공하는 핵심 컨텐츠 소개 링크 리스트
  const homeContents = [
    { view: 'play', label: isKo ? '게임 아레나 (110종)' : 'Game Arena (110)', badge: isKo ? '인기' : 'Hot', icon: Gamepad2, color: 'text-amber-500' },
    { view: 'webtoon', label: isKo ? '공식 웹툰 라운지' : 'Official Webtoon', badge: isKo ? '무료' : 'Free', icon: Image, color: 'text-emerald-500' },
    { view: 'movie', label: isKo ? '시네마틱 극장' : 'Cinematic Movie', badge: '4K', icon: Film, color: 'text-rose-500' },
    { view: 'novel', label: isKo ? '인터랙티브 웹소설' : 'Interactive Novel', icon: BookOpen, color: 'text-indigo-500' },
    { view: 'anime', label: isKo ? '숏 애니메이션' : 'Short Anime', icon: Tv, color: 'text-purple-500' },
    { view: 'mydeck', label: isKo ? '카드 도감 & 마이덱' : 'Card Codex & Deck', badge: isKo ? '전략' : 'Meta', icon: Layers, color: 'text-violet-500' },
    { view: 'main', label: isKo ? '카단 RPG 어드벤처' : 'Kadan RPG Adventure', icon: Swords, color: 'text-orange-500' },
    { view: 'prediction-market', label: isKo ? '주식 & 스포츠 예측' : 'Prediction Market', icon: TrendingUp, color: 'text-sky-500' },
    { view: 'shop', label: isKo ? '영웅 상점 & 무료소환' : 'Shop & Free Summon', badge: isKo ? '무료' : 'Free', icon: Gift, color: 'text-pink-500' },
    { view: 'ranking', label: isKo ? '명예의 전당 (랭킹)' : 'Hall of Fame', icon: Trophy, color: 'text-amber-400' },
    { view: 'season-hub', label: isKo ? '시즌 패스 허브' : 'Season Pass Hub', icon: Award, color: 'text-teal-500' },
  ];

  const handleNavigateContent = (targetView: string) => {
    if (onNavigateView) {
      onNavigateView(targetView);
      onClose();
    } else {
      window.location.href = '/' + targetView;
    }
  };

  const content = (
    <div className="h-full flex flex-col justify-between overflow-y-auto py-3 px-2 text-xs font-medium select-none scrollbar-thin">
      <div className="space-y-4">
        {/* 1. 피드 섹션 */}
        <div>
          <div className="px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase opacity-50">
            {isKo ? '피드 (Feeds)' : 'Feeds'}
          </div>
          <div className="space-y-0.5">
            {[
              { id: 'popular', label: isKo ? '인기 유머 피드' : 'Popular Humor', icon: TrendingUp },
              { id: 'news', label: isKo ? '실시간 구글 뉴스' : 'Google News', icon: Newspaper },
              { id: 'all', label: isKo ? '전체 피드' : 'All', icon: Globe },
              { id: 'home', label: isKo ? '홈 맞춤 피드' : 'Home', icon: Home },
            ].map((feed) => {
              const Icon = feed.icon;
              const isActive = currentSubreddit.toLowerCase() === feed.id;
              return (
                <button
                  key={feed.id}
                  type="button"
                  onClick={() => {
                    onSelectSubreddit(feed.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl cursor-pointer transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-[#22272B] text-white font-bold'
                        : 'bg-gray-200 text-gray-900 font-bold'
                      : isDark
                      ? 'hover:bg-[#181C1F] text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF4500]' : 'opacity-70'}`} />
                  <span>{feed.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 기존 토픽 대체: /home 화면 핵심 컨텐츠 소개 링크 리스트 */}
        <div>
          <div className="px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase opacity-50 flex items-center justify-between">
            <span>{isKo ? 'SNSHero 컨텐츠 라운지' : 'Core Features'}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#FF4500]/15 text-[#FF4500] font-extrabold">HOME</span>
          </div>
          <div className="space-y-0.5">
            {homeContents.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.view}
                  type="button"
                  onClick={() => handleNavigateContent(c.view)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl cursor-pointer transition-colors group ${
                    isDark
                      ? 'hover:bg-[#181C1F] text-gray-300 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${c.color} group-hover:scale-110 transition-transform`} />
                    <span className="truncate">{c.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {c.badge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        {c.badge}
                      </span>
                    )}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 가입한 커뮤니티 섹션 */}
        <div>
          <div className="flex items-center justify-between px-3.5 py-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase opacity-50">
              {isKo ? '가입한 커뮤니티' : 'Joined'} ({userState.joinedSubreddits.length})
            </span>
            <button
              type="button"
              onClick={onOpenCreateCommunity || onOpenSubmitModal}
              title={isKo ? '새 커뮤니티 만들기' : 'Create Community'}
              className="p-1 rounded-full hover:bg-black/10 cursor-pointer text-[#FF4500]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {userState.joinedSubreddits.map((subName) => {
              const subData = SEED_SUBREDDITS[subName];
              const isActive = currentSubreddit.toLowerCase() === subName.toLowerCase();
              return (
                <button
                  key={subName}
                  type="button"
                  onClick={() => {
                    onSelectSubreddit(subName);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl cursor-pointer transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-[#22272B] text-white font-bold'
                        : 'bg-gray-200 text-gray-900 font-bold'
                      : isDark
                      ? 'hover:bg-[#181C1F] text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {subData?.iconUrl ? (
                    <img
                      src={subData.iconUrl}
                      alt={subName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[#FF4500] font-bold">r/</span>
                  )}
                  <span className="truncate">r/{subName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. 리소스 및 정책 */}
        <div>
          <div className="px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase opacity-50">
            {isKo ? '안내 및 정책' : 'Resources'}
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setPolicyModalType('rules')}
              className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 rounded-xl cursor-pointer transition-colors ${
                isDark ? 'hover:bg-[#181C1F] text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 opacity-70" />
              <span>{isKo ? '커뮤니티 운영 규칙' : 'Community Rules'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPolicyModalType('privacy')}
              className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 rounded-xl cursor-pointer transition-colors ${
                isDark ? 'hover:bg-[#181C1F] text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FileText className="w-4 h-4 opacity-70" />
              <span>{isKo ? '개인정보처리방침' : 'Privacy & Terms'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 하단 푸터 카피라이트 */}
      <div className="px-3.5 pt-6 pb-2 text-[11px] opacity-40 space-y-1">
        <div className="flex items-center gap-1 font-semibold text-[#FF4500]">
          <Sparkles className="w-3 h-3" />
          <span>SNSHero Revolution © 2026</span>
        </div>
        <div>{isKo ? '100% 무비용 정적 웹 커뮤니티' : 'Zero-cost static community engine'}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* PC 고정 사이드바 (lg: 이상) */}
      <aside
        className={`hidden lg:block flex-shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 transition-all duration-200 z-30 ${
          isOpen ? 'w-64 opacity-100 border-r' : 'w-0 opacity-0 overflow-hidden border-none'
        } ${isDark ? 'bg-[#0E1113] border-[#22272B]' : 'bg-white border-gray-200'}`}
      >
        {isOpen && content}
      </aside>

      {/* 모바일/태블릿 슬라이드 드로어 */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div
            className={`relative w-72 max-w-[80vw] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 ${
              isDark ? 'bg-[#0E1113] text-gray-200' : 'bg-white text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-inherit/10">
              <span className="font-extrabold text-base tracking-tight text-[#FF4500]">
                SNS<span className={isDark ? 'text-white' : 'text-gray-900'}>Hero</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}

      {/* 커뮤니티 규칙 & 개인정보처리방침 안내 모달 */}
      {policyModalType && (
        <RedditPolicyModal
          type={policyModalType}
          isDark={isDark}
          isKo={isKo}
          onClose={() => setPolicyModalType(null)}
        />
      )}
    </>
  );
};
