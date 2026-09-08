import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHillClimbRacingLiteGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface Coin3D {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  collected: boolean;
}

interface FuelCan3D {
  mesh: THREE.Group;
  x: number;
  y: number;
  collected: boolean;
}

const TARGET_DISTANCE = 350; // 목표 주행 거리 (미터)

export default function PokiHillClimbRacingLiteGame({
  onBack,
  onClose,
  cardId = 88,
  onExit
}: PokiHillClimbRacingLiteGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onClose || (() => {});

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'racing' | 'flipped' | 'outOfFuel' | 'victory'>('ready');
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [fuelPercent, setFuelPercent] = useState(100);
  const [coinsCount, setCoinsCount] = useState(0);
  const [isGasActive, setIsGasActive] = useState(false);
  const [isBrakeActive, setIsBrakeActive] = useState(false);
  const [airTimeBonusBanner, setAirTimeBonusBanner] = useState<string | null>(null);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Three.js 인스턴스 레프
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    jeep: THREE.Group;
    wheels: THREE.Mesh[];
    smokeParticles: THREE.Points;
    smokeGeo: THREE.BufferGeometry;
    coins: Coin3D[];
    fuels: FuelCan3D[];
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // 실시간 물리 시뮬레이션 상태 레프
  const physicsRef = useRef({
    gameState: 'ready' as 'ready' | 'racing' | 'flipped' | 'outOfFuel' | 'victory',
    x: 10,
    y: 1.5,
    vx: 0,
    vy: 0,
    angle: 0, // rad
    angVel: 0,
    fuel: 100,
    coins: 0,
    isGrounded: true,
    airTimer: 0,
    gasPressed: false,
    brakePressed: false,
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

  // 3D 지형 함수 (x 좌표에 따른 Y 높이 계산)
  const getTerrainY = useCallback((x: number) => {
    // 시작 20m는 안전 수평 광폭 플랫폼
    if (x <= 20) return 0;
    const relX = x - 20;
    return (
      Math.sin(relX * 0.035) * 4.2 +
      Math.cos(relX * 0.018) * 3.0 +
      Math.sin(relX * 0.075) * 1.6 +
      (relX > 120 ? Math.sin((relX - 120) * 0.04) * 4.8 : 0)
    );
  }, []);

  // 지형 기울기 (경사각 라디안)
  const getTerrainSlope = useCallback(
    (x: number) => {
      const delta = 0.5;
      const y1 = getTerrainY(x - delta);
      const y2 = getTerrainY(x + delta);
      return Math.atan2(y2 - y1, delta * 2);
    },
    [getTerrainY]
  );

  // 승리 처리
  const handleFinishVictory = useCallback(() => {
    physicsRef.current.gameState = 'victory';
    setGameState('victory');
    triggerHaptic([100, 50, 150]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokihillclimbracinglite',
      gameTitle: 'Hill Climb Racing Lite 3D',
      isVictory: true,
      score: Math.round(physicsRef.current.x + physicsRef.current.coins * 50),
      maxTargetScore: TARGET_DISTANCE + 1000,
      durationSeconds: 35,
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  // 전복 게임오버 처리
  const handleFlippedGameOver = useCallback(() => {
    physicsRef.current.gameState = 'flipped';
    setGameState('flipped');
    triggerHaptic([200, 100, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokihillclimbracinglite',
      gameTitle: 'Hill Climb Racing Lite 3D',
      isVictory: false,
      score: Math.round(physicsRef.current.x + physicsRef.current.coins * 50),
      maxTargetScore: TARGET_DISTANCE + 1000,
      durationSeconds: 20,
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  // 연료 고갈 게임오버 처리
  const handleOutOfFuelGameOver = useCallback(() => {
    physicsRef.current.gameState = 'outOfFuel';
    setGameState('outOfFuel');
    triggerHaptic([150, 100, 150]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokihillclimbracinglite',
      gameTitle: 'Hill Climb Racing Lite 3D',
      isVictory: false,
      score: Math.round(physicsRef.current.x + physicsRef.current.coins * 50),
      maxTargetScore: TARGET_DISTANCE + 1000,
      durationSeconds: 25,
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  // 게임 시작
  const startGame = useCallback(() => {
    physicsRef.current.gameState = 'racing';
    physicsRef.current.x = 10;
    physicsRef.current.y = 1.2;
    physicsRef.current.vx = 0;
    physicsRef.current.vy = 0;
    physicsRef.current.angle = 0;
    physicsRef.current.angVel = 0;
    physicsRef.current.fuel = 100;
    physicsRef.current.coins = 0;
    physicsRef.current.isGrounded = true;
    physicsRef.current.airTimer = 0;
    physicsRef.current.gasPressed = false;
    physicsRef.current.brakePressed = false;

    // 아이템 리셋
    if (threeRef.current) {
      threeRef.current.coins.forEach((c) => {
        c.collected = false;
        c.mesh.visible = true;
      });
      threeRef.current.fuels.forEach((f) => {
        f.collected = false;
        f.mesh.visible = true;
      });
    }

    setGameState('racing');
    setDistanceMeters(10);
    setFuelPercent(100);
    setCoinsCount(0);
    setRewardReceipt(null);
    triggerHaptic(50);
  }, [triggerHaptic]);

  // Three.js 씬 초기화
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc); // 화창한 스카이 블루
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.006);

    // Camera (측면 2.5D 팔로우 뷰)
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 400);
    camera.position.set(10, 6, 18);
    camera.lookAt(10, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    sunLight.position.set(20, 40, 25);
    scene.add(sunLight);

    // No.088 공식 카드 영웅 배지 텍스처
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 256;
    heroCanvas.height = 256;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, cardId, 18, 18, 220, 220, { circleClip: true });
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.needsUpdate = true;

    // --- 3D 롤링 힐스 지형 생성 (400m 연속 지형) ---
    const SEGMENTS = 800;
    const TRACK_LENGTH = 400;
    const TRACK_WIDTH = 8;
    const terrainGeo = new THREE.PlaneGeometry(TRACK_LENGTH, TRACK_WIDTH, SEGMENTS, 1);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i) + TRACK_LENGTH / 2; // 0 ~ 400
      const y = getTerrainY(x);
      posAttr.setX(i, x);
      posAttr.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x65a30d, // 잔디 그린
      roughness: 0.8,
      metalness: 0.1,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    // 지형 언더소일 (단면 흙벽)
    const underSoilGeo = new THREE.BoxGeometry(TRACK_LENGTH, 12, TRACK_WIDTH);
    const underSoilMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const underSoil = new THREE.Mesh(underSoilGeo, underSoilMat);
    underSoil.position.set(TRACK_LENGTH / 2, -6, 0);
    scene.add(underSoil);

    // 시작 지점(X=10) 바닥 No.088 공식 영웅 배지 엠블럼
    const startBadgeGeo = new THREE.PlaneGeometry(5, 5);
    const startBadgeMat = new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true });
    const startBadge = new THREE.Mesh(startBadgeGeo, startBadgeMat);
    startBadge.rotation.x = -Math.PI / 2;
    startBadge.position.set(10, 0.05, 0);
    scene.add(startBadge);

    // 결승선 아치 (X = 350)
    const finishArch = new THREE.Group();
    finishArch.position.set(TARGET_DISTANCE, getTerrainY(TARGET_DISTANCE), 0);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 6, 12), pillarMat);
    p1.position.set(0, 3, -3.5);
    finishArch.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 6, 12), pillarMat);
    p2.position.set(0, 3, 3.5);
    finishArch.add(p2);

    const bannerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.2, 7.2),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
    );
    bannerMesh.position.set(0, 5.4, 0);
    finishArch.add(bannerMesh);
    scene.add(finishArch);

    // --- 3D 클래식 레드 힐 클라이머 지프 제작 ---
    const jeep = new THREE.Group();
    jeep.position.set(10, 1.2, 0);

    // 빨간 섀시 바디
    const bodyGeo = new THREE.BoxGeometry(2.4, 0.6, 1.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.4, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    jeep.add(body);

    // 도어 옆면 No.088 공식 카드 영웅 배지 데칼
    const decalGeo = new THREE.PlaneGeometry(0.8, 0.8);
    const decalMat = new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true });
    const decal = new THREE.Mesh(decalGeo, decalMat);
    decal.position.set(0, 0.55, 0.71);
    jeep.add(decal);

    // 롤케이지 프레임 (블랙 튜브)
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
    const rollCage = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.2), tubeMat);
    rollCage.position.set(-0.2, 1.15, 0);
    jeep.add(rollCage);

    // 드라이버 머리 & 모자
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 })
    );
    head.position.set(-0.1, 1.25, 0);
    jeep.add(head);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    cap.position.set(-0.1, 1.42, 0);
    jeep.add(cap);

    // 4개 대형 오프로드 휠
    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 16);
    wheelGeo.rotateX(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6 });

    const wheelOffsets = [
      [-0.9, 0.25, 0.75],
      [0.9, 0.25, 0.75],
      [-0.9, 0.25, -0.75],
      [0.9, 0.25, -0.75],
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(wx, wy, wz);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.36, 10), rimMat);
      rim.rotateX(Math.PI / 2);
      wheel.add(rim);

      jeep.add(wheel);
      wheels.push(wheel);
    });

    scene.add(jeep);

    // --- 아이템 배치 (코인 & 연료통) ---
    const coins: Coin3D[] = [];
    const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 12);
    coinGeo.rotateZ(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    for (let cx = 35; cx < TARGET_DISTANCE; cx += 25) {
      const cy = getTerrainY(cx) + 1.2;
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.position.set(cx, cy, 0);
      scene.add(coinMesh);
      coins.push({ mesh: coinMesh, x: cx, y: cy, collected: false });
    }

    const fuels: FuelCan3D[] = [];
    for (let fx = 75; fx < TARGET_DISTANCE; fx += 70) {
      const fy = getTerrainY(fx) + 1.2;
      const fuelGroup = new THREE.Group();
      fuelGroup.position.set(fx, fy, 0);

      const can = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.35),
        new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 })
      );
      fuelGroup.add(can);

      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.04, 6, 12, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x18181b })
      );
      handle.position.y = 0.45;
      fuelGroup.add(handle);

      scene.add(fuelGroup);
      fuels.push({ mesh: fuelGroup, x: fx, y: fy, collected: false });
    }

    // --- 배기 연기 파티클 ---
    const smokeCount = 30;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount * 3; i++) smokePos[i] = 0;
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.3, transparent: true, opacity: 0.6 });
    const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    scene.add(smokeParticles);

    const clock = new THREE.Clock();

    threeRef.current = {
      scene,
      camera,
      renderer,
      jeep,
      wheels,
      smokeParticles,
      smokeGeo,
      coins,
      fuels,
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

    // 물리 및 렌더링 루프
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const p = physicsRef.current;

      if (p.gameState === 'racing') {
        // 1. 연료 소모
        if (p.gasPressed) {
          p.fuel = Math.max(0, p.fuel - delta * 4.5);
        } else {
          p.fuel = Math.max(0, p.fuel - delta * 1.5);
        }
        setFuelPercent(Math.round(p.fuel));

        if (p.fuel <= 0 && Math.abs(p.vx) < 0.2) {
          handleOutOfFuelGameOver();
        }

        // 2. 지형 높이 및 접지 검사
        const terrainY = getTerrainY(p.x);
        const slope = getTerrainSlope(p.x);
        const wheelGroundY = terrainY + 0.65;

        // 중력
        p.vy -= 22 * delta;

        // 조작 입력 가속/감속
        const canAccelerate = p.fuel > 0;
        if (p.gasPressed && canAccelerate) {
          if (p.isGrounded) {
            // 지면 가속 (지형 경사면 방향으로 추진)
            p.vx += Math.cos(slope) * 28 * delta;
            p.vy += Math.sin(slope) * 28 * delta;
            // 앞바퀴 들림 토크 (시계 반대 방향 회전)
            p.angVel += 1.8 * delta;
          } else {
            // 공중 백플립 토크
            p.angVel += 3.8 * delta;
          }
        }

        if (p.brakePressed) {
          if (p.isGrounded) {
            // 제동
            p.vx -= 32 * delta;
            // 앞바퀴 숙임 토크
            p.angVel -= 2.2 * delta;
          } else {
            // 공중 프론트플립 토크
            p.angVel -= 3.8 * delta;
          }
        }

        // 지면 마찰 저항
        if (p.isGrounded) {
          p.vx *= Math.pow(0.97, delta * 60);
          p.angVel *= Math.pow(0.9, delta * 60);
        } else {
          // 공중 공기저항
          p.vx *= Math.pow(0.995, delta * 60);
          p.angVel *= Math.pow(0.96, delta * 60);
          p.airTimer += delta;
        }

        // 위치 적분
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.angle += p.angVel * delta;

        // 지면 충돌 & 지형 접지 탄성
        if (p.y <= wheelGroundY) {
          p.y = wheelGroundY;
          p.vy = 0;
          p.isGrounded = true;

          // 공중 체공 보너스 정산
          if (p.airTimer > 1.2) {
            setAirTimeBonusBanner(`🚀 AIR TIME! +${Math.round(p.airTimer * 100)}`);
            triggerHaptic(30);
            setTimeout(() => setAirTimeBonusBanner(null), 1200);
          }
          p.airTimer = 0;

          // 차체 각도 지형 경사에 스냅 보정
          const targetAngle = slope;
          p.angle = THREE.MathUtils.lerp(p.angle, targetAngle, delta * 12);
        } else {
          p.isGrounded = false;
        }

        // 후진 한계
        p.x = Math.max(5, p.x);

        // 3. 전복(Neck Snap) 판정
        // 각도가 너무 뒤집혀 차체 윗부분이 지면 근처에 닿았을 때
        const normAngle = ((p.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const isUpsideDown = normAngle > Math.PI * 0.55 && normAngle < Math.PI * 1.45;
        if (isUpsideDown && p.y <= wheelGroundY + 0.3 && p.isGrounded) {
          handleFlippedGameOver();
        }

        // 4. 결승 도달 검사
        if (p.x >= TARGET_DISTANCE) {
          handleFinishVictory();
        }

        // 5. 아이템 수집 판정 (코인 & 연료통)
        coins.forEach((c) => {
          if (!c.collected && Math.abs(p.x - c.x) < 1.6 && Math.abs(p.y - c.y) < 1.8) {
            c.collected = true;
            c.mesh.visible = false;
            p.coins += 1;
            setCoinsCount(p.coins);
            triggerHaptic(40);
          }
        });

        fuels.forEach((f) => {
          if (!f.collected && Math.abs(p.x - f.x) < 1.8 && Math.abs(p.y - f.y) < 1.8) {
            f.collected = true;
            f.mesh.visible = false;
            p.fuel = 100;
            setFuelPercent(100);
            triggerHaptic([60, 40, 80]);
          }
        });

        // 6. 3D 지프 메쉬 동기화
        jeep.position.set(p.x, p.y, 0);
        jeep.rotation.z = p.angle;

        // 바퀴 회전
        const wheelRot = -p.vx * delta * 4;
        wheels.forEach((w) => {
          w.rotation.z += wheelRot;
        });

        // 코인/연료 회전
        coins.forEach((c) => {
          if (!c.collected) c.mesh.rotation.y += delta * 3;
        });
        fuels.forEach((f) => {
          if (!f.collected) f.mesh.rotation.y += delta * 2;
        });

        // 7. 배기 연기 파티클
        if (p.gasPressed) {
          const sPos = smokeGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < smokeCount; i++) {
            sPos[i * 3] = jeep.position.x - 1.2 - Math.random() * 0.6;
            sPos[i * 3 + 1] = jeep.position.y + 0.2 + Math.random() * 0.4;
            sPos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
          }
          smokeGeo.attributes.position.needsUpdate = true;
        }

        // UI 동기화
        setDistanceMeters(Math.min(TARGET_DISTANCE, Math.round(p.x)));
      }

      // 카메라 팔로우
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, p.x + 4.5, delta * 6);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, p.y + 3.8, delta * 6);
      camera.lookAt(p.x + 3.0, p.y + 1.2, 0);

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
  }, [cardId, getTerrainSlope, getTerrainY, handleFlippedGameOver, handleFinishVictory, handleOutOfFuelGameOver, triggerHaptic]);

  // GAS 버튼
  const handleGasStart = () => {
    physicsRef.current.gasPressed = true;
    setIsGasActive(true);
    triggerHaptic(30);
  };
  const handleGasEnd = () => {
    physicsRef.current.gasPressed = false;
    setIsGasActive(false);
  };

  // BRAKE 버튼
  const handleBrakeStart = () => {
    physicsRef.current.brakePressed = true;
    setIsBrakeActive(true);
    triggerHaptic(30);
  };
  const handleBrakeEnd = () => {
    physicsRef.current.brakePressed = false;
    setIsBrakeActive(false);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-sky-300 text-slate-900 font-mono flex flex-col">
      {/* Three.js 3D 뷰포트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 상단 미니멀 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="HILL CLIMB 3D"
        onQuit={handleExit}
        progressPercent={Math.min(100, Math.round((distanceMeters / TARGET_DISTANCE) * 100))}
        customScore={distanceMeters}
        scoreLabel="DIST (M)"
        rewardPreview={35}
      />

      {/* 체공 보너스 배너 */}
      {airTimeBonusBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-amber-500 text-black px-4 py-1.5 rounded-sm font-black text-xs tracking-wider shadow-lg border border-amber-300">
            {airTimeBonusBanner}
          </div>
        </div>
      )}

      {/* 연료 & 코인 상태 바 */}
      {gameState === 'racing' && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* 연료 게이지 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm flex items-center gap-2 text-white">
            <span className="text-xs">⛽</span>
            <div className="w-24 bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  fuelPercent > 30 ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold">{fuelPercent}%</span>
          </div>

          {/* 코인 카운트 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm flex items-center gap-1.5 text-amber-300 text-xs font-bold">
            <span>🪙</span>
            <span>{coinsCount}</span>
          </div>
        </div>
      )}

      {/* 게임 시작 대기 오버레이 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs p-6 text-center text-white">
          <div className="max-w-md w-full bg-slate-900 border border-lime-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-xs text-lime-400 font-bold tracking-widest uppercase mb-1">
              [POKI POPULAR 110: NO.088]
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              HILL CLIMB RACING LITE 3D
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              험준한 3D 언덕길을 완급 조절하며 달리는 오프로드 힐 클라이밍 레이싱! 차가 뒤집히지 않도록 균형을 잡고 연료를 보충하며 350m 결승선에 도달하세요.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 p-3 mb-6 rounded-sm text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-lime-300 font-bold">
                <span>[✦] 공식 배지:</span> No.088 지프 도어 및 스타트 라인 장착
              </div>
              <div className="flex items-center gap-2">
                <span>[⛽ GAS]</span> 우측 버튼으로 가속 및 뒤로 기울이기
              </div>
              <div className="flex items-center gap-2">
                <span>[🛑 BRAKE]</span> 좌측 버튼으로 제동 및 앞으로 기울이기
              </div>
              <div className="flex items-center gap-2">
                <span>[⚠️ 전복 주의]</span> 머리가 바닥에 닿으면 즉시 게임오버!
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-lime-500 hover:bg-lime-400 active:bg-lime-600 text-black font-black text-lg rounded-sm tracking-wider uppercase shadow-lg transition-transform active:scale-95"
            >
              START CLIMB 🏁
            </button>
          </div>
        </div>
      )}

      {/* 전복 / 연료 고갈 게임오버 오버레이 */}
      {(gameState === 'flipped' || gameState === 'outOfFuel') && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs p-6 text-center text-white">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-3xl mb-2">{gameState === 'flipped' ? '💥' : '⛽'}</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">
              {gameState === 'flipped' ? 'DRIVER DOWN!' : 'OUT OF FUEL!'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {gameState === 'flipped'
                ? '차량이 전복되었습니다. 주행 실적에 따라 보상이 정산됩니다.'
                : '연료가 모두 소진되었습니다. 다음엔 연료통을 놓치지 마세요!'}
            </p>

            <div className="bg-slate-950 p-3 rounded-sm border border-slate-800 mb-5 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">주행 거리:</span>
                <span className="font-bold text-white">{distanceMeters} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">획득 코인:</span>
                <span className="font-bold text-amber-400">{coinsCount} 개</span>
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
          title="HILL CONQUERED!"
          subtitle="350m 험난한 언덕길을 완벽하게 완주했습니다!"
        />
      )}

      {/* 하단 모바일 퓨어 터치 페달 컨트롤러 (100% 모바일 퓨어 제스처 준수) */}
      {gameState === 'racing' && (
        <div className="mt-auto z-20 pb-6 px-6 flex items-center justify-between pointer-events-auto">
          {/* 좌측: 64px [🛑 BRAKE] 페달 */}
          <button
            onTouchStart={handleBrakeStart}
            onTouchEnd={handleBrakeEnd}
            onMouseDown={handleBrakeStart}
            onMouseUp={handleBrakeEnd}
            className={`w-20 h-20 rounded-sm flex flex-col items-center justify-center font-black border transition-all ${
              isBrakeActive
                ? 'bg-red-600 border-red-400 text-white scale-95 shadow-inner'
                : 'bg-slate-900/90 border-slate-700 text-red-400 shadow-xl'
            }`}
          >
            <span className="text-xl">🛑</span>
            <span className="text-[10px] mt-1 tracking-wider">BRAKE</span>
          </button>

          {/* 우측: 76px [⛽ GAS] 대형 페달 */}
          <button
            onTouchStart={handleGasStart}
            onTouchEnd={handleGasEnd}
            onMouseDown={handleGasStart}
            onMouseUp={handleGasEnd}
            className={`w-24 h-24 rounded-sm flex flex-col items-center justify-center font-black border transition-all ${
              isGasActive
                ? 'bg-lime-500 border-lime-300 text-black scale-95 shadow-lime-500/50'
                : 'bg-slate-900/90 border-lime-500/80 text-lime-400 shadow-2xl'
            }`}
          >
            <span className="text-2xl">⛽</span>
            <span className="text-xs mt-1 tracking-wider font-black">GAS</span>
          </button>
        </div>
      )}
    </div>
  );
}
