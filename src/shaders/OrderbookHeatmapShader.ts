/**
 * OrderbookHeatmapShader.ts - SCR-06-19
 * 오더북 호가 깊이 데이터를 실시간 히트맵으로 렌더링하는 WebGL 셰이더
 */

export const HEATMAP_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const HEATMAP_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uDepthTexture;

void main() {
  float depth = texture2D(uDepthTexture, vUv).r;
  // Green to Yellow to Red heatmap ramp
  vec3 color = mix(vec3(0.05, 0.2, 0.1), vec3(0.9, 0.7, 0.1), depth);
  if (depth > 0.7) {
    color = mix(color, vec3(0.95, 0.2, 0.2), (depth - 0.7) / 0.3);
  }
  gl_FragColor = vec4(color, depth * 0.8);
}
`;
