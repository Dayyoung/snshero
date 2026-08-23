import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Compass, Sparkles, Navigation, ShieldCheck } from 'lucide-react';
import { CardData } from '../types';

interface VoxelFlightLandingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelFlightLandingGame: React.FC<VoxelFlightLandingGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [currentAirport, setCurrentAirport] = useState<number>(1);
  const totalAirports = 3;
  const [altitude, setAltitude] = useState<number>(500);
  const [airspeed, setAirspeed] = useState<number>(240);
  const [gearDeployed, setGearDeployed] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    planePos: new THREE.Vector3(0, 8, -40),
    planeRot: new THREE.Euler(0, 0, 0),
    pitch: 0,
    roll: 0,
    yaw: 0,
    speed: 0.6,
    gear: false,
    airportIdx: 1,
    landingDist: 0,
    isGameOver: false
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6ba4d9);
    scene.fog = new THREE.Fog(0x6ba4d9, 40, 180);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 10, -50);
    camera.lookAt(0, 8, -40);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Sun & Clouds
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x446688, 0.95);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // Ocean / Island Terrain
    const terrainGeo = new THREE.PlaneGeometry(300, 300);
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.9 });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    // Airport Runway
    const runwayGeo = new THREE.PlaneGeometry(12, 120);
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 0.05, 40);
    scene.add(runway);

    // Runway Centerline stripes
    for (let i = -50; i < 50; i += 10) {
      const stripeGeo = new THREE.PlaneGeometry(0.8, 5);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.06, 40 + i);
      scene.add(stripe);
    }

    // Voxel Jet Airplane
    const planeGroup = new THREE.Group();
    const pFuselageGeo = new THREE.BoxGeometry(0.9, 0.9, 3.8);
    const pFuselageMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.3 });
    const fuselage = new THREE.Mesh(pFuselageGeo, pFuselageMat);

    // Wings
    const pWingGeo = new THREE.BoxGeometry(6.4, 0.15, 1.4);
    const pWingMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    const wings = new THREE.Mesh(pWingGeo, pWingMat);
    wings.position.set(0, 0, 0.2);

    // Tail
    const pTailGeo = new THREE.BoxGeometry(0.15, 1.2, 0.9);
    const tail = new THREE.Mesh(pTailGeo, pWingMat);
    tail.position.set(0, 0.8, -1.4);

    planeGroup.add(fuselage, wings, tail);
    planeGroup.position.set(0, 8, -40);
    scene.add(planeGroup);

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!stateRef.current.isGameOver) {
        // Airplane Flight Physics
        const curSpeed = stateRef.current.gear ? 0.35 : 0.6;
        stateRef.current.planePos.z += curSpeed;
        stateRef.current.planePos.y -= (stateRef.current.gear ? 0.04 : 0.02) - (stateRef.current.pitch * 0.04);
        stateRef.current.planePos.x += stateRef.current.roll * 0.06;

        planeGroup.position.copy(stateRef.current.planePos);
        planeGroup.rotation.set(
          -stateRef.current.pitch * 0.4,
          -stateRef.current.roll * 0.2,
          -stateRef.current.roll * 0.5
        );

        // Third-person chase camera
        camera.position.set(
          stateRef.current.planePos.x,
          stateRef.current.planePos.y + 2.5,
          stateRef.current.planePos.z - 8
        );
        camera.lookAt(stateRef.current.planePos.x, stateRef.current.planePos.y + 0.5, stateRef.current.planePos.z + 10);

        setAltitude(Math.max(0, Math.floor(stateRef.current.planePos.y * 50)));
        setAirspeed(Math.floor(curSpeed * 400));

        // Check Touchdown / Runway Landing
        if (stateRef.current.planePos.z >= 20 && stateRef.current.planePos.z <= 90) {
          if (stateRef.current.planePos.y <= 0.45) {
            // Landed!
            if (stateRef.current.gear && Math.abs(stateRef.current.roll) < 0.3) {
              // Smooth Landing
              stateRef.current.airportIdx += 1;
              if (stateRef.current.airportIdx > totalAirports) {
                stateRef.current.isGameOver = true;
                setIsGameOver(true);
                const r = 260;
                setRewardSns(r);
                onReward(r);
              } else {
                setCurrentAirport(stateRef.current.airportIdx);
                stateRef.current.planePos.set(0, 8, -40);
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              }
            } else {
              // Hard bounce / retry approach
              stateRef.current.planePos.set(0, 8, -40);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            }
          }
        } else if (stateRef.current.planePos.z > 110) {
          // Missed runway, go-around
          stateRef.current.planePos.set(0, 8, -40);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, totalAirports, onReward, playSfx]);

  const toggleGear = () => {
    stateRef.current.gear = !stateRef.current.gear;
    setGearDeployed(stateRef.current.gear);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
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

        <div className="flex items-center gap-2 bg-slate-900/90 border border-sky-500/40 px-3 py-1.5 rounded-sm">
          <Compass size={16} className="text-sky-400" />
          <span className="text-xs text-sky-300 font-bold">
            {isKo ? `공항: ${currentAirport}/${totalAirports}` : `AIRPORT: ${currentAirport}/${totalAirports}`}
          </span>
          <span className="text-[10px] text-amber-300">
            ALT: {altitude}FT | {airspeed}KTS
          </span>
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                moved = true;
                stateRef.current.roll = Math.max(-1, Math.min(1, dx * 0.02));
                stateRef.current.pitch = Math.max(-1, Math.min(1, -dy * 0.02));
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.roll = 0;
              stateRef.current.pitch = 0;

              if (!moved) {
                // Tap: Toggle Landing Gear
                toggleGear();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-sky-400/30 rounded-full text-[10px] text-sky-300 font-mono backdrop-blur-xs">
          {isKo ? '드래그: 기수 상승/하강 & 선회 | 탭: 랜딩기어 ON/OFF (버튼 없음)' : 'Drag: Pitch & Roll | Tap: Toggle Landing Gear (No Buttons)'}
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
              {isKo ? '🏆 3개 공항 정밀 착륙 완주!' : '🏆 ALL AIRPORTS LANDED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '착륙 성공률' : 'Landing Rating'}</span>
                <span className="font-bold text-amber-300">100% PERFECT ✈️</span>
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
