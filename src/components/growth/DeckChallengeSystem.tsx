import React, { useState, useRef, useEffect } from 'react';
import {
  type ChallengePayload,
  COUNTER_DECK_PRESETS,
  encodeChallengeDeck,
  type GrowthHeroCard,
  type GrowthRewardPayload,
  trackGrowthEvent,
} from './growthTypes';

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-fuchsia-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 md:p-8 text-white shadow-[0_0_70px_rgba(217,70,239,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-fuchsia-500/20 border border-fuchsia-500/40 px-2.5 py-0.5 text-xs font-extrabold text-fuchsia-300">
              ⚔️ 무설치 1클릭 덱 챌린지
            </span>
            <span className="text-xs text-slate-400">회원가입 없이 즉시 대결</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
          >
            닫기 ✕
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs text-fuchsia-400 font-bold">도전자 (Challenger)</span>
              <h3 className="text-lg font-black text-white">
                🔥 {challengeData.nick}님의 5장 시너지 덱
              </h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">총 전투력 / 승률</div>
              <div className="text-sm font-extrabold text-amber-400">
                ⚡ {challengerPower.toLocaleString()} ({challengeData.winRate}%)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {challengeData.cards.map((c, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-700/80 bg-slate-950 p-2 text-center"
              >
                <div className="text-2xl mb-1">{c.emoji || '⚡'}</div>
                <div className="text-[10px] font-black text-amber-400">{c.grade}</div>
                <div className="text-[11px] font-bold text-white truncate">{c.name}</div>
                <div className="text-[10px] text-slate-400">{c.pwr.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {phase === 'SELECT_COUNTER' && (
          <div>
            <h4 className="text-sm font-extrabold text-cyan-300 mb-3">
              👇 도전자 덱을 격파할 AI 추천 카운터 덱을 선택하세요 (승리 시 1,500 SNS 즉시 지급!)
            </h4>
            <div className="space-y-2.5 mb-6">
              {COUNTER_DECK_PRESETS.map((preset, idx) => (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPresetIdx(idx)}
                  className={`rounded-2xl border p-3.5 cursor-pointer transition-all ${
                    selectedPresetIdx === idx
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-sm text-white">{preset.title}</div>
                    <span className="text-xs font-bold text-cyan-300">
                      전투력 {preset.cards.reduce((s, c) => s + c.power, 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{preset.subtitle}</p>
                  <div className="mt-2 inline-block rounded-md bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                    ✨ {preset.synergyBonus}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={startInstantBattle}
              className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 py-4 text-base font-black text-white shadow-xl hover:scale-[1.01] transition cursor-pointer"
            >
              ⚡ 이 카운터 덱으로 즉시 배틀 시작! (무설치 10초 결판)
            </button>
          </div>
        )}

        {phase === 'BATTLING' && (
          <div className="text-center py-3">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4">
                <div className="text-xs font-bold text-cyan-300 mb-1">내 카운터 덱</div>
                <div className="text-sm font-black text-white mb-2 truncate">
                  {chosenPreset.title}
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${myHp}%` }}
                  />
                </div>
                <div className="mt-1 text-xs font-bold text-cyan-300">HP {myHp}%</div>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-slate-900/80 p-4">
                <div className="text-xs font-bold text-rose-300 mb-1">
                  {challengeData.nick}님의 덱
                </div>
                <div className="text-sm font-black text-white mb-2">
                  전투력 {challengerPower.toLocaleString()}
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${enemyHp}%` }}
                  />
                </div>
                <div className="mt-1 text-xs font-bold text-rose-300">HP {enemyHp}%</div>
              </div>
            </div>

            <button
              onClick={triggerCounterFinish}
              disabled={overdriveUsed}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 py-4 text-base font-black text-slate-950 shadow-[0_0_35px_rgba(6,182,212,0.5)] animate-pulse cursor-pointer"
            >
              {overdriveUsed
                ? '💥 카운터 시너지 적중! 도전자 덱 격파 완료!'
                : `🔥 [터치!] 카운터 필살기 '${chosenPreset.cards[0].skillName}' 발동하여 끝내기!`}
            </button>
          </div>
        )}

        {phase === 'RESULT' && (
          <div className="text-center py-3">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-2xl font-black text-white">
              {challengeData.nick}님의 5장 덱을 격파했습니다!
            </h3>
            <p className="text-xs text-slate-300 mt-1 mb-5">
              도전자 격파 보상으로 <strong className="text-amber-300">1,500 SNS 포인트</strong>와{' '}
              <strong className="text-cyan-300">무료 뽑기 티켓 5장</strong>이 계정에 지급되었습니다!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onClose();
                  onOpenShareMyDeck();
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-600 py-3.5 text-sm font-extrabold text-white shadow-lg"
              >
                📢 나도 내 5장 덱 도전장 링크 만들기
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-3.5 text-sm font-bold text-white"
              >
                🎮 보상으로 110종 카드 뽑으러 가기
              </button>
            </div>
          </div>
        )}
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
  const [activeNickname, setActiveNickname] = useState<string>(nickname || 'SNS히어로');

  const safeDeck =
    myDeck && myDeck.length >= 5 ? myDeck.slice(0, 5) : COUNTER_DECK_PRESETS[0].cards;

  const encodedParam = encodeChallengeDeck(activeNickname, safeDeck, winRate);
  const shareUrl = `${
    typeof window !== 'undefined' ? window.location.origin : 'https://snshero.com'
  }/?challenge=${encodedParam}`;

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#111827');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('⚡ SNSHERO.COM • 110 CARDS AI AUTO-BATTLE TCG', 60, 85);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 46px sans-serif';
    ctx.fillText(`"${activeNickname}"님의 5장 시너지 덱 도전장!`, 60, 148);

    const totalPower = safeDeck.reduce((sum, c) => sum + c.power, 0);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(
      `총 전투력: ${totalPower.toLocaleString()}   |   승률: ${winRate}%   |   보상: 1,500 SNS`,
      60,
      195
    );

    const cardW = 195;
    const cardH = 270;
    const startX = 60;
    const startY = 235;
    const gap = 26;

    safeDeck.forEach((card, idx) => {
      const x = startX + idx * (cardW + gap);
      const y = startY;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, cardW, cardH);

      ctx.strokeStyle = card.grade === 'SSR' ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, cardW, cardH);

      ctx.fillStyle = card.grade === 'SSR' ? '#f59e0b' : '#38bdf8';
      ctx.font = '900 20px sans-serif';
      ctx.fillText(card.grade, x + 16, y + 34);

      ctx.font = '64px sans-serif';
      ctx.fillText(card.avatarEmoji || '⚡', x + 62, y + 125);

      ctx.fillStyle = '#e879f9';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`#${card.synergyTag}`, x + 16, y + 178);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(card.name.slice(0, 8), x + 16, y + 210);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`PWR ${card.power.toLocaleString()}`, x + 16, y + 245);
    });

    ctx.fillStyle = '#ec4899';
    ctx.fillRect(60, 535, W - 120, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(
      '👉 링크 클릭 시 회원가입/설치 없이 3초 만에 이 덱과 실시간 배틀 가능! (snshero.com)',
      95,
      569
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
      console.error('Copy failed', e);
    }
  };

  const handleDownloadCardImage = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `snshero-challenge-${activeNickname}.png`;
    a.click();
    trackGrowthEvent('challenge_card_downloaded', { nickname: activeNickname });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/40 bg-slate-900 p-6 md:p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase">
              VIRAL DECK CHALLENGE GENERATOR
            </span>
            <h3 className="text-xl font-black text-white">
              📢 내 5장 덱 도전장 링크 & 소셜 이미지 생성
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:text-white"
          >
            닫기 ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            도전장에 표시할 내 닉네임
          </label>
          <input
            type="text"
            value={activeNickname}
            onChange={(e) => setActiveNickname(e.target.value)}
            maxLength={16}
            placeholder="닉네임 입력 (예: 사이버사령관)"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-2">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-xl shadow-md"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-2.5 mb-5">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full bg-transparent text-xs text-slate-300 focus:outline-none truncate"
          />
          <button
            onClick={handleCopyChallengeLink}
            className="shrink-0 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
          >
            {copiedUrl ? '✅ 복사 완료!' : '🔗 도전장 링크 복사'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownloadCardImage}
            className="rounded-xl border border-fuchsia-500/50 bg-fuchsia-600/20 py-3 text-xs font-extrabold text-fuchsia-200 hover:bg-fuchsia-600/30 transition cursor-pointer"
          >
            🖼️ 고화질 도전장 이미지 다운로드 (커뮤니티 업로드용)
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${activeNickname}님의 SNSHero 5장 덱 도전장!`,
                  text: '설치 없이 3초 만에 내 5장 히어로 덱과 붙어보세요! 승리 시 1,500 SNS 지급!',
                  url: shareUrl,
                });
              } else {
                handleCopyChallengeLink();
              }
            }}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-xs font-extrabold text-white hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer"
          >
            🚀 카카오톡 / X(트위터) / 디스코드 즉시 공유
          </button>
        </div>
      </div>
    </div>
  );
};
