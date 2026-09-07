import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCountWarGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;
}

interface MathGate3D {
  z: number;
  leftText: string;
  rightText: string;
  leftOp: (n: number) => number;
  rightOp: (n: number) => number;
  group: THREE.Group;
  passed: boolean;
}

interface EnemyGroup3D {
  z: number;
  count: number;
  group: THREE.Group;
  defeated: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiCountWarGame: React.FC<PokiCountWarGameProps> = ({
  onBack,
  onExit,
  cardId = 38,
  language = 'ko',
  lowSpecMode = false,
  playSfx,
}) => {
  const handleExit = onExit || onBack || (() => window.history.back());
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI 상태
  const [showTutorial, setShowTutorial] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [armyCount, setArmyCount] = useState(5);
  const [bossHp, setBossHp] = useState(120);
  const [score, setScore] = useState(0);
  const [boostBanner, setBoostBanner] = useState<string | null>(null);
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

  // Three.js 게임 로직 레퍼런스
  const gameRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrameId: 0,

    // 군중 지휘관 및 병사들
    commanderGroup: null as THREE.Group | null,
    crowdMeshes: [] as THREE.Group[],
    count: 5,
    playerX: 0,
    playerZ: 0,
    targetX: 0,
    speed: 15.0,

    // 게이트 및 적군
    gates: [] as MathGate3D[],
    enemies: [] as EnemyGroup3D[],
    bossGroup: null as THREE.Group | null,
    bossHp: 120,
    bossMaxHp: 120,
    bossZ: -140,
    inBossFight: false,

    particles: [] as Particle[],
    score: 0,
    isEnded: false,
    startTime: 0,

    // 터치 드래그 상태
    isDragging: false,
    dragStartX: 0,
    playerStartX: 0,
  });

  // 스틱맨 3D 단일 메쉬 생성 헬퍼
  const createStickmanMesh = (color: number): THREE.Group => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });

    // 머리
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), mat);
    head.position.y = 0.95;
    group.add(head);

    // 몸통
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8), mat);
    body.position.y = 0.55;
    group.add(body);

    // 다리 2개
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6), mat);
    legL.position.set(-0.08, 0.18, 0);
    group.add(legL);

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6), mat);
    legR.position.set(0.08, 0.18, 0);
    group.add(legR);

    return group;
  };

  // 군중 수 반영 및 3D 메쉬 동적 재배치
  const updateCrowdMeshes = useCallback((newCount: number) => {
    const g = gameRef.current;
    if (!g.scene || !g.commanderGroup) return;

    g.count = Math.max(1, Math.min(150, newCount));
    setArmyCount(g.count);

    // 기존 잉여 메쉬 제거 또는 추가
    while (g.crowdMeshes.length < g.count) {
      const sm = createStickmanMesh(0x0284c7); // 아군 블루 스틱맨
      g.scene.add(sm);
      g.crowdMeshes.push(sm);
    }
    while (g.crowdMeshes.length > g.count) {
      const sm = g.crowdMeshes.pop();
      if (sm) g.scene.remove(sm);
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

    const timeSpent = Math.max(15, Math.floor((performance.now() - g.startTime) / 1000));
    const deposit = calculateAndDepositMissionReward({
      gameId: 'poki_count_war',
      gameTitle: 'Count War 3D',
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
    scene.background = new THREE.Color(0x0f172a); // 딥 사이버 블루
    scene.fog = new THREE.FogExp2(0x0f172a, 0.014);

    // Camera (후방 쿼터뷰 군중 추종)
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 150);
    camera.position.set(0, 6.5, 9.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    while (container.firstChild) { container.removeChild(container.firstChild); }
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    dirLight.position.set(15, 30, 20);
    scene.add(dirLight);

    // ==========================================
    // 3D 런웨이 트랙 (길이 160m, 폭 7.5m)
    // ==========================================
    const trackLen = 165;
    const trackWidth = 7.5;
    const trackGeo = new THREE.PlaneGeometry(trackWidth, trackLen);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.2,
    });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, -trackLen / 2 + 10);
    scene.add(track);

    // 트랙 양쪽 네온 사이드 가이드 레일
    const railMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, trackLen), railMat);
    railL.position.set(-trackWidth / 2, 0.2, -trackLen / 2 + 10);
    scene.add(railL);

    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, trackLen), railMat);
    railR.position.set(trackWidth / 2, 0.2, -trackLen / 2 + 10);
    scene.add(railR);

    // ==========================================
    // 3D 메인 지휘관 & No.038 공식 영웅 배지
    // ==========================================
    const commanderGroup = new THREE.Group();
    const cmdMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
    const cmdHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), cmdMat);
    cmdHead.position.y = 1.3;
    commanderGroup.add(cmdHead);

    const cmdBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.65, 8), cmdMat);
    cmdBody.position.y = 0.8;
    commanderGroup.add(cmdBody);

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
    badgeSprite.position.set(0, 2.2, 0);
    badgeSprite.scale.set(1.2, 1.2, 1);
    commanderGroup.add(badgeSprite);

    commanderGroup.position.set(0, 0, 0);
    scene.add(commanderGroup);

    // ==========================================
    // 4쌍의 3D 수학 게이트 생성 (Z: -25, -55, -85, -115)
    // ==========================================
    const createGateTextTexture = (text: string, isBlue: boolean): THREE.CanvasTexture => {
      const cvs = document.createElement('canvas');
      cvs.width = 256;
      cvs.height = 128;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isBlue ? '#0284c7' : '#16a34a';
        ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 56px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);
      }
      const tex = new THREE.CanvasTexture(cvs);
      return tex;
    };

    const gateConfigs = [
      { z: -25, left: '+10', right: 'x2', lOp: (n: number) => n + 10, rOp: (n: number) => n * 2 },
      { z: -55, left: 'x3', right: '+15', lOp: (n: number) => n * 3, rOp: (n: number) => n + 15 },
      { z: -85, left: '-5', right: 'x2', lOp: (n: number) => Math.max(1, n - 5), rOp: (n: number) => n * 2 },
      { z: -115, left: '+25', right: 'x3', lOp: (n: number) => n + 25, rOp: (n: number) => n * 3 },
    ];

    const gates: MathGate3D[] = [];

    gateConfigs.forEach((gc) => {
      const gGroup = new THREE.Group();

      // 좌측 게이트 패널
      const lMat = new THREE.MeshBasicMaterial({ map: createGateTextTexture(gc.left, true), transparent: true, opacity: 0.88 });
      const lPanel = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), lMat);
      lPanel.position.set(-1.8, 1.2, 0);
      gGroup.add(lPanel);

      // 우측 게이트 패널
      const rMat = new THREE.MeshBasicMaterial({ map: createGateTextTexture(gc.right, false), transparent: true, opacity: 0.88 });
      const rPanel = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), rMat);
      rPanel.position.set(1.8, 1.2, 0);
      gGroup.add(rPanel);

      // 상단 아치 프레임
      const fMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.3, 0.4), fMat);
      frame.position.set(0, 2.5, 0);
      gGroup.add(frame);

      gGroup.position.set(0, 0, gc.z);
      scene.add(gGroup);

      gates.push({
        z: gc.z,
        leftText: gc.left,
        rightText: gc.right,
        leftOp: gc.lOp,
        rightOp: gc.rOp,
        group: gGroup,
        passed: false,
      });
    });

    // ==========================================
    // 중간 적군 수비대 2개 (Z: -70m, Z: -100m)
    // ==========================================
    const enemyGroups: EnemyGroup3D[] = [];
    const enemyConfigs = [
      { z: -70, count: 12 },
      { z: -100, count: 18 },
    ];

    enemyConfigs.forEach((ec) => {
      const eg = new THREE.Group();
      for (let i = 0; i < ec.count; i++) {
        const sm = createStickmanMesh(0xef4444); // 레드 스틱맨
        const angle = (i * Math.PI * 2) / ec.count;
        const dist = 0.4 + (i % 3) * 0.5;
        sm.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        eg.add(sm);
      }
      eg.position.set(0, 0, ec.z);
      scene.add(eg);

      enemyGroups.push({
        z: ec.z,
        count: ec.count,
        group: eg,
        defeated: false,
      });
    });

    // ==========================================
    // 결승 거대 레드 보스 타이탄 (Z: -140m)
    // ==========================================
    const bossGroup = new THREE.Group();
    const bMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });

    // 거대 몸통
    const bBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 1.4), bMat);
    bBody.position.y = 2.4;
    bossGroup.add(bBody);

    // 거대 머리 & 뿔
    const bHead = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), bMat);
    bHead.position.y = 4.6;
    bossGroup.add(bHead);

    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 6), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    hornL.position.set(-0.7, 5.4, 0);
    hornL.rotation.z = 0.4;
    bossGroup.add(hornL);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 6), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    hornR.position.set(0.7, 5.4, 0);
    hornR.rotation.z = -0.4;
    bossGroup.add(hornR);

    bossGroup.position.set(0, 0, -140);
    scene.add(bossGroup);

    // 레퍼런스 등록
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.commanderGroup = commanderGroup;
    g.gates = gates;
    g.enemies = enemyGroups;
    g.bossGroup = bossGroup;
    g.crowdMeshes = [];
    g.particles = [];
    g.count = 5;
    g.playerX = 0;
    g.playerZ = 0;
    g.targetX = 0;
    g.bossHp = 120;
    g.inBossFight = false;
    g.score = 0;
    g.isEnded = false;
    g.startTime = performance.now();

    // 초기 군중 메쉬 생성
    updateCrowdMeshes(5);

    // ==========================================
    // 애니메이션 루프
    // ==========================================
    let lastTime = performance.now();

    const animate = (now: number) => {
      g.animFrameId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      if (!g.isEnded && isPlaying) {
        // 플레이어 전진
        if (!g.inBossFight) {
          g.playerZ -= g.speed * dt;
        }

        // 좌우 조향 부드럽게 추종
        g.playerX = THREE.MathUtils.lerp(g.playerX, g.targetX, 0.2);
        g.playerX = Math.max(-3.0, Math.min(3.0, g.playerX));

        if (g.commanderGroup) {
          g.commanderGroup.position.set(g.playerX, 0, g.playerZ);
        }

        // ------------------------------------
        // 군중 스틱맨 대형 배치 (나선형 클러스터)
        // ------------------------------------
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < g.crowdMeshes.length; i++) {
          const r = 0.28 * Math.sqrt(i + 1);
          const theta = i * goldenAngle;
          const sx = g.playerX + Math.cos(theta) * r;
          const sz = g.playerZ + Math.sin(theta) * r + 0.3;

          g.crowdMeshes[i].position.set(sx, 0, sz);
        }

        // ------------------------------------
        // 게이트 통과 검사
        // ------------------------------------
        for (const gate of g.gates) {
          if (!gate.passed && Math.abs(g.playerZ - gate.z) < 1.2) {
            gate.passed = true;
            let nextCount = g.count;

            if (g.playerX < 0) {
              nextCount = gate.leftOp(g.count);
              setBoostBanner(`✨ ${gate.leftText}! 아군 증폭!`);
            } else {
              nextCount = gate.rightOp(g.count);
              setBoostBanner(`✨ ${gate.rightText}! 아군 증폭!`);
            }

            updateCrowdMeshes(nextCount);
            g.score += 200;
            setScore(g.score);

            triggerHaptic([30, 40]);
            playSfx?.('victory');
            setTimeout(() => setBoostBanner(null), 1200);

            // 게이트 반짝임 파티클
            for (let p = 0; p < 25; p++) {
              const pMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
              const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), pMat);
              pMesh.position.set(g.playerX, 1.2, gate.z);
              scene.add(pMesh);
              g.particles.push({
                mesh: pMesh,
                vx: (Math.random() - 0.5) * 8,
                vy: Math.random() * 6 + 2,
                vz: (Math.random() - 0.5) * 6,
                life: 0,
                maxLife: 0.45,
              });
            }
          }
        }

        // ------------------------------------
        // 적군 수비대 충돌 교전
        // ------------------------------------
        for (const enemy of g.enemies) {
          if (!enemy.defeated && Math.abs(g.playerZ - enemy.z) < 1.5) {
            enemy.defeated = true;
            scene.remove(enemy.group);

            // 1:1 병력 상쇄
            const loss = Math.min(g.count - 1, enemy.count);
            updateCrowdMeshes(g.count - loss);
            g.score += 300;
            setScore(g.score);

            triggerHaptic([40, 50]);
            playSfx?.('hit');

            // 교전 파티클
            for (let p = 0; p < 20; p++) {
              const pMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
              const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), pMat);
              pMesh.position.set(0, 0.8, enemy.z);
              scene.add(pMesh);
              g.particles.push({
                mesh: pMesh,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 5 + 1,
                vz: (Math.random() - 0.5) * 6,
                life: 0,
                maxLife: 0.4,
              });
            }
          }
        }

        // ------------------------------------
        // 결승 보스전
        // ------------------------------------
        if (!g.inBossFight && g.playerZ <= g.bossZ + 6.0) {
          g.inBossFight = true;
        }

        if (g.inBossFight) {
          // 보스 HP 감소 & 아군 돌격 소모
          const dmg = Math.ceil(g.count * 1.5 * dt * 8);
          g.bossHp = Math.max(0, g.bossHp - dmg);
          setBossHp(g.bossHp);

          triggerHaptic(12);

          // 보스 격파 승리!
          if (g.bossHp <= 0) {
            if (g.bossGroup) scene.remove(g.bossGroup);
            finishGame(true, g.score + 1500);
            return;
          }

          // 아군 병력 소모
          if (g.count <= 1 && g.bossHp > 0) {
            // 패배!
            finishGame(false, g.score);
            return;
          }
          if (Math.random() < 0.2) {
            updateCrowdMeshes(g.count - 1);
          }
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

      // 카메라 부드러운 군중 후방 추종
      if (g.camera && g.commanderGroup) {
        const targetCamX = g.playerX * 0.6;
        const targetCamZ = g.playerZ + 9.5;
        const targetCamY = 6.8 + Math.min(4.0, g.count * 0.04); // 군중 수에 맞춰 자연스러운 시야 확장
        g.camera.position.x = THREE.MathUtils.lerp(g.camera.position.x, targetCamX, 0.12);
        g.camera.position.z = THREE.MathUtils.lerp(g.camera.position.z, targetCamZ, 0.12);
        g.camera.position.y = targetCamY;
        g.camera.lookAt(g.playerX, 1.2, g.playerZ - 10);
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
  }, [lowSpecMode, cardId, isPlaying, finishGame, playSfx, triggerHaptic, updateCrowdMeshes]);

  // 터치 드래그 인터랙션
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      gameRef.current.isDragging = true;
      gameRef.current.dragStartX = e.touches[0].clientX;
      gameRef.current.playerStartX = gameRef.current.playerX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gameRef.current.isDragging || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - gameRef.current.dragStartX;
    const sens = 0.015;
    gameRef.current.targetX = Math.max(-3.0, Math.min(3.0, gameRef.current.playerStartX + dx * sens));
  };

  const handleTouchEnd = () => {
    gameRef.current.isDragging = false;
  };

  // 좌우 버튼 조향 헬퍼
  const handleSteer = (dir: -1 | 1) => {
    gameRef.current.targetX = Math.max(-3.0, Math.min(3.0, gameRef.current.targetX + dir * 1.5));
    triggerHaptic(12);
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-black text-white font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js 3D 뷰포트 컨테이너 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미니멀 HUD 헤더 */}
      <MinimalistMissionHUD
        gameTitle="Count War 3D"
        score={score}
        onQuit={() => finishGame(false, score)}
      />

      {/* 상단 군단 병력 & 보스 HP 오버레이 */}
      <div className="absolute top-14 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-sm border border-cyan-500/50 text-xs font-bold text-cyan-300">
            👥 군단 병력: <strong className="text-white text-base">{armyCount}</strong>명
          </div>
        </div>

        {/* 보스 HP 바 */}
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-black text-red-400">👹 BOSS HP: {bossHp} / 120</div>
          <div className="w-28 bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-100"
              style={{ width: `${(bossHp / 120) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 부스트 알림 배너 */}
      {boostBanner && (
        <div className="absolute top-28 left-4 right-4 pointer-events-none z-10 flex justify-center">
          <div className="px-4 py-2 bg-gradient-to-r from-sky-600 to-cyan-500 rounded-sm text-sm font-black text-white shadow-xl animate-bounce">
            {boostBanner}
          </div>
        </div>
      )}

      {/* 하단 좌/우 조향 버튼 */}
      <div className="absolute bottom-8 left-6 right-6 flex items-center justify-between z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => handleSteer(-1)}
          className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-cyan-500/50 text-cyan-300 flex flex-col items-center justify-center font-black active:scale-95 shadow-lg active:bg-cyan-600 active:text-white"
        >
          <span className="text-2xl">⬅️</span>
          <span className="text-[9px]">LEFT</span>
        </button>

        <button
          type="button"
          onClick={() => handleSteer(1)}
          className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md border border-cyan-500/50 text-cyan-300 flex flex-col items-center justify-center font-black active:scale-95 shadow-lg active:bg-cyan-600 active:text-white"
        >
          <span className="text-2xl">➡️</span>
          <span className="text-[9px]">RIGHT</span>
        </button>
      </div>

      {/* 튜토리얼 모달 */}
      <UniversalTutorialModal
        isOpen={showTutorial}
        title="Count War 3D"
        description="게이트를 통과해 군단을 대규모로 증식시키고 거대 보스 타이탄을 제압하세요!"
        features={[
          {
            iconType: 'GOAL',
            title: '군단 증폭 & 보스 격파',
            desc: '+10, x2 등의 게이트를 통과해 100명 이상의 병력을 결집시켜 보스를 쓰러뜨리세요.',
          },
          {
            iconType: 'GESTURES',
            title: '좌우 드래그 조향',
            desc: '화면을 좌우로 스와이프하거나 하단 버튼으로 군단을 원하는 게이트 쪽으로 조향하세요.',
          },
          {
            iconType: 'REWARDS',
            title: 'SNS 보상 정산',
            desc: '보스 격파 시 최대 50 SNS 포인트 및 랭킹 점수가 지급됩니다.',
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

export default PokiCountWarGame;
