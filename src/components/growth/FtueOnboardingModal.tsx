import React, { useState, useEffect } from 'react';
import {
  FTUE_STARTER_SSR_CARDS,
  type GrowthHeroCard,
  type GrowthRewardPayload,
  trackGrowthEvent,
} from './growthTypes';

interface FtueOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteReward: (reward: GrowthRewardPayload) => void;
  onNavigate?: (destination: 'card-shop' | 'my-deck' | 'battle-arena') => void;
}

type FtueStep = 'PACK_READY' | 'PACK_OPENING' | 'PICK_HERO' | 'CLIMAX_BATTLE' | 'VICTORY_REWARD';

export const FtueOnboardingModal: React.FC<FtueOnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleteReward,
  onNavigate,
}) => {
  const [step, setStep] = useState<FtueStep>('PACK_READY');
  const [selectedHero, setSelectedHero] = useState<GrowthHeroCard>(FTUE_STARTER_SSR_CARDS[0]);
  const [bossHp, setBossHp] = useState<number>(42);
  const [allyHp, setAllyHp] = useState<number>(28);
  const [isOverdriveReady, setIsOverdriveReady] = useState<boolean>(false);
  const [isOverdriveFired, setIsOverdriveFired] = useState<boolean>(false);
  const [battleLogs, setBattleLogs] = useState<string[]>([
    '⚡ [AI 결승 시뮬레이션] 카오스 오버로드 보스전 클라이맥스 돌입!',
    '⚠️ 경고: 아군 덱 에너지가 28%로 위기 상황입니다!',
  ]);

  useEffect(() => {
    if (isOpen) {
      trackGrowthEvent('ftue_impression');
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== 'CLIMAX_BATTLE') return;

    const timer1 = setTimeout(() => {
      setBossHp(36);
      setAllyHp(19);
      setBattleLogs((prev) => [
        ...prev,
        '💥 보스의 광역 공격! 아군 보호막이 임계점에 도달했습니다!',
      ]);
    }, 900);

    const timer2 = setTimeout(() => {
      setIsOverdriveReady(true);
      setBattleLogs((prev) => [
        ...prev,
        `🔥 [전술 개입 찬스] 지금 [${selectedHero.name}]의 시너지 궁극기를 발동하세요!`,
      ]);
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [step, selectedHero]);

  if (!isOpen) return null;

  const handleOpenPack = () => {
    trackGrowthEvent('ftue_pack_opened');
    setStep('PACK_OPENING');
    setTimeout(() => {
      setStep('PICK_HERO');
    }, 750);
  };

  const handleConfirmHeroAndStartBattle = (hero: GrowthHeroCard) => {
    setSelectedHero(hero);
    trackGrowthEvent('ftue_hero_selected', { hero_id: hero.id, hero_name: hero.name });
    setStep('CLIMAX_BATTLE');
  };

  const handleTriggerOverdrive = () => {
    if (isOverdriveFired) return;
    setIsOverdriveFired(true);
    trackGrowthEvent('ftue_overdrive_triggered', { hero_id: selectedHero.id });

    setBattleLogs((prev) => [
      ...prev,
      `⚡ [${selectedHero.name}] '${selectedHero.skillName}' 발동!! (시너지 데미지 99,999!)`,
    ]);
    setBossHp(0);

    setTimeout(() => {
      localStorage.setItem('snshero_ftue_completed', 'true');
      localStorage.setItem('snshero_starter_hero', JSON.stringify(selectedHero));
      const reward: GrowthRewardPayload = {
        snsPoints: 1000,
        freeTickets: 10,
        rewardCard: selectedHero,
        source: 'FTUE_CLEAR',
      };
      onCompleteReward(reward);
      trackGrowthEvent('ftue_completed', { reward_points: 1000 });
      setStep('VICTORY_REWARD');
    }, 1300);
  };

  const handleSkip = () => {
    localStorage.setItem('snshero_ftue_completed', 'true');
    trackGrowthEvent('ftue_skipped', { step });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 md:p-8 text-white shadow-[0_0_70px_rgba(6,182,212,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              SNSHero Instant Awakening • 110 Cards AI TCG
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            건너뛰기 (Skip) ✕
          </button>
        </div>

        {(step === 'PACK_READY' || step === 'PACK_OPENING') && (
          <div className="flex flex-col items-center text-center py-4">
            <span className="mb-2 inline-block rounded-full bg-cyan-500/15 border border-cyan-400/40 px-4 py-1 text-xs font-semibold text-cyan-300">
              🎁 신규 지휘관 100% SSR 확정 웰컴 팩
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
              터치 한 번으로 당신의 <span className="text-cyan-400">SSR 리더 히어로</span>를 깨우세요!
            </h2>
            <p className="text-sm text-slate-400 mb-8 max-w-md">
              110종의 히어로 중 5장 시너지 덱을 이끌 파트너를 선택하고, 15초 만에 끝나는 짜릿한 AI 클라이맥스 배틀을 경험해 보세요.
            </p>

            <button
              onClick={handleOpenPack}
              disabled={step === 'PACK_OPENING'}
              className={`group relative flex flex-col items-center justify-center w-60 h-80 rounded-2xl border-2 border-cyan-400/80 bg-gradient-to-br from-cyan-600/30 via-indigo-900/60 to-fuchsia-600/30 shadow-[0_0_50px_rgba(6,182,212,0.4)] transition-all duration-500 cursor-pointer ${
                step === 'PACK_OPENING'
                  ? 'scale-125 rotate-6 opacity-0 blur-md'
                  : 'hover:scale-105 hover:shadow-[0_0_70px_rgba(236,72,153,0.6)]'
              }`}
            >
              <div className="text-6xl mb-4 transform group-hover:scale-110 transition">🃏</div>
              <div className="text-xs font-bold tracking-widest text-cyan-300 uppercase mb-1">
                GENESIS EDITION
              </div>
              <div className="text-lg font-black text-white px-4">
                SSR 리더 팩 개봉하기
              </div>
              <div className="mt-6 rounded-full bg-cyan-400 px-5 py-1.5 text-xs font-extrabold text-slate-950 shadow-lg animate-bounce">
                👆 여기를 터치해서 팩 찢기!
              </div>
            </button>
          </div>
        )}

        {step === 'PICK_HERO' && (
          <div>
            <div className="text-center mb-6">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                ✨ SSR CRITICAL PULL! ✨
              </span>
              <h2 className="text-2xl font-extrabold mt-1">
                당신의 첫 5장 덱을 지휘할 <span className="text-amber-400">SSR 파트너</span>를 선택하세요
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                선택 즉시 해당 히어로가 포함된 시너지 덱으로 15초 실전 결승전에 투입됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FTUE_STARTER_SSR_CARDS.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleConfirmHeroAndStartBattle(card)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 hover:border-cyan-400 hover:bg-slate-800/90 transition-all cursor-pointer shadow-lg hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-md bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-xs font-black text-slate-950">
                        {card.grade}
                      </span>
                      <span className="text-xs font-semibold text-cyan-300">
                        ⚡ 전투력 {card.power.toLocaleString()}
                      </span>
                    </div>

                    <div className="my-3 flex h-24 items-center justify-center rounded-xl bg-slate-950/80 border border-slate-800 text-5xl group-hover:scale-105 transition">
                      {card.avatarEmoji}
                    </div>

                    <div className="text-xs font-bold text-fuchsia-400 mb-0.5">
                      #{card.synergyTag}
                    </div>
                    <h3 className="text-base font-extrabold text-white">{card.name}</h3>
                    <p className="text-xs text-slate-400 mb-3">{card.title}</p>

                    <div className="rounded-lg bg-slate-950/90 p-2.5 border border-slate-800/80 text-xs">
                      <div className="font-bold text-amber-300 mb-1">
                        필살기: {card.skillName}
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {card.skillDesc}
                      </p>
                    </div>
                  </div>

                  <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-extrabold text-white shadow-md group-hover:from-cyan-400 group-hover:to-blue-500 transition">
                    이 히어로로 즉시 출전 🚀
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'CLIMAX_BATTLE' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-xs font-bold text-rose-300">
                🔥 FINAL ROUND • 15초 클라이맥스
              </span>
              <span className="text-xs text-slate-400">
                리더: <strong className="text-cyan-300">{selectedHero.name}</strong>
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 mb-4">
              <div className="mb-5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400">👾 적 보스: 카오스 AI 오버로드 (Lv.99)</span>
                  <span className="text-rose-300">{bossHp}%</span>
                </div>
                <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-600 to-orange-500 transition-all duration-500"
                    style={{ width: `${bossHp}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-around py-4 border-y border-slate-900 my-2">
                <div className="text-center">
                  <div className="text-4xl mb-1">{selectedHero.avatarEmoji}</div>
                  <div className="text-xs font-bold text-cyan-300">{selectedHero.name}</div>
                  <div className="text-[10px] text-slate-400">+ 시너지 4인 덱</div>
                </div>
                <div className="text-xl font-black text-amber-400 animate-pulse">VS</div>
                <div className="text-center">
                  <div className={`text-4xl mb-1 transition-transform duration-300 ${isOverdriveFired ? 'scale-150 opacity-20 rotate-45' : ''}`}>
                    👹
                  </div>
                  <div className="text-xs font-bold text-rose-400">카오스 오버로드</div>
                  <div className="text-[10px] text-slate-400">전투력 45,000</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-cyan-400">🛡️ 내 5장 시너지 덱 에너지</span>
                  <span className="text-cyan-300">{allyHp}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${allyHp}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 mb-5 h-24 overflow-y-auto space-y-1.5 text-xs">
              {battleLogs.map((log, i) => (
                <div key={i} className="text-slate-200 font-medium">
                  {log}
                </div>
              ))}
            </div>

            <button
              onClick={handleTriggerOverdrive}
              disabled={!isOverdriveReady || isOverdriveFired}
              className={`w-full rounded-2xl py-4 px-6 font-black text-base md:text-lg shadow-2xl transition-all ${
                isOverdriveReady && !isOverdriveFired
                  ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-fuchsia-600 text-white animate-pulse hover:scale-[1.02] cursor-pointer shadow-[0_0_40px_rgba(244,63,94,0.6)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isOverdriveFired
                ? '💥 시너지 필살기 적중!! 보스 격파 완료!'
                : isOverdriveReady
                ? `⚡ [전술 개입 터치!] ${selectedHero.skillName} 발동하기 (역전승!)`
                : '⏳ 시너지 오버드라이브 게이지 충전 중...'}
            </button>
          </div>
        )}

        {step === 'VICTORY_REWARD' && (
          <div className="text-center py-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 border border-amber-400/50 text-4xl mb-3">
              🏆
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              클라이맥스 역전승 달성!
            </h2>
            <p className="text-sm text-slate-300 mt-1 mb-6">
              신규 지휘관님을 위한 정착 지원 패키지가 즉시 지급되었습니다.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl border border-amber-400/40 bg-slate-900/90 p-3">
                <div className="text-2xl mb-1">{selectedHero.avatarEmoji}</div>
                <div className="text-[11px] text-amber-300 font-bold">SSR 리더 합류</div>
                <div className="text-xs font-extrabold text-white truncate">
                  {selectedHero.name}
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-400/40 bg-slate-900/90 p-3">
                <div className="text-2xl mb-1">💎</div>
                <div className="text-[11px] text-cyan-300 font-bold">정착 지원금</div>
                <div className="text-sm font-extrabold text-white">+1,000 SNS</div>
              </div>
              <div className="rounded-2xl border border-fuchsia-400/40 bg-slate-900/90 p-3">
                <div className="text-2xl mb-1">🎟️</div>
                <div className="text-[11px] text-fuchsia-300 font-bold">무료 카드 뽑기</div>
                <div className="text-sm font-extrabold text-white">10연차 티켓</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onClose();
                  onNavigate?.('card-shop');
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-extrabold text-white shadow-lg hover:from-cyan-400 hover:to-blue-500 transition"
              >
                🎁 무료 10연차 카드 뽑기 하러가기
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigate?.('my-deck');
                }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-3.5 text-sm font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                ⚔️ 내 5장 덱 확인하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
