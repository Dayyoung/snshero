import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStuntBikeExtremeGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiStuntBikeExtremeGame: React.FC<PokiStuntBikeExtremeGameProps> = ({
  onBack,
  onExit,
  cardId = 33,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
}) => {
  const handleExit = onExit || onBack || (() => window.history.back());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI 상태
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [flips, setFlips] = useState(0);
  const [score, setScore] = useState(0);
  const [stuntBanner, setStuntBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // 조작 키/버튼 상태
  const [throttle, setThrottle] = useState(false);
  const [brake, setBrake] = useState(false);
  const [leanBack, setLeanBack] = useState(false);
  const [leanFwd, setLeanFwd] = useState(false);

  const throttleRef = useRef(false);
  throttleRef.current = throttle;
  const brakeRef = useRef(false);
  brakeRef.current = brake;
  const leanBackRef = useRef(false);
  leanBackRef.current = leanBack;
  const leanFwdRef = useRef(false);
  leanFwdRef.current = leanFwd;
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const finishGameRef = useRef<(won: boolean, finalScore: number) => void>(() => {});

  // 햅틱 유틸
  const triggerHaptic = useCallback((ms: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, []);

  // Three.js 게임 상태 레퍼런스
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrameId: 0,

    // 바이크 & 라이더 메쉬
    bikeGroup: null as THREE.Group | null,
    wheelF: null as THREE.Mesh | null,
    wheelR: null as THREE.Mesh | null,

    // 물리 상태
    x: 6.0, // 시작 안전 광폭 안착 플랫폼 (X: 6m)
    y: 1.6,
    vx: 0,
    vy: 0,
    angle: 0, // 피치 각도 (라디안)
    angularVel: 0,
    isGrounded: true,
    lastCheckpointX: 6.0,

    // 스턴트 플립 감지
    totalAirRotation: 0,
    lastAngle: 0,
    flipsCount: 0,

    // 게임 루프 변수
    finishX: 135,
    score: 0,
    isCrashed: false,
    crashTimer: 0,
    particles: [] as Particle[],
    isEnded: false,
    startTime: 0,
  });

  // 지형 고도 함수 (X 좌표 -> Y 높이)
  const getTerrainHeight = (x: number): number => {
    // 0 ~ 20m: 평탄한 시작 플랫폼
    if (x <= 20) return 1.0;

    // 20 ~ 45m: 제1 언덕 & 램프 점프대 (Y: 1.0 -> 5.2 -> 2.0)
    if (x <= 45) {
      const t = (x - 20) / 25;
      return 1.0 + Math.sin(t * Math.PI) * 4.2;
    }

    // 45 ~ 75m: 롤러코스터 다운힐 & 급상승 2차 메가 점프대 (Y: 2.0 -> 0.6 -> 6.8 -> 1.8)
    if (x <= 75) {
      const t = (x - 45) / 30;
      return 1.8 + Math.sin(t * Math.PI * 1.5) * 3.5 + Math.cos(t * Math.PI) * 1.2;
    }

    // 75 ~ 105m: 연속 3단 요철 (Whoops: 진폭 1.2m)
    if (x <= 105) {
      const t = (x - 75) / 30;
      return 2.0 + Math.sin(t * Math.PI * 6) * 1.1;
    }

    // 105 ~ 130m: 라스트 롱 갭 점프대 (Y: 2.0 -> 7.2 -> 2.0)
    if (x <= 130) {
      const t = (x - 105) / 25;
      return 2.0 + Math.sin(t * Math.PI) * 5.2;
    }

    // 130 ~ 160m: 평탄한 결승 피니시 플랫폼
    return 2.0;
  };

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
      gameId: 'poki_stunt_bike',
      gameTitle: 'Stunt Bike Extreme 3D',
      durationSeconds: timeSpent,
      score: finalScore,
      maxTargetScore: 1200,
      isVictory: won,
    });
    setRewardResult(deposit);
    triggerHaptic(won ? [50, 100, 150] : [150, 80]);
    if (won) playSfx?.('victory');
    else playSfx?.('defeat');
  }, [triggerHaptic, playSfx]);
  finishGameRef.current = finishGame;

  // Three.js 씬 구축
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a1714); // 사막 일몰 협곡 테마
    scene.fog = new THREE.FogExp2(0x2a1714, 0.014);

    // Camera (사이드 추종 뷰)
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 120);
    camera.position.set(6, 6, 14);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfb923c, 1.4);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = !lowSpecMode;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
    }
    scene.add(sunLight);

    // ==========================================
    // 3D 산악 지형 트랙 생성 (150m 연속 3D 서피스)
    // ==========================================
    const trackSegs = 300;
    const trackWidth = 5.5;
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= trackSegs; i++) {
      const x = (i / trackSegs) * 155 - 5;
      const y = getTerrainHeight(x);

      // 좌측 정점, 우측 정점
      vertices.push(x, y, -trackWidth / 2);
      vertices.push(x, y, trackWidth / 2);

      if (i < trackSegs) {
        const row = i * 2;
        indices.push(row, row + 1, row + 2);
        indices.push(row + 1, row + 3, row + 2);
      }
    }

    const trackGeo = new THREE.BufferGeometry();
    trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    trackGeo.setIndex(indices);
    trackGeo.computeVertexNormals();

    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // 트랙 사이드 네온 가이드 엣지 (빨강/하양 체크 레일)
    const railGeoL: number[] = [];
    const railGeoR: number[] = [];
    for (let i = 0; i <= trackSegs; i++) {
      const x = (i / trackSegs) * 155 - 5;
      const y = getTerrainHeight(x) + 0.08;
      railGeoL.push(x, y, -trackWidth / 2);
      railGeoR.push(x, y, trackWidth / 2);
    }
    const lineMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
    const lineL = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(railGeoL, 3)), lineMat);
    const lineR = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(railGeoR, 3)), lineMat);
    scene.add(lineL);
    scene.add(lineR);

    // ==========================================
    // 결승 체커기 게이트 아치 (X = 135m)
    // ==========================================
    const finishX = 135;
    const gateGroup = new THREE.Group();

    // 기둥 2개
    const pMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7, 12), pMat);
    postL.position.set(finishX, 4.5, -3.2);
    gateGroup.add(postL);

    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7, 12), pMat);
    postR.position.set(finishX, 4.5, 3.2);
    gateGroup.add(postR);

    // 상단 배너 (체커기)
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 6.8), bannerMat);
    banner.position.set(finishX, 7.2, 0);
    gateGroup.add(banner);

    scene.add(gateGroup);

    // ==========================================
    // 3D 모토크로스 스턴트 바이크 & No.033 영웅 배지
    // ==========================================
    const bikeGroup = new THREE.Group();

    // 1. 프레임 (네온 오렌지)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.6, roughness: 0.3 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.35), frameMat);
    frame.position.y = 0.55;
    frame.castShadow = true;
    bikeGroup.add(frame);

    // 엔진 블록 (메탈릭 실버)
    const engMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.32), engMat);
    engine.position.set(-0.1, 0.35, 0);
    bikeGroup.add(engine);

    // 배기 파이프
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 8), engMat);
    exhaust.rotation.z = Math.PI / 3;
    exhaust.position.set(-0.55, 0.55, 0.22);
    bikeGroup.add(exhaust);

    // 핸들바
    const hBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), pMat);
    hBar.rotation.x = Math.PI / 2;
    hBar.position.set(0.45, 0.9, 0);
    bikeGroup.add(hBar);

    // 2. 바퀴 2개 (전륜 & 후륜)
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });

    // 전륜 (앞바퀴 X: +0.7)
    const wFrontGroup = new THREE.Group();
    const tireF = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 16), tireMat);
    tireF.rotation.x = Math.PI / 2;
    tireF.castShadow = true;
    wFrontGroup.add(tireF);
    const rimF = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.24, 12), rimMat);
    rimF.rotation.x = Math.PI / 2;
    wFrontGroup.add(rimF);
    wFrontGroup.position.set(0.7, 0.42, 0);
    bikeGroup.add(wFrontGroup);

    // 후륜 (뒷바퀴 X: -0.7)
    const wRearGroup = new THREE.Group();
    const tireR = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 16), tireMat);
    tireR.rotation.x = Math.PI / 2;
    tireR.castShadow = true;
    wRearGroup.add(tireR);
    const rimR = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.26, 12), rimMat);
    rimR.rotation.x = Math.PI / 2;
    wRearGroup.add(rimR);
    wRearGroup.position.set(-0.7, 0.42, 0);
    bikeGroup.add(wRearGroup);

    // 3. 3D 라이더 아바타
    const riderGroup = new THREE.Group();
    // 라이더 몸통
    const rSuitMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.4), rSuitMat);
    rBody.position.set(0, 0.95, 0);
    rBody.rotation.z = 0.2; // 앞으로 숙인 자세
    riderGroup.add(rBody);

    // 라이더 헬멧
    const rHelmetMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const rHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), rHelmetMat);
    rHelmet.position.set(0.12, 1.4, 0);
    riderGroup.add(rHelmet);

    // 바이저 (블랙)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.28), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    visor.position.set(0.28, 1.4, 0);
    riderGroup.add(visor);

    // 공식 영웅 카드 No.033 스프라이트 HUD 배지
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
    badgeSprite.position.set(0.1, 1.95, 0);
    badgeSprite.scale.set(0.9, 0.9, 1);
    riderGroup.add(badgeSprite);

    bikeGroup.add(riderGroup);

    // 초기 시작 위치 (6.0m 안전 광폭 스타트 플랫폼 안착)
    bikeGroup.position.set(6.0, 1.6, 0);
    scene.add(bikeGroup);

    // 게임 레퍼런스 등록
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.bikeGroup = bikeGroup;
    g.wheelF = wFrontGroup as any;
    g.wheelR = wRearGroup as any;
    g.x = 6.0;
    g.y = 1.6;
    g.vx = 0;
    g.vy = 0;
    g.angle = 0;
    g.angularVel = 0;
    g.isGrounded = true;
    g.totalAirRotation = 0;
    g.lastAngle = 0;
    g.flipsCount = 0;
    g.score = 0;
    g.isCrashed = false;
    g.crashTimer = 0;
    g.particles = [];
    g.isEnded = false;
    g.startTime = performance.now();

    // ==========================================
    // 애니메이션 프레임 루프
    // ==========================================
    let lastTime = performance.now();

    const animate = (now: number) => {
      g.animFrameId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      if (!g.isEnded && isPlaying) {
        // 크래시 리스폰 대기 중
        if (g.isCrashed) {
          g.crashTimer -= dt;
          if (g.crashTimer <= 0) {
            // 체크포인트 안전 리스폰
            g.isCrashed = false;
            g.x = g.lastCheckpointX;
            g.y = getTerrainHeight(g.x) + 0.6;
            g.vx = 0;
            g.vy = 0;
            g.angle = 0;
            g.angularVel = 0;
          }
          renderer.render(scene, camera);
          return;
        }

        // ------------------------------------
        // 물리 & 바이크 접지 판정
        // ------------------------------------
        const frontX = g.x + Math.cos(g.angle) * 0.7;
        const rearX = g.x - Math.cos(g.angle) * 0.7;
        const yFrontGround = getTerrainHeight(frontX) + 0.42;
        const yRearGround = getTerrainHeight(rearX) + 0.42;
        const groundSlopeAngle = Math.atan2(yFrontGround - yRearGround, 1.4);
        const centerGroundY = (yFrontGround + yRearGround) / 2;

        // 접지 판정
        const groundedThreshold = 0.25;
        const isTouchingGround = g.y <= centerGroundY + groundedThreshold;

        if (isTouchingGround) {
          g.isGrounded = true;
          g.y = centerGroundY;
          g.vy = 0;

          // 지면 각도 부드럽게 추종
          g.angle = THREE.MathUtils.lerp(g.angle, groundSlopeAngle, 0.2);
          g.angularVel = 0;

          // 공중 회전 리셋
          g.totalAirRotation = 0;

          // 스로틀 가속
          if (throttleRef.current) {
            g.vx = Math.min(22.0, g.vx + 16.0 * dt);
            triggerHaptic(12);

            // 배기 흙먼지 파티클
            if (Math.random() < 0.6) {
              const pMat = new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.7 });
              const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), pMat);
              pMesh.position.set(rearX, yRearGround, (Math.random() - 0.5) * 0.4);
              scene.add(pMesh);
              g.particles.push({
                mesh: pMesh,
                vx: -g.vx * 0.4 + (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                vz: (Math.random() - 0.5) * 2,
                life: 0,
                maxLife: 0.4,
              });
            }
          } else if (brakeRef.current) {
            g.vx = Math.max(0, g.vx - 22.0 * dt);
            triggerHaptic(18);
          } else {
            // 자연 마찰 감속
            g.vx *= 0.985;
          }

          // 지면 위 틸트 (앞바퀴 들림 윌리 / 뒷바퀴 들림)
          if (leanBackRef.current) g.angle += 1.8 * dt;
          if (leanFwdRef.current) g.angle -= 1.8 * dt;

          // 전복(크래시) 판정
          const angleDiff = Math.abs(g.angle - groundSlopeAngle);
          if (angleDiff > Math.PI * 0.6) {
            // 전복 사고!
            g.isCrashed = true;
            g.crashTimer = 1.3;
            triggerHaptic([100, 80, 120]);
            playSfx?.('defeat');
            return;
          }
        } else {
          // 공중 비행 상태
          g.isGrounded = false;
          g.vy -= 24.0 * dt; // 중력

          // 공중 틸트 회전 조작 (플립 묘기)
          if (leanBackRef.current) g.angularVel += 5.5 * dt;
          if (leanFwdRef.current) g.angularVel -= 5.5 * dt;
          g.angle += g.angularVel * dt;

          // 공중 360° 플립 누적 계산
          const dAngle = g.angle - g.lastAngle;
          g.totalAirRotation += dAngle;
          if (Math.abs(g.totalAirRotation) >= Math.PI * 2) {
            g.totalAirRotation = 0;
            g.flipsCount++;
            setFlips(g.flipsCount);
            g.score += 500;
            setScore(g.score);

            setStuntBanner('🔥 360° FLIP! +500 PTS');
            triggerHaptic([30, 40, 50]);
            playSfx?.('victory');
            setTimeout(() => setStuntBanner(null), 1200);
          }
        }

        g.lastAngle = g.angle;

        // 위치 전진
        g.x += g.vx * dt;
        g.y += g.vy * dt;

        // 바퀴 회전
        if (g.wheelF && g.wheelR) {
          g.wheelF.rotation.z -= g.vx * 3 * dt;
          g.wheelR.rotation.z -= g.vx * 3 * dt;
        }

        // 진행률 업데이트
        const pct = Math.min(100, Math.floor((g.x / g.finishX) * 100));
        setProgress(pct);
        setSpeedKmh(Math.floor(g.vx * 3.6));

        // 체크포인트 갱신 (안전 착지 시)
        if (g.isGrounded && g.x > g.lastCheckpointX + 25) {
          g.lastCheckpointX = g.x;
        }

        // 결승선 골인 판정
        if (g.x >= g.finishX) {
          finishGameRef.current(true, g.score + 1000);
          return;
        }

        // 바이크 메쉬 위치 & 회전 반영
        if (g.bikeGroup) {
          g.bikeGroup.position.set(g.x, g.y, 0);
          g.bikeGroup.rotation.z = g.angle;
        }

        // 파티클 업데이트
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

      // 카메라 동적 추종 (바이크 우측 전방을 바라보며 추종)
      if (g.camera && g.bikeGroup) {
        const targetCamX = g.x + 3.8;
        const targetCamY = Math.max(4.2, g.y + 2.5);
        g.camera.position.x = THREE.MathUtils.lerp(g.camera.position.x, targetCamX, 0.12);
        g.camera.position.y = THREE.MathUtils.lerp(g.camera.position.y, targetCamY, 0.08);
        g.camera.lookAt(g.x + 2.5, g.y + 1.0, 0);
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

  // 키보드 조작 (PC 백업)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setThrottle(true);
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setBrake(true);
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setLeanBack(true);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setLeanFwd(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setThrottle(false);
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setBrake(false);
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setLeanBack(false);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setLeanFwd(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-black text-white font-mono">
      {/* Three.js 3D 뷰포트 컨테이너 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미니멀 HUD 헤더 */}
      <MinimalistMissionHUD
        gameTitle="Stunt Bike Extreme 3D"
        score={score}
        onQuit={() => finishGameRef.current(false, score)}
      />

      {/* 상단 레이스 계기판 오버레이 */}
      <div className="absolute top-14 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* 속도계 & 플립 수 */}
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-sm border border-orange-500/50 text-xs font-bold text-orange-400">
            ⚡ 속도: <strong className="text-white text-sm">{speedKmh}</strong> km/h
          </div>
          <div className="px-3 py-0.5 bg-black/60 rounded-sm text-[11px] text-yellow-300">
            🌀 스턴트 플립: <strong>{flips}</strong>회
          </div>
        </div>

        {/* 코스 진행 바 */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-black text-amber-300">🏁 {progress}%</div>
          <div className="w-28 bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
            <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* 스턴트 배너 알림 */}
      {stuntBanner && (
        <div className="absolute top-28 left-4 right-4 pointer-events-none z-10 flex justify-center">
          <div className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 rounded-sm text-sm font-black text-white shadow-xl animate-bounce">
            {stuntBanner}
          </div>
        </div>
      )}

      {/* 모바일 퓨어 터치 버튼: 좌측 (틸트 밸런스) */}
      <div className="absolute bottom-8 left-6 flex items-center gap-3 z-20">
        <button
          type="button"
          onPointerDown={() => setLeanBack(true)}
          onPointerUp={() => setLeanBack(false)}
          onPointerLeave={() => setLeanBack(false)}
          className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/50 text-amber-300 flex flex-col items-center justify-center font-black active:scale-95 shadow-lg active:bg-amber-600 active:text-white"
        >
          <span className="text-xl">↩️</span>
          <span className="text-[9px] mt-0.5">BACK</span>
        </button>

        <button
          type="button"
          onPointerDown={() => setLeanFwd(true)}
          onPointerUp={() => setLeanFwd(false)}
          onPointerLeave={() => setLeanFwd(false)}
          className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/50 text-amber-300 flex flex-col items-center justify-center font-black active:scale-95 shadow-lg active:bg-amber-600 active:text-white"
        >
          <span className="text-xl">↪️</span>
          <span className="text-[9px] mt-0.5">FWD</span>
        </button>
      </div>

      {/* 모바일 퓨어 터치 버튼: 우측 (가속 / 브레이크) */}
      <div className="absolute bottom-8 right-6 flex items-end gap-3 z-20">
        {/* 제동 버튼 */}
        <button
          type="button"
          onPointerDown={() => setBrake(true)}
          onPointerUp={() => setBrake(false)}
          onPointerLeave={() => setBrake(false)}
          className="w-16 h-16 rounded-full bg-red-950/80 backdrop-blur-md border border-red-500 text-red-200 flex flex-col items-center justify-center font-black active:scale-95 shadow-lg active:bg-red-600 active:text-white"
        >
          <span className="text-xl">🛑</span>
          <span className="text-[9px] mt-0.5">BRAKE</span>
        </button>

        {/* 가속 대형 버튼 (76px) */}
        <button
          type="button"
          onPointerDown={() => setThrottle(true)}
          onPointerUp={() => setThrottle(false)}
          onPointerLeave={() => setThrottle(false)}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 border-2 border-amber-200 text-white flex flex-col items-center justify-center font-black transition-transform active:scale-90 shadow-2xl"
        >
          <span className="text-2xl leading-none">🚀</span>
          <span className="text-xs font-black tracking-tight mt-1">GAS</span>
        </button>
      </div>

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Stunt Bike Extreme 3D"
        description="험난한 산악 협곡 코스를 질주하며 공중 360° 플립 스턴트를 성공시키세요!"
        features={[
          {
            iconType: 'GOAL',
            title: '결승선 완주 & 스턴트',
            desc: '공중에서 회전하여 플립을 달성하고, 전복되지 않고 안전하게 결승선을 통과하세요.',
          },
          {
            iconType: 'GESTURES',
            title: '가속과 공중 밸런스',
            desc: '우측 [GAS]로 질주하고, 좌측 [BACK / FWD]로 공중 자세를 제어하세요.',
          },
          {
            iconType: 'REWARDS',
            title: 'SNS 보상 정산',
            desc: '완주 성공 시 최대 50 SNS 포인트 및 시즌 랭킹 마일리지가 지급됩니다.',
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

export default PokiStuntBikeExtremeGame;
