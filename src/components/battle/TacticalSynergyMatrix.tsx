import React, { useState, useEffect, useMemo } from 'react';
import { triggerHaptic } from '../../lib/haptic';

export interface TacticalSynergyMatrixProps {
  playerUnits?: Array<{ id: string | number; name: string; classType?: string; isAlive?: boolean }>;
  onSynergyBurst?: (multiplier: number) => void;
  language?: string;
  className?: string;
}

// Bitmask constants for high-speed bitwise operations
const MASK_CYBERNETIC = 1 << 0; // 1
const MASK_ASSAULT = 1 << 1;    // 2
const MASK_CHRONO = 1 << 2;     // 4
const MASK_TRIPLE_BURST = MASK_CYBERNETIC | MASK_ASSAULT | MASK_CHRONO; // 7

const SYNERGY_I18N: Record<string, Record<string, string>> = {
  ko: {
    header: '전술 시너지 매트릭스',
    statusActive: '트리플 시너지 버스트 가동 중',
    statusStandby: '클래스 링크 동기화 대기 중',
    cyber: 'CYBER // 사이버네틱',
    assault: 'ASSAULT // 어설트',
    chrono: 'CHRONO // 크로노',
    overclockTitle: '미니게임 연계 오버클럭 코어',
    burstDesc: '3대 클래스 동시 생존: 전 유닛 치명타율 +30% & 스킬 가속 +25%',
    toggleCompact: '매트릭스 접기/펼치기'
  },
  en: {
    header: 'TACTICAL SYNERGY MATRIX',
    statusActive: 'TRIPLE SYNERGY BURST ONLINE',
    statusStandby: 'CLASS LINK SYNCHRONIZATION PENDING',
    cyber: 'CYBER // CYBERNETIC',
    assault: 'ASSAULT // ASSAULT',
    chrono: 'CHRONO // CHRONO',
    overclockTitle: 'MINIGAME OVERCLOCK CORE',
    burstDesc: '3 CLASSES ALIVE: +30% CRIT CHANCE & +25% RECHARGE',
    toggleCompact: 'TOGGLE MATRIX DOCK'
  },
  ja: {
    header: '戦術シナジーマトリクス',
    statusActive: 'トリプルシナジーバースト稼働中',
    statusStandby: 'クラスリンク同期待機中',
    cyber: 'CYBER // サイバネティック',
    assault: 'ASSAULT // アサルト',
    chrono: 'CHRONO // クロノ',
    overclockTitle: 'ミニゲーム連携オーバークロック',
    burstDesc: '3大クラス同時生存: 全ユニット会心率 +30% & スキル加速 +25%',
    toggleCompact: 'マトリクス切替'
  },
  'zh-CN': {
    header: '战术协同矩阵',
    statusActive: '三重协同脉冲爆发激活中',
    statusStandby: '兵种链路同步就绪中',
    cyber: 'CYBER // 赛博网络',
    assault: 'ASSAULT // 突击先锋',
    chrono: 'CHRONO // 时空序列',
    overclockTitle: '小游戏高分联动超频核心',
    burstDesc: '三大兵种同时存活: 全员暴击率 +30% & 充能加速 +25%',
    toggleCompact: '折叠/展开矩阵'
  },
  'zh-TW': {
    header: '戰術協同矩陣',
    statusActive: '三重協同脈衝爆發啟用中',
    statusStandby: '兵種鏈路同步就緒中',
    cyber: 'CYBER // 賽博網絡',
    assault: 'ASSAULT // 突擊先鋒',
    chrono: 'CHRONO // 時空序列',
    overclockTitle: '小遊戲高分聯動超頻核心',
    burstDesc: '三大兵種同時存活: 全員暴擊率 +30% & 充能加速 +25%',
    toggleCompact: '折疊/展開矩陣'
  },
  de: {
    header: 'TAKTIK-SYNERGIE-MATRIX',
    statusActive: 'TRIPLE-SYNERGIE-BURST AKTIV',
    statusStandby: 'KLASSEN-LINK WIRD SYNCHRONISIERT',
    cyber: 'CYBER // KYBERNETIK',
    assault: 'ASSAULT // STURM',
    chrono: 'CHRONO // ZEIT',
    overclockTitle: 'MINISPIEL-ÜBERTAKTUNGSKERN',
    burstDesc: '3 KLASSEN AKTIV: +30% KRIT & +25% BESCHLEUNIGUNG',
    toggleCompact: 'MATRIX UMSCHALTEN'
  },
  es: {
    header: 'MATRIZ DE SINERGIA TÁCTICA',
    statusActive: 'BURST DE TRIPLE SINERGIA ACTIVO',
    statusStandby: 'ENLACE DE CLASE EN ESPERA',
    cyber: 'CYBER // CIBERNÉTICA',
    assault: 'ASSAULT // ASALTO',
    chrono: 'CHRONO // CRONO',
    overclockTitle: 'NÚCLEO DE SOBRERELOJ DE MINIJUEGO',
    burstDesc: '3 CLASES VIVAS: +30% CRÍTICO Y +25% RECARGA',
    toggleCompact: 'ALTERNAR MATRIZ'
  },
  fr: {
    header: 'MATRICE DE SYNERGIE TACTIQUE',
    statusActive: 'BURST DE TRIPLE SYNERGIE EN LIGNE',
    statusStandby: 'SYNCHRONISATION DES CLASSES',
    cyber: 'CYBER // CYBERNÉTIQUE',
    assault: 'ASSAULT // ASSAUT',
    chrono: 'CHRONO // CHRONO',
    overclockTitle: 'CŒUR SURCADENCÉ DU MINI-JEU',
    burstDesc: '3 CLASSES EN VIE: +30% CRITIQUE ET +25% VITESSE',
    toggleCompact: 'BASCULER MATRICE'
  },
  id: {
    header: 'MATRIKS SINERGI TAKTIS',
    statusActive: 'TRIPLE SINERGI BURST AKTIF',
    statusStandby: 'SINKRONISASI KELAS BERJALAN',
    cyber: 'CYBER // SIBERNETIK',
    assault: 'ASSAULT // PENYERANG',
    chrono: 'CHRONO // KRONO',
    overclockTitle: 'INTI OVERCLOCK MINIGAME',
    burstDesc: '3 KELAS HIDUP: +30% SERANGAN KRITIS & +25% PENGISIAN',
    toggleCompact: 'TUTUP/BUKA MATRIKS'
  },
  ru: {
    header: 'МАТРИЦА ТАКТИЧЕСКОЙ СИНЕРГИИ',
    statusActive: 'ТРОЙНОЙ ВСПЛЕСК СИНЕРГИИ АКТИВЕН',
    statusStandby: 'СИНХРОНИЗАЦИЯ КЛАССОВ ОЖИДАЕТСЯ',
    cyber: 'CYBER // КИБЕРНЕТИКА',
    assault: 'ASSAULT // ШТУРМ',
    chrono: 'CHRONO // ХРОНО',
    overclockTitle: 'ЯДРО РАЗГОНА ИЗ МИНИ-ИГР',
    burstDesc: '3 КЛАССА В СТРОЮ: +30% КРИТ & +25% СКОРОСТЬ',
    toggleCompact: 'СВЕРНУТЬ МАТРИЦУ'
  },
  th: {
    header: 'เมทริกซ์การทำงานร่วมกันทางยุทธวิธี',
    statusActive: 'ระเบิดการทำงานร่วมกันระดับสามเปิดใช้งานแล้ว',
    statusStandby: 'กำลังรอการเชื่อมโยงคลาส',
    cyber: 'CYBER // ไซเบอร์เนติก',
    assault: 'ASSAULT // โจมตีจู่โจม',
    chrono: 'CHRONO // โครโน',
    overclockTitle: 'แกนโอเวอร์คล็อกมินิเกม',
    burstDesc: '3 คลาสมีชีวิต: คริติคอล +30% & ชาร์จสกิลเร็วขึ้น +25%',
    toggleCompact: 'ย่อ/ขยายเมทริกซ์'
  },
  vi: {
    header: 'MA TRẬN HIỆP ĐỒNG CHIẾN THUẬT',
    statusActive: 'KÍCH HOẠT BÙNG NỔ TAM HIỆP ĐỒNG',
    statusStandby: 'ĐANG CHỜ ĐỒNG BỘ CÁC LỚP',
    cyber: 'CYBER // MẠNG TỰ ĐỘNG',
    assault: 'ASSAULT // TIÊN PHONG',
    chrono: 'CHRONO // THỜI GIAN',
    overclockTitle: 'LÕI ÉP XUNG TỪ MINI-GAME',
    burstDesc: '3 LỚP CÒN SỐNG: TỶ LỆ CHÍ MẠNG +30% & HỒI CHIÊU +25%',
    toggleCompact: 'ĐÓNG/MỞ MA TRẬN'
  }
};

