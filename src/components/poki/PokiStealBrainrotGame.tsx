import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiStealBrainrotGameProps {
  onBack: () => void;
  cardId?: number;
  deck?: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit?: () => void;
  onReward?: (amount: number) => void;

  onClose?: () => void;
}

interface Wall {
  x: number;
  z: number;
  w: number;
  d: number;
}

interface GuardDrone {
  id: number;
  mesh: THREE.Group;
  visionCone: THREE.Mesh;
  eyeLight: THREE.PointLight;
  pos: THREE.Vector3;
  waypoints: THREE.Vector3[];
  currentWp: number;
  facingAngle: number;
  speed: number;
  isAlerted: boolean;
}

export const PokiStealBrainrotGame: React.FC<PokiStealBrainrotGameProps> = ({
  onBack,
  cardId = 21,
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
  onClose
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || cardId || 21;
  const handleExit = onExit || onBack;

  const containerRef = useRef<HTMLDivElement>(null);
  const heroSpriteCanvasRef = useRef<HTMLCanvasElement>(null);

  // 게임 상태
  const [score, setScore] = useState<number>(0);
  const onRewardRef = useRef(onReward);
  onRewardRef.current = onReward;
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [stamina, setStamina] = useState<number>(100);
  const [hasBrainrot, setHasBrainrot] = useState<boolean>(false);
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // 튜토리얼
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_steal_brainrot') !== 'true';
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

  // 시뮬레이션 상태 Ref
  const stateRef = useRef({
    player: {
      pos: new THREE.Vector3(-12, 0.6, 0), // 서쪽 헬리패드 안전 시작 구역
      vel: new THREE.Vector3(0, 0, 0),
      facingAngle: 0,
      hp: 100,
      stamina: 100,
      isSprinting: false,
      hasBrainrot: false,
      invulnerableTimer: 0,
    },
    brainrot: {
      pos: new THREE.Vector3(10, 1.4, 0),
      mesh: null as THREE.Group | null,
      collected: false,
    },
    safeZone: {
      pos: new THREE.Vector3(-12, 0, 0),
      radius: 3.5,
    },
    guards: [] as GuardDrone[],
    walls: [] as Wall[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    touchDir: { x: 0, y: 0 },
    keys: { w: false, a: false, s: false, d: false, shift: false },
    alarmActive: false,
    alarmLight: null as THREE.PointLight | null,
  });

  // 영웅 카드 스프라이트 페이스 캐싱
  useEffect(() => {
    if (!heroSpriteCanvasRef.current) return;
    const ctx = heroSpriteCanvasRef.current.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, playerHeroId, 0, 0, 64, 64);
  }, [playerHeroId]);

  // Three.js 씬 초기화 및 메인 루프
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬, 카메라, 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060914);
    scene.fog = new THREE.FogExp2(0x060914, 0.02);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(-12, 16, 15);
    camera.lookAt(-12, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(10, 25, 10);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // 비상 알람 붉은 포인트 라이트
    const alarmPointLight = new THREE.PointLight(0xff0033, 0, 35);
    alarmPointLight.position.set(0, 8, 0);
    scene.add(alarmPointLight);
    stateRef.current.alarmLight = alarmPointLight;

    // 1. 기지 바닥 (32m x 26m 하이테크 그리드 타일)
    const floorGeo = new THREE.PlaneGeometry(32, 26);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // 바닥 그리드 라인
    const grid = new THREE.GridHelper(32, 32, 0x00f3ff, 0x1e293b);
    grid.position.y = 0.02;
    scene.add(grid);

    // 2. 안전 탈출 헬리패드 (X = -12, Z = 0)
    const heliGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.1, 32);
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const helipad = new THREE.Mesh(heliGeo, heliMat);
    helipad.position.set(-12, 0.05, 0);
    scene.add(helipad);

    const ringGeo = new THREE.RingGeometry(3.2, 3.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    const heliRing = new THREE.Mesh(ringGeo, ringMat);
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.set(-12, 0.12, 0);
    scene.add(heliRing);

    // 3. 기지 벽면 및 엄폐물 구축
    stateRef.current.walls = [];
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const wallEdgeMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

    const createWall = (x: number, z: number, w: number, d: number, h = 2.5) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);

      const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), wallEdgeMat);
      edge.position.set(x, h + 0.04, z);
      scene.add(edge);

      stateRef.current.walls.push({ x, z, w, d });
    };

    // 외곽 경계 벽
    createWall(0, -13, 32, 0.6);
    createWall(0, 13, 32, 0.6);
    createWall(-16, 0, 0.6, 26);
    createWall(16, 0, 0.6, 26);

    // 내부 엄폐 벽 및 파티션
    createWall(-6, -6, 0.8, 8);
    createWall(-6, 6, 0.8, 8);
    createWall(0, 0, 1.2, 8);
    createWall(4, -7, 6, 0.8);
    createWall(4, 7, 6, 0.8);

    // 4. 중앙 볼트 챔버 & 황금 Brainrot Core (X = 10, Z = 0)
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(10, 0, 0);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.8, 1.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
    );
    pedestal.position.y = 0.5;
    vaultGroup.add(pedestal);

    // 황금 브레인롯 코어 (빛나는 홀로그램 뇌 & 황금 구체)
    const brainrotGroup = new THREE.Group();
    brainrotGroup.position.set(10, 1.8, 0);

    const coreMesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.7, 1),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 })
    );
    brainrotGroup.add(coreMesh);

    const auraRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.06, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff })
    );
    auraRing.rotation.x = Math.PI / 3;
    brainrotGroup.add(auraRing);

    const coreLight = new THREE.PointLight(0xfacc15, 2.0, 8);
    brainrotGroup.add(coreLight);

    scene.add(vaultGroup);
    scene.add(brainrotGroup);
    stateRef.current.brainrot.mesh = brainrotGroup;

    // 5. 플레이어 요원 아바타
    const playerGroup = new THREE.Group();
    playerGroup.position.copy(stateRef.current.player.pos);

    // 스텔스 슈트 몸체
    const pBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    pBody.position.y = 0.6;
    playerGroup.add(pBody);

    // 사이버 바이저 헤드
    const pHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    pHead.position.y = 1.45;
    playerGroup.add(pHead);

    const pVisor = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.15, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x00f3ff })
    );
    pVisor.position.set(0, 1.45, -0.3);
    playerGroup.add(pVisor);

    scene.add(playerGroup);

    // 6. 보안 가드 드론 3대 & 시야각(Vision Cone)
    stateRef.current.guards = [];
    const guardConfigs = [
      {
        id: 1,
        startX: -3,
        startZ: -6,
        waypoints: [new THREE.Vector3(-3, 0.8, -8), new THREE.Vector3(-3, 0.8, 8)],
      },
      {
        id: 2,
        startX: 3,
        startZ: 6,
        waypoints: [new THREE.Vector3(3, 0.8, 8), new THREE.Vector3(3, 0.8, -8)],
      },
      {
        id: 3,
        startX: 8,
        startZ: 0,
        waypoints: [new THREE.Vector3(7, 0.8, -5), new THREE.Vector3(12, 0.8, 0), new THREE.Vector3(7, 0.8, 5)],
      },
    ];

    guardConfigs.forEach((cfg) => {
      const gGroup = new THREE.Group();
      gGroup.position.copy(cfg.waypoints[0]);

      // 드론 바디
      const dBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.35, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 })
      );
      dBody.position.y = 0.3;
      gGroup.add(dBody);

      // 눈빛 라이트
      const eyeLight = new THREE.PointLight(0xfacc15, 1.5, 6);
      eyeLight.position.set(0, 0.3, -0.4);
      gGroup.add(eyeLight);

      // 반투명 시야 원뿔 (Vision Cone)
      const coneGeo = new THREE.ConeGeometry(3.0, 6.0, 16);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.x = -Math.PI / 2;
      cone.position.set(0, 0.3, -3.0);
      gGroup.add(cone);

      scene.add(gGroup);

      stateRef.current.guards.push({
        id: cfg.id,
        mesh: gGroup,
        visionCone: cone,
        eyeLight,
        pos: cfg.waypoints[0].clone(),
        waypoints: cfg.waypoints,
        currentWp: 0,
        facingAngle: 0,
        speed: 2.4,
        isAlerted: false,
      });
    });

    // 벽 충돌 검사
    const checkWallCollision = (x: number, z: number, radius: number): boolean => {
      for (const w of stateRef.current.walls) {
        const minX = w.x - w.w / 2 - radius;
        const maxX = w.x + w.w / 2 + radius;
        const minZ = w.z - w.d / 2 - radius;
        const maxZ = w.z + w.d / 2 + radius;
        if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
          return true;
        }
      }
      return false;
    };

    // 파티클 생성 함수
    const spawnSparks = (pos: THREE.Vector3, color: number, count = 12) => {
      for (let i = 0; i < (lowSpecMode ? count / 2 : count); i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color }));
        p.position.copy(pos);
        scene.add(p);
        stateRef.current.particles.push({
          mesh: p,
          vel: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 4 + 1, (Math.random() - 0.5) * 5),
          life: 0.5 + Math.random() * 0.3,
        });
      }
    };

    // 비상 경보 트리거 함수
    const triggerAlarm = () => {
      if (stateRef.current.alarmActive) return;
      stateRef.current.alarmActive = true;
      setAlarmActive(true);

      stateRef.current.guards.forEach((g) => {
        g.isAlerted = true;
        g.speed = 3.8;
        (g.visionCone.material as THREE.MeshBasicMaterial).color.setHex(0xff0044);
        g.eyeLight.color.setHex(0xff0044);
        g.eyeLight.intensity = 3.0;
      });

      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      if (navigator.vibrate) navigator.vibrate([100, 80, 100, 80]);
    };

    // 키보드 리스너
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') stateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') stateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = true;
      if (k === 'shift' || k === ' ') toggleSprint(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') stateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') stateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = false;
      if (k === 'shift' || k === ' ') toggleSprint(false);
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

    // 메인 물리 루프
    let animId = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const pState = stateRef.current.player;
      const bState = stateRef.current.brainrot;

      // 알람 조명 점멸
      if (stateRef.current.alarmActive && stateRef.current.alarmLight) {
        stateRef.current.alarmLight.intensity = Math.sin(time * 0.015) * 1.8 + 1.8;
      }

      // 1. 플레이어 스태미나 & 스프린트
      if (pState.isSprinting && (pState.vel.x !== 0 || pState.vel.z !== 0)) {
        pState.stamina = Math.max(0, pState.stamina - dt * 25);
        setStamina(Math.floor(pState.stamina));
        if (pState.stamina <= 0) toggleSprint(false);
      } else if (!pState.isSprinting) {
        pState.stamina = Math.min(100, pState.stamina + dt * 18);
        setStamina(Math.floor(pState.stamina));
      }

      // 2. 플레이어 이동 (화면 기준 오른쪽: +X, 왼쪽: -X, 위: -Z 100% 일치)
      let inputX = 0;
      let inputZ = 0;
      if (stateRef.current.keys.a) inputX -= 1;
      if (stateRef.current.keys.d) inputX += 1;
      if (stateRef.current.keys.w) inputZ -= 1;
      if (stateRef.current.keys.s) inputZ += 1;

      if (stateRef.current.touchDir.x !== 0 || stateRef.current.touchDir.y !== 0) {
        inputX += stateRef.current.touchDir.x;
        inputZ += stateRef.current.touchDir.y;
      }

      const inputLen = Math.hypot(inputX, inputZ);
      const baseSpeed = pState.isSprinting ? 7.2 : pState.hasBrainrot ? 4.8 : 4.0;

      if (inputLen > 0.05) {
        const normX = inputX / inputLen;
        const normZ = inputZ / inputLen;
        pState.facingAngle = Math.atan2(normX, -normZ);

        const newX = pState.pos.x + normX * baseSpeed * dt;
        const newZ = pState.pos.z + normZ * baseSpeed * dt;

        if (!checkWallCollision(newX, pState.pos.z, 0.45)) {
          pState.pos.x = newX;
        }
        if (!checkWallCollision(pState.pos.x, newZ, 0.45)) {
          pState.pos.z = newZ;
        }

        pState.vel.set(normX * baseSpeed, 0, normZ * baseSpeed);
      } else {
        pState.vel.set(0, 0, 0);
      }

      // 무적 타이머
      if (pState.invulnerableTimer > 0) pState.invulnerableTimer -= dt;

      // 플레이어 메쉬 동기화
      playerGroup.position.copy(pState.pos);
      playerGroup.rotation.y = pState.facingAngle;
      playerGroup.visible = pState.invulnerableTimer > 0 ? Math.floor(time / 70) % 2 === 0 : true;

      // 카메라 쿼터뷰 트래킹
      camera.position.x += (pState.pos.x - camera.position.x) * 0.1;
      camera.position.z += (pState.pos.z + 14 - camera.position.z) * 0.1;
      camera.lookAt(pState.pos.x, 0.5, pState.pos.z);

      // 3. 브레인롯 코어 회전 및 탈취 검사
      if (!bState.collected && bState.mesh) {
        bState.mesh.rotation.y += 2.0 * dt;
        const dist = pState.pos.distanceTo(bState.pos);
        if (dist < 1.6) {
          // 브레인롯 획득!
          bState.collected = true;
          bState.mesh.visible = false;
          pState.hasBrainrot = true;
          setHasBrainrot(true);
          setScore((s) => s + 600);

          triggerAlarm();
          spawnSparks(bState.pos, 0xfacc15, 30);
          if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        }
      }

      // 4. 안전 탈출 헬리패드 도달 검사 (승리!)
      if (pState.hasBrainrot) {
        const distToSafe = pState.pos.distanceTo(stateRef.current.safeZone.pos);
        if (distToSafe < stateRef.current.safeZone.radius && !isVictory && !isGameOver) {
          handleVictory();
        }
      }

      // 5. 가드 드론 AI
      stateRef.current.guards.forEach((g) => {
        if (stateRef.current.alarmActive) {
          // 추격 모드: 플레이어를 향해 맹추격
          const toPlayer = new THREE.Vector3().subVectors(pState.pos, g.pos);
          const dist = toPlayer.length();

          if (dist > 0.8) {
            toPlayer.normalize();
            const nextX = g.pos.x + toPlayer.x * g.speed * dt;
            const nextZ = g.pos.z + toPlayer.z * g.speed * dt;

            if (!checkWallCollision(nextX, g.pos.z, 0.4)) g.pos.x = nextX;
            if (!checkWallCollision(g.pos.x, nextZ, 0.4)) g.pos.z = nextZ;

            g.facingAngle = Math.atan2(toPlayer.x, -toPlayer.z);
          }

          // 플레이어 접촉 타격
          if (dist < 1.2 && pState.invulnerableTimer <= 0) {
            handlePlayerHit();
          }
        } else {
          // 일반 순찰 모드
          const targetWp = g.waypoints[g.currentWp];
          const toWp = new THREE.Vector3().subVectors(targetWp, g.pos);
          const distToWp = toWp.length();

          if (distToWp < 0.5) {
            g.currentWp = (g.currentWp + 1) % g.waypoints.length;
          } else {
            toWp.normalize();
            g.pos.x += toWp.x * g.speed * dt;
            g.pos.z += toWp.z * g.speed * dt;
            g.facingAngle = Math.atan2(toWp.x, -toWp.z);
          }

          // 플레이어가 시야각 콘 내에 들어왔는지 감지 검사
          const toPlayer = new THREE.Vector3().subVectors(pState.pos, g.pos);
          const pDist = toPlayer.length();
          if (pDist < 6.0) {
            toPlayer.normalize();
            const forward = new THREE.Vector3(Math.sin(g.facingAngle), 0, -Math.cos(g.facingAngle));
            const dot = forward.dot(toPlayer);
            if (dot > 0.65) {
              // 감지됨! 알람 트리거!
              triggerAlarm();
            }
          }
        }

        // 드론 위치 및 회전 동기화
        g.mesh.position.set(g.pos.x, 0.8 + Math.sin(time * 0.005 + g.id) * 0.1, g.pos.z);
        g.mesh.rotation.y = g.facingAngle;
      });

      // 6. 파티클 업데이트
      for (let i = stateRef.current.particles.length - 1; i >= 0; i--) {
        const pt = stateRef.current.particles[i];
        pt.vel.y -= 9.8 * dt;
        pt.mesh.position.addScaledVector(pt.vel, dt);
        pt.life -= dt;
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
          stateRef.current.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    // 스프린트 토글
    const toggleSprint = (sprint: boolean) => {
      const pState = stateRef.current.player;
      if (sprint && pState.stamina > 15) {
        pState.isSprinting = true;
        setIsSprinting(true);
        if (navigator.vibrate) navigator.vibrate(25);
      } else {
        pState.isSprinting = false;
        setIsSprinting(false);
      }
    };

    // 피격 처리
    const handlePlayerHit = () => {
      const pState = stateRef.current.player;
      pState.hp = Math.max(0, pState.hp - 25);
      pState.invulnerableTimer = 1.0;
      setPlayerHp(pState.hp);

      spawnSparks(pState.pos, 0xff0022, 18);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      if (navigator.vibrate) navigator.vibrate([50, 70, 50]);

      if (pState.hp <= 0) {
        setIsGameOver(true);
        const receipt = calculateAndDepositMissionReward({
          gameId: 'poki_steal_brainrot',
          gameTitle: 'Steal a Brainrot 3D',
          durationSeconds: 30,
          score,
          maxTargetScore: 1600,
          isVictory: false,
        });
        setSettlementReceipt(receipt);
        if (onRewardRef.current) onRewardRef.current(receipt.totalSns);
      }
    };

    // 승리 처리
    const handleVictory = () => {
      setIsVictory(true);
      const finalScore = score + 1000;
      setScore(finalScore);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'poki_steal_brainrot',
        gameTitle: 'Steal a Brainrot 3D',
        durationSeconds: 45,
        score: finalScore,
        maxTargetScore: 1600,
        isVictory: true,
      });
      setSettlementReceipt(receipt);
      if (onRewardRef.current) onRewardRef.current(receipt.totalSns);
    };

    (container as any).__toggleSprint = toggleSprint;

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
  }, [lowSpecMode]);

  // 터치 조이스틱 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX > window.innerWidth * 0.65) return;

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
    const dy = touch.clientY - joystick.startY;
    const maxDist = 50;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    const cx = joystick.startX + Math.cos(angle) * clampedDist;
    const cy = joystick.startY + Math.sin(angle) * clampedDist;

    setJoystick((prev) => ({ ...prev, curX: cx, curY: cy }));

    // 화면 기준 오른쪽 = +X, 위 = -Z 100% 일치
    stateRef.current.touchDir = {
      x: dx / maxDist,
      y: dy / maxDist,
    };
  }, [joystick.active, joystick.startX, joystick.startY]);

  const handleTouchEnd = useCallback(() => {
    setJoystick({ active: false, startX: 0, startY: 0, curX: 0, curY: 0 });
    stateRef.current.touchDir = { x: 0, y: 0 };
  }, []);

  // 튜토리얼 스텝
  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '브레인롯 탈취 작전' : 'Steal a Brainrot Operation',
      badge: 'STEALTH 3D',
      description: isKo
        ? '적 보안 기지에 침투하여 중앙 볼트의 황금 브레인롯 코어를 탈취하고 탈출하세요!'
        : 'Infiltrate the enemy base, steal the Golden Brainrot Core, and escape safely!',
      keyPoints: isKo
        ? ['좌측 화면 터치 드래그로 360° 자유 잠입 이동', '가드 드론의 노란 시야각을 피해 침투']
        : ['Drag left screen to sneak in 360°', 'Avoid the guards\' yellow vision cones'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '비상 알람 & 헬리패드 탈출' : 'Alarm Pursuit & Escape',
      badge: 'ESCAPE',
      description: isKo
        ? '코어를 탈취하면 기지 전체에 비상 알람이 발령됩니다! 전력질주로 헬리패드로 탈출하세요.'
        : 'Stealing the core triggers the alarm! Sprint back to the helipad to win.',
      keyPoints: isKo
        ? ['우측 80px [스프린트] 버튼으로 고속 질주', '서쪽 초록 링 헬리패드에 도착하면 미션 성공']
        : ['80px [SPRINT] button for high-speed escape', 'Reach the green helipad to complete the heist'],
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
        onBack={handleExit}
        gameTitle="Steal a Brainrot 3D"
        score={score}
        targetScore={1600}
        timeLeft={0}
        onQuit={handleExit}
        isKo={isKo}
        rewardUnit="SNS"
        customStatLabel={isKo ? '작전 상태' : 'STATUS'}
        customStatValue={
          hasBrainrot
            ? isKo ? '🚨 브레인롯 탈취! 헬리패드로 탈출!' : '🚨 ESCAPE TO HELIPAD!'
            : alarmActive
            ? isKo ? '⚠️ 경보 발령! 은신 필요!' : '⚠️ ALARM TRIGGERED!'
            : isKo ? '🤫 은밀히 잠입 중...' : '🤫 Infiltrating...'
        }
      />

      {/* 체력 HP & 스태미나 게이지 HUD */}
      <div className="absolute top-16 left-4 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 border border-cyan-500/40">
        <canvas ref={heroSpriteCanvasRef} width={40} height={40} className="w-10 h-10 border border-cyan-400 bg-slate-800" />
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-cyan-300 font-bold gap-3">
            <span>HP</span>
            <span>{playerHp}%</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-800 border border-slate-700">
            <div
              className={`h-full transition-all duration-200 ${
                playerHp > 50 ? 'bg-cyan-400' : playerHp > 25 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${playerHp}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-amber-300 font-bold gap-3">
            <span>STAMINA</span>
            <span>{stamina}%</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-800 border border-slate-700">
            <div className="h-full bg-amber-400 transition-all duration-200" style={{ width: `${stamina}%` }} />
          </div>
        </div>
      </div>

      {/* 브레인롯 소지 여부 배지 */}
      {hasBrainrot && (
        <div className="absolute top-16 right-4 z-20 bg-amber-950/80 backdrop-blur-md px-3 py-1.5 border border-amber-400 text-xs font-black text-amber-300 animate-pulse">
          🧠 BRAINROT CORE SECURED!
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
              top: 45 - 16 + (joystick.curY - joystick.startY),
            }}
          />
        </div>
      )}

      {/* 우측 퓨어 터치 조작 패널 (스프린트 버튼) */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
        <button
          type="button"
          onMouseDown={() => {
            if (containerRef.current && (containerRef.current as any).__toggleSprint) {
              (containerRef.current as any).__toggleSprint(true);
            }
          }}
          onMouseUp={() => {
            if (containerRef.current && (containerRef.current as any).__toggleSprint) {
              (containerRef.current as any).__toggleSprint(false);
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            if (containerRef.current && (containerRef.current as any).__toggleSprint) {
              (containerRef.current as any).__toggleSprint(true);
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            if (containerRef.current && (containerRef.current as any).__toggleSprint) {
              (containerRef.current as any).__toggleSprint(false);
            }
          }}
          disabled={stamina <= 0}
          className={`w-20 h-20 rounded-sm border-2 font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-lg transition-transform ${
            isSprinting
              ? 'bg-amber-500 border-amber-200 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.8)]'
              : stamina > 15
              ? 'bg-slate-900/90 border-amber-400 text-amber-300 active:bg-amber-700'
              : 'bg-slate-800/80 border-slate-600 text-slate-500 opacity-60'
          }`}
        >
          <span className="text-2xl">⚡</span>
          <span className="mt-0.5 tracking-wider font-extrabold">{isKo ? '달리기' : 'SPRINT'}</span>
        </button>
      </div>

      {/* 좌측 하단 데스크톱 가이드 */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:block text-slate-400 text-xs bg-slate-900/80 px-3 py-2 border border-slate-700">
        <div>[WASD / 터치드래그]: 360° 잠입 이동</div>
        <div>[Shift / Space]: 전력질주 스프린트</div>
      </div>

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_steal_brainrot', 'true');
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
            <h2 className="text-2xl font-black text-red-500 mb-2">{isKo ? '체포됨' : 'BUSTED!'}</h2>
            <p className="text-slate-300 text-sm mb-4">
              {isKo ? '보안 가드 드론에게 발각되어 체포되었습니다!' : 'Caught and neutralized by the security drones!'}
            </p>
            <div className="bg-slate-800 p-3 mb-4 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>{isKo ? '브레인롯 획득' : 'Brainrot Secured'}:</span>
                <span className="text-amber-400 font-bold">{hasBrainrot ? 'YES' : 'NO'}</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최종 점수' : 'Score'}:</span>
                <span className="text-cyan-400 font-bold">{score}</span>
              </div>
              {settlementReceipt && (
                <div className="flex justify-between text-amber-300 pt-1 border-t border-slate-700">
                  <span>{isKo ? '지급 보상' : 'Reward'}:</span>
                  <span className="font-bold">+{settlementReceipt.totalSns} SNS</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleExit}
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
            handleExit();
          }}
          isKo={isKo}
        />
      )}
    </div>
  );
};

export default PokiStealBrainrotGame;
