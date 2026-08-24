import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPixelStrikeArenaGameProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type WeaponType = 'pistol' | 'shotgun' | 'rifle' | 'sniper';

interface WeaponInfo {
  name: string;
  damage: number;
  ammoMax: number;
  color: number;
}

const WEAPONS: Record<WeaponType, WeaponInfo> = {
  pistol: { name: '권총', damage: 25, ammoMax: 12, color: 0x94a3b8 },
  shotgun: { name: '샷건', damage: 60, ammoMax: 6, color: 0xf97316 },
  rifle: { name: '돌격소총', damage: 20, ammoMax: 30, color: 0x3b82f6 },
  sniper: { name: '스나이퍼', damage: 100, ammoMax: 5, color: 0xa855f7 },
};

export const VoxelPixelStrikeArenaGame: React.FC<VoxelPixelStrikeArenaGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_pixel_strike_arena') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('rifle');
  const [ammo, setAmmo] = useState<number>(30);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerKills, setPlayerKills] = useState<number>(0);
  const targetKills = 5;
  const [score, setScore] = useState<number>(0);
  const [matchTime, setMatchTime] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    currentWeapon: 'rifle' as WeaponType,
    ammo: 30,
    playerHp: 100,
    playerKills: 0,
    score: 0,
    matchTime: 60,
    playerYaw: 0,
    playerPitch: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    bots: [] as { group: THREE.Group; hp: number; isAlive: boolean; x: number; z: number }[],
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null
  });

  const switchNextWeapon = () => {
    const s = stateRef.current;
    const wKeys: WeaponType[] = ['pistol', 'shotgun', 'rifle', 'sniper'];
    const nextIdx = (wKeys.indexOf(s.currentWeapon) + 1) % wKeys.length;
    const nextW = wKeys[nextIdx];
    s.currentWeapon = nextW;
    s.ammo = WEAPONS[nextW].ammoMax;
    setCurrentWeapon(nextW);
    setAmmo(s.ammo);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const shoot = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused || !s.camera) return;

    if (s.ammo <= 0) {
      s.ammo = WEAPONS[s.currentWeapon].ammoMax;
      setAmmo(s.ammo);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      return;
    }

    s.ammo -= 1;
    setAmmo(s.ammo);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');

    const w = WEAPONS[s.currentWeapon];
    const camDir = new THREE.Vector3();
    s.camera.getWorldDirection(camDir);

    // Raycast hit check
    for (const b of s.bots) {
      if (b.isAlive) {
        const botDir = new THREE.Vector3(b.x, 1.4, b.z).sub(s.camera.position).normalize();
        const dot = camDir.dot(botDir);

        if (dot > 0.88) {
          b.hp -= w.damage;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (b.hp <= 0) {
            b.isAlive = false;
            s.scene?.remove(b.group);
            s.playerKills += 1;
            s.score += 300;
            setPlayerKills(s.playerKills);
            setScore(s.score);

            if (s.playerKills >= targetKills && !s.isGameOver) {
              s.isVictory = true;
              s.isGameOver = true;
              setIsGameOver(true);
              const duration = (Date.now() - s.startTime) / 1000;
              const receipt = calculateAndDepositMissionReward({
                gameId: 'voxel_pixel_strike_arena',
                gameTitle: '복셀 픽셀 스트라이크',
                durationSeconds: duration,
                score: s.score + 2500,
                difficulty: 'NIGHTMARE',
                isVictory: true
              });
              setSettlementReceipt(receipt);
              onReward(receipt.totalSns);
            }
          }
          break;
        }
      }
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x60a5fa, 1.2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Arena Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Spawn 5 Enemy Bots
    stateRef.current.bots = [];
    for (let i = 0; i < targetKills; i++) {
      const bGroup = new THREE.Group();
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.8, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 })
      );
      bMesh.position.y = 0.9;
      bGroup.add(bMesh);

      const angle = (i / targetKills) * Math.PI * 2 + 0.3;
      const dist = 14 + Math.random() * 6;
      const bx = Math.sin(angle) * dist;
      const bz = Math.cos(angle) * dist;
      bGroup.position.set(bx, 0, bz);
      scene.add(bGroup);

      stateRef.current.bots.push({
        group: bGroup,
        hp: 100,
        isAlive: true,
        x: bx,
        z: bz
      });
    }

    // Timer
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;
      s.matchTime -= 1;
      setMatchTime(s.matchTime);

      if (s.matchTime <= 0 && !s.isGameOver) {
        s.isGameOver = true;
        setIsGameOver(true);
        const duration = (Date.now() - s.startTime) / 1000;
        const receipt = calculateAndDepositMissionReward({
          gameId: 'voxel_pixel_strike_arena',
          gameTitle: '복셀 픽셀 스트라이크',
          durationSeconds: duration,
          score: s.score,
          difficulty: 'NIGHTMARE',
          isVictory: s.playerKills >= targetKills
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      }
    }, 1000);

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      camera.rotation.order = 'YXZ';
      camera.rotation.y = s.playerYaw;
      camera.rotation.x = s.playerPitch;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      clearInterval(timerInterval);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = stateRef.current;
    s.playerKills = 0;
    s.score = 0;
    s.matchTime = 60;
    s.ammo = WEAPONS[s.currentWeapon].ammoMax;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    s.bots.forEach(b => {
      b.isAlive = true;
      b.hp = 100;
      s.scene?.add(b.group);
    });
    setPlayerKills(0);
    setScore(0);
    setMatchTime(60);
    setAmmo(s.ammo);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 아레나 데스매치' : 'STEP 1: ARENA DEATHMATCH',
      title: isKo ? '적 봇 5킬 달성 승리' : 'Eliminate 5 Enemy Bots',
      description: isKo
        ? '3D 복셀 FPS 전장에서 시야를 회전 조준하고 적 봇 5명을 먼저 처치하세요.'
        : 'Aim reticle across the 3D arena and eliminate 5 enemy bots within 60s limit.',
      keyPoints: isKo
        ? [
            '적 봇 5킬 달성 시 즉시 완승',
            '헤드/몸통 직격 시 폭발적 데미지',
            '60초 타임어택 제한 시간'
          ]
        : [
            'Score 5 kills to win',
            'Deliver direct hits for high damage',
            '60s time attack challenge'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조준' : 'STEP 2: PURE GESTURES',
      title: isKo ? '드래그 조준 & 탭 사격 & 2x 무기교체' : 'Drag Aim & Tap Shoot',
      description: isKo
        ? '가상 버튼 없이 화면 드래그로 조준, 탭으로 사격, 더블탭으로 무기를 순환 교체합니다.'
        : 'Drag to aim, tap to shoot, and double-tap to switch weapon with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 드래그: 360° 시야 및 십자선 조준',
            '💥 탭: 총기 사격 (탄약 소진 시 자동 재장전)',
            '⚡ 2x 탭: 권총/샷건/소총/스나이퍼 교체'
          ]
        : [
            '👆 Drag: Smooth 360° aiming',
            '💥 Tap: Fire weapon (Auto reload on empty)',
            '⚡ Double-Tap: Switch weapon type'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '아레나 제패 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '킬 수 및 스피드 제압 가산점',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Kills and speed bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 픽셀 스트라이크' : 'Voxel Pixel Strike'}
        language={language}
        hp={{ current: playerHp, max: 100 }}
        telemetries={[
          { label: isKo ? '처치' : 'Kills', value: `${playerKills}/${targetKills}`, color: 'text-rose-400 font-bold' },
          { label: isKo ? '무기' : 'Gun', value: `${WEAPONS[currentWeapon].name}`, color: 'text-amber-300' },
          { label: isKo ? '탄약' : 'Ammo', value: `${ammo}/${WEAPONS[currentWeapon].ammoMax}`, color: ammo <= 3 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
          { label: isKo ? '시간' : 'Time', value: `${matchTime}s`, color: matchTime <= 15 ? 'text-rose-400 font-bold' : 'text-emerald-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Crosshair Center */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-6 h-6 border border-white/40 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const dx = moveEvt.clientX - startX;
              const dy = moveEvt.clientY - startY;

              if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
                moved = true;
                stateRef.current.playerYaw -= dx * 0.003;
                stateRef.current.playerPitch = THREE.MathUtils.clamp(
                  stateRef.current.playerPitch - dy * 0.003,
                  -Math.PI / 4,
                  Math.PI / 4
                );
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);

              if (!moved) {
                // Tap: Shoot
                shoot();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
          onDoubleClick={switchNextWeapon}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-rose-500/30 rounded-full text-[10px] text-rose-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 드래그: 조준 회전 | 탭: 사격 | 더블탭: 무기 교체 (버튼 없음)' : 'Drag: Aim | Tap: Shoot | Double Tap: Switch Gun (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_pixel_strike_arena"
          gameTitle={isKo ? '3D 복셀 픽셀 스트라이크: 아레나 데스매치' : 'Voxel Pixel Strike: Arena Deathmatch'}
          customSteps={customTutorialSteps}
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
