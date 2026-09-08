import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Flame, RotateCw, Zap, Trophy, Volume2, VolumeX, RotateCcw, Award } from 'lucide-react';

interface PokiCarnadoStuntGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

export default function PokiCarnadoStuntGame({
  onClose,
  onBack,
  cardId = 69,
  onExit
}: PokiCarnadoStuntGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 HUD 상태
  const [stuntScore, setStuntScore] = useState(0);
  const [jumpsLanded, setJumpsLanded] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [airNotice, setAirNotice] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 조작 상태 레프
  const inputRef = useRef({
    gas: false,
    brake: false,
    nitro: false,
    flip: false,
  });

  const stateRef = useRef({
    carZ: -15,
    carY: 0.6,
    carVz: 0,
    carVy: 0,
    pitchAngle: 0,
    inAir: false,
    airTime: 0,
    rotAccum: 0,
    stuntScore: 0,
    landedCount: 0,
    nitro: 100,
    ringPassed: false,
    startTime: Date.now(),
    ended: false,
    carMesh: null as THREE.Group | null,
    wheels: [] as THREE.Mesh[],
    particles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
  });

  // 사운드 합성
  const playSound = useCallback((type: 'engine' | 'jump' | 'flip' | 'land' | 'crash' | 'nitro' | 'ring' | 'win') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'engine') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'flip') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'land') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'nitro') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(700, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'ring') {
        [659, 880, 1174].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.2, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.2);
        });
      } else if (type === 'win') {
        [523, 659, 783, 1046, 1318].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.25, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.35);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.35);
        });
      }
    } catch {
      // AudioContext 미지원 무시
    }
  }, [isMuted]);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬 및 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5e1ce); // 사이버 미드나잇 블루
    scene.fog = new THREE.FogExp2(0xf5e1ce, 0.006);

    const camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.5, 350);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeb3b, 1.4);
    dirLight.position.set(20, 60, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 160m 아스팔트 트랙 바닥
    const trackGeo = new THREE.PlaneGeometry(16, 220);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.8 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, 0, 70);
    track.receiveShadow = true;
    scene.add(track);

    // 도로 양쪽 네온 펜스
    const fenceMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const lFence = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 220), fenceMat);
    lFence.position.set(-8, 0.4, 70);
    const rFence = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 220), fenceMat);
    rFence.position.set(8, 0.4, 70);
    scene.add(lFence);
    scene.add(rFence);

    // 1차 메가 도약 램프 (Mega Launch Ramp - z: 35 ~ 48m, 높이 5.5m)
    const rampGeo = new THREE.BoxGeometry(12, 1, 14);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xff3d00, roughness: 0.4 });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(0, 2.2, 41.5);
    ramp.rotateX(-0.35); // 20도 상향 도약각
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    scene.add(ramp);

    // 2차 착지 덱 및 슈퍼 점프 램프 (z: 80 ~ 95m)
    const ramp2 = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 16), rampMat);
    ramp2.position.set(0, 3.2, 87.5);
    ramp2.rotateX(-0.4);
    ramp2.castShadow = true;
    scene.add(ramp2);

    // 3차 불의 고리 (Ring of Fire - z: 125m, 공중 8.5m)
    const ringGeo = new THREE.TorusGeometry(4.2, 0.35, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff6d00 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 8.5, 125);
    scene.add(ring);

    // 결승선 아치 게이트 (z: 155m)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, 155);
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 1), new THREE.MeshStandardMaterial({ color: 0xffd600 }));
    p1.position.set(-7.5, 5, 0);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 1), new THREE.MeshStandardMaterial({ color: 0xffd600 }));
    p2.position.set(7.5, 5, 0);
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 1), new THREE.MeshStandardMaterial({ color: 0xd50000 }));
    topBar.position.set(0, 9.5, 0);
    gateGroup.add(p1);
    gateGroup.add(p2);
    gateGroup.add(topBar);
    scene.add(gateGroup);

    // 플레이어 머슬카 (Carnado GT)
    const carGroup = new THREE.Group();
    carGroup.position.set(0, 0.6, -15);

    // 바디 (옐로우 & 블랙 레이싱)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, metalness: 0.6, roughness: 0.3 });
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 4.8), bodyMat);
    carBody.position.y = 0.55;
    carBody.castShadow = true;
    carGroup.add(carBody);

    // 캐빈 유리
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.2 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 2.2), cabinMat);
    cabin.position.set(0, 1.25, -0.3);
    carGroup.add(cabin);

    // 리어 스포일러 윙
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 0.6), wingMat);
    wing.position.set(0, 1.4, -2.1);
    carGroup.add(wing);

    // 바퀴 4개 (크롬 휠)
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });
    const wheels: THREE.Mesh[] = [];

    const wPositions = [
      [-1.25, 0.45, 1.5],
      [1.25, 0.45, 1.5],
      [-1.25, 0.45, -1.5],
      [1.25, 0.45, -1.5],
    ];
    wPositions.forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, wy, wz);
      w.castShadow = true;
      carGroup.add(w);
      wheels.push(w);
    });
    stateRef.current.wheels = wheels;

    // No.069 공식 카드 영웅 배지
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 69, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.65, 16), badgeMat);
    badge.position.set(0, 1.65, -0.3);
    badge.rotateX(-Math.PI / 2);
    carGroup.add(badge);

    scene.add(carGroup);
    stateRef.current.carMesh = carGroup;

    // 리사이즈 리스너
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
    };
    window.addEventListener('resize', handleResize);

    // 애니메이션 루프
    let lastTime = performance.now();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      const input = inputRef.current;

      if (state.ended) {
        renderer.render(scene, camera);
        return;
      }

      // 지상 주행 / 공중 체공 판정
      let groundLevel = 0.6;

      // 1차 램프 (z: 35 ~ 48m)
      if (state.carZ >= 35 && state.carZ <= 48) {
        const t = (state.carZ - 35) / 13;
        groundLevel = 0.6 + t * 4.8;
      }
      // 2차 램프 (z: 80 ~ 95m)
      else if (state.carZ >= 80 && state.carZ <= 95) {
        const t = (state.carZ - 80) / 15;
        groundLevel = 0.6 + t * 5.8;
      }

      // 가속 및 물리 계산
      let targetVz = 0;
      if (input.gas) {
        targetVz = 35; // 약 126 km/h
        playSound('engine');
      }
      if (input.nitro && state.nitro > 0) {
        targetVz = 52; // 약 187 km/h (초고속 부스트)
        state.nitro = Math.max(0, state.nitro - 25 * dt);
        playSound('nitro');

        // 니트로 파티클
        const pMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.25, 0.25),
          new THREE.MeshBasicMaterial({ color: 0x00e5ff })
        );
        pMesh.position.set((Math.random() - 0.5) * 0.8, state.carY + 0.4, state.carZ - 2.4);
        scene.add(pMesh);
        state.particles.push({
          mesh: pMesh,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2,
          vz: -15,
          life: 0.25,
        });
      }
      if (input.brake) {
        targetVz = 0;
        state.carVz = Math.max(0, state.carVz - 30 * dt);
      }

      if (!state.inAir) {
        // 지상 가속
        state.carVz += (targetVz - state.carVz) * Math.min(dt * 4, 1);
      }

      state.carZ += state.carVz * dt;
      setSpeedKmh(Math.round(state.carVz * 3.6));

      // 램프 끝 도약 판정
      if (!state.inAir && state.carZ > 48 && state.carZ < 55 && state.carVz > 15) {
        state.inAir = true;
        state.carVy = state.carVz * 0.45; // 상향 도약력
        playSound('jump');
        if (navigator.vibrate) navigator.vibrate(40);
      } else if (!state.inAir && state.carZ > 95 && state.carZ < 102 && state.carVz > 15) {
        state.inAir = true;
        state.carVy = state.carVz * 0.55;
        playSound('jump');
        if (navigator.vibrate) navigator.vibrate(40);
      }

      // 공중 물리 (중력 및 공중 플립)
      if (state.inAir) {
        state.airTime += dt;
        state.carVy -= 18 * dt; // 중력 가속도
        state.carY += state.carVy * dt;

        // 공중 플립 회전
        if (input.flip) {
          state.pitchAngle += 6.5 * dt; // 공중 360 회전
          state.rotAccum += 6.5 * dt;
          playSound('flip');
          if (navigator.vibrate) navigator.vibrate(15);

          // 360도 회전 달성 체크
          if (state.rotAccum >= Math.PI * 2) {
            state.rotAccum -= Math.PI * 2;
            state.stuntScore += 300;
            setStuntScore(state.stuntScore);
            setAirNotice('★ 360 AIR FLIP! (+300) ★');
            setTimeout(() => setAirNotice(null), 1200);
          }
        }

        // 불의 고리 관통 체크 (z: 125m, y: 8.5m)
        if (!state.ringPassed && Math.abs(state.carZ - 125) < 3.5 && Math.abs(state.carY - 8.5) < 3.5) {
          state.ringPassed = true;
          state.stuntScore += 500;
          setStuntScore(state.stuntScore);
          playSound('ring');
          setAirNotice('🔥 RING OF FIRE PASS! (+500) 🔥');
          if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
          setTimeout(() => setAirNotice(null), 1500);
        }

        // 착지 판정
        if (state.carY <= groundLevel) {
          state.inAir = false;
          state.carY = groundLevel;
          state.carVy = 0;

          // 수평 착지 판정 (각도 오차가 적으면 클린 착지)
          const normAngle = Math.abs(state.pitchAngle % (Math.PI * 2));
          const isCleanLanding = normAngle < 0.8 || normAngle > (Math.PI * 2 - 0.8);

          if (isCleanLanding) {
            state.landedCount++;
            setJumpsLanded(state.landedCount);
            state.stuntScore += 200;
            setStuntScore(state.stuntScore);
            state.pitchAngle = 0;
            playSound('land');
            setAirNotice('✔ CLEAN LANDING! (+200)');
            if (navigator.vibrate) navigator.vibrate(60);
          } else {
            // 전복 충돌 (Crash)
            state.stuntScore = Math.max(0, state.stuntScore - 100);
            setStuntScore(state.stuntScore);
            state.pitchAngle = 0;
            state.carVz *= 0.4;
            playSound('crash');
            setAirNotice('✘ CRASH LANDING! (-100)');
            if (navigator.vibrate) navigator.vibrate(100);
          }
          setTimeout(() => setAirNotice(null), 1200);
        }
      } else {
        // 지상 위치 보정
        state.carY = groundLevel;
        // 램프 기울기 각도
        if (state.carZ >= 35 && state.carZ <= 48) {
          state.pitchAngle = -0.35;
        } else if (state.carZ >= 80 && state.carZ <= 95) {
          state.pitchAngle = -0.4;
        } else {
          state.pitchAngle = 0;
        }
      }

      // 바퀴 회전
      state.wheels.forEach((w) => {
        w.rotation.x += (state.carVz / 0.45) * dt;
      });

      // 머슬카 메쉬 동기화
      if (state.carMesh) {
        state.carMesh.position.set(0, state.carY, state.carZ);
        state.carMesh.rotation.x = state.pitchAngle;
      }

      // 파티클 업데이트
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.life -= dt;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          state.particles.splice(i, 1);
        }
      }

      // 카메라 사이드/체이스 트래킹
      const targetCamY = state.inAir ? Math.max(8, state.carY + 4) : 4.5;
      const targetCamZ = state.carZ - 10;
      camera.position.set(6, targetCamY, targetCamZ);
      camera.lookAt(0, state.carY + 1, state.carZ + 6);

      // 결승선(155m) 도달 또는 승리 조건 판정
      if ((state.carZ >= 155 || (state.stuntScore >= 1500 && state.landedCount >= 3)) && !state.ended) {
        state.ended = true;
        setIsGameWon(true);
        playSound('win');
        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const res = calculateAndDepositMissionReward({
          gameId: 'carnado-stunt-car',
          gameTitle: '카나도 스턴트 카 3D (Carnado Stunt Car)',
          isVictory: true,
          score: state.stuntScore + state.landedCount * 150,
          maxTargetScore: 2000,
          durationSeconds: duration,
        });
        setRewardResult(res);
      }

      // 트랙 끝 초과 시 리셋
      if (state.carZ > 170 && !state.ended) {
        state.carZ = -15;
        state.carVz = 0;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cardId, playSound]);

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#f5e1ce] font-mono">
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="CARNADO STUNT 3D"
        onQuit={handleExit}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 bg-black/40 text-white rounded border border-white/20 active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        }
      />

      {/* 상단 스턴트 점수 및 성공 착지 횟수 */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* 스턴트 점수 */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-amber-500/40 flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <div className="text-xl font-black text-amber-300 leading-none">{stuntScore}</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">목표: 1,500 PT</div>
          </div>
        </div>

        {/* 속도 & 착지 카운트 */}
        <div className="flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-cyan-500/40 text-xs font-bold text-cyan-300">
            {speedKmh} km/h
          </div>
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-1">
            <Award className="w-4 h-4" /> 착지: {jumpsLanded} / 3
          </div>
        </div>
      </div>

      {/* 공중 스턴트 안내 팝업 토스트 */}
      {airNotice && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 bg-amber-500/90 text-black px-4 py-2 rounded-sm text-sm font-black shadow-lg shadow-amber-500/50 animate-bounce">
          {airNotice}
        </div>
      )}

      {/* 하단 모바일 퓨어 터치 조작계 */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        {/* 좌측: 제동 (BRAKE - 64px) */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={() => {
              inputRef.current.brake = true;
            }}
            onTouchEnd={() => {
              inputRef.current.brake = false;
            }}
            onMouseDown={() => {
              inputRef.current.brake = true;
            }}
            onMouseUp={() => {
              inputRef.current.brake = false;
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600/80 backdrop-blur-md border-2 border-red-400 text-white rounded-lg active:scale-95 active:bg-red-500 flex flex-col items-center justify-center font-bold shadow-lg shadow-red-600/30"
          >
            <span className="text-base">BRAKE</span>
            <span className="text-[9px] text-red-200">감속</span>
          </button>
        </div>

        {/* 우측: 공중 플립, 니트로, 가속 (GAS 76px) */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* 공중제비 (AIR FLIP - 64px) */}
          <button
            onTouchStart={() => {
              inputRef.current.flip = true;
            }}
            onTouchEnd={() => {
              inputRef.current.flip = false;
            }}
            onMouseDown={() => {
              inputRef.current.flip = true;
            }}
            onMouseUp={() => {
              inputRef.current.flip = false;
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600/80 backdrop-blur-md border-2 border-purple-400 text-white rounded-lg active:scale-95 active:bg-purple-500 flex flex-col items-center justify-center font-bold text-xs shadow-lg shadow-purple-600/30"
          >
            <RotateCw className="w-5 h-5 mb-0.5 animate-spin" />
            <span className="text-[9px]">FLIP</span>
          </button>

          {/* 니트로 부스트 (NITRO - 64px) */}
          <button
            onTouchStart={() => {
              inputRef.current.nitro = true;
            }}
            onTouchEnd={() => {
              inputRef.current.nitro = false;
            }}
            onMouseDown={() => {
              inputRef.current.nitro = true;
            }}
            onMouseUp={() => {
              inputRef.current.nitro = false;
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-cyan-600/80 backdrop-blur-md border-2 border-cyan-400 text-white rounded-lg active:scale-95 active:bg-cyan-500 flex flex-col items-center justify-center font-bold text-xs shadow-lg shadow-cyan-600/30"
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">NITRO</span>
          </button>

          {/* 전진 가속 (GAS - 76px 메인 버튼) */}
          <button
            onTouchStart={() => {
              inputRef.current.gas = true;
            }}
            onTouchEnd={() => {
              inputRef.current.gas = false;
            }}
            onMouseDown={() => {
              inputRef.current.gas = true;
            }}
            onMouseUp={() => {
              inputRef.current.gas = false;
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-500 border-3 border-amber-300 text-white rounded-full active:scale-90 flex flex-col items-center justify-center font-black shadow-xl shadow-amber-500/50 active:bg-amber-400"
          >
            <Zap className="w-8 h-8" />
            <span className="text-[11px] tracking-wider mt-0.5">GAS</span>
          </button>
        </div>
      </div>

      {/* 승리 보상 모달 */}
      {isGameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={isGameWon}
          onClose={handleExit}
          reward={rewardResult}
          gameTitle="카나도 스턴트 카 3D (Carnado Stunt Car)"
        />
      )}
    </div>
  );
}
