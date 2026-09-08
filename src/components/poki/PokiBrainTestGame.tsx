import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTestGameProps {
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

export const PokiBrainTestGame: React.FC<PokiBrainTestGameProps> = ({
  onBack,
  onExit,
  cardId = 32,
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
  const [stage, setStage] = useState(1);
  const [question, setQuestion] = useState('Q1. 화면에서 가장 거대한 과일을 탭하세요!');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'fail'>('success');
  const [score, setScore] = useState(0);
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Stage 4 금고 다이얼 상태 (목표: 7 - 3 - 9)
  const [dialValues, setDialValues] = useState<number[]>([1, 1, 1]);

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
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),

    // 드래그 상태 관리
    isDragging: false,
    dragObject: null as THREE.Object3D | null,
    dragPlane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    planeIntersect: new THREE.Vector3(),
    dragOffset: new THREE.Vector3(),

    // 스테이지별 동적 오브젝트
    stageGroup: null as THREE.Group | null,
    particles: [] as Particle[],
    currentStage: 1,

    // Stage 1 변수
    cloudMoved: false,

    // Stage 2 변수
    bridgePlaced: false,
    catMoving: false,
    catProgress: 0,
    catMesh: null as THREE.Group | null,

    // Stage 3 변수
    lightSwitchRevealed: false,
    roomLightOn: false,
    ambientLight: null as THREE.AmbientLight | null,
    spotLight: null as THREE.SpotLight | null,

    // Stage 4 변수
    mirrorPlaced: false,
    vaultDoor: null as THREE.Mesh | null,
    vaultOpened: false,

    score: 0,
    isEnded: false,
  });

  // 축하 콘페티 파티클 분출
  const spawnConfetti = useCallback((originX = 0, originY = 2, originZ = 0) => {
    const g = gameRef.current;
    if (!g.scene) return;
    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899, 0x8b5cf6];
    for (let i = 0; i < 40; i++) {
      const pGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const pMat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(originX, originY, originZ);
      g.scene.add(pMesh);
      g.particles.push({
        mesh: pMesh,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * 10 + 3,
        vz: (Math.random() - 0.5) * 8,
        life: 0,
        maxLife: 0.7,
      });
    }
  }, []);

  // 게임 종료 및 정산
  const finishGame = useCallback((won: boolean, finalScore: number) => {
    const g = gameRef.current;
    if (g.isEnded) return;
    g.isEnded = true;
    setIsPlaying(false);
    setGameOver(!won);
    setIsVictory(won);

    const deposit = calculateAndDepositMissionReward({
      gameId: 'poki_brain_test',
      gameTitle: 'Brain Test 3D',
      durationSeconds: 30,
      score: finalScore,
      maxTargetScore: 1000,
      isVictory: won,
    });
    setRewardResult(deposit);
    triggerHaptic(won ? [50, 100, 150] : [150, 80]);
    if (won) playSfx?.('victory');
    else playSfx?.('defeat');
  }, [triggerHaptic, playSfx]);

  // 스테이지 빌더 함수
  const buildStage = useCallback((stageNum: number) => {
    const g = gameRef.current;
    if (!g.scene) return;

    // 이전 스테이지 오브젝트 청소
    if (g.stageGroup) {
      g.scene.remove(g.stageGroup);
    }
    const group = new THREE.Group();
    g.stageGroup = group;
    g.scene.add(group);
    g.currentStage = stageNum;

    // 테이블 베이스 (포근한 원목 책상)
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x5b3a29, roughness: 0.6 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 8), tableMat);
    table.position.set(0, -0.6, 0);
    table.receiveShadow = true;
    group.add(table);

    // ==========================================
    // STAGE 1: 가장 거대한 과일 찾기 (구름 뒤 숨겨진 황금 수박)
    // ==========================================
    if (stageNum === 1) {
      setQuestion('Q1. 화면에서 가장 거대한 과일을 탭하세요!');

      // 작은 과일들 (사과, 딸기, 오렌지)
      const appleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      const apple = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), appleMat);
      apple.position.set(-3.5, 0.5, 0);
      apple.name = 'small_apple';
      group.add(apple);

      const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
      const orange = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), orangeMat);
      orange.position.set(3.5, 0.6, 0);
      orange.name = 'small_orange';
      group.add(orange);

      // 숨겨진 거대 황금 수박 (구름 뒤)
      const melonMat = new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        roughness: 0.4,
        emissive: 0x15803d,
        emissiveIntensity: 0.2,
      });
      const giantMelon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 20), melonMat);
      giantMelon.position.set(0, 1.6, -0.8);
      giantMelon.name = 'giant_watermelon';
      group.add(giantMelon);

      // 드래그 가능한 뭉게구름 2개
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95,
      });
      const cloudGroup = new THREE.Group();
      cloudGroup.name = 'draggable_cloud';

      for (let i = 0; i < 4; i++) {
        const cSphere = new THREE.Mesh(new THREE.SphereGeometry(1.0 + Math.random() * 0.4, 16, 16), cloudMat);
        cSphere.position.set((i - 1.5) * 0.9, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.4);
        cloudGroup.add(cSphere);
      }
      cloudGroup.position.set(0, 1.8, 0.4); // 수박을 완전히 가림
      group.add(cloudGroup);
    }

    // ==========================================
    // STAGE 2: 고양이의 다리 건너기 (나무 판자 드래그 연결)
    // ==========================================
    else if (stageNum === 2) {
      setQuestion('Q2. 배고픈 아기 고양이가 생선을 먹을 수 있게 도와주세요!');
      g.bridgePlaced = false;
      g.catMoving = false;
      g.catProgress = 0;

      // 좌측 절벽 단상 (고양이 위치)
      const cliffMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
      const cliffL = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 3), cliffMat);
      cliffL.position.set(-5, 0.65, 0);
      group.add(cliffL);

      // 우측 절벽 단상 (생선 위치)
      const cliffR = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 3), cliffMat);
      cliffR.position.set(5, 0.65, 0);
      group.add(cliffR);

      // 3D 아기 고양이 (좌측 단상 위)
      const catGroup = new THREE.Group();
      const catMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
      const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.1), catMat);
      cBody.position.y = 0.35;
      catGroup.add(cBody);

      const cHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), catMat);
      cHead.position.set(0, 0.8, 0.5);
      catGroup.add(cHead);

      // 귀 2개
      const earMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 4), earMat);
      earL.position.set(-0.25, 1.25, 0.5);
      catGroup.add(earL);

      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 4), earMat);
      earR.position.set(0.25, 1.25, 0.5);
      catGroup.add(earR);

      catGroup.position.set(-5, 1.9, 0);
      group.add(catGroup);
      g.catMesh = catGroup;

      // 3D 생선 (우측 단상 위)
      const fishMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4 });
      const fish = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.3, 6), fishMat);
      fish.rotation.z = Math.PI / 2;
      fish.position.set(5, 2.1, 0);
      group.add(fish);

      // 드래그 가능한 3D 통나무 판자 (아래 테이블 위에 놓여있음)
      const plankMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
      const plank = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.25, 1.6), plankMat);
      plank.position.set(0, 0.15, 1.5);
      plank.name = 'draggable_bridge';
      group.add(plank);
    }

    // ==========================================
    // STAGE 3: 어두운 방의 숨은 스위치 (손전등으로 비추기)
    // ==========================================
    else if (stageNum === 3) {
      setQuestion('Q3. 방이 너무 어둡습니다. 숨겨진 스위치를 찾아 불을 켜세요!');
      g.lightSwitchRevealed = false;
      g.roomLightOn = false;

      // 어두운 분위기 연출
      if (g.ambientLight) g.ambientLight.intensity = 0.12;

      // 천장 백열 전구
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        emissiveIntensity: 0,
      });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), bulbMat);
      bulb.position.set(0, 4.2, 0);
      bulb.name = 'ceiling_bulb';
      group.add(bulb);

      // 드래그 가능한 3D 손전등
      const torchGroup = new THREE.Group();
      torchGroup.name = 'draggable_flashlight';
      const torchBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.35, 1.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      torchBody.rotation.x = Math.PI / 2;
      torchGroup.add(torchBody);

      // 손전등 광선 원뿔 (Spotlight Cone 메쉬)
      const beamGeo = new THREE.ConeGeometry(1.6, 4.5, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.x = -Math.PI / 2;
      beam.position.set(0, 0, -2.4);
      torchGroup.add(beam);

      torchGroup.position.set(-2, 0.6, 1.0);
      group.add(torchGroup);

      // 숨겨진 빨간색 토글 레버 스위치 (우측 상단 벽면 X: 4.8, Y: 3.2)
      const switchGroup = new THREE.Group();
      switchGroup.name = 'hidden_switch';
      const swBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.2, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      switchGroup.add(swBox);

      const lever = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0xef4444 })
      );
      lever.position.set(0, 0.2, 0.2);
      lever.rotation.x = 0.5;
      lever.name = 'switch_lever';
      switchGroup.add(lever);

      switchGroup.position.set(4.8, 3.2, -1.0);
      switchGroup.visible = false; // 손전등으로 비추기 전에는 안 보임
      group.add(switchGroup);
    }

    // ==========================================
    // STAGE 4: 황금 금고와 거울 암호 (암호 7 - 3 - 9)
    // ==========================================
    else if (stageNum === 4) {
      setQuestion('Q4. 금고 뒤편을 거울로 확인하여 비밀번호를 맞추세요!');
      if (g.ambientLight) g.ambientLight.intensity = 0.85;
      g.mirrorPlaced = false;
      g.vaultOpened = false;

      // 중앙 황금 금고 본체
      const vaultGroup = new THREE.Group();
      const vBody = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 3.4, 3.0),
        new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.2 })
      );
      vBody.position.y = 1.7;
      vaultGroup.add(vBody);

      // 금고 문
      const vDoor = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 3.0, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.15 })
      );
      vDoor.position.set(0, 1.7, 1.55);
      vaultGroup.add(vDoor);
      g.vaultDoor = vDoor;

      // 금고 뒷면 암호 텍스처 (캔버스)
      const passCanvas = document.createElement('canvas');
      passCanvas.width = 256;
      passCanvas.height = 128;
      const pCtx = passCanvas.getContext('2d');
      if (pCtx) {
        pCtx.fillStyle = '#0f172a';
        pCtx.fillRect(0, 0, 256, 128);
        pCtx.fillStyle = '#facc15';
        pCtx.font = 'bold 48px monospace';
        pCtx.textAlign = 'center';
        pCtx.fillText('PASS: 7-3-9', 128, 75);
      }
      const passTex = new THREE.CanvasTexture(passCanvas);
      const passPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.2),
        new THREE.MeshBasicMaterial({ map: passTex, side: THREE.DoubleSide })
      );
      passPlane.position.set(0, 1.7, -1.55);
      passPlane.rotation.y = Math.PI;
      vaultGroup.add(passPlane);

      vaultGroup.position.set(0, 0, 0);
      group.add(vaultGroup);

      // 드래그 가능한 3D 손거울
      const mirrorGroup = new THREE.Group();
      mirrorGroup.name = 'draggable_mirror';
      const mFrame = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.0, 0.15, 20),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
      );
      mFrame.rotation.x = Math.PI / 2;
      mirrorGroup.add(mFrame);

      const mGlass = new THREE.Mesh(
        new THREE.CircleGeometry(0.85, 20),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      mGlass.position.z = 0.08;
      mirrorGroup.add(mGlass);

      const mHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      mHandle.position.y = -1.5;
      mirrorGroup.add(mHandle);

      mirrorGroup.position.set(-4.0, 1.5, 1.0);
      group.add(mirrorGroup);
    }
  }, []);

  // 스테이지 클리어 처리
  const advanceStage = useCallback(() => {
    const nextStg = stage + 1;
    triggerHaptic([30, 50, 40]);
    playSfx?.('victory');
    setFeedback('정답입니다! 💡');
    setFeedbackType('success');
    spawnConfetti();

    setScore((prev) => prev + 250);

    setTimeout(() => {
      setFeedback(null);
      setHintMessage(null);
      if (nextStg <= 4) {
        setStage(nextStg);
        buildStage(nextStg);
      } else {
        // 최종 올클리어
        finishGame(true, score + 500);
      }
    }, 1500);
  }, [stage, triggerHaptic, playSfx, spawnConfetti, buildStage, finishGame, score]);

  // Stage 4 다이얼 변경 및 정답 검증
  const handleDialClick = (idx: number) => {
    if (stage !== 4 || gameRef.current.vaultOpened) return;
    triggerHaptic(15);
    playSfx?.('coin');

    setDialValues((prev) => {
      const next = [...prev];
      next[idx] = (next[idx] + 1) % 10;

      // 7 - 3 - 9 정답 체크
      if (next[0] === 7 && next[1] === 3 && next[2] === 9) {
        gameRef.current.vaultOpened = true;
        if (gameRef.current.vaultDoor) {
          gameRef.current.vaultDoor.rotation.y = -Math.PI / 2; // 금고 문 오픈!
        }
        advanceStage();
      }
      return next;
    });
  };

  // 힌트 보기 핸들러
  const handleShowHint = () => {
    triggerHaptic(20);
    playSfx?.('pop');
    if (stage === 1) setHintMessage('💡 구름을 손가락으로 드래그해서 옆으로 치워보세요!');
    if (stage === 2) setHintMessage('💡 바닥의 나무 판자를 드래그해 절벽 틈새에 다리로 놓아주세요!');
    if (stage === 3) setHintMessage('💡 손전등을 드래그해 오른쪽 벽면 위쪽을 비춰보세요!');
    if (stage === 4) setHintMessage('💡 손거울을 금고 뒤편으로 가져가면 암호가 비칩니다!');
  };

  // Three.js 초기화 및 메인 루프
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5);

    // Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 9.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // 화면 우측 상단 탐정 모자 카드 No.032 공식 영웅 스프라이트 HUD 배지
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
    badgeSprite.position.set(4.2, 3.8, 0);
    badgeSprite.scale.set(1.1, 1.1, 1);
    scene.add(badgeSprite);

    // 레퍼런스 저장
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.ambientLight = ambientLight;
    g.particles = [];
    g.isEnded = false;

    // 첫 스테이지 빌드
    buildStage(1);

    // 애니메이션 루프
    let lastTime = performance.now();
    const animate = (now: number) => {
      g.animFrameId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      // Stage 2: 고양이 다리 건너기 애니메이션
      if (g.catMoving && g.catMesh) {
        g.catProgress = Math.min(1.0, g.catProgress + dt * 0.8);
        // -5에서 +5까지 X축 전진
        g.catMesh.position.x = -5 + g.catProgress * 10;
        g.catMesh.position.y = 1.9 + Math.sin(g.catProgress * Math.PI * 6) * 0.12;

        if (g.catProgress >= 1.0) {
          g.catMoving = false;
          advanceStage();
        }
      }

      // 파티클 시뮬레이션
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 16 * dt;

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          g.particles.splice(i, 1);
        }
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
  }, [lowSpecMode, cardId, buildStage, advanceStage]);

  // 터치 및 마우스 포인터 인터랙션 (드래그 & 탭 픽킹)
  const handlePointerDown = (e: React.PointerEvent) => {
    const g = gameRef.current;
    if (!g.camera || !g.scene || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    g.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    g.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    g.raycaster.setFromCamera(g.mouse, g.camera);
    const intersects = g.raycaster.intersectObjects(g.scene.children, true);

    if (intersects.length > 0) {
      let hit = intersects[0].object;

      // 상위 부모 탐색
      let curr: THREE.Object3D | null = hit;
      while (curr && curr !== g.scene) {
        // 1. 드래그 가능한 물체 (구름, 다리, 손전등, 거울)
        if (
          curr.name === 'draggable_cloud' ||
          curr.name === 'draggable_bridge' ||
          curr.name === 'draggable_flashlight' ||
          curr.name === 'draggable_mirror'
        ) {
          g.isDragging = true;
          g.dragObject = curr;
          g.dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), curr.position);
          if (g.raycaster.ray.intersectPlane(g.dragPlane, g.planeIntersect)) {
            g.dragOffset.copy(curr.position).sub(g.planeIntersect);
          }
          triggerHaptic(15);
          return;
        }

        // 2. Stage 1: 과일 탭 판정
        if (curr.name === 'giant_watermelon') {
          advanceStage();
          return;
        }
        if (curr.name === 'small_apple' || curr.name === 'small_orange') {
          triggerHaptic(20);
          playSfx?.('hit');
          setFeedback('이 과일은 너무 작습니다! 더 큰 과일을 찾아보세요.');
          setFeedbackType('fail');
          setTimeout(() => setFeedback(null), 1200);
          return;
        }

        // 3. Stage 3: 스위치 탭 판정
        if (curr.name === 'hidden_switch' || curr.name === 'switch_lever') {
          if (g.ambientLight) {
            g.ambientLight.intensity = 1.2; // 방 환하게 켜짐!
          }
          triggerHaptic([30, 40]);
          advanceStage();
          return;
        }

        curr = curr.parent;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const g = gameRef.current;
    if (!g.isDragging || !g.dragObject || !g.camera || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    g.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    g.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    g.raycaster.setFromCamera(g.mouse, g.camera);
    if (g.raycaster.ray.intersectPlane(g.dragPlane, g.planeIntersect)) {
      const targetPos = g.planeIntersect.clone().add(g.dragOffset);
      g.dragObject.position.x = targetPos.x;
      g.dragObject.position.y = targetPos.y;

      // Stage 2: 다리 판자 틈새 스냅 검사
      if (g.dragObject.name === 'draggable_bridge') {
        if (Math.abs(targetPos.x) < 1.5 && Math.abs(targetPos.y - 1.8) < 1.2) {
          // 착 스냅!
          g.dragObject.position.set(0, 1.85, 0);
          g.isDragging = false;
          g.bridgePlaced = true;
          g.catMoving = true; // 고양이 전진 시작!
          triggerHaptic([30, 30]);
          playSfx?.('pop');
        }
      }

      // Stage 3: 손전등으로 오른쪽 벽면 비춤 검사
      if (g.dragObject.name === 'draggable_flashlight') {
        if (targetPos.x > 2.2 && targetPos.y > 1.8) {
          const sw = g.scene?.getObjectByName('hidden_switch');
          if (sw) {
            sw.visible = true; // 숨은 스위치 발견!
            triggerHaptic(20);
          }
        }
      }

      // Stage 4: 손거울을 금고 뒤로 이동 검사
      if (g.dragObject.name === 'draggable_mirror') {
        if (targetPos.x > 1.8 && targetPos.y > 1.2) {
          setHintMessage('💡 거울에 비친 암호: [ 7 - 3 - 9 ]를 아래 다이얼에 입력하세요!');
          triggerHaptic(20);
        }
      }
    }
  };

  const handlePointerUp = () => {
    const g = gameRef.current;
    g.isDragging = false;
    g.dragObject = null;
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5] text-white font-mono"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Three.js 3D 뷰포트 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미니멀 HUD 헤더 */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="Brain Test 3D"
        score={score}
        onQuit={() => finishGame(false, score)}
      />

      {/* 상단 퀴즈 질문 배너 */}
      <div className="absolute top-14 left-4 right-4 pointer-events-none z-10 flex flex-col items-center gap-1.5">
        <div className="px-4 py-2 bg-black/80 backdrop-blur-md rounded-sm border-2 border-amber-400 text-center shadow-xl">
          <div className="text-xs font-bold text-amber-300 tracking-wider">STAGE {stage} / 4</div>
          <div className="text-sm font-black text-white mt-0.5">{question}</div>
        </div>

        {/* 힌트 메시지 */}
        {hintMessage && (
          <div className="px-3 py-1.5 bg-sky-950/80 backdrop-blur-md border border-sky-400/50 rounded-sm text-xs text-sky-200 animate-fade-in text-center">
            {hintMessage}
          </div>
        )}

        {/* 피드백 알림 (정답/오답) */}
        {feedback && (
          <div
            className={`px-4 py-1.5 rounded-sm text-xs font-black shadow-lg animate-bounce text-center ${
              feedbackType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {feedback}
          </div>
        )}
      </div>

      {/* Stage 4 전용: 금고 3자리 다이얼 컨트롤러 */}
      {stage === 4 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 bg-black/80 p-3 rounded-lg border border-amber-400/60 backdrop-blur-md">
          {dialValues.map((val, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleDialClick(idx)}
              className="w-14 h-16 rounded-sm bg-gradient-to-b from-amber-600 to-amber-800 border-2 border-amber-300 text-white flex flex-col items-center justify-center font-black active:scale-95 shadow-lg"
            >
              <span className="text-[10px] text-amber-200">TAP</span>
              <span className="text-2xl font-mono">{val}</span>
            </button>
          ))}
        </div>
      )}

      {/* 하단 편의 버튼: [💡 힌트] & [🔄 다시하기] */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-auto">
        <button
          type="button"
          onClick={handleShowHint}
          className="px-4 py-2.5 rounded-sm bg-black/75 backdrop-blur-md border border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-md"
        >
          <span>💡</span>
          <span>힌트</span>
        </button>

        <button
          type="button"
          onClick={() => buildStage(stage)}
          className="px-4 py-2.5 rounded-sm bg-black/75 backdrop-blur-md border border-zinc-500 text-zinc-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-md"
        >
          <span>🔄</span>
          <span>스테이지 초기화</span>
        </button>
      </div>

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Brain Test: Tricky Puzzles 3D"
        description="상식의 틀을 깨부수세요! 화면의 사물을 터치 드래그하여 숨겨진 트릭을 풀어내세요."
        features={[
          {
            iconType: 'GOAL',
            title: '4대 기상천외 트릭 스테이지',
            desc: '구름 치우기, 다리 놓아주기, 숨은 스위치 찾기, 거울 암호 풀기로 4단계를 모두 정복하세요.',
          },
          {
            iconType: 'GESTURES',
            title: '3D 드래그 & 터치',
            desc: '화면의 구름, 판자, 손전등, 거울을 손가락으로 드래그해 이동시키세요.',
          },
          {
            iconType: 'REWARDS',
            title: 'SNS 보상 정산',
            desc: '모든 퍼즐을 풀고 두뇌 마스터에 등극하면 최대 50 SNS 포인트가 지급됩니다.',
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

export default PokiBrainTestGame;
