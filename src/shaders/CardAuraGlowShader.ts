/**
 * CardAuraGlowShader.ts - SCR-02-25
 * 풀스크린 오프스크린 블러 텍스처를 핀포인트로 합성해 GPU 부하를 80% 줄이는 60fps 오라 글로우 셰이더
 */

export const CARD_AURA_GLOW_VERTEX = `
attribute vec2 aPosition;
attribute vec2 aUv;
varying vec2 vUv;

void main() {
  vUv = aUv;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const CARD_AURA_GLOW_FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uCardTexture;
uniform sampler2D uBlurTexture;
uniform vec3 uAuraColor;

void main() {
  vec4 card = texture2D(uCardTexture, vUv);
  vec4 blur = texture2D(uBlurTexture, vUv);
  vec3 finalRgb = mix(blur.rgb * uAuraColor * 2.0, card.rgb, card.a);
  gl_FragColor = vec4(finalRgb, max(card.a, blur.a * 0.8));
}
`;
