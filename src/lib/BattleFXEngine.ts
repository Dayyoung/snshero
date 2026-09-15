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
   * ID 497: 'Last Stand Breakthrough' (5번째 패 + 1점차 열세 시 슬로우모션 쇼크웨이브 & 심장박동 & 골든 스탯 글로우)
   */
  public triggerLastStandBreakthrough(boardEl?: HTMLElement) {
    if (boardEl) {
      boardEl.classList.add('last-stand-glow');
      setTimeout(() => boardEl.classList.remove('last-stand-glow'), 1800);
    }
    playSfx('bossEncounter');
    triggerHaptic('special');
  }

  /**
   * ID 502: 'Triple Flip Burst' (동시 3방향 캡처 120ms 슬로우모션 & 원형 프리즘 쇼크웨이브 & 오케스트라 사운드)
   */
  public triggerTripleFlipBurst(centerEl: HTMLElement) {
    const rect = centerEl.getBoundingClientRect();
    const wave = document.createElement('div');
    wave.className = 'triple-flip-shockwave';
    wave.style.left = `${rect.left + rect.width / 2}px`;
    wave.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 700);

    playSfx('victory');
    triggerHaptic('victory');
  }

  /**
   * ID 512: 카메라 줌 펀치 타격감 연출 (scale 1.03 120ms 마이크로 펀치)
   */
  public triggerCameraZoomPunch(gridEl: HTMLElement) {
    gridEl.style.transition = 'transform 0.12s cubic-bezier(0.2, 0.9, 0.2, 1)';
    gridEl.style.transform = 'scale(1.03)';
    setTimeout(() => {
      gridEl.style.transform = 'scale(1)';
    }, 120);
    triggerHaptic('heavy');
  }

  /**
   * ID 522: 'Elemental Barricade Link' (동일 속성 인접 아군 보호 에너지 테더 및 +1 방어 실드)
   */
  public triggerBarricadeLink(el1: HTMLElement, el2: HTMLElement) {
    el1.classList.add('barricade-linked');
    el2.classList.add('barricade-linked');
    setTimeout(() => {
      el1.classList.remove('barricade-linked');
      el2.classList.remove('barricade-linked');
    }, 1500);
    playSfx('cardSlide');
  }

  /**
   * ID 527: 'Riposte Counterattack' 슬로우 플래시 (100ms 플래시 & 역방향 슬래시)
   */
  public triggerRiposteCounter(targetEl: HTMLElement) {
    targetEl.classList.add('riposte-flash');
    setTimeout(() => targetEl.classList.remove('riposte-flash'), 500);
    playSfx('specialAttack');
    triggerHaptic('heavy');
  }

  /**
   * ID 547: 더블 캡처 크로스 임팩트 레이저 슬래시 FX
   */
  public triggerDoubleFlipCross(centerEl: HTMLElement) {
    const rect = centerEl.getBoundingClientRect();
    const slash = document.createElement('div');
    slash.className = 'cross-slash-burst';
    slash.style.left = `${rect.left + rect.width / 2}px`;
    slash.style.top = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(slash);
    setTimeout(() => slash.remove(), 600);
    playSfx('cardCapture');
  }

  /**
   * ID 552: 'Elemental Overload' 속성 과부하 전장 앰비언트 날씨 틴트
   */
  public triggerElementalWeather(element: ElementType) {
    const overlay = document.createElement('div');
    overlay.className = `elemental-weather-overlay weather-${element.toLowerCase()}`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2500);
  }

  /**
   * ID 557: 'Pinch Flip Reversal' 핀치 역전 스파크 충돌 & 100ms 마이크로 프리즈
   */
  public triggerPinchReversal(slotEl: HTMLElement) {
    slotEl.classList.add('pinch-reversal-spark');
    setTimeout(() => slotEl.classList.remove('pinch-reversal-spark'), 600);
    playSfx('critical');
    triggerHaptic('special');
  }

  /**
   * ID 567: 'Clutch Reversal' 9턴 클러치 역전승 피니셔 연출
   */
  public triggerClutchVictoryFinisher() {
    const banner = document.createElement('div');
    banner.className = 'clutch-victory-banner';
    banner.innerText = '⚡ CLUTCH VICTORY! ⚡';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2000);
    playSfx('victory');
    triggerHaptic('victory');
  }

  /**
   * ID 572: 'Overwhelming Impact' +3 이상 스탯차 3D 파쇄 균열 데칼
   */
  public triggerOverwhelmingImpact(slotEl: HTMLElement) {
    slotEl.classList.add('overwhelming-shatter');
    setTimeout(() => slotEl.classList.remove('overwhelming-shatter'), 800);
    playSfx('specialAttack');
    triggerHaptic('heavy');
  }

  /**
   * ID 577: 'Cascade Counter Shockwave' 반격 청록색 일렉트릭 링 충격파
   */
  public triggerCascadeCounterShockwave(slotEl: HTMLElement) {
    slotEl.classList.add('cascade-counter-ring');
    setTimeout(() => slotEl.classList.remove('cascade-counter-ring'), 700);
    playSfx('magicAttack');
    triggerHaptic('medium');
  }

  /**
   * ID 582: 'Dominator Climax' 7칸 이상 장악 골든 레터링 & 팡파레
   */
  public triggerDominatorClimax() {
    const lettering = document.createElement('div');
    lettering.className = 'dominator-climax-text';
    lettering.innerText = '⚔️ DOMINATION! ⚔️';
    document.body.appendChild(lettering);
    setTimeout(() => lettering.remove(), 2200);
    playSfx('victory');
    triggerHaptic('victory');
  }

  /**
   * ID 587: 연쇄 플립 3D 카메라 틸트 & 햅틱
   */
  public triggerDominoCameraTilt(boardEl: HTMLElement) {
    boardEl.style.transition = 'transform 0.15s ease-out';
    boardEl.style.transform = 'perspective(600px) rotateX(2deg) scale(1.02)';
    triggerHaptic('heavy');
    setTimeout(() => {
      boardEl.style.transform = 'none';
    }, 150);
  }

  /**
   * ID 592: 'Domino Reversal' 120ms 프리즈 & 초점 줌인 & 시안 라이트닝
   */
  public triggerDominoReversal(slotEl: HTMLElement) {
    slotEl.classList.add('domino-reversal-lightning');
    setTimeout(() => slotEl.classList.remove('domino-reversal-lightning'), 800);
    playSfx('critical');
    triggerHaptic('special');
  }
}
