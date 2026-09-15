import { playSfx } from './sound';
import { triggerHaptic } from './haptic';

export type ElementType = 'FIRE' | 'WATER' | 'EARTH' | 'WIND' | 'HOLY' | 'DARK';

export interface ParticleEffect {
  x: number;
  y: number;
  element: ElementType;
  color: string;
  particles: { vx: number; vy: number; size: number; alpha: number }[];
}

/**
 * ID 426, 452, 462, 487: 배틀 전용 2D 파티클 FX, 방어막 블록 효과, 콤보 사운드 엔진
 */
export class BattleFXEngine {
  private static instance: BattleFXEngine;

  private constructor() {}

  public static getInstance(): BattleFXEngine {
    if (!BattleFXEngine.instance) {
      BattleFXEngine.instance = new BattleFXEngine();
    }
    return BattleFXEngine.instance;
  }

  /**
   * ID 426: 속성 상성 플립 캡처 시 원소별 고유 파티클 폭발
   */
  public triggerElementBurst(containerEl: HTMLElement, element: ElementType = 'FIRE') {
    const rect = containerEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const colors: Record<ElementType, string> = {
      FIRE: '#ef4444',
      WATER: '#3b82f6',
      EARTH: '#eab308',
      WIND: '#10b981',
      HOLY: '#a855f7',
      DARK: '#64748b',
    };

    const count = 12;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 40 + Math.random() * 60;
      const size = 6 + Math.random() * 6;

      particle.style.position = 'fixed';
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = colors[element] || '#fbbf24';
      particle.style.borderRadius = element === 'WIND' || element === 'WATER' ? '50%' : '0px';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      particle.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.45s ease-out';
      particle.style.boxShadow = `0 0 8px ${colors[element]}`;

      document.body.appendChild(particle);

      requestAnimationFrame(() => {
        const tx = Math.cos(angle) * speed;
        const ty = Math.sin(angle) * speed;
        particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        particle.style.opacity = '0';
      });

      setTimeout(() => {
        particle.remove();
      }, 500);
    }

    triggerHaptic('flip');
  }

  /**
   * ID 452: 속성 방어막 완충 / 방어 성공 피드백 ('BLOCKED' 플로팅 텍스트 + 방어막 플레어)
   */
  public triggerBlockEffect(targetEl: HTMLElement) {
    const rect = targetEl.getBoundingClientRect();
    const textEl = document.createElement('div');
    textEl.innerText = '🛡️ BLOCKED!';
    textEl.style.position = 'fixed';
    textEl.style.left = `${rect.left + rect.width / 2}px`;
    textEl.style.top = `${rect.top + rect.height / 2 - 10}px`;
    textEl.style.transform = 'translate(-50%, -50%)';
    textEl.style.color = '#38bdf8';
    textEl.style.fontFamily = 'monospace';
    textEl.style.fontWeight = '900';
    textEl.style.fontSize = '12px';
    textEl.style.textShadow = '0 0 6px rgba(56, 189, 248, 0.8)';
    textEl.style.zIndex = '9999';
    textEl.style.pointerEvents = 'none';
    textEl.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';

    document.body.appendChild(textEl);

    requestAnimationFrame(() => {
      textEl.style.transform = 'translate(-50%, -70px) scale(1.1)';
      textEl.style.opacity = '0';
    });

    setTimeout(() => {
      textEl.remove();
    }, 650);

    playSfx('equip');
    triggerHaptic('medium');
  }

  /**
   * ID 462: 콤보 체인 x2/x3 연쇄 플립 사운드 & 보너스 점수 반환
   */
  public getComboScoreBonus(comboCount: number): number {
    if (comboCount < 2) return 0;
    return (comboCount - 1) * 100;
  }

  /**
   * ID 487: 인접 아군 속성 융합(Fusion Resonance) 빙결 방어막 버프
   */
  public triggerFusionResonance(slotEl: HTMLElement) {
    slotEl.classList.add('fusion-shield-active');
    setTimeout(() => {
      slotEl.classList.remove('fusion-shield-active');
    }, 1200);
    playSfx('levelUp');
    triggerHaptic('victory');
  }
}
