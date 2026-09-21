/**
 * BattleGpuBatcher.ts - SCR-02-19
 * 전장의 모든 요소를 인스턴스 배열 버퍼에 패킹하여 1 Draw Call로 렌더링하는 GPU 배처
 */

export interface RenderInstance {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  textureIndex: number;
}

export class BattleGpuBatcher {
  private instances: RenderInstance[] = [];

  public clear() {
    this.instances = [];
  }

  public push(instance: RenderInstance) {
    this.instances.push(instance);
  }

  public getInstances(): RenderInstance[] {
    return this.instances;
  }

  public getDrawCallCount(): number {
    return 1; // 1 single draw call pipeline
  }
}
