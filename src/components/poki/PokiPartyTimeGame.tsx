import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPartyTimeGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;
}

interface Rival {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isJumping: boolean;
  jumpY: number;
  vy: number;
  alive: boolean;
  color: number;
  targetOffset: { x: number; z: number };
  reactionDelay: number;
}

interface CakeBomb {
  mesh: THREE.Mesh;
  targetPos: THREE.Vector3;
  currentY: number;
  timer: number;
  maxTimer: number;
  warningCircle: THREE.Mesh;
  exploded: boolean;
}

export const PokiPartyTimeGame: React.FC<PokiPartyTimeGameProps> = ({
  onBack,
  onExit,
  cardId = 39,
  lowSpecMode = false,
  playSfx
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [timeLeft, setTimeLeft] = useState(35);
  const [aliveCount, setAliveCount] = useState(5); // 플레이어 1 + AI 4
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // 모바일 터치 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickDelta, setJoystickDelta] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const inputDirRef = useRef({ x: 0, z: 0 });

  // 3D 씬 내부 레퍼런스
  const gameLoopRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animId: 0,
    clock: new THREE.Clock(),
    isGameOver: false,
    isGameWon: false,
    timeRemaining: 35,
    scoreVal: 0,
    sweeperLowerAngle: 0,
    sweeperUpperAngle: 0,
    sweeperSpeed: 0.035,
    player: {
      group: null as THREE.Group | null,
      pos: new THREE.Vector3(0, 0.7, 7.5),
      vel: new THREE.Vector3(0, 0, 0),
      isJumping: false,
      isDiving: false,
      diveTimer: 0,
      jumpY: 0,
      vy: 0,
      alive: true,
      lastHaptic: 0,
    },
    rivals: [] as Rival[],
    bombs: [] as CakeBomb[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    sweeperLowerMesh: null as THREE.Mesh | null,
    sweeperUpperMesh: null as THREE.Mesh | null,
    arenaRadius: 14.5,
  });

  const handleExit = onExit || onBack;

  // 영웅 카드 배지 렌더링
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawCardSprite(ctx, cardId, 0, 0, 40, 40);
      }
    }
  }, [cardId]);

  // 햅틱 진동 피드백
  const triggerHaptic = useCallback((pattern: number | number[] = 20) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore
      }
    }
  }, []);

  // 보상 정산 및 지급
  const handleClaimReward = useCallback((isVictory: boolean, currentScore: number) => {
    const finalScore = Math.max(20, Math.floor(currentScore));
    const result = calculateAndDepositMissionReward({
      gameId: 'poki_party_time',
      gameTitle: 'Party Time 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: Math.floor(35 - gameLoopRef.current.timeRemaining),
    });
    setRewardResult(result);
  }, []);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0d1c);
    scene.fog = new THREE.FogExp2(0x0c0d1c, 0.022);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 150);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 2);
    gameLoopRef.current.camera = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowSpecMode,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameLoopRef.current.renderer = renderer;

    // 3. 조명 (파티 네온 라이트)
    const ambientLight = new THREE.AmbientLight(0xdde5ff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 70;
      const d = 20;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    scene.add(dirLight);

    // 핑크 & 시안 네온 포인트 라이트
    const pinkLight = new THREE.PointLight(0xff0077, 2.5, 35);
    pinkLight.position.set(-10, 8, -5);
    scene.add(pinkLight);

    const cyanLight = new THREE.PointLight(0x00ffff, 2.5, 35);
    cyanLight.position.set(10, 8, 5);
    scene.add(cyanLight);

    // 4. 원형 디스코 파티 아레나 플랫폼 (지름 30m, 반경 15m)
    const arenaRadius = 14.5;
    gameLoopRef.current.arenaRadius = arenaRadius;

    const arenaGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius + 0.4, 1.5, 48);
    const arenaMat = new THREE.MeshStandardMaterial({
      color: 0x181a33,
      roughness: 0.35,
      metalness: 0.2,
    });
    const arenaMesh = new THREE.Mesh(arenaGeo, arenaMat);
    arenaMesh.position.y = -0.75;
    arenaMesh.receiveShadow = !lowSpecMode;
    scene.add(arenaMesh);

    // 디스코 패턴 바닥 원반
    const topDiscGeo = new THREE.CircleGeometry(arenaRadius - 0.2, 48);
    const topDiscMat = new THREE.MeshStandardMaterial({
      color: 0x22264b,
      roughness: 0.4,
      metalness: 0.1,
    });
    const topDisc = new THREE.Mesh(topDiscGeo, topDiscMat);
    topDisc.rotation.x = -Math.PI / 2;
    topDisc.position.y = 0.01;
    topDisc.receiveShadow = !lowSpecMode;
    scene.add(topDisc);

    // 네온 링 림
    const ringGeo = new THREE.RingGeometry(arenaRadius - 0.5, arenaRadius, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0099,
      side: THREE.DoubleSide,
    });
    const neonRing = new THREE.Mesh(ringGeo, ringMat);
    neonRing.rotation.x = -Math.PI / 2;
    neonRing.position.y = 0.02;
    scene.add(neonRing);

    // 아레나 내부 십자 가이드 네온
    const innerRingGeo = new THREE.RingGeometry(6.8, 7.2, 36);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const innerNeonRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerNeonRing.rotation.x = -Math.PI / 2;
    innerNeonRing.position.y = 0.02;
    scene.add(innerNeonRing);

    // 5. 중앙 회전 기둥 타워
    const towerGeo = new THREE.CylinderGeometry(1.6, 1.8, 5.5, 24);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x111326,
      roughness: 0.3,
      metalness: 0.8,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 2.75;
    tower.castShadow = !lowSpecMode;
    scene.add(tower);

    // 타워 네온 띠
    const bandGeo = new THREE.CylinderGeometry(1.62, 1.62, 0.4, 24);
    const bandMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.y = 3.5;
    scene.add(band);

    // 6. 듀얼 회전 스위퍼 바
    // 하단 스위퍼 (점프로 뛰어넘어야 함): Y = 0.75m, 길이 = 13.5m, 레드/오렌지 네온
    const lowerBarGeo = new THREE.BoxGeometry(arenaRadius * 1.8, 0.55, 0.65);
    const lowerBarMat = new THREE.MeshStandardMaterial({
      color: 0xff2a44,
      emissive: 0x990015,
      roughness: 0.2,
      metalness: 0.5,
    });
    const lowerBar = new THREE.Mesh(lowerBarGeo, lowerBarMat);
    lowerBar.position.y = 0.75;
    lowerBar.castShadow = !lowSpecMode;
    scene.add(lowerBar);
    gameLoopRef.current.sweeperLowerMesh = lowerBar;

    // 상단 스위퍼 (반대 방향 회전): Y = 2.3m, 길이 = 13.5m, 시안/블루 네온
    const upperBarGeo = new THREE.BoxGeometry(arenaRadius * 1.8, 0.6, 0.7);
    const upperBarMat = new THREE.MeshStandardMaterial({
      color: 0x00d9ff,
      emissive: 0x005588,
      roughness: 0.2,
      metalness: 0.5,
    });
    const upperBar = new THREE.Mesh(upperBarGeo, upperBarMat);
    upperBar.position.y = 2.35;
    upperBar.castShadow = !lowSpecMode;
    scene.add(upperBar);
    gameLoopRef.current.sweeperUpperMesh = upperBar;

    // 7. 플레이어 캐릭터 (파티 큐비)
    const playerGroup = new THREE.Group();

    // 몸체 (노란색 큐브)
    const bodyGeo = new THREE.BoxGeometry(1.0, 1.1, 0.9);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.3,
      metalness: 0.1,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = !lowSpecMode;
    playerGroup.add(bodyMesh);

    // 파티 고깔모자 (콘)
    const hatGeo = new THREE.ConeGeometry(0.35, 0.9, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xff0066, roughness: 0.3 });
    const hatMesh = new THREE.Mesh(hatGeo, hatMat);
    hatMesh.position.set(0, 1.45, 0);
    hatMesh.castShadow = !lowSpecMode;
    playerGroup.add(hatMesh);

    // 선글라스 (블랙 큐브)
    const glassesGeo = new THREE.BoxGeometry(0.75, 0.22, 0.15);
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
    const glassesMesh = new THREE.Mesh(glassesGeo, glassesMat);
    glassesMesh.position.set(0, 0.75, 0.46);
    playerGroup.add(glassesMesh);

    // 시작 위치 안전 안착 (0, 0, 7.5m - 스폰 즉시 충돌/낙하 방지)
    playerGroup.position.set(0, 0, 7.5);
    scene.add(playerGroup);
    gameLoopRef.current.player.group = playerGroup;

    // 8. 4명의 AI 파티 친구들 (다채로운 네온 컬러)
    const rivalConfigs = [
      { color: 0x00ff88, startPos: new THREE.Vector3(-6.5, 0, 4.0) },
      { color: 0xff33cc, startPos: new THREE.Vector3(6.5, 0, 4.0) },
      { color: 0x3388ff, startPos: new THREE.Vector3(-5.0, 0, -6.0) },
      { color: 0xff8800, startPos: new THREE.Vector3(5.0, 0, -6.0) },
    ];

    const rivals: Rival[] = [];
    rivalConfigs.forEach((cfg) => {
      const rGroup = new THREE.Group();
      const rBodyGeo = new THREE.BoxGeometry(0.95, 1.05, 0.85);
      const rBodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.3 });
      const rBody = new THREE.Mesh(rBodyGeo, rBodyMat);
      rBody.position.y = 0.52;
      rBody.castShadow = !lowSpecMode;
      rGroup.add(rBody);

      // AI 고깔모자
      const rHatGeo = new THREE.ConeGeometry(0.3, 0.75, 12);
      const rHatMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const rHat = new THREE.Mesh(rHatGeo, rHatMat);
      rHat.position.set(0, 1.35, 0);
      rGroup.add(rHat);

      rGroup.position.copy(cfg.startPos);
      scene.add(rGroup);

      rivals.push({
        mesh: rGroup,
        pos: cfg.startPos.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        isJumping: false,
        jumpY: 0,
        vy: 0,
        alive: true,
        color: cfg.color,
        targetOffset: { x: (Math.random() - 0.5) * 4, z: (Math.random() - 0.5) * 4 },
        reactionDelay: 0.05 + Math.random() * 0.15,
      });
    });
    gameLoopRef.current.rivals = rivals;

    // 9. 리사이즈 핸들러
    const handleResize = () => {
      if (!container || !gameLoopRef.current.renderer || !gameLoopRef.current.camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      gameLoopRef.current.camera.aspect = w / h;
      gameLoopRef.current.camera.updateProjectionMatrix();
      gameLoopRef.current.renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 10. 메인 게임 루프
    let lastTime = performance.now();
    let bombSpawnTimer = 3.5;

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.06);
      lastTime = now;

      const g = gameLoopRef.current;
      const p = g.player;

      if (!g.isGameOver && !g.isGameWon) {
        // 타이머 감소
        g.timeRemaining = Math.max(0, g.timeRemaining - dt);
        setTimeLeft(Math.ceil(g.timeRemaining));

        // 점수 획득
        g.scoreVal += dt * 3.5;
        setScore(Math.floor(g.scoreVal));

        // 스위퍼 회전 가속 (시간 지남에 따라 점진적 난이도 증가)
        // 기본 0.035 -> 35초 경과 시 0.07 rad/frame
        const speedFactor = 1.0 + (35 - g.timeRemaining) / 35 * 0.85;
        const baseSpeed = g.sweeperSpeed * speedFactor;

        g.sweeperLowerAngle += baseSpeed * (dt * 60);
        g.sweeperUpperAngle -= baseSpeed * 0.8 * (dt * 60);

        if (g.sweeperLowerMesh) {
          g.sweeperLowerMesh.rotation.y = g.sweeperLowerAngle;
        }
        if (g.sweeperUpperMesh) {
          g.sweeperUpperMesh.rotation.y = g.sweeperUpperAngle;
        }

        // --- 플레이어 물리 & 이동 제어 ---
        const moveSpeed = p.isDiving ? 12.0 : 8.0;
        const inputX = inputDirRef.current.x;
        const inputZ = inputDirRef.current.z;

        p.pos.x += inputX * moveSpeed * dt;
        p.pos.z += inputZ * moveSpeed * dt;

        // 중앙 타워 충돌 제한 (반경 1.8m)
        const distFromCenter = Math.hypot(p.pos.x, p.pos.z);
        if (distFromCenter < 2.2) {
          const angle = Math.atan2(p.pos.z, p.pos.x);
          p.pos.x = Math.cos(angle) * 2.2;
          p.pos.z = Math.sin(angle) * 2.2;
        }

        // 점프 물리
        if (p.isJumping) {
          p.jumpY += p.vy * dt;
          p.vy -= 26.0 * dt; // 중력
          if (p.jumpY <= 0) {
            p.jumpY = 0;
            p.isJumping = false;
            p.vy = 0;
            triggerHaptic(12);
          }
        }

        // 다이브 지속시간 관리
        if (p.isDiving) {
          p.diveTimer -= dt;
          if (p.diveTimer <= 0) {
            p.isDiving = false;
          }
        }

        // 플레이어 메쉬 갱신
        if (p.group) {
          p.group.position.x = p.pos.x;
          p.group.position.z = p.pos.z;
          p.group.position.y = p.jumpY;

          // 이동 방향 회전
          if (Math.hypot(inputX, inputZ) > 0.1) {
            const targetRot = Math.atan2(inputX, inputZ);
            p.group.rotation.y = targetRot;
          }

          // 다이브 시 웅크리기 회전
          if (p.isDiving) {
            p.group.rotation.x = 0.8;
          } else {
            p.group.rotation.x = 0;
          }
        }

        // --- 플레이어와 하단 스위퍼 충돌 판정 ---
        // 하단 스위퍼: 각도 g.sweeperLowerAngle, 길이 26m, 폭 0.7m, 높이 Y: 0.45 ~ 1.05m
        const lowerAngle = g.sweeperLowerAngle;
        // 바의 법선 벡터 (-sin, cos)
        const lowerNx = -Math.sin(lowerAngle);
        const lowerNz = Math.cos(lowerAngle);
        // 플레이어와 바 중심선 사이의 수직 거리
        const distToLowerBar = Math.abs(p.pos.x * lowerNx + p.pos.z * lowerNz);
        const distAlongLowerBar = Math.abs(p.pos.x * Math.cos(lowerAngle) + p.pos.z * Math.sin(lowerAngle));

        // 플레이어 점프 높이가 0.9m 미만이고, 바의 폭(0.65m) 내에 있으면 충돌!
        if (
          distToLowerBar < 0.65 &&
          distAlongLowerBar < arenaRadius &&
          distAlongLowerBar > 1.8 &&
          p.jumpY < 0.85
        ) {
          // 스위퍼 회전 방향으로 강력한 넉백 충격량 전달
          const rotSpeed = baseSpeed * 60;
          const hitForce = 18.0 * (1 + rotSpeed * 0.5);
          p.pos.x += -lowerNz * hitForce * dt;
          p.pos.z += lowerNx * hitForce * dt;

          triggerHaptic([35, 40, 45]);
          if (playSfx) playSfx('hit');
        }

        // --- 플레이어와 상단 스위퍼 충돌 판정 ---
        // 상단 스위퍼: Y: 2.05 ~ 2.65m. 플레이어가 점프하여 점프 높이가 1.2m 이상일 때 충돌!
        const upperAngle = g.sweeperUpperAngle;
        const upperNx = -Math.sin(upperAngle);
        const upperNz = Math.cos(upperAngle);
        const distToUpperBar = Math.abs(p.pos.x * upperNx + p.pos.z * upperNz);
        const distAlongUpperBar = Math.abs(p.pos.x * Math.cos(upperAngle) + p.pos.z * Math.sin(upperAngle));

        if (
          distToUpperBar < 0.65 &&
          distAlongUpperBar < arenaRadius &&
          distAlongUpperBar > 1.8 &&
          p.jumpY > 1.15
        ) {
          // 상단 바 충돌 넉백
          p.pos.x += upperNz * 15.0 * dt;
          p.pos.z += -upperNx * 15.0 * dt;
          triggerHaptic([30, 30]);
          if (playSfx) playSfx('hit');
        }

        // --- 낙하(추락) 감지 -> 게임 오버 ---
        if (distFromCenter > arenaRadius + 0.5) {
          // 플랫폼 밖으로 낙하
          p.pos.y -= 25.0 * dt;
          if (p.group) p.group.position.y = p.pos.y;

          if (p.pos.y < -5.0) {
            g.isGameOver = true;
            setGameOver(true);
            triggerHaptic([60, 100, 150]);
            handleClaimReward(false, g.scoreVal);
            return;
          }
        }

        // --- AI 라이벌 업데이트 ---
        let currentAlive = 1; // 플레이어
        g.rivals.forEach((r) => {
          if (!r.alive) return;

          currentAlive++;

          // 회전 바 회피 AI (바가 다가오면 점프 시도)
          const rDistToCenter = Math.hypot(r.pos.x, r.pos.z);
          const rDistToLower = Math.abs(r.pos.x * lowerNx + r.pos.z * lowerNz);
          const rDistAlong = Math.abs(r.pos.x * Math.cos(lowerAngle) + r.pos.z * Math.sin(lowerAngle));

          if (rDistToLower < 2.5 && rDistAlong < arenaRadius && !r.isJumping) {
            // 75% 확률로 성공적 점프
            if (Math.random() < 0.78) {
              r.isJumping = true;
              r.vy = 8.5 + Math.random() * 2.0;
            }
          }

          // AI 점프 물리
          if (r.isJumping) {
            r.jumpY += r.vy * dt;
            r.vy -= 26.0 * dt;
            if (r.jumpY <= 0) {
              r.jumpY = 0;
              r.isJumping = false;
              r.vy = 0;
            }
          }

          // 바 충돌 시 탈락 처리
          if (
            rDistToLower < 0.65 &&
            rDistAlong < arenaRadius &&
            rDistAlong > 1.8 &&
            r.jumpY < 0.85
          ) {
            // 튕겨나가 탈락
            r.vel.set(-lowerNz * 22, 12, lowerNx * 22);
          }

          // AI 물리 위치 반영
          r.pos.addScaledVector(r.vel, dt);
          if (r.vel.lengthSq() > 0.1) {
            r.vel.y -= 25.0 * dt; // 중력
          }

          r.mesh.position.set(r.pos.x, r.pos.y + r.jumpY, r.pos.z);

          // 추락 탈락 감지
          if (r.pos.y < -8.0 || Math.hypot(r.pos.x, r.pos.z) > arenaRadius + 4.0) {
            r.alive = false;
            scene.remove(r.mesh);
          }
        });

        setAliveCount(currentAlive);

        // --- 공중 낙하 케이크 밤 (Cake Bomb) 생성 & 업데이트 ---
        bombSpawnTimer -= dt;
        if (bombSpawnTimer <= 0) {
          bombSpawnTimer = 4.0 + Math.random() * 2.5;

          // 랜덤 투하 위치 (반경 3.5 ~ 11m)
          const angle = Math.random() * Math.PI * 2;
          const dist = 3.5 + Math.random() * 7.5;
          const targetX = Math.cos(angle) * dist;
          const targetZ = Math.sin(angle) * dist;

          // 바닥 경고 원
          const warnGeo = new THREE.RingGeometry(0.2, 2.5, 24);
          const warnMat = new THREE.MeshBasicMaterial({
            color: 0xff0044,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
          });
          const warnCircle = new THREE.Mesh(warnGeo, warnMat);
          warnCircle.rotation.x = -Math.PI / 2;
          warnCircle.position.set(targetX, 0.03, targetZ);
          scene.add(warnCircle);

          // 케이크 폭탄 메쉬
          const cakeGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.6, 16);
          const cakeMat = new THREE.MeshStandardMaterial({
            color: 0xff44aa,
            roughness: 0.3,
            metalness: 0.2,
          });
          const cakeMesh = new THREE.Mesh(cakeGeo, cakeMat);
          cakeMesh.position.set(targetX, 18, targetZ);
          scene.add(cakeMesh);

          g.bombs.push({
            mesh: cakeMesh,
            targetPos: new THREE.Vector3(targetX, 0.3, targetZ),
            currentY: 18,
            timer: 1.4,
            maxTimer: 1.4,
            warningCircle: warnCircle,
            exploded: false,
          });
        }

        // 폭탄 업데이트
        for (let i = g.bombs.length - 1; i >= 0; i--) {
          const b = g.bombs[i];
          b.timer -= dt;

          // 깜빡이는 경고 원
          const warnMat = b.warningCircle.material as THREE.MeshBasicMaterial;
          warnMat.opacity = 0.4 + Math.sin(b.timer * 15) * 0.4;

          // 폭탄 낙하
          const progress = 1 - Math.max(0, b.timer / b.maxTimer);
          b.currentY = 18 - progress * 17.7;
          b.mesh.position.y = b.currentY;
          b.mesh.rotation.y += 3.0 * dt;

          if (b.timer <= 0 && !b.exploded) {
            b.exploded = true;
            scene.remove(b.mesh);
            scene.remove(b.warningCircle);

            // 넉백 폭발 충격파
            const dPlayer = Math.hypot(p.pos.x - b.targetPos.x, p.pos.z - b.targetPos.z);
            if (dPlayer < 3.2) {
              const blastAngle = Math.atan2(p.pos.z - b.targetPos.z, p.pos.x - b.targetPos.x);
              const blastPower = (3.2 - dPlayer) * 7.5;
              p.pos.x += Math.cos(blastAngle) * blastPower;
              p.pos.z += Math.sin(blastAngle) * blastPower;
              triggerHaptic([40, 60]);
            }

            // 폭발 파티클 생성
            for (let k = 0; k < 12; k++) {
              const pGeo = new THREE.SphereGeometry(0.18, 8, 8);
              const pMat = new THREE.MeshBasicMaterial({
                color: k % 2 === 0 ? 0xff0099 : 0xffcc00,
              });
              const pMesh = new THREE.Mesh(pGeo, pMat);
              pMesh.position.copy(b.targetPos);
              scene.add(pMesh);

              const pVel = new THREE.Vector3(
                (Math.random() - 0.5) * 12,
                4 + Math.random() * 8,
                (Math.random() - 0.5) * 12
              );
              g.particles.push({ mesh: pMesh, vel: pVel, life: 0.8 });
            }

            g.bombs.splice(i, 1);
          }
        }

        // 파티클 업데이트
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const pt = g.particles[i];
          pt.life -= dt;
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.vel.y -= 18 * dt;

          if (pt.life <= 0) {
            scene.remove(pt.mesh);
            g.particles.splice(i, 1);
          }
        }

        // --- 승리 판정 (35초 생존 또는 최후의 1인 생존) ---
        if (g.timeRemaining <= 0 || currentAlive === 1) {
          g.isGameWon = true;
          setGameWon(true);
          triggerHaptic([50, 80, 120, 200]);
          handleClaimReward(true, g.scoreVal + 50);
          return;
        }

        // 카메라 타깃 추종 (부드러운 러프)
        if (g.camera) {
          const targetCamX = p.pos.x * 0.4;
          const targetCamZ = p.pos.z * 0.4 + 22;
          g.camera.position.x += (targetCamX - g.camera.position.x) * 0.05;
          g.camera.position.z += (targetCamZ - g.camera.position.z) * 0.05;
          g.camera.lookAt(p.pos.x * 0.2, 0.5, p.pos.z * 0.2 + 2);
        }
      }

      if (g.renderer && g.scene && g.camera) {
        g.renderer.render(g.scene, g.camera);
      }
    };

    gameLoopRef.current.animId = requestAnimationFrame(animate);

    // 클린업
    return () => {
      cancelAnimationFrame(gameLoopRef.current.animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, handleClaimReward, playSfx, triggerHaptic]);

  // 점프 액션
  const handleJump = useCallback(() => {
    const p = gameLoopRef.current.player;
    if (!p.isJumping && p.alive && !gameLoopRef.current.isGameOver) {
      p.isJumping = true;
      p.vy = 10.5; // 최대 도약 높이 약 2.1m
      triggerHaptic(25);
      if (playSfx) playSfx('jump');
    }
  }, [playSfx, triggerHaptic]);

  // 다이브 액션 (공중 수평 슬라이드)
  const handleDive = useCallback(() => {
    const p = gameLoopRef.current.player;
    if (!p.isDiving && p.alive && !gameLoopRef.current.isGameOver) {
      p.isDiving = true;
      p.diveTimer = 0.55;
      triggerHaptic([30, 20]);
      if (playSfx) playSfx('dash');
    }
  }, [playSfx, triggerHaptic]);

  // 가상 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setJoystickActive(true);
    setJoystickPos({ x: touch.clientX, y: touch.clientY });
    setJoystickDelta({ x: 0, y: 0 });
    inputDirRef.current = { x: 0, z: 0 };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - joystickPos.x;
        const dy = touch.clientY - joystickPos.y;
        const maxDist = 55;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const nx = Math.cos(angle) * (clampedDist / maxDist);
        const ny = Math.sin(angle) * (clampedDist / maxDist);

        setJoystickDelta({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
        // Three.js 카메라 탑다운 쿼터뷰: 화면 오른쪽 = +X, 화면 위쪽 = -Z
        inputDirRef.current = { x: nx, z: ny };
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setJoystickDelta({ x: 0, y: 0 });
        inputDirRef.current = { x: 0, z: 0 };
        break;
      }
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 3D 캔버스 컨테이너 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 & 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="Party Time 3D"
        score={score}
        targetScore={100}
        onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 상태 표시 오버레이 */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* 생존 시간 & 남은 인원 */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-pink-500/40 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-xs text-pink-400 font-bold block">TIME LEFT</span>
            <span className="text-xl text-yellow-300 font-black">{timeLeft}s</span>
          </div>

          <div className="bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-xs text-cyan-400 font-bold block">SURVIVORS</span>
            <span className="text-xl text-cyan-300 font-black">{aliveCount} / 5</span>
          </div>
        </div>

        {/* 영웅 카드 배지 */}
        <div className="w-12 h-14 bg-slate-900/90 border border-amber-500/40 rounded-sm overflow-hidden flex flex-col items-center justify-center p-0.5">
          <canvas ref={heroCanvasRef} width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-[9px] text-amber-300 font-black leading-none mt-0.5">No.{cardId}</span>
        </div>
      </div>

      {/* 다이나믹 플로팅 가상 조이스틱 UI */}
      {joystickActive && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: joystickPos.x - 45,
            top: joystickPos.y - 45,
            width: 90,
            height: 90,
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-pink-500/50 bg-pink-950/30 flex items-center justify-center backdrop-blur-xs">
            <div
              className="w-10 h-10 rounded-full bg-pink-500/80 border border-white/80 shadow-md transform"
              style={{
                transform: `translate(${joystickDelta.x}px, ${joystickDelta.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 모바일 액션 버튼 패널 (우측 하단) */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20 pointer-events-auto">
        {/* 공중 다이브 버튼 */}
        <button
          onClick={handleDive}
          className="w-16 h-16 rounded-full bg-cyan-600/90 active:bg-cyan-400 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-cyan-300/80 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-base">💨</span>
          <span>DIVE</span>
        </button>

        {/* 대형 점프 버튼 (80px) */}
        <button
          onClick={handleJump}
          className="w-20 h-20 rounded-full bg-pink-600/90 active:bg-pink-400 text-white font-black text-sm flex flex-col items-center justify-center border-2 border-pink-300/90 shadow-xl active:scale-95 transition-transform"
        >
          <span className="text-2xl">🦘</span>
          <span>JUMP</span>
        </button>
      </div>

      {/* 좌측 하단 조작 가이드 안내 텍스트 */}
      {!joystickActive && (
        <div className="absolute bottom-8 left-6 text-xs text-slate-400 pointer-events-none z-10 flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/50">
          <span>🕹️ 화면 아무 곳이나 터치하여 이동</span>
        </div>
      )}

      {/* 중도 포기 확인 팝업 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">파티에서 나갈까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              지금 나가도 생존 시간에 비례한 SNS 포인트 보상이 안전하게 정산됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmQuit(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-sm border border-slate-600"
              >
                계속하기
              </button>
              <button
                onClick={() => {
                  setShowConfirmQuit(false);
                  handleClaimReward(false, score);
                  handleExit();
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-sm"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="Party Time 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '35초 생존 서바이벌',
              desc: '공중 부유 파티 아레나에서 회전하는 스위퍼와 낙하 폭탄을 피해 끝까지 살아남으세요!',
            },
            {
              iconType: 'GESTURES',
              title: '점프 & 다이브 회피',
              desc: '하단 붉은 바는 [JUMP]로 뛰어넘고, 상단 푸른 바는 [DIVE]로 숙여서 통과하세요.',
            },
            {
              iconType: 'REWARDS',
              title: '파티 챔피언 보상',
              desc: '생존 시간과 최종 순위에 따라 최대 50 SNS 포인트를 영구 획득합니다.',
            },
          ]}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* 승리 및 정산 모달 */}
      {(gameWon || gameOver) && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          isVictory={gameWon}
          score={score}
          reward={rewardResult}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};
