import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Sparkles, Scissors, Wind, Droplets, Palette, Crown, Check, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface PokiDivaHairSalonGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;
}

type SalonStage = 'shampoo' | 'dry' | 'cut' | 'color';

const HAIR_COLORS = [
  { name: '로즈 핑크', hex: 0xff4081, label: '#ff4081' },
  { name: '네온 시안', hex: 0x00e5ff, label: '#00e5ff' },
  { name: '골든 블론드', hex: 0xffd54f, label: '#ffd54f' },
  { name: '로열 바이올렛', hex: 0xaa00ff, label: '#aa00ff' },
];

export default function PokiDivaHairSalonGame({ onClose, onBack, cardId = 70 }: PokiDivaHairSalonGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 살롱 코스 상태
  const [currentStage, setCurrentStage] = useState<SalonStage>('shampoo');
  const [stageProgress, setStageProgress] = useState(0); // 0 ~ 100%
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 조작 상태 레프
  const inputRef = useRef({
    actionPressed: false,
    dragX: 0,
    isInteracting: false,
  });

  const stateRef = useRef({
    stage: 'shampoo' as SalonStage,
    progress: 0,
    chairRotation: 0,
    hairColor: HAIR_COLORS[0].hex,
    tiaraVisible: false,
    hairScaleY: 1.0,
    startTime: Date.now(),
    ended: false,
    chairGroup: null as THREE.Group | null,
    hairMesh: null as THREE.Group | null,
    tiaraMesh: null as THREE.Mesh | null,
    bubbleMeshes: [] as THREE.Mesh[],
    particles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
  });

  // 오디오 효과음
  const playSound = useCallback((type: 'bubble' | 'rinse' | 'dry' | 'snip' | 'magic' | 'win') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'bubble') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'rinse') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'dry') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(280, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'snip') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.setValueAtTime(350, now + 0.04);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'magic') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.2, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.25);
          o.start(now + i * 0.08);
          o.stop(now + i * 0.08 + 0.25);
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
    scene.background = new THREE.Color(0xfce4ec); // 로맨틱 핑크 베이지

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.5, 100);
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 2.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명 (뷰티 조명: 부드러운 앰비언트 + 링라이트 스포트)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const beautyLight = new THREE.DirectionalLight(0xfff5f8, 1.2);
    beautyLight.position.set(0, 8, 8);
    beautyLight.castShadow = true;
    scene.add(beautyLight);

    // 살롱 바닥 및 럭셔리 대형 거울
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xfff0f5, roughness: 0.2 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    // 후면 대형 골든 프레임 거울
    const mirrorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 7.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8, roughness: 0.2 })
    );
    mirrorFrame.position.set(0, 4.0, -2.5);
    const mirrorGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 6.8),
      new THREE.MeshStandardMaterial({ color: 0xe0f7fa, metalness: 0.9, roughness: 0.05 })
    );
    mirrorGlass.position.set(0, 4.0, -2.34);
    scene.add(mirrorFrame);
    scene.add(mirrorGlass);

    // 살롱 체어 및 디바 모델 그룹
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0);

    // 체어 스탠드 & 시트 (화이트 & 로즈골드)
    const chairBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 0.3, 24),
      new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8 })
    );
    chairBase.position.y = 0.15;
    const chairPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8 })
    );
    chairPillar.position.y = 0.75;
    const chairSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.3, 0.4, 20),
      new THREE.MeshStandardMaterial({ color: 0xf8bbd0, roughness: 0.5 })
    );
    chairSeat.position.y = 1.4;
    chairSeat.castShadow = true;

    const chairBack = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.0, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf8bbd0, roughness: 0.5 })
    );
    chairBack.position.set(0, 2.4, -1.0);
    chairBack.castShadow = true;

    chairGroup.add(chairBase);
    chairGroup.add(chairPillar);
    chairGroup.add(chairSeat);
    chairGroup.add(chairBack);

    // No.070 공식 카드 영웅 배지 체어 상단 엠블럼 부착
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 70, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(badgeCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), bMat);
    badge.position.set(0, 3.6, -1.0);
    chairGroup.add(badge);

    // 3D 디바 캐릭터 (Diva Character) 모델링
    const divaGroup = new THREE.Group();
    divaGroup.position.set(0, 1.4, 0);

    // 드레스 바디
    const dress = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 1.1, 1.5, 16),
      new THREE.MeshStandardMaterial({ color: 0xad1457, roughness: 0.4 })
    );
    dress.position.y = 0.8;
    dress.castShadow = true;
    divaGroup.add(dress);

    // 목 & 얼굴 헤드
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xffe0bd })
    );
    neck.position.y = 1.7;
    divaGroup.add(neck);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.6 })
    );
    head.position.y = 2.3;
    head.castShadow = true;
    divaGroup.add(head);

    // 눈 2개
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3e2723 });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.22, 2.35, 0.58);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.22, 2.35, 0.58);
    divaGroup.add(lEye);
    divaGroup.add(rEye);

    // 입술 (로맨틱 핑크)
    const lips = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xe91e63 })
    );
    lips.position.set(0, 2.1, 0.62);
    divaGroup.add(lips);

    // 3D 헤어 메쉬 그룹 (볼륨 정수리 + 좌우 웨이브 컬)
    const hairGroup = new THREE.Group();
    hairGroup.position.set(0, 2.3, 0);

    const hairMat = new THREE.MeshStandardMaterial({
      color: stateRef.current.hairColor,
      roughness: 0.4,
      metalness: 0.1,
    });

    // 정수리 돔
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 16), hairMat);
    hairTop.position.set(0, 0.12, -0.05);
    hairGroup.add(hairTop);

    // 좌우 풍성한 롱 컬
    const lCurl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 1.8, 12), hairMat);
    lCurl.position.set(-0.65, -0.5, 0.15);
    lCurl.rotateZ(0.15);
    const rCurl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 1.8, 12), hairMat);
    rCurl.position.set(0.65, -0.5, 0.15);
    rCurl.rotateZ(-0.15);
    hairGroup.add(lCurl);
    hairGroup.add(rCurl);

    // 후면 롱 헤어
    const backHair = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 2.0, 14), hairMat);
    backHair.position.set(0, -0.6, -0.4);
    hairGroup.add(backHair);

    divaGroup.add(hairGroup);
    stateRef.current.hairMesh = hairGroup;

    // 황금 티아라 왕관 (Stage 4 전용)
    const tiaraGeo = new THREE.TorusGeometry(0.55, 0.08, 8, 20, Math.PI);
    const tiaraMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const tiara = new THREE.Mesh(tiaraGeo, tiaraMat);
    tiara.rotateX(-Math.PI / 2);
    tiara.position.set(0, 2.95, 0.1);
    tiara.visible = false;
    divaGroup.add(tiara);
    stateRef.current.tiaraMesh = tiara;

    chairGroup.add(divaGroup);
    scene.add(chairGroup);
    stateRef.current.chairGroup = chairGroup;

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

      // 턴테이블 회전 보정
      if (state.chairGroup) {
        state.chairGroup.rotation.y = THREE.MathUtils.lerp(state.chairGroup.rotation.y, state.chairRotation, 0.1);
      }

      // 헤어 메쉬 컬러 및 스케일 업데이트
      if (state.hairMesh) {
        state.hairMesh.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(state.hairColor);
          }
        });
        state.hairMesh.scale.y = state.hairScaleY;
      }

      // 티아라 노출 여부
      if (state.tiaraMesh) {
        state.tiaraMesh.visible = state.tiaraVisible;
      }

      // 액션 버튼 누름 또는 터치 상호작용 시 진행도 누적
      if (input.actionPressed || input.isInteracting) {
        state.progress = Math.min(100, state.progress + 32 * dt);
        setStageProgress(Math.round(state.progress));

        // 파티클 효과 생성
        if (state.stage === 'shampoo') {
          // 비누 거품 파티클
          playSound('bubble');
          const bGeo = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 8, 8);
          const bMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
          const bMesh = new THREE.Mesh(bGeo, bMat);
          bMesh.position.set(
            (Math.random() - 0.5) * 1.2,
            3.8 + Math.random() * 0.6,
            (Math.random() - 0.5) * 0.8
          );
          scene.add(bMesh);
          state.particles.push({
            mesh: bMesh,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 0.4 + Math.random() * 0.6,
            vz: (Math.random() - 0.5) * 0.8,
            life: 0.4,
          });
        } else if (state.stage === 'dry') {
          // 드라이 윈드 파티클
          playSound('dry');
          const wGeo = new THREE.BoxGeometry(0.08, 0.08, 0.3);
          const wMat = new THREE.MeshBasicMaterial({ color: 0xfff9c4 });
          const wMesh = new THREE.Mesh(wGeo, wMat);
          wMesh.position.set((Math.random() - 0.5) * 1.5, 3.6 + Math.random() * 0.5, 1.2);
          scene.add(wMesh);
          state.particles.push({
            mesh: wMesh,
            vx: (Math.random() - 0.5) * 1.0,
            vy: (Math.random() - 0.5) * 0.5,
            vz: -4,
            life: 0.3,
          });
        } else if (state.stage === 'cut') {
          // 가위 컷 파티클
          playSound('snip');
          state.hairScaleY = Math.max(0.82, state.hairScaleY - 0.04 * dt);
          const cGeo = new THREE.BoxGeometry(0.06, 0.25, 0.06);
          const cMat = new THREE.MeshBasicMaterial({ color: state.hairColor });
          const cMesh = new THREE.Mesh(cGeo, cMat);
          cMesh.position.set((Math.random() - 0.5) * 1.2, 3.2, (Math.random() - 0.5) * 0.6);
          scene.add(cMesh);
          state.particles.push({
            mesh: cMesh,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -2.5,
            vz: (Math.random() - 0.5) * 0.5,
            life: 0.5,
          });
        } else if (state.stage === 'color') {
          // 글리터 스파클 파티클
          playSound('magic');
          const sGeo = new THREE.SphereGeometry(0.08, 6, 6);
          const sMat = new THREE.MeshBasicMaterial({ color: state.hairColor });
          const sMesh = new THREE.Mesh(sGeo, sMat);
          sMesh.position.set((Math.random() - 0.5) * 1.5, 3.5 + Math.random() * 0.8, (Math.random() - 0.5) * 1.0);
          scene.add(sMesh);
          state.particles.push({
            mesh: sMesh,
            vx: (Math.random() - 0.5) * 1.2,
            vy: 0.8 + Math.random() * 1.2,
            vz: (Math.random() - 0.5) * 1.2,
            life: 0.45,
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

  // 다음 코스 단계로 전환
  const handleNextStage = () => {
    const s = stateRef.current;
    if (s.stage === 'shampoo') {
      s.stage = 'dry';
      s.progress = 0;
      setCurrentStage('dry');
      setStageProgress(0);
      playSound('rinse');
      if (navigator.vibrate) navigator.vibrate(30);
    } else if (s.stage === 'dry') {
      s.stage = 'cut';
      s.progress = 0;
      setCurrentStage('cut');
      setStageProgress(0);
      playSound('magic');
      if (navigator.vibrate) navigator.vibrate(30);
    } else if (s.stage === 'cut') {
      s.stage = 'color';
      s.progress = 0;
      setCurrentStage('color');
      setStageProgress(0);
      playSound('magic');
      if (navigator.vibrate) navigator.vibrate(30);
    } else if (s.stage === 'color') {
      // 메이크오버 최종 완성!
      s.tiaraVisible = true;
      s.ended = true;
      setIsGameWon(true);
      playSound('win');
      if (navigator.vibrate) navigator.vibrate([60, 100, 60]);

      const duration = Math.floor((Date.now() - s.startTime) / 1000);
      const res = calculateAndDepositMissionReward({
        gameId: 'diva-hair-salon',
        gameTitle: '디바 헤어 살롱 3D (Diva Hair Salon)',
        isVictory: true,
        score: 1000,
        maxTargetScore: 1000,
        durationSeconds: duration,
      });
      setRewardResult(res);
    }
  };

  // 컬러 변경
  const handleSelectColor = (idx: number) => {
    setSelectedColorIdx(idx);
    stateRef.current.hairColor = HAIR_COLORS[idx].hex;
    playSound('magic');
    if (navigator.vibrate) navigator.vibrate(20);
  };

  // 터치 스와이프 인터랙션
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
        title="DIVA HAIR SALON 3D"
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

      {/* 상단 4단계 코스 진행 바 */}
      <div className="absolute top-14 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex justify-between items-center bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-pink-500/40">
          <div className="flex items-center gap-2">
            {currentStage === 'shampoo' && <Droplets className="w-5 h-5 text-cyan-400 animate-bounce" />}
            {currentStage === 'dry' && <Wind className="w-5 h-5 text-amber-400 animate-pulse" />}
            {currentStage === 'cut' && <Scissors className="w-5 h-5 text-emerald-400 animate-spin" />}
            {currentStage === 'color' && <Palette className="w-5 h-5 text-pink-400 animate-pulse" />}
            <div>
              <div className="text-sm font-black text-pink-300">
                {currentStage === 'shampoo' && '1단계: 샴푸 & 세정'}
                {currentStage === 'dry' && '2단계: 블로우 드라이'}
                {currentStage === 'cut' && '3단계: 볼륨 헤어 컷'}
                {currentStage === 'color' && '4단계: 컬러 염색 & 티아라'}
              </div>
              <div className="text-[10px] text-zinc-400">화면을 터치하거나 STYLE 버튼을 길게 누르세요</div>
            </div>
          </div>
          <div className="text-lg font-black text-pink-400">{stageProgress}%</div>
        </div>

        {/* 진행도 프로그레스 바 */}
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
            style={{ width: `${stageProgress}%` }}
          />
        </div>
      </div>

      {/* 하단 모바일 컨트롤 패널 */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        {/* 좌측: 컬러 팔레트 (Stage 4 전용) 또는 턴테이블 회전 버튼 */}
        <div className="pointer-events-auto flex items-center gap-2">
          {currentStage === 'color' ? (
            <div className="flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-pink-400/40">
              {HAIR_COLORS.map((c, i) => (
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
                  stateRef.current.chairRotation -= Math.PI / 4;
                  if (navigator.vibrate) navigator.vibrate(20);
                }}
                className="px-3 py-2 bg-black/60 backdrop-blur-md border border-white/30 text-white rounded-lg text-xs active:scale-95 font-bold"
              >
                ◀ 좌회전
              </button>
              <button
                onClick={() => {
                  stateRef.current.chairRotation += Math.PI / 4;
                  if (navigator.vibrate) navigator.vibrate(20);
                }}
                className="px-3 py-2 bg-black/60 backdrop-blur-md border border-white/30 text-white rounded-lg text-xs active:scale-95 font-bold"
              >
                우회전 ▶
              </button>
            </div>
          )}
        </div>

        {/* 우측: 스타일링 액션 버튼 (76px) 및 다음 단계 버튼 (64px) */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* 다음 단계 버튼 (진행도 100% 도달 시 하이라이트) */}
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
            <span className="text-[10px]">{currentStage === 'color' ? '완성하기' : '다음 단계'}</span>
          </button>

          {/* 메인 스타일링 액션 버튼 (76px 대형 버튼) */}
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
            className="w-20 h-20 sm:w-24 sm:h-24 bg-pink-600 border-3 border-pink-300 text-white rounded-full active:scale-90 flex flex-col items-center justify-center font-black shadow-xl shadow-pink-600/50 active:bg-pink-500"
          >
            <Sparkles className="w-8 h-8 animate-spin" />
            <span className="text-[11px] tracking-wider mt-0.5">STYLE</span>
          </button>
        </div>
      </div>

      {/* 승리 보상 모달 */}
      {isGameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={isGameWon}
          onClose={handleExit}
          reward={rewardResult}
          gameTitle="디바 헤어 살롱 3D (Diva Hair Salon)"
        />
      )}
    </div>
  );
}
