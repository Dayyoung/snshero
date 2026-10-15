/**
 * DailyHiddenHeroModal.tsx
 * 이벤트 화면 전용 일일 숨은그림 찾기 이벤트 (Daily Hidden Hero Hunt)
 * - 매일 자정/날짜(YYYY-MM-DD)마다 배경 일러스트와 숨겨진 캐릭터들이 변경됨
 * - 랜덤한 판타지 그림 속에 아주 작게(22~26px) 캐릭터들이 교묘하게 숨겨져 있음
 * - 줌/돋보기 모드(1x, 1.5x, 2x) & 드래그 탐색 지원
 * - 4명의 숨은 영웅을 모두 찾으면 1,500 SNS 보상 지급 (하루 1회 완료)
 * - 로컬스토리지 영구 저장 및 다국어 지원
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Sparkles, CheckCircle2, Compass, ZoomIn, ZoomOut, Trophy, Zap, Clock, RefreshCw } from 'lucide-react';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface DailyHiddenHeroModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateSns: (amount: number, reason?: string) => void;
  playSfx: (url: string) => void;
  language: Language;
}

// 숨겨질 수 있는 캐릭터 후보군 (영웅 10종)
export interface HiddenHeroTarget {
  id: number;
  nameKo: string;
  nameEn: string;
  titleKo: string;
  titleEn: string;
}

export const HERO_TARGET_CANDIDATES: HiddenHeroTarget[] = [
  { id: 1, nameKo: '아쿠아리스', nameEn: 'Aquaris', titleKo: '물의 정령', titleEn: 'Water Spirit' },
  { id: 11, nameKo: '이그니스', nameEn: 'Ignis', titleKo: '불꽃 정령', titleEn: 'Flame Sprite' },
  { id: 21, nameKo: '제피로스', nameEn: 'Zephyros', titleKo: '바람 정령', titleEn: 'Wind Fairy' },
  { id: 31, nameKo: '가이아', nameEn: 'Gaia', titleKo: '대지 정령', titleEn: 'Earth Golem' },
  { id: 10, nameKo: '포세이돈', nameEn: 'Poseidon', titleKo: '바다의 주신', titleEn: 'Sea Sovereign' },
  { id: 19, nameKo: '피닉스', nameEn: 'Phoenix', titleKo: '불사조', titleEn: 'Immortal Bird' },
  { id: 29, nameKo: '뇌신', nameEn: 'Raijin', titleKo: '번개의 신', titleEn: 'Thunder God' },
  { id: 3, nameKo: '운디네', nameEn: 'Undine', titleKo: '물의 요정', titleEn: 'Water Nymph' },
  { id: 12, nameKo: '샐러맨더', nameEn: 'Salamander', titleKo: '화염룡', titleEn: 'Fire Drake' },
  { id: 23, nameKo: '실피드', nameEn: 'Sylphid', titleKo: '바람 요정', titleEn: 'Sylphid Nymph' },
];

// 7가지 판타지 테마 스테이지 배경
export interface HiddenSceneTheme {
  themeId: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  bgGradient: string;
  primaryColor: string;
  // 각 테마의 시각적 랜드마크 요소들
  landmarks: {
    type: 'building' | 'tree' | 'crystal' | 'cavern' | 'monument' | 'tent' | 'pipe';
    x: number; // % (0~100)
    y: number; // % (0~100)
    w: number;
    h: number;
    color: string;
    opacity: number;
  }[];
  // 5개의 고정 은신 명당 좌표 (x%, y%)
  hidingSpots: { x: number; y: number; descKo: string; descEn: string }[];
}

export const SCENE_THEMES: HiddenSceneTheme[] = [
  {
    themeId: 'plaza',
    titleKo: '아르카디아 왕국 대광장',
    titleEn: 'Arcadia Grand Plaza',
    descKo: '화려한 분수대와 가판대, 축제 깃발 사이에 영웅들이 숨어있습니다.',
    descEn: 'Heroes hide among festive banners, fountain sprays, and bazaar tents.',
    bgGradient: 'from-amber-950 via-slate-900 to-indigo-950',
    primaryColor: '#f59e0b',
    landmarks: [
      { type: 'monument', x: 50, y: 55, w: 90, h: 90, color: '#0284c7', opacity: 0.35 },
      { type: 'building', x: 15, y: 30, w: 100, h: 140, color: '#b45309', opacity: 0.4 },
      { type: 'building', x: 85, y: 32, w: 90, h: 130, color: '#b45309', opacity: 0.4 },
      { type: 'tent', x: 30, y: 70, w: 75, h: 55, color: '#e11d48', opacity: 0.45 },
      { type: 'tent', x: 72, y: 72, w: 80, h: 60, color: '#8b5cf6', opacity: 0.45 },
    ],
    hidingSpots: [
      { x: 18, y: 22, descKo: '시계탑 지붕 난간', descEn: 'Clocktower Balcony' },
      { x: 48, y: 53, descKo: '중앙 분수대 조각상 뒤', descEn: 'Behind Grand Fountain' },
      { x: 32, y: 68, descKo: '붉은 서커스 천막 처마', descEn: 'Red Circus Tent Eaves' },
      { x: 75, y: 75, descKo: '보라색 마법약 가판대 상자', descEn: 'Purple Potion Stall Crate' },
      { x: 88, y: 28, descKo: '영주 저택 테라스 그늘', descEn: 'Mansion Terrace Shade' },
    ],
  },
  {
    themeId: 'library',
    titleKo: '대현자의 마법 비서고',
    titleEn: 'Grand Archmage Library',
    descKo: '천장까지 닿는 거대한 서가와 부유하는 마법서 사이에 은신했습니다.',
    descEn: 'Concealed between sky-high bookshelves and floating arcane grimoires.',
    bgGradient: 'from-indigo-950 via-purple-950 to-slate-950',
    primaryColor: '#a855f7',
    landmarks: [
      { type: 'crystal', x: 50, y: 40, w: 70, h: 100, color: '#c084fc', opacity: 0.4 },
      { type: 'building', x: 20, y: 45, w: 110, h: 160, color: '#4338ca', opacity: 0.45 },
      { type: 'building', x: 80, y: 45, w: 110, h: 160, color: '#4338ca', opacity: 0.45 },
      { type: 'monument', x: 50, y: 80, w: 120, h: 40, color: '#312e81', opacity: 0.5 },
    ],
    hidingSpots: [
      { x: 22, y: 35, descKo: '금지된 마도서 서가 3층', descEn: 'Forbidden Grimoire Shelf 3F' },
      { x: 51, y: 38, descKo: '공중 부유 룬 수정구 위', descEn: 'Aloft Floating Rune Orb' },
      { x: 82, y: 55, descKo: '고대 양피지 보관함 틈새', descEn: 'Ancient Parchment Niche' },
      { x: 45, y: 82, descKo: '대현자 독서대 그림자', descEn: 'Archmage Lectern Shadow' },
      { x: 15, y: 72, descKo: '나선형 계단 난간 뒤', descEn: 'Spiral Staircase Railing' },
    ],
  },
  {
    themeId: 'ruins',
    titleKo: '태초의 거신 타이탄 유적',
    titleEn: 'Primordial Titan Ruins',
    descKo: '거대 석상과 덩굴 식물, 고대 마법진의 틈바구니에 몸을 숨겼습니다.',
    descEn: 'Tucked into titanic mossy monoliths and ancient glowing glyphs.',
    bgGradient: 'from-stone-950 via-emerald-950 to-stone-900',
    primaryColor: '#10b981',
    landmarks: [
      { type: 'monument', x: 50, y: 45, w: 130, h: 140, color: '#047857', opacity: 0.35 },
      { type: 'tree', x: 18, y: 50, w: 90, h: 130, color: '#065f46', opacity: 0.5 },
      { type: 'tree', x: 82, y: 50, w: 90, h: 130, color: '#065f46', opacity: 0.5 },
      { type: 'crystal', x: 50, y: 75, w: 60, h: 50, color: '#34d399', opacity: 0.4 },
    ],
    hidingSpots: [
      { x: 48, y: 32, descKo: '거신 석상 이마의 보석 홈', descEn: 'Titan Crown Jewel Socket' },
      { x: 16, y: 42, descKo: '고대 덩굴 거목 줄기 사이', descEn: 'Ancient Vine Tree Hollow' },
      { x: 84, y: 62, descKo: '무너진 원형 열주 파편 뒤', descEn: 'Broken Pillar Rubble' },
      { x: 53, y: 76, descKo: '에메랄드 비석 제단 아래', descEn: 'Emerald Altar Pedestal' },
      { x: 30, y: 82, descKo: '이끼 낀 판석 틈새', descEn: 'Mossy Flagstone Gap' },
    ],
  },
  {
    themeId: 'volcano',
    titleKo: '심연의 화룡 마그마 동굴',
    titleEn: 'Abyssal Dragon Magma Cavern',
    descKo: '펄펄 끓는 용암 폭포와 흑요석 바위 뒤편에 영웅들이 숨었습니다.',
    descEn: 'Lurking behind boiling lava cataracts and obsidian dragon nests.',
    bgGradient: 'from-orange-950 via-red-950 to-stone-950',
    primaryColor: '#ef4444',
    landmarks: [
      { type: 'cavern', x: 50, y: 40, w: 140, h: 120, color: '#dc2626', opacity: 0.4 },
      { type: 'crystal', x: 25, y: 65, w: 70, h: 80, color: '#f97316', opacity: 0.45 },
      { type: 'crystal', x: 75, y: 65, w: 70, h: 80, color: '#f97316', opacity: 0.45 },
    ],
    hidingSpots: [
      { x: 49, y: 28, descKo: '용암 폭포 중앙 흑요석 징검다리', descEn: 'Obsidian Stepping Stone' },
      { x: 23, y: 60, descKo: '불타는 마그마 수정 둥치', descEn: 'Burning Magma Crystal Hive' },
      { x: 77, y: 62, descKo: '화룡의 둥지 붉은 알 틈새', descEn: 'Dragon Nest Egg Crevice' },
      { x: 35, y: 80, descKo: '식어가는 현무암 균열', descEn: 'Basalt Cooling Crack' },
      { x: 68, y: 78, descKo: '화염 증기 분출구 옆 바위', descEn: 'Thermal Geyser Rocks' },
    ],
  },
  {
    themeId: 'worldtree',
    titleKo: '세계수의 신성한 정령 호수',
    titleEn: 'World Tree Sacred Lake',
    descKo: '푸른 빛을 뿜는 거대 거목과 발광 버섯, 수련 잎에 숨어있습니다.',
    descEn: 'Hidden atop glowing azure mushrooms and colossal lotus leaves.',
    bgGradient: 'from-cyan-950 via-teal-950 to-slate-950',
    primaryColor: '#06b6d4',
    landmarks: [
      { type: 'tree', x: 50, y: 35, w: 160, h: 140, color: '#0891b2', opacity: 0.4 },
      { type: 'crystal', x: 20, y: 65, w: 80, h: 70, color: '#22d3ee', opacity: 0.4 },
      { type: 'crystal', x: 80, y: 65, w: 80, h: 70, color: '#22d3ee', opacity: 0.4 },
    ],
    hidingSpots: [
      { x: 50, y: 25, descKo: '세계수 가지 위 요정의 둥지', descEn: 'Fairy Tree Branch Bower' },
      { x: 21, y: 62, descKo: '발광 시안 버섯 갓 아래', descEn: 'Luminescent Cyan Cap' },
      { x: 81, y: 66, descKo: '호수 중앙 부유하는 거대 연잎', descEn: 'Floating Lotus Raft' },
      { x: 38, y: 76, descKo: '푸른 반딧불이 풀숲', descEn: 'Azure Firefly Thicket' },
      { x: 65, y: 78, descKo: '정령의 샘 수호석 그늘', descEn: 'Spirit Well Boundary Stone' },
    ],
  },
  {
    themeId: 'cyber',
    titleKo: '사이퍼펑크 네온 슬럼가',
    titleEn: 'Cyberpunk Neon Underbelly',
    descKo: '홀로그램 전광판과 파이프라인, 네온 간판 틈새에 숨었습니다.',
    descEn: 'Stashed inside tangled power conduits and flicker neon signs.',
    bgGradient: 'from-fuchsia-950 via-purple-950 to-slate-950',
    primaryColor: '#d946ef',
    landmarks: [
      { type: 'pipe', x: 50, y: 30, w: 180, h: 50, color: '#c026d3', opacity: 0.4 },
      { type: 'building', x: 20, y: 55, w: 90, h: 120, color: '#701a75', opacity: 0.45 },
      { type: 'building', x: 80, y: 55, w: 90, h: 120, color: '#701a75', opacity: 0.45 },
    ],
    hidingSpots: [
      { x: 19, y: 48, descKo: '네온 라면 포장마차 처마', descEn: 'Neon Noodle Stand Awning' },
      { x: 52, y: 28, descKo: '중앙 홀로그램 스크린 뒤', descEn: 'Central Hologram Rig' },
      { x: 82, y: 50, descKo: '고전압 데이터 케이블 뭉치', descEn: 'High-Voltage Cable Bundle' },
      { x: 36, y: 76, descKo: '골목 쓰레기통 옆 환풍기', descEn: 'Alley Ventilation Grate' },
      { x: 67, y: 78, descKo: '메카 정비소 부품 더미', descEn: 'Mecha Scrapyard Caches' },
    ],
  },
  {
    themeId: 'skyisle',
    titleKo: '천공의 부유 성채',
    titleEn: 'Celestial Sky Citadel',
    descKo: '구름 바다 위 비행선과 황금빛 종탑 사이에 숨어있습니다.',
    descEn: 'Sheltered among golden bell towers and cloud-surfing airships.',
    bgGradient: 'from-sky-950 via-blue-950 to-slate-950',
    primaryColor: '#38bdf8',
    landmarks: [
      { type: 'building', x: 50, y: 40, w: 120, h: 140, color: '#0284c7', opacity: 0.4 },
      { type: 'monument', x: 22, y: 60, w: 80, h: 90, color: '#0369a1', opacity: 0.4 },
      { type: 'monument', x: 78, y: 60, w: 80, h: 90, color: '#0369a1', opacity: 0.4 },
    ],
    hidingSpots: [
      { x: 50, y: 30, descKo: '천공 성채 첨탑 황금 풍향계', descEn: 'Citadel Spire Weathervane' },
      { x: 20, y: 55, descKo: '소형 증기 비행선 날개 밑', descEn: 'Steam Skyship Wing Strut' },
      { x: 79, y: 58, descKo: '빛의 인도등 등대 테라스', descEn: 'Beacon Lighthouse Balcony' },
      { x: 35, y: 78, descKo: '하늘 징검다리 닻줄 고리', descEn: 'Sky-bridge Anchor Ring' },
      { x: 66, y: 76, descKo: '태양 전지판 각도 조절판', descEn: 'Solar Panel Joint Crevice' },
    ],
  },
];

// 간단한 문자열 해시 함수
function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const DailyHiddenHeroModal: React.FC<DailyHiddenHeroModalProps> = ({
  isOpen,
  onClose,
  updateSns,
  playSfx,
  language,
}) => {
  // 오늘 날짜 문자열 (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayHash = useMemo(() => stringHash(todayStr), [todayStr]);

  // 오늘 날짜에 따른 테마 선택 (7개 중 1개)
  const currentTheme = useMemo(() => {
    const themeIndex = todayHash % SCENE_THEMES.length;
    return SCENE_THEMES[themeIndex];
  }, [todayHash]);

  // 오늘 찾아야 할 4명의 영웅 및 숨겨진 좌표 생성 (결정론적)
  const hiddenHeroes = useMemo(() => {
    // 5개의 명당 중 4개 선택
    const spots = [...currentTheme.hidingSpots];
    // Fisher-Yates shuffle with seed
    for (let i = spots.length - 1; i > 0; i--) {
      const j = (todayHash + i * 17) % (i + 1);
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    const chosenSpots = spots.slice(0, 4);

    // 10명의 후보군 중 4명 선택
    const candidates = [...HERO_TARGET_CANDIDATES];
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = (todayHash + i * 31) % (i + 1);
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const chosenHeroes = candidates.slice(0, 4);

    return chosenHeroes.map((hero, idx) => ({
      ...hero,
      spot: chosenSpots[idx],
      instanceId: `target_${idx}_${hero.id}`,
    }));
  }, [currentTheme, todayHash]);

  // 찾은 영웅 ID 세트 (오늘 날짜 기준 로컬스토리지 동기화)
  const [foundSet, setFoundSet] = useState<Set<number>>(new Set());
  const [isRewardClaimed, setIsRewardClaimed] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);

  // 줌 레벨 (1x, 1.5x, 2x)
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hintActiveHeroId, setHintActiveHeroId] = useState<number | null>(null);
  const [hintCooldown, setHintCooldown] = useState<number>(0);

  // 오클릭 리플 이펙트 좌표
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number } | null>(null);

  // 로컬스토리지 로드
  useEffect(() => {
    if (isOpen) {
      const storageKey = `hero_daily_hidden_cleared_${todayStr}`;
      const savedCleared = localStorage.getItem(storageKey);
      if (savedCleared === 'true') {
        setIsRewardClaimed(true);
        // 이미 클리어된 경우 모든 영웅 발견 처리
        setFoundSet(new Set(hiddenHeroes.map((h) => h.id)));
      } else {
        const progressKey = `hero_daily_hidden_progress_${todayStr}`;
        const savedProgress = localStorage.getItem(progressKey);
        if (savedProgress) {
          try {
            const arr = JSON.parse(savedProgress);
            setFoundSet(new Set(arr));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, [isOpen, todayStr, hiddenHeroes]);

  // 힌트 쿨다운 타이머
  useEffect(() => {
    if (hintCooldown > 0) {
      const timer = setTimeout(() => setHintCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [hintCooldown]);

  // 숨은 영웅 클릭 핸들러
  const handleHeroClick = (heroId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (foundSet.has(heroId)) return;

    triggerHaptic('medium');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    const nextSet = new Set(foundSet);
    nextSet.add(heroId);
    setFoundSet(nextSet);

    // 진행 상태 저장
    try {
      localStorage.setItem(`hero_daily_hidden_progress_${todayStr}`, JSON.stringify(Array.from(nextSet)));
    } catch (e) {
      console.error(e);
    }

    // 4명 모두 찾았는지 확인
    if (nextSet.size === hiddenHeroes.length && !isRewardClaimed) {
      handleAllFound();
    }
  };

  // 4명 모두 발견 시 보상 처리
  const handleAllFound = () => {
    const REWARD_AMOUNT = 1500;
    setIsRewardClaimed(true);
    setShowVictoryModal(true);

    try {
      localStorage.setItem(`hero_daily_hidden_cleared_${todayStr}`, 'true');
    } catch (e) {
      console.error(e);
    }

    updateSns(
      REWARD_AMOUNT,
      language === 'ko' ? '일일 숨은그림 찾기 올클리어 보상' : 'Daily Hidden Hero Clear'
    );
    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    triggerHaptic('heavy');
  };

  // 캔버스 빈 곳 클릭 시 오클릭 피드백
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickRipple({ x, y });
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    triggerHaptic('light');

    setTimeout(() => {
      setClickRipple(null);
    }, 600);
  };

  // 정령의 나침반 힌트 사용
  const handleUseHint = () => {
    if (hintCooldown > 0) return;

    // 아직 못 찾은 영웅 1명 추출
    const remaining = hiddenHeroes.filter((h) => !foundSet.has(h.id));
    if (remaining.length === 0) return;

    const target = remaining[0];
    setHintActiveHeroId(target.id);
    setHintCooldown(20); // 20초 쿨다운
    triggerHaptic('medium');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');

    setTimeout(() => {
      setHintActiveHeroId(null);
    }, 4500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none font-mono">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 15 }}
        className="relative w-full max-w-lg bg-[#141618] border border-cyan-500/40 rounded-none shadow-[0_0_30px_rgba(6,182,212,0.2)] text-white overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#17202a] via-[#10171d] to-[#17202a] border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-md">
              <Search size={16} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black tracking-wide text-cyan-300">
                  {language === 'ko' ? '일일 숨은 히어로 찾기' : 'DAILY HIDDEN HERO'}
                </h3>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded-sm animate-pulse">
                  NEW
                </span>
                {isRewardClaimed && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-600 text-white rounded-sm">
                    {language === 'ko' ? '오늘 완료 ✓' : 'COMPLETED'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-400">
                {language === 'ko' ? currentTheme.titleKo : currentTheme.titleEn} ({todayStr})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 툴바: 줌 토글 & 힌트 & 진행 상태 */}
        <div className="flex items-center justify-between px-3 py-2 bg-stone-900 border-b border-stone-800 text-xs">
          {/* 찾은 영웅 수 카운터 */}
          <div className="flex items-center gap-2">
            <span className="text-stone-400">{language === 'ko' ? '발견 현황:' : 'Found:'}</span>
            <span className="font-black text-amber-300">
              {foundSet.size} / {hiddenHeroes.length}
            </span>
            <div className="flex gap-1">
              {hiddenHeroes.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    foundSet.has(h.id) ? 'bg-emerald-400 scale-110 shadow-xs' : 'bg-stone-700'
                  )}
                />
              ))}
            </div>
          </div>

          {/* 줌 제어 & 힌트 버튼 */}
          <div className="flex items-center gap-1.5">
            {/* 줌인/줌아웃 토글 */}
            <div className="flex items-center bg-stone-950 border border-stone-800 rounded-sm p-0.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
                className="px-2 py-0.5 text-[10px] font-bold text-cyan-300 hover:text-white flex items-center gap-1"
                title="확대/축소"
              >
                <ZoomIn size={12} />
                <span>{zoomLevel}x</span>
              </button>
            </div>

            {/* 정령의 나침반 힌트 */}
            <button
              type="button"
              disabled={hintCooldown > 0 || isRewardClaimed}
              onClick={handleUseHint}
              className={cn(
                'px-2.5 py-1 text-[10px] font-bold rounded-sm border flex items-center gap-1 transition-all',
                hintCooldown > 0 || isRewardClaimed
                  ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  : 'bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border-indigo-500/50 shadow-xs'
              )}
            >
              <Compass size={12} className={cn(hintCooldown > 0 && 'opacity-50')} />
              <span>
                {hintCooldown > 0
                  ? `${hintCooldown}s`
                  : language === 'ko'
                  ? '힌트'
                  : 'HINT'}
              </span>
            </button>
          </div>
        </div>

        {/* 메인 탐색 뷰포트 (그림 영역) */}
        <div className="relative flex-1 bg-stone-950 overflow-hidden flex flex-col">
          {/* 스크롤/팬 가능한 일러스트 프레임 */}
          <div className="relative w-full h-[52vh] overflow-auto touch-pan-x touch-pan-y cursor-crosshair">
            <div
              onClick={handleBackgroundClick}
              style={{
                width: `${zoomLevel * 100}%`,
                height: `${zoomLevel * 100}%`,
                minHeight: '100%',
              }}
              className={cn(
                'relative bg-gradient-to-br transition-all duration-200 overflow-hidden select-none',
                currentTheme.bgGradient
              )}
            >
              {/* 테마 배경 건축물 & 지형 데코레이션 SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
                <defs>
                  <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridPattern)" />

                {/* 랜드마크 실루엣들 */}
                {currentTheme.landmarks.map((lm, idx) => (
                  <rect
                    key={idx}
                    x={`${lm.x - lm.w / 10}%`}
                    y={`${lm.y - lm.h / 10}%`}
                    width={`${lm.w * 0.4}%`}
                    height={`${lm.h * 0.35}%`}
                    rx="4"
                    fill={lm.color}
                    fillOpacity={lm.opacity}
                  />
                ))}

                {/* 은은한 마법 파티클 빛줄기 */}
                <circle cx="50%" cy="30%" r="22%" fill={currentTheme.primaryColor} fillOpacity="0.12" filter="blur(25px)" />
                <circle cx="20%" cy="70%" r="18%" fill={currentTheme.primaryColor} fillOpacity="0.08" filter="blur(20px)" />
                <circle cx="80%" cy="60%" r="16%" fill={currentTheme.primaryColor} fillOpacity="0.08" filter="blur(20px)" />
              </svg>

              {/* 오클릭 물결 리플 이펙트 */}
              {clickRipple && (
                <motion.div
                  initial={{ scale: 0.2, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.55 }}
                  style={{ left: `${clickRipple.x}%`, top: `${clickRipple.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none w-10 h-10 rounded-full border-2 border-stone-400 bg-stone-300/20"
                />
              )}

              {/* 숨겨진 4명의 미니 캐릭터들 (아주 작게 24px 크기로 은신) */}
              {hiddenHeroes.map((hero) => {
                const isFound = foundSet.has(hero.id);
                const isHintTarget = hintActiveHeroId === hero.id;

                return (
                  <div
                    key={hero.instanceId}
                    style={{
                      left: `${hero.spot.x}%`,
                      top: `${hero.spot.y}%`,
                    }}
                    onClick={(e) => handleHeroClick(hero.id, e)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  >
                    {/* 힌트 활성화 시 주변 펄스 파동 */}
                    {isHintTarget && !isFound && (
                      <motion.div
                        animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0.1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="absolute -inset-4 rounded-full border-2 border-cyan-400 bg-cyan-400/20 pointer-events-none"
                      />
                    )}

                    {/* 초소형 미니 캐릭터 스프라이트 (24px x 24px) */}
                    <div
                      className={cn(
                        'w-6 h-6 rounded-xs border transition-all duration-300 flex items-center justify-center overflow-hidden',
                        isFound
                          ? 'border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] scale-110 bg-emerald-950/80 ring-2 ring-emerald-300'
                          : 'border-white/20 bg-stone-900/80 opacity-85 hover:opacity-100 hover:scale-125 hover:border-amber-400 hover:z-30 shadow-sm'
                      )}
                    >
                      <div
                        className="w-full h-full scale-120"
                        style={getCardSpriteStyle(hero.id)}
                      />
                    </div>

                    {/* 발견 시 팡파레 체크 마크 */}
                    {isFound && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-md pointer-events-none"
                      >
                        <CheckCircle2 size={10} />
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 승리 축하 모달 오버레이 */}
          <AnimatePresence>
            {showVictoryModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3">
                  <Trophy size={32} className="text-amber-400 animate-bounce" />
                </div>
                <h4 className="text-lg font-black text-amber-300 tracking-wide">
                  {language === 'ko' ? '탐색 완료! 모든 영웅 발견!' : 'ALL HEROES FOUND!'}
                </h4>
                <p className="text-xs text-stone-300 mt-1 max-w-xs">
                  {language === 'ko'
                    ? '오늘의 신비한 그림 속에 은신했던 4명의 영웅들을 완벽하게 모두 찾아냈습니다!'
                    : 'You successfully discovered all 4 hidden heroes in todays artwork!'}
                </p>
                <div className="my-3 px-4 py-2 bg-stone-900 border border-amber-500/40 rounded-sm flex items-center gap-2">
                  <Zap size={16} className="text-amber-400" />
                  <span className="text-sm font-black text-amber-300">+1,500 SNS 지급 완료</span>
                </div>
                <p className="text-[10px] text-stone-500 font-mono">
                  {language === 'ko' ? '※ 내일 자정에 새로운 그림과 영웅들이 찾아옵니다!' : 'New artwork arrives tomorrow at midnight!'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowVictoryModal(false)}
                  className="mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-sm shadow-md"
                >
                  {language === 'ko' ? '확인 (닫기)' : 'CLOSE'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 하단 타겟 영웅 리스트 패널 */}
        <div className="p-3 bg-[#171a1d] border-t border-stone-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>
              {language === 'ko' ? '오늘의 수색 타겟 (4명):' : 'Todays Target Heroes (4):'}
            </span>
            <span className="text-[10px] text-stone-500">
              {isRewardClaimed
                ? language === 'ko'
                  ? '보상 수령 완료 (1,500 SNS)'
                  : 'Reward Claimed (+1,500 SNS)'
                : language === 'ko'
                ? '모두 찾으면 1,500 SNS 지급!'
                : 'Find all for 1,500 SNS!'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {hiddenHeroes.map((hero) => {
              const isFound = foundSet.has(hero.id);
              return (
                <div
                  key={hero.id}
                  className={cn(
                    'p-1.5 rounded-sm border flex flex-col items-center text-center transition-all',
                    isFound
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-xs'
                      : 'bg-stone-900 border-stone-800 opacity-75'
                  )}
                >
                  {/* 카드 스프라이트 */}
                  <div className="relative w-8 h-8 rounded-xs overflow-hidden border border-stone-700 bg-stone-950 mb-1 flex items-center justify-center">
                    <div
                      className="w-full h-full scale-110"
                      style={getCardSpriteStyle(hero.id)}
                    />
                    {isFound && (
                      <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-stone-200 truncate w-full">
                    {language === 'ko' ? hero.nameKo : hero.nameEn}
                  </span>

                  <span
                    className={cn(
                      'text-[8px] font-mono mt-0.5 px-1 rounded-xs',
                      isFound ? 'bg-emerald-800 text-emerald-200' : 'bg-stone-800 text-stone-400'
                    )}
                  >
                    {isFound ? (language === 'ko' ? '발견!' : 'FOUND') : (language === 'ko' ? '미발견' : 'HIDDEN')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
