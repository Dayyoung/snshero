/**
 * VirtualTextureManager.ts - SCR-05-22
 * 마켓플레이스 가상 그리드 뷰포트 타일 캐시 및 비가시 영역 메모리 해제 매니저
 */

export class VirtualTextureManager {
  private activeTiles: Set<string> = new Set();
  private tileCache: Map<string, unknown> = new Map();

  public registerTile(id: string, tileData: unknown): void {
    this.activeTiles.add(id);
    this.tileCache.set(id, tileData);
  }

  public evictInvisibleTiles(visibleIds: Set<string>): void {
    for (const id of this.activeTiles) {
      if (!visibleIds.has(id)) {
        this.tileCache.delete(id);
        this.activeTiles.delete(id);
      }
    }
    for (const id of visibleIds) {
      this.activeTiles.add(id);
    }
  }

  public getTile(id: string): unknown | undefined {
    return this.tileCache.get(id);
  }

  public clear(): void {
    this.activeTiles.clear();
    this.tileCache.clear();
  }
}

export default VirtualTextureManager;
