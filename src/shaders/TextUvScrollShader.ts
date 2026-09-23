/**
 * TextUvScrollShader.ts - SCR-01-25
 * 롤링 공지 텍스트를 DOM 리플로우 없이 60fps로 스크롤하는 WebGL 버텍스 셰이더
 */

export const TEXT_UV_SCROLL_VERTEX = `
attribute vec2 aPosition;
attribute vec2 aUv;
varying vec2 vUv;
uniform float uOffset;

void main() {
  vUv = vec2(aUv.x + uOffset, aUv.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const TEXT_UV_SCROLL_FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
  gl_FragColor = texture2D(uTexture, fract(vUv));
}
`;
