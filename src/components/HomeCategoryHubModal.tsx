/**
 * HomeCategoryHubModal.tsx
 * 
 * 디자인 가이드(DESIGN.md) 준수:
 * - 100% Monospace 서체
 * - 웜크림(#fdfcfc) / 잉크(#201d1d) 팔레트
 * - 1px hairline 보더
 * - 인터랙티브 4px(rounded-sm), 컨테이너 0px(rounded-none)
 * - 첫 화면 버튼 과밀을 해소하는 상위/하위 계층 팝업 모달 허브
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Swords, BookOpen, Image, Tv, Film, Compass, 
  ShoppingBag, ArrowLeftRight, TrendingUp, Users, MessageSquare, 
  Mail, Bell, Volume2, VolumeX, HelpCircle, Map, Github, Youtube, Sparkles, Dices
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { cn } from '../lib/utils';
import type { ViewType, Language } from '../types';

export type HubCategoryType = 'game' | 'media' | 'market' | 'system';

interface HubItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  badgeKo?: string;
  badgeEn?: string;
  badgeTone?: 'amber' | 'emerald' | 'rose' | 'indigo';
  action: () => void;
}

interface HomeCategoryHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: HubCategoryType | null;
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx: (url: string) => void;
  isAudioMuted?: boolean;
  onToggleAudioMute?: () => void;
  unreadMailCount?: number;
  unreadNotifCount?: number;
  onOpenMailbox?: () => void;
  onOpenNotifModal?: () => void;
  onOpenHelp?: () => void;
  onOpenRoadmap?: () => void;
  onPlayNow?: () => void;
}

export const HomeCategoryHubModal: React.FC<HomeCategoryHubModalProps> = ({
  isOpen,
  onClose,
  category,
  language,
  onNavigate,
  playSfx,
  isAudioMuted = false,
  onToggleAudioMute,
  unreadMailCount = 0,
  unreadNotifCount = 0,
  onOpenMailbox,
  onOpenNotifModal,
  onOpenHelp,
  onOpenRoadmap,
  onPlayNow,
}) => {
  if (!isOpen || !category) return null;

  const isKo = language === 'ko';

  const handleItemClick = (action: () => void) => {
    triggerHaptic('light');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    onClose();
    action();
  };

  // 카테고리별 메타데이터 및 하위 항목 리스트
  let title = '';
  let subTitle = '';
  let items: HubItem[] = [];

  switch (category) {
    case 'game':
      title = isKo ? '[🎮 게임 & 배틀 아레나]' : '[🎮 Game & Battle Arena]';
      subTitle = isKo 
        ? '원클릭 카드 배틀부터 110선 아케이드, 시련의 탑까지' 
        : 'Select game mode from 3x3 battle to Poki 110 arcade';
      items = [
        {
          id: 'quick_battle',
          icon: Swords,
          titleKo: '메인 스토리 3x3 카드 배틀',
          titleEn: 'Main Story Card Battle',
          descKo: 'AI 대전 및 영웅 덱 전략 대결 (승리 보상)',
          descEn: 'Strategic 3x3 card flip battle vs AI opponents',
          badgeKo: '추천',
          badgeEn: 'HOT',
          badgeTone: 'amber',
          action: () => onPlayNow ? onPlayNow() : onNavigate('main'),
        },
        {
          id: 'mission_arcade',
          icon: Dices,
          titleKo: '미션 아레나 (Poki 110선)',
          titleEn: 'Mission Arena (Top 110)',
          descKo: '100% 퓨어 모바일 2D 캔버스 캐주얼 아케이드',
          descEn: '100% Mobile 2D pure touch casual minigames',
          badgeKo: '110종',
          badgeEn: '110 Games',
          badgeTone: 'emerald',
          action: () => onNavigate('play'),
        },
        {
          id: 'tower_trials',
          icon: Sparkles,
          titleKo: '시련의 탑 50층 무한 등반',
          titleEn: 'Tower of Trials (50F)',
          descKo: '층별 강력한 보스 돌파 및 한정 칭호/장비 획득',
          descEn: 'Infinite boss climb with unique rewards',
          badgeKo: '보스전',
          badgeEn: 'Boss',
          badgeTone: 'rose',
          action: () => onNavigate('play'),
        },
        {
          id: 'prediction_market',
          icon: TrendingUp,
          titleKo: 'AI 승부 예측 시장',
          titleEn: 'Prediction Market',
          descKo: '실시간 AI 대전 결과 예측 및 배당금 수령',
          descEn: 'Predict live AI battle outcomes & earn payouts',
          badgeKo: '실시간',
          badgeEn: 'Live',
          badgeTone: 'indigo',
          action: () => onNavigate('prediction-market'),
        },
        {
          id: 'my_deck',
          icon: Swords,
          titleKo: '마이덱 편성 & 다마고치 육성',
          titleEn: 'My Deck & Hero Care',
          descKo: '5장 덱 조합, 장비 착용 및 애정도 간식 주기',
          descEn: 'Customize 5-card deck & companion bond care',
          action: () => onNavigate('mydeck'),
        },
      ];
      break;

    case 'media':
      title = isKo ? '[📚 IP 미디어 라운지]' : '[📚 IP Media Lounge]';
      subTitle = isKo 
        ? 'SNS히어로 오리지널 웹소설, 웹툰, 애니, 영화 미디어 허브' 
        : 'Official SNSHero Web Novel, Toon, Anime & Movie Library';
      items = [
        {
          id: 'novel',
          icon: BookOpen,
          titleKo: '오리지널 웹소설 (Novel)',
          titleEn: 'Official Web Novel',
          descKo: '카단 & 아케인 에코즈 세계관 공식 회차 연재',
          descEn: 'Read the epic lore of Kadan & Arcane Echoes',
          badgeKo: '연재중',
          badgeEn: 'Series',
          badgeTone: 'indigo',
          action: () => onNavigate('novel'),
        },
        {
          id: 'webtoon',
          icon: Image,
          titleKo: '공식 웹툰 (Webtoon)',
          titleEn: 'Official Webtoon',
          descKo: '영웅들의 탄생과 전투를 다룬 고화질 카툰',
          descEn: 'High-definition full-color hero manhwa series',
          badgeKo: '풀컬러',
          badgeEn: 'Color',
          badgeTone: 'emerald',
          action: () => onNavigate('webtoon'),
        },
        {
          id: 'anime',
          icon: Tv,
          titleKo: '애니메이션 극장 (Anime)',
          titleEn: 'Official Anime Theater',
          descKo: '역동적인 시네마틱 액션과 스페셜 클립 감상',
          descEn: 'Watch cinematic hero action shorts & episodes',
          action: () => onNavigate('anime'),
        },
        {
          id: 'movie',
          icon: Film,
          titleKo: '공식 영화관 (Full Movie)',
          titleEn: 'Official Movie Hub',
          descKo: '시즌별 대서사 극장판 에피소드 풀버전 상영관',
          descEn: 'Full storyline theatrical cinematic release',
          action: () => onNavigate('movie'),
        },
        {
          id: 'codex',
          icon: Compass,
          titleKo: '세계관 & 캐릭터 도감',
          titleEn: 'World Codex & Lore',
          descKo: '세력별 히어로 설정, 대사, 상성 정보 완벽 정리',
          descEn: 'Character factions, voice lines & universe archive',
          action: () => onNavigate('world-codex'),
        },
      ];
      break;

    case 'market':
      title = isKo ? '[💼 거래소 & 소셜 길드]' : '[💼 Market, Stock & Guild]';
      subTitle = isKo 
        ? '카드 가챠, 유저 P2P 거래, 가상 주식 및 길드 커뮤니티' 
        : 'Card packs, P2P exchange, virtual stocks & guilds';
      items = [
        {
          id: 'shop',
          icon: ShoppingBag,
          titleKo: '상점 & 카드팩 가챠',
          titleEn: 'Shop & Card Packs',
          descKo: '일일 무료팩, 80% 할인 스타터팩 및 30회 천장 가챠',
          descEn: 'Daily free pack, starter bundle & 30-pull pity',
          badgeKo: '무료팩',
          badgeEn: 'Free',
          badgeTone: 'amber',
          action: () => onNavigate('shop'),
        },
        {
          id: 'marketplace',
          icon: ArrowLeftRight,
          titleKo: '카드 P2P 거래소',
          titleEn: 'Card P2P Marketplace',
          descKo: '투명한 수수료, 지정가 에스크로 유저 간 직거래',
          descEn: 'Peer-to-peer card trading with escrow guarantee',
          badgeKo: '안전거래',
          badgeEn: 'P2P',
          badgeTone: 'emerald',
          action: () => onNavigate('card-marketplace'),
        },
        {
          id: 'stock_market',
          icon: TrendingUp,
          titleKo: '가상 주식 거래소',
          titleEn: 'Virtual Stock Exchange',
          descKo: '실시간 호가 지분 투자 & 1탭 배당금 복리 재투자',
          descEn: 'Invest in hero stocks & claim compounded dividends',
          badgeKo: '배당수익',
          badgeEn: 'Dividend',
          badgeTone: 'indigo',
          action: () => onNavigate('stock-market'),
        },
        {
          id: 'guild',
          icon: Users,
          titleKo: '길드 & 레이드 연합',
          titleEn: 'Guilds & Raid Coalition',
          descKo: '길드원 협동 보스 토벌 및 랭킹 길드전',
          descEn: 'Join guilds, conquer raid bosses & fight wars',
          action: () => onNavigate('guild-list'),
        },
        {
          id: 'community',
          icon: MessageSquare,
          titleKo: '커뮤니티 & 덱 자랑',
          titleEn: 'Community & Deck Sharing',
          descKo: '나만의 필승 덱 공유, 추천글 작성 및 자유 토론',
          descEn: 'Share deck strategies, upvote & discuss with peers',
          action: () => onNavigate('community'),
        },
      ];
      break;

    case 'system':
      title = isKo ? '[⚙️ 시스템 설정 & 더보기]' : '[⚙️ System & Utilities]';
      subTitle = isKo 
        ? '우편함, 공지 알림, 사운드 설정 및 개발자 오픈소스 링크' 
        : 'Mailbox, notifications, sound settings & dev links';
      items = [
        {
          id: 'mailbox',
          icon: Mail,
          titleKo: '우편함 (Mailbox)',
          titleEn: 'System Mailbox',
          descKo: unreadMailCount > 0 ? `새 우편 ${unreadMailCount}통 수령 대기` : '운영 보상 및 공지 우편 확인',
          descEn: unreadMailCount > 0 ? `${unreadMailCount} unread reward mail` : 'Claim maintenance & system rewards',
          badgeKo: unreadMailCount > 0 ? `+${unreadMailCount}` : undefined,
          badgeEn: unreadMailCount > 0 ? `+${unreadMailCount}` : undefined,
          badgeTone: 'rose',
          action: () => onOpenMailbox?.(),
        },
        {
          id: 'notif',
          icon: Bell,
          titleKo: '알림 센터 (Notifications)',
          titleEn: 'Notification Center',
          descKo: unreadNotifCount > 0 ? `새 알림 ${unreadNotifCount}건 확인` : '이벤트 및 시즌 업데이트 알림',
          descEn: unreadNotifCount > 0 ? `${unreadNotifCount} new notifications` : 'Season updates & events',
          badgeKo: unreadNotifCount > 0 ? `+${unreadNotifCount}` : undefined,
          badgeEn: unreadNotifCount > 0 ? `+${unreadNotifCount}` : undefined,
          badgeTone: 'amber',
          action: () => onOpenNotifModal?.(),
        },
        {
          id: 'sound',
          icon: isAudioMuted ? VolumeX : Volume2,
          titleKo: isAudioMuted ? '음소거 해제 (SFX 켜기)' : '음향 음소거 (Mute SFX)',
          titleEn: isAudioMuted ? 'Unmute SFX (Enable Sound)' : 'Mute Sound Effects',
          descKo: isAudioMuted ? '현재 음소거 상태입니다 (탭하여 사운드 활성화)' : '배경음 및 효과음이 켜져 있습니다',
          descEn: isAudioMuted ? 'Audio is currently muted' : 'Audio is active',
          badgeKo: isAudioMuted ? 'MUTE' : 'ON',
          badgeEn: isAudioMuted ? 'MUTE' : 'ON',
          badgeTone: isAudioMuted ? 'rose' : 'emerald',
          action: () => onToggleAudioMute?.(),
        },
        {
          id: 'roadmap',
          icon: Map,
          titleKo: '초보자 퀘스트 로드맵',
          titleEn: 'Beginner Quest Roadmap',
          descKo: '단계별 튜토리얼 퀘스트 및 SNS 정착 보상',
          descEn: 'Step-by-step onboarding quests & rewards',
          action: () => onOpenRoadmap?.(),
        },
        {
          id: 'help',
          icon: HelpCircle,
          titleKo: '게임 가이드 & 3초 룰북',
          titleEn: 'Game Guide & Rulebook',
          descKo: '3x3 플립 배틀 규칙 및 상성 원리 빠른 학습',
          descEn: 'Learn 3x3 flip rules & element synergy',
          action: () => onOpenHelp?.(),
        },
        {
          id: 'github',
          icon: Github,
          titleKo: 'GitHub 소스코드 (Repository)',
          titleEn: 'GitHub Repository',
          descKo: '오픈소스 리포지토리 및 실시간 기여 내역',
          descEn: 'Open-source repository & dev progress',
          badgeKo: '오픈소스',
          badgeEn: 'Open',
          badgeTone: 'indigo',
          action: () => window.open('https://github.com/Dayyoung/snshero', '_blank'),
        },
        {
          id: 'youtube',
          icon: Youtube,
          titleKo: '개발자 YouTube 재생목록',
          titleEn: 'YouTube Dev Playlist',
          descKo: 'AI 개발 과정 및 시연 영상 연속 재생',
          descEn: 'Watch dev logs & gameplay demonstrations',
          action: () => window.open('https://www.youtube.com/playlist?list=PLV8H2-pD9vH0', '_blank'),
        },
      ];
      break;
  }

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg bg-[#fdfcfc] border border-[#201d1d] text-[#201d1d] font-mono shadow-2xl rounded-none flex flex-col max-h-[85dvh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#201d1d]/15 bg-[#201d1d] text-[#fdfcfc]">
            <div className="min-w-0 pr-2">
              <h3 className="text-xs sm:text-sm font-black tracking-tight uppercase truncate text-amber-300">
                {title}
              </h3>
              <p className="text-[10px] text-[#fdfcfc]/70 truncate mt-0.5">
                {subTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1 text-[#fdfcfc]/70 hover:text-white hover:bg-white/10 rounded-sm cursor-pointer transition shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sub-menu Item List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.action)}
                  className="w-full p-3 bg-white hover:bg-stone-50 border border-[#201d1d]/15 hover:border-[#201d1d] text-left transition-all active:scale-[0.99] flex items-center justify-between gap-3 group cursor-pointer rounded-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 flex items-center justify-center bg-[#201d1d]/5 group-hover:bg-[#201d1d] group-hover:text-white border border-[#201d1d]/10 transition-colors shrink-0 rounded-sm">
                      <Icon size={18} className="text-[#201d1d] group-hover:text-amber-300 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-[#201d1d] truncate">
                          {isKo ? item.titleKo : item.titleEn}
                        </span>
                        {(item.badgeKo || item.badgeEn) && (
                          <span className={cn(
                            "px-1.5 py-0.2 text-[9px] font-black uppercase rounded-xs shrink-0",
                            item.badgeTone === 'amber' && "bg-amber-400 text-black",
                            item.badgeTone === 'emerald' && "bg-emerald-500 text-white",
                            item.badgeTone === 'rose' && "bg-rose-500 text-white",
                            item.badgeTone === 'indigo' && "bg-indigo-600 text-white",
                            !item.badgeTone && "bg-[#201d1d] text-white"
                          )}>
                            {isKo ? item.badgeKo : item.badgeEn}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#646262] truncate mt-0.5 font-normal">
                        {isKo ? item.descKo : item.descEn}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#646262] group-hover:text-[#201d1d] group-hover:translate-x-0.5 transition-transform shrink-0">
                    [➔]
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer Close */}
          <div className="p-3 border-t border-[#201d1d]/15 bg-[#f8f7f7] flex justify-end">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold hover:bg-[#201d1d]/90 active:scale-95 transition-all cursor-pointer rounded-sm"
            >
              {isKo ? '[ 닫기 ]' : '[ Close ]'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
