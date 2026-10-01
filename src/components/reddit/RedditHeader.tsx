/**
 * RedditHeader.tsx
 * 오리지널 레딧 최신 스타일 헤더
 * Reddit 마크와 단어는 모두 SNSHero 게임마크 및 SNSHero 로고로 변경
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  Plus, 
  Bell, 
  MessageCircle, 
  ChevronDown, 
  Moon, 
  Sun, 
  User, 
  Sparkles, 
  TrendingUp, 
  Gamepad2,
  X,
  Compass
} from 'lucide-react';
import { RedditUserDataState } from '../../lib/reddit/redditTypes';
import { SEED_SUBREDDITS } from '../../data/redditSeedData';

interface RedditHeaderProps {
  currentSubreddit: string;
  userState: RedditUserDataState;
  onSelectSubreddit: (sub: string) => void;
  onOpenSubmitModal: () => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onSearch: (query: string) => void;
  onGoToGame: () => void;
  onOpenUserProfile: (username: string) => void;
}

export const RedditHeader: React.FC<RedditHeaderProps> = ({
  currentSubreddit,
  userState,
  onSelectSubreddit,
  onOpenSubmitModal,
  onToggleSidebar,
  onToggleTheme,
  onSearch,
  onGoToGame,
  onOpenUserProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(true);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const communityDropdownRef = useRef<HTMLDivElement>(null);

  const isDark = userState.theme !== 'light';

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (communityDropdownRef.current && !communityDropdownRef.current.contains(e.target as Node)) {
        setIsCommunityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setIsSearchFocused(false);
    }
  };

  const trendingSearches = ['Unreal Engine 5', 'Optical computing', 'Ethereum scaling', 'Cyberpunk setup', 'MAPPA anime'];

  return (
    <header className={`sticky top-0 z-40 h-14 border-b flex items-center justify-between px-3 sm:px-4 transition-colors duration-150 ${
      isDark 
        ? 'bg-[#0E1113] border-[#22272B] text-[#D7DADC]' 
        : 'bg-white border-gray-200 text-[#1C1C1C]'
    }`}>
      {/* 1. 좌측: 햄버거 메뉴 + SNSHero 로고 + 커뮤니티 셀렉터 */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            isDark ? 'hover:bg-[#22272B] text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* SNSHero 브랜드 로고 & 마크 (Reddit Snoo 자리 완벽 대체) */}
        <button
          type="button"
          onClick={() => onSelectSubreddit('popular')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF4500] to-[#FF5722] flex items-center justify-center shadow-md overflow-hidden ring-2 ring-[#FF4500]/30 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tighter text-[#FF4500] font-sans">
              SNS<span className={isDark ? 'text-white' : 'text-gray-900'}>Hero</span>
            </span>
          </div>
        </button>

        {/* 현재 피드/서브레딧 드롭다운 (PC 화면) */}
        <div className="relative hidden md:block" ref={communityDropdownRef}>
          <button
            type="button"
            onClick={() => setIsCommunityDropdownOpen(!isCommunityDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
              isDark 
                ? 'bg-[#181C1F] border-[#2A3238] hover:bg-[#22272B] text-gray-200' 
                : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#FF4500]" />
            <span className="max-w-[120px] truncate">
              {['popular', 'all', 'home'].includes(currentSubreddit.toLowerCase())
                ? currentSubreddit.toUpperCase()
                : `r/${currentSubreddit}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {isCommunityDropdownOpen && (
            <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl border shadow-2xl py-2 z-50 text-xs overflow-hidden backdrop-blur-md ${
              isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}>
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-50">Feeds</div>
              {['Home', 'Popular', 'All'].map((feed) => (
                <button
                  key={feed}
                  type="button"
                  onClick={() => {
                    onSelectSubreddit(feed.toLowerCase());
                    setIsCommunityDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 cursor-pointer font-medium flex items-center justify-between ${
                    isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'
                  }`}
                >
                  <span>{feed}</span>
                  {currentSubreddit.toLowerCase() === feed.toLowerCase() && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                  )}
                </button>
              ))}

              <div className="my-1 border-t opacity-10" />
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-50">Popular Subreddits</div>
              {Object.keys(SEED_SUBREDDITS).slice(0, 6).map((subKey) => (
                <button
                  key={subKey}
                  type="button"
                  onClick={() => {
                    onSelectSubreddit(subKey);
                    setIsCommunityDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 cursor-pointer font-medium flex items-center gap-2 ${
                    isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-[#FF4500] font-bold">r/</span>
                  <span className="truncate">{subKey}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. 중앙: 글로벌 스마트 검색바 */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-6 relative" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search SNSHero..."
            className={`w-full h-9 sm:h-10 pl-10 pr-8 rounded-full text-xs sm:text-sm font-normal outline-none transition-all ${
              isDark
                ? 'bg-[#181C1F] hover:bg-[#22272B] focus:bg-[#0E1113] focus:ring-1 focus:ring-[#FF4500] text-gray-100 border border-transparent focus:border-[#FF4500]'
                : 'bg-gray-100 hover:bg-gray-200 focus:bg-white focus:ring-1 focus:ring-[#FF4500] text-gray-900 border border-transparent focus:border-[#FF4500]'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 opacity-50 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* 검색 자동완성 & 트렌딩 검색어 드롭다운 */}
        {isSearchFocused && (
          <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl py-3 z-50 overflow-hidden backdrop-blur-xl ${
            isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className="px-4 py-1 text-[11px] font-bold tracking-wider uppercase opacity-50 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>Trending on SNSHero</span>
            </div>
            {trendingSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSearchQuery(item);
                  onSearch(item);
                  setIsSearchFocused(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs sm:text-sm cursor-pointer flex items-center justify-between transition-colors ${
                  isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 opacity-40" />
                  <span>{item}</span>
                </div>
                <span className="text-[10px] opacity-40">Search</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. 우측: 포스트 작성(+) + 채팅 + 알림 + 프로필 아바타 & 메뉴 */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* 새 글 작성 (+) 버튼 */}
        <button
          type="button"
          onClick={onOpenSubmitModal}
          aria-label="Create Post"
          className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
            isDark
              ? 'bg-[#22272B] hover:bg-[#2C3238] text-gray-100'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          <Plus className="w-4 h-4 text-[#FF4500]" />
          <span className="hidden sm:inline">Create</span>
        </button>

        {/* 채팅 버튼 */}
        <button
          type="button"
          aria-label="Chat"
          className={`p-2 rounded-full cursor-pointer transition-colors relative ${
            isDark ? 'hover:bg-[#22272B] text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => alert('SNSHero Realtime Chat: Connecting to community channel...')}
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* 알림 버튼 */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setHasUnreadNotif(false)}
          className={`p-2 rounded-full cursor-pointer transition-colors relative ${
            isDark ? 'hover:bg-[#22272B] text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Bell className="w-5 h-5" />
          {hasUnreadNotif && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF4500] ring-2 ring-[#0E1113]" />
          )}
        </button>

        {/* 프로필 아바타 드롭다운 메뉴 */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full cursor-pointer hover:ring-2 hover:ring-[#FF4500]/50 transition-all"
          >
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-[#FF4500] flex items-center justify-center text-white font-bold text-xs shadow-inner">
              <User className="w-4 h-4" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0E1113]" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-60 hidden sm:block" />
          </button>

          {isProfileMenuOpen && (
            <div className={`absolute top-full right-0 mt-2 w-64 rounded-2xl border shadow-2xl py-3 z-50 text-xs overflow-hidden backdrop-blur-xl ${
              isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}>
              {/* 유저 정보 요약 헤더 */}
              <div className="px-4 py-2 border-b border-inherit/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-[#FF4500] flex items-center justify-center text-white font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">u/SNSHeroPlayer</div>
                    <div className="text-[11px] opacity-60 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#FF4500]" />
                      <span>Karma: 4,820</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 메뉴 목록 */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenUserProfile('SNSHeroPlayer');
                    setIsProfileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 cursor-pointer ${
                    isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4 text-sky-400" />
                  <span>View Profile</span>
                </button>

                {/* 다크 모드 / 라이트 모드 전환 토글 */}
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between cursor-pointer ${
                    isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>Dark Mode</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-[#2E363E] text-[#FF4500]' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {isDark ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div className="my-1 border-t opacity-10" />

                {/* 기존 게임 로비 바로가기 */}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onGoToGame();
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 cursor-pointer text-[#FF4500] font-bold ${
                    isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>SNSHero Game Lobby</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
