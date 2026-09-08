import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlumgiMergeGameProps {
  onBack: () => void;

  onExit?: () => void;
  onClose?: () => void;
}

const MAX_BOSS_HP = 800;

interface CreatureData {
  id: number;
  tier: number;
  slotIdx: number;
  group: THREE.Group;
  basePos: THREE.Vector3;
  animPos: THREE.Vector3;
  isAttacking: boolean;
  attackProgress: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

const TIER_INFO = [
  { name: '꼬꼬 치킨', power: 25, color: 0xfacc15, scale: 0.65 },
  { name: '턱시도 펭귄', power: 60, color: 0x0284c7, scale: 0.75 },
  { name: '지혜의 부엉이', power: 130, color: 0x854d0e, scale: 0.85 },
  { name: '불사조 피닉스', power: 260, color: 0xea580c, scale: 0.95 },
  { name: '썬더 드래곤', power: 550, color: 0x16a34a, scale: 1.1 },
];

// 3x3 슬롯 위치 (Z=0 평면)
const SLOT_POSITIONS: Array<{ x: number; y: number }> = [
  { x: -2.2, y: -1.0 }, { x: 0, y: -1.0 }, { x: 2.2, y: -1.0 },
  { x: -2.2, y: -2.4 }, { x: 0, y: -2.4 }, { x: 2.2, y: -2.4 },
  { x: -2.2, y: -3.8 }, { x: 0, y: -3.8 }, { x: 2.2, y: -3.8 },
];

export const PokiBlumgiMergeGame: React.FC<PokiBlumgiMergeGameProps> = ({
  onBack,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [bossHp, setBossHp] = useState(MAX_BOSS_HP);
  const [currentScore, setCurrentScore] = useState(0);
  const [totalPower, setTotalPower] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [toastText, setToastText] = useState('');

  const startTimeRef = useRef<number>(Date.now());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);

  // 보스 오브젝트
  const bossGroupRef = useRef<THREE.Group | null>(null);
  const bossHpBarRef = useRef<THREE.Mesh | null>(null);
  const bossState = useRef({
    hp: MAX_BOSS_HP,
    hitAnim: 0,
    baseY: 2.2,
  });

  // 크리처 리스트
  const creaturesRef = useRef<CreatureData[]>([]);
  const nextCreatureId = useRef(1);

  // 드래그 상태
  const activeDragRef = useRef<{
    creature: CreatureData;
    offset: THREE.Vector3;
  } | null>(null);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const planeIntersect = useRef(new THREE.Vector3());

  // 파티클
  const particlesRef = useRef<Particle[]>([]);

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

  // 파티클 스폰
  const spawnParticles = (pos: THREE.Vector3, color: number, count = 25) => {
    if (!sceneRef.current) return;
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const p: Particle = {
        mesh,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        vz: (Math.random() - 0.5) * 6,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      };
      sceneRef.current.add(mesh);
      particlesRef.current.push(p);
    }
  };

