import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSnapStyleDressUpGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

const CATEGORIES = [
  {
    key: 'hair',
    name: '헤어스타일',
    options: [
      { id: 1, label: '골든 포니테일', color: 0xfacc15, icon: '👱‍♀️' },
      { id: 2, label: '네온 핑크 웨이브', color: 0xf43f5e, icon: '👩‍🦰' },
      { id: 3, label: '사이버 블루 밥', color: 0x38bdf8, icon: '👧' },
      { id: 4, label: '시크 다크 트윈', color: 0x1e1b4b, icon: '👩' },
    ],
  },
  {
    key: 'top',
    name: '탑 상의',
    options: [
      { id: 1, label: '크롭 레더 재킷', color: 0x18181b, icon: '🧥' },
      { id: 2, label: '스트릿 오버핏 후디', color: 0xec4899, icon: '👚' },
      { id: 3, label: '홀로그램 블레이저', color: 0x06b6d4, icon: '🥼' },
      { id: 4, label: '오프숄더 벨벳 탑', color: 0x7c3aed, icon: '👕' },
    ],
  },
  {
    key: 'bottom',
    name: '바텀 하의',
    options: [
      { id: 1, label: '와이드 카고 팬츠', color: 0x475569, icon: '👖' },
      { id: 2, label: '네온 플리츠 스커트', color: 0xf43f5e, icon: '👗' },
      { id: 3, label: '디스트로이드 데님', color: 0x3b82f6, icon: '🩳' },
      { id: 4, label: '하이웨이스트 슬랙스', color: 0x0f172a, icon: '👖' },
    ],
  },
  {
    key: 'acc',
    name: '액세서리',
    options: [
      { id: 1, label: '캣아이 틴트 글래스', color: 0xf59e0b, icon: '🕶️' },
      { id: 2, label: '체인 숄더백', color: 0xe2e8f0, icon: '👜' },
      { id: 3, label: '럭셔리 토트백', color: 0xb45309, icon: '🛍️' },
      { id: 4, label: '골드 하트 초커', color: 0xfacc15, icon: '✨' },
    ],
  },
];

