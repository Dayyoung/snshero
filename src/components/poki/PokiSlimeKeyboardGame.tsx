import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSlimeKeyboardGameProps {
  onBack?: () => void;
  onExit?: () => void;
  onClose?: () => void;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onReward?: (amount: number) => void;
}

const TOTAL_TRACK_DISTANCE = 300;

interface KeycapItem {
  mesh: THREE.Mesh;
  type: 'normal' | 'slime' | 'booster' | 'goal';
  originalY: number;
  label: string;
}

interface ConfettiParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiSlimeKeyboardGame: React.FC<PokiSlimeKeyboardGameProps> = ({
  onBack,
  onExit,
  onClose,
  deck = [],
  language = 'ko',
  onReward,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onExit || onClose || (() => {});

  // 게임 진행 상태
  const [currentDist, setCurrentDist] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [isBoosting, setIsBoosting] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [toastText, setToastText] = useState('');

  const speedLevelRef = useRef(1);
  speedLevelRef.current = speedLevel;
  const gameWonRef = useRef(false);
  gameWonRef.current = gameWon;
  const onRewardRef = useRef(onReward);
  onRewardRef.current = onReward;
  const handleExitRef = useRef(handleExit);
  handleExitRef.current = handleExit;
  const currentDistRef = useRef(0);

  const startTimeRef = useRef<number>(Date.now());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);

  // 3D 오브젝트 레퍼런스
  const slimeGroupRef = useRef<THREE.Group | null>(null);
  const slimeBodyRef = useRef<THREE.Mesh | null>(null);
  const keycapsRef = useRef<KeycapItem[]>([]);
  const confettiRef = useRef<ConfettiParticle[]>([]);

  // 슬라임 물리 상태
  const physics = useRef({
    pos: new THREE.Vector3(0, 1.0, 0),
    vel: new THREE.Vector3(0, 0, 0),
    speed: 16, // 전진 기본 속도 (m/s)
    steerAngle: 0,
    targetSteer: 0,
    isGrounded: true,
    inputJump: false,
    inputBoost: false,
  });

  // 터치 스와이프 조향 상태
  const touchState = useRef({
    active: false,
    startX: 0,
    currentX: 0,
  });

  // 햅틱 피드백
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

  // 점프 실행
  const triggerJump = useCallback(() => {
    const phys = physics.current;
    if (phys.isGrounded && !gameWon) {
      phys.vel.y = 15.0;
      phys.isGrounded = false;
      triggerHaptic(40);
      showToast('🦘 SLIME JUMP!');
    }
  }, [gameWon]);

  // 안전 리스폰
  const respawnSlime = useCallback(() => {
    const phys = physics.current;
    phys.pos.x = 0;
    phys.pos.y = 1.2;
    phys.vel.set(0, 0, 0);
    phys.steerAngle = 0;
    phys.targetSteer = 0;
    phys.isGrounded = true;
    triggerHaptic(50);
    showToast('🔄 키보드 중앙으로 복귀했습니다.');
  }, []);

  // 컨페티 폭죽
  const spawnConfetti = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const colors = [0x10b981, 0x34d399, 0xfbbf24, 0x38bdf8, 0xec4899, 0xffffff];
    const geo = new THREE.PlaneGeometry(0.25, 0.25);

    for (let i = 0; i < 50; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const p: ConfettiParticle = {
        mesh,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * 10 + 4,
        vz: (Math.random() - 0.5) * 10,
        life: 0,
        maxLife: 1.6 + Math.random() * 0.6,
      };
      sceneRef.current.add(mesh);
      confettiRef.current.push(p);
    }
  };

  // Three.js 씬 빌드
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬 & 카메라
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 250);
    camera.position.set(0, 3.8, 8.5);
    camera.lookAt(0, 1.0, -10);
    cameraRef.current = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // ==========================================
    // 3D 키보드 섀시 베이스 & 키캡 트랙
    // ==========================================
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // 키보드 알루미늄 하우징 베이스 바닥
    const baseGeo = new THREE.BoxGeometry(18, 1.2, TOTAL_TRACK_DISTANCE + 40);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8, metalness: 0.3 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -0.6, -(TOTAL_TRACK_DISTANCE / 2));
    baseMesh.receiveShadow = true;
    trackGroup.add(baseMesh);

    // 좌우 RGB 네온 스트립
    const rgbGeo = new THREE.BoxGeometry(0.3, 0.4, TOTAL_TRACK_DISTANCE + 40);
    const rgbMatL = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const rgbL = new THREE.Mesh(rgbGeo, rgbMatL);
    rgbL.position.set(-8.8, 0.1, -(TOTAL_TRACK_DISTANCE / 2));
    trackGroup.add(rgbL);

    const rgbMatR = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const rgbR = new THREE.Mesh(rgbGeo, rgbMatR);
    rgbR.position.set(8.8, 0.1, -(TOTAL_TRACK_DISTANCE / 2));
    trackGroup.add(rgbR);

    // ==========================================
    // 키캡 머티리얼 캐싱 (1,320개 생성 방지!)
    // ==========================================
    const createKeyTex = (text: string, bgColor: string, textColor: string) => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 116, 116);
        ctx.fillStyle = textColor;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);
      }
      return new THREE.CanvasTexture(c);
    };

    const matNormal = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.2,
      map: createKeyTex('KEY', '#334155', '#94a3b8'),
    });

    const matSpace = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.3,
      map: createKeyTex('SPACE START', '#1e293b', '#38bdf8'),
    });

    const matSlime = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.2,
      metalness: 0.1,
      map: createKeyTex('SLIME', '#15803d', '#86efac'),
    });

    const matBooster = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.4,
      map: createKeyTex('BOOST', '#d97706', '#fef08a'),
    });

    const matEsc = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.2,
      metalness: 0.5,
      map: createKeyTex('ESC GOAL', '#dc2626', '#ffffff'),
    });

    // 시작 광폭 스페이스바 안전 플랫폼 (20m)
    const startPlateGeo = new THREE.BoxGeometry(16, 1.2, 22);
    const startPlate = new THREE.Mesh(startPlateGeo, matSpace);
    startPlate.position.set(0, 0.4, 0);
    startPlate.receiveShadow = true;
    trackGroup.add(startPlate);

    const keycaps: KeycapItem[] = [];
    keycaps.push({ mesh: startPlate, type: 'normal', originalY: 0.4, label: 'SPACE START' });

    // 정규 키캡 그리드 생성
    const keyGeo = new THREE.BoxGeometry(2.6, 1.2, 2.6);
    const colXs = [-6.2, -3.1, 0, 3.1, 6.2];
    const rowStep = 3.6;

    for (let z = -16; z >= -TOTAL_TRACK_DISTANCE + 10; z -= rowStep) {
      for (const colX of colXs) {
        // 일부 키캡 갭(낙하 함정) 연출
        if (Math.random() < 0.12 && z < -30) continue;

        let type: 'normal' | 'slime' | 'booster' | 'goal' = 'normal';
        let keyMat = matNormal;

        const rand = Math.random();
        if (rand < 0.15 && z < -25) {
          type = 'slime';
          keyMat = matSlime;
        } else if (rand < 0.30 && z < -25) {
          type = 'booster';
          keyMat = matBooster;
        }

        const keyMesh = new THREE.Mesh(keyGeo, keyMat);
        keyMesh.position.set(colX, 0.4, z);
        keyMesh.castShadow = true;
        keyMesh.receiveShadow = true;
        trackGroup.add(keyMesh);

        keycaps.push({ mesh: keyMesh, type, originalY: 0.4, label: type });
      }
    }

    // 결승 ESC 골 포털 플랫폼
    const escGeo = new THREE.BoxGeometry(14, 1.2, 10);
    const escMesh = new THREE.Mesh(escGeo, matEsc);
    escMesh.position.set(0, 0.4, -TOTAL_TRACK_DISTANCE);
    escMesh.receiveShadow = true;
    trackGroup.add(escMesh);
    keycaps.push({ mesh: escMesh, type: 'goal', originalY: 0.4, label: 'ESC' });

    // 결승 No.01 공식 카드 영웅 배지 홀로그램 아치
    const finishArch = new THREE.Group();
    finishArch.position.set(0, 0, -TOTAL_TRACK_DISTANCE);
    trackGroup.add(finishArch);

    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#064e3b';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#10b981';
      bctx.lineWidth = 14;
      bctx.strokeRect(7, 7, 242, 242);
      drawCardSprite(bctx, 1, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    badgeMesh.position.set(0, 4.5, 0);
    finishArch.add(badgeMesh);

    keycapsRef.current = keycaps;

    // ==========================================
    // 3D 쫀득 슬라임 플레이어 모델링
    // ==========================================
    const slimeGroup = new THREE.Group();
    slimeGroup.position.copy(physics.current.pos);
    scene.add(slimeGroup);
    slimeGroupRef.current = slimeGroup;

    // 반투명 에메랄드 젤리 바디
    const slimeGeo = new THREE.SphereGeometry(0.8, 24, 24);
    const slimeMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      transmission: 0.75,
      opacity: 0.95,
      transparent: true,
      roughness: 0.15,
      metalness: 0.1,
    });
    const slimeBody = new THREE.Mesh(slimeGeo, slimeMat);
    slimeBody.castShadow = true;
    slimeGroup.add(slimeBody);
    slimeBodyRef.current = slimeBody;

    // 눈망울 2개
    const eyeGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x064e3b });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.26, 0.18, -0.68);
    slimeGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.26, 0.18, -0.68);
    slimeGroup.add(eyeR);

    // 슬라임 가슴 No.01 공식 카드 영웅 배지 데칼
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 128;
    heroCanvas.height = 128;
    const hctx = heroCanvas.getContext('2d');
    if (hctx) {
      drawCardSprite(hctx, 1, 8, 8, 112, 112, { circleClip: true });
    }
    const heroTex = new THREE.CanvasTexture(heroCanvas);
    const heroBadge = new THREE.Mesh(
      new THREE.CircleGeometry(0.26, 16),
      new THREE.MeshBasicMaterial({ map: heroTex, transparent: true })
    );
    heroBadge.rotation.y = Math.PI;
    heroBadge.position.set(0, -0.2, -0.74);
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

      // 1. 속도 제어
      let targetSpeed = 16 + (speedLevelRef.current - 1) * 2.5;
      if (phys.inputBoost) targetSpeed *= 1.6;
      phys.speed += (targetSpeed - phys.speed) * 0.1;

      // 2. 좌우 조향 (Screen-relative 100% 일치)
      phys.steerAngle += (phys.targetSteer - phys.steerAngle) * 0.2;
      phys.pos.x += phys.steerAngle * phys.speed * 0.45 * dt;

      // 전진 이동 (Z축 음수 방향)
      phys.pos.z -= phys.speed * dt;

      // 3. 중력 및 점프 물리
      const gravity = -26;
      phys.vel.y += gravity * dt;
      phys.pos.y += phys.vel.y * dt;

      // 키캡 착지 판정
      let onGround = false;
      const keycapsList = keycapsRef.current;

      for (const k of keycapsList) {
        const isBig = k.label === 'SPACE START' || k.label === 'ESC';
        const halfW = isBig ? 8.5 : 1.4;
        const halfD = isBig ? 12.0 : 1.4;
        const checkRange = isBig ? 14.0 : 3.0;

        // 가까운 키캡만 충돌 검사 (대형 플랫폼은 14m 검사 범위 보장)
        if (Math.abs(phys.pos.z - k.mesh.position.z) > checkRange) continue;

        if (
          phys.pos.x >= k.mesh.position.x - halfW &&
          phys.pos.x <= k.mesh.position.x + halfW &&
          phys.pos.z >= k.mesh.position.z - halfD &&
          phys.pos.z <= k.mesh.position.z + halfD &&
          phys.pos.y >= 0.9 &&
          phys.pos.y <= 1.8 &&
          phys.vel.y <= 0
        ) {
          phys.pos.y = 1.0;
          phys.vel.y = 0;
          phys.isGrounded = true;
          onGround = true;

          // 키캡 눌림 애니메이션
          k.mesh.position.y = k.originalY - 0.2;

          if (k.type === 'booster') {
            setSpeedLevel((lvl) => Math.min(10, lvl + 1));
            triggerHaptic(50);
            showToast('⚡ SPEED BOOSTER!');
          } else if (k.type === 'slime') {
            setSpeedLevel((lvl) => Math.max(1, lvl - 1));
            triggerHaptic(60);
            showToast('🟢 SLIME TRAP! 감속!');
          }
          break;
        }
      }

      if (!onGround && phys.pos.y > 1.2) {
        phys.isGrounded = false;
      }

      // 키캡 위치 부드럽게 복귀
      keycapsList.forEach((k) => {
        if (k.mesh.position.y < k.originalY) {
          k.mesh.position.y += dt * 1.5;
        }
      });

      // 추락 낙하 복귀
      if (phys.pos.y < -8.0) {
        respawnSlime();
      }

      // 거리 및 점수 갱신 (10프레임마다 쓰로틀링하여 React 리렌더링 부하 원천 제거)
      const dist = Math.min(TOTAL_TRACK_DISTANCE, Math.max(0, Math.floor(-phys.pos.z)));
      if (Math.abs(dist - currentDistRef.current) >= 1) {
        currentDistRef.current = dist;
        setCurrentDist(dist);
        setCurrentScore(dist * 10 + (speedLevelRef.current - 1) * 50);
      }

      // 결승 ESC 골인 승리 판정!
      if (dist >= TOTAL_TRACK_DISTANCE && !gameWonRef.current) {
        gameWonRef.current = true;
        setGameWon(true);
        triggerHaptic(180);
        spawnConfetti(phys.pos);
        showToast('🏆 ESC 탈출 성공! 3D 슬라임 키보드 정복!');

        setTimeout(() => {
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'pokislimekeyboard',
            gameTitle: 'Slime Keyboard Escape 3D',
            isVictory: true,
            score: 500,
            maxTargetScore: 500,
            durationSeconds: dur,
          });
          setRewardReceipt(receipt);
          if (onRewardRef.current) onRewardRef.current(receipt.totalSns);
        }, 900);
      }

      // 슬라임 스쿼시 앤 스트레치 애니메이션
      if (slimeGroupRef.current && slimeBodyRef.current) {
        slimeGroupRef.current.position.copy(phys.pos);
        slimeGroupRef.current.rotation.z = -phys.steerAngle * 0.25;

        if (!phys.isGrounded) {
          const stretch = Math.min(Math.abs(phys.vel.y) / 25, 0.35);
          slimeBodyRef.current.scale.set(1 - stretch * 0.5, 1 + stretch, 1 - stretch * 0.5);
        } else {
          // 통통 바운스
          const bounce = Math.sin(now * 0.01) * 0.1;
          slimeBodyRef.current.scale.set(1 + bounce, 1 - bounce, 1 + bounce);
        }
      }

      // 체이스 카메라 위치 추적
      if (cameraRef.current) {
        cameraRef.current.position.x = phys.pos.x * 0.6;
        cameraRef.current.position.y = phys.pos.y + 3.2;
        cameraRef.current.position.z = phys.pos.z + 7.5;
        cameraRef.current.lookAt(phys.pos.x, phys.pos.y + 0.5, phys.pos.z - 8);
      }

      // 컨페티 파티클 시뮬레이션
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

  // 터치 스와이프 조향
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchState.current = { active: true, startX: clientX, currentX: clientX };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchState.current.active) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchState.current.currentX = clientX;

    const diffX = clientX - touchState.current.startX;
    // Screen-relative 조향 (오른쪽 스와이프 시 오른쪽, 왼쪽 스와이프 시 왼쪽)
    const steer = Math.max(-1.0, Math.min(1.0, diffX / 80));
    physics.current.targetSteer = steer;
  };

  const handleTouchEnd = () => {
    touchState.current.active = false;
    physics.current.targetSteer = 0;
  };

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokislimekeyboard',
      gameTitle: 'Slime Keyboard Escape 3D',
      isVictory: false,
      score: currentScore,
      maxTargetScore: 500,
      durationSeconds: dur,
    });
    setRewardReceipt(receipt);
    if (onRewardRef.current) onRewardRef.current(receipt.totalSns);
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0a0f1d]"
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
        gameTitle="SLIME KEYBOARD ESCAPE 3D"
        missionTarget={`[ESC] 탈출: ${currentDist}m/${TOTAL_TRACK_DISTANCE}m`}
        currentScore={currentScore}
        onBack={handleExit}
        onForfeit={handleForfeit}
      />

      {/* 상단 스피드 게이지 & 토스트 피드백 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {toastText ? (
          <div className="bg-emerald-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/50">
            {toastText}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs text-emerald-300 border border-emerald-500/30 font-mono flex items-center gap-3">
            <span>⚡ SPEED: {speedLevel}x</span>
            <span>|</span>
            <span>화면을 좌우로 스와이프해 키캡 위를 질주하세요!</span>
          </div>
        )}
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 패널 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-20 pointer-events-auto">
        {/* 부스트 버튼 */}
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            physics.current.inputBoost = true;
            setIsBoosting(true);
            triggerHaptic(60);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            physics.current.inputBoost = false;
            setIsBoosting(false);
          }}
          className={`w-16 h-16 rounded-full font-mono text-xs border flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all ${
            isBoosting
              ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
              : 'bg-slate-800/80 active:bg-slate-700 text-amber-300 border-amber-500/40'
          }`}
        >
          <span className="text-base">⚡</span>
          <span className="text-[10px]">BOOST</span>
        </button>

        {/* 대형 점프 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerJump();
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-emerald-500 to-teal-700 active:from-emerald-600 active:to-teal-800 text-white font-black text-sm border-2 border-emerald-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">🦘</span>
          <span className="tracking-wider text-xs font-mono font-bold">JUMP!</span>
        </button>

        {/* 복귀 리셋 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            respawnSlime();
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 active:bg-slate-700 text-white font-mono text-xs border border-white/20 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🔄</span>
          <span className="text-[10px]">RESET</span>
        </button>
      </div>

      {/* 승리 및 정산 모달 */}
      {rewardReceipt && (
        <VictoryRewardModal
          receipt={rewardReceipt}
          onClose={handleExit}
        />
      )}
    </div>
  );
};

export default PokiSlimeKeyboardGame;
