// src/components/growth/FtueOnboardingModal.tsx
import React, { useState, useEffect } from 'react';
import { FTUE_STARTER_SSR_CARDS, trackGrowthEvent } from './growthTypes';
import type { GrowthHeroCard, GrowthRewardPayload } from './growthTypes';
import {
  HeroClassEmblem,
  IconCards,
  IconChevronRight,
  IconClose,
  IconSpark,
  IconSwords,
  IconTrophy,
} from './GrowthIcons';

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
    '[SYS-01] TACTICAL SIMULATION // FINAL ROUND INITIALIZED',
    '[WARN] 아군 5인 시너지 실드 잔량 28% — 전술 개입이 필요합니다.',
  ]);

  useEffect(() => {
    if (isOpen) {
      setStep('PACK_READY');
      setBossHp(42);
      setAllyHp(28);
      setIsOverdriveReady(false);
      setIsOverdriveFired(false);
      setBattleLogs([
        '[SYS-01] TACTICAL SIMULATION // FINAL ROUND INITIALIZED',
        '[WARN] 아군 5인 시너지 실드 잔량 28% — 전술 개입이 필요합니다.',
      ]);
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
        '[ALERT] 적 코어 광역 펄스 감지 — 방어 장벽 임계점 도달',
      ]);
    }, 850);

    const timer2 = setTimeout(() => {
      setIsOverdriveReady(true);
      setBattleLogs((prev) => [
        ...prev,
        '[READY] OVERDRIVE 100% — [' + selectedHero.name + '] 시너지 프로토콜 승인 대기 중',
      ]);
    }, 1650);

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
    }, 650);
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
      '[EXEC] ' + selectedHero.name + ' // ' + selectedHero.skillName + ' 발동 (CRITICAL 99,999)',
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
    }, 1150);
  };

  const handleSkip = () => {
    localStorage.setItem('snshero_ftue_completed', 'true');
    trackGrowthEvent('ftue_skipped', { step });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-[#090d16] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* 상단 마이크로 그리드 라인 */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              SNSHERO TACTICAL ONBOARDING // 110 CARDS ARCHIVE
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-white/25 hover:text-white transition cursor-pointer"
          >
            <span>SKIP</span>
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* STEP 1: 카드 코어 언락 */}
          {(step === 'PACK_READY' || step === 'PACK_OPENING') && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-sky-300 uppercase">
                <IconSpark className="w-3.5 h-3.5 text-sky-400" />
                <span>COMMANDER INITIALIZATION // SSR GUARANTEED</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                제네시스 SSR 리더 코어를 해방하십시오
              </h2>
              <p className="text-sm text-slate-400 mb-8 max-w-lg leading-relaxed">
                110종의 히어로 중 당신의 5장 시너지 덱을 통솔할 지휘관 유닛을 선택하고, 15초 전술 클라이맥스 시뮬레이션을 즉시 수행합니다.
              </p>

              <button
                onClick={handleOpenPack}
                disabled={step === 'PACK_OPENING'}
                className={
                  'group relative flex flex-col items-center justify-between w-64 h-88 rounded-xl border border-sky-400/40 bg-gradient-to-b from-slate-900 via-[#0c1424] to-slate-950 p-6 shadow-[0_0_50px_rgba(56,189,248,0.15)] transition-all duration-500 cursor-pointer ' +
                  (step === 'PACK_OPENING'
                    ? 'scale-110 opacity-0 blur-md'
                    : 'hover:border-sky-400 hover:shadow-[0_0_60px_rgba(56,189,248,0.3)] hover:-translate-y-1')
                }
              >
                <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="font-mono text-[10px] tracking-widest text-slate-400">
                    EDITION // 01
                  </span>
                  <span className="font-mono text-[10px] font-bold text-amber-400">
                    SSR TIER
                  </span>
                </div>

                <div className="my-auto flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/10 text-sky-300 group-hover:scale-110 transition-transform duration-300">
                    <IconCards className="w-10 h-10" />
                  </div>
                  <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.25em] text-sky-400">
                    GENESIS CORE PACK
                  </div>
                  <div className="mt-1 text-base font-bold text-white">
                    마스터 리더 유닛 봉인 해제
                  </div>
                </div>

                <div className="w-full rounded-lg bg-sky-400 py-2.5 text-xs font-bold tracking-wider text-slate-950 uppercase group-hover:bg-sky-300 transition">
                  INITIALIZE PACK
                </div>
              </button>
            </div>
          )}

          {/* STEP 2: SSR 리더 3종 중 택 1 */}
          {step === 'PICK_HERO' && (
            <div>
              <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                    SSR UNIT AUTHORIZATION
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mt-0.5">
                    5인 시너지 덱을 지휘할 파트너 유닛을 선택하십시오
                  </h2>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  SELECT 1 OF 3 SSR UNITS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FTUE_STARTER_SSR_CARDS.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleConfirmHeroAndStartBattle(card)}
                    className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-sky-400/60 hover:bg-white/[0.04] transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                          {card.grade}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-300">
                          PWR {card.power.toLocaleString()}
                        </span>
                      </div>

                      <div className="my-2 flex h-24 items-center justify-center rounded-lg border border-white/5 bg-[#060911] text-sky-400 group-hover:border-sky-400/30 transition">
                        <HeroClassEmblem attribute={card.attribute} className="w-12 h-12" />
                      </div>

                      <div className="mt-3 font-mono text-[10px] tracking-widest text-sky-400 uppercase">
                        {card.codeName}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{card.name}</h3>
                      <p className="text-xs text-slate-400 mb-4">{card.title}</p>

                      <div className="rounded-lg border border-white/5 bg-black/40 p-3 text-xs">
                        <div className="font-mono text-[10px] text-amber-400 uppercase mb-1">
                          SYNERGY // {card.synergyTag}
                        </div>
                        <div className="font-semibold text-slate-200 mb-1">
                          {card.skillName}
                        </div>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          {card.skillDesc}
                        </p>
                      </div>
                    </div>

                    <button className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-400/10 py-2.5 text-xs font-bold text-sky-300 group-hover:bg-sky-400 group-hover:text-slate-950 transition cursor-pointer">
                      <span>유닛 편성 및 시뮬레이션 개시</span>
                      <IconChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: 15초 전술 클라이맥스 배틀 */}
          {step === 'CLIMAX_BATTLE' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-2 rounded border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-rose-300">
                  <IconSwords className="w-3.5 h-3.5" />
                  <span>CLIMAX INTERVENTION // TACTICAL OVERDRIVE</span>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  LEADER: <strong className="text-sky-400">{selectedHero.name}</strong>
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#05080f] p-5 mb-4">
                {/* 적 보스 게이지 */}
                <div className="mb-6">
                  <div className="flex justify-between font-mono text-xs mb-1.5">
                    <span className="text-rose-400 font-semibold">
                      HOSTILE CORE // OMEGA OVERLORD (LV.99)
                    </span>
                    <span className="text-rose-300">{bossHp}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-sm bg-slate-900 overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-500"
                      style={{ width: bossHp + '%' }}
                    />
                  </div>
                </div>

                {/* 중앙 HUD 교전 디스플레이 */}
                <div className="grid grid-cols-3 items-center py-5 border-y border-white/5 my-2">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/10 text-sky-400 mb-2">
                      <HeroClassEmblem attribute={selectedHero.attribute} className="w-8 h-8" />
                    </div>
                    <div className="text-xs font-bold text-white">{selectedHero.name}</div>
                    <div className="font-mono text-[10px] text-sky-400">{selectedHero.synergyTag}</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="font-mono text-xs tracking-[0.3em] text-slate-500">ENGAGED</span>
                    <span className="text-lg font-black text-amber-400 my-0.5">VS</span>
                    <span className="font-mono text-[10px] text-slate-500">SYNC 99.4%</span>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div
                      className={
                        'flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 mb-2 transition-all duration-500 ' +
                        (isOverdriveFired ? 'scale-125 opacity-15' : '')
                      }
                    >
                      <HeroClassEmblem attribute="CHAOS" className="w-8 h-8" />
                    </div>
                    <div className="text-xs font-bold text-rose-300">오메가 오버로드</div>
                    <div className="font-mono text-[10px] text-slate-500">PWR 45,000</div>
                  </div>
                </div>

                {/* 아군 게이지 */}
                <div className="mt-5">
                  <div className="flex justify-between font-mono text-xs mb-1.5">
                    <span className="text-sky-400 font-semibold">
                      ALLIED SQUAD // 5-UNIT SYNERGY SHIELD
                    </span>
                    <span className="text-sky-300">{allyHp}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-sm bg-slate-900 overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                      style={{ width: allyHp + '%' }}
                    />
                  </div>
                </div>
              </div>

              {/* 터미널 스타일 배틀 로그 */}
              <div className="rounded-lg bg-black/60 border border-white/10 p-3.5 mb-5 h-24 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {battleLogs.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>

              <button
                onClick={handleTriggerOverdrive}
                disabled={!isOverdriveReady || isOverdriveFired}
                className={
                  'w-full rounded-xl py-4 px-6 font-bold text-sm md:text-base tracking-wide transition-all flex items-center justify-center gap-2 ' +
                  (isOverdriveReady && !isOverdriveFired
                    ? 'bg-sky-400 text-slate-950 hover:bg-sky-300 shadow-[0_0_35px_rgba(56,189,248,0.4)] cursor-pointer'
                    : 'border border-white/10 bg-white/[0.03] text-slate-500 cursor-not-allowed')
                }
              >
                <IconSpark className="w-4 h-4" />
                <span>
                  {isOverdriveFired
                    ? 'OVERDRIVE EXECUTED — TARGET ELIMINATED'
                    : isOverdriveReady
                    ? '[전술 개입 승인] ' + selectedHero.skillName + ' 발동'
                    : 'SYNERGY OVERDRIVE CHARGING...'}
                </span>
              </button>
            </div>
          )}

          {/* STEP 4: 시뮬레이션 클리어 보상 */}
          {step === 'VICTORY_REWARD' && (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-300">
                <IconTrophy className="w-7 h-7" />
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-400">
                SIMULATION COMPLETE // REWARDS CREDITED
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                전술 시뮬레이션 완료 및 지휘관 보급 승인
              </h2>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                선택한 SSR 리더 유닛과 초기 정착 크레딧이 계정에 즉시 반영되었습니다.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6 text-left">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="font-mono text-[10px] text-amber-400 uppercase">SSR UNIT</div>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {selectedHero.name}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                    PWR {selectedHero.power.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="font-mono text-[10px] text-sky-400 uppercase">CREDIT GRANT</div>
                  <div className="text-sm font-bold text-white mt-1">+1,000 SNS</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">INSTANT BALANCE</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="font-mono text-[10px] text-purple-400 uppercase">SUMMON VOUCHER</div>
                  <div className="text-sm font-bold text-white mt-1">10x FREE PULL</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">CARD ARCHIVE</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate?.('card-shop');
                  }}
                  className="flex-1 rounded-xl bg-sky-400 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-sky-300 transition cursor-pointer"
                >
                  10회 무료 카드 소환소 이동
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate?.('my-deck');
                  }}
                  className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] py-3.5 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
                >
                  내 5인 시너지 덱 편성 확인
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
