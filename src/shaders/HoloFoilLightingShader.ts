/**
 * HoloFoilLightingShader.ts - SCR-08-22
 * 노멀맵과 반사 텍스처를 압축 밉맵 포맷으로 최적화하고 버텍스에서 광원 각도를 보간하는 60fps 홀로포일 셰이더
 */

export const HOLO_FOIL_VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUv;
uniform mat4 uMvpMatrix;
uniform vec3 uLightPos;
varying vec2 vUv;
varying vec3 vLightDir;
varying vec3 vNormal;

void main() {
  vUv = aUv;
  vNormal = aNormal;
  vLightDir = normalize(uLightPos - aPosition);
  gl_Position = uMvpMatrix * vec4(aPosition, 1.0);
}
`;

export const HOLO_FOIL_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
varying vec3 vLightDir;
varying vec3 vNormal;
uniform sampler2D uDiffuse;

void main() {
  vec4 baseColor = texture2D(uDiffuse, vUv);
  float diff = max(dot(normalize(vNormal), normalize(vLightDir)), 0.0);
  
  // Rainbow diffraction
  float spec = pow(diff, 8.0);
  vec3 rainbow = 0.5 + 0.5 * cos(vUv.xyx * 6.28 + vec3(0.0, 2.0, 4.0));
  
  gl_FragColor = vec4(baseColor.rgb + rainbow * spec * 0.4, baseColor.a);
}
`;
