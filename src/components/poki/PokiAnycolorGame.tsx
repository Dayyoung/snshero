import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiAnycolorGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface PartData {
  id: number;
  name: string;
  reqNum: number;
  mesh: THREE.Mesh;
  colored: boolean;
  baseScale: THREE.Vector3;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

const PALETTE = [
  { num: 1, col: '#ef4444', hex: 0xef4444, name: '루비 레드' },
  { num: 2, col: '#3b82f6', hex: 0x3b82f6, name: '로열 블루' },
  { num: 3, col: '#f59e0b', hex: 0xf59e0b, name: '골든 앰버' },
  { num: 4, col: '#10b981', hex: 0x10b981, name: '에메랄드 그린' },
  { num: 5, col: '#8b5cf6', hex: 0x8b5cf6, name: '네온 바이올렛' },
  { num: 6, col: '#f8fafc', hex: 0xf8fafc, name: '펄 화이트' },
];

export default function PokiAnycolorGame({
  onBack,
  onClose,
  cardId = 79,
}: PokiAnycolorGameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'victory'>('ready');
  const [selectedNum, setSelectedNum] = useState<number>(1);
  const [coloredCount, setColoredCount] = useState<number>(0);
  const [totalParts, setTotalParts] = useState<number>(32);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 3D 내부 참조
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 모델 그룹 및 회전
    modelGroup: null as THREE.Group | null,
    turntableMesh: null as THREE.Mesh | null,
    rotX: 0.2,
    rotY: 0,
    targetRotX: 0.2,
    targetRotY: 0,
    isDragging: false,
    lastTouch: { x: 0, y: 0 },

    // 파츠 목록
    parts: [] as PartData[],
    particles: [] as Particle[],
    particleGeo: new THREE.SphereGeometry(0.06, 6, 6),

    // 쇼케이스 연출
    isCompleted: false,
    celebrateTimer: 0,

    startTime: Date.now(),
  });

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
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() * 0.8 + 0.3) * 3,
        vz: (Math.random() - 0.5) * 3,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
      });
    }
  };

  // 개별 파츠 채색 함수
  const colorizePart = (part: PartData) => {
    if (part.colored) return;
    const colorInfo = PALETTE.find((p) => p.num === part.reqNum);
    if (!colorInfo) return;

    part.colored = true;
    const newMat = new THREE.MeshStandardMaterial({
      color: colorInfo.hex,
      roughness: 0.3,
      metalness: 0.2,
    });
    part.mesh.material = newMat;

    // 바운스 팝업 효과
    part.mesh.scale.copy(part.baseScale).multiplyScalar(1.3);
    setTimeout(() => {
      part.mesh.scale.copy(part.baseScale);
    }, 200);

    // 파티클 및 햅틱
    const worldPos = new THREE.Vector3();
    part.mesh.getWorldPosition(worldPos);
    spawnParticles(worldPos, colorInfo.hex, 12);

    if (navigator.vibrate) navigator.vibrate(20);

    // 완성 수량 체크
    const newCount = stateRef.current.parts.filter((p) => p.colored).length;
    setColoredCount(newCount);

    if (newCount >= stateRef.current.parts.length) {
      stateRef.current.isCompleted = true;
      if (navigator.vibrate) navigator.vibrate([40, 60, 40, 80]);
      setTimeout(() => {
        handleVictory();
      }, 1500);
    }
  };

  // 선택된 번호의 파츠 1개 자동 채색 (PAINT 버튼)
  const triggerPaint = () => {
    if (gameState !== 'playing' || stateRef.current.isCompleted) return;
    const s = stateRef.current;
    const targetPart = s.parts.find((p) => !p.colored && p.reqNum === selectedNum);
    if (targetPart) {
      colorizePart(targetPart);
    } else {
      // 해당 번호 완료 시 다른 미채색 파츠 탐색
      const anyPart = s.parts.find((p) => !p.colored);
      if (anyPart) {
        setSelectedNum(anyPart.reqNum);
        colorizePart(anyPart);
      }
    }
  };

  // 매직 필 (선택 번호 모든 파츠 일괄 채색)
  const triggerMagicFill = () => {
    if (gameState !== 'playing' || stateRef.current.isCompleted) return;
    const s = stateRef.current;
    const matchParts = s.parts.filter((p) => !p.colored && p.reqNum === selectedNum);
    if (matchParts.length > 0) {
      matchParts.forEach((p, idx) => {
        setTimeout(() => {
          colorizePart(p);
        }, idx * 60);
      });
    } else {
      // 다음 미완성 번호로 자동 전환
      const nextPart = s.parts.find((p) => !p.colored);
      if (nextPart) {
        setSelectedNum(nextPart.reqNum);
      }
    }
  };

  // 화면 터치 드래그 (3D 모델 회전)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      stateRef.current.isDragging = true;
      stateRef.current.lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!stateRef.current.isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - stateRef.current.lastTouch.x;
    const dy = touch.clientY - stateRef.current.lastTouch.y;
    stateRef.current.lastTouch = { x: touch.clientX, y: touch.clientY };

    stateRef.current.targetRotY += dx * 0.015;
    stateRef.current.targetRotX = Math.max(-0.6, Math.min(0.8, stateRef.current.targetRotX + dy * 0.015));
  };

  const handleTouchEnd = () => {
    stateRef.current.isDragging = false;
  };

  // 3D 파츠 직접 터치 레이캐스팅
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing' || stateRef.current.isCompleted) return;
    const container = containerRef.current;
    const camera = stateRef.current.camera;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const meshes = stateRef.current.parts.map((p) => p.mesh);
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const part = stateRef.current.parts.find((p) => p.mesh === hitMesh);
      if (part && !part.colored) {
        setSelectedNum(part.reqNum);
        colorizePart(part);
      }
    }
  };

  // 승리 처리
  const handleVictory = () => {
    setGameState('victory');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'anycolor',
      gameTitle: '애니컬러 3D (Anycolor)',
      isVictory: true,
      score: 1000,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 중도 포기 정산
  const confirmExit = () => {
    setShowExitModal(false);
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    calculateAndDepositMissionReward({
      gameId: 'anycolor',
      gameTitle: '애니컬러 3D (Anycolor)',
      isVictory: false,
      score: Math.floor((coloredCount / totalParts) * 1000),
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    handleExit();
  };

  // Three.js 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1b4b); // 딥 인디고 아트 스튜디오 룸
    stateRef.current.scene = scene;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 3, 9.5);
    camera.lookAt(0, 0.6, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    dirLight.position.set(5, 10, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x818cf8, 0.8);
    backLight.position.set(-5, 5, -8);
    scene.add(backLight);

    // 원형 회전 디스플레이 턴테이블
    const turntableGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.4, 32);
    const turntableMat = new THREE.MeshStandardMaterial({ color: 0x312e81, metalness: 0.5, roughness: 0.2 });
    const turntable = new THREE.Mesh(turntableGeo, turntableMat);
    turntable.position.y = -0.2;
    scene.add(turntable);
    stateRef.current.turntableMesh = turntable;

    // No.079 공식 영웅 배지 액자 데코
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = 256;
    frameCanvas.height = 256;
    const frameCtx = frameCanvas.getContext('2d');
    if (frameCtx) {
      drawCardSprite(frameCtx, cardId, 0, 0, 256, 256);
      const frameTex = new THREE.CanvasTexture(frameCanvas);
      const framePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        new THREE.MeshBasicMaterial({ map: frameTex, transparent: true })
      );
      framePlane.position.set(0, 3.8, -4.5);
      scene.add(framePlane);
    }

    // --- 32개 정밀 파츠 3D 메카 가디언 피규어 모델링 ---
    const modelGroup = new THREE.Group();
    const uncoloredMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.6,
      metalness: 0.1,
    });

    const parts: PartData[] = [];
    let partId = 1;

    const addPart = (geo: THREE.BufferGeometry, pos: THREE.Vector3, reqNum: number, name: string) => {
      const mesh = new THREE.Mesh(geo, uncoloredMat.clone());
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      modelGroup.add(mesh);

      parts.push({
        id: partId++,
        name,
        reqNum,
        mesh,
        colored: false,
        baseScale: mesh.scale.clone(),
      });
    };

    // 1. 머리 & 헬멧 파츠 (6개)
    addPart(new THREE.SphereGeometry(0.55, 16, 16), new THREE.Vector3(0, 2.2, 0), 1, '헬멧 본체');
    addPart(new THREE.BoxGeometry(0.65, 0.22, 0.4), new THREE.Vector3(0, 2.2, 0.35), 2, '사이버 바이저');
    addPart(new THREE.ConeGeometry(0.18, 0.55, 6), new THREE.Vector3(0, 2.8, 0), 3, '골든 크레스트');
    addPart(new THREE.ConeGeometry(0.12, 0.4, 4), new THREE.Vector3(-0.45, 2.4, 0), 1, '좌측 이어 안테나');
    addPart(new THREE.ConeGeometry(0.12, 0.4, 4), new THREE.Vector3(0.45, 2.4, 0), 1, '우측 이어 안테나');
    addPart(new THREE.BoxGeometry(0.4, 0.2, 0.25), new THREE.Vector3(0, 1.8, 0.2), 6, '페이스 가드');

    // 2. 체스트 코어 & 몸통 (6개)
    addPart(new THREE.CylinderGeometry(0.7, 0.5, 0.9, 8), new THREE.Vector3(0, 1.35, 0), 2, '체스트 아머');
    addPart(new THREE.SphereGeometry(0.28, 12, 12), new THREE.Vector3(0, 1.45, 0.4), 4, '에너지 아크 코어');
    addPart(new THREE.BoxGeometry(0.9, 0.2, 0.55), new THREE.Vector3(0, 1.75, 0), 3, '칼라 넥 칼라');
    addPart(new THREE.CylinderGeometry(0.5, 0.55, 0.45, 8), new THREE.Vector3(0, 0.75, 0), 5, '웨이스트 벨트');
    addPart(new THREE.BoxGeometry(0.3, 0.3, 0.2), new THREE.Vector3(0, 0.75, 0.32), 3, '벨트 버클');
    addPart(new THREE.BoxGeometry(0.7, 0.3, 0.2), new THREE.Vector3(0, 1.1, -0.3), 6, '백팩 슬러스터');

    // 3. 날개 윙 바인더 (4개)
    addPart(new THREE.BoxGeometry(0.15, 1.0, 0.4), new THREE.Vector3(-0.7, 1.6, -0.4), 4, '좌상단 윙');
    addPart(new THREE.BoxGeometry(0.15, 1.0, 0.4), new THREE.Vector3(0.7, 1.6, -0.4), 4, '우상단 윙');
    addPart(new THREE.BoxGeometry(0.12, 0.7, 0.3), new THREE.Vector3(-0.9, 1.0, -0.4), 5, '좌하단 윙');
    addPart(new THREE.BoxGeometry(0.12, 0.7, 0.3), new THREE.Vector3(0.9, 1.0, -0.4), 5, '우하단 윙');

    // 4. 양팔 파츠 (8개)
    addPart(new THREE.SphereGeometry(0.32, 10, 10), new THREE.Vector3(-0.95, 1.6, 0), 1, '좌측 숄더 가드');
    addPart(new THREE.SphereGeometry(0.32, 10, 10), new THREE.Vector3(0.95, 1.6, 0), 1, '우측 숄더 가드');
    addPart(new THREE.CylinderGeometry(0.16, 0.14, 0.55, 6), new THREE.Vector3(-0.95, 1.15, 0), 2, '좌측 상완');
    addPart(new THREE.CylinderGeometry(0.16, 0.14, 0.55, 6), new THREE.Vector3(0.95, 1.15, 0), 2, '우측 상완');
    addPart(new THREE.BoxGeometry(0.32, 0.55, 0.32), new THREE.Vector3(-0.95, 0.65, 0), 5, '좌측 건틀릿');
    addPart(new THREE.BoxGeometry(0.32, 0.55, 0.32), new THREE.Vector3(0.95, 0.65, 0), 5, '우측 건틀릿');
    addPart(new THREE.SphereGeometry(0.18, 8, 8), new THREE.Vector3(-0.95, 0.25, 0), 6, '좌측 피스트');
    addPart(new THREE.SphereGeometry(0.18, 8, 8), new THREE.Vector3(0.95, 0.25, 0), 6, '우측 피스트');

    // 5. 양다리 & 부츠 (8개)
    addPart(new THREE.SphereGeometry(0.25, 8, 8), new THREE.Vector3(-0.35, 0.45, 0), 3, '좌측 고관절');
    addPart(new THREE.SphereGeometry(0.25, 8, 8), new THREE.Vector3(0.35, 0.45, 0), 3, '우측 고관절');
    addPart(new THREE.CylinderGeometry(0.18, 0.16, 0.65, 6), new THREE.Vector3(-0.35, -0.05, 0), 2, '좌측 허벅지');
    addPart(new THREE.CylinderGeometry(0.18, 0.16, 0.65, 6), new THREE.Vector3(0.35, -0.05, 0), 2, '우측 허벅지');
    addPart(new THREE.BoxGeometry(0.38, 0.7, 0.4), new THREE.Vector3(-0.35, -0.65, 0), 1, '좌측 정강이 아머');
    addPart(new THREE.BoxGeometry(0.38, 0.7, 0.4), new THREE.Vector3(0.35, -0.65, 0), 1, '우측 정강이 아머');
    addPart(new THREE.BoxGeometry(0.42, 0.25, 0.6), new THREE.Vector3(-0.35, -1.05, 0.1), 6, '좌측 부츠');
    addPart(new THREE.BoxGeometry(0.42, 0.25, 0.6), new THREE.Vector3(0.35, -1.05, 0.1), 6, '우측 부츠');

    modelGroup.position.set(0, 1.2, 0);
    scene.add(modelGroup);
    stateRef.current.modelGroup = modelGroup;
    stateRef.current.parts = parts;
    setTotalParts(parts.length);

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

      // 모델 회전 인터폴레이션
      s.rotX += (s.targetRotX - s.rotX) * 0.1;
      s.rotY += (s.targetRotY - s.rotY) * 0.1;

      if (s.modelGroup) {
        if (s.isCompleted) {
          // 완성 시 360도 공중 부유 스핀
          s.celebrateTimer += dt;
          s.modelGroup.rotation.y += 1.5 * dt;
          s.modelGroup.position.y = 1.2 + Math.sin(s.celebrateTimer * 2) * 0.4;
        } else {
          s.modelGroup.rotation.x = s.rotX;
          s.modelGroup.rotation.y = s.rotY;
        }
      }

      // 턴테이블 동반 회전
      if (s.turntableMesh) {
        s.turntableMesh.rotation.y = s.modelGroup ? s.modelGroup.rotation.y : 0;
      }

      // 파티클
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 4.0 * dt;
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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCanvasClick}
    >
      {/* 상단 HUD */}
      <MinimalistMissionHUD
        title="ANYCOLOR 3D STUDIO"
        scoreDisplay={`PROGRESS: ${Math.floor((coloredCount / totalParts) * 100)}% | ${coloredCount}/${totalParts}`}
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 화면 조작 안내 툴팁 */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 border border-slate-700 rounded-full text-[11px] text-slate-300 pointer-events-none z-10">
        화면 드래그: 3D 회전 | 파츠 터치: 즉시 채색
      </div>

      {/* 하단 6색 팔레트 바 */}
      {gameState === 'playing' && (
        <div className="absolute bottom-6 left-4 right-4 flex justify-between items-center z-20 pointer-events-auto">
          {/* 컬러 팔레트 버튼 군 */}
          <div className="flex gap-2 p-1.5 bg-black/70 backdrop-blur-md border border-slate-700 rounded-sm">
            {PALETTE.map((item) => {
              const countLeft = stateRef.current.parts.filter(
                (p) => !p.colored && p.reqNum === item.num
              ).length;
              const isSelected = selectedNum === item.num;
              return (
                <button
                  key={item.num}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNum(item.num);
                    if (navigator.vibrate) navigator.vibrate(15);
                  }}
                  className={`relative w-11 h-12 rounded-sm flex flex-col items-center justify-center font-bold text-xs transition-all ${
                    isSelected
                      ? 'ring-2 ring-white scale-110 shadow-lg'
                      : 'opacity-80 active:scale-95'
                  }`}
                  style={{ backgroundColor: item.col }}
                >
                  <span className="text-white drop-shadow font-black">{item.num}</span>
                  <span className="text-[9px] bg-black/60 text-white px-1 rounded-full font-normal">
                    {countLeft}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 우측 액션 버튼 군 */}
          <div className="flex gap-2 items-center">
            {/* 매직 필 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerMagicFill();
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 text-white font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 border-purple-300"
            >
              <span>MAGIC</span>
              <span className="text-[8px]">FILL</span>
            </button>

            {/* 76px 대형 PAINT 버튼 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerPaint();
              }}
              className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-amber-400 to-yellow-500 text-black font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white"
            >
              <span>PAINT</span>
              <span className="text-[10px] font-bold">#{selectedNum} 칠하기</span>
            </button>
          </div>
        </div>
      )}

      {/* 시작(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30 pointer-events-auto">
          <div className="bg-slate-900 border-2 border-amber-400 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-amber-400 mb-2">ANYCOLOR 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              나만의 3D 메카 가디언 피규어를 완성하세요!
              <br />
              <span className="text-amber-300">화면 터치 드래그</span>로 피규어를 돌려보고,
              <br />
              하단 <span className="text-yellow-400 font-bold">1~6번 컬러 팔레트</span>를 골라
              <br />
              파츠를 직접 터치하거나 <span className="text-cyan-400 font-bold">[PAINT]</span>로 모든 조각을 칠해보세요!
            </p>
            <button
              onClick={() => setGameState('playing')}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ 컬러링 시작하기 ]
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
            <h3 className="text-lg font-bold text-white mb-2">컬러링을 마칠까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지 채색한 파츠 완성도에 따라 SNS 보상이 안전하게 정산됩니다.
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

export { PokiAnycolorGame };
