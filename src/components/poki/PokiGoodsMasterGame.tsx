import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiGoodsMasterGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

type GoodType = 'soda' | 'chips' | 'milk' | 'donut' | 'energy' | 'juice';

interface Good3D {
  id: number;
  type: GoodType;
  name: string;
  icon: string;
  mesh: THREE.Group;
  slotRow: number;
  slotCol: number;
  depthLayer: number; // 0 = front, 1 = back
  inCart: boolean;
  cartSlotIndex: number;
  animating: boolean;
}

const TOTAL_SETS = 6; // 6세트 = 18개 상품
const MAX_CART_SLOTS = 7;

export default function PokiGoodsMasterGame({
  onBack,
  onClose,
  cardId = 90,
  onExit
}: PokiGoodsMasterGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onClose || (() => {});

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'full' | 'victory'>('ready');
  const [matchedSets, setMatchedSets] = useState(0);
  const [cartItems, setCartItems] = useState<{ id: number; type: GoodType; icon: string; name: string }[]>([]);
  const [comboBanner, setComboBanner] = useState<string | null>(null);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Three.js 인스턴스 레프
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    goods: Good3D[];
    shelfRack: THREE.Group;
    sparks: THREE.Points;
    sparkGeo: THREE.BufferGeometry;
    confetti: THREE.Points;
    confettiGeo: THREE.BufferGeometry;
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // 상호작용 및 뷰 틸트 레프
  const controlRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    orbitTheta: 0,
    orbitPhi: 0,
    targetTheta: 0,
    targetPhi: 0,
    matchedCount: 0,
    history: [] as number[], // item ids for undo
  });

  const triggerHaptic = useCallback((ms: number = 30) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // 무시
    }
  }, []);

  // 승리 처리
  const handleVictory = useCallback(() => {
    setGameState('victory');
    triggerHaptic([100, 50, 150]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokigoodsmaster',
      gameTitle: 'Goods Master 3D',
      isVictory: true,
      score: TOTAL_SETS,
      maxTargetScore: TOTAL_SETS,
      durationSeconds: 30,
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  // 카트 풀 게임오버 처리
  const handleGameOver = useCallback(() => {
    setGameState('full');
    triggerHaptic([200, 100, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokigoodsmaster',
      gameTitle: 'Goods Master 3D',
      isVictory: false,
      score: controlRef.current.matchedCount,
      maxTargetScore: TOTAL_SETS,
      durationSeconds: 20,
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  // 스파클 파티클 생성 헬퍼
  const spawnSparklesAt = useCallback((x: number, y: number, z: number) => {
    if (!threeRef.current) return;
    const { sparks, sparkGeo } = threeRef.current;
    const pos = sparkGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = y + (Math.random() - 0.5) * 1.2;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 1.5;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    (sparks.material as THREE.PointsMaterial).opacity = 1.0;
  }, []);

  // Three.js 씬 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // 세련된 다크 마켓 톤

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 9.8);
    camera.lookAt(0, 2.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffedd5, 1.8, 30, Math.PI / 4, 0.3);
    spotLight.position.set(0, 10, 8);
    scene.add(spotLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-10, 6, -5);
    scene.add(rimLight);

    // No.090 공식 카드 영웅 배지 텍스처
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 256;
    heroCanvas.height = 256;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, cardId, 18, 18, 220, 220, { circleClip: true });
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.needsUpdate = true;

    // --- 3D 슈퍼마켓 선반 랙 (3단 선반장) ---
    const shelfRack = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.5, metalness: 0.1 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });

    // 4개 금속 지지 기둥
    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.08, 5.2, 8);
    [
      [-3.2, -0.6],
      [3.2, -0.6],
      [-3.2, 0.6],
      [3.2, 0.6],
    ].forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, metalMat);
      p.position.set(px, 2.6, pz);
      shelfRack.add(p);
    });

    // 3개 우드 선반 평판 (Row 0, 1, 2)
    const shelfGeo = new THREE.BoxGeometry(6.6, 0.12, 1.4);
    const shelfYPositions = [1.2, 2.6, 4.0];
    shelfYPositions.forEach((sy) => {
      const s = new THREE.Mesh(shelfGeo, woodMat);
      s.position.set(0, sy, 0);
      shelfRack.add(s);
    });

    // 선반 최상단 No.090 공식 영웅 배지 간판
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.2, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6 })
    );
    signBoard.position.set(0, 5.1, 0);

    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 1.0),
      new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true })
    );
    badgeMesh.position.set(0, 0, 0.09);
    signBoard.add(badgeMesh);
    shelfRack.add(signBoard);

    scene.add(shelfRack);

    // --- 6종 3D 상품 생성 (총 18개) ---
    const goodTypes: { type: GoodType; name: string; icon: string; color: number }[] = [
      { type: 'soda', name: '레드 콜라', icon: '🥤', color: 0xef4444 },
      { type: 'chips', name: '포테이토 칩', icon: '🍟', color: 0xfacc15 },
      { type: 'milk', name: '신선한 우유', icon: '🥛', color: 0x38bdf8 },
      { type: 'donut', name: '도넛 박스', icon: '🍩', color: 0xa855f7 },
      { type: 'energy', name: '에너지 드링크', icon: '⚡', color: 0x10b981 },
      { type: 'juice', name: '오렌지 쥬스', icon: '🍊', color: 0xf97316 },
    ];

    // 18개 상품 아이템 풀 생성 (각 3개씩)
    const itemsData: { type: GoodType; name: string; icon: string; color: number }[] = [];
    goodTypes.forEach((gt) => {
      for (let i = 0; i < 3; i++) {
        itemsData.push({ ...gt });
      }
    });

    // 셔플
    for (let i = itemsData.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [itemsData[i], itemsData[j]] = [itemsData[j], itemsData[i]];
    }

    const goods: Good3D[] = [];
    const colXPositions = [-2.0, 0, 2.0];
    const depthZPositions = [0.35, -0.35]; // 0 = front (앞줄), 1 = back (뒷줄)

    let itemIdx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        for (let d = 0; d < 2; d++) {
          const data = itemsData[itemIdx];
          const mesh = new THREE.Group();

          // 상품 타입별 3D 지오메트리
          if (data.type === 'soda' || data.type === 'energy') {
            const can = new THREE.Mesh(
              new THREE.CylinderGeometry(0.24, 0.24, 0.65, 16),
              new THREE.MeshStandardMaterial({ color: data.color, metalness: 0.85, roughness: 0.2 })
            );
            mesh.add(can);
          } else if (data.type === 'chips') {
            const bag = new THREE.Mesh(
              new THREE.BoxGeometry(0.48, 0.65, 0.22),
              new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.5 })
            );
            mesh.add(bag);
          } else if (data.type === 'milk') {
            const bottle = new THREE.Mesh(
              new THREE.CylinderGeometry(0.22, 0.26, 0.7, 12),
              new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.3 })
            );
            mesh.add(bottle);
          } else if (data.type === 'donut') {
            const box = new THREE.Mesh(
              new THREE.BoxGeometry(0.55, 0.35, 0.55),
              new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.4 })
            );
            mesh.add(box);
          } else {
            const carton = new THREE.Mesh(
              new THREE.BoxGeometry(0.42, 0.7, 0.42),
              new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.4 })
            );
            mesh.add(carton);
          }

          // 터치 판정용 투명 히트박스
          const hitBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.85, 0.6),
            new THREE.MeshBasicMaterial({ visible: false })
          );
          mesh.add(hitBox);

          const posX = colXPositions[c];
          const posY = shelfYPositions[r] + 0.45;
          const posZ = depthZPositions[d];

          mesh.position.set(posX, posY, posZ);
          mesh.userData = { id: itemIdx + 1, type: data.type };
          scene.add(mesh);

          goods.push({
            id: itemIdx + 1,
            type: data.type,
            name: data.name,
            icon: data.icon,
            mesh,
            slotRow: r,
            slotCol: c,
            depthLayer: d,
            inCart: false,
            cartSlotIndex: -1,
            animating: false,
          });

          itemIdx++;
        }
      }
    }

    // --- 파티클 시스템 (스파클 & 콘페티) ---
    // 1) 스파클
    const sparkCount = 50;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) sparkPos[i] = 0;
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0xfacc15, size: 0.45, transparent: true, opacity: 0 });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // 2) 콘페티
    const confettiCount = 80;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPos = new Float32Array(confettiCount * 3);
    for (let i = 0; i < confettiCount; i++) {
      confettiPos[i * 3] = (Math.random() - 0.5) * 10;
      confettiPos[i * 3 + 1] = Math.random() * 6 + 1;
      confettiPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPos, 3));
    const confettiMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.4, transparent: true, opacity: 0 });
    const confetti = new THREE.Points(confettiGeo, confettiMat);
    scene.add(confetti);

    const clock = new THREE.Clock();

    threeRef.current = {
      scene,
      camera,
      renderer,
      goods,
      shelfRack,
      sparks,
      sparkGeo,
      confetti,
      confettiGeo,
      animId: 0,
      clock,
    };

    // 리사이즈
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 애니메이션 루프
    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const ctrl = controlRef.current;

      // 선반 미세 틸트 회전 보간
      ctrl.orbitTheta = THREE.MathUtils.lerp(ctrl.orbitTheta, ctrl.targetTheta, delta * 5);
      ctrl.orbitPhi = THREE.MathUtils.lerp(ctrl.orbitPhi, ctrl.targetPhi, delta * 5);
      shelfRack.rotation.y = ctrl.orbitTheta;
      shelfRack.rotation.x = ctrl.orbitPhi;

      // 앞줄 상품이 사라지면 뒷줄 상품 살짝 앞으로 전진
      goods.forEach((g) => {
        if (!g.inCart && g.depthLayer === 1) {
          // 같은 슬롯의 앞줄 상품이 카트로 갔는지 확인
          const frontGood = goods.find(
            (fg) => fg.slotRow === g.slotRow && fg.slotCol === g.slotCol && fg.depthLayer === 0
          );
          if (frontGood && frontGood.inCart) {
            g.mesh.position.z = THREE.MathUtils.lerp(g.mesh.position.z, 0.35, delta * 4);
          }
        }

        // 카트로 이동 중인 상품 공중 비행 & 축소 애니메이션
        if (g.animating) {
          g.mesh.scale.multiplyScalar(0.88);
          g.mesh.position.y -= delta * 6;
          if (g.mesh.scale.x <= 0.05) {
            g.animating = false;
            g.mesh.visible = false;
          }
        }
      });

      // 스파클 감쇠
      if ((sparkMat as THREE.PointsMaterial).opacity > 0) {
        (sparkMat as THREE.PointsMaterial).opacity -= delta * 1.8;
      }

      // 승리 시 콘페티 낙하
      if (ctrl.matchedCount >= TOTAL_SETS) {
        (confettiMat as THREE.PointsMaterial).opacity = 0.95;
        const pos = confettiGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < confettiCount; i++) {
          pos[i * 3 + 1] -= delta * 2.5;
          if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 6.5;
        }
        confettiGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
      threeRef.current!.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
        renderer.dispose();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cardId]);

  // 상품 선택하여 카트에 넣기
  const pickGood = (item: Good3D) => {
    if (gameState !== 'playing' || item.inCart || cartItems.length >= MAX_CART_SLOTS) return;

    // 앞줄 상품이 아직 남아있는 경우 뒷줄 선택 불가
    if (item.depthLayer === 1) {
      const front = threeRef.current?.goods.find(
        (g) => g.slotRow === item.slotRow && g.slotCol === item.slotCol && g.depthLayer === 0 && !g.inCart
      );
      if (front) {
        triggerHaptic(20);
        return; // 앞줄 먼저 제거해야 함
      }
    }

    item.inCart = true;
    item.animating = true;
    controlRef.current.history.push(item.id);

    const newCart = [...cartItems, { id: item.id, type: item.type, icon: item.icon, name: item.name }];
    setCartItems(newCart);
    triggerHaptic(35);

    // 3매치 검사
    const matchCount = newCart.filter((c) => c.type === item.type).length;
    if (matchCount === 3) {
      setTimeout(() => {
        // 매칭 성공!
        const remainingCart = newCart.filter((c) => c.type !== item.type);
        setCartItems(remainingCart);
        controlRef.current.matchedCount += 1;
        setMatchedSets(controlRef.current.matchedCount);

        setComboBanner(`✨ TRIPLE MATCH! +300 (${controlRef.current.matchedCount}/${TOTAL_SETS})`);
        spawnSparklesAt(item.mesh.position.x, item.mesh.position.y, item.mesh.position.z);
        triggerHaptic([60, 30, 80]);

        setTimeout(() => setComboBanner(null), 1200);

        // 승리 판정
        if (controlRef.current.matchedCount >= TOTAL_SETS) {
          handleVictory();
        }
      }, 250);
    } else if (newCart.length >= MAX_CART_SLOTS) {
      // 카트 슬롯 초과 게임오버
      setTimeout(() => {
        handleGameOver();
      }, 300);
    }
  };

  // 3D 터치 레이캐스팅 픽
  const handlePointerDown = (e: React.PointerEvent) => {
    controlRef.current.isDragging = true;
    controlRef.current.prevX = e.clientX;
    controlRef.current.prevY = e.clientY;

    if (!threeRef.current || !mountRef.current || gameState !== 'playing') return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, threeRef.current.camera);

    const intersects = raycaster.intersectObjects(threeRef.current.scene.children, true);
    if (intersects.length > 0) {
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== threeRef.current.scene) {
          if (cur.userData?.id) {
            const found = threeRef.current.goods.find((g) => g.id === cur!.userData.id);
            if (found) {
              pickGood(found);
              return;
            }
          }
          cur = cur.parent;
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!controlRef.current.isDragging) return;
    const dx = e.clientX - controlRef.current.prevX;
    const dy = e.clientY - controlRef.current.prevY;
    controlRef.current.prevX = e.clientX;
    controlRef.current.prevY = e.clientY;

    // 선반 미세 틸트 (Screen-relative 완벽 일치)
    controlRef.current.targetTheta = THREE.MathUtils.clamp(
      controlRef.current.targetTheta + dx * 0.003,
      -0.35,
      0.35
    );
    controlRef.current.targetPhi = THREE.MathUtils.clamp(
      controlRef.current.targetPhi + dy * 0.002,
      -0.2,
      0.2
    );
  };

  const handlePointerUp = () => {
    controlRef.current.isDragging = false;
  };

  // 편의 액션 1: [✨ AUTO MATCH] 원터치 자동 3매치 지원
  const handleAutoMatch = () => {
    if (!threeRef.current || gameState !== 'playing') return;

    // 선반에서 현재 선택 가능한(앞줄 또는 뒷줄이 노출된) 상품들 중 3개가 존재하는 종류 탐색
    const available = threeRef.current.goods.filter((g) => !g.inCart);
    const typeGroups: Record<string, Good3D[]> = {};
    available.forEach((g) => {
      // 선택 가능한지 검사
      let canPick = true;
      if (g.depthLayer === 1) {
        const front = threeRef.current?.goods.find(
          (fg) => fg.slotRow === g.slotRow && fg.slotCol === g.slotCol && fg.depthLayer === 0 && !fg.inCart
        );
        if (front) canPick = false;
      }
      if (canPick) {
        if (!typeGroups[g.type]) typeGroups[g.type] = [];
        typeGroups[g.type].push(g);
      }
    });

    // 카트에 이미 있는 상품과 결합 가능한 것 우선 탐색
    for (const [type, list] of Object.entries(typeGroups)) {
      const inCartSame = cartItems.filter((ci) => ci.type === type).length;
      if (inCartSame + list.length >= 3 && cartItems.length + (3 - inCartSame) <= MAX_CART_SLOTS) {
        // 필요한 만큼 카트에 추가
        const needed = 3 - inCartSame;
        for (let i = 0; i < needed; i++) {
          pickGood(list[i]);
        }
        return;
      }
    }

    // 또는 그냥 아무거나 선택 가능한 1개 픽
    for (const list of Object.values(typeGroups)) {
      if (list.length > 0) {
        pickGood(list[0]);
        return;
      }
    }
  };

  // 편의 액션 2: [↩️ UNDO] 되돌리기
  const handleUndo = () => {
    if (cartItems.length === 0 || controlRef.current.history.length === 0 || gameState !== 'playing') return;
    const lastId = controlRef.current.history.pop();
    if (!lastId || !threeRef.current) return;

    const good = threeRef.current.goods.find((g) => g.id === lastId);
    if (good) {
      good.inCart = false;
      good.mesh.visible = true;
      good.mesh.scale.set(1, 1, 1);

      setCartItems((prev) => prev.filter((i) => i.id !== lastId));
      triggerHaptic(30);
    }
  };

  // 게임 재시작
  const startGame = () => {
    setGameState('playing');
    setCartItems([]);
    setMatchedSets(0);
    controlRef.current.matchedCount = 0;
    controlRef.current.history = [];
    setRewardReceipt(null);
    triggerHaptic(50);
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 text-white font-mono flex flex-col"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Three.js 3D 뷰포트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 상단 미니멀 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="GOODS MASTER 3D"
        onQuit={handleExit}
        progressPercent={Math.min(100, Math.round((matchedSets / TOTAL_SETS) * 100))}
        customScore={matchedSets}
        scoreLabel="SETS"
        rewardPreview={35}
      />

      {/* 콤보 배너 */}
      {comboBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-amber-400 text-black px-4 py-1.5 rounded-sm font-black text-xs tracking-wider shadow-lg border border-amber-300">
            {comboBanner}
          </div>
        </div>
      )}

      {/* 게임 시작 대기 오버레이 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-xs text-amber-400 font-bold tracking-widest uppercase mb-1">
              [POKI POPULAR 110: NO.090]
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              GOODS MASTER 3D
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              슈퍼마켓 진열대에서 같은 상품 3개를 골라 매칭하세요! 카트 슬롯(최대 7개)이 가득 차기 전에 18개(6세트) 상품을 모두 정리정돈하세요.
            </p>

            <div className="bg-slate-950/80 border border-slate-800 p-3 mb-6 rounded-sm text-left text-xs space-y-2 text-slate-300">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <span>[✦] 공식 배지:</span> No.090 마켓 선반 상단 네온 간판 각인
              </div>
              <div className="flex items-center gap-2">
                <span>[🛒 카트 매칭]</span> 선반 상품을 탭해 카트로 넣고 같은 것 3개 완성
              </div>
              <div className="flex items-center gap-2">
                <span>[📦 2단 레이어]</span> 앞줄 상품을 치워야 뒷줄 상품이 노출됩니다
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span>[⚠️ 슬롯 주의]</span> 카트 7칸이 꽉 차면 게임오버!
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-lg rounded-sm tracking-wider uppercase shadow-lg transition-transform active:scale-95"
            >
              START SORTING 🛒
            </button>
          </div>
        </div>
      )}

      {/* 카트 가득 참 게임오버 오버레이 */}
      {gameState === 'full' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-3xl mb-2">🛒</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">CART OVERFLOW!</h2>
            <p className="text-xs text-slate-400 mb-4">카트 슬롯이 꽉 찼습니다. 매칭 실적에 따라 보상이 정산됩니다.</p>

            <div className="bg-slate-950 p-3 rounded-sm border border-slate-800 mb-5 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">완료한 세트:</span>
                <span className="font-bold text-amber-400">
                  {matchedSets} / {TOTAL_SETS}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm text-sm tracking-wider"
              >
                RETRY
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-sm text-sm"
              >
                QUIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승리 모달 */}
      {gameState === 'victory' && (
        <VictoryRewardModal
          isOpen={true}
          onClose={handleExit}
          receipt={rewardReceipt}
          title="SHELVES 100% ORGANIZED!"
          subtitle="슈퍼마켓 진열대 18개 상품을 완벽하게 정리했습니다!"
        />
      )}

      {/* 하단 7칸 카트 슬롯 트레이 & 액션 컨트롤러 */}
      {gameState === 'playing' && (
        <div className="mt-auto z-20 pb-5 px-3 flex flex-col items-center pointer-events-auto">
          {/* 카트 트레이 (최대 7개) */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/40 p-2 rounded-sm mb-3 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1.5 px-1">
              <span>🛒 CART SLOTS ({cartItems.length}/7)</span>
              <span>MATCH 3 TO CLEAR</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: MAX_CART_SLOTS }).map((_, idx) => {
                const item = cartItems[idx];
                return (
                  <div
                    key={idx}
                    className={`h-14 rounded-sm border flex flex-col items-center justify-center transition-all ${
                      item
                        ? 'bg-slate-800 border-amber-400 text-white shadow-md scale-95'
                        : 'bg-slate-950/60 border-slate-800 text-slate-700'
                    }`}
                  >
                    {item ? (
                      <>
                        <span className="text-xl leading-none">{item.icon}</span>
                        <span className="text-[8px] text-slate-300 truncate w-full text-center px-0.5 mt-0.5">
                          {item.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-700 font-mono">_</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 하단 편의 액션 버튼 (AUTO MATCH & UNDO) */}
          <div className="flex items-center gap-3 w-full max-w-md">
            <button
              onClick={handleUndo}
              disabled={cartItems.length === 0}
              className="flex-1 py-3 bg-slate-900 active:bg-slate-800 border border-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs rounded-sm flex items-center justify-center gap-1.5 shadow-lg"
            >
              <span>↩️</span>
              <span>UNDO</span>
            </button>

            <button
              onClick={handleAutoMatch}
              className="flex-2 py-3 bg-amber-500 active:bg-amber-600 border border-amber-300 text-black font-black text-sm rounded-sm flex items-center justify-center gap-1.5 shadow-xl transition-transform active:scale-95"
            >
              <span>✨</span>
              <span>AUTO MATCH (HINT)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
