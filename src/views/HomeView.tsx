import React, { useState } from 'react';
import { 
  Gamepad2, BookOpen, ShoppingBag, Shield, Trophy, 
  Settings, Users, Sparkles, Compass, Play, ChevronRight,
  Flame, Award, Layers
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { t } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptic';

interface HomeViewProps {
  playSfx?: (sfx: string) => void;
  bgmStarted?: boolean;
  startAudio?: () => void;
  totalPower?: number;
  currentDeck?: any[];
  currentSeason?: string;
  onNavigate: (view: any) => void;
  language: Language;
  user?: UserProfile | null;
  handleLogin?: () => void;
  handleLogout?: () => void;
  onStartTutorial?: () => void;
  isTutorialCompleted?: boolean;
  isTutorialMode?: boolean;
  tutorialStep?: number;
  onStartPlayNow?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playSfx,
  totalPower = 100,
  currentDeck = [],
  currentSeason = 'season1',
  onNavigate,
  language,
  user,
  onStartPlayNow
}) => {
  const [activeCategory, setActiveCategory] = useState<'game' | 'media' | 'market'>('game');

  const handleNav = (v: string) => {
    triggerHaptic('light');
    if (playSfx) playSfx('click');
    onNavigate(v);
  };

  return (
    <div className="w-full max-w-lg mx-auto min-h-[calc(100dvh-5rem)] p-4 font-mono text-[#201d1d] flex flex-col justify-between">
      {/* Upper Status Bar */}
      <header className="border-b border-[#201d1d]/15 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-tight bg-[#201d1d] text-white px-2 py-0.5 rounded-sm">
              SNS HERO
            </span>
            <span className="text-[11px] text-[#201d1d]/60 font-bold uppercase">
              [{currentSeason}]
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-sm">
              ⚡ 전투력: {totalPower.toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Card Action */}
      <section className="mb-4">
        <div className="border border-[#201d1d]/20 bg-white p-4 rounded-none relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1">
              <Flame size={13} />
              QUICK BATTLE ARENA
            </span>
            <span className="text-[10px] text-[#201d1d]/50">
              덱 구성: {currentDeck.length}/5
            </span>
          </div>
          <h2 className="text-base font-black mb-1">
            {language === 'ko' ? '카단 & 아케인 에코즈 아레나' : 'Kadan & Arcane Echoes Arena'}
          </h2>
          <p className="text-xs text-[#201d1d]/70 mb-4 leading-relaxed">
            {language === 'ko'
              ? '원클릭 AI 카드 배틀과 실시간 아케이드 미션을 지금 즉시 플레이하세요.'
              : 'Jump straight into 1-Click AI Card Battles and Live Arcade Missions.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (onStartPlayNow) onStartPlayNow();
                else handleNav('play');
              }}
              className="flex-1 py-2.5 px-4 bg-[#201d1d] hover:bg-black text-white text-xs font-black rounded-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Play size={14} className="fill-white" />
              <span>{language === 'ko' ? '[ 즉시 배틀 시작 ]' : '[ BATTLE NOW ]'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('deck')}
              className="py-2.5 px-3 border border-[#201d1d]/20 hover:bg-[#201d1d]/5 text-xs font-bold rounded-sm flex items-center gap-1 cursor-pointer"
            >
              <Layers size={14} />
              <span>{language === 'ko' ? '마이덱' : 'Deck'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Core Category Tabs (Minimal First View) */}
      <section className="flex-1 mb-4">
        <div className="flex border-b border-[#201d1d]/20 mb-3">
          <button
            type="button"
            onClick={() => setActiveCategory('game')}
            className={`flex-1 py-2 text-xs font-black border-b-2 text-center transition-all cursor-pointer ${
              activeCategory === 'game'
                ? 'border-[#201d1d] text-[#201d1d]'
                : 'border-transparent text-[#201d1d]/40 hover:text-[#201d1d]/70'
            }`}
          >
            🎮 {language === 'ko' ? '게임 아레나' : 'Game Arena'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('media')}
            className={`flex-1 py-2 text-xs font-black border-b-2 text-center transition-all cursor-pointer ${
              activeCategory === 'media'
                ? 'border-[#201d1d] text-[#201d1d]'
                : 'border-transparent text-[#201d1d]/40 hover:text-[#201d1d]/70'
            }`}
          >
            📚 {language === 'ko' ? '미디어 라운지' : 'Media Lounge'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('market')}
            className={`flex-1 py-2 text-xs font-black border-b-2 text-center transition-all cursor-pointer ${
              activeCategory === 'market'
                ? 'border-[#201d1d] text-[#201d1d]'
                : 'border-transparent text-[#201d1d]/40 hover:text-[#201d1d]/70'
            }`}
          >
            💼 {language === 'ko' ? '마켓/경제' : 'Market'}
          </button>
        </div>

        {/* Tab 1: Game Arena */}
        {activeCategory === 'game' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleNav('play')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Gamepad2 size={16} className="text-indigo-600" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '미션 아레나' : 'Mission Arena'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '110종 배틀 미션' : '110 Mission Games'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('ranking')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Trophy size={16} className="text-amber-500" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '랭킹전' : 'Rankings'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '시즌 탑 플레이어' : 'Season Top List'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('guild')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Shield size={16} className="text-emerald-600" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '길드 하우스' : 'Guild'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '협력 레이드 & 랜드마크' : 'Co-op Raids'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('season_hub')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Award size={16} className="text-purple-600" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '시즌 허브' : 'Season Hub'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '시즌 패스 & 보상' : 'Pass & Rewards'}</span>
              </div>
            </button>
          </div>
        )}

        {/* Tab 2: Media Lounge */}
        {activeCategory === 'media' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleNav('novel')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <BookOpen size={16} className="text-blue-600" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '웹소설 & 웹툰' : 'Web Novels & Toons'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '카단 스토리 연재' : 'Kadan Lore'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('anime')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Sparkles size={16} className="text-rose-500" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '애니메이션' : 'Animation'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '공식 쇼츠 & 영상' : 'Official Shorts'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('codex')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Compass size={16} className="text-teal-600" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '세계관 도감' : 'World Codex'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '히어로 & 몬스터 백과' : 'Hero Wiki'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('movie')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Play size={16} className="text-amber-600" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '시네마 극장' : 'Cinema'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '인터랙티브 무비' : 'Interactive Movie'}</span>
              </div>
            </button>
          </div>
        )}

        {/* Tab 3: Market & Economy */}
        {activeCategory === 'market' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleNav('shop')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <ShoppingBag size={16} className="text-amber-500" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '상점 & 가챠' : 'Shop & Gacha'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '카드팩 & 무료 소환' : 'Summon & Packs'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('marketplace')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Users size={16} className="text-blue-600" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '카드 거래소' : 'Card Market'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '유저 P2P 에스크로' : 'P2P Trading'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('prediction')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Flame size={16} className="text-red-500" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '승부예측 마켓' : 'Prediction'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '실시간 경기 베팅' : 'Live Match Picks'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNav('settings')}
              className="p-3 border border-[#201d1d]/15 bg-white hover:border-[#201d1d] text-left rounded-sm transition-all cursor-pointer flex flex-col justify-between h-20"
            >
              <div className="flex items-center justify-between">
                <Settings size={16} className="text-[#201d1d]/70" />
                <ChevronRight size={13} className="text-[#201d1d]/40" />
              </div>
              <div>
                <span className="text-xs font-black block">{language === 'ko' ? '환경 설정' : 'Settings'}</span>
                <span className="text-[10px] text-[#201d1d]/60">{language === 'ko' ? '사운드 & 백업' : 'Preferences'}</span>
              </div>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeView;
