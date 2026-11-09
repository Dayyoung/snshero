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
  closeItemPurchaseModal,
} from '../views/ShopSection';
import { setDeckOptimizeNotice } from '../views/MyDeckSection';
import { playRpgState, initBattle } from './playRpgEngine';
import { tr } from './i18n';

export type AutoGrowthLoopPhase =
  | 'idle'
  | 'defeat_notified'
  | 'shopping'
  | 'revealing'
  | 'optimizing'
  | 'retrying';

export type AutoGrowthTriggerReason = 'defeat_retry' | 'periodic_upgrade';

interface PackRotationMeta {
  id: 'pack_normal' | 'pack_magic' | 'pack_rare' | 'pack_starter_bundle';
  nameKo: string;
  nameEn: string;
  nameJa: string;
  cost: number;
}

const AUTO_PACK_ROTATION: PackRotationMeta[] = [
  {
    id: 'pack_normal',
    nameKo: '일반 카드팩',
    nameEn: 'Normal Card Pack',
    nameJa: '一般カードパック',
    cost: 300,
  },
  {
    id: 'pack_magic',
    nameKo: '매직 카드팩 (실버~골드)',
    nameEn: 'Magic Card Pack (Silver~Gold)',
    nameJa: 'マジックカードパック',
    cost: 800,
  },
  {
    id: 'pack_rare',
    nameKo: '희귀 카드팩 (골드~전설)',
    nameEn: 'Rare Card Pack (Gold~SSR)',
    nameJa: 'レアカードパック',
    cost: 1500,
  },
  {
    id: 'pack_starter_bundle',
    nameKo: '스타터 전설팩 (SSR 5종)',
    nameEn: 'Starter Legend Pack (5 SSR)',
    nameJa: 'スターター伝説パック (SSR 5種)',
    cost: 2000,
  },
];

const PACK_ROTATION_STORAGE_KEY = 'hero_auto_pack_rotation_idx';

function getNextRotatingPack(): { pack: PackRotationMeta; index: number } {
  let idx = 0;
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = parseInt(localStorage.getItem(PACK_ROTATION_STORAGE_KEY) || '0', 10);
      if (Number.isFinite(saved) && saved >= 0) {
        idx = saved % AUTO_PACK_ROTATION.length;
      }
      localStorage.setItem(PACK_ROTATION_STORAGE_KEY, String((idx + 1) % AUTO_PACK_ROTATION.length));
    } catch {}
  }
  return {
    pack: AUTO_PACK_ROTATION[idx] || AUTO_PACK_ROTATION[0],
    index: idx,
  };
}

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
 * Initiates the Auto-Growth & Retry Loop (upon battle defeat/draw OR periodic chapter upgrade)
 */