export const TacticalSynergyMatrix: React.FC<TacticalSynergyMatrixProps> = ({
  playerUnits = [],
  onSynergyBurst,
  language = 'ko',
  className = ''
}) => {
  const tr = SYNERGY_I18N[language] || SYNERGY_I18N.ko;
  const [isExpanded, setIsExpanded] = useState(false);
  const [minigameOverclockCount, setMinigameOverclockCount] = useState(0);

  // Check minigame high-score combo from localStorage
  useEffect(() => {
    try {
      const combo = parseInt(localStorage.getItem('hero_minigame_high_combo') || '0', 10);
      const ap = parseInt(localStorage.getItem('hero_tactical_ap') || '0', 10);
      setMinigameOverclockCount(Math.min(5, Math.floor((combo + ap) / 50)));
    } catch {
      // ignore
    }
  }, []);

  // Compute bitmask: 60fps high performance
  const synergyBitmask = useMemo(() => {
    let mask = 0;
    if (!playerUnits || playerUnits.length === 0) {
      // Default to full synergy active in mock combat
      return MASK_TRIPLE_BURST;
    }

    for (const unit of playerUnits) {
      if (unit.isAlive !== false) {
        const cls = (unit.classType || '').toUpperCase();
        if (cls.includes('CYBER') || cls.includes('TECH') || cls.includes('SPECIALIST')) {
          mask |= MASK_CYBERNETIC;
        } else if (cls.includes('ASSAULT') || cls.includes('WARRIOR') || cls.includes('VANGUARD')) {
          mask |= MASK_ASSAULT;
        } else if (cls.includes('CHRONO') || cls.includes('MAGE') || cls.includes('SUPPORT')) {
          mask |= MASK_CHRONO;
        } else {
          // General units contribute based on ID parity
          const numId = typeof unit.id === 'number' ? unit.id : parseInt(String(unit.id).replace(/\D/g, '') || '0', 10);
          if (numId % 3 === 0) mask |= MASK_CYBERNETIC;
          else if (numId % 3 === 1) mask |= MASK_ASSAULT;
          else mask |= MASK_CHRONO;
        }
      }
    }
    return mask;
  }, [playerUnits]);

  const isCyberActive = (synergyBitmask & MASK_CYBERNETIC) !== 0;
  const isAssaultActive = (synergyBitmask & MASK_ASSAULT) !== 0;
  const isChronoActive = (synergyBitmask & MASK_CHRONO) !== 0;
  const isTripleBurst = (synergyBitmask & MASK_TRIPLE_BURST) === MASK_TRIPLE_BURST;

  useEffect(() => {
    if (isTripleBurst && onSynergyBurst) {
      onSynergyBurst(1.3); // +30% boost
    }
  }, [isTripleBurst, onSynergyBurst]);

  const handleToggle = () => {
    triggerHaptic('tap');
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`font-mono text-xs select-none transition-all ${className}`}>
      {/* Compact Dock Bar */}
      <div
        onClick={handleToggle}
        className={`w-full p-2 rounded-t-lg border cursor-pointer flex items-center justify-between transition-colors ${
          isTripleBurst
            ? 'bg-[#0f091c]/95 border-violet-500/40 text-violet-300 shadow-md shadow-violet-950/40'
            : 'bg-[#090d16]/95 border-white/10 text-gray-400'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Waveform Pulse Icon */}
          <svg className={`w-4 h-4 ${isTripleBurst ? 'text-violet-400 animate-pulse' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="font-bold text-[11px] tracking-wider uppercase">
            {tr.header}
          </span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${
            isTripleBurst
              ? 'bg-violet-950/80 border-violet-400/50 text-violet-200'
              : 'bg-black/50 border-white/10 text-gray-400'
          }`}>
            {isTripleBurst ? tr.statusActive : tr.statusStandby}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 3 Status Nodes */}
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isCyberActive ? 'bg-cyan-400 shadow-xs shadow-cyan-400' : 'bg-gray-700'}`} title={tr.cyber} />
            <span className={`w-2 h-2 rounded-full ${isAssaultActive ? 'bg-rose-400 shadow-xs shadow-rose-400' : 'bg-gray-700'}`} title={tr.assault} />
            <span className={`w-2 h-2 rounded-full ${isChronoActive ? 'bg-violet-400 shadow-xs shadow-violet-400' : 'bg-gray-700'}`} title={tr.chrono} />
          </div>

          <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Expanded Matrix Details */}
      {isExpanded && (
        <div className="bg-[#090d16]/98 border-x border-b border-violet-500/30 p-3 space-y-2.5 animate-fadeIn text-[11px]">
          {/* Class Link Matrix 3-Column */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className={`p-2 rounded border ${isCyberActive ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300' : 'bg-black/40 border-white/10 text-gray-600'}`}>
              <div className="font-bold text-[10px]">CYBERNETIC</div>
              <div className="text-[9px] mt-0.5">{isCyberActive ? '[LINKED]' : '[OFFLINE]'}</div>
            </div>
            <div className={`p-2 rounded border ${isAssaultActive ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' : 'bg-black/40 border-white/10 text-gray-600'}`}>
              <div className="font-bold text-[10px]">ASSAULT</div>
              <div className="text-[9px] mt-0.5">{isAssaultActive ? '[LINKED]' : '[OFFLINE]'}</div>
            </div>
            <div className={`p-2 rounded border ${isChronoActive ? 'bg-violet-950/30 border-violet-500/40 text-violet-300' : 'bg-black/40 border-white/10 text-gray-600'}`}>
              <div className="font-bold text-[10px]">CHRONO</div>
              <div className="text-[9px] mt-0.5">{isChronoActive ? '[LINKED]' : '[OFFLINE]'}</div>
            </div>
          </div>

          {/* Triple Burst Effect Description */}
          <div className={`p-2 rounded border flex items-center gap-2 ${
            isTripleBurst
              ? 'bg-violet-950/40 border-violet-500/50 text-violet-200'
              : 'bg-black/40 border-white/10 text-gray-400'
          }`}>
            <svg className="w-4 h-4 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <div className="text-[10px] leading-tight">
              {tr.burstDesc}
            </div>
          </div>

          {/* Minigame Overclock Integration */}
          {minigameOverclockCount > 0 && (
            <div className="p-2 bg-cyan-950/20 border border-cyan-500/30 rounded flex items-center justify-between text-[10px] text-cyan-300">
              <span className="font-bold">{tr.overclockTitle}</span>
              <span className="bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-400/40 font-bold">
                +{minigameOverclockCount * 5}% CORE AP
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TacticalSynergyMatrix;
