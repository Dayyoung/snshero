import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBlacktopPoliceGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;

  onClose?: () => void;
}

interface PoliceCar {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  targetX: number;
  speed: number;
  hp: number;
  sirenTime: number;
  sirenLightRed: THREE.PointLight;
  sirenLightBlue: THREE.PointLight;
  isTakedown: boolean;
  takedownVel: THREE.Vector3;
}

interface ObjectiveZone {
  mesh: THREE.Group;
  z: number;
  x: number;
  type: 'robber' | 'safehouse';
  active: boolean;
}

export const PokiBlacktopPoliceGame: React.FC<PokiBlacktopPoliceGameProps> = ({
  onBack,
  onExit,
  cardId = 41,
  lowSpecMode = false,
  playSfx,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [carHp, setCarHp] = useState(100);
  const [nitro, setNitro] = useState(100);
  const [cash, setCash] = useState(0);
  const [escapes, setEscapes] = useState(0); // 0 ~ 3
  const [hasPassenger, setHasPassenger] = useState(false);
  const [score, setScore] = useState(0);
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
    cashVal: 0,
    escapesVal: 0,
    hasPassengerVal: false,

    // 플레이어 머슬카
    playerCar: {
      group: null as THREE.Group | null,
      wheels: [] as THREE.Mesh[],
      pos: new THREE.Vector3(0, 0.45, 0),
      speed: 38.0, // 기본 주행 속도 (m/s)
      baseSpeed: 38.0,
      nitroActive: false,
      nitroAmount: 100,
      brakeActive: false,
      hp: 100,
      roll: 0,
      yaw: 0,
    },

    // 도로 타일링
    roadTiles: [] as THREE.Mesh[],
    roadLength: 60,
    roadCount: 6,
    roadWidth: 16.0,

    // 경찰차 AI
    policeCars: [] as PoliceCar[],
    policeSpawnTimer: 2.0,

    // 목표 존 (강도 픽업 & 안전가옥)
    objective: null as ObjectiveZone | null,

    // 파티클
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],

    // 조명 & 안개
    nitroFlames: [] as THREE.Mesh[],
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
      gameId: 'poki_blacktop_police_chase',
      gameTitle: 'Blacktop Police Chase 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: 35,
    });
    setRewardResult(result);
  }, []);

  // 3D 자동차 모델 생성 헬퍼
  const createMuscleCarMesh = (isPlayer: boolean): { group: THREE.Group; wheels: THREE.Mesh[] } => {
    const group = new THREE.Group();
    const wheels: THREE.Mesh[] = [];

    // 하부 섀시
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.55, 4.4);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x111111 : 0xffffff,
      roughness: 0.3,
      metalness: 0.8,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.5;
    chassis.castShadow = !lowSpecMode;
    group.add(chassis);

    // 상부 캐빈 & 루프
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.52, 2.2);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x222222 : 0x111111,
      roughness: 0.2,
      metalness: 0.5,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = !lowSpecMode;
    group.add(cabin);

    // 보닛 스트라이프 (플레이어: 오렌지 스트라이프 / 경찰: 블랙 도색)
    if (isPlayer) {
      const stripeGeo = new THREE.BoxGeometry(0.5, 0.56, 4.42);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = 0.5;
      group.add(stripe);
    } else {
      // 경찰차 도어 흑백 대비
      const doorGeo = new THREE.BoxGeometry(2.12, 0.45, 1.8);
      const doorMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 0.5, 0);
      group.add(door);
    }

    // 윈드실드 유리창
    const glassGeo = new THREE.BoxGeometry(1.62, 0.42, 1.8);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x66aaff,
      roughness: 0.1,
      metalness: 0.9,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0.96, -0.2);
    group.add(glass);

    // 4개 회전 바퀴 (타이어)
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    const wheelPositions = [
      [-1.05, 0.42, 1.3],
      [1.05, 0.42, 1.3],
      [-1.05, 0.42, -1.3],
      [1.05, 0.42, -1.3],
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = !lowSpecMode;
      group.add(wheel);
      wheels.push(wheel);
    });

    return { group, wheels };
  };

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe2e8f0);
    scene.fog = new THREE.FogExp2(0xe2e8f0, 0.015);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(56, width / height, 0.1, 200);
    camera.position.set(0, 4.8, 8.5);
    camera.lookAt(0, 1.2, -12);
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

    // 3. 심야 고속도로 조명
    const ambientLight = new THREE.AmbientLight(0x445577, 0.9);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x99bbff, 1.4);
    moonLight.position.set(20, 40, 20);
    moonLight.castShadow = !lowSpecMode;
    if (moonLight.shadow) {
      moonLight.shadow.mapSize.width = 1024;
      moonLight.shadow.mapSize.height = 1024;
    }
    scene.add(moonLight);

    // 4. 고속도로 무한 루핑 타일 (4차선, 폭 16m)
    const roadWidth = 16.0;
    const roadLength = 60.0;
    const roadCount = 6;
    gameLoopRef.current.roadLength = roadLength;
    gameLoopRef.current.roadCount = roadCount;
    gameLoopRef.current.roadWidth = roadWidth;

    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e2029,
      roughness: 0.7,
      metalness: 0.2,
    });

    for (let i = 0; i < roadCount; i++) {
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(0, 0, -i * roadLength);
      roadMesh.receiveShadow = !lowSpecMode;
      scene.add(roadMesh);
      gameLoopRef.current.roadTiles.push(roadMesh);

      // 차선 도색 스트라이프 (중앙 황색선 & 백색 점선)
      const lineGeo = new THREE.PlaneGeometry(0.2, roadLength);
      const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
      const yellowLine = new THREE.Mesh(lineGeo, yellowLineMat);
      yellowLine.rotation.x = -Math.PI / 2;
      yellowLine.position.set(0, 0.02, -i * roadLength);
      scene.add(yellowLine);

      // 좌/우 가드레일
      const railGeo = new THREE.BoxGeometry(0.5, 0.8, roadLength);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.6 });

      const leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(-roadWidth / 2, 0.4, -i * roadLength);
      scene.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(roadWidth / 2, 0.4, -i * roadLength);
      scene.add(rightRail);
    }

    // 5. 플레이어 머슬카 생성
    const playerModel = createMuscleCarMesh(true);
    playerModel.group.position.set(0, 0.45, 0);
    scene.add(playerModel.group);
    gameLoopRef.current.playerCar.group = playerModel.group;
    gameLoopRef.current.playerCar.wheels = playerModel.wheels;

    // 니트로 배기 화염 2개
    const flameGeo = new THREE.ConeGeometry(0.25, 0.9, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.rotation.x = -Math.PI / 2;
    flameL.position.set(-0.6, 0.35, 2.3);
    flameL.visible = false;
    playerModel.group.add(flameL);

    const flameR = new THREE.Mesh(flameGeo, flameMat);
    flameR.rotation.x = -Math.PI / 2;
    flameR.position.set(0.6, 0.35, 2.3);
    flameR.visible = false;
    playerModel.group.add(flameR);
    gameLoopRef.current.nitroFlames = [flameL, flameR];

    // 6. 첫 번째 목표: 갓길 은행 강도 생성 (Z = -90m)
    const spawnObjective = (type: 'robber' | 'safehouse', zDist: number) => {
      const objGroup = new THREE.Group();
      let xPos = 0;

      if (type === 'robber') {
        // 도로 우측 갓길 (X = 6.2m)
        xPos = Math.random() < 0.5 ? 6.2 : -6.2;

        // 강도 아바타 (스트라이프 티셔츠 & 마스크)
        const manGeo = new THREE.BoxGeometry(0.7, 1.4, 0.5);
        const manMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const man = new THREE.Mesh(manGeo, manMat);
        man.position.y = 0.7;
        objGroup.add(man);

        // 돈가방 (그린 박스)
        const bagGeo = new THREE.BoxGeometry(0.5, 0.4, 0.35);
        const bagMat = new THREE.MeshStandardMaterial({ color: 0x22bb33 });
        const bag = new THREE.Mesh(bagGeo, bagMat);
        bag.position.set(0.4, 0.4, 0);
        objGroup.add(bag);

        // 녹색 픽업 비콘 링
        const ringGeo = new THREE.RingGeometry(1.2, 1.6, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        objGroup.add(ring);
      } else {
        // 안전가옥 게이트 (도로 전체를 가로지르는 황금빛 아치 게이트)
        xPos = 0;
        const archGeo = new THREE.BoxGeometry(roadWidth - 0.5, 5.0, 1.2);
        const archMat = new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          emissive: 0x553300,
          roughness: 0.3,
        });
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.position.y = 2.5;
        objGroup.add(arch);

        // SAFE 게이트 안내판
        const signGeo = new THREE.BoxGeometry(7.0, 1.4, 1.3);
        const signMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 4.8, 0);
        objGroup.add(sign);
      }

      objGroup.position.set(xPos, 0, zDist);
      scene.add(objGroup);

      gameLoopRef.current.objective = {
        mesh: objGroup,
        z: zDist,
        x: xPos,
        type,
        active: true,
      };
    };

    spawnObjective('robber', -80);

    // 7. 경찰차 생성 헬퍼
    const spawnPoliceCar = (ahead: boolean) => {
      const g = gameLoopRef.current;
      if (g.policeCars.length >= 3) return;

      const pModel = createMuscleCarMesh(false);

      // 경광등 (레드 & 블루 3D 박스 & 포인트 라이트)
      const sirenBarGeo = new THREE.BoxGeometry(1.1, 0.15, 0.35);
      const sirenBarMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const sirenBar = new THREE.Mesh(sirenBarGeo, sirenBarMat);
      sirenBar.position.set(0, 1.3, -0.2);
      pModel.group.add(sirenBar);

      const redLight = new THREE.PointLight(0xff0022, 2.0, 15);
      redLight.position.set(-0.4, 1.4, -0.2);
      pModel.group.add(redLight);

      const blueLight = new THREE.PointLight(0x0044ff, 2.0, 15);
      blueLight.position.set(0.4, 1.4, -0.2);
      pModel.group.add(blueLight);

      // 스폰 위치: 전방 90m 또는 후방 35m
      const spawnZ = ahead ? g.playerCar.pos.z - 85 : g.playerCar.pos.z + 35;
      const laneX = (Math.random() - 0.5) * (roadWidth - 4.5);

      pModel.group.position.set(laneX, 0.45, spawnZ);
      scene.add(pModel.group);

      g.policeCars.push({
        mesh: pModel.group,
        pos: new THREE.Vector3(laneX, 0.45, spawnZ),
        targetX: laneX,
        speed: ahead ? 30.0 : 44.0, // 후방은 따라잡고, 전방은 서행 저지
        hp: 40,
        sirenTime: 0,
        sirenLightRed: redLight,
        sirenLightBlue: blueLight,
        isTakedown: false,
        takedownVel: new THREE.Vector3(0, 0, 0),
      });
    };

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

    // 9. 메인 루프
    let lastTime = performance.now();

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const g = gameLoopRef.current;
      const pc = g.playerCar;

      if (!g.isGameOver && !g.isGameWon) {
        // --- 니트로 & 속도 계산 ---
        let currentSpeed = pc.baseSpeed;

        if (pc.nitroActive && pc.nitroAmount > 0) {
          currentSpeed *= 1.75;
          pc.nitroAmount = Math.max(0, pc.nitroAmount - dt * 40);
          setNitro(Math.floor(pc.nitroAmount));
          g.nitroFlames.forEach((f) => (f.visible = true));
        } else {
          g.nitroFlames.forEach((f) => (f.visible = false));
          // 니트로 자연 회복
          if (pc.nitroAmount < 100) {
            pc.nitroAmount = Math.min(100, pc.nitroAmount + dt * 15);
            setNitro(Math.floor(pc.nitroAmount));
          }
        }

        if (pc.brakeActive) {
          currentSpeed *= 0.55;
        }

        pc.speed = currentSpeed;

        // 플레이어 전진 (Z축 - 방향)
        pc.pos.z -= pc.speed * dt;

        // 플레이어 좌우 조향
        const steerSpeed = 14.0;
        const inX = inputDirRef.current.x;
        pc.pos.x += inX * steerSpeed * dt;

        // 도로 가드레일 한계
        const maxRoadX = roadWidth / 2 - 1.6;
        pc.pos.x = Math.max(-maxRoadX, Math.min(maxRoadX, pc.pos.x));

        // 차체 롤/요(Roll/Yaw) 틸트
        pc.roll = -inX * 0.18;
        pc.yaw = -inX * 0.12;

        if (pc.group) {
          pc.group.position.copy(pc.pos);
          pc.group.rotation.z = pc.roll;
          pc.group.rotation.y = pc.yaw;

          // 바퀴 회전
          pc.wheels.forEach((w) => {
            w.rotation.x -= pc.speed * dt * 2.0;
          });
        }

        // --- 도로 무한 루핑 타일 갱신 ---
        g.roadTiles.forEach((tile) => {
          if (tile.position.z > pc.pos.z + roadLength) {
            tile.position.z -= roadLength * roadCount;
          }
        });

        // 점수 획득
        g.scoreVal += dt * (pc.speed / 10);
        setScore(Math.floor(g.scoreVal));

        // --- 목표물(강도 / 안전가옥) 판정 ---
        if (g.objective && g.objective.active) {
          const obj = g.objective;
          const distZ = Math.abs(pc.pos.z - obj.z);
          const distX = Math.abs(pc.pos.x - obj.x);

          if (obj.type === 'robber') {
            // 강도 픽업 존 접촉 (반경 3.5m)
            if (distZ < 4.0 && distX < 4.5) {
              obj.active = false;
              scene.remove(obj.mesh);
              g.hasPassengerVal = true;
              setHasPassenger(true);

              g.cashVal += 1000;
              setCash(g.cashVal);
              g.scoreVal += 150;

              triggerHaptic([40, 60, 100]);
              if (playSfx) playSfx('powerup');

              // 다음 목표: 안전가옥 게이트 (전방 130m)
              spawnObjective('safehouse', pc.pos.z - 130);
            }
          } else if (obj.type === 'safehouse') {
            // 안전가옥 게이트 통과 (Z축 도달)
            if (pc.pos.z <= obj.z + 2.0 && pc.pos.z >= obj.z - 4.0) {
              obj.active = false;
              scene.remove(obj.mesh);
              g.hasPassengerVal = false;
              setHasPassenger(false);

              g.escapesVal += 1;
              setEscapes(g.escapesVal);

              g.cashVal += 2500;
              setCash(g.cashVal);
              g.scoreVal += 300;

              triggerHaptic([60, 80, 120, 180]);
              if (playSfx) playSfx('victory');

              // 3회 탈출 완수 시 승리!
              if (g.escapesVal >= 3) {
                g.isGameWon = true;
                setGameWon(true);
                handleClaimReward(true, g.scoreVal + 100);
                return;
              } else {
                // 다음 강도 픽업 스폰 (전방 110m)
                spawnObjective('robber', pc.pos.z - 110);
              }
            }
          }
        }

        // --- 경찰차 AI 업데이트 & 스폰 ---
        g.policeSpawnTimer -= dt;
        if (g.policeSpawnTimer <= 0) {
          g.policeSpawnTimer = 3.5 + Math.random() * 2.5;
          spawnPoliceCar(Math.random() < 0.6);
        }

        for (let i = g.policeCars.length - 1; i >= 0; i--) {
          const cop = g.policeCars[i];

          // 경광등 점멸 (레드/블루 번갈아 켜짐)
          cop.sirenTime += dt * 8.0;
          const isRed = Math.floor(cop.sirenTime) % 2 === 0;
          cop.sirenLightRed.intensity = isRed ? 3.0 : 0.2;
          cop.sirenLightBlue.intensity = isRed ? 0.2 : 3.0;

          if (!cop.isTakedown) {
            // 플레이어 Z 위치 기준 이동
            cop.pos.z -= cop.speed * dt;

            // 플레이어 차선으로 스티어링 (가로막기 또는 몸싸움)
            const dx = pc.pos.x - cop.pos.x;
            cop.pos.x += Math.sign(dx) * Math.min(Math.abs(dx), 4.5 * dt);

            cop.mesh.position.copy(cop.pos);

            // 플레이어와 충돌 체크
            const dZ = Math.abs(pc.pos.z - cop.pos.z);
            const dX = Math.abs(pc.pos.x - cop.pos.x);

            if (dZ < 3.8 && dX < 2.0) {
              if (pc.nitroActive) {
                // 니트로 상태: 경찰차 테이크다운(전복 파괴)!
                cop.isTakedown = true;
                cop.takedownVel.set((cop.pos.x - pc.pos.x) * 8, 14, -15);
                g.cashVal += 500;
                setCash(g.cashVal);
                g.scoreVal += 100;

                triggerHaptic([70, 90, 140]);
                if (playSfx) playSfx('explosion');
              } else {
                // 일반 충돌: 플레이어 HP 감소 & 넉백
                pc.hp = Math.max(0, pc.hp - 15);
                setCarHp(pc.hp);

                // 반발력
                pc.pos.x += (pc.pos.x - cop.pos.x) * 0.8;
                cop.pos.x += (cop.pos.x - pc.pos.x) * 0.8;

                triggerHaptic([40, 50]);
                if (playSfx) playSfx('hit');

                if (pc.hp <= 0) {
                  g.isGameOver = true;
                  setGameOver(true);
                  triggerHaptic([60, 100, 150]);
                  handleClaimReward(false, g.scoreVal);
                  return;
                }
              }
            }
          } else {
            // 테이크다운된 경찰차 공중 회전
            cop.pos.addScaledVector(cop.takedownVel, dt);
            cop.takedownVel.y -= 25 * dt; // 중력
            cop.mesh.position.copy(cop.pos);
            cop.mesh.rotation.x += 10 * dt;
            cop.mesh.rotation.z += 8 * dt;

            if (cop.pos.y < -10.0) {
              scene.remove(cop.mesh);
              g.policeCars.splice(i, 1);
              continue;
            }
          }

          // 너무 멀어진 경찰차 제거
          if (cop.pos.z > pc.pos.z + 50 || cop.pos.z < pc.pos.z - 150) {
            scene.remove(cop.mesh);
            g.policeCars.splice(i, 1);
          }
        }

        // --- 카메라 추종 (3인칭 체이스 뷰) ---
        if (g.camera) {
          const camTargetX = pc.pos.x * 0.6;
          const camTargetZ = pc.pos.z + (pc.nitroActive ? 10.0 : 8.5);
          g.camera.position.x += (camTargetX - g.camera.position.x) * 0.1;
          g.camera.position.z += (camTargetZ - g.camera.position.z) * 0.15;
          g.camera.lookAt(pc.pos.x * 0.5, 1.2, pc.pos.z - 14);
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

  // 니트로 부스트 토글
  const handleNitroStart = useCallback(() => {
    gameLoopRef.current.playerCar.nitroActive = true;
    triggerHaptic([30, 40]);
  }, [triggerHaptic]);

  const handleNitroEnd = useCallback(() => {
    gameLoopRef.current.playerCar.nitroActive = false;
  }, []);

  // 브레이크
  const handleBrakeStart = useCallback(() => {
    gameLoopRef.current.playerCar.brakeActive = true;
    triggerHaptic(20);
  }, [triggerHaptic]);

  const handleBrakeEnd = useCallback(() => {
    gameLoopRef.current.playerCar.brakeActive = false;
  }, []);

  // 레인 조향 백업
  const handleSteerLane = useCallback((dir: number) => {
    const pc = gameLoopRef.current.playerCar;
    pc.pos.x += dir * 2.8;
    triggerHaptic(15);
  }, [triggerHaptic]);

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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#e2e8f0] font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 3D 렌더러 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 HUD */}
      <MinimalistMissionHUD
        gameTitle="Blacktop Police Chase 3D"
        score={score}
        targetScore={100}
        onBack={handleExit} onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 상단 미션 상태 & 대시보드 */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        {/* 차량 HP & 니트로 & 수송 현황 */}
        <div className="flex flex-col gap-1.5 bg-slate-900/90 border border-slate-700/60 p-2.5 rounded-sm backdrop-blur-sm">
          {/* 차량 내구도 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-red-400 font-bold w-12">VEHICLE</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-150"
                style={{ width: `${Math.max(0, carHp)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-300 font-black">{carHp}%</span>
          </div>

          {/* 니트로 게이지 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-400 font-bold w-12">NITRO</span>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-100"
                style={{ width: `${Math.max(0, nitro)}%` }}
              />
            </div>
            <span className="text-[10px] text-cyan-300 font-black">{nitro}%</span>
          </div>

          {/* 수송 탈출 횟수 & 승객 탑승 상태 */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/40">
            <span className="text-yellow-400 font-bold">ESCAPES: {escapes} / 3</span>
            <span className={`font-bold ${hasPassenger ? 'text-green-400 animate-pulse' : 'text-slate-400'}`}>
              {hasPassenger ? '💰 PASSENGER' : '🔎 FIND ROBBER'}
            </span>
          </div>
        </div>

        {/* 획득 현금 & 영웅 배지 */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 border border-green-500/40 px-3 py-2 rounded-sm text-right">
            <span className="text-[10px] text-green-400 font-bold block">LOOT CASH</span>
            <span className="text-base text-green-300 font-black">${cash.toLocaleString()}</span>
          </div>

          <div className="w-12 h-14 bg-slate-900/90 border border-amber-500/40 rounded-sm overflow-hidden flex flex-col items-center justify-center p-0.5">
            <canvas ref={heroCanvasRef} width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="text-[9px] text-amber-300 font-black leading-none mt-0.5">No.{cardId}</span>
          </div>
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
          <div className="w-full h-full rounded-full border-2 border-orange-500/50 bg-orange-950/30 flex items-center justify-center backdrop-blur-xs">
            <div
              className="w-10 h-10 rounded-full bg-orange-500/80 border border-white/80 shadow-md transform"
              style={{
                transform: `translate(${joystickDelta.x}px, ${joystickDelta.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 좌측 하단 레인 조향 버튼 백업 */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 z-20 pointer-events-auto">
        <button
          onClick={() => handleSteerLane(-1)}
          className="w-13 h-13 rounded-sm bg-slate-800/90 active:bg-slate-700 text-white font-black text-lg border border-slate-600 flex items-center justify-center shadow-md active:scale-95"
        >
          ⬅️
        </button>
        <button
          onClick={() => handleSteerLane(1)}
          className="w-13 h-13 rounded-sm bg-slate-800/90 active:bg-slate-700 text-white font-black text-lg border border-slate-600 flex items-center justify-center shadow-md active:scale-95"
        >
          ➡️
        </button>
      </div>

      {/* 우측 하단 브레이크 & 니트로 액션 버튼 */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20 pointer-events-auto">
        {/* 브레이크 / 드리프트 버튼 */}
        <button
          onTouchStart={handleBrakeStart}
          onTouchEnd={handleBrakeEnd}
          onMouseDown={handleBrakeStart}
          onMouseUp={handleBrakeEnd}
          className="w-16 h-16 rounded-full bg-amber-600/90 active:bg-amber-400 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-amber-300/80 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-base">🛑</span>
          <span>BRAKE</span>
        </button>

        {/* 대형 니트로 부스트 버튼 (76px) */}
        <button
          onTouchStart={handleNitroStart}
          onTouchEnd={handleNitroEnd}
          onMouseDown={handleNitroStart}
          onMouseUp={handleNitroEnd}
          className="w-20 h-20 rounded-full bg-cyan-600/90 active:bg-cyan-400 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-cyan-300/90 shadow-xl active:scale-95 transition-transform"
        >
          <span className="text-2xl">⚡</span>
          <span>NITRO</span>
        </button>
      </div>

      {/* 중도 포기 확인 모달 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">탈주 드라이빙을 중단할까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              현재까지 수송한 횟수와 획득한 현금에 비례한 SNS 포인트가 정산됩니다.
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
                      gameId: 'poki_blacktop_police_chase',
                      gameTitle: 'Blacktop Police Chase 3D',
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
          gameTitle="Blacktop Police Chase 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '강도 수송 & 안전가옥 3회 탈출',
              desc: '심야 고속도로 갓길의 은행 강도를 픽업하고 황금빛 안전가옥 게이트로 무사히 수송하세요!',
            },
            {
              iconType: 'GESTURES',
              title: '조향 & 니트로 테이크다운',
              desc: '화면 조이스틱으로 차선을 변경하고, [NITRO]로 급가속하여 방해하는 경찰차를 들이받아 전복시키세요.',
            },
            {
              iconType: 'REWARDS',
              title: '현금 보상 & SNS 정산',
              desc: '3회 수송 완수 시 거액의 현금과 최대 50 SNS 포인트를 영구 획득합니다.',
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
