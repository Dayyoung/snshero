import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiKickTheBuddyGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;
}

type WeaponType = 'glove' | 'dart' | 'bomb' | 'zap';

interface WeaponConfig {
  type: WeaponType;
  name: string;
  emoji: string;
  color: string;
  reward: number;
}

const WEAPONS: WeaponConfig[] = [
  { type: 'glove', name: 'GLOVE', emoji: '🥊', color: 'border-red-500', reward: 15 },
  { type: 'dart', name: 'DART', emoji: '🎯', color: 'border-cyan-500', reward: 25 },
  { type: 'bomb', name: 'BOMB', emoji: '💣', color: 'border-amber-500', reward: 50 },
  { type: 'zap', name: 'TESLA', emoji: '⚡', color: 'border-purple-500', reward: 40 },
];

export const PokiKickTheBuddyGame: React.FC<PokiKickTheBuddyGameProps> = ({
  onBack,
  onExit,
  cardId = 46,
  lowSpecMode = false,
  playSfx
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [cash, setCash] = useState(0); // 0 ~ $1,500
  const [targetCash] = useState(1500);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>('glove');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // 3D 씬 레퍼런스
  const gameLoopRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animId: 0,
    isGameOver: false,
    isGameWon: false,
    cashVal: 0,
    scoreVal: 0,
    activeWeapon: 'glove' as WeaponType,

    // 버디 래그돌 모델 & 물리
    buddy: {
      group: null as THREE.Group | null,
      head: null as THREE.Mesh | null,
      body: null as THREE.Mesh | null,
      pos: new THREE.Vector3(0, 0.5, 0),
      vel: new THREE.Vector3(0, 0, 0),
      rot: new THREE.Vector3(0, 0, 0),
      rotVel: new THREE.Vector3(0, 0, 0),
      isDragging: false,
    },

    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    roomBounds: { minX: -5.4, maxX: 5.4, minY: -2.8, maxY: 4.8, minZ: -3.8, maxZ: 3.8 },
  });

  const handleExit = onExit || onBack;

  // 영웅 카드 배지 렌더링
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawCardSprite(ctx, cardId, 0, 0, 40, 40);
      }
    }
  }, [cardId]);

  // 햅틱 진동 피드백
  const triggerHaptic = useCallback((pattern: number | number[] = 25) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore
      }
    }
  }, []);

  // 보상 정산
  const handleClaimReward = useCallback((isVictory: boolean, currentScore: number) => {
    const finalScore = Math.max(20, Math.floor(currentScore));
    const result = calculateAndDepositMissionReward({
      gameId: 'poki_kick_the_buddy',
      gameTitle: 'Kick The Buddy 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: 30,
    });
    setRewardResult(result);
  }, []);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd4a373); // 골판지 색상 배경
    scene.fog = new THREE.FogExp2(0xd4a373, 0.02);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 11.5);
    camera.lookAt(0, 0.6, 0);
    gameLoopRef.current.camera = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !lowSpecMode,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    gameLoopRef.current.renderer = renderer;

    // 3. 골판지 룸 조명
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.9);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 2.5, 30, Math.PI / 3, 0.3);
    spotLight.position.set(0, 8, 8);
    spotLight.castShadow = !lowSpecMode;
    scene.add(spotLight);

    // 4. 골판지 박스 룸 (폭 12m x 높이 9m x 깊이 10m)
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xba8c59,
      roughness: 0.8,
      metalness: 0.05,
    });

    // 바닥
    const floorGeo = new THREE.BoxGeometry(12, 0.4, 10);
    const floor = new THREE.Mesh(floorGeo, boxMat);
    floor.position.set(0, -3.2, 0);
    floor.receiveShadow = !lowSpecMode;
    scene.add(floor);

    // 뒷벽
    const backWallGeo = new THREE.BoxGeometry(12, 9, 0.4);
    const backWall = new THREE.Mesh(backWallGeo, boxMat);
    backWall.position.set(0, 1.3, -4.8);
    backWall.receiveShadow = !lowSpecMode;
    scene.add(backWall);

    // 좌/우 벽
    const sideWallGeo = new THREE.BoxGeometry(0.4, 9, 10);
    const leftWall = new THREE.Mesh(sideWallGeo, boxMat);
    leftWall.position.set(-6.0, 1.3, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, boxMat);
    rightWall.position.set(6.0, 1.3, 0);
    scene.add(rightWall);

    // 골판지 솔기 라인
    const seamGeo = new THREE.BoxGeometry(11.8, 0.1, 0.1);
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x8c5e34 });
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.position.set(0, -3.0, -4.6);
    scene.add(seam);

    // 5. 3D 헝겊 인형 버디 (Buddy) 모델링
    const buddyGroup = new THREE.Group();

    // 헝겊 마포 재질
    const burlapMat = new THREE.MeshStandardMaterial({
      color: 0xecd0a9,
      roughness: 0.7,
      metalness: 0.1,
    });

    // 몸통 (캡슐형)
    const bodyGeo = new THREE.CylinderGeometry(0.7, 0.75, 1.6, 16);
    const bodyMesh = new THREE.Mesh(bodyGeo, burlapMat);
    bodyMesh.position.y = 0.8;
    bodyMesh.castShadow = !lowSpecMode;
    buddyGroup.add(bodyMesh);

    // 단추 2개 (몸통 전면)
    const btnGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.4 });

    const btn1 = new THREE.Mesh(btnGeo, btnMat);
    btn1.rotation.x = Math.PI / 2;
    btn1.position.set(0, 1.1, 0.76);
    buddyGroup.add(btn1);

    const btn2 = new THREE.Mesh(btnGeo, btnMat);
    btn2.rotation.x = Math.PI / 2;
    btn2.position.set(0, 0.6, 0.76);
    buddyGroup.add(btn2);

    // 머리 (구체)
    const headGeo = new THREE.SphereGeometry(0.75, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, burlapMat);
    headMesh.position.y = 2.2;
    headMesh.castShadow = !lowSpecMode;
    buddyGroup.add(headMesh);

    // 단추 눈 (블랙 / X 스티치)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1f1a17 });
    const eyeL = new THREE.Mesh(btnGeo, eyeMat);
    eyeL.rotation.x = Math.PI / 2;
    eyeL.position.set(-0.28, 2.3, 0.72);
    buddyGroup.add(eyeL);

    const eyeR = new THREE.Mesh(btnGeo, eyeMat);
    eyeR.rotation.x = Math.PI / 2;
    eyeR.position.set(0.28, 2.3, 0.72);
    buddyGroup.add(eyeR);

    // 입술 (스티치 레드 라인)
    const mouthGeo = new THREE.BoxGeometry(0.4, 0.08, 0.06);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xdd2222 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 1.95, 0.74);
    buddyGroup.add(mouth);

    // 팔 2개
    const armGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.1, 12);
    const armL = new THREE.Mesh(armGeo, burlapMat);
    armL.position.set(-0.95, 0.9, 0);
    armL.rotation.z = Math.PI / 5;
    buddyGroup.add(armL);

    const armR = new THREE.Mesh(armGeo, burlapMat);
    armR.position.set(0.95, 0.9, 0);
    armR.rotation.z = -Math.PI / 5;
    buddyGroup.add(armR);

    // 다리 2개
    const legGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.1, 12);
    const legL = new THREE.Mesh(legGeo, burlapMat);
    legL.position.set(-0.4, -0.4, 0);
    buddyGroup.add(legL);

    const legR = new THREE.Mesh(legGeo, burlapMat);
    legR.position.set(0.4, -0.4, 0);
    buddyGroup.add(legR);

    buddyGroup.position.set(0, 0.5, 0);
    scene.add(buddyGroup);
    gameLoopRef.current.buddy.group = buddyGroup;
    gameLoopRef.current.buddy.head = headMesh;
    gameLoopRef.current.buddy.body = bodyMesh;

    // 6. 리사이즈 핸들러
    const handleResize = () => {
      if (!container || !gameLoopRef.current.renderer || !gameLoopRef.current.camera) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      gameLoopRef.current.camera.aspect = w / h;
      gameLoopRef.current.camera.updateProjectionMatrix();
      gameLoopRef.current.renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 7. 메인 루프
    let lastTime = performance.now();

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const gl = gameLoopRef.current;
      const b = gl.buddy;

      if (!gl.isGameOver && !gl.isGameWon) {
        // --- 래그돌 물리 업데이트 ---
        if (!b.isDragging) {
          // 중력 적용
          b.vel.y -= 22.0 * dt;

          // 공기 저항 & 중앙 복귀 탄성력
          b.vel.x += (0 - b.pos.x) * 2.5 * dt;
          b.vel.z += (0 - b.pos.z) * 2.5 * dt;

          b.vel.x *= 0.96;
          b.vel.z *= 0.96;

          b.pos.addScaledVector(b.vel, dt);

          // 회전 속도 적용
          b.rot.addScaledVector(b.rotVel, dt);
          b.rotVel.multiplyScalar(0.95);
          b.rot.x += (0 - b.rot.x) * 3.0 * dt;
          b.rot.z += (0 - b.rot.z) * 3.0 * dt;

          // 박스 룸 벽면 충돌 및 바운스
          const bounds = gl.roomBounds;
          const bounce = 0.65;

          // 바닥
          if (b.pos.y < bounds.minY) {
            b.pos.y = bounds.minY;
            b.vel.y = Math.abs(b.vel.y) * bounce;
            b.rotVel.z += (Math.random() - 0.5) * 6.0;
          }
          // 천장
          if (b.pos.y > bounds.maxY) {
            b.pos.y = bounds.maxY;
            b.vel.y = -Math.abs(b.vel.y) * bounce;
          }
          // 좌우 벽
          if (b.pos.x < bounds.minX) {
            b.pos.x = bounds.minX;
            b.vel.x = Math.abs(b.vel.x) * bounce;
            triggerHaptic(15);
          } else if (b.pos.x > bounds.maxX) {
            b.pos.x = bounds.maxX;
            b.vel.x = -Math.abs(b.vel.x) * bounce;
            triggerHaptic(15);
          }
        }

        // 메쉬 위치 & 회전 반영
        if (b.group) {
          b.group.position.copy(b.pos);
          b.group.rotation.set(b.rot.x, b.rot.y, b.rot.z);
        }

        // --- 파티클(골드 코인 & 스파크) 업데이트 ---
        for (let i = gl.particles.length - 1; i >= 0; i--) {
          const pt = gl.particles[i];
          pt.life -= dt;
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.vel.y -= 14 * dt;
          pt.mesh.rotation.y += 6 * dt;

          if (pt.life <= 0) {
            scene.remove(pt.mesh);
            gl.particles.splice(i, 1);
          }
        }
      }

      if (gl.renderer && gl.scene && gl.camera) {
        gl.renderer.render(gl.scene, gl.camera);
      }
    };

    gameLoopRef.current.animId = requestAnimationFrame(animate);

    // 클린업
    return () => {
      cancelAnimationFrame(gameLoopRef.current.animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, handleClaimReward, triggerHaptic]);

  // 골드 코인 파티클 분출 헬퍼
  const spawnCoinParticles = (pos: THREE.Vector3, count = 6) => {
    const gl = gameLoopRef.current;
    if (!gl.scene) return;

    for (let i = 0; i < count; i++) {
      const cGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        roughness: 0.2,
        metalness: 0.9,
      });
      const coin = new THREE.Mesh(cGeo, cMat);
      coin.position.copy(pos);
      gl.scene.add(coin);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        3 + Math.random() * 6,
        (Math.random() - 0.5) * 6
      );
      gl.particles.push({ mesh: coin, vel, life: 0.7 });
    }
  };

  // 무기 공격 실행
  const executeAttack = useCallback(
    (weapon: WeaponType) => {
      const gl = gameLoopRef.current;
      const b = gl.buddy;
      if (gl.isGameOver || gl.isGameWon) return;

      const weaponCfg = WEAPONS.find((w) => w.type === weapon) || WEAPONS[0];

      if (weapon === 'glove') {
        // 권투 글러브 강력한 어퍼컷 펀치
        b.vel.set((Math.random() - 0.5) * 12, 14, (Math.random() - 0.5) * 8);
        b.rotVel.set((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10);
        triggerHaptic([35, 45]);
        if (playSfx) playSfx('hit');
      } else if (weapon === 'dart') {
        // 다트 타격
        b.vel.y += 6.0;
        b.rotVel.z += (Math.random() - 0.5) * 8;
        triggerHaptic(20);
        if (playSfx) playSfx('dash');
      } else if (weapon === 'bomb') {
        // 다이너마이트 폭발
        b.vel.set((Math.random() - 0.5) * 18, 18, (Math.random() - 0.5) * 12);
        b.rotVel.set(12, 15, 8);
        triggerHaptic([60, 80, 120]);
        if (playSfx) playSfx('explosion');
      } else {
        // 테슬라 번개 감전
        b.vel.set((Math.random() - 0.5) * 8, 8, (Math.random() - 0.5) * 6);
        b.rotVel.y += 18;
        triggerHaptic([30, 30, 40]);
        if (playSfx) playSfx('powerup');
      }

      spawnCoinParticles(new THREE.Vector3(b.pos.x, b.pos.y + 1.2, b.pos.z), 8);

      // 코인 & 점수 획득
      const newCash = gl.cashVal + weaponCfg.reward;
      gl.cashVal = newCash;
      setCash(newCash);

      const newScore = gl.scoreVal + weaponCfg.reward;
      gl.scoreVal = newScore;
      setScore(newScore);

      // $1,500 달성 시 승리!
      if (newCash >= 1500 && !gl.isGameWon) {
        gl.isGameWon = true;
        setGameWon(true);
        triggerHaptic([50, 100, 150, 250]);
        handleClaimReward(true, 100);
      }
    },
    [handleClaimReward, playSfx, triggerHaptic]
  );

  // 화면 터치 드래그 (버디 직접 잡고 패대기치기)
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    gameLoopRef.current.buddy.isDragging = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const dx = (touch.clientX - dragStartRef.current.x) * 0.022;
    const dy = -(touch.clientY - dragStartRef.current.y) * 0.022;

    const b = gameLoopRef.current.buddy;
    b.pos.x += dx;
    b.pos.y += dy;
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    const b = gameLoopRef.current.buddy;
    if (b.isDragging) {
      b.isDragging = false;
      // 던지기 속도 부여 & 무기 자동 타격
      executeAttack(selectedWeapon);
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-amber-950 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D 렌더러 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 HUD */}
      <MinimalistMissionHUD
        gameTitle="Kick The Buddy 3D"
        score={score}
        targetScore={100}
        onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 상단 코인 & 샌드박스 대시보드 */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* 누적 획득 코인 게이지 */}
        <div className="bg-slate-900/90 border border-amber-500/50 p-2.5 rounded-sm backdrop-blur-sm min-w-[180px]">
          <div className="flex justify-between items-center text-xs font-bold text-amber-400 mb-1">
            <span>BUDDY LOOT</span>
            <span className="text-yellow-300 font-black">${cash} / ${targetCash}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150"
              style={{ width: `${Math.min(100, (cash / targetCash) * 100)}%` }}
            />
          </div>
        </div>

        {/* 영웅 배지 */}
        <div className="w-12 h-14 bg-slate-900/90 border border-amber-500/40 rounded-sm overflow-hidden flex flex-col items-center justify-center p-0.5">
          <canvas ref={heroCanvasRef} width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-[9px] text-amber-300 font-black leading-none mt-0.5">No.{cardId}</span>
        </div>
      </div>

      {/* 하단 무기 선택기 & 대형 공격 버튼 */}
      <div className="absolute bottom-6 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
        {/* 4대 무기 셀렉터 탭 */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 p-1.5 rounded-sm backdrop-blur-sm">
          {WEAPONS.map((w) => {
            const isSelected = selectedWeapon === w.type;
            return (
              <button
                key={w.type}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWeapon(w.type);
                  triggerHaptic(15);
                }}
                className={`w-13 h-13 rounded-sm flex flex-col items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black border-white shadow-lg scale-105'
                    : 'bg-slate-800 text-slate-300 border-slate-600 active:bg-slate-700'
                }`}
              >
                <span className="text-xl leading-none">{w.emoji}</span>
                <span className="text-[9px] mt-0.5 font-bold">{w.name}</span>
              </button>
            );
          })}
        </div>

        {/* 대형 연속 타격 버튼 (76px) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            executeAttack(selectedWeapon);
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 active:from-red-400 active:to-amber-300 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-white/80 shadow-2xl active:scale-95 transition-transform"
        >
          <span className="text-2xl">💥</span>
          <span>ATTACK</span>
        </button>
      </div>

      {/* 중도 포기 확인 모달 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">샌드박스를 종료할까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              현재까지 모은 코인과 타격 실적에 비례한 SNS 포인트가 정산됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmQuit(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-sm border border-slate-600"
              >
                계속하기
              </button>
              <button
                onClick={() => {
                  setShowConfirmQuit(false);
                  handleClaimReward(false, score);
                  handleExit();
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-sm"
              >
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="Kick The Buddy 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '$1,500 코인 수집 마스터',
              desc: '골판지 룸에서 헝겊 인형 버디를 신나게 타격하여 $1,500 코인을 모으세요!',
            },
            {
              iconType: 'GESTURES',
              title: '직접 잡고 던지기 & 4대 무기',
              desc: '화면 터치 드래그로 버디를 벽면에 패대기치거나 하단 4대 무기(권투/다트/폭탄/테슬라)를 골라 공격하세요.',
            },
            {
              iconType: 'REWARDS',
              title: '스트레스 해소 SNS 보상',
              desc: '$1,500 달성 시 최대 50 SNS 포인트를 영구 획득합니다.',
            },
          ]}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* 승리 및 정산 모달 */}
      {(gameWon || gameOver) && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          isVictory={gameWon}
          score={score}
          reward={rewardResult}
          onConfirm={handleExit}
        />
      )}
    </div>
  );
};
