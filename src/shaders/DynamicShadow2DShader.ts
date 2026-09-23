/**
 * DynamicShadow2DShader.ts - SCR-09-19
 * 이동 아바타 그림자 1D 텍스처 패스 GPU 픽셀 셰이더
 */

export const SHADOW_2D_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const SHADOW_2D_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uOcclusionMap;
uniform vec2 uLightPos;

void main() {
  vec2 coord = vUv;
  vec2 delta = coord - uLightPos;
  float dist = length(delta);
  vec2 stepDir = delta / 32.0;

  float shadow = 1.0;
  for (int i = 0; i < 32; i++) {
    coord -= stepDir;
    float occ = texture2D(uOcclusionMap, coord).r;
    if (occ > 0.5) {
      shadow = 0.3;
      break;
    }
  }

  gl_FragColor = vec4(vec3(0.0), (1.0 - shadow) * 0.5);
}
`;
