import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Target, Zap } from 'lucide-react';
import { CardData } from '../types';

interface VoxelBilliardsTrickGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface BilliardBall {
  mesh: THREE.Mesh;
  num: number;
  color: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  isPocketed: boolean;
}

export const VoxelBilliardsTrickGame: React.FC<VoxelBilliardsTrickGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [pocketedCount, setPocketedCount] = useState<number>(0);
  const totalBalls = 7;
  const [power, setPower] = useState<number>(50);
  const [shots, setShots] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    cueAngle: 0,
    cuePower: 50,
    balls: [] as BilliardBall[],
    cueBall: null as BilliardBall | null,
    isShooting: false,
    pocketed: 0,
    shots: 0,
    isGameOver: false
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e141b);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 8.5, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x223344, 0.9);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xffffff, 2.8);
    spotLight.position.set(0, 8, 0);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.3;
    scene.add(spotLight);

    // Billiard Pool Table
    const tableClothGeo = new THREE.BoxGeometry(6, 0.2, 10);
    const tableClothMat = new THREE.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.8 });
    const tableCloth = new THREE.Mesh(tableClothGeo, tableClothMat);
    tableCloth.position.y = 0;
    scene.add(tableCloth);

    // Rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5c3317 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 10.4), railMat);
    railL.position.set(-3.2, 0.2, 0);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 10.4), railMat);
    railR.position.set(3.2, 0.2, 0);
    const railT = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.4, 0.4), railMat);
    railT.position.set(0, 0.2, -5.2);
    const railB = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.4, 0.4), railMat);
    railB.position.set(0, 0.2, 5.2);
    scene.add(railL, railR, railT, railB);

    // Pockets (6 pockets)
    const pocketGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const pocketMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
    const pocketCoords = [
      [-2.8, -4.8], [2.8, -4.8],
      [-2.9, 0], [2.9, 0],
      [-2.8, 4.8], [2.8, 4.8]
    ];
    pocketCoords.forEach(([px, pz]) => {
      const pocket = new THREE.Mesh(pocketGeo, pocketMat);
      pocket.position.set(px, 0.12, pz);
      scene.add(pocket);
    });

    // Cue Stick
    const cueGeo = new THREE.CylinderGeometry(0.04, 0.08, 4, 8);
    const cueMat = new THREE.MeshStandardMaterial({ color: 0xcc9966 });
    const cueMesh = new THREE.Mesh(cueGeo, cueMat);
    cueMesh.rotation.x = Math.PI / 2;
    cueMesh.position.set(0, 0.3, 3);
    scene.add(cueMesh);

    // Spawn Cue Ball and Object Balls
    const balls: BilliardBall[] = [];
    const ballRadius = 0.22;
    const sphereGeo = new THREE.SphereGeometry(ballRadius, 16, 16);

    // White Cue Ball
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const cueBallMesh = new THREE.Mesh(sphereGeo, whiteMat);
    cueBallMesh.position.set(0, 0.3, 2.5);
    scene.add(cueBallMesh);
    const cueBallObj: BilliardBall = {
      mesh: cueBallMesh,
      num: 0,
      color: 0xffffff,
      pos: cueBallMesh.position,
      vel: new THREE.Vector3(0, 0, 0),
      isPocketed: false
    };
    balls.push(cueBallObj);
    stateRef.current.cueBall = cueBallObj;

    // 7 Colored Target Balls in Triangle Rack
    const ballColors = [0xffcc00, 0x0066cc, 0xcc0000, 0x660099, 0xff6600, 0x009933, 0x111111];
    let bIdx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c <= r; c++) {
        if (bIdx >= totalBalls) break;
        const bMat = new THREE.MeshStandardMaterial({ color: ballColors[bIdx], roughness: 0.2 });
        const bMesh = new THREE.Mesh(sphereGeo, bMat);
        const x = (c - r * 0.5) * 0.48;
        const z = -2.0 - r * 0.44;
        bMesh.position.set(x, 0.3, z);
        scene.add(bMesh);
        balls.push({
          mesh: bMesh,
          num: bIdx + 1,
          color: ballColors[bIdx],
          pos: bMesh.position,
          vel: new THREE.Vector3(0, 0, 0),
          isPocketed: false
        });
        bIdx++;
      }
    }

    stateRef.current.balls = balls;

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!stateRef.current.isGameOver) {
        // Update Ball Physics & Pocket Collisions
        let anyMoving = false;

        balls.forEach((ball) => {
          if (ball.isPocketed) return;

          // Apply velocity
          if (ball.vel.length() > 0.005) {
            anyMoving = true;
            ball.pos.add(ball.vel);
            ball.vel.multiplyScalar(0.98); // Table friction

            // Table bounds bounce
            if (ball.pos.x < -2.7 || ball.pos.x > 2.7) {
              ball.vel.x *= -0.8;
              ball.pos.x = Math.max(-2.7, Math.min(2.7, ball.pos.x));
            }
            if (ball.pos.z < -4.7 || ball.pos.z > 4.7) {
              ball.vel.z *= -0.8;
              ball.pos.z = Math.max(-4.7, Math.min(4.7, ball.pos.z));
            }

            // Check pockets
            pocketCoords.forEach(([px, pz]) => {
              if (Math.hypot(ball.pos.x - px, ball.pos.z - pz) < 0.45) {
                ball.isPocketed = true;
                scene.remove(ball.mesh);
                if (ball.num !== 0) {
                  stateRef.current.pocketed += 1;
                  setPocketedCount(stateRef.current.pocketed);
                  playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

                  if (stateRef.current.pocketed >= totalBalls) {
                    stateRef.current.isGameOver = true;
                    setIsGameOver(true);
                    const r = 260;
                    setRewardSns(r);
                    onReward(r);
                  }
                } else {
                  // White ball scratched: respawn at center
                  setTimeout(() => {
                    ball.isPocketed = false;
                    ball.pos.set(0, 0.3, 2.5);
                    ball.vel.set(0, 0, 0);
                    scene.add(ball.mesh);
                  }, 800);
                }
              }
            });
          } else {
            ball.vel.set(0, 0, 0);
          }
        });

        // Ball vs Ball Collisions
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            if (b1.isPocketed || b2.isPocketed) continue;

            const dist = b1.pos.distanceTo(b2.pos);
            if (dist < ballRadius * 2) {
              // Elastic collision
              const normal = new THREE.Vector3().subVectors(b2.pos, b1.pos).normalize();
              const relVel = new THREE.Vector3().subVectors(b1.vel, b2.vel);
              const speed = relVel.dot(normal);

              if (speed > 0) {
                b1.vel.sub(normal.clone().multiplyScalar(speed));
                b2.vel.add(normal.clone().multiplyScalar(speed));
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }
            }
          }
        }

        // Cue Stick positioning when balls stopped
        if (!anyMoving && stateRef.current.cueBall && !stateRef.current.cueBall.isPocketed) {
          cueMesh.visible = true;
          const cb = stateRef.current.cueBall.pos;
          const distOffset = 2.4 + (stateRef.current.cuePower / 100) * 0.6;
          const cx = cb.x + Math.sin(stateRef.current.cueAngle) * distOffset;
          const cz = cb.z + Math.cos(stateRef.current.cueAngle) * distOffset;
          cueMesh.position.set(cx, 0.35, cz);
          cueMesh.rotation.y = -stateRef.current.cueAngle;
        } else {
          cueMesh.visible = false;
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
  }, [lowSpecMode, onReward, playSfx]);

  const handleRotateCue = (delta: number) => {
    stateRef.current.cueAngle += delta;
  };

  const handleShoot = () => {
    if (!stateRef.current.cueBall || stateRef.current.cueBall.isPocketed || stateRef.current.isGameOver) return;

    const angle = stateRef.current.cueAngle;
    const p = stateRef.current.cuePower / 100;
    const force = 0.25 + p * 0.45;

    stateRef.current.cueBall.vel.set(
      -Math.sin(angle) * force,
      0,
      -Math.cos(angle) * force
    );

    stateRef.current.shots += 1;
    setShots(stateRef.current.shots);
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

        <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-sm">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs text-emerald-300 font-bold">
            {isKo ? `포켓: ${pocketedCount}/${totalBalls}구` : `POCKETED: ${pocketedCount}/${totalBalls}`}
          </span>
          <span className="text-[10px] text-slate-400">
            [{shots} SHOTS]
          </span>
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

            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
              moved = true;
              // Horizontal drag: rotate cue angle
              stateRef.current.cueAngle += dx * 0.003;
              // Vertical drag: adjust power
              const newPow = Math.max(20, Math.min(100, stateRef.current.cuePower - dy * 0.2));
              stateRef.current.cuePower = newPow;
              setPower(Math.round(newPow));
            }
          };

          const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);

            if (!moved) {
              // Tap: Shoot
              handleShoot();
            }
          };

          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
          window.addEventListener('pointercancel', onUp);
        }}
      />

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-slate-900/80 border border-emerald-500/40 rounded-full text-[10px] text-emerald-300 font-mono backdrop-blur-xs">
          {isKo ? '좌우 드래그: 조준 | 상하: 파워 조절 | 탭: 샷 스트로크 (버튼 없음)' : 'Drag L/R: Aim | Drag U/D: Power | Tap: Strike (No Buttons)'}
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
              {isKo ? '🏆 당구 테이블 완클리어!' : '🏆 TABLE CLEARED!'}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '포켓 성공 구수' : 'Pocketed Balls'}</span>
                <span className="font-bold text-amber-300">{pocketedCount} / {totalBalls}</span>
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
