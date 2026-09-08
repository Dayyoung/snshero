import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Palette, Sparkles, Check, RotateCcw, Volume2, VolumeX, Zap } from 'lucide-react';

interface PokiColorArtistGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface VoxelBlock {
  id: number;
  x: number;
  y: number;
  z: number;
  num: number;
  color: number;
  painted: boolean;
  mesh: THREE.Mesh;
}

const PALETTE = [
  { num: 1, color: 0xfde047, name: '썬 옐로우', label: '#fde047' },
  { num: 2, color: 0xf97316, name: '네온 오렌지', label: '#f97316' },
  { num: 3, color: 0x38bdf8, name: '스카이 블루', label: '#38bdf8' },
  { num: 4, color: 0xa855f7, name: '로열 바이올렛', label: '#a855f7' },
  { num: 5, color: 0x10b981, name: '에메랄드 그린', label: '#10b981' },
  { num: 6, color: 0xffffff, name: '펄 화이트', label: '#ffffff' },
];

export default function PokiColorArtistGame({
  onClose,
  onBack,
  cardId = 75,
  onExit
}: PokiColorArtistGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 HUD 상태
  const [selectedNum, setSelectedNum] = useState(1);
  const [completedPercent, setCompletedPercent] = useState(0);
  const [remainingCount, setRemainingCount] = useState(48);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 조작 상태 레프
  const inputRef = useRef({
    actionPressed: false,
    sprayRequested: false,
    dragStart: null as { x: number; y: number } | null,
    isDragging: false,
  });

  const stateRef = useRef({
    activeNum: 1,
    rotY: 0.6,
    rotX: 0.3,
    blocks: [] as VoxelBlock[],
    totalBlocks: 48,
    paintedCount: 0,
    startTime: Date.now(),
    ended: false,
    sculptureGroup: null as THREE.Group | null,
    particles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
  });

  // 사운드 합성
  const playSound = useCallback((type: 'paint' | 'spray' | 'select' | 'win') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'paint') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'spray') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(250, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'win') {
        [523, 659, 783, 1046, 1318].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.25, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.35);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.35);
        });
      }
    } catch {
      // AudioContext 미지원 무시
    }
  }, [isMuted]);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬 및 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e2d); // 아틀리에 다크 슬레이트

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.5, 100);
    camera.position.set(0, 4.5, 9.5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff9c4, 1.4);
    keyLight.position.set(10, 20, 15);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // 갤러리 바닥 & 페데스탈 받침대
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x14141e, roughness: 0.8 })
    );
    floor.rotateX(-Math.PI / 2);
    floor.position.y = -2.2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 원형 받침대
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 3.0, 1.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x2e2e42, roughness: 0.5 })
    );
    pedestal.position.y = -1.5;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // No.075 공식 카드 영웅 배지
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 75, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), bMat);
    badge.position.set(0, -1.5, 3.05);
    scene.add(badge);

    // 3D 복셀 조각상 (48개 블록으로 이루어진 마스코트 캣/토끼 아트)
    const sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(0, 0.5, 0);

    const blockGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
    const defaultGrayMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5e, roughness: 0.6 });

    const blocks: VoxelBlock[] = [];
    let bId = 1;

    // 4x4x3 구조적 레이아웃 생성
    for (let x = -1.5; x <= 1.5; x += 1.0) {
      for (let y = -1.0; y <= 1.5; y += 1.0) {
        for (let z = -1.0; z <= 1.0; z += 1.0) {
          // 일정한 조각상 모양 필터 (외곽 큐브 일부 제외로 캐릭터 형상 구성)
          if (Math.abs(x) === 1.5 && y === 1.5 && z !== 0) continue;

          // 번호 배정 (1~6번)
          const num = ((Math.abs(Math.floor(x + y * 2 + z * 3)) + bId) % 6) + 1;
          const targetColor = PALETTE[num - 1].color;

          const mesh = new THREE.Mesh(blockGeo, defaultGrayMat.clone());
          mesh.position.set(x * 0.8, y * 0.8, z * 0.8);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          sculptureGroup.add(mesh);
          blocks.push({
            id: bId++,
            x: x * 0.8,
            y: y * 0.8,
            z: z * 0.8,
            num,
            color: targetColor,
            painted: false,
            mesh,
          });

          if (blocks.length >= 48) break;
        }
        if (blocks.length >= 48) break;
      }
      if (blocks.length >= 48) break;
    }

    stateRef.current.blocks = blocks;
    stateRef.current.totalBlocks = blocks.length;
    setRemainingCount(blocks.length);

    scene.add(sculptureGroup);
    stateRef.current.sculptureGroup = sculptureGroup;

    // 리사이즈
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
    };
    window.addEventListener('resize', handleResize);

    // 단일 블록 채색 헬퍼
    const paintSingleBlock = (b: VoxelBlock) => {
      if (b.painted) return;
      b.painted = true;
      if (b.mesh.material instanceof THREE.MeshStandardMaterial) {
        b.mesh.material.color.setHex(b.color);
        b.mesh.scale.set(1.2, 1.2, 1.2); // 팝업 애니메이션
      }
      stateRef.current.paintedCount++;
      const pct = Math.round((stateRef.current.paintedCount / stateRef.current.totalBlocks) * 100);
      setCompletedPercent(pct);
      setRemainingCount(stateRef.current.totalBlocks - stateRef.current.paintedCount);
      playSound('paint');

      // 스파클 파티클
      const pMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        new THREE.MeshBasicMaterial({ color: b.color })
      );
      pMesh.position.set(b.x, b.y + 0.8, b.z);
      scene.add(pMesh);
      stateRef.current.particles.push({
        mesh: pMesh,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5 + Math.random() * 2,
        vz: (Math.random() - 0.5) * 2,
        life: 0.35,
      });

      if (navigator.vibrate) navigator.vibrate(15);
    };

    // 애니메이션 루프
    let lastTime = performance.now();
    let animId = 0;
    let autoPaintTimer = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      const input = inputRef.current;

      if (state.ended) {
        // 승리 후 공중 부유 스핀
        if (state.sculptureGroup) {
          state.sculptureGroup.rotation.y += 1.2 * dt;
          state.sculptureGroup.position.y = 0.8 + Math.sin(now * 0.004) * 0.3;
        }
        renderer.render(scene, camera);
        return;
      }

      // 조각상 회전 업데이트
      if (state.sculptureGroup) {
        state.sculptureGroup.rotation.y = state.rotY;
        state.sculptureGroup.rotation.x = state.rotX;
      }

      // 블록 스케일 원복
      state.blocks.forEach((b) => {
        if (b.painted && b.mesh.scale.x > 1.0) {
          const s = Math.max(1.0, b.mesh.scale.x - 1.5 * dt);
          b.mesh.scale.set(s, s, s);
        }
      });

      // 연속 페인트 액션 처리
      if (input.actionPressed) {
        autoPaintTimer += dt;
        if (autoPaintTimer >= 0.15) {
          autoPaintTimer = 0;
          // 선택된 번호의 미도색 블록 1개 탐색 후 채색
          const target = state.blocks.find((b) => !b.painted && b.num === state.activeNum);
          if (target) {
            paintSingleBlock(target);
          }
        }
      }

      // 광역 스프레이 요청 처리 (현재 번호 4개 일괄 채색)
      if (input.sprayRequested) {
        input.sprayRequested = false;
        playSound('spray');
        const targets = state.blocks.filter((b) => !b.painted && b.num === state.activeNum).slice(0, 4);
        targets.forEach((t) => paintSingleBlock(t));
        if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
      }

      // 100% 완성 체크
      if (state.paintedCount >= state.totalBlocks && !state.ended) {
        state.ended = true;
        setIsGameWon(true);
        playSound('win');
        if (navigator.vibrate) navigator.vibrate([60, 100, 60, 100]);

        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const res = calculateAndDepositMissionReward({
          gameId: 'color-artist',
          gameTitle: '컬러 아티스트 3D (Color Artist)',
          isVictory: true,
          score: 1000,
          maxTargetScore: 1000,
          durationSeconds: duration,
        });
        setRewardResult(res);
      }

      // 파티클 수명 업데이트
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.vy -= 8 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.life -= dt;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          state.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cardId, playSound]);

  // 터치 드래그 3D 궤도 회전 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    inputRef.current.dragStart = { x: t.clientX, y: t.clientY };
    inputRef.current.isDragging = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!inputRef.current.isDragging || !inputRef.current.dragStart) return;
    const t = e.touches[0];
    const dx = t.clientX - inputRef.current.dragStart.x;
    const dy = t.clientY - inputRef.current.dragStart.y;
    inputRef.current.dragStart = { x: t.clientX, y: t.clientY };

    stateRef.current.rotY += dx * 0.008;
    stateRef.current.rotX = Math.max(-0.6, Math.min(0.8, stateRef.current.rotX + dy * 0.008));
  };

  const handleTouchEnd = () => {
    inputRef.current.isDragging = false;
    inputRef.current.dragStart = null;
  };

  // 번호 선택
  const handleSelectNum = (num: number) => {
    setSelectedNum(num);
    stateRef.current.activeNum = num;
    playSound('select');
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="COLOR ARTIST 3D"
        onQuit={handleExit}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 bg-black/40 text-white rounded border border-white/20 active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        }
      />

      {/* 상단 진행도 및 회전 가이드 */}
      <div className="absolute top-14 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-between items-center bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-cyan-500/40">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <div className="text-sm font-black text-cyan-300">3D 복셀 컬러링 ({completedPercent}%)</div>
              <div className="text-[10px] text-zinc-400">화면을 드래그해 회전하고 번호를 칠하세요 (남은 블록: {remainingCount}개)</div>
            </div>
          </div>
          <div className="text-lg font-black text-cyan-400">{completedPercent}%</div>
        </div>

        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-150"
            style={{ width: `${completedPercent}%` }}
          />
        </div>
      </div>

      {/* 하단 6색 넘버 팔레트 및 액션 버튼군 */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col gap-3 pointer-events-none">
        {/* 6색 넘버 팔레트 바 */}
        <div className="pointer-events-auto flex justify-center gap-2 sm:gap-3 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20">
          {PALETTE.map((p) => (
            <button
              key={p.num}
              onClick={() => handleSelectNum(p.num)}
              className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg border-2 flex flex-col items-center justify-center font-black text-sm transition-transform active:scale-95 shadow-md ${
                selectedNum === p.num
                  ? 'scale-110 border-white ring-2 ring-cyan-400 text-black'
                  : 'border-transparent text-black opacity-85'
              }`}
              style={{ backgroundColor: p.label }}
            >
              <span>{p.num}</span>
            </button>
          ))}
        </div>

        {/* 하단 액션 버튼 (스프레이 64px & 페인트 76px) */}
        <div className="flex justify-end items-center gap-3">
          {/* 광역 스프레이 (SPRAY - 64px) */}
          <button
            onClick={() => {
              inputRef.current.sprayRequested = true;
            }}
            className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 bg-amber-600/90 border-2 border-amber-300 text-white rounded-lg active:scale-95 flex flex-col items-center justify-center font-bold text-xs shadow-lg shadow-amber-600/30"
          >
            <Zap className="w-6 h-6 mb-0.5 animate-bounce" />
            <span className="text-[9px]">스프레이</span>
          </button>

          {/* 메인 연속 페인트 (PAINT - 76px) */}
          <button
            onTouchStart={() => {
              inputRef.current.actionPressed = true;
            }}
            onTouchEnd={() => {
              inputRef.current.actionPressed = false;
            }}
            onMouseDown={() => {
              inputRef.current.actionPressed = true;
            }}
            onMouseUp={() => {
              inputRef.current.actionPressed = false;
            }}
            className="pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 bg-cyan-600 border-3 border-cyan-300 text-white rounded-full active:scale-90 flex flex-col items-center justify-center font-black shadow-xl shadow-cyan-600/50 active:bg-cyan-500"
          >
            <Sparkles className="w-8 h-8 animate-spin" />
            <span className="text-[11px] tracking-wider mt-0.5">PAINT</span>
          </button>
        </div>
      </div>

      {/* 승리 보상 모달 */}
      {isGameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={isGameWon}
          onClose={handleExit}
          reward={rewardResult}
          gameTitle="컬러 아티스트 3D (Color Artist)"
        />
      )}
    </div>
  );
}
