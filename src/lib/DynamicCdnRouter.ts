/**
 * DynamicCdnRouter.ts - SCR-12-13
 * 네트워크 상태 진단 및 레이턴시 최소 노드로 0.1초 만에 자동 스왑하는 스마트 라우팅 엔진
 */

export interface CdnRouteStatus {
  activeNodeId: string;
  activeNodeName: string;
  pingMs: number;
  isAutoSwapEnabled: boolean;
}

export class DynamicCdnRouter {
  private activeNodeId = 'kr_seoul_primary';
  private activeNodeName = 'KR 서울 메인 노드';
  private currentPing = 12;
  private autoSwap = true;

  public getStatus(): CdnRouteStatus {
    return {
      activeNodeId: this.activeNodeId,
      activeNodeName: this.activeNodeName,
      pingMs: this.currentPing,
      isAutoSwapEnabled: this.autoSwap,
    };
  }

  public setAutoSwap(enabled: boolean) {
    this.autoSwap = enabled;
  }

  public selectFastestNode(nodes: Array<{ id: string; name: string; pingMs: number }>): CdnRouteStatus {
    if (!this.autoSwap || nodes.length === 0) return this.getStatus();

    const fastest = [...nodes].sort((a, b) => a.pingMs - b.pingMs)[0];
    if (fastest.id !== this.activeNodeId) {
      this.activeNodeId = fastest.id;
      this.activeNodeName = fastest.name;
      this.currentPing = fastest.pingMs;
    }
    return this.getStatus();
  }

  public manuallySetNode(nodeId: string, nodeName: string, pingMs: number) {
    this.activeNodeId = nodeId;
    this.activeNodeName = nodeName;
    this.currentPing = pingMs;
  }
}
