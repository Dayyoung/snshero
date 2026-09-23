/**
 * StockTreemapShader.ts - SCR-06-22
 * 전체 시장 동향 2D 트리맵(Treemap) 쿼드 인스턴싱 셰이더
 */

export const STOCK_TREEMAP_VERTEX_SHADER = `
attribute vec2 aQuad; // [-0.5, 0.5]
attribute vec4 aRect; // [x, y, w, h]
attribute vec3 aColor;
varying vec3 vColor;
varying vec2 vUv;
uniform vec2 uViewport;

void main() {
  vColor = aColor;
  vUv = aQuad + 0.5;
  vec2 pos = aRect.xy + (aQuad + 0.5) * aRect.zw;
  vec2 clip = (pos / uViewport) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

export const STOCK_TREEMAP_FRAGMENT_SHADER = `
precision mediump float;
varying vec3 vColor;
varying vec2 vUv;

void main() {
  // Border line
  float border = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  if (border < 0.03) {
    gl_FragColor = vec4(0.1, 0.1, 0.12, 1.0);
  } else {
    gl_FragColor = vec4(vColor, 1.0);
  }
}
`;
