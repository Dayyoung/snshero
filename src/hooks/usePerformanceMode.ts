/**
 * usePerformanceMode — Centralized performance-mode hook
 *
 * Consolidates all low-spec optimizations into a single hook,
 * eliminating scattered `lowSpecMode ? x : y` conditionals.
 * Reads from the existing GameSettingsContext.
 *
 * Policies provided:
 *   - reducedMotion: skip Framer Motion animations
 *   - lowData: prefer lighter assets / avoid prefetch
 *   - imageQuality: prioritize low-spec fallbacks
 *   - listSize: truncate long lists
 *   - frameInterval: longer intervals in game loops / requestAnimationFrame
 *   - disableParticles: hide particle effects, card shines
 *   - disableHover: skip whileHover / hover-scale effects
 *   - disableGradients: use solid colors instead of gradients
 *   - disableBackdropBlur: remove backdrop-blur for GPU perf
 */
import { useMemo } from 'react';
import { useGameSettings } from '../contexts/GameSettingsContext';

export interface PerformanceMode {
  /** Whether the device is in low-spec / performance mode */
  enabled: boolean;

  /** Skip Framer Motion animates — use empty objects for motion props */
  reducedMotion: boolean;

  /** Use lighter assets, avoid heavy prefetching */
  lowData: boolean;

  /** Prefer low-resolution / fallback image sources */
  imageQuality: 'full' | 'low';

  /** Maximum visible items in long lists */
  listSize: number;

  /** Minimum ms between render frames in game loops (0 = no throttle) */
  frameInterval: number;

  /** Hide particle effects, card shines */
  disableParticles: boolean;

  /** Skip whileHover / hover-scale effects */
  disableHover: boolean;

  /** Use solid colors instead of gradients */
  disableGradients: boolean;

  /** Remove backdrop-blur effects */
  disableBackdropBlur: boolean;

  /** Remove animate-pulse CSS class */
  disablePulse: boolean;

  /** Remove animate-spin CSS class */
  disableSpin: boolean;
}

/** Sensible defaults for full-performance mode */
const DEFAULT_PERFORMANCE: PerformanceMode = {
  enabled: false,
  reducedMotion: false,
  lowData: false,
  imageQuality: 'full',
  listSize: Number.POSITIVE_INFINITY,
  frameInterval: 0,
  disableParticles: false,
  disableHover: false,
  disableGradients: false,
  disableBackdropBlur: false,
  disablePulse: false,
  disableSpin: false,
};

/** Low-spec overrides */
const LOW_SPEC_PERFORMANCE: PerformanceMode = {
  enabled: true,
  reducedMotion: true,
  lowData: true,
  imageQuality: 'low',
  listSize: 10,
  frameInterval: 50, // ~20fps max
  disableParticles: true,
  disableHover: true,
  disableGradients: true,
  disableBackdropBlur: true,
  disablePulse: true,
  disableSpin: true,
};

/**
 * Returns performance-mode policies based on the user's lowSpecMode setting.
 * Components that only need a boolean can use `perf.enabled`.
 * Components that need fine-grained control can use individual flags.
 */
export function usePerformanceMode(): PerformanceMode {
  const { lowSpecMode } = useGameSettings();

  const perf = useMemo<PerformanceMode>(
    () => (lowSpecMode ? LOW_SPEC_PERFORMANCE : DEFAULT_PERFORMANCE),
    [lowSpecMode],
  );

  return perf;
}

/**
 * Utility: return motion props suitable for reduced-motion mode.
 * Usage:
 *   <motion.div {...motionProps(lowSpecMode, { initial: { opacity: 0 }, animate: { opacity: 1 } })}>
 *
 * When lowSpecMode is true, returns `{}` (no animation).
 * When false, returns the provided props.
 */
export function motionProps(
  reducedMotion: boolean,
  props: Record<string, unknown>,
): Record<string, unknown> {
  if (reducedMotion) return {};
  return props;
}

/**
 * Utility: return CSS animation class name or empty string.
 * Usage:
 *   <div className={animationClass(perf.disablePulse, 'animate-pulse')} />
 */
export function animationClass(disabled: boolean, className: string): string {
  return disabled ? '' : className;
}
