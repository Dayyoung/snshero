/**
 * FirstClearSpecialOfferService.ts - SCR-08-30
 * First-Clear Hall of Fame tracking and 60-minute limited-time "First Blood Conquest Bundle"
 * monetization offer service.
 */

export interface FirstClearOffer {
  stageId: string;
  stageName: string;
  expiresAt: number; // timestamp
  priceWon: number;
  snsPrice: number;
  isPurchased: boolean;
  rewards: {
    diamonds: number;
    snsCoin: number;
    ssrEquipmentTicket: number;
    title: string;
  };
}

class FirstClearSpecialOfferService {
  private clearedStagesKey = 'hero_first_clear_stages_v1';
  private activeOfferKey = 'hero_first_clear_timed_deal_v1';

  isFirstClear(stageId: string): boolean {
    try {
      const cleared: string[] = JSON.parse(localStorage.getItem(this.clearedStagesKey) || '[]');
      return !cleared.includes(stageId);
    } catch {
      return false;
    }
  }

  recordStageClear(stageId: string, stageName: string): { isFirst: boolean; offer: FirstClearOffer | null } {
    try {
      const cleared: string[] = JSON.parse(localStorage.getItem(this.clearedStagesKey) || '[]');
      const isFirst = !cleared.includes(stageId);

      if (isFirst) {
        cleared.push(stageId);
        localStorage.setItem(this.clearedStagesKey, JSON.stringify(cleared));

        // Create 60-minute limited deal (3,300 KRW or 330 SNS coin)
        const offer: FirstClearOffer = {
          stageId,
          stageName,
          expiresAt: Date.now() + 60 * 60 * 1000,
          priceWon: 3300,
          snsPrice: 330,
          isPurchased: false,
          rewards: {
            diamonds: 100,
            snsCoin: 1500,
            ssrEquipmentTicket: 1,
            title: `[최초 정복자] ${stageName}`
          }
        };

        localStorage.setItem(this.activeOfferKey, JSON.stringify(offer));
        return { isFirst: true, offer };
      }

      return { isFirst: false, offer: this.getActiveOffer() };
    } catch {
      return { isFirst: false, offer: null };
    }
  }

  getActiveOffer(): FirstClearOffer | null {
    try {
      const raw = localStorage.getItem(this.activeOfferKey);
      if (!raw) return null;
      const offer: FirstClearOffer = JSON.parse(raw);
      if (Date.now() > offer.expiresAt || offer.isPurchased) {
        return null;
      }
      return offer;
    } catch {
      return null;
    }
  }

  purchaseOffer(onSuccess?: (offer: FirstClearOffer) => void): boolean {
    const offer = this.getActiveOffer();
    if (!offer) return false;

    offer.isPurchased = true;
    localStorage.setItem(this.activeOfferKey, JSON.stringify(offer));

    // Grant title to user
    try {
      const titles: string[] = JSON.parse(localStorage.getItem('hero_tower_titles_v1') || '[]');
      if (!titles.includes(offer.rewards.title)) {
        titles.push(offer.rewards.title);
        localStorage.setItem('hero_tower_titles_v1', JSON.stringify(titles));
      }
    } catch {}

    onSuccess?.(offer);
    return true;
  }
}

export const firstClearSpecialOfferService = new FirstClearSpecialOfferService();
