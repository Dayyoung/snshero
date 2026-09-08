import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSushiPartyGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

interface SushiData {
  id: number;
  mesh: THREE.Group;
  x: number;
  z: number;
  type: 'salmon' | 'tuna' | 'roll' | 'shrimp';
  value: number;
}

interface SnakeBot {
  id: number;
  name: string;
  color: number;
  headGroup: THREE.Group;
  bodyMeshes: THREE.Mesh[];
  history: { x: number; z: number }[];
  x: number;
  z: number;
  angle: number;
  speed: number;
  length: number;
  alive: boolean;
  score: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiSushiPartyGame: React.FC<PokiSushiPartyGameProps> = ({
  onBack,
  onExit,
  cardId = 34,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => window.history.back());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI 상태
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const finishGameRef = useRef<(won: boolean, finalScore: number) => void>(() => {});
  const [snakeLength, setSnakeLength] = useState(20);
  const [rank, setRank] = useState(1);
  const [kills, setKills] = useState(0);
  const [score, setScore] = useState(0);
  const [killBanner, setKillBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // 조이스틱 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBoosting, setIsBoosting] = useState(false);

  // 햅틱 유틸
  const triggerHaptic = useCallback((ms: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, []);

  // 게임 로직 레퍼런스
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrameId: 0,

    // 플레이어 뱀
    playerHead: null as THREE.Group | null,
    playerBody: [] as THREE.Mesh[],
    playerHistory: [] as { x: number; z: number }[],
    playerX: 0,
    playerZ: 0,
    playerAngle: 0,
    targetAngle: 0,
    length: 20,
    kills: 0,
    score: 0,
    isBoosting: false,
    alive: true,

    // AI 봇
    bots: [] as SnakeBot[],

    // 스시 및 파티클
    sushis: [] as SushiData[],
    particles: [] as Particle[],
    arenaRadius: 28,
    isEnded: false,
    startTime: 0,
  });

  // 게임 종료 및 정산
  const finishGame = useCallback((won: boolean, finalScore: number) => {
    const g = gameRef.current;
    if (g.isEnded) return;
    g.isEnded = true;
    setIsPlaying(false);
    setGameOver(!won);
    setIsVictory(won);

    const timeSpent = Math.max(15, Math.floor((performance.now() - g.startTime) / 1000));
    const deposit = calculateAndDepositMissionReward({
      gameId: 'poki_sushi_party',
      gameTitle: 'Sushi Party 3D',
      durationSeconds: timeSpent,
      score: finalScore,
      maxTargetScore: 1500,
      isVictory: won,
    });
    setRewardResult(deposit);
    triggerHaptic(won ? [50, 100, 150] : [150, 80]);
    if (won) playSfx?.('victory');
    else playSfx?.('defeat');
  }, [lowSpecMode, cardId]);
  finishGameRef.current = finishGame;

  // 스시 3D 메쉬 생성 헬퍼
  const createSushiMesh = (type: SushiData['type']): THREE.Group => {
    const group = new THREE.Group();
    const riceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });

