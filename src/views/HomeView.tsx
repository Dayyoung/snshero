import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Play, Zap, Trophy, ShoppingBag, Shield, Layers, 
  Sparkles, Bot, Award, ArrowRight, User
} from 'lucide-react';
import { ViewType, CardData, Language } from '../types';
import { MainLobbyBannerCarousel } from '../components/MainLobbyBannerCarousel';
import { CardItem } from '../components/CardItem';
import { getCardSpriteStyle } from '../lib/utils';
import { t } from '../lib/i18n';

export interface HomeViewProps {
  playSfx: (url: string) => void;
  bgmStarted?: boolean;
  startAudio?: () => void;
  totalPower?: number;
  currentDeck?: CardData[];
  currentSeason?: string;
  onNavigate: (targetView: ViewType) => void;
  language: Language;
  user?: any;
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
  totalPower = 0,
  currentDeck = [],
  currentSeason = 'season1',
  onNavigate,
  language,
  user,
  handleLogin,
  handleLogout,
  onStartTutorial,
  isTutorialCompleted,
  onStartPlayNow,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-5 sm:gap-6 text-[#201d1d]">
      {/* 1. 메인 로비 배너 캐러셀 */}
      <section className="w-full">
        <MainLobbyBannerCarousel 
          language={language} 
          onNavigate={onNavigate} 
          playSfx={playSfx} 
        />
      </section>

      {/* 2. 유저 요약 & 전투력 상태 바 */}
      <section className="w-full border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-3 sm:p-4 rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f1eeee] flex items-center justify-center font-mono font-bold text-sm">
            {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : <User size={18} />}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm">
                {user?.displayName || (language === 'ko' ? '게스트 영웅' : 'Guest Hero')}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#0f0000] text-white">
                {currentSeason.toUpperCase()}
              </span>
            </div>
            <span className="text-xs font-mono opacity-70">
              {language === 'ko' ? '총 전투력:' : 'Total CP:'} <strong>{totalPower.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {user ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] rounded-sm hover:bg-[#f1eeee] active:scale-95 cursor-pointer min-h-[36px]"
            >
              {language === 'ko' ? '로그아웃' : 'Logout'}
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="px-3 py-1.5 text-xs font-mono border border-[rgba(15,0,0,0.15)] rounded-sm bg-[#0f0000] text-white hover:opacity-90 active:scale-95 cursor-pointer min-h-[36px]"
            >
              {language === 'ko' ? '로그인' : 'Login'}
            </button>
          )}

          {onStartTutorial && !isTutorialCompleted && (
            <button
              onClick={onStartTutorial}
              className="px-3 py-1.5 text-xs font-mono border border-amber-600 bg-amber-50 text-amber-900 rounded-sm hover:bg-amber-100 active:scale-95 cursor-pointer min-h-[36px]"
            >
              {language === 'ko' ? '튜토리얼' : 'Tutorial'}
            </button>
          )}
        </div>
      </section>

      {/* 3. 대형 액션 FAB / 지금 플레이 버튼 */}
      <section className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            if (onStartPlayNow) {
              onStartPlayNow();
            } else {
              onNavigate('playgame');
            }
          }}
          className="w-full p-4 sm:p-5 border border-[#201d1d] bg-[#0f0000] text-white rounded-sm hover:opacity-90 active:scale-98 cursor-pointer flex items-center justify-between min-h-[56px] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 fill-white text-white" />
            <div className="flex flex-col text-left">
              <span className="font-mono font-black text-base sm:text-lg tracking-wider">
                {language === 'ko' ? '⚡ 3초 즉시 플레이 (PLAY NOW)' : '⚡ PLAY NOW (3s Instant)'}
              </span>
              <span className="text-xs opacity-75 font-mono">
                {language === 'ko' ? 'AI 카드 배틀 & 아케이드 모드 즉시 출격' : 'Enter AI Battle & Arcade instantly'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 opacity-80" />
        </button>

        <button
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            onNavigate('ranking');
          }}
          className="w-full p-4 sm:p-5 border border-[rgba(15,0,0,0.15)] bg-[#fdfcfc] hover:bg-[#f1eeee] rounded-sm active:scale-98 cursor-pointer flex items-center justify-between min-h-[56px] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-600" />
            <div className="flex flex-col text-left">
              <span className="font-mono font-bold text-base sm:text-lg">
                {language === 'ko' ? '🏆 랭킹전 아레나' : '🏆 Ranking Arena'}
              </span>
              <span className="text-xs opacity-75 font-mono">
                {language === 'ko' ? '실시간 PVP & 시즌 티어 랭킹' : 'Live PvP & Season Leaderboard'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 opacity-60" />
        </button>
      </section>

      {/* 4. 장착 중인 5장 대표 덱 미리보기 */}
      <section className="w-full border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-3 sm:p-4 rounded-none flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 opacity-70" />
            <span className="font-mono font-bold text-sm tracking-wider">
              {language === 'ko' ? '[현재 출격 덱 (5장)]' : '[Active Battle Deck (5 Cards)]'}
            </span>
          </div>
          <button
            onClick={() => onNavigate('mydeck')}
            className="text-xs font-mono underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            {language === 'ko' ? '덱 관리 바로가기 →' : 'Manage Deck →'}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 items-center justify-center">
          {currentDeck && currentDeck.length > 0 ? (
            currentDeck.slice(0, 5).map((card, idx) => (
              <div 
                key={card.id || `home-deck-${idx}`} 
                onClick={() => onNavigate('mydeck')}
                className="aspect-[5/7] border border-[rgba(15,0,0,0.15)] bg-[#f1eeee] rounded-xs relative overflow-hidden cursor-pointer hover:border-[#201d1d] transition-all"
              >
                <div
                  className="w-full h-full"
                  style={getCardSpriteStyle(card.imageIndex)}
                />
                <div className="absolute bottom-0 inset-x-0 bg-[#0f0000]/80 text-white text-[9px] font-mono text-center truncate px-1 py-0.5">
                  {card.name}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-5 text-center py-6 text-xs font-mono opacity-60">
              {language === 'ko' ? '장착된 카드가 없습니다. 마이덱에서 카드를 편성하세요.' : 'No cards equipped. Organize your deck.'}
            </div>
          )}
        </div>
      </section>

      {/* 5. 3대 핵심 카테고리 허브 (미니멀리즘 원칙 준수) */}
      <section className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 게임 아레나 */}
        <div 
          onClick={() => onNavigate('playgame')}
          className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none hover:border-[#201d1d] transition-all cursor-pointer flex flex-col gap-2 min-h-[90px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm">[🎮 게임 아레나]</span>
            <ArrowRight size={14} className="opacity-50" />
          </div>
          <p className="text-xs font-mono opacity-70">
            {language === 'ko' ? '110종 AI 카드 대결 & 아케이드 미션' : '110 AI Card Battles & Arcade Missions'}
          </p>
        </div>

        {/* 상점 & 마켓 */}
        <div 
          onClick={() => onNavigate('shop')}
          className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none hover:border-[#201d1d] transition-all cursor-pointer flex flex-col gap-2 min-h-[90px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm">[💼 마켓/경제]</span>
            <ArrowRight size={14} className="opacity-50" />
          </div>
          <p className="text-xs font-mono opacity-70">
            {language === 'ko' ? '카드팩 뽑기, P2P 거래소 & 주식' : 'Card Packs Gacha, P2P Market & Stocks'}
          </p>
        </div>

        {/* 미디어 라운지 */}
        <div 
          onClick={() => onNavigate('novel')}
          className="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 rounded-none hover:border-[#201d1d] transition-all cursor-pointer flex flex-col gap-2 min-h-[90px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-sm">[📚 미디어 라운지]</span>
            <ArrowRight size={14} className="opacity-50" />
          </div>
          <p className="text-xs font-mono opacity-70">
            {language === 'ko' ? '히어로 웹소설, 애니 & 커뮤니티' : 'Hero Web Novels, Anime & Community'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
