/**
 * src/landing/services/autoGrowthLoopManager.ts
 *
 * Dedicated Autonomous Growth & Retry Loop Engine for SNSHero.
 *
 * When Auto-Play is active and battle victory is NOT achieved (Defeat or Draw):
 *   Step 1. Notify defeat and navigate to #shop
 *   Step 2. Consume SNS coins to draw a 5-card pack (with auto-fund guarantee)
 *   Step 3. Visually flip & inspect all 5 cards
 *   Step 4. Navigate to #deck and auto-optimize the 5-card squad (strongest TP/rarity)
 *   Step 5. Return to #play and retry the battle immediately!
 *   Step 6. Repeat this autonomous loop until the user stops Auto-Play.
 */

import { cardNurtureStore } from './cardNurtureStore';
import {
  getUserCoins,
  creditUserCoins,
  executeShopPurchase,
  flipAllPackCards,
  clearPackReveal,
} from '../views/ShopSection';
import { playRpgState, initBattle } from './playRpgEngine';
import { tr } from './i18n';

export type AutoGrowthLoopPhase =
  | 'idle'
  | 'defeat_notified'
  | 'shopping'
  | 'revealing'
  | 'optimizing'
  | 'retrying';

interface AutoGrowthLoopState {
  phase: AutoGrowthLoopPhase;
  message: string | null;
  activeTimer: ReturnType<typeof setTimeout> | null;
  loopCount: number;
}

const loopState: AutoGrowthLoopState = {
  phase: 'idle',
  message: null,
  activeTimer: null,
  loopCount: 0,
};

function clearCurrentTimer(): void {
  if (loopState.activeTimer) {
    clearTimeout(loopState.activeTimer);
    loopState.activeTimer = null;
  }
}

function notifyStateChanged(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('snshero_auto_growth_loop_updated'));
      window.dispatchEvent(new CustomEvent('snshero_card_nurture_updated'));
    } catch {}
  }
}

/**
 * Trigger navigation to any view safely via custom event or direct hash
 */
function navigateSafely(targetView: 'shop' | 'deck' | 'play'): void {
  if (typeof window === 'undefined') return;
  try {
    window.location.hash = `#${targetView}`;
    window.dispatchEvent(
      new CustomEvent('snshero_request_navigate', {
        detail: { view: targetView },
      })
    );
  } catch {}
}

/**
 * Returns current phase and message for UI rendering
 */
export function getAutoGrowthLoopState(): {
  phase: AutoGrowthLoopPhase;
  message: string | null;
  loopCount: number;
  isActive: boolean;
} {
  return {
    phase: loopState.phase,
    message: loopState.message,
    loopCount: loopState.loopCount,
    isActive: loopState.phase !== 'idle',
  };
}

/**
 * Cancels any active auto growth loop immediately (called when user toggles AUTO PLAY off)
 */
export function cancelAutoGrowthLoop(): void {
  clearCurrentTimer();
  clearPackReveal();
  loopState.phase = 'idle';
  loopState.message = null;
  notifyStateChanged();
}

/**
 * Initiates the Auto-Growth & Retry Loop upon battle defeat/draw
 */
