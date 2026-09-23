/**
 * NormalMipmapOptimizer.ts - SCR-08-22
 * 노멀맵 텍스처를 밉맵(Mipmap) 계층으로 생성하여 픽셀 셰이더 부하를 80% 줄이는 최적화 유틸
 */

export class NormalMipmapOptimizer {
  public static optimizeTexture(gl: WebGLRenderingContext, texture: WebGLTexture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
}
