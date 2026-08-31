/**
 * combatDopamineEngine.ts
 * 대전/미션 공통 다이나믹 콤보 어나운서, Web Audio 음계 피치 시프트 & 햅틱 타격 피드백 엔진
 * (구글 스프레드시트 Row 692 / ID 561 요구사항 구현)
 */

export type ComboTier = 'NONE' | 'DOUBLE' | 'TRIPLE' | 'MEGA' | 'UNSTOPPABLE' | 'SAME' | 'PLUS' | 'Z_LIGHTNING' | 'L_STORM' | 'CRITICAL';

export interface DopamineEvent {
  tier: ComboTier;
  comboCount: number;
  bannerTitle: string;
  bannerSubtitle: string;
  bonusPoints: number;
  screenShakeClass: string;
}

// Audio Context Singleton for Ascending Pitch Chime
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Frequency progression for combo tiers (C4, E4, G4, C5, E5)
const COMBO_FREQUENCIES: number[] = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];

/**
 * Plays an ascending synth chime matching the current combo intensity
 */
export function playDopamineChime(comboCount: number, isCritical = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseIdx = Math.min(COMBO_FREQUENCIES.length - 1, Math.max(0, comboCount - 1));
    const freq = COMBO_FREQUENCIES[baseIdx];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCritical ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (isCritical) {
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);
    }

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch (err) {
    // Audio playback fallback
  }
}

/**
 * Triggers mobile haptic vibration if supported
 */
export function triggerHapticFeedback(pattern: number | number[]) {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Haptics disabled / unsupported
    }
  }
}

/**
 * Evaluates combo event and returns complete dopamine bundle (Banner, Audio, Haptic, Screen Shake)
 */
export function processComboDopamine(
  comboCount: number,
  specialRule?: 'SAME' | 'PLUS' | 'Z_LIGHTNING' | 'L_STORM',
  isCritical = false
): DopamineEvent | null {
  if (comboCount < 2 && !specialRule && !isCritical) {
    return null;
  }

  let tier: ComboTier = 'NONE';
  let bannerTitle = '';
  let bannerSubtitle = '';
  let bonusPoints = 0;
  let hapticPattern: number[] = [20];
  let screenShakeClass = 'animate-shake-sm';

  if (specialRule === 'Z_LIGHTNING') {
    tier = 'Z_LIGHTNING';
    bannerTitle = '⚡ Z-LIGHTNING OVERCHARGE! ⚡';
    bannerSubtitle = '5-TILE ZIGZAG CRITICAL SHATTER';
    bonusPoints = 800;
    hapticPattern = [40, 30, 80, 30, 100];
    screenShakeClass = 'animate-shake-lg';
  } else if (specialRule === 'L_STORM') {
    tier = 'L_STORM';
    bannerTitle = '🌀 ELEMENTAL L-STORM! 🌀';
    bannerSubtitle = '5-TILE CORNER VORTEX COMBO';
    bonusPoints = 750;
    hapticPattern = [35, 25, 70, 25, 90];
    screenShakeClass = 'animate-shake-lg';
  } else if (specialRule === 'SAME') {
    tier = 'SAME';
    bannerTitle = '✨ SAME RULE HARMONY! ✨';
    bannerSubtitle = 'PERFECT POWER MATCH';
    bonusPoints = 400;
    hapticPattern = [30, 20, 50];
  } else if (specialRule === 'PLUS') {
    tier = 'PLUS';
    bannerTitle = '🔥 PLUS SUM OVERDRIVE! 🔥';
    bannerSubtitle = 'CALCULATED SUM DEVASTATION';
    bonusPoints = 500;
    hapticPattern = [35, 25, 60];
  } else if (isCritical) {
    tier = 'CRITICAL';
    bannerTitle = '💥 CRITICAL SHATTER BREAK! 💥';
    bannerSubtitle = 'MASSIVE POWER OVERWHELM';
    bonusPoints = 350;
    hapticPattern = [50, 30, 70];
    screenShakeClass = 'animate-shake-md';
  } else if (comboCount >= 5) {
    tier = 'UNSTOPPABLE';
    bannerTitle = '👑 UNSTOPPABLE DOMINATION! 👑';
    bannerSubtitle = `CASCADE COMBO x${comboCount}`;
    bonusPoints = comboCount * 250;
    hapticPattern = [50, 30, 70, 30, 100];
    screenShakeClass = 'animate-shake-lg';
  } else if (comboCount === 4) {
    tier = 'MEGA';
    bannerTitle = '⚡ MEGA CASCADE COMBO! ⚡';
    bannerSubtitle = 'QUADRUPLE FLIP SURGE';
    bonusPoints = 600;
    hapticPattern = [40, 25, 60, 25, 80];
    screenShakeClass = 'animate-shake-md';
  } else if (comboCount === 3) {
    tier = 'TRIPLE';
    bannerTitle = '🔥 TRIPLE FLIP CRUSH! 🔥';
    bannerSubtitle = 'CHAIN REACTION STRIKE';
    bonusPoints = 350;
    hapticPattern = [30, 20, 50];
  } else if (comboCount === 2) {
    tier = 'DOUBLE';
    bannerTitle = '⚔️ DOUBLE FLIP STRIKE! ⚔️';
    bannerSubtitle = 'DUAL CARD CAPTURE';
    bonusPoints = 150;
    hapticPattern = [25, 20, 25];
  }

  // Play audio chime and trigger vibration
  playDopamineChime(comboCount, isCritical);
  triggerHapticFeedback(hapticPattern);

  return {
    tier,
    comboCount,
    bannerTitle,
    bannerSubtitle,
    bonusPoints,
    screenShakeClass
  };
}
