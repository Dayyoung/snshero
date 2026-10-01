/**
 * RedditNotificationsDropdown.tsx
 * 오리지널 레딧 알림(Bell) 드롭다운 팝업
 */

import React from 'react';
import { MessageSquare, Flame, Award, Check, Sparkles, ExternalLink } from 'lucide-react';

export interface RedditNotificationItem {
  id: string;
  type: 'reply' | 'trending' | 'karma';
  title: string;
  desc: string;
  timeAgo: string;
  isRead: boolean;
  linkSubreddit?: string;
  postId?: string;
}

interface RedditNotificationsDropdownProps {
  isDark: boolean;
  isKo?: boolean;
  onClose: () => void;
  onSelectNotification?: (item: RedditNotificationItem) => void;
}

export const RedditNotificationsDropdown: React.FC<RedditNotificationsDropdownProps> = ({
  isDark,
  isKo = true,
  onClose,
  onSelectNotification,
}) => {
  const [notifications, setNotifications] = React.useState<RedditNotificationItem[]>([
    {
      id: 'notif_1',
      type: 'reply',
      title: isKo ? 'u/GameDevIndie 님이 답글을 남겼습니다.' : 'u/GameDevIndie replied to your comment.',
      desc: isKo ? '"물리 충돌 판정이랑 파티클 상호작용 이펙트가 예술이네요! 1인 개발 화이팅!"' : '"The physics and particles look stunning! Great job!"',
      timeAgo: isKo ? '10분 전' : '10m ago',
      isRead: false,
      postId: 'post_ko_1',
      linkSubreddit: 'hanguk',
    },
    {
      id: 'notif_2',
      type: 'trending',
      title: isKo ? 'r/technology 급상승 트렌드' : 'Trending on r/technology',
      desc: isKo ? 'MIT 연구팀의 상온 광학 컴퓨팅 칩 실리콘 검증 소식이 인기 급상승 중입니다.' : 'Optical computing chip news is trending now.',
      timeAgo: isKo ? '1시간 전' : '1h ago',
      isRead: false,
      linkSubreddit: 'technology',
    },
    {
      id: 'notif_3',
      type: 'karma',
      title: isKo ? '카르마 마일스톤 달성!' : 'Karma Milestone reached!',
      desc: isKo ? '커뮤니티 활동으로 총 4,820 카르마를 획득했습니다! 뱃지를 확인해보세요.' : 'You have earned over 4,820 karma on SNSHero.',
      timeAgo: isKo ? '3시간 전' : '3h ago',
      isRead: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className={`absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl py-2 z-50 text-xs overflow-hidden backdrop-blur-xl ${
      isDark ? 'bg-[#181C1F] border-[#2E363E] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
    }`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-inherit/10">
        <span className="font-extrabold text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#FF4500]" />
          <span>{isKo ? '알림 센터' : 'Notifications'}</span>
        </span>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-[11px] font-semibold text-[#FF4500] hover:underline cursor-pointer flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isKo ? '모두 읽음' : 'Mark all read'}</span>
        </button>
      </div>

      {/* 알림 리스트 */}
      <div className="max-h-80 overflow-y-auto divide-y divide-inherit/10">
        {notifications.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if (onSelectNotification) onSelectNotification(item);
              onClose();
            }}
            className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
              !item.isRead ? (isDark ? 'bg-[#0E1113]/60' : 'bg-[#FF4500]/5') : ''
            } ${isDark ? 'hover:bg-[#22272B]' : 'hover:bg-gray-50'}`}
          >
            <div className={`p-2 rounded-full flex-shrink-0 ${
              item.type === 'reply' ? 'bg-sky-500/20 text-sky-400' :
              item.type === 'trending' ? 'bg-[#FF4500]/20 text-[#FF4500]' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {item.type === 'reply' && <MessageSquare className="w-4 h-4" />}
              {item.type === 'trending' && <Flame className="w-4 h-4" />}
              {item.type === 'karma' && <Award className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="font-bold text-xs truncate">{item.title}</span>
                <span className="text-[10px] opacity-50 flex-shrink-0">{item.timeAgo}</span>
              </div>
              <p className="text-[11px] opacity-75 line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
              {item.linkSubreddit && (
                <div className="mt-1 text-[10px] font-bold text-[#FF4500] flex items-center gap-1">
                  <span>r/{item.linkSubreddit} 바로가기</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 푸터 */}
      <div className="p-2.5 text-center border-t border-inherit/10 text-[11px] opacity-60">
        {isKo ? '실시간 커뮤니티 업데이트 알림' : 'Real-time SNSHero Notifications'}
      </div>
    </div>
  );
};
