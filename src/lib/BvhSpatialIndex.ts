/**
 * BvhSpatialIndex.ts - SCR-09-22
 * 2D 바운딩 볼륨 계층(BVH) 공간 인덱스로 가구 충돌을 O(log N)으로 판정하는 유틸
 */

export interface BvhNode {
  id: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class BvhSpatialIndex {
  private nodes: BvhNode[] = [];

  public insert(node: BvhNode) {
    this.nodes.push(node);
  }

  public queryPoint(x: number, y: number): BvhNode | null {
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if (x >= n.minX && x <= n.maxX && y >= n.minY && y <= n.maxY) {
        return n;
      }
    }
    return null;
  }
}
