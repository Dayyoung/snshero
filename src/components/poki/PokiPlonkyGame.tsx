import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiPlonkyGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  mesh: THREE.Mesh;
  isMoving?: boolean;
  moveRange?: number;
  speed?: number;
  initialX?: number;
}

interface Hazard {
  type: 'saw' | 'spike';
  mesh: THREE.Object3D;
  x: number;
  y: number;
  radius: number;
  isMoving?: boolean;
  initialY?: number;
  moveRange?: number;
  speed?: number;
}

interface RopeAnchor {
  x: number;
  y: number;
  mesh: THREE.Mesh;
}

interface StarCoin {
  x: number;
  y: number;
  mesh: THREE.Mesh;
  collected: boolean;
}

export const PokiPlonkyGame: React.FC<PokiPlonkyGameProps> = ({
  deck = [],
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const playerHeroId = deck[0]?.id || 18;
  const containerRef = useRef<HTMLDivElement>(null);
  const heroSpriteCanvasRef = useRef<HTMLCanvasElement>(null);

  // 게임 상태
  const [score, setScore] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(3);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [isRoping, setIsRoping] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // 튜토리얼
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_plonky') !== 'true';
    } catch {
      return true;
    }
  });

  // 조이스틱 상태
  const [joystick, setJoystick] = useState<{ active: boolean; startX: number; startY: number; curX: number; curY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
  });

  // 물리 시뮬레이션 Ref
  const stateRef = useRef({
    player: {
      pos: new THREE.Vector3(2, 2.5, 0),
      vel: new THREE.Vector3(0, 0, 0),
      isGrounded: false,
      hearts: 3,
      invulnerableTimer: 0,
      squash: 1.0,
    },
    rope: {
      active: false,
      anchor: null as RopeAnchor | null,
      length: 5.5,
      angle: 0,
      angularVel: 0,
      lineMesh: null as THREE.Line | null,
    },
    touchDirX: 0,
    keys: { a: false, d: false, space: false, rope: false },
    platforms: [] as Platform[],
    hazards: [] as Hazard[],
    anchors: [] as RopeAnchor[],
    stars: [] as StarCoin[],
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    totalGoalX: 85,
  });

  // 영웅 카드 스프라이트 페이스 캐싱
  useEffect(() => {
    if (!heroSpriteCanvasRef.current) return;
    const ctx = heroSpriteCanvasRef.current.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, playerHeroId, 0, 0, 64, 64);
  }, [playerHeroId]);

  // Three.js 씬 초기화 및 게임 루프
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬, 카메라, 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    camera.position.set(0, 7, 20);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.3);
    dirLight.position.set(15, 25, 15);
    dirLight.castShadow = !lowSpecMode;
    scene.add(dirLight);

    // 1. 발판 (Platforms) 구축
    stateRef.current.platforms = [];
    const platMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 });
    const platEdgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const createPlatform = (x: number, y: number, w: number, h: number, isMoving = false, moveRange = 0, speed = 0) => {
      const geo = new THREE.BoxGeometry(w, h, 4);
      const mesh = new THREE.Mesh(geo, platMat);
      mesh.position.set(x, y - h / 2, 0);
      mesh.receiveShadow = !lowSpecMode;
      scene.add(mesh);

      // 상단 네온 엣지 라인
      const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 4.05), platEdgeMat);
      edge.position.set(0, h / 2 + 0.05, 0);
      mesh.add(edge);

      const p: Platform = { x, y, w, h, mesh, isMoving, moveRange, speed, initialX: x };
      stateRef.current.platforms.push(p);
      return p;
    };

    // 1) 시작 광폭 안전 플랫폼 (X: -2 ~ 18m, 시작 급사 원천 차단)
    createPlatform(8, 0, 20, 3);

    // 2) 가시 계곡 및 이동 발판 (X: 24 ~ 38m)
    createPlatform(24, 0.5, 6, 2, true, 3.5, 1.8);
    createPlatform(34, 1.5, 6, 2);

    // 3) 공중 로프 앵커 진입 발판 (X: 42m)
    createPlatform(42, 2.5, 5, 2);

    // 4) 로프 스윙 착지 발판 (X: 62m)
    createPlatform(62, 2.0, 7, 2);

    // 5) 다층 점프 계단 발판들 (X: 70 ~ 78m)
    createPlatform(71, 3.5, 4, 1.5);
    createPlatform(77, 5.0, 4, 1.5);

    // 6) 최종 골 대지 (X: 84 ~ 95m)
    createPlatform(88, 3.0, 14, 3);

    // 2. 공중 로프 앵커들 (X: 49, 56, Y: 8.5)
    stateRef.current.anchors = [];
    const anchorPositions = [{ x: 49, y: 8.5 }, { x: 56, y: 8.5 }];
    anchorPositions.forEach((pos) => {
      const aMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      aMesh.position.set(pos.x, pos.y, 0);
      scene.add(aMesh);

      // 앵커 펄스 링
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.85, 24), new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide }));
      ring.position.set(pos.x, pos.y, 0);
      scene.add(ring);

      stateRef.current.anchors.push({ x: pos.x, y: pos.y, mesh: aMesh });
    });

    // 3. 로프 렌더링 라인 메쉬
    const ropeGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
    const ropeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
    const ropeLine = new THREE.Line(ropeGeo, ropeMat);
    ropeLine.visible = false;
    scene.add(ropeLine);
    stateRef.current.rope.lineMesh = ropeLine;

    // 4. 회전 강철 톱날 장애물들 (Sawblades)
    stateRef.current.hazards = [];
    const createSaw = (x: number, y: number, radius = 1.3, isMoving = false, moveRange = 0, speed = 0) => {
      const group = new THREE.Group();
      group.position.set(x, y, 0);

      const bladeGeo = new THREE.CylinderGeometry(radius, radius, 0.1, 16);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.x = Math.PI / 2;
      group.add(blade);

      // 톱니 장식
      const teethGeo = new THREE.RingGeometry(radius - 0.2, radius + 0.3, 16);
      const teethMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
      const teeth = new THREE.Mesh(teethGeo, teethMat);
      group.add(teeth);

      scene.add(group);

      const h: Hazard = { type: 'saw', mesh: group, x, y, radius, isMoving, initialY: y, moveRange, speed };
      stateRef.current.hazards.push(h);
    };

    // 톱날 배치
    createSaw(24, 3.2, 1.2, true, 2.0, 2.2);
    createSaw(52, 3.0, 1.6, true, 3.0, 1.8);
    createSaw(74, 6.2, 1.2, false);

    // 바닥 계곡 가시밭 (X: 19 ~ 60, Y: -2.5)
    for (let x = 19; x < 60; x += 1.2) {
      const spikeGeo = new THREE.ConeGeometry(0.5, 1.2, 4);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8 });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(x, -2.0, 0);
      scene.add(spike);

      stateRef.current.hazards.push({
        type: 'spike',
        mesh: spike,
        x,
        y: -2.0,
        radius: 0.6,
      });
    }

    // 5. 황금 스타 코인 15개
    stateRef.current.stars = [];
    const starGeo = new THREE.OctahedronGeometry(0.4, 0);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    const starPositions = [
      { x: 12, y: 1.5 }, { x: 16, y: 2.2 }, { x: 24, y: 4.5 }, { x: 30, y: 3.5 },
      { x: 36, y: 3.0 }, { x: 44, y: 4.5 }, { x: 49, y: 5.5 }, { x: 53, y: 5.8 },
      { x: 56, y: 5.5 }, { x: 64, y: 3.8 }, { x: 71, y: 5.2 }, { x: 77, y: 6.8 },
      { x: 82, y: 5.0 }, { x: 86, y: 4.2 }, { x: 90, y: 4.2 }
    ];

    starPositions.forEach((pos) => {
      const sMesh = new THREE.Mesh(starGeo, starMat);
      sMesh.position.set(pos.x, pos.y, 0);
      scene.add(sMesh);
      stateRef.current.stars.push({ x: pos.x, y: pos.y, mesh: sMesh, collected: false });
    });

    // 6. 골 플래그 & 포털 (X = 92, Y = 3.0)
    const goalGroup = new THREE.Group();
    goalGroup.position.set(92, 3.0, 0);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.0), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    pole.position.y = 2.0;
    goalGroup.add(pole);

    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide }));
    flag.position.set(0.6, 3.4, 0);
    goalGroup.add(flag);

    const aura = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.5, 32), new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide }));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.05;
    goalGroup.add(aura);

    scene.add(goalGroup);

    // 7. 주인공 Plonky 메쉬 (라운드 큐브)
    const plonkyGroup = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 }); // 상큼한 오렌지 젤리
    const pBody = new THREE.Mesh(bodyGeo, bodyMat);
    pBody.castShadow = !lowSpecMode;
    plonkyGroup.add(pBody);

    // 큰 눈알 2개
    const eyeGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.25, 0.15, 0.4);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyePupilMat);
    pupilL.position.set(0, 0, 0.12);
    eyeL.add(pupilL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(-0.25, 0.15, 0.4);
    const pupilR = pupilL.clone();
    eyeR.add(pupilR);

    plonkyGroup.add(eyeL, eyeR);
    plonkyGroup.position.set(2, 2.5, 0);
    scene.add(plonkyGroup);

    // 파티클 생성 함수
    const spawnSparks = (pos: THREE.Vector3, color: number, count = 10) => {
      for (let i = 0; i < (lowSpecMode ? count / 2 : count); i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({ color }));
        p.position.copy(pos);
        scene.add(p);
        stateRef.current.particles.push({
          mesh: p,
          vel: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 5 + 2, (Math.random() - 0.5) * 4),
          life: 0.5 + Math.random() * 0.3,
        });
      }
    };

    // 키보드 리스너
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = true;
      if (k === ' ' || k === 'w' || k === 'arrowup') executeJump();
      if (k === 'e' || k === 'shift') toggleRope(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = false;
      if (k === 'e' || k === 'shift') toggleRope(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 리사이즈
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 메인 물리 루프
    let animId = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const pState = stateRef.current.player;
      const ropeState = stateRef.current.rope;

      // 1. 이동 발판 업데이트
      stateRef.current.platforms.forEach((plat) => {
        if (plat.isMoving && plat.initialX !== undefined && plat.moveRange && plat.speed) {
          plat.x = plat.initialX + Math.sin(time * 0.001 * plat.speed) * plat.moveRange;
          plat.mesh.position.x = plat.x;
        }
      });

      // 2. 톱날 애니메이션
      stateRef.current.hazards.forEach((haz) => {
        if (haz.type === 'saw') {
          haz.mesh.rotation.z -= 15 * dt; // 맹렬한 회전
          if (haz.isMoving && haz.initialY !== undefined && haz.moveRange && haz.speed) {
            haz.y = haz.initialY + Math.sin(time * 0.001 * haz.speed) * haz.moveRange;
            haz.mesh.position.y = haz.y;
          }
        }
      });

      // 3. 플레이어 좌우 입력
      let inputX = 0;
      if (stateRef.current.keys.a) inputX -= 1;
      if (stateRef.current.keys.d) inputX += 1;
      if (stateRef.current.touchDirX !== 0) inputX += stateRef.current.touchDirX;

      // 4. 로프 스윙 물리 vs 일반 플랫폼 물리
      if (ropeState.active && ropeState.anchor) {
        // 진자 운동 (Pendulum Physics)
        const gravity = 25;
        const angularAcc = -(gravity / ropeState.length) * Math.sin(ropeState.angle);
        ropeState.angularVel += (angularAcc + inputX * 6.0) * dt;
        ropeState.angularVel *= 0.99; // 감쇠
        ropeState.angle += ropeState.angularVel * dt;

        // 플레이어 위치 제약 계산
        const ax = ropeState.anchor.x;
        const ay = ropeState.anchor.y;
        pState.pos.x = ax + Math.sin(ropeState.angle) * ropeState.length;
        pState.pos.y = ay - Math.cos(ropeState.angle) * ropeState.length;

        // 선 속도 업데이트
        pState.vel.x = Math.cos(ropeState.angle) * ropeState.angularVel * ropeState.length;
        pState.vel.y = Math.sin(ropeState.angle) * ropeState.angularVel * ropeState.length;
        pState.isGrounded = false;

        // 로프 비주얼 라인 동기화
        if (ropeState.lineMesh) {
          const posAttr = ropeState.lineMesh.geometry.attributes.position as THREE.BufferAttribute;
          posAttr.setXYZ(0, ax, ay, 0);
          posAttr.setXYZ(1, pState.pos.x, pState.pos.y, 0);
          posAttr.needsUpdate = true;
          ropeState.lineMesh.visible = true;
        }
      } else {
        if (ropeState.lineMesh) ropeState.lineMesh.visible = false;

        // 일반 물리
        const moveSpeed = 8.5;
        pState.vel.x = inputX * moveSpeed;
        pState.pos.x += pState.vel.x * dt;

        // 중력
        if (!pState.isGrounded) {
          pState.vel.y -= 28 * dt;
          pState.pos.y += pState.vel.y * dt;
        }

        // 발판 충돌 검사
        let landed = false;
        stateRef.current.platforms.forEach((plat) => {
          const halfW = plat.w / 2 + 0.4;
          if (pState.pos.x >= plat.x - halfW && pState.pos.x <= plat.x + halfW) {
            // 발판 상단 착지 검사
            if (pState.pos.y >= plat.y && pState.pos.y <= plat.y + 0.8 && pState.vel.y <= 0) {
              pState.pos.y = plat.y + 0.45;
              pState.vel.y = 0;
              landed = true;
            }
          }
        });
        pState.isGrounded = landed;
      }

      // 무적 타이머
      if (pState.invulnerableTimer > 0) pState.invulnerableTimer -= dt;

      // 낙하 사망 판정 (Y < -6)
      if (pState.pos.y < -6 && !isGameOver && !isVictory) {
        handlePlayerHit(true);
      }

      // 5. 함정 충돌 검사
      if (pState.invulnerableTimer <= 0) {
        stateRef.current.hazards.forEach((haz) => {
          const dx = pState.pos.x - haz.x;
          const dy = pState.pos.y - haz.y;
          const dist = Math.hypot(dx, dy);
          if (dist < haz.radius + 0.4) {
            handlePlayerHit(false);
          }
        });
      }

      // 6. 스타 코인 수집 검사
      stateRef.current.stars.forEach((star) => {
        if (!star.collected) {
          star.mesh.rotation.y += 2.5 * dt;
          const dist = pState.pos.distanceTo(new THREE.Vector3(star.x, star.y, 0));
          if (dist < 1.3) {
            star.collected = true;
            star.mesh.visible = false;
            setScore((s) => s + 60);
            spawnSparks(new THREE.Vector3(star.x, star.y, 0), 0xfacc15, 12);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            if (navigator.vibrate) navigator.vibrate(25);
          }
        }
      });

      // 7. 골 플래그 도착 승리 검사 (X >= 91)
      if (pState.pos.x >= 91 && !isVictory && !isGameOver) {
        handleVictory();
      }

      // 진행도 퍼센트 업데이트
      const pct = Math.min(100, Math.max(0, Math.floor((pState.pos.x / 91) * 100)));
      setProgressPct(pct);

      // 플레이어 메쉬 동기화
      plonkyGroup.position.set(pState.pos.x, pState.pos.y, 0);
      plonkyGroup.visible = pState.invulnerableTimer > 0 ? Math.floor(time / 80) % 2 === 0 : true;

      // 카메라 부드러운 사이드 트래킹
      camera.position.x += (pState.pos.x + 3.0 - camera.position.x) * 0.1;
      camera.position.y += (Math.max(4.5, pState.pos.y + 2.5) - camera.position.y) * 0.1;
      camera.lookAt(pState.pos.x + 1.0, pState.pos.y + 0.8, 0);

      // 파티클 업데이트
      for (let i = stateRef.current.particles.length - 1; i >= 0; i--) {
        const p = stateRef.current.particles[i];
        p.vel.y -= 9.8 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          stateRef.current.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    // 점프 실행
    const executeJump = () => {
      const pState = stateRef.current.player;
      const ropeState = stateRef.current.rope;

      if (ropeState.active) {
        // 로프 스윙 중 도약 (전방으로 강한 탈출 점프)
        ropeState.active = false;
        setIsRoping(false);
        pState.vel.x += Math.cos(ropeState.angle) * ropeState.angularVel * 5.0;
        pState.vel.y = 12.0;
        spawnSparks(pState.pos, 0x38bdf8, 15);
        if (navigator.vibrate) navigator.vibrate(35);
        return;
      }

      if (pState.isGrounded) {
        pState.vel.y = 12.5;
        pState.isGrounded = false;
        spawnSparks(pState.pos, 0xf97316, 8);
        if (navigator.vibrate) navigator.vibrate(25);
      }
    };

    // 로프 토글 (버튼 누를 때 앵커 탐색 & 연결)
    const toggleRope = (active: boolean) => {
      const pState = stateRef.current.player;
      const ropeState = stateRef.current.rope;

      if (active) {
        // 가장 가까운 앵커 찾기
        let closest: RopeAnchor | null = null;
        let minDist = 8.5;

        stateRef.current.anchors.forEach((a) => {
          const d = Math.hypot(pState.pos.x - a.x, pState.pos.y - a.y);
          if (d < minDist && a.y > pState.pos.y) {
            minDist = d;
            closest = a;
          }
        });

        if (closest) {
          ropeState.active = true;
          ropeState.anchor = closest;
          ropeState.length = minDist;
          ropeState.angle = Math.atan2(pState.pos.x - (closest as RopeAnchor).x, (closest as RopeAnchor).y - pState.pos.y);
          ropeState.angularVel = (pState.vel.x / minDist) * 1.5;
          setIsRoping(true);
          spawnSparks(new THREE.Vector3((closest as RopeAnchor).x, (closest as RopeAnchor).y, 0), 0xfde047, 12);
          if (navigator.vibrate) navigator.vibrate(40);
        }
      } else {
        if (ropeState.active) {
          ropeState.active = false;
          setIsRoping(false);
          // 전방 관성 전달
          pState.vel.y = Math.max(pState.vel.y, 6.0);
        }
      }
    };

    // 피격 처리
    const handlePlayerHit = (isFall: boolean) => {
      const pState = stateRef.current.player;
      stateRef.current.rope.active = false;
      setIsRoping(false);

      pState.hearts -= 1;
      setHearts(pState.hearts);
      pState.invulnerableTimer = 1.2;

      spawnSparks(pState.pos, 0xef4444, 20);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      if (navigator.vibrate) navigator.vibrate([40, 50, 40]);

      if (pState.hearts <= 0) {
        setIsGameOver(true);
        const receipt = calculateAndDepositMissionReward({
          gameId: 'poki_plonky',
          gameTitle: 'Plonky 3D Platformer',
          durationSeconds: 30,
          score,
          maxTargetScore: 1800,
          isVictory: false,
        });
        setSettlementReceipt(receipt);
        onReward(receipt.totalSns);
      } else {
        // 안전 부활 위치로 복귀 (직전 안전 발판)
        pState.pos.set(Math.max(2, pState.pos.x - 12), 4.0, 0);
        pState.vel.set(0, 0, 0);
      }
    };

    // 승리 처리
    const handleVictory = () => {
      setIsVictory(true);
      const finalScore = score + 1000;
      setScore(finalScore);
      const receipt = calculateAndDepositMissionReward({
        gameId: 'poki_plonky',
        gameTitle: 'Plonky 3D Platformer',
        durationSeconds: 45,
        score: finalScore,
        maxTargetScore: 1800,
        isVictory: true,
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
    };

    (container as any).__executeJump = executeJump;
    (container as any).__toggleRope = toggleRope;

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx, score]);

  // 점프/로프 터치 핸들러
  const onJumpClick = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__executeJump) {
      (containerRef.current as any).__executeJump();
    }
  }, []);

  const onRopeTouchStart = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__toggleRope) {
      (containerRef.current as any).__toggleRope(true);
    }
  }, []);

  const onRopeTouchEnd = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__toggleRope) {
      (containerRef.current as any).__toggleRope(false);
    }
  }, []);

  // 모바일 터치 조이스틱 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX > window.innerWidth * 0.65) return;

    setJoystick({
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      curX: touch.clientX,
      curY: touch.clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!joystick.active) return;
    const touch = (Array.from(e.touches) as React.Touch[]).find((t) => t.clientX < window.innerWidth * 0.7);
    if (!touch) return;

    const dx = touch.clientX - joystick.startX;
    const maxDist = 45;
    const clampedDx = THREE.MathUtils.clamp(dx, -maxDist, maxDist);

    setJoystick((prev) => ({ ...prev, curX: joystick.startX + clampedDx, curY: touch.clientY }));

    // 화면 기준 오른쪽 = +X, 왼쪽 = -X 100% 일치
    stateRef.current.touchDirX = clampedDx / maxDist;
  }, [joystick.active, joystick.startX]);

  const handleTouchEnd = useCallback(() => {
    setJoystick({ active: false, startX: 0, startY: 0, curX: 0, curY: 0 });
    stateRef.current.touchDirX = 0;
  }, []);

  // 튜토리얼 스텝
  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '플롱키 3D 모험의 세계' : 'Plonky 3D Platformer',
      badge: 'PLONKY 3D',
      description: isKo
        ? '위험천만한 함정과 회전 톱날을 피하고, 밧줄 스윙으로 계곡을 건너 골 플래그에 도달하세요!'
        : 'Dodge sawblades and traps, swing across chasms with rope, and reach the goal flag!',
      keyPoints: isKo
        ? ['좌측 화면 터치 드래그로 좌우 이동', '가시밭과 톱날을 피해 황금 별을 모으세요']
        : ['Drag on left screen to move left/right', 'Avoid spikes and saws while collecting stars'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '점프 & 공중 로프 스윙' : 'Jump & Rope Swing Action',
      badge: 'CONTROLS',
      description: isKo
        ? '공중에 떠 있는 노란색 앵커 근처에서 [로프] 버튼을 누르면 밧줄을 걸고 시계추 스윙을 합니다.'
        : 'Near yellow anchors in the air, hold [ROPE] to latch and swing like a pendulum!',
      keyPoints: isKo
        ? ['우측 80px [점프] 버튼으로 플랫폼 도약', '우측 68px [로프] 버튼을 꾹 누르면 공중 밧줄 스윙']
        : ['80px [JUMP] to leap between platforms', 'Hold 68px [ROPE] to grapple and swing across pits'],
      iconType: 'GESTURES',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="Plonky 3D Platformer"
        score={score}
        targetScore={1500}
        timeLeft={0}
        onQuit={onExit}
        isKo={isKo}
        rewardUnit="SNS"
        customStatLabel={isKo ? '골 도달' : 'PROGRESS'}
        customStatValue={`${progressPct}% (90m)`}
      />

      {/* 하트 체력 & 영웅 카드 HUD */}
      <div className="absolute top-16 left-4 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 border border-orange-500/40">
        <canvas ref={heroSpriteCanvasRef} width={40} height={40} className="w-10 h-10 border border-orange-400 bg-slate-800" />
        <div className="flex flex-col">
          <span className="text-[10px] text-orange-300 font-bold">{isKo ? '플롱키 체력' : 'PLONKY HP'}</span>
          <div className="flex gap-1 mt-0.5">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`text-base ${i <= hearts ? 'text-red-500' : 'text-slate-600'}`}>
                ♥
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 로프 스윙 상태 배지 */}
      {isRoping && (
        <div className="absolute top-16 right-4 z-20 bg-cyan-950/80 backdrop-blur-md px-3 py-1.5 border border-cyan-400 text-xs font-black text-cyan-300 animate-pulse">
          🪢 ROPE SWING ACTIVE!
        </div>
      )}

      {/* 모바일 다이나믹 플로팅 가상 조이스틱 */}
      {joystick.active && (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: joystick.startX - 40,
            top: joystick.startY - 40,
            width: 80,
            height: 80,
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-orange-400/60 bg-orange-950/40 backdrop-blur-xs flex items-center justify-center animate-pulse" />
          <div
            className="absolute rounded-full w-8 h-8 bg-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.8)] border border-white"
            style={{
              left: 40 - 16 + (joystick.curX - joystick.startX),
              top: 40 - 16,
            }}
          />
        </div>
      )}

      {/* 우측 퓨어 터치 조작 패널 (점프 & 로프 버튼) */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        {/* 로프 스윙 버튼 (누르고 있는 동안 스윙) */}
        <button
          type="button"
          onMouseDown={() => onRopeTouchStart()}
          onMouseUp={() => onRopeTouchEnd()}
          onTouchStart={(e) => { e.preventDefault(); onRopeTouchStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); onRopeTouchEnd(); }}
          className={`w-[68px] h-[68px] rounded-sm border-2 font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-lg transition-all ${
            isRoping
              ? 'bg-cyan-500 border-cyan-200 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
              : 'bg-slate-800/90 border-cyan-400 text-cyan-200 active:bg-cyan-700'
          }`}
        >
          <span className="text-xl">🪢</span>
          <span className="mt-0.5 text-[10px] tracking-tight">{isKo ? '로프' : 'ROPE'}</span>
        </button>

        {/* 대형 점프 버튼 (80px 최적 터치 타깃) */}
        <button
          type="button"
          onClick={onJumpClick}
          className="w-20 h-20 rounded-sm bg-orange-500 border-2 border-orange-200 text-slate-950 font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-[0_0_20px_rgba(249,115,22,0.7)] active:bg-orange-400 transition-transform"
        >
          <span className="text-2xl">▲</span>
          <span className="mt-0.5 tracking-wider font-extrabold">{isKo ? '점프' : 'JUMP'}</span>
        </button>
      </div>

      {/* 좌측 하단 키보드 가이드 */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:block text-slate-400 text-xs bg-slate-900/80 px-3 py-2 border border-slate-700">
        <div>[A/D / 좌우터치]: 좌우 이동</div>
        <div>[Space / W / 점프]: 플랫폼 점프</div>
        <div>[E / Shift / 로프]: 공중 밧줄 스윙</div>
      </div>

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_plonky', 'true');
            } catch {
              // ignore
            }
          }}
          isKo={isKo}
        />
      )}

      {/* 패배 모달 */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-red-500 p-6 max-w-sm w-full text-center">
            <h2 className="text-2xl font-black text-red-500 mb-2">{isKo ? '게임 오버' : 'GAME OVER'}</h2>
            <p className="text-slate-300 text-sm mb-4">
              {isKo ? '모든 하트가 소진되었습니다!' : 'All hearts have been depleted!'}
            </p>
            <div className="bg-slate-800 p-3 mb-4 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>{isKo ? '도달 거리' : 'Progress'}:</span>
                <span className="text-orange-400 font-bold">{progressPct}% (90m)</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최종 점수' : 'Score'}:</span>
                <span className="text-amber-400 font-bold">{score}</span>
              </div>
              {settlementReceipt && (
                <div className="flex justify-between text-orange-300 pt-1 border-t border-slate-700">
                  <span>{isKo ? '지급 보상' : 'Reward'}:</span>
                  <span className="font-bold">+{settlementReceipt.totalSns} SNS</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onExit}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm border border-red-400 transition-colors"
            >
              {isKo ? '확인 및 나가기' : 'CONFIRM & EXIT'}
            </button>
          </div>
        </div>
      )}

      {/* 승리 및 보상 모달 */}
      {isVictory && settlementReceipt && (
        <VictoryRewardModal
          isOpen={isVictory}
          receipt={settlementReceipt}
          onClaim={() => {
            setIsVictory(false);
            onExit();
          }}
          isKo={isKo}
        />
      )}
    </div>
  );
};

export default PokiPlonkyGame;
