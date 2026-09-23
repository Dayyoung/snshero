/**
 * SummonCircleShader.ts - SCR-04-19
 * 3D 소환 마법진 셰이더 정의
 */

export const SUMMON_CIRCLE_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const SUMMON_CIRCLE_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor;

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float ring = smoothstep(0.4, 0.42, dist) - smoothstep(0.43, 0.45, dist);
  float glow = 0.02 / (abs(dist - 0.35) + 0.01);
  float alpha = clamp(ring + glow * 0.5, 0.0, 1.0);
  gl_FragColor = vec4(uColor, alpha);
}
`;
