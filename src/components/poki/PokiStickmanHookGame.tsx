import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiStickmanHookGameProps {
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

interface HookAnchor {
  x: number;
  y: number;
  mesh: THREE.Mesh;
  pulseRing: THREE.Mesh;
}

interface Trampoline {
  x: number;
  y: number;
  w: number;
  mesh: THREE.Mesh;
}

interface StarCoin {
  x: number;
  y: number;
  mesh: THREE.Mesh;
  collected: boolean;
}

export const PokiStickmanHookGame: React.FC<PokiStickmanHookGameProps> = ({
  onBack,
  cardId = 20,
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
  onClose
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || cardId || 20;
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
  const [progressPct, setProgressPct] = useState<number>(0);
  const [isHooked, setIsHooked] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // 튜토리얼
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_stickman_hook') !== 'true';
    } catch {
      return true;
    }
  });

  // 물리 시뮬레이션 상태 Ref
  const stateRef = useRef({
    player: {
      pos: new THREE.Vector3(2, 3.5, 0),
      vel: new THREE.Vector3(8.5, 0, 0),
      rotZ: 0,
    },
    hook: {
      active: false,
      anchor: null as HookAnchor | null,
      length: 0,
      angle: 0,
      angularVel: 0,
      lineMesh: null as THREE.Line | null,
    },
    isHoldingHook: false,
    anchors: [] as HookAnchor[],
    trampolines: [] as Trampoline[],
    stars: [] as StarCoin[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    finishX: 105,
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
    scene.background = new THREE.Color(0xe3dbfc);
    scene.fog = new THREE.FogExp2(0xe3dbfc, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    camera.position.set(0, 6.5, 20);
    camera.lookAt(0, 2.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f3ff, 1.4);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // 1. 시작 18m 안전 광폭 대지 (시작 급사 원천 차단)
    const startPlatformGeo = new THREE.BoxGeometry(22, 2, 4);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 });
    const startPlat = new THREE.Mesh(startPlatformGeo, platMat);
    startPlat.position.set(9, 0, 0);
    scene.add(startPlat);

    // 상단 네온 엣지
    const edgeGeo = new THREE.BoxGeometry(22, 0.1, 4.05);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(9, 1.05, 0);
    scene.add(edge);

    // 2. 10개의 공중 네온 앵커 피벗
    stateRef.current.anchors = [];
    const anchorConfigs = [
      { x: 22, y: 8.5 },
      { x: 32, y: 9.0 },
      { x: 42, y: 8.2 },
      { x: 52, y: 9.5 },
      { x: 62, y: 8.8 },
      { x: 72, y: 9.2 },
      { x: 82, y: 8.6 },
      { x: 92, y: 9.4 },
      { x: 100, y: 8.5 },
    ];

    anchorConfigs.forEach((cfg) => {
      const aGeo = new THREE.SphereGeometry(0.45, 16, 16);
      const aMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const aMesh = new THREE.Mesh(aGeo, aMat);
      aMesh.position.set(cfg.x, cfg.y, 0);
      scene.add(aMesh);

      const rGeo = new THREE.RingGeometry(0.65, 0.8, 24);
      const rMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide });
      const pulseRing = new THREE.Mesh(rGeo, rMat);
      pulseRing.position.set(cfg.x, cfg.y, 0);
      scene.add(pulseRing);

      stateRef.current.anchors.push({
        x: cfg.x,
        y: cfg.y,
        mesh: aMesh,
        pulseRing,
      });
    });

    // 3. 고탄성 트램펄린 패드 4개
    stateRef.current.trampolines = [];
    const trampConfigs = [
      { x: 27, y: 0.5, w: 4.5 },
      { x: 47, y: 0.8, w: 5.0 },
      { x: 67, y: 0.5, w: 5.0 },
      { x: 87, y: 0.8, w: 5.5 },
    ];

    const trampMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const trampBedMat = new THREE.MeshBasicMaterial({ color: 0xff007f });

    trampConfigs.forEach((cfg) => {
      const tGroup = new THREE.Group();
      tGroup.position.set(cfg.x, cfg.y, 0);

      const base = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, 0.4, 3), trampMat);
      tGroup.add(base);

      const bed = new THREE.Mesh(new THREE.BoxGeometry(cfg.w - 0.4, 0.15, 2.6), trampBedMat);
      bed.position.y = 0.25;
      tGroup.add(bed);

      scene.add(tGroup);

      stateRef.current.trampolines.push({
        x: cfg.x,
        y: cfg.y + 0.3,
        w: cfg.w,
        mesh: base,
      });
    });

    // 4. 황금 스타 코인 15개
    stateRef.current.stars = [];
    const starGeo = new THREE.OctahedronGeometry(0.38, 0);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    const starCoords = [
      { x: 15, y: 4.5 }, { x: 20, y: 6.0 }, { x: 26, y: 4.0 }, { x: 30, y: 6.8 },
      { x: 36, y: 5.5 }, { x: 41, y: 6.2 }, { x: 46, y: 4.2 }, { x: 51, y: 7.0 },
      { x: 57, y: 5.8 }, { x: 62, y: 6.5 }, { x: 68, y: 4.5 }, { x: 74, y: 6.8 },
      { x: 80, y: 5.5 }, { x: 89, y: 5.0 }, { x: 97, y: 6.2 }
    ];

    starCoords.forEach((coord) => {
      const sMesh = new THREE.Mesh(starGeo, starMat);
      sMesh.position.set(coord.x, coord.y, 0);
      scene.add(sMesh);
      stateRef.current.stars.push({ x: coord.x, y: coord.y, mesh: sMesh, collected: false });
    });

    // 5. 결승 포털 & 체커 플래그 (X = 105m)
    const finishGroup = new THREE.Group();
    finishGroup.position.set(105, 0, 0);

    const fBase = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 4), platMat);
    finishGroup.add(fBase);

    const fArchGeo = new THREE.TorusGeometry(3.5, 0.35, 16, 32);
    const fArchMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const fArch = new THREE.Mesh(fArchGeo, fArchMat);
    fArch.position.set(0, 3.5, 0);
    finishGroup.add(fArch);

    const fPortal = new THREE.Mesh(
      new THREE.CircleGeometry(3.2, 32),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
    );
    fPortal.position.set(0, 3.5, 0);
    finishGroup.add(fPortal);

    scene.add(finishGroup);

    // 6. 훅 에너지 와이어 라인 메쉬
    const ropeGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const ropeMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, linewidth: 3 });
    const ropeLine = new THREE.Line(ropeGeo, ropeMat);
    ropeLine.visible = false;
    scene.add(ropeLine);
    stateRef.current.hook.lineMesh = ropeLine;

    // 7. 3D 스틱맨 아바타 메쉬
    const stickmanGroup = new THREE.Group();

    // 머리
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 }));
    head.position.y = 0.9;
    stickmanGroup.add(head);

    // 몸통
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    body.position.y = 0.2;
    stickmanGroup.add(body);

    // 팔다리
    const limbGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x0369a1 });

    const armL = new THREE.Mesh(limbGeo, limbMat);
    armL.position.set(0.35, 0.4, 0);
    armL.rotation.z = -0.5;
    const armR = new THREE.Mesh(limbGeo, limbMat);
    armR.position.set(-0.35, 0.4, 0);
    armR.rotation.z = 0.5;
    stickmanGroup.add(armL, armR);

    const legL = new THREE.Mesh(limbGeo, limbMat);
    legL.position.set(0.2, -0.5, 0);
    const legR = new THREE.Mesh(limbGeo, limbMat);
    legR.position.set(-0.2, -0.5, 0);
    stickmanGroup.add(legL, legR);

    stickmanGroup.position.set(2, 3.5, 0);
    scene.add(stickmanGroup);

    // 파티클 생성 함수
    const spawnSparks = (pos: THREE.Vector3, color: number, count = 10) => {
      for (let i = 0; i < (lowSpecMode ? count / 2 : count); i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), new THREE.MeshBasicMaterial({ color }));
        p.position.copy(pos);
        scene.add(p);
        stateRef.current.particles.push({
          mesh: p,
          vel: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 5 + 2, (Math.random() - 0.5) * 4),
          life: 0.5 + Math.random() * 0.3,
        });
      }
    };

    // 키보드 리스너
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        startHookAction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        releaseHookAction();
      }
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
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      const p = stateRef.current.player;
      const hook = stateRef.current.hook;

      // 앵커 펄스 애니메이션
      stateRef.current.anchors.forEach((a) => {
        const s = 1.0 + Math.sin(time * 0.006 + a.x) * 0.15;
        a.pulseRing.scale.set(s, s, 1);
      });

      // 1. 와이어 그래플링 물리 vs 공중 자유 비행 물리
      if (hook.active && hook.anchor) {
        // 원심력 각가속도 스윙
        const gravity = 24;
        const angularAcc = -(gravity / hook.length) * Math.sin(hook.angle);
        hook.angularVel += angularAcc * dt;
        hook.angularVel *= 0.996; // 공기 저항 미약 감쇠
        hook.angle += hook.angularVel * dt;

        // 플레이어 위치 갱신
        p.pos.x = hook.anchor.x + Math.sin(hook.angle) * hook.length;
        p.pos.y = hook.anchor.y - Math.cos(hook.angle) * hook.length;

        // 선 속도 계산
        p.vel.x = Math.cos(hook.angle) * hook.angularVel * hook.length;
        p.vel.y = Math.sin(hook.angle) * hook.angularVel * hook.length;

        // 스틱맨 회전각 동기화
        p.rotZ = -hook.angle;

        // 와이어 라인 렌더링
        if (hook.lineMesh) {
          const posAttr = hook.lineMesh.geometry.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(0, hook.anchor.x, hook.anchor.y, 0);
          posAttr.setXYZ(1, p.pos.x, p.pos.y, 0);
          posAttr.needsUpdate = true;
          hook.lineMesh.visible = true;
        }
      } else {
        if (hook.lineMesh) hook.lineMesh.visible = false;

        // 자유 비행 물리
        p.vel.y -= 22 * dt; // 중력
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;

        // 공중제비 롤링
        p.rotZ -= 7 * dt;

        // 시작 플랫폼 착지 검사
        if (p.pos.x >= -2 && p.pos.x <= 20 && p.pos.y <= 1.5 && p.vel.y <= 0) {
          p.pos.y = 1.5;
          p.vel.y = 0;
          p.vel.x = Math.max(8.0, p.vel.x);
          p.rotZ = 0;
        }

        // 트램펄린 바운스 검사
        stateRef.current.trampolines.forEach((tr) => {
          if (p.pos.x >= tr.x - tr.w / 2 && p.pos.x <= tr.x + tr.w / 2) {
            if (p.pos.y >= tr.y - 0.4 && p.pos.y <= tr.y + 0.8 && p.vel.y <= 0) {
              p.pos.y = tr.y + 0.6;
              p.vel.y = 18.0; // 슈퍼 바운스!
              p.vel.x = Math.max(10.0, p.vel.x * 1.1);
              spawnSparks(new THREE.Vector3(tr.x, tr.y, 0), 0xff007f, 18);
              if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              if (navigator.vibrate) navigator.vibrate([30, 40]);
            }
          }
        });
      }

      // 2. 스타 코인 수집
      stateRef.current.stars.forEach((star) => {
        if (!star.collected) {
          star.mesh.rotation.y += 3.0 * dt;
          const dist = p.pos.distanceTo(new THREE.Vector3(star.x, star.y, 0));
          if (dist < 1.4) {
            star.collected = true;
            star.mesh.visible = false;
            setScore((s) => s + 50);
            spawnSparks(new THREE.Vector3(star.x, star.y, 0), 0xfacc15, 12);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            if (navigator.vibrate) navigator.vibrate(20);
          }
        }
      });

      // 3. 결승선 통과 검사 (X >= 105m)
      if (p.pos.x >= 105 && !isVictory && !isGameOver) {
        handleVictory();
      }

      // 4. 낙하 리스폰 검사 (Y < -9m)
      if (p.pos.y < -9 && !isGameOver && !isVictory) {
        hook.active = false;
        setIsHooked(false);
        // 안전 위치로 리스폰
        p.pos.set(Math.max(2, p.pos.x - 15), 5.0, 0);
        p.vel.set(8.5, 4.0, 0);
        spawnSparks(p.pos, 0xef4444, 15);
      }

      // 진행도 업데이트
      const pct = Math.min(100, Math.max(0, Math.floor((p.pos.x / 105) * 100)));
      setProgressPct(pct);

      // 스틱맨 메쉬 위치 & 회전 동기화
      stickmanGroup.position.set(p.pos.x, p.pos.y, 0);
      stickmanGroup.rotation.z = p.rotZ;

      // 카메라 사이드뷰 부드러운 트래킹
      camera.position.x += (p.pos.x + 3.5 - camera.position.x) * 0.12;
      camera.position.y += (Math.max(4.5, p.pos.y + 1.5) - camera.position.y) * 0.08;
      camera.lookAt(p.pos.x + 1.5, p.pos.y + 0.8, 0);

      // 파티클 업데이트
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

    // 훅 액션 시작
    const startHookAction = () => {
      const p = stateRef.current.player;
      const hook = stateRef.current.hook;
      stateRef.current.isHoldingHook = true;

      // 전방 가장 가까운 앵커 찾기 (거리 < 13.5m)
      let targetAnchor: HookAnchor | null = null;
      let minD = 13.5;

      stateRef.current.anchors.forEach((a) => {
        const d = Math.hypot(p.pos.x - a.x, p.pos.y - a.y);
        // 플레이어보다 앞쪽 또는 근처에 있는 앵커 우선
        if (d < minD && a.x > p.pos.x - 3.0) {
          minD = d;
          targetAnchor = a;
        }
      });

      if (targetAnchor) {
        hook.active = true;
        hook.anchor = targetAnchor;
        hook.length = minD;
        hook.angle = Math.atan2(p.pos.x - (targetAnchor as HookAnchor).x, (targetAnchor as HookAnchor).y - p.pos.y);
        hook.angularVel = (p.vel.x / minD) * 1.6;
        setIsHooked(true);

        spawnSparks(new THREE.Vector3((targetAnchor as HookAnchor).x, (targetAnchor as HookAnchor).y, 0), 0x00f3ff, 14);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        if (navigator.vibrate) navigator.vibrate(30);
      }
    };

    // 훅 액션 해제
    const releaseHookAction = () => {
      stateRef.current.isHoldingHook = false;
      const hook = stateRef.current.hook;
      const p = stateRef.current.player;

      if (hook.active) {
        hook.active = false;
        setIsHooked(false);
        // 강력한 도약 가속
        p.vel.x = Math.max(p.vel.x, 9.0);
        p.vel.y = Math.max(p.vel.y, 4.0);
        spawnSparks(p.pos, 0x38bdf8, 12);
        if (navigator.vibrate) navigator.vibrate(25);
      }
    };

    // 승리 처리
    const handleVictory = () => {
      setIsVictory(true);
      const finalScore = score + 1200;
      setScore(finalScore);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'poki_stickman_hook',
        gameTitle: 'Stickman Hook 3D',
        durationSeconds: 40,
        score: finalScore,
        maxTargetScore: 1800,
        isVictory: true,
      });
      setSettlementReceipt(receipt);
      if (onRewardRef.current) onRewardRef.current(receipt.totalSns);
    };

    (container as any).__startHook = startHookAction;
    (container as any).__releaseHook = releaseHookAction;

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

  // 터치 핸들러
  const handleTouchStart = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__startHook) {
      (containerRef.current as any).__startHook();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__releaseHook) {
      (containerRef.current as any).__releaseHook();
    }
  }, []);

  // 튜토리얼 스텝
  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '스틱맨 훅 3D 와이어 액션' : 'Stickman Hook 3D Action',
      badge: 'HOOK 3D',
      description: isKo
        ? '공중에 떠 있는 네온 앵커에 와이어를 걸어 시계추 스윙으로 가속하고 피니시 라인에 도달하세요!'
        : 'Hook onto glowing anchors to swing like a pendulum and race toward the finish line!',
      keyPoints: isKo
        ? ['화면을 길게 누르면 와이어 걸기 & 스윙', '손을 떼면 전방으로 높이 도약']
        : ['Hold screen to hook & swing', 'Release to launch forward with high momentum'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '트램펄린 & 연속 점프' : 'Trampolines & Chain Swings',
      badge: 'CONTROLS',
      description: isKo
        ? '바닥의 빨간 트램펄린을 밟으면 슈퍼 바운스로 튀어 오르며 다시 공중으로 도약합니다.'
        : 'Bounce on red trampolines for super jumps and chain multiple swings together!',
      keyPoints: isKo
        ? ['우측 80px [훅] 버튼으로 원터치 편의 조작', '황금 스타 코인을 모아 추가 점수를 획득하세요']
        : ['80px [HOOK] button for easy one-thumb controls', 'Collect golden star coins for extra score'],
      iconType: 'GESTURES',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#e3dbfc] font-mono"
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onTouchStart={(e) => { e.preventDefault(); handleTouchStart(); }}
      onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(); }}
    >
      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="Stickman Hook 3D"
        score={score}
        targetScore={1500}
        timeLeft={0}
        onQuit={handleExit}
        isKo={isKo}
        rewardUnit="SNS"
        customStatLabel={isKo ? '피니시 진행' : 'FINISH'}
        customStatValue={`${progressPct}% (105m)`}
      />

      {/* 영웅 카드 배지 & 스윙 상태 HUD */}
      <div className="absolute top-16 left-4 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 border border-cyan-500/40">
        <canvas ref={heroSpriteCanvasRef} width={40} height={40} className="w-10 h-10 border border-cyan-400 bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-[10px] text-cyan-300 font-bold">{isKo ? '스틱맨 훅 레이서' : 'STICKMAN HOOK'}</span>
          <span className="text-xs text-slate-300">
            {isHooked ? '🪝 SWINGING' : '⚡ AIR FLIP'}
          </span>
        </div>
      </div>

      {/* 훅 스윙 상태 오버레이 */}
      {isHooked && (
        <div className="absolute top-16 right-4 z-20 bg-cyan-950/80 backdrop-blur-md px-3 py-1.5 border border-cyan-400 text-xs font-black text-cyan-300 animate-pulse">
          🪝 HOOKED & SWINGING!
        </div>
      )}

      {/* 우측 하단 대형 훅 버튼 (80px 최적 터치 타깃) */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
        <button
          type="button"
          onMouseDown={(e) => { e.stopPropagation(); handleTouchStart(); }}
          onMouseUp={(e) => { e.stopPropagation(); handleTouchEnd(); }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(); }}
          onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd(); }}
          className={`w-20 h-20 rounded-sm border-2 font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-lg transition-transform ${
            isHooked
              ? 'bg-cyan-500 border-cyan-200 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.8)]'
              : 'bg-slate-900/90 border-cyan-400 text-cyan-300 active:bg-cyan-700'
          }`}
        >
          <span className="text-2xl">🪝</span>
          <span className="mt-0.5 tracking-wider font-extrabold">{isKo ? '훅' : 'HOOK'}</span>
        </button>
      </div>

      {/* 좌측 하단 데스크톱 가이드 */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:block text-slate-400 text-xs bg-slate-900/80 px-3 py-2 border border-slate-700">
        <div>[화면 홀드 / Space]: 훅 와이어 스윙</div>
        <div>[화면 릴리즈]: 와이어 해제 & 도약</div>
      </div>

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_stickman_hook', 'true');
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
            <h2 className="text-2xl font-black text-red-500 mb-2">{isKo ? '도전 실패' : 'FAILED'}</h2>
            <p className="text-slate-300 text-sm mb-4">
              {isKo ? '결승선에 도달하지 못했습니다!' : 'Failed to reach the finish gate!'}
            </p>
            <div className="bg-slate-800 p-3 mb-4 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>{isKo ? '도달 진행도' : 'Progress'}:</span>
                <span className="text-cyan-400 font-bold">{progressPct}% (105m)</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최종 점수' : 'Score'}:</span>
                <span className="text-amber-400 font-bold">{score}</span>
              </div>
              {settlementReceipt && (
                <div className="flex justify-between text-cyan-300 pt-1 border-t border-slate-700">
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

export default PokiStickmanHookGame;
