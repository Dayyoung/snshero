import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSliceMasterGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;
}

interface SliceItem {
  id: number;
  x: number;
  y: number;
  type: 'watermelon' | 'orange' | 'burger' | 'cheese' | 'bread' | 'spike';
  meshA: THREE.Mesh;
  meshB?: THREE.Mesh;
  group: THREE.Group;
  sliced: boolean;
  sliceProgress: number;
  score: number;
  name: string;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiSliceMasterGame: React.FC<PokiSliceMasterGameProps> = ({
  onBack,
  onExit,
  cardId = 31,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
}) => {
  const handleExit = onExit || onBack || (() => window.history.back());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI 상태
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [slicedCount, setSlicedCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

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

    // 칼날 메쉬 & 물리
    knifeGroup: null as THREE.Group | null,
    x: 4.0, // 시작 안전 안착 구간
    y: 1.8,
    vx: 0,
    vy: 0,
    angle: -0.3, // 라디안
    angularVel: 0,
    stuck: true, // 시작 시 지면에 안전하게 꽂혀있음
    stuckPlatformY: 0.8,

    // 게임 상태
    score: 0,
    combo: 0,
    slicedCount: 0,
    items: [] as SliceItem[],
    particles: [] as Particle[],
    isEnded: false,
    trackLength: 85,
  });

  // 점프 플립 실행
  const handleFlip = useCallback(() => {
    const g = gameRef.current;
    if (g.isEnded) return;

    // 플립 가속도 부여
    g.vy = 9.8;
    g.vx = 5.2;
    g.angularVel = -9.2; // 시계방향 회전
    g.stuck = false;

    triggerHaptic(20);
    playSfx?.('whoosh');
  }, [triggerHaptic, playSfx]);

  // 게임 종료 및 정산
  const finishGame = useCallback((won: boolean, finalScore: number) => {
    const g = gameRef.current;
    if (g.isEnded) return;
    g.isEnded = true;
    setIsPlaying(false);
    setGameOver(!won);
    setIsVictory(won);

    const deposit = calculateAndDepositMissionReward({
      gameId: 'poki_slice_master',
      gameTitle: 'Slice Master 3D',
      durationSeconds: 25,
      score: finalScore,
      maxTargetScore: 1200,
      isVictory: won,
    });
    setRewardResult(deposit);
    triggerHaptic(won ? [50, 100, 150] : [150, 80]);
    if (won) playSfx?.('victory');
    else playSfx?.('defeat');
  }, [triggerHaptic, playSfx]);

  // Three.js 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181824);
    scene.fog = new THREE.FogExp2(0x181824, 0.015);

