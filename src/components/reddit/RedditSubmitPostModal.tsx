/**
 * RedditSubmitPostModal.tsx
 * 오리지널 레딧 신규 포스트 작성 모달 (한국어 기본 지원)
 */

import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Link2, 
  ChevronDown 
} from 'lucide-react';
import { RedditPost, RedditUserDataState, PostFlair } from '../../lib/reddit/redditTypes';
import { SEED_SUBREDDITS } from '../../data/redditSeedData';
import { AdSenseBanner } from '../AdSenseBanner';

interface RedditSubmitPostModalProps {
  initialSubreddit?: string;
  userState: RedditUserDataState;
  onClose: () => void;
  onSubmitPost: (post: RedditPost) => void;
}

export const RedditSubmitPostModal: React.FC<RedditSubmitPostModalProps> = ({
  initialSubreddit = 'hanguk',
  userState,
  onClose,
  onSubmitPost,
}) => {
  const isDark = userState.theme !== 'light';
  const isKo = userState.language !== 'en';

  const [selectedSub, setSelectedSub] = useState(
    ['popular', 'all', 'home'].includes(initialSubreddit.toLowerCase()) ? 'hanguk' : initialSubreddit
  );
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'link'>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFlair, setSelectedFlair] = useState<string>(isKo ? '자유토론' : 'Discussion');

  const flairs: PostFlair[] = isKo ? [
    { text: '자유토론', bgColor: '#0079D3', textColor: '#FFFFFF' },
    { text: '뉴스 / 정보', bgColor: '#46D160', textColor: '#FFFFFF' },
    { text: '개발일지', bgColor: '#FF4500', textColor: '#FFFFFF' },
    { text: '질문 / Q&A', bgColor: '#FFB000', textColor: '#222222' },
    { text: '유머 / 밈', bgColor: '#FF66AC', textColor: '#FFFFFF' },
  ] : [
    { text: 'Discussion', bgColor: '#0079D3', textColor: '#FFFFFF' },
    { text: 'News', bgColor: '#46D160', textColor: '#FFFFFF' },
    { text: 'Showcase', bgColor: '#FF4500', textColor: '#FFFFFF' },
    { text: 'Question', bgColor: '#FFB000', textColor: '#222222' },
    { text: 'Humor', bgColor: '#FF66AC', textColor: '#FFFFFF' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const flairObj = flairs.find((f) => f.text === selectedFlair) || flairs[0];

    let mediaObj: RedditPost['media'] = undefined;

    if (activeTab === 'image' && imageUrl.trim()) {
      const trimmedUrl = imageUrl.trim();
      const isVideo = /\.(mp4|webm|mov)($|\?)/i.test(trimmedUrl);
      mediaObj = {
        type: isVideo ? 'video' : 'image',
        url: trimmedUrl,
        aspectRatio: 16 / 9,
      };
    } else if (activeTab === 'link' && linkUrl.trim()) {
      const trimmedUrl = linkUrl.trim();
      let domain = 'external link';
      try {
        domain = new URL(trimmedUrl).hostname.replace(/^www\./, '');
      } catch {
        domain = 'link';
      }
      mediaObj = {
        type: 'link',
        url: trimmedUrl,
        domain,
      };
    }

    const newPost: RedditPost = {
      id: `post_user_${Date.now()}`,
      subreddit: selectedSub,
      title: title.trim(),
      author: 'SNSHeroPlayer',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
      createdAt: Date.now(),
      score: 1,
      commentCount: 0,
      body: body.trim() || undefined,
      media: mediaObj,
      flair: flairObj,
      userVote: 'up',
      upvoteRatio: 1.0,
      isOriginalContent: true,
    };

    onSubmitPost(newPost);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-inherit/10">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base">{isKo ? '게시물 작성' : 'Create a Post'}</span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-black/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* 서브레딧 선택 셀렉터 */}
          <div>
            <label className="block text-xs font-bold uppercase opacity-60 mb-1.5">
              {isKo ? '커뮤니티 선택' : 'Choose a Community'}
            </label>
            <div className="relative inline-block w-full sm:w-64">
              <select
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold appearance-none cursor-pointer outline-none ${
                  isDark ? 'bg-[#0E1113] border-[#2E363E] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              >
                {Object.keys(SEED_SUBREDDITS).map((subKey) => (
                  <option key={subKey} value={subKey}>
                    r/{subKey}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
            </div>
          </div>

          {/* 탭: Post / Image / Link */}
          <div className="flex border-b border-inherit/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-4 py-2.5 cursor-pointer border-b-2 transition-colors ${
                activeTab === 'text' ? 'border-[#FF4500] text-[#FF4500]' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isKo ? '게시글' : 'Post'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-1.5 px-4 py-2.5 cursor-pointer border-b-2 transition-colors ${
                activeTab === 'image' ? 'border-[#FF4500] text-[#FF4500]' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>{isKo ? '이미지' : 'Images'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex items-center gap-1.5 px-4 py-2.5 cursor-pointer border-b-2 transition-colors ${
                activeTab === 'link' ? 'border-[#FF4500] text-[#FF4500]' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>{isKo ? '링크' : 'Link'}</span>
            </button>
          </div>

          {/* 제목 입력 */}
          <div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isKo ? "제목 (필수 입력)" : "Title (required)"}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium outline-none focus:ring-1 focus:ring-[#FF4500] ${
                isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
              }`}
            />
          </div>

          {activeTab === 'image' && (
            <div>
              <label className="block text-xs font-medium opacity-70 mb-1">
                {isKo ? '이미지 URL 링크' : 'Image URL'}
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-[#FF4500] ${
                  isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
                }`}
              />
              {imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden max-h-48 bg-black/10 flex items-center justify-center">
                  <img src={imageUrl} alt="preview" className="h-48 object-contain" />
                </div>
              )}
            </div>
          )}

          {activeTab === 'link' && (
            <div>
              <label className="block text-xs font-medium opacity-70 mb-1">
                {isKo ? '연결할 외부 링크 URL' : 'Destination URL'}
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-[#FF4500] ${
                  isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
                }`}
              />
            </div>
          )}

          {/* 본문 에디터 */}
          <div>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={isKo ? "본문 내용 (마크다운 지원, 선택 사항)..." : "Text (optional markdown supported)..."}
              className={`w-full p-3 rounded-xl border text-xs sm:text-sm outline-none resize-none focus:ring-1 focus:ring-[#FF4500] font-sans ${
                isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-300'
              }`}
            />
          </div>

          {/* 플레어 선택 */}
          <div>
            <label className="block text-xs font-bold uppercase opacity-60 mb-1.5">
              {isKo ? '카테고리 플레어 선택' : 'Select Flair'}
            </label>
            <div className="flex flex-wrap gap-2">
              {flairs.map((f) => (
                <button
                  key={f.text}
                  type="button"
                  onClick={() => setSelectedFlair(f.text)}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all border ${
                    selectedFlair === f.text
                      ? 'border-[#FF4500] text-white bg-[#FF4500]'
                      : isDark
                      ? 'border-[#2E363E] text-gray-300 hover:bg-[#22272B]'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {f.text}
                </button>
              ))}
            </div>
          </div>

          {/* 게시글 작성 모달 Google AdSense 스폰서 배너 */}
          <div className={`rounded-xl border p-2 shadow-xs overflow-hidden ${
            isDark ? 'bg-[#0E1113] border-[#2E363E]' : 'bg-gray-50 border-gray-200'
          }`}>
            <AdSenseBanner
              format="horizontal"
              responsive={true}
              showLabel={true}
              className="w-full flex justify-center"
            />
          </div>

          {/* 하단 버튼 바 */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-inherit/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full font-bold text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              {isKo ? '취소' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-6 py-2 rounded-full bg-[#FF4500] disabled:opacity-40 text-white font-extrabold text-xs cursor-pointer hover:bg-[#FF5414] shadow-md transition-all"
            >
              {isKo ? '게시하기' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
