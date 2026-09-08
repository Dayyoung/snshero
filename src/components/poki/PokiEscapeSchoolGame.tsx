import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiEscapeSchoolGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

interface GoldenKey {
  id: number;
  x: number;
  z: number;
  mesh: THREE.Group;
  collected: boolean;
}

interface TeacherBot {
  id: number;
  name: string;
  group: THREE.Group;
  coneMesh: THREE.Mesh;
  coneMat: THREE.MeshBasicMaterial;
  waypoints: { x: number; z: number }[];
  wpIdx: number;
  x: number;
  z: number;
  angle: number;
  speed: number;
  isChasing: boolean;
  chaseTimer: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiEscapeSchoolGame: React.FC<PokiEscapeSchoolGameProps> = ({
  onBack,
  onExit,
  cardId = 37,
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
  const [keysCount, setKeysCount] = useState(0);
  const [alertStatus, setAlertStatus] = useState<'SAFE' | 'CAUTION' | 'CHASE'>('SAFE');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // 조이스틱 및 액션 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number } | null>(null);
  const [joystickKnob, setJoystickKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSneaking, setIsSneaking] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

  // 햅틱 유틸
  const triggerHaptic = useCallback((ms: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, []);

  // Three.js 게임 로직 레퍼런스
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrameId: 0,

    // 플레이어
    playerGroup: null as THREE.Group | null,
    playerX: -11.0, // 시작 안전 빈 교실 안착
    playerZ: 7.0,
    playerAngle: 0,
    inputX: 0,
    inputZ: 0,
    isSneaking: false,
    isSprinting: false,

    // 교사 AI 및 열쇠
    teachers: [] as TeacherBot[],
    keys: [] as GoldenKey[],
    particles: [] as Particle[],
    gateMesh: null as THREE.Group | null,
    gateUnlocked: false,

    score: 0,
    keysCollected: 0,
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
      gameId: 'poki_escape_school',
      gameTitle: 'Escape From School 3D',
      durationSeconds: timeSpent,
      score: finalScore,
      maxTargetScore: 1200,
      isVictory: won,
    });
    setRewardResult(deposit);
    triggerHaptic(won ? [50, 100, 150] : [150, 80]);
    if (won) playSfx?.('victory');
    else playSfx?.('defeat');
  }, [lowSpecMode, cardId]);
  finishGameRef.current = finishGame;

  // Three.js 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5); // 학교 야간 분위기
    scene.fog = new THREE.FogExp2(0xfbf3d5, 0.016);

    // Camera (탑다운 쿼터뷰 추종)
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(-11, 16, 17);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xfff1f2, 0.95);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffe4e6, 1.2);
    dirLight.position.set(10, 25, 15);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // ==========================================
    // 3D 학교 맵 구축 (30x20m 공간)
    // ==========================================
    // 1. 바닥 타일 (대리석 복도)
    const floorGeo = new THREE.PlaneGeometry(32, 22);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 2. 외벽 및 칸막이 벽체들
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });

    const createWall = (w: number, h: number, d: number, x: number, z: number) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(x, h / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    };

    // 외곽 벽
    createWall(32, 3.0, 0.6, 0, 11); // 하단
    createWall(32, 3.0, 0.6, 0, -11); // 상단
    createWall(0.6, 3.0, 22, -16, 0); // 좌측
    createWall(0.6, 3.0, 22, 16, 0); // 우측

    // 내부 교실 칸막이 벽
    createWall(10, 2.8, 0.5, -8, 2); // 좌측 교실벽
    createWall(10, 2.8, 0.5, 8, 2); // 우측 교실벽
    createWall(0.5, 2.8, 8, -3, -2); // 중앙 복도벽 L
    createWall(0.5, 2.8, 8, 3, -2); // 중앙 복도벽 R

    // 3. 학생 책상들 (은신 가능한 3D 장애물 6개)
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });
    const deskPositions = [
      { x: -10, z: 6 },
      { x: -7, z: 6 },
      { x: 7, z: 6 },
      { x: 10, z: 6 },
      { x: -9, z: -5 },
      { x: 9, z: -5 },
    ];
    deskPositions.forEach((pos) => {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.2), deskMat);
      desk.position.set(pos.x, 0.45, pos.z);
      desk.castShadow = true;
      desk.receiveShadow = true;
      scene.add(desk);
    });

    // 4. 복도 사물함 라인 (Lockers)
    const lockerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.3 });
    const lockers = new THREE.Mesh(new THREE.BoxGeometry(8.0, 2.0, 0.8), lockerMat);
    lockers.position.set(0, 1.0, 2.2);
    lockers.castShadow = true;
    scene.add(lockers);

    // 5. 최종 탈출 교문 게이트 (X: 0, Z: -10.8m)
    const gateGroup = new THREE.Group();
    const gPostMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 0.5), gPostMat);
    postL.position.set(-2.0, 1.6, 0);
    gateGroup.add(postL);

    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 0.5), gPostMat);
    postR.position.set(2.0, 1.6, 0);
    gateGroup.add(postR);

    // 철제 빗장 문 (자물쇠)
    const gateDoorMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 });
    const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 0.2), gateDoorMat);
    gateDoor.position.set(0, 1.3, 0);
    gateGroup.add(gateDoor);

    gateGroup.position.set(0, 0, -10.8);
    scene.add(gateGroup);

    // ==========================================
    // 3D 학생 플레이어 & No.037 영웅 배지
    // ==========================================
    const playerGroup = new THREE.Group();

    // 몸통 (교복 슈트)
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5 });
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.4), pBodyMat);
    pBody.position.y = 0.85;
    pBody.castShadow = true;
    playerGroup.add(pBody);

    // 책가방
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), bagMat);
    bag.position.set(0, 0.85, -0.28);
    playerGroup.add(bag);

    // 머리
    const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });
    const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), pHeadMat);
    pHead.position.y = 1.55;
    pHead.castShadow = true;
    playerGroup.add(pHead);

    // 공식 영웅 카드 스프라이트 HUD 배지 No.037
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
    badgeSprite.position.set(0, 2.3, 0);
    badgeSprite.scale.set(1.1, 1.1, 1);
    playerGroup.add(badgeSprite);

    // 시작 지점: 좌측 빈 교실 안전 안착
    playerGroup.position.set(-11.0, 0, 7.0);
    scene.add(playerGroup);

    // ==========================================
    // 3D 당직 교사 AI 2명 & 시야각 (Vision Cone)
    // ==========================================
    const teachers: TeacherBot[] = [];
    const teacherData = [
      {
        id: 1,
        name: '복도 당직 주임',
        x: -5.0,
        z: 0,
        waypoints: [
          { x: -6.0, z: 0 },
          { x: 6.0, z: 0 },
        ],
      },
      {
        id: 2,
        name: '교무실 감시 교사',
        x: 6.0,
        z: -5.0,
        waypoints: [
          { x: 8.0, z: -5.0 },
          { x: -8.0, z: -5.0 },
        ],
      },
    ];

    teacherData.forEach((td) => {
      const tGroup = new THREE.Group();

      // 교사 몸통 (검은 정장)
      const tBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const tBody = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.05, 0.45), tBodyMat);
      tBody.position.y = 1.0;
      tBody.castShadow = true;
      tGroup.add(tBody);

      // 교사 머리 & 안경
      const tHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
      tHead.position.y = 1.8;
      tGroup.add(tHead);

      // 3D 시야각 (Vision Cone: 반경 6.5m, 각도 65도 반투명 원뿔)
      const coneGeo = new THREE.ConeGeometry(3.5, 6.5, 16, 1, true);
      coneGeo.rotateX(Math.PI / 2); // 전방을 비춤
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(0, 0.6, 3.25);
      tGroup.add(cone);

      tGroup.position.set(td.x, 0, td.z);
      scene.add(tGroup);

      teachers.push({
        id: td.id,
        name: td.name,
        group: tGroup,
        coneMesh: cone,
        coneMat,
        waypoints: td.waypoints,
        wpIdx: 0,
        x: td.x,
        z: td.z,
        angle: 0,
        speed: 2.2,
        isChasing: false,
        chaseTimer: 0,
      });
    });

    // ==========================================
    // 3D 황금 교문 열쇠 3개 생성
    // ==========================================
    const keys: GoldenKey[] = [];
    const keyCoords = [
      { id: 1, x: -11.0, z: -6.0 }, // 교실 A 안쪽
      { x: 11.0, z: 6.0, id: 2 }, // 교실 B 구석
      { x: 9.0, z: -7.0, id: 3 }, // 교무실 책상 옆
    ];

    const keyMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });

    keyCoords.forEach((kc) => {
      const kGroup = new THREE.Group();
      // 열쇠 링
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), keyMat);
      kGroup.add(ring);
      // 열쇠 몸체
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), keyMat);
      rod.position.y = -0.4;
      kGroup.add(rod);

      kGroup.position.set(kc.x, 0.6, kc.z);
      scene.add(kGroup);

      keys.push({
        id: kc.id,
        x: kc.x,
        z: kc.z,
        mesh: kGroup,
        collected: false,
      });
    });

    // 레퍼런스 등록
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.playerGroup = playerGroup;
    g.teachers = teachers;
    g.keys = keys;
    g.gateMesh = gateGroup;
    g.particles = [];
    g.playerX = -11.0;
    g.playerZ = 7.0;
    g.playerAngle = 0;
    g.inputX = 0;
    g.inputZ = 0;
    g.keysCollected = 0;
    g.score = 0;
    g.gateUnlocked = false;
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

      if (!g.isEnded && isPlaying) {
        // ------------------------------------
        // 플레이어 이동
        // ------------------------------------
        const baseSpeed = g.isSneaking ? 3.0 : g.isSprinting ? 8.2 : 5.2;
        const moveLen = Math.hypot(g.inputX, g.inputZ);

        if (moveLen > 0.1) {
          g.playerX += (g.inputX / moveLen) * baseSpeed * dt;
          g.playerZ += (g.inputZ / moveLen) * baseSpeed * dt;
          g.playerAngle = Math.atan2(g.inputX, g.inputZ);
        }

        // 벽면 충돌 클램프
        g.playerX = Math.max(-15.0, Math.min(15.0, g.playerX));
        g.playerZ = Math.max(-10.0, Math.min(10.0, g.playerZ));

        if (g.playerGroup) {
          g.playerGroup.position.set(g.playerX, 0, g.playerZ);
          g.playerGroup.rotation.y = g.playerAngle;
          g.playerGroup.scale.set(1, g.isSneaking ? 0.65 : 1, 1);
        }

        // ------------------------------------
        // 열쇠 획득 판정
        // ------------------------------------
        for (const k of g.keys) {
          if (k.collected) continue;
          k.mesh.rotation.y += dt * 3;

          const dist = Math.hypot(g.playerX - k.x, g.playerZ - k.z);
          if (dist < 1.3) {
            k.collected = true;
            scene.remove(k.mesh);
            g.keysCollected++;
            setKeysCount(g.keysCollected);
            g.score += 300;
            setScore(g.score);

            triggerHaptic([30, 40]);
            playSfx?.('coin');

            // 3개 모두 획득 시 교문 개방!
            if (g.keysCollected >= 3) {
              g.gateUnlocked = true;
              if (g.gateMesh) {
                // 문 열림 애니메이션
                g.gateMesh.children[2].scale.set(0.1, 1, 1);
              }
              triggerHaptic([50, 100, 50]);
              playSfx?.('victory');
            }
          }
        }

        // ------------------------------------
        // 교문 탈출 완료 검사
        // ------------------------------------
        if (g.gateUnlocked && Math.abs(g.playerX) < 2.0 && g.playerZ <= -9.5) {
          finishGameRef.current(true, g.score + 600);
          return;
        }

        // ------------------------------------
        // 교사 AI 순찰 & 발각 추격 로직
        // ------------------------------------
        let anyChasing = false;

        for (const teacher of g.teachers) {
          const dx = g.playerX - teacher.x;
          const dz = g.playerZ - teacher.z;
          const distToPlayer = Math.hypot(dx, dz);

          // 시야각 내 플레이어 감지 검사
          const angleToPlayer = Math.atan2(dx, dz);
          let angleDiff = angleToPlayer - teacher.angle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

          const viewDist = g.isSneaking ? 3.5 : 6.8;
          const inFov = Math.abs(angleDiff) < 0.65 && distToPlayer < viewDist;

          if (inFov) {
            // 발각! 추격 모드 전환
            teacher.isChasing = true;
            teacher.chaseTimer = 3.5;
            teacher.coneMat.color.setHex(0xef4444); // 붉은색 시야
            triggerHaptic(20);
          }

          if (teacher.isChasing) {
            anyChasing = true;
            teacher.chaseTimer -= dt;

            // 플레이어를 향해 맹추격
            teacher.angle = angleToPlayer;
            teacher.x += Math.sin(teacher.angle) * 3.8 * dt;
            teacher.z += Math.cos(teacher.angle) * 3.8 * dt;

            // 학생 체포 검사
            if (distToPlayer < 1.1) {
              // 체포 실패!
              triggerHaptic([150, 100]);
              playSfx?.('defeat');
              finishGameRef.current(false, g.score);
              return;
            }

            if (teacher.chaseTimer <= 0) {
              teacher.isChasing = false;
              teacher.coneMat.color.setHex(0xfacc15); // 노란색 복귀
            }
          } else {
            // 평상시 순찰 (웨이포인트 이동)
            const wp = teacher.waypoints[teacher.wpIdx];
            const wdx = wp.x - teacher.x;
            const wdz = wp.z - teacher.z;
            const wdist = Math.hypot(wdx, wdz);

            if (wdist < 0.4) {
              teacher.wpIdx = (teacher.wpIdx + 1) % teacher.waypoints.length;
            } else {
              teacher.angle = Math.atan2(wdx, wdz);
              teacher.x += Math.sin(teacher.angle) * teacher.speed * dt;
              teacher.z += Math.cos(teacher.angle) * teacher.speed * dt;
            }
          }

          teacher.group.position.set(teacher.x, 0, teacher.z);
          teacher.group.rotation.y = teacher.angle;
        }

        setAlertStatus(anyChasing ? 'CHASE' : 'SAFE');
      }

      // 카메라 부드러운 탑다운 추종
      if (g.camera && g.playerGroup) {
        const targetCamX = g.playerX;
        const targetCamZ = g.playerZ + 9.5;
        const targetCamY = 14.5;
        g.camera.position.x = THREE.MathUtils.lerp(g.camera.position.x, targetCamX, 0.1);
        g.camera.position.z = THREE.MathUtils.lerp(g.camera.position.z, targetCamZ, 0.1);
        g.camera.position.y = targetCamY;
        g.camera.lookAt(g.playerX, 0.8, g.playerZ);
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

  // 플로팅 가상 조이스틱 터치 핸들러
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

  // 키보드 조작 (PC 백업)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') g.inputZ = -1;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') g.inputZ = 1;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') g.inputX = -1;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') g.inputX = 1;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsSprinting(true);
        g.isSprinting = true;
      }
      if (e.code === 'KeyC') {
        setIsSneaking(true);
        g.isSneaking = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if ((e.code === 'KeyW' || e.code === 'ArrowUp') && g.inputZ < 0) g.inputZ = 0;
      if ((e.code === 'KeyS' || e.code === 'ArrowDown') && g.inputZ > 0) g.inputZ = 0;
      if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && g.inputX < 0) g.inputX = 0;
      if ((e.code === 'KeyD' || e.code === 'ArrowRight') && g.inputX > 0) g.inputX = 0;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsSprinting(false);
        g.isSprinting = false;
      }
      if (e.code === 'KeyC') {
        setIsSneaking(false);
        g.isSneaking = false;
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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5] text-white font-mono"
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
        gameTitle="Escape School 3D"
        score={score}
        onQuit={() => finishGameRef.current(false, score)}
      />

      {/* 상단 탈출 진행 & 경보 오버레이 */}
      <div className="absolute top-14 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* 열쇠 수집 */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-sm border border-yellow-500/50 text-xs font-bold text-yellow-300">
            🔑 교문 열쇠: <strong className="text-white text-sm">{keysCount}</strong> / 3
          </div>
          <div className="px-2 py-0.5 bg-black/60 rounded-sm text-[10px] text-zinc-300">
            {keysCount >= 3 ? '🚪 교문 개방! 상단 정문으로 탈출하세요!' : '교실과 복도에서 열쇠를 찾으세요.'}
          </div>
        </div>

        {/* 경보 상태 뱃지 */}
        <div
          className={`px-3 py-1.5 rounded-sm backdrop-blur-md border text-center shadow-lg font-black text-xs ${
            alertStatus === 'CHASE'
              ? 'bg-red-950/80 border-red-500 text-red-200 animate-ping'
              : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
          }`}
        >
          {alertStatus === 'CHASE' ? '🚨 발각! 추격 중!' : '🟢 안전 상태'}
        </div>
      </div>

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
          <div className="w-full h-full rounded-full border-2 border-indigo-400/60 bg-indigo-950/40 backdrop-blur-sm flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-indigo-400 border border-white shadow-lg"
              style={{
                transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 모바일 퓨어 터치 버튼: 우측 은신(SNEAK) & 질주(SPRINT) */}
      <div className="absolute bottom-8 right-6 flex items-end gap-3 z-20">
        <button
          type="button"
          onPointerDown={() => {
            setIsSneaking(true);
            gameRef.current.isSneaking = true;
            triggerHaptic(15);
          }}
          onPointerUp={() => {
            setIsSneaking(false);
            gameRef.current.isSneaking = false;
          }}
          onPointerLeave={() => {
            setIsSneaking(false);
            gameRef.current.isSneaking = false;
          }}
          className={`w-16 h-16 rounded-full border flex flex-col items-center justify-center font-black active:scale-95 shadow-xl ${
            isSneaking
              ? 'bg-amber-500 border-yellow-200 text-black scale-105'
              : 'bg-zinc-800/80 backdrop-blur-md border-amber-500/50 text-amber-300'
          }`}
        >
          <span className="text-xl">🤫</span>
          <span className="text-[9px] mt-0.5">SNEAK</span>
        </button>

        <button
          type="button"
          onPointerDown={() => {
            setIsSprinting(true);
            gameRef.current.isSprinting = true;
            triggerHaptic(20);
          }}
          onPointerUp={() => {
            setIsSprinting(false);
            gameRef.current.isSprinting = false;
          }}
          onPointerLeave={() => {
            setIsSprinting(false);
            gameRef.current.isSprinting = false;
          }}
          className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center font-black transition-transform active:scale-90 shadow-2xl ${
            isSprinting
              ? 'bg-blue-500 border-yellow-300 scale-105 ring-4 ring-blue-400/50 text-white'
              : 'bg-gradient-to-tr from-indigo-600 to-blue-500 border-blue-300 text-white'
          }`}
        >
          <span className="text-2xl leading-none">⚡</span>
          <span className="text-xs font-black tracking-tight mt-1">SPRINT</span>
        </button>
      </div>

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Escape From School 3D"
        description="당직 선생님들의 감시망을 피해 3개의 교문 열쇠를 획득하고 탈출하세요!"
        features={[
          {
            iconType: 'GOAL',
            title: '황금 열쇠 3개 & 교문 탈출',
            desc: '교실과 복도에 숨겨진 3개의 열쇠를 모아 상단 정문으로 무사히 빠져나가세요.',
          },
          {
            iconType: 'GESTURES',
            title: '조이스틱 & 은신/질주',
            desc: '좌측 플로팅 조이스틱으로 잠입하고, 우측 [SNEAK]으로 시야를 피하거나 [SPRINT]로 질주하세요.',
          },
          {
            iconType: 'REWARDS',
            title: 'SNS 보상 정산',
            desc: '학교 탈출 성공 시 최대 50 SNS 포인트 및 랭킹 점수가 지급됩니다.',
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

export default PokiEscapeSchoolGame;
