import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiDecorLifeGameProps {
  deck?: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  handleExit?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number | string;
  onReward?: (amount: number) => void;
}

interface FurnitureItem {
  id: string;
  nameKo: string;
  nameEn: string;
  icon: string;
  targetPos: [number, number, number];
  targetRotY: number;
  isUnboxed: boolean;
  isPlaced: boolean;
  mesh?: THREE.Group;
  ghostMesh?: THREE.Group;
}

export const PokiDecorLifeGame: React.FC<PokiDecorLifeGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onBack,
  onClose,
  cardId,
  onReward,
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const playerHeroId = (cardId ? Number(cardId) : deck[0]?.id) || 16;
  const containerRef = useRef<HTMLDivElement>(null);
  const heroSpriteCanvasRef = useRef<HTMLCanvasElement>(null);

  // 게임 진행 상태
  const [score, setScore] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const totalStages = 2;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // 튜토리얼
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_decor_life') !== 'true';
    } catch {
      return true;
    }
  });

  // 1스테이지 가구 목록 (코지 베드룸)
  const [stage1Items, setStage1Items] = useState<FurnitureItem[]>([
    { id: 'bed', nameKo: '코지 더블 침대', nameEn: 'Cozy Double Bed', icon: '🛏️', targetPos: [-1.8, 0, -1.2], targetRotY: 0, isUnboxed: false, isPlaced: false },
    { id: 'desk', nameKo: '원목 책상 & 의자', nameEn: 'Wooden Desk & Chair', icon: '🪑', targetPos: [2.0, 0, -2.2], targetRotY: -Math.PI / 2, isUnboxed: false, isPlaced: false },
    { id: 'lamp', nameKo: '무드 스탠드 조명', nameEn: 'Ambient Stand Lamp', icon: '💡', targetPos: [-3.2, 0, 1.2], targetRotY: 0, isUnboxed: false, isPlaced: false },
    { id: 'plant', nameKo: '몬스테라 화분', nameEn: 'Monstera Plant', icon: '🪴', targetPos: [3.0, 0, 1.5], targetRotY: 0, isUnboxed: false, isPlaced: false },
    { id: 'rug', nameKo: '원형 패턴 러그', nameEn: 'Circle Pattern Rug', icon: '🧶', targetPos: [0.2, 0, 0.5], targetRotY: 0, isUnboxed: false, isPlaced: false },
  ]);

  // 2스테이지 가구 목록 (모던 리빙룸)
  const [stage2Items, setStage2Items] = useState<FurnitureItem[]>([
    { id: 'sofa', nameKo: '3인용 패브릭 소파', nameEn: 'Fabric Sofa', icon: '🛋️', targetPos: [0, 0, -1.8], targetRotY: 0, isUnboxed: false, isPlaced: false },
    { id: 'tv', nameKo: '미디어 콘솔 & TV', nameEn: 'Media Console & TV', icon: '📺', targetPos: [0, 0, 2.8], targetRotY: Math.PI, isUnboxed: false, isPlaced: false },
    { id: 'table', nameKo: '원형 티 테이블', nameEn: 'Coffee Table', icon: '☕', targetPos: [0, 0, 0.4], targetRotY: 0, isUnboxed: false, isPlaced: false },
    { id: 'floorlamp', nameKo: '플로어 아치 램프', nameEn: 'Floor Arch Lamp', icon: '✨', targetPos: [-2.6, 0, -2.0], targetRotY: Math.PI / 4, isUnboxed: false, isPlaced: false },
    { id: 'bookcase', nameKo: '미니멀 북쉘프', nameEn: 'Minimal Bookshelf', icon: '📚', targetPos: [2.8, 0, -0.6], targetRotY: -Math.PI / 2, isUnboxed: false, isPlaced: false },
  ]);

  const activeItems = currentStage === 1 ? stage1Items : stage2Items;
  const setActiveItems = currentStage === 1 ? setStage1Items : setStage2Items;

  const placedCount = activeItems.filter((i) => i.isPlaced).length;

  // 3D 씬 Refs
  const threeRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    roomGroup: null as THREE.Group | null,
    itemMeshes: new Map<string, THREE.Group>(),
    ghostMeshes: new Map<string, THREE.Group>(),
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    cameraAngle: Math.PI / 4,
    cameraRadius: 13,
    isDragging: false,
    lastTouchX: 0,
    pointLight: null as THREE.PointLight | null,
  });

  // 영웅 카드 스프라이트 페이스 캐싱
  useEffect(() => {
    if (!heroSpriteCanvasRef.current) return;
    const ctx = heroSpriteCanvasRef.current.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, playerHeroId, 0, 0, 64, 64);
  }, [playerHeroId]);

  // 가구 3D 메쉬 생성 헬퍼 함수들
  const createBedMesh = () => {
    const group = new THREE.Group();
    // 우드 프레임
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 3.2), new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 }));
    frame.position.y = 0.2;
    group.add(frame);
    // 헤드보드
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x6e431f, roughness: 0.6 }));
    headboard.position.set(0, 0.9, -1.5);
    group.add(headboard);
    // 매트리스
    const mat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 3.0), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }));
    mat.position.y = 0.6;
    group.add(mat);
    // 이불 (파스텔 블루)
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.7 }));
    blanket.position.set(0, 0.75, 0.5);
    group.add(blanket);
    // 베개 2개
    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    pillow1.position.set(-0.55, 0.85, -1.0);
    const pillow2 = pillow1.clone();
    pillow2.position.x = 0.55;
    group.add(pillow1, pillow2);
    return group;
  };

  const createDeskMesh = () => {
    const group = new THREE.Group();
    // 상판
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.0), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 }));
    top.position.y = 1.3;
    group.add(top);
    // 철제 다리 4개
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.3);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
    const pos = [[-0.8, 0.65, -0.4], [0.8, 0.65, -0.4], [-0.8, 0.65, 0.4], [0.8, 0.65, 0.4]];
    pos.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      group.add(leg);
    });
    // 의자
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.7), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    chairSeat.position.set(0, 0.8, 0.8);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.08), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    chairBack.position.set(0, 1.2, 1.1);
    group.add(chairSeat, chairBack);
    // 책상 위 노트북
    const laptop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.4), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
    laptop.position.set(0, 1.38, 0);
    group.add(laptop);
    return group;
  };

  const createLampMesh = () => {
    const group = new THREE.Group();
    // 받침대
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 }));
    base.position.y = 0.04;
    group.add(base);
    // 기둥
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 12), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 }));
    pole.position.y = 1.1;
    group.add(pole);
    // 갓
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 }));
    shade.position.y = 2.1;
    group.add(shade);
    // 발광 구체
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfffbeb }));
    bulb.position.y = 2.0;
    group.add(bulb);
    return group;
  };

  const createPlantMesh = () => {
    const group = new THREE.Group();
    // 테라코타 화분
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.28, 0.7, 16), new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 }));
    pot.position.y = 0.35;
    group.add(pot);
    // 흙
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x271911 }));
    soil.position.y = 0.68;
    group.add(soil);
    // 몬스테라 잎사귀들
    const leafGeo = new THREE.BoxGeometry(0.5, 0.02, 0.7);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const ang = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(ang) * 0.25, 0.85 + i * 0.08, Math.sin(ang) * 0.25);
      leaf.rotation.y = ang;
      leaf.rotation.x = 0.4;
      group.add(leaf);
    }
    return group;
  };

  const createRugMesh = () => {
    const group = new THREE.Group();
    const rug = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.04, 32),
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 })
    );
    rug.position.y = 0.02;
    group.add(rug);
    // 안쪽 링 장식
    const innerRug = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.045, 32),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.9 })
    );
    innerRug.position.y = 0.022;
    group.add(innerRug);
    return group;
  };

  const createSofaMesh = () => {
    const group = new THREE.Group();
    // 베이스 쿠션
    const seat = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 1.2), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 }));
    seat.position.y = 0.45;
    group.add(seat);
    // 등받이
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 0.35), new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7 }));
    back.position.set(0, 1.0, -0.45);
    group.add(back);
    // 팔걸이 좌우
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 1.2), new THREE.MeshStandardMaterial({ color: 0x075985 }));
    armL.position.set(-1.45, 0.7, 0);
    const armR = armL.clone();
    armR.position.x = 1.45;
    group.add(armL, armR);
    // 쿠션 2개
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    cushion.position.set(-0.8, 0.75, -0.25);
    cushion.rotation.x = 0.2;
    const c2 = cushion.clone();
    c2.position.x = 0.8;
    group.add(cushion, c2);
    return group;
  };

  const createTvMesh = () => {
    const group = new THREE.Group();
    // 콘솔 선반
    const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.6, 0.8), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 }));
    consoleTable.position.y = 0.3;
    group.add(consoleTable);
    // 스탠드 & TV 화면
    const screen = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 0.08), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.7 }));
    screen.position.set(0, 1.5, 0);
    group.add(screen);
    // TV 켜진 화면 네온
    const display = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    display.position.set(0, 1.5, 0.05);
    group.add(display);
    return group;
  };

  const createCoffeeTableMesh = () => {
    const group = new THREE.Group();
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 }));
    top.position.y = 0.6;
    group.add(top);
    // 다리 3개
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.6), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
      leg.position.set(Math.cos(ang) * 0.6, 0.3, Math.sin(ang) * 0.6);
      group.add(leg);
    }
    // 찻잔
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.12), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    cup.position.set(0.1, 0.7, 0.1);
    group.add(cup);
    return group;
  };

  const createFloorLampMesh = () => {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08), new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 }));
    base.position.y = 0.04;
    group.add(base);
    const curve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6), new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9 }));
    curve.position.set(0, 1.3, 0);
    group.add(curve);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2 }));
    head.position.set(0.4, 2.6, 0);
    group.add(head);
    return group;
  };

  const createBookcaseMesh = () => {
    const group = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.6), new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.6 }));
    frame.position.y = 1.4;
    group.add(frame);
    // 선반 홈 & 책 오브젝트들
    for (let shelf = 0; shelf < 3; shelf++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4, 0.45),
        new THREE.MeshStandardMaterial({ color: shelf % 2 === 0 ? 0xef4444 : 0x3b82f6 })
      );
      book.position.set(-0.4 + shelf * 0.4, 0.6 + shelf * 0.8, 0);
      group.add(book);
    }
    return group;
  };

  // 아이템 ID에 따라 적절한 3D 메쉬 생성
  const buildMeshForItem = (itemId: string): THREE.Group => {
    switch (itemId) {
      case 'bed':
        return createBedMesh();
      case 'desk':
        return createDeskMesh();
      case 'lamp':
        return createLampMesh();
      case 'plant':
        return createPlantMesh();
      case 'rug':
        return createRugMesh();
      case 'sofa':
        return createSofaMesh();
      case 'tv':
        return createTvMesh();
      case 'table':
        return createCoffeeTableMesh();
      case 'floorlamp':
        return createFloorLampMesh();
      case 'bookcase':
        return createBookcaseMesh();
      default:
        return createBedMesh();
    }
  };

  // 고스트 메쉬(배치 가이드 반투명 실루엣) 생성
  const buildGhostMesh = (originalMesh: THREE.Group): THREE.Group => {
    const ghost = originalMesh.clone();
    ghost.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.material = new THREE.MeshBasicMaterial({
          color: 0x00f3ff,
          transparent: true,
          opacity: 0.28,
          wireframe: true,
        });
      }
    });
    return ghost;
  };

  // 파티클 생성
  const spawnConfetti = (pos: THREE.Vector3, count = 20) => {
    const scene = threeRef.current.scene;
    if (!scene) return;
    const colors = [0xfacc15, 0x38bdf8, 0xf43f5e, 0xa855f7, 0x4ade80];
    for (let i = 0; i < (lowSpecMode ? count / 2 : count); i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.02),
        new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
      );
      p.position.copy(pos);
      scene.add(p);
      threeRef.current.particles.push({
        mesh: p,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 3,
          (Math.random() - 0.5) * 6
        ),
        life: 0.8 + Math.random() * 0.4,
      });
    }
  };

  // Three.js 씬 초기화 및 룸 생성
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // 코지 나이트/모던 슬레이트
    threeRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 1.2, 0);
    threeRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    threeRef.current.renderer = renderer;

    // 조명
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    sunLight.position.set(12, 18, 8);
    sunLight.castShadow = !lowSpecMode;
    scene.add(sunLight);

    const pLight = new THREE.PointLight(0xffedd5, 0.8, 12);
    pLight.position.set(0, 4, 0);
    scene.add(pLight);
    threeRef.current.pointLight = pLight;

    // 오픈 코너 디오라마 룸 (방 크기: 8m x 8m, 높이 4m)
    const roomGroup = new THREE.Group();
    threeRef.current.roomGroup = roomGroup;
    scene.add(roomGroup);

    // 바닥 (우드 파켓)
    const floorGeo = new THREE.BoxGeometry(8, 0.3, 8);
    const floorMat = new THREE.MeshStandardMaterial({ color: currentStage === 1 ? 0xc28549 : 0x64748b, roughness: 0.5 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.15;
    floor.receiveShadow = !lowSpecMode;
    roomGroup.add(floor);

    // 북서쪽 벽 (Z = -4)
    const wall1Geo = new THREE.BoxGeometry(8, 4.2, 0.3);
    const wall1Mat = new THREE.MeshStandardMaterial({ color: currentStage === 1 ? 0xf8fafc : 0x334155, roughness: 0.7 });
    const wall1 = new THREE.Mesh(wall1Geo, wall1Mat);
    wall1.position.set(0, 1.95, -4.15);
    wall1.receiveShadow = !lowSpecMode;
    roomGroup.add(wall1);

    // 남서쪽 벽 (X = -4)
    const wall2Geo = new THREE.BoxGeometry(0.3, 4.2, 8);
    const wall2 = new THREE.Mesh(wall2Geo, wall1Mat);
    wall2.position.set(-4.15, 1.95, 0);
    wall2.receiveShadow = !lowSpecMode;
    roomGroup.add(wall2);

    // 벽면에 영웅 카드 스프라이트 액자 걸기
    const frameGeo = new THREE.BoxGeometry(1.2, 1.5, 0.08);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const heroFrame = new THREE.Mesh(frameGeo, frameMat);
    heroFrame.position.set(-1.5, 2.5, -3.98);
    roomGroup.add(heroFrame);

    // 창문 (벽 2에 설치)
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 2.2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    windowFrame.position.set(-3.98, 2.4, 1.0);
    const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.6), new THREE.MeshBasicMaterial({ color: 0x93c5fd }));
    windowGlass.rotation.y = Math.PI / 2;
    windowGlass.position.set(-3.94, 2.4, 1.0);
    roomGroup.add(windowFrame, windowGlass);

    // 가구 메쉬 및 고스트 가이드 생성
    threeRef.current.itemMeshes.clear();
    threeRef.current.ghostMeshes.clear();

    activeItems.forEach((item) => {
      const mesh = buildMeshForItem(item.id);
      mesh.position.set(item.targetPos[0], item.targetPos[1], item.targetPos[2]);
      mesh.rotation.y = item.targetRotY;
      mesh.visible = item.isPlaced;
      roomGroup.add(mesh);
      threeRef.current.itemMeshes.set(item.id, mesh);

      const ghost = buildGhostMesh(mesh);
      ghost.position.set(item.targetPos[0], item.targetPos[1], item.targetPos[2]);
      ghost.rotation.y = item.targetRotY;
      ghost.visible = !item.isPlaced;
      roomGroup.add(ghost);
      threeRef.current.ghostMeshes.set(item.id, ghost);
    });

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

    // 렌더링 루프
    let animId = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // 카메라 궤도 회전 적용
      const radius = threeRef.current.cameraRadius;
      const ang = threeRef.current.cameraAngle;
      camera.position.x = Math.sin(ang) * radius;
      camera.position.z = Math.cos(ang) * radius;
      camera.position.y = 8.5;
      camera.lookAt(0, 1.2, 0);

      // 고스트 메쉬 부드러운 펄스 애니메이션
      threeRef.current.ghostMeshes.forEach((ghost) => {
        if (ghost.visible) {
          const s = 1.0 + Math.sin(time * 0.005) * 0.03;
          ghost.scale.set(s, s, s);
        }
      });

      // 파티클 업데이트
      for (let i = threeRef.current.particles.length - 1; i >= 0; i--) {
        const p = threeRef.current.particles[i];
        p.vel.y -= 9.8 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        p.mesh.rotation.x += 0.1;
        p.mesh.rotation.y += 0.1;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          threeRef.current.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentStage, lowSpecMode]);

  // 가구 언박싱 & 배치 핸들러
  const handleItemAction = useCallback((item: FurnitureItem) => {
    setSelectedItemId(item.id);

    if (!item.isUnboxed) {
      // 1. 언박싱: 상자 오픈
      setActiveItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isUnboxed: true } : i))
      );
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      if (navigator.vibrate) navigator.vibrate(30);
      setScore((s) => s + 50);
      return;
    }

    if (!item.isPlaced) {
      // 2. 3D 디오라마 룸에 가구 배치
      const mesh = threeRef.current.itemMeshes.get(item.id);
      const ghost = threeRef.current.ghostMeshes.get(item.id);
      if (mesh) {
        mesh.visible = true;
        // 팝업 안착 탄성 애니메이션
        mesh.scale.set(0.1, 0.1, 0.1);
        let scale = 0.1;
        const popAnim = () => {
          scale += 0.15;
          if (scale < 1.0) {
            mesh.scale.set(scale, scale, scale);
            requestAnimationFrame(popAnim);
          } else {
            mesh.scale.set(1.0, 1.0, 1.0);
          }
        };
        requestAnimationFrame(popAnim);
      }
      if (ghost) ghost.visible = false;

      spawnConfetti(new THREE.Vector3(item.targetPos[0], item.targetPos[1], item.targetPos[2]), 25);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]);

      setActiveItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isPlaced: true } : i))
      );

      const newScore = score + 250;
      setScore(newScore);

      // 전체 배치 완료 검사
      const updatedPlaced = activeItems.filter((i) => i.isPlaced || i.id === item.id).length;
      if (updatedPlaced >= activeItems.length) {
        // 스테이지 완료
        setTimeout(() => {
          if (currentStage < totalStages) {
            // 다음 스테이지(리빙룸) 오픈
            setCurrentStage((s) => s + 1);
            setSelectedItemId(null);
            if (navigator.vibrate) navigator.vibrate(80);
          } else {
            // 최종 완공 및 보상
            setIsVictory(true);
            const receipt = calculateAndDepositMissionReward({
              gameId: 'poki_decor_life',
              gameTitle: 'Decor Life 3D',
              durationSeconds: 45,
              score: newScore + 500,
              maxTargetScore: 2000,
              isVictory: true,
            });
            setSettlementReceipt(receipt);
            if (onReward) { onReward(receipt.totalSns); }
          }
        }, 800);
      }
    }
  }, [activeItems, currentStage, onReward, playSfx, score, setActiveItems, totalStages]);

  // 가구 90도 회전
  const handleRotate = useCallback(() => {
    if (!selectedItemId) return;
    const mesh = threeRef.current.itemMeshes.get(selectedItemId);
    if (!mesh) return;

    mesh.rotation.y += Math.PI / 2;
    if (navigator.vibrate) navigator.vibrate(20);
    setActiveItems((prev) =>
      prev.map((i) => (i.id === selectedItemId ? { ...i, targetRotY: mesh.rotation.y } : i))
    );
  }, [selectedItemId, setActiveItems]);

  // 터치 드래그로 3D 룸 궤도 회전
  const handleTouchStart = (e: React.TouchEvent) => {
    // 하단 트레이 영역 터치 제외
    if (e.touches[0].clientY > window.innerHeight * 0.72) return;
    threeRef.current.isDragging = true;
    threeRef.current.lastTouchX = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!threeRef.current.isDragging) return;
    const curX = e.touches[0].clientX;
    const dx = curX - threeRef.current.lastTouchX;
    threeRef.current.lastTouchX = curX;
    threeRef.current.cameraAngle -= dx * 0.008;
  };

  const handleTouchEnd = () => {
    threeRef.current.isDragging = false;
  };

  // 튜토리얼 스텝
  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '데코 라이프 3D 디오라마' : 'Decor Life 3D Diorama',
      badge: 'DECOR 3D',
      description: isKo
        ? '어수선한 빈 방을 아름다운 3D 가구로 채워 나만의 꿈의 힐링 공간을 완성하세요!'
        : 'Furnish the room with beautiful 3D furniture to create your dream space!',
      keyPoints: isKo
        ? ['하단 택배 상자를 탭하여 가구 언박싱', '언박싱된 가구를 탭하여 3D 룸에 배치']
        : ['Tap packages to unbox furniture', 'Tap unboxed items to place them into the 3D room'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '3D 궤도 회전 & 가구 회전' : '3D View & Rotate Controls',
      badge: 'CONTROLS',
      description: isKo
        ? '화면을 드래그해 방을 360° 둘러보고, 회전 버튼으로 가구 방향을 맞출 수 있습니다.'
        : 'Drag screen to rotate the 3D room, and use Rotate to adjust furniture angle.',
      keyPoints: isKo
        ? ['상단 화면 드래그로 3D 룸 자유 회전', '[회전] 버튼으로 선택된 가구 90° 회전']
        : ['Drag upper screen to rotate 3D view', 'Tap [ROTATE] to spin selected furniture by 90°'],
      iconType: 'GESTURES',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="Decor Life 3D"
        score={score}
        targetScore={1500}
        timeLeft={0}
        onQuit={handleExit}
        isKo={isKo}
        rewardUnit="SNS"
        customStatLabel={isKo ? '룸 진행도' : 'PROGRESS'}
        customStatValue={`Stage ${currentStage}/${totalStages} (${placedCount}/${activeItems.length})`}
      />

      {/* 룸 테마 배지 & 영웅 카드 액자 배지 */}
      <div className="absolute top-16 left-4 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 border border-amber-500/40">
        <canvas ref={heroSpriteCanvasRef} width={36} height={36} className="w-9 h-9 border border-amber-400 bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-[10px] text-amber-300 font-bold">
            {currentStage === 1 ? (isKo ? '🏠 1단계: 코지 베드룸' : '🏠 Stage 1: Cozy Bedroom') : (isKo ? '🛋️ 2단계: 모던 리빙룸' : '🛋️ Stage 2: Modern Living')}
          </span>
          <span className="text-xs text-slate-300">
            {placedCount} / {activeItems.length} {isKo ? '가구 배치됨' : 'Furnished'}
          </span>
        </div>
      </div>

      {/* 우측 3D 회전 제어 안내 및 회전 버튼 */}
      <div className="absolute top-16 right-4 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleRotate}
          disabled={!selectedItemId}
          className={`px-3 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1 shadow-md ${
            selectedItemId
              ? 'bg-amber-600 border-amber-300 text-white active:scale-95'
              : 'bg-slate-800/80 border-slate-700 text-slate-500 opacity-60'
          }`}
        >
          <span>🔄</span>
          <span>{isKo ? '가구 90° 회전' : 'ROTATE'}</span>
        </button>
        <span className="text-[10px] text-slate-400 bg-slate-900/60 px-2 py-0.5 pointer-events-none">
          {isKo ? '화면 드래그: 3D 뷰 회전' : 'Drag screen to rotate view'}
        </span>
      </div>

      {/* 하단 퓨어 터치 언박싱 & 가구 배치 트레이 */}
      <div className="absolute bottom-4 left-0 right-0 z-30 px-3 pointer-events-auto">
        <div className="max-w-xl mx-auto bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2.5 rounded-sm shadow-2xl">
          <div className="text-[11px] text-slate-400 mb-1.5 flex justify-between items-center px-1">
            <span>{isKo ? '📦 언박싱 & 인테리어 트레이' : '📦 Unboxing & Decor Tray'}</span>
            <span className="text-amber-400 font-bold">
              {isKo ? '탭하여 언박싱 및 배치' : 'Tap to unbox & place'}
            </span>
          </div>

          {/* 5개 가구 슬롯 */}
          <div className="grid grid-cols-5 gap-2">
            {activeItems.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemAction(item)}
                  className={`flex flex-col items-center justify-center p-2 rounded-sm border transition-all active:scale-95 relative ${
                    item.isPlaced
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : item.isUnboxed
                      ? 'bg-amber-950/70 border-amber-400 text-amber-200 animate-pulse'
                      : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:border-slate-400'
                  } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
                >
                  {/* 상태 배지 */}
                  <span className="text-2xl mb-1">
                    {item.isPlaced ? item.icon : item.isUnboxed ? item.icon : '📦'}
                  </span>
                  <span className="text-[10px] font-bold truncate max-w-full text-center">
                    {isKo ? item.nameKo.split(' ')[0] : item.nameEn.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    {item.isPlaced ? '✓ 완료' : item.isUnboxed ? '배치' : '오픈'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_decor_life', 'true');
            } catch {
              // ignore
            }
          }}
          isKo={isKo}
        />
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

export default PokiDecorLifeGame;
