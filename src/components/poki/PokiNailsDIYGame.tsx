import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Sparkles, Palette, Diamond, Check, Volume2, VolumeX, RotateCcw, Heart, Star } from 'lucide-react';

interface PokiNailsDIYGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

type NailStage = 'buff' | 'color' | 'charm' | 'ring';

const NAIL_COLORS = [
  { name: '로즈 핑크', hex: 0xf43f5e, label: '#f43f5e' },
  { name: '파스텔 민트', hex: 0x06b6d4, label: '#06b6d4' },
  { name: '라벤더 퍼플', hex: 0xa855f7, label: '#a855f7' },
  { name: '샤이니 골드', hex: 0xffd54f, label: '#ffd54f' },
];

export default function PokiNailsDIYGame({
  onClose,
  onBack,
  cardId = 73,
  onExit
}: PokiNailsDIYGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 코스 진행 상태
  const [currentStage, setCurrentStage] = useState<NailStage>('buff');
  const [stageProgress, setStageProgress] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedCharmType, setSelectedCharmType] = useState<'diamond' | 'heart' | 'star'>('diamond');
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 조작 상태 레프
  const inputRef = useRef({
    actionPressed: false,
    isInteracting: false,
  });

  const stateRef = useRef({
    stage: 'buff' as NailStage,
    progress: 0,
    handTilt: 0,
    selectedColor: NAIL_COLORS[0].hex,
    charmType: 'diamond' as 'diamond' | 'heart' | 'star',
    ringVisible: false,
    startTime: Date.now(),
    ended: false,
    handGroup: null as THREE.Group | null,
    nailMeshes: [] as THREE.Mesh[],
    charmMeshes: [] as THREE.Mesh[],
    ringMesh: null as THREE.Mesh | null,
    particles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
  });

  // 사운드 합성
  const playSound = useCallback((type: 'buff' | 'paint' | 'charm' | 'sparkle' | 'win') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'buff') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'paint') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'charm') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659, now);
        osc.frequency.setValueAtTime(1318, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'sparkle') {
        [659, 880, 1174].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.15, now + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.2);
          o.start(now + i * 0.06);
          o.stop(now + i * 0.06 + 0.2);
        });
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
    scene.background = new THREE.Color(0xfce4ec); // 로맨틱 핑크

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.5, 100);
    camera.position.set(0, 5.5, 6.5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5f8, 1.2);
    keyLight.position.set(5, 12, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // 대리석 네일 테이블 (12x12m)
    const tableGeo = new THREE.PlaneGeometry(12, 12);
    tableGeo.rotateX(-Math.PI / 2);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xfff0f5, roughness: 0.2, metalness: 0.1 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.receiveShadow = true;
    scene.add(table);

    // 스튜디오 스탠드 & No.073 공식 카드 영웅 배지
    const standGroup = new THREE.Group();
    standGroup.position.set(-3.2, 0, -1.8);
    const standPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 2.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8 })
    );
    standPole.position.y = 1.25;
    standGroup.add(standPole);

    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 73, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), bMat);
    badge.position.set(0, 2.6, 0);
    badge.rotateY(0.4);
    standGroup.add(badge);
    scene.add(standGroup);

    // 3D 리얼리스틱 손 모델 (Hand Model)
    const handGroup = new THREE.Group();
    handGroup.position.set(0, 0.4, 0);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.7 });

    // 손바닥 (Palm)
    const palmGeo = new THREE.BoxGeometry(2.8, 0.6, 2.8);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, 0.3, 0.6);
    palm.castShadow = true;
    handGroup.add(palm);

    // 손목 (Wrist)
    const wrist = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.8), skinMat);
    wrist.position.set(0, 0.28, 2.5);
    handGroup.add(wrist);

    // 5개 손가락 지오메트리 & 5개 손톱 메쉬
    const fingerDefs = [
      { name: 'thumb', x: -1.6, z: 0.8, len: 1.6, rad: 0.28, rotZ: 0.35 },
      { name: 'index', x: -0.9, z: -1.0, len: 2.2, rad: 0.26, rotZ: 0.05 },
      { name: 'middle', x: -0.1, z: -1.2, len: 2.4, rad: 0.27, rotZ: 0 },
      { name: 'ring', x: 0.7, z: -1.0, len: 2.2, rad: 0.25, rotZ: -0.05 },
      { name: 'pinky', x: 1.4, z: -0.6, len: 1.7, rad: 0.22, rotZ: -0.15 },
    ];

    const nailMeshes: THREE.Mesh[] = [];
    const charmMeshes: THREE.Mesh[] = [];

    const nailMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.2,
    });

    fingerDefs.forEach((f) => {
      const fGroup = new THREE.Group();
      fGroup.position.set(f.x, 0.3, f.z);
      fGroup.rotateZ(f.rotZ);

      // 손가락 관절 메쉬
      const finger = new THREE.Mesh(
        new THREE.CylinderGeometry(f.rad, f.rad * 1.1, f.len, 12),
        skinMat
      );
      finger.rotateX(-Math.PI / 2);
      finger.position.z = -f.len / 2;
      finger.castShadow = true;
      fGroup.add(finger);

      // 3D 입체 손톱 메쉬
      const nail = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.55), nailMat.clone());
      nail.position.set(0, 0.26, -f.len);
      nail.castShadow = true;
      fGroup.add(nail);
      nailMeshes.push(nail);

      // 손톱 위 3D 보석 참 (초기 숨김)
      const charmGeo = new THREE.OctahedronGeometry(0.12);
      const charmMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1 });
      const charm = new THREE.Mesh(charmGeo, charmMat);
      charm.position.set(0, 0.35, -f.len);
      charm.visible = false;
      fGroup.add(charm);
      charmMeshes.push(charm);

      handGroup.add(fGroup);
    });

    stateRef.current.nailMeshes = nailMeshes;
    stateRef.current.charmMeshes = charmMeshes;

    // 황금 다이아몬드 반지 (약지 손가락에 장착)
    const ringGeo = new THREE.TorusGeometry(0.32, 0.08, 8, 16);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotateX(Math.PI / 2);
    ring.position.set(0.7, 0.3, -0.4);
    ring.visible = false;
    handGroup.add(ring);
    stateRef.current.ringMesh = ring;

    scene.add(handGroup);
    stateRef.current.handGroup = handGroup;

    // 리사이즈
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
    };
    window.addEventListener('resize', handleResize);

    // 애니메이션 루프
    let lastTime = performance.now();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      const input = inputRef.current;

      if (state.ended) {
        renderer.render(scene, camera);
        return;
      }

      // 손 모델 틸트 회전 보정
      if (state.handGroup) {
        state.handGroup.rotation.y = THREE.MathUtils.lerp(state.handGroup.rotation.y, state.handTilt, 0.1);
      }

      // 반지 노출 동기화
      if (state.ringMesh) {
        state.ringMesh.visible = state.ringVisible;
      }

      // 인터랙션 진행도 누적
      if (input.actionPressed || input.isInteracting) {
        state.progress = Math.min(100, state.progress + 35 * dt);
        setStageProgress(Math.round(state.progress));

        // 파티클 생성
        if (state.stage === 'buff') {
          playSound('buff');
          const pGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
          const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.position.set((Math.random() - 0.5) * 2.5, 1.2, (Math.random() - 0.5) * 2.5);
          scene.add(pMesh);
          state.particles.push({
            mesh: pMesh,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 0.5 + Math.random() * 0.5,
            vz: (Math.random() - 0.5) * 0.8,
            life: 0.35,
          });
        } else if (state.stage === 'color') {
          playSound('paint');
          // 손톱 5개 컬러 실시간 틴팅
          state.nailMeshes.forEach((n) => {
            if (n.material instanceof THREE.MeshStandardMaterial) {
              n.material.color.setHex(state.selectedColor);
            }
          });
          const pMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 6, 6),
            new THREE.MeshBasicMaterial({ color: state.selectedColor })
          );
          pMesh.position.set((Math.random() - 0.5) * 2.5, 1.2, (Math.random() - 0.5) * 2.5);
          scene.add(pMesh);
          state.particles.push({
            mesh: pMesh,
            vx: (Math.random() - 0.5) * 1.0,
            vy: 0.8 + Math.random() * 0.8,
            vz: (Math.random() - 0.5) * 1.0,
            life: 0.4,
          });
        } else if (state.stage === 'charm') {
          playSound('charm');
          state.charmMeshes.forEach((c) => {
            c.visible = true;
          });
        }
      }

      // 파티클 수명 업데이트
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
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

  // 다음 코스 단계 전환
  const handleNextStage = () => {
    const s = stateRef.current;
    if (s.stage === 'buff') {
      s.stage = 'color';
      s.progress = 0;
      setCurrentStage('color');
      setStageProgress(0);
      playSound('sparkle');
      if (navigator.vibrate) navigator.vibrate(30);
    } else if (s.stage === 'color') {
      s.stage = 'charm';
      s.progress = 0;
      setCurrentStage('charm');
      setStageProgress(0);
      playSound('sparkle');
      if (navigator.vibrate) navigator.vibrate(30);
    } else if (s.stage === 'charm') {
      s.stage = 'ring';
      s.progress = 0;
      s.ringVisible = true;
      setCurrentStage('ring');
      setStageProgress(100);
      playSound('sparkle');
      if (navigator.vibrate) navigator.vibrate(30);
    } else if (s.stage === 'ring') {
      // 최종 완성!
      s.ended = true;
      setIsGameWon(true);
      playSound('win');
      if (navigator.vibrate) navigator.vibrate([60, 100, 60]);

      const duration = Math.floor((Date.now() - s.startTime) / 1000);
      const res = calculateAndDepositMissionReward({
        gameId: 'nails-diy',
        gameTitle: '네일 DIY 매니큐어 마스터 3D (Nails DIY)',
        isVictory: true,
        score: 1000,
        maxTargetScore: 1000,
        durationSeconds: duration,
      });
      setRewardResult(res);
    }
  };

  const handleSelectColor = (idx: number) => {
    setSelectedColorIdx(idx);
    stateRef.current.selectedColor = NAIL_COLORS[idx].hex;
    playSound('paint');
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleTouchStart = () => {
    inputRef.current.isInteracting = true;
  };

  const handleTouchEnd = () => {
    inputRef.current.isInteracting = false;
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 font-mono"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="NAILS DIY 3D"
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

      {/* 상단 4단계 코스 진행 인디케이터 */}
      <div className="absolute top-14 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-between items-center bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-pink-500/40">
          <div className="flex items-center gap-2">
            {currentStage === 'buff' && <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />}
            {currentStage === 'color' && <Palette className="w-5 h-5 text-pink-400 animate-pulse" />}
            {currentStage === 'charm' && <Diamond className="w-5 h-5 text-cyan-400 animate-bounce" />}
            {currentStage === 'ring' && <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />}
            <div>
              <div className="text-sm font-black text-pink-300">
                {currentStage === 'buff' && '1단계: 손톱 쉐이핑 & 버핑'}
                {currentStage === 'color' && '2단계: 젤 컬러 코팅'}
                {currentStage === 'charm' && '3단계: 3D 보석 참 부착'}
                {currentStage === 'ring' && '4단계: 다이아몬드 링 완성'}
              </div>
              <div className="text-[10px] text-zinc-400">화면을 터치하거나 PAINT 버튼을 누르세요</div>
            </div>
          </div>
          <div className="text-lg font-black text-pink-400">{stageProgress}%</div>
        </div>

        {/* 진행도 바 */}
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-100"
            style={{ width: `${stageProgress}%` }}
          />
        </div>
      </div>

      {/* 하단 모바일 컨트롤 바 */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        {/* 좌측: 컬러 팔레트 또는 손 회전 버튼 */}
        <div className="pointer-events-auto flex items-center gap-2">
          {currentStage === 'color' ? (
            <div className="flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-pink-400/40">
              {NAIL_COLORS.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => handleSelectColor(i)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-transform active:scale-95 ${
                    selectedColorIdx === i ? 'scale-110 border-white ring-2 ring-pink-400' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: c.label }}
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  stateRef.current.handTilt -= Math.PI / 6;
                  if (navigator.vibrate) navigator.vibrate(20);
                }}
                className="px-3 py-2 bg-black/60 backdrop-blur-md border border-white/30 text-white rounded-lg text-xs active:scale-95 font-bold"
              >
                ◀ 좌회전
              </button>
              <button
                onClick={() => {
                  stateRef.current.handTilt += Math.PI / 6;
                  if (navigator.vibrate) navigator.vibrate(20);
                }}
                className="px-3 py-2 bg-black/60 backdrop-blur-md border border-white/30 text-white rounded-lg text-xs active:scale-95 font-bold"
              >
                우회전 ▶
              </button>
            </div>
          )}
        </div>

        {/* 우측: 페인트 액션 (76px) 및 다음 단계 (64px) */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* 다음 단계 버튼 */}
          <button
            onClick={handleNextStage}
            disabled={stageProgress < 100}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-xs active:scale-95 shadow-lg ${
              stageProgress >= 100
                ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-500/40 animate-pulse'
                : 'bg-zinc-800/80 border-zinc-600 text-zinc-500 opacity-60'
            }`}
          >
            <Check className="w-6 h-6 mb-0.5" />
            <span className="text-[10px]">{currentStage === 'ring' ? '완성하기' : '다음 단계'}</span>
          </button>

          {/* 메인 액션 버튼 (76px) */}
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
            className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-600 border-3 border-rose-300 text-white rounded-full active:scale-90 flex flex-col items-center justify-center font-black shadow-xl shadow-rose-600/50 active:bg-rose-500"
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
          gameTitle="네일 DIY 매니큐어 마스터 3D (Nails DIY)"
        />
      )}
    </div>
  );
}
