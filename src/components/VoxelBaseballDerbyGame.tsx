import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Zap, Sparkles, Target, RotateCcw } from 'lucide-react';
import { CardData } from '../types';

interface VoxelBaseballDerbyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelBaseballDerbyGame: React.FC<VoxelBaseballDerbyGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [pitchCount, setPitchCount] = useState<number>(1);
  const [totalPitches] = useState<number>(10);
  const [homeruns, setHomeruns] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [lastHitText, setLastHitText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    aimX: 0, // -1 to 1
    aimY: 0, // -1 to 1
    isPitching: false,
    ballPos: new THREE.Vector3(0, 1.2, -18),
    ballVel: new THREE.Vector3(0, 0, 0),
    isBallInPlay: false,
    batSwingTime: 0,
    isSwinging: false,
    homeruns: 0,
    totalDistance: 0,
    pitch: 1,
    isGameOver: false
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 40, 120);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 200);
    camera.position.set(0, 2.2, 3.8);
    camera.lookAt(0, 1.5, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // Baseball Stadium Field
    const grassGeo = new THREE.PlaneGeometry(160, 160);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3b7a36, roughness: 0.8 });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.receiveShadow = !lowSpecMode;
    scene.add(grassMesh);

    // Dirt Infield Diamond
    const dirtGeo = new THREE.RingGeometry(0, 18, 4);
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x9b673c, roughness: 0.9 });
    const dirtMesh = new THREE.Mesh(dirtGeo, dirtMat);
    dirtMesh.rotation.x = -Math.PI / 2;
    dirtMesh.rotation.z = Math.PI / 4;
    dirtMesh.position.set(0, 0.01, -8);
    scene.add(dirtMesh);

    // Outfield Fence
    const fenceGeo = new THREE.BoxGeometry(100, 6, 2);
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f });
    const fenceMesh = new THREE.Mesh(fenceGeo, fenceMat);
    fenceMesh.position.set(0, 3, -60);
    scene.add(fenceMesh);

    // Pitcher Mound & Voxel Pitcher
    const moundGeo = new THREE.CylinderGeometry(2, 2.5, 0.3, 16);
    const moundMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.set(0, 0.15, -18);
    scene.add(mound);

    const pitcherGroup = new THREE.Group();
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0xd9534f });
    const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4 });
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), pBodyMat);
    pBody.position.y = 1.2;
    const pHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), pHeadMat);
    pHead.position.y = 1.9;
    pitcherGroup.add(pBody, pHead);
    pitcherGroup.position.set(0, 0, -18);
    scene.add(pitcherGroup);

    // Voxel Batter & Bat
    const batterGroup = new THREE.Group();
    const bBodyMat = new THREE.MeshStandardMaterial({ color: 0x2b5797 });
    const bBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.4), bBodyMat);
    bBody.position.set(-0.6, 1.2, 0);
    const bHead = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), pHeadMat);
    bHead.position.set(-0.6, 1.85, 0);

    const batGeo = new THREE.CylinderGeometry(0.06, 0.04, 1.1, 8);
    const batMat = new THREE.MeshStandardMaterial({ color: 0xcc9966, roughness: 0.4 });
    const batMesh = new THREE.Mesh(batGeo, batMat);
    batMesh.position.set(-0.2, 1.4, 0.3);
    batMesh.rotation.z = Math.PI / 3;
    batterGroup.add(bBody, bHead, batMesh);
    scene.add(batterGroup);

    // Baseball
    const ballGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = !lowSpecMode;
    ballMesh.position.set(0, 1.4, -18);
    scene.add(ballMesh);

    // Start first pitch after 1s
    const startPitch = () => {
      if (stateRef.current.isGameOver) return;
      stateRef.current.isPitching = true;
      stateRef.current.ballPos.set((Math.random() - 0.5) * 0.8, 1.2 + (Math.random() - 0.5) * 0.6, -18);
      stateRef.current.ballVel.set((Math.random() - 0.5) * 0.5, 0.05, 0.52 + Math.random() * 0.08);
      stateRef.current.isBallInPlay = true;
    };

    const timer = setTimeout(() => startPitch(), 1000);

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Pitch Ball physics
      if (stateRef.current.isBallInPlay) {
        stateRef.current.ballPos.add(stateRef.current.ballVel);
        ballMesh.position.copy(stateRef.current.ballPos);

        // Check if ball reached home plate
        if (stateRef.current.ballPos.z >= 0.8 && stateRef.current.ballVel.z > 0) {
          // Missed pitch (Strike)
          stateRef.current.isBallInPlay = false;
          setLastHitText(isKo ? '❌ 헛스윙 / 스트라이크!' : '❌ Strike / Miss!');
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          nextPitch();
        } else if (stateRef.current.ballPos.z < -70 || stateRef.current.ballPos.y < 0) {
          // Ball hit completed landing
          stateRef.current.isBallInPlay = false;
          nextPitch();
        }
      }

      // Bat Swing animation
      if (stateRef.current.isSwinging) {
        stateRef.current.batSwingTime += 0.15;
        batMesh.rotation.y = -Math.sin(stateRef.current.batSwingTime) * Math.PI * 1.2;
        batMesh.rotation.z = Math.PI / 3 - Math.sin(stateRef.current.batSwingTime) * 0.5;
        if (stateRef.current.batSwingTime >= Math.PI) {
          stateRef.current.isSwinging = false;
          batMesh.rotation.set(0, 0, Math.PI / 3);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const nextPitch = () => {
      if (stateRef.current.pitch >= totalPitches) {
        // Game Over
        stateRef.current.isGameOver = true;
        setIsGameOver(true);
        const reward = Math.min(260, 50 + stateRef.current.homeruns * 20 + Math.floor(stateRef.current.totalDistance / 20));
        setRewardSns(reward);
        onReward(reward);
        return;
      }
      stateRef.current.pitch += 1;
      setPitchCount(stateRef.current.pitch);
      setTimeout(() => startPitch(), 1200);
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, totalPitches, isKo, onReward, playSfx]);

  const handleSwing = () => {
    if (stateRef.current.isSwinging || !stateRef.current.isBallInPlay || stateRef.current.isGameOver) return;

    stateRef.current.isSwinging = true;
    stateRef.current.batSwingTime = 0;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    // Check hit timing at plate (z around -0.8 to 0.4)
    const bz = stateRef.current.ballPos.z;
    if (bz >= -1.6 && bz <= 0.4) {
      // Hit!
      const timingAccuracy = 1 - Math.abs(bz - (-0.4)) / 1.0;
      if (timingAccuracy > 0.6) {
        // HOMERUN!
        const dist = Math.floor(120 + timingAccuracy * 45 + Math.random() * 15);
        stateRef.current.ballVel.set((Math.random() - 0.5) * 0.4, 0.6 + timingAccuracy * 0.4, -1.2 - timingAccuracy * 0.6);
        stateRef.current.homeruns += 1;
        stateRef.current.totalDistance += dist;
        setHomeruns(stateRef.current.homeruns);
        setTotalDistance(stateRef.current.totalDistance);
        setLastHitText(isKo ? `💥 장외 150m 초거대 홈런! (${dist}m)` : `💥 CRUSHING HOMERUN! (${dist}m)`);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      } else {
        // Fair hit / Line drive
        const dist = Math.floor(60 + timingAccuracy * 40);
        stateRef.current.ballVel.set((Math.random() - 0.5) * 0.8, 0.2, -0.8);
        stateRef.current.totalDistance += dist;
        setTotalDistance(stateRef.current.totalDistance);
        setLastHitText(isKo ? `⚾ 안타! (${dist}m)` : `⚾ Fair Hit! (${dist}m)`);
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs text-amber-300 font-bold">
            {isKo ? `홈런: ${homeruns}개` : `HR: ${homeruns}`} | {totalDistance}m
          </span>
          <span className="text-[10px] text-slate-400">
            [{pitchCount}/{totalPitches}P]
          </span>
        </div>
      </div>

      {/* Last hit notification banner */}
      {lastHitText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg animate-bounce pointer-events-none z-10">
          {lastHitText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      <div
        className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          e.preventDefault();
          handleSwing();
        }}
      />

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-slate-900/80 border border-amber-500/40 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 어디든 타이밍에 맞춰 탭하여 풀스윙 (버튼 없음)' : 'Tap anywhere with perfect timing to swing (No Buttons)'}
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest">
              {isKo ? '🏆 홈런 더비 완주!' : '🏆 DERBY COMPLETED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '총 홈런 수' : 'Total Homeruns'}</span>
                <span className="font-bold text-amber-300">{homeruns} HR</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최장 누적 거리' : 'Total Distance'}</span>
                <span className="font-bold text-indigo-300">{totalDistance}m</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                <span>{isKo ? '획득 SNS 보상' : 'Earned SNS'}</span>
                <span>+{rewardSns} SNS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all"
              >
                {isKo ? '보상 수령 및 복귀' : 'Claim & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
