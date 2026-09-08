import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCarCircleGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface TrafficCar3D {
  mesh: THREE.Group;
  wheels: THREE.Mesh[];
  angle: number; // rad
  speed: number;
  color: number;
}

const TARGET_MERGED_CARS = 12; // 목표 합류 성공 차량 수
const CIRCLE_RADIUS = 6.0; // 로터리 회전 반경 (m)

export default function PokiCarCircleGame({
  onBack,
  onClose,
  cardId = 93,
}: PokiCarCircleGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onClose || (() => {});

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'hit' | 'victory'>('ready');
  const [mergedCount, setMergedCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [slowMoCooldown, setSlowMoCooldown] = useState(false);
  const [mergeBanner, setMergeBanner] = useState<string | null>(null);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Three.js 인스턴스 레프
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    trafficCars: TrafficCar3D[];
    playerCar: THREE.Group;
    playerWheels: THREE.Mesh[];
    sparks: THREE.Points;
    sparkGeo: THREE.BufferGeometry;
    confetti: THREE.Points;
    confettiGeo: THREE.BufferGeometry;
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // 실시간 제어 레프
  const stateRef = useRef({
    gameState: 'ready' as 'ready' | 'playing' | 'hit' | 'victory',
    playerZ: 12.5, // 진입로 대기 위치
    playerAngle: Math.PI / 2,
    isEntering: false,
    isMerged: false,
    speedMultiplier: 1.0,
    slowMoTimer: 0,
    mergedSuccess: 0,
    lives: 3,
    surviveSeconds: 0,
  });

  const triggerHaptic = useCallback((ms: number = 30) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // 무시
    }
  }, []);

  // 승리 처리
  const handleVictory = useCallback(() => {
    stateRef.current.gameState = 'victory';
    setGameState('victory');
    triggerHaptic([100, 50, 150]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicarcircle',
      gameTitle: 'Car Circle 3D',
      isVictory: true,
      score: TARGET_MERGED_CARS,
      maxTargetScore: TARGET_MERGED_CARS,
      durationSeconds: Math.round(stateRef.current.surviveSeconds),
    });
    setRewardReceipt(receipt);
  }, [cardId]);

  // 체력 소진 게임오버 처리
  const handleGameOver = useCallback(() => {
    stateRef.current.gameState = 'hit';
    setGameState('hit');
    triggerHaptic([200, 100, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokicarcircle',
      gameTitle: 'Car Circle 3D',
      isVictory: false,
      score: stateRef.current.mergedSuccess,
      maxTargetScore: TARGET_MERGED_CARS,
      durationSeconds: Math.round(stateRef.current.surviveSeconds),
    });
    setRewardReceipt(receipt);
  }, [cardId]);

  // 스파클 파티클 생성
  const spawnCrashSparksAt = useCallback((x: number, y: number, z: number) => {
    if (!threeRef.current) return;
    const { sparks, sparkGeo } = threeRef.current;
    const pos = sparkGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = y + Math.random() * 1.0;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 1.5;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    (sparks.material as THREE.PointsMaterial).opacity = 1.0;
  }, []);

  // 차량 진입 발차 액션 ([🚗 MERGE NOW!])
  const handleLaunchCar = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || s.isEntering || s.isMerged) return;

    s.isEntering = true;
    triggerHaptic(40);
  }, [cardId]);

  // 슬로우모션 힌트 ([⏱️ SLOW-MO])
  const handleTriggerSlowMo = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || slowMoCooldown) return;

    s.speedMultiplier = 0.45;
    s.slowMoTimer = 3.0;
    setIsSlowMo(true);
    setSlowMoCooldown(true);
    triggerHaptic([30, 20, 30]);

    setTimeout(() => {
      setSlowMoCooldown(false);
    }, 8000); // 8초 쿨다운
  }, [slowMoCooldown, triggerHaptic]);

  // 게임 시작
  const startGame = useCallback(() => {
    stateRef.current.gameState = 'playing';
    stateRef.current.playerZ = 12.5;
    stateRef.current.isEntering = false;
    stateRef.current.isMerged = false;
    stateRef.current.mergedSuccess = 0;
    stateRef.current.lives = 3;
    stateRef.current.surviveSeconds = 0;
    stateRef.current.speedMultiplier = 1.0;
    stateRef.current.slowMoTimer = 0;

    if (threeRef.current) {
      threeRef.current.playerCar.position.set(0, 0.4, 12.5);
      threeRef.current.playerCar.rotation.y = Math.PI; // 북쪽 방향
      threeRef.current.playerCar.visible = true;
    }

    setGameState('playing');
    setMergedCount(0);
    setLives(3);
    setIsSlowMo(false);
    setRewardReceipt(null);
    triggerHaptic(50);
  }, [cardId]);

  // Three.js 씬 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // 세련된 사이버 시티 나이트

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 16.5, 14.5);
    camera.lookAt(0, 0, 1.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const mainSpot = new THREE.SpotLight(0xffffff, 1.8, 40, Math.PI / 3, 0.3);
    mainSpot.position.set(0, 25, 0);
    scene.add(mainSpot);

    const blueRim = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueRim.position.set(-15, 10, -10);
    scene.add(blueRim);

    // No.093 공식 카드 영웅 배지 텍스처
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 256;
    heroCanvas.height = 256;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, cardId, 18, 18, 220, 220, { circleClip: true });
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.needsUpdate = true;

    // --- 3D 로터리 교차로 지형 구축 ---
    // 1) 지면 베이스
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 2) 원형 로터리 아스팔트 트랙 (반경 CIRCLE_RADIUS = 6.0, 폭 2.2)
    const trackGeo = new THREE.RingGeometry(CIRCLE_RADIUS - 1.2, CIRCLE_RADIUS + 1.2, 48);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.y = 0.02;
    scene.add(track);

    // 3) 트랙 중심선 (노란 점선 원)
    const centerLineGeo = new THREE.RingGeometry(CIRCLE_RADIUS - 0.05, CIRCLE_RADIUS + 0.05, 48);
    const centerLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const centerLine = new THREE.Mesh(centerLineGeo, centerLineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.03;
    scene.add(centerLine);

    // 4) 남쪽 진입로 도로 (X = 0, Z = 6 ~ 14)
    const rampGeo = new THREE.PlaneGeometry(2.4, 9.0);
    const ramp = new THREE.Mesh(rampGeo, trackMat);
    ramp.rotation.x = -Math.PI / 2;
    ramp.position.set(0, 0.02, 10.5);
    scene.add(ramp);

    // 5) 중앙 원형 잔디 아일랜드 & No.093 기념탑
    const islandGeo = new THREE.CylinderGeometry(CIRCLE_RADIUS - 1.2, CIRCLE_RADIUS - 1.2, 0.3, 32);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = 0.15;
    scene.add(island);

    // 기념탑 기둥
    const monumentGeo = new THREE.CylinderGeometry(1.2, 1.4, 3.2, 8);
    const monumentMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const monument = new THREE.Mesh(monumentGeo, monumentMat);
    monument.position.y = 1.6;
    scene.add(monument);

    // 기념탑 4방향 No.093 공식 영웅 배지 액자
    for (let i = 0; i < 4; i++) {
      const bMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.4),
        new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true })
      );
      const angle = (i * Math.PI) / 2;
      bMesh.position.set(Math.sin(angle) * 1.22, 2.0, Math.cos(angle) * 1.22);
      bMesh.rotation.y = angle;
      scene.add(bMesh);
    }

    // --- 3D 차량 생성 헬퍼 함수 ---
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    const createCarModel = (colorHex: number, isPlayer: boolean = false) => {
      const carGroup = new THREE.Group();
      const wheels: THREE.Mesh[] = [];

      // 바디
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.45, 2.6),
        new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.6, roughness: 0.25 })
      );
      body.position.y = 0.35;
      carGroup.add(body);

      // 캐빈
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.4, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
      );
      cabin.position.set(0, 0.7, -0.1);
      carGroup.add(cabin);

      // 플레이어 차량인 경우 보닛에 No.093 공식 배지 데칼 부착
      if (isPlayer) {
        const decal = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 0.8),
          new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true })
        );
        decal.rotation.x = -Math.PI / 2;
        decal.position.set(0, 0.59, -0.7);
        carGroup.add(decal);
      }

      // 헤드라이트 (앞쪽)
      const hlGeo = new THREE.BoxGeometry(0.25, 0.1, 0.05);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });
      [-0.45, 0.45].forEach((hx) => {
        const hl = new THREE.Mesh(hlGeo, hlMat);
        hl.position.set(hx, 0.35, -1.31);
        carGroup.add(hl);
      });

      // 테일라이트 (뒤쪽)
      const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      [-0.45, 0.45].forEach((tx) => {
        const tl = new THREE.Mesh(hlGeo, tlMat);
        tl.position.set(tx, 0.35, 1.31);
        carGroup.add(tl);
      });

      // 4개 타이어
      [
        [-0.72, 0.24, -0.8],
        [0.72, 0.24, -0.8],
        [-0.72, 0.24, 0.8],
        [0.72, 0.24, 0.8],
      ].forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(wx, wy, wz);
        carGroup.add(w);
        wheels.push(w);
      });

      return { carGroup, wheels };
    };

    // --- 3대의 로터리 순환 트래픽 차량 생성 ---
    const trafficCars: TrafficCar3D[] = [];
    const trafficColors = [0x3b82f6, 0x10b981, 0xf59e0b]; // 블루, 에메랄드, 앰버
    trafficColors.forEach((col, idx) => {
      const { carGroup, wheels } = createCarModel(col);
      const initialAngle = (idx * (Math.PI * 2)) / 3;

      // 위치 배치
      carGroup.position.set(
        Math.cos(initialAngle) * CIRCLE_RADIUS,
        0.4,
        Math.sin(initialAngle) * CIRCLE_RADIUS
      );
      carGroup.rotation.y = -initialAngle + Math.PI / 2;

      scene.add(carGroup);

      trafficCars.push({
        mesh: carGroup,
        wheels,
        angle: initialAngle,
        speed: 1.25, // rad/s
        color: col,
      });
    });

    // --- 플레이어 합류 차량 (레드 스포츠카) ---
    const { carGroup: playerCar, wheels: playerWheels } = createCarModel(0xdc2626, true);
    playerCar.position.set(0, 0.4, 12.5);
    playerCar.rotation.y = Math.PI; // 북쪽 방향
    scene.add(playerCar);

    // --- 파티클 시스템 (충돌 스파크 & 승리 콘페티) ---
    // 1) 스파크
    const sparkCount = 60;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) sparkPos[i] = 0;
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0xff4444, size: 0.4, transparent: true, opacity: 0 });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // 2) 콘페티
    const confettiCount = 80;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPos = new Float32Array(confettiCount * 3);
    for (let i = 0; i < confettiCount; i++) {
      confettiPos[i * 3] = (Math.random() - 0.5) * 16;
      confettiPos[i * 3 + 1] = Math.random() * 8 + 1;
      confettiPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPos, 3));
    const confettiMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.35, transparent: true, opacity: 0 });
    const confetti = new THREE.Points(confettiGeo, confettiMat);
    scene.add(confetti);

    const clock = new THREE.Clock();

    threeRef.current = {
      scene,
      camera,
      renderer,
      trafficCars,
      playerCar,
      playerWheels,
      sparks,
      sparkGeo,
      confetti,
      confettiGeo,
      animId: 0,
      clock,
    };

    // 리사이즈
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 애니메이션 루프
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const s = stateRef.current;

      if (s.gameState === 'playing') {
        s.surviveSeconds += delta;

        // 슬로우모션 타이머
        if (s.slowMoTimer > 0) {
          s.slowMoTimer -= delta;
          if (s.slowMoTimer <= 0) {
            s.speedMultiplier = 1.0;
            setIsSlowMo(false);
          }
        }

        // 1. 로터리 트래픽 차량 순환 이동
        trafficCars.forEach((tc) => {
          tc.angle += tc.speed * s.speedMultiplier * delta;
          tc.mesh.position.set(
            Math.cos(tc.angle) * CIRCLE_RADIUS,
            0.4,
            Math.sin(tc.angle) * CIRCLE_RADIUS
          );
          // 접선 방향으로 회전
          tc.mesh.rotation.y = -tc.angle + Math.PI / 2;

          // 바퀴 회전
          tc.wheels.forEach((w) => (w.rotation.x += tc.speed * 8 * delta));
        });

        // 2. 플레이어 차량 진입 이동 처리
        if (s.isEntering) {
          // 남쪽 진입로에서 로터리 하단 접점(Z = CIRCLE_RADIUS = 6.0)으로 직진 가속
          s.playerZ -= 9.5 * delta;
          playerCar.position.z = s.playerZ;

          playerWheels.forEach((w) => (w.rotation.x -= 14 * delta));

          // A. 로터리 진입 접점 도달 (Z <= CIRCLE_RADIUS = 6.0)
          if (s.playerZ <= CIRCLE_RADIUS) {
            s.isEntering = false;

            // 로터리 하단 진입 지점의 각도는 Math.PI / 2 (90도)
            const enterAngle = Math.PI / 2;

            // B. 충돌 검사: 기존 트래픽 차량 중 enterAngle 근처에 있는 차량 탐색
            let hasCrashed = false;
            trafficCars.forEach((tc) => {
              // 각도 차이 정규화 (-PI ~ PI)
              let diff = (tc.angle - enterAngle) % (Math.PI * 2);
              if (diff > Math.PI) diff -= Math.PI * 2;
              if (diff < -Math.PI) diff += Math.PI * 2;

              if (Math.abs(diff) < 0.48) {
                // 충돌 발생!
                hasCrashed = true;
              }
            });

            if (hasCrashed) {
              // 충돌!
              s.lives -= 1;
              setLives(s.lives);
              triggerHaptic([180, 80, 180]);

              spawnCrashSparksAt(0, 0.5, CIRCLE_RADIUS);

              // 진입 실패 ➔ 차량 원위치 리셋
              s.playerZ = 12.5;
              playerCar.position.set(0, 0.4, 12.5);
              playerCar.rotation.y = Math.PI;

              if (s.lives <= 0) {
                handleGameOver();
              }
            } else {
              // 합류 성공 (PERFECT MERGE!)
              s.mergedSuccess += 1;
              setMergedCount(s.mergedSuccess);
              setMergeBanner(`🚗 PERFECT MERGE! (${s.mergedSuccess}/${TARGET_MERGED_CARS})`);
              triggerHaptic([40, 20, 60]);
              setTimeout(() => setMergeBanner(null), 1200);

              // 새로운 진입 차량 리스폰
              s.playerZ = 12.5;
              playerCar.position.set(0, 0.4, 12.5);
              playerCar.rotation.y = Math.PI;

              // 승리 검사
              if (s.mergedSuccess >= TARGET_MERGED_CARS) {
                handleVictory();
              }
            }
          }
        }

        // 스파크 감쇠
        if ((sparkMat as THREE.PointsMaterial).opacity > 0) {
          (sparkMat as THREE.PointsMaterial).opacity -= delta * 2;
        }
      }

      // 승리 시 콘페티 분출 & 카메라 회전
      if (s.gameState === 'victory') {
        (confettiMat as THREE.PointsMaterial).opacity = 0.95;
        const pos = confettiGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < confettiCount; i++) {
          pos[i * 3 + 1] -= delta * 2.5;
          if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 8;
        }
        confettiGeo.attributes.position.needsUpdate = true;
        camera.position.x = Math.sin(clock.getElapsedTime() * 0.4) * 18;
        camera.position.z = Math.cos(clock.getElapsedTime() * 0.4) * 18;
        camera.lookAt(0, 1.5, 0);
      }

      renderer.render(scene, camera);
      threeRef.current!.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
        renderer.dispose();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cardId]);

  return (
    <div
      onClick={handleLaunchCar}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 text-white font-mono flex flex-col cursor-pointer"
    >
      {/* Three.js 3D 뷰포트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 상단 미니멀 HUD */}
      <MinimalistMissionHUD
        gameTitle="CAR CIRCLE 3D"
        onQuit={handleExit}
        progressPercent={Math.min(100, Math.round((mergedCount / TARGET_MERGED_CARS) * 100))}
        customScore={mergedCount}
        scoreLabel="MERGED"
        rewardPreview={35}
      />

      {/* 합류 성공 배너 */}
      {mergeBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-emerald-500 text-black px-4 py-1.5 rounded-sm font-black text-xs tracking-wider shadow-lg border border-emerald-300">
            {mergeBanner}
          </div>
        </div>
      )}

      {/* 게임 상태 바 (합류 수 & 하트) */}
      {gameState === 'playing' && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* 합류 실적 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm">
            <div className="text-[9px] text-slate-400">TARGET: {TARGET_MERGED_CARS} CARS</div>
            <div className="text-base font-black text-cyan-400 leading-none">
              {mergedCount} / {TARGET_MERGED_CARS}
            </div>
          </div>

          {/* 하트 실드 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm flex items-center gap-1.5">
            {[1, 2, 3].map((h) => (
              <span key={h} className={`text-base ${h <= lives ? 'text-red-500' : 'text-slate-600'}`}>
                ♥
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 게임 시작 대기 오버레이 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-1">
              [POKI POPULAR 110: NO.093]
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              CAR CIRCLE 3D
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              바쁜 원형 로터리 교차로에 차량을 안전하게 합류시키세요! 회전하는 차량들의 틈새를 노려 타이밍 맞춰 탭하고 12대 합류를 성공시키세요.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 p-3 mb-6 rounded-sm text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span>[✦] 공식 배지:</span> No.093 로터리 중앙 기념탑 및 차량 각인
              </div>
              <div className="flex items-center gap-2">
                <span>[👆 화면 탭]</span> 타이밍 맞춰 차량을 로터리에 진입
              </div>
              <div className="flex items-center gap-2">
                <span>[⏱️ SLOW-MO]</span> 위기 시 3초간 로터리 회전 속도 50% 감속
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span>[💥 충돌 주의]</span> 로터리 차량과 부딪히면 하트 1개 감소!
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-black text-lg rounded-sm tracking-wider uppercase shadow-lg transition-transform active:scale-95"
            >
              START TRAFFIC 🚦
            </button>
          </div>
        </div>
      )}

      {/* 게임오버 오버레이 */}
      {gameState === 'hit' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-3xl mb-2">💥</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">TRAFFIC ACCIDENT!</h2>
            <p className="text-xs text-slate-400 mb-4">연속 충돌로 로터리가 마비되었습니다. 합류 실적에 따라 보상이 정산됩니다.</p>

            <div className="bg-slate-950 p-3 rounded-sm border border-slate-800 mb-5 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">합류 성공:</span>
                <span className="font-bold text-cyan-400">
                  {mergedCount} / {TARGET_MERGED_CARS} 대
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm text-sm tracking-wider"
              >
                RETRY
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-sm text-sm"
              >
                QUIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승리 모달 */}
      {gameState === 'victory' && (
        <VictoryRewardModal
          isOpen={true}
          onClose={handleExit}
          receipt={rewardReceipt}
          title="ROUNDABOUT MASTER!"
          subtitle="12대 차량을 완벽한 타이밍으로 모두 합류시켰습니다!"
        />
      )}

      {/* 하단 모바일 퓨어 터치 액션 버튼 군 */}
      {gameState === 'playing' && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-auto z-20 pb-6 px-4 flex items-center justify-between pointer-events-auto max-w-md w-full mx-auto"
        >
          {/* 슬로우모션 힌트 버튼 */}
          <button
            onClick={handleTriggerSlowMo}
            disabled={slowMoCooldown}
            className={`flex-1 py-4 rounded-sm flex items-center justify-center gap-1.5 font-bold text-xs border transition-all ${
              isSlowMo
                ? 'bg-purple-600 border-purple-400 text-white animate-pulse'
                : slowMoCooldown
                ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'
                : 'bg-slate-900 active:bg-slate-800 border-purple-500/70 text-purple-300 shadow-lg'
            }`}
          >
            <span className="text-base">⏱️</span>
            <span>{isSlowMo ? 'SLOW-MO ON' : 'SLOW-MO'}</span>
          </button>

          {/* 대형 합류 버튼 */}
          <button
            onClick={handleLaunchCar}
            className="flex-2 py-4 bg-cyan-500 active:bg-cyan-600 border border-cyan-300 text-black font-black text-base rounded-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 transition-transform active:scale-95 ml-3"
          >
            <span className="text-xl">🚗</span>
            <span>MERGE NOW!</span>
          </button>
        </div>
      )}
    </div>
  );
}
