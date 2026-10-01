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
  Cpu, 
  HelpCircle, 
  Smile, 
  Coins, 
  Monitor, 
  Heart, 
  Plus, 
  FileText, 
  ShieldCheck, 
  X,
  Sparkles,
  Compass
} from 'lucide-react';
import { RedditUserDataState } from '../../lib/reddit/redditTypes';
import { SEED_SUBREDDITS } from '../../data/redditSeedData';

interface RedditSidebarLeftProps {
  isOpen: boolean;
  currentSubreddit: string;
  userState: RedditUserDataState;
  onSelectSubreddit: (sub: string) => void;
  onClose: () => void;
  onOpenSubmitModal: () => void;
}

export const RedditSidebarLeft: React.FC<RedditSidebarLeftProps> = ({
  isOpen,
  currentSubreddit,
  userState,
  onSelectSubreddit,
  onClose,
  onOpenSubmitModal,
}) => {
  const isDark = userState.theme !== 'light';
  const isKo = userState.language !== 'en';

  const topics = [
    { name: 'hanguk', label: isKo ? '한국 커뮤니티' : 'Korea Community', icon: Compass },
    { name: 'gaming', label: isKo ? '게임 아레나' : 'Gaming', icon: Gamepad2 },
    { name: 'technology', label: isKo ? '테크 & AI' : 'Technology', icon: Cpu },
    { name: 'AskReddit', label: isKo ? '무엇이든 질문' : 'Ask Reddit', icon: HelpCircle },
    { name: 'memes', label: isKo ? '유머 & 밈' : 'Memes', icon: Smile },
    { name: 'pcmasterrace', label: isKo ? '데스크셋업/PC' : 'PC Master Race', icon: Monitor },
    { name: 'aww', label: isKo ? '귀여운 동물/힐링' : 'Aww Animals', icon: Heart },
    { name: 'CryptoCurrency', label: isKo ? '암호화폐/Web3' : 'Crypto', icon: Coins },
  ];

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
              { id: 'popular', label: isKo ? '인기 피드' : 'Popular', icon: TrendingUp },
              { id: 'all', label: isKo ? '전체 피드' : 'All', icon: Globe },
              { id: 'home', label: isKo ? '홈 피드' : 'Home', icon: Home },
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

        {/* 2. 주제별 서브레딧 섹션 */}
        <div>
          <div className="px-3.5 py-1.5 text-[10px] font-bold tracking-wider uppercase opacity-50">
            {isKo ? '주제별 탐색 (Topics)' : 'Topics'}
          </div>
          <div className="space-y-0.5">
            {topics.map((t) => {
              const Icon = t.icon;
              const isActive = currentSubreddit.toLowerCase() === t.name.toLowerCase();
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    onSelectSubreddit(t.name);
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
                  <span className="truncate">r/{t.label}</span>
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
              onClick={onOpenSubmitModal}
              title={isKo ? '새 글 작성' : 'Create Post'}
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
            <a
              href="#rules"
              onClick={(e) => { e.preventDefault(); alert(isKo ? 'SNSHero 커뮤니티 가이드라인: 100% 무료, 상호 존중 및 클린 토론 문화.' : 'SNSHero Guidelines'); }}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl cursor-pointer transition-colors ${
                isDark ? 'hover:bg-[#181C1F] text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 opacity-70" />
              <span>{isKo ? '커뮤니티 운영 규칙' : 'Community Rules'}</span>
            </a>
            <a
              href="#privacy"
              onClick={(e) => { e.preventDefault(); alert(isKo ? '개인정보 보호 정책: 모든 사용자 인터랙션은 브라우저 로컬스토리지에 안전하게 보관됩니다.' : 'Privacy Policy'); }}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl cursor-pointer transition-colors ${
                isDark ? 'hover:bg-[#181C1F] text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FileText className="w-4 h-4 opacity-70" />
              <span>{isKo ? '개인정보처리방침' : 'Privacy & Terms'}</span>
            </a>
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
        className={`hidden lg:block w-64 flex-shrink-0 h-[calc(100vh-3.5rem)] sticky top-14 border-r transition-all duration-200 z-30 ${
          isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'
        } ${isDark ? 'bg-[#0E1113] border-[#22272B]' : 'bg-white border-gray-200'}`}
      >
        {isOpen && content}
      </aside>

      {/* 모바일/태블릿 슬라이드 드로어 */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
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
    </>
  );
};
