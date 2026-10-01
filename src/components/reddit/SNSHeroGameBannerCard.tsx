/**
 * SNSHeroGameBannerCard.tsx
 * 피드 10개 포스트마다 1번씩 삽입되는 SNShero.com 게임 전용 공식 프로모션 배너 카드
 * 클릭 시 즉시 SNSHero 웹 카드 게임 로비(/home 또는 onGoToGame)로 이동
 */

import React from 'react';
import { Gamepad2, Sparkles, Trophy, ArrowRight, Flame, Shield, Zap } from 'lucide-react';

interface SNSHeroGameBannerCardProps {
  isDark: boolean;
  isKo?: boolean;
  onGoToGame: () => void;
}

export const SNSHeroGameBannerCard: React.FC<SNSHeroGameBannerCardProps> = ({
  isDark,
  isKo = true,
  onGoToGame,
}) => {
  return (
    <article
      onClick={onGoToGame}
      className={`group relative rounded-2xl border p-4 sm:p-5 mb-3.5 shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 w-full max-w-full overflow-hidden select-none hover:scale-[1.008] active:scale-[0.99] ${
        isDark
          ? 'bg-gradient-to-br from-[#1A1208] via-[#1E1B18] to-[#121518] border-[#FF4500]/40 text-gray-100'
          : 'bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white border-[#FF4500]/30 text-gray-900'
      }`}
    >
      {/* 배경 은은한 네온 글로우 효과 */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-bl from-[#FF4500]/25 via-amber-500/15 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* 1. 상단 태그 바 */}
      <div className="relative z-10 flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF4500] to-[#FF8700] flex items-center justify-center text-white shadow-md shadow-[#FF4500]/30 group-hover:rotate-6 transition-transform">
            <Gamepad2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-xs tracking-tight text-[#FF4500] uppercase font-mono">
            SNSHero Official Game
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4500]/15 text-[#FF4500] border border-[#FF4500]/30">
            <Sparkles className="w-2.5 h-2.5 animate-pulse" />
            <span>{isKo ? '추천 게임' : 'Featured Game'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
          <Trophy className="w-3.5 h-3.5" />
          <span>{isKo ? '100% 무료 플레이' : '100% Free'}</span>
        </div>
      </div>

      {/* 2. 전설 완성 공식 배너 이미지 (1024x552 원본 비율 100% 보존) */}
      <div className="relative z-10 w-full aspect-[1024/552] rounded-xl overflow-hidden mb-3.5 border border-inherit/20 bg-black/90 shadow-md">
        <img
          src="/banner_snshero_legend.jpg"
          alt="SNSHero Complete Your Legend"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* 3. 메인 타이틀 및 액션 */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight flex items-center gap-2 group-hover:text-[#FF4500] transition-colors">
              <span>{isKo ? 'SNS히어로 레볼루션: AI 웹 카드 배틀 아레나' : 'SNSHero Revolution: AI Web Card Battle'}</span>
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
              INSTALL 0s
            </span>
          </div>

          <p className="text-xs sm:text-sm opacity-80 leading-relaxed font-sans line-clamp-2">
            {isKo
              ? '설치 없이 웹에서 클릭 한 번으로 즉시 접속! 110여 종의 픽셀 영웅 카드 수집, 실시간 자동 카드 배틀, 시즌 아레나 랭킹에 지금 도전하세요.'
              : 'Zero download required! Play instantly in your browser with 110+ pixel hero cards, auto-battles, and seasonal arena leaderboards.'}
          </p>

          {/* 특징 칩들 */}
          <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-semibold opacity-85">
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3 h-3" />
              <span>{isKo ? '신규 가입 +1,000 SNS 지급' : '+1,000 SNS Welcome Bonus'}</span>
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1 text-sky-400">
              <Shield className="w-3 h-3" />
              <span>{isKo ? '최대 100회 무료 뽑기' : 'Up to 100 Free Summons'}</span>
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1 text-orange-400">
              <Flame className="w-3 h-3" />
              <span>{isKo ? '로컬 저장 100% 영구 보존' : 'Zero Data Loss'}</span>
            </span>
          </div>
        </div>

        {/* 3. 우측 대형 액션 CTA 버튼 */}
        <div className="flex-shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGoToGame();
            }}
            className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-gradient-to-r from-[#FF4500] via-[#FF5414] to-[#FF7300] hover:from-[#FF5414] hover:to-[#FF8500] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#FF4500]/30 hover:shadow-[#FF4500]/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          >
            <Gamepad2 className="w-4 h-4 animate-bounce" />
            <span>{isKo ? '지금 게임하기' : 'Play Game Now'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </article>
  );
};
