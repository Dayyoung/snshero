import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiDriveMadGameProps {
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

export const PokiDriveMadGame: React.FC<PokiDriveMadGameProps> = ({
  onBack,
  onExit,
  cardId = 35,
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
  const [progress, setProgress] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [crashes, setCrashes] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // 조작 상태
  const [gas, setGas] = useState(false);
  const [reverse, setReverse] = useState(false);

  const gasRef = useRef(false);
  gasRef.current = gas;
  const reverseRef = useRef(false);
  reverseRef.current = reverse;
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const crashesRef = useRef(0);
  crashesRef.current = crashes;
  const finishGameRef = useRef<(won: boolean, finalScore: number) => void>(() => {});
  const triggerHapticRef = useRef<(ms?: number | number[]) => void>(() => {});

  // 햅틱 유틸
  const triggerHaptic = useCallback((ms: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  }, []);
  triggerHapticRef.current = triggerHaptic;

  // Three.js 게임 상태 레퍼런스
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrameId: 0,

    // 트럭 메쉬 & 바퀴들
    truckGroup: null as THREE.Group | null,
    wheels: [] as THREE.Mesh[],

    // 물리 상태
    x: 6.0, // 시작 안전 광폭 플랫폼 (X: 6m)
    y: 1.8,
    vx: 0,
    vy: 0,
    angle: 0, // 피치 각도 (라디안)
    angularVel: 0,
    isGrounded: true,
    lastCheckpointX: 6.0,

    // 게임 루프 변수
    finishX: 115,
    score: 0,
    isCrashed: false,
    crashTimer: 0,
    particles: [] as Particle[],
    isEnded: false,
    startTime: 0,
  });

  // 지형 고도 함수 (X -> Y 높이)
  const getTerrainHeight = (x: number): number => {
    // 0 ~ 18m: 시작 안전 광폭 플랫폼
    if (x <= 18) return 1.0;

    // 18 ~ 36m: 3단 복셀 계단 (Step 1, 2, 3)
    if (x <= 36) {
      if (x < 24) return 1.8;
      if (x < 30) return 2.8;
      return 3.8;
    }

    // 36 ~ 54m: 목재 현수교 다리 (Y: 3.8 -> 3.0 -> 4.0)
    if (x <= 54) {
      const t = (x - 36) / 18;
      return 3.8 - Math.sin(t * Math.PI) * 0.9;
    }

    // 54 ~ 74m: 다운힐 & 스프링 점프 램프 (Y: 4.0 -> 1.2 -> 램프 4.6 -> 착지 1.6)
    if (x <= 74) {
      if (x < 64) {
        const t = (x - 54) / 10;
        return 4.0 - t * 2.8;
      }
      const t = (x - 64) / 10;
      return 1.2 + t * 3.4; // 오르막 램프
    }

    // 74 ~ 95m: 연속 3단 바위 요철
    if (x <= 95) {
      const t = (x - 74) / 21;
      return 1.6 + Math.sin(t * Math.PI * 6) * 1.0;
    }

    // 95 ~ 130m: 평탄한 결승 피니시 플랫폼
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
      gameId: 'poki_drive_mad',
      gameTitle: 'Drive Mad 3D',
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
    scene.background = new THREE.Color(0xf5e1ce); // 산뜻한 딥 슬레이트 룸
    scene.fog = new THREE.FogExp2(0xf5e1ce, 0.015);

    // Camera (사이드 쿼터뷰 추종)
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
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.4);
    sunLight.position.set(20, 30, 20);
    sunLight.castShadow = !lowSpecMode;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
    }
    scene.add(sunLight);

    // ==========================================
    // 3D 복셀 트랙 블록 생성 (120m)
    // ==========================================
    const trackWidth = 5.2;
    const trackSegs = 240;
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= trackSegs; i++) {
      const x = (i / trackSegs) * 130 - 5;
      const y = getTerrainHeight(x);

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
      color: 0x475569, // 복셀 콘크리트 슬레이트
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // ==========================================
    // 결승 피니시 체커기 게이트 아치 (X = 115m)
    // ==========================================
    const finishX = 115;
    const gateGroup = new THREE.Group();

    const pMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.5), pMat);
    postL.position.set(finishX, 4.0, -3.0);
    gateGroup.add(postL);

    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.5), pMat);
    postR.position.set(finishX, 4.0, 3.0);
    gateGroup.add(postR);

    // 상단 체커기 바 (노랑/검정 스트라이프)
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
    const banner = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 6.5), bannerMat);
    banner.position.set(finishX, 6.8, 0);
    gateGroup.add(banner);

    scene.add(gateGroup);

    // ==========================================
    // 3D 복셀 몬스터 트럭 모델링 & No.035 영웅 배지
    // ==========================================
    const truckGroup = new THREE.Group();

    // 1. 트럭 섀시 프레임 (블루 복셀)
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 1.4), chassisMat);
    chassis.position.y = 0.65;
    chassis.castShadow = true;
    truckGroup.add(chassis);

    // 2. 옐로우 복셀 캡 바디 (운전석 캐빈)
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.35), cabMat);
    cab.position.set(-0.2, 1.35, 0);
    cab.castShadow = true;
    truckGroup.add(cab);

    // 본넷 앞부분
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 1.35), cabMat);
    hood.position.set(0.85, 1.15, 0);
    hood.castShadow = true;
    truckGroup.add(hood);

    // 전면 윈드실드 유리창
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 1.2), glassMat);
    windshield.position.set(0.48, 1.4, 0);
    truckGroup.add(windshield);

    // 배기 파이프
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), exhaustMat);
    exhaust.position.set(-0.85, 1.5, 0.65);
    truckGroup.add(exhaust);

    // 공식 영웅 카드 스프라이트 HUD 배지 No.035
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
    badgeSprite.position.set(-0.2, 2.3, 0);
    badgeSprite.scale.set(1.1, 1.1, 1);
    truckGroup.add(badgeSprite);

    // 3. 거대 오프로드 바퀴 4개 (전륜 2, 후륜 2)
    const wheels: THREE.Mesh[] = [];
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7 });

    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 16);
    wheelGeo.rotateX(Math.PI / 2);

    const wheelOffsets = [
      { x: 0.95, y: 0.55, z: 0.9 }, // 전륜 우
      { x: 0.95, y: 0.55, z: -0.9 }, // 전륜 좌
      { x: -0.95, y: 0.55, z: 0.9 }, // 후륜 우
      { x: -0.95, y: 0.55, z: -0.9 }, // 후륜 좌
    ];

    wheelOffsets.forEach((off) => {
      const wMesh = new THREE.Mesh(wheelGeo, tireMat);
      wMesh.position.set(off.x, off.y, off.z);
      wMesh.castShadow = true;
      truckGroup.add(wMesh);

      const rMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.37, 12).rotateX(Math.PI / 2), rimMat);
      wMesh.add(rMesh);

      wheels.push(wMesh);
    });

    // 시작 위치 (6.0m 안전 광폭 안착 플랫폼)
    truckGroup.position.set(6.0, 1.8, 0);
    scene.add(truckGroup);

    // 레퍼런스 등록
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.truckGroup = truckGroup;
    g.wheels = wheels;
    g.x = 6.0;
    g.y = 1.8;
    g.vx = 0;
    g.vy = 0;
    g.angle = 0;
    g.angularVel = 0;
    g.isGrounded = true;
    g.score = 0;
    g.isCrashed = false;
    g.crashTimer = 0;
    g.particles = [];
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
        // 크래시 리스폰 처리
        if (g.isCrashed) {
          g.crashTimer -= dt;
          if (g.crashTimer <= 0) {
            g.isCrashed = false;
            g.x = g.lastCheckpointX;
            g.y = getTerrainHeight(g.x) + 0.9;
            g.vx = 0;
            g.vy = 0;
            g.angle = 0;
            g.angularVel = 0;
          }
          renderer.render(scene, camera);
          return;
        }

        // ------------------------------------
        // 트럭 접지 판정 & 서스펜션
        // ------------------------------------
        const frontX = g.x + Math.cos(g.angle) * 0.95;
        const rearX = g.x - Math.cos(g.angle) * 0.95;
        const yFrontGround = getTerrainHeight(frontX) + 0.55;
        const yRearGround = getTerrainHeight(rearX) + 0.55;
        const targetSlope = Math.atan2(yFrontGround - yRearGround, 1.9);
        const centerGroundY = (yFrontGround + yRearGround) / 2;

        const isTouchingGround = g.y <= centerGroundY + 0.25;

        if (isTouchingGround) {
          g.isGrounded = true;
          g.y = centerGroundY;
          g.vy = 0;

          // 지면 각도 서스펜션 추종
          g.angle = THREE.MathUtils.lerp(g.angle, targetSlope, 0.18);

          // 가속 & 후진
          if (gasRef.current) {
            g.vx = Math.min(16.0, g.vx + 14.0 * dt);
            // 앞바퀴 들림 토크 (Wheelie 틸트)
            g.angularVel += 2.8 * dt;
            triggerHaptic(10);

            // 배기 연기 파티클
            if (Math.random() < 0.5) {
              const pMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 });
              const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), pMat);
              pMesh.position.set(rearX, yRearGround + 0.4, 0.65);
              scene.add(pMesh);
              g.particles.push({
                mesh: pMesh,
                vx: -g.vx * 0.3 + (Math.random() - 0.5),
                vy: Math.random() * 2 + 1,
                vz: (Math.random() - 0.5),
                life: 0,
                maxLife: 0.4,
              });
            }
          } else if (reverseRef.current) {
            g.vx = Math.max(-8.0, g.vx - 14.0 * dt);
            // 앞으로 숙여지는 토크
            g.angularVel -= 3.2 * dt;
            triggerHaptic(12);
          } else {
            g.vx *= 0.985;
          }

          // 전복(크래시) 판정
          const angleDiff = Math.abs(g.angle - targetSlope);
          if (angleDiff > Math.PI * 0.65) {
            g.isCrashed = true;
            g.crashTimer = 1.1;
            setCrashes((prev) => prev + 1);
            triggerHaptic([100, 80, 120]);
            playSfx?.('defeat');
            return;
          }
        } else {
          // 공중 비행 상태
          g.isGrounded = false;
          g.vy -= 24.0 * dt; // 중력

          // 공중 틸트 제어 (가속 시 뒤로, 후진 시 앞으로)
          if (gasRef.current) g.angularVel += 4.5 * dt;
          if (reverseRef.current) g.angularVel -= 4.5 * dt;
          g.angle += g.angularVel * dt;
        }

        // 전진
        g.x += g.vx * dt;
        g.y += g.vy * dt;

        // 바퀴 회전
        g.wheels.forEach((w) => {
          w.rotation.z -= g.vx * 2.2 * dt;
        });

        // 진행률 업데이트
        const pct = Math.min(100, Math.floor((g.x / g.finishX) * 100));
        setProgress(pct);
        setSpeedKmh(Math.floor(Math.abs(g.vx) * 3.6));

        // 체크포인트 갱신
        if (g.isGrounded && g.x > g.lastCheckpointX + 22) {
          g.lastCheckpointX = g.x;
        }

        // 골인 판정
        if (g.x >= g.finishX) {
          finishGameRef.current(true, Math.max(500, 1500 - crashes * 150));
          return;
        }

        // 트럭 메쉬 위치 & 회전 반영
        if (g.truckGroup) {
          g.truckGroup.position.set(g.x, g.y, 0);
          g.truckGroup.rotation.z = g.angle;
        }

        // 파티클 업데이트
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const p = g.particles[i];
          p.life += dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.vy -= 12 * dt;

          if (p.life >= p.maxLife) {
            scene.remove(p.mesh);
            g.particles.splice(i, 1);
          }
        }
      }

      // 카메라 부드러운 전방 추종
      if (g.camera && g.truckGroup) {
        const targetCamX = g.x + 4.0;
        const targetCamY = Math.max(4.0, g.y + 2.8);
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
      if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.code === 'KeyW' || e.code === 'ArrowUp') setGas(true);
      if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyS' || e.code === 'ArrowDown') setReverse(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.code === 'KeyW' || e.code === 'ArrowUp') setGas(false);
      if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyS' || e.code === 'ArrowDown') setReverse(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#f5e1ce] text-white font-mono">
      {/* Three.js 3D 뷰포트 컨테이너 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미니멀 HUD 헤더 */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="Drive Mad 3D"
        score={score}
        onQuit={() => finishGameRef.current(false, score)}
      />

      {/* 상단 레이스 계기판 오버레이 */}
      <div className="absolute top-14 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-sm border border-yellow-500/50 text-xs font-bold text-yellow-400">
            🏎️ 속도: <strong className="text-white text-sm">{speedKmh}</strong> km/h
          </div>
          <div className="px-3 py-0.5 bg-black/60 rounded-sm text-[11px] text-zinc-300">
            💥 전복: <strong className="text-red-400">{crashes}</strong>회
          </div>
        </div>

        {/* 코스 진행 바 */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-black text-yellow-300">🏁 {progress}%</div>
          <div className="w-28 bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
            <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* 모바일 퓨어 터치 버튼: 좌측 (후진) & 우측 (전진) */}
      <div className="absolute bottom-8 left-6 z-20">
        <button
          type="button"
          onPointerDown={() => setReverse(true)}
          onPointerUp={() => setReverse(false)}
          onPointerLeave={() => setReverse(false)}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 border-2 border-zinc-400 text-white flex flex-col items-center justify-center font-black active:scale-90 shadow-2xl active:bg-zinc-500"
        >
          <span className="text-2xl leading-none">🔙</span>
          <span className="text-xs font-black tracking-tight mt-1">REV</span>
        </button>
      </div>

      <div className="absolute bottom-8 right-6 z-20">
        <button
          type="button"
          onPointerDown={() => setGas(true)}
          onPointerUp={() => setGas(false)}
          onPointerLeave={() => setGas(false)}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-500 border-2 border-yellow-200 text-white flex flex-col items-center justify-center font-black transition-transform active:scale-90 shadow-2xl"
        >
          <span className="text-2xl leading-none">🏎️</span>
          <span className="text-xs font-black tracking-tight mt-1">GAS</span>
        </button>
      </div>

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Drive Mad 3D"
        description="복셀 몬스터 트럭이 전복되지 않게 조심스럽게 전진과 후진을 조절하여 결승선까지 골인하세요!"
        features={[
          {
            iconType: 'GOAL',
            title: '결승선 무사고 완주',
            desc: '계단, 흔들다리, 점프대를 지나 전복 없이 안전하게 결승선을 통과하세요.',
          },
          {
            iconType: 'GESTURES',
            title: '전진 & 후진 밸런스 제어',
            desc: '우측 [GAS]로 전진하고, 좌측 [REV]로 후진/감속하여 차체 수평을 유지하세요.',
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

export default PokiDriveMadGame;
