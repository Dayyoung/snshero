/**
 * AdaptiveLodCardShader.ts - SCR-01-22
 * 적응형 동적 LOD(Level of Detail) 카드 셰이더
 */

export const ADAPTIVE_LOD_VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec2 aUv;
varying vec2 vUv;
uniform mat4 uMvpMatrix;

void main() {
  vUv = aUv;
  gl_Position = uMvpMatrix * vec4(aPosition, 1.0);
}
`;

export const ADAPTIVE_LOD_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform int uLodLevel; // 0: High, 1: Medium, 2: Low

void main() {
  vec4 color = texture2D(uTexture, vUv);
  // In low LOD, skip complex normal sheen
  if (uLodLevel > 1) {
    gl_FragColor = color;
  } else {
    float shine = max(0.0, 1.0 - abs(vUv.x - vUv.y) * 2.0);
    gl_FragColor = color + vec4(vec3(shine * 0.1), 0.0);
  }
}
`;
