/**
 * RedditSidebarRight.tsx
 * 오리지널 레딧 우측 사이드바 (한국어 기본 지원)
 * 커뮤니티 정보, 규칙, 트렌딩 순위 및 구글 애드센스 300x250 배너 탑재
 */

import React, { useState } from 'react';
import { 
  Users, 
  Circle, 
  Calendar, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { RedditSubreddit, RedditUserDataState } from '../../lib/reddit/redditTypes';
import { SEED_SUBREDDITS } from '../../data/redditSeedData';
import { AdSenseBanner } from '../AdSenseBanner';

interface RedditSidebarRightProps {
  subredditData: RedditSubreddit;
  userState: RedditUserDataState;
  onSelectSubreddit: (sub: string) => void;
  onToggleJoin: (subName: string) => void;
  onOpenSubmitModal: () => void;
}

export const RedditSidebarRight: React.FC<RedditSidebarRightProps> = ({
  subredditData,
  userState,
  onSelectSubreddit,
  onToggleJoin,
  onOpenSubmitModal,
}) => {
  const isDark = userState.theme !== 'light';
  const isKo = userState.language !== 'en';
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  const isJoined = userState.joinedSubreddits.some(
    (s) => s.toLowerCase() === subredditData.name.toLowerCase()
  );

  const topCommunities = ['hanguk', 'gaming', 'technology', 'AskReddit', 'memes'];

  return (
    <aside className="w-80 flex-shrink-0 space-y-4 text-xs font-sans">
      {/* 1. 커뮤니티 소개 박스 */}
      <div className={`rounded-2xl border p-4 shadow-sm ${
        isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-inherit/10">
          <span className="font-bold text-sm tracking-tight">
            {['popular', 'all', 'home'].includes(subredditData.name.toLowerCase()) 
              ? (isKo ? 'SNSHero 커뮤니티' : 'About SNSHero') 
              : `r/${subredditData.name}`}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF4500]/10 text-[#FF4500]">
            {isKo ? '공식 커뮤니티' : 'Community'}
          </span>
        </div>

        {/* 설명 */}
        <p className="mt-3 text-xs leading-relaxed opacity-80">
          {subredditData.description}
        </p>

        {/* 멤버 수 & 온라인 통계 */}
        <div className="mt-4 grid grid-cols-2 gap-2 py-3 border-y border-inherit/10">
          <div>
            <div className="font-extrabold text-base">
              {(subredditData.subscribers + (isJoined ? 1 : 0)).toLocaleString()}
            </div>
            <div className="text-[10px] opacity-60 flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{isKo ? '멤버 수' : 'Members'}</span>
            </div>
          </div>
          <div>
            <div className="font-extrabold text-base flex items-center gap-1.5 text-emerald-400">
              <Circle className="w-2 h-2 fill-current animate-pulse" />
              <span>{subredditData.onlineCount.toLocaleString()}</span>
            </div>
            <div className="text-[10px] opacity-60">{isKo ? '현재 온라인' : 'Online'}</div>
          </div>
        </div>

        {/* 개설일 */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] opacity-50">
          <Calendar className="w-3.5 h-3.5" />
          <span>{isKo ? '개설일:' : 'Created on'} {new Date(subredditData.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Join / Create Post 액션 버튼 */}
        <div className="mt-4 space-y-2">
          {!['popular', 'all', 'home'].includes(subredditData.name.toLowerCase()) && (
            <button
              type="button"
              onClick={() => onToggleJoin(subredditData.name)}
              className={`w-full py-2 rounded-full font-bold text-xs cursor-pointer transition-all ${
                isJoined
                  ? isDark
                    ? 'border border-gray-600 hover:border-red-500 hover:text-red-400 text-gray-300'
                    : 'border border-gray-300 hover:border-red-500 hover:text-red-500 text-gray-700'
                  : 'bg-[#FF4500] hover:bg-[#FF5414] text-white shadow-md'
              }`}
            >
              {isJoined ? (isKo ? '가입됨' : 'Joined') : (isKo ? '커뮤니티 가입' : 'Join Community')}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSubmitModal}
            className={`w-full py-2 rounded-full font-bold text-xs cursor-pointer border transition-colors flex items-center justify-center gap-1.5 ${
              isDark
                ? 'bg-[#22272B] border-[#2E363E] hover:bg-[#2C3238] text-white'
                : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4 text-[#FF4500]" />
            <span>{isKo ? '게시물 작성' : 'Create Post'}</span>
          </button>
        </div>
      </div>

      {/* 2. 구글 애드센스 (Google AdSense) 300x250 반응형 직사각형 디스플레이 광고 */}
      <div className={`rounded-2xl border p-3 shadow-sm overflow-hidden ${
        isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4500]">
            {isKo ? '스폰서 광고' : 'Sponsored Advertisement'}
          </span>
          <span className="text-[9px] opacity-40">Ad</span>
        </div>
        <div className="min-h-[250px] w-full flex items-center justify-center rounded-xl bg-black/5 overflow-hidden">
          <AdSenseBanner
            format="rectangle"
            responsive={true}
            className="w-full flex justify-center"
          />
        </div>
      </div>

      {/* 3. 커뮤니티 규칙 (Rules) 아코디언 */}
      {subredditData.rules && subredditData.rules.length > 0 && (
        <div className={`rounded-2xl border p-4 shadow-sm ${
          isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
        }`}>
          <div className="font-bold text-sm tracking-tight mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
            <span>r/{subredditData.name} {isKo ? '커뮤니티 규칙' : 'Rules'}</span>
          </div>
          <div className="space-y-1.5">
            {subredditData.rules.map((rule) => {
              const isOpen = expandedRule === rule.number;
              return (
                <div
                  key={rule.number}
                  className={`rounded-xl border transition-colors ${
                    isDark ? 'border-[#2E363E] bg-[#0E1113]/40' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedRule(isOpen ? null : rule.number)}
                    className="w-full px-3 py-2 text-left font-semibold text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate pr-2">
                      {rule.number}. {rule.title}
                    </span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-2.5 text-[11px] leading-relaxed opacity-70 border-t border-inherit/10 pt-1.5">
                      {rule.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. 인기 트렌딩 커뮤니티 TOP 5 */}
      <div className={`rounded-2xl border p-4 shadow-sm ${
        isDark ? 'bg-[#181C1F] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        <div className="font-bold text-sm tracking-tight mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#FF4500]" />
          <span>{isKo ? '실시간 인기 커뮤니티' : 'Trending Communities'}</span>
        </div>
        <div className="space-y-2.5">
          {topCommunities.map((subKey, idx) => {
            const sub = SEED_SUBREDDITS[subKey];
            const isSubJoined = userState.joinedSubreddits.includes(subKey);
            return (
              <div key={subKey} className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelectSubreddit(subKey)}
                  className="flex items-center gap-2 cursor-pointer group text-left"
                >
                  <span className="font-extrabold text-xs opacity-40 w-3">{idx + 1}</span>
                  {sub?.iconUrl && (
                    <img src={sub.iconUrl} alt={subKey} className="w-5 h-5 rounded-full object-cover" />
                  )}
                  <div>
                    <div className="font-bold text-xs group-hover:text-[#FF4500] transition-colors">
                      r/{subKey}
                    </div>
                    <div className="text-[10px] opacity-50">
                      {sub?.subscribers ? `${(sub.subscribers / 1000000).toFixed(1)}M ${isKo ? '멤버' : 'members'}` : ''}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleJoin(subKey)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    isSubJoined
                      ? isDark
                        ? 'border border-gray-600 text-gray-300'
                        : 'border border-gray-300 text-gray-700'
                      : 'bg-[#FF4500] text-white hover:bg-[#FF5414]'
                  }`}
                >
                  {isSubJoined ? (isKo ? '가입됨' : 'Joined') : (isKo ? '가입' : 'Join')}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 스티키 Google AdSense 300x250 반응형 직사각형 디스플레이 광고 */}
      <div className={`sticky top-20 rounded-2xl border p-3 shadow-sm overflow-hidden ${
        isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4500]">
            {isKo ? '스폰서 광고' : 'Sponsored Advertisement'}
          </span>
          <span className="text-[9px] opacity-40">Ad</span>
        </div>
        <div className="min-h-[250px] w-full flex items-center justify-center rounded-xl bg-black/5 overflow-hidden">
          <AdSenseBanner
            format="rectangle"
            responsive={true}
            className="w-full flex justify-center"
          />
        </div>
      </div>

      {/* 6. 정책 푸터 */}
      <div className="px-2 text-[11px] opacity-40 space-y-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#about" className="hover:underline">{isKo ? '이용약관' : 'User Agreement'}</a>
          <a href="#privacy" className="hover:underline">{isKo ? '개인정보처리방침' : 'Privacy Policy'}</a>
          <a href="#content" className="hover:underline">{isKo ? '콘텐츠 정책' : 'Content Policy'}</a>
        </div>
        <div>SNSHero Community Inc. © 2026. All rights reserved.</div>
      </div>
    </aside>
  );
};
