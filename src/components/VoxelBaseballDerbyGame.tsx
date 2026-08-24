import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { SportsMissionTutorial } from './SportsMissionTutorial';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

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

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_baseball_derby') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pitchCount, setPitchCount] = useState<number>(1);
  const totalPitches = 10;
  const [homeruns, setHomeruns] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [lastHitText, setLastHitText] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    isPitching: false,
    ballPos: new THREE.Vector3(0, 1.2, -18),
    ballVel: new THREE.Vector3(0, 0, 0),
    isBallInPlay: false,
    batSwingTime: 0,
    isSwinging: false,
    homeruns: 0,
    totalDistance: 0,
    pitch: 1,
    isGameOver: false,
    isPaused: false,
    startTime: Date.now(),
    batMesh: null as THREE.Mesh | null,
    ballMesh: null as THREE.Mesh | null
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

    // Field
    const grassGeo = new THREE.PlaneGeometry(160, 160);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3b7a36, roughness: 0.8 });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.rotation.x = -Math.PI / 2;
    grassMesh.receiveShadow = !lowSpecMode;
    scene.add(grassMesh);

    // Infield
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
    const moundMat = new THREE.MeshStandardMaterial({ color: 0x9b673c });
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.set(0, 0.15, -18);
    scene.add(mound);

    const pitcherGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    pBody.position.y = 1.0;
    pitcherGroup.add(pBody);
    pitcherGroup.position.set(0, 0.3, -18);
    scene.add(pitcherGroup);

    // Batter & Bat
    const batterGroup = new THREE.Group();
    const bBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
    bBody.position.y = 1.0;
    batterGroup.add(bBody);

    const batGeo = new THREE.CylinderGeometry(0.08, 0.05, 1.4, 8);
    const batMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const batMesh = new THREE.Mesh(batGeo, batMat);
    batMesh.position.set(0.6, 1.2, 0.2);
    batMesh.rotation.z = Math.PI / 4;
    batterGroup.add(batMesh);
    batterGroup.position.set(-0.9, 0, 0);
    scene.add(batterGroup);
    stateRef.current.batMesh = batMesh;

    // Baseball
    const ballGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.copy(stateRef.current.ballPos);
    scene.add(ballMesh);
    stateRef.current.ballMesh = ballMesh;

    const throwNextPitch = () => {
      const s = stateRef.current;
      if (s.isGameOver || s.pitch > totalPitches) return;

      s.isPitching = true;
      s.isBallInPlay = false;
      s.ballPos.set(0, 1.4, -18);
      const speed = 22 + Math.random() * 8;
      const targetX = (Math.random() - 0.5) * 0.8;
      const targetY = 1.1 + (Math.random() - 0.5) * 0.6;
      s.ballVel.set((targetX - s.ballPos.x) * 1.5, (targetY - s.ballPos.y) * 1.5, speed);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    };

    setTimeout(throwNextPitch, 800);

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Bat Swing animation
      if (s.isSwinging) {
        s.batSwingTime += dt * 8;
        if (s.batMesh) {
          s.batMesh.rotation.y = -Math.sin(s.batSwingTime) * (Math.PI * 0.8);
        }
        if (s.batSwingTime >= Math.PI) {
          s.isSwinging = false;
          s.batSwingTime = 0;
          if (s.batMesh) s.batMesh.rotation.y = 0;
        }
      }

      // Ball Physics
      if (s.isPitching || s.isBallInPlay) {
        s.ballPos.addScaledVector(s.ballVel, dt);

        if (s.isBallInPlay) {
          s.ballVel.y -= 9.8 * dt; // Gravity
        }

        if (s.ballMesh) {
          s.ballMesh.position.copy(s.ballPos);
        }

        // Catch / Pass home plate
        if (s.isPitching && !s.isBallInPlay && s.ballPos.z > 2.0) {
          s.isPitching = false;
          setLastHitText(isKo ? '❌ 스트라이크 / 헛스윙' : '❌ Strike!');
          advancePitch();
        }

        // Outfield Landed
        if (s.isBallInPlay && s.ballPos.y <= 0.15) {
          s.isBallInPlay = false;
          s.ballPos.y = 0.15;
          advancePitch();
        }
      }

      renderer.render(scene, camera);
    };

    const advancePitch = () => {
      const s = stateRef.current;
      s.pitch += 1;
      setPitchCount(Math.min(s.pitch, totalPitches));

      if (s.pitch > totalPitches) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const isVictory = s.homeruns >= 4;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_baseball_derby',
          gameTitle: '복셀 홈런 더비',
          durationSeconds: duration,
          score: s.totalDistance + s.homeruns * 500,
          difficulty: isVictory ? 'HARD' : 'NORMAL',
          isVictory
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      } else {
        setTimeout(throwNextPitch, 1400);
      }
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

  const handleSwing = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isSwinging || !s.isPitching || s.isPaused) return;

    s.isSwinging = true;
    s.batSwingTime = 0;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Contact Timing Check (Plate is at Z ≈ 0)
    const distToPlate = Math.abs(s.ballPos.z);
    if (distToPlate < 1.2) {
      // Clean Contact Hit!
      s.isPitching = false;
      s.isBallInPlay = true;

      const timingBonus = 1.0 - (distToPlate / 1.2) * 0.4;
      const launchAngle = Math.PI / 4.5;
      const hitPower = 40 * timingBonus + Math.random() * 8;

      s.ballVel.set(
        (Math.random() - 0.5) * 12,
        Math.sin(launchAngle) * hitPower,
        -Math.cos(launchAngle) * hitPower
      );

      const dist = Math.round(hitPower * 3.4);
      if (dist >= 120) {
        s.homeruns += 1;
        s.totalDistance += dist;
        setHomeruns(s.homeruns);
        setTotalDistance(s.totalDistance);
        setLastHitText(isKo ? `💥 장외 대형 홈런! (${dist}m)` : `💥 GRAND HOMERUN! (${dist}m)`);
      } else {
        s.totalDistance += dist;
        setTotalDistance(s.totalDistance);
        setLastHitText(isKo ? `⚾ 안타! (${dist}m)` : `⚾ Fair Hit! (${dist}m)`);
      }
    }
  };

  const handleRestart = () => {
    const s = stateRef.current;
    s.homeruns = 0;
    s.totalDistance = 0;
    s.pitch = 1;
    s.isGameOver = false;
    s.startTime = Date.now();
    setHomeruns(0);
    setTotalDistance(0);
    setPitchCount(1);
    setLastHitText('');
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 홈런 더비' : 'Voxel Baseball Derby'}
        language={language}
        telemetries={[
          { label: isKo ? '홈런' : 'HR', value: `${homeruns}개`, color: 'text-amber-300' },
          { label: isKo ? '누적거리' : 'Dist', value: `${totalDistance}m`, color: 'text-cyan-300' },
          { label: isKo ? '투구수' : 'Pitch', value: `${pitchCount}/${totalPitches}P`, color: 'text-emerald-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Last Hit Notification Banner */}
      {lastHitText && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 px-4 py-1 rounded-sm text-xs font-black tracking-wider shadow-lg animate-bounce pointer-events-none z-20">
          {lastHitText}
        </div>
      )}

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.preventDefault();
            handleSwing();
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '공이 홈플레이트에 올 때 화면 탭: 풀스윙 타격 (버튼 없음)' : 'Tap anywhere when ball reaches plate: Full Swing (No Buttons)'}
        </div>
      </div>

      {/* 3-Step Interactive Sports Tutorial Modal */}
      {showTutorial && (
        <SportsMissionTutorial
          gameId="voxel_baseball_derby"
          gameTitle={isKo ? '3D 복셀 야구 홈런 더비: 슬러거 챌린지' : 'Voxel Baseball Derby: Slugger Challenge'}
          sportType="golf"
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
