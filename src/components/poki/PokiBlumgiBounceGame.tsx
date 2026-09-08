import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiBounceGameProps {
  onBack: () => void;

  onExit?: () => void;
  onClose?: () => void;
}

const TARGET_GOALS = 5;

interface ConfettiParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: THREE.Vector3;
  life: number;
  maxLife: number;
}

export const PokiBlumgiBounceGame: React.FC<PokiBlumgiBounceGameProps> = ({
  onBack,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [goalsScored, setGoalsScored] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [aimPower, setAimPower] = useState(0);
  const [isAiming, setIsAiming] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);

  // Three.js 오브젝트 레퍼런스
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const charBodyRef = useRef<THREE.Mesh | null>(null);
  const hoopGroupRef = useRef<THREE.Group | null>(null);
  const netMeshRef = useRef<THREE.Mesh | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const bouncePadRef = useRef<THREE.Group | null>(null);
  const confettiListRef = useRef<ConfettiParticle[]>([]);

  // 물리 시뮬레이션 상태
  const physicsState = useRef({
    pos: new THREE.Vector3(-6, -1.5, 0),
    vel: new THREE.Vector3(0, 0, 0),
    inAir: false,
    groundY: -2.2,
    radius: 0.65,
    bounceRestitution: 0.78,
    squashTimer: 0,
    hoopPos: new THREE.Vector3(6, 2.0, 0),
    hoopRadius: 0.85,
    lastY: -1.5,
    scoredThisShot: false,
    shotCount: 0,
  });

  // 터치 드래그 조준 상태
  const dragTouch = useRef<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    active: boolean;
  }>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    active: false,
  });

  // 진동 헬퍼
  const triggerHaptic = (duration = 40) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  // 피드백 토스트 표시
  const showFeedback = (text: string) => {
    setFeedbackText(text);
    setTimeout(() => {
      setFeedbackText((prev) => (prev === text ? '' : prev));
    }, 1800);
  };

  // 캐릭터 위치 초기화
  const resetCharacterPos = useCallback((newHoop = false) => {
    const phys = physicsState.current;
    phys.pos.set(-6, -1.5, 0);
    phys.vel.set(0, 0, 0);
    phys.inAir = false;
    phys.squashTimer = 0;
    phys.scoredThisShot = false;

    if (characterGroupRef.current) {
      characterGroupRef.current.position.copy(phys.pos);
      characterGroupRef.current.rotation.set(0, 0, 0);
      characterGroupRef.current.scale.set(1, 1, 1);
    }

    if (newHoop) {
      // 림 위치 다양화
      const targetY = 0.8 + Math.random() * 2.4;
      const targetX = 4.5 + Math.random() * 2.5;
      phys.hoopPos.set(targetX, targetY, 0);
      if (hoopGroupRef.current) {
        hoopGroupRef.current.position.set(targetX, targetY, 0);
      }

      // 바운스 패드 위치 조정
      if (bouncePadRef.current) {
        bouncePadRef.current.position.set(
          -1.0 + (Math.random() - 0.5) * 2.5,
          -0.5 + Math.random() * 1.5,
          0
        );
      }
    }
  }, []);

  // 발사 (슛) 실행
  const shootBall = useCallback((forceVx?: number, forceVy?: number) => {
    const phys = physicsState.current;
    if (phys.inAir || gameWon) return;

    let vx = forceVx;
    let vy = forceVy;

    if (vx === undefined || vy === undefined) {
      // 드래그 값이 있을 경우
      if (dragTouch.current.active) {
        const dx = dragTouch.current.startX - dragTouch.current.currentX;
        const dy = dragTouch.current.startY - dragTouch.current.currentY;
        const len = Math.hypot(dx, dy);
        const power = Math.min(len / 12, 18);
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * power * 0.9;
        vy = Math.sin(angle) * power * 1.1;
      } else {
        // 기본 슛 (파워 슛)
        vx = 12.5;
        vy = 13.0;
      }
    }

    // 최소 파워 보정
    if (Math.hypot(vx, vy) < 2) {
      vx = 11.5;
      vy = 12.0;
    }

    phys.vel.set(vx, vy, 0);
    phys.inAir = true;
    phys.scoredThisShot = false;
    phys.shotCount += 1;
    triggerHaptic(50);
    setIsAiming(false);
    setAimPower(0);
  }, []);

  // 컨페티 생성
  const spawnConfetti = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const colors = [0xf97316, 0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899, 0x8b5cf6, 0xffffff];
    const geo = new THREE.PlaneGeometry(0.2, 0.2);

    for (let i = 0; i < 45; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 1.2,
        pos.y + (Math.random() - 0.5) * 1.2,
        pos.z + (Math.random() - 0.5) * 1.2
      );

      const p: ConfettiParticle = {
        mesh,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 8 + 3,
        vz: (Math.random() - 0.5) * 8,
        rotSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
        life: 0,
        maxLife: 1.5 + Math.random() * 0.8,
      };

      sceneRef.current.add(mesh);
      confettiListRef.current.push(p);
    }
  };

  // Three.js 초기화
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬 & 카메라
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0f1d);
    scene.fog = new THREE.FogExp2(0x0c0f1d, 0.025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 17);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    dirLight.position.set(5, 12, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0xf97316, 2.5, 25);
    rimLight.position.set(6, 4, 2);
    scene.add(rimLight);

    const courtLight = new THREE.PointLight(0x38bdf8, 2.0, 25);
    courtLight.position.set(-6, 3, 2);
    scene.add(courtLight);

    // ==========================================
    // 1. 아레나 코트 플로어 & 벽면
    // ==========================================
    const floorGeo = new THREE.BoxGeometry(26, 0.6, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b2e,
      roughness: 0.25,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -2.5, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // 코트 라인 마킹 (네온 테두리)
    const courtLineGeo = new THREE.PlaneGeometry(24, 0.08);
    const courtLineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lineMesh = new THREE.Mesh(courtLineGeo, courtLineMat);
    lineMesh.position.set(0, -2.18, 0.1);
    scene.add(lineMesh);

    // 배경 아레나 그리드 벽
    const backWallGeo = new THREE.PlaneGeometry(32, 18);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: 0x111322,
      roughness: 0.8,
      metalness: 0.1,
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 4, -4);
    scene.add(backWall);

    // 관중석 네온 바 라이트
    for (let i = 0; i < 4; i++) {
      const neonBarGeo = new THREE.BoxGeometry(28, 0.12, 0.1);
      const neonBarMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xf97316 : 0x06b6d4 });
      const neonBar = new THREE.Mesh(neonBarGeo, neonBarMat);
      neonBar.position.set(0, 1.5 + i * 2.2, -3.9);
      scene.add(neonBar);
    }

    // ==========================================
    // 2. 3D 농구 골대 & 림 & 백보드
    // ==========================================
    const hoopGroup = new THREE.Group();
    hoopGroup.position.copy(physicsState.current.hoopPos);
    scene.add(hoopGroup);
    hoopGroupRef.current = hoopGroup;

    // 백보드 지지대 기둥
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 9, 16);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(1.4, -1.0, 0);
    hoopGroup.add(pole);

    // 백보드 (아크릴 투명)
    const backboardGeo = new THREE.BoxGeometry(0.15, 2.4, 3.2);
    const backboardMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.7,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
    });
    const backboard = new THREE.Mesh(backboardGeo, backboardMat);
    backboard.position.set(0.9, 0.8, 0);
    hoopGroup.add(backboard);

    // 백보드 스퀘어 레드 테두리
    const squareGeo = new THREE.RingGeometry(0.45, 0.52, 4);
    const squareMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const squareMesh = new THREE.Mesh(squareGeo, squareMat);
    squareMesh.rotation.y = Math.PI / 2;
    squareMesh.rotation.z = Math.PI / 4;
    squareMesh.position.set(0.81, 0.6, 0);
    hoopGroup.add(squareMesh);

    // 백보드 상단 No.103 공식 카드 영웅 배지 전광판
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#1e1b4b';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#f97316';
      bctx.lineWidth = 10;
      bctx.strokeRect(5, 5, 246, 246);
      drawCardSprite(bctx, 103, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTex, side: THREE.DoubleSide });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0.81, 2.2, 0);
    badgeMesh.rotation.y = -Math.PI / 2;
    hoopGroup.add(badgeMesh);

    // 농구 림 (오렌지 Torus)
    const rimGeo = new THREE.TorusGeometry(physicsState.current.hoopRadius, 0.08, 16, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.6,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    hoopGroup.add(rim);

    // 그물망 (Net - 원뿔형 와이어프레임)
    const netGeo = new THREE.CylinderGeometry(0.82, 0.45, 1.2, 16, 6, true);
    const netMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, -0.6, 0);
    hoopGroup.add(net);
    netMeshRef.current = net;

    // ==========================================
    // 3. 동적 바운스 패드 기믹
    // ==========================================
    const padGroup = new THREE.Group();
    padGroup.position.set(-0.5, 0.2, 0);
    scene.add(padGroup);
    bouncePadRef.current = padGroup;

    const padBaseGeo = new THREE.BoxGeometry(2.4, 0.4, 2.0);
    const padBaseMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.5 });
    const padBase = new THREE.Mesh(padBaseGeo, padBaseMat);
    padGroup.add(padBase);

    // 스프링 젤리 패드 윗면 (초탄성 반사)
    const padTopGeo = new THREE.BoxGeometry(2.2, 0.2, 1.8);
    const padTopMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xdb2777,
      emissiveIntensity: 0.7,
      roughness: 0.1,
    });
    const padTop = new THREE.Mesh(padTopGeo, padTopMat);
    padTop.position.set(0, 0.25, 0);
    padGroup.add(padTop);

    // ==========================================
    // 4. 3D 카와이 Blumgi 캐릭터 피규어
    // ==========================================
    const charGroup = new THREE.Group();
    charGroup.position.copy(physicsState.current.pos);
    scene.add(charGroup);
    characterGroupRef.current = charGroup;

    // 몸체 구체 (스무스 젤리 퍼플)
    const charGeo = new THREE.SphereGeometry(physicsState.current.radius, 32, 32);
    const charMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      roughness: 0.2,
      metalness: 0.15,
    });
    const charBody = new THREE.Mesh(charGeo, charMat);
    charBody.castShadow = true;
    charGroup.add(charBody);
    charBodyRef.current = charBody;

    // 귀 2개
    const earGeo = new THREE.ConeGeometry(0.22, 0.5, 16);
    const earMat = new THREE.MeshStandardMaterial({ color: 0x9333ea });
    const earL = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-0.35, 0.55, 0);
    earL.rotation.z = 0.35;
    charGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, earMat);
    earR.position.set(0.35, 0.55, 0);
    earR.rotation.z = -0.35;
    charGroup.add(earR);

    // 귀여운 눈망울 2개
    const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.2, 0.12, 0.55);
    charGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.2, 0.12, 0.55);
    charGroup.add(eyeR);

    // 하이라이트 동공
    const pupilGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(-0.17, 0.16, 0.63);
    charGroup.add(pupilL);

    const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR.position.set(0.23, 0.16, 0.63);
    charGroup.add(pupilR);

    // 가슴 No.103 공식 카드 영웅 배지 데칼
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const hctx = heroBadgeCanvas.getContext('2d');
    if (hctx) {
      drawCardSprite(hctx, 103, 8, 8, 112, 112, { circleClip: true });
    }
    const heroBadgeTex = new THREE.CanvasTexture(heroBadgeCanvas);
    const heroBadgeMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.24, 24),
      new THREE.MeshBasicMaterial({ map: heroBadgeTex, transparent: true })
    );
    heroBadgeMesh.position.set(0, -0.22, 0.6);
    charGroup.add(heroBadgeMesh);

    // ==========================================
    // 5. 3D 탄도 가이드 점선 라인
    // ==========================================
    const pointsCount = 28;
    const linePositions = new Float32Array(pointsCount * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xf97316,
      linewidth: 3,
      transparent: true,
      opacity: 0.8,
    });
    const trajLine = new THREE.Line(lineGeo, lineMat);
    scene.add(trajLine);
    trajectoryLineRef.current = trajLine;

    // 리사이즈 옵저버
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(container);

    // ==========================================
    // 애니메이션 렌더 루프
    // ==========================================
    let lastTime = performance.now();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const phys = physicsState.current;

      // 1. 점선 궤적 업데이트
      if (trajectoryLineRef.current) {
        if (!phys.inAir && isAiming) {
          trajectoryLineRef.current.visible = true;
          const posAttr = trajectoryLineRef.current.geometry.attributes.position as THREE.BufferAttribute;

          const dx = dragTouch.current.startX - dragTouch.current.currentX;
          const dy = dragTouch.current.startY - dragTouch.current.currentY;
          const len = Math.hypot(dx, dy);
          const power = Math.min(len / 12, 18);
          const angle = Math.atan2(dy, dx);
          let simVx = Math.cos(angle) * power * 0.9;
          let simVy = Math.sin(angle) * power * 1.1;

          if (len < 10) {
            simVx = 12.5;
            simVy = 13.0;
          }

          let simX = phys.pos.x;
          let simY = phys.pos.y;
          const gravity = -24;
          const simDt = 0.055;

          for (let i = 0; i < pointsCount; i++) {
            posAttr.setXYZ(i, simX, simY, 0);
            simX += simVx * simDt;
            simY += simVy * simDt;
            simVy += gravity * simDt;
            if (simY < phys.groundY) break;
          }
          posAttr.needsUpdate = true;
        } else {
          trajectoryLineRef.current.visible = false;
        }
      }

      // 2. 캐릭터 물리 업데이트
      if (phys.inAir) {
        phys.lastY = phys.pos.y;
        const gravity = -25;
        phys.vel.y += gravity * dt;
        phys.pos.x += phys.vel.x * dt;
        phys.pos.y += phys.vel.y * dt;

        // 공중 회전
        if (characterGroupRef.current) {
          characterGroupRef.current.rotation.z -= phys.vel.x * 0.4 * dt;
        }

        // A. 바닥 충돌 및 바운스
        if (phys.pos.y <= phys.groundY) {
          phys.pos.y = phys.groundY;
          phys.vel.y = -phys.vel.y * phys.bounceRestitution;
          phys.vel.x *= 0.88;
          phys.squashTimer = 0.22;
          triggerHaptic(25);

          // 거의 멈추면 대기 상태로 전환
          if (Math.abs(phys.vel.y) < 1.2 && Math.abs(phys.vel.x) < 0.8) {
            phys.inAir = false;
            phys.vel.set(0, 0, 0);
            setTimeout(() => {
              if (!phys.inAir && !gameWon) {
                resetCharacterPos(false);
              }
            }, 800);
          }
        }

        // B. 좌우 벽면 충돌 및 튕김
        if (phys.pos.x < -10) {
          phys.pos.x = -10;
          phys.vel.x = -phys.vel.x * 0.85;
          triggerHaptic(20);
        } else if (phys.pos.x > 10) {
          phys.pos.x = 10;
          phys.vel.x = -phys.vel.x * 0.85;
          triggerHaptic(20);
        }

        // C. 바운스 패드 충돌 판정
        if (bouncePadRef.current) {
          const padPos = bouncePadRef.current.position;
          if (
            Math.abs(phys.pos.x - padPos.x) < 1.3 &&
            Math.abs(phys.pos.y - (padPos.y + 0.3)) < 0.6 &&
            phys.vel.y < 0
          ) {
            phys.vel.y = Math.abs(phys.vel.y) * 1.25 + 6.0;
            phys.vel.x *= 1.1;
            triggerHaptic(60);
            showFeedback('🚀 SUPER SPRING BOUNCE!');
          }
        }

        // D. 림 골인 판정!
        if (!phys.scoredThisShot) {
          const hPos = phys.hoopPos;
          const distToHoop = Math.hypot(phys.pos.x - hPos.x, phys.pos.y - hPos.y);

          // 위에서 아래로 떨어지면서 림 중심을 통과할 때
          if (
            distToHoop < phys.hoopRadius &&
            phys.lastY >= hPos.y &&
            phys.pos.y <= hPos.y &&
            phys.vel.y < 0
          ) {
            phys.scoredThisShot = true;
            triggerHaptic(90);
            spawnConfetti(hPos);

            // 네트 출렁임
            if (netMeshRef.current) {
              netMeshRef.current.scale.set(1.4, 0.7, 1.4);
              setTimeout(() => {
                netMeshRef.current?.scale.set(1, 1, 1);
              }, 400);
            }

            setGoalsScored((prev) => {
              const next = prev + 1;
              const bonusScore = 100 + (phys.shotCount <= 1 ? 50 : 0);
              setCurrentScore((s) => s + bonusScore);
              showFeedback(phys.shotCount <= 1 ? '🌟 PERFECT SWISH DUNK! +150' : '🏀 NICE GOAL! +100');

              if (next >= TARGET_GOALS) {
                // 우승!
                setTimeout(() => {
                  setGameWon(true);
                  const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
                  const receipt = calculateAndDepositMissionReward({
                    gameId: 'poki-103',
                    gameTitle: 'Blumgi Bounce 3D',
                    isVictory: true,
                    score: currentScore + bonusScore,
                    maxTargetScore: 500,
                    durationSeconds: dur,
                  });
                  setRewardReceipt(receipt);
                }, 900);
              } else {
                // 다음 골대를 위해 리셋
                setTimeout(() => {
                  resetCharacterPos(true);
                }, 1200);
              }
              return next;
            });
          }
        }
      }

      // 스쿼시 & 스트레치 애니메이션
      if (characterGroupRef.current) {
        characterGroupRef.current.position.copy(phys.pos);

        if (phys.squashTimer > 0) {
          phys.squashTimer -= dt;
          const factor = Math.sin((phys.squashTimer / 0.22) * Math.PI);
          characterGroupRef.current.scale.set(1 + factor * 0.45, 1 - factor * 0.4, 1 + factor * 0.45);
        } else if (phys.inAir) {
          // 공중 늘어남
          const spd = Math.hypot(phys.vel.x, phys.vel.y);
          const stretch = Math.min(spd / 30, 0.35);
          characterGroupRef.current.scale.set(1 - stretch * 0.5, 1 + stretch, 1 - stretch * 0.5);
        } else {
          characterGroupRef.current.scale.set(1, 1, 1);
        }
      }

      // 3. 컨페티 파티클 물리 시뮬레이션
      const confetti = confettiListRef.current;
      for (let i = confetti.length - 1; i >= 0; i--) {
        const p = confetti[i];
        p.life += dt;
        p.vy -= 12 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += p.rotSpeed.x * dt;
        p.mesh.rotation.y += p.rotSpeed.y * dt;

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          if (Array.isArray(p.mesh.material)) {
            p.mesh.material.forEach((m) => m.dispose());
          } else {
            p.mesh.material.dispose();
          }
          confetti.splice(i, 1);
        }
      }

      // 바운스 패드 호버링 모션
      if (bouncePadRef.current) {
        bouncePadRef.current.position.y += Math.sin(now * 0.003) * 0.0025;
      }

      renderer.render(scene, camera);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 터치 드래그 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (physicsState.current.inAir || gameWon) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragTouch.current = {
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      active: true,
    };
    setIsAiming(true);
    setAimPower(10);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!dragTouch.current.active) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragTouch.current.currentX = clientX;
    dragTouch.current.currentY = clientY;

    const dx = dragTouch.current.startX - clientX;
    const dy = dragTouch.current.startY - clientY;
    const len = Math.hypot(dx, dy);
    const powerPct = Math.min(Math.round((len / 180) * 100), 100);
    setAimPower(powerPct);
  };

  const handleTouchEnd = () => {
    if (!dragTouch.current.active) return;
    dragTouch.current.active = false;
    shootBall();
  };

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki-103',
      gameTitle: 'Blumgi Bounce 3D',
      isVictory: false,
      score: currentScore,
      maxTargetScore: 500,
      durationSeconds: dur,
    });
    // 정산 후 추가 팝업 없이 즉시 미션리스트로 이동
    const exitFn = (typeof handleExit === "function" ? handleExit : (onBack || onExit || onClose || (() => {})));
    exitFn();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hero-return-to-missions"));
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0a0a14]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      {/* 3D 뷰포트 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="BLUMGI BOUNCE 3D"
        missionTarget={`골인 달성: ${goalsScored}/${TARGET_GOALS} HOOPS`}
        currentScore={currentScore}
        onBack={onBack}
        onForfeit={handleForfeit}
      />

      {/* 상단 조준 및 콤보 피드백 안내 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {feedbackText ? (
          <div className="bg-amber-500/90 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/40">
            {feedbackText}
          </div>
        ) : (
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded text-xs text-white/80 border border-white/10 font-mono">
            화면을 드래그해 슬링샷 각도를 조준하고 놓아 도약하세요!
          </div>
        )}

        {isAiming && (
          <div className="mt-2 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-orange-500/50">
            <span className="text-[10px] text-orange-400 font-bold">POWER</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-75"
                style={{ width: `${aimPower}%` }}
              />
            </div>
            <span className="text-[10px] text-white font-mono">{aimPower}%</span>
          </div>
        )}
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 패널 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-20 pointer-events-auto">
        {/* 리셋 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic(30);
            resetCharacterPos(false);
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 active:bg-slate-700 text-white font-mono text-xs border border-white/20 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🔄</span>
          <span className="text-[10px]">RESET</span>
        </button>

        {/* 대형 슛 발사 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            shootBall();
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-orange-500 to-amber-600 active:from-orange-600 active:to-amber-700 text-white font-black text-sm border-2 border-orange-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">🏀</span>
          <span className="tracking-wider text-xs">BOUNCE!</span>
        </button>

        {/* 슈퍼 점프 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            shootBall(13.5, 15.5);
            showFeedback('⚡ HIGH ARC SLAM!');
          }}
          className="w-16 h-16 rounded-full bg-purple-700/80 active:bg-purple-600 text-white font-mono text-xs border border-purple-400/40 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">⚡</span>
          <span className="text-[10px]">HIGH</span>
        </button>
      </div>

      {/* 승리 또는 중도 포기 보상 수령 모달 */}
      {rewardReceipt && (
        <VictoryRewardModal
          receipt={rewardReceipt}
          onClose={onBack}
        />
      )}
    </div>
  );
};

export default PokiBlumgiBounceGame;
