import { triggerRainbowFlip } from '../components/RainbowFlipEffect';

export interface RainbowFlipFXOptions {
  targetEl?: HTMLElement | null;
  count?: number;
  origin?: { x: number; y: number };
  origins?: { x: number; y: number }[];
  customText?: string;
}

/**
 * Triggers the rainbow particle flip effect.
 * Can be called with an options object:
 * triggerRainbowFlipFX({ targetEl: el, count: 1 })
 * or triggerRainbowFlipFX({ count: 5 })
 * or triggerRainbowFlipFX(1)
 */
export function triggerRainbowFlipFX(options: RainbowFlipFXOptions | number = 1): void {
  if (typeof window === 'undefined') return;

  let count = 1;
  let origins: { x: number; y: number }[] | undefined;
  let customText: string | undefined;

  if (typeof options === 'number') {
    count = Math.max(1, options);
  } else if (options && typeof options === 'object') {
    count = Math.max(1, options.count ?? 1);
    customText = options.customText;

    if (options.origins && options.origins.length > 0) {
      origins = options.origins;
    } else if (options.origin) {
      origins = [options.origin];
    } else if (options.targetEl) {
      try {
        const rect = options.targetEl.getBoundingClientRect();
        origins = [
          {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          },
        ];
      } catch {
        // Fallback gracefully
      }
    }
  }

  triggerRainbowFlip(count, origins, customText);
}

export default triggerRainbowFlipFX;
