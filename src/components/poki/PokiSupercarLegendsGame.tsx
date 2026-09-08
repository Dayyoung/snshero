import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Trophy, Zap, Flag, Gauge, Volume2, VolumeX, RotateCcw, Award, Flame } from 'lucide-react';

interface PokiSupercarLegendsGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface RivalCar {
  id: string;
  name: string;
  color: number;
  z: number;
  laneX: number;
  speed: number;
  mesh: THREE.Group;
}

interface Gate {
  z: number;
  leftType: 'green' | 'red';
  rightType: 'green' | 'red';
  leftLabel: string;
  rightLabel: string;
  leftMesh: THREE.Group;
  rightMesh: THREE.Group;
  passed: boolean;
}

export default function PokiSupercarLegendsGame({
  onClose,
  onBack,
  cardId = 72,
  onExit
}: PokiSupercarLegendsGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 HUD 상태
  const [currentLap, setCurrentLap] = useState(1);
  const [playerRank, setPlayerRank] = useState(1);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [nitroAmount, setNitroAmount] = useState(100);
  const [gateNotice, setGateNotice] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 조작 상태 레프
  const inputRef = useRef({
    targetLaneX: 0,
    nitroActive: false,
    driftActive: false,
  });

  const stateRef = useRef({
    carX: 0,
    carZ: 0,
    speed: 38, // 기본 약 136 km/h
    lap: 1,
    totalDistance: 0,
    nitro: 100,
    rank: 1,
    rivals: [] as RivalCar[],
    gates: [] as Gate[],
    startTime: Date.now(),
    ended: false,
    playerMesh: null as THREE.Group | null,
    wheels: [] as THREE.Mesh[],
    particles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
  });

  const LAP_DISTANCE = 350; // 1랩 = 350m

  // 사운드 합성
  const playSound = useCallback((type: 'engine' | 'nitro' | 'gateGood' | 'gateBad' | 'lap' | 'win') => {
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
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'nitro') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(650, now + 0.3);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'gateGood') {
        [523, 783, 1046].forEach((f, i) => {
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
      } else if (type === 'gateBad') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'lap') {
        [440, 554, 659].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.2, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.3);
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
    scene.background = new THREE.Color(0x81d4fa); // 시원한 레이싱 서킷 스카이
    scene.fog = new THREE.FogExp2(0xb3e5fc, 0.005);

    const camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.5, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff9c4, 1.3);
    sunLight.position.set(40, 80, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 4차선 레이싱 서킷 아스팔트 바닥 (폭 16m)
    const trackGeo = new THREE.PlaneGeometry(16, 500);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.6 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.position.set(0, 0, 150);
    track.receiveShadow = true;
    scene.add(track);

    // 차선 점선 표시
    for (let i = -100; i <= 400; i += 12) {
      const lineGeo = new THREE.PlaneGeometry(0.3, 5);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lineL = new THREE.Mesh(lineGeo, lineMat);
      lineL.position.set(-3.5, 0.02, i);
      const lineR = new THREE.Mesh(lineGeo, lineMat);
      lineR.position.set(3.5, 0.02, i);
      scene.add(lineL);
      scene.add(lineR);
    }

    // 좌우 레드&화이트 레이싱 연석(Kerbs)
    for (let i = -100; i <= 400; i += 6) {
      const isRed = (Math.floor(i / 6) % 2 === 0);
      const curbMat = new THREE.MeshStandardMaterial({ color: isRed ? 0xd32f2f : 0xffffff });
      const curbGeo = new THREE.BoxGeometry(0.8, 0.2, 6);
      const lCurb = new THREE.Mesh(curbGeo, curbMat);
      lCurb.position.set(-8.4, 0.1, i);
      const rCurb = new THREE.Mesh(curbGeo, curbMat);
      rCurb.position.set(8.4, 0.1, i);
      scene.add(lCurb);
      scene.add(rCurb);
    }

    // 피니시 체커 아치 게이트 (z: 0 지점 & LAP_DISTANCE 지점)
    const createFinishArch = (zPos: number) => {
      const arch = new THREE.Group();
      arch.position.set(0, 0, zPos);
      const pL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8, 0.8), new THREE.MeshStandardMaterial({ color: 0x212121 }));
      pL.position.set(-8, 4, 0);
      const pR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8, 0.8), new THREE.MeshStandardMaterial({ color: 0x212121 }));
      pR.position.set(8, 4, 0);
      const top = new THREE.Mesh(new THREE.BoxGeometry(16.8, 1.2, 1), new THREE.MeshStandardMaterial({ color: 0xffeb3b }));
      top.position.set(0, 8, 0);
      arch.add(pL);
      arch.add(pR);
      arch.add(top);
      scene.add(arch);
    };
    createFinishArch(0);
    createFinishArch(LAP_DISTANCE);

    // 3D 배수 게이트(Multiplier Gates) 3개 세트 생성
    const gatePositions = [80, 180, 270];
    const gates: Gate[] = [];

    gatePositions.forEach((gz, idx) => {
      const leftGood = (idx !== 1); // 2번째 게이트는 오른쪽이 좋은 게이트
      const gLeft = new THREE.Group();
      gLeft.position.set(-4, 0, gz);

      const gRight = new THREE.Group();
      gRight.position.set(4, 0, gz);

      // 게이트 프레임 메쉬
      const frameGeo = new THREE.BoxGeometry(6.5, 4.5, 0.3);
      const leftMat = new THREE.MeshStandardMaterial({
        color: leftGood ? 0x00e676 : 0xff1744,
        transparent: true,
        opacity: 0.75,
      });
      const rightMat = new THREE.MeshStandardMaterial({
        color: !leftGood ? 0x00e676 : 0xff1744,
        transparent: true,
        opacity: 0.75,
      });

      const lMesh = new THREE.Mesh(frameGeo, leftMat);
      lMesh.position.y = 2.25;
      gLeft.add(lMesh);

      const rMesh = new THREE.Mesh(frameGeo, rightMat);
      rMesh.position.y = 2.25;
      gRight.add(rMesh);

      scene.add(gLeft);
      scene.add(gRight);

      gates.push({
        z: gz,
        leftType: leftGood ? 'green' : 'red',
        rightType: !leftGood ? 'green' : 'red',
        leftLabel: leftGood ? 'x2 SPEED' : '-30 km/h',
        rightLabel: !leftGood ? '+50 km/h' : 'SLOW',
        leftMesh: gLeft,
        rightMesh: gRight,
        passed: false,
      });
    });
    stateRef.current.gates = gates;

    // 플레이어 하이퍼카 (레드 & 카본 에어로)
    const playerCar = new THREE.Group();
    playerCar.position.set(0, 0.5, 0);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd50000, metalness: 0.7, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.75, 4.6), bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    playerCar.add(body);

    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 2.0), cabinMat);
    cabin.position.set(0, 1.05, -0.2);
    playerCar.add(cabin);

    // 리어 GT 윙 스포일러
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.5), cabinMat);
    spoiler.position.set(0, 1.25, -2.0);
    playerCar.add(spoiler);

    // 휠 4개
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.8 });
    const wheels: THREE.Mesh[] = [];

    const wPos = [
      [-1.15, 0.42, 1.4],
      [1.15, 0.42, 1.4],
      [-1.15, 0.42, -1.4],
      [1.15, 0.42, -1.4],
    ];
    wPos.forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, wy, wz);
      w.castShadow = true;
      playerCar.add(w);
      wheels.push(w);
    });
    stateRef.current.wheels = wheels;

    // No.072 공식 카드 영웅 배지
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 72, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), bMat);
    badge.position.set(0, 1.4, -0.2);
    badge.rotateX(-Math.PI / 2);
    playerCar.add(badge);

    scene.add(playerCar);
    stateRef.current.playerMesh = playerCar;

    // 3대의 AI 라이벌 슈퍼카 생성
    const rivalsData = [
      { id: 'ai1', name: '블루 썬더', color: 0x0288d1, z: 25, laneX: -4, speed: 39 },
      { id: 'ai2', name: '골드 바이퍼', color: 0xffb300, z: 45, laneX: 3.5, speed: 38 },
      { id: 'ai3', name: '그린 팬텀', color: 0x2e7d32, z: 65, laneX: -1.5, speed: 37 },
    ];
    const rivals: RivalCar[] = [];

    rivalsData.forEach((rd) => {
      const rGroup = new THREE.Group();
      rGroup.position.set(rd.laneX, 0.5, rd.z);

      const rBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.75, 4.6),
        new THREE.MeshStandardMaterial({ color: rd.color, roughness: 0.3 })
      );
      rBody.position.y = 0.5;
      rBody.castShadow = true;
      const rCabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.55, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
      );
      rCabin.position.set(0, 1.05, -0.2);
      rGroup.add(rBody);
      rGroup.add(rCabin);

      scene.add(rGroup);
      rivals.push({
        id: rd.id,
        name: rd.name,
        color: rd.color,
        z: rd.z,
        laneX: rd.laneX,
        speed: rd.speed,
        mesh: rGroup,
      });
    });
    stateRef.current.rivals = rivals;

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
        renderer.render(scene, camera);
        return;
      }

      // 니트로 부스트 계산
      let targetSpeed = 40; // 기본 약 144 km/h
      if (input.nitroActive && state.nitro > 0) {
        targetSpeed = 65; // 약 234 km/h
        state.nitro = Math.max(0, state.nitro - 30 * dt);
        playSound('nitro');

        // 니트로 블루 플레임 파티클
        const pMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.2, 0.2),
          new THREE.MeshBasicMaterial({ color: 0x00e5ff })
        );
        pMesh.position.set(state.carX + (Math.random() - 0.5) * 0.8, 0.6, state.carZ - 2.4);
        scene.add(pMesh);
        state.particles.push({
          mesh: pMesh,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 2,
          vz: -20,
          life: 0.2,
        });
      } else {
        state.nitro = Math.min(100, state.nitro + 10 * dt); // 자연 충전
      }
      setNitroAmount(Math.round(state.nitro));

      // 가속도 보간
      state.speed += (targetSpeed - state.speed) * Math.min(dt * 3, 1);
      state.carZ += state.speed * dt;
      state.totalDistance += state.speed * dt;

      setSpeedKmh(Math.round(state.speed * 3.6));

      // 조향 보간 (Screen-relative 완벽 일치)
      state.carX = THREE.MathUtils.lerp(state.carX, input.targetLaneX, 0.15);
      state.carX = Math.max(-6.5, Math.min(6.5, state.carX));

      // 바퀴 회전 & 플레이어 메쉬 동기화
      state.wheels.forEach((w) => {
        w.rotation.x += (state.speed / 0.42) * dt;
      });

      if (state.playerMesh) {
        state.playerMesh.position.set(state.carX, 0.5, state.carZ);
        // 드리프트 / 조향 틸트
        const roll = (input.targetLaneX - state.carX) * 0.08;
        state.playerMesh.rotation.y = roll * 0.5;
        state.playerMesh.rotation.z = -roll * 0.4;
      }

      // 게이트 통과 판정
      state.gates.forEach((gate) => {
        if (!gate.passed && state.carZ >= gate.z && state.carZ <= gate.z + 4) {
          gate.passed = true;
          const isLeft = state.carX < 0;
          const passedType = isLeft ? gate.leftType : gate.rightType;
          const label = isLeft ? gate.leftLabel : gate.rightLabel;

          if (passedType === 'green') {
            state.speed = Math.min(72, state.speed + 16); // 속도 급상승
            playSound('gateGood');
            setGateNotice(`★ GATE PASS: ${label} ★`);
            if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
          } else {
            state.speed = Math.max(22, state.speed - 12); // 감속
            playSound('gateBad');
            setGateNotice(`✘ SLOW GATE: ${label}`);
            if (navigator.vibrate) navigator.vibrate(80);
          }
          setTimeout(() => setGateNotice(null), 1400);
        }
      });

      // AI 라이벌 주행 및 순위 판정
      let rank = 1;
      state.rivals.forEach((rival) => {
        rival.z += rival.speed * dt;
        rival.mesh.position.set(rival.laneX, 0.5, rival.z);
        if (rival.z > state.carZ) rank++;
      });
      state.rank = rank;
      setPlayerRank(rank);

      // 랩 완주 판정 (350m 마다 1랩)
      const currentLapNum = Math.min(3, Math.floor(state.totalDistance / LAP_DISTANCE) + 1);
      if (currentLapNum !== state.lap) {
        state.lap = currentLapNum;
        setCurrentLap(state.lap);
        playSound('lap');
        // 게이트 리셋
        state.gates.forEach((g) => {
          g.z += LAP_DISTANCE;
          g.passed = false;
          g.leftMesh.position.z = g.z;
          g.rightMesh.position.z = g.z;
        });
      }

      // 최종 3랩 완주 및 피니시 판정 (총 1,050m)
      if (state.totalDistance >= LAP_DISTANCE * 3 && !state.ended) {
        state.ended = true;
        setIsGameWon(true);
        playSound('win');
        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const res = calculateAndDepositMissionReward({
          gameId: 'supercar-legends',
          gameTitle: '슈퍼카 레전드 3D (Supercar Legends)',
          isVictory: state.rank <= 2,
          score: Math.round(state.totalDistance + (5 - state.rank) * 200),
          maxTargetScore: 1800,
          durationSeconds: duration,
        });
        setRewardResult(res);
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

      // 카메라 후방 숄더 트래킹
      camera.position.set(state.carX * 0.6, 4.2, state.carZ - 8.5);
      camera.lookAt(state.carX * 0.3, 1.2, state.carZ + 12);

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

  // 화면 터치 슬라이드 조향 핸들러
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = touch.clientX - rect.left;
    const normX = (clientX / rect.width) * 2 - 1; // -1 ~ 1
    inputRef.current.targetLaneX = normX * 6.0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = e.clientX - rect.left;
      const normX = (clientX / rect.width) * 2 - 1;
      inputRef.current.targetLaneX = normX * 6.0;
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 font-mono"
      onTouchMove={handleTouchMove}
      onMouseMove={handleMouseMove}
    >
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="SUPERCAR LEGENDS 3D"
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

      {/* 상단 순위 및 랩 인디케이터 */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* 순위 (Rank) */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-amber-500/40 flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <div className="text-xl font-black text-amber-300 leading-none">
              {playerRank} <span className="text-xs font-normal text-zinc-400">/ 4 위</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">실시간 레이스 순위</div>
          </div>
        </div>

        {/* 랩 및 속도계 */}
        <div className="flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-1">
            <Flag className="w-4 h-4" /> LAP {currentLap} / 3
          </div>
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-cyan-500/40 text-xs font-bold text-cyan-300 flex items-center gap-1">
            <Gauge className="w-4 h-4" /> {speedKmh} km/h
          </div>
        </div>
      </div>

      {/* 게이트 통과 안내 토스트 */}
      {gateNotice && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 bg-emerald-600/90 text-white px-4 py-2 rounded-sm text-sm font-black shadow-lg shadow-emerald-500/40 animate-bounce">
          {gateNotice}
        </div>
      )}

      {/* 하단 모바일 컨트롤 바 */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        {/* 좌측: 니트로 게이지 바 */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-cyan-500/40 flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <div className="flex justify-between items-center text-[10px] text-zinc-300 mb-0.5">
              <span>NITRO BOOST</span>
              <span className="font-bold text-cyan-400">{nitroAmount}%</span>
            </div>
            <div className="w-28 sm:w-36 bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-100"
                style={{ width: `${nitroAmount}%` }}
              />
            </div>
          </div>
        </div>

        {/* 우측: 니트로 부스트 대형 버튼 (76px) */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={() => {
              inputRef.current.nitroActive = true;
            }}
            onTouchEnd={() => {
              inputRef.current.nitroActive = false;
            }}
            onMouseDown={() => {
              inputRef.current.nitroActive = true;
            }}
            onMouseUp={() => {
              inputRef.current.nitroActive = false;
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-cyan-600 border-3 border-cyan-300 text-white rounded-full active:scale-90 flex flex-col items-center justify-center font-black shadow-xl shadow-cyan-600/50 active:bg-cyan-500"
          >
            <Zap className="w-8 h-8 animate-bounce" />
            <span className="text-[11px] tracking-wider mt-0.5">NITRO</span>
          </button>
        </div>
      </div>

      {/* 승리/완주 보상 모달 */}
      {isGameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={isGameWon}
          onClose={handleExit}
          reward={rewardResult}
          gameTitle="슈퍼카 레전드 3D (Supercar Legends)"
        />
      )}
    </div>
  );
}
