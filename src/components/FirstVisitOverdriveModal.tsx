import React, { useState, useEffect, useRef } from 'react';

export interface FirstVisitOverdriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterDeck: () => void;
}

type ModalStage = 'PACK_READY' | 'CARD_REVEALED' | 'OVERDRIVE_CLIMAX' | 'OVERDRIVE_IMPACT' | 'REWARD_CLAIM';

// Pure inline SVG icons strictly adhering to strokeWidth="1.75" and Zero-Emoji rule
const TacticalCoreIcon = ({ className = 'w-5 h-5 text-cyan-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const TargetCrosshairIcon = ({ className = 'w-5 h-5 text-rose-500' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ShieldIcon = ({ className = 'w-5 h-5 text-emerald-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const VectorArrowIcon = ({ className = 'w-5 h-5 text-amber-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const SupplyPackIcon = ({ className = 'w-5 h-5 text-indigo-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const ImpactBoltIcon = ({ className = 'w-5 h-5 text-amber-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const CloseIcon = ({ className = 'w-5 h-5 text-slate-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = ({ className = 'w-5 h-5 text-emerald-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Safe gtag dispatcher
const triggerFunnelEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined') {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      try {
        gtag('event', eventName, params);
      } catch {
        // Safe failover
      }
    }
  }
};

export const FirstVisitOverdriveModal: React.FC<FirstVisitOverdriveModalProps> = ({
  isOpen,
  onClose,
  onEnterDeck,
}) => {
  const [stage, setStage] = useState<ModalStage>('PACK_READY');
  const [bossHpPercent, setBossHpPercent] = useState<number>(100);
  const [overdriveEnergy] = useState<number>(100);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(15000);
  const [isCriticalFlashing, setIsCriticalFlashing] = useState<boolean>(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('PACK_READY');
      setBossHpPercent(100);
      setTimeLeftMs(15000);
      setIsCriticalFlashing(false);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Handle countdown during OVERDRIVE_CLIMAX
  useEffect(() => {
    if (stage === 'OVERDRIVE_CLIMAX') {
      const startTime = Date.now();
      const initialRemaining = 15000;

      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, initialRemaining - elapsed);
        setTimeLeftMs(remaining);

        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      }, 50);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [stage]);

  if (!isOpen) return null;

  // Stage 1 Action: Unseal Pack
  const handleUnsealPack = () => {
    triggerFunnelEvent('ftue_pack_open', {
      source: 'tactical_first_visit',
      unit_id: 'SH-101',
    });
    setStage('CARD_REVEALED');
  };

  // Stage 1 Transition to Boss Battle
  const handleProceedToClimax = () => {
    setStage('OVERDRIVE_CLIMAX');
  };

  // Stage 2 Action: Engage Tactical Overdrive
  const handleEngageOverdrive = () => {
    if (stage !== 'OVERDRIVE_CLIMAX') return;

    triggerFunnelEvent('ftue_overdrive_engage', {
      unit: 'SH-101 // SOVEREIGN',
      boss: 'APEX GOLIATH // MK-IV',
      damage: 999999,
    });

    setStage('OVERDRIVE_IMPACT');
    setIsCriticalFlashing(true);

    // Animate Boss HP down to 0%
    setTimeout(() => {
      setBossHpPercent(0);
    }, 150);

    // Transition to Stage 3 (REWARD_CLAIM) after impact sequence
    setTimeout(() => {
      setIsCriticalFlashing(false);
      setStage('REWARD_CLAIM');
    }, 1400);
  };

  // Stage 3 Action: Claim Rewards & Enter Deck
  const handleClaimAndEnterDeck = () => {
    triggerFunnelEvent('ftue_reward_claim', {
      tickets: 10,
      unit_access: 'SH-101_SOVEREIGN_24H',
      status: 'success',
    });

    // Store completed state in localStorage as required
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('snshero_ftue_overdrive_v1', new Date().toISOString());
        
        // Grant 10 prime summon tickets in persistent storage
        const currentTickets = parseInt(localStorage.getItem('hero_prime_summon_tickets') || '0', 10);
        localStorage.setItem('hero_prime_summon_tickets', (currentTickets + 10).toString());

        // Grant 24H Sovereign command access expiry
        const accessExpiry = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('hero_sh101_sovereign_access_until', accessExpiry.toString());
      } catch {
        // Storage fail-safe
      }
    }

    onEnterDeck();
    onClose();
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('snshero_ftue_overdrive_v1', 'skipped');
      } catch {
        // Storage fail-safe
      }
    }
    onClose();
  };

  const secondsDisplay = (timeLeftMs / 1000).toFixed(2);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tactical-overdrive-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 min-h-[100dvh] max-h-[100dvh] overflow-y-auto bg-black/80 backdrop-blur-md transition-all select-none"
    >
      {/* Critical Impact Fullscreen Flash Overlay */}
      {isCriticalFlashing && (
        <div className="fixed inset-0 z-60 pointer-events-none bg-rose-500/25 animate-pulse mix-blend-screen" />
      )}

      {/* Main Tactical Container */}
      <div
        className={`relative w-full max-w-lg bg-[#090d16]/95 backdrop-blur-md border border-white/15 rounded-none p-5 sm:p-6 text-white shadow-2xl transition-all duration-300 ${
          isCriticalFlashing ? 'scale-[1.02] border-rose-500/60' : ''
        }`}
      >
        {/* Top Header Row with System Identifiers & Skip Protocol */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono tracking-wider uppercase text-xs text-cyan-400 font-semibold">
              TACTICAL OVERDRIVE // PROTOCOL 01
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-sm border border-transparent hover:border-white/15"
            title="Skip Protocol"
            aria-label="Skip Protocol"
          >
            <CloseIcon className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* STAGE 1: PACK_READY */}
        {stage === 'PACK_READY' && (
          <div className="space-y-5 animate-fade-in text-center">
            {/* Visual Container */}
            <div className="relative mx-auto w-36 h-36 flex items-center justify-center border border-cyan-500/30 bg-cyan-950/20 rounded-none group">
              <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent opacity-80" />
              <div className="relative flex flex-col items-center">
                <SupplyPackIcon className="w-16 h-16 text-cyan-400" />
                <span className="mt-2 font-mono tracking-wider uppercase text-xs text-cyan-300">
                  CLASSIFIED // SSR DROP
                </span>
              </div>
              <div className="absolute top-1 left-1 text-[9px] font-mono text-cyan-600">LOCKED</div>
              <div className="absolute bottom-1 right-1 text-[9px] font-mono text-cyan-600">4096-BIT</div>
            </div>

            <div>
              <div className="font-mono tracking-wider uppercase text-xs text-cyan-400 mb-1">
                SECURE ENCRYPTED CONTAINER DETECTED
              </div>
              <h2
                id="tactical-overdrive-title"
                className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-white"
              >
                TACTICAL SSR SUPPLY PACK
              </h2>
              <p className="mt-2 text-xs font-mono text-slate-300 leading-relaxed max-w-sm mx-auto">
                First-time authorization verified. High-priority orbital supply container awaiting unseal.
              </p>
            </div>

            {/* Spec Matrix */}
            <div className="grid grid-cols-3 gap-2 border border-white/10 bg-black/40 p-2 text-left">
              <div>
                <div className="font-mono uppercase text-[10px] text-slate-400">CLASS</div>
                <div className="font-mono tracking-wider uppercase text-xs font-bold text-white">DREADNOUGHT</div>
              </div>
              <div>
                <div className="font-mono uppercase text-[10px] text-slate-400">EST. PWR</div>
                <div className="font-mono tracking-wider uppercase text-xs font-bold text-amber-400">9,850+</div>
              </div>
              <div>
                <div className="font-mono uppercase text-[10px] text-slate-400">CLEARANCE</div>
                <div className="font-mono tracking-wider uppercase text-xs font-bold text-cyan-400">TIER-1 SSR</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleUnsealPack}
              className="w-full min-h-[48px] px-6 py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono tracking-wider uppercase text-sm font-bold border border-cyan-400/50 shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer"
            >
              <SupplyPackIcon className="w-5 h-5 text-white" />
              <span>UNSEAL SSR TACTICAL PACK</span>
            </button>
          </div>
        )}

        {/* STAGE 1 (Substage): CARD_REVEALED */}
        {stage === 'CARD_REVEALED' && (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="font-mono tracking-wider uppercase text-xs text-amber-400 font-semibold">
              UNSEAL COMPLETE // SSR UNIT ACQUIRED
            </div>

            {/* Unit Card Card Visual */}
            <div className="border border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-slate-900/60 to-black/80 p-4 text-left relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 font-mono tracking-wider uppercase text-[10px] text-amber-300 font-bold mb-1">
                    SSR // DREADNOUGHT
                  </span>
                  <h3 className="text-lg sm:text-xl font-mono font-bold text-white tracking-wide">
                    SH-101 // SOVEREIGN
                  </h3>
                </div>
                <div className="text-right">
                  <div className="font-mono uppercase text-[10px] text-slate-400">COMBAT PWR</div>
                  <div className="font-mono tracking-wider text-xl font-bold text-amber-400">
                    9,850
                  </div>
                </div>
              </div>

              <div className="my-3 py-2 px-3 bg-black/60 border border-white/10 font-mono text-xs text-slate-300 flex items-center justify-between">
                <span>TACTICAL CORE: ARMED</span>
                <span className="text-cyan-400 font-semibold">SYNERGY: OVERDRIVE</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <TacticalCoreIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>ORBITAL CANNON ARRAY WITH QUANTUM CHARGE COUPLING</span>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              URGENT: Hostile titan signature incoming. Engage combat deployment immediately.
            </div>

            {/* CTA Button */}
            <button
              onClick={handleProceedToClimax}
              className="w-full min-h-[48px] px-6 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-mono tracking-wider uppercase text-sm font-bold border border-amber-400/50 shadow-lg shadow-amber-950/60 transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer"
            >
              <VectorArrowIcon className="w-5 h-5 text-white" />
              <span>DEPLOY UNIT & COMMENCE INTERCEPT</span>
            </button>
          </div>
        )}

        {/* STAGE 2: OVERDRIVE_CLIMAX & OVERDRIVE_IMPACT */}
        {(stage === 'OVERDRIVE_CLIMAX' || stage === 'OVERDRIVE_IMPACT') && (
          <div className="space-y-4 animate-fade-in">
            {/* Climax Header & Timer */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <TargetCrosshairIcon className="w-4 h-4 text-rose-500 animate-spin" />
                <span className="font-mono tracking-wider uppercase text-xs text-rose-400 font-semibold">
                  TITAN ENGAGEMENT // CLIMAX
                </span>
              </div>
              <div className="font-mono tracking-wider uppercase text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5">
                TIME LIMIT: {secondsDisplay}s
              </div>
            </div>

            {/* Boss Threat Profile */}
            <div className="border border-rose-500/30 bg-rose-950/20 p-3 relative">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-mono tracking-wider uppercase text-xs text-rose-400 font-bold flex items-center gap-1.5">
                  <span>HOSTILE: APEX GOLIATH // MK-IV</span>
                </div>
                <span className="font-mono uppercase text-[10px] text-slate-400">
                  {bossHpPercent}% HP
                </span>
              </div>

              {/* Boss HP Gauge */}
              <div className="w-full h-3 bg-black/60 border border-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-300"
                  style={{ width: `${bossHpPercent}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
                <span>CLASS: TITAN CORRUPTOR</span>
                <span>ARMOR: HEAVY FORTIFIED</span>
              </div>
            </div>

            {/* Allied Overdrive Status */}
            <div className="border border-cyan-500/30 bg-cyan-950/20 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-mono tracking-wider uppercase text-xs text-cyan-400 font-bold flex items-center gap-1.5">
                  <TacticalCoreIcon className="w-4 h-4 text-cyan-400" />
                  <span>SH-101 // OVERDRIVE CORE</span>
                </div>
                <span className="font-mono uppercase text-xs text-cyan-300 font-bold">
                  {overdriveEnergy}% READY
                </span>
              </div>

              {/* Allied Tactical Energy Gauge */}
              <div className="w-full h-3 bg-black/60 border border-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-400 to-indigo-500 transition-all duration-300 animate-pulse"
                  style={{ width: `${overdriveEnergy}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
                <span>QUANTUM CONDENSER: MAX CHARGE</span>
                <span className="text-cyan-400 font-semibold">LETHAL STRIKE READY</span>
              </div>
            </div>

            {/* Impact Banner during strike */}
            {stage === 'OVERDRIVE_IMPACT' && (
              <div className="py-2.5 px-3 bg-rose-600/30 border border-rose-500 text-center animate-bounce">
                <div className="font-mono tracking-wider uppercase text-xs font-bold text-rose-300">
                  CRITICAL STRIKE // 999,999 DAMAGE
                </div>
                <div className="font-mono text-[11px] text-white">
                  TARGET STRUCTURE DESTROYED. VICTORY CONFIRMED.
                </div>
              </div>
            )}

            {/* Action Button: Engage Tactical Overdrive */}
            <button
              onClick={handleEngageOverdrive}
              disabled={stage === 'OVERDRIVE_IMPACT'}
              className={`w-full min-h-[48px] px-6 py-3 font-mono tracking-wider uppercase text-sm font-bold border transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer ${
                stage === 'OVERDRIVE_IMPACT'
                  ? 'bg-rose-700 text-white border-rose-400 opacity-90'
                  : 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border-rose-400/60 shadow-xl shadow-rose-950/80 active:scale-[0.99]'
              }`}
            >
              <ImpactBoltIcon className="w-5 h-5 text-white" />
              <span>{stage === 'OVERDRIVE_IMPACT' ? 'OVERDRIVE ENGAGED' : 'ENGAGE TACTICAL OVERDRIVE'}</span>
            </button>
          </div>
        )}

        {/* STAGE 3: REWARD_CLAIM */}
        {stage === 'REWARD_CLAIM' && (
          <div className="space-y-4 animate-fade-in text-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono tracking-wider uppercase text-[10px] font-bold mb-1">
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>OVERDRIVE VICTORY CONFIRMED</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-white">
                TACTICAL REWARD AUTHORIZATION
              </h2>
              <p className="mt-1 text-xs font-mono text-slate-300">
                Combat performance rated SSS. Rewards registered to your command account.
              </p>
            </div>

            {/* Rewards Display Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {/* Reward 1: 10x Prime Summon Ticket */}
              <div className="border border-indigo-500/40 bg-indigo-950/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono uppercase text-[10px] text-indigo-400 font-semibold">
                    CURRENCY DROP
                  </span>
                  <span className="font-mono tracking-wider uppercase text-xs font-bold text-amber-400">
                    x10
                  </span>
                </div>
                <div className="font-mono font-bold text-sm text-white">
                  10x PRIME SUMMON TICKET
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  Standard deployment protocol tickets for premium units.
                </div>
              </div>

              {/* Reward 2: SH-101 Sovereign 24H Command Access */}
              <div className="border border-cyan-500/40 bg-cyan-950/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono uppercase text-[10px] text-cyan-400 font-semibold">
                    TACTICAL ACCESS
                  </span>
                  <span className="font-mono tracking-wider uppercase text-xs font-bold text-cyan-300">
                    24:00:00
                  </span>
                </div>
                <div className="font-mono font-bold text-sm text-white">
                  SH-101 SOVEREIGN 24H
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  Full command deck clearance with PWR 9,850 capability.
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-2.5 bg-black/40 border border-white/10 text-left flex items-start gap-2">
              <ShieldIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] font-mono text-slate-300 leading-tight">
                Data persistence synced to local tactical storage. Welcome aboard, Commander.
              </div>
            </div>

            {/* CTA Button: Claim & Enter Command Deck */}
            <button
              onClick={handleClaimAndEnterDeck}
              className="w-full min-h-[48px] px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono tracking-wider uppercase text-sm font-bold border border-emerald-400/50 shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer"
            >
              <VectorArrowIcon className="w-5 h-5 text-white" />
              <span>CLAIM & ENTER COMMAND DECK</span>
            </button>
          </div>
        )}

        {/* Footer Subtext */}
        <div className="mt-4 pt-2 border-t border-white/5 text-center">
          <span className="font-mono uppercase text-[10px] text-slate-400 tracking-wider">
            SYSTEM // SNSHERO REVOLUTION TACTICAL FTUE V1
          </span>
        </div>
      </div>
    </div>
  );
};

export default FirstVisitOverdriveModal;