export function startAutoGrowthAndRetryLoop(): void {
  if (!playRpgState.autoMode) return;
  clearCurrentTimer();

  loopState.loopCount += 1;
  loopState.phase = 'defeat_notified';
  loopState.message = tr(
    `🤖 [자동 성장 루프 #${loopState.loopCount}] 승리하지 못했습니다! 2초 후 상점으로 이동하여 카드를 소환합니다...`,
    `🤖 [Auto-Growth Loop #${loopState.loopCount}] Victory not achieved! Moving to Shop in 2s to summon cards...`,
    `🤖 [自動成長ループ #${loopState.loopCount}] 勝利できませんでした！2秒後にショップへ移動してカードを召喚します...`
  );
  notifyStateChanged();

  // Step 1: Wait 2s, then navigate to #shop
  loopState.activeTimer = setTimeout(() => {
    if (!playRpgState.autoMode) {
      cancelAutoGrowthLoop();
      return;
    }

    loopState.phase = 'shopping';
    loopState.message = tr(
      '🛒 [자동 성장 루프] 상점 도착! SNS 코인을 소비하여 신규 카드팩(5장)을 소환 중...',
      '🛒 [Auto-Growth Loop] Arrived at Shop! Consuming SNS coins to summon a 5-card pack...',
      '🛒 [自動成長ループ] ショップ到着！SNSコインを消費して新カードパック(5枚)を召喚中...'
    );
    navigateSafely('shop');
    notifyStateChanged();

    // Step 2: In shop, ensure coins and execute 5-card pack draw
    loopState.activeTimer = setTimeout(() => {
      if (!playRpgState.autoMode) {
        cancelAutoGrowthLoop();
        return;
      }

      // Guarantee minimum 500 SNS coins so the loop never stalls
      const coins = getUserCoins();
      if (coins < 500) {
        creditUserCoins(1000, 'earned');
      }

      // Execute 5-card draw
      executeShopPurchase('pack_normal');

      loopState.phase = 'revealing';
      loopState.message = tr(
        '✨ [자동 성장 루프] 5장의 소환된 카드를 확인했습니다! 3초 후 마이덱으로 이동하여 최적의 덱을 편성합니다...',
        '✨ [Auto-Growth Loop] Inspected 5 summoned cards! Moving to My Deck in 3s to optimize squad...',
        '✨ [自動成長ループ] 召喚された5枚のカードを確認しました！3秒後にマイデッキへ移動して最適デッキを編成します...'
      );

      // Instantly reveal all 5 cards facedown -> faceup
      setTimeout(() => {
        flipAllPackCards();
        notifyStateChanged();
      }, 500);

      notifyStateChanged();

      // Step 3: Wait 3s so user inspects the 5 cards, then go to #deck
      loopState.activeTimer = setTimeout(() => {
        if (!playRpgState.autoMode) {
          cancelAutoGrowthLoop();
          return;
        }

        clearPackReveal();
        loopState.phase = 'optimizing';
        navigateSafely('deck');

        // Step 4: In My Deck, auto-optimize squad
        loopState.activeTimer = setTimeout(() => {
          if (!playRpgState.autoMode) {
            cancelAutoGrowthLoop();
            return;
          }

          const opt = cardNurtureStore.autoOptimizeDeck();
          loopState.message = tr(
            `⚡ [자동 성장 루프] 최강 5인 덱 자동 편성 완료! (전투력: ${opt.previousTP} ➔ ${opt.newTP}) 2.5초 후 전장으로 복귀하여 재도전합니다!`,
            `⚡ [Auto-Growth Loop] Squad auto-optimized! (Power: ${opt.previousTP} ➔ ${opt.newTP}) Returning to battle in 2.5s!`,
            `⚡ [自動成長ループ] 最強5人デッキ自動編成完了！（戦闘力: ${opt.previousTP} ➔ ${opt.newTP}）2.5秒後に戦場へ復帰して再挑戦します！`
          );
          notifyStateChanged();

          // Step 5: Return to #play and retry the battle
          loopState.activeTimer = setTimeout(() => {
            if (!playRpgState.autoMode) {
              cancelAutoGrowthLoop();
              return;
            }

            loopState.phase = 'retrying';
            loopState.message = tr(
              '⚔️ [자동 성장 루프] 전장 복귀! 강화된 덱으로 즉시 재도전합니다!',
              '⚔️ [Auto-Growth Loop] Returned to battlefield! Retrying battle with enhanced squad!',
              '⚔️ [自動成長ループ] 戦場復帰！強化されたデッキで直ちに再挑戦します！'
            );
            navigateSafely('play');
            notifyStateChanged();

            // Initiate battle retry on #play
            loopState.activeTimer = setTimeout(() => {
              if (!playRpgState.autoMode) {
                cancelAutoGrowthLoop();
                return;
              }

              loopState.phase = 'idle';
              loopState.message = null;
              initBattle();
              notifyStateChanged();
            }, 1200);
          }, 2500);
        }, 800);
      }, 3000);
    }, 1000);
  }, 2000);
}

/**
 * Top floating notification banner for active loop feedback across all views
 */
export function renderAutoGrowthBannerHtml(): string {
  if (loopState.phase === 'idle' || !loopState.message) return '';

  return `
    <div
      id="auto-growth-loop-banner"
      class="w-full bg-[#201d1d] text-amber-300 border-b-2 border-amber-400 px-4 py-2 text-xs font-mono font-bold flex items-center justify-between select-none shadow-md sticky top-0 z-[60]"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-center gap-2 max-w-4xl mx-auto w-full">
        <span class="inline-block w-2.5 h-2.5 bg-amber-400 rounded-none animate-ping"></span>
        <span class="truncate">${loopState.message}</span>
      </div>
      <div class="shrink-0 flex items-center gap-2">
        <span class="px-1.5 py-0.5 bg-amber-400 text-stone-950 text-[10px] font-black rounded-none uppercase">
          AUTO LOOP
        </span>
      </div>
    </div>
  `;
}

// Register browser event listeners for auto-growth loop integration
if (typeof window !== 'undefined') {
  window.addEventListener('snshero_battle_defeat_auto_loop', () => {
    startAutoGrowthAndRetryLoop();
  });

  window.addEventListener('snshero_auto_mode_toggled', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail?.autoMode) {
      cancelAutoGrowthLoop();
    }
  });
}

