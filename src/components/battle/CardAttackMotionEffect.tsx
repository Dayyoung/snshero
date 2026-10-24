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

/**
 * Returns the character-centric attack motion keyframe animation for the character sprite itself.
 * Opacity is ALWAYS 1 so the character is never invisible or faded out on the board.
 */
export function getCharacterAttackLungeAnimation(attackType: AttackAnimationType) {
  switch (attackType) {
    case 'slash':
      return {
        scale: [0.92, 1.18, 1.05],
        x: [8, -6, 0],
        y: [-6, 4, 0],
        rotate: [-8, 5, 0],
      };
    case 'strike':
      return {
        scale: [1.22, 0.94, 1.06],
        x: [0, 0, 0],
        y: [-14, 5, 0],
        rotate: [4, -3, 0],
      };
    case 'blast':
      return {
        scale: [0.9, 1.18, 1.05],
        x: [-6, 5, 0],
        y: [3, -4, 0],
        rotate: [0, -3, 0],
      };
    case 'burst':
      return {
        scale: [0.88, 1.2, 1.06],
        x: [0, 0, 0],
        y: [8, -6, 0],
        rotate: [0, 3, 0],
      };
    case 'spin':
      return {
        scale: [0.9, 1.18, 1.05],
        x: [-5, 5, 0],
        y: [0, -4, 0],
        rotate: [-18, 8, 0],
      };
    case 'charge':
    default:
      return {
        scale: [0.9, 1.2, 1.05],
        x: [12, -7, 0],
        y: [4, -4, 0],
        rotate: [-6, 3, 0],
      };
  }
}

/**
 * Renders BEHIND the character (z-[5] inside the illustration window, behind the z-10 character)
 * so that 0% of the special effect ever covers or obscures the character's face or body.
 */
export const SlotAttackMotionBurst: React.FC<SlotAttackMotionBurstProps> = ({
  cardId,
  lowSpecMode = false,
  triggerKey,
}) => {
  if (lowSpecMode) return null;

  const meta = getCharacterAttackMotionMeta(cardId);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`atk-slot-burst-${cardId}-${triggerKey}`}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center overflow-hidden select-none"
      >
        {/* 1. Expanding Outer Perimeter Shockwave Ring (behind character, hollow center) */}
        <motion.div
          initial={{ scale: 0.55, opacity: 0.9 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 0.52, ease: 'easeOut' }}
          className="absolute inset-[4%] rounded-xs border-2"
          style={{
            borderColor: meta.accentHex,
            boxShadow: `0 0 12px ${meta.glowRgba}`,
          }}
        />

        {/* 2. Perimeter Rim Slash / Aura Arcs BEHIND the character (center r < 34 kept 100% clear) */}
        <motion.svg
          viewBox="0 0 100 100"
          initial={{ opacity: 0.95, scale: 0.78 }}
          animate={{ opacity: 0, scale: 1.22 }}
          transition={{ duration: 0.58, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke={meta.accentHex}
            strokeWidth="3.5"
            strokeDasharray={
              meta.attackAnimation === 'slash' || meta.attackAnimation === 'spin'
                ? '28 14'
                : '16 10'
            }
          />
          <circle
            cx="50"
            cy="50"
            r="39"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeDasharray="18 22"
          />
        </motion.svg>
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
 * Renders directional attack slash waves from the OUTER BORDER of the placed card slot
 * toward captured slots, keeping all characters' faces and bodies 100% unobstructed.
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
  const cx1 = (srcCol + 0.5) * 33.333;
  const cy1 = (srcRow + 0.5) * 33.333;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={attackEvent.id}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pointer-events-none absolute inset-0 z-[45] overflow-visible select-none"
      >
        {/* Outer Slot Border Impact Flash on the Placed Slot (100% hollow center so character is untouched) */}
        <motion.div
          initial={{ opacity: 0.95, scale: 0.96 }}
          animate={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.48, ease: 'easeOut' }}
          className="absolute rounded-sm border-2"
          style={{
            left: `${srcCol * 33.333 + 0.8}%`,
            top: `${srcRow * 33.333 + 0.8}%`,
            width: '31.733%',
            height: '31.733%',
            borderColor: meta.accentHex,
            boxShadow: `0 0 12px ${meta.glowRgba}`,
          }}
        />

        {attackEvent.flippedIndices.length > 0 && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            aria-hidden="true"
          >
            {attackEvent.flippedIndices.map((tgtIdx) => {
              const tgtRow = Math.floor(tgtIdx / 3);
              const tgtCol = tgtIdx % 3;
              const cx2 = (tgtCol + 0.5) * 33.333;
              const cy2 = (tgtRow + 0.5) * 33.333;

              // Start line at the boundary between the two slots so neither character's face is crossed
              const dx = cx2 - cx1;
              const dy = cy2 - cy1;
              const sx = cx1 + dx * 0.36;
              const sy = cy1 + dy * 0.36;
              const ex = cx1 + dx * 0.68;
              const ey = cy1 + dy * 0.68;

              return (
                <g key={`atk-vec-${attackEvent.id}-${tgtIdx}`}>
                  <motion.line
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke={meta.accentHex}
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                  <motion.line
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.42, ease: 'easeOut' }}
                  />
                  {/* Perimeter-only ring on captured slot (center kept 100% clear) */}
                  <motion.rect
                    x={tgtCol * 33.333 + 1.5}
                    y={tgtRow * 33.333 + 1.5}
                    width={30.333}
                    height={30.333}
                    rx="1.5"
                    fill="none"
                    stroke={meta.accentHex}
                    strokeWidth="1.8"
                    initial={{ opacity: 0.95 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.52, ease: 'easeOut' }}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Top Battle Banner outside the card centers when capturing */}
        {attackEvent.flippedIndices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="hidden"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
