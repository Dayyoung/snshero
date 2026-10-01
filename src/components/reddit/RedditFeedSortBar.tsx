/**
 * RedditFeedSortBar.tsx
 * 오리지널 레딧 피드 정렬 바 및 뷰 모드(Card / Classic / Compact) 선택기
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
  onSelectSort: (sort: FeedSortType) => void;
  onSelectTimeFilter: (filter: TimeFilterType) => void;
  onSelectViewMode: (mode: ViewModeType) => void;
}

export const RedditFeedSortBar: React.FC<RedditFeedSortBarProps> = ({
  currentSort,
  currentTimeFilter,
  currentViewMode,
  isDark,
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

  const sortItems: { id: FeedSortType; label: string; icon: React.ElementType }[] = [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Sparkles },
    { id: 'top', label: 'Top', icon: Trophy },
    { id: 'best', label: 'Best', icon: Rocket },
    { id: 'rising', label: 'Rising', icon: TrendingUp },
  ];

  const timeFilters: { id: TimeFilterType; label: string }[] = [
    { id: 'now', label: 'Now' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className={`rounded-2xl border p-2 mb-4 flex items-center justify-between shadow-sm transition-colors ${
      isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
    }`}>
      {/* 1. 정렬 칩 목록 */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
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
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Top 시간 필터 드롭다운 (Top이 활성화되었을 때) */}
        {currentSort === 'top' && (
          <div className="relative" ref={topDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTopDropdownOpen(!isTopDropdownOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border ${
                isDark ? 'bg-[#22272B] border-[#2E363E] text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-800'
              }`}
            >
              <span>{timeFilters.find((f) => f.id === currentTimeFilter)?.label || 'Today'}</span>
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
                    {tf.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. 뷰 모드 토글 (Card / Classic / Compact) */}
      <div className="relative flex-shrink-0" ref={viewDropdownRef}>
        <button
          type="button"
          onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
          className={`p-2 rounded-full cursor-pointer transition-colors ${
            isDark ? 'hover:bg-[#22272B] text-gray-300' : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Change View Mode"
        >
          {currentViewMode === 'card' && <Columns className="w-4 h-4" />}
          {currentViewMode === 'classic' && <LayoutList className="w-4 h-4" />}
          {currentViewMode === 'compact' && <Menu className="w-4 h-4" />}
        </button>

        {isViewDropdownOpen && (
          <div className={`absolute top-full right-0 mt-1.5 w-36 rounded-xl border shadow-xl py-1 z-30 text-xs overflow-hidden backdrop-blur-md ${
            isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            {[
              { id: 'card', label: 'Card View', icon: Columns },
              { id: 'classic', label: 'Classic View', icon: LayoutList },
              { id: 'compact', label: 'Compact View', icon: Menu },
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
                  <span>{vm.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
