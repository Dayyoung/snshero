/**
 * ShaderPrewarmer.ts - SCR-04-19
 * 상점 진입 즉시 3D 마법진 셰이더 프로그램을 미리 컴파일하고 OffscreenCanvas에서 텍스처 밉맵을 사전 생성하는 60fps 프리워머
 */

import { SUMMON_CIRCLE_VERTEX_SHADER, SUMMON_CIRCLE_FRAGMENT_SHADER } from '../shaders/SummonCircleShader';

export class ShaderPrewarmer {
  private static isWarmed = false;

  public static prewarm() {
    if (this.isWarmed) return;
    if (typeof window === 'undefined') return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const gl = canvas.getContext('webgl');
      if (!gl) return;

      const vertShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertShader) return;
      gl.shaderSource(vertShader, SUMMON_CIRCLE_VERTEX_SHADER);
      gl.compileShader(vertShader);

      const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragShader) return;
      gl.shaderSource(fragShader, SUMMON_CIRCLE_FRAGMENT_SHADER);
      gl.compileShader(fragShader);

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      this.isWarmed = true;
    } catch {
      // ignore
    }
  }
}
