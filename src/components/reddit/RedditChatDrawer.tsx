/**
 * RedditChatDrawer.tsx
 * 오리지널 레딧 실시간 커뮤니티 채팅 드로어
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, User, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe?: boolean;
}

interface RedditChatDrawerProps {
  isOpen: boolean;
  isDark: boolean;
  isKo?: boolean;
  onClose: () => void;
}

export const RedditChatDrawer: React.FC<RedditChatDrawerProps> = ({
  isOpen,
  isDark,
  isKo = true,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'GameDevMaster',
      text: isKo ? '안녕하세요! 언리얼5 인디 RPG 영상 보고 들어왔습니다.' : 'Hello! I loved the Unreal 5 RPG showcase!',
      time: '12:02',
    },
    {
      id: 'm2',
      sender: 'TechSeeker',
      text: isKo ? '상온 광학 컴퓨팅 관련 논문 링크 혹시 보신 분 계신가요?' : 'Has anyone read the optical computing paper?',
      time: '12:05',
    },
    {
      id: 'm3',
      sender: 'RedditHero',
      text: isKo ? 'r/hanguk 서브레딧 실시간 피드 업데이트 엄청 빠르네요!' : 'r/hanguk live feed is updating really fast!',
      time: '12:08',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'SNSHeroPlayer',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // 자동 응답 시뮬레이션
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_bot_${Date.now()}`,
          sender: 'CommunityBot',
          text: isKo 
            ? 'SNSHero 커뮤니티 채팅에 참여해 주셔서 감사합니다! 즐거운 토론 되세요.' 
            : 'Thanks for chatting on SNSHero! Enjoy the discussion.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 border-l ${
        isDark ? 'bg-[#0E1113] border-[#22272B] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        {/* 상단 헤더 */}
        <div className={`h-14 px-4 border-b flex items-center justify-between flex-shrink-0 ${
          isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center text-white">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-1.5">
                <span>{isKo ? '실시간 커뮤니티 채팅' : 'Community Live Chat'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[10px] opacity-60">
                {isKo ? '128명 온라인 참여 중' : '128 members online'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 메시지 스크롤 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div className="text-center py-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
              isDark ? 'bg-[#181C1F] text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              <Sparkles className="inline w-3 h-3 text-[#FF4500] mr-1" />
              {isKo ? 'SNSHero 클린 채팅 채널에 오신 것을 환영합니다' : 'Welcome to SNSHero Clean Chat'}
            </span>
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] opacity-60 mb-1">
                {!m.isMe && <User className="w-3 h-3 text-[#FF4500]" />}
                <span className="font-bold">{m.sender}</span>
                <span>•</span>
                <span>{m.time}</span>
              </div>
              <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed font-sans ${
                m.isMe
                  ? 'bg-[#FF4500] text-white rounded-tr-none'
                  : isDark
                  ? 'bg-[#181C1F] border border-[#22272B] text-gray-200 rounded-tl-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* 하단 메시지 인풋 */}
        <form onSubmit={handleSendMessage} className={`p-3 border-t flex items-center gap-2 ${
          isDark ? 'bg-[#181C1F] border-[#22272B]' : 'bg-gray-50 border-gray-200'
        }`}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isKo ? "메시지 보내기..." : "Send a message..."}
            className={`flex-1 px-4 py-2 rounded-full text-xs outline-none focus:ring-1 focus:ring-[#FF4500] font-sans ${
              isDark ? 'bg-[#0E1113] text-white border border-[#2A3238]' : 'bg-white text-gray-900 border border-gray-300'
            }`}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-full bg-[#FF4500] disabled:opacity-40 text-white cursor-pointer hover:bg-[#FF5414] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
