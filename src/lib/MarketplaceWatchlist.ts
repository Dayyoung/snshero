/**
 * Row 1054 / ID 317: Marketplace Watchlist & Price Notification Engine
 * Manages player's unowned card target price watchlist and triggers alert badges.
 */

export interface WatchlistItem {
  cardId: number;
  targetPrice: number;
  createdAt: number;
  lastNotifiedPrice?: number;
}

const getStorageKey = (season: string = 'season1') => `hero_marketplace_watchlist_${season}`;

export class MarketplaceWatchlist {
  public static getWatchlist(season: string = 'season1'): WatchlistItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(getStorageKey(season));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addWatchlistItem(cardId: number, targetPrice: number, season: string = 'season1'): void {
    const list = this.getWatchlist(season);
    const existingIdx = list.findIndex((item) => item.cardId === cardId);
    if (existingIdx >= 0) {
      list[existingIdx].targetPrice = targetPrice;
    } else {
      list.push({ cardId, targetPrice, createdAt: Date.now() });
    }
    try {
      localStorage.setItem(getStorageKey(season), JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('snshero:watchlist-updated'));
    } catch (e) {
      console.warn('Failed to save watchlist:', e);
    }
  }

  public static removeWatchlistItem(cardId: number, season: string = 'season1'): void {
    const list = this.getWatchlist(season).filter((item) => item.cardId !== cardId);
    try {
      localStorage.setItem(getStorageKey(season), JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('snshero:watchlist-updated'));
    } catch (e) {
      console.warn('Failed to remove watchlist item:', e);
    }
  }

  public static checkAlerts(currentListings: Array<{ cardId: number; price: number }>, season: string = 'season1'): WatchlistItem[] {
    const watchlist = this.getWatchlist(season);
    const triggered: WatchlistItem[] = [];

    watchlist.forEach((watch) => {
      const match = currentListings.find((listing) => listing.cardId === watch.cardId && listing.price <= watch.targetPrice);
      if (match) {
        triggered.push(watch);
      }
    });

    return triggered;
  }
}
