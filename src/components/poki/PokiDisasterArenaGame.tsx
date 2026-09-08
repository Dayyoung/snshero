import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDisasterArenaGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface Meteor {
  mesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  targetX: number;
  targetZ: number;
  startY: number;
  speed: number;
  active: boolean;
}

interface SurvivorBot {
  id: number;
  name: string;
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  hp: number;
  alive: boolean;
  color: number;
  targetX: number;
  targetZ: number;
  moveTimer: number;
}

interface Collectible {
  type: 'trophy' | 'coin' | 'heart';
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  value: number;
  collected: boolean;
  baseY: number;
}

export const PokiDisasterArenaGame: React.FC<PokiDisasterArenaGameProps> = ({
  onBack,
  onExit,
  cardId = 30,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => window.history.back());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const finishGameRef = useRef<(won: boolean, finalScore: number) => void>(() => {});
  const [timeLeft, setTimeLeft] = useState(40);
  const [playerHp, setPlayerHp] = useState(100);
  const [score, setScore] = useState(0);
  const [aliveCount, setAliveCount] = useState(4);
  const [currentDisaster, setCurrentDisaster] = useState<string>('대기 중');
  const [disasterWarning, setDisasterWarning] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [dashCooldown, setDashCooldown] = useState(0);

  // 조이스틱 터치 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 햅틱 유틸
  const triggerHaptic = useCallback((ms: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, []);

  // 레퍼런스
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrameId: 0,
    clock: new THREE.Clock(),

    // 플레이어 메쉬 및 물리
    playerGroup: null as THREE.Group | null,
    playerX: 0,
    playerY: 2.0,
    playerZ: 0,
    playerVx: 0,
    playerVy: 0,
    playerVz: 0,
    playerHp: 100,
    playerFacing: 0,
    isGrounded: true,
    dashActiveTimer: 0,
    dashCooldownTimer: 0,

    // 카메라 각도 (Yaw / Pitch)
    camYaw: 0,
    camPitch: 0.45,
    camDist: 14,

    // 입력 상태
    inputX: 0, // 화면 기준 가로 (-1 ~ 1)
    inputZ: 0, // 화면 기준 세로 (-1 ~ 1)
    isJumping: false,

    // 환경 오브젝트
    lavaPlane: null as THREE.Mesh | null,
    lavaY: -2.5,
    isLavaRising: false,
    tornadoGroup: null as THREE.Group | null,
    tornadoAngle: 0,
    tornadoActive: false,

    // 서바이버 및 재해
    bots: [] as SurvivorBot[],
    meteors: [] as Meteor[],
    particles: [] as Particle[],
    collectibles: [] as Collectible[],

    // 게임 루프
    gameTime: 0,
    score: 0,
    aliveSurvivors: 4,
    disasterPhase: 0, // 0: 준비, 1: 메테오, 2: 용암, 3: 토네이도, 4: 묵시록
    lastMeteorSpawn: 0,
    lastLightningSpawn: 0,
    isEnded: false,
  });

  // 점프 실행
  const handleJump = useCallback(() => {
    const g = gameRef.current;
    if (g.isGrounded && !g.isEnded) {
      g.playerVy = 11.5;
      g.isGrounded = false;
      triggerHaptic(20);
      playSfx?.('jump');
    }
  }, [lowSpecMode, cardId]);

  // 대시 실행
  const handleDash = useCallback(() => {
    const g = gameRef.current;
    if (g.dashCooldownTimer <= 0 && !g.isEnded) {
      g.dashActiveTimer = 0.22;
      g.dashCooldownTimer = 1.4;
      setDashCooldown(1.4);
      triggerHaptic([30, 40]);
      playSfx?.('dash');

      // 이동 방향으로 폭발적 가속
      let moveDirX = g.inputX;
      let moveDirZ = g.inputZ;
      if (Math.abs(moveDirX) < 0.1 && Math.abs(moveDirZ) < 0.1) {
        moveDirX = Math.sin(g.playerFacing);
        moveDirZ = Math.cos(g.playerFacing);
      }
      const len = Math.hypot(moveDirX, moveDirZ) || 1;
      g.playerVx = (moveDirX / len) * 16;
      g.playerVz = (moveDirZ / len) * 16;

      // 대시 잔상 파티클
      if (g.scene) {
        for (let i = 0; i < 10; i++) {
          const pMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
          const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), pMat);
          pMesh.position.set(g.playerX + (Math.random() - 0.5) * 0.6, g.playerY + (Math.random() - 0.5) * 0.6, g.playerZ + (Math.random() - 0.5) * 0.6);
          g.scene.add(pMesh);
          g.particles.push({
            mesh: pMesh,
            vx: -g.playerVx * 0.15 + (Math.random() - 0.5) * 2,
            vy: Math.random() * 2,
            vz: -g.playerVz * 0.15 + (Math.random() - 0.5) * 2,
            life: 0,
            maxLife: 0.35,
          });
        }
      }
    }
  }, [lowSpecMode, cardId]);

  // 게임 종료 및 정산
  const finishGame = useCallback((won: boolean, finalScore: number) => {
    const g = gameRef.current;
    if (g.isEnded) return;
    g.isEnded = true;
    setIsPlaying(false);
    setGameOver(!won);
    setIsVictory(won);

    const timeSurvived = Math.min(40, Math.floor(g.gameTime));
    const deposit = calculateAndDepositMissionReward({
      gameId: 'poki_disaster_arena',
      gameTitle: 'Disaster Arena 3D',
      durationSeconds: timeSurvived,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: won,
    });
    setRewardResult(deposit);
    triggerHaptic(won ? [50, 100, 150] : [200, 100]);
    if (won) playSfx?.('victory');
    else playSfx?.('defeat');
  }, [lowSpecMode, cardId]);
  finishGameRef.current = finishGame;

  // Three.js 초기화 및 리셋
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x130a1c);
    scene.fog = new THREE.FogExp2(0x130a1c, 0.022);

    // Camera
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 120);
    camera.position.set(0, 14, 18);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xfff0e8, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffddaa, 1.2);
    dirLight.position.set(20, 35, 20);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 80;
      const d = 25;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    scene.add(dirLight);

    const lavaLight = new THREE.PointLight(0xff3300, 1.5, 35);
    lavaLight.position.set(0, -1, 0);
    scene.add(lavaLight);

    // ==========================================
    // 3D 아레나 맵 구축
    // ==========================================
    // 1. 하단 용암 바다
    const lavaGeo = new THREE.PlaneGeometry(160, 160);
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const lavaOcean = new THREE.Mesh(lavaGeo, lavaMat);
    lavaOcean.rotation.x = -Math.PI / 2;
    lavaOcean.position.y = -8.0;
    scene.add(lavaOcean);

    // 2. 메인 플로팅 서바이벌 아레나 (반경 18m, 높이 2.5m)
    const arenaRadius = 18;
    const arenaPlatformGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius + 1.5, 2.5, 32);
    const arenaPlatformMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.7,
      metalness: 0.2,
    });
    const arenaPlatform = new THREE.Mesh(arenaPlatformGeo, arenaPlatformMat);
    arenaPlatform.position.y = -1.25;
    arenaPlatform.receiveShadow = true;
    scene.add(arenaPlatform);

    // 아레나 상단 타일 림 (황금색 안전 테두리)
    const rimGeo = new THREE.RingGeometry(arenaRadius - 0.4, arenaRadius + 0.2, 32);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const arenaRim = new THREE.Mesh(rimGeo, rimMat);
    arenaRim.rotation.x = -Math.PI / 2;
    arenaRim.position.y = 0.02;
    scene.add(arenaRim);

    // 3. 중앙 계단식 대피 타워 (용암 상승 시 고지대!)
    // 1단 타워: 반경 7m, 높이 1.2m
    const t1Geo = new THREE.CylinderGeometry(7, 7.3, 1.2, 24);
    const t1Mat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6 });
    const t1 = new THREE.Mesh(t1Geo, t1Mat);
    t1.position.y = 0.6;
    t1.receiveShadow = true;
    scene.add(t1);

    // 2단 타워: 반경 4.2m, 높이 2.4m (상단 표면 Y: 1.8)
    const t2Geo = new THREE.CylinderGeometry(4.2, 4.4, 1.2, 20);
    const t2Mat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.5 });
    const t2 = new THREE.Mesh(t2Geo, t2Mat);
    t2.position.y = 1.8;
    t2.receiveShadow = true;
    scene.add(t2);

    // 3단 최상층 타워: 반경 2.2m, 높이 1.2m (상단 표면 Y: 3.0)
    const t3Geo = new THREE.CylinderGeometry(2.2, 2.3, 1.2, 16);
    const t3Mat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.4, metalness: 0.4 });
    const t3 = new THREE.Mesh(t3Geo, t3Mat);
    t3.position.y = 3.0;
    t3.receiveShadow = true;
    scene.add(t3);

    // 타워 정상 황금 비콘
    const beaconGeo = new THREE.ConeGeometry(0.8, 1.6, 6);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: true });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 4.4;
    scene.add(beacon);

    // 4방향 부유 발판 4개 (점프 대피용)
    const subPads: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const px = Math.cos(angle) * 12.5;
      const pz = Math.sin(angle) * 12.5;
      const padGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.8, 12);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(px, 1.4, pz);
      pad.receiveShadow = true;
      scene.add(pad);
      subPads.push(pad);
    }

    // 4. 상승하는 용암 덮개 레이어 (바닥 전체를 덮는 위험 레이어)
    const risingLavaGeo = new THREE.CircleGeometry(arenaRadius + 0.5, 32);
    const risingLavaMat = new THREE.MeshBasicMaterial({
      color: 0xff3b00,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const risingLava = new THREE.Mesh(risingLavaGeo, risingLavaMat);
    risingLava.rotation.x = -Math.PI / 2;
    risingLava.position.y = -0.5; // 평소에는 숨겨져 있음
    scene.add(risingLava);

    // 5. 거대 토네이도 소용돌이 메쉬 그룹
    const tornadoGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const coneGeo = new THREE.ConeGeometry(1.2 + i * 1.2, 3.2, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.35 + i * 0.1,
        wireframe: true,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = i * 2.2 + 1.6;
      tornadoGroup.add(cone);
    }
    tornadoGroup.position.set(0, -20, 0); // 초기 비활성
    scene.add(tornadoGroup);

    // ==========================================
    // 플레이어 3D 복셀 메쉬 & No.030 영웅 카드 배지
    // ==========================================
    const playerGroup = new THREE.Group();

    // 몸통 (블루 사이버 슈트)
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), pBodyMat);
    pBody.position.y = 1.1;
    pBody.castShadow = true;
    playerGroup.add(pBody);

    // 머리
    const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
    const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), pHeadMat);
    pHead.position.y = 1.95;
    pHead.castShadow = true;
    playerGroup.add(pHead);

    // 안전 헬멧
    const pHelmetMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 });
    const pHelmet = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.35, 0.78), pHelmetMat);
    pHelmet.position.y = 2.25;
    playerGroup.add(pHelmet);

    // 팔 2개
    const pLimbMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5 });
    const pArmL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.8, 0.28), pLimbMat);
    pArmL.position.set(-0.58, 1.0, 0);
    playerGroup.add(pArmL);

    const pArmR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.8, 0.28), pLimbMat);
    pArmR.position.set(0.58, 1.0, 0);
    playerGroup.add(pArmR);

    // 다리 2개
    const pLegMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const pLegL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), pLegMat);
    pLegL.position.set(-0.25, 0.35, 0);
    playerGroup.add(pLegL);

    const pLegR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.3), pLegMat);
    pLegR.position.set(0.25, 0.35, 0);
    playerGroup.add(pLegR);

    // 플레이어 머리 위 No.030 공식 영웅 카드 스프라이트 HUD 배지
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 64;
    badgeCanvas.height = 64;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId, 0, 0, 64, 64);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    badgeTexture.minFilter = THREE.LinearFilter;
    const badgeSpriteMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
    const badgeSprite = new THREE.Sprite(badgeSpriteMat);
    badgeSprite.position.set(0, 2.9, 0);
    badgeSprite.scale.set(1.2, 1.2, 1);
    playerGroup.add(badgeSprite);

    // 시작 지점: 중앙 1단 타워 위(안전 광폭 스폰 안착)
    playerGroup.position.set(0, 1.2, 0);
    scene.add(playerGroup);

    // ==========================================
    // AI 서바이버 봇 (3명) 생성
    // ==========================================
    const bots: SurvivorBot[] = [];
    const botColors = [0x10b981, 0xf97316, 0xa855f7];
    const botNames = ['서바이버 민지', '탈출러 철수', '스피드 루키'];

    for (let i = 0; i < 3; i++) {
      const bGroup = new THREE.Group();
      const bMat = new THREE.MeshStandardMaterial({ color: botColors[i], roughness: 0.5 });
      const bBody = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.95, 0.48), bMat);
      bBody.position.y = 1.05;
      bGroup.add(bBody);

      const bHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
      bHead.position.y = 1.85;
      bGroup.add(bHead);

      // 시작 위치: 중앙 주변 분산 안전 안착
      const bAngle = (i * Math.PI * 2) / 3;
      const bx = Math.cos(bAngle) * 4.5;
      const bz = Math.sin(bAngle) * 4.5;
      bGroup.position.set(bx, 1.2, bz);
      scene.add(bGroup);

      bots.push({
        id: i + 1,
        name: botNames[i],
        group: bGroup,
        bodyMesh: bBody,
        x: bx,
        y: 1.2,
        z: bz,
        vx: 0,
        vy: 0,
        vz: 0,
        hp: 100,
        alive: true,
        color: botColors[i],
        targetX: bx,
        targetZ: bz,
        moveTimer: 0,
      });
    }

    // ==========================================
    // 수집 아이템 (황금 트로피 3개 & 네온 코인 10개 & 힐링 하트 2개)
    // ==========================================
    const collectibles: Collectible[] = [];

    // 1. 황금 트로피 3개
    for (let i = 0; i < 3; i++) {
      const tGroup = new THREE.Group();
      const tGeo = new THREE.CylinderGeometry(0.4, 0.2, 0.8, 8);
      const tMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
      const cup = new THREE.Mesh(tGeo, tMat);
      cup.position.y = 0.5;
      tGroup.add(cup);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), tMat);
      base.position.y = 0.1;
      tGroup.add(base);

      // 배치 (타워 2단, 3단, 외곽 발판)
      let tx = 0;
      let tz = 0;
      let ty = 3.8;
      if (i === 1) {
        tx = 3.0;
        tz = 0;
        ty = 2.5;
      } else if (i === 2) {
        tx = -12.5;
        tz = 12.5;
        ty = 2.2;
      }
      tGroup.position.set(tx, ty, tz);
      scene.add(tGroup);

      collectibles.push({
        type: 'trophy',
        group: tGroup,
        x: tx,
        y: ty,
        z: tz,
        baseY: ty,
        value: 400,
        collected: false,
      });
    }

    // 2. 네온 코인 8개
    for (let i = 0; i < 8; i++) {
      const cGroup = new THREE.Group();
      const cGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12);
      const cMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.3 });
      const coin = new THREE.Mesh(cGeo, cMat);
      coin.rotation.x = Math.PI / 2;
      cGroup.add(coin);

      const angle = (i * Math.PI * 2) / 8;
      const dist = 6.0 + (i % 2) * 5.0;
      const cx = Math.cos(angle) * dist;
      const cz = Math.sin(angle) * dist;
      const cy = 1.0;
      cGroup.position.set(cx, cy, cz);
      scene.add(cGroup);

      collectibles.push({
        type: 'coin',
        group: cGroup,
        x: cx,
        y: cy,
        z: cz,
        baseY: cy,
        value: 100,
        collected: false,
      });
    }

    // 게임 레퍼런스 등록
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.playerGroup = playerGroup;
    g.lavaPlane = risingLava;
    g.tornadoGroup = tornadoGroup;
    g.bots = bots;
    g.collectibles = collectibles;
    g.playerX = 0;
    g.playerY = 1.2;
    g.playerZ = 0;
    g.playerVx = 0;
    g.playerVy = 0;
    g.playerVz = 0;
    g.playerHp = 100;
    g.score = 0;
    g.gameTime = 0;
    g.aliveSurvivors = 4;
    g.disasterPhase = 0;
    g.isEnded = false;
    g.isLavaRising = false;
    g.tornadoActive = false;
    g.particles = [];
    g.meteors = [];

    // ==========================================
    // 높이 판정 함수 (바닥, 타워 3단, 부유 발판)
    // ==========================================
    const getGroundHeight = (x: number, z: number): number => {
      const dist = Math.hypot(x, z);

      // 최상단 타워 (반경 2.2m)
      if (dist <= 2.2) return 3.6;

      // 2단 타워 (반경 4.2m)
      if (dist <= 4.2) return 2.4;

      // 1단 타워 (반경 7.0m)
      if (dist <= 7.0) return 1.2;

      // 4대 부유 발판 (각 반경 2.0m)
      for (const pad of subPads) {
        const pd = Math.hypot(x - pad.position.x, z - pad.position.z);
        if (pd <= 2.0) return 1.8;
      }

      // 메인 아레나 평면 (반경 18m)
      if (dist <= arenaRadius) return 0.0;

      // 아레나 밖 (낙하 심연)
      return -999;
    };

    // ==========================================
    // 메테오 스폰 헬퍼
    // ==========================================
    const spawnMeteor = (targetX: number, targetZ: number) => {
      // 1. 지면 경고 원형 섀도우 인디케이터
      const shadowGeo = new THREE.RingGeometry(0.3, 3.8, 24);
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      const groundY = getGroundHeight(targetX, targetZ);
      shadow.position.set(targetX, groundY + 0.05, targetZ);
      scene.add(shadow);

      // 2. 공중 메테오 메쉬
      const meteorGeo = new THREE.DodecahedronGeometry(1.4, 1);
      const meteorMat = new THREE.MeshStandardMaterial({
        color: 0x7c2d12,
        roughness: 0.8,
        emissive: 0xe11d48,
        emissiveIntensity: 0.7,
      });
      const meteor = new THREE.Mesh(meteorGeo, meteorMat);
      const startY = 32;
      meteor.position.set(targetX + (Math.random() - 0.5) * 6, startY, targetZ + (Math.random() - 0.5) * 6);
      scene.add(meteor);

      g.meteors.push({
        mesh: meteor,
        shadowMesh: shadow,
        targetX,
        targetZ,
        startY,
        speed: 28,
        active: true,
      });
    };

    // ==========================================
    // Three.js 메인 애니메이션 루프
    // ==========================================
    let lastTime = performance.now();

    const animate = (now: number) => {
      g.animFrameId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      if (!g.isEnded && isPlaying) {
        g.gameTime += dt;
        const remain = Math.max(0, 40 - g.gameTime);
        setTimeLeft(Math.ceil(remain));

        // 재난 페이즈 업데이트
        if (g.gameTime < 10) {
          // 1단계: 메테오 샤워 시작
          if (g.disasterPhase !== 1) {
            g.disasterPhase = 1;
            setCurrentDisaster('☄️ 메테오 샤워 (Meteor)');
            setDisasterWarning('하늘에서 떨어지는 화염 운석을 피하세요!');
            triggerHaptic([40, 60]);
          }
          if (now - g.lastMeteorSpawn > 2200) {
            g.lastMeteorSpawn = now;
            // 플레이어 근처 또는 무작위 위치에 메테오 2발 스폰
            spawnMeteor(g.playerX + (Math.random() - 0.5) * 10, g.playerZ + (Math.random() - 0.5) * 10);
            const rAngle = Math.random() * Math.PI * 2;
            const rDist = Math.random() * 12;
            spawnMeteor(Math.cos(rAngle) * rDist, Math.sin(rAngle) * rDist);
          }
        } else if (g.gameTime < 22) {
          // 2단계: 용암 상승 (The Floor is Lava!)
          if (g.disasterPhase !== 2) {
            g.disasterPhase = 2;
            g.isLavaRising = true;
            setCurrentDisaster('🌋 용암 상승 (Floor is Lava!)');
            setDisasterWarning('바닥이 용암으로 변합니다! 중앙 타워나 높은 곳으로 대피하세요!');
            triggerHaptic([60, 100, 60]);
          }
        } else if (g.gameTime < 32) {
          // 3단계: 토네이도 돌풍
          if (g.disasterPhase !== 3) {
            g.disasterPhase = 3;
            g.isLavaRising = false;
            g.tornadoActive = true;
            setCurrentDisaster('🌪️ 메가 토네이도 (Tornado)');
            setDisasterWarning('회전하는 토네이도에 휘말리지 마세요!');
            triggerHaptic([50, 50, 50]);
          }
        } else {
          // 4단계: 파이널 묵시록 (대혼돈)
          if (g.disasterPhase !== 4) {
            g.disasterPhase = 4;
            g.isLavaRising = true;
            g.tornadoActive = true;
            setCurrentDisaster('⚡ 카타클리즘 (Final Chaos)');
            setDisasterWarning('최후의 생존! 40초 버텨내어 서바이벌 챔피언이 되세요!');
            triggerHaptic([80, 80, 80]);
          }
          if (now - g.lastMeteorSpawn > 1800) {
            g.lastMeteorSpawn = now;
            spawnMeteor(g.playerX + (Math.random() - 0.5) * 8, g.playerZ + (Math.random() - 0.5) * 8);
          }
        }

        // 40초 생존 성공 시 승리
        if (remain <= 0) {
          finishGameRef.current(true, g.score + 500);
          return;
        }

        // ------------------------------------
        // 대시 쿨다운 및 타이머 갱신
        // ------------------------------------
        if (g.dashActiveTimer > 0) {
          g.dashActiveTimer -= dt;
        }
        if (g.dashCooldownTimer > 0) {
          g.dashCooldownTimer -= dt;
          setDashCooldown(Math.max(0, g.dashCooldownTimer));
        }

        // ------------------------------------
        // 플레이어 이동 및 물리
        // ------------------------------------
        const baseSpeed = g.dashActiveTimer > 0 ? 15.0 : 7.2;
        // 카메라 Yaw를 고려한 화면 기준 정렬 이동
        // inputX: 화면 좌우, inputZ: 화면 상하
        const sinYaw = Math.sin(g.camYaw);
        const cosYaw = Math.cos(g.camYaw);
        const worldMoveX = g.inputX * cosYaw - g.inputZ * sinYaw;
        const worldMoveZ = g.inputX * sinYaw + g.inputZ * cosYaw;

        if (g.dashActiveTimer <= 0) {
          g.playerVx = worldMoveX * baseSpeed;
          g.playerVz = worldMoveZ * baseSpeed;
        }

        g.playerX += g.playerVx * dt;
        g.playerZ += g.playerVz * dt;

        // 중력 적용
        g.playerVy -= 28 * dt;
        g.playerY += g.playerVy * dt;

        // 지면 충돌 판정
        const groundY = getGroundHeight(g.playerX, g.playerZ);
        if (g.playerY <= groundY) {
          g.playerY = groundY;
          g.playerVy = 0;
          g.isGrounded = true;
        } else {
          g.isGrounded = false;
        }

        // 이동 중 방향 회전
        if (Math.hypot(worldMoveX, worldMoveZ) > 0.15) {
          g.playerFacing = Math.atan2(worldMoveX, worldMoveZ);
          if (g.playerGroup) {
            g.playerGroup.rotation.y = g.playerFacing;
          }
        }

        if (g.playerGroup) {
          g.playerGroup.position.set(g.playerX, g.playerY, g.playerZ);
        }

        // 낙하 사망 판정 (Y < -6.0)
        if (g.playerY < -6.0) {
          g.playerHp = 0;
          setPlayerHp(0);
          finishGameRef.current(false, g.score);
          return;
        }

        // ------------------------------------
        // 용암 상승 위험 판정
        // ------------------------------------
        if (g.lavaPlane) {
          if (g.isLavaRising) {
            g.lavaY = Math.min(0.25, g.lavaY + dt * 0.8);
            g.lavaPlane.position.y = g.lavaY;

            // 바닥(Y <= 0.3)에 서 있으면 용암 대미지
            if (g.playerY <= 0.3) {
              g.playerHp -= 30 * dt;
              setPlayerHp(Math.max(0, Math.ceil(g.playerHp)));
              triggerHaptic(10);
              if (g.playerHp <= 0) {
                finishGameRef.current(false, g.score);
                return;
              }
            }
          } else {
            g.lavaY = Math.max(-2.0, g.lavaY - dt * 1.5);
            g.lavaPlane.position.y = g.lavaY;
          }
        }

        // ------------------------------------
        // 토네이도 이동 및 흡인 판정
        // ------------------------------------
        if (g.tornadoGroup) {
          if (g.tornadoActive) {
            g.tornadoAngle += dt * 0.7;
            const torX = Math.cos(g.tornadoAngle) * 9.0;
            const torZ = Math.sin(g.tornadoAngle) * 9.0;
            g.tornadoGroup.position.set(torX, 0, torZ);
            g.tornadoGroup.rotation.y += dt * 8;

            // 플레이어 충돌/흡인 거리 체크
            const distTor = Math.hypot(g.playerX - torX, g.playerZ - torZ);
            if (distTor < 4.0) {
              // 공중으로 솟구치며 튕겨나감
              g.playerVy = 13;
              const pushX = (g.playerX - torX) / (distTor || 1);
              const pushZ = (g.playerZ - torZ) / (distTor || 1);
              g.playerVx = pushX * 12;
              g.playerVz = pushZ * 12;
              g.playerHp -= 20 * dt;
              setPlayerHp(Math.max(0, Math.ceil(g.playerHp)));
              triggerHaptic(30);
            }
          } else {
            g.tornadoGroup.position.set(0, -20, 0);
          }
        }

        // ------------------------------------
        // 메테오 강타 및 폭발 판정
        // ------------------------------------
        for (let i = g.meteors.length - 1; i >= 0; i--) {
          const m = g.meteors[i];
          if (!m.active) continue;

          m.mesh.position.y -= m.speed * dt;
          m.mesh.rotation.x += dt * 3;
          m.mesh.rotation.z += dt * 2;

          const targetGroundY = getGroundHeight(m.targetX, m.targetZ);
          if (m.mesh.position.y <= targetGroundY + 0.8) {
            // 메테오 폭발!
            m.active = false;
            scene.remove(m.mesh);
            scene.remove(m.shadowMesh);
            g.meteors.splice(i, 1);

            // 35개 폭발 파티클 분출
            for (let p = 0; p < 35; p++) {
              const pMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xef4444 : 0xf59e0b,
              });
              const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), pMat);
              pMesh.position.set(m.targetX, targetGroundY + 0.5, m.targetZ);
              scene.add(pMesh);
              g.particles.push({
                mesh: pMesh,
                vx: (Math.random() - 0.5) * 16,
                vy: Math.random() * 12 + 2,
                vz: (Math.random() - 0.5) * 16,
                life: 0,
                maxLife: 0.6,
              });
            }

            // 플레이어 피격 대미지 체크 (폭발 반경 4.5m)
            const pDist = Math.hypot(g.playerX - m.targetX, g.playerZ - m.targetZ);
            if (pDist < 4.5) {
              const dmg = Math.floor((1 - pDist / 4.5) * 45);
              g.playerHp -= dmg;
              setPlayerHp(Math.max(0, Math.ceil(g.playerHp)));
              // 넉백
              const nX = (g.playerX - m.targetX) / (pDist || 1);
              const nZ = (g.playerZ - m.targetZ) / (pDist || 1);
              g.playerVx = nX * 14;
              g.playerVz = nZ * 14;
              g.playerVy = 8;
              triggerHaptic([40, 80]);
              playSfx?.('hit');

              if (g.playerHp <= 0) {
                finishGameRef.current(false, g.score);
                return;
              }
            }

            // 봇 피격 체크
            for (const bot of g.bots) {
              if (!bot.alive) continue;
              const bDist = Math.hypot(bot.x - m.targetX, bot.z - m.targetZ);
              if (bDist < 4.5) {
                bot.hp -= 40;
                bot.vx = ((bot.x - m.targetX) / (bDist || 1)) * 12;
                bot.vz = ((bot.z - m.targetZ) / (bDist || 1)) * 12;
                bot.vy = 7;
              }
            }
          }
        }

        // ------------------------------------
        // AI 서바이버 봇 로직
        // ------------------------------------
        let alive = 1; // 플레이어 포함
        for (const bot of g.bots) {
          if (!bot.alive) continue;

          // 봇 물리 적용
          bot.x += bot.vx * dt;
          bot.z += bot.vz * dt;
          bot.vy -= 26 * dt;
          bot.y += bot.vy * dt;

          const bGround = getGroundHeight(bot.x, bot.z);
          if (bot.y <= bGround) {
            bot.y = bGround;
            bot.vy = 0;
            bot.vx *= 0.85;
            bot.vz *= 0.85;
          }

          // 낙하 탈락
          if (bot.y < -6.0 || bot.hp <= 0) {
            bot.alive = false;
            scene.remove(bot.group);
            continue;
          }

          alive++;

          // 봇 AI 지능 이동 (재난 회피 및 고지대 피신)
          bot.moveTimer -= dt;
          if (bot.moveTimer <= 0) {
            bot.moveTimer = 1.0 + Math.random() * 1.5;

            // 용암 상승 시 중앙 타워 고지대로 도망
            if (g.isLavaRising) {
              bot.targetX = (Math.random() - 0.5) * 3;
              bot.targetZ = (Math.random() - 0.5) * 3;
            } else {
              // 평소에는 코인을 찾거나 무작위 배회
              const angle = Math.random() * Math.PI * 2;
              const d = Math.random() * 11;
              bot.targetX = Math.cos(angle) * d;
              bot.targetZ = Math.sin(angle) * d;
            }
          }

          // 타겟을 향해 이동
          const bdx = bot.targetX - bot.x;
          const bdz = bot.targetZ - bot.z;
          const bdist = Math.hypot(bdx, bdz);
          if (bdist > 0.4) {
            const bspeed = 4.8;
            bot.vx = (bdx / bdist) * bspeed;
            bot.vz = (bdz / bdist) * bspeed;
            bot.group.rotation.y = Math.atan2(bdx, bdz);
          }

          // 점프 시도 (고지대로 올라가기 위해)
          if (bGround < 1.0 && g.isLavaRising && Math.random() < 0.04) {
            bot.vy = 9.5;
          }

          bot.group.position.set(bot.x, bot.y, bot.z);
        }
        setAliveCount(alive);

        // ------------------------------------
        // 아이템 수집 판정
        // ------------------------------------
        for (const item of g.collectibles) {
          if (item.collected) continue;

          // 부유 및 회전 애니메이션
          item.group.rotation.y += dt * 2.5;
          item.group.position.y = item.baseY + Math.sin(now * 0.004) * 0.25;

          const dist = Math.hypot(g.playerX - item.x, g.playerZ - item.z);
          if (dist < 1.6 && Math.abs(g.playerY - item.y) < 2.0) {
            item.collected = true;
            scene.remove(item.group);

            if (item.type === 'heart') {
              g.playerHp = Math.min(100, g.playerHp + 40);
              setPlayerHp(g.playerHp);
            } else {
              g.score += item.value;
              setScore(g.score);
            }

            triggerHaptic([20, 30]);
            playSfx?.('coin');

            // 축하 스파크 파티클
            for (let p = 0; p < 15; p++) {
              const pMat = new THREE.MeshBasicMaterial({ color: item.type === 'trophy' ? 0xfacc15 : 0x38bdf8 });
              const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), pMat);
              pMesh.position.set(item.x, item.y, item.z);
              scene.add(pMesh);
              g.particles.push({
                mesh: pMesh,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * 6 + 1,
                vz: (Math.random() - 0.5) * 8,
                life: 0,
                maxLife: 0.45,
              });
            }
          }
        }

        // ------------------------------------
        // 파티클 업데이트
        // ------------------------------------
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const p = g.particles[i];
          p.life += dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.vy -= 14 * dt;

          if (p.life >= p.maxLife) {
            scene.remove(p.mesh);
            g.particles.splice(i, 1);
          }
        }
      }

      // ------------------------------------
      // 카메라 3인칭 추종 (부드러운 시점 동기화)
      // ------------------------------------
      if (g.camera && g.playerGroup) {
        const targetCamX = g.playerX + Math.sin(g.camYaw) * g.camDist;
        const targetCamY = g.playerY + 8.5;
        const targetCamZ = g.playerZ + Math.cos(g.camYaw) * g.camDist;

        g.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12);
        g.camera.lookAt(g.playerX, g.playerY + 1.2, g.playerZ);
      }

      renderer.render(scene, camera);
    };

    g.animFrameId = requestAnimationFrame(animate);

    // ResizeObserver
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(g.animFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, cardId]);

  // 키보드 조작 (PC 백업)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') g.inputZ = -1;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') g.inputZ = 1;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') g.inputX = -1;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') g.inputX = 1;
      if (e.code === 'Space') handleJump();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') handleDash();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if ((e.code === 'KeyW' || e.code === 'ArrowUp') && g.inputZ < 0) g.inputZ = 0;
      if ((e.code === 'KeyS' || e.code === 'ArrowDown') && g.inputZ > 0) g.inputZ = 0;
      if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && g.inputX < 0) g.inputX = 0;
      if ((e.code === 'KeyD' || e.code === 'ArrowRight') && g.inputX > 0) g.inputX = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, handleDash]);

  // 플로팅 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // 화면 좌측 55% 영역 터치 시 조이스틱 활성
      if (touch.clientX < window.innerWidth * 0.55 && !joystickActive) {
        setJoystickActive(true);
        setJoystickCenter({ x: touch.clientX, y: touch.clientY });
        setJoystickKnob({ x: 0, y: 0 });
        break;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive || !joystickCenter) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX < window.innerWidth * 0.65) {
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;
        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, maxRadius);

        const kx = Math.cos(angle) * clampedDist;
        const ky = Math.sin(angle) * clampedDist;
        setJoystickKnob({ x: kx, y: ky });

        // 화면 기준 정규화 (-1 ~ 1)
        gameRef.current.inputX = kx / maxRadius;
        gameRef.current.inputZ = ky / maxRadius;
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX < window.innerWidth * 0.65) {
        setJoystickActive(false);
        setJoystickCenter(null);
        setJoystickKnob({ x: 0, y: 0 });
        gameRef.current.inputX = 0;
        gameRef.current.inputZ = 0;
        break;
      }
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-black text-white font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js 3D 뷰포트 컨테이너 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미니멀 HUD 헤더 */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="Disaster Arena 3D"
        score={score}
        onQuit={() => finishGameRef.current(false, score)}
      />

      {/* 실시간 재난 & 생존자 상태 오버레이 */}
      <div className="absolute top-14 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* 현재 재난 뱃지 */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1.5 bg-black/75 backdrop-blur-md rounded-sm border border-red-500/50 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-400">{currentDisaster}</span>
          </div>
          <div className="text-[10px] text-zinc-300 bg-black/60 px-2 py-0.5 rounded-sm">
            생존자: <strong className="text-emerald-400">{aliveCount} / 4</strong>명
          </div>
        </div>

        {/* 남은 시간 & 체력 게이지 */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="px-3 py-1 bg-black/80 rounded-sm border border-amber-500/40 text-sm font-black text-amber-300">
            ⏳ {timeLeft}초
          </div>
          {/* 체력 바 */}
          <div className="w-28 bg-zinc-800/80 h-3 rounded-sm overflow-hidden border border-zinc-700">
            <div
              className={`h-full transition-all duration-150 ${
                playerHp > 50 ? 'bg-emerald-500' : playerHp > 25 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${playerHp}%` }}
            />
          </div>
        </div>
      </div>

      {/* 재난 긴급 경고 배너 */}
      {disasterWarning && (
        <div className="absolute top-28 left-4 right-4 pointer-events-none z-10 flex justify-center">
          <div className="px-4 py-2 bg-red-950/85 backdrop-blur-md border-l-4 border-red-500 rounded-sm text-center shadow-lg animate-bounce">
            <div className="text-xs font-black text-red-200">{disasterWarning}</div>
          </div>
        </div>
      )}

      {/* 플로팅 가상 조이스틱 (좌측 터치 시 팝업) */}
      {joystickActive && joystickCenter && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: joystickCenter.x - 45,
            top: joystickCenter.y - 45,
            width: 90,
            height: 90,
          }}
        >
          {/* 외부 링 */}
          <div className="w-full h-full rounded-full border-2 border-cyan-400/60 bg-cyan-950/40 backdrop-blur-sm flex items-center justify-center">
            {/* 내부 조작 노브 */}
            <div
              className="w-10 h-10 rounded-full bg-cyan-400 border border-white shadow-lg"
              style={{
                transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 우측 하단 퓨어 모바일 액션 버튼: [🦘 JUMP] & [⚡ DASH] */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20">
        {/* 대시 버튼 */}
        <button
          type="button"
          onClick={handleDash}
          disabled={dashCooldown > 0}
          className={`w-16 h-16 rounded-full border flex flex-col items-center justify-center transition-transform active:scale-95 shadow-xl ${
            dashCooldown > 0
              ? 'bg-zinc-800/80 border-zinc-600 text-zinc-500'
              : 'bg-gradient-to-tr from-sky-600 to-cyan-400 border-cyan-300 text-white active:bg-sky-500'
          }`}
        >
          <span className="text-xl leading-none">⚡</span>
          <span className="text-[9px] font-black tracking-tighter mt-0.5">
            {dashCooldown > 0 ? `${dashCooldown.toFixed(1)}s` : 'DASH'}
          </span>
        </button>

        {/* 점프 대형 버튼 */}
        <button
          type="button"
          onClick={handleJump}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border-2 border-yellow-200 text-white flex flex-col items-center justify-center transition-transform active:scale-90 shadow-2xl"
        >
          <span className="text-2xl leading-none">🦘</span>
          <span className="text-xs font-black tracking-tight mt-1">JUMP</span>
        </button>
      </div>

      {/* 좌측 하단 제스처 가이드 인디케이터 (평소 가이드) */}
      {!joystickActive && isPlaying && (
        <div className="absolute bottom-8 left-8 pointer-events-none z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full border border-white/10 text-zinc-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          화면 좌측을 터치하여 360° 이동
        </div>
      )}

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Disaster Arena 3D"
        description="쉼 없이 덮쳐오는 메테오 폭격, 솟구치는 용암, 거대 토네이도를 피해 끝까지 생존하세요!"
        features={[
          {
            iconType: 'GOAL',
            title: '최후의 생존자',
            desc: '40초 동안 살아남거나 황금 트로피와 코인을 획득해 최고 점수를 달성하세요.',
          },
          {
            iconType: 'GESTURES',
            title: '점프와 고지대 대피',
            desc: '좌측 360° 플로팅 조이스틱으로 이동하고, 우측 [JUMP]와 [DASH]로 고지대로 대피하세요.',
          },
          {
            iconType: 'REWARDS',
            title: 'SNS 보상 정산',
            desc: '서바이벌 성공 시 최대 50 SNS 포인트 및 시즌 랭킹 마일리지가 지급됩니다.',
          },
        ]}
        onClose={() => {
          setShowTutorial(false);
          setIsPlaying(true);
        }}
      />

      {/* 승리/패배 정산 모달 */}
      <VictoryRewardModal
        isOpen={gameOver || isVictory}
        isVictory={isVictory}
        score={score}
        rewardSNS={rewardResult?.amount || 0}
        onRestart={() => {
          window.location.reload();
        }}
        onExit={handleExit}
      />
    </div>
  );
};

export default PokiDisasterArenaGame;
