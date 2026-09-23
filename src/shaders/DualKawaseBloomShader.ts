/**
 * DualKawaseBloomShader.ts - SCR-08-19
 * 1/4 해상도 듀얼 가와세(Dual Kawase) 다운샘플링/업샘플링 핑퐁 블룸 셰이더
 */

export const DUAL_KAWASE_DOWN_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uHalfpixel;

void main() {
  vec4 sum = texture2D(uTexture, vUv) * 4.0;
  sum += texture2D(uTexture, vUv - uHalfpixel);
  sum += texture2D(uTexture, vUv + uHalfpixel);
  sum += texture2D(uTexture, vUv + vec2(uHalfpixel.x, -uHalfpixel.y));
  sum += texture2D(uTexture, vUv - vec2(uHalfpixel.x, -uHalfpixel.y));
  gl_FragColor = sum / 8.0;
}
`;

export const DUAL_KAWASE_UP_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uHalfpixel;

void main() {
  vec4 sum = vec4(0.0);
  sum += texture2D(uTexture, vUv + vec2(-uHalfpixel.x * 2.0, 0.0));
  sum += texture2D(uTexture, vUv + vec2(-uHalfpixel.x, uHalfpixel.y)) * 2.0;
  sum += texture2D(uTexture, vUv + vec2(0.0, uHalfpixel.y * 2.0));
  sum += texture2D(uTexture, vUv + vec2(uHalfpixel.x, uHalfpixel.y)) * 2.0;
  sum += texture2D(uTexture, vUv + vec2(uHalfpixel.x * 2.0, 0.0));
  sum += texture2D(uTexture, vUv + vec2(uHalfpixel.x, -uHalfpixel.y)) * 2.0;
  sum += texture2D(uTexture, vUv + vec2(0.0, -uHalfpixel.y * 2.0));
  sum += texture2D(uTexture, vUv + vec2(-uHalfpixel.x, -uHalfpixel.y)) * 2.0;
  gl_FragColor = sum / 12.0;
}
`;
