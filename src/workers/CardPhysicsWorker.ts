/**
 * CardPhysicsWorker.ts - SCR-02-13
 * 카드 드래그 궤적 및 2D 스프링 물리 시뮬레이션 백그라운드 워커
 */

interface PhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  k: number;      // 스프링 강도
  damping: number;// 감쇠 계수
  mass: number;   // 질량
}

let state: PhysicsState = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  targetX: 0,
  targetY: 0,
  k: 180,
  damping: 18,
  mass: 1.0,
};

let running = false;
let lastTime = 0;

function step(currentTime: number) {
  if (!running) return;
  const dt = Math.min((currentTime - lastTime) / 1000, 0.032);
  lastTime = currentTime;

  // 스프링 힘: F = -k * (x - target) - damping * v
  const fx = -state.k * (state.x - state.targetX) - state.damping * state.vx;
  const fy = -state.k * (state.y - state.targetY) - state.damping * state.vy;

  const ax = fx / state.mass;
  const ay = fy / state.mass;

  state.vx += ax * dt;
  state.vy += ay * dt;

  state.x += state.vx * dt;
  state.y += state.vy * dt;

  // 틸트 각도 계산 (속도 기반)
  const tiltX = Math.max(-25, Math.min(25, state.vy * 0.04));
  const tiltY = Math.max(-25, Math.min(25, -state.vx * 0.04));

  self.postMessage({
    type: 'UPDATE',
    x: state.x,
    y: state.y,
    tiltX,
    tiltY,
  });

  // 목표에 충분히 도달했고 정지했을 때 정지
  const dist = Math.hypot(state.x - state.targetX, state.y - state.targetY);
  const speed = Math.hypot(state.vx, state.vy);
  if (dist < 0.1 && speed < 0.1) {
    state.x = state.targetX;
    state.y = state.targetY;
    state.vx = 0;
    state.vy = 0;
    self.postMessage({
      type: 'SETTLED',
      x: state.x,
      y: state.y,
      tiltX: 0,
      tiltY: 0,
    });
    running = false;
    return;
  }

  requestAnimationFrame(step);
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;
  if (type === 'SET_TARGET') {
    state.targetX = payload.x;
    state.targetY = payload.y;
    if (!running) {
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(step);
    }
  } else if (type === 'RESET') {
    state.x = payload.x;
    state.y = payload.y;
    state.targetX = payload.x;
    state.targetY = payload.y;
    state.vx = 0;
    state.vy = 0;
    running = false;
  }
};
