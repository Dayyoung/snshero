import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiNeonChallengeGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Obstacle {
  mesh: THREE.Object3D;
  type: 'laser' | 'cube';
  pos: THREE.Vector3;
  radius: number;
}

interface Collectible {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  isCollected: boolean;
}

interface SpeedRing {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  passed: boolean;
}

export const PokiNeonChallengeGame: React.FC<PokiNeonChallengeGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 17;
  const containerRef = useRef<HTMLDivElement>(null);
  const heroSpriteCanvasRef = useRef<HTMLCanvasElement>(null);

  // 게임 상태
  const [score, setScore] = useState<number>(0);
  const [shield, setShield] = useState<number>(100);
  const [distancePct, setDistancePct] = useState<number>(0);
  const [boostEnergy, setBoostEnergy] = useState<number>(100);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // 튜토리얼 모달 상태
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_neon_challenge') !== 'true';
    } catch {
      return true;
    }
  });

  // 조이스틱 상태
  const [joystick, setJoystick] = useState<{ active: boolean; startX: number; startY: number; curX: number; curY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
  });

  // 물리/시뮬레이션 상태 Ref
  const stateRef = useRef({
    player: {
      pos: new THREE.Vector3(0, 0.4, 0),
      vel: new THREE.Vector3(0, 0, -16), // 전방(-Z)
      isGrounded: true,
      shield: 100,
      boostTimer: 0,
      invulnerableTimer: 0,
    },
    trackLength: 120, // 120m
    touchDirX: 0,
    keys: { a: false, d: false, space: false, shift: false },
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    speedRings: [] as SpeedRing[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
  });

  // 영웅 카드 스프라이트 페이스 캐싱
  useEffect(() => {
    if (!heroSpriteCanvasRef.current) return;
    const ctx = heroSpriteCanvasRef.current.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, playerHeroId, 0, 0, 64, 64);
  }, [playerHeroId]);

  // Three.js 씬 구축 및 게임 루프
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬, 카메라, 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050512);
    scene.fog = new THREE.FogExp2(0x050512, 0.016);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 150);
    camera.position.set(0, 4.5, 8);
    camera.lookAt(0, 1.2, -8);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const playerGlowLight = new THREE.PointLight(0x00f3ff, 2.5, 12);
    playerGlowLight.position.set(0, 2, 0);
    scene.add(playerGlowLight);

    // 1. 120m 네온 하이웨이 트랙 구축
    const trackLen = 125;
    const trackWidth = 8;
    const trackGeo = new THREE.PlaneGeometry(trackWidth, trackLen);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.2,
      metalness: 0.8,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.rotation.x = -Math.PI / 2;
    trackMesh.position.set(0, 0, -trackLen / 2);
    scene.add(trackMesh);

    // 네온 그리드 라인
    const gridHelper = new THREE.GridHelper(trackLen, 50, 0x00f3ff, 0x1e293b);
    gridHelper.position.set(0, 0.02, -trackLen / 2);
    scene.add(gridHelper);

    // 양쪽 네온 발광 가드레일 (시안/마젠타)
    const railGeo = new THREE.CylinderGeometry(0.12, 0.12, trackLen, 8);
    const railMatL = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const railMatR = new THREE.MeshBasicMaterial({ color: 0xff007f });

    const railL = new THREE.Mesh(railGeo, railMatL);
    railL.rotation.x = Math.PI / 2;
    railL.position.set(-trackWidth / 2, 0.2, -trackLen / 2);
    scene.add(railL);

    const railR = new THREE.Mesh(railGeo, railMatR);
    railR.rotation.x = Math.PI / 2;
    railR.position.set(trackWidth / 2, 0.2, -trackLen / 2);
    scene.add(railR);

    // 시작 20m 안전 안착 광폭 플랫폼 가이드 라인 (시작 급사 원천 차단)
    const safeZoneRing = new THREE.Mesh(
      new THREE.RingGeometry(2.5, 2.7, 32),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide })
    );
    safeZoneRing.rotation.x = -Math.PI / 2;
    safeZoneRing.position.set(0, 0.03, -2);
    scene.add(safeZoneRing);

    // 2. 플레이어 사이버 호버 스피더 메쉬
    const playerGroup = new THREE.Group();

    // 메인 바디
    const bodyGeo = new THREE.ConeGeometry(0.8, 2.2, 5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.3;
    playerGroup.add(body);

    // 네온 윙 좌우
    const wingGeo = new THREE.BoxGeometry(2.0, 0.06, 0.8);
    const wingMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 0.3, 0.3);
    playerGroup.add(wing);

    // 듀얼 이온 스러스터 엔진
    const thrusterGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 12);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const thL = new THREE.Mesh(thrusterGeo, thrusterMat);
    thL.rotation.x = Math.PI / 2;
    thL.position.set(-0.55, 0.3, 1.0);
    const thR = thL.clone();
    thR.position.x = 0.55;
    playerGroup.add(thL, thR);

    // 콕핏 바이저
    const visorGeo = new THREE.BoxGeometry(0.45, 0.25, 0.6);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.5, -0.2);
    playerGroup.add(visor);

    playerGroup.position.set(0, 0.4, 0);
    scene.add(playerGroup);

    // 3. 결승 사이버 포털 게이트 (Z = -120m)
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, -120);

    const pArchGeo = new THREE.TorusGeometry(4.5, 0.4, 16, 32);
    const pArchMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const pArch = new THREE.Mesh(pArchGeo, pArchMat);
    pArch.position.y = 4.0;
    portalGroup.add(pArch);

    const portalVortex = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 32),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    portalVortex.position.y = 4.0;
    portalGroup.add(portalVortex);

    scene.add(portalGroup);

    // 4. 네온 링 터널 (8개, 통과 시 부스트 및 점수)
    stateRef.current.speedRings = [];
    const ringDistances = [-24, -38, -52, -66, -80, -94, -108];
    ringDistances.forEach((z) => {
      const ringGroup = new THREE.Group();
      ringGroup.position.set(0, 2.5, z);

      const rMesh = new THREE.Mesh(
        new THREE.TorusGeometry(3.0, 0.15, 12, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      ringGroup.add(rMesh);
      scene.add(ringGroup);

      stateRef.current.speedRings.push({
        mesh: ringGroup,
        pos: new THREE.Vector3(0, 2.5, z),
        passed: false,
      });
    });

    // 5. 네온 장애물 (레이저 장벽 & 회전 사이버 큐브)
    stateRef.current.obstacles = [];

    // 레이저 장벽 (바닥 근처 붉은 레이저 빔)
    const laserZ = [-30, -45, -60, -75, -90, -102];
    laserZ.forEach((z) => {
      const laserGeo = new THREE.CylinderGeometry(0.1, 0.1, trackWidth - 0.4, 8);
      const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
      const laser = new THREE.Mesh(laserGeo, laserMat);
      laser.rotation.z = Math.PI / 2;
      laser.position.set(0, 0.6, z);
      scene.add(laser);

      stateRef.current.obstacles.push({
        mesh: laser,
        type: 'laser',
        pos: new THREE.Vector3(0, 0.6, z),
        radius: 0.8,
      });
    });

    // 회전 사이버 큐브 (좌우 레인 차단)
    const cubeConfigs = [
      { x: -2.2, z: -34 },
      { x: 2.2, z: -40 },
      { x: 0, z: -50 },
      { x: -2.0, z: -64 },
      { x: 2.0, z: -70 },
      { x: -2.2, z: -84 },
      { x: 2.2, z: -88 },
      { x: 0, z: -98 },
      { x: -1.8, z: -105 },
    ];

    cubeConfigs.forEach((cfg) => {
      const cGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
      const cMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, metalness: 0.8 });
      const cube = new THREE.Mesh(cGeo, cMat);
      cube.position.set(cfg.x, 1.0, cfg.z);
      scene.add(cube);

      stateRef.current.obstacles.push({
        mesh: cube,
        type: 'cube',
        pos: new THREE.Vector3(cfg.x, 1.0, cfg.z),
        radius: 1.2,
      });
    });

    // 6. 황금 네온 코어 20개
    stateRef.current.collectibles = [];
    const coreGeo = new THREE.OctahedronGeometry(0.4, 0);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.9 });

    for (let i = 0; i < 20; i++) {
      const z = -20 - i * 4.8;
      const x = Math.sin(i * 1.4) * 2.6;
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(x, 1.1, z);
      scene.add(core);

      stateRef.current.collectibles.push({
        mesh: core,
        pos: new THREE.Vector3(x, 1.1, z),
        isCollected: false,
      });
    }

    // 파티클 생성 함수
    const spawnSparks = (pos: THREE.Vector3, color: number, count = 12) => {
      for (let i = 0; i < (lowSpecMode ? count / 2 : count); i++) {
        const p = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 0.1),
          new THREE.MeshBasicMaterial({ color })
        );
        p.position.copy(pos);
        scene.add(p);
        stateRef.current.particles.push({
          mesh: p,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 6
          ),
          life: 0.5 + Math.random() * 0.3,
        });
      }
    };

    // 키보드 리스너
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = true;
      if (k === ' ' || k === 'w' || k === 'arrowup') executeJump();
      if (k === 'shift' || k === 'e') executeBoost();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 리사이즈
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 메인 시뮬레이션 루프
    let animId = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const pState = stateRef.current.player;

      // 1. 좌우 조향 (화면 기준 오른쪽 = +X, 화면 기준 왼쪽 = -X 100% 일치)
      let steer = 0;
      if (stateRef.current.keys.a) steer -= 1;
      if (stateRef.current.keys.d) steer += 1;
      if (stateRef.current.touchDirX !== 0) steer += stateRef.current.touchDirX;

      const steerSpeed = 9.0;
      pState.pos.x += steer * steerSpeed * dt;
      pState.pos.x = THREE.MathUtils.clamp(pState.pos.x, -3.4, 3.4);

      // 스피더 기울기 롤링 연출
      playerGroup.rotation.z = -steer * 0.35;

      // 2. 전방 전진 및 부스트
      if (pState.boostTimer > 0) {
        pState.boostTimer -= dt;
        pState.vel.z = -28; // 초고속
        if (pState.boostTimer <= 0) setIsBoosting(false);
      } else {
        pState.vel.z = -16; // 일반 고속
      }

      pState.pos.z += pState.vel.z * dt;

      // 진행도 업데이트
      const pct = Math.min(100, Math.floor((-pState.pos.z / 120) * 100));
      setDistancePct(pct);

      // 3. 점프 및 수직 물리
      if (!pState.isGrounded) {
        pState.vel.y -= 26 * dt; // 중력
        pState.pos.y += pState.vel.y * dt;
        if (pState.pos.y <= 0.4) {
          pState.pos.y = 0.4;
          pState.vel.y = 0;
          pState.isGrounded = true;
        }
      }

      // 무적 타이머
      if (pState.invulnerableTimer > 0) pState.invulnerableTimer -= dt;

      // 플레이어 메쉬 위치 동기화
      playerGroup.position.copy(pState.pos);
      playerGlowLight.position.set(pState.pos.x, pState.pos.y + 1.2, pState.pos.z);
      playerGroup.visible = pState.invulnerableTimer > 0 ? Math.floor(time / 70) % 2 === 0 : true;

      // 카메라 부드러운 백뷰 트래킹 (화면 기준 좌우 상하 100% 일치)
      camera.position.x += (pState.pos.x * 0.7 - camera.position.x) * 0.12;
      camera.position.z = pState.pos.z + 7.5;
      camera.position.y = 3.8 + (pState.pos.y - 0.4) * 0.5;
      camera.lookAt(pState.pos.x * 0.5, pState.pos.y + 0.8, pState.pos.z - 12);

      // 4. 네온 링 터널 통과 검사
      stateRef.current.speedRings.forEach((ring) => {
        if (!ring.passed && Math.abs(pState.pos.z - ring.pos.z) < 1.8) {
          ring.passed = true;
          setScore((s) => s + 100);
          spawnSparks(ring.pos, 0x00f3ff, 20);
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          if (navigator.vibrate) navigator.vibrate(40);
        }
      });

      // 5. 네온 코어 수집 검사
      stateRef.current.collectibles.forEach((core) => {
        if (!core.isCollected) {
          core.mesh.rotation.y += 2.5 * dt;
          core.mesh.rotation.x += 1.5 * dt;

          const dist = pState.pos.distanceTo(core.pos);
          if (dist < 1.4) {
            core.isCollected = true;
            core.mesh.visible = false;
            setScore((s) => s + 50);
            spawnSparks(core.pos, 0xfacc15, 12);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            if (navigator.vibrate) navigator.vibrate(25);
          }
        }
      });

      // 6. 장애물 충돌 검사
      stateRef.current.obstacles.forEach((obs) => {
        if (obs.type === 'cube') {
          obs.mesh.rotation.y += 2.0 * dt;
        }

        const dz = Math.abs(pState.pos.z - obs.pos.z);
        if (dz < 1.2 && pState.invulnerableTimer <= 0) {
          if (obs.type === 'laser') {
            // 레이저는 점프(높이 > 1.2)로 회피 가능
            if (pState.pos.y < 1.2) {
              handleObstacleHit(obs.pos);
            }
          } else if (obs.type === 'cube') {
            const dx = Math.abs(pState.pos.x - obs.pos.x);
            if (dx < obs.radius) {
              handleObstacleHit(obs.pos);
            }
          }
        }
      });

      // 7. 결승 포털 통과 검사 (승리!)
      if (pState.pos.z <= -120 && !isVictory && !isGameOver) {
        handleGameVictory();
      }

      // 8. 파티클 업데이트
      for (let i = stateRef.current.particles.length - 1; i >= 0; i--) {
        const p = stateRef.current.particles[i];
        p.vel.y -= 9.8 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          stateRef.current.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    // 장애물 피격 처리
    const handleObstacleHit = (pos: THREE.Vector3) => {
      const pState = stateRef.current.player;
      if (pState.boostTimer > 0) return; // 부스트 중 무적

      pState.shield = Math.max(0, pState.shield - 25);
      pState.invulnerableTimer = 1.0;
      setShield(pState.shield);

      spawnSparks(pos, 0xff0044, 18);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      if (navigator.vibrate) navigator.vibrate([40, 50, 40]);

      if (pState.shield <= 0) {
        handleGameOver();
      }
    };

    // 점프 실행
    const executeJump = () => {
      const pState = stateRef.current.player;
      if (pState.isGrounded) {
        pState.vel.y = 11.5;
        pState.isGrounded = false;
        if (navigator.vibrate) navigator.vibrate(30);
      }
    };

    // 부스트 실행
    const executeBoost = () => {
      const pState = stateRef.current.player;
      if (boostEnergy >= 40 && pState.boostTimer <= 0) {
        pState.boostTimer = 3.5;
        setIsBoosting(true);
        setBoostEnergy((e) => Math.max(0, e - 40));
        spawnSparks(pState.pos, 0x00f3ff, 25);
        if (navigator.vibrate) navigator.vibrate([30, 40, 30, 40]);
      }
    };

    // 승리 처리
    const handleGameVictory = () => {
      setIsVictory(true);
      const finalScore = score + 1200;
      setScore(finalScore);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'poki_neon_challenge',
        gameTitle: 'Neon Challenge Legends 3D',
        durationSeconds: 40,
        score: finalScore,
        maxTargetScore: 2000,
        isVictory: true,
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    };

    // 게임 오버 처리
    const handleGameOver = () => {
      setIsGameOver(true);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'poki_neon_challenge',
        gameTitle: 'Neon Challenge Legends 3D',
        durationSeconds: 25,
        score,
        maxTargetScore: 2000,
        isVictory: false,
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    };

    (container as any).__executeJump = executeJump;
    (container as any).__executeBoost = executeBoost;

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [boostEnergy, lowSpecMode, onReward, playSfx, score]);

  // 점프/부스트 버튼 핸들러
  const onJumpClick = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__executeJump) {
      (containerRef.current as any).__executeJump();
    }
  }, []);

  const onBoostClick = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__executeBoost) {
      (containerRef.current as any).__executeBoost();
    }
  }, []);

  // 모바일 터치 조이스틱 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX > window.innerWidth * 0.65) return; // 우측 버튼 영역 제외

    setJoystick({
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      curX: touch.clientX,
      curY: touch.clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!joystick.active) return;
    const touch = (Array.from(e.touches) as React.Touch[]).find((t) => t.clientX < window.innerWidth * 0.7);
    if (!touch) return;

    const dx = touch.clientX - joystick.startX;
    const maxDist = 50;
    const clampedDx = THREE.MathUtils.clamp(dx, -maxDist, maxDist);

    setJoystick((prev) => ({ ...prev, curX: joystick.startX + clampedDx, curY: touch.clientY }));

    // 화면 기준 오른쪽 = +X, 왼쪽 = -X
    stateRef.current.touchDirX = clampedDx / maxDist;
  }, [joystick.active, joystick.startX]);

  const handleTouchEnd = useCallback(() => {
    setJoystick({ active: false, startX: 0, startY: 0, curX: 0, curY: 0 });
    stateRef.current.touchDirX = 0;
  }, []);

  // 튜토리얼 스텝
  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '네온 챌린지 3D 사이버 트랙' : 'Neon Challenge 3D Cyber Track',
      badge: 'SPEED 3D',
      description: isKo
        ? '환상적인 네온 그리드 하이웨이를 질주하며 레이저와 큐브 장애물을 피하세요!'
        : 'Speed down the neon cyberpunk track while dodging laser gates and cubes!',
      keyPoints: isKo
        ? ['좌측 터치 드래그로 좌우 스티어링 회피', '네온 링을 통과하면 속도 가속 & 보너스 점수']
        : ['Drag left screen to steer left/right', 'Pass through neon rings for speed boost & bonus score'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '점프 & 네온 부스트 액션' : 'Jump & Neon Boost Action',
      badge: 'CONTROLS',
      description: isKo
        ? '레이저 장벽은 점프로 뛰어넘고, 부스트로 무적 질주를 펼칠 수 있습니다.'
        : 'Jump over low laser gates and activate boost for invincible high speed.',
      keyPoints: isKo
        ? ['우측 80px [점프] 버튼으로 레이저 도약', '우측 68px [부스트] 버튼으로 3.5초간 무적 질주']
        : ['80px [JUMP] button to leap over lasers', '68px [BOOST] button for 3.5s invincible speed'],
      iconType: 'GESTURES',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="Neon Challenge Legends 3D"
        score={score}
        targetScore={1500}
        timeLeft={0}
        onQuit={onExit}
        isKo={isKo}
        rewardUnit="SNS"
        customStatLabel={isKo ? '트랙 진행' : 'TRACK'}
        customStatValue={`${distancePct}% (120m)`}
      />

      {/* 실드 HP & 부스트 게이지 HUD */}
      <div className="absolute top-16 left-4 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 border border-cyan-500/40">
        <canvas ref={heroSpriteCanvasRef} width={40} height={40} className="w-10 h-10 border border-cyan-400 bg-slate-800" />
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-cyan-300 font-bold gap-3">
            <span>SHIELD</span>
            <span>{shield}%</span>
          </div>
          <div className="w-24 h-2 bg-slate-800 border border-slate-700">
            <div
              className={`h-full transition-all duration-200 ${
                shield > 50 ? 'bg-cyan-400' : shield > 25 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${shield}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-fuchsia-300 font-bold gap-3">
            <span>BOOST</span>
            <span>{boostEnergy}%</span>
          </div>
          <div className="w-24 h-2 bg-slate-800 border border-slate-700">
            <div
              className="h-full bg-fuchsia-400 transition-all duration-200"
              style={{ width: `${boostEnergy}%` }}
            />
          </div>
        </div>
      </div>

      {/* 부스트 상태 오버레이 배지 */}
      {isBoosting && (
        <div className="absolute top-16 right-4 z-20 bg-fuchsia-950/80 backdrop-blur-md px-3 py-1.5 border border-fuchsia-400 text-xs font-black text-fuchsia-300 animate-pulse">
          ⚡ SUPER BOOST ACTIVE!
        </div>
      )}

      {/* 모바일 다이나믹 플로팅 가상 조이스틱 */}
      {joystick.active && (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: joystick.startX - 45,
            top: joystick.startY - 45,
            width: 90,
            height: 90,
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-cyan-400/60 bg-cyan-950/40 backdrop-blur-xs flex items-center justify-center animate-pulse" />
          <div
            className="absolute rounded-full w-8 h-8 bg-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.8)] border border-white"
            style={{
              left: 45 - 16 + (joystick.curX - joystick.startX),
              top: 45 - 16,
            }}
          />
        </div>
      )}

      {/* 우측 퓨어 터치 조작 패널 (대형 점프 & 부스트 버튼) */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        {/* 네온 부스트 버튼 */}
        <button
          type="button"
          onClick={onBoostClick}
          disabled={boostEnergy < 40 || isBoosting}
          className={`w-[68px] h-[68px] rounded-sm border-2 font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-lg transition-all ${
            boostEnergy >= 40 && !isBoosting
              ? 'bg-fuchsia-900/90 border-fuchsia-400 text-fuchsia-200 active:bg-fuchsia-700 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
              : 'bg-slate-800/60 border-slate-600 text-slate-500 opacity-60'
          }`}
        >
          <span className="text-xl">⚡</span>
          <span className="mt-0.5 text-[10px] tracking-tight">{isKo ? '부스트' : 'BOOST'}</span>
        </button>

        {/* 대형 점프 버튼 (80px 최적 터치 타깃) */}
        <button
          type="button"
          onClick={onJumpClick}
          className="w-20 h-20 rounded-sm bg-cyan-500 border-2 border-cyan-200 text-slate-950 font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-[0_0_20px_rgba(6,182,212,0.7)] active:bg-cyan-400 transition-transform"
        >
          <span className="text-2xl">▲</span>
          <span className="mt-0.5 tracking-wider font-extrabold">{isKo ? '점프' : 'JUMP'}</span>
        </button>
      </div>

      {/* 좌측 하단 데스크톱 가이드 */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:block text-slate-400 text-xs bg-slate-900/80 px-3 py-2 border border-slate-700">
        <div>[A/D / 좌우터치]: 좌우 스티어링</div>
        <div>[Space / W / 점프]: 레이저 점프 회피</div>
        <div>[Shift / E / 부스트]: 네온 부스트 가속</div>
      </div>

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_neon_challenge', 'true');
            } catch {
              // ignore
            }
          }}
          isKo={isKo}
        />
      )}

      {/* 패배 모달 */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-red-500 p-6 max-w-sm w-full text-center">
            <h2 className="text-2xl font-black text-red-500 mb-2">{isKo ? '코스 이탈 / 파괴' : 'CRASHED!'}</h2>
            <p className="text-slate-300 text-sm mb-4">
              {isKo ? '네온 장애물과 충돌하여 쉴드가 소진되었습니다!' : 'Shield depleted after colliding with obstacles!'}
            </p>
            <div className="bg-slate-800 p-3 mb-4 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>{isKo ? '도달 거리' : 'Distance'}:</span>
                <span className="text-cyan-400 font-bold">{distancePct}% (120m)</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최종 점수' : 'Score'}:</span>
                <span className="text-amber-400 font-bold">{score}</span>
              </div>
              {settlementReceipt && (
                <div className="flex justify-between text-cyan-300 pt-1 border-t border-slate-700">
                  <span>{isKo ? '지급 보상' : 'Reward'}:</span>
                  <span className="font-bold">+{settlementReceipt.totalSns} SNS</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onExit}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm border border-red-400 transition-colors"
            >
              {isKo ? '확인 및 나가기' : 'CONFIRM & EXIT'}
            </button>
          </div>
        </div>
      )}

      {/* 승리 및 보상 모달 */}
      {isVictory && settlementReceipt && (
        <VictoryRewardModal
          isOpen={isVictory}
          receipt={settlementReceipt}
          onClaim={() => {
            setIsVictory(false);
            onExit();
          }}
          isKo={isKo}
        />
      )}
    </div>
  );
};

export default PokiNeonChallengeGame;