  // 3D 크리처 모델 생성 헬퍼
  const createCreatureMesh = (tier: number) => {
    const info = TIER_INFO[tier];
    const group = new THREE.Group();

    // 본체 구체
    const bodyGeo = new THREE.SphereGeometry(info.scale * 0.7, 24, 24);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: info.color,
      roughness: 0.25,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // 눈 2개
    const eyeGeo = new THREE.SphereGeometry(info.scale * 0.12, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-info.scale * 0.25, info.scale * 0.15, info.scale * 0.6);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(info.scale * 0.25, info.scale * 0.15, info.scale * 0.6);
    group.add(eyeR);

    // 티어별 부가 장식 (부리, 뿔, 날개)
    if (tier === 0) {
      // 치킨 부리
      const beak = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.25, 12),
        new THREE.MeshStandardMaterial({ color: 0xf97316 })
      );
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0, info.scale * 0.75);
      group.add(beak);
    } else if (tier === 1) {
      // 펭귄 화이트 배
      const belly = new THREE.Mesh(
        new THREE.SphereGeometry(info.scale * 0.55, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      belly.position.set(0, -info.scale * 0.1, info.scale * 0.35);
      group.add(belly);
    } else if (tier >= 3) {
      // 피닉스/드래곤 뿔 & 볏
      const horn1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 })
      );
      horn1.position.set(-0.3, info.scale * 0.8, 0);
      horn1.rotation.z = 0.35;
      group.add(horn1);

      const horn2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24 })
      );
      horn2.position.set(0.3, info.scale * 0.8, 0);
      horn2.rotation.z = -0.35;
      group.add(horn2);
    }

    // 티어 표시 별 배지
    const starGeo = new THREE.RingGeometry(info.scale * 0.65, info.scale * 0.75, 4);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const star = new THREE.Mesh(starGeo, starMat);
    star.rotation.z = Math.PI / 4;
    star.position.set(0, -info.scale * 0.6, 0.1);
    group.add(star);

    return group;
  };

  // 총 전투력 계산
  const recalcPower = useCallback(() => {
    const power = creaturesRef.current.reduce((acc, c) => acc + TIER_INFO[c.tier].power, 0);
    setTotalPower(power);
  }, []);

  // 새 크리처 소환
  const spawnCreature = useCallback((tier = 0) => {
    if (creaturesRef.current.length >= 9) {
      showToast('⚠️ 슬롯이 가득 찼습니다! 합체해 슬롯을 비우세요.');
      return;
    }
    const scene = sceneRef.current;
    if (!scene) return;

    // 빈 슬롯 찾기
    const occupied = new Set(creaturesRef.current.map((c) => c.slotIdx));
    let targetSlot = -1;
    for (let i = 0; i < 9; i++) {
      if (!occupied.has(i)) {
        targetSlot = i;
        break;
      }
    }
    if (targetSlot === -1) return;

    const group = createCreatureMesh(tier);
    const slotPos = SLOT_POSITIONS[targetSlot];
    group.position.set(slotPos.x, slotPos.y, 0);
    scene.add(group);

    const newCreature: CreatureData = {
      id: nextCreatureId.current++,
      tier,
      slotIdx: targetSlot,
      group,
      basePos: new THREE.Vector3(slotPos.x, slotPos.y, 0),
      animPos: new THREE.Vector3(slotPos.x, slotPos.y, 0),
      isAttacking: false,
      attackProgress: 0,
    };

    creaturesRef.current.push(newCreature);
    triggerHaptic(40);
    spawnParticles(new THREE.Vector3(slotPos.x, slotPos.y, 0), TIER_INFO[tier].color, 15);
    recalcPower();
    showToast(`🐣 ${TIER_INFO[tier].name} 소환!`);
  }, [recalcPower]);

  // 보스 총공격 (All-out Attack)
  const attackBoss = useCallback(() => {
    if (gameWon || creaturesRef.current.length === 0) return;
    triggerHaptic(80);

    // 총 공격력
    const power = creaturesRef.current.reduce((acc, c) => acc + TIER_INFO[c.tier].power, 0);

    // 모든 크리처 공격 애니메이션 시작
    creaturesRef.current.forEach((c) => {
      c.isAttacking = true;
      c.attackProgress = 0;
    });

    // 보스 피격 애니메이션 & HP 감소
    bossState.current.hitAnim = 0.35;
    const nextHp = Math.max(0, bossState.current.hp - power);
    bossState.current.hp = nextHp;
    setBossHp(nextHp);
    setCurrentScore((s) => s + power);

    // 보스 피격 스파크 파티클
    if (bossGroupRef.current) {
      spawnParticles(bossGroupRef.current.position, 0xef4444, 35);
    }

    showToast(`⚔️ 총공격! 보스에게 ${power} 대미지!`);

    // HP 바 스케일 갱신
    if (bossHpBarRef.current) {
      const pct = nextHp / MAX_BOSS_HP;
      bossHpBarRef.current.scale.set(Math.max(0.01, pct), 1, 1);
    }

    // 보스 처치 검사
    if (nextHp <= 0 && !gameWon) {
      setGameWon(true);
      triggerHaptic(150);
      if (bossGroupRef.current) {
        spawnParticles(bossGroupRef.current.position, 0xfbbf24, 60);
      }

      setTimeout(() => {
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const receipt = calculateAndDepositMissionReward({
          gameId: 'poki-105',
          gameTitle: 'Blumgi Merge 3D',
          isVictory: true,
          score: 500,
          maxTargetScore: 500,
          durationSeconds: dur,
        });
        setRewardReceipt(receipt);
      }, 900);
    }
  }, [gameWon]);

  // Three.js 초기화
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬 & 카메라
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c16);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 100);
    camera.position.set(0, -0.4, 9.8);
    camera.lookAt(0, -0.4, 0);
    cameraRef.current = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    dirLight.position.set(4, 10, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const bossPointLight = new THREE.PointLight(0xef4444, 2.5, 12);
    bossPointLight.position.set(0, 2.5, 2);
    scene.add(bossPointLight);

    // 배경 벽면
    const wallGeo = new THREE.PlaneGeometry(24, 16);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 0, -3);
    scene.add(wall);

    // 상단 No.105 공식 카드 영웅 배지 홀로그램 깃발
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#064e3b';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#10b981';
      bctx.lineWidth = 10;
      bctx.strokeRect(6, 6, 244, 244);
      drawCardSprite(bctx, 105, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    badgeMesh.position.set(0, 4.4, -2.8);
    scene.add(badgeMesh);

    // ==========================================
    // 3D 거대 보스 골렘 모델링
    // ==========================================
    const bossGroup = new THREE.Group();
    bossGroup.position.set(0, bossState.current.baseY, 0);
    scene.add(bossGroup);
    bossGroupRef.current = bossGroup;

    // 몸체 (스톤 골렘)
    const bossBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.0, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.3 })
    );
    bossGroup.add(bossBody);

    // 붉은 발광 눈 2개
    const bossEyeGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const bossEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const bEyeL = new THREE.Mesh(bossEyeGeo, bossEyeMat);
    bEyeL.position.set(-0.55, 0.3, 0.85);
    bossGroup.add(bEyeL);

    const bEyeR = new THREE.Mesh(bossEyeGeo, bossEyeMat);
    bEyeR.position.set(0.55, 0.3, 0.85);
    bossGroup.add(bEyeR);

    // 암석 주먹 2개 (플로팅)
    const fistGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const fistMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const fistL = new THREE.Mesh(fistGeo, fistMat);
    fistL.position.set(-1.8, -0.2, 0.4);
    bossGroup.add(fistL);

    const fistR = new THREE.Mesh(fistGeo, fistMat);
    fistR.position.set(1.8, -0.2, 0.4);
    bossGroup.add(fistR);

    // 보스 HP 바 3D 게이지
    const hpBgGeo = new THREE.PlaneGeometry(4.0, 0.35);
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x374151 });
    const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
    hpBg.position.set(0, 1.45, 0);
    bossGroup.add(hpBg);

    const hpFillGeo = new THREE.PlaneGeometry(3.9, 0.28);
    hpFillGeo.translate(1.95, 0, 0); // 좌측 정렬 피벗
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const hpFill = new THREE.Mesh(hpFillGeo, hpFillMat);
    hpFill.position.set(-1.95, 1.45, 0.02);
    bossGroup.add(hpFill);
    bossHpBarRef.current = hpFill;

    // ==========================================
    // 3x3 슬롯 원형 발판 베이스
    // ==========================================
    const slotPlateGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.1, 24);
    const slotPlateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.3,
    });
    const slotRingGeo = new THREE.RingGeometry(0.92, 1.0, 24);
    const slotRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });

    SLOT_POSITIONS.forEach((pos) => {
      const plate = new THREE.Mesh(slotPlateGeo, slotPlateMat);
      plate.rotation.x = Math.PI / 2;
      plate.position.set(pos.x, pos.y, -0.15);
      scene.add(plate);

      const ring = new THREE.Mesh(slotRingGeo, slotRingMat);
      ring.position.set(pos.x, pos.y, -0.09);
      scene.add(ring);
    });

    // 초기 스타팅 크리처 소환 (4마리)
    spawnCreature(0);
    spawnCreature(0);
    spawnCreature(0);
    spawnCreature(1);

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

    // 애니메이션 렌더 루프
    let lastTime = performance.now();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // 1. 보스 호버링 & 피격 애니메이션
      if (bossGroupRef.current) {
        const b = bossState.current;
        const hoverY = b.baseY + Math.sin(now * 0.003) * 0.15;
        bossGroupRef.current.position.y = hoverY;

        if (b.hitAnim > 0) {
          b.hitAnim -= dt;
          bossGroupRef.current.position.x = (Math.random() - 0.5) * 0.3;
          bossGroupRef.current.position.y += (Math.random() - 0.5) * 0.3;
        } else {
          bossGroupRef.current.position.x = 0;
        }
      }

      // 2. 크리처 공격 돌진 애니메이션
      creaturesRef.current.forEach((c) => {
        if (c.isAttacking) {
          c.attackProgress += dt * 2.8;
          if (c.attackProgress >= 1.0) {
            c.isAttacking = false;
            c.attackProgress = 0;
            c.group.position.copy(c.basePos);
          } else {
            // 포물선 돌진 (basePos ➔ bossPos ➔ basePos)
            const p = c.attackProgress;
            const targetY = bossState.current.baseY;
            if (p < 0.5) {
              const t = p * 2;
              c.group.position.x = THREE.MathUtils.lerp(c.basePos.x, 0, t);
              c.group.position.y = THREE.MathUtils.lerp(c.basePos.y, targetY - 0.8, t);
              c.group.position.z = Math.sin(t * Math.PI) * 1.5;
            } else {
              const t = (p - 0.5) * 2;
              c.group.position.x = THREE.MathUtils.lerp(0, c.basePos.x, t);
              c.group.position.y = THREE.MathUtils.lerp(targetY - 0.8, c.basePos.y, t);
              c.group.position.z = Math.sin((1 - t) * Math.PI) * 1.5;
            }
          }
        }
      });

      // 3. 파티클 업데이트
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        p.vy -= 9.8 * dt;
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
          parts.splice(i, 1);
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
  }, [spawnCreature]);

  // ==========================================
  // 레이캐스팅 터치 드래그 & 머지 로직
  // ==========================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameWon) return;
    const container = mountRef.current;
    if (!container || !cameraRef.current) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    // 크리처 클릭 감지
    const hitCreature = creaturesRef.current.find((c) => {
      const intersects = raycaster.current.intersectObjects(c.group.children, true);
      return intersects.length > 0;
    });

    if (hitCreature && !hitCreature.isAttacking) {
      triggerHaptic(30);
      hitCreature.group.position.z = 0.5; // 앞으로 살짝 띄우기
      activeDragRef.current = {
        creature: hitCreature,
        offset: new THREE.Vector3(),
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragRef.current || !cameraRef.current) return;
    const container = mountRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    if (raycaster.current.ray.intersectPlane(dragPlane.current, planeIntersect.current)) {
      activeDragRef.current.creature.group.position.x = planeIntersect.current.x;
      activeDragRef.current.creature.group.position.y = planeIntersect.current.y;
    }
  };

  const handlePointerUp = () => {
    if (!activeDragRef.current || !sceneRef.current) return;
    const dragged = activeDragRef.current.creature;
    activeDragRef.current = null;
    dragged.group.position.z = 0;

    // 가장 가까운 다른 크리처와 머지 검사
    const targetCreature = creaturesRef.current.find((other) => {
      if (other.id === dragged.id) return false;
      const dist = Math.hypot(
        dragged.group.position.x - other.group.position.x,
        dragged.group.position.y - other.group.position.y
      );
      return dist < 1.1;
    });

    // 동일 티어 합체 머지 성공!
    if (targetCreature && targetCreature.tier === dragged.tier && targetCreature.tier < 4) {
      triggerHaptic(90);
      const nextTier = dragged.tier + 1;

      // 두 크리처 제거
      sceneRef.current.remove(dragged.group);
      sceneRef.current.remove(targetCreature.group);

      creaturesRef.current = creaturesRef.current.filter(
        (c) => c.id !== dragged.id && c.id !== targetCreature.id
      );

      // 상위 티어 크리처 생성
      const targetSlot = targetCreature.slotIdx;
      const slotPos = SLOT_POSITIONS[targetSlot];
      const newGroup = createCreatureMesh(nextTier);
      newGroup.position.set(slotPos.x, slotPos.y, 0);
      sceneRef.current.add(newGroup);

      const evolvedCreature: CreatureData = {
        id: nextCreatureId.current++,
        tier: nextTier,
        slotIdx: targetSlot,
        group: newGroup,
        basePos: new THREE.Vector3(slotPos.x, slotPos.y, 0),
        animPos: new THREE.Vector3(slotPos.x, slotPos.y, 0),
        isAttacking: false,
        attackProgress: 0,
      };

      creaturesRef.current.push(evolvedCreature);
      spawnParticles(new THREE.Vector3(slotPos.x, slotPos.y, 0), 0xfbbf24, 30);
      recalcPower();
      showToast(`✨ MERGE! ${TIER_INFO[nextTier].name} 진화 탄생!`);
      return;
    }

    // 다른 슬롯으로 위치 이동 (빈 슬롯 스냅)
    let closestSlot = dragged.slotIdx;
    let minDist = 999;
    SLOT_POSITIONS.forEach((pos, idx) => {
      const dist = Math.hypot(dragged.group.position.x - pos.x, dragged.group.position.y - pos.y);
      if (dist < minDist) {
        minDist = dist;
        closestSlot = idx;
      }
    });

    const isSlotOccupied = creaturesRef.current.some(
      (c) => c.slotIdx === closestSlot && c.id !== dragged.id
    );

    if (!isSlotOccupied && minDist < 1.4) {
      dragged.slotIdx = closestSlot;
      dragged.basePos.set(SLOT_POSITIONS[closestSlot].x, SLOT_POSITIONS[closestSlot].y, 0);
    }

    // 원위치 복귀
    dragged.group.position.copy(dragged.basePos);
  };

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki-105',
      gameTitle: 'Blumgi Merge 3D',
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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0a0c16]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 3D 뷰포트 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="BLUMGI MERGE 3D"
        missionTarget={`보스 골렘 토벌: HP ${bossHp}/${MAX_BOSS_HP}`}
        currentScore={currentScore}
        onBack={onBack}
        onForfeit={handleForfeit}
      />

      {/* 상단 토스트 피드백 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {toastText ? (
          <div className="bg-amber-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/50">
            {toastText}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs text-emerald-400 border border-emerald-500/30 font-mono">
            ⚔️ 총 공격력: <span className="text-white font-bold">{totalPower} DPS</span> | 동일 크리처를 드래그해 머지하세요!
          </div>
        )}
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 패널 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-20 pointer-events-auto">
        {/* 새 크리처 소환 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            spawnCreature(0);
          }}
          className="w-16 h-16 rounded-full bg-emerald-700/90 active:bg-emerald-600 text-white font-mono text-xs border border-emerald-400/40 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">➕</span>
          <span className="text-[10px]">SPAWN</span>
        </button>

        {/* 대형 총공격 돌진 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            attackBoss();
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-red-500 to-rose-700 active:from-red-600 active:to-rose-800 text-white font-black text-sm border-2 border-red-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">⚔️</span>
          <span className="tracking-wider text-xs font-mono font-bold">ATTACK!</span>
        </button>

        {/* 자동 머지/정리 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            showToast('💡 동일한 크리처들을 손가락으로 드래그해 겹치면 진화합니다!');
            triggerHaptic(30);
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 active:bg-slate-700 text-white font-mono text-xs border border-white/20 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">💡</span>
          <span className="text-[10px]">GUIDE</span>
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

export default PokiBlumgiMergeGame;