    // Camera (사이드 쿼터 뷰)
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(4, 4.5, 11);

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

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(20, 25, 15);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // ==========================================
    // 3D 롱 트랙 & 환경
    // ==========================================
    const trackLen = 95;
    const trackGeo = new THREE.BoxGeometry(trackLen, 1.0, 3.2);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.1,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.position.set(trackLen / 2 - 2, 0.5, 0);
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // 트랙 사이드 네온 가이드 레일
    const railMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(trackLen, 0.15, 0.15), railMat);
    railL.position.set(trackLen / 2 - 2, 1.05, 1.6);
    scene.add(railL);

    const railR = new THREE.Mesh(new THREE.BoxGeometry(trackLen, 0.15, 0.15), railMat);
    railR.position.set(trackLen / 2 - 2, 1.05, -1.6);
    scene.add(railR);

    // 트랙 하단 심연 그리드
    const gridHelper = new THREE.GridHelper(120, 60, 0x475569, 0x1e293b);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // ==========================================
    // 결승 배율 보너스 타워 (End Gate Multiplier)
    // ==========================================
    const endX = 82;
    const towerGeo = new THREE.BoxGeometry(3.0, 10.0, 2.5);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5 });
    const endTower = new THREE.Mesh(towerGeo, towerMat);
    endTower.position.set(endX, 5.0, 0);
    scene.add(endTower);

    // 배율 슬롯들 (x2, x3, x5, x10)
    const multColors = [0x22c55e, 0x3b82f6, 0xf59e0b, 0xec4899];
    const multValues = [2, 3, 5, 10];
    for (let i = 0; i < 4; i++) {
      const slotGeo = new THREE.BoxGeometry(3.2, 1.8, 2.6);
      const slotMat = new THREE.MeshStandardMaterial({ color: multColors[i], roughness: 0.3 });
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.set(endX, 1.5 + i * 2.2, 0);
      scene.add(slot);
    }

    // ==========================================
    // 3D 나이프(Knife) 모델링 & No.031 영웅 배지
    // ==========================================
    const knifeGroup = new THREE.Group();

    // 1. 칼날 (Blade): 날렵한 은빛 사다리꼴 메쉬
    const bladeGeo = new THREE.BoxGeometry(0.24, 1.3, 0.05);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.15,
    });
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.position.y = 0.55;
    bladeMesh.castShadow = true;
    knifeGroup.add(bladeMesh);

    // 예리한 칼날 엣지
    const edgeGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.1 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.z = Math.PI;
    edge.position.set(-0.06, 1.3, 0);
    knifeGroup.add(edge);

    // 2. 가드 (Hilt Guard)
    const guardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.14), guardMat);
    guard.position.y = -0.1;
    knifeGroup.add(guard);

    // 3. 우드 핸들 (Handle)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.75, 12), handleMat);
    handle.position.y = -0.52;
    handle.castShadow = true;
    knifeGroup.add(handle);

    // 4. 공식 영웅 카드 스프라이트 HUD 배지
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
    badgeSprite.position.set(0, 0.6, 0.3);
    badgeSprite.scale.set(0.7, 0.7, 1);
    knifeGroup.add(badgeSprite);

    // 시작 지점: 안전하게 트랙 위에 꽂힌 상태로 안착
    knifeGroup.position.set(4.0, 1.8, 0);
    knifeGroup.rotation.z = -0.35;
    scene.add(knifeGroup);

    // ==========================================
    // 슬라이스 타깃 아이템 생성 (과일, 버거, 스파이크 등 24개)
    // ==========================================
    const items: SliceItem[] = [];
    const itemLayouts: { x: number; type: SliceItem['type']; score: number; name: string }[] = [
      { x: 9.0, type: 'watermelon', score: 100, name: '수박' },
      { x: 13.5, type: 'orange', score: 80, name: '오렌지' },
      { x: 17.5, type: 'burger', score: 120, name: '햄버거' },
      { x: 21.0, type: 'spike', score: 0, name: '스파이크' },
      { x: 25.0, type: 'cheese', score: 90, name: '치즈' },
      { x: 28.5, type: 'watermelon', score: 100, name: '수박' },
      { x: 32.5, type: 'bread', score: 70, name: '식빵' },
      { x: 36.0, type: 'spike', score: 0, name: '스파이크' },
      { x: 40.0, type: 'orange', score: 80, name: '오렌지' },
      { x: 43.5, type: 'burger', score: 120, name: '햄버거' },
      { x: 47.0, type: 'cheese', score: 90, name: '치즈' },
      { x: 50.5, type: 'spike', score: 0, name: '스파이크' },
      { x: 54.0, type: 'watermelon', score: 100, name: '수박' },
      { x: 57.5, type: 'bread', score: 70, name: '식빵' },
      { x: 61.0, type: 'orange', score: 80, name: '오렌지' },
      { x: 64.5, type: 'spike', score: 0, name: '스파이크' },
      { x: 68.0, type: 'burger', score: 120, name: '햄버거' },
      { x: 72.0, type: 'cheese', score: 90, name: '치즈' },
      { x: 76.0, type: 'watermelon', score: 150, name: '황금 수박' },
    ];

    itemLayouts.forEach((data, idx) => {
      const iGroup = new THREE.Group();
      let meshA: THREE.Mesh;
      let meshB: THREE.Mesh | undefined;

      if (data.type === 'watermelon') {
        const melonMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
        meshA = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), melonMat);
        meshA.castShadow = true;
        iGroup.add(meshA);
      } else if (data.type === 'orange') {
        const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
        meshA = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 14), orangeMat);
        meshA.castShadow = true;
        iGroup.add(meshA);
      } else if (data.type === 'burger') {
        const bunMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
        meshA = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.6, 12), bunMat);
        meshA.castShadow = true;
        iGroup.add(meshA);
      } else if (data.type === 'cheese') {
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
        meshA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.7), cheeseMat);
        meshA.castShadow = true;
        iGroup.add(meshA);
      } else if (data.type === 'bread') {
        const breadMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
        meshA = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.55), breadMat);
        meshA.castShadow = true;
        iGroup.add(meshA);
      } else {
        // 스파이크 함정 (보라색 네온 가시)
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.5 });
        meshA = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 8), spikeMat);
        meshA.position.y = 0.6;
        meshA.castShadow = true;
        iGroup.add(meshA);
      }

      iGroup.position.set(data.x, 1.45, 0);
      scene.add(iGroup);

      items.push({
        id: idx,
        x: data.x,
        y: 1.45,
        type: data.type,
        meshA,
        group: iGroup,
        sliced: false,
        sliceProgress: 0,
        score: data.score,
        name: data.name,
      });
    });

    // 레퍼런스 등록
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.knifeGroup = knifeGroup;
    g.items = items;
    g.particles = [];
    g.score = 0;
    g.combo = 0;
    g.slicedCount = 0;
    g.isEnded = false;
    g.x = 4.0;
    g.y = 1.8;
    g.vx = 0;
    g.vy = 0;
    g.angle = -0.35;
    g.angularVel = 0;
    g.stuck = true;

    // ==========================================
    // 애니메이션 프레임 루프
    // ==========================================
    let lastTime = performance.now();

    const animate = (now: number) => {
      g.animFrameId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      if (!g.isEnded && isPlaying) {
        // ------------------------------------
        // 나이프 물리 시뮬레이션
        // ------------------------------------
        if (!g.stuck) {
          g.vy -= 24 * dt; // 중력
          g.x += g.vx * dt;
          g.y += g.vy * dt;
          g.angle += g.angularVel * dt;

          // 칼날 끝(Tip) 위치 계산 (길이 1.2m)
          const tipX = g.x + Math.sin(-g.angle) * 1.1;
          const tipY = g.y + Math.cos(g.angle) * 1.1;

          // 지면(트랙 상단 Y = 1.0) 충돌 판정
          const groundY = 1.0;
          if (tipY <= groundY) {
            // 칼날 각도 확인 (칼끝이 아래쪽을 향하고 있는지)
            const isPointingDown = Math.cos(g.angle) < 0;

            if (isPointingDown && g.vy < 0) {
              // 착-! 완벽하게 꽂힘!
              g.stuck = true;
              g.y = groundY + Math.abs(Math.cos(g.angle)) * 0.8;
              g.vx = 0;
              g.vy = 0;
              g.angularVel = 0;
              triggerHaptic([30, 20]);
              playSfx?.('hit');
            } else {
              // 둔탁하게 튕김
              g.vy = Math.max(4, -g.vy * 0.45);
              g.angularVel *= 0.6;
              triggerHaptic(15);
            }
          }

          // 트랙 아래로 추락 판정 (Y < -2.0)
          if (g.y < -2.0) {
            finishGame(false, g.score);
            return;
          }

          // ------------------------------------
          // 아이템 슬라이스 판정
          // ------------------------------------
          for (const item of g.items) {
            if (item.sliced) continue;

            const dist = Math.hypot(g.x - item.x, g.y - item.y);
            if (dist < 1.1) {
              if (item.type === 'spike') {
                // 스파이크 접촉 실패!
                triggerHaptic([100, 150]);
                playSfx?.('defeat');
                finishGame(false, g.score);
                return;
              }

              // 성공적 슬라이스!
              item.sliced = true;
              g.slicedCount++;
              setSlicedCount(g.slicedCount);

              g.combo++;
              setCombo(g.combo);

              const gained = item.score * Math.min(4, 1 + Math.floor(g.combo / 3));
              g.score += gained;
              setScore(g.score);

              triggerHaptic([25, 35]);
              playSfx?.('coin');

              // 과즙/파편 파티클 18개 분출
              for (let p = 0; p < 18; p++) {
                const pColor = item.type === 'watermelon' ? 0xef4444 : item.type === 'orange' ? 0xf97316 : 0xfacc15;
                const pMat = new THREE.MeshBasicMaterial({ color: pColor });
                const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), pMat);
                pMesh.position.set(item.x, item.y, 0);
                scene.add(pMesh);
                g.particles.push({
                  mesh: pMesh,
                  vx: (Math.random() - 0.5) * 8 + (Math.random() > 0.5 ? 2 : -2),
                  vy: Math.random() * 8 + 2,
                  vz: (Math.random() - 0.5) * 6,
                  life: 0,
                  maxLife: 0.55,
                });
              }
            }
          }

          // ------------------------------------
          // 결승 배율 타워 적중 검사
          // ------------------------------------
          if (g.x >= endX - 0.8) {
            // 배율 계산 (꽂힌 Y 높이에 따라 배율 결정)
            let mult = 2;
            if (g.y >= 7.5) mult = 10;
            else if (g.y >= 5.5) mult = 5;
            else if (g.y >= 3.5) mult = 3;

            setMultiplier(mult);
            const finalScore = g.score * mult;
            setScore(finalScore);
            g.stuck = true;
            finishGame(true, finalScore);
            return;
          }
        }

        // 나이프 그룹 위치 및 회전 반영
        if (g.knifeGroup) {
          g.knifeGroup.position.set(g.x, g.y, 0);
          g.knifeGroup.rotation.z = g.angle;
        }

        // 슬라이스된 아이템 분리 애니메이션
        for (const item of g.items) {
          if (item.sliced && item.sliceProgress < 1.0) {
            item.sliceProgress += dt * 3;
            item.group.position.y -= dt * 2.5;
            item.group.rotation.z += dt * 5;
            item.group.scale.multiplyScalar(0.95);
            if (item.sliceProgress >= 1.0) {
              scene.remove(item.group);
            }
          }
        }

        // 파티클 시뮬레이션
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const p = g.particles[i];
          p.life += dt;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.vy -= 18 * dt;

          if (p.life >= p.maxLife) {
            scene.remove(p.mesh);
            g.particles.splice(i, 1);
          }
        }
      }

      // 카메라 추종 (나이프 X축 따라 부드럽게 전진)
      if (g.camera) {
        const targetCamX = g.x + 3.0;
        const targetCamY = Math.max(3.8, g.y + 1.8);
        g.camera.position.x = THREE.MathUtils.lerp(g.camera.position.x, targetCamX, 0.14);
        g.camera.position.y = THREE.MathUtils.lerp(g.camera.position.y, targetCamY, 0.1);
        g.camera.lookAt(g.x + 2.0, targetCamY - 1.0, 0);
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
  }, [lowSpecMode, cardId, isPlaying, finishGame, playSfx, triggerHaptic]);

  // 키보드 조작 (Space / Click)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleFlip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip]);

  // 화면 터치 탭 플립
  const handleScreenTap = () => {
    if (isPlaying) {
      handleFlip();
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-black text-white font-mono"
      onClick={handleScreenTap}
    >
      {/* Three.js 3D 뷰포트 컨테이너 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미니멀 HUD 헤더 */}
      <MinimalistMissionHUD
        gameTitle="Slice Master 3D"
        score={score}
        onQuit={() => finishGame(false, score)}
      />

      {/* 상단 통계 & 콤보 오버레이 */}
      <div className="absolute top-14 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-sm border border-cyan-500/40 text-xs font-bold text-cyan-300">
            🔪 슬라이스: <strong className="text-white text-sm">{slicedCount}</strong>개
          </div>
          {combo > 1 && (
            <div className="px-2.5 py-0.5 bg-pink-600/80 rounded-sm text-[11px] font-black text-white animate-pulse">
              🔥 {combo} COMBO!
            </div>
          )}
        </div>

        {/* 결승 배율 정보 */}
        <div className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-sm border border-amber-500/40 text-xs font-bold text-amber-300">
          🎯 결승 배율: <strong className="text-yellow-400 text-sm">x{multiplier}</strong>
        </div>
      </div>

      {/* 우측 하단 대형 80px [🔪 FLIP] 버튼 */}
      <div className="absolute bottom-8 right-8 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleFlip();
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 border-2 border-cyan-200 text-white flex flex-col items-center justify-center transition-transform active:scale-90 shadow-2xl"
        >
          <span className="text-2xl leading-none">🔪</span>
          <span className="text-xs font-black tracking-tight mt-1">FLIP</span>
        </button>
      </div>

      {/* 좌측 하단 탭 가이드 인디케이터 */}
      {isPlaying && (
        <div className="absolute bottom-8 left-8 pointer-events-none z-10 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full border border-white/10 text-zinc-300 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          화면 어디든 탭하여 점프 플립 회전!
        </div>
      )}

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Slice Master 3D"
        description="화면을 탭하여 칼날을 플립 회전시키며 모든 과일과 음식을 두 동강 내세요!"
        features={[
          {
            iconType: 'GOAL',
            title: '슬라이스 & 결승 배율 타깃',
            desc: '트랙 위의 수박, 버거, 치즈를 베고 결승선의 높은 배율 슬롯(최대 x10)에 칼을 꽂으세요.',
          },
          {
            iconType: 'GESTURES',
            title: '원터치 탭 플립',
            desc: '화면을 탭하면 칼이 점프하며 회전합니다. 칼끝이 지면에 닿으면 착! 꽂힙니다.',
          },
          {
            iconType: 'REWARDS',
            title: 'SNS 보상 정산',
            desc: '결승 타깃에 성공적으로 꽂히면 최대 50 SNS 포인트 및 랭킹 점수가 지급됩니다.',
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

export default PokiSliceMasterGame;
