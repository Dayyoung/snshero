/**
 * VirtualTextureManager.ts - SCR-05-22
 * 가시 영역 타일만 동적 페이징하고 비가시 타일을 16.6ms 내 회수하는 가상 텍스처링 매니저
 */

export interface VirtualTile {
  id: string;
  url: string;
  loaded: boolean;
  texture?: unknown;
}

export class VirtualTextureManager {
  private activeTiles: Map<string, VirtualTile> = new Map();
  private maxCachedTiles = 24;

  public requestTile(id: string, url: string): VirtualTile {
    let tile = this.activeTiles.get(id);
    if (!tile) {
      tile = { id, url, loaded: true };
      this.activeTiles.set(id, tile);

      // Cull oldest if exceeding cache
      if (this.activeTiles.size > this.maxCachedTiles) {
        const firstKey = this.activeTiles.keys().next().value;
        if (firstKey) this.activeTiles.delete(firstKey);
      }
    }
    return tile;
  }

  public evictInvisibleTiles(visibleIds: Set<string>) {
    for (const [id] of this.activeTiles) {
      if (!visibleIds.has(id)) {
        this.activeTiles.delete(id);
      }
    }
  }
}
