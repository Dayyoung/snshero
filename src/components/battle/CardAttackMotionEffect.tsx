import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getCharacterAttackMotionMeta,
  type AttackAnimationType,
} from '../../lib/attackMotionEngine';

export interface PlacedCardAttackEvent {
  id: string;
  slotIdx: number;
  cardId: number;
  isPlayer: boolean;
  flippedIndices: number[];
  timestamp: number;
}

interface SlotAttackMotionBurstProps {
  cardId: number;
  isPlayer?: boolean;
  language?: string;
  lowSpecMode?: boolean;
  /** Unique key per placement or capture trigger */
  triggerKey: string | number;
}

function getMotionVariants(attackType: AttackAnimationType) {
  switch (attackType) {
    case 'slash':
      return {
        initial: { opacity: 0, scale: 0.68, x: 16, y: -14, rotate: -14 },
        animate: {
          opacity: [0, 1, 1, 0],
          scale: [0.68, 1.26, 1.08, 1.0],
          x: [16, -10, 3, 0],
          y: [-14, 8, -2, 0],
          rotate: [-14, 9, -2, 0],
        },
      };
    case 'strike':
      return {
        initial: { opacity: 0, scale: 1.42, y: -28, rotate: 6 },
        animate: {
          opacity: [0, 1, 1, 0],
          scale: [1.42, 0.9, 1.18, 1.0],
          x: [0, -5, 4, 0],
          y: [-28, 10, -4, 0],
          rotate: [6, -6, 2, 0],
        },
      };
    case 'blast':
      return {
        initial: { opacity: 0, scale: 0.72, x: -12, y: 4 },
        animate: {
          opacity: [0, 1, 1, 0],
          scale: [0.72, 1.24, 1.1, 1.0],
          x: [-12, 8, -4, 0],
          y: [4, -6, 0, 0],
          rotate: [0, -5, 3, 0],
        },
      };
    case 'burst':
      return {
        initial: { opacity: 0, scale: 0.6, y: 14 },
        animate: {
          opacity: [0, 1, 1, 0],
          scale: [0.6, 1.28, 1.12, 1.0],
          x: [0, 0, 0, 0],
          y: [14, -10, -2, 0],
          rotate: [0, 4, -4, 0],
        },
      };
    case 'spin':
      return {
        initial: { opacity: 0, scale: 0.62, rotate: -140 },
        animate: {
          opacity: [0, 1, 1, 0],
          scale: [0.62, 1.24, 1.08, 1.0],
          x: [0, -6, 4, 0],
          y: [0, -4, 2, 0],
          rotate: [-140, 18, -4, 0],
        },
      };
    case 'charge':
    default:
      return {
        initial: { opacity: 0, scale: 0.7, x: 26, y: 6, rotate: -10 },
        animate: {
          opacity: [0, 1, 1, 0],
          scale: [0.7, 1.25, 1.06, 1.0],
          x: [26, -12, 3, 0],
          y: [6, -6, 0, 0],
          rotate: [-10, 6, 0, 0],
        },
      };
  }
}

/**
 * Renders the dynamic Attack Motion pop-out cutout, elemental slash/blast SVG wave,
 * and signature move callout badge on a board slot when a card is placed down.
 */
