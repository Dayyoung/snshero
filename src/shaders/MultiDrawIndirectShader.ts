/**
 * MultiDrawIndirectShader.ts - SCR-02-19
 * 전장의 모든 카드, 오라, 데미지 숫자를 단일 드로우 콜로 일괄 디스패치하는 WebGL 셰이더 정의
 */

export const BATTLE_VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec4 aInstanceTransform;
attribute float aInstanceAlpha;

varying vec2 vTexCoord;
varying float vAlpha;

void main() {
  vTexCoord = aTexCoord;
  vAlpha = aInstanceAlpha;
  vec3 pos = aPosition * aInstanceTransform.w + vec3(aInstanceTransform.xy, 0.0);
  gl_Position = vec4(pos, 1.0);
}
`;

export const BATTLE_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uTextureAtlas;
varying vec2 vTexCoord;
varying float vAlpha;

void main() {
  vec4 color = texture2D(uTextureAtlas, vTexCoord);
  gl_FragColor = vec4(color.rgb, color.a * vAlpha);
}
`;
