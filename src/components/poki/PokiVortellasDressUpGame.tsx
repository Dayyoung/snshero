import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiVortellasDressUpGameProps {
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
    key: 'hat',
    name: '마녀 모자',
    options: [
      { id: 1, label: '심연의 고깔모자', color: 0x4c1d95, icon: '🧙‍♀️' },
      { id: 2, label: '달빛 깃털 모자', color: 0x0284c7, icon: '🎩' },
      { id: 3, label: '붉은 장미 베일', color: 0xbe123c, icon: '🌹' },
      { id: 4, label: '혼 마녀 티아라', color: 0x18181b, icon: '👑' },
    ],
  },
  {
    key: 'robe',
    name: '주술 로브',
    options: [
      { id: 1, label: '성운의 밤하늘 로브', color: 0x581c87, icon: '🧥' },
      { id: 2, label: '벨벳 레드 드레스', color: 0x991b1b, icon: '👗' },
      { id: 3, label: '다크 코르셋 가운', color: 0x09090b, icon: '👚' },
      { id: 4, label: '에메랄드 주술 가운', color: 0x065f46, icon: '🥼' },
    ],
  },
  {
    key: 'orb',
    name: '신비의 오브',
    options: [
      { id: 1, label: '예지력의 퍼플 구', color: 0xa855f7, icon: '🔮' },
      { id: 2, label: '영혼의 에메랄드 구', color: 0x10b981, icon: '🟢' },
      { id: 3, label: '블러드 루비 구', color: 0xef4444, icon: '🔴' },
      { id: 4, label: '황금 태양 룬 구', color: 0xfacc15, icon: '🟡' },
    ],
  },
  {
    key: 'staff',
    name: '마법 스태프',
    options: [
      { id: 1, label: '초승달 룬 지팡이', color: 0xfbbf24, icon: '🪄' },
      { id: 2, label: '흑요석 마법봉', color: 0x475569, icon: '🦯' },
      { id: 3, label: '스컬 룬 지팡이', color: 0x94a3b8, icon: '💀' },
      { id: 4, label: '크리스털 완드', color: 0x38bdf8, icon: '✨' },
    ],
  },
];

