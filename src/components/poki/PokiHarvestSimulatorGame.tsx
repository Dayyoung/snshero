import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiHarvestSimulatorGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface Crop3D {
  mesh: THREE.Group;
  x: number;
  z: number;
  type: 'wheat' | 'sunflower';
  harvested: boolean;
}

const TARGET_EARNINGS = 500; // 목표 수확 수익 ($500)
const MAX_TANK_CAPACITY = 60; // 곡물 탱크 최대 용량 (kg)
const SILO_X = -10;
const SILO_Z = -8;

export default function PokiHarvestSimulatorGame({
  onBack,
  onClose,
  cardId = 92,
}: PokiHarvestSimulatorGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onClose || (() => {});

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory'>('ready');
  const [earnings, setEarnings] = useState(0);
  const [tankLoad, setTankLoad] = useState(0);
  const [isNearSilo, setIsNearSilo] = useState(false);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 다이나믹 플로팅 조이스틱 UI 상태
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Three.js 인스턴스 레프
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    harvester: THREE.Group;
    cutterReel: THREE.Mesh;
    wheels: THREE.Mesh[];
    crops: Crop3D[];
    sparks: THREE.Points;
    sparkGeo: THREE.BufferGeometry;
    confetti: THREE.Points;
    confettiGeo: THREE.BufferGeometry;
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // 실시간 제어 레프
  const stateRef = useRef({
    gameState: 'ready' as 'ready' | 'playing' | 'victory',
    posX: 0,
    posZ: 4,
    angle: 0, // rad
    speed: 0,
    moveX: 0,
    moveZ: 0,
    isBoost: false,
    grainTank: 0,
    totalEarnings: 0,
    surviveSeconds: 0,
    touchId: null as number | null,
    touchOriginX: 0,
    touchOriginY: 0,
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
      gameId: 'pokiharvestsimulator',
      gameTitle: 'Harvest Simulator 3D',
      isVictory: true,
      score: TARGET_EARNINGS,
      maxTargetScore: TARGET_EARNINGS,
      durationSeconds: Math.round(stateRef.current.surviveSeconds),
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  // 스파클 파티클 생성
  const spawnHarvestParticlesAt = useCallback((x: number, y: number, z: number, isGold: boolean) => {
    if (!threeRef.current) return;
    const { sparks, sparkGeo } = threeRef.current;
    const pos = sparkGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = y + Math.random() * 1.2;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 1.5;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    (sparks.material as THREE.PointsMaterial).color.setHex(isGold ? 0xfacc15 : 0xeab308);
    (sparks.material as THREE.PointsMaterial).opacity = 1.0;
  }, []);

  // 사일로 곡물 하역 ([📦 UNLOAD])
  const handleUnloadAtSilo = useCallback(() => {
    const s = stateRef.current;
    if (s.grainTank <= 0) {
      setStatusMessage('적재함이 비어있습니다!');
      setTimeout(() => setStatusMessage(null), 1200);
      return;
    }

    const earnedCash = Math.round(s.grainTank * 2.5);
    s.totalEarnings += earnedCash;
    s.grainTank = 0;

    setEarnings(s.totalEarnings);
    setTankLoad(0);
    setStatusMessage(`💰 사일로 곡물 하역 완료! +$${earnedCash}`);
    triggerHaptic([60, 40, 80]);
    setTimeout(() => setStatusMessage(null), 1500);

    // 승리 검사
    if (s.totalEarnings >= TARGET_EARNINGS) {
      handleVictory();
    }
  }, [handleVictory, triggerHaptic]);

  // 게임 시작
  const startGame = useCallback(() => {
    stateRef.current.gameState = 'playing';
    stateRef.current.posX = 0;
    stateRef.current.posZ = 4;
    stateRef.current.angle = 0;
    stateRef.current.speed = 0;
    stateRef.current.grainTank = 0;
    stateRef.current.totalEarnings = 0;
    stateRef.current.surviveSeconds = 0;

    // 작물 리셋
    if (threeRef.current) {
      threeRef.current.crops.forEach((c) => {
        c.harvested = false;
        c.mesh.visible = true;
        c.mesh.scale.set(1, 1, 1);
      });
    }

    setGameState('playing');
    setEarnings(0);
    setTankLoad(0);
    setRewardReceipt(null);
    triggerHaptic(50);
  }, [triggerHaptic]);

  // Three.js 씬 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc); // 맑고 화창한 농장 하늘
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.008);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 15, 16);
    camera.lookAt(0, 1.0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    sunLight.position.set(20, 35, 20);
    scene.add(sunLight);

    // No.092 공식 카드 영웅 배지 텍스처
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 256;
    heroCanvas.height = 256;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, cardId, 18, 18, 220, 220, { circleClip: true });
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.needsUpdate = true;

    // --- 3D 농장 필드 (28m x 24m) ---
    const FIELD_W = 28;
    const FIELD_L = 24;

    const groundGeo = new THREE.PlaneGeometry(FIELD_W, FIELD_L);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e, // 비옥한 흙바닥 톤
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 목재 울타리 (외곽)
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 8);
    for (let fx = -FIELD_W / 2; fx <= FIELD_W / 2; fx += 3.5) {
      const p1 = new THREE.Mesh(postGeo, fenceMat);
      p1.position.set(fx, 0.7, -FIELD_L / 2);
      scene.add(p1);
      const p2 = new THREE.Mesh(postGeo, fenceMat);
      p2.position.set(fx, 0.7, FIELD_L / 2);
      scene.add(p2);
    }
    for (let fz = -FIELD_L / 2; fz <= FIELD_L / 2; fz += 3.5) {
      const p1 = new THREE.Mesh(postGeo, fenceMat);
      p1.position.set(-FIELD_W / 2, 0.7, fz);
      scene.add(p1);
      const p2 = new THREE.Mesh(postGeo, fenceMat);
      p2.position.set(FIELD_W / 2, 0.7, fz);
      scene.add(p2);
    }

    // --- 사일로 타워 및 하역 구역 (X = SILO_X, Z = SILO_Z) ---
    const siloGroup = new THREE.Group();
    siloGroup.position.set(SILO_X, 0, SILO_Z);

    // 원통형 사일로 본체
    const siloBody = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 7.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.4, roughness: 0.4 })
    );
    siloBody.position.y = 3.75;
    siloGroup.add(siloBody);

    // 사일로 돔 지붕
    const siloRoof = new THREE.Mesh(
      new THREE.SphereGeometry(2.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
    );
    siloRoof.position.y = 7.5;
    siloGroup.add(siloRoof);

    // 사일로 벽면 No.092 공식 영웅 배지 엠블럼
    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.8),
      new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true })
    );
    badgeMesh.position.set(0, 4.0, 2.25);
    siloGroup.add(badgeMesh);

    // 하역 패드 (노란색 점선 링)
    const padGeo = new THREE.RingGeometry(1.5, 3.2, 16);
    const padMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const unloadPad = new THREE.Mesh(padGeo, padMat);
    unloadPad.rotation.x = -Math.PI / 2;
    unloadPad.position.set(3.5, 0.02, 0);
    siloGroup.add(unloadPad);

    scene.add(siloGroup);

    // --- 3D 대형 콤바인 수확기 메쉬 제작 ---
    const harvester = new THREE.Group();
    harvester.position.set(0, 0.5, 4);

    // 트랙터 섀시 본체 (올리브 그린)
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.4, 3.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    harvester.add(body);

    // 캐빈 콕핏 글래스
    const cabinGeo = new THREE.BoxGeometry(1.8, 1.1, 1.4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.75 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 2.0, -0.6);
    harvester.add(cabin);

    // 차체 도어 No.092 공식 영웅 배지 데칼
    const doorDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.85),
      new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true })
    );
    doorDecal.rotation.y = Math.PI / 2;
    doorDecal.position.set(1.21, 1.1, 0);
    harvester.add(doorDecal);

    // 전면 와이드 회전 커터 릴 (헤더)
    const reelGeo = new THREE.CylinderGeometry(0.5, 0.5, 3.4, 8);
    reelGeo.rotateZ(Math.PI / 2);
    const reelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const cutterReel = new THREE.Mesh(reelGeo, reelMat);
    cutterReel.position.set(0, 0.55, -2.4);
    harvester.add(cutterReel);

    // 4개 대형 휠
    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });

    const wheelOffsets = [
      [-1.3, 0.55, -1.0],
      [1.3, 0.55, -1.0],
      [-1.3, 0.55, 1.2],
      [1.3, 0.55, 1.2],
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(wx, wy, wz);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.42, 8), rimMat);
      rim.rotateZ(Math.PI / 2);
      wheel.add(rim);

      harvester.add(wheel);
      wheels.push(wheel);
    });

    scene.add(harvester);

    // --- 3D 밀 & 해바라기 작물 필드 배치 (약 70개) ---
    const crops: Crop3D[] = [];
    const wheatStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6);
    const wheatMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.7 });
    const sunflowerHeadGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12);
    const sunflowerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });

    for (let cx = -9; cx <= 10; cx += 2.2) {
      for (let cz = -7; cz <= 8; cz += 2.2) {
        // 사일로 주변 제외
        if (Math.hypot(cx - SILO_X, cz - SILO_Z) < 5.0) continue;

        const cropGroup = new THREE.Group();
        const isSunflower = (cx + cz) % 4 === 0;

        if (!isSunflower) {
          // 밀 다발
          for (let i = 0; i < 3; i++) {
            const stem = new THREE.Mesh(wheatStemGeo, wheatMat);
            stem.position.set((Math.random() - 0.5) * 0.25, 0.55, (Math.random() - 0.5) * 0.25);
            stem.rotation.z = (Math.random() - 0.5) * 0.2;
            cropGroup.add(stem);
          }
        } else {
          // 해바라기
          const stem = new THREE.Mesh(wheatStemGeo, new THREE.MeshStandardMaterial({ color: 0x65a30d }));
          stem.position.y = 0.55;
          cropGroup.add(stem);

          const flower = new THREE.Mesh(sunflowerHeadGeo, sunflowerMat);
          flower.position.set(0, 1.1, 0);
          flower.rotation.x = 0.4;
          cropGroup.add(flower);
        }

        cropGroup.position.set(cx, 0, cz);
        scene.add(cropGroup);

        crops.push({
          mesh: cropGroup,
          x: cx,
          z: cz,
          type: isSunflower ? 'sunflower' : 'wheat',
          harvested: false,
        });
      }
    }

    // --- 파티클 시스템 (수확 스파크 & 승리 콘페티) ---
    // 1) 수확 볏짚/꽃가루 스파크
    const sparkCount = 60;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) sparkPos[i] = 0;
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0xfacc15, size: 0.35, transparent: true, opacity: 0 });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // 2) 승리 콘페티
    const confettiCount = 80;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPos = new Float32Array(confettiCount * 3);
    for (let i = 0; i < confettiCount; i++) {
      confettiPos[i * 3] = (Math.random() - 0.5) * 16;
      confettiPos[i * 3 + 1] = Math.random() * 8 + 1;
      confettiPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPos, 3));
    const confettiMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.4, transparent: true, opacity: 0 });
    const confetti = new THREE.Points(confettiGeo, confettiMat);
    scene.add(confetti);

    const clock = new THREE.Clock();

    threeRef.current = {
      scene,
      camera,
      renderer,
      harvester,
      cutterReel,
      wheels,
      crops,
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

        // 1. 조이스틱 입력 처리 (Screen-relative 완벽 일치)
        const inputLen = Math.hypot(s.moveX, s.moveZ);
        if (inputLen > 0.1) {
          // 목표 진행 각도 계산
          const targetAngle = Math.atan2(s.moveX, s.moveZ);
          // 부드러운 차체 회전
          s.angle = THREE.MathUtils.lerp(s.angle, targetAngle, delta * 6);

          // 속도 계산 (부스트 시 1.7배)
          const baseSpeed = s.isBoost ? 8.5 : 5.0;
          s.speed = THREE.MathUtils.lerp(s.speed, baseSpeed, delta * 5);
        } else {
          s.speed = THREE.MathUtils.lerp(s.speed, 0, delta * 6);
        }

        // 콤바인 위치 업데이트 (전방 방향으로 전진)
        s.posX += Math.sin(s.angle) * s.speed * delta;
        s.posZ += Math.cos(s.angle) * s.speed * delta;

        // 농장 울타리 경계 제한
        s.posX = THREE.MathUtils.clamp(s.posX, -FIELD_W / 2 + 1.8, FIELD_W / 2 - 1.8);
        s.posZ = THREE.MathUtils.clamp(s.posZ, -FIELD_L / 2 + 1.8, FIELD_L / 2 - 1.8);

        // 콤바인 메쉬 동기화
        harvester.position.set(s.posX, 0, s.posZ);
        harvester.rotation.y = s.angle + Math.PI; // 모델링 정면 보정

        // 휠 회전 & 커터 헤더 고속 회전
        const wheelRot = s.speed * delta * 4;
        wheels.forEach((w) => (w.rotation.x += wheelRot));
        cutterReel.rotation.x += s.speed * delta * (s.isBoost ? 18 : 10);

        // 2. 작물 수확 판정 (전면 커터 위치 기준)
        const cutterWorldPos = new THREE.Vector3(0, 0.5, -2.4);
        cutterWorldPos.applyMatrix4(harvester.matrixWorld);

        crops.forEach((c) => {
          if (!c.harvested) {
            const dist = Math.hypot(cutterWorldPos.x - c.x, cutterWorldPos.z - c.z);
            if (dist < 2.0) {
              if (s.grainTank < MAX_TANK_CAPACITY) {
                c.harvested = true;
                c.mesh.visible = false;
                s.grainTank = Math.min(MAX_TANK_CAPACITY, s.grainTank + (c.type === 'sunflower' ? 3 : 2));
                setTankLoad(s.grainTank);

                spawnHarvestParticlesAt(c.x, 0.6, c.z, c.type === 'sunflower');
                triggerHaptic(20);
              }
            }
          }
        });

        // 3. 사일로 하역존 근접 감지
        const distToSilo = Math.hypot(s.posX - (SILO_X + 3.5), s.posZ - SILO_Z);
        setIsNearSilo(distToSilo < 4.0);

        // 스파클 감쇠
        if ((sparkMat as THREE.PointsMaterial).opacity > 0) {
          (sparkMat as THREE.PointsMaterial).opacity -= delta * 2;
        }
      }

      // 카메라 부드러운 팔로우
      if (s.gameState === 'victory') {
        (confettiMat as THREE.PointsMaterial).opacity = 0.95;
        const pos = confettiGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < confettiCount; i++) {
          pos[i * 3 + 1] -= delta * 2.5;
          if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 8;
        }
        confettiGeo.attributes.position.needsUpdate = true;
        camera.position.x = Math.sin(clock.getElapsedTime() * 0.4) * 16;
        camera.position.z = Math.cos(clock.getElapsedTime() * 0.4) * 16;
        camera.lookAt(0, 1.5, 0);
      } else {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, s.posX, delta * 4);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, s.posZ + 14, delta * 4);
        camera.lookAt(s.posX, 1.0, s.posZ);
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
  }, [cardId, spawnHarvestParticlesAt, triggerHaptic]);

  // 다이나믹 플로팅 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (stateRef.current.gameState !== 'playing') return;
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth * 0.6) {
      stateRef.current.touchId = touch.identifier;
      stateRef.current.touchOriginX = touch.clientX;
      stateRef.current.touchOriginY = touch.clientY;
      setJoystickPos({ x: touch.clientX, y: touch.clientY });
      setKnobPos({ x: 0, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (stateRef.current.gameState !== 'playing' || stateRef.current.touchId === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === stateRef.current.touchId) {
        const dx = touch.clientX - stateRef.current.touchOriginX;
        const dy = touch.clientY - stateRef.current.touchOriginY;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;

        let clampX = dx;
        let clampY = dy;
        if (dist > maxRadius) {
          clampX = (dx / dist) * maxRadius;
          clampY = (dy / dist) * maxRadius;
        }

        setKnobPos({ x: clampX, y: clampY });

        // 화면 기준 정렬 (오른쪽 = +X, 왼쪽 = -X, 위 = -Z, 아래 = +Z)
        stateRef.current.moveX = clampX / maxRadius;
        stateRef.current.moveZ = clampY / maxRadius;
      }
    }
  };

  const handleTouchEnd = () => {
    stateRef.current.touchId = null;
    stateRef.current.moveX = 0;
    stateRef.current.moveZ = 0;
    setJoystickPos(null);
    setKnobPos({ x: 0, y: 0 });
  };

  // 부스트 버튼
  const handleBoostStart = () => {
    stateRef.current.isBoost = true;
    setIsBoostActive(true);
    triggerHaptic(30);
  };
  const handleBoostEnd = () => {
    stateRef.current.isBoost = false;
    setIsBoostActive(false);
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 text-white font-mono flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js 3D 뷰포트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 상단 미니멀 HUD */}
      <MinimalistMissionHUD
        gameTitle="HARVEST SIMULATOR 3D"
        onQuit={handleExit}
        progressPercent={Math.min(100, Math.round((earnings / TARGET_EARNINGS) * 100))}
        customScore={earnings}
        scoreLabel="REVENUE ($)"
        rewardPreview={35}
      />

      {/* 상태 알림 토스트 배너 */}
      {statusMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-amber-400 text-black px-4 py-1.5 rounded-sm font-black text-xs tracking-wider shadow-lg border border-amber-300">
            {statusMessage}
          </div>
        </div>
      )}

      {/* 수익 & 적재함 상태 바 */}
      {gameState === 'playing' && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* 수익 ($) */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm">
            <div className="text-[9px] text-slate-400">TARGET: ${TARGET_EARNINGS}</div>
            <div className="text-base font-black text-amber-400 leading-none">${earnings}</div>
          </div>

          {/* 적재함 게이지 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm flex items-center gap-2">
            <span className="text-xs">🌾</span>
            <div className="w-24 bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  tankLoad < MAX_TANK_CAPACITY ? 'bg-lime-400' : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${(tankLoad / MAX_TANK_CAPACITY) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold">
              {tankLoad}/{MAX_TANK_CAPACITY}kg
            </span>
          </div>
        </div>
      )}

      {/* 다이나믹 플로팅 조이스틱 시각 피드백 */}
      {joystickPos && (
        <div
          className="absolute z-30 pointer-events-none w-24 h-24 rounded-full border-2 border-lime-400/40 bg-lime-950/20 backdrop-blur-xs flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{ left: joystickPos.x, top: joystickPos.y }}
        >
          <div
            className="w-10 h-10 rounded-full bg-lime-400/80 shadow-lg shadow-lime-400/50"
            style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
          />
        </div>
      )}

      {/* 게임 시작 대기 오버레이 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-lime-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-xs text-lime-400 font-bold tracking-widest uppercase mb-1">
              [POKI POPULAR 110: NO.092]
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              HARVEST SIMULATOR 3D
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              거대한 콤바인 트랙터를 몰아 황금빛 밀과 해바라기를 수확하세요! 적재함을 가득 채워 사일로에 하역하고 $500를 달성하세요.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 p-3 mb-6 rounded-sm text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-lime-300 font-bold">
                <span>[✦] 공식 배지:</span> No.092 콤바인 도어 및 사일로 타워 각인
              </div>
              <div className="flex items-center gap-2">
                <span>[🕹️ 조이스틱]</span> 좌측 화면 터치 드래그로 360° 자유 주행
              </div>
              <div className="flex items-center gap-2">
                <span>[🌾 커터 수확]</span> 전면 블레이드가 작물에 닿으면 자동 베기
              </div>
              <div className="flex items-center gap-2">
                <span>[📦 사일로 하역]</span> 사일로 하역존으로 가서 곡물을 판매
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-lime-500 hover:bg-lime-400 active:bg-lime-600 text-black font-black text-lg rounded-sm tracking-wider uppercase shadow-lg transition-transform active:scale-95"
            >
              START HARVEST 🌾
            </button>
          </div>
        </div>
      )}

      {/* 승리 모달 */}
      {gameState === 'victory' && (
        <VictoryRewardModal
          isOpen={true}
          onClose={handleExit}
          receipt={rewardReceipt}
          title="FARM MASTER CONQUERED!"
          subtitle="농장 수확 목표 $500를 완벽하게 달성했습니다!"
        />
      )}

      {/* 하단 모바일 퓨어 터치 버튼 군 */}
      {gameState === 'playing' && (
        <div className="mt-auto z-20 pb-6 px-6 flex items-end justify-between pointer-events-auto">
          {/* 좌측: 조이스틱 안내 라벨 */}
          <div className="text-[10px] text-slate-500 pb-2">
            좌측 화면 터치 드래그로 주행
          </div>

          {/* 우측: 64px [📦 UNLOAD] + 76px [🌾 BOOST] 대형 버튼 군 */}
          <div className="flex items-end gap-3">
            <button
              onClick={handleUnloadAtSilo}
              className={`w-16 h-16 rounded-sm flex flex-col items-center justify-center font-black text-xs border transition-all ${
                isNearSilo
                  ? 'bg-amber-500 border-amber-300 text-black scale-95 animate-pulse shadow-lg'
                  : 'bg-slate-900/90 border-slate-700 text-slate-400'
              }`}
            >
              <span className="text-base leading-none">📦</span>
              <span className="text-[9px] mt-1 font-bold">UNLOAD</span>
            </button>

            <button
              onTouchStart={handleBoostStart}
              onTouchEnd={handleBoostEnd}
              onMouseDown={handleBoostStart}
              onMouseUp={handleBoostEnd}
              className={`w-20 h-20 rounded-sm flex flex-col items-center justify-center font-black text-sm border shadow-xl transition-all ${
                isBoostActive
                  ? 'bg-lime-500 border-lime-300 text-black scale-95 shadow-lime-500/50'
                  : 'bg-slate-900/90 border-lime-500/70 text-lime-400'
              }`}
            >
              <span className="text-2xl leading-none">🌾</span>
              <span className="text-[10px] mt-1 font-black tracking-wider">BOOST</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
