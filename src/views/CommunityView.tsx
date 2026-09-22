import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Heart, Share2, Send, Swords } from 'lucide-react';
import { Language } from '../types';

export interface CommunityViewProps {
  onBack: () => void;
  language: Language;
  playSfx: (url: string) => void;
  user?: any;
  sns: number;
  updateSns?: (amount: number, reason?: string) => void;
  initialPostId?: string | null;
  initialCategory?: string;
  onAttack?: (opponent: any) => void;
}

interface PostItem {
  id: string;
  author: string;
  content: string;
  likes: number;
  time: string;
  isLiked?: boolean;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  onBack,
  language,
  playSfx,
  user,
  sns,
  updateSns,
  onAttack,
}) => {
  const [posts, setPosts] = useState<PostItem[]>([
    {
      id: 'post-1',
      author: '전투광히어로',
      content: language === 'ko' ? '드디어 100층 돌파했습니다! 덱 추천해드립니다.' : 'Finally cleared Floor 100! Here is my deck setup.',
      likes: 12,
      time: '10분 전',
    },
    {
      id: 'post-2',
      author: '카드마스터',
      content: language === 'ko' ? '신규 시즌 1 랭킹전 연승 잭팟 꿀팁 공유합니다.' : 'Sharing tips for the new Season 1 ranking win streaks.',
      likes: 8,
      time: '32분 전',
    },
  ]);
  const [newText, setNewText] = useState('');

  const handleCreatePost = () => {
    if (!newText.trim()) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const newPost: PostItem = {
      id: `post-${Date.now()}`,
      author: user?.displayName || (language === 'ko' ? '방랑 영웅' : 'Hero Wanderer'),
      content: newText.trim(),
      likes: 0,
      time: language === 'ko' ? '방금 전' : 'Just now',
    };
    setPosts([newPost, ...posts]);
    setNewText('');
  };

  const handleLike = (id: string) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setPosts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked };
        }
        return p;
      })
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-5 text-[#201d1d]">
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] px-3 py-1.5 rounded-sm hover:bg-[#f1eeee] active:scale-95 cursor-pointer min-h-[36px]"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '로비로 이동' : 'Back to Lobby'}</span>
        </button>
        <span className="font-mono font-bold text-sm sm:text-base">
          {language === 'ko' ? '[ 히어로 커뮤니티 라운지 ]' : '[ Hero Community Lounge ]'}
        </span>
        <div className="text-xs font-mono">
          SNS: <strong>{sns.toLocaleString()}</strong>
        </div>
      </div>

      {/* Post creation */}
      <div className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-3 sm:p-4 rounded-none flex flex-col gap-2">
        <textarea
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder={language === 'ko' ? '동료 히어로들에게 전할 소식을 남겨보세요...' : 'Share your message with fellow heroes...'}
          className="w-full p-2.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] rounded-sm bg-white resize-none h-20 outline-none focus:border-[#201d1d]"
        />
        <div className="flex justify-end">
          <button
            onClick={handleCreatePost}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-[#201d1d] bg-[#0f0000] text-white rounded-sm hover:opacity-90 active:scale-95 cursor-pointer min-h-[36px]"
          >
            <Send size={14} />
            <span>{language === 'ko' ? '게시하기' : 'Post'}</span>
          </button>
        </div>
      </div>

      {/* Post feed */}
      <div className="flex flex-col gap-3">
        {posts.map(post => (
          <div
            key={post.id}
            className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-3 sm:p-4 rounded-none flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold">{post.author}</span>
              <span className="opacity-50 text-[11px]">{post.time}</span>
            </div>
            <p className="text-xs font-mono whitespace-pre-wrap">{post.content}</p>
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(15,0,0,0.06)]">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1 text-xs font-mono cursor-pointer ${
                  post.isLiked ? 'text-rose-600 font-bold' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Heart size={14} fill={post.isLiked ? 'currentColor' : 'none'} />
                <span>{post.likes}</span>
              </button>

              {onAttack && (
                <button
                  onClick={() => onAttack({ name: post.author, power: 1200 })}
                  className="flex items-center gap-1 text-[11px] font-mono border border-[rgba(15,0,0,0.15)] px-2 py-1 rounded-sm hover:bg-[#f1eeee] cursor-pointer"
                >
                  <Swords size={12} />
                  <span>{language === 'ko' ? '친선 대결' : 'Friendly Duel'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityView;
