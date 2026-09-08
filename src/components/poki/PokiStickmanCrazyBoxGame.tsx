import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanCrazyBoxGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface CrazyBox3D {
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  type: 'wood' | 'tnt' | 'gold';
  x: number;
  y: number;
  z: number;
  vy: number;
  isLanded: boolean;
  tntTimer: number;
  width: number;
  height: number;
  depth: number;
  active: boolean;
}

interface StarGem3D {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

const TARGET_STARS = 8; // 목표 황금 별 개수

export default function PokiStickmanCrazyBoxGame({
  onBack,
  onClose,
  cardId = 89,
  onExit
}: PokiStickmanCrazyBoxGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onClose || (() => {});

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'hit' | 'victory'>('ready');
  const [starsCount, setStarsCount] = useState(0);
  const [health, setHealth] = useState(3);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [isDashCooldown, setIsDashCooldown] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 다이나믹 플로팅 조이스틱 UI 상태
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Three.js 인스턴스 레프
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    stickman: THREE.Group;
    stickmanParts: {
      head: THREE.Mesh;
      body: THREE.Mesh;
      leftArm: THREE.Mesh;
      rightArm: THREE.Mesh;
      leftLeg: THREE.Mesh;
      rightLeg: THREE.Mesh;
    };
    boxes: CrazyBox3D[];
    stars: StarGem3D[];
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
    playerX: 0,
    playerY: 0.9,
    playerZ: 0,
    playerVx: 0,
    playerVy: 0,
    playerVz: 0,
    isGrounded: true,
    moveInputX: 0,
    moveInputZ: 0,
    health: 3,
    invincibleTimer: 0,
    dashTimer: 0,
    stars: 0,
    surviveSeconds: 0,
    boxSpawnTimer: 0,
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
      gameId: 'pokistickmancrazybox',
      gameTitle: 'Stickman Crazy Box 3D',
      isVictory: true,
      score: TARGET_STARS,
      maxTargetScore: TARGET_STARS,
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
      gameId: 'pokistickmancrazybox',
      gameTitle: 'Stickman Crazy Box 3D',
      isVictory: false,
      score: stateRef.current.stars,
      maxTargetScore: TARGET_STARS,
      durationSeconds: Math.round(stateRef.current.surviveSeconds),
    });
    setRewardReceipt(receipt);
  }, [cardId]);

  // 게임 시작
  const startGame = useCallback(() => {
    stateRef.current.gameState = 'playing';
    stateRef.current.playerX = 0;
    stateRef.current.playerY = 0.9;
    stateRef.current.playerZ = 0;
    stateRef.current.playerVx = 0;
    stateRef.current.playerVy = 0;
    stateRef.current.playerVz = 0;
    stateRef.current.isGrounded = true;
    stateRef.current.health = 3;
    stateRef.current.invincibleTimer = 0;
    stateRef.current.dashTimer = 0;
    stateRef.current.stars = 0;
    stateRef.current.surviveSeconds = 0;
    stateRef.current.boxSpawnTimer = 0;

    // 기존 상자들 제거
    if (threeRef.current) {
      threeRef.current.boxes.forEach((b) => {
        threeRef.current!.scene.remove(b.mesh);
        threeRef.current!.scene.remove(b.shadow);
      });
      threeRef.current.boxes = [];

      threeRef.current.stars.forEach((s) => {
        s.collected = false;
        s.mesh.visible = true;
      });
    }

    setGameState('playing');
    setStarsCount(0);
    setHealth(3);
    setSurvivalTime(0);
    setRewardReceipt(null);
    triggerHaptic(50);
  }, [cardId]);

  // 점프 액션
  const handleJump = useCallback(() => {
    if (stateRef.current.gameState !== 'playing') return;
    if (stateRef.current.isGrounded) {
      stateRef.current.playerVy = 8.8; // 점프 도약력
      stateRef.current.isGrounded = false;
      triggerHaptic(30);
    }
  }, [cardId]);

  // 대시 액션 (순간 가속 및 무적)
  const handleDash = useCallback(() => {
    if (stateRef.current.gameState !== 'playing' || isDashCooldown) return;
    stateRef.current.dashTimer = 0.35; // 0.35초간 초고속 대시
    stateRef.current.invincibleTimer = 0.5;
    setIsDashCooldown(true);
    triggerHaptic([40, 20, 40]);

    setTimeout(() => {
      setIsDashCooldown(false);
    }, 1200); // 1.2초 쿨다운
  }, [isDashCooldown, triggerHaptic]);

  // Three.js 씬 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3dbfc); // 딥 사이버 아레나
    scene.fog = new THREE.FogExp2(0xe3dbfc, 0.01);

    // Camera (탑다운 쿼터뷰)
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 200);
    camera.position.set(0, 16, 17);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    mainLight.position.set(15, 25, 15);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 0.9);
    rimLight.position.set(-15, 10, -15);
    scene.add(rimLight);

    // No.089 공식 카드 영웅 배지 텍스처
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 256;
    heroCanvas.height = 256;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, cardId, 18, 18, 220, 220, { circleClip: true });
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.needsUpdate = true;

    // --- 3D 서바이벌 아레나 플랫폼 (18m x 18m) ---
    const ARENA_RADIUS = 9.5;
    const arenaGeo = new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS + 0.5, 0.8, 8); // 팔각형 플랫폼
    const arenaMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.3,
    });
    const arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.y = -0.4;
    scene.add(arena);

    // 네온 엣지 림
    const rimGeo = new THREE.RingGeometry(ARENA_RADIUS - 0.2, ARENA_RADIUS + 0.2, 8);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const arenaRim = new THREE.Mesh(rimGeo, rimMat);
    arenaRim.rotation.x = -Math.PI / 2;
    arenaRim.position.y = 0.01;
    scene.add(arenaRim);

    // 중앙 바닥 No.089 공식 영웅 배지 엠블럼
    const badgeGeo = new THREE.PlaneGeometry(4.5, 4.5);
    const badgeMat = new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.rotation.x = -Math.PI / 2;
    badgeMesh.position.set(0, 0.02, 0);
    scene.add(badgeMesh);

    // 아레나 기둥 (모서리 8개)
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px = Math.cos(angle) * (ARENA_RADIUS - 0.4);
      const pz = Math.sin(angle) * (ARENA_RADIUS - 0.4);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 1.5, pz);
      scene.add(pillar);

      // 네온 캡 라이트
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      cap.position.set(px, 3.1, pz);
      scene.add(cap);
    }

    // --- 3D 스틱맨 캐릭터 모델링 ---
    const stickman = new THREE.Group();
    stickman.position.set(0, 0.9, 0);

    const stickmanMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 });

    // 머리
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), stickmanMat);
    head.position.y = 0.9;
    stickman.add(head);

    // 몸통
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.8, 8), stickmanMat);
    body.position.y = 0.4;
    stickman.add(body);

    // 등 뒤 No.089 공식 카드 영웅 배지 백팩
    const backpackGeo = new THREE.BoxGeometry(0.5, 0.5, 0.15);
    const bpMesh = new THREE.Mesh(backpackGeo, jointMat);
    bpMesh.position.set(0, 0.45, -0.18);

    const badgeDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.42),
      new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true })
    );
    badgeDecal.rotation.y = Math.PI;
    badgeDecal.position.set(0, 0, -0.08);
    bpMesh.add(badgeDecal);
    stickman.add(bpMesh);

    // 양팔
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8);
    const leftArm = new THREE.Mesh(armGeo, stickmanMat);
    leftArm.position.set(-0.3, 0.45, 0);
    stickman.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, stickmanMat);
    rightArm.position.set(0.3, 0.45, 0);
    stickman.add(rightArm);

    // 양다리
    const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.65, 8);
    const leftLeg = new THREE.Mesh(legGeo, stickmanMat);
    leftLeg.position.set(-0.15, -0.2, 0);
    stickman.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, stickmanMat);
    rightLeg.position.set(0.15, -0.2, 0);
    stickman.add(rightLeg);

    scene.add(stickman);

    // --- 황금 별 (Star Gems) 8개 배치 ---
    const stars: StarGem3D[] = [];
    const starGeo = new THREE.OctahedronGeometry(0.4, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xfacc15,
      emissiveIntensity: 0.4,
    });

    const starPositions = [
      [-4, 1.2, -4],
      [4, 1.2, -4],
      [-4, 1.2, 4],
      [4, 1.2, 4],
      [0, 2.5, -5.5],
      [0, 2.5, 5.5],
      [-5.5, 2.5, 0],
      [5.5, 2.5, 0],
    ];

    starPositions.forEach(([sx, sy, sz]) => {
      const starMesh = new THREE.Mesh(starGeo, starMat);
      starMesh.position.set(sx, sy, sz);
      scene.add(starMesh);
      stars.push({ mesh: starMesh, x: sx, y: sy, z: sz, collected: false });
    });

    // --- 파티클 시스템 (폭발 스파크 & 승리 콘페티) ---
    // 1) 폭발 스파크
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

    const boxes: CrazyBox3D[] = [];
    const clock = new THREE.Clock();

    threeRef.current = {
      scene,
      camera,
      renderer,
      stickman,
      stickmanParts: { head, body, leftArm, rightArm, leftLeg, rightLeg },
      boxes,
      stars,
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

    // 새로운 상자 낙하 스폰 함수
    const spawnBox = () => {
      const types = ['wood', 'wood', 'tnt', 'gold'] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      const size = 1.4;

      let boxColor = 0xb45309; // Wood
      if (type === 'tnt') boxColor = 0xdc2626; // Red TNT
      if (type === 'gold') boxColor = 0xf59e0b; // Amber Gold

      const boxMesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({ color: boxColor, roughness: 0.6, metalness: type === 'gold' ? 0.8 : 0.2 })
      );

      // 낙하 위치 (아레나 내부 랜덤)
      const rx = (Math.random() - 0.5) * 12;
      const rz = (Math.random() - 0.5) * 12;
      const startY = 14;

      boxMesh.position.set(rx, startY, rz);
      scene.add(boxMesh);

      // 지면 경고 그림자
      const shadowMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.3, size * 0.7, 16),
        new THREE.MeshBasicMaterial({
          color: type === 'tnt' ? 0xff0000 : 0x000000,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        })
      );
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(rx, 0.02, rz);
      scene.add(shadowMesh);

      boxes.push({
        mesh: boxMesh,
        shadow: shadowMesh,
        type,
        x: rx,
        y: startY,
        z: rz,
        vy: -10, // 낙하 속도
        isLanded: false,
        tntTimer: 2.2,
        width: size,
        height: size,
        depth: size,
        active: true,
      });
    };

    // 애니메이션 루프
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const s = stateRef.current;

      if (s.gameState === 'playing') {
        s.surviveSeconds += delta;
        setSurvivalTime(Math.round(s.surviveSeconds));

        // 1. 상자 주기적 스폰 (1.4초마다)
        s.boxSpawnTimer += delta;
        if (s.boxSpawnTimer > 1.4) {
          s.boxSpawnTimer = 0;
          spawnBox();
        }

        // 2. 플레이어 조작 이동 및 물리 (Screen-relative 완벽 일치)
        let moveSpeed = 6.8;
        if (s.dashTimer > 0) {
          s.dashTimer -= delta;
          moveSpeed = 13.5; // 대시 가속
        }

        s.playerVx = s.moveInputX * moveSpeed;
        s.playerVz = s.moveInputZ * moveSpeed;

        // 중력
        s.playerVy -= 24 * delta;

        s.playerX += s.playerVx * delta;
        s.playerY += s.playerVy * delta;
        s.playerZ += s.playerVz * delta;

        // 아레나 밖 추락 방지 가드레일 경계
        const distFromCenter = Math.hypot(s.playerX, s.playerZ);
        if (distFromCenter > ARENA_RADIUS - 0.8) {
          const angle = Math.atan2(s.playerZ, s.playerX);
          s.playerX = Math.cos(angle) * (ARENA_RADIUS - 0.8);
          s.playerZ = Math.sin(angle) * (ARENA_RADIUS - 0.8);
        }

        // 착지 높이 계산 (기본 지면 Y = 0.9, 또는 착지된 상자 상단 Y)
        let supportY = 0.9;
        boxes.forEach((b) => {
          if (b.active && b.isLanded) {
            const dx = Math.abs(s.playerX - b.x);
            const dz = Math.abs(s.playerZ - b.z);
            if (dx < b.width / 2 + 0.3 && dz < b.depth / 2 + 0.3) {
              const boxTop = b.y + b.height / 2 + 0.9;
              if (s.playerY >= boxTop - 0.6 && boxTop > supportY) {
                supportY = boxTop;
              }
            }
          }
        });

        if (s.playerY <= supportY) {
          s.playerY = supportY;
          s.playerVy = 0;
          s.isGrounded = true;
        }

        // 무적 타이머
        if (s.invincibleTimer > 0) {
          s.invincibleTimer -= delta;
          stickman.visible = Math.floor(s.invincibleTimer * 10) % 2 === 0;
        } else {
          stickman.visible = true;
        }

        // 3. 낙하 상자 물리 & 충돌 판정
        for (let i = boxes.length - 1; i >= 0; i--) {
          const b = boxes[i];
          if (!b.active) continue;

          if (!b.isLanded) {
            b.y += b.vy * delta;
            b.mesh.position.y = b.y;

            // 착지 검사 (다른 상자 위 또는 지면 Y = size/2)
            let groundY = b.height / 2;
            for (let j = 0; j < boxes.length; j++) {
              const other = boxes[j];
              if (other !== b && other.active && other.isLanded) {
                if (Math.abs(b.x - other.x) < b.width * 0.8 && Math.abs(b.z - other.z) < b.depth * 0.8) {
                  const top = other.y + other.height;
                  if (top > groundY) groundY = top;
                }
              }
            }

            if (b.y <= groundY) {
              b.y = groundY;
              b.mesh.position.y = b.y;
              b.isLanded = true;
              scene.remove(b.shadow); // 착지 시 그림자 제거
              triggerHaptic(20);
            }

            // 플레이어 직격 낙하 충돌 판정
            if (s.invincibleTimer <= 0) {
              const dx = Math.abs(s.playerX - b.x);
              const dz = Math.abs(s.playerZ - b.z);
              const dy = Math.abs(s.playerY - b.y);
              if (dx < 0.9 && dz < 0.9 && dy < 1.2) {
                // 상자에 깔림!
                s.health -= 1;
                setHealth(s.health);
                s.invincibleTimer = 1.6;
                triggerHaptic([150, 50, 150]);

                if (s.health <= 0) {
                  handleGameOver();
                }
              }
            }
          } else if (b.type === 'tnt') {
            // TNT 폭탄 카운트다운
            b.tntTimer -= delta;
            const mat = b.mesh.material as THREE.MeshStandardMaterial;
            mat.emissive = new THREE.Color(0xff0000);
            mat.emissiveIntensity = Math.sin(b.tntTimer * 15) > 0 ? 0.8 : 0.1;

            if (b.tntTimer <= 0) {
              // TNT 폭발!
              b.active = false;
              scene.remove(b.mesh);

              // 주변 폭발 반경 데미지/넉백
              const dist = Math.hypot(s.playerX - b.x, s.playerZ - b.z);
              if (dist < 3.2 && s.invincibleTimer <= 0) {
                s.health -= 1;
                setHealth(s.health);
                s.invincibleTimer = 1.6;
                s.playerVy = 7.0; // 넉백 도약
                triggerHaptic([180, 80, 180]);
                if (s.health <= 0) handleGameOver();
              }

              // 폭발 파티클
              (sparkMat as THREE.PointsMaterial).opacity = 1.0;
              sparks.position.set(b.x, b.y, b.z);
            }
          }
        }

        // 4. 황금 별 수집 판정
        stars.forEach((st) => {
          if (!st.collected) {
            st.mesh.rotation.y += delta * 3;
            st.mesh.rotation.z += delta * 2;

            const dx = Math.abs(s.playerX - st.x);
            const dy = Math.abs(s.playerY - st.y);
            const dz = Math.abs(s.playerZ - st.z);
            if (dx < 1.3 && dy < 1.4 && dz < 1.3) {
              st.collected = true;
              st.mesh.visible = false;
              s.stars += 1;
              setStarsCount(s.stars);
              triggerHaptic(40);

              if (s.stars >= TARGET_STARS) {
                handleVictory();
              }
            }
          }
        });

        // 5. 스틱맨 포지션 & 모션 동기화
        stickman.position.set(s.playerX, s.playerY, s.playerZ);

        // 이동 방향 바라보기
        if (Math.abs(s.playerVx) > 0.1 || Math.abs(s.playerVz) > 0.1) {
          const moveAngle = Math.atan2(s.playerVx, s.playerVz);
          stickman.rotation.y = moveAngle;

          // 보행 달리기 애니메이션
          const runTime = s.surviveSeconds * 14;
          threeRef.current.stickmanParts.leftArm.rotation.x = Math.sin(runTime) * 0.7;
          threeRef.current.stickmanParts.rightArm.rotation.x = -Math.sin(runTime) * 0.7;
          threeRef.current.stickmanParts.leftLeg.rotation.x = -Math.sin(runTime) * 0.8;
          threeRef.current.stickmanParts.rightLeg.rotation.x = Math.sin(runTime) * 0.8;
        } else {
          threeRef.current.stickmanParts.leftArm.rotation.x = 0;
          threeRef.current.stickmanParts.rightArm.rotation.x = 0;
          threeRef.current.stickmanParts.leftLeg.rotation.x = 0;
          threeRef.current.stickmanParts.rightLeg.rotation.x = 0;
        }

        // 스파크 감쇠
        if ((sparkMat as THREE.PointsMaterial).opacity > 0) {
          (sparkMat as THREE.PointsMaterial).opacity -= delta * 2;
        }
      }

      // 승리 시 콘페티 분출 & 카메라 회전
      if (s.gameState === 'victory') {
        (confettiMat as THREE.PointsMaterial).opacity = 0.9;
        const pos = confettiGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < confettiCount; i++) {
          pos[i * 3 + 1] -= delta * 3;
          if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 9;
        }
        confettiGeo.attributes.position.needsUpdate = true;
        camera.position.x = Math.sin(clock.getElapsedTime() * 0.5) * 16;
        camera.position.z = Math.cos(clock.getElapsedTime() * 0.5) * 16;
        camera.lookAt(0, 1.5, 0);
      } else {
        // 플레이어 카메라 팔로우
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, s.playerX * 0.5, delta * 5);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, s.playerZ * 0.5 + 17, delta * 5);
        camera.lookAt(s.playerX, s.playerY + 0.5, s.playerZ);
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

  // 다이나믹 플로팅 조이스틱 터치 핸들러 (Screen-relative 완벽 일치)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (stateRef.current.gameState !== 'playing') return;
    const touch = e.touches[0];
    // 화면 좌측 절반 터치 시 조이스틱 활성화
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
        stateRef.current.moveInputX = clampX / maxRadius;
        stateRef.current.moveInputZ = clampY / maxRadius;
      }
    }
  };

  const handleTouchEnd = () => {
    stateRef.current.touchId = null;
    stateRef.current.moveInputX = 0;
    stateRef.current.moveInputZ = 0;
    setJoystickPos(null);
    setKnobPos({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#e3dbfc] text-white font-mono flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js 3D 뷰포트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 상단 미니멀 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="STICKMAN CRAZY BOX 3D"
        onQuit={handleExit}
        progressPercent={Math.min(100, Math.round((starsCount / TARGET_STARS) * 100))}
        customScore={starsCount}
        scoreLabel="STARS"
        rewardPreview={35}
      />

      {/* 생존 시간 & 하트 상태 바 */}
      {gameState === 'playing' && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* 생존 시간 & 별 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm flex items-center gap-3">
            <div>
              <div className="text-[9px] text-slate-400">TIME</div>
              <div className="text-base font-black text-cyan-400 leading-none">{survivalTime}s</div>
            </div>
            <div className="w-[1px] h-6 bg-slate-700" />
            <div>
              <div className="text-[9px] text-slate-400">STARS</div>
              <div className="text-base font-black text-amber-400 leading-none">
                {starsCount}/{TARGET_STARS}
              </div>
            </div>
          </div>

          {/* 하트 실드 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm flex items-center gap-1.5">
            {[1, 2, 3].map((h) => (
              <span key={h} className={`text-base ${h <= health ? 'text-red-500' : 'text-slate-600'}`}>
                ♥
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 다이나믹 플로팅 조이스틱 시각 피드백 (화면 터치 지점) */}
      {joystickPos && (
        <div
          className="absolute z-30 pointer-events-none w-24 h-24 rounded-full border-2 border-cyan-400/40 bg-cyan-950/20 backdrop-blur-xs flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{ left: joystickPos.x, top: joystickPos.y }}
        >
          <div
            className="w-10 h-10 rounded-full bg-cyan-400/80 shadow-lg shadow-cyan-400/50"
            style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
          />
        </div>
      )}

      {/* 게임 시작 대기 오버레이 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-1">
              [POKI POPULAR 110: NO.089]
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              STICKMAN CRAZY BOX 3D
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              하늘에서 무작위로 쏟아지는 크레이지 상자들을 피하세요! 상자를 밟고 높이 올라가며 황금 별 8개를 수집하여 아레나의 지배자가 되세요.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 p-3 mb-6 rounded-sm text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span>[✦] 공식 배지:</span> No.089 스틱맨 백팩 및 중앙 아레나 장착
              </div>
              <div className="flex items-center gap-2">
                <span>[🕹️ 조이스틱]</span> 좌측 화면 터치 드래그로 360° 자유 이동
              </div>
              <div className="flex items-center gap-2">
                <span>[⬆️ JUMP]</span> 상자 위로 뛰어오르는 파쿠르 점프
              </div>
              <div className="flex items-center gap-2">
                <span>[💨 DASH]</span> 순간 무적 회피 대시 (낙하 상자 회피)
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span>[💣 TNT 주의]</span> 빨간 상자는 2초 뒤 폭발합니다!
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-black text-lg rounded-sm tracking-wider uppercase shadow-lg transition-transform active:scale-95"
            >
              START BATTLE 📦
            </button>
          </div>
        </div>
      )}

      {/* 게임오버 오버레이 */}
      {gameState === 'hit' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-3xl mb-2">💥</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">KNOCKED OUT!</h2>
            <p className="text-xs text-slate-400 mb-4">상자에 깔려 쓰러졌습니다. 수집 실적에 따라 보상이 정산됩니다.</p>

            <div className="bg-slate-950 p-3 rounded-sm border border-slate-800 mb-5 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">생존 시간:</span>
                <span className="font-bold text-white">{survivalTime} 초</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">수집한 별:</span>
                <span className="font-bold text-amber-400">
                  {starsCount} / {TARGET_STARS}
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
          title="CRAZY BOX CHAMPION!"
          subtitle="황금 별 8개를 모두 수집하고 상자 지옥에서 생존했습니다!"
        />
      )}

      {/* 하단 모바일 퓨어 터치 버튼 군 (100% 모바일 퓨어 제스처 준수) */}
      {gameState === 'playing' && (
        <div className="mt-auto z-20 pb-6 px-6 flex items-end justify-between pointer-events-auto">
          {/* 좌측: 조이스틱 힌트 라벨 */}
          <div className="text-[10px] text-slate-500 pb-2">
            좌측 화면 터치 드래그로 이동
          </div>

          {/* 우측: 64px [💨 DASH] + 76px [⬆️ JUMP] 대형 액션 버튼 */}
          <div className="flex items-end gap-3">
            <button
              onClick={handleDash}
              disabled={isDashCooldown}
              className={`w-16 h-16 rounded-sm flex flex-col items-center justify-center font-black text-xs border transition-all ${
                isDashCooldown
                  ? 'bg-slate-800 border-slate-700 text-slate-600 opacity-60'
                  : 'bg-slate-900/90 active:bg-cyan-700 border-cyan-500/70 text-cyan-300 shadow-lg active:scale-95'
              }`}
            >
              <span className="text-base leading-none">💨</span>
              <span className="text-[9px] mt-1 font-bold">DASH</span>
            </button>

            <button
              onClick={handleJump}
              className="w-20 h-20 bg-cyan-500 active:bg-cyan-600 border border-cyan-300 text-black font-black text-base rounded-sm flex flex-col items-center justify-center shadow-xl shadow-cyan-500/30 transition-transform active:scale-95"
            >
              <span className="text-2xl leading-none">⬆️</span>
              <span className="text-xs mt-1 font-black">JUMP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
