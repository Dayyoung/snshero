/**
 * RedditCreateCommunityModal.tsx
 * 오리지널 레딧 신규 커뮤니티(서브레딧) 생성 모달
 */

import React, { useState } from 'react';
import { X, Globe, Lock, Shield, Sparkles } from 'lucide-react';
import { RedditSubreddit } from '../../lib/reddit/redditTypes';

interface RedditCreateCommunityModalProps {
  isOpen: boolean;
  isDark: boolean;
  isKo?: boolean;
  onClose: () => void;
  onCreateCommunity: (community: RedditSubreddit) => void;
}

export const RedditCreateCommunityModal: React.FC<RedditCreateCommunityModalProps> = ({
  isOpen,
  isDark,
  isKo = true,
  onClose,
  onCreateCommunity,
}) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [communityType, setCommunityType] = useState<'public' | 'restricted' | 'private'>('public');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/^r\//, '').replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanName) return;

    const newCommunity: RedditSubreddit = {
      name: cleanName,
      title: title.trim() || `r/${cleanName}`,
      description: description.trim() || (isKo 
        ? `r/${cleanName} 커뮤니티에 오신 것을 환영합니다! 자유롭게 이야기하고 소통해보세요.` 
        : `Welcome to r/${cleanName}!`),
      bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
      subscribers: 1,
      onlineCount: 1,
      createdAt: Date.now(),
      isJoined: true,
      rules: isKo ? [
        { number: 1, title: 'SNSHero 커뮤니티 가이드라인 준수', description: '상호 존중과 배려의 클린 토론 문화를 지켜주세요.' },
        { number: 2, title: '주제에 맞는 게시물 작성', description: `r/${cleanName} 커뮤니티의 주제에 맞는 글을 작성해주세요.` },
        { number: 3, title: '스팸 및 도배 금지', description: '광고성 도배는 즉시 삭제됩니다.' },
      ] : [
        { number: 1, title: 'Follow SNSHero Guidelines', description: 'Be respectful to community members.' },
        { number: 2, title: 'Keep posts relevant', description: `All posts must be related to r/${cleanName}.` },
        { number: 3, title: 'No spam', description: 'Spam will be removed.' },
      ],
      moderators: ['SNSHeroPlayer'],
    };

    onCreateCommunity(newCommunity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-inherit/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF4500]" />
            <h2 className="font-extrabold text-base">
              {isKo ? '새 커뮤니티 만들기' : 'Create a Community'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 생성 폼 */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* 커뮤니티 이름 */}
          <div>
            <label className="block font-bold mb-1">
              {isKo ? '커뮤니티 이름' : 'Name'}
            </label>
            <p className="opacity-60 text-[11px] mb-2">
              {isKo ? '영문자, 숫자, 밑줄(_)만 사용 가능하며 변경할 수 없습니다.' : 'Community names cannot be changed.'}
            </p>
            <div className={`flex items-center rounded-xl border px-3 py-2 ${
              isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
            }`}>
              <span className="font-bold text-[#FF4500] mr-1">r/</span>
              <input
                type="text"
                required
                maxLength={25}
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder={isKo ? "커뮤니티_이름" : "community_name"}
                className="w-full bg-transparent outline-none font-bold text-xs sm:text-sm"
              />
            </div>
            <div className="text-[10px] opacity-40 mt-1 text-right">
              {25 - name.length} {isKo ? '자 남음' : 'Characters remaining'}
            </div>
          </div>

          {/* 커뮤니티 타이틀 */}
          <div>
            <label className="block font-bold mb-1">
              {isKo ? '커뮤니티 제목 / 슬로건' : 'Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isKo ? "예: 한국 인디 게임 개발자 모임" : "e.g. Korea Indie Game Developers"}
              className={`w-full px-3 py-2 rounded-xl border outline-none font-medium text-xs sm:text-sm ${
                isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
              }`}
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block font-bold mb-1">
              {isKo ? '커뮤니티 소개 및 설명' : 'Description'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isKo ? "커뮤니티의 목적과 주제를 자유롭게 작성해주세요." : "Describe what this community is about."}
              className={`w-full p-3 rounded-xl border outline-none resize-none font-sans text-xs sm:text-sm ${
                isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
              }`}
            />
          </div>

          {/* 커뮤니티 타입 */}
          <div>
            <label className="block font-bold mb-2">
              {isKo ? '공개 범위 설정' : 'Community Type'}
            </label>
            <div className="space-y-2">
              {[
                { id: 'public', title: isKo ? '공개 (Public)' : 'Public', desc: isKo ? '누구나 게시물을 보고 참여할 수 있습니다.' : 'Anyone can view, post, and comment to this community.', icon: Globe },
                { id: 'restricted', title: isKo ? '제한 (Restricted)' : 'Restricted', desc: isKo ? '누구나 볼 수 있지만 승인된 사용자만 작성할 수 있습니다.' : 'Anyone can view, but only approved users can post.', icon: Shield },
                { id: 'private', title: isKo ? '비공개 (Private)' : 'Private', desc: isKo ? '초대된 멤버만 볼 수 있습니다.' : 'Only approved users can view and submit to this community.', icon: Lock },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = communityType === item.id;
                return (
                  <label
                    key={item.id}
                    onClick={() => setCommunityType(item.id as any)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#FF4500] bg-[#FF4500]/5'
                        : isDark ? 'border-[#2E363E] hover:bg-[#22272B]' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="communityType"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 accent-[#FF4500]"
                    />
                    <div className="flex-1">
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <Icon className="w-3.5 h-3.5 text-[#FF4500]" />
                        <span>{item.title}</span>
                      </div>
                      <div className="text-[11px] opacity-60 mt-0.5">{item.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-2 pt-3 border-t border-inherit/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              {isKo ? '취소' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 rounded-full bg-[#FF4500] disabled:opacity-40 text-white font-extrabold cursor-pointer hover:bg-[#FF5414] shadow-md transition-all"
            >
              {isKo ? '커뮤니티 만들기' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
