import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiMrRacerGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface TrafficVehicle {
  mesh: THREE.Group;
  wheels: THREE.Mesh[];
  lane: number;
  z: number;
  speed: number;
  type: 'taxi' | 'sedan' | 'sports' | 'truck';
  width: number;
  length: number;
  passed: boolean;
}

const LANES = [-4.5, -1.5, 1.5, 4.5]; // 4차선 X 좌표 (화면 기준: 왼쪽 -4.5 ~ 오른쪽 +4.5)
const TARGET_DISTANCE = 1500; // 목표 주행 거리 (미터)

export default function PokiMrRacerGame({
  onBack,
  onClose,
  cardId = 86,
}: PokiMrRacerGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onBack || onClose || (() => {});

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'crashed' | 'victory'>('ready');
  const [speedKmH, setSpeedKmH] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [nitroFuel, setNitroFuel] = useState(100);
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [isBraking, setIsBraking] = useState(false);
  const [health, setHealth] = useState(3);
  const [overtakes, setOvertakes] = useState(0);
  const [overtakeComboBanner, setOvertakeComboBanner] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'chase' | 'hood'>('chase');
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 애니메이션 & 쓰리제이에스 레프
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerCar: THREE.Group;
    playerWheels: THREE.Mesh[];
    playerFlames: THREE.Mesh[];
    playerHeadlights: THREE.SpotLight[];
    roadSegments: THREE.Group[];
    trafficList: TrafficVehicle[];
    sparks: THREE.Points;
    nitroParticles: THREE.Points;
    nitroParticleGeo: THREE.BufferGeometry;
    sparkGeo: THREE.BufferGeometry;
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // 실시간 조작 및 상태 레프
  const stateRef = useRef({
    gameState: 'ready' as 'ready' | 'playing' | 'crashed' | 'victory',
    playerX: 1.5, // 2번째 오른쪽 차선에서 안전하게 시작
    playerZ: 0,
    targetX: 1.5,
    speed: 0, // m/s
    distance: 0,
    nitro: 100,
    isNitro: false,
    isBrake: false,
    health: 3,
    invincibleTimer: 0,
    cameraMode: 'chase' as 'chase' | 'hood',
    overtakes: 0,
    touchStartX: 0,
    isSteeringTouch: false,
  });

  const triggerHaptic = useCallback((ms: number = 30) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // 무시
    }
  }, []);

  const handleOvertakeSuccess = useCallback(() => {
    stateRef.current.overtakes += 1;
    setOvertakes(stateRef.current.overtakes);
    setOvertakeComboBanner(`⚡ CLOSE OVERTAKE! +200 (${stateRef.current.overtakes}x)`);
    triggerHaptic(40);
    setTimeout(() => {
      setOvertakeComboBanner(null);
    }, 1200);
  }, [triggerHaptic]);

  const handleFinishVictory = useCallback(() => {
    stateRef.current.gameState = 'victory';
    setGameState('victory');
    triggerHaptic([100, 50, 150]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimrracer',
      gameTitle: 'MR RACER - Car Racing',
      isVictory: true,
      score: Math.round(stateRef.current.distance + stateRef.current.overtakes * 200),
      maxTargetScore: TARGET_DISTANCE + 2000,
      durationSeconds: 40,
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  const handleCrashGameOver = useCallback(() => {
    stateRef.current.gameState = 'crashed';
    setGameState('crashed');
    triggerHaptic([200, 100, 200]);

    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokimrracer',
      gameTitle: 'MR RACER - Car Racing',
      isVictory: false,
      score: Math.round(stateRef.current.distance + stateRef.current.overtakes * 200),
      maxTargetScore: TARGET_DISTANCE + 2000,
      durationSeconds: 25,
    });
    setRewardReceipt(receipt);
  }, [triggerHaptic]);

  // 게임 시작
  const startGame = useCallback(() => {
    stateRef.current.gameState = 'playing';
    stateRef.current.playerX = 1.5;
    stateRef.current.targetX = 1.5;
    stateRef.current.playerZ = 0;
    stateRef.current.speed = 35; // 초기 126km/h
    stateRef.current.distance = 0;
    stateRef.current.nitro = 100;
    stateRef.current.health = 3;
    stateRef.current.overtakes = 0;
    stateRef.current.invincibleTimer = 0;

    setGameState('playing');
    setDistanceMeters(0);
    setNitroFuel(100);
    setHealth(3);
    setOvertakes(0);
    setRewardReceipt(null);
    triggerHaptic(60);
  }, [triggerHaptic]);

  // 차선 즉시 이동 (화면 기준: 왼쪽 = -X, 오른쪽 = +X)
  const shiftLane = useCallback((direction: 'left' | 'right') => {
    if (stateRef.current.gameState !== 'playing') return;
    const currentX = stateRef.current.targetX;
    let closestIndex = 0;
    let minDiff = 999;
    LANES.forEach((laneX, idx) => {
      const diff = Math.abs(laneX - currentX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    if (direction === 'left' && closestIndex > 0) {
      stateRef.current.targetX = LANES[closestIndex - 1];
      triggerHaptic(25);
    } else if (direction === 'right' && closestIndex < LANES.length - 1) {
      stateRef.current.targetX = LANES[closestIndex + 1];
      triggerHaptic(25);
    }
  }, [triggerHaptic]);

  // Three.js 씬 초기화 및 렌더 루프
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // 딥 미드나잇 사이버 스카이
    scene.fog = new THREE.FogExp2(0x0f172a, 0.007);

    // Camera (기본 체이스 뷰)
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 800);
    camera.position.set(1.5, 4.2, 7.5);
    camera.lookAt(1.5, 1.2, -15);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 30);
    scene.add(dirLight);

    const neonRimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    neonRimLight.position.set(-20, 10, -30);
    scene.add(neonRimLight);

    // No.086 공식 카드 영웅 스프라이트 텍스처 생성
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 256;
    heroCanvas.height = 256;
    const heroCtx = heroCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, cardId, 18, 18, 220, 220, { circleClip: true });
    }
    const heroTexture = new THREE.CanvasTexture(heroCanvas);
    heroTexture.needsUpdate = true;

    // --- 3D 도로 시스템 (무한 루핑 3단 세그먼트) ---
    const ROAD_SEGMENT_LENGTH = 160;
    const ROAD_WIDTH = 14;
    const roadSegments: THREE.Group[] = [];

    const createRoadSegment = (zOffset: number, isStartZone: boolean) => {
      const roadGroup = new THREE.Group();
      roadGroup.position.z = zOffset;

      // 아스팔트 바닥 메쉬
      const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_SEGMENT_LENGTH);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.85,
        metalness: 0.1,
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadGroup.add(roadMesh);

      // 도로 갓길 및 가드레일 (좌/우)
      const guardrailGeo = new THREE.BoxGeometry(0.5, 0.8, ROAD_SEGMENT_LENGTH);
      const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });

      const leftRail = new THREE.Mesh(guardrailGeo, guardrailMat);
      leftRail.position.set(-ROAD_WIDTH / 2, 0.4, 0);
      roadGroup.add(leftRail);

      const rightRail = new THREE.Mesh(guardrailGeo, guardrailMat);
      rightRail.position.set(ROAD_WIDTH / 2, 0.4, 0);
      roadGroup.add(rightRail);

      // 네온 가이드 엣지 라이트
      const neonLineGeo = new THREE.BoxGeometry(0.15, 0.1, ROAD_SEGMENT_LENGTH);
      const leftNeon = new THREE.Mesh(neonLineGeo, new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
      leftNeon.position.set(-ROAD_WIDTH / 2 + 0.3, 0.05, 0);
      roadGroup.add(leftNeon);

      const rightNeon = new THREE.Mesh(neonLineGeo, new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
      rightNeon.position.set(ROAD_WIDTH / 2 - 0.3, 0.05, 0);
      roadGroup.add(rightNeon);

      // 차선 스트라이프 점선 (-3, 0, +3 위치)
      const stripeGeo = new THREE.PlaneGeometry(0.2, 5);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [-3, 0, 3].forEach((stripeX) => {
        for (let sz = -ROAD_SEGMENT_LENGTH / 2 + 5; sz < ROAD_SEGMENT_LENGTH / 2; sz += 10) {
          const stripe = new THREE.Mesh(stripeGeo, stripeMat);
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(stripeX, 0.02, sz);
          roadGroup.add(stripe);
        }
      });

      // 가로등 기둥 (30m 간격)
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 6, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 });
      const lampGeo = new THREE.BoxGeometry(1.2, 0.2, 0.4);
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

      for (let lz = -ROAD_SEGMENT_LENGTH / 2 + 15; lz < ROAD_SEGMENT_LENGTH / 2; lz += 30) {
        // 좌측 가로등
        const pLeft = new THREE.Mesh(poleGeo, poleMat);
        pLeft.position.set(-ROAD_WIDTH / 2 - 0.8, 3, lz);
        roadGroup.add(pLeft);
        const lLeft = new THREE.Mesh(lampGeo, lampMat);
        lLeft.position.set(-ROAD_WIDTH / 2 + 0.2, 5.9, lz);
        roadGroup.add(lLeft);

        // 우측 가로등
        const pRight = new THREE.Mesh(poleGeo, poleMat);
        pRight.position.set(ROAD_WIDTH / 2 + 0.8, 3, lz);
        roadGroup.add(pRight);
        const lRight = new THREE.Mesh(lampGeo, lampMat);
        lRight.position.set(ROAD_WIDTH / 2 - 0.2, 5.9, lz);
        roadGroup.add(lRight);
      }

      // 시작 안전존인 경우 중앙 바닥에 No.086 공식 카드 배지 각인
      if (isStartZone) {
        const badgeGeo = new THREE.PlaneGeometry(5.5, 5.5);
        const badgeMat = new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true });
        const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
        badgeMesh.rotation.x = -Math.PI / 2;
        badgeMesh.position.set(0, 0.03, 5);
        roadGroup.add(badgeMesh);

        // START 라인
        const startLineGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 1.2);
        const startLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
        const startLine = new THREE.Mesh(startLineGeo, startLineMat);
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(0, 0.025, 10);
        roadGroup.add(startLine);
      }

      scene.add(roadGroup);
      return roadGroup;
    };

    // 3개 도로 세그먼트 배치 (-ROAD_SEGMENT_LENGTH, 0, ROAD_SEGMENT_LENGTH)
    roadSegments.push(createRoadSegment(-ROAD_SEGMENT_LENGTH, false));
    roadSegments.push(createRoadSegment(0, true)); // 시작존
    roadSegments.push(createRoadSegment(ROAD_SEGMENT_LENGTH, false));

    // --- 3D 플레이어 슈퍼카 제작 ---
    const playerCar = new THREE.Group();
    playerCar.position.set(1.5, 0, 0);

    // 하이퍼카 섀시 메인 바디
    const carBodyGeo = new THREE.BoxGeometry(2.0, 0.5, 4.4);
    const carBodyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // 핫 레드 레이싱 컬러
      metalness: 0.85,
      roughness: 0.2,
    });
    const carBody = new THREE.Mesh(carBodyGeo, carBodyMat);
    carBody.position.y = 0.45;
    playerCar.add(carBody);

    // 콕핏 캐빈 & 글래스
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.45, 2.2);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.95,
      roughness: 0.1,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.85, -0.2);
    playerCar.add(cabin);

    // 본넷 위 No.086 공식 카드 영웅 배지 데칼
    const heroDecalGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const heroDecalMat = new THREE.MeshBasicMaterial({ map: heroTexture, transparent: true });
    const heroDecal = new THREE.Mesh(heroDecalGeo, heroDecalMat);
    heroDecal.rotation.x = -Math.PI / 2;
    heroDecal.position.set(0, 0.71, -1.2);
    playerCar.add(heroDecal);

    // 리어 스포일러 윙
    const wingGeo = new THREE.BoxGeometry(1.9, 0.08, 0.4);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 0.95, 1.8);
    playerCar.add(wing);

    const wingPillarGeo = new THREE.BoxGeometry(0.08, 0.35, 0.1);
    const wpLeft = new THREE.Mesh(wingPillarGeo, wingMat);
    wpLeft.position.set(-0.6, 0.8, 1.8);
    playerCar.add(wpLeft);
    const wpRight = new THREE.Mesh(wingPillarGeo, wingMat);
    wpRight.position.set(0.6, 0.8, 1.8);
    playerCar.add(wpRight);

    // 헤드라이트 (앞쪽)
    const headlightGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const hlLeft = new THREE.Mesh(headlightGeo, headlightMat);
    hlLeft.position.set(-0.7, 0.48, -2.21);
    playerCar.add(hlLeft);
    const hlRight = new THREE.Mesh(headlightGeo, headlightMat);
    hlRight.position.set(0.7, 0.48, -2.21);
    playerCar.add(hlRight);

    // 스포트라이트 빔
    const playerHeadlights: THREE.SpotLight[] = [];
    [-0.7, 0.7].forEach((hx) => {
      const spot = new THREE.SpotLight(0xbae6fd, 2.5, 60, Math.PI / 6, 0.3, 1);
      spot.position.set(hx, 0.5, -2.2);
      spot.target.position.set(hx, 0.5, -30);
      playerCar.add(spot);
      playerCar.add(spot.target);
      playerHeadlights.push(spot);
    });

    // 테일라이트 (뒤쪽)
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const tlLeft = new THREE.Mesh(headlightGeo, taillightMat);
    tlLeft.position.set(-0.7, 0.48, 2.21);
    playerCar.add(tlLeft);
    const tlRight = new THREE.Mesh(headlightGeo, taillightMat);
    tlRight.position.set(0.7, 0.48, 2.21);
    playerCar.add(tlRight);

    // 4개 회전 타이어
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });

    const playerWheels: THREE.Mesh[] = [];
    const wheelPositions = [
      [-0.95, 0.35, -1.3],
      [0.95, 0.35, -1.3],
      [-0.95, 0.35, 1.3],
      [0.95, 0.35, 1.3],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);

      const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.31, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheel.add(rim);

      playerCar.add(wheel);
      playerWheels.push(wheel);
    });

    // 니트로 화염 콘 (듀얼 배기구)
    const flameGeo = new THREE.ConeGeometry(0.18, 0.8, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0 });
    const flameLeft = new THREE.Mesh(flameGeo, flameMat);
    flameLeft.position.set(-0.4, 0.35, 2.6);
    playerCar.add(flameLeft);

    const flameRight = new THREE.Mesh(flameGeo, flameMat.clone());
    flameRight.position.set(0.4, 0.35, 2.6);
    playerCar.add(flameRight);
    const playerFlames = [flameLeft, flameRight];

    scene.add(playerCar);

    // --- 3D AI 트래픽 차량 풀 생성 (10대) ---
    const trafficList: TrafficVehicle[] = [];
    const trafficTypes = ['taxi', 'sedan', 'sports', 'truck'] as const;

    const createTrafficVehicle = (index: number): TrafficVehicle => {
      const type = trafficTypes[index % trafficTypes.length];
      const mesh = new THREE.Group();
      const wheels: THREE.Mesh[] = [];

      let width = 2.0;
      let length = 4.2;
      let height = 1.3;
      let carColor = 0x3b82f6;

      if (type === 'taxi') {
        carColor = 0xf59e0b;
      } else if (type === 'sports') {
        carColor = 0x10b981;
        length = 4.0;
      } else if (type === 'truck') {
        carColor = 0x64748b;
        width = 2.4;
        length = 7.5;
        height = 2.4;
      }

      // 바디 메쉬
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(width, height * 0.45, length),
        new THREE.MeshStandardMaterial({ color: carColor, metalness: 0.6, roughness: 0.3 })
      );
      body.position.y = (height * 0.45) / 2 + 0.25;
      mesh.add(body);

      // 캐빈 / 윈도우
      if (type !== 'truck') {
        const cabinMesh = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.8, height * 0.45, length * 0.5),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
        );
        cabinMesh.position.set(0, height * 0.65, 0);
        mesh.add(cabinMesh);
      } else {
        // 트럭 캐빈 + 화물 컨테이너
        const cab = new THREE.Mesh(
          new THREE.BoxGeometry(width * 0.9, height * 0.6, 2.2),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.5 })
        );
        cab.position.set(0, height * 0.5, -length * 0.3);
        mesh.add(cab);

        const containerMesh = new THREE.Mesh(
          new THREE.BoxGeometry(width, height * 0.7, length * 0.65),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
        );
        containerMesh.position.set(0, height * 0.55, length * 0.15);
        mesh.add(containerMesh);
      }

      // 타이어
      const twPositions = [
        [-width / 2, 0.35, -length * 0.3],
        [width / 2, 0.35, -length * 0.3],
        [-width / 2, 0.35, length * 0.3],
        [width / 2, 0.35, length * 0.3],
      ];
      twPositions.forEach(([tx, ty, tz]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.position.set(tx, ty, tz);
        mesh.add(w);
        wheels.push(w);
      });

      // 초기 차선 및 Z 위치 (스폰 안전 간격 확보)
      const lane = Math.floor(Math.random() * 4);
      const z = -60 - index * 45;
      mesh.position.set(LANES[lane], 0, z);

      scene.add(mesh);

      return {
        mesh,
        wheels,
        lane,
        z,
        speed: 18 + Math.random() * 8, // 65 ~ 95 km/h
        type,
        width,
        length,
        passed: false,
      };
    };

    for (let i = 0; i < 9; i++) {
      trafficList.push(createTrafficVehicle(i));
    }

    // --- 파티클 시스템 (충돌 스파크 & 니트로 워프 스트릭) ---
    // 1) 스파크
    const sparkCount = 60;
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkVel = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) {
      sparkPos[i] = 0;
      sparkVel[i] = (Math.random() - 0.5) * 15;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0xffaa00, size: 0.35, transparent: true, opacity: 0 });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // 2) 니트로 스피드 라인 스트릭
    const nitroCount = 120;
    const nitroPos = new Float32Array(nitroCount * 3);
    for (let i = 0; i < nitroCount; i++) {
      nitroPos[i * 3] = (Math.random() - 0.5) * 14;
      nitroPos[i * 3 + 1] = Math.random() * 4 + 0.5;
      nitroPos[i * 3 + 2] = -Math.random() * 60;
    }
    const nitroParticleGeo = new THREE.BufferGeometry();
    nitroParticleGeo.setAttribute('position', new THREE.BufferAttribute(nitroPos, 3));
    const nitroMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.25, transparent: true, opacity: 0 });
    const nitroParticles = new THREE.Points(nitroParticleGeo, nitroMat);
    scene.add(nitroParticles);

    const clock = new THREE.Clock();

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerCar,
      playerWheels,
      playerFlames,
      playerHeadlights,
      roadSegments,
      trafficList,
      sparks,
      nitroParticles,
      nitroParticleGeo,
      sparkGeo,
      animId: 0,
      clock,
    };

    // --- 리사이즈 핸들러 ---
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // --- 애니메이션 메인 루프 ---
    const animate = () => {
      const state = stateRef.current;
      const delta = Math.min(clock.getDelta(), 0.1);

      if (state.gameState === 'playing') {
        // 1. 속도 계산 (가속/감속/니트로/브레이크)
        let targetSpeed = 38; // 기본 약 137 km/h
        if (state.isNitro && state.nitro > 0) {
          targetSpeed = 72; // 니트로 가동 약 260 km/h
          state.nitro = Math.max(0, state.nitro - delta * 30);
        } else {
          // 니트로 자연 충전
          state.nitro = Math.min(100, state.nitro + delta * 8);
        }

        if (state.isBrake) {
          targetSpeed = 15; // 급제동 약 54 km/h
        }

        // 부드러운 가속 보간
        state.speed += (targetSpeed - state.speed) * delta * 2.5;
        state.distance += state.speed * delta;

        // UI 상태 주기적 동기화
        setSpeedKmH(Math.round(state.speed * 3.6));
        setDistanceMeters(Math.min(TARGET_DISTANCE, Math.round(state.distance)));
        setNitroFuel(Math.round(state.nitro));
        setIsNitroActive(state.isNitro && state.nitro > 0);
        setIsBraking(state.isBrake);

        // 승리 검사
        if (state.distance >= TARGET_DISTANCE) {
          handleFinishVictory();
        }

        // 2. 플레이어 조향 (Screen-relative 100% 일치)
        // targetX 방향으로 부드럽게 이동
        const steerDiff = state.targetX - state.playerX;
        state.playerX += steerDiff * delta * 8;
        // 차량 바디 롤링 (좌우 회전 시 살짝 기울어짐)
        playerCar.rotation.z = -steerDiff * 0.1;
        playerCar.rotation.y = -steerDiff * 0.08;
        playerCar.position.x = state.playerX;

        // 3. 타이어 회전 & 니트로 화염 이펙트
        const wheelRotSpeed = state.speed * delta * 3;
        playerWheels.forEach((w) => {
          w.rotation.x += wheelRotSpeed;
        });

        if (state.isNitro && state.nitro > 0) {
          playerFlames.forEach((flame) => {
            (flame.material as THREE.MeshBasicMaterial).opacity = 0.85 + Math.random() * 0.15;
            flame.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.5, 1);
          });
          (nitroMat as THREE.PointsMaterial).opacity = 0.7;
          // 카메라 FOV 니트로 워프
          camera.fov = THREE.MathUtils.lerp(camera.fov, 78, delta * 4);
        } else {
          playerFlames.forEach((flame) => {
            (flame.material as THREE.MeshBasicMaterial).opacity = 0;
          });
          (nitroMat as THREE.PointsMaterial).opacity = 0;
          camera.fov = THREE.MathUtils.lerp(camera.fov, 65, delta * 4);
        }
        camera.updateProjectionMatrix();

        // 4. 무적 타이머 감소 및 깜빡임
        if (state.invincibleTimer > 0) {
          state.invincibleTimer -= delta;
          playerCar.visible = Math.floor(state.invincibleTimer * 10) % 2 === 0;
        } else {
          playerCar.visible = true;
        }

        // 5. 도로 무한 루핑 스크롤
        roadSegments.forEach((seg) => {
          seg.position.z += state.speed * delta;
          if (seg.position.z > ROAD_SEGMENT_LENGTH) {
            seg.position.z -= ROAD_SEGMENT_LENGTH * 3;
          }
        });

        // 6. 트래픽 차량 이동 & 충돌 & 근접 추월(Close Overtake) 감지
        trafficList.forEach((tv) => {
          // 트래픽 전진 속도와 플레이어 속도의 상대 이동
          const relativeSpeed = state.speed - tv.speed;
          tv.z += relativeSpeed * delta;
          tv.mesh.position.z = tv.z;
          tv.mesh.position.x = LANES[tv.lane];

          // 트래픽 바퀴 회전
          tv.wheels.forEach((w) => {
            w.rotation.x += tv.speed * delta * 3;
          });

          // A. 충돌 판정
          if (state.invincibleTimer <= 0) {
            const dx = Math.abs(state.playerX - tv.mesh.position.x);
            const dz = Math.abs(tv.z); // 플레이어 Z는 0
            if (dx < 1.7 && dz < (tv.length / 2 + 2.0)) {
              // 충돌 발생!
              state.health -= 1;
              setHealth(state.health);
              state.invincibleTimer = 1.8;
              state.speed = Math.max(15, state.speed * 0.4); // 급감속
              triggerHaptic([120, 60, 120]);

              // 스파크 폭발
              (sparkMat as THREE.PointsMaterial).opacity = 1;
              sparks.position.set(state.playerX, 0.5, 0);

              if (state.health <= 0) {
                handleCrashGameOver();
              }
            }
          }

          // B. 근접 추월 (Close Overtake) 판정
          // 트래픽 차량을 플레이어가 앞지를 때 (tv.z 가 -2에서 +3 사이를 지날 때)
          if (!tv.passed && tv.z > 0 && tv.z < 3.5) {
            const dx = Math.abs(state.playerX - tv.mesh.position.x);
            // 같은 차선이 아니면서 2.8m 이내로 근접하게 지나쳤을 때
            if (dx > 1.6 && dx < 3.6 && state.speed > 30) {
              tv.passed = true;
              handleOvertakeSuccess();
            }
          }

          // C. 트래픽 리스폰 (플레이어 뒤로 30m 넘어가면 저 멀리 앞쪽으로 재배치)
          if (tv.z > 25) {
            tv.z = -160 - Math.random() * 80;
            // 비어있는 다른 차선 무작위 선택
            tv.lane = Math.floor(Math.random() * 4);
            tv.speed = 18 + Math.random() * 8;
            tv.passed = false;
          }
        });

        // 7. 스파크 감쇠
        if ((sparkMat as THREE.PointsMaterial).opacity > 0) {
          (sparkMat as THREE.PointsMaterial).opacity -= delta * 2;
        }

        // 8. 니트로 스트릭 파티클 애니메이션
        if (state.isNitro && state.nitro > 0) {
          const positions = nitroParticleGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < nitroCount; i++) {
            positions[i * 3 + 2] += state.speed * delta * 2.5;
            if (positions[i * 3 + 2] > 5) {
              positions[i * 3 + 2] = -80 - Math.random() * 40;
              positions[i * 3] = (Math.random() - 0.5) * 14;
              positions[i * 3 + 1] = Math.random() * 4 + 0.5;
            }
          }
          nitroParticleGeo.attributes.position.needsUpdate = true;
        }
      }

      // 카메라 시점 업데이트
      if (state.cameraMode === 'chase') {
        // 3인칭 체이스 뷰: 플레이어의 뒤쪽 약간 위에서 따라감
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.playerX, delta * 8);
        camera.position.y = 4.2;
        camera.position.z = 7.5;
        camera.lookAt(state.playerX * 0.8, 1.2, -18);
      } else {
        // 본넷 콕핏 뷰: 차량 본넷 앞머리 시점
        camera.position.x = state.playerX;
        camera.position.y = 1.0;
        camera.position.z = -1.2;
        camera.lookAt(state.playerX, 1.0, -30);
      }

      renderer.render(scene, camera);
      threeRef.current!.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
        renderer.dispose();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cardId, handleCrashGameOver, handleFinishVictory, handleOvertakeSuccess, triggerHaptic]);

  // 카메라 모드 토글
  const toggleCamera = () => {
    const nextMode = cameraMode === 'chase' ? 'hood' : 'chase';
    setCameraMode(nextMode);
    stateRef.current.cameraMode = nextMode;
    triggerHaptic(30);
  };

  // 니트로 버튼 핸들러
  const handleNitroStart = () => {
    stateRef.current.isNitro = true;
    setIsNitroActive(true);
    triggerHaptic(40);
  };
  const handleNitroEnd = () => {
    stateRef.current.isNitro = false;
    setIsNitroActive(false);
  };

  // 브레이크 버튼 핸들러
  const handleBrakeStart = () => {
    stateRef.current.isBrake = true;
    setIsBraking(true);
    triggerHaptic(30);
  };
  const handleBrakeEnd = () => {
    stateRef.current.isBrake = false;
    setIsBraking(false);
  };

  // 화면 터치 스와이프 조향 (Screen-relative 완벽 일치)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    stateRef.current.touchStartX = touch.clientX;
    stateRef.current.isSteeringTouch = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'playing' || !stateRef.current.isSteeringTouch) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - stateRef.current.touchStartX;

    // 감도 조절: 화면 기준 오른쪽으로 드래그하면 +X, 왼쪽으로 드래그하면 -X
    const deltaLane = (diffX / window.innerWidth) * 12;
    stateRef.current.targetX = THREE.MathUtils.clamp(
      stateRef.current.targetX + deltaLane * 0.15,
      -5.0,
      5.0
    );
    stateRef.current.touchStartX = touch.clientX;
  };

  const handleTouchEnd = () => {
    stateRef.current.isSteeringTouch = false;
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 text-white font-mono flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js 3D 뷰포트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 상단 미니멀 HUD */}
      <MinimalistMissionHUD
        gameTitle="MR RACER 3D"
        onQuit={handleExit}
        progressPercent={Math.min(100, Math.round((distanceMeters / TARGET_DISTANCE) * 100))}
        customScore={distanceMeters}
        scoreLabel="DIST (M)"
        rewardPreview={35}
      />

      {/* 근접 추월 콤보 배너 */}
      {overtakeComboBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="bg-amber-500/90 text-black px-4 py-1.5 rounded-sm font-black text-sm tracking-wider shadow-lg border border-amber-300">
            {overtakeComboBanner}
          </div>
        </div>
      )}

      {/* 레이싱 상태 게이지 바 (속도, 니트로, 실드, 시점 전환) */}
      {gameState === 'playing' && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* 속도계 & 추월 */}
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-sm flex items-center gap-3">
            <div>
              <div className="text-[10px] text-slate-400">SPEED</div>
              <div className="text-lg font-black text-cyan-400 leading-none">
                {speedKmH} <span className="text-[10px] text-white">KM/H</span>
              </div>
            </div>
            <div className="w-[1px] h-6 bg-slate-700" />
            <div>
              <div className="text-[10px] text-slate-400">OVERTAKES</div>
              <div className="text-base font-bold text-amber-400 leading-none">{overtakes}</div>
            </div>
          </div>

          {/* 니트로 게이지 & 하트 & 카메라 전환 */}
          <div className="flex items-center gap-2">
            {/* 하트 실드 */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-2.5 py-1.5 rounded-sm flex items-center gap-1">
              {[1, 2, 3].map((h) => (
                <span key={h} className={`text-sm ${h <= health ? 'text-red-500' : 'text-slate-600'}`}>
                  ♥
                </span>
              ))}
            </div>

            {/* 카메라 토글 버튼 */}
            <button
              onClick={toggleCamera}
              className="pointer-events-auto bg-slate-800/90 active:bg-slate-700 border border-slate-600 px-2.5 py-1.5 rounded-sm text-xs font-bold text-slate-200"
            >
              🎥 {cameraMode === 'chase' ? 'CHASE' : 'HOOD'}
            </button>
          </div>
        </div>
      )}

      {/* 게임 시작 대기 오버레이 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-1">
              [POKI POPULAR 110: NO.086]
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              MR RACER - CAR RACING 3D
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              4차선 고속도로를 초고속으로 질주하세요! 트래픽 차량을 아슬아슬하게 추월하며 니트로 부스트로 1,500m 결승선을 돌파하세요.
            </p>

            {/* 영웅 배지 및 조작 가이드 */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 mb-6 rounded-sm text-left text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <span>[✦] 공식 배지:</span> No.086 하이퍼카 보닛 및 스타트 라인 장착
              </div>
              <div className="flex items-center gap-2">
                <span>[◀ / ▶]</span> 터치 슬라이더 또는 좌우 버튼으로 신속한 차선 변경
              </div>
              <div className="flex items-center gap-2">
                <span>[🔥 NITRO]</span> 부스트 홀드로 시속 260km/h 초광속 질주
              </div>
              <div className="flex items-center gap-2">
                <span>[🛑 BRAKE]</span> 긴급 감속으로 트래픽 충돌 방지
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-black text-lg rounded-sm tracking-wider uppercase shadow-lg transition-transform active:scale-95"
            >
              START RACE 🏁
            </button>
          </div>
        </div>
      )}

      {/* 충돌 게임오버 오버레이 */}
      {gameState === 'crashed' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/50 p-6 rounded-none shadow-2xl">
            <div className="text-3xl mb-2">💥</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">TOTAL CRASH!</h2>
            <p className="text-xs text-slate-400 mb-4">차량이 대파되었습니다. 주행 실적에 따라 보상이 정산됩니다.</p>

            <div className="bg-slate-950 p-3 rounded-sm border border-slate-800 mb-5 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">주행 거리:</span>
                <span className="font-bold text-white">{distanceMeters} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">근접 추월:</span>
                <span className="font-bold text-amber-400">{overtakes} 회</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm text-sm tracking-wider"
              >
                RETRY
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-sm text-sm"
              >
                QUIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승리 모달 */}
      {gameState === 'victory' && (
        <VictoryRewardModal
          isOpen={true}
          onClose={handleExit}
          receipt={rewardReceipt}
          title="CHAMPION FINISH!"
          subtitle="1,500m 고속도로를 완벽하게 정복했습니다!"
        />
      )}

      {/* 하단 모바일 퓨어 터치 컨트롤러 (100% 모바일 퓨어 제스처 원칙 준수) */}
      {gameState === 'playing' && (
        <div className="mt-auto z-20 pb-6 px-4 flex items-end justify-between pointer-events-auto">
          {/* 좌측: 좌/우 원터치 퀵 레인 시프트 버튼 군 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftLane('left')}
              className="w-16 h-16 bg-slate-900/90 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 rounded-sm flex flex-col items-center justify-center text-white font-black text-xl shadow-lg transition-transform active:scale-95"
            >
              <span>◀</span>
              <span className="text-[9px] text-slate-400 font-normal">LANE</span>
            </button>
            <button
              onClick={() => shiftLane('right')}
              className="w-16 h-16 bg-slate-900/90 active:bg-cyan-600 border border-slate-700 active:border-cyan-400 rounded-sm flex flex-col items-center justify-center text-white font-black text-xl shadow-lg transition-transform active:scale-95"
            >
              <span>▶</span>
              <span className="text-[9px] text-slate-400 font-normal">LANE</span>
            </button>
          </div>

          {/* 중앙: 스와이프 안내 힌트 라벨 */}
          <div className="hidden sm:block text-[10px] text-slate-500 text-center pb-2">
            화면 좌우 스와이프로 정밀 조향 가능
          </div>

          {/* 우측: 64px [🛑 BRAKE] + 76px [🔥 NITRO] 대형 액션 버튼 군 */}
          <div className="flex items-end gap-3">
            <button
              onTouchStart={handleBrakeStart}
              onTouchEnd={handleBrakeEnd}
              onMouseDown={handleBrakeStart}
              onMouseUp={handleBrakeEnd}
              className={`w-16 h-16 rounded-sm flex flex-col items-center justify-center font-black text-xs border transition-all ${
                isBraking
                  ? 'bg-amber-600 border-amber-400 text-white scale-95 shadow-inner'
                  : 'bg-slate-900/90 border-slate-700 text-amber-400 shadow-lg'
              }`}
            >
              <span className="text-base leading-none">🛑</span>
              <span className="text-[9px] mt-1 font-bold">BRAKE</span>
            </button>

            <button
              onTouchStart={handleNitroStart}
              onTouchEnd={handleNitroEnd}
              onMouseDown={handleNitroStart}
              onMouseUp={handleNitroEnd}
              className={`w-20 h-20 rounded-sm flex flex-col items-center justify-center font-black text-sm border shadow-xl transition-all ${
                isNitroActive
                  ? 'bg-cyan-500 border-cyan-300 text-black scale-95 shadow-cyan-500/50'
                  : 'bg-slate-900/90 border-cyan-500/70 text-cyan-400'
              }`}
            >
              <span className="text-xl leading-none">🔥</span>
              <span className="text-[10px] mt-1 tracking-wider font-black">NITRO</span>
              <span className="text-[8px] opacity-75">{nitroFuel}%</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
