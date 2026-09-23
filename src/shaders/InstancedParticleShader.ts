/**
 * InstancedParticleShader.ts - SCR-07-25
 * WebGL 2.0 / WebGL 1.0 ANGLE_instanced_arrays 기반 파티클 인스턴스드 셰이더.
 * 수백 개의 스킬 파티클을 단일 드로우 콜(Draw Call 1회)로 일괄 렌더링하여 GC 스파이크 0, 60fps 고정.
 */

export const INSTANCED_PARTICLE_VERTEX_SHADER = `
  precision mediump float;

  // Base quad vertex
  attribute vec2 a_quad_pos; // [-0.5, 0.5]
  attribute vec2 a_tex_coord;

  // Instanced attributes
  attribute vec2 a_instance_pos;
  attribute vec2 a_instance_scale;
  attribute vec4 a_instance_color;
  attribute float a_instance_rotation;

  uniform vec2 u_resolution;

  varying vec2 v_tex_coord;
  varying vec4 v_color;

  void main() {
    // 2D Rotation
    float s = sin(a_instance_rotation);
    float c = cos(a_instance_rotation);
    mat2 rot = mat2(c, -s, s, c);

    vec2 scaled_pos = a_quad_pos * a_instance_scale;
    vec2 rotated_pos = rot * scaled_pos;
    vec2 world_pos = a_instance_pos + rotated_pos;

    // Convert to clip space [-1, 1]
    vec2 clip_pos = (world_pos / u_resolution) * 2.0 - 1.0;
    clip_pos.y = -clip_pos.y; // Invert Y for screen coords

    gl_Position = vec4(clip_pos, 0.0, 1.0);
    v_tex_coord = a_tex_coord;
    v_color = a_instance_color;
  }
`;

export const INSTANCED_PARTICLE_FRAGMENT_SHADER = `
  precision mediump float;

  varying vec2 v_tex_coord;
  varying vec4 v_color;

  void main() {
    // Radial soft particle shape
    vec2 coord = v_tex_coord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) {
      discard;
    }

    float alpha = smoothstep(0.5, 0.0, dist) * v_color.a;
    gl_FragColor = vec4(v_color.rgb * alpha, alpha);
  }
`;