export function startAutoGrowthAndRetryLoop(reason: AutoGrowthTriggerReason = 'defeat_retry'): void {
  if (!playRpgState.autoMode) return;
  if (loopState.phase !== 'idle') return;
  clearCurrentTimer();

  loopState.loopCount += 1;
  const { pack: targetPack } = getNextRotatingPack();
  // Buy EXP Elixir Pack every cycle (or whenever elixirs < 10) so My Deck cards always get upgraded
  const shouldBuyElixirPack = true;

  loopState.phase = 'defeat_notified';
  loopState.message =
    reason === 'periodic_upgrade'
      ? tr(
          `🤖 [정기 자동 성장 #${loopState.loopCount}] 상점으로 이동하여 [${targetPack.nameKo}] 소환 및 [EXP 영약팩] 구매 후 마이덱 카드를 업그레이드합니다...`,
          `🤖 [Auto Upgrade #${loopState.loopCount}] Moving to Shop to summon [${targetPack.nameEn}] & buy [EXP Elixir Pack] to upgrade My Deck...`,
          `🤖 [定期自動成長 #${loopState.loopCount}] ショップへ移動し[${targetPack.nameJa}]召喚＆[EXP霊薬パック]購入後マイデッキを強化します...`
        )
      : tr(
          `🤖 [자동 성장 루프 #${loopState.loopCount}] 상점으로 이동하여 [${targetPack.nameKo}] 소환 및 [EXP 영약팩]을 구매합니다...`,
          `🤖 [Auto-Growth Loop #${loopState.loopCount}] Moving to Shop to summon [${targetPack.nameEn}] & buy [EXP Elixir Pack]...`,
          `🤖 [自動成長ループ #${loopState.loopCount}] ショップへ移動し[${targetPack.nameJa}]召喚＆[EXP霊薬パック]を購入します...`
        );
  notifyStateChanged();

  // Step 1: Wait 1.8s, then navigate to #shop
  loopState.activeTimer = setTimeout(() => {
    if (!playRpgState.autoMode) {
      cancelAutoGrowthLoop();
      return;
    }

    loopState.phase = 'shopping';
    loopState.message = tr(
      `🛒 [상점 소환 & 영약 구매] '${targetPack.nameKo}'(5장) 골고루 소환 및 'EXP 영약팩(10병)' 구매 진행 중...`,
      `🛒 [Shop Summon & Elixir] Summoning '${targetPack.nameEn}' (5 cards) & purchasing 'EXP Elixir Pack (10 bottles)'...`,
      `🛒 [ショップ召喚＆霊薬購入] '${targetPack.nameJa}'(5枚)召喚＆'EXP霊薬パック(10本)'を購入中...`
    );
    navigateSafely('shop');
    notifyStateChanged();

    // Step 2: In shop, ensure coins, purchase EXP Elixir Pack + rotating Card Pack
    loopState.activeTimer = setTimeout(() => {
      if (!playRpgState.autoMode) {
        cancelAutoGrowthLoop();
        return;
      }

      // Guarantee sufficient SNS coins for both the rotating pack (up to 2,000 SNS) and EXP Elixir Pack (500 SNS)
      const neededCoins = targetPack.cost + (shouldBuyElixirPack ? 500 : 0) + 300;
      const coins = getUserCoins();
      if (coins < neededCoins) {
        creditUserCoins(neededCoins - coins + 500, 'earned');
      }

      // 2-A. Purchase EXP Elixir Pack (+10 bottles) so we can upgrade cards in My Deck
      if (shouldBuyElixirPack) {
        executeShopPurchase('item_exp_pack');
        closeItemPurchaseModal();
      }

      // 2-B. Execute 5-card draw from the rotating pack (Normal -> Magic -> Rare -> Starter Legend)
      executeShopPurchase(targetPack.id);

      loopState.phase = 'revealing';
      loopState.message = tr(
        `✨ [카드팩 & 영약팩 획득] '${targetPack.nameKo}' 5장 소환 + EXP 영약 10병 확보! 잠시 후 마이덱으로 이동해 카드를 업그레이드합니다...`,
        `✨ [Pack & Elixirs Acquired] '${targetPack.nameEn}' 5 cards + 10 EXP Elixirs! Moving to My Deck to upgrade cards...`,
        `✨ [パック＆霊薬獲得] '${targetPack.nameJa}' 5枚召喚＋EXP霊薬10本確保！マイデッキへ移動してカードを強化します...`
      );

      // Instantly reveal all 5 cards facedown -> faceup
      setTimeout(() => {
        flipAllPackCards();
        notifyStateChanged();
      }, 450);

      notifyStateChanged();

      // Step 3: Wait 2.6s so user inspects the 5 cards, then go to #deck
      loopState.activeTimer = setTimeout(() => {
        if (!playRpgState.autoMode) {
          cancelAutoGrowthLoop();
          return;
        }

        clearPackReveal();
        loopState.phase = 'optimizing';
        navigateSafely('deck');

        // Step 4: In My Deck, immediately consume ALL owned EXP Elixirs, upgrade card levels & 4-way stats, and auto-optimize squad
        loopState.activeTimer = setTimeout(() => {
          if (!playRpgState.autoMode) {
            cancelAutoGrowthLoop();
            return;
          }

          if (cardNurtureStore.getExpElixirCount() <= 0) {
            cardNurtureStore.addExpElixirs(10);
          }
          const upg = cardNurtureStore.upgradeDeckWithElixirsAndStats();
          const deckNotice = tr(
            `🧪⚡ [자동 카드 업그레이드 & 최강 덱 편성] '${targetPack.nameKo}' 반영 + 구매한 EXP 영약 ${upg.elixirsUsed}병 전량 사용 완료 (남은 영약: ${upg.remainingElixirs}병 · 레벨업 +${upg.levelsGained}Lv · 스탯 +${upg.pointsSpent}P 강화) · 덱 전투력 ${upg.previousTP} TP ➔ ${upg.newTP} TP!`,
            `🧪⚡ [Auto Card Upgrade & Squad Optimization] '${targetPack.nameEn}' applied + all ${upg.elixirsUsed} EXP Elixirs used (Remaining: ${upg.remainingElixirs} · +${upg.levelsGained}Lv · +${upg.pointsSpent} Stat Pts) · Deck Power ${upg.previousTP} TP ➔ ${upg.newTP} TP!`,
            `🧪⚡ [自動カード強化＆最強デッキ編成] '${targetPack.nameJa}'反映＋購入したEXP霊薬${upg.elixirsUsed}本を全量使用完了（残り${upg.remainingElixirs}本・+${upg.levelsGained}Lv・ステータス+${upg.pointsSpent}P強化）・デッキ戦闘力 ${upg.previousTP} TP ➔ ${upg.newTP} TP！`
          );
          setDeckOptimizeNotice(deckNotice);
          loopState.message = deckNotice;
          notifyStateChanged();

          // Step 5: Return to #play and retry/continue the adventure
          loopState.activeTimer = setTimeout(() => {
            if (!playRpgState.autoMode) {
              cancelAutoGrowthLoop();
              return;
            }

            loopState.phase = 'retrying';
            loopState.message = tr(
              `⚔️ [자동 성장 완료] 업그레이드된 마이덱(${upg.newTP} TP)으로 모험/전투에 즉시 복귀합니다!`,
              `⚔️ [Auto Upgrade Complete] Returning to adventure/battle with upgraded My Deck (${upg.newTP} TP)!`,
              `⚔️ [自動成長完了] 強化されたマイデッキ(${upg.newTP} TP)で冒険・戦闘に即時復帰します！`
            );
            navigateSafely('play');
            notifyStateChanged();

            // Resume or retry on #play
            loopState.activeTimer = setTimeout(() => {
              if (!playRpgState.autoMode) {
                cancelAutoGrowthLoop();
                return;
              }

              loopState.phase = 'idle';
              loopState.message = null;
              if (reason === 'defeat_retry' || playRpgState.subState === 'battle') {
                initBattle();
              } else if (playRpgState.subState === 'map') {
                playRpgState.lastAutoStepAt = 0;
              }
              notifyStateChanged();
            }, 800);
          }, 2200);
        }, 400);
      }, 2600);
    }, 900);
  }, 1800);
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
    startAutoGrowthAndRetryLoop('defeat_retry');
  });

  window.addEventListener('snshero_periodic_auto_growth_loop', () => {
    startAutoGrowthAndRetryLoop('periodic_upgrade');
  });

  window.addEventListener('snshero_auto_mode_toggled', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail?.autoMode) {
      cancelAutoGrowthLoop();
    }
  });
}

