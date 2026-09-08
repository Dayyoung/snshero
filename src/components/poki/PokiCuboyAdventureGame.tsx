import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCuboyAdventureGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;

  onClose?: () => void;
}

interface Platform3D {
  mesh: THREE.Mesh;
  box: THREE.Box3;
  type: 'solid' | 'moving' | 'spring' | 'spike';
  vx?: number;
  minX?: number;
  maxX?: number;
}

interface Star3D {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  collected: boolean;
}

export const PokiCuboyAdventureGame: React.FC<PokiCuboyAdventureGameProps> = ({
  onBack,
  onExit,
  cardId = 44,
  lowSpecMode = false,
  playSfx,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [stars, setStars] = useState(0); // 0 ~ 3
  const [lives, setLives] = useState(3);
  const [bossHp, setBossHp] = useState(60);
  const [score, setScore] = useState(0);
  const [inBossFight, setInBossFight] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // 모바일 터치 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickDelta, setJoystickDelta] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const inputDirRef = useRef({ x: 0, z: 0 });

  // 3D 씬 레퍼런스
  const gameLoopRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animId: 0,
    isGameOver: false,
    isGameWon: false,
    scoreVal: 0,
    starsVal: 0,
    livesVal: 3,
    lastCheckpoint: new THREE.Vector3(0, 1.2, 0),

    // 플레이어 큐보이
    player: {
      group: null as THREE.Group | null,
      cape: null as THREE.Mesh | null,
      pos: new THREE.Vector3(0, 1.2, 0), // 시작 20m 안전 섬 중앙 안착
      vel: new THREE.Vector3(0, 0, 0),
      isGrounded: false,
      jumpsLeft: 2,
      isDashing: false,
      dashTimer: 0,
      invulnerableTimer: 0,
    },

    platforms: [] as Platform3D[],
    starsList: [] as Star3D[],

    // 보스 큐브 골렘
    boss: {
      group: null as THREE.Group | null,
      pos: new THREE.Vector3(0, 0, -75),
      hp: 60,
      maxHp: 60,
      slamTimer: 2.5,
      isSlamming: false,
      slamY: 0,
      defeated: false,
    },

    // 차원 포털
    portal: {
      group: null as THREE.Group | null,
      pos: new THREE.Vector3(0, 1.5, -83),
      active: false,
    },

    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
  });


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
      gameId: 'poki_cuboy_adventure',
      gameTitle: 'Cuboy Adventure 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: 35,
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
    scene.background = new THREE.Color(0x0a1424);
    scene.fog = new THREE.FogExp2(0x0a1424, 0.018);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 150);
    camera.position.set(0, 9.5, 14);
    camera.lookAt(0, 1.5, -5);
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

    // 3. 몽환적인 스카이 조명
    const ambientLight = new THREE.AmbientLight(0xdde8ff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.3);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      const d = 25;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    scene.add(dirLight);

    // 4. 3D 부유 아일랜드 플랫폼 코스 구축
    const platMatSolid = new THREE.MeshStandardMaterial({
      color: 0x2e8b57, // 잔디 복셀 그린
      roughness: 0.5,
      metalness: 0.1,
    });
    const platMatMoving = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // 블루 부유석
      roughness: 0.4,
      metalness: 0.3,
    });
    const platMatSpring = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // 오렌지 스프링 패드
      roughness: 0.3,
      metalness: 0.5,
    });

    const addPlatform = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      type: 'solid' | 'moving' | 'spring' | 'spike',
      moveRange?: { minX: number; maxX: number; vx: number }
    ) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mat =
        type === 'moving'
          ? platMatMoving
          : type === 'spring'
          ? platMatSpring
          : platMatSolid;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = !lowSpecMode;
      mesh.castShadow = !lowSpecMode;
      scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      gameLoopRef.current.platforms.push({
        mesh,
        box,
        type,
        vx: moveRange?.vx,
        minX: moveRange?.minX,
        maxX: moveRange?.maxX,
      });
    };

    // A. 시작 안전 광폭 스타트 아일랜드 (폭 12m x 깊이 18m, Z: +5 ~ -13)
    addPlatform(0, 0, -4, 12, 1.2, 18, 'solid');

    // B. 부유 이동 발판 1 (Z: -20, 좌우 왕복)
    addPlatform(0, 0.4, -20, 5, 0.8, 4, 'moving', { minX: -4.5, maxX: 4.5, vx: 3.2 });

    // C. 가시 트랩 발판 (Z: -32)
    addPlatform(0, 0.8, -32, 7, 1.0, 7, 'solid');
    // 회전 가시 롤러 메쉬
    const spikeGeo = new THREE.CylinderGeometry(0.35, 0.35, 6.5, 12);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0xff3344, metalness: 0.8 });
    const spikeRoller = new THREE.Mesh(spikeGeo, spikeMat);
    spikeRoller.rotation.z = Math.PI / 2;
    spikeRoller.position.set(0, 1.8, -32);
    scene.add(spikeRoller);

    // D. 부유 이동 발판 2 (Z: -42)
    addPlatform(2, 1.4, -42, 5, 0.8, 4, 'moving', { minX: -4.0, maxX: 4.0, vx: -3.0 });

    // E. 스프링 바운스 섬 (Z: -54)
    addPlatform(0, 1.8, -54, 8, 1.0, 8, 'solid');
    // 스프링 패드
    addPlatform(0, 2.45, -54, 2.5, 0.3, 2.5, 'spring');

    // F. 결승 보스 아레나 섬 (Z: -65 ~ -85, 폭 14m x 깊이 20m)
    addPlatform(0, 1.8, -75, 14, 1.5, 20, 'solid');

    // 5. 황금 별 3개 (3D Star 메쉬)
    const createStarMesh = (x: number, y: number, z: number): Star3D => {
      const sGroup = new THREE.Group();
      const sGeo = new THREE.OctahedronGeometry(0.55, 0);
      const sMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        roughness: 0.2,
        metalness: 0.8,
      });
      const star = new THREE.Mesh(sGeo, sMat);
      sGroup.add(star);

      sGroup.position.set(x, y, z);
      scene.add(sGroup);

      return { mesh: sGroup, pos: new THREE.Vector3(x, y, z), collected: false };
    };

    const starsList = [
      createStarMesh(0, 2.2, -20),
      createStarMesh(0, 3.2, -32),
      createStarMesh(0, 3.8, -54),
    ];
    gameLoopRef.current.starsList = starsList;

    // 6. 플레이어 큐보이(Cuboy) 모델링
    const pGroup = new THREE.Group();
    // 큐브 몸통
    const bodyGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    body.castShadow = !lowSpecMode;
    pGroup.add(body);

    // 카툰 눈
    const eyeGeo = new THREE.BoxGeometry(0.2, 0.25, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.25, 0.55, -0.46);
    pGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.25, 0.55, -0.46);
    pGroup.add(eyeR);

    // 빨간 망토
    const capeGeo = new THREE.BoxGeometry(0.75, 0.9, 0.08);
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 0.35, 0.48);
    pGroup.add(cape);

    pGroup.position.set(0, 1.2, 0);
    scene.add(pGroup);
    gameLoopRef.current.player.group = pGroup;
    gameLoopRef.current.player.cape = cape;

    // 7. 결승 보스 큐브 골렘 (Cube Golem Titan, HP 60)
    const bossGroup = new THREE.Group();
    // 거대 몸체
    const bBodyGeo = new THREE.BoxGeometry(3.2, 3.0, 2.5);
    const bBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7, metalness: 0.3 });
    const bBody = new THREE.Mesh(bBodyGeo, bBodyMat);
    bBody.position.y = 3.2;
    bBody.castShadow = !lowSpecMode;
    bossGroup.add(bBody);

    // 빛나는 붉은 눈
    const bEyeGeo = new THREE.BoxGeometry(2.2, 0.4, 0.3);
    const bEyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const bEye = new THREE.Mesh(bEyeGeo, bEyeMat);
    bEye.position.set(0, 3.6, 1.3);
    bossGroup.add(bEye);

    // 골렘 머리 상단 스탬프 타깃 패드
    const headPadGeo = new THREE.BoxGeometry(2.4, 0.25, 2.0);
    const headPadMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const headPad = new THREE.Mesh(headPadGeo, headPadMat);
    headPad.position.set(0, 4.8, 0);
    bossGroup.add(headPad);

    bossGroup.position.set(0, 1.8, -75);
    scene.add(bossGroup);
    gameLoopRef.current.boss.group = bossGroup;

    // 8. 차원 탈출 포털
    const portalGroup = new THREE.Group();
    const portalRingGeo = new THREE.TorusGeometry(1.8, 0.25, 16, 32);
    const portalRingMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x4c1d95,
      roughness: 0.2,
      metalness: 0.8,
    });
    const portalRing = new THREE.Mesh(portalRingGeo, portalRingMat);
    portalGroup.add(portalRing);

    const portalCoreGeo = new THREE.CircleGeometry(1.6, 24);
    const portalCoreMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const portalCore = new THREE.Mesh(portalCoreGeo, portalCoreMat);
    portalGroup.add(portalCore);

    portalGroup.position.set(0, 4.0, -83);
    scene.add(portalGroup);
    gameLoopRef.current.portal.group = portalGroup;

    // 9. 리사이즈 핸들러
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

    // 10. 메인 루프
    let lastTime = performance.now();

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const g = gameLoopRef.current;
      const p = g.player;
      const b = g.boss;

      if (!g.isGameOver && !g.isGameWon) {
        // --- 플랫폼 업데이트 (이동 발판 & 가시 롤러) ---
        spikeRoller.rotation.x += dt * 4.0;

        g.platforms.forEach((plat) => {
          if (plat.type === 'moving' && plat.vx !== undefined && plat.minX !== undefined && plat.maxX !== undefined) {
            plat.mesh.position.x += plat.vx * dt;
            if (plat.mesh.position.x > plat.maxX || plat.mesh.position.x < plat.minX) {
              plat.vx *= -1;
            }
            plat.box.setFromObject(plat.mesh);
          }
        });

        // --- 별 회전 & 수집 판정 ---
        g.starsList.forEach((star) => {
          if (!star.collected) {
            star.mesh.rotation.y += dt * 3.0;
            star.mesh.rotation.x += dt * 1.5;

            const dist = p.pos.distanceTo(star.pos);
            if (dist < 1.6) {
              star.collected = true;
              scene.remove(star.mesh);
              g.starsVal += 1;
              setStars(g.starsVal);
              g.scoreVal += 150;
              setScore(g.scoreVal);

              triggerHaptic([30, 40]);
              if (playSfx) playSfx('powerup');
            }
          }
        });

        // --- 대시 타이머 ---
        if (p.isDashing) {
          p.dashTimer -= dt;
          if (p.dashTimer <= 0) p.isDashing = false;
        }

        // --- 무적 타이머 ---
        if (p.invulnerableTimer > 0) {
          p.invulnerableTimer -= dt;
          if (p.group) p.group.visible = Math.floor(p.invulnerableTimer * 10) % 2 === 0;
        } else {
          if (p.group) p.group.visible = true;
        }

        // --- 플레이어 물리 & 이동 ---
        const moveSpeed = p.isDashing ? 15.0 : 7.2;
        const inX = inputDirRef.current.x;
        const inZ = inputDirRef.current.z;

        p.pos.x += inX * moveSpeed * dt;
        p.pos.z += inZ * moveSpeed * dt;

        // 중력 적용
        p.vel.y -= 26.0 * dt;
        p.pos.y += p.vel.y * dt;

        // 발판 충돌 판정 (AABB)
        let onGround = false;
        const playerRadius = 0.45;
        const playerFootY = p.pos.y;

        g.platforms.forEach((plat) => {
          const bMin = plat.box.min;
          const bMax = plat.box.max;

          // X/Z 범위 내에 있고, Y 방향으로 위에서 아래로 착지 중일 때
          if (
            p.pos.x >= bMin.x - playerRadius &&
            p.pos.x <= bMax.x + playerRadius &&
            p.pos.z >= bMin.z - playerRadius &&
            p.pos.z <= bMax.z + playerRadius
          ) {
            if (playerFootY >= bMax.y - 0.4 && playerFootY <= bMax.y + 0.5 && p.vel.y <= 0) {
              // 착지!
              p.pos.y = bMax.y;
              p.vel.y = 0;
              onGround = true;
              p.isGrounded = true;
              p.jumpsLeft = 2; // 더블 점프 리셋

              // 이동 발판 위에 서 있으면 발판 속도 함께 받음
              if (plat.type === 'moving' && plat.vx !== undefined) {
                p.pos.x += plat.vx * dt;
              }

              // 스프링 패드 밟았을 때 수퍼 점프!
              if (plat.type === 'spring') {
                p.vel.y = 16.5;
                p.isGrounded = false;
                triggerHaptic([40, 60]);
                if (playSfx) playSfx('jump');
              }

              // 안전 체크포인트 갱신 (Z가 더 전진했을 때)
              if (p.pos.z < g.lastCheckpoint.z) {
                g.lastCheckpoint.copy(p.pos);
              }
            }
          }
        });

        if (!onGround && p.isGrounded) {
          p.isGrounded = false;
        }

        // --- 플레이어 메쉬 위치 & 망토 펄럭임 ---
        if (p.group) {
          p.group.position.copy(p.pos);

          if (Math.hypot(inX, inZ) > 0.1) {
            p.group.rotation.y = Math.atan2(inX, inZ);
          }

          if (p.cape) {
            const wind = Math.sin(now * 0.01) * 0.35 + (p.isDashing ? 0.8 : 0.2);
            p.cape.rotation.x = wind;
          }
        }

        // --- 낙하(추락) 감지 -> 리스폰 ---
        if (p.pos.y < -8.0) {
          g.livesVal -= 1;
          setLives(g.livesVal);
          triggerHaptic([60, 100, 150]);

          if (g.livesVal <= 0) {
            g.isGameOver = true;
            setGameOver(true);
            handleClaimReward(false, g.scoreVal);
            return;
          } else {
            // 최근 안전 체크포인트로 리스폰
            p.pos.copy(g.lastCheckpoint);
            p.pos.y += 2.0;
            p.vel.set(0, 0, 0);
            p.invulnerableTimer = 2.0;
          }
        }

        // --- 보스 아레나 진입 및 보스 AI ---
        if (p.pos.z < -64.0) {
          setInBossFight(true);

          if (!b.defeated) {
            // 보스 슬램 공격 타이머
            b.slamTimer -= dt;
            if (b.slamTimer <= 0) {
              b.slamTimer = 3.2;
              b.isSlamming = true;
              b.slamY = 2.5; // 공중으로 솟구침
            }

            if (b.isSlamming) {
              b.slamY -= 15.0 * dt;
              if (b.slamY <= 0) {
                b.slamY = 0;
                b.isSlamming = false;
                triggerHaptic(40);

                // 지면 착지 충격파: 플레이어가 지상에 있고 거리 5m 이내면 넉백 피격
                if (p.isGrounded && p.pos.distanceTo(b.pos) < 6.0 && p.invulnerableTimer <= 0) {
                  p.vel.y = 8.0;
                  g.livesVal -= 1;
                  setLives(g.livesVal);
                  p.invulnerableTimer = 1.5;
                  triggerHaptic([50, 60]);
                  if (playSfx) playSfx('hit');

                  if (g.livesVal <= 0) {
                    g.isGameOver = true;
                    setGameOver(true);
                    handleClaimReward(false, g.scoreVal);
                    return;
                  }
                }
              }
            }

            if (b.group) {
              b.group.position.set(b.pos.x, 1.8 + b.slamY, b.pos.z);
            }

            // 플레이어가 공중에서 골렘 머리 스탬프 어택 판정!
            // 골렘 머리 위치: (b.pos.x, 6.6, b.pos.z)
            const headDistXZ = Math.hypot(p.pos.x - b.pos.x, p.pos.z - b.pos.z);
            if (headDistXZ < 1.8 && p.pos.y >= 5.8 && p.pos.y <= 7.2 && p.vel.y < 0) {
              // 스탬프 적중!
              b.hp -= 20;
              setBossHp(Math.max(0, b.hp));
              p.vel.y = 13.0; // 튕겨오름
              g.scoreVal += 200;
              setScore(g.scoreVal);

              triggerHaptic([60, 80, 120]);
              if (playSfx) playSfx('explosion');

              if (b.hp <= 0) {
                b.defeated = true;
                scene.remove(bossGroup);
                g.portal.active = true;
                triggerHaptic([80, 120, 200]);
              }
            }
          }
        }

        // --- 차원 포털 회전 & 탈출 승리 ---
        portalRing.rotation.z += dt * 2.0;
        portalCore.rotation.z -= dt * 3.0;

        if (b.defeated || p.pos.z < -81.0) {
          const distToPortal = p.pos.distanceTo(g.portal.pos);
          if (distToPortal < 2.5) {
            g.isGameWon = true;
            setGameWon(true);
            triggerHaptic([50, 100, 150, 250]);
            handleClaimReward(true, g.scoreVal + 300);
            return;
          }
        }

        // --- 카메라 추종 (3인칭 쿼터뷰) ---
        if (g.camera) {
          const camTargetX = p.pos.x * 0.5;
          const camTargetZ = p.pos.z + 14.0;
          g.camera.position.x += (camTargetX - g.camera.position.x) * 0.08;
          g.camera.position.z += (camTargetZ - g.camera.position.z) * 0.1;
          g.camera.lookAt(p.pos.x * 0.3, p.pos.y + 1.2, p.pos.z - 5.0);
        }
      }

      if (g.renderer && g.scene && g.camera) {
        g.renderer.render(g.scene, g.camera);
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
  }, [lowSpecMode, handleClaimReward, playSfx, triggerHaptic]);

  // 점프 액션 (더블 점프)
  const handleJump = useCallback(() => {
    const p = gameLoopRef.current.player;
    if (p.jumpsLeft > 0 && !gameLoopRef.current.isGameOver) {
      p.jumpsLeft -= 1;
      p.vel.y = 11.2;
      p.isGrounded = false;
      triggerHaptic(25);
      if (playSfx) playSfx('jump');
    }
  }, [playSfx, triggerHaptic]);

  // 공중 대시 액션
  const handleDash = useCallback(() => {
    const p = gameLoopRef.current.player;
    if (!p.isDashing && !gameLoopRef.current.isGameOver) {
      p.isDashing = true;
      p.dashTimer = 0.35;
      triggerHaptic([30, 20]);
      if (playSfx) playSfx('dash');
    }
  }, [playSfx, triggerHaptic]);

  // 가상 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setJoystickActive(true);
    setJoystickPos({ x: touch.clientX, y: touch.clientY });
    setJoystickDelta({ x: 0, y: 0 });
    inputDirRef.current = { x: 0, z: 0 };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - joystickPos.x;
        const dy = touch.clientY - joystickPos.y;
        const maxDist = 55;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const nx = Math.cos(angle) * (clampedDist / maxDist);
        const ny = Math.sin(angle) * (clampedDist / maxDist);

        setJoystickDelta({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
        // 카메라 기준: 오른쪽 = +X, 위쪽 = -Z (전진)
        inputDirRef.current = { x: nx, z: ny };
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setJoystickDelta({ x: 0, y: 0 });
        inputDirRef.current = { x: 0, z: 0 };
        break;
      }
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-sky-950 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 3D 렌더러 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 HUD */}
      <MinimalistMissionHUD
        gameTitle="Cuboy Adventure 3D"
        score={score}
        targetScore={100}
        onBack={handleExit} onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 상단 미션 대시보드 */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3">
          {/* 수집 별 */}
          <div className="bg-slate-900/90 border border-yellow-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-yellow-400 font-bold block">STARS</span>
            <span className="text-base text-yellow-300 font-black">{stars} / 3 ⭐</span>
          </div>

          {/* 생명 하트 */}
          <div className="bg-slate-900/90 border border-red-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-red-400 font-bold block">LIVES</span>
            <span className="text-base text-red-400 font-black">
              {'❤️'.repeat(Math.max(0, lives))}
            </span>
          </div>

          {/* 보스 HP (보스전 진입 시) */}
          {inBossFight && (
            <div className="bg-slate-900/90 border border-purple-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
              <span className="text-[10px] text-purple-400 font-bold block">TITAN GOLEM</span>
              <span className="text-base text-purple-300 font-black">{bossHp} / 60</span>
            </div>
          )}
        </div>

        {/* 영웅 배지 */}
        <div className="w-12 h-14 bg-slate-900/90 border border-amber-500/40 rounded-sm overflow-hidden flex flex-col items-center justify-center p-0.5">
          <canvas ref={heroCanvasRef} width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-[9px] text-amber-300 font-black leading-none mt-0.5">No.{cardId}</span>
        </div>
      </div>

      {/* 다이나믹 플로팅 가상 조이스틱 UI */}
      {joystickActive && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: joystickPos.x - 45,
            top: joystickPos.y - 45,
            width: 90,
            height: 90,
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-sky-500/50 bg-sky-950/30 flex items-center justify-center backdrop-blur-xs">
            <div
              className="w-10 h-10 rounded-full bg-sky-500/80 border border-white/80 shadow-md transform"
              style={{
                transform: `translate(${joystickDelta.x}px, ${joystickDelta.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 우측 하단 대시 & 2단 점프 버튼 패널 */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20 pointer-events-auto">
        {/* 공중 대시 버튼 */}
        <button
          onClick={handleDash}
          className="w-16 h-16 rounded-full bg-cyan-600/90 active:bg-cyan-400 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-cyan-300/80 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-base">💨</span>
          <span>DASH</span>
        </button>

        {/* 특대형 점프 버튼 (76px) */}
        <button
          onClick={handleJump}
          className="w-20 h-20 rounded-full bg-amber-500/90 active:bg-amber-400 text-white font-black text-sm flex flex-col items-center justify-center border-2 border-amber-300/90 shadow-xl active:scale-95 transition-transform"
        >
          <span className="text-2xl">🦘</span>
          <span>JUMP</span>
        </button>
      </div>

      {/* 좌측 하단 가이드 */}
      {!joystickActive && (
        <div className="absolute bottom-8 left-6 text-xs text-slate-300 pointer-events-none z-10 flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/50">
          <span>🕹️ 화면 터치 드래그로 큐보이 이동</span>
        </div>
      )}

      {/* 중도 포기 확인 모달 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">모험을 포기할까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              현재까지 수집한 별과 전진 거리 점수에 비례한 SNS 포인트가 정산됩니다.
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
                  try {
                    calculateAndDepositMissionReward({
                      gameId: 'poki_cuboy_adventure',
                      gameTitle: 'Cuboy Adventure 3D',
                      isVictory: false,
                      score: score || 0,
                      maxTargetScore: 100,
                      durationSeconds: 30,
                    });
                  } catch (e) {}
                  handleExit();
                  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hero-return-to-missions'));
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-sm"
              >
                포기하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="Cuboy Adventure 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '3개 별 수집 & 타이탄 골렘 격파',
              desc: '공중 부유 섬을 돌파하며 별 3개를 모으고 거대 골렘을 쓰러뜨려 포털로 탈출하세요!',
            },
            {
              iconType: 'GESTURES',
              title: '2단 점프 & 머리 스탬프 어택',
              desc: '[JUMP]를 연속 2번 눌러 더블 점프하고, 골렘 머리 위로 뛰어내려 3회 스탬프 공격하세요.',
            },
            {
              iconType: 'REWARDS',
              title: '차원 탈출 SNS 보상',
              desc: '포털 탈출 성공 시 최대 50 SNS 포인트를 영구 획득합니다.',
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