    if (type === 'salmon') {
      // 밥알 + 연어
      const rice = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.45), riceMat);
      group.add(rice);
      const salmonMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3, metalness: 0.1 });
      const fish = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.48), salmonMat);
      fish.position.y = 0.25;
      group.add(fish);
    } else if (type === 'tuna') {
      // 밥알 + 참치
      const rice = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.45), riceMat);
      group.add(rice);
      const tunaMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });
      const fish = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.48), tunaMat);
      fish.position.y = 0.25;
      group.add(fish);
    } else if (type === 'shrimp') {
      // 밥알 + 새우
      const rice = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.45), riceMat);
      group.add(rice);
      const shrimpMat = new THREE.MeshStandardMaterial({ color: 0xfb923c, roughness: 0.4 });
      const shrimp = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 8), shrimpMat);
      shrimp.rotation.z = Math.PI / 2;
      shrimp.position.y = 0.25;
      group.add(shrimp);
    } else {
      // 김밥 롤
      const noriMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16), noriMat);
      roll.rotation.x = Math.PI / 2;
      group.add(roll);
      const filling = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.42, 12), riceMat);
      filling.rotation.x = Math.PI / 2;
      group.add(filling);
    }

    group.scale.set(1.2, 1.2, 1.2);
    return group;
  };

  // Three.js 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfcdad7);
    scene.fog = new THREE.FogExp2(0xfcdad7, 0.015);

    // Camera (탑다운 쿼터뷰)
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(0, 20, 18);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xfff5f5, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.3);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // ==========================================
    // 3D 회전초밥 다다미 아레나 (반경 28m)
    // ==========================================
    const arenaRadius = 28;
    const arenaGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius + 1, 1.5, 48);
    const arenaMat = new THREE.MeshStandardMaterial({
      color: 0x3f2e24, // 따뜻한 우드 다다미
      roughness: 0.6,
      metalness: 0.1,
    });
    const arenaPlatform = new THREE.Mesh(arenaGeo, arenaMat);
    arenaPlatform.position.y = -0.75;
    arenaPlatform.receiveShadow = true;
    scene.add(arenaPlatform);

    // 황금 테두리 외곽 난간
    const rimGeo = new THREE.TorusGeometry(arenaRadius, 0.4, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.2;
    scene.add(rim);

    // ==========================================
    // 플레이어 카와이 핑크 스네이크 & No.034 영웅 배지
    // ==========================================
    const playerHead = new THREE.Group();

    // 머리 구체 (카와이 핑크)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 20), headMat);
    headMesh.castShadow = true;
    playerHead.add(headMesh);

    // 카와이 고양이 귀 2개
    const earMat = new THREE.MeshStandardMaterial({ color: 0xfb7185 });
    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 4), earMat);
    earL.position.set(-0.35, 0.65, -0.1);
    earL.rotation.z = 0.3;
    playerHead.add(earL);

    const earR = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 4), earMat);
    earR.position.set(0.35, 0.65, -0.1);
    earR.rotation.z = -0.3;
    playerHead.add(earR);

    // 카툰 눈망울 2개
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeMat);
    eyeL.position.set(-0.25, 0.2, 0.58);
    playerHead.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeMat);
    eyeR.position.set(0.25, 0.2, 0.58);
    playerHead.add(eyeR);

    // 공식 영웅 카드 스프라이트 HUD 배지
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 64;
    badgeCanvas.height = 64;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId, 0, 0, 64, 64);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
    const badgeSprite = new THREE.Sprite(badgeMat);
    badgeSprite.position.set(0, 1.4, 0);
    badgeSprite.scale.set(1.1, 1.1, 1);
    playerHead.add(badgeSprite);

    // 시작 지점: 중앙 안전 스폰 구역 (0, 0.45, 0)
    playerHead.position.set(0, 0.45, 0);
    scene.add(playerHead);

    // 플레이어 몸통 세그먼트 생성 (초기 20개)
    const playerBody: THREE.Mesh[] = [];
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.4 });
    const bodyGeo = new THREE.SphereGeometry(0.55, 14, 14);

    for (let i = 0; i < 20; i++) {
      const bSeg = new THREE.Mesh(bodyGeo, bodyMat);
      bSeg.position.set(0, 0.45, -i * 0.65);
      bSeg.castShadow = true;
      scene.add(bSeg);
      playerBody.push(bSeg);
    }

    // 히스토리 초기화
    const playerHistory: { x: number; z: number }[] = [];
    for (let i = 0; i < 150; i++) {
      playerHistory.push({ x: 0, z: -i * 0.2 });
    }

    // ==========================================
    // 4마리 AI 라이벌 스네이크 봇 생성
    // ==========================================
    const bots: SnakeBot[] = [];
    const botColors = [0x38bdf8, 0xfacc15, 0xa855f7, 0x10b981];
    const botNames = ['민트 스시', '치즈 롤', '포도 모찌', '와사비 캣'];

    for (let b = 0; b < 4; b++) {
      const bHead = new THREE.Group();
      const bMat = new THREE.MeshStandardMaterial({ color: botColors[b], roughness: 0.3 });
      const bHeadMesh = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), bMat);
      bHead.add(bHeadMesh);

      // 스폰 위치: 중앙 주변 분산 안전 안착
      const angle = (b * Math.PI * 2) / 4 + 0.4;
      const dist = 14;
      const bx = Math.cos(angle) * dist;
      const bz = Math.sin(angle) * dist;
      bHead.position.set(bx, 0.45, bz);
      scene.add(bHead);

      const bBody: THREE.Mesh[] = [];
      const bBodyGeo = new THREE.SphereGeometry(0.5, 12, 12);
      for (let i = 0; i < 20; i++) {
        const seg = new THREE.Mesh(bBodyGeo, bMat);
        seg.position.set(bx, 0.45, bz);
        scene.add(seg);
        bBody.push(seg);
      }

      const bHist: { x: number; z: number }[] = [];
      for (let i = 0; i < 150; i++) {
        bHist.push({ x: bx, z: bz });
      }

      bots.push({
        id: b + 1,
        name: botNames[b],
        color: botColors[b],
        headGroup: bHead,
        bodyMeshes: bBody,
        history: bHist,
        x: bx,
        z: bz,
        angle: angle + Math.PI / 2,
        speed: 5.5,
        length: 20,
        alive: true,
        score: 200,
      });
    }

    // ==========================================
    // 필드 3D 스시 아이템 75개 생성
    // ==========================================
    const sushis: SushiData[] = [];
    const sushiTypes: SushiData['type'][] = ['salmon', 'tuna', 'shrimp', 'roll'];

    for (let i = 0; i < 75; i++) {
      const t = sushiTypes[Math.floor(Math.random() * sushiTypes.length)];
      const sMesh = createSushiMesh(t);
      const sAngle = Math.random() * Math.PI * 2;
      const sDist = Math.random() * (arenaRadius - 2.5);
      const sx = Math.cos(sAngle) * sDist;
      const sz = Math.sin(sAngle) * sDist;
      sMesh.position.set(sx, 0.35, sz);
      scene.add(sMesh);

      sushis.push({
        id: i,
        mesh: sMesh,
        x: sx,
        z: sz,
        type: t,
        value: t === 'salmon' ? 25 : t === 'tuna' ? 30 : t === 'shrimp' ? 20 : 15,
      });
    }

    // 레퍼런스 등록
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.playerHead = playerHead;
    g.playerBody = playerBody;
    g.playerHistory = playerHistory;
    g.bots = bots;
    g.sushis = sushis;
    g.particles = [];
    g.playerX = 0;
    g.playerZ = 0;
    g.playerAngle = 0;
    g.targetAngle = 0;
    g.length = 20;
    g.kills = 0;
    g.score = 0;
    g.isBoosting = false;
    g.alive = true;
    g.isEnded = false;
    g.startTime = performance.now();

    // ==========================================
    // 애니메이션 루프
    // ==========================================
    let lastTime = performance.now();

    const animate = (now: number) => {
      g.animFrameId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      if (!g.isEnded && isPlaying && g.alive) {
        // ------------------------------------
        // 플레이어 회전 및 이동
        // ------------------------------------
        // 조이스틱 각도로 부드럽게 선회
        let diffAngle = g.targetAngle - g.playerAngle;
        while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
        while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
        g.playerAngle += diffAngle * Math.min(1, dt * 6.5);

        const currentSpeed = g.isBoosting ? 12.0 : 6.8;
        g.playerX += Math.sin(g.playerAngle) * currentSpeed * dt;
        g.playerZ += Math.cos(g.playerAngle) * currentSpeed * dt;

        // 아레나 벽면 충돌 클램프
        const distFromCenter = Math.hypot(g.playerX, g.playerZ);
        if (distFromCenter > arenaRadius - 1.2) {
          const normAngle = Math.atan2(g.playerX, g.playerZ);
          g.playerX = Math.sin(normAngle) * (arenaRadius - 1.2);
          g.playerZ = Math.cos(normAngle) * (arenaRadius - 1.2);
        }

        // 머리 위치 & 회전 반영
        if (g.playerHead) {
          g.playerHead.position.set(g.playerX, 0.45, g.playerZ);
          g.playerHead.rotation.y = g.playerAngle;
        }

        // 히스토리 기록
        g.playerHistory.unshift({ x: g.playerX, z: g.playerZ });
        if (g.playerHistory.length > 250) g.playerHistory.pop();

        // 몸통 세그먼트 추종
        const spacing = 3; // 히스토리 인덱스 간격
        for (let i = 0; i < g.playerBody.length; i++) {
          const histIdx = Math.min(g.playerHistory.length - 1, (i + 1) * spacing);
          const pos = g.playerHistory[histIdx];
          if (pos) {
            g.playerBody[i].position.set(pos.x, 0.42, pos.z);
          }
        }

        // 부스트 밥알 파티클
        if (g.isBoosting && Math.random() < 0.5) {
          const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), pMat);
          pMesh.position.set(g.playerX, 0.4, g.playerZ);
          scene.add(pMesh);
          g.particles.push({
            mesh: pMesh,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2,
            vz: (Math.random() - 0.5) * 2,
            life: 0,
            maxLife: 0.35,
          });
        }

        // ------------------------------------
        // 스시 먹기 판정
        // ------------------------------------
        for (const sushi of g.sushis) {
          sushi.mesh.rotation.y += dt * 2.0;

          // 플레이어 먹기
          const distP = Math.hypot(g.playerX - sushi.x, g.playerZ - sushi.z);
          if (distP < 1.4) {
            // 스시 섭취 성공!
            g.score += sushi.value;
            setScore(g.score);

            // 몸통 세그먼트 추가 (최대 60개)
            if (g.playerBody.length < 60) {
              const newSeg = new THREE.Mesh(bodyGeo, bodyMat);
              const lastPos = g.playerBody[g.playerBody.length - 1].position;
              newSeg.position.copy(lastPos);
              scene.add(newSeg);
              g.playerBody.push(newSeg);
              g.length++;
              setSnakeLength(g.length);
            }

            triggerHaptic(12);
            playSfx?.('coin');

            // 축하 섭취 스파크 파티클
            for (let p = 0; p < 8; p++) {
              const pMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
              const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), pMat);
              pMesh.position.set(sushi.x, 0.45, sushi.z);
              scene.add(pMesh);
              g.particles.push({
                mesh: pMesh,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 1,
                vz: (Math.random() - 0.5) * 4,
                life: 0,
                maxLife: 0.3,
              });
            }

            // 스시 리스폰 (무작위 위치)
            const rAng = Math.random() * Math.PI * 2;
            const rDist = Math.random() * (arenaRadius - 3.0);
            sushi.x = Math.cos(rAng) * rDist;
            sushi.z = Math.sin(rAng) * rDist;
            sushi.mesh.position.set(sushi.x, 0.35, sushi.z);
          }
        }

        // ------------------------------------
        // AI 봇 이동 & 스시 탐색 & 충돌
        // ------------------------------------
        for (const bot of g.bots) {
          if (!bot.alive) continue;

          // 가장 가까운 스시 찾기
          let nearestDist = 999;
          let targetX = bot.x;
          let targetZ = bot.z;
          for (const s of g.sushis) {
            const d = Math.hypot(bot.x - s.x, bot.z - s.z);
            if (d < nearestDist) {
              nearestDist = d;
              targetX = s.x;
              targetZ = s.z;
            }
          }

          // 스시 방향으로 선회
          const botTargetAngle = Math.atan2(targetX - bot.x, targetZ - bot.z);
          bot.angle = THREE.MathUtils.lerp(bot.angle, botTargetAngle, 0.08);

          bot.x += Math.sin(bot.angle) * bot.speed * dt;
          bot.z += Math.cos(bot.angle) * bot.speed * dt;

          // 벽면 클램프
          const bDist = Math.hypot(bot.x, bot.z);
          if (bDist > arenaRadius - 1.2) {
            bot.angle += Math.PI / 2;
          }

          bot.headGroup.position.set(bot.x, 0.45, bot.z);
          bot.headGroup.rotation.y = bot.angle;

          bot.history.unshift({ x: bot.x, z: bot.z });
          if (bot.history.length > 250) bot.history.pop();

          for (let i = 0; i < bot.bodyMeshes.length; i++) {
            const hIdx = Math.min(bot.history.length - 1, (i + 1) * spacing);
            const p = bot.history[hIdx];
            if (p) bot.bodyMeshes[i].position.set(p.x, 0.42, p.z);
          }

          // ----------------------------------
          // 킬/데스 충돌 검사
          // ----------------------------------
          // 1. AI 봇의 머리가 플레이어의 몸통에 부딪힘 -> 봇 사망 (플레이어 킬!)
          for (let i = 4; i < g.playerBody.length; i++) {
            const segPos = g.playerBody[i].position;
            const dist = Math.hypot(bot.x - segPos.x, bot.z - segPos.z);
            if (dist < 1.0) {
              // 봇 사망!
              bot.alive = false;
              scene.remove(bot.headGroup);
              bot.bodyMeshes.forEach((m) => scene.remove(m));

              g.kills++;
              setKills(g.kills);
              g.score += 400;
              setScore(g.score);

              setKillBanner(`💥 ${bot.name} 제압! +400 PTS`);
              triggerHaptic([40, 60, 80]);
              playSfx?.('victory');
              setTimeout(() => setKillBanner(null), 1500);

              // 봇 위치에 스시 드롭 연출
              for (let d = 0; d < 10; d++) {
                const dropSushi = g.sushis[(bot.id * 10 + d) % g.sushis.length];
                dropSushi.x = bot.x + (Math.random() - 0.5) * 4;
                dropSushi.z = bot.z + (Math.random() - 0.5) * 4;
                dropSushi.mesh.position.set(dropSushi.x, 0.35, dropSushi.z);
              }
              break;
            }
          }

          // 2. 플레이어의 머리가 봇의 몸통에 부딪힘 -> 플레이어 사망!
          if (bot.alive) {
            for (let i = 2; i < bot.bodyMeshes.length; i++) {
              const bSegPos = bot.bodyMeshes[i].position;
              const dist = Math.hypot(g.playerX - bSegPos.x, g.playerZ - bSegPos.z);
              if (dist < 0.95) {
                // 플레이어 사망!
                g.alive = false;
                finishGameRef.current(false, g.score);
                return;
              }
            }
          }
        }

        // 순위 계산 (길이 기준)
        let currentRank = 1;
        for (const bot of g.bots) {
          if (bot.alive && bot.length > g.length) currentRank++;
        }
        setRank(currentRank);

        // 목표 길이(50 이상) 달성 시 1위 챔피언 승리!
        if (g.length >= 50) {
          finishGameRef.current(true, g.score + 1000);
          return;
        }

        // 파티클 업데이트
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const p = g.particles[i];
          p.life += dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.vy -= 10 * dt;

          if (p.life >= p.maxLife) {
            scene.remove(p.mesh);
            g.particles.splice(i, 1);
          }
        }
      }

      // 카메라 부드러운 추종
      if (g.camera && g.playerHead) {
        const targetCamX = g.playerX;
        const targetCamZ = g.playerZ + 18;
        const targetCamY = 20;

        g.camera.position.x = THREE.MathUtils.lerp(g.camera.position.x, targetCamX, 0.1);
        g.camera.position.z = THREE.MathUtils.lerp(g.camera.position.z, targetCamZ, 0.1);
        g.camera.position.y = targetCamY;
        g.camera.lookAt(g.playerX, 0.45, g.playerZ);
      }

      renderer.render(scene, camera);
    };

    g.animFrameId = requestAnimationFrame(animate);

    // Resize
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

  // 플로팅 조이스틱 터치 인터랙션
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
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

        // 목표 선회 각도 계산 (화면 기준)
        gameRef.current.targetAngle = Math.atan2(kx, -ky);
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
        break;
      }
    }
  };

  // 부스트 토글
  const handleBoostStart = () => {
    setIsBoosting(true);
    gameRef.current.isBoosting = true;
    triggerHaptic(25);
  };
  const handleBoostEnd = () => {
    setIsBoosting(false);
    gameRef.current.isBoosting = false;
  };

  // 키보드 조작 (PC 백업)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') g.targetAngle = 0;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') g.targetAngle = Math.PI;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') g.targetAngle = -Math.PI / 2;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') g.targetAngle = Math.PI / 2;
      if (e.code === 'Space' || e.code === 'ShiftLeft') {
        setIsBoosting(true);
        g.isBoosting = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ShiftLeft') {
        setIsBoosting(false);
        gameRef.current.isBoosting = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fcdad7] text-white font-mono"
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
        gameTitle="Sushi Party 3D"
        score={score}
        onQuit={() => finishGameRef.current(false, score)}
      />

      {/* 실시간 게임 스탯 오버레이 */}
      <div className="absolute top-14 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* 길이 & 킬 */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-sm border border-rose-500/50 text-xs font-bold text-rose-300">
            🍣 길이: <strong className="text-white text-sm">{snakeLength}</strong> / 50
          </div>
          <div className="px-3 py-0.5 bg-black/60 rounded-sm text-[11px] text-amber-300">
            ⚔️ 제압: <strong>{kills}</strong>마리
          </div>
        </div>

        {/* 현재 순위 뱃지 */}
        <div className="px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-sm border-2 border-yellow-400 text-center shadow-lg">
          <div className="text-[10px] text-zinc-300">CURRENT RANK</div>
          <div className="text-lg font-black text-yellow-400 leading-none mt-0.5">#{rank}위</div>
        </div>
      </div>

      {/* 킬 알림 배너 */}
      {killBanner && (
        <div className="absolute top-28 left-4 right-4 pointer-events-none z-10 flex justify-center">
          <div className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-500 rounded-sm text-xs font-black text-white shadow-xl animate-bounce">
            {killBanner}
          </div>
        </div>
      )}

      {/* 플로팅 가상 조이스틱 */}
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
          <div className="w-full h-full rounded-full border-2 border-rose-400/60 bg-rose-950/40 backdrop-blur-sm flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-rose-400 border border-white shadow-lg"
              style={{
                transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 우측 하단 대형 76px [⚡ BOOST] 버튼 */}
      <div className="absolute bottom-8 right-6 z-20">
        <button
          type="button"
          onPointerDown={handleBoostStart}
          onPointerUp={handleBoostEnd}
          onPointerLeave={handleBoostEnd}
          className={`w-20 h-20 rounded-full border-2 text-white flex flex-col items-center justify-center font-black transition-transform active:scale-90 shadow-2xl ${
            isBoosting
              ? 'bg-rose-500 border-yellow-300 scale-105 ring-4 ring-rose-400/50'
              : 'bg-gradient-to-tr from-rose-600 to-pink-500 border-rose-300'
          }`}
        >
          <span className="text-2xl leading-none">⚡</span>
          <span className="text-xs font-black tracking-tight mt-1">BOOST</span>
        </button>
      </div>

      {/* 좌측 하단 제스처 가이드 */}
      {!joystickActive && isPlaying && (
        <div className="absolute bottom-8 left-8 pointer-events-none z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full border border-white/10 text-zinc-300 text-xs">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          화면 좌측 터치로 360° 조향
        </div>
      )}

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Sushi Party 3D"
        description="다다미 회전초밥 아레나에서 맛있는 스시를 먹고 거대 뱀으로 성장하세요!"
        features={[
          {
            iconType: 'GOAL',
            title: '길이 50 달성 & 1위 챔피언',
            desc: '스시를 먹어 길이를 50 이상으로 늘리고 라이벌 뱀들을 모두 제압하세요.',
          },
          {
            iconType: 'GESTURES',
            title: '360° 조향 & 부스트 컷오프',
            desc: '좌측 플로팅 조이스틱으로 이동하고, 우측 [BOOST]로 적의 앞길을 차단하세요.',
          },
          {
            iconType: 'REWARDS',
            title: 'SNS 보상 정산',
            desc: '1위 달성 및 미션 성공 시 최대 50 SNS 포인트 및 랭킹 점수가 지급됩니다.',
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

export default PokiSushiPartyGame;
