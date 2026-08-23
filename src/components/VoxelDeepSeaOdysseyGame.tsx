import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Shield, Zap, Sparkles, ArrowLeft, Trophy, Crosshair, Award } from 'lucide-react';
import { CardData } from '../types';

interface VoxelDeepSeaOdysseyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDeepSeaOdysseyGame: React.FC<VoxelDeepSeaOdysseyGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [oxygen, setOxygen] = useState<number>(100);
  const [battery, setBattery] = useState<number>(100);
  const [depth, setDepth] = useState<number>(100);
  const [crystals, setCrystals] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posY: -10,
    posZ: 0,
    rotY: 0,
    oxygen: 100,
    battery: 100,
    crystals: 0,
    keys: { w: false, s: false, a: false, d: false, up: false, down: false },
    crystalsList: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; collected: boolean }[],
    krakenTentacles: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; hp: number }[],
    torpedoes: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
    isGameOver: false,
    isVictory: false
  });

  const fireTorpedo = (scene: THREE.Scene) => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.battery < 10) return;
    s.battery -= 10;
    setBattery(Math.round(s.battery));

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const torpGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
    torpGeo.rotateX(Math.PI / 2);
    const torpMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const torp = new THREE.Mesh(torpGeo, torpMat);
    torp.position.set(s.posX, s.posY, s.posZ - 1.5);
    scene.add(torp);

    s.torpedoes.push({
      mesh: torp,
      vx: Math.sin(s.rotY) * 35,
      vy: 0,
      vz: -Math.cos(s.rotY) * 35,
      life: 3.0
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020815);
    scene.fog = new THREE.FogExp2(0x020815, 0.025);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Underwater ambient & Submarine Spotlight
    const ambientLight = new THREE.AmbientLight(0x002244, 0.5);
    scene.add(ambientLight);

    const subSpot = new THREE.SpotLight(0xaaffff, 4, 60, Math.PI / 4, 0.4);
    scene.add(subSpot);

    // Deep Trench Seabed
    const seabedGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    seabedGeo.rotateX(-Math.PI / 2);
    const seabedMat = new THREE.MeshLambertMaterial({ color: 0x081525, flatShading: true });
    const seabed = new THREE.Mesh(seabedGeo, seabedMat);
    seabed.position.y = -80;
    scene.add(seabed);

    // Submarine Mesh
    const subGroup = new THREE.Group();

    // Submarine Hull
    const hullGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.0, 12);
    hullGeo.rotateX(Math.PI / 2);
    const hullMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    subGroup.add(hull);

    // Dome Glass
    const domeGeo = new THREE.SphereGeometry(1.1, 12, 12);
    const domeMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 0, -2.0);
    subGroup.add(dome);

    // Propeller
    const propGeo = new THREE.BoxGeometry(1.8, 0.2, 0.1);
    const propMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const prop = new THREE.Mesh(propGeo, propMat);
    prop.position.set(0, 0, 2.1);
    subGroup.add(prop);

    scene.add(subGroup);

    // Spawn 15 Glowing Ancient Crystals
    const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);
    const crystalMat = new THREE.MeshPhongMaterial({ color: 0x00ffaa, emissive: 0x008855, shininess: 100 });
    for (let i = 0; i < 15; i++) {
      const cMesh = new THREE.Mesh(crystalGeo, crystalMat);
      const cx = (Math.random() - 0.5) * 120;
      const cz = (Math.random() - 0.5) * 120;
      const cy = -30 - Math.random() * 40;
      cMesh.position.set(cx, cy, cz);
      scene.add(cMesh);
      gameStateRef.current.crystalsList.push({ mesh: cMesh, x: cx, y: cy, z: cz, collected: false });
    }

    // Spawn Kraken Tentacles
    const tentacleGeo = new THREE.CylinderGeometry(1.0, 2.5, 20, 8);
    const tentacleMat = new THREE.MeshLambertMaterial({ color: 0x660033 });
    for (let i = 0; i < 6; i++) {
      const tMesh = new THREE.Mesh(tentacleGeo, tentacleMat);
      const tx = Math.sin(i * 1.0) * 35;
      const tz = Math.cos(i * 1.0) * 35;
      tMesh.position.set(tx, -65, tz);
      scene.add(tMesh);
      gameStateRef.current.krakenTentacles.push({ mesh: tMesh, x: tx, y: -65, z: tz, hp: 60 });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === 'r' || k === 'q') gameStateRef.current.keys.up = true;
      if (k === 'f' || k === 'e') gameStateRef.current.keys.down = true;
      if (k === ' ' || k === 'j') fireTorpedo(scene);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameStateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') gameStateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
      if (k === 'r' || k === 'q') gameStateRef.current.keys.up = false;
      if (k === 'f' || k === 'e') gameStateRef.current.keys.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();
      const s = gameStateRef.current;

      prop.rotation.z += 20 * dt;

      if (!s.isGameOver && !s.isVictory) {
        // Oxygen Depletion
        s.oxygen -= 0.8 * dt;
        setOxygen(Math.max(0, Math.round(s.oxygen)));
        if (s.oxygen <= 0) {
          s.isGameOver = true;
          setIsGameOver(true);
        }

        // Submarine Steering & Propulsion
        if (s.keys.a) s.rotY += 1.6 * dt;
        if (s.keys.d) s.rotY -= 1.6 * dt;

        const forward = (s.keys.w ? 1 : 0) - (s.keys.s ? 1 : 0);
        s.posX += Math.sin(s.rotY) * forward * 14 * dt;
        s.posZ -= Math.cos(s.rotY) * forward * 14 * dt;

        if (s.keys.up) s.posY += 8 * dt;
        if (s.keys.down) s.posY -= 8 * dt;
        s.posY = Math.max(-75, Math.min(-5, s.posY));
        setDepth(Math.round(-s.posY * 10));

        subGroup.position.set(s.posX, s.posY, s.posZ);
        subGroup.rotation.y = s.rotY;

        // Spotlight follows Submarine
        subSpot.position.set(s.posX, s.posY + 0.5, s.posZ);
        subSpot.target.position.set(
          s.posX + Math.sin(s.rotY) * 20,
          s.posY - 2,
          s.posZ - Math.cos(s.rotY) * 20
        );
        subSpot.target.updateMatrixWorld();

        // 3rd Person Follow Camera
        camera.position.set(
          s.posX - Math.sin(s.rotY) * 10,
          s.posY + 4,
          s.posZ + Math.cos(s.rotY) * 10
        );
        camera.lookAt(s.posX, s.posY, s.posZ);

        // Ancient Crystal Gathering
        s.crystalsList.forEach(c => {
          if (c.collected) return;
          c.mesh.rotation.y = time * 2;
          const dist = Math.hypot(c.x - s.posX, c.y - s.posY, c.z - s.posZ);
          if (dist < 3.0) {
            c.collected = true;
            scene.remove(c.mesh);
            s.crystals += 1;
            s.oxygen = Math.min(100, s.oxygen + 20);
            s.battery = Math.min(100, s.battery + 20);
            setCrystals(s.crystals);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

            if (s.crystals >= 10) {
              s.isVictory = true;
              setIsVictory(true);
              const reward = 65 + s.crystals * 3;
              setRewardSns(reward);
              onReward(reward);
            }
          }
        });

        // Kraken Tentacle Wave Animation & Torpedo Hit
        s.krakenTentacles.forEach((t, idx) => {
          t.mesh.rotation.z = Math.sin(time * 2 + idx) * 0.2;
          t.mesh.rotation.x = Math.cos(time * 2 + idx) * 0.2;
        });

        // Update Torpedoes
        for (let i = s.torpedoes.length - 1; i >= 0; i--) {
          const torp = s.torpedoes[i];
          torp.mesh.position.x += torp.vx * dt;
          torp.mesh.position.y += torp.vy * dt;
          torp.mesh.position.z += torp.vz * dt;
          torp.life -= dt;

          let hit = false;
          s.krakenTentacles.forEach(t => {
            if (t.hp <= 0 || hit) return;
            const dist = torp.mesh.position.distanceTo(t.mesh.position);
            if (dist < 5) {
              hit = true;
              t.hp -= 30;
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
              if (t.hp <= 0) {
                scene.remove(t.mesh);
              }
            }
          });

          if (hit || torp.life <= 0) {
            scene.remove(torp.mesh);
            s.torpedoes.splice(i, 1);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white select-none overflow-hidden flex flex-col font-sans">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Top Deep Sea HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Oxygen & Battery Stats */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-1.5">
            <Shield size={16} className="text-cyan-400" />
            <div className="w-20 sm:w-28 h-2 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${oxygen}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">{oxygen}% O2</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
            <Zap size={14} />
            <span>{battery}% BAT</span>
          </div>

          <div className="bg-emerald-950 border border-emerald-500/40 px-2 py-0.5 rounded text-emerald-300 text-xs font-bold">
            💎 {crystals}/10
          </div>

          <div className="text-sky-300 text-xs font-bold">
            DEPTH: {depth}m
          </div>
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
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

            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
              moved = true;
              gameStateRef.current.keys.w = dy < -10;
              gameStateRef.current.keys.s = dy > 10;
              gameStateRef.current.keys.a = dx < -10;
              gameStateRef.current.keys.d = dx > 10;
            }
          };

          const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
            gameStateRef.current.keys.w = false;
            gameStateRef.current.keys.s = false;
            gameStateRef.current.keys.a = false;
            gameStateRef.current.keys.d = false;

            if (!moved) {
              // Tap: Fire Torpedo
              const scene = (mountRef.current?.children[0] as any)?.__r3f?.scene;
              if (scene) fireTorpedo(scene);
            }
          };

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
          window.addEventListener('pointercancel', onUp);
        }}
      />

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-cyan-500/30 rounded-full text-[10px] text-cyan-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 잠수함 조종 | 탭: 어뢰 발사 (버튼 없음)' : 'Drag: Steer Submarine | Tap: Fire Torpedo (No Buttons)'}
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '아틀란티스 탐사 성공! VICTORY' : '산소 고갈! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '고대 아틀란티스의 에테르 크리스탈을 모두 수집하고 무사히 복귀했습니다!'
                : '잠수정의 산소가 고갈되어 비상 탈출했습니다.'}
            </p>

            {isVictory && (
              <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-2xl">
                <span className="text-xs text-slate-400 block uppercase font-bold">REWARD</span>
                <span className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
                  <Sparkles size={20} /> +{rewardSns} SNS
                </span>
              </div>
            )}

            <button
              onClick={onExit}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              {language === 'ko' ? '확인 및 나가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
