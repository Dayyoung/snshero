import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPetnestGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;

  onClose?: () => void;
}

interface Pet3D {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  type: 'dog' | 'cat' | 'bunny';
  color: number;
  following: boolean;
  rescued: boolean;
  walkAngle: number;
  roamTimer: number;
}

export const PokiPetnestGame: React.FC<PokiPetnestGameProps> = ({
  onBack,
  onExit,
  cardId = 43,
  lowSpecMode = false,
  playSfx,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [rescuedCount, setRescuedCount] = useState(0); // 0 ~ 10
  const [followingCount, setFollowingCount] = useState(0);
  const [lovePoints, setLovePoints] = useState(0);
  const [score, setScore] = useState(0);
  const [whistleCooldown, setWhistleCooldown] = useState(0);
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
    loveVal: 0,
    rescuedVal: 0,
    whistleCooldownTimer: 0,

    player: {
      group: null as THREE.Group | null,
      pos: new THREE.Vector3(0, 0, 4.5), // 공원 입구 안전 안착
      isSprinting: false,
      speed: 6.8,
      history: [] as THREE.Vector3[], // 펫 추종 궤적
    },

    pets: [] as Pet3D[],
    mudPuddles: [
      { x: -5.0, z: 0.0, radius: 2.0 },
      { x: 5.5, z: -1.0, radius: 2.2 },
    ],

    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    shelterPos: new THREE.Vector3(0, 0, -6.5),
    shelterRadius: 3.6,
    parkWidth: 26.0,
    parkDepth: 20.0,
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
      gameId: 'poki_petnest_io',
      gameTitle: 'Petnest.io 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: 30,
    });
    setRewardResult(result);
  }, []);

  // 3D 동물 메쉬 생성 헬퍼
  const createPetMesh = (type: 'dog' | 'cat' | 'bunny'): { group: THREE.Group; color: number } => {
    const group = new THREE.Group();
    let mainColor = 0xcc8844;

    if (type === 'dog') {
      mainColor = 0xcc8833; // 골든 브라운
      // 몸통
      const bGeo = new THREE.BoxGeometry(0.7, 0.45, 0.9);
      const bMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.5 });
      const body = new THREE.Mesh(bGeo, bMat);
      body.position.y = 0.35;
      group.add(body);

      // 머리 & 귀
      const hGeo = new THREE.BoxGeometry(0.45, 0.4, 0.45);
      const head = new THREE.Mesh(hGeo, bMat);
      head.position.set(0, 0.6, 0.45);
      group.add(head);

      const earGeo = new THREE.BoxGeometry(0.12, 0.3, 0.15);
      const earL = new THREE.Mesh(earGeo, bMat);
      earL.position.set(-0.25, 0.65, 0.4);
      group.add(earL);

      const earR = new THREE.Mesh(earGeo, bMat);
      earR.position.set(0.25, 0.65, 0.4);
      group.add(earR);
    } else if (type === 'cat') {
      mainColor = 0xffffff; // 화이트 냥이
      const bGeo = new THREE.BoxGeometry(0.6, 0.4, 0.8);
      const bMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.4 });
      const body = new THREE.Mesh(bGeo, bMat);
      body.position.y = 0.32;
      group.add(body);

      const hGeo = new THREE.SphereGeometry(0.24, 12, 12);
      const head = new THREE.Mesh(hGeo, bMat);
      head.position.set(0, 0.55, 0.4);
      group.add(head);

      // 뾰족 귀
      const earGeo = new THREE.ConeGeometry(0.1, 0.22, 4);
      const earL = new THREE.Mesh(earGeo, bMat);
      earL.position.set(-0.16, 0.75, 0.4);
      group.add(earL);

      const earR = new THREE.Mesh(earGeo, bMat);
      earR.position.set(0.16, 0.75, 0.4);
      group.add(earR);
    } else {
      mainColor = 0xffaacc; // 핑크 토끼
      const bGeo = new THREE.BoxGeometry(0.5, 0.4, 0.6);
      const bMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.4 });
      const body = new THREE.Mesh(bGeo, bMat);
      body.position.y = 0.3;
      group.add(body);

      const hGeo = new THREE.SphereGeometry(0.22, 12, 12);
      const head = new THREE.Mesh(hGeo, bMat);
      head.position.set(0, 0.52, 0.3);
      group.add(head);

      // 긴 귀
      const earGeo = new THREE.BoxGeometry(0.08, 0.42, 0.1);
      const earL = new THREE.Mesh(earGeo, bMat);
      earL.position.set(-0.12, 0.85, 0.3);
      group.add(earL);

      const earR = new THREE.Mesh(earGeo, bMat);
      earR.position.set(0.12, 0.85, 0.3);
      group.add(earR);
    }

    return { group, color: mainColor };
  };

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1c15);
    scene.fog = new THREE.FogExp2(0x0e1c15, 0.02);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 120);
    camera.position.set(0, 17, 16);
    camera.lookAt(0, 0.5, 0);
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

    // 3. 조명 (따뜻한 야외 햇살 & 쉘터 하트 핑크등)
    const ambientLight = new THREE.AmbientLight(0xdcfce7, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = !lowSpecMode;
    if (sunLight.shadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      const d = 16;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
    }
    scene.add(sunLight);

    // 쉘터 핑크 포인트 라이트
    const shelterLight = new THREE.PointLight(0xff3388, 2.5, 20);
    shelterLight.position.set(0, 4, -6.5);
    scene.add(shelterLight);

    // 4. 그린 파크 잔디밭 (26m x 20m)
    const parkW = 26.0;
    const parkD = 20.0;
    gameLoopRef.current.parkWidth = parkW;
    gameLoopRef.current.parkDepth = parkD;

    const parkGeo = new THREE.BoxGeometry(parkW, 0.5, parkD);
    const parkMat = new THREE.MeshStandardMaterial({
      color: 0x3b7a44,
      roughness: 0.6,
      metalness: 0.1,
    });
    const park = new THREE.Mesh(parkGeo, parkMat);
    park.position.y = -0.25;
    park.receiveShadow = !lowSpecMode;
    scene.add(park);

    // 외곽 목재 울타리
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
    const fenceH = 0.8;

    const fenceN = new THREE.Mesh(new THREE.BoxGeometry(parkW, fenceH, 0.3), fenceMat);
    fenceN.position.set(0, 0.4, -parkD / 2);
    scene.add(fenceN);

    const fenceS = new THREE.Mesh(new THREE.BoxGeometry(parkW, fenceH, 0.3), fenceMat);
    fenceS.position.set(0, 0.4, parkD / 2);
    scene.add(fenceS);

    const fenceW = new THREE.Mesh(new THREE.BoxGeometry(0.3, fenceH, parkD), fenceMat);
    fenceW.position.set(-parkW / 2, 0.4, 0);
    scene.add(fenceW);

    const fenceE = new THREE.Mesh(new THREE.BoxGeometry(0.3, fenceH, parkD), fenceMat);
    fenceE.position.set(parkW / 2, 0.4, 0);
    scene.add(fenceE);

    // 진흙 웅덩이 2개
    gameLoopRef.current.mudPuddles.forEach((mud) => {
      const mudGeo = new THREE.CircleGeometry(mud.radius, 24);
      const mudMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
      const mudMesh = new THREE.Mesh(mudGeo, mudMat);
      mudMesh.rotation.x = -Math.PI / 2;
      mudMesh.position.set(mud.x, 0.02, mud.z);
      scene.add(mudMesh);
    });

    // 5. 중앙 상단 펫 쉘터 하우스 & 하트 게이트 (Z = -6.5m)
    const shelterGroup = new THREE.Group();

    // 쉘터 건물 본체
    const houseGeo = new THREE.BoxGeometry(6.5, 3.2, 3.8);
    const houseMat = new THREE.MeshStandardMaterial({
      color: 0xffeedd,
      roughness: 0.4,
      metalness: 0.1,
    });
    const house = new THREE.Mesh(houseGeo, houseMat);
    house.position.y = 1.6;
    house.castShadow = !lowSpecMode;
    shelterGroup.add(house);

    // 지붕 (레드 삼각 지붕)
    const roofGeo = new THREE.ConeGeometry(5.0, 2.0, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xdd3344, roughness: 0.3 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 3.8, 0);
    shelterGroup.add(roof);

    // 전면 하트 아치 링
    const archGeo = new THREE.TorusGeometry(1.6, 0.18, 12, 24);
    const archMat = new THREE.MeshBasicMaterial({ color: 0xff0066 });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, 1.6, 2.0);
    shelterGroup.add(arch);

    // 쉘터 인도 감지 원반
    const nestGeo = new THREE.RingGeometry(2.8, 3.4, 32);
    const nestMat = new THREE.MeshBasicMaterial({
      color: 0xff0088,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const nestRing = new THREE.Mesh(nestGeo, nestMat);
    nestRing.rotation.x = -Math.PI / 2;
    nestRing.position.set(0, 0.03, 1.5);
    shelterGroup.add(nestRing);

    shelterGroup.position.set(0, 0, -6.5);
    scene.add(shelterGroup);

    // 6. 플레이어 아바타 (펫 가디언 큐비)
    const pGroup = new THREE.Group();
    // 몸체 (에메랄드 셔츠 & 앞치마)
    const pBodyGeo = new THREE.BoxGeometry(0.9, 1.1, 0.65);
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
    const pBody = new THREE.Mesh(pBodyGeo, pBodyMat);
    pBody.position.y = 0.95;
    pBody.castShadow = !lowSpecMode;
    pGroup.add(pBody);

    // 머리 & 가디언 캡
    const pHeadGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const pHead = new THREE.Mesh(pHeadGeo, pHeadMat);
    pHead.position.y = 1.75;
    pHead.castShadow = !lowSpecMode;
    pGroup.add(pHead);

    const capGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.15, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x059669 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 2.05;
    pGroup.add(cap);

    pGroup.position.set(0, 0, 4.5);
    scene.add(pGroup);
    gameLoopRef.current.player.group = pGroup;

    // 7. 초기 동물 6마리 스폰 (강아지/고양이/토끼)
    const petTypes: ('dog' | 'cat' | 'bunny')[] = ['dog', 'cat', 'bunny', 'dog', 'cat', 'bunny'];
    const spawnPet = (type: 'dog' | 'cat' | 'bunny', x?: number, z?: number) => {
      const { group: petMesh, color } = createPetMesh(type);
      const posX = x !== undefined ? x : (Math.random() - 0.5) * (parkW - 6.0);
      const posZ = z !== undefined ? z : (Math.random() - 0.5) * (parkD - 10.0) + 1.0;

      petMesh.position.set(posX, 0, posZ);
      scene.add(petMesh);

      gameLoopRef.current.pets.push({
        mesh: petMesh,
        pos: new THREE.Vector3(posX, 0, posZ),
        targetPos: new THREE.Vector3(posX, 0, posZ),
        type,
        color,
        following: false,
        rescued: false,
        walkAngle: Math.random() * Math.PI * 2,
        roamTimer: 1.5 + Math.random() * 2.0,
      });
    };

    petTypes.forEach((t) => spawnPet(t));

    // 8. 리사이즈 핸들러
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

    // 9. 메인 게임 루프
    let lastTime = performance.now();

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const g = gameLoopRef.current;
      const p = g.player;

      // 쿨다운 타이머
      if (g.whistleCooldownTimer > 0) {
        g.whistleCooldownTimer = Math.max(0, g.whistleCooldownTimer - dt);
        setWhistleCooldown(Math.ceil(g.whistleCooldownTimer));
      }

      if (!g.isGameOver && !g.isGameWon) {
        // --- 플레이어 이동 제어 ---
        const moveSpeed = p.isSprinting ? 10.5 : 6.8;
        const inX = inputDirRef.current.x;
        const inZ = inputDirRef.current.z;

        p.pos.x += inX * moveSpeed * dt;
        p.pos.z += inZ * moveSpeed * dt;

        // 공원 경계 클램핑
        const maxX = g.parkWidth / 2 - 1.5;
        const maxZ = g.parkDepth / 2 - 1.5;
        p.pos.x = Math.max(-maxX, Math.min(maxX, p.pos.x));
        p.pos.z = Math.max(-maxZ, Math.min(maxZ, p.pos.z));

        if (p.group) {
          p.group.position.copy(p.pos);

          if (Math.hypot(inX, inZ) > 0.1) {
            p.group.rotation.y = Math.atan2(inX, inZ);
          }
        }

        // 플레이어 이동 궤적 기록 (팔로워 체인용)
        if (p.history.length === 0 || p.history[0].distanceTo(p.pos) > 0.45) {
          p.history.unshift(p.pos.clone());
          if (p.history.length > 30) p.history.pop();
        }

        // 진흙 웅덩이 충돌 감지
        g.mudPuddles.forEach((mud) => {
          const dist = Math.hypot(p.pos.x - mud.x, p.pos.z - mud.z);
          if (dist < mud.radius) {
            // 속도 대폭 감속
            p.pos.x -= inX * moveSpeed * 0.5 * dt;
            p.pos.z -= inZ * moveSpeed * 0.5 * dt;
          }
        });

        // --- 동물 AI 및 팔로워 체인 업데이트 ---
        const followingPets = g.pets.filter((pet) => pet.following && !pet.rescued);
        setFollowingCount(followingPets.length);

        g.pets.forEach((pet) => {
          if (pet.rescued) return;

          if (!pet.following) {
            // 1) 자유 배회 AI
            pet.roamTimer -= dt;
            if (pet.roamTimer <= 0) {
              pet.roamTimer = 2.0 + Math.random() * 2.5;
              const angle = Math.random() * Math.PI * 2;
              const dist = 1.5 + Math.random() * 3.0;
              pet.targetPos.set(
                Math.max(-maxX, Math.min(maxX, pet.pos.x + Math.cos(angle) * dist)),
                0,
                Math.max(-maxZ + 4, Math.min(maxZ, pet.pos.z + Math.sin(angle) * dist))
              );
            }

            // 타깃으로 천천히 이동
            const step = new THREE.Vector3().subVectors(pet.targetPos, pet.pos);
            if (step.length() > 0.2) {
              step.normalize();
              pet.pos.addScaledVector(step, 1.8 * dt);
              pet.mesh.rotation.y = Math.atan2(step.x, step.z);
            }

            // 플레이어와 접촉 시 팔로우 전환 (최대 4마리)
            const distToPlayer = pet.pos.distanceTo(p.pos);
            if (distToPlayer < 1.8 && followingPets.length < 4) {
              pet.following = true;
              triggerHaptic(20);
              if (playSfx) playSfx('powerup');
            }
          } else {
            // 2) 플레이어 뒤를 따르는 체인 추종
            const followIdx = followingPets.indexOf(pet);
            // 궤적 히스토리에서 해당 인덱스에 맞는 위치 추종
            const targetHistIdx = Math.min(p.history.length - 1, (followIdx + 1) * 4);
            const leaderPos = p.history[targetHistIdx] || p.pos;

            const toLeader = new THREE.Vector3().subVectors(leaderPos, pet.pos);
            const dist = toLeader.length();

            if (dist > 0.6) {
              toLeader.normalize();
              pet.pos.addScaledVector(toLeader, (moveSpeed + 1.2) * dt);
              pet.mesh.rotation.y = Math.atan2(toLeader.x, toLeader.z);
            }
          }

          pet.mesh.position.copy(pet.pos);
        });

        // --- 쉘터 네스트 인도 완료 판정 ---
        const distToShelter = Math.hypot(p.pos.x - g.shelterPos.x, p.pos.z - (g.shelterPos.z + 1.5));
        if (distToShelter < g.shelterRadius && followingPets.length > 0) {
          // 인도 성공!
          followingPets.forEach((pet) => {
            pet.rescued = true;
            pet.following = false;
            scene.remove(pet.mesh);

            // 하트 파티클 생성
            for (let k = 0; k < 10; k++) {
              const pGeo = new THREE.SphereGeometry(0.16, 6, 6);
              const pMat = new THREE.MeshBasicMaterial({ color: 0xff0066 });
              const pMesh = new THREE.Mesh(pGeo, pMat);
              pMesh.position.set(g.shelterPos.x, 1.5, g.shelterPos.z + 1.5);
              scene.add(pMesh);

              const pVel = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                3 + Math.random() * 4,
                (Math.random() - 0.5) * 5
              );
              g.particles.push({ mesh: pMesh, vel: pVel, life: 0.8 });
            }

            // 새로운 동물 보충 스폰
            setTimeout(() => {
              const types: ('dog' | 'cat' | 'bunny')[] = ['dog', 'cat', 'bunny'];
              spawnPet(types[Math.floor(Math.random() * types.length)]);
            }, 1500);
          });

          const countDelivered = followingPets.length;
          g.rescuedVal += countDelivered;
          setRescuedCount(g.rescuedVal);

          g.loveVal += countDelivered * 100;
          setLovePoints(g.loveVal);

          g.scoreVal += countDelivered * 10;
          setScore(g.scoreVal);

          triggerHaptic([40, 60, 100]);
          if (playSfx) playSfx('victory');

          // 10마리 이상 구조 시 승리!
          if (g.rescuedVal >= 10) {
            g.isGameWon = true;
            setGameWon(true);
            triggerHaptic([50, 80, 120, 200]);
            handleClaimReward(true, 100);
            return;
          }
        }

        // --- 파티클 업데이트 ---
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const pt = g.particles[i];
          pt.life -= dt;
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.vel.y -= 8 * dt;
          if (pt.life <= 0) {
            scene.remove(pt.mesh);
            g.particles.splice(i, 1);
          }
        }

        // --- 카메라 추종 (아이소메트릭 쿼터뷰) ---
        if (g.camera) {
          const camTargetX = p.pos.x * 0.45;
          const camTargetZ = p.pos.z * 0.45 + 15;
          g.camera.position.x += (camTargetX - g.camera.position.x) * 0.08;
          g.camera.position.z += (camTargetZ - g.camera.position.z) * 0.08;
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

  // 휘파람 호출 액션 (반경 6m 내 동물 유인)
  const handleWhistle = useCallback(() => {
    const g = gameLoopRef.current;
    if (g.whistleCooldownTimer > 0 || g.isGameOver || g.isGameWon) return;

    g.whistleCooldownTimer = 3.5;
    setWhistleCooldown(4);
    triggerHaptic([30, 40]);
    if (playSfx) playSfx('dash');

    // 반경 6m 내 동물들을 플레이어 쪽으로 유인
    const p = g.player;
    g.pets.forEach((pet) => {
      if (!pet.rescued && !pet.following) {
        const dist = pet.pos.distanceTo(p.pos);
        if (dist < 6.5) {
          pet.targetPos.copy(p.pos);
        }
      }
    });
  }, [playSfx, triggerHaptic]);

  // 질주 토글
  const handleSprintStart = useCallback(() => {
    gameLoopRef.current.player.isSprinting = true;
    triggerHaptic(20);
  }, [triggerHaptic]);

  const handleSprintEnd = useCallback(() => {
    gameLoopRef.current.player.isSprinting = false;
  }, []);

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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-emerald-950 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 3D 캔버스 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 HUD */}
      <MinimalistMissionHUD
        gameTitle="Petnest.io 3D"
        score={score}
        targetScore={100}
        onBack={handleExit} onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 상단 구조 현황 & 러브 포인트 대시보드 */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3">
          {/* 구조 동물 카운터 */}
          <div className="bg-slate-900/90 border border-emerald-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-emerald-400 font-bold block">RESCUED PETS</span>
            <span className="text-base text-yellow-300 font-black">{rescuedCount} / 10 🐾</span>
          </div>

          {/* 현재 따르는 펫 */}
          <div className="bg-slate-900/90 border border-pink-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-pink-400 font-bold block">FOLLOWING</span>
            <span className="text-base text-pink-300 font-black">{followingCount} / 4 ❤️</span>
          </div>

          {/* 러브 포인트 */}
          <div className="bg-slate-900/90 border border-amber-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-amber-400 font-bold block">LOVE PTS</span>
            <span className="text-base text-amber-300 font-black">{lovePoints}</span>
          </div>
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
          <div className="w-full h-full rounded-full border-2 border-emerald-500/50 bg-emerald-950/30 flex items-center justify-center backdrop-blur-xs">
            <div
              className="w-10 h-10 rounded-full bg-emerald-500/80 border border-white/80 shadow-md transform"
              style={{
                transform: `translate(${joystickDelta.x}px, ${joystickDelta.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 우측 하단 휘파람 & 질주 버튼 */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20 pointer-events-auto">
        {/* 질주 버튼 */}
        <button
          onTouchStart={handleSprintStart}
          onTouchEnd={handleSprintEnd}
          onMouseDown={handleSprintStart}
          onMouseUp={handleSprintEnd}
          className="w-16 h-16 rounded-full bg-amber-600/90 active:bg-amber-400 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-amber-300/80 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-base">⚡</span>
          <span>SPRINT</span>
        </button>

        {/* 휘파람 호출 버튼 (76px) */}
        <button
          onClick={handleWhistle}
          disabled={whistleCooldown > 0}
          className={`w-20 h-20 rounded-full font-black text-xs flex flex-col items-center justify-center border-2 shadow-xl active:scale-95 transition-all ${
            whistleCooldown > 0
              ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
              : 'bg-emerald-600 active:bg-emerald-400 text-white border-emerald-300 shadow-emerald-500/50'
          }`}
        >
          <span className="text-2xl">🐾</span>
          <span>{whistleCooldown > 0 ? `${whistleCooldown}s` : 'WHISTLE'}</span>
        </button>
      </div>

      {/* 좌측 하단 가이드 */}
      {!joystickActive && (
        <div className="absolute bottom-8 left-6 text-xs text-slate-300 pointer-events-none z-10 flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/50">
          <span>🕹️ 화면 터치 드래그로 동물에게 접근</span>
        </div>
      )}

      {/* 중도 포기 확인 모달 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">동물 구조를 중단할까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              현재까지 구조한 동물 수와 러브 포인트에 비례한 SNS 포인트가 정산됩니다.
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
                      gameId: 'poki_petnest_io',
                      gameTitle: 'Petnest.io 3D',
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
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="Petnest.io 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '10마리 동물 구조 & 쉘터 인도',
              desc: '공원에서 길 잃은 강아지, 고양이, 토끼를 모아 상단 펫 쉘터로 안전하게 인도하세요!',
            },
            {
              iconType: 'GESTURES',
              title: '접근 팔로우 & 휘파람 호출',
              desc: '동물에게 다가가면 뒤를 따릅니다. [WHISTLE]로 주변 동물들을 한 번에 부를 수 있습니다.',
            },
            {
              iconType: 'REWARDS',
              title: '파라다이스 쉘터 보상',
              desc: '10마리 완벽 구조 시 최대 50 SNS 포인트를 영구 획득합니다.',
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
