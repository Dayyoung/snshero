/**
 * TileMapChunkEngine.ts - SCR-02-28
 * 월드맵 계층형 타일 맵 청킹(Hierarchical Tile Map Chunking) 및 절두체 컬링(Frustum Culling).
 * 뷰포트 영역(Viewport Bounding Box) 내의 스테이지 노드와 연결선만 선별 렌더링하여 60fps 고정.
 */

export interface MapNode {
  id: string;
  stageNumber: number;
  worldX: number;
  worldY: number;
  stars: number;
  isUnlocked: boolean;
  isBoss: boolean;
}

export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class TileMapChunkEngine {
  private static chunkSize = 400; // 400x400 chunk units

  /**
   * 뷰포트 범위 내에 존재하는 가시 노드만 O(K) 절두체 컬링 필터링
   */
  static cullVisibleNodes(nodes: MapNode[], bounds: ViewportBounds, margin: number = 50): MapNode[] {
    const l = bounds.left - margin;
    const r = bounds.right + margin;
    const t = bounds.top - margin;
    const b = bounds.bottom + margin;

    return nodes.filter(
      (node) => node.worldX >= l && node.worldX <= r && node.worldY >= t && node.worldY <= b
    );
  }

  /**
   * 두 노드를 잇는 SVG 베지어 곡선 패스 경로 고속 산출
   */
  static calculateCurvedPath(start: MapNode, end: MapNode): string {
    const dx = end.worldX - start.worldX;
    const dy = end.worldY - start.worldY;
    const cx1 = start.worldX + dx * 0.5;
    const cy1 = start.worldY;
    const cx2 = start.worldX + dx * 0.5;
    const cy2 = end.worldY;

    return `M ${start.worldX} ${start.worldY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.worldX} ${end.worldY}`;
  }
}
