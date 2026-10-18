import React, { useState, useEffect, useMemo } from 'react';
import { triggerHaptic } from '../../lib/haptic';

export interface TacticalSynergyMatrixProps {
  playerUnits?: Array<{ id: string | number; name: string; classType?: string; isAlive?: boolean }>;
  onSynergyBurst?: (multiplier: number) => void;
  language?: string;
  className?: string;
}

// 3대 원소 비트마스크 연산 (FROST / FLAME / HOLY)
const MASK_FROST = 1 << 0; // 1 (카단 / 알렉산다르)
const MASK_FLAME = 1 << 1; // 2 (이그니스 / 벨페고르)
const MASK_HOLY  = 1 << 2; // 4 (발리안 / 실리아)
const MASK_TRIPLE_BURST = MASK_FROST | MASK_FLAME | MASK_HOLY; // 7

const SYNERGY_I18N: Record<string, Record<string, string>> = {
  ko: {
    header: '[원소 연계 매트릭스 // ELEMENTAL SYNERGY]',
    statusActive: '[삼위일체 원소 공명 가동 중]',
    statusStandby: '[원소 공명 대기 중]',
    frost: 'FROST // 냉기 수호 (카단)',
    flame: 'FLAME // 화염 격발 (이그니스)',
    holy: 'HOLY // 성광 치유 (실리아)',
    overclockTitle: '미니게임 수련 마나 증폭',
    burstDesc: '3대 원소 동시 생존: 전 파티 치명타 +30% & 마나 가속 +25%',
    toggleCompact: '매트릭스 접기/펼치기'
  },
  en: {
    header: '[ELEMENTAL SYNERGY MATRIX]',
    statusActive: '[TRINITY RESONANCE ACTIVE]',
    statusStandby: '[ELEMENTAL LINK STANDBY]',
    frost: 'FROST // Kadan Shield',
    flame: 'FLAME // Ignis Blaze',
    holy: 'HOLY // Cilia Sanctuary',
    overclockTitle: 'TRAINING MANA AMPLIFIER',
    burstDesc: '3 ELEMENTS ALIVE: +30% CRIT & +25% MANA RECHARGE',
    toggleCompact: 'TOGGLE DOCK'
  }
};

export const TacticalSynergyMatrix: React.FC<TacticalSynergyMatrixProps> = ({
  playerUnits = [],
  onSynergyBurst,
  language = 'ko',
  className = ''
}) => {
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [hasBurstFired, setHasBurstFired] = useState<boolean>(false);

  const t = SYNERGY_I18N[language] || SYNERGY_I18N.ko;

  // 비트마스크 연산
  const synergyMask = useMemo(() => {
    let mask = 0;
    if (playerUnits.length === 0) {
      // 기본 데모 시뮬레이션: 3대 클래스 모두 활성
      return MASK_TRIPLE_BURST;
    }

    playerUnits.forEach((unit) => {
      if (unit.isAlive === false) return;
      const type = (unit.classType || unit.name || '').toLowerCase();
      if (type.includes('frost') || type.includes('kadan') || type.includes('water') || type.includes('sword') || type.includes('방패')) {
        mask |= MASK_FROST;
      } else if (type.includes('flame') || type.includes('ignis') || type.includes('fire') || type.includes('sorcery') || type.includes('화염')) {
        mask |= MASK_FLAME;
      } else {
        mask |= MASK_HOLY;
      }
    });

    return mask;
  }, [playerUnits]);

  const isFrostActive = (synergyMask & MASK_FROST) !== 0;
  const isFlameActive = (synergyMask & MASK_FLAME) !== 0;
  const isHolyActive = (synergyMask & MASK_HOLY) !== 0;
  const isTripleBurst = (synergyMask & MASK_TRIPLE_BURST) === MASK_TRIPLE_BURST;

  useEffect(() => {
    if (isTripleBurst && !hasBurstFired) {
      setHasBurstFired(true);
      triggerHaptic('victory');
      if (onSynergyBurst) {
        onSynergyBurst(1.35); // 35% 증폭
      }
    } else if (!isTripleBurst && hasBurstFired) {
      setHasBurstFired(false);
    }
  }, [isTripleBurst, hasBurstFired, onSynergyBurst]);

  return (
    <div
      className={`bg-[#141212] border border-stone-800 rounded-none p-2.5 font-mono text-xs select-none ${className}`}
    >
      {/* 상단 타이틀 바 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2 h-2 rounded-none ${isTripleBurst ? 'bg-amber-400 animate-pulse' : 'bg-stone-600'}`} />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate">
            {t.header}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap');
            setIsCompact(!isCompact);
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold text-stone-500 hover:text-white p-1 rounded-xs"
          title={t.toggleCompact}
        >
          {isCompact ? '[+]' : '[-]'}
        </button>
      </div>

      {!isCompact && (
        <div className="space-y-2 pt-1">
          {/* 상태 배너 */}
          <div
            className={`p-1.5 border rounded-none text-[10px] font-bold text-center ${
              isTripleBurst
                ? 'bg-amber-950/30 border-amber-500/60 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}
          >
            {isTripleBurst ? t.statusActive : t.statusStandby}
          </div>

          {/* 3대 원소 노드 그리드 */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {/* FROST */}
            <div
              className={`p-1.5 border rounded-none ${
                isFrostActive
                  ? 'border-cyan-500/70 bg-cyan-950/20 text-cyan-300 font-bold'
                  : 'border-stone-800 bg-stone-950/40 text-stone-600'
              }`}
            >
              <div className="text-[9px] uppercase">[FROST]</div>
              <div className="text-[10px] truncate">{isFrostActive ? '✓ 연계' : '-'}</div>
            </div>

            {/* FLAME */}
            <div
              className={`p-1.5 border rounded-none ${
                isFlameActive
                  ? 'border-red-500/70 bg-red-950/20 text-red-300 font-bold'
                  : 'border-stone-800 bg-stone-950/40 text-stone-600'
              }`}
            >
              <div className="text-[9px] uppercase">[FLAME]</div>
              <div className="text-[10px] truncate">{isFlameActive ? '✓ 연계' : '-'}</div>
            </div>

            {/* HOLY */}
            <div
              className={`p-1.5 border rounded-none ${
                isHolyActive
                  ? 'border-amber-500/70 bg-amber-950/20 text-amber-300 font-bold'
                  : 'border-stone-800 bg-stone-950/40 text-stone-600'
              }`}
            >
              <div className="text-[9px] uppercase">[HOLY]</div>
              <div className="text-[10px] truncate">{isHolyActive ? '✓ 연계' : '-'}</div>
            </div>
          </div>

          {/* 버스트 효과 설명 */}
          <p className="text-[10px] text-stone-400 leading-tight">
            {t.burstDesc}
          </p>
        </div>
      )}
    </div>
  );
};

export default TacticalSynergyMatrix;
export const ElementalResonanceMatrix = TacticalSynergyMatrix;
