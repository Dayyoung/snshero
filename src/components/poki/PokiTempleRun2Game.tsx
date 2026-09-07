import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiTempleRun2GameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;
}

interface Obstacle3D {
  mesh: THREE.Group;
  lane: number;
  z: number;
  type: 'hurdle' | 'flame' | 'gap';
  cleared: boolean;
}

interface Coin3D {
  mesh: THREE.Mesh;
  lane: number;
  z: number;
  collected: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiTempleRun2Game: React.FC<PokiTempleRun2GameProps> = ({
  onBack,
  onExit,
  cardId = 36,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
}) => {
  const handleExit = onExit || onBack || (() => window.history.back());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI 상태
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [distance, setDistance] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [score, setScore] = useState(0);
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

  // 레인 설정 (-1.6m, 0m, 1.6m)
  const lanePositions = [-1.6, 0, 1.6];

  // 게임 로직 레퍼런스
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrameId: 0,

    // 플레이어
    playerGroup: null as THREE.Group | null,
    currentLane: 1, // 0, 1, 2
    playerX: 0,
    playerY: 0,
    playerZ: 0,
    targetX: 0,
    isJumping: false,
    jumpTimer: 0,
    isSliding: false,
    slideTimer: 0,

    // 추격 몬스터 (데몬 몽키)
    monsterGroup: null as THREE.Group | null,

    // 환경 & 트랙 타일
    trackTiles: [] as THREE.Mesh[],
    obstacles: [] as Obstacle3D[],
    coins: [] as Coin3D[],
    particles: [] as Particle[],

    // 물리 & 달리기
    speed: 16.0,
    distanceRun: 0,
    coinsCollected: 0,
    score: 0,
    isEnded: false,
    startTime: 0,

    // 터치 스와이프 감지
    touchStartX: 0,
    touchStartY: 0,
  });

  // 점프 실행
  const handleJump = useCallback(() => {
    const g = gameRef.current;
    if (!g.isJumping && !g.isSliding && !g.isEnded) {
      g.isJumping = true;
      g.jumpTimer = 0;
      triggerHaptic(20);
      playSfx?.('jump');
    }
  }, [triggerHaptic, playSfx]);

  // 슬라이딩 실행
  const handleSlide = useCallback(() => {
    const g = gameRef.current;
    if (!g.isJumping && !g.isSliding && !g.isEnded) {
      g.isSliding = true;
      g.slideTimer = 0.65;
      triggerHaptic(18);
      playSfx?.('whoosh');
    }
  }, [triggerHaptic, playSfx]);

  // 레인 이동
  const handleLaneChange = useCallback((dir: -1 | 1) => {
    const g = gameRef.current;
    if (g.isEnded) return;
    const nextLane = Math.max(0, Math.min(2, g.currentLane + dir));
    if (nextLane !== g.currentLane) {
      g.currentLane = nextLane;
      g.targetX = lanePositions[nextLane];
      triggerHaptic(15);
      playSfx?.('pop');
    }
  }, [triggerHaptic, playSfx, lanePositions]);

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
      gameId: 'poki_temple_run_2',
      gameTitle: 'Temple Run 2 3D',
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

  // Three.js 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a120c); // 신전 일몰 황혼
    scene.fog = new THREE.FogExp2(0x1a120c, 0.016);

    // Camera (후방 3인칭 추종)
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 6.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.7);
    scene.add(ambientLight);

    const torchLight = new THREE.PointLight(0xf97316, 1.8, 25);
    torchLight.position.set(0, 4, 0);
    scene.add(torchLight);

    const sunLight = new THREE.DirectionalLight(0xfbbf24, 1.1);
    sunLight.position.set(10, 25, -15);
    scene.add(sunLight);

    // ==========================================
    // 3D 신전 트랙 타일 (무한 루핑 리사이클링 8개)
    // ==========================================
    const trackTiles: THREE.Mesh[] = [];
    const tileLength = 16;
    const tileGeo = new THREE.BoxGeometry(5.2, 1.2, tileLength);
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0x44403c, // 고대 석조 타일
      roughness: 0.8,
      metalness: 0.1,
    });

    for (let i = 0; i < 8; i++) {
      const tile = new THREE.Mesh(tileGeo, tileMat);
      tile.position.set(0, -0.6, -i * tileLength);
      tile.receiveShadow = true;
      scene.add(tile);
      trackTiles.push(tile);
    }

    // ==========================================
    // 3D 탐험가 러너 아바타 & No.036 영웅 배지
    // ==========================================
    const playerGroup = new THREE.Group();

    // 몸통 (카키색 탐험복)
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.6 });
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), pBodyMat);
    pBody.position.y = 0.95;
    pBody.castShadow = true;
    playerGroup.add(pBody);

    // 머리 & 모자
    const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
    const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), pHeadMat);
    pHead.position.y = 1.7;
    pHead.castShadow = true;
    playerGroup.add(pHead);

    const hatMat = new THREE.MeshStandardMaterial({ color: 0x713f12 });
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.18, 12), hatMat);
    hat.position.y = 2.0;
    playerGroup.add(hat);

    // 팔 2개
    const pArmL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.7, 0.24), pBodyMat);
    pArmL.position.set(-0.48, 0.85, 0);
    playerGroup.add(pArmL);

    const pArmR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.7, 0.24), pBodyMat);
    pArmR.position.set(0.48, 0.85, 0);
    playerGroup.add(pArmR);

    // 다리 2개
    const pLegMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.7 });
    const pLegL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.65, 0.26), pLegMat);
    pLegL.position.set(-0.2, 0.32, 0);
    playerGroup.add(pLegL);

    const pLegR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.65, 0.26), pLegMat);
    pLegR.position.set(0.2, 0.32, 0);
    playerGroup.add(pLegR);

    // 공식 영웅 카드 스프라이트 HUD 배지 No.036
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
    badgeSprite.position.set(0, 2.6, 0);
    badgeSprite.scale.set(1.1, 1.1, 1);
    playerGroup.add(badgeSprite);

    playerGroup.position.set(0, 0, 0);
    scene.add(playerGroup);

    // ==========================================
    // 3D 추격 몬스터 (거대 데몬 몽키)
    // ==========================================
    const monsterGroup = new THREE.Group();
    const mMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const mBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.2), mMat);
    mBody.position.y = 1.6;
    monsterGroup.add(mBody);

    // 붉은 발광 눈
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeMat);
    eyeL.position.set(-0.4, 2.2, -0.6);
    monsterGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeMat);
    eyeR.position.set(0.4, 2.2, -0.6);
    monsterGroup.add(eyeR);

    monsterGroup.position.set(0, 0, 5.8);
    scene.add(monsterGroup);

    // ==========================================
    // 장애물 & 코인 생성
    // ==========================================
    const obstacles: Obstacle3D[] = [];
    const coins: Coin3D[] = [];

    // 시작 25m는 안전 안착 구간 (-25m 이후부터 장애물 스폰)
    for (let i = 0; i < 18; i++) {
      const zPos = -30 - i * 22;
      const lane = Math.floor(Math.random() * 3);
      const isHurdle = i % 2 === 0;

      const oGroup = new THREE.Group();
      if (isHurdle) {
        // 통나무 허들
        const logMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.5, 8).rotateZ(Math.PI / 2), logMat);
        log.position.y = 0.35;
        log.castShadow = true;
        oGroup.add(log);
      } else {
        // 불타는 석조 기둥/아치
        const archMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.6 });
        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 0.35), archMat);
        postL.position.set(-0.7, 1.4, 0);
        oGroup.add(postL);

        const postR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 0.35), archMat);
        postR.position.set(0.7, 1.4, 0);
        oGroup.add(postR);

        const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.4), archMat);
        topBar.position.set(0, 2.6, 0);
        oGroup.add(topBar);

        // 화염 메쉬
        const fire = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        fire.position.set(0, 2.1, 0);
        oGroup.add(fire);
      }

      oGroup.position.set(lanePositions[lane], 0, zPos);
      scene.add(oGroup);

      obstacles.push({
        mesh: oGroup,
        lane,
        z: zPos,
        type: isHurdle ? 'hurdle' : 'flame',
        cleared: false,
      });

      // 코인 행렬
      const coinLane = (lane + 1) % 3;
      for (let c = 0; c < 3; c++) {
        const cGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 12).rotateX(Math.PI / 2);
        const cMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        const cz = zPos - 4 - c * 2.5;
        cMesh.position.set(lanePositions[coinLane], 0.7, cz);
        scene.add(cMesh);

        coins.push({
          mesh: cMesh,
          lane: coinLane,
          z: cz,
          collected: false,
        });
      }
    }

    // 레퍼런스 등록
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.playerGroup = playerGroup;
    g.monsterGroup = monsterGroup;
    g.trackTiles = trackTiles;
    g.obstacles = obstacles;
    g.coins = coins;
    g.particles = [];
    g.speed = 16.0;
    g.distanceRun = 0;
    g.coinsCollected = 0;
    g.score = 0;
    g.currentLane = 1;
    g.playerX = 0;
    g.targetX = 0;
    g.playerY = 0;
    g.playerZ = 0;
    g.isJumping = false;
    g.isSliding = false;
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
        // 거리 누적
        g.distanceRun += g.speed * dt;
        setDistance(Math.floor(g.distanceRun));

        // 속도 점진 증가
        g.speed = Math.min(26.0, g.speed + dt * 0.15);

        // 레인 이동 부드럽게 추종
        g.playerX = THREE.MathUtils.lerp(g.playerX, g.targetX, 0.22);

        // 점프 애니메이션 (포물선)
        if (g.isJumping) {
          g.jumpTimer += dt * 3.8;
          g.playerY = Math.sin(g.jumpTimer) * 2.2;
          if (g.jumpTimer >= Math.PI) {
            g.isJumping = false;
            g.playerY = 0;
          }
        }

        // 슬라이딩 애니메이션
        if (g.isSliding) {
          g.slideTimer -= dt;
          if (g.slideTimer <= 0) {
            g.isSliding = false;
          }
        }

        // 플레이어 그룹 변환
        if (g.playerGroup) {
          g.playerGroup.position.set(g.playerX, g.playerY, 0);
          g.playerGroup.scale.set(1, g.isSliding ? 0.45 : 1, 1);
        }

        // 몬스터 추격 발구르기
        if (g.monsterGroup) {
          g.monsterGroup.position.x = g.playerX * 0.7;
          g.monsterGroup.position.y = Math.sin(now * 0.012) * 0.25;
        }

        // ------------------------------------
        // 트랙 타일 무한 루핑
        // ------------------------------------
        for (const tile of g.trackTiles) {
          tile.position.z += g.speed * dt;
          if (tile.position.z > tileLength) {
            tile.position.z -= tileLength * g.trackTiles.length;
          }
        }

        // ------------------------------------
        // 장애물 전진 및 충돌 검사
        // ------------------------------------
        for (const obs of g.obstacles) {
          obs.z += g.speed * dt;
          obs.mesh.position.z = obs.z;

          // 화면 밖으로 지나가면 뒤로 재순환
          if (obs.z > 10) {
            obs.z -= 18 * 22;
            obs.lane = Math.floor(Math.random() * 3);
            obs.mesh.position.x = lanePositions[obs.lane];
            obs.mesh.position.z = obs.z;
            obs.cleared = false;
          }

          // 충돌 검사 (Z 거리 -1.2m ~ 0.8m 이내)
          if (!obs.cleared && obs.z > -1.2 && obs.z < 0.8 && obs.lane === g.currentLane) {
            let hit = false;
            if (obs.type === 'hurdle' && !g.isJumping) {
              hit = true;
            } else if (obs.type === 'flame' && !g.isSliding) {
              hit = true;
            }

            if (hit) {
              // 충돌 실패!
              triggerHaptic([100, 150]);
              playSfx?.('defeat');
              finishGame(false, g.score);
              return;
            } else {
              obs.cleared = true;
              g.score += 50;
              setScore(g.score);
            }
          }
        }

        // ------------------------------------
        // 코인 회전 & 수집 검사
        // ------------------------------------
        for (const coin of g.coins) {
          coin.z += g.speed * dt;
          coin.mesh.position.z = coin.z;
          coin.mesh.rotation.y += dt * 3.5;

          if (coin.z > 10) {
            coin.z -= 18 * 22;
            coin.collected = false;
            coin.mesh.visible = true;
          }

          if (!coin.collected && coin.z > -1.2 && coin.z < 1.0 && coin.lane === g.currentLane) {
            coin.collected = true;
            coin.mesh.visible = false;
            g.coinsCollected++;
            setCoinCount(g.coinsCollected);
            g.score += 20;
            setScore(g.score);

            triggerHaptic(12);
            playSfx?.('coin');

            // 코인 스파크 파티클
            for (let p = 0; p < 8; p++) {
              const pMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
              const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), pMat);
              pMesh.position.set(lanePositions[coin.lane], 0.7, 0);
              scene.add(pMesh);
              g.particles.push({
                mesh: pMesh,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 1,
                vz: (Math.random() - 0.5) * 4,
                life: 0,
                maxLife: 0.35,
              });
            }
          }
        }

        // 500m 돌파 시 완주 승리!
        if (g.distanceRun >= 500) {
          finishGame(true, g.score + 1000);
          return;
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

      // 카메라 부드러운 전방 주시
      if (g.camera && g.playerGroup) {
        g.camera.position.x = THREE.MathUtils.lerp(g.camera.position.x, g.playerX * 0.45, 0.12);
        g.camera.lookAt(g.playerX * 0.3, 1.4, -12);
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
  }, [lowSpecMode, cardId, isPlaying, finishGame, playSfx, triggerHaptic, lanePositions]);

  // 터치 스와이프 인터랙션
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      gameRef.current.touchStartX = e.touches[0].clientX;
      gameRef.current.touchStartY = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - gameRef.current.touchStartX;
      const dy = e.changedTouches[0].clientY - gameRef.current.touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) > 30) {
        if (absX > absY) {
          // 좌/우 스와이프
          if (dx > 0) handleLaneChange(1);
          else handleLaneChange(-1);
        } else {
          // 상/하 스와이프
          if (dy < 0) handleJump();
          else handleSlide();
        }
      }
    }
  };

  // 키보드 조작 (PC 백업)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') handleLaneChange(-1);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') handleLaneChange(1);
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') handleJump();
      if (e.code === 'KeyS' || e.code === 'ArrowDown') handleSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaneChange, handleJump, handleSlide]);

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-black text-white font-mono"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js 3D 뷰포트 컨테이너 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미니멀 HUD 헤더 */}
      <MinimalistMissionHUD
        gameTitle="Temple Run 2 3D"
        score={score}
        onQuit={() => finishGame(false, score)}
      />

      {/* 실시간 달리기 스탯 오버레이 */}
      <div className="absolute top-14 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-sm border border-amber-500/50 text-xs font-bold text-amber-400">
            🏃 질주: <strong className="text-white text-sm">{distance}</strong> m / 500m
          </div>
          <div className="px-3 py-0.5 bg-black/60 rounded-sm text-[11px] text-yellow-300">
            🪙 코인: <strong>{coinCount}</strong>개
          </div>
        </div>

        {/* 500m 완주 진행 바 */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-black text-amber-300">
            {Math.min(100, Math.floor((distance / 500) * 100))}%
          </div>
          <div className="w-28 bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-100"
              style={{ width: `${Math.min(100, (distance / 500) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 하단 퓨어 터치 버튼: 좌/우 레인 이동 (좌측) */}
      <div className="absolute bottom-8 left-6 flex items-center gap-3 z-20">
        <button
          type="button"
          onClick={() => handleLaneChange(-1)}
          className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/50 text-amber-300 flex flex-col items-center justify-center font-black active:scale-95 shadow-lg active:bg-amber-600 active:text-white"
        >
          <span className="text-2xl">⬅️</span>
          <span className="text-[9px]">LEFT</span>
        </button>

        <button
          type="button"
          onClick={() => handleLaneChange(1)}
          className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/50 text-amber-300 flex flex-col items-center justify-center font-black active:scale-95 shadow-lg active:bg-amber-600 active:text-white"
        >
          <span className="text-2xl">➡️</span>
          <span className="text-[9px]">RIGHT</span>
        </button>
      </div>

      {/* 하단 퓨어 터치 버튼: 점프 & 슬라이드 (우측) */}
      <div className="absolute bottom-8 right-6 flex items-end gap-3 z-20">
        <button
          type="button"
          onClick={handleSlide}
          className="w-16 h-16 rounded-full bg-blue-950/80 backdrop-blur-md border border-sky-400 text-sky-200 flex flex-col items-center justify-center font-black active:scale-95 shadow-lg active:bg-sky-600 active:text-white"
        >
          <span className="text-xl">💨</span>
          <span className="text-[9px] mt-0.5">SLIDE</span>
        </button>

        <button
          type="button"
          onClick={handleJump}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 border-2 border-yellow-200 text-white flex flex-col items-center justify-center font-black transition-transform active:scale-90 shadow-2xl"
        >
          <span className="text-2xl leading-none">🦘</span>
          <span className="text-xs font-black tracking-tight mt-1">JUMP</span>
        </button>
      </div>

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Temple Run 2 3D"
        description="거대 데몬 몽키의 추격을 피해 고대 신전 회랑을 질주하세요!"
        features={[
          {
            iconType: 'GOAL',
            title: '500m 신전 탈출 질주',
            desc: '통나무를 점프로 넘고, 불타는 기둥을 슬라이딩으로 피하며 코인을 모으세요.',
          },
          {
            iconType: 'GESTURES',
            title: '스와이프 & 원터치 조작',
            desc: '화면 스와이프(상/하/좌/우) 또는 하단 대형 버튼으로 점프/슬라이딩/레인이동하세요.',
          },
          {
            iconType: 'REWARDS',
            title: 'SNS 보상 정산',
            desc: '질주 거리 및 코인 수에 비례하여 최대 50 SNS 포인트가 지급됩니다.',
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

export default PokiTempleRun2Game;
