import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Fish, Anchor, Sparkles } from 'lucide-react';
import { CardData } from '../types';

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
  const mountRef = useRef<HTMLDivElement>(null);
  const [fishCaught, setFishCaught] = useState<number>(0);
  const [tension, setTension] = useState<number>(30);
  const [biteState, setBiteState] = useState<'idle' | 'waiting' | 'bite' | 'reeling'>('idle');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    fishCaught: 0,
    tension: 30,
    biteState: 'idle' as 'idle' | 'waiting' | 'bite' | 'reeling',
    reelProgress: 0,
    isPressingReel: false,
    floatMesh: null as THREE.Mesh | null,
    isGameOver: false
  });

  const castRod = () => {
    const s = stateRef.current;
    if (s.biteState !== 'idle' || s.isGameOver) return;
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
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x082f49);
    scene.fog = new THREE.FogExp2(0x082f49, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Ocean Water
    const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85 }));
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Fishing Pier / Boat
    const pier = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 8), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    pier.position.set(0, 0.5, 6);
    scene.add(pier);

    // Float Mesh
    const floatMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    floatMesh.position.set(0, 0.2, -6);
    scene.add(floatMesh);
    stateRef.current.floatMesh = floatMesh;

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Float ripple animation
      if (s.biteState === 'bite') {
        floatMesh.position.y = 0.2 + Math.sin(Date.now() * 0.03) * 0.4;
      } else {
        floatMesh.position.y = 0.2 + Math.sin(Date.now() * 0.003) * 0.1;
      }

      // Reeling Mechanic
      if (s.biteState === 'reeling') {
        if (s.isPressingReel) {
          s.tension = Math.min(100, s.tension + 1.2);
          s.reelProgress += 0.8;
        } else {
          s.tension = Math.max(0, s.tension - 0.8);
        }
        setTension(Math.round(s.tension));

        // Tension break or catch
        if (s.tension >= 95 || s.tension <= 5) {
          // Line snapped or escaped
          s.biteState = 'idle';
          setBiteState('idle');
        } else if (s.reelProgress >= 100) {
          // Fish Caught!
          s.fishCaught += 1;
          setFishCaught(s.fishCaught);
          s.biteState = 'idle';
          setBiteState('idle');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

          if (s.fishCaught >= 3) {
            s.isGameOver = true;
            setIsGameOver(true);
            const reward = 260;
            setRewardSns(reward);
            onReward(reward);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white text-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-sm border border-slate-700 font-bold"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 font-black">
          <span className="text-cyan-300">🎣 낚은 대어: {fishCaught}/3마리</span>
          {biteState === 'reeling' && (
            <span className={`font-bold ${tension > 80 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              텐션: {tension}%
            </span>
          )}
        </div>

        <div className="text-amber-300 font-bold">
          {biteState === 'idle' && '낚싯대 던지기 대기'}
          {biteState === 'waiting' && '입질 대기 중...'}
          {biteState === 'bite' && '⚡ 입질 발생! 지금 탭!'}
          {biteState === 'reeling' && '릴링 진행 중!'}
        </div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
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
        <div className="px-3 py-1 bg-black/70 border border-cyan-400/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {biteState === 'idle'
            ? (language === 'ko' ? '화면을 탭하여 낚싯대 던지기 (버튼 없음)' : 'Tap anywhere to cast rod (No Buttons)')
            : biteState === 'bite'
            ? (language === 'ko' ? '⚡ 입질 발생! 즉시 화면을 탭하여 챔질!' : '⚡ BITE! Tap now to hook!')
            : (language === 'ko' ? '화면을 꾹 눌러 릴 감기' : 'Hold screen to reel in')}
        </div>
      </div>

      {/* Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{language === 'ko' ? '대어 3마리 낚시 성공!' : 'FISHING MASTER!'}</h2>
            <div className="bg-slate-950 p-3 rounded-xs border border-amber-400/30 text-amber-300 font-bold text-sm">
              +{rewardSns} SNS 포인트 획득!
            </div>
            <button
              onClick={onExit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-sm border border-amber-300 text-sm"
            >
              {language === 'ko' ? '확인 및 돌아가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