export const SlotAttackMotionBurst: React.FC<SlotAttackMotionBurstProps> = ({
  cardId,
  isPlayer = true,
  language = 'ko',
  lowSpecMode = false,
  triggerKey,
}) => {
  if (lowSpecMode) return null;

  const meta = getCharacterAttackMotionMeta(cardId);
  const variants = getMotionVariants(meta.attackAnimation);
  const moveLabel = language === 'ko' ? meta.moveNameKo : meta.moveNameEn;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`atk-slot-burst-${cardId}-${triggerKey}`}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 z-[45] flex items-center justify-center overflow-visible select-none"
      >
        {/* 1. Expanding Elemental Shockwave Ring */}
        <motion.div
          initial={{ scale: 0.35, opacity: 0.95 }}
          animate={{ scale: 1.55, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="absolute inset-[8%] rounded-sm border-2"
          style={{
            borderColor: meta.accentHex,
            boxShadow: `0 0 16px ${meta.glowRgba}, inset 0 0 12px ${meta.glowRgba}`,
          }}
        />

        {/* 2. High-Res Attack Motion Character Pop-Out Lunge */}
        <motion.img
          src={meta.cutoutAttackUrl}
          alt=""
          aria-hidden="true"
          initial={variants.initial}
          animate={variants.animate}
          transition={{ duration: 0.78, times: [0, 0.32, 0.72, 1], ease: 'easeOut' }}
          className="relative z-10 h-[96%] w-[96%] object-contain"
          style={{
            filter: `drop-shadow(0 0 8px ${meta.glowRgba})`,
          }}
        />

        {/* 3. Dynamic SVG Attack Slash / Blast / Impact Overlay */}
        <motion.svg
          viewBox="0 0 100 100"
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: [0, 1, 0.9, 0], scale: [0.65, 1.15, 1.22, 1.3] }}
          transition={{ duration: 0.62, times: [0, 0.25, 0.65, 1], ease: 'easeOut' }}
          className="pointer-events-none absolute inset-[-8%] z-20 h-[116%] w-[116%] overflow-visible"
          aria-hidden="true"
        >
          {meta.attackAnimation === 'slash' && (
            <g>
              <path
                d="M 88,14 Q 46,44 10,84 Q 40,56 92,26 Z"
                fill={meta.accentHex}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <path
                d="M 16,18 Q 52,50 86,82 Q 56,42 24,12 Z"
                fill="#ffffff"
                fillOpacity="0.88"
                stroke={meta.primaryHex}
                strokeWidth="1.2"
              />
            </g>
          )}
          {meta.attackAnimation === 'strike' && (
            <g>
              <polygon
                points="50,6 59,36 92,28 66,52 88,82 54,66 38,94 40,62 8,66 35,44 16,16 45,34"
                fill={meta.accentHex}
                fillOpacity="0.85"
                stroke="#ffffff"
                strokeWidth="1.6"
              />
              <circle cx="50" cy="50" r="16" fill="#ffffff" fillOpacity="0.92" />
            </g>
          )}
          {meta.attackAnimation === 'blast' && (
            <g>
              <circle
                cx="50"
                cy="50"
                r="34"
                fill="none"
                stroke={meta.accentHex}
                strokeWidth="4"
                strokeDasharray="10 5"
              />
              <polygon
                points="50,10 60,40 90,50 60,60 50,90 40,60 10,50 40,40"
                fill="#ffffff"
                stroke={meta.primaryHex}
                strokeWidth="2"
              />
            </g>
          )}
          {meta.attackAnimation === 'burst' && (
            <g>
              <polyline
                points="25,92 38,60 22,52 44,24 34,18 54,4"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
              />
              <polyline
                points="76,90 64,58 78,48 58,22 68,14 48,4"
                fill="none"
                stroke={meta.accentHex}
                strokeWidth="3"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={meta.accentHex}
                strokeWidth="2.5"
              />
            </g>
          )}
          {meta.attackAnimation === 'spin' && (
            <g>
              <ellipse
                cx="50"
                cy="50"
                rx="44"
                ry="22"
                transform="rotate(-28 50 50)"
                fill="none"
                stroke={meta.accentHex}
                strokeWidth="4.5"
              />
              <ellipse
                cx="50"
                cy="50"
                rx="44"
                ry="22"
                transform="rotate(28 50 50)"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
              />
            </g>
          )}
          {meta.attackAnimation === 'charge' && (
            <g>
              <polygon
                points="8,50 62,16 46,50 62,84"
                fill={meta.accentHex}
                fillOpacity="0.88"
                stroke="#ffffff"
                strokeWidth="1.8"
              />
              <line x1="18" y1="26" x2="92" y2="26" stroke="#ffffff" strokeWidth="2.5" />
              <line x1="12" y1="50" x2="96" y2="50" stroke="#ffffff" strokeWidth="3.2" />
              <line x1="18" y1="74" x2="92" y2="74" stroke="#ffffff" strokeWidth="2.5" />
            </g>
          )}
        </motion.svg>

        {/* 4. Signature Attack Motion Callout Tag */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.85 }}
          animate={{ opacity: [0, 1, 1, 0], y: [10, -2, -6, -12], scale: [0.85, 1.04, 1, 0.92] }}
          transition={{ duration: 0.82, times: [0, 0.18, 0.78, 1], ease: 'easeOut' }}
          className="absolute bottom-[4%] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-xs border px-1.5 py-0.5 font-mono text-[8px] sm:text-[9px] font-black tracking-tight text-white"
          style={{
            backgroundColor: isPlayer ? '#1e3a8a' : '#7f1d1d',
            borderColor: meta.accentHex,
            boxShadow: `0 0 8px ${meta.glowRgba}`,
          }}
        >
          <span>{meta.actionTag}</span>{' '}
          <span className="text-[#fde047]">{moveLabel.split('·')[1]?.trim() || moveLabel}</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface BoardAttackVectorOverlayProps {
  attackEvent: PlacedCardAttackEvent | null;
  language?: string;
  lowSpecMode?: boolean;
}

/**
 * Renders directional attack projectiles / slash waves across the 3x3 board
 * from the newly placed card slot into any adjacent captured/attacked slots.
 */
