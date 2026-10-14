// src/components/growth/DeckChallengeSystem.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  COUNTER_DECK_PRESETS,
  encodeChallengeDeck,
  trackGrowthEvent,
} from './growthTypes';
import type {
  ChallengePayload,
  GrowthHeroCard,
  GrowthRewardPayload,
} from './growthTypes';
import {
  HeroClassEmblem,
  IconClose,
  IconCopy,
  IconDownload,
  IconShare,
  IconSpark,
  IconSwords,
  IconTrophy,
} from './GrowthIcons';

interface InstantChallengeBattleModalProps {
  challengeData: ChallengePayload | null;
  onClose: () => void;
  onClaimReward: (reward: GrowthRewardPayload) => void;
  onOpenShareMyDeck: () => void;
}

export const InstantChallengeBattleModal: React.FC<InstantChallengeBattleModalProps> = ({
  challengeData,
  onClose,
  onClaimReward,
  onOpenShareMyDeck,
}) => {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [phase, setPhase] = useState<'SELECT_COUNTER' | 'BATTLING' | 'RESULT'>('SELECT_COUNTER');
  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [myHp, setMyHp] = useState<number>(100);
  const [overdriveUsed, setOverdriveUsed] = useState<boolean>(false);

  if (!challengeData) return null;

  const challengerPower = challengeData.cards.reduce((acc, c) => acc + c.pwr, 0);
  const chosenPreset = COUNTER_DECK_PRESETS[selectedPresetIdx];
  const myTotalPower = chosenPreset.cards.reduce((acc, c) => acc + c.power, 0);

  const startInstantBattle = () => {
    trackGrowthEvent('challenge_battle_started', {
      challenger: challengeData.nick,
      counter_preset: chosenPreset.id,
    });
    setPhase('BATTLING');
    setEnemyHp(100);
    setMyHp(100);

    setTimeout(() => {
      setEnemyHp(58);
      setMyHp(64);
    }, 700);

    setTimeout(() => {
      setEnemyHp(24);
      setMyHp(38);
    }, 1500);
  };

  const triggerCounterFinish = () => {
    setOverdriveUsed(true);
    setEnemyHp(0);
    setTimeout(() => {
      trackGrowthEvent('challenge_battle_completed', {
        challenger: challengeData.nick,
        result: 'WIN',
      });
      onClaimReward({
        snsPoints: 1500,
        freeTickets: 5,
        rewardCard: chosenPreset.cards[0],
        source: 'CHALLENGE_WIN',
      });
      setPhase('RESULT');
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#090d16] text-white shadow-2xl overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <IconSwords className="w-4 h-4 text-purple-400" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">
              DIRECT DECK CHALLENGE // ZERO-INSTALL ENGAGEMENT
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-white/5 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-purple-400">
                  CHALLENGER SQUAD
                </span>
                <h3 className="text-lg font-bold text-white">
                  {challengeData.nick} 지휘관의 5인 시너지 편성
                </h3>
              </div>
              <div className="text-right font-mono">
                <div className="text-[10px] text-slate-400">TOTAL POWER / WIN RATE</div>
                <div className="text-sm font-bold text-amber-400">
                  PWR {challengerPower.toLocaleString()} ({challengeData.winRate}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {challengeData.cards.map((c, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-white/10 bg-[#05080f] p-2.5 text-center"
                >
                  <div className="flex justify-center text-sky-400 mb-1.5">
                    <HeroClassEmblem attribute={c.attr} className="w-7 h-7" />
                  </div>
                  <div className="font-mono text-[10px] font-bold text-amber-400">{c.grade}</div>
                  <div className="text-[11px] font-semibold text-white truncate mt-0.5">{c.name}</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                    {c.pwr.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {phase === 'SELECT_COUNTER' && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-sky-400 mb-2.5">
                SELECT COUNTER-PROTOCOL (VICTORY BOUNTY: +1,500 SNS)
              </div>
              <div className="space-y-2.5 mb-6">
                {COUNTER_DECK_PRESETS.map((preset, idx) => (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetIdx(idx)}
                    className={
                      'rounded-xl border p-4 cursor-pointer transition-all ' +
                      (selectedPresetIdx === idx
                        ? 'border-sky-400 bg-sky-400/[0.07]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-sky-400 mr-2">
                          {preset.code}
                        </span>
                        <span className="font-bold text-sm text-white">{preset.title}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-300">
                        PWR {preset.cards.reduce((s, c) => s + c.power, 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{preset.subtitle}</p>
                    <div className="mt-2 font-mono text-[11px] text-amber-300">
                      {preset.synergyBonus}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={startInstantBattle}
                className="w-full rounded-xl bg-sky-400 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-sky-300 transition cursor-pointer"
              >
                선택한 카운터 덱으로 즉시 교전 개시
              </button>
            </div>
          )}

          {phase === 'BATTLING' && (
            <div className="text-center py-3">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-sky-400/30 bg-black/50 p-4 text-left">
                  <div className="font-mono text-[10px] text-sky-400">
                    ALLIED COUNTER SQUAD ({myTotalPower.toLocaleString()})
                  </div>
                  <div className="text-sm font-bold text-white my-1 truncate">
                    {chosenPreset.title}
                  </div>
                  <div className="h-2 w-full rounded-sm bg-slate-900 overflow-hidden mt-2">
                    <div
                      className="h-full bg-sky-400 transition-all duration-500"
                      style={{ width: myHp + '%' }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-sky-300">SHIELD {myHp}%</div>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-black/50 p-4 text-left">
                  <div className="font-mono text-[10px] text-rose-400">
                    CHALLENGER ({challengerPower.toLocaleString()})
                  </div>
                  <div className="text-sm font-bold text-white my-1 truncate">
                    {challengeData.nick}
                  </div>
                  <div className="h-2 w-full rounded-sm bg-slate-900 overflow-hidden mt-2">
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: enemyHp + '%' }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-rose-300">SHIELD {enemyHp}%</div>
                </div>
              </div>

              <button
                onClick={triggerCounterFinish}
                disabled={overdriveUsed}
                className="w-full rounded-xl bg-sky-400 py-4 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-sky-300 transition cursor-pointer"
              >
                {overdriveUsed
                  ? 'COUNTER PROTOCOL EXECUTED'
                  : '[전술 카운터 발동] ' + chosenPreset.cards[0].skillName}
              </button>
            </div>
          )}

          {phase === 'RESULT' && (
            <div className="text-center py-3">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300">
                <IconTrophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {challengeData.nick} 지휘관의 방어 편성을 격파했습니다
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                승리 현상금으로 <strong className="text-amber-300">+1,500 SNS</strong> 및{' '}
                <strong className="text-sky-300">소환 티켓 5매</strong>가 지급되었습니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenShareMyDeck();
                  }}
                  className="flex-1 rounded-xl bg-sky-400 py-3 text-xs font-bold text-slate-950 cursor-pointer"
                >
                  내 5인 덱 도전장 링크 생성하기
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-xs font-bold text-white cursor-pointer"
                >
                  메인 아레나로 복귀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ViralDeckShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  myDeck: GrowthHeroCard[];
  winRate?: number;
}

export const ViralDeckShareModal: React.FC<ViralDeckShareModalProps> = ({
  isOpen,
  onClose,
  nickname,
  myDeck,
  winRate = 82,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [activeNickname, setActiveNickname] = useState<string>(nickname || 'COMMANDER');

  const safeDeck =
    myDeck && myDeck.length >= 5 ? myDeck.slice(0, 5) : COUNTER_DECK_PRESETS[0].cards;

  const encodedParam = encodeChallengeDeck(activeNickname, safeDeck, winRate);
  const originUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://snshero.com';
  const shareUrl = originUrl + '/?challenge=' + encodedParam;

  // 이모지 없이 순수 벡터 기하학과 택티컬 타이포그래피로만 그리는 1200x630 배틀 데이터 시트
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    // 1. 하이엔드 다크 매트릭스 배경
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#05080f');
    bgGrad.addColorStop(0.5, '#090e1a');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 미세 그리드 패턴
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    // 외곽 프레임
    ctx.strokeStyle = 'rgba(56,189,248,0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, W - 56, H - 56);

    // 2. 헤더 메타데이터
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 18px monospace';
    ctx.fillText('SNSHERO.COM // TACTICAL 5-UNIT SYNERGY CHALLENGE DOSSIER', 64, 78);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(activeNickname + ' // SQUAD CHALLENGE', 64, 134);

    const totalPower = safeDeck.reduce((sum, c) => sum + c.power, 0);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 22px monospace';
    ctx.fillText(
      'SQUAD RATING: ' +
        totalPower.toLocaleString() +
        '    |    WIN RATIO: ' +
        winRate +
        '%    |    BOUNTY: +1,500 SNS',
      64,
      178
    );

    // 3. 5장 히어로 유닛 슬롯 (이모지 대신 기하학 벡터 엠블럼 렌더링)
    const cardW = 198;
    const cardH = 290;
    const startX = 64;
    const startY = 215;
    const gap = 20;

    safeDeck.forEach((card, idx) => {
      const x = startX + idx * (cardW + gap);
      const y = startY;

      ctx.fillStyle = '#070b14';
      ctx.fillRect(x, y, cardW, cardH);

      ctx.strokeStyle = card.grade === 'SSR' ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cardW, cardH);

      // 상단 등급 바
      ctx.fillStyle = card.grade === 'SSR' ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.12)';
      ctx.fillRect(x + 1, y + 1, cardW - 2, 36);

      ctx.fillStyle = card.grade === 'SSR' ? '#fbbf24' : '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(card.grade + ' // #' + card.id, x + 14, y + 24);

      // 중앙 기하학 육각/다이아몬드 코어 엠블럼
      const cx = x + cardW / 2;
      const cy = y + 110;
      ctx.strokeStyle = card.grade === 'SSR' ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + 34 * Math.cos(angle);
        const py = cy + 34 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(card.attribute, cx, cy + 4);
      ctx.textAlign = 'left';

      // 시너지 태그
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 12px monospace';
      ctx.fillText(card.synergyTag.slice(0, 18), x + 14, y + 185);

      // 유닛명
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(card.name.slice(0, 9), x + 14, y + 216);

      // 전투력
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 16px monospace';
      ctx.fillText('PWR ' + card.power.toLocaleString(), x + 14, y + 262);
    });

    // 4. 하단 콜투액션 바
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(64, 532, W - 128, 46);
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 19px monospace';
    ctx.fillText(
      'INSTANT BROWSER BATTLE (NO LOGIN REQUIRED)  >>>  SNSHERO.COM',
      92,
      561
    );
  }, [isOpen, activeNickname, safeDeck, winRate]);

  if (!isOpen) return null;

  const handleCopyChallengeLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      trackGrowthEvent('challenge_link_created', { nickname: activeNickname });
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (e) {
      // ignore
    }
  };

  const handleDownloadCardImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'snshero-dossier-' + activeNickname + '.png';
    a.click();
    trackGrowthEvent('challenge_card_downloaded', { nickname: activeNickname });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#090d16] text-white shadow-2xl overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              TACTICAL DOSSIER GENERATOR
            </span>
            <h3 className="text-lg font-bold text-white">
              5인 시너지 덱 도전장 링크 및 데이터 카드 생성
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              COMMANDER CALLSIGN (NICKNAME)
            </label>
            <input
              type="text"
              value={activeNickname}
              onChange={(e) => setActiveNickname(e.target.value)}
              maxLength={16}
              placeholder="CALLSIGN"
              className="w-full rounded-lg border border-white/15 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div className="mb-5 overflow-hidden rounded-xl border border-white/10 bg-black p-2">
            <canvas ref={canvasRef} className="w-full h-auto rounded-lg" />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/60 p-2 mb-5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent font-mono text-xs text-slate-300 focus:outline-none truncate px-2"
            />
            <button
              onClick={handleCopyChallengeLink}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-sky-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-300 transition cursor-pointer"
            >
              <IconCopy className="w-3.5 h-3.5" />
              <span>{copiedUrl ? 'COPIED' : 'COPY URL'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadCardImage}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-xs font-bold text-slate-200 hover:bg-white/[0.08] transition cursor-pointer"
            >
              <IconDownload className="w-4 h-4" />
              <span>데이터 카드 PNG 다운로드</span>
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: activeNickname + ' // SNSHero 5-Unit Deck Challenge',
                    text: '설치 없이 즉시 내 5인 히어로 편성과 교전하십시오 (승리 보상 1,500 SNS)',
                    url: shareUrl,
                  });
                } else {
                  handleCopyChallengeLink();
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 py-3 text-xs font-bold text-slate-950 hover:bg-sky-300 transition cursor-pointer"
            >
              <IconShare className="w-4 h-4" />
              <span>도전장 링크 즉시 공유</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
