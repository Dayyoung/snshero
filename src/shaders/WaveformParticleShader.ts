/**
 * WaveformParticleShader.ts - SCR-07-22
 * 실시간 승률 파형 및 충격파 파티클 WebGL 버텍스 셰이더 인스턴싱
 */

export const WAVEFORM_PARTICLE_VERTEX = `
attribute vec2 aPosition;
attribute vec3 aParticleOffset; // [x, y, scale]
attribute vec4 aColor;
varying vec4 vColor;
uniform mat4 uProjection;

void main() {
  vColor = aColor;
  vec2 worldPos = aPosition * aParticleOffset.z + aParticleOffset.xy;
  gl_Position = uProjection * vec4(worldPos, 0.0, 1.0);
}
`;

export const WAVEFORM_PARTICLE_FRAGMENT = `
precision mediump float;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`;
