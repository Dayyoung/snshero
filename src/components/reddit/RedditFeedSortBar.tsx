/**
 * RedditFeedSortBar.tsx
 * 오리지널 레딧 피드 정렬 바 및 뷰 모드 선택기 (한국어 기본 지원)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Flame, 
  Rocket, 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  ChevronDown, 
  LayoutList, 
  Columns, 
  Menu 
} from 'lucide-react';
import { FeedSortType, TimeFilterType, ViewModeType } from '../../lib/reddit/redditTypes';

interface RedditFeedSortBarProps {
  currentSort: FeedSortType;
  currentTimeFilter: TimeFilterType;
  currentViewMode: ViewModeType;
  isDark: boolean;
  isKo?: boolean;
  onSelectSort: (sort: FeedSortType) => void;
  onSelectTimeFilter: (filter: TimeFilterType) => void;
  onSelectViewMode: (mode: ViewModeType) => void;
}

export const RedditFeedSortBar: React.FC<RedditFeedSortBarProps> = ({
  currentSort,
  currentTimeFilter,
  currentViewMode,
  isDark,
  isKo = true,
  onSelectSort,
  onSelectTimeFilter,
  onSelectViewMode,
}) => {
  const [isTopDropdownOpen, setIsTopDropdownOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  const topDropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topDropdownRef.current && !topDropdownRef.current.contains(e.target as Node)) {
        setIsTopDropdownOpen(false);
      }
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target as Node)) {
        setIsViewDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortItems: { id: FeedSortType; labelKo: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'new', labelKo: '최신순', labelEn: 'New', icon: Sparkles },
    { id: 'hot', labelKo: '인기순', labelEn: 'Hot', icon: Flame },
    { id: 'top', labelKo: '추천순', labelEn: 'Top', icon: Trophy },
    { id: 'best', labelKo: '최고', labelEn: 'Best', icon: Rocket },
    { id: 'rising', labelKo: '상승 중', labelEn: 'Rising', icon: TrendingUp },
  ];

  const timeFilters: { id: TimeFilterType; labelKo: string; labelEn: string }[] = [
    { id: 'now', labelKo: '지금', labelEn: 'Now' },
    { id: 'today', labelKo: '오늘', labelEn: 'Today' },
    { id: 'week', labelKo: '이번 주', labelEn: 'This Week' },
    { id: 'month', labelKo: '이번 달', labelEn: 'This Month' },
    { id: 'year', labelKo: '올해', labelEn: 'This Year' },
    { id: 'all', labelKo: '전체 기간', labelEn: 'All Time' },
  ];

  return (
    <div className={`rounded-2xl border p-2 mb-4 w-full max-w-full overflow-hidden flex items-center justify-between shadow-sm transition-colors ${
      isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
    }`}>
      {/* 1. 정렬 칩 목록 */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 mr-2">
        {sortItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSort === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSort(item.id);
                if (item.id === 'top') {
                  setIsTopDropdownOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all flex-shrink-0 ${
                isActive
                  ? isDark
                    ? 'bg-[#272D32] text-white shadow-sm'
                    : 'bg-gray-200 text-gray-900 shadow-sm'
                  : isDark
                  ? 'hover:bg-[#22272B] text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF4500]' : 'opacity-70'}`} />
              <span>{isKo ? item.labelKo : item.labelEn}</span>
            </button>
          );
        })}

        {/* Top 시간 필터 드롭다운 */}
        {currentSort === 'top' && (
          <div className="relative" ref={topDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTopDropdownOpen(!isTopDropdownOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border ${
                isDark ? 'bg-[#22272B] border-[#2E363E] text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-800'
              }`}
            >
              <span>
                {isKo 
                  ? timeFilters.find((f) => f.id === currentTimeFilter)?.labelKo || '오늘' 
                  : timeFilters.find((f) => f.id === currentTimeFilter)?.labelEn || 'Today'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {isTopDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1.5 w-36 rounded-xl border shadow-xl py-1 z-30 text-xs overflow-hidden backdrop-blur-md ${
                isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
              }`}>
                {timeFilters.map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => {
                      onSelectTimeFilter(tf.id);
                      setIsTopDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 cursor-pointer font-medium ${
                      currentTimeFilter === tf.id ? 'text-[#FF4500] font-bold' : ''
                    } ${isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'}`}
                  >
                    {isKo ? tf.labelKo : tf.labelEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. 뷰 모드 토글 */}
      <div className="relative flex-shrink-0" ref={viewDropdownRef}>
        <button
          type="button"
          onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            isDark ? 'hover:bg-[#22272B] text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          }`}
          title={isKo ? "보기 모드 변경" : "Change View Mode"}
        >
          {currentViewMode === 'card' && <Columns className="w-4 h-4" />}
          {currentViewMode === 'classic' && <LayoutList className="w-4 h-4" />}
          {currentViewMode === 'compact' && <Menu className="w-4 h-4" />}
        </button>

        {isViewDropdownOpen && (
          <div className={`absolute top-full right-0 mt-1.5 w-40 rounded-xl border shadow-xl py-1 z-30 text-xs overflow-hidden backdrop-blur-md ${
            isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            {[
              { id: 'card', labelKo: '카드 보기', labelEn: 'Card View', icon: Columns },
              { id: 'classic', labelKo: '클래식 보기', labelEn: 'Classic View', icon: LayoutList },
              { id: 'compact', labelKo: '컴팩트 보기', labelEn: 'Compact View', icon: Menu },
            ].map((vm) => {
              const Icon = vm.icon;
              return (
                <button
                  key={vm.id}
                  type="button"
                  onClick={() => {
                    onSelectViewMode(vm.id as ViewModeType);
                    setIsViewDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 cursor-pointer font-medium flex items-center gap-2 ${
                    currentViewMode === vm.id ? 'text-[#FF4500] font-bold' : ''
                  } ${isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-100'}`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-70" />
                  <span>{isKo ? vm.labelKo : vm.labelEn}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
