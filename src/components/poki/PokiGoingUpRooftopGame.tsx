import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Compass, ArrowUp, Zap, RotateCcw, Volume2, VolumeX, Shield, Award } from 'lucide-react';

interface PokiGoingUpRooftopGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface Platform {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'beam' | 'ac' | 'glass' | 'helipad';
  mesh: THREE.Mesh;
}

export default function PokiGoingUpRooftopGame({
  onClose,
  onBack,
  cardId = 76,
  onExit
}: PokiGoingUpRooftopGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 HUD 상태
  const [altitude, setAltitude] = useState(0); // 0 ~ 60m
  const [dashCd, setDashCd] = useState(0);
  const [canWallJump, setCanWallJump] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 조작 상태 레프
  const inputRef = useRef({
    moveX: 0,
    jumpRequested: false,
    dashRequested: false,
  });

  const stateRef = useRef({
    heroX: 0,
    heroY: 0.8,
    heroVx: 0,
    heroVy: 0,
    isGrounded: true,
    wallTouch: 0 as -1 | 0 | 1, // -1: 좌측 벽, 1: 우측 벽
    dashCooldown: 0,
    altitude: 0,
    startTime: Date.now(),
    ended: false,
    heroMesh: null as THREE.Group | null,
    heliRotor: null as THREE.Mesh | null,
    platforms: [] as Platform[],
    particles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
  });

  const TARGET_ALTITUDE = 60; // 60m 루프탑 헬리패드

  // 사운드 합성
  const playSound = useCallback((type: 'jump' | 'wallkick' | 'dash' | 'land' | 'fall' | 'win') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'wallkick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'dash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'land') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'fall') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
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
    scene.background = new THREE.Color(0x0a192f); // 사이버 미드나잇 블루
    scene.fog = new THREE.FogExp2(0x0a192f, 0.012);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.5, 200);
    camera.position.set(0, 4, 14);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    dirLight.position.set(10, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 지상 안전 광폭 시작 바닥 (1층 15m 안전 존)
    const groundGeo = new THREE.BoxGeometry(16, 1.2, 8);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.6, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    // 좌우 마천루 외벽 기둥 (X: -7.5, X: 7.5, 높이 70m)
    const wallGeo = new THREE.BoxGeometry(1.2, 75, 8);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const lWall = new THREE.Mesh(wallGeo, wallMat);
    lWall.position.set(-7.6, 35, 0);
    lWall.receiveShadow = true;
    const rWall = new THREE.Mesh(wallGeo, wallMat);
    rWall.position.set(7.6, 35, 0);
    rWall.receiveShadow = true;
    scene.add(lWall);
    scene.add(rWall);

    // 네온 외벽 라인
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const lNeon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 75, 0.1), neonMat);
    lNeon.position.set(-7.0, 35, 3.9);
    const rNeon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 75, 0.1), neonMat);
    rNeon.position.set(7.0, 35, 3.9);
    scene.add(lNeon);
    scene.add(rNeon);

    // 절차적 파쿠르 발판 생성 (Y: 3m부터 매 3.2m 간격으로 55m까지 배치)
    const platforms: Platform[] = [];
    let pId = 1;

    // 지상 기본 등록
    platforms.push({
      id: pId++,
      x: 0,
      y: 0,
      w: 15,
      h: 0.4,
      type: 'ground',
      mesh: ground,
    });

    let curY = 3.5;
    while (curY < 57) {
      const w = 2.8 + Math.random() * 1.8;
      const x = (Math.random() - 0.5) * (12 - w);
      const isAC = Math.random() > 0.5;

      const pGeo = new THREE.BoxGeometry(w, 0.35, 2.5);
      const pMat = new THREE.MeshStandardMaterial({
        color: isAC ? 0xf59e0b : 0x0288d1,
        roughness: 0.4,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(x, curY, 0);
      pMesh.castShadow = true;
      pMesh.receiveShadow = true;
      scene.add(pMesh);

      platforms.push({
        id: pId++,
        x,
        y: curY,
        w,
        h: 0.35,
        type: isAC ? 'ac' : 'beam',
        mesh: pMesh,
      });

      curY += 3.2 + Math.random() * 1.2;
    }

    // 60m 최상층 루프탑 헬리패드
    const helipadGeo = new THREE.BoxGeometry(13.5, 0.6, 6.5);
    const helipadMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const helipad = new THREE.Mesh(helipadGeo, helipadMat);
    helipad.position.set(0, 60, 0);
    scene.add(helipad);

    // 헬리패드 'H' 마크
    const hMarkCanvas = document.createElement('canvas');
    hMarkCanvas.width = 128;
    hMarkCanvas.height = 128;
    const hCtx = hMarkCanvas.getContext('2d');
    if (hCtx) {
      hCtx.fillStyle = '#ef4444';
      hCtx.fillRect(20, 20, 24, 88);
      hCtx.fillRect(84, 20, 24, 88);
      hCtx.fillRect(20, 52, 88, 24);
    }
    const hTex = new THREE.CanvasTexture(hMarkCanvas);
    const hPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 3.5),
      new THREE.MeshBasicMaterial({ map: hTex, transparent: true })
    );
    hPlane.rotateX(-Math.PI / 2);
    hPlane.position.set(0, 60.32, 0);
    scene.add(hPlane);

    // 구조 헬리콥터 3D 모델 (Y: 62.5m 상공 대기)
    const heliGroup = new THREE.Group();
    heliGroup.position.set(0, 62.5, 0);

    const heliBody = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 1.8, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
    );
    const heliTail = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x212121 })
    );
    heliTail.position.set(3.6, 0.4, 0);

    const rotorGeo = new THREE.BoxGeometry(6.5, 0.08, 0.3);
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.set(0, 1.2, 0);

    heliGroup.add(heliBody);
    heliGroup.add(heliTail);
    heliGroup.add(rotor);
    scene.add(heliGroup);
    stateRef.current.heliRotor = rotor;

    platforms.push({
      id: pId++,
      x: 0,
      y: 60,
      w: 13.5,
      h: 0.6,
      type: 'helipad',
      mesh: helipad,
    });
    stateRef.current.platforms = platforms;

    // 플레이어 파쿠르 러너 모델링
    const heroGroup = new THREE.Group();
    heroGroup.position.set(0, 0.8, 0);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x0288d1, roughness: 0.5 });
    const pantMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    // 몸체 (후드티)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), clothMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    heroGroup.add(torso);

    // 머리
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), skinMat);
    head.position.y = 1.5;
    head.castShadow = true;
    heroGroup.add(head);

    // 다리 2개
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), pantMat);
    lLeg.position.set(-0.2, 0.4, 0);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), pantMat);
    rLeg.position.set(0.2, 0.4, 0);
    heroGroup.add(lLeg);
    heroGroup.add(rLeg);

    // 등 뒤 No.076 공식 카드 영웅 배지
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 76, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), bMat);
    badge.position.set(0, 1.0, -0.25);
    badge.rotateY(Math.PI);
    heroGroup.add(badge);

    scene.add(heroGroup);
    stateRef.current.heroMesh = heroGroup;

    // 리사이즈
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
        // 승리 시 헬리콥터 로터 회전
        if (state.heliRotor) {
          state.heliRotor.rotation.y += 35 * dt;
        }
        renderer.render(scene, camera);
        return;
      }

      // 헬기 로터 회전
      if (state.heliRotor) {
        state.heliRotor.rotation.y += 20 * dt;
      }

      // 대시 쿨다운 감소
      if (state.dashCooldown > 0) {
        state.dashCooldown -= dt;
      }
      setDashCd(Math.max(0, state.dashCooldown));

      // 좌우 이동 물리 (Screen-relative)
      const targetSpeedX = input.moveX * 6.5;
      state.heroVx += (targetSpeedX - state.heroVx) * Math.min(dt * 8, 1);
      state.heroX += state.heroVx * dt;

      // 중력 가속도
      state.heroVy -= 24 * dt;
      state.heroY += state.heroVy * dt;

      // 벽면 접촉 판정 (X: -6.8 이하 또는 6.8 이상)
      if (state.heroX <= -6.8) {
        state.heroX = -6.8;
        state.wallTouch = -1;
        // 벽 미끄러짐 감속
        if (state.heroVy < -3.0) state.heroVy = -3.0;
      } else if (state.heroX >= 6.8) {
        state.heroX = 6.8;
        state.wallTouch = 1;
        if (state.heroVy < -3.0) state.heroVy = -3.0;
      } else {
        state.wallTouch = 0;
      }
      setCanWallJump(state.wallTouch !== 0 && !state.isGrounded);

      // 발판 충돌 판정 (하강 중일 때만 착지)
      let landed = false;
      if (state.heroVy <= 0) {
        for (const p of state.platforms) {
          const halfW = p.w / 2 + 0.35;
          if (
            Math.abs(state.heroX - p.x) <= halfW &&
            state.heroY >= p.y &&
            state.heroY <= p.y + 0.8
          ) {
            state.heroY = p.y + 0.05;
            state.heroVy = 0;
            state.isGrounded = true;
            landed = true;
            playSound('land');
            break;
          }
        }
      }
      if (!landed) {
        state.isGrounded = false;
      }

      // 점프 입력 처리
      if (input.jumpRequested) {
        input.jumpRequested = false;
        if (state.isGrounded) {
          // 일반 점프
          state.heroVy = 13.5;
          state.isGrounded = false;
          playSound('jump');
          if (navigator.vibrate) navigator.vibrate(25);
        } else if (state.wallTouch !== 0) {
          // 벽차기 월 점프 (Wall Kick & Wall Jump)
          state.heroVy = 14.5;
          state.heroVx = -state.wallTouch * 9.5; // 반대편으로 강력한 킥백
          state.wallTouch = 0;
          playSound('wallkick');
          if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

          // 벽차기 스파크 파티클
          for (let sp = 0; sp < 6; sp++) {
            const pMesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.15, 0.15, 0.15),
              new THREE.MeshBasicMaterial({ color: 0x00e5ff })
            );
            pMesh.position.set(state.heroX, state.heroY + 0.8, 0);
            scene.add(pMesh);
            state.particles.push({
              mesh: pMesh,
              vx: -state.wallTouch * (2 + Math.random() * 4),
              vy: Math.random() * 3,
              vz: (Math.random() - 0.5) * 2,
              life: 0.25,
            });
          }
        }
      }

      // 대시 입력 처리
      if (input.dashRequested && state.dashCooldown <= 0) {
        input.dashRequested = false;
        state.dashCooldown = 2.0;
        const dir = input.moveX !== 0 ? Math.sign(input.moveX) : (state.heroVx >= 0 ? 1 : -1);
        state.heroVx = dir * 16.0;
        state.heroVy = Math.max(state.heroVy, 4.0);
        playSound('dash');
        if (navigator.vibrate) navigator.vibrate(40);
      }

      // 고도(Altitude) 갱신
      state.altitude = Math.max(0, Math.round(state.heroY));
      setAltitude(state.altitude);

      // 메쉬 동기화
      if (state.heroMesh) {
        state.heroMesh.position.set(state.heroX, state.heroY, 0);
        // 이동 방향 바라보기
        if (Math.abs(state.heroVx) > 0.5) {
          state.heroMesh.rotation.y = state.heroVx > 0 ? 0.4 : -0.4;
        }
      }

      // 카메라 부드러운 수직 추종
      const targetCamY = Math.max(4.5, state.heroY + 3.2);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.12);
      camera.position.x = state.heroX * 0.3;
      camera.lookAt(state.heroX * 0.2, state.heroY + 1.2, 0);

      // 낙하 사망 판정 (Y < -4)
      if (state.heroY < -4 && !state.ended) {
        state.ended = true;
        setIsGameOver(true);
        playSound('fall');
        if (navigator.vibrate) navigator.vibrate(120);

        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const res = calculateAndDepositMissionReward({
          gameId: 'going-up-rooftop',
          gameTitle: '루프탑 고잉 업 3D (Going Up Rooftop)',
          isVictory: false,
          score: state.altitude * 10,
          maxTargetScore: 600,
          durationSeconds: duration,
        });
        setRewardResult(res);
      }

      // 60m 최상층 루프탑 헬리패드 완주 판정
      if (state.heroY >= 60 && !state.ended) {
        state.ended = true;
        setIsGameWon(true);
        playSound('win');
        if (navigator.vibrate) navigator.vibrate([60, 100, 60, 100]);

        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const res = calculateAndDepositMissionReward({
          gameId: 'going-up-rooftop',
          gameTitle: '루프탑 고잉 업 3D (Going Up Rooftop)',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: duration,
        });
        setRewardResult(res);
      }

      // 파티클 업데이트
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.vy -= 12 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          state.particles.splice(i, 1);
        }
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

  // 터치 슬라이더 조향 핸들러
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = touch.clientX - rect.left;
    const normX = (clientX / rect.width) * 2 - 1; // -1 ~ 1
    inputRef.current.moveX = Math.max(-1, Math.min(1, normX * 1.5));
  };

  const handleTouchEnd = () => {
    inputRef.current.moveX = 0;
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 font-mono"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="GOING UP ROOFTOP 3D"
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

      {/* 상단 고도 인디케이터 */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* 고도 게이지 */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-cyan-500/40 flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-cyan-400 animate-spin" />
          <div>
            <div className="text-xl font-black text-cyan-300 leading-none">
              {altitude}m <span className="text-xs font-normal text-zinc-400">/ 60m</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">루프탑 헬리패드 목표</div>
          </div>
        </div>

        {/* 벽 점프 인디케이터 */}
        {canWallJump && (
          <div className="bg-amber-500/90 text-black px-3 py-1.5 rounded-sm text-xs font-black animate-bounce shadow-lg">
            ★ WALL JUMP 가능! ★
          </div>
        )}
      </div>

      {/* 하단 모바일 컨트롤 바 */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        {/* 좌측: 조향 스크린 슬라이더 안내 */}
        <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-sm border border-white/20 text-[10px] text-zinc-300">
          화면 좌측 터치 슬라이드로 이동
        </div>

        {/* 우측: 대시 (DASH - 64px) & 점프 (JUMP / WALL JUMP - 76px) */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* 공중 대시 버튼 (64px) */}
          <button
            onClick={() => {
              inputRef.current.dashRequested = true;
            }}
            disabled={dashCd > 0}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-xs active:scale-95 shadow-lg ${
              dashCd <= 0
                ? 'bg-amber-600/90 border-amber-300 text-white shadow-amber-500/30 active:bg-amber-500'
                : 'bg-zinc-800/80 border-zinc-600 text-zinc-500 opacity-60'
            }`}
          >
            <Zap className="w-6 h-6 mb-0.5" />
            <span className="text-[9px]">{dashCd <= 0 ? 'DASH' : `${dashCd.toFixed(1)}s`}</span>
          </button>

          {/* 메인 점프 버튼 (76px) */}
          <button
            onClick={() => {
              inputRef.current.jumpRequested = true;
            }}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 flex flex-col items-center justify-center font-black active:scale-90 shadow-xl ${
              canWallJump
                ? 'bg-amber-500 border-amber-200 text-white shadow-amber-500/50 animate-pulse'
                : 'bg-cyan-600 border-cyan-300 text-white shadow-cyan-600/50 active:bg-cyan-500'
            }`}
          >
            <ArrowUp className="w-8 h-8 animate-bounce" />
            <span className="text-[11px] tracking-wider mt-0.5">{canWallJump ? 'WALL KICK' : 'JUMP'}</span>
          </button>
        </div>
      </div>

      {/* 게임 오버 (낙하) 모달 */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="text-3xl font-black text-red-500 mb-2">추락 (FALLEN)</div>
          <p className="text-zinc-400 text-xs mb-4">발판을 헛디뎌 마천루 아래로 추락했습니다.</p>
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-sm w-full max-w-xs mb-6 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">도달 고도:</span>
              <span className="font-bold text-cyan-400">{altitude}m / 60m</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-sm border border-red-400 active:scale-95 flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-4 h-4" /> 다시 도전
            </button>
            <button
              onClick={handleExit}
              className="px-5 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-sm border border-zinc-600 active:scale-95 text-xs"
            >
              나가기
            </button>
          </div>
        </div>
      )}

      {/* 승리 보상 모달 */}
      {isGameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={isGameWon}
          onClose={handleExit}
          reward={rewardResult}
          gameTitle="루프탑 고잉 업 3D (Going Up Rooftop)"
        />
      )}
    </div>
  );
}
