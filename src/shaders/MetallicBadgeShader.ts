/**
 * MetallicBadgeShader.ts - SCR-11-19
 * 업적 뱃지 메탈릭 광택 및 빛 반사 2D 셰이더
 */

export const METALLIC_BADGE_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const METALLIC_BADGE_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uBaseColor;

void main() {
  float sheen = sin((vUv.x + vUv.y) * 4.0 - uTime * 3.0) * 0.5 + 0.5;
  sheen = pow(sheen, 6.0);
  vec3 finalColor = uBaseColor + vec3(sheen * 0.8);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;
