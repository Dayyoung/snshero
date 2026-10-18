/**
 * RedditQuickCreatePostBar.tsx
 * 실제 reddit.com 피드 상단 "게시물 만들기 (Create Post)" 빠른 작성 바
 */

import React from 'react';
import { Image, Link2 } from 'lucide-react';

interface RedditQuickCreatePostBarProps {
 isDark: boolean;
 isKo?: boolean;
 onOpenSubmitModal: () => void;
}

export const RedditQuickCreatePostBar: React.FC<RedditQuickCreatePostBarProps> = ({
 isDark,
 isKo = true,
 onOpenSubmitModal,
}) => {
 return (
 <div
 onClick={onOpenSubmitModal}
 className={`rounded-none border p-2.5 sm:p-3 mb-3 w-full max-w-full overflow-hidden flex items-center gap-2 sm:gap-3 cursor-pointer transition-colors font-mono ${
 isDark
 ? 'bg-[#181C1F] hover:bg-[#1E2328] border-[#22272B]'
 : 'bg-white hover:bg-gray-50 border-gray-200'
 }`}
 >
 {/* 유저 아바타 */}
 <img
 src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80"
 alt="User Avatar"
 className="w-9 h-9 rounded-none object-cover flex-shrink-0 border border-inherit/20"
 />

 {/* 가짜 인풋 창 */}
 <div
 className={`flex-1 min-w-0 min-h-[44px] px-4 py-2 rounded-sm text-xs sm:text-sm font-medium transition-colors truncate flex items-center ${
 isDark
 ? 'bg-[#22272B] hover:bg-[#2A3238] text-gray-400'
 : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
 }`}
 >
 {isKo ? '게시물 만들기...' : 'Create Post...'}
 </div>

 {/* 우측 단축 아이콘 버튼들 */}
 <div className="flex items-center gap-1 text-gray-400">
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); onOpenSubmitModal(); }}
 className="min-h-[44px] min-w-[44px] p-2 rounded-sm hover:bg-black/10 cursor-pointer flex items-center justify-center"
 title={isKo ? '이미지 업로드' : 'Upload Image'}
 >
 <Image className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity" />
 </button>
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); onOpenSubmitModal(); }}
 className="min-h-[44px] min-w-[44px] p-2 rounded-sm hover:bg-black/10 cursor-pointer flex items-center justify-center"
 title={isKo ? '링크 공유' : 'Share Link'}
 >
 <Link2 className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity" />
 </button>
 </div>
 </div>
 );
};
