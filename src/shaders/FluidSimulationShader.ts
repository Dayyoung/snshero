/**
 * FluidSimulationShader.ts - SCR-08-13
 * 융합 연구소 WebGL 2.0 Transform Feedback / Ping-Pong 셰이더
 */

export const FLUID_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_velocity;
in float a_life;

out vec2 v_position;
out vec2 v_velocity;
out float v_life;

uniform float u_deltaTime;
uniform vec2 u_centerGravity;

void main() {
  vec2 dir = u_centerGravity - a_position;
  float dist = max(length(dir), 0.01);
  vec2 force = (dir / dist) * (1.5 / (dist * dist + 0.1));

  vec2 vel = a_velocity + force * u_deltaTime;
  vel *= 0.98; // damping
  vec2 pos = a_position + vel * u_deltaTime;
  float life = a_life - u_deltaTime * 0.5;

  if (life <= 0.0) {
    pos = vec2(sin(a_position.x * 12.0) * 0.8, cos(a_position.y * 12.0) * 0.8);
    vel = vec2(-pos.y, pos.x) * 0.5;
    life = 1.0;
  }

  v_position = pos;
  v_velocity = vel;
  v_life = life;

  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = mix(2.0, 6.0, life);
}
`;

export const FLUID_FRAGMENT_SHADER = `#version 300 es
precision mediump float;
in float v_life;
out vec4 fragColor;

void main() {
  // Alchemy mystical fluid color (gold/purple gradient)
  vec3 gold = vec3(1.0, 0.84, 0.0);
  vec3 purple = vec3(0.6, 0.2, 0.9);
  vec3 col = mix(purple, gold, v_life);
  fragColor = vec4(col, v_life * 0.8);
}
`;
