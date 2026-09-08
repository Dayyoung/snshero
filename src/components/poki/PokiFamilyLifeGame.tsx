import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiFamilyLifeGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;

  onClose?: () => void;
}

interface QuestZone {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  pos: THREE.Vector3;
  color: number;
  completed: boolean;
  markerMesh: THREE.Mesh;
}

export const PokiFamilyLifeGame: React.FC<PokiFamilyLifeGameProps> = ({
  onBack,
  onExit,
  cardId = 42,
  lowSpecMode = false,
  playSfx,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [happiness, setHappiness] = useState(0); // 0 ~ 100%
  const [completedCount, setCompletedCount] = useState(0); // 0 ~ 4
  const [activeZone, setActiveZone] = useState<QuestZone | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // 모바일 터치 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickDelta, setJoystickDelta] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const inputDirRef = useRef({ x: 0, z: 0 });

  // 3D 씬 레퍼런스
  const gameLoopRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animId: 0,
    isGameOver: false,
    isGameWon: false,
    scoreVal: 0,
    happinessVal: 0,

    player: {
      group: null as THREE.Group | null,
      pos: new THREE.Vector3(0, 0, 0), // 거실 중앙 안전 안착
      isDashing: false,
      speed: 6.5,
    },

    dog: {
      group: null as THREE.Group | null,
      pos: new THREE.Vector3(-4.5, 0, 2.5),
      tailMesh: null as THREE.Mesh | null,
      walkAngle: 0,
    },

    quests: [] as QuestZone[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    homeWidth: 16.0,
    homeDepth: 12.0,
  });


  // 영웅 카드 배지 렌더링
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawCardSprite(ctx, cardId, 0, 0, 40, 40);
      }
    }
  }, [cardId]);

  // 햅틱 피드백
  const triggerHaptic = useCallback((pattern: number | number[] = 25) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore
      }
    }
  }, []);

  // 보상 정산
  const handleClaimReward = useCallback((isVictory: boolean, currentScore: number) => {
    const finalScore = Math.max(20, Math.floor(currentScore));
    const result = calculateAndDepositMissionReward({
      gameId: 'poki_family_life_simulator',
      gameTitle: 'Family Life Simulator 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: 30,
    });
    setRewardResult(result);
  }, []);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5);
    scene.fog = new THREE.FogExp2(0xfbf3d5, 0.022);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 15, 14);
    camera.lookAt(0, 0.5, 0.5);
    gameLoopRef.current.camera = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowSpecMode,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameLoopRef.current.renderer = renderer;

    // 3. 포근한 웜톤 햇살 조명
    const ambientLight = new THREE.AmbientLight(0xfff3e0, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffecd2, 1.3);
    sunLight.position.set(10, 25, 15);
    sunLight.castShadow = !lowSpecMode;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      const d = 12;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);

    // 핑크/오렌지 무드등
    const moodLight = new THREE.PointLight(0xff9944, 1.8, 20);
    moodLight.position.set(-4, 4, -2);
    scene.add(moodLight);

    // 4. 3D 스위트 홈 건축 (우드 바닥 & 벽면)
    const homeW = 16.0;
    const homeD = 12.0;
    gameLoopRef.current.homeWidth = homeW;
    gameLoopRef.current.homeDepth = homeD;

    // 원목 플로어
    const floorGeo = new THREE.BoxGeometry(homeW, 0.4, homeD);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x8a5a36,
      roughness: 0.5,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.2;
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // 거실 원형 러그
    const rugGeo = new THREE.CircleGeometry(2.4, 32);
    const rugMat = new THREE.MeshStandardMaterial({ color: 0xddc5a2, roughness: 0.8 });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.02, 0.8);
    rug.receiveShadow = !lowSpecMode;
    scene.add(rug);

    // 뒤쪽 벽 & 좌우 벽 (낮은 단면 벽으로 내부가 훤히 보이게 연출)
    const backWallGeo = new THREE.BoxGeometry(homeW, 3.2, 0.4);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xede4d3, roughness: 0.6 });
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 1.6, -homeD / 2);
    backWall.receiveShadow = !lowSpecMode;
    scene.add(backWall);

    // 벽면 창문 & 커튼
    const winGeo = new THREE.BoxGeometry(4.0, 1.8, 0.45);
    const winMat = new THREE.MeshStandardMaterial({ color: 0x99ccff, roughness: 0.2 });
    const windowMesh = new THREE.Mesh(winGeo, winMat);
    windowMesh.position.set(0, 2.0, -homeD / 2);
    scene.add(windowMesh);

    // 5. 집안 가구 배치
    // A. 거실 소파 (중앙)
    const sofaGeo = new THREE.BoxGeometry(3.2, 0.9, 1.2);
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x446688, roughness: 0.6 });
    const sofa = new THREE.Mesh(sofaGeo, sofaMat);
    sofa.position.set(0, 0.45, -0.6);
    sofa.castShadow = !lowSpecMode;
    scene.add(sofa);

    // B. 주방 식탁 & 의자 (우측 Z = -3.5)
    const tableGeo = new THREE.BoxGeometry(2.4, 0.9, 1.6);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.4 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(5.5, 0.45, -3.5);
    table.castShadow = !lowSpecMode;
    scene.add(table);

    // 식탁 위 피자 박스
    const pizzaGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
    const pizzaMat = new THREE.MeshStandardMaterial({ color: 0xffaa22 });
    const pizza = new THREE.Mesh(pizzaGeo, pizzaMat);
    pizza.position.set(5.5, 0.95, -3.5);
    scene.add(pizza);

    // C. 아기 요람 (좌측 Z = -3.5)
    const cribGeo = new THREE.BoxGeometry(1.8, 1.1, 1.3);
    const cribMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const crib = new THREE.Mesh(cribGeo, cribMat);
    crib.position.set(-5.5, 0.55, -3.5);
    crib.castShadow = !lowSpecMode;
    scene.add(crib);

    // 요람 속 아기 큐비
    const babyGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const babyMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const baby = new THREE.Mesh(babyGeo, babyMat);
    baby.position.set(-5.5, 0.85, -3.5);
    scene.add(baby);

    // D. 반려견 하우스 (좌측 하단 Z = 3.5)
    const dogHouseGeo = new THREE.BoxGeometry(1.6, 1.4, 1.6);
    const dogHouseMat = new THREE.MeshStandardMaterial({ color: 0xaa4422, roughness: 0.5 });
    const dogHouse = new THREE.Mesh(dogHouseGeo, dogHouseMat);
    dogHouse.position.set(-5.5, 0.7, 3.5);
    dogHouse.castShadow = !lowSpecMode;
    scene.add(dogHouse);

    // 6. 플레이어 아바타 (아빠 큐비)
    const pGroup = new THREE.Group();
    // 몸체 (블루 셔츠)
    const pBodyGeo = new THREE.BoxGeometry(0.9, 1.1, 0.65);
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.4 });
    const pBody = new THREE.Mesh(pBodyGeo, pBodyMat);
    pBody.position.y = 0.95;
    pBody.castShadow = !lowSpecMode;
    pGroup.add(pBody);

    // 머리
    const pHeadGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.4 });
    const pHead = new THREE.Mesh(pHeadGeo, pHeadMat);
    pHead.position.y = 1.75;
    pHead.castShadow = !lowSpecMode;
    pGroup.add(pHead);

    // 시작 위치 (0, 0, 1.5 - 거실 중앙)
    pGroup.position.set(0, 0, 1.5);
    scene.add(pGroup);
    gameLoopRef.current.player.group = pGroup;

    // 7. 반려견 (골든 리트리버 큐비)
    const dGroup = new THREE.Group();
    const dBodyGeo = new THREE.BoxGeometry(0.7, 0.5, 0.9);
    const dBodyMat = new THREE.MeshStandardMaterial({ color: 0xddaa44, roughness: 0.5 });
    const dBody = new THREE.Mesh(dBodyGeo, dBodyMat);
    dBody.position.y = 0.35;
    dGroup.add(dBody);

    // 강아지 머리
    const dHeadGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const dHead = new THREE.Mesh(dHeadGeo, dBodyMat);
    dHead.position.set(0, 0.6, 0.45);
    dGroup.add(dHead);

    // 꼬리
    const dTailGeo = new THREE.BoxGeometry(0.12, 0.12, 0.4);
    const dTail = new THREE.Mesh(dTailGeo, dBodyMat);
    dTail.position.set(0, 0.45, -0.5);
    dGroup.add(dTail);

    dGroup.position.set(-4.5, 0, 2.5);
    scene.add(dGroup);
    gameLoopRef.current.dog.group = dGroup;
    gameLoopRef.current.dog.tailMesh = dTail;

    // 8. 4대 가족 퀘스트 인터랙션 존 생성
    const questDefs = [
      {
        id: 'baby',
        title: '🍼 아기 돌봄 & 분유',
        desc: '요람의 아기에게 따뜻한 우유를 먹이고 자장가를 불러주세요.',
        emoji: '🍼',
        pos: new THREE.Vector3(-5.5, 0.05, -2.5),
        color: 0xff66cc,
      },
      {
        id: 'meal',
        title: '🍕 패밀리 식사 준비',
        desc: '주방 식탁에 온 가족이 모여 즐길 맛있는 식사를 차립니다.',
        emoji: '🍕',
        pos: new THREE.Vector3(5.5, 0.05, -2.2),
        color: 0xffaa00,
      },
      {
        id: 'pet',
        title: '🐶 반려견 공놀이',
        desc: '꼬리를 흔드는 골든 리트리버와 즐겁게 공놀이를 즐깁니다.',
        emoji: '🐶',
        pos: new THREE.Vector3(-4.0, 0.05, 3.2),
        color: 0x00dd77,
      },
      {
        id: 'living',
        title: '🧹 거실 정리 & 대화',
        desc: '소파 주변을 깔끔히 정리하고 가족들과 도란도란 이야기를 나눕니다.',
        emoji: '🧹',
        pos: new THREE.Vector3(0, 0.05, 2.4),
        color: 0x3399ff,
      },
    ];

    const quests: QuestZone[] = [];
    questDefs.forEach((def) => {
      const ringGeo = new THREE.RingGeometry(1.1, 1.4, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.copy(def.pos);
      scene.add(ringMesh);

      quests.push({
        id: def.id,
        title: def.title,
        desc: def.desc,
        emoji: def.emoji,
        pos: def.pos,
        color: def.color,
        completed: false,
        markerMesh: ringMesh,
      });
    });
    gameLoopRef.current.quests = quests;

    // 9. 리사이즈 핸들러
    const handleResize = () => {
      if (!container || !gameLoopRef.current.renderer || !gameLoopRef.current.camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      gameLoopRef.current.camera.aspect = w / h;
      gameLoopRef.current.camera.updateProjectionMatrix();
      gameLoopRef.current.renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 10. 메인 루프
    let lastTime = performance.now();

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const g = gameLoopRef.current;
      const p = g.player;

      if (!g.isGameOver && !g.isGameWon) {
        // --- 플레이어 이동 제어 ---
        const moveSpeed = p.isDashing ? 10.5 : 6.5;
        const inX = inputDirRef.current.x;
        const inZ = inputDirRef.current.z;

        p.pos.x += inX * moveSpeed * dt;
        p.pos.z += inZ * moveSpeed * dt;

        // 집 벽면 한계 클램핑 (15m x 11m)
        const maxX = g.homeWidth / 2 - 1.2;
        const maxZ = g.homeDepth / 2 - 1.2;
        p.pos.x = Math.max(-maxX, Math.min(maxX, p.pos.x));
        p.pos.z = Math.max(-maxZ, Math.min(maxZ, p.pos.z));

        if (p.group) {
          p.group.position.copy(p.pos);

          if (Math.hypot(inX, inZ) > 0.1) {
            const angle = Math.atan2(inX, inZ);
            p.group.rotation.y = angle;
          }
        }

        // --- 반려견 애니메이션 (꼬리 흔들기 & 플레이어 쳐다보기) ---
        if (g.dog.group && g.dog.tailMesh) {
          g.dog.walkAngle += dt * 8.0;
          g.dog.tailMesh.rotation.y = Math.sin(g.dog.walkAngle) * 0.45;

          const toPlayer = new THREE.Vector3().subVectors(p.pos, g.dog.group.position).normalize();
          g.dog.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        }

        // --- 퀘스트 존 반경 감지 & 펄스 애니메이션 ---
        let nearestZone: QuestZone | null = null;
        g.quests.forEach((q) => {
          if (q.completed) {
            q.markerMesh.visible = false;
            return;
          }

          // 마커 펄스
          q.markerMesh.rotation.z += dt * 1.5;
          const dist = p.pos.distanceTo(q.pos);
          if (dist < 2.4) {
            nearestZone = q;
          }
        });

        setActiveZone(nearestZone);

        // --- 파티클 업데이트 ---
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const pt = g.particles[i];
          pt.life -= dt;
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.vel.y += 3.0 * dt; // 위로 떠오르는 하트
          if (pt.life <= 0) {
            scene.remove(pt.mesh);
            g.particles.splice(i, 1);
          }
        }

        // --- 카메라 부드러운 러프 추종 ---
        if (g.camera) {
          const targetCamX = p.pos.x * 0.4;
          const targetCamZ = p.pos.z * 0.4 + 14;
          g.camera.position.x += (targetCamX - g.camera.position.x) * 0.08;
          g.camera.position.z += (targetCamZ - g.camera.position.z) * 0.08;
        }
      }

      if (g.renderer && g.scene && g.camera) {
        g.renderer.render(g.scene, g.camera);
      }
    };

    gameLoopRef.current.animId = requestAnimationFrame(animate);

    // 클린업
    return () => {
      cancelAnimationFrame(gameLoopRef.current.animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, handleClaimReward, playSfx, triggerHaptic]);

  // 상호작용 액션 (가족 케어)
  const handleInteract = useCallback(() => {
    const g = gameLoopRef.current;
    if (!activeZone || activeZone.completed || g.isGameOver || g.isGameWon) return;

    // 퀘스트 완료 처리
    activeZone.completed = true;
    activeZone.markerMesh.visible = false;

    // 하트 파티클 생성 (핑크 큐브 하트들)
    if (g.scene) {
      for (let i = 0; i < 15; i++) {
        const pGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xff3388 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(
          activeZone.pos.x + (Math.random() - 0.5) * 1.5,
          1.2,
          activeZone.pos.z + (Math.random() - 0.5) * 1.5
        );
        g.scene.add(pMesh);

        const pVel = new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          2.5 + Math.random() * 3,
          (Math.random() - 0.5) * 4
        );
        g.particles.push({ mesh: pMesh, vel: pVel, life: 0.85 });
      }
    }

    // 행복도 +25%
    const newCount = g.quests.filter((q) => q.completed).length;
    const newHap = Math.min(100, newCount * 25);
    setCompletedCount(newCount);
    setHappiness(newHap);
    g.happinessVal = newHap;

    const newScore = g.scoreVal + 25;
    g.scoreVal = newScore;
    setScore(newScore);

    triggerHaptic([40, 60, 90]);
    if (playSfx) playSfx('powerup');

    // 4개 전체 완료 시 승리
    if (newCount >= 4) {
      g.isGameWon = true;
      setGameWon(true);
      triggerHaptic([50, 100, 150, 250]);
      handleClaimReward(true, 100);
    }
  }, [activeZone, handleClaimReward, playSfx, triggerHaptic]);

  // 대시 버튼 토글
  const handleDashStart = useCallback(() => {
    gameLoopRef.current.player.isDashing = true;
    triggerHaptic(20);
  }, [triggerHaptic]);

  const handleDashEnd = useCallback(() => {
    gameLoopRef.current.player.isDashing = false;
  }, []);

  // 가상 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setJoystickActive(true);
    setJoystickPos({ x: touch.clientX, y: touch.clientY });
    setJoystickDelta({ x: 0, y: 0 });
    inputDirRef.current = { x: 0, z: 0 };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - joystickPos.x;
        const dy = touch.clientY - joystickPos.y;
        const maxDist = 55;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const nx = Math.cos(angle) * (clampedDist / maxDist);
        const ny = Math.sin(angle) * (clampedDist / maxDist);

        setJoystickDelta({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
        inputDirRef.current = { x: nx, z: ny };
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setJoystickDelta({ x: 0, y: 0 });
        inputDirRef.current = { x: 0, z: 0 };
        break;
      }
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5] font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 3D 캔버스 컨테이너 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 HUD */}
      <MinimalistMissionHUD
        gameTitle="Family Life Simulator 3D"
        score={score}
        targetScore={100}
        onBack={handleExit} onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 상단 가족 행복도 대시보드 */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* 가족 행복 지수 게이지 */}
        <div className="bg-slate-900/90 border border-pink-500/50 p-3 rounded-sm backdrop-blur-sm min-w-[180px]">
          <div className="flex justify-between items-center text-xs font-bold text-pink-400 mb-1.5">
            <span>FAMILY HAPPINESS</span>
            <span className="text-yellow-300 font-black">{happiness}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${happiness}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>QUESTS: {completedCount} / 4</span>
            <span className="text-amber-300 font-bold">SWEET HOME</span>
          </div>
        </div>

        {/* 영웅 배지 */}
        <div className="w-12 h-14 bg-slate-900/90 border border-amber-500/40 rounded-sm overflow-hidden flex flex-col items-center justify-center p-0.5">
          <canvas ref={heroCanvasRef} width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-[9px] text-amber-300 font-black leading-none mt-0.5">No.{cardId}</span>
        </div>
      </div>

      {/* 중앙 하단 활성 퀘스트 알림 프롬프트 */}
      {activeZone && !activeZone.completed && (
        <div className="absolute top-36 left-1/2 transform -translate-x-1/2 bg-slate-900/95 border-2 border-pink-500 px-4 py-2 rounded-sm shadow-xl z-20 pointer-events-none flex items-center gap-2 animate-bounce">
          <span className="text-xl">{activeZone.emoji}</span>
          <div className="text-left">
            <span className="text-xs text-yellow-300 font-black block">{activeZone.title}</span>
            <span className="text-[10px] text-slate-300">{activeZone.desc}</span>
          </div>
        </div>
      )}

      {/* 다이나믹 플로팅 가상 조이스틱 UI */}
      {joystickActive && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: joystickPos.x - 45,
            top: joystickPos.y - 45,
            width: 90,
            height: 90,
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-pink-500/50 bg-pink-950/30 flex items-center justify-center backdrop-blur-xs">
            <div
              className="w-10 h-10 rounded-full bg-pink-500/80 border border-white/80 shadow-md transform"
              style={{
                transform: `translate(${joystickDelta.x}px, ${joystickDelta.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 우측 하단 상호작용 & 대시 버튼 */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20 pointer-events-auto">
        {/* 대시 버튼 */}
        <button
          onTouchStart={handleDashStart}
          onTouchEnd={handleDashEnd}
          onMouseDown={handleDashStart}
          onMouseUp={handleDashEnd}
          className="w-16 h-16 rounded-full bg-amber-600/90 active:bg-amber-400 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-amber-300/80 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-base">⚡</span>
          <span>DASH</span>
        </button>

        {/* 상호작용 케어 버튼 (76px) */}
        <button
          onClick={handleInteract}
          disabled={!activeZone || activeZone.completed}
          className={`w-20 h-20 rounded-full font-black text-xs flex flex-col items-center justify-center border-2 shadow-xl active:scale-95 transition-all ${
            activeZone && !activeZone.completed
              ? 'bg-pink-600 active:bg-pink-400 text-white border-pink-300 shadow-pink-500/50 scale-105 animate-pulse'
              : 'bg-slate-800/80 text-slate-500 border-slate-700 opacity-60'
          }`}
        >
          <span className="text-2xl">{activeZone ? activeZone.emoji : '❤️'}</span>
          <span>CARE</span>
        </button>
      </div>

      {/* 좌측 하단 조작 가이드 */}
      {!joystickActive && (
        <div className="absolute bottom-8 left-6 text-xs text-slate-300 pointer-events-none z-10 flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/50">
          <span>🕹️ 화면 터치 드래그로 집안 이동</span>
        </div>
      )}

      {/* 중도 포기 확인 모달 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">가족 돌봄을 중단할까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              현재까지 완료한 패밀리 퀘스트와 행복도에 비례한 SNS 포인트가 정산됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmQuit(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-sm border border-slate-600"
              >
                계속하기
              </button>
              <button
                onClick={() => {
                  setShowConfirmQuit(false);
                  try {
                    calculateAndDepositMissionReward({
                      gameId: 'poki_family_life_simulator',
                      gameTitle: 'Family Life Simulator 3D',
                      isVictory: false,
                      score: score || 0,
                      maxTargetScore: 100,
                      durationSeconds: 30,
                    });
                  } catch (e) {}
                  handleExit();
                  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hero-return-to-missions'));
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-sm"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="Family Life Simulator 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '가족 행복도 100% 달성',
              desc: '따뜻한 3D 스위트 홈에서 4대 패밀리 퀘스트를 해결하고 행복도를 100%로 채우세요!',
            },
            {
              iconType: 'GESTURES',
              title: '이동 & 돌봄 상호작용',
              desc: '가상 조이스틱으로 이동하여 퀘스트 존에 다가간 후 [CARE] 버튼을 눌러 돌보세요.',
            },
            {
              iconType: 'REWARDS',
              title: '스위트 홈 보상',
              desc: '행복도 100% 완성 시 최대 50 SNS 포인트를 영구 획득합니다.',
            },
          ]}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* 승리 및 정산 모달 */}
      {(gameWon || gameOver) && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          isVictory={gameWon}
          score={score}
          reward={rewardResult}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};
