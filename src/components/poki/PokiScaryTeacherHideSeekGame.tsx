import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Eye, EyeOff, Footprints, AlertTriangle, Key, RotateCcw, Volume2, VolumeX, Sparkles, Shield } from 'lucide-react';

interface PokiScaryTeacherHideSeekGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface PrankItem {
  id: number;
  name: string;
  x: number;
  z: number;
  collected: boolean;
  mesh: THREE.Group;
}

interface HideSpot {
  name: string;
  x: number;
  z: number;
  radius: number;
  mesh: THREE.Mesh;
}

export default function PokiScaryTeacherHideSeekGame({
  onClose,
  onBack,
  cardId = 71,
  onExit
}: PokiScaryTeacherHideSeekGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 HUD 상태
  const [itemsCollected, setItemsCollected] = useState(0);
  const [isHiding, setIsHiding] = useState(false);
  const [isSneaking, setIsSneaking] = useState(false);
  const [isSpotted, setIsSpotted] = useState(false);
  const [nearHideSpot, setNearHideSpot] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 플로팅 가상 조이스틱 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });

  const inputRef = useRef({
    moveX: 0,
    moveZ: 0,
    sneak: false,
    hideTrigger: false,
  });

  const stateRef = useRef({
    playerX: -10,
    playerZ: 10,
    playerRot: 0,
    hidden: false,
    sneaking: false,
    spotted: false,
    teacherX: 2,
    teacherZ: 2,
    teacherRot: 0,
    teacherSpeed: 2.2,
    teacherState: 'patrol' as 'patrol' | 'chase' | 'search',
    patrolIndex: 0,
    patrolPoints: [
      { x: 2, z: 2 },
      { x: 8, z: -4 },
      { x: -4, z: -8 },
      { x: -8, z: 4 },
    ],
    items: [] as PrankItem[],
    hideSpots: [] as HideSpot[],
    collectedCount: 0,
    startTime: Date.now(),
    ended: false,
    playerMesh: null as THREE.Group | null,
    teacherMesh: null as THREE.Group | null,
    coneMesh: null as THREE.Mesh | null,
    exitGateMesh: null as THREE.Group | null,
  });

  // 사운드 합성
  const playSound = useCallback((type: 'collect' | 'hide' | 'unhide' | 'spotted' | 'step' | 'win' | 'lose') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'hide') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'unhide') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'spotted') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.setValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'win') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.2, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.3);
        });
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // AudioContext 미지원 안전 무시
    }
  }, [isMuted]);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬 및 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5); // 서스펜스 다크 하우스
    scene.fog = new THREE.FogExp2(0xfbf3d5, 0.015);

    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.5, 120);
    camera.position.set(-10, 18, 22);
    camera.lookAt(-10, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명 (어두운 저택 분위기 + 앤틱 벽등)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.95);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffe0b2, 0.7);
    mainLight.position.set(5, 25, 15);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // 저택 마루 바닥 (28x28m)
    const floorGeo = new THREE.PlaneGeometry(28, 28);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    // 벽면 테두리 및 실내 칸막이 벽
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.7 });
    const createWall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      return wall;
    };

    // 외벽
    createWall(28, 4, 0.6, 0, 2, -14); // 북쪽 벽
    createWall(28, 4, 0.6, 0, 2, 14); // 남쪽 벽
    createWall(0.6, 4, 28, -14, 2, 0); // 서쪽 벽
    createWall(0.6, 4, 28, 14, 2, 0); // 동쪽 벽

    // 내부 칸막이 벽들
    createWall(10, 4, 0.6, -5, 2, 0);
    createWall(0.6, 4, 10, 0, 2, -5);

    // 탈출용 현관문 (북쪽 벽 x: 0, z: -14)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -13.6);
    const gateFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 3.8, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4 })
    );
    gateFrame.position.y = 1.9;
    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.6, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x00e676 })
    );
    exitSign.position.set(0, 3.5, 0.2);
    gateGroup.add(gateFrame);
    gateGroup.add(exitSign);
    scene.add(gateGroup);
    stateRef.current.exitGateMesh = gateGroup;

    // 은신처(Hide Spots) 4개 가구 오브젝트 배치
    const hideSpots: HideSpot[] = [];

    // 1. 대형 우드 옷장 (Wardrobe: x: -8, z: 2)
    const wardrobeGeo = new THREE.BoxGeometry(2.2, 3.2, 1.4);
    const wardrobeMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.5 });
    const wardrobe = new THREE.Mesh(wardrobeGeo, wardrobeMat);
    wardrobe.position.set(-8, 1.6, 2);
    wardrobe.castShadow = true;
    scene.add(wardrobe);
    hideSpots.push({ name: '우드 옷장', x: -8, z: 2, radius: 2.2, mesh: wardrobe });

    // 2. 가죽 소파 (Sofa: x: 0, z: -2)
    const sofaGeo = new THREE.BoxGeometry(3.2, 1.2, 1.6);
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
    const sofa = new THREE.Mesh(sofaGeo, sofaMat);
    sofa.position.set(0, 0.6, -2);
    sofa.castShadow = true;
    scene.add(sofa);
    hideSpots.push({ name: '가죽 소파 뒤', x: 0, z: -2, radius: 2.2, mesh: sofa });

    // 3. 대형 다이닝 테이블 (Table: x: 8, z: 4)
    const tableGeo = new THREE.BoxGeometry(3.5, 1.3, 2.2);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(8, 0.65, 4);
    table.castShadow = true;
    scene.add(table);
    hideSpots.push({ name: '식탁 밑', x: 8, z: 4, radius: 2.4, mesh: table });

    // 4. 서재 대형 책장 (Bookshelf: x: -4, z: -8)
    const shelfGeo = new THREE.BoxGeometry(3.0, 3.2, 0.8);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x4e342e });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(-4, 1.6, -8);
    shelf.castShadow = true;
    scene.add(shelf);
    hideSpots.push({ name: '책장 뒤', x: -4, z: -8, radius: 2.2, mesh: shelf });

    stateRef.current.hideSpots = hideSpots;

    // 3종 장난 아이템 배치 (거미, 방귀쿠션, 압정)
    const items: PrankItem[] = [];
    const itemData = [
      { id: 1, name: '장난 거미 🕷️', x: -6, z: -8, color: 0x212121 },
      { id: 2, name: '방귀 쿠션 💨', x: 8, z: -6, color: 0xff5252 },
      { id: 3, name: '장난 압정 📌', x: 6, z: 8, color: 0xffd600 },
    ];

    itemData.forEach((it) => {
      const iGroup = new THREE.Group();
      iGroup.position.set(it.x, 0.5, it.z);

      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35),
        new THREE.MeshStandardMaterial({ color: it.color, roughness: 0.2, metalness: 0.8 })
      );
      marker.castShadow = true;
      iGroup.add(marker);

      // 발광 링
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.65, 16),
        new THREE.MeshBasicMaterial({ color: it.color, side: THREE.DoubleSide })
      );
      ring.rotateX(-Math.PI / 2);
      ring.position.y = -0.45;
      iGroup.add(ring);

      scene.add(iGroup);
      items.push({
        id: it.id,
        name: it.name,
        x: it.x,
        z: it.z,
        collected: false,
        mesh: iGroup,
      });
    });
    stateRef.current.items = items;

    // 플레이어 소년 모델링
    const playerGroup = new THREE.Group();
    playerGroup.position.set(-10, 0, 10);

    // 몸체 (옐로우 후드티)
    const pBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.5 })
    );
    pBody.position.y = 0.75;
    pBody.castShadow = true;
    playerGroup.add(pBody);

    // 머리 & 야구모자
    const pHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffe0bd })
    );
    pHead.position.y = 1.45;
    pHead.castShadow = true;
    const pCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x1976d2 })
    );
    pCap.position.y = 1.65;
    playerGroup.add(pHead);
    playerGroup.add(pCap);

    // 백팩 & No.071 공식 카드 영웅 배지
    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0288d1 })
    );
    backpack.position.set(0, 0.8, -0.35);
    playerGroup.add(backpack);

    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 71, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), bMat);
    badge.position.set(0, 1.95, -0.05);
    badge.rotateY(Math.PI);
    playerGroup.add(badge);

    scene.add(playerGroup);
    stateRef.current.playerMesh = playerGroup;

    // 무서운 선생님 미스 티 (Miss T) 모델링
    const teacherGroup = new THREE.Group();
    teacherGroup.position.set(2, 0, 2);

    // 체구 큰 보라색 드레스 몸체
    const tBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.9, 1.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x7b1fa2, roughness: 0.6 })
    );
    tBody.position.y = 1.1;
    tBody.castShadow = true;
    teacherGroup.add(tBody);

    // 머리 & 파마머리
    const tHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xffccbc })
    );
    tHead.position.y = 2.1;
    tHead.castShadow = true;
    const tHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 })
    );
    tHair.position.set(0, 2.3, -0.1);
    teacherGroup.add(tHead);
    teacherGroup.add(tHair);

    // 회초리 (Ruler)
    const ruler = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.0, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xffeb3b })
    );
    ruler.position.set(0.7, 1.2, 0.4);
    ruler.rotateX(0.4);
    teacherGroup.add(ruler);

    // 시야각 원뿔 (Vision Cone 투광 스포트 메쉬 - 전방 60도, 사거리 7.5m)
    const coneGeo = new THREE.ConeGeometry(4.2, 7.5, 16);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, 3.75);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const visionCone = new THREE.Mesh(coneGeo, coneMat);
    visionCone.position.y = 0.5;
    teacherGroup.add(visionCone);
    stateRef.current.coneMesh = visionCone;

    scene.add(teacherGroup);
    stateRef.current.teacherMesh = teacherGroup;

    // 리사이즈
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
    };
    window.addEventListener('resize', handleResize);

    // 애니메이션 루프
    let lastTime = performance.now();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      const input = inputRef.current;

      if (state.ended) {
        renderer.render(scene, camera);
        return;
      }

      // 플레이어 이동 (Screen-relative 완벽 일치)
      if (!state.hidden) {
        let speed = 4.5;
        if (input.sneak) {
          speed = 2.2;
          state.sneaking = true;
          setIsSneaking(true);
        } else {
          state.sneaking = false;
          setIsSneaking(false);
        }

        if (input.moveX !== 0 || input.moveZ !== 0) {
          state.playerX += input.moveX * speed * dt;
          state.playerZ += input.moveZ * speed * dt;

          // 외벽 충돌 제한 (-13 ~ +13)
          state.playerX = Math.max(-13, Math.min(13, state.playerX));
          state.playerZ = Math.max(-13, Math.min(13, state.playerZ));

          state.playerRot = Math.atan2(input.moveX, input.moveZ);
        }

        if (state.playerMesh) {
          state.playerMesh.position.set(state.playerX, 0, state.playerZ);
          state.playerMesh.rotation.y = THREE.MathUtils.lerp(state.playerMesh.rotation.y, state.playerRot, 0.2);
          state.playerMesh.visible = true;
        }
      } else {
        // 은신 중에는 보이지 않음
        if (state.playerMesh) state.playerMesh.visible = false;
      }

      // 은신처 근처 여부 체크
      let activeSpot: HideSpot | null = null;
      for (const spot of state.hideSpots) {
        const d = Math.hypot(state.playerX - spot.x, state.playerZ - spot.z);
        if (d < spot.radius) {
          activeSpot = spot;
          break;
        }
      }
      setNearHideSpot(activeSpot ? activeSpot.name : null);

      // 아이템 회전 및 수집 판정
      state.items.forEach((it) => {
        if (!it.collected) {
          it.mesh.rotation.y += 2.5 * dt;
          it.mesh.position.y = 0.5 + Math.sin(now * 0.005 + it.id) * 0.15;

          const dist = Math.hypot(state.playerX - it.x, state.playerZ - it.z);
          if (dist < 1.6 && !state.hidden) {
            it.collected = true;
            it.mesh.visible = false;
            state.collectedCount++;
            setItemsCollected(state.collectedCount);
            playSound('collect');
            if (navigator.vibrate) navigator.vibrate(30);
          }
        }
      });

      // 미스 티 순찰 및 추격 AI
      const pDist = Math.hypot(state.playerX - state.teacherX, state.playerZ - state.teacherZ);
      const angleToPlayer = Math.atan2(state.playerX - state.teacherX, state.playerZ - state.teacherZ);

      // 시야각 내 감지 계산 (각도 차이 < 30도 및 사거리 < 7.5m)
      let angleDiff = Math.abs(state.teacherRot - angleToPlayer);
      while (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      const inVisionCone = angleDiff < 0.55 && pDist < 7.5;
      const detected = inVisionCone && !state.hidden;

      if (detected) {
        if (state.teacherState !== 'chase') {
          playSound('spotted');
          if (navigator.vibrate) navigator.vibrate([60, 100, 60]);
        }
        state.teacherState = 'chase';
        state.spotted = true;
        setIsSpotted(true);
        if (state.coneMesh) {
          (state.coneMesh.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
          (state.coneMesh.material as THREE.MeshBasicMaterial).opacity = 0.4;
        }
      } else if (state.hidden && state.teacherState === 'chase') {
        // 숨으면 추격 해제
        state.teacherState = 'patrol';
        state.spotted = false;
        setIsSpotted(false);
        if (state.coneMesh) {
          (state.coneMesh.material as THREE.MeshBasicMaterial).color.setHex(0xff1744);
          (state.coneMesh.material as THREE.MeshBasicMaterial).opacity = 0.22;
        }
      }

      // 미스 티 이동 로직
      if (state.teacherState === 'chase') {
        // 플레이어 추격 (고속)
        const tSpeed = 3.6;
        const dx = state.playerX - state.teacherX;
        const dz = state.playerZ - state.teacherZ;
        const d = Math.hypot(dx, dz);
        if (d > 0.4) {
          state.teacherX += (dx / d) * tSpeed * dt;
          state.teacherZ += (dz / d) * tSpeed * dt;
          state.teacherRot = Math.atan2(dx, dz);
        }

        // 잡힘 판정 (거리 < 1.2m)
        if (d < 1.2 && !state.hidden && !state.ended) {
          state.ended = true;
          setIsGameOver(true);
          playSound('lose');
          if (navigator.vibrate) navigator.vibrate(150);
          const duration = Math.floor((Date.now() - state.startTime) / 1000);
          const res = calculateAndDepositMissionReward({
            gameId: 'scary-teacher-hide-seek',
            gameTitle: '무서운 선생님 숨바꼭질 3D (Scary Teacher)',
            isVictory: false,
            score: state.collectedCount * 200,
            maxTargetScore: 1000,
            durationSeconds: duration,
          });
          setRewardResult(res);
        }
      } else {
        // 일반 순찰
        const targetPt = state.patrolPoints[state.patrolIndex];
        const dx = targetPt.x - state.teacherX;
        const dz = targetPt.z - state.teacherZ;
        const d = Math.hypot(dx, dz);

        if (d > 0.5) {
          state.teacherX += (dx / d) * state.teacherSpeed * dt;
          state.teacherZ += (dz / d) * state.teacherSpeed * dt;
          state.teacherRot = Math.atan2(dx, dz);
        } else {
          state.patrolIndex = (state.patrolIndex + 1) % state.patrolPoints.length;
        }
      }

      // 미스 티 3D 메쉬 동기화
      if (state.teacherMesh) {
        state.teacherMesh.position.set(state.teacherX, 0, state.teacherZ);
        state.teacherMesh.rotation.y = state.teacherRot;
      }

      // 3개 아이템 수집 후 현관문(x: 0, z: -13.6) 탈출 판정
      if (state.collectedCount >= 3) {
        const distToExit = Math.hypot(state.playerX - 0, state.playerZ - (-13.6));
        if (distToExit < 2.5 && !state.ended) {
          state.ended = true;
          setIsGameWon(true);
          playSound('win');
          const duration = Math.floor((Date.now() - state.startTime) / 1000);
          const res = calculateAndDepositMissionReward({
            gameId: 'scary-teacher-hide-seek',
            gameTitle: '무서운 선생님 숨바꼭질 3D (Scary Teacher)',
            isVictory: true,
            score: 1000,
            maxTargetScore: 1000,
            durationSeconds: duration,
          });
          setRewardResult(res);
        }
      }

      // 카메라 부드러운 트래킹
      const targetCamX = state.playerX * 0.5;
      const targetCamZ = state.playerZ * 0.5 + 14;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.1);
      camera.lookAt(targetCamX, 0, targetCamZ - 10);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cardId, playSound]);

  // 플로팅 조이스틱 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x < window.innerWidth * 0.7) {
      setJoystickActive(true);
      setJoystickCenter({ x, y });
      setJoystickKnob({ x: 0, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    const dx = currentX - joystickCenter.x;
    const dy = currentY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const maxR = 48;

    if (dist > 0) {
      const clampedDist = Math.min(dist, maxR);
      const nx = (dx / dist) * clampedDist;
      const ny = (dy / dist) * clampedDist;
      setJoystickKnob({ x: nx, y: ny });

      inputRef.current.moveX = nx / maxR;
      inputRef.current.moveZ = ny / maxR;
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setJoystickKnob({ x: 0, y: 0 });
    inputRef.current.moveX = 0;
    inputRef.current.moveZ = 0;
  };

  // 숨기 토글
  const handleToggleHide = () => {
    const s = stateRef.current;
    if (s.hidden) {
      s.hidden = false;
      setIsHiding(false);
      playSound('unhide');
      if (navigator.vibrate) navigator.vibrate(20);
    } else if (nearHideSpot) {
      s.hidden = true;
      setIsHiding(true);
      playSound('hide');
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5] font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="SCARY TEACHER 3D"
        onQuit={handleExit}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 bg-black/40 text-white rounded border border-white/20 active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        }
      />

      {/* 상단 미션 아이템 및 잠입 상태 인디케이터 */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* 장난 아이템 수집 */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-amber-500/40 flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <div>
            <div className="text-base font-black text-amber-300 leading-none">아이템: {itemsCollected} / 3</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {itemsCollected >= 3 ? '★ 북쪽 현관문으로 탈출하세요! ★' : '저택 안 장난 도구를 찾으세요'}
            </div>
          </div>
        </div>

        {/* 은신 / 발각 경보 */}
        <div className="flex items-center gap-2">
          {isSpotted ? (
            <div className="bg-red-600/90 text-white px-3 py-1.5 rounded-sm text-xs font-black flex items-center gap-1.5 animate-ping">
              <AlertTriangle className="w-4 h-4" /> 발각됨! SPOTTED!
            </div>
          ) : isHiding ? (
            <div className="bg-cyan-600/90 text-white px-3 py-1.5 rounded-sm text-xs font-black flex items-center gap-1.5">
              <EyeOff className="w-4 h-4" /> 은신 중 (HIDDEN)
            </div>
          ) : (
            <div className="bg-zinc-800/80 text-zinc-300 px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 border border-zinc-700">
              <Eye className="w-4 h-4 text-emerald-400" /> 탐색 중
            </div>
          )}
        </div>
      </div>

      {/* 은신처 안내 토스트 배너 */}
      {nearHideSpot && !isHiding && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 bg-emerald-600/90 text-white px-4 py-1.5 rounded-sm text-xs font-bold animate-bounce flex items-center gap-1.5 shadow-lg">
          <Shield className="w-4 h-4 text-white" />
          [{nearHideSpot}] [숨기 HIDE] 버튼을 누를 수 있습니다!
        </div>
      )}

      {/* 다이나믹 플로팅 가상 조이스틱 링 & 놉 */}
      {joystickActive && (
        <div
          className="pointer-events-none absolute z-20 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 bg-black/30 backdrop-blur-xs flex items-center justify-center"
          style={{ left: joystickCenter.x, top: joystickCenter.y }}
        >
          <div
            className="w-10 h-10 rounded-full bg-amber-500/80 border-2 border-white shadow-lg"
            style={{ transform: `translate(${joystickKnob.x}px, ${joystickKnob.y}px)` }}
          />
        </div>
      )}

      {/* 하단 모바일 컨트롤 바 */}
      <div className="absolute bottom-6 right-4 z-20 flex items-center gap-3 pointer-events-none">
        {/* 살금살금 걷기 (SNEAK - 64px) */}
        <button
          onClick={() => {
            inputRef.current.sneak = !inputRef.current.sneak;
            setIsSneaking(inputRef.current.sneak);
            if (navigator.vibrate) navigator.vibrate(15);
          }}
          className={`pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-xs active:scale-95 shadow-lg ${
            isSneaking
              ? 'bg-purple-600 border-purple-300 text-white shadow-purple-500/30'
              : 'bg-zinc-800/80 border-zinc-600 text-zinc-400'
          }`}
        >
          <Footprints className="w-6 h-6 mb-0.5" />
          <span className="text-[10px]">{isSneaking ? '살금살금' : '보통'}</span>
        </button>

        {/* 숨기 토글 (HIDE - 76px 메인 버튼) */}
        <button
          onClick={handleToggleHide}
          disabled={!nearHideSpot && !isHiding}
          className={`pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 flex flex-col items-center justify-center font-black active:scale-90 shadow-xl ${
            isHiding
              ? 'bg-cyan-600 border-cyan-300 text-white shadow-cyan-600/50 active:bg-cyan-500'
              : nearHideSpot
              ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-600/50 animate-pulse'
              : 'bg-zinc-800 border-zinc-600 text-zinc-500 opacity-60'
          }`}
        >
          {isHiding ? <Eye className="w-8 h-8" /> : <EyeOff className="w-8 h-8" />}
          <span className="text-[11px] tracking-wider mt-0.5">{isHiding ? '나오기' : '숨기 HIDE'}</span>
        </button>
      </div>

      {/* 게임 오버 (선생님에게 잡힘) 모달 */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="text-3xl font-black text-red-500 mb-2 animate-bounce">발각되어 잡혔습니다!</div>
          <p className="text-zinc-400 text-xs mb-4">미스 티의 시야각에 노출되어 장난을 들키고 말았습니다.</p>
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-sm w-full max-w-xs mb-6 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">수집한 장난 아이템:</span>
              <span className="font-bold text-amber-400">{itemsCollected} / 3개</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-sm border border-red-400 active:scale-95 flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-4 h-4" /> 다시 도전
            </button>
            <button
              onClick={handleExit}
              className="px-5 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-sm border border-zinc-600 active:scale-95 text-xs"
            >
              나가기
            </button>
          </div>
        </div>
      )}

      {/* 승리 보상 모달 */}
      {isGameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={isGameWon}
          onClose={handleExit}
          reward={rewardResult}
          gameTitle="무서운 선생님 숨바꼭질 3D (Scary Teacher)"
        />
      )}
    </div>
  );
}
