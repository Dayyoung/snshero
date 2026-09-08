import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiBackroomsRecoveryGameProps {
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

interface ItemObj {
  id: string;
  type: 'keycard' | 'battery';
  x: number;
  z: number;
  mesh: THREE.Mesh;
  collected: boolean;
}

interface EntityObj {
  id: number;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  state: 'patrol' | 'chase';
  speed: number;
  eyeLight: THREE.PointLight;
}

export const PokiBackroomsRecoveryGame: React.FC<PokiBackroomsRecoveryGameProps> = ({
  onBack,
  cardId = 19,
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
  onClose
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || cardId || 19;
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
  const [sanity, setSanity] = useState<number>(100);
  const [stamina, setStamina] = useState<number>(100);
  const [flashlightBattery, setFlashlightBattery] = useState<number>(100);
  const [flashlightOn, setFlashlightOn] = useState<boolean>(true);
  const [keysFound, setKeysFound] = useState<number>(0);
  const totalKeys = 3;
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // 튜토리얼
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_backrooms') !== 'true';
    } catch {
      return true;
    }
  });

  // 조이스틱
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
      pos: new THREE.Vector3(-10, 0.8, -10), // 안전 스타트 구역
      facingAngle: 0,
      vel: new THREE.Vector3(0, 0, 0),
      sanity: 100,
      stamina: 100,
      battery: 100,
      isSprinting: false,
      flashlightOn: true,
      invulnerableTimer: 0,
    },
    touchDir: { x: 0, y: 0 },
    keys: { w: false, a: false, s: false, d: false, shift: false, f: false },
    walls: [] as Wall[],
    items: [] as ItemObj[],
    entities: [] as EntityObj[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    flashlightSpot: null as THREE.SpotLight | null,
    exitGateMesh: null as THREE.Group | null,
    isExitUnlocked: false,
  });

  // 영웅 카드 스프라이트 페이스 캐싱
  useEffect(() => {
    if (!heroSpriteCanvasRef.current) return;
    const ctx = heroSpriteCanvasRef.current.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, playerHeroId, 0, 0, 64, 64);
  }, [playerHeroId]);

  // Three.js 씬 초기화 및 게임 루프
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬, 카메라, 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5);
    scene.fog = new THREE.FogExp2(0xfbf3d5, 0.05);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(-10, 3.2, -6);
    camera.lookAt(-10, 1.2, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 미약한 노란 앰비언트 라이트 (백룸 특유의 침침한 분위기)
    const ambientLight = new THREE.AmbientLight(0xd4b483, 0.95);
    scene.add(ambientLight);

    // 1. 바닥 (28m x 28m 베이지 카펫) & 천장 (흰색 타일)
    const floorGeo = new THREE.PlaneGeometry(28, 28);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xb59e6d, roughness: 0.85 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    const ceilingGeo = new THREE.PlaneGeometry(28, 28);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.7 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 3.2;
    scene.add(ceiling);

    // 2. 백룸 복도 미로 벽면 구축
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xc4a35a, // 기묘한 노란 벽지
      roughness: 0.7,
      metalness: 0.1,
    });

    const walls: Wall[] = [
      // 외곽 경계 벽
      { x: 0, z: -14, w: 28, d: 0.6 },
      { x: 0, z: 14, w: 28, d: 0.6 },
      { x: -14, z: 0, w: 0.6, d: 28 },
      { x: 14, z: 0, w: 0.6, d: 28 },
      // 내부 복도 미로 파티션들
      { x: -7, z: -6, w: 0.6, d: 10 },
      { x: -2, z: -10, w: 10, d: 0.6 },
      { x: 4, z: -5, w: 0.6, d: 10 },
      { x: -3, z: 0, w: 8, d: 0.6 },
      { x: 7, z: 2, w: 10, d: 0.6 },
      { x: -8, z: 6, w: 0.6, d: 10 },
      { x: -1, z: 7, w: 8, d: 0.6 },
      { x: 5, z: 8, w: 0.6, d: 8 },
      { x: 0, z: -3, w: 0.6, d: 6 },
    ];
    stateRef.current.walls = walls;

    walls.forEach((w) => {
      const geo = new THREE.BoxGeometry(w.w, 3.2, w.d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(w.x, 1.6, w.z);
      mesh.castShadow = !lowSpecMode;
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);
    });

    // 천장 형광등 메쉬 및 포인트 라이트 (미로 곳곳에 6개)
    const lampPositions = [
      { x: -10, z: -10 },
      { x: 0, z: -8 },
      { x: 10, z: -6 },
      { x: -6, z: 3 },
      { x: 2, z: 4 },
      { x: 10, z: 10 },
    ];

    const lampGeo = new THREE.BoxGeometry(1.6, 0.1, 0.4);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });

    lampPositions.forEach((pos) => {
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(pos.x, 3.15, pos.z);
      scene.add(lamp);

      const pLight = new THREE.PointLight(0xfff0cc, 0.7, 8);
      pLight.position.set(pos.x, 2.9, pos.z);
      scene.add(pLight);
    });

    // 3. 비상구 탈출 게이트 (X: 12, Z: 12)
    const exitGroup = new THREE.Group();
    exitGroup.position.set(12, 0, 12);

    // 철제 문 프레임
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.8, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    doorFrame.position.y = 1.4;
    exitGroup.add(doorFrame);

    // 초록색 EXIT 비상구 전등
    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.4, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    exitSign.position.set(0, 2.9, 0.25);
    exitGroup.add(exitSign);

    const exitLight = new THREE.PointLight(0x22c55e, 1.5, 6);
    exitLight.position.set(0, 2.8, 0.4);
    exitGroup.add(exitLight);

    scene.add(exitGroup);
    stateRef.current.exitGateMesh = exitGroup;

    // 4. 수집 자원들 (키카드 3개, 배터리 2개)
    stateRef.current.items = [];

    const keycardConfigs = [
      { id: 'key1', x: 9, z: -10 },
      { id: 'key2', x: -11, z: 2 },
      { id: 'key3', x: 2, z: 11 },
    ];

    keycardConfigs.forEach((cfg) => {
      const cardGeo = new THREE.BoxGeometry(0.5, 0.04, 0.7);
      const cardMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
      const card = new THREE.Mesh(cardGeo, cardMat);
      card.position.set(cfg.x, 0.4, cfg.z);
      scene.add(card);

      // 발광 링
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.55, 16),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(cfg.x, 0.05, cfg.z);
      scene.add(ring);

      stateRef.current.items.push({
        id: cfg.id,
        type: 'keycard',
        x: cfg.x,
        z: cfg.z,
        mesh: card,
        collected: false,
      });
    });

    const batteryConfigs = [
      { id: 'bat1', x: 1, z: -2 },
      { id: 'bat2', x: -5, z: 10 },
    ];

    batteryConfigs.forEach((cfg) => {
      const batGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 12);
      const batMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
      const bat = new THREE.Mesh(batGeo, batMat);
      bat.position.set(cfg.x, 0.35, cfg.z);
      scene.add(bat);

      stateRef.current.items.push({
        id: cfg.id,
        type: 'battery',
        x: cfg.x,
        z: cfg.z,
        mesh: bat,
        collected: false,
      });
    });

    // 5. 플레이어 아바타 & 손전등 스포트라이트
    const playerGroup = new THREE.Group();
    playerGroup.position.copy(stateRef.current.player.pos);

    // 탐험가 몸체
    const pBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    pBody.position.y = 0.7;
    playerGroup.add(pBody);

    // 머리
    const pHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf5d0b0 })
    );
    pHead.position.y = 1.6;
    playerGroup.add(pHead);

    scene.add(playerGroup);

    // 플레이어 손전등 스포트라이트
    const spotLight = new THREE.SpotLight(0xfff5db, 2.8, 16, Math.PI / 5, 0.35, 1);
    spotLight.position.set(0, 1.2, 0);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 1.0, -8);
    playerGroup.add(spotTarget);
    spotLight.target = spotTarget;
    playerGroup.add(spotLight);
    stateRef.current.flashlightSpot = spotLight;

    // 6. 엔티티 (The Smiler / Dark Stalker 2마리)
    stateRef.current.entities = [];
    const entityConfigs = [
      { id: 1, startX: 8, startZ: -4 },
      { id: 2, startX: -6, startZ: 9 },
    ];

    entityConfigs.forEach((cfg) => {
      const eGroup = new THREE.Group();
      eGroup.position.set(cfg.startX, 0, cfg.startZ);

      // 검은 그림자 바디
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.2, 1.8, 8),
        new THREE.MeshBasicMaterial({ color: 0x0a0a0f })
      );
      body.position.y = 0.9;
      eGroup.add(body);

      // 번뜩이는 붉은 눈알 2개
      const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
      const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
      eye1.position.set(0.2, 1.6, -0.35);
      const eye2 = eye1.clone();
      eye2.position.x = -0.2;
      eGroup.add(eye1, eye2);

      // 기괴한 이빨 미소
      const smileGeo = new THREE.BoxGeometry(0.45, 0.08, 0.1);
      const smileMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const smile = new THREE.Mesh(smileGeo, smileMat);
      smile.position.set(0, 1.35, -0.36);
      eGroup.add(smile);

      const eyeLight = new THREE.PointLight(0xff0022, 1.5, 4);
      eyeLight.position.set(0, 1.5, -0.4);
      eGroup.add(eyeLight);

      scene.add(eGroup);

      stateRef.current.entities.push({
        id: cfg.id,
        mesh: eGroup,
        pos: new THREE.Vector3(cfg.startX, 0, cfg.startZ),
        targetPos: new THREE.Vector3(cfg.startX, 0, cfg.startZ),
        state: 'patrol',
        speed: 2.2,
        eyeLight,
      });
    });

    // 벽 충돌 검사 함수
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
          vel: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 4),
          life: 0.5 + Math.random() * 0.3,
        });
      }
    };

    // 키보드 리스너
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') stateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') stateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = true;
      if (k === 'shift') toggleSprint(true);
      if (k === 'f') toggleFlashlight();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') stateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') stateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = false;
      if (k === 'shift') toggleSprint(false);
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

      // 1. 손전등 배터리 감소 및 조명 업데이트
      if (pState.flashlightOn && pState.battery > 0) {
        pState.battery = Math.max(0, pState.battery - dt * 1.5);
        setFlashlightBattery(Math.floor(pState.battery));
        if (stateRef.current.flashlightSpot) {
          stateRef.current.flashlightSpot.intensity = pState.battery > 15 ? 2.8 : 1.0;
        }
      } else {
        if (stateRef.current.flashlightSpot) {
          stateRef.current.flashlightSpot.intensity = 0;
        }
      }

      // 2. 스태미나 갱신
      if (pState.isSprinting && (pState.vel.x !== 0 || pState.vel.z !== 0)) {
        pState.stamina = Math.max(0, pState.stamina - dt * 25);
        setStamina(Math.floor(pState.stamina));
        if (pState.stamina <= 0) toggleSprint(false);
      } else if (!pState.isSprinting) {
        pState.stamina = Math.min(100, pState.stamina + dt * 18);
        setStamina(Math.floor(pState.stamina));
      }

      // 3. 이동 처리 (화면 기준 오른쪽: +X, 왼쪽: -X, 전방: -Z 100% 일치)
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
      const baseSpeed = pState.isSprinting ? 6.5 : 3.8;

      if (inputLen > 0.05) {
        const normX = inputX / inputLen;
        const normZ = inputZ / inputLen;
        const targetAngle = Math.atan2(normX, -normZ);
        pState.facingAngle = targetAngle;

        // 벽 충돌 고려 이동
        const newX = pState.pos.x + normX * baseSpeed * dt;
        const newZ = pState.pos.z + normZ * baseSpeed * dt;

        if (!checkWallCollision(newX, pState.pos.z, 0.4)) {
          pState.pos.x = newX;
        }
        if (!checkWallCollision(pState.pos.x, newZ, 0.4)) {
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

      // 카메라 3인칭 백뷰 트래킹
      camera.position.x += (pState.pos.x - camera.position.x) * 0.12;
      camera.position.z += (pState.pos.z + 5.0 - camera.position.z) * 0.12;
      camera.position.y = 2.8;
      camera.lookAt(pState.pos.x, 1.2, pState.pos.z - 2.5);

      // 4. 아이템 수집 검사
      stateRef.current.items.forEach((item) => {
        if (!item.collected) {
          item.mesh.rotation.y += 2.0 * dt;
          const dist = Math.hypot(pState.pos.x - item.x, pState.pos.z - item.z);
          if (dist < 1.1) {
            item.collected = true;
            item.mesh.visible = false;

            if (item.type === 'keycard') {
              setKeysFound((k) => {
                const nextK = k + 1;
                if (nextK >= totalKeys) {
                  stateRef.current.isExitUnlocked = true;
                }
                return nextK;
              });
              setScore((s) => s + 350);
              spawnSparks(new THREE.Vector3(item.x, 0.5, item.z), 0x00f3ff, 20);
            } else {
              pState.battery = Math.min(100, pState.battery + 40);
              setFlashlightBattery(Math.floor(pState.battery));
              setScore((s) => s + 100);
              spawnSparks(new THREE.Vector3(item.x, 0.5, item.z), 0x4ade80, 15);
            }

            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            if (navigator.vibrate) navigator.vibrate(30);
          }
        }
      });

      // 5. 비상구 탈출 검사
      if (stateRef.current.isExitUnlocked) {
        const distToExit = Math.hypot(pState.pos.x - 12, pState.pos.z - 12);
        if (distToExit < 2.0 && !isVictory && !isGameOver) {
          handleVictory();
        }
      }

      // 6. 엔티티 AI (순찰 vs 추격)
      stateRef.current.entities.forEach((e) => {
        const toPlayer = new THREE.Vector3().subVectors(pState.pos, e.pos);
        const dist = toPlayer.length();

        // 7m 이내 접근 시 추격 모드 전환
        if (dist < 7.5 && pState.sanity > 0) {
          e.state = 'chase';
          e.speed = 3.6;
          e.eyeLight.intensity = 3.0;

          toPlayer.normalize();
          const nextX = e.pos.x + toPlayer.x * e.speed * dt;
          const nextZ = e.pos.z + toPlayer.z * e.speed * dt;

          if (!checkWallCollision(nextX, e.pos.z, 0.4)) e.pos.x = nextX;
          if (!checkWallCollision(e.pos.x, nextZ, 0.4)) e.pos.z = nextZ;

          e.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

          // 플레이어 접촉 공격
          if (dist < 1.2 && pState.invulnerableTimer <= 0) {
            handlePlayerAttacked();
          }
        } else {
          e.state = 'patrol';
          e.speed = 1.8;
          e.eyeLight.intensity = 1.2;
          // 가벼운 부유 모션
          e.mesh.position.y = Math.sin(time * 0.003 + e.id) * 0.1;
        }

        e.mesh.position.x = e.pos.x;
        e.mesh.position.z = e.pos.z;
      });

      // 7. 파티클 업데이트
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

    // 스프린트 토글
    const toggleSprint = (sprint: boolean) => {
      const pState = stateRef.current.player;
      if (sprint && pState.stamina > 20) {
        pState.isSprinting = true;
        setIsSprinting(true);
        if (navigator.vibrate) navigator.vibrate(25);
      } else {
        pState.isSprinting = false;
        setIsSprinting(false);
      }
    };

    // 손전등 토글
    const toggleFlashlight = () => {
      const pState = stateRef.current.player;
      pState.flashlightOn = !pState.flashlightOn;
      setFlashlightOn(pState.flashlightOn);
      if (navigator.vibrate) navigator.vibrate(20);
    };

    // 피격 처리
    const handlePlayerAttacked = () => {
      const pState = stateRef.current.player;
      pState.sanity = Math.max(0, pState.sanity - 25);
      pState.invulnerableTimer = 1.2;
      setSanity(pState.sanity);

      spawnSparks(pState.pos, 0xff0022, 18);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      if (navigator.vibrate) navigator.vibrate([60, 80, 60]);

      if (pState.sanity <= 0) {
        setIsGameOver(true);
        const receipt = calculateAndDepositMissionReward({
          gameId: 'poki_backrooms_recovery',
          gameTitle: 'Backrooms Recovery 3D',
          durationSeconds: 35,
          score,
          maxTargetScore: 1500,
          isVictory: false,
        });
        setSettlementReceipt(receipt);
        if (onRewardRef.current) onRewardRef.current(receipt.totalSns);
      }
    };

    // 승리 처리
    const handleVictory = () => {
      setIsVictory(true);
      const finalScore = score + 1200;
      setScore(finalScore);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'poki_backrooms_recovery',
        gameTitle: 'Backrooms Recovery 3D',
        durationSeconds: 50,
        score: finalScore,
        maxTargetScore: 1500,
        isVictory: true,
      });
      setSettlementReceipt(receipt);
      if (onRewardRef.current) onRewardRef.current(receipt.totalSns);
    };

    (container as any).__toggleSprint = toggleSprint;
    (container as any).__toggleFlashlight = toggleFlashlight;

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

    // 화면 기준 오른쪽 = +X, 위 = -Z
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
      title: isKo ? '백룸 리커버리 3D 미로' : 'Backrooms Recovery 3D',
      badge: 'BACKROOMS',
      description: isKo
        ? '끝없는 노란 복도 백룸에서 흩어진 3개의 마그네틱 키카드를 찾아 비상구로 탈출하세요!'
        : 'Find all 3 magnetic keycards in the yellow labyrinth and escape through the exit door!',
      keyPoints: isKo
        ? ['좌측 화면 터치 드래그로 360° 자유 탐색', '키카드 3개를 모두 모으면 비상구가 개방됩니다']
        : ['Drag left screen to explore 360°', 'Collect all 3 keycards to unlock the emergency exit'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '스프린트 질주 & 손전등' : 'Sprint & Flashlight Controls',
      badge: 'CONTROLS',
      description: isKo
        ? '붉은 눈의 그림자 엔티티를 마주치면 전력질주로 코너를 돌아 도망치세요.'
        : 'If the shadow entity pursues you, sprint around corners to break line of sight.',
      keyPoints: isKo
        ? ['우측 80px [스프린트] 버튼으로 고속 달리기', '우측 68px [손전등] 버튼으로 조명 온/오프']
        : ['80px [SPRINT] button to run fast', '68px [LIGHT] button to toggle flashlight'],
      iconType: 'GESTURES',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5] font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="Backrooms Recovery 3D"
        score={score}
        targetScore={1500}
        timeLeft={0}
        onQuit={handleExit}
        isKo={isKo}
        rewardUnit="SNS"
        customStatLabel={isKo ? '키카드' : 'KEYCARDS'}
        customStatValue={`${keysFound}/${totalKeys} ${keysFound >= totalKeys ? (isKo ? '(탈출구 개방!)' : '(EXIT UNLOCKED!)') : ''}`}
      />

      {/* 상태 게이지 HUD (정신력/스태미나/배터리) */}
      <div className="absolute top-16 left-4 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 border border-amber-500/40">
        <canvas ref={heroSpriteCanvasRef} width={40} height={40} className="w-10 h-10 border border-amber-400 bg-slate-800" />
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-amber-300 font-bold gap-3">
            <span>SANITY</span>
            <span>{sanity}%</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-800 border border-slate-700">
            <div
              className={`h-full transition-all duration-200 ${
                sanity > 50 ? 'bg-amber-400' : sanity > 25 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${sanity}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-cyan-300 font-bold gap-3">
            <span>STAMINA</span>
            <span>{stamina}%</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-800 border border-slate-700">
            <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${stamina}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] text-emerald-300 font-bold gap-3">
            <span>BATTERY</span>
            <span>{flashlightBattery}%</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-800 border border-slate-700">
            <div className="h-full bg-emerald-400 transition-all duration-200" style={{ width: `${flashlightBattery}%` }} />
          </div>
        </div>
      </div>

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
          <div className="w-full h-full rounded-full border-2 border-amber-400/60 bg-amber-950/40 backdrop-blur-xs flex items-center justify-center animate-pulse" />
          <div
            className="absolute rounded-full w-8 h-8 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] border border-white"
            style={{
              left: 45 - 16 + (joystick.curX - joystick.startX),
              top: 45 - 16 + (joystick.curY - joystick.startY),
            }}
          />
        </div>
      )}

      {/* 우측 퓨어 터치 조작 패널 (스프린트 & 손전등 버튼) */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        {/* 손전등 토글 버튼 */}
        <button
          type="button"
          onClick={() => {
            if (containerRef.current && (containerRef.current as any).__toggleFlashlight) {
              (containerRef.current as any).__toggleFlashlight();
            }
          }}
          className={`w-[68px] h-[68px] rounded-sm border-2 font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-lg transition-all ${
            flashlightOn
              ? 'bg-amber-900/90 border-amber-300 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
              : 'bg-slate-800/80 border-slate-600 text-slate-500'
          }`}
        >
          <span className="text-xl">🔦</span>
          <span className="mt-0.5 text-[10px] tracking-tight">{isKo ? '손전등' : 'LIGHT'}</span>
        </button>

        {/* 스프린트 버튼 (80px 최적 터치 타깃) */}
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
              ? 'bg-cyan-500 border-cyan-200 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.8)]'
              : stamina > 20
              ? 'bg-amber-600 border-amber-200 text-slate-950 shadow-[0_0_15px_rgba(217,119,6,0.6)]'
              : 'bg-slate-800/80 border-slate-600 text-slate-500 opacity-60'
          }`}
        >
          <span className="text-2xl">⚡</span>
          <span className="mt-0.5 tracking-wider font-extrabold">{isKo ? '달리기' : 'SPRINT'}</span>
        </button>
      </div>

      {/* 좌측 하단 데스크톱 가이드 */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:block text-slate-400 text-xs bg-slate-900/80 px-3 py-2 border border-slate-700">
        <div>[WASD / 터치드래그]: 360° 이동</div>
        <div>[Shift / 달리기]: 전력질주 스프린트</div>
        <div>[F / 손전등]: 손전등 온/오프</div>
      </div>

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_backrooms', 'true');
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
            <h2 className="text-2xl font-black text-red-500 mb-2">{isKo ? '탈출 실패' : 'LOST IN THE BACKROOMS'}</h2>
            <p className="text-slate-300 text-sm mb-4">
              {isKo ? '그림자 엔티티에게 붙잡혀 정신력을 모두 잃었습니다!' : 'Captured by the dark entity in the yellow maze!'}
            </p>
            <div className="bg-slate-800 p-3 mb-4 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>{isKo ? '수집한 키카드' : 'Keycards'}:</span>
                <span className="text-amber-400 font-bold">{keysFound} / {totalKeys}</span>
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

export default PokiBackroomsRecoveryGame;