export const BoardAttackVectorOverlay: React.FC<BoardAttackVectorOverlayProps> = ({
  attackEvent,
  language = 'ko',
  lowSpecMode = false,
}) => {
  if (!attackEvent || lowSpecMode) return null;

  const meta = getCharacterAttackMotionMeta(attackEvent.cardId);
  const srcRow = Math.floor(attackEvent.slotIdx / 3);
  const srcCol = attackEvent.slotIdx % 3;
  const x1 = (srcCol + 0.5) * 33.333;
  const y1 = (srcRow + 0.5) * 33.333;

  // Determine adjacent targets: if flippedIndices exist, highlight them strongly;
  // also emit a quick directional shock pulse in the 4 cardinal directions
  const cardinalNeighbors: number[] = [];
  if (srcRow > 0) cardinalNeighbors.push(attackEvent.slotIdx - 3);
  if (srcCol < 2) cardinalNeighbors.push(attackEvent.slotIdx + 1);
  if (srcRow < 2) cardinalNeighbors.push(attackEvent.slotIdx + 3);
  if (srcCol > 0) cardinalNeighbors.push(attackEvent.slotIdx - 1);

  const activeTargets =
    attackEvent.flippedIndices.length > 0 ? attackEvent.flippedIndices : cardinalNeighbors;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={attackEvent.id}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 z-[60] overflow-hidden select-none"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          {activeTargets.map((tgtIdx) => {
            const isCapture = attackEvent.flippedIndices.includes(tgtIdx);
            const tgtRow = Math.floor(tgtIdx / 3);
            const tgtCol = tgtIdx % 3;
            const x2 = (tgtCol + 0.5) * 33.333;
            const y2 = (tgtRow + 0.5) * 33.333;
            const mx = (x1 + x2) * 0.5;
            const my = (y1 + y2) * 0.5;

            return (
              <g key={`atk-vec-${attackEvent.id}-${tgtIdx}`}>
                {/* Directional Attack Slash / Beam Line */}
                <motion.line
                  x1={x1}
                  y1={y1}
                  x2={isCapture ? x2 : mx}
                  y2={isCapture ? y2 : my}
                  stroke={meta.accentHex}
                  strokeWidth={isCapture ? '2.8' : '1.4'}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.95 }}
                  animate={{ pathLength: [0, 1, 1], opacity: [0.95, 1, 0] }}
                  transition={{ duration: isCapture ? 0.55 : 0.38, ease: 'easeOut' }}
                />
                <motion.line
                  x1={x1}
                  y1={y1}
                  x2={isCapture ? x2 : mx}
                  y2={isCapture ? y2 : my}
                  stroke="#ffffff"
                  strokeWidth={isCapture ? '1.2' : '0.6'}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 1 }}
                  animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
                  transition={{ duration: isCapture ? 0.52 : 0.35, ease: 'easeOut' }}
                />

                {/* Target Impact Slash Cross on Captured Slot */}
                {isCapture && (
                  <motion.g
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1.0, 1.1] }}
                    transition={{ duration: 0.62, times: [0, 0.25, 0.7, 1] }}
                  >
                    <line
                      x1={x2 - 9}
                      y1={y2 - 9}
                      x2={x2 + 9}
                      y2={y2 + 9}
                      stroke={meta.accentHex}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={x2 + 9}
                      y1={y2 - 9}
                      x2={x2 - 9}
                      y2={y2 + 9}
                      stroke="#ffffff"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={x2}
                      cy={y2}
                      r="7"
                      fill="none"
                      stroke={meta.accentHex}
                      strokeWidth="1.5"
                    />
                  </motion.g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Top Battle Banner when a card captures enemy cards with its attack motion */}
        {attackEvent.flippedIndices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-12, 0, 0, -8], scale: [0.9, 1.02, 1, 0.95] }}
            transition={{ duration: 0.88, times: [0, 0.16, 0.78, 1] }}
            className="absolute top-1.5 left-1/2 z-30 -translate-x-1/2 flex items-center gap-1.5 rounded-xs border border-[#fde047] bg-[#201d1d]/95 px-2.5 py-1 font-mono text-[10px] font-black text-[#fdfcfc]"
            style={{
              boxShadow: `0 0 12px ${meta.glowRgba}`,
            }}
          >
            <span className="text-[#fde047]">{meta.actionTag}</span>
            <span>{language === 'ko' ? meta.moveNameKo : meta.moveNameEn}</span>
            <span className="rounded-xs bg-[#dc2626] px-1 py-0.2 text-[9px] text-white">
              +{attackEvent.flippedIndices.length} FLIP!
            </span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
