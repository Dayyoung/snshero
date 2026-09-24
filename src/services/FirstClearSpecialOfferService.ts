/**
 * FirstClearSpecialOfferService.ts - SCR-08-30
 * 최초 클리어 명예의 전당 60분 한정 특가 오퍼 관리 서비스
 */

export interface FirstClearOffer {
  id: string;
  title: string;
  stageName: string;
  priceSns: number;
  originalPriceSns: number;
  discountRate: number;
  expiresAt: number;
  isPurchased: boolean;
  rewards: {
    type: string;
    name: string;
    amount: number;
    icon?: string;
  }[];
}

export class FirstClearSpecialOfferService {
  private static instance: FirstClearSpecialOfferService | null = null;
  private currentOffer: FirstClearOffer | null = null;

  public static getInstance(): FirstClearSpecialOfferService {
    if (!this.instance) {
      this.instance = new FirstClearSpecialOfferService();
    }
    return this.instance;
  }

  public getOrCreateOffer(stageId: string = 'stage-1', stageName: string = '황혼의 고대 유적'): FirstClearOffer {
    if (this.currentOffer && this.currentOffer.expiresAt > Date.now()) {
      return this.currentOffer;
    }

    this.currentOffer = {
      id: `first-clear-${stageId}`,
      title: '첫 클리어 정복자 한정 특가 번들',
      stageName,
      priceSns: 120,
      originalPriceSns: 400,
      discountRate: 70,
      expiresAt: Date.now() + 60 * 60 * 1000, // 60 minutes
      isPurchased: false,
      rewards: [
        { type: 'card', name: 'SSR 확정 소환권', amount: 1, icon: '🎴' },
        { type: 'sns', name: 'SNS 500P', amount: 500, icon: '💎' },
        { type: 'stamina', name: '행동력 포션', amount: 5, icon: '⚡' },
      ],
    };

    return this.currentOffer;
  }

  public purchaseOffer(onSuccess?: () => void): boolean {
    if (!this.currentOffer) return false;
    this.currentOffer.isPurchased = true;
    if (onSuccess) {
      onSuccess();
    }
    return true;
  }
}

export const firstClearSpecialOfferService = FirstClearSpecialOfferService.getInstance();
export default firstClearSpecialOfferService;
