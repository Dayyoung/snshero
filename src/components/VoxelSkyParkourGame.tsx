import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Volume2, VolumeX, Trophy, RotateCcw, Footprints, Sparkles, Timer } from 'lucide-react';
import { CardData, Language } from '../types';

interface VoxelSkyParkourGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface PlatformData {
  id: number;
  mesh: THREE.Mesh;
  type: 'normal' | 'slime' | 'ice' | 'checkpoint' | 'goal';
  pos: THREE.Vector3;
  size: THREE.Vector3;
}

export const VoxelSkyParkourGame: React.FC<VoxelSkyParkourGameProps> = ({
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [stageProgress, setStageProgress] = useState(0);
  const [totalPlatforms] = useState(25);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [fallsCount, setFallsCount] = useState(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const platformsRef = useRef<PlatformData[]>([]);
  const lastCheckpointPosRef = useRef(new THREE.Vector3(0, 1.5, 0));

  // Player Physics State
  const playerPosRef = useRef(new THREE.Vector3(0, 1.5, 0));
  const playerVelRef = useRef(new THREE.Vector3(0, 0, 0));
  const isGroundedRef = useRef(true);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const animFrameRef = useRef<number | null>(null);

  const triggerSound = useCallback((type: 'jump' | 'bounce' | 'checkpoint' | 'win' | 'fall') => {
    if (isMuted) return;
    if (type === 'jump') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    else if (type === 'bounce') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    else if (type === 'checkpoint') playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    else if (type === 'win') playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    else if (type === 'fall') playSfx?.('https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3');
  }, [isMuted, playSfx]);

  // Setup 3D Parkour Sky World
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#38bdf8'); // Sky blue
    scene.fog = new THREE.Fog('#38bdf8', 30, 80);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    camera.position.set(0, 5, 8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // 5. Generate 25 Sky Parkour Platforms
    const platforms: PlatformData[] = [];
    let curX = 0;
    let curY = 0;
    let curZ = 0;

    const materials = {
      normal: new THREE.MeshLambertMaterial({ color: 0x10b981 }), // Green
      slime: new THREE.MeshLambertMaterial({ color: 0x84cc16 }),  // Slime green
      ice: new THREE.MeshLambertMaterial({ color: 0xe0f2fe }),    // Ice
      checkpoint: new THREE.MeshLambertMaterial({ color: 0xf59e0b }), // Gold
      goal: new THREE.MeshLambertMaterial({ color: 0xa855f7 }),   // Purple
    };

    for (let i = 0; i < totalPlatforms; i++) {
      let type: PlatformData['type'] = 'normal';
      if (i === 0) {
        // Start platform
        curX = 0; curY = 0; curZ = 0;
      } else if (i === totalPlatforms - 1) {
        type = 'goal';
        curZ -= 4.5;
        curY += 0.8;
      } else if (i % 8 === 0) {
        type = 'checkpoint';
        curZ -= 4.5;
        curY += 0.5;
      } else if (i % 4 === 0) {
        type = 'slime';
        curZ -= 5;
        curY += 1.2;
        curX += (Math.random() - 0.5) * 3;
      } else if (i % 3 === 0) {
        type = 'ice';
        curZ -= 4;
        curY += (Math.random() - 0.3) * 1.5;
        curX += (Math.random() - 0.5) * 3.5;
      } else {
        curZ -= 3.8;
        curY += (Math.random() - 0.2) * 1;
        curX += (Math.random() - 0.5) * 3;
      }

      const size = type === 'checkpoint' || i === 0 || type === 'goal'
        ? new THREE.Vector3(3.5, 0.8, 3.5)
        : new THREE.Vector3(2, 0.6, 2);

      const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
      const mesh = new THREE.Mesh(geo, materials[type]);
      mesh.position.set(curX, curY, curZ);
      scene.add(mesh);

      platforms.push({
        id: i,
        mesh,
        type,
        pos: new THREE.Vector3(curX, curY, curZ),
        size,
      });
    }
    platformsRef.current = platforms;

    // 6. Player Voxel Avatar (3D Box)
    const playerGeo = new THREE.BoxGeometry(0.7, 1.2, 0.7);
    const playerMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
    const playerMesh = new THREE.Mesh(playerGeo, playerMat);
    playerMesh.position.copy(playerPosRef.current);
    scene.add(playerMesh);

    // 7. Keyboard
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 8. Animation & Physics Loop
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!gameOver) {
        // Player Input
        const speed = 6;
        let moveX = 0;
        let moveZ = 0;
        if (keysRef.current['KeyW'] || keysRef.current['ArrowUp']) moveZ -= 1;
        if (keysRef.current['KeyS'] || keysRef.current['ArrowDown']) moveZ += 1;
        if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) moveX -= 1;
        if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) moveX += 1;

        if (keysRef.current['Space'] && isGroundedRef.current) {
          playerVelRef.current.y = 7.5;
          isGroundedRef.current = false;
          triggerSound('jump');
        }

        // Apply Horizontal Velocity
        playerPosRef.current.x += moveX * speed * dt;
        playerPosRef.current.z += moveZ * speed * dt;

        // Apply Gravity
        playerVelRef.current.y -= 18 * dt;
        playerPosRef.current.y += playerVelRef.current.y * dt;

        // Platform Collision Detection
        let grounded = false;
        platformsRef.current.forEach((p) => {
          const minX = p.pos.x - p.size.x / 2 - 0.35;
          const maxX = p.pos.x + p.size.x / 2 + 0.35;
          const minZ = p.pos.z - p.size.z / 2 - 0.35;
          const maxZ = p.pos.z + p.size.z / 2 + 0.35;
          const topY = p.pos.y + p.size.y / 2 + 0.6;

          if (
            playerPosRef.current.x >= minX &&
            playerPosRef.current.x <= maxX &&
            playerPosRef.current.z >= minZ &&
            playerPosRef.current.z <= maxZ &&
            playerPosRef.current.y <= topY &&
            playerPosRef.current.y >= topY - 0.8 &&
            playerVelRef.current.y <= 0
          ) {
            playerPosRef.current.y = topY;
            grounded = true;

            // Check Special Blocks
            if (p.type === 'slime') {
              playerVelRef.current.y = 12; // High bounce
              grounded = false;
              triggerSound('bounce');
            } else if (p.type === 'checkpoint') {
              lastCheckpointPosRef.current.set(p.pos.x, topY, p.pos.z);
              setStageProgress(Math.max(stageProgress, p.id));
            } else if (p.type === 'goal') {
              setGameOver(true);
              setIsVictory(true);
              const reward = 50;
              onReward(reward);
              triggerSound('win');
            } else {
              playerVelRef.current.y = 0;
            }

            setStageProgress(Math.max(stageProgress, p.id));
          }
        });

        isGroundedRef.current = grounded;

        // Fall Off Detection
        if (playerPosRef.current.y < -15) {
          // Respawn at last checkpoint
          playerPosRef.current.copy(lastCheckpointPosRef.current);
          playerVelRef.current.set(0, 0, 0);
          setFallsCount((f) => f + 1);
          triggerSound('fall');
        }

        // Update 3D Model & Camera
        playerMesh.position.copy(playerPosRef.current);
        camera.position.set(
          playerPosRef.current.x,
          playerPosRef.current.y + 3.5,
          playerPosRef.current.z + 6
        );
        camera.lookAt(playerPosRef.current.x, playerPosRef.current.y + 0.5, playerPosRef.current.z - 5);
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [lowSpecMode, totalPlatforms, triggerSound, gameOver, onReward, stageProgress]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  // Mobile Jump Button
  const handleJump = () => {
    if (isGroundedRef.current && !gameOver) {
      playerVelRef.current.y = 7.5;
      isGroundedRef.current = false;
      triggerSound('jump');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono select-none overflow-hidden h-[100dvh]">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center border border-[rgba(15,0,0,0.12)] rounded-sm bg-white hover:bg-neutral-100 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider">
              {language === 'ko' ? '[3D 복셀 스카이 파쿠르]' : '[3D VOXEL SKY PARKOUR]'}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-neutral-500">
              <span className="flex items-center gap-1"><Timer size={10} /> {elapsedTime}s</span>
              <span>•</span>
              <span>진행도: {stageProgress + 1} / {totalPlatforms}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center border border-[rgba(15,0,0,0.12)] rounded-sm bg-white hover:bg-neutral-100 cursor-pointer"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </header>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full relative overflow-hidden">
        {/* Top Progress HUD */}
        <div className="absolute top-3 left-3 p-2 bg-[#fdfcfc]/90 border border-[rgba(15,0,0,0.12)] rounded-sm text-xs pointer-events-none">
          <div className="font-bold text-sky-600">진행도: {Math.round(((stageProgress + 1) / totalPlatforms) * 100)}%</div>
          <div className="text-[10px] text-neutral-500">추락 횟수: {fallsCount}회</div>
        </div>

      {/* Screen Gesture Touch Overlay */}
      {!gameOver && (
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
                keysRef.current['KeyW'] = dy < -8;
                keysRef.current['KeyS'] = dy > 12;
                keysRef.current['KeyA'] = dx < -10;
                keysRef.current['KeyD'] = dx > 10;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              keysRef.current['KeyW'] = false;
              keysRef.current['KeyS'] = false;
              keysRef.current['KeyA'] = false;
              keysRef.current['KeyD'] = false;

              if (!moved) {
                // Tap: Jump
                handleJump();
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
        <div className="px-3 py-1 bg-[#201d1d]/85 border border-[#201d1d]/40 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 발판 이동 | 탭: 파쿠르 점프 (버튼 없음)' : 'Drag: Move | Tap: Parkour Jump (No Buttons)'}
        </div>
      </div>
      </div>

      {/* Victory Modal */}
      {gameOver && isVictory && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-6 rounded-sm shadow-xl text-center flex flex-col gap-4">
            <div className="flex justify-center">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-full border border-amber-300">
                <Trophy size={32} />
              </div>
            </div>
            <div>
              <h2 className="text-base font-black uppercase">
                {language === 'ko' ? '스카이 파쿠르 완주!' : 'PARKOUR COMPLETED!'}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {`클리어 타임: ${elapsedTime}초 (추락: ${fallsCount}회) • (+50 SNS 획득)`}
              </p>
            </div>
            <button
              onClick={onExit}
              className="min-h-[44px] py-2 bg-[#201d1d] text-white font-bold text-xs rounded-sm hover:bg-neutral-800 cursor-pointer"
            >
              {language === 'ko' ? '[로비로 나가기]' : '[EXIT TO LOBBY]'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
