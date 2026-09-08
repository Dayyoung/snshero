import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanClimb3DGameProps {
  onBack: () => void;

  onExit?: () => void;
  onClose?: () => void;
}

const SUMMIT_HEIGHT = 55;

interface LedgeData {
  x: number;
  y: number;
  w: number;
  h: number;
  mesh?: THREE.Mesh;
}

interface SparkParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

// 암벽 발판 레이아웃
const LEDGES: LedgeData[] = [
  { x: 0, y: -2.8, w: 16, h: 1.2 }, // 시작 광폭 안전 발판
  { x: 3.5, y: 3.5, w: 5.5, h: 0.8 },
  { x: -3.8, y: 9.0, w: 5.0, h: 0.8 },
  { x: 2.8, y: 15.0, w: 4.8, h: 0.8 },
  { x: -3.2, y: 21.5, w: 4.5, h: 0.8 },
  { x: 3.0, y: 28.5, w: 4.5, h: 0.8 },
  { x: -2.5, y: 36.0, w: 4.2, h: 0.8 },
  { x: 2.2, y: 44.0, w: 4.0, h: 0.8 },
  { x: 0, y: SUMMIT_HEIGHT, w: 10, h: 1.2 }, // 정상 서밋 골든 플랫폼
];

export const PokiStickmanClimb3DGame: React.FC<PokiStickmanClimb3DGameProps> = ({
  onBack,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 게임 진행 상태
  const [currentMeters, setCurrentMeters] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [toastText, setToastText] = useState('');

  const startTimeRef = useRef<number>(Date.now());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);

  // 3D 오브젝트 레퍼런스
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const axeGroupRef = useRef<THREE.Group | null>(null);
  const axeTipRef = useRef<THREE.Object3D | null>(null);
  const sparksRef = useRef<SparkParticle[]>([]);

  // 물리 시뮬레이션 상태
  const physics = useRef({
    pos: new THREE.Vector3(0, -1.8, 0),
    vel: new THREE.Vector3(0, 0, 0),
    axeAngle: -Math.PI / 2,
    targetAxeAngle: -Math.PI / 2,
    lastCheckpointY: -1.8,
    isGrounded: true,
    axeLength: 2.2,
  });

  // 터치 드래그 조향
  const touchState = useRef({
    active: false,
    startX: 0,
    startY: 0,
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

  // 스파크 파티클 생성
  const spawnSparks = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const colors = [0xf59e0b, 0xfbbf24, 0xef4444, 0xffffff];

    for (let i = 0; i < 20; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const p: SparkParticle = {
        mesh,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 6 + 1,
        vz: (Math.random() - 0.5) * 4,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
      };
      sceneRef.current.add(mesh);
      sparksRef.current.push(p);
    }
  };

  // 곡괭이 지렛대 도약 (Vault Jump)
  const performVaultJump = useCallback((powerMult = 1.0) => {
    if (gameWon) return;
    const phys = physics.current;

    // 곡괭이 끝 위치 계산
    const tipWorldPos = new THREE.Vector3(
      phys.pos.x + Math.cos(phys.axeAngle) * phys.axeLength,
      phys.pos.y + Math.sin(phys.axeAngle) * phys.axeLength,
      0
    );

    // 가까운 발판과의 충돌/접촉 검사
    let contactFound = false;
    let pushDir = new THREE.Vector2(0, 1);

    for (const ledge of LEDGES) {
      const minX = ledge.x - ledge.w / 2 - 0.5;
      const maxX = ledge.x + ledge.w / 2 + 0.5;
      const minY = ledge.y - ledge.h / 2 - 0.3;
      const maxY = ledge.y + ledge.h / 2 + 0.6;

      if (tipWorldPos.x >= minX && tipWorldPos.x <= maxX && tipWorldPos.y >= minY && tipWorldPos.y <= maxY) {
        contactFound = true;
        // 곡괭이 반대 방향으로 밀어내기 (지렛대 원리)
        const dx = phys.pos.x - tipWorldPos.x;
        const dy = phys.pos.y - tipWorldPos.y;
        const len = Math.hypot(dx, dy) || 1;
        pushDir.set(dx / len, Math.max(0.6, dy / len));
        spawnSparks(tipWorldPos);
        break;
      }
    }

    if (contactFound || phys.isGrounded) {
      triggerHaptic(70);
      const jumpPower = 15.5 * powerMult;
      phys.vel.x = pushDir.x * jumpPower * 0.8;
      phys.vel.y = pushDir.y * jumpPower;
      phys.isGrounded = false;
      showToast('⚡ VAULT JUMP!');
    } else {
      // 허공 스윙 시 약한 추진력
      triggerHaptic(25);
      phys.vel.x += Math.cos(phys.axeAngle + Math.PI / 2) * 3.0;
      phys.vel.y += 2.0;
    }
  }, []);

  // 안전 체크포인트 복귀
  const returnToCheckpoint = useCallback(() => {
    const phys = physics.current;
    phys.pos.set(0, phys.lastCheckpointY, 0);
    phys.vel.set(0, 0, 0);
    phys.isGrounded = true;
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
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 3, 16);
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

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    sunLight.position.set(10, 30, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 배경 설산 암벽 백월
    const cliffGeo = new THREE.PlaneGeometry(36, 120);
    const cliffMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
    });
    const cliff = new THREE.Mesh(cliffGeo, cliffMat);
    cliff.position.set(0, 30, -4);
    scene.add(cliff);

    // 발판 3D 메시 생성
    LEDGES.forEach((l, idx) => {
      const isSummit = idx === LEDGES.length - 1;
      const isStart = idx === 0;

      const ledgeGeo = new THREE.BoxGeometry(l.w, l.h, 4.0);
      const ledgeMat = new THREE.MeshStandardMaterial({
        color: isSummit ? 0xf59e0b : isStart ? 0x10b981 : 0x475569,
        roughness: 0.4,
        metalness: isSummit ? 0.6 : 0.1,
      });
      const mesh = new THREE.Mesh(ledgeGeo, ledgeMat);
      mesh.position.set(l.x, l.y, 0);
      mesh.receiveShadow = true;
      scene.add(mesh);
      l.mesh = mesh;

      // 발판 윗면 네온 가이드 라인
      const edgeGeo = new THREE.PlaneGeometry(l.w, 0.1);
      const edgeMat = new THREE.MeshBasicMaterial({
        color: isSummit ? 0xfef08a : isStart ? 0x34d399 : 0x38bdf8,
      });
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.position.set(l.x, l.y + l.h / 2 + 0.01, 1.5);
      scene.add(edge);
    });

    // ==========================================
    // 정상 서밋 No.106 영웅 배지 모놀리스 타워
    // ==========================================
    const summitTower = new THREE.Group();
    summitTower.position.set(0, SUMMIT_HEIGHT + 2.5, 0);
    scene.add(summitTower);

    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#78350f';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#f59e0b';
      bctx.lineWidth = 12;
      bctx.strokeRect(6, 6, 244, 244);
      drawCardSprite(bctx, 106, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    summitTower.add(badgeMesh);

    // ==========================================
    // 3D 항아리 스틱맨 플레이어 모델링
    // ==========================================
    const playerGroup = new THREE.Group();
    playerGroup.position.copy(physics.current.pos);
    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    // 1. 항아리 (Pot)
    const potGeo = new THREE.CylinderGeometry(0.7, 0.55, 1.1, 20);
    const potMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(0, 0, 0);
    playerGroup.add(pot);

    // 항아리 전면 No.106 공식 영웅 배지 데칼
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 128;
    heroCanvas.height = 128;
    const hctx = heroCanvas.getContext('2d');
    if (hctx) {
      drawCardSprite(hctx, 106, 8, 8, 112, 112, { circleClip: true });
    }
    const heroTex = new THREE.CanvasTexture(heroCanvas);
    const heroBadge = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 16),
      new THREE.MeshBasicMaterial({ map: heroTex, transparent: true })
    );
    heroBadge.position.set(0, 0, 0.72);
    playerGroup.add(heroBadge);

    // 2. 스틱맨 상체 & 머리
    const torsoGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12);
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const torso = new THREE.Mesh(torsoGeo, stickMat);
    torso.position.set(0, 0.8, 0);
    playerGroup.add(torso);

    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const head = new THREE.Mesh(headGeo, stickMat);
    head.position.set(0, 1.45, 0);
    playerGroup.add(head);

    // 3. 3D 곡괭이 그룹 (자루 회전 피벗)
    const axeGroup = new THREE.Group();
    axeGroup.position.set(0, 0.8, 0.4); // 어깨 위치
    playerGroup.add(axeGroup);
    axeGroupRef.current = axeGroup;

    // 나무 자루 (Shaft)
    const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, physics.current.axeLength, 12);
    shaftGeo.translate(0, physics.current.axeLength / 2, 0); // 피벗 하단 정렬
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    axeGroup.add(shaft);

    // 곡괭이 헤드 (블레이드)
    const headBladeGeo = new THREE.BoxGeometry(0.8, 0.18, 0.12);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
    const blade = new THREE.Mesh(headBladeGeo, bladeMat);
    blade.position.set(0, physics.current.axeLength, 0);
    axeGroup.add(blade);

    // 끝 포인트
    const tipMarker = new THREE.Object3D();
    tipMarker.position.set(0, physics.current.axeLength, 0);
    axeGroup.add(tipMarker);
    axeTipRef.current = tipMarker;

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

      // 1. 곡괭이 각도 부드러운 보간
      phys.axeAngle += (phys.targetAxeAngle - phys.axeAngle) * 0.2;
      if (axeGroupRef.current) {
        // Z축 회전 정렬
        axeGroupRef.current.rotation.z = phys.axeAngle - Math.PI / 2;
      }

      // 2. 플레이어 물리 (중력 및 이동)
      const gravity = -22;
      phys.vel.y += gravity * dt;
      phys.pos.x += phys.vel.x * dt;
      phys.pos.y += phys.vel.y * dt;
      phys.vel.x *= 0.96; // 공기 저항

      // 좌우 벽면 제한
      if (phys.pos.x < -6.5) {
        phys.pos.x = -6.5;
        phys.vel.x = Math.abs(phys.vel.x) * 0.5;
      } else if (phys.pos.x > 6.5) {
        phys.pos.x = 6.5;
        phys.vel.x = -Math.abs(phys.vel.x) * 0.5;
      }

      // 발판 착지 판정
      let onLedge = false;
      for (const ledge of LEDGES) {
        const halfW = ledge.w / 2;
        const topY = ledge.y + ledge.h / 2;

        if (
          phys.pos.x >= ledge.x - halfW &&
          phys.pos.x <= ledge.x + halfW &&
          phys.pos.y >= topY + 0.4 &&
          phys.pos.y <= topY + 1.2 &&
          phys.vel.y <= 0
        ) {
          phys.pos.y = topY + 0.55;
          phys.vel.y = 0;
          phys.isGrounded = true;
          onLedge = true;

          // 체크포인트 갱신
          if (topY > phys.lastCheckpointY) {
            phys.lastCheckpointY = topY + 0.55;
          }
          break;
        }
      }

      if (!onLedge && phys.pos.y > -2.0) {
        phys.isGrounded = false;
      }

      // 최하단 추락 방지 및 체크포인트 복귀
      if (phys.pos.y < -5.0) {
        returnToCheckpoint();
      }

      // 고도 계산 및 UI 갱신
      const meters = Math.max(0, Math.floor(phys.pos.y + 2.8));
      setCurrentMeters(meters);
      setCurrentScore(meters * 10);

      // 정상 정복 승리 판정
      if (meters >= SUMMIT_HEIGHT && !gameWon) {
        setGameWon(true);
        triggerHaptic(150);
        showToast('🏆 서밋 정상 정복! 축하합니다!');

        setTimeout(() => {
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki-106',
            gameTitle: 'Stickman Climb 3D',
            isVictory: true,
            score: 500,
            maxTargetScore: 500,
            durationSeconds: dur,
          });
          setRewardReceipt(receipt);
        }, 900);
      }

      // 플레이어 메쉬 위치 동기화
      if (playerGroupRef.current) {
        playerGroupRef.current.position.copy(phys.pos);
        playerGroupRef.current.rotation.z = -phys.vel.x * 0.03;
      }

      // 카메라가 플레이어를 부드럽게 추적
      if (cameraRef.current) {
        const targetCamY = phys.pos.y + 2.5;
        cameraRef.current.position.y += (targetCamY - cameraRef.current.position.y) * 0.1;
        cameraRef.current.position.x += (phys.pos.x * 0.3 - cameraRef.current.position.x) * 0.1;
      }

      // 스파크 파티클 시뮬레이션
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life += dt;
        p.vy -= 16 * dt;
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
          sparks.splice(i, 1);
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

  // 터치 제스처로 곡괭이 각도 조향
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    touchState.current = { active: true, startX: clientX, startY: clientY };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchState.current.active) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - window.innerWidth / 2;
    const dy = clientY - window.innerHeight / 2;
    const angle = Math.atan2(-dy, dx);
    physics.current.targetAxeAngle = angle;
  };

  const handleTouchEnd = () => {
    touchState.current.active = false;
  };

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki-106',
      gameTitle: 'Stickman Climb 3D',
      isVictory: false,
      score: currentScore,
      maxTargetScore: 500,
      durationSeconds: dur,
    });
    // 정산 후 추가 팝업 없이 즉시 미션리스트로 이동
    const exitFn = (typeof handleExit === "function" ? handleExit : (onBack || onExit || onClose || (() => {})));
    exitFn();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hero-return-to-missions"));
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0f172a]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      {/* 3D 뷰포트 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="STICKMAN CLIMB 3D"
        missionTarget={`정상 서밋: ${currentMeters}m/${SUMMIT_HEIGHT}m`}
        currentScore={currentScore}
        onBack={onBack}
        onForfeit={handleForfeit}
      />

      {/* 상단 가이드 및 토스트 피드백 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {toastText ? (
          <div className="bg-amber-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/50">
            {toastText}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs text-amber-300 border border-amber-500/30 font-mono">
            ⛏️ 화면을 터치해 곡괭이 각도를 조절하고 발판을 찍어 도약하세요!
          </div>
        )}
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 패널 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-20 pointer-events-auto">
        {/* 체크포인트 복귀 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            returnToCheckpoint();
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 active:bg-slate-700 text-white font-mono text-xs border border-white/20 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🔄</span>
          <span className="text-[10px]">REVERT</span>
        </button>

        {/* 대형 곡괭이 지렛대 점프 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            performVaultJump(1.0);
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-500 to-orange-600 active:from-amber-600 active:to-orange-700 text-white font-black text-sm border-2 border-amber-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">⛏️</span>
          <span className="tracking-wider text-xs font-mono font-bold">VAULT!</span>
        </button>

        {/* 슈퍼 도약 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            performVaultJump(1.35);
          }}
          className="w-16 h-16 rounded-full bg-orange-700/80 active:bg-orange-600 text-white font-mono text-xs border border-orange-400/40 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🚀</span>
          <span className="text-[10px]">POWER</span>
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

export default PokiStickmanClimb3DGame;