export default function PokiVortellasDressUpGame({
  onBack,
  onClose,
  cardId = 85,
  onExit
}: PokiVortellasDressUpGameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'customizing' | 'casting' | 'victory'>('ready');
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({
    hat: 1,
    robe: 1,
    orb: 1,
    staff: 1,
  });
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 3D 내부 참조 Ref
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 모델 및 제단
    modelGroup: null as THREE.Group | null,
    altarMesh: null as THREE.Mesh | null,
    runeCircle: null as THREE.Mesh | null,
    orbMesh: null as THREE.Mesh | null,
    rotY: 0,
    targetRotY: 0,
    isDragging: false,
    lastTouchX: 0,

    // 파츠 메쉬 목록
    hatMeshes: [] as THREE.Mesh[],
    robeMeshes: [] as THREE.Mesh[],
    orbMeshes: [] as THREE.Mesh[],
    staffMeshes: [] as THREE.Mesh[],

    particles: [] as Particle[],
    particleGeo: new THREE.SphereGeometry(0.07, 6, 6),
    isCasting: false,
    castTimer: 0,
    startTime: Date.now(),
  });

  const activeCategory = CATEGORIES[activeCatIndex];

  // 파티클 생성
  const spawnParticles = (pos: THREE.Vector3, colorHex: number, count: number, speed: number = 3) => {
    const scene = stateRef.current.scene;
    if (!scene) return;
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(stateRef.current.particleGeo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      stateRef.current.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() * 0.8 + 0.3) * speed,
        vz: (Math.random() - 0.5) * speed,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
      });
    }
  };

  // 아이템 변경
  const handleSelectItem = (catKey: string, optId: number) => {
    setSelectedItems((prev) => ({ ...prev, [catKey]: optId }));
    if (navigator.vibrate) navigator.vibrate(20);

    const cat = CATEGORIES.find((c) => c.key === catKey);
    const opt = cat?.options.find((o) => o.id === optId);
    if (stateRef.current.modelGroup) {
      spawnParticles(new THREE.Vector3(0, 1.5, 0), opt ? opt.color : 0xa855f7, 16);
    }

    // 3D 메쉬 업데이트
    const s = stateRef.current;
    if (catKey === 'hat') {
      s.hatMeshes.forEach((m, idx) => (m.visible = idx + 1 === optId));
    } else if (catKey === 'robe') {
      s.robeMeshes.forEach((m, idx) => (m.visible = idx + 1 === optId));
    } else if (catKey === 'orb') {
      s.orbMeshes.forEach((m, idx) => (m.visible = idx + 1 === optId));
    } else if (catKey === 'staff') {
      s.staffMeshes.forEach((m, idx) => (m.visible = idx + 1 === optId));
    }
  };

  // 마법 아우라 부스트
  const triggerAura = () => {
    spawnParticles(new THREE.Vector3(0, 1.2, 0), 0xa855f7, 30, 4.5);
    if (navigator.vibrate) navigator.vibrate([25, 35]);
  };

  // 주술 의식 시전 (CAST RITUAL)
  const handleCastRitual = useCallback(() => {
    setGameState('casting');
    stateRef.current.isCasting = true;
    stateRef.current.castTimer = 0;

    spawnParticles(new THREE.Vector3(0, 1.5, 0), 0xc084fc, 45, 6);
    spawnParticles(new THREE.Vector3(0, 1.5, 0), 0xfacc15, 35, 5);
    if (navigator.vibrate) navigator.vibrate([40, 60, 80, 100]);

    setTimeout(() => {
      setGameState('victory');
      const s = stateRef.current;
      const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
      const receipt = calculateAndDepositMissionReward({
        gameId: 'vortellas-dress-up',
        gameTitle: '보르텔라의 드레스업 3D (Vortella\'s Dress Up)',
        isVictory: true,
        score: 1000,
        maxTargetScore: 1000,
        durationSeconds: duration,
      });
      setRewardReceipt(receipt);
    }, 1200);
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
      gameId: 'vortellas-dress-up',
      gameTitle: '보르텔라의 드레스업 3D (Vortella\'s Dress Up)',
      isVictory: false,
      score: 700,
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
    scene.background = new THREE.Color(0xfcdad7); // 심연의 블랙 & 퍼플
    scene.fog = new THREE.FogExp2(0xfcdad7, 0.02);
    stateRef.current.scene = scene;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 2.0, 6.2);
    camera.lookAt(0, 1.2, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 2.0, 15);
    purpleLight.position.set(0, 4, 3);
    scene.add(purpleLight);

    const moonLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    moonLight.position.set(-5, 8, -5);
    scene.add(moonLight);

    // 원형 고딕 제단 턴테이블
    const altarGeo = new THREE.CylinderGeometry(2.5, 2.8, 0.35, 32);
    const altarMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.5, roughness: 0.4 });
    const altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.y = -0.18;
    scene.add(altar);
    stateRef.current.altarMesh = altar;

    // 회전하는 룬 마법진 링
    const runeGeo = new THREE.RingGeometry(1.8, 2.3, 32);
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const runeCircle = new THREE.Mesh(runeGeo, runeMat);
    runeCircle.rotation.x = -Math.PI / 2;
    runeCircle.position.y = 0.02;
    scene.add(runeCircle);
    stateRef.current.runeCircle = runeCircle;

    // 제단 중앙 No.085 공식 카드 영웅 배지 엠블럼
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const badgeCtx = badgeCanvas.getContext('2d');
    if (badgeCtx) {
      drawCardSprite(badgeCtx, cardId, 0, 0, 256, 256);
      const badgeTex = new THREE.CanvasTexture(badgeCanvas);
      const badgePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 2.2),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, opacity: 0.9 })
      );
      badgePlane.rotation.x = -Math.PI / 2;
      badgePlane.position.set(0, 0.04, 0);
      scene.add(badgePlane);
    }

    // 제단 촛대 4개
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      candle.position.set(Math.cos(angle) * 2.1, 0.3, Math.sin(angle) * 2.1);
      scene.add(candle);

      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      flame.position.set(Math.cos(angle) * 2.1, 0.65, Math.sin(angle) * 2.1);
      scene.add(flame);
    }

    // --- 3D 보르텔라 마녀 모델링 ---
    const modelGroup = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });

    // 머리
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 14), skinMat);
    head.position.y = 1.9;
    modelGroup.add(head);

    // 고딕 마녀 모자 4종
    const hatMeshes: THREE.Mesh[] = [];
    CATEGORIES[0].options.forEach((opt, idx) => {
      const hMat = new THREE.MeshStandardMaterial({ color: opt.color, roughness: 0.3 });
      const hMesh = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.8, 12), hMat);
      hMesh.position.set(0, 2.5, 0);
      hMesh.visible = idx === 0;
      modelGroup.add(hMesh);
      hatMeshes.push(hMesh);
    });
    stateRef.current.hatMeshes = hatMeshes;

    // 주술 로브 4종
    const robeMeshes: THREE.Mesh[] = [];
    CATEGORIES[1].options.forEach((opt, idx) => {
      const rMat = new THREE.MeshStandardMaterial({ color: opt.color, roughness: 0.3, metalness: 0.2 });
      const rMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 1.4, 12), rMat);
      rMesh.position.y = 1.0;
      rMesh.visible = idx === 0;
      modelGroup.add(rMesh);
      robeMeshes.push(rMesh);
    });
    stateRef.current.robeMeshes = robeMeshes;

    // 공중 부유 오브 4종 (좌측 손 위)
    const orbMeshes: THREE.Mesh[] = [];
    CATEGORIES[2].options.forEach((opt, idx) => {
      const oMat = new THREE.MeshBasicMaterial({ color: opt.color });
      const oMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), oMat);
      oMesh.position.set(-0.65, 1.4, 0.3);
      oMesh.visible = idx === 0;
      modelGroup.add(oMesh);
      orbMeshes.push(oMesh);
    });
    stateRef.current.orbMeshes = orbMeshes;

    // 마법 스태프 4종 (우측 손)
    const staffMeshes: THREE.Mesh[] = [];
    CATEGORIES[3].options.forEach((opt, idx) => {
      const sGroup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), new THREE.MeshStandardMaterial({ color: opt.color, metalness: 0.6 }));
      sGroup.position.set(0.65, 1.2, 0.1);

      // 상단 헤드
      const headGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
      headGem.position.set(0, 0.85, 0);
      sGroup.add(headGem);

      sGroup.visible = idx === 0;
      modelGroup.add(sGroup);
      staffMeshes.push(sGroup);
    });
    stateRef.current.staffMeshes = staffMeshes;

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
      const time = s.clock.getElapsedTime();

      // 모델 회전 보간
      s.rotY += (s.targetRotY - s.rotY) * 0.1;

      // 룬 마법진 기본 회전
      if (s.runeCircle) {
        s.runeCircle.rotation.z += (s.isCasting ? 5.0 : 0.8) * dt;
      }

      if (s.modelGroup) {
        if (s.isCasting) {
          // 시전 시 공중 부유 및 360도 스핀
          s.castTimer += dt;
          s.modelGroup.position.y = 0.5 + Math.sin(s.castTimer * 4) * 0.4;
          s.modelGroup.rotation.y += 2.5 * dt;
        } else {
          s.modelGroup.position.y = 0;
          s.modelGroup.rotation.y = s.rotY;
        }
      }

      // 공중 부유 오브 애니메이션 (위아래 바운스)
      s.orbMeshes.forEach((o) => {
        if (o.visible) {
          o.position.y = 1.4 + Math.sin(time * 3) * 0.1;
        }
      });

      // 파티클
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 2.0 * dt;
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
      {/* 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="VORTELLA'S DRESS UP 3D"
        scoreDisplay="MANA: 100% | RITUAL READY"
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 화면 조작 안내 */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 border border-purple-500/40 rounded-full text-[11px] text-purple-300 pointer-events-none z-10">
        화면 드래그: 3D 마녀 회전
      </div>

      {/* 하단 카테고리 탭 & 아이템 바 */}
      {gameState === 'customizing' && (
        <div className="absolute bottom-6 left-3 right-3 flex flex-col gap-2 z-20 pointer-events-auto">
          {/* 카테고리 탭 */}
          <div className="flex justify-center gap-1.5 bg-black/70 backdrop-blur-md p-1 border border-purple-500/30 rounded-sm">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCatIndex(idx);
                  if (navigator.vibrate) navigator.vibrate(15);
                }}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-sm transition-all ${
                  activeCatIndex === idx
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 아이템 카드 캐러셀 & 액션 버튼 */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 flex gap-2 p-1.5 bg-black/70 backdrop-blur-md border border-purple-500/30 rounded-sm overflow-x-auto">
              {activeCategory.options.map((opt) => {
                const isSelected = selectedItems[activeCategory.key] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectItem(activeCategory.key, opt.id)}
                    className={`flex-1 min-w-[64px] py-2 flex flex-col items-center justify-center rounded-sm border transition-all ${
                      isSelected
                        ? 'border-purple-400 bg-purple-500/20 scale-105 shadow-md'
                        : 'border-slate-800 bg-slate-900/60 opacity-80'
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
              {/* 아우라 방출 */}
              <button
                onClick={triggerAura}
                className="w-14 h-14 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 text-white font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 border-indigo-300"
              >
                <span>AURA</span>
                <span className="text-[8px]">방출</span>
              </button>

              {/* 76px 주술 의식 시전 (CAST RITUAL!) */}
              <button
                onClick={handleCastRitual}
                className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-purple-500 to-pink-600 text-white font-black text-sm shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white animate-pulse"
              >
                <span>CAST!</span>
                <span className="text-[9px] font-bold">주술시전</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 시작(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30 pointer-events-auto">
          <div className="bg-slate-900 border-2 border-purple-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-purple-400 mb-2">VORTELLA'S DRESS UP 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              신비로운 고딕 성소에서 마녀 보르텔라를 코디하세요!
              <br />
              <span className="text-purple-300 font-bold">모자, 로브, 마법 오브, 스태프</span>를 조합하고,
              <br />
              제단의 룬 마법진 위에서 <span className="text-pink-400 font-bold">[CAST!]</span>을 눌러
              <br />
              신비로운 마법 의식을 완성하세요!
            </p>
            <button
              onClick={() => setGameState('customizing')}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ 고딕 스타일링 시작 ]
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
            <h3 className="text-lg font-bold text-white mb-2">의식을 중단할까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지 완성한 코디에 따라 SNS 보상이 안전하게 정산됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmExit}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-sm active:scale-95"
              >
                포기하기
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

export { PokiVortellasDressUpGame };