export default function PokiSnapStyleDressUpGame({
  onBack,
  onClose,
  cardId = 83,
  onExit
}: PokiSnapStyleDressUpGameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'styling' | 'snapped' | 'victory'>('ready');
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({
    hair: 1,
    top: 1,
    bottom: 1,
    acc: 1,
  });
  const [currentPose, setCurrentPose] = useState<number>(1);
  const [photoFlash, setPhotoFlash] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 3D 내부 참조 Ref
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 모델 & 턴테이블
    modelGroup: null as THREE.Group | null,
    turntableMesh: null as THREE.Mesh | null,
    rotY: 0,
    targetRotY: 0,
    isDragging: false,
    lastTouchX: 0,

    // 교체 가능한 메쉬 파츠들
    hairMeshes: [] as THREE.Mesh[],
    topMeshes: [] as THREE.Mesh[],
    bottomMeshes: [] as THREE.Mesh[],
    accMeshes: [] as THREE.Mesh[],

    // 관절 (포즈 변경용)
    leftArm: null as THREE.Mesh | null,
    rightArm: null as THREE.Mesh | null,

    particles: [] as Particle[],
    particleGeo: new THREE.SphereGeometry(0.06, 6, 6),
    startTime: Date.now(),
  });

  const activeCategory = CATEGORIES[activeCatIndex];

  // 파티클 생성
  const spawnParticles = (pos: THREE.Vector3, colorHex: number, count: number) => {
    const scene = stateRef.current.scene;
    if (!scene) return;
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(stateRef.current.particleGeo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      stateRef.current.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() * 0.8 + 0.3) * 2.5,
        vz: (Math.random() - 0.5) * 2.5,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
      });
    }
  };

  // 아이템 선택
  const handleSelectItem = (catKey: string, optId: number) => {
    setSelectedItems((prev) => ({ ...prev, [catKey]: optId }));
    if (navigator.vibrate) navigator.vibrate(20);

    // 파티클
    if (stateRef.current.modelGroup) {
      const pos = new THREE.Vector3(0, 1.4, 0);
      const cat = CATEGORIES.find((c) => c.key === catKey);
      const opt = cat?.options.find((o) => o.id === optId);
      spawnParticles(pos, opt ? opt.color : 0xfacc15, 15);
    }

    // 3D 모델 메쉬 가시성 갱신
    updateModelMeshes(catKey, optId);
  };

  // 3D 메쉬 교체
  const updateModelMeshes = (catKey: string, optId: number) => {
    const s = stateRef.current;
    if (catKey === 'hair') {
      s.hairMeshes.forEach((m, idx) => (m.visible = idx + 1 === optId));
    } else if (catKey === 'top') {
      s.topMeshes.forEach((m, idx) => (m.visible = idx + 1 === optId));
    } else if (catKey === 'bottom') {
      s.bottomMeshes.forEach((m, idx) => (m.visible = idx + 1 === optId));
    } else if (catKey === 'acc') {
      s.accMeshes.forEach((m, idx) => (m.visible = idx + 1 === optId));
    }
  };

  // 포즈 변경 (POSE)
  const togglePose = () => {
    const nextPose = (currentPose % 3) + 1;
    setCurrentPose(nextPose);
    if (navigator.vibrate) navigator.vibrate(25);

    const s = stateRef.current;
    if (s.leftArm && s.rightArm) {
      if (nextPose === 1) {
        // 기본 런웨이 포즈
        s.leftArm.rotation.set(0, 0, 0.2);
        s.rightArm.rotation.set(0, 0, -0.2);
      } else if (nextPose === 2) {
        // 핸즈 온 힙 (허리 손)
        s.leftArm.rotation.set(0, 0, 0.7);
        s.rightArm.rotation.set(0, 0, -0.7);
      } else {
        // 모델 윙크 포즈
        s.leftArm.rotation.set(-0.6, 0, 0.4);
        s.rightArm.rotation.set(0, 0, -0.9);
      }
    }
  };

  // 셔터 스냅샷 촬영 (SNAP PHOTO!)
  const handleSnapPhoto = useCallback(() => {
    setPhotoFlash(true);
    if (navigator.vibrate) navigator.vibrate([30, 50, 80]);

    setTimeout(() => {
      setPhotoFlash(false);
      setGameState('victory');

      const s = stateRef.current;
      const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
      const receipt = calculateAndDepositMissionReward({
        gameId: 'snapstyle-dress-up',
        gameTitle: '스냅스타일 드레스업 3D (SnapStyle Dress Up)',
        isVictory: true,
        score: 1000,
        maxTargetScore: 1000,
        durationSeconds: duration,
      });
      setRewardReceipt(receipt);
    }, 600);
  }, []);

  // 터치 드래그 (3D 모델 360° 회전)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      stateRef.current.isDragging = true;
      stateRef.current.lastTouchX = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!stateRef.current.isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - stateRef.current.lastTouchX;
    stateRef.current.lastTouchX = e.touches[0].clientX;
    stateRef.current.targetRotY += dx * 0.018;
  };

  const handleTouchEnd = () => {
    stateRef.current.isDragging = false;
  };

  // 중도 포기 정산
  const confirmExit = () => {
    setShowExitModal(false);
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    calculateAndDepositMissionReward({
      gameId: 'snapstyle-dress-up',
      gameTitle: '스냅스타일 드레스업 3D (SnapStyle Dress Up)',
      isVictory: false,
      score: 600,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    handleExit();
  };

  // Three.js 환경 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfcdad7); // 럭셔리 퍼플 런웨이 스튜디오
    stateRef.current.scene = scene;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.8, 6.2);
    camera.lookAt(0, 1.2, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    keyLight.position.set(5, 8, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf43f5e, 1.0);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // 원형 런웨이 턴테이블
    const turntableGeo = new THREE.CylinderGeometry(2.5, 2.7, 0.3, 32);
    const turntableMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.6, roughness: 0.2 });
    const turntable = new THREE.Mesh(turntableGeo, turntableMat);
    turntable.position.y = -0.15;
    scene.add(turntable);
    stateRef.current.turntableMesh = turntable;

    // 배경 스크린 No.083 공식 카드 영웅 배지 엠블럼
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const badgeCtx = badgeCanvas.getContext('2d');
    if (badgeCtx) {
      drawCardSprite(badgeCtx, cardId, 0, 0, 256, 256);
      const badgeTex = new THREE.CanvasTexture(badgeCanvas);
      const badgePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 2.6),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })
      );
      badgePlane.position.set(0, 2.8, -3.5);
      scene.add(badgePlane);
    }

    // --- 3D 패션 아바타 모델링 ---
    const modelGroup = new THREE.Group();

    // 베이스 바디 (머리/얼굴)
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), skinMat);
    head.position.y = 2.0;
    modelGroup.add(head);

    // 눈 2개 & 입술
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    eyeL.position.set(-0.1, 2.05, 0.32);
    modelGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    eyeR.position.set(0.1, 2.05, 0.32);
    modelGroup.add(eyeR);

    // 목
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.25, 8), skinMat);
    neck.position.y = 1.7;
    modelGroup.add(neck);

    // 양팔 관절
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.7, 6), skinMat);
    leftArm.position.set(-0.45, 1.25, 0);
    modelGroup.add(leftArm);
    stateRef.current.leftArm = leftArm;

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.7, 6), skinMat);
    rightArm.position.set(0.45, 1.25, 0);
    modelGroup.add(rightArm);
    stateRef.current.rightArm = rightArm;

    // 양다리
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.9, 6), skinMat);
    legL.position.set(-0.2, 0.45, 0);
    modelGroup.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.9, 6), skinMat);
    legR.position.set(0.2, 0.45, 0);
    modelGroup.add(legR);

    // --- 헤어 4종 ---
    const hairMeshes: THREE.Mesh[] = [];
    CATEGORIES[0].options.forEach((opt, idx) => {
      const hMat = new THREE.MeshStandardMaterial({ color: opt.color, roughness: 0.4 });
      const hGroup = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.7),
        hMat
      );
      hGroup.position.set(0, 2.08, 0);
      hGroup.visible = idx === 0;
      modelGroup.add(hGroup);
      hairMeshes.push(hGroup);
    });
    stateRef.current.hairMeshes = hairMeshes;

    // --- 상의 4종 ---
    const topMeshes: THREE.Mesh[] = [];
    CATEGORIES[1].options.forEach((opt, idx) => {
      const tMat = new THREE.MeshStandardMaterial({ color: opt.color, roughness: 0.3 });
      const tMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.75, 8), tMat);
      tMesh.position.set(0, 1.3, 0);
      tMesh.visible = idx === 0;
      modelGroup.add(tMesh);
      topMeshes.push(tMesh);
    });
    stateRef.current.topMeshes = topMeshes;

    // --- 하의 4종 ---
    const bottomMeshes: THREE.Mesh[] = [];
    CATEGORIES[2].options.forEach((opt, idx) => {
      const bMat = new THREE.MeshStandardMaterial({ color: opt.color, roughness: 0.4 });
      const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.8, 8), bMat);
      bMesh.position.set(0, 0.6, 0);
      bMesh.visible = idx === 0;
      modelGroup.add(bMesh);
      bottomMeshes.push(bMesh);
    });
    stateRef.current.bottomMeshes = bottomMeshes;

    // --- 액세서리 4종 ---
    const accMeshes: THREE.Mesh[] = [];
    CATEGORIES[3].options.forEach((opt, idx) => {
      const aMat = new THREE.MeshStandardMaterial({ color: opt.color, metalness: 0.5 });
      const aMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.25), aMat);
      aMesh.position.set(0, 2.05, 0.3);
      aMesh.visible = idx === 0;
      modelGroup.add(aMesh);
      accMeshes.push(aMesh);
    });
    stateRef.current.accMeshes = accMeshes;

    scene.add(modelGroup);
    stateRef.current.modelGroup = modelGroup;

    // 리사이즈
    const handleResize = () => {
      if (!container || !stateRef.current.renderer || !stateRef.current.camera) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      stateRef.current.camera.aspect = nw / nh;
      stateRef.current.camera.updateProjectionMatrix();
      stateRef.current.renderer.setSize(nw, nh, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 렌더링 루프
    const animate = () => {
      stateRef.current.animFrame = requestAnimationFrame(animate);
      const dt = Math.min(stateRef.current.clock.getDelta(), 0.1);
      const s = stateRef.current;

      // 부드러운 회전 보간
      s.rotY += (s.targetRotY - s.rotY) * 0.1;

      if (s.modelGroup) {
        s.modelGroup.rotation.y = s.rotY;
      }
      if (s.turntableMesh) {
        s.turntableMesh.rotation.y = s.rotY;
      }

      // 파티클
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 3.0 * dt;
        const scale = Math.max(0.01, 1 - p.life / p.maxLife);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          s.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    stateRef.current.animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(stateRef.current.animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cardId]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fcdad7] font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 플래시 셔터 이펙트 */}
      {photoFlash && (
        <div className="absolute inset-0 bg-white z-50 animate-ping pointer-events-none" />
      )}

      {/* 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="SNAPSTYLE DRESS UP 3D"
        scoreDisplay={`STYLE: 100/100 | POSE: ${currentPose}`}
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 화면 조작 안내 */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 border border-pink-500/40 rounded-full text-[11px] text-pink-300 pointer-events-none z-10">
        화면 드래그: 3D 모델 회전
      </div>

      {/* 하단 카테고리 탭 & 아이템 바 */}
      {gameState === 'styling' && (
        <div className="absolute bottom-6 left-3 right-3 flex flex-col gap-2 z-20 pointer-events-auto">
          {/* 카테고리 탭 바 */}
          <div className="flex justify-center gap-1.5 bg-black/70 backdrop-blur-md p-1 border border-slate-700 rounded-sm">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCatIndex(idx);
                  if (navigator.vibrate) navigator.vibrate(15);
                }}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-sm transition-all ${
                  activeCatIndex === idx
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 아이템 선택 캐러셀 & 액션 버튼 */}
          <div className="flex justify-between items-center gap-2">
            {/* 4개 옵션 아이템 카드 */}
            <div className="flex-1 flex gap-2 p-1.5 bg-black/70 backdrop-blur-md border border-slate-700 rounded-sm overflow-x-auto">
              {activeCategory.options.map((opt) => {
                const isSelected = selectedItems[activeCategory.key] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectItem(activeCategory.key, opt.id)}
                    className={`flex-1 min-w-[64px] py-2 flex flex-col items-center justify-center rounded-sm border transition-all ${
                      isSelected
                        ? 'border-pink-400 bg-pink-500/20 scale-105 shadow-md'
                        : 'border-slate-700 bg-slate-800/60 opacity-80'
                    }`}
                  >
                    <span className="text-xl mb-1">{opt.icon}</span>
                    <span className="text-[10px] text-slate-200 font-bold truncate max-w-[56px]">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 우측 액션 버튼 군 */}
            <div className="flex gap-2 items-center">
              {/* 포즈 변경 (POSE) */}
              <button
                onClick={togglePose}
                className="w-14 h-14 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 text-white font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 border-indigo-300"
              >
                <span>POSE</span>
                <span className="text-[8px]">포즈 {currentPose}</span>
              </button>

              {/* 76px 셔터 스냅샷 촬영 (SNAP PHOTO!) */}
              <button
                onClick={handleSnapPhoto}
                className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-pink-500 to-rose-600 text-white font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white animate-pulse"
              >
                <span>SNAP!</span>
                <span className="text-[9px] font-bold">촬영하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 시작(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30 pointer-events-auto">
          <div className="bg-slate-900 border-2 border-pink-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-pink-400 mb-2">SNAPSTYLE DRESS UP 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              3D 런웨이 무대에서 나만의 패션 아바타를 스타일링하세요!
              <br />
              <span className="text-pink-300 font-bold">헤어, 상의, 하의, 액세서리</span>를 자유롭게 조합하고,
              <br />
              <span className="text-indigo-300 font-bold">[POSE]</span>로 포즈를 취한 뒤
              <br />
              <span className="text-rose-400 font-bold">[SNAP!]</span>으로 멋진 룩북 사진을 완성하세요!
            </p>
            <button
              onClick={() => setGameState('styling')}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ 스타일링 시작하기 ]
            </button>
          </div>
        </div>
      )}

      {/* 승리 보상 모달 */}
      {gameState === 'victory' && rewardReceipt && (
        <VictoryRewardModal
          isOpen={true}
          receipt={rewardReceipt}
          onClose={handleExit}
        />
      )}

      {/* 중도 포기 확인 모달 */}
      {showExitModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-40 pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 p-5 max-w-xs w-full text-center rounded-sm">
            <h3 className="text-lg font-bold text-white mb-2">스타일링을 마칠까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지 완성한 스타일에 따라 SNS 보상이 안전하게 정산됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmExit}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-sm active:scale-95"
              >
                마치기
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2 bg-slate-700 text-slate-200 font-bold text-xs rounded-sm active:scale-95"
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PokiSnapStyleDressUpGame };
