import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiSlimeGameProps {
  onBack: () => void;
}

const TARGET_DISTANCE = 50;

interface SlimePlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  mesh?: THREE.Mesh;
}

interface ConfettiParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

// 젤리 발판 레이아웃
const PLATFORMS: SlimePlatform[] = [
  { x: 0, y: -2.5, w: 16, h: 1.2 }, // 시작 광폭 안전 플랫폼
  { x: 14.5, y: -1.2, w: 6.5, h: 0.8 },
  { x: 23.0, y: 0.2, w: 5.5, h: 0.8 },
  { x: 31.5, y: -0.8, w: 6.0, h: 0.8 },
  { x: 40.0, y: 1.2, w: 5.5, h: 0.8 },
  { x: 50.0, y: 0.5, w: 10.0, h: 1.2 }, // 결승 골인 플랫폼
];

export const PokiBlumgiSlimeGame: React.FC<PokiBlumgiSlimeGameProps> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 게임 진행 상태
  const [currentDist, setCurrentDist] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [chargePct, setChargePct] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [toastText, setToastText] = useState('');

  const startTimeRef = useRef<number>(Date.now());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);

  // 3D 오브젝트 레퍼런스
  const slimeGroupRef = useRef<THREE.Group | null>(null);
  const hoopGroupRef = useRef<THREE.Group | null>(null);
  const confettiRef = useRef<ConfettiParticle[]>([]);

  // 물리 시뮬레이션 상태
  const physics = useRef({
    pos: new THREE.Vector3(-4, -1.5, 0),
    vel: new THREE.Vector3(0, 0, 0),
    inAir: false,
    charge: 0,
    isCharging: false,
    lastSafeX: -4,
    lastSafeY: -1.5,
    scored: false,
  });

  // 햅틱 진동
  const triggerHaptic = (duration = 40) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const showToast = (text: string) => {
    setToastText(text);
    setTimeout(() => {
      setToastText((prev) => (prev === text ? '' : prev));
    }, 1800);
  };

  // 컨페티 폭죽 파티클
  const spawnConfetti = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const colors = [0x10b981, 0x34d399, 0xfbbf24, 0x38bdf8, 0xec4899, 0xffffff];
    const geo = new THREE.PlaneGeometry(0.2, 0.2);

    for (let i = 0; i < 45; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const p: ConfettiParticle = {
        mesh,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 8 + 3,
        vz: (Math.random() - 0.5) * 6,
        life: 0,
        maxLife: 1.4 + Math.random() * 0.6,
      };
      sceneRef.current.add(mesh);
      confettiRef.current.push(p);
    }
  };

  // 점프 충전 시작
  const startCharging = useCallback(() => {
    if (physics.current.inAir || gameWon) return;
    physics.current.isCharging = true;
    setIsCharging(true);
    triggerHaptic(25);
  }, []);

  // 점프 발사
  const releaseJump = useCallback(() => {
    const phys = physics.current;
    if (!phys.isCharging || phys.inAir || gameWon) return;

    const charge = Math.max(0.25, phys.charge);
    phys.isCharging = false;
    phys.inAir = true;
    setIsCharging(false);

    // 전방 포물선 도약
    const forwardPower = 8.0 + charge * 14.0;
    const upwardPower = 7.0 + charge * 12.5;
    phys.vel.set(forwardPower, upwardPower, 0);

    triggerHaptic(60);
    showToast(`🟢 SLIME JUMP! (${Math.round(charge * 100)}% POWER)`);
    phys.charge = 0;
    setChargePct(0);
  }, []);

  // 안전 체크포인트 복귀
  const returnToSafePos = useCallback(() => {
    const phys = physics.current;
    phys.pos.set(phys.lastSafeX, phys.lastSafeY, 0);
    phys.vel.set(0, 0, 0);
    phys.inAir = false;
    phys.charge = 0;
    phys.isCharging = false;
    setIsCharging(false);
    setChargePct(0);
    triggerHaptic(50);
    showToast('🔄 안전 발판으로 복귀했습니다.');
  }, []);

  // Three.js 초기화
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬 & 카메라
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x061e14);
    scene.fog = new THREE.FogExp2(0x061e14, 0.018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 150);
    camera.position.set(0, 2, 16);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa7f3d0, 1.8);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 배경 네온 바운스 벽면
    const backGeo = new THREE.PlaneGeometry(160, 40);
    const backMat = new THREE.MeshStandardMaterial({ color: 0x022c22, roughness: 0.9 });
    const backWall = new THREE.Mesh(backGeo, backMat);
    backWall.position.set(30, 8, -5);
    scene.add(backWall);

    // 발판 3D 메시 생성
    PLATFORMS.forEach((p, idx) => {
      const isEnd = idx === PLATFORMS.length - 1;
      const isStart = idx === 0;

      const pGeo = new THREE.BoxGeometry(p.w, p.h, 3.5);
      const pMat = new THREE.MeshStandardMaterial({
        color: isEnd ? 0xf59e0b : isStart ? 0x059669 : 0x047857,
        roughness: 0.35,
        metalness: isEnd ? 0.6 : 0.2,
      });
      const mesh = new THREE.Mesh(pGeo, pMat);
      mesh.position.set(p.x, p.y, 0);
      mesh.receiveShadow = true;
      scene.add(mesh);
      p.mesh = mesh;

      // 발판 윗면 네온 가이드 라인
      const edge = new THREE.Mesh(
        new THREE.PlaneGeometry(p.w, 0.12),
        new THREE.MeshBasicMaterial({ color: isEnd ? 0xfef08a : 0x6ee7b7 })
      );
      edge.position.set(p.x, p.y + p.h / 2 + 0.01, 1.3);
      scene.add(edge);
    });

    // ==========================================
    // 결승 골인 네온 림 & No.109 영웅 배지
    // ==========================================
    const hoopGroup = new THREE.Group();
    hoopGroup.position.set(50.0, 3.2, 0);
    scene.add(hoopGroup);
    hoopGroupRef.current = hoopGroup;

    // 네온 림 (Torus)
    const rimGeo = new THREE.TorusGeometry(1.2, 0.1, 16, 32);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    hoopGroup.add(rim);

    // 림 상단 No.109 공식 영웅 배지 전광판
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#064e3b';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#10b981';
      bctx.lineWidth = 12;
      bctx.strokeRect(6, 6, 244, 244);
      drawCardSprite(bctx, 109, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.8),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    badgeMesh.position.set(0, 2.4, 0);
    hoopGroup.add(badgeMesh);

    // ==========================================
    // 3D 카와이 슬라임 모델링
    // ==========================================
    const slimeGroup = new THREE.Group();
    slimeGroup.position.copy(physics.current.pos);
    scene.add(slimeGroup);
    slimeGroupRef.current = slimeGroup;

    // 반투명 젤리 돔 바디
    const bodyGeo = new THREE.SphereGeometry(0.85, 32, 24);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x34d399,
      transmission: 0.75,
      opacity: 0.95,
      transparent: true,
      roughness: 0.15,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    slimeGroup.add(body);

    // 귀여운 눈망울 2개
    const eyeGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x064e3b });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.28, 0.2, 0.72);
    slimeGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.28, 0.2, 0.72);
    slimeGroup.add(eyeR);

    // 동공 하이라이트
    const pupilGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pL = new THREE.Mesh(pupilGeo, pupilMat);
    pL.position.set(-0.24, 0.25, 0.82);
    slimeGroup.add(pL);

    const pR = new THREE.Mesh(pupilGeo, pupilMat);
    pR.position.set(0.32, 0.25, 0.82);
    slimeGroup.add(pR);

    // 가슴 No.109 공식 영웅 배지 데칼
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 128;
    heroCanvas.height = 128;
    const hctx = heroCanvas.getContext('2d');
    if (hctx) {
      drawCardSprite(hctx, 109, 8, 8, 112, 112, { circleClip: true });
    }
    const heroTex = new THREE.CanvasTexture(heroCanvas);
    const heroBadge = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 16),
      new THREE.MeshBasicMaterial({ map: heroTex, transparent: true })
    );
    heroBadge.position.set(0, -0.25, 0.78);
    slimeGroup.add(heroBadge);

    // 리사이즈 옵저버
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(container);

    // ==========================================
    // 애니메이션 렌더 루프
    // ==========================================
    let lastTime = performance.now();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const phys = physics.current;

      // 1. 점프 에너지 충전
      if (phys.isCharging && !phys.inAir) {
        phys.charge = Math.min(1.0, phys.charge + dt * 1.6);
        setChargePct(Math.round(phys.charge * 100));
      }

      // 2. 물리 시뮬레이션
      if (phys.inAir) {
        const gravity = -20;
        phys.vel.y += gravity * dt;
        phys.pos.x += phys.vel.x * dt;
        phys.pos.y += phys.vel.y * dt;

        // 발판 착지 판정
        let landed = false;
        for (const p of PLATFORMS) {
          const halfW = p.w / 2;
          const topY = p.y + p.h / 2;

          if (
            phys.pos.x >= p.x - halfW &&
            phys.pos.x <= p.x + halfW &&
            phys.pos.y >= topY + 0.3 &&
            phys.pos.y <= topY + 1.2 &&
            phys.vel.y <= 0
          ) {
            phys.pos.y = topY + 0.65;
            phys.vel.set(0, 0, 0);
            phys.inAir = false;
            landed = true;
            phys.lastSafeX = phys.pos.x;
            phys.lastSafeY = phys.pos.y;
            triggerHaptic(30);
            break;
          }
        }

        // 결승 림 통과 판정!
        if (!phys.scored && hoopGroupRef.current) {
          const hPos = hoopGroupRef.current.position;
          const distToHoop = Math.hypot(phys.pos.x - hPos.x, phys.pos.y - hPos.y);

          if (distToHoop < 1.4 && phys.vel.y < 0) {
            phys.scored = true;
            triggerHaptic(120);
            spawnConfetti(hPos);
            showToast('🌟 SLIME SLAM DUNK! 결승 덩크 성공!');

            if (!gameWon) {
              setGameWon(true);
              setTimeout(() => {
                const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const receipt = calculateAndDepositMissionReward({
                  gameId: 'poki-109',
                  gameTitle: 'Blumgi Slime 3D',
                  isVictory: true,
                  score: 500,
                  maxTargetScore: 500,
                  durationSeconds: dur,
                });
                setRewardReceipt(receipt);
              }, 900);
            }
          }
        }

        // 낙하 추락 복귀
        if (phys.pos.y < -5.0) {
          returnToSafePos();
        }
      }

      // 3. 스쿼시 & 스트레치 애니메이션
      if (slimeGroupRef.current) {
        slimeGroupRef.current.position.copy(phys.pos);

        if (phys.isCharging) {
          // 충전 납작해짐
          const c = phys.charge;
          slimeGroupRef.current.scale.set(1 + c * 0.45, 1 - c * 0.5, 1 + c * 0.45);
        } else if (phys.inAir) {
          // 공중 늘어남
          const spd = Math.hypot(phys.vel.x, phys.vel.y);
          const stretch = Math.min(spd / 25, 0.4);
          slimeGroupRef.current.scale.set(1 - stretch * 0.5, 1 + stretch, 1 - stretch * 0.5);
          slimeGroupRef.current.rotation.z = -phys.vel.x * 0.02;
        } else {
          // 통통 숨쉬기
          const breathe = Math.sin(now * 0.005) * 0.05;
          slimeGroupRef.current.scale.set(1 + breathe, 1 - breathe, 1 + breathe);
          slimeGroupRef.current.rotation.z = 0;
        }
      }

      // 거리 및 점수 갱신
      const dist = Math.min(TARGET_DISTANCE, Math.max(0, Math.floor(phys.pos.x + 4)));
      setCurrentDist(dist);
      setCurrentScore(dist * 10);

      // 카메라 팔로우
      if (cameraRef.current) {
        const targetCamX = phys.pos.x + 3.0;
        const targetCamY = phys.pos.y + 1.5;
        cameraRef.current.position.x += (targetCamX - cameraRef.current.position.x) * 0.1;
        cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.08;
      }

      // 컨페티 시뮬레이션
      const conf = confettiRef.current;
      for (let i = conf.length - 1; i >= 0; i--) {
        const p = conf[i];
        p.life += dt;
        p.vy -= 12 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          if (Array.isArray(p.mesh.material)) {
            p.mesh.material.forEach((m) => m.dispose());
          } else {
            p.mesh.material.dispose();
          }
          conf.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki-109',
      gameTitle: 'Blumgi Slime 3D',
      isVictory: false,
      score: currentScore,
      maxTargetScore: 500,
      durationSeconds: dur,
    });
    setRewardReceipt(receipt);
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#061e14]"
      onTouchStart={startCharging}
      onTouchEnd={releaseJump}
      onMouseDown={startCharging}
      onMouseUp={releaseJump}
    >
      {/* 3D 뷰포트 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="BLUMGI SLIME 3D"
        missionTarget={`결승 골대: ${currentDist}m/${TARGET_DISTANCE}m`}
        currentScore={currentScore}
        onBack={onBack}
        onForfeit={handleForfeit}
      />

      {/* 상단 게이지 및 피드백 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {toastText ? (
          <div className="bg-amber-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/50">
            {toastText}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs text-emerald-300 border border-emerald-500/30 font-mono">
            🟢 화면을 길게 눌러 점프 파워를 충전하고 릴리스해 도약하세요!
          </div>
        )}

        {isCharging && (
          <div className="mt-2 flex items-center gap-2 bg-black/70 px-4 py-1.5 rounded-full border border-emerald-400/60 shadow-lg">
            <span className="text-[10px] text-emerald-400 font-bold font-mono">CHARGE</span>
            <div className="w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-green-300 transition-all duration-75"
                style={{ width: `${chargePct}%` }}
              />
            </div>
            <span className="text-xs text-white font-mono font-bold">{chargePct}%</span>
          </div>
        )}
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 패널 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-20 pointer-events-auto">
        {/* 복귀 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            returnToSafePos();
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 active:bg-slate-700 text-white font-mono text-xs border border-white/20 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🔄</span>
          <span className="text-[10px]">REVERT</span>
        </button>

        {/* 대형 점프 차지 버튼 */}
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            startCharging();
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            releaseJump();
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-emerald-500 to-green-700 active:from-emerald-600 active:to-green-800 text-white font-black text-sm border-2 border-emerald-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">🟢</span>
          <span className="tracking-wider text-xs font-mono font-bold">JUMP!</span>
        </button>

        {/* 가이드 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            showToast('💡 길게 누를수록 높고 멀리 도약하여 골대에 덩크할 수 있습니다!');
            triggerHaptic(20);
          }}
          className="w-16 h-16 rounded-full bg-emerald-800/80 active:bg-emerald-700 text-white font-mono text-xs border border-emerald-400/40 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">❓</span>
          <span className="text-[10px]">HELP</span>
        </button>
      </div>

      {/* 승리 및 정산 모달 */}
      {rewardReceipt && (
        <VictoryRewardModal
          receipt={rewardReceipt}
          onClose={onBack}
        />
      )}
    </div>
  );
};

export default PokiBlumgiSlimeGame;
