import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelFishingMasterGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelFishingMasterGame: React.FC<VoxelFishingMasterGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_fishing_master') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [fishCaught, setFishCaught] = useState<number>(0);
  const targetFish = 3;
  const [tension, setTension] = useState<number>(30);
  const [biteState, setBiteState] = useState<'idle' | 'waiting' | 'bite' | 'reeling'>('idle');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    fishCaught: 0,
    tension: 30,
    biteState: 'idle' as 'idle' | 'waiting' | 'bite' | 'reeling',
    reelProgress: 0,
    isPressingReel: false,
    score: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    floatMesh: null as THREE.Mesh | null
  });

  const castRod = () => {
    const s = stateRef.current;
    if (s.biteState !== 'idle' || s.isGameOver || s.isVictory || s.isPaused) return;
    s.biteState = 'waiting';
    setBiteState('waiting');
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Wait 2-3 sec for bite
    setTimeout(() => {
      if (s.biteState === 'waiting') {
        s.biteState = 'bite';
        setBiteState('bite');
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      }
    }, 2200);
  };

  const hookAndReel = () => {
    const s = stateRef.current;
    if (s.biteState === 'bite') {
      s.biteState = 'reeling';
      s.reelProgress = 0;
      s.tension = 40;
      setBiteState('reeling');
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x082f49);
    scene.fog = new THREE.FogExp2(0x082f49, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Ocean Water
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85, roughness: 0.1 })
    );
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Fishing Pier
    const pier = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 8), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    pier.position.set(0, 0.5, 6);
    scene.add(pier);

    // Fishing Float (찌)
    const floatMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.4 })
    );
    floatMesh.position.set(0, 0.2, -4);
    scene.add(floatMesh);
    stateRef.current.floatMesh = floatMesh;

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Float Physics & Bobbing
      if (floatMesh) {
        if (s.biteState === 'idle') {
          floatMesh.position.set(0, 1.0, 4);
        } else if (s.biteState === 'waiting') {
          floatMesh.position.set(0, 0.1 + Math.sin(now * 0.003) * 0.1, -4);
        } else if (s.biteState === 'bite') {
          floatMesh.position.set(0, -0.4 + Math.sin(now * 0.02) * 0.2, -4);
        } else if (s.biteState === 'reeling') {
          floatMesh.position.set(0, 0.2, -4 + (s.reelProgress / 100) * 8);

          // Reeling Physics
          if (s.isPressingReel) {
            s.reelProgress += dt * 35;
            s.tension = Math.min(100, s.tension + dt * 45);
          } else {
            s.tension = Math.max(10, s.tension - dt * 30);
          }
          setTension(Math.round(s.tension));

          // Line Break Check
          if (s.tension >= 100) {
            s.biteState = 'idle';
            setBiteState('idle');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }

          // Fish Caught Check
          if (s.reelProgress >= 100) {
            s.fishCaught += 1;
            s.score += 500;
            s.biteState = 'idle';
            setFishCaught(s.fishCaught);
            setBiteState('idle');
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

            if (s.fishCaught >= targetFish) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_fishing_master',
                gameTitle: '복셀 피싱 마스터',
                durationSeconds: duration,
                score: s.score + 1000,
                difficulty: 'HARD',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = stateRef.current;
    s.fishCaught = 0;
    s.tension = 30;
    s.biteState = 'idle';
    s.reelProgress = 0;
    s.score = 0;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setFishCaught(0);
    setTension(30);
    setBiteState('idle');
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 피싱 마스터' : 'Voxel Fishing Master'}
        language={language}
        telemetries={[
          { label: isKo ? '대어' : 'Fish', value: `${fishCaught}/${targetFish}마리`, color: 'text-cyan-300' },
          { label: isKo ? '텐션' : 'Tension', value: `${tension}%`, color: tension > 80 ? 'text-rose-400' : 'text-emerald-300' },
          {
            label: isKo ? '상태' : 'State',
            value: biteState === 'idle' ? '캐스팅대기' : biteState === 'waiting' ? '입질대기' : biteState === 'bite' ? '⚡입질발생!' : '릴링중!',
            color: biteState === 'bite' ? 'text-yellow-300' : 'text-amber-300'
          }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.preventDefault();
            if (biteState === 'idle') {
              castRod();
            } else if (biteState === 'bite') {
              hookAndReel();
            } else if (biteState === 'reeling') {
              stateRef.current.isPressingReel = true;
            }
          }}
          onPointerUp={() => {
            stateRef.current.isPressingReel = false;
          }}
          onPointerCancel={() => {
            stateRef.current.isPressingReel = false;
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {biteState === 'idle'
            ? (isKo ? '화면 탭: 낚싯대 던지기 (버튼 없음)' : 'Tap screen to cast rod (No Buttons)')
            : biteState === 'bite'
            ? (isKo ? '⚡ 입질 발생! 즉시 화면 탭하여 챔질!' : '⚡ BITE! Tap now to hook!')
            : (isKo ? '화면 롱프레스: 릴 감기 (텐션 100% 주의)' : 'Hold screen to reel in (Watch tension)')}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_fishing_master"
          gameTitle={isKo ? '3D 복셀 피싱 마스터: 바다 낚시 대결' : 'Voxel Fishing Master: Ocean Fishing'}
          sportType="fishing"
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};
