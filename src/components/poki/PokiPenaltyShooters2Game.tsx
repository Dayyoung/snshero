import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPenaltyShooters2GameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

type TurnMode = 'shoot' | 'save';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export default function PokiPenaltyShooters2Game({
  onBack,
  onClose,
  cardId = 81,
  onExit
}: PokiPenaltyShooters2GameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'roundResult' | 'victory' | 'gameover'>('ready');
  const [round, setRound] = useState<number>(1);
  const [turn, setTurn] = useState<TurnMode>('shoot');
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [playerKicks, setPlayerKicks] = useState<(boolean | null)[]>([null, null, null, null, null]);
  const [aiKicks, setAiKicks] = useState<(boolean | null)[]>([null, null, null, null, null]);
  const [roundBanner, setRoundBanner] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 3D 내부 참조 Ref
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 골대 & 공 & 캐릭터
    ballMesh: null as THREE.Mesh | null,
    ballPos: new THREE.Vector3(0, 0.3, 11),
    ballVelocity: new THREE.Vector3(),
    ballInFlight: false,
    isCurveShot: false,

    keeperGroup: null as THREE.Group | null,
    keeperPos: new THREE.Vector3(0, 1.2, 0.5),
    keeperVelocity: new THREE.Vector3(),
    keeperDiving: false,

    kickerGroup: null as THREE.Group | null,
    kickerPos: new THREE.Vector3(-0.6, 0.8, 12),

    // 키커 턴 조준 타깃
    aimX: 0, // -3.0 ~ 3.0
    aimY: 1.4, // 0.4 ~ 2.2
    isDraggingAim: false,
    aimMarkerMesh: null as THREE.Mesh | null,

    // 키퍼 턴 조작 (글러브 이동)
    playerGloveX: 0,
    playerGloveY: 1.2,

    // 파티클
    particles: [] as Particle[],
    particleGeo: new THREE.SphereGeometry(0.08, 6, 6),

    // 상태 플래그
    turn: 'shoot' as TurnMode,
    round: 1,
    playerScore: 0,
    aiScore: 0,
    shotTimer: 0,
    startTime: Date.now(),
  });

  // 파티클 생성
  const spawnParticles = (pos: THREE.Vector3, colorHex: number, count: number, speed: number = 3) => {
    const scene = stateRef.current.scene;
    if (!scene) return;
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(stateRef.current.particleGeo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      stateRef.current.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() * 0.8 + 0.2) * speed,
        vz: (Math.random() - 0.5) * speed,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
      });
    }
  };

  // 라운드/턴 리셋
  const resetForNextTurn = useCallback((nextRound: number, nextTurn: TurnMode) => {
    const s = stateRef.current;
    s.round = nextRound;
    s.turn = nextTurn;
    s.ballInFlight = false;
    s.isCurveShot = false;
    s.keeperDiving = false;
    s.ballVelocity.set(0, 0, 0);
    s.keeperVelocity.set(0, 0, 0);

    setRound(nextRound);
    setTurn(nextTurn);
    setRoundBanner(null);

    // 공 및 캐릭터 위치 세팅
    s.ballPos.set(0, 0.3, 11);
    s.keeperPos.set(0, 1.2, 0.5);
    s.kickerPos.set(-0.6, 0.8, 12);
    s.aimX = 0;
    s.aimY = 1.4;
    s.playerGloveX = 0;
    s.playerGloveY = 1.2;

    if (s.ballMesh) s.ballMesh.position.copy(s.ballPos);
    if (s.keeperGroup) s.keeperGroup.position.copy(s.keeperPos);

    // 카메라 전환 (키커 턴 vs 키퍼 턴)
    if (s.camera) {
      if (nextTurn === 'shoot') {
        s.camera.position.set(0, 3.2, 16);
        s.camera.lookAt(0, 1.4, 0);
      } else {
        s.camera.position.set(0, 2.0, -1.8);
        s.camera.lookAt(0, 1.2, 11);
      }
    }

    // AI 키커 턴일 경우 1.2초 후 자동 슛 발사
    if (nextTurn === 'save') {
      setTimeout(() => {
        triggerAiKick();
      }, 1200);
    }
  }, []);

  // [키커 턴] 플레이어 슈팅 (직사 강슛)
  const triggerShoot = (curve: boolean = false) => {
    const s = stateRef.current;
    if (gameState !== 'playing' || s.turn !== 'shoot' || s.ballInFlight) return;

    s.ballInFlight = true;
    s.isCurveShot = curve;
    s.shotTimer = 0;

    if (navigator.vibrate) navigator.vibrate(35);

    // 슛 탄도 속도 계산 (11m를 약 0.45초에 돌파)
    const targetZ = 0.2;
    const timeToTarget = 0.45;
    const vz = (targetZ - s.ballPos.z) / timeToTarget;
    const vx = (s.aimX - s.ballPos.x) / timeToTarget;
    const vy = (s.aimY - s.ballPos.y) / timeToTarget + 0.5 * 9.8 * timeToTarget;

    s.ballVelocity.set(vx, vy, vz);

    // AI 키퍼 다이빙 확률 계산 (약 60% 확률로 반응, 구석이면 세이브 어려움)
    const aiDiveDir = Math.random() < 0.5 ? 1 : -1;
    const willDiveCorrect = Math.random() < 0.65;
    const diveTargetX = willDiveCorrect ? s.aimX * 0.85 : aiDiveDir * 2.2;

    setTimeout(() => {
      s.keeperDiving = true;
      s.keeperVelocity.x = (diveTargetX - s.keeperPos.x) / 0.35;
      s.keeperVelocity.y = (s.aimY - s.keeperPos.y) / 0.4;
    }, 100);

    // 결과 판정 (0.45초 후)
    setTimeout(() => {
      evaluateKickerShot();
    }, 500);
  };

  // 키커 턴 결과 판정
  const evaluateKickerShot = () => {
    const s = stateRef.current;
    const distToKeeper = Math.hypot(s.ballPos.x - s.keeperPos.x, s.ballPos.y - s.keeperPos.y);

    // 골대 유효 범위 (가로 -3.4 ~ 3.4, 세로 0.1 ~ 2.4)
    const inGoal = Math.abs(s.ballPos.x) <= 3.4 && s.ballPos.y >= 0.1 && s.ballPos.y <= 2.4;
    const isSaved = inGoal && distToKeeper < 1.1;

    let isGoal = false;
    if (inGoal && !isSaved) {
      isGoal = true;
      s.playerScore += 1;
      setPlayerScore(s.playerScore);
      setRoundBanner('⚽ GOAL! 완벽한 골!');
      spawnParticles(s.ballPos.clone(), 0x22c55e, 30, 4);
      if (navigator.vibrate) navigator.vibrate([50, 60, 50, 80]);
    } else if (isSaved) {
      setRoundBanner('❌ SAVED! 키퍼 선방!');
      spawnParticles(s.ballPos.clone(), 0xef4444, 20, 3);
      if (navigator.vibrate) navigator.vibrate(80);
    } else {
      setRoundBanner('❌ MISS! 골대 빗나감!');
      if (navigator.vibrate) navigator.vibrate(60);
    }

    // 킥 기록 갱신
    setPlayerKicks((prev) => {
      const next = [...prev];
      if (s.round - 1 < next.length) next[s.round - 1] = isGoal;
      return next;
    });

    // 다음 턴(키퍼 턴)으로 전환
    setTimeout(() => {
      resetForNextTurn(s.round, 'save');
    }, 1800);
  };

  // [키퍼 턴] AI 키커 슈팅 실행
  const triggerAiKick = () => {
    const s = stateRef.current;
    if (gameState !== 'playing' || s.turn !== 'save' || s.ballInFlight) return;

    s.ballInFlight = true;
    s.shotTimer = 0;

    // AI 슈팅 목표 지점 랜덤 (골대 안)
    const targetX = (Math.random() - 0.5) * 5.5; // -2.75 ~ 2.75
    const targetY = 0.5 + Math.random() * 1.7;   // 0.5 ~ 2.2
    s.aimX = targetX;
    s.aimY = targetY;

    const timeToTarget = 0.55;
    const vz = (0.2 - s.ballPos.z) / timeToTarget;
    const vx = (targetX - s.ballPos.x) / timeToTarget;
    const vy = (targetY - s.ballPos.y) / timeToTarget + 0.5 * 9.8 * timeToTarget;

    s.ballVelocity.set(vx, vy, vz);

    // 0.55초 후 키퍼 판정
    setTimeout(() => {
      evaluateKeeperSave();
    }, 580);
  };

  // 플레이어 골키퍼 다이빙 버튼 (DIVE)
  const triggerKeeperDive = () => {
    const s = stateRef.current;
    if (gameState !== 'playing' || s.turn !== 'save' || s.keeperDiving) return;

    s.keeperDiving = true;
    s.keeperVelocity.x = (s.playerGloveX - s.keeperPos.x) * 4.0;
    s.keeperVelocity.y = (s.playerGloveY - s.keeperPos.y) * 4.0;

    if (navigator.vibrate) navigator.vibrate(40);
  };

  // 키퍼 턴 결과 판정
  const evaluateKeeperSave = () => {
    const s = stateRef.current;
    const distToGlove = Math.hypot(s.ballPos.x - s.playerGloveX, s.ballPos.y - s.playerGloveY);

    const isSaved = distToGlove < 1.4;
    let aiScored = false;

    if (isSaved) {
      setRoundBanner('🧤 SUPER SAVE! 슈퍼 세이브!');
      spawnParticles(s.ballPos.clone(), 0x38bdf8, 30, 4);
      if (navigator.vibrate) navigator.vibrate([60, 80, 100]);
    } else {
      aiScored = true;
      s.aiScore += 1;
      setAiScore(s.aiScore);
      setRoundBanner('⚽ AI GOAL! 실점...');
      spawnParticles(s.ballPos.clone(), 0xef4444, 20, 3);
      if (navigator.vibrate) navigator.vibrate(80);
    }

    setAiKicks((prev) => {
      const next = [...prev];
      if (s.round - 1 < next.length) next[s.round - 1] = aiScored;
      return next;
    });

    // 라운드 종료 체크
    setTimeout(() => {
      if (s.round >= 5) {
        // 승부차기 종료
        if (s.playerScore > s.aiScore) {
          handleVictory();
        } else if (s.playerScore < s.aiScore) {
          handleGameOver();
        } else {
          // 동점 시 서든데스
          resetForNextTurn(s.round + 1, 'shoot');
        }
      } else {
        // 다음 라운드로 진행
        resetForNextTurn(s.round + 1, 'shoot');
      }
    }, 1800);
  };

  // 터치 드래그로 타깃 / 글러브 조준
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nx = (touch.clientX - rect.left) / rect.width;
    const ny = (touch.clientY - rect.top) / rect.height;

    const s = stateRef.current;
    if (s.turn === 'shoot') {
      // 골대 좌우(-3.2 ~ 3.2), 상하(0.3 ~ 2.2)
      s.aimX = (nx - 0.5) * 6.4;
      s.aimY = (1.0 - ny) * 2.5;
    } else {
      // 키퍼 글러브 위치
      s.playerGloveX = (nx - 0.5) * 6.0;
      s.playerGloveY = Math.max(0.4, Math.min(2.3, (1.0 - ny) * 2.6));
    }
  };

  // 승리 처리
  const handleVictory = () => {
    setGameState('victory');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'penalty-shooters-2',
      gameTitle: '페널티 슈터스 2 3D (Penalty Shooters 2)',
      isVictory: true,
      score: 1000,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 패배 처리
  const handleGameOver = () => {
    setGameState('gameover');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'penalty-shooters-2',
      gameTitle: '페널티 슈터스 2 3D (Penalty Shooters 2)',
      isVictory: false,
      score: s.playerScore * 180,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 중도 포기 정산
  const confirmExit = () => {
    setShowExitModal(false);
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    calculateAndDepositMissionReward({
      gameId: 'penalty-shooters-2',
      gameTitle: '페널티 슈터스 2 3D (Penalty Shooters 2)',
      isVictory: false,
      score: s.playerScore * 150,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    handleExit();
  };

  // 재시작
  const restartGame = () => {
    const s = stateRef.current;
    s.playerScore = 0;
    s.aiScore = 0;
    s.round = 1;
    s.startTime = Date.now();
    setPlayerScore(0);
    setAiScore(0);
    setPlayerKicks([null, null, null, null, null]);
    setAiKicks([null, null, null, null, null]);
    setRewardReceipt(null);
    setGameState('playing');
    resetForNextTurn(1, 'shoot');
  };

  // Three.js 환경 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0284c7); // 청명한 축구장 하늘
    scene.fog = new THREE.FogExp2(0x0284c7, 0.015);
    stateRef.current.scene = scene;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 3.2, 16);
    camera.lookAt(0, 1.4, 0);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(15, 25, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 3D 잔디 축구장 (Green lawn)
    const pitchGeo = new THREE.PlaneGeometry(32, 36);
    const pitchMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // 잔디 투톤 스트라이프
    for (let i = -16; i < 16; i += 4) {
      const stripeGeo = new THREE.PlaneGeometry(32, 2);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.01, i);
      scene.add(stripe);
    }

    // 페널티 에어리어 백색 라인
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // 골 라인
    const goalLine = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.15), lineMat);
    goalLine.rotation.x = -Math.PI / 2;
    goalLine.position.set(0, 0.02, 0.2);
    scene.add(goalLine);

    // 페널티 스팟 (11m 지점 No.081 영웅 배지 엠블럼)
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const badgeCtx = badgeCanvas.getContext('2d');
    if (badgeCtx) {
      drawCardSprite(badgeCtx, cardId, 0, 0, 256, 256);
      const badgeTex = new THREE.CanvasTexture(badgeCanvas);
      const badgePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 2.5),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, opacity: 0.9 })
      );
      badgePlane.rotation.x = -Math.PI / 2;
      badgePlane.position.set(0, 0.03, 11);
      scene.add(badgePlane);
    }

    // --- 3D 축구 골대 (Goalposts & Net) ---
    const goalGroup = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.3 });
    // 좌우 기둥 (폭 7.3m -> x = -3.65, 3.65, 높이 2.44m)
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.44, 12), postMat);
    postL.position.set(-3.65, 1.22, 0);
    goalGroup.add(postL);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.44, 12), postMat);
    postR.position.set(3.65, 1.22, 0);
    goalGroup.add(postR);

    // 크로스바
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.3, 12), postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 2.44, 0);
    goalGroup.add(crossbar);

    // 반투명 골망 (Net)
    const netGeo = new THREE.BoxGeometry(7.3, 2.44, 1.6);
    const netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.4 });
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(0, 1.22, -0.8);
    goalGroup.add(netMesh);

    scene.add(goalGroup);

    // --- 3D 공인구 축구공 ---
    const ballGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.copy(stateRef.current.ballPos);
    ballMesh.castShadow = true;
    scene.add(ballMesh);
    stateRef.current.ballMesh = ballMesh;

    // 조준 타깃 마커 링 (키커 턴)
    const aimGeo = new THREE.RingGeometry(0.35, 0.45, 16);
    const aimMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const aimMarker = new THREE.Mesh(aimGeo, aimMat);
    aimMarker.position.set(0, 1.4, 0.3);
    scene.add(aimMarker);
    stateRef.current.aimMarkerMesh = aimMarker;

    // --- 3D 골키퍼 모델링 ---
    const keeperGroup = new THREE.Group();
    const kBody = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
    kBody.position.y = 0.45;
    keeperGroup.add(kBody);
    const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    kHead.position.y = 1.1;
    keeperGroup.add(kHead);

    // 골키퍼 대형 장갑 2개 (골든 글러브)
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });
    const gloveL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.2), gloveMat);
    gloveL.position.set(-0.6, 0.6, 0);
    keeperGroup.add(gloveL);
    const gloveR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.2), gloveMat);
    gloveR.position.set(0.6, 0.6, 0);
    keeperGroup.add(gloveR);

    keeperGroup.position.copy(stateRef.current.keeperPos);
    scene.add(keeperGroup);
    stateRef.current.keeperGroup = keeperGroup;

    // 리사이즈
    const handleResize = () => {
      if (!container || !stateRef.current.renderer || !stateRef.current.camera) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      stateRef.current.camera.aspect = nw / nh;
      stateRef.current.camera.updateProjectionMatrix();
      stateRef.current.renderer.setSize(nw, nh, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 애니메이션 루프
    const animate = () => {
      stateRef.current.animFrame = requestAnimationFrame(animate);
      const dt = Math.min(stateRef.current.clock.getDelta(), 0.1);
      const s = stateRef.current;
      const time = s.clock.getElapsedTime();

      // 타깃 마커 위치 갱신
      if (s.aimMarkerMesh) {
        if (s.turn === 'shoot') {
          s.aimMarkerMesh.position.set(s.aimX, s.aimY, 0.3);
          s.aimMarkerMesh.visible = !s.ballInFlight;
        } else {
          // 키퍼 턴에는 글러브 위치 표시
          s.aimMarkerMesh.position.set(s.playerGloveX, s.playerGloveY, 0.6);
          s.aimMarkerMesh.visible = true;
        }
      }

      // 키퍼 기본 바운스 대기 동작
      if (!s.keeperDiving && s.keeperGroup) {
        s.keeperGroup.position.y = 0.8 + Math.sin(time * 8) * 0.1;
      }

      // 공 비행 물리
      if (s.ballInFlight) {
        s.ballPos.x += s.ballVelocity.x * dt;
        s.ballPos.y += s.ballVelocity.y * dt;
        s.ballPos.z += s.ballVelocity.z * dt;

        s.ballVelocity.y -= 9.8 * dt; // 중력 가속도

        // 커브 슛 회전 스핀
        if (s.isCurveShot) {
          s.ballVelocity.x += (s.aimX > 0 ? -4 : 4) * dt;
        }

        if (s.ballMesh) {
          s.ballMesh.position.copy(s.ballPos);
          s.ballMesh.rotation.x += 15 * dt;
        }

        // 공 궤적 파티클
        if (Math.random() < 0.4) {
          spawnParticles(s.ballPos.clone(), 0xffffff, 1, 0.5);
        }
      }

      // 키퍼 다이빙 물리
      if (s.keeperDiving && s.keeperGroup) {
        s.keeperPos.x += s.keeperVelocity.x * dt;
        s.keeperPos.y += s.keeperVelocity.y * dt;
        s.keeperGroup.position.copy(s.keeperPos);
        s.keeperGroup.rotation.z = -s.keeperVelocity.x * 0.15;
      }

      // 파티클 업데이트
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 4.0 * dt;
        const scale = Math.max(0.01, 1 - p.life / p.maxLife);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          s.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    stateRef.current.animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(stateRef.current.animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cardId]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchMove={handleTouchMove}
    >
      {/* 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="PENALTY SHOOTERS 2 3D"
        scoreDisplay={`ROUND ${round}/5 | ${turn === 'shoot' ? 'KICKER TURN' : 'KEEPER TURN'}`}
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 승부차기 전광판 (KOR vs AI 인디케이터) */}
      <div className="absolute top-16 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
        {/* 플레이어 팀 (KOR) */}
        <div className="bg-black/70 backdrop-blur-md px-3 py-2 border border-blue-500/50 rounded-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-blue-400">KOR (YOU)</span>
            <span className="text-sm font-black text-white">{playerScore}</span>
          </div>
          <div className="flex gap-1.5">
            {playerKicks.map((k, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  k === true
                    ? 'bg-emerald-500 text-black border-emerald-300'
                    : k === false
                    ? 'bg-red-500 text-white border-red-300'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {k === true ? '⚽' : k === false ? '❌' : idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* AI 팀 */}
        <div className="bg-black/70 backdrop-blur-md px-3 py-2 border border-red-500/50 rounded-sm text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-sm font-black text-white">{aiScore}</span>
            <span className="text-xs font-black text-red-400">AI RIVAL</span>
          </div>
          <div className="flex gap-1.5 justify-end">
            {aiKicks.map((k, idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  k === true
                    ? 'bg-emerald-500 text-black border-emerald-300'
                    : k === false
                    ? 'bg-red-500 text-white border-red-300'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {k === true ? '⚽' : k === false ? '❌' : idx + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 라운드 결과 배너 */}
      {roundBanner && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-black px-6 py-2 rounded-full text-base shadow-2xl animate-bounce z-20 border-2 border-white pointer-events-none">
          {roundBanner}
        </div>
      )}

      {/* 화면 조준 가이드 툴팁 */}
      {gameState === 'playing' && !stateRef.current.ballInFlight && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300 pointer-events-none z-10">
          {turn === 'shoot' ? '화면 터치 드래그로 골대 구석을 조준하세요!' : '골키퍼 장갑을 드래그해 다이빙 선방하세요!'}
        </div>
      )}

      {/* 우측 하단 퓨어 모바일 액션 버튼 군 */}
      {gameState === 'playing' && (
        <div className="absolute right-4 bottom-6 flex gap-3 items-center pointer-events-auto z-20 select-none">
          {turn === 'shoot' ? (
            <>
              {/* 바나나 감아차기 (CURVE) */}
              <button
                onClick={() => triggerShoot(true)}
                disabled={stateRef.current.ballInFlight}
                className="w-16 h-16 rounded-full bg-gradient-to-b from-purple-500 to-indigo-600 text-white font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 border-purple-300 disabled:opacity-50"
              >
                <span>CURVE</span>
                <span className="text-[9px]">감아차기</span>
              </button>

              {/* 76px 파워 슛 (POWER SHOOT) 대형 버튼 */}
              <button
                onClick={() => triggerShoot(false)}
                disabled={stateRef.current.ballInFlight}
                className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-amber-400 to-yellow-500 text-black font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white disabled:opacity-50"
              >
                <span>SHOOT!</span>
                <span className="text-[10px] font-bold">강슛 발사</span>
              </button>
            </>
          ) : (
            <>
              {/* 76px 슈퍼 세이브 다이빙 (DIVE) 대형 버튼 */}
              <button
                onClick={triggerKeeperDive}
                className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-sky-400 to-blue-600 text-white font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white"
              >
                <span>DIVE!</span>
                <span className="text-[10px] font-bold">선방 다이빙</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* 시작(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-amber-400 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-amber-400 mb-2">PENALTY SHOOTERS 2 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              세계 최고 국가대항 3D 승부차기 토너먼트!
              <br />
              <span className="text-yellow-400 font-bold">[키커 턴]</span> 골대 구석을 터치 조준해 강슛 골망을 흔들고,
              <br />
              <span className="text-sky-400 font-bold">[키퍼 턴]</span> 상대의 슛을 슈퍼 세이브로 막아내세요!
              <br />
              5라운드 승부차기에서 승리해 우승 트로피를 차지하세요!
            </p>
            <button
              onClick={() => {
                setGameState('playing');
                resetForNextTurn(1, 'shoot');
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ 토너먼트 시작! ]
            </button>
          </div>
        </div>
      )}

      {/* 패배(Gameover) 모달 */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-red-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-red-500 mb-2">DEFEAT...</h2>
            <p className="text-xs text-slate-300 mb-4">
              승부차기에서 아쉽게 패배했습니다.
              <br />
              최종 스코어: KOR {playerScore} : {aiScore} AI
            </p>
            <div className="flex gap-2">
              <button
                onClick={restartGame}
                className="flex-1 py-3 bg-amber-500 text-black font-black text-sm rounded-sm active:scale-95"
              >
                [ 다시 도전 ]
              </button>
              <button
                onClick={handleExit}
                className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-sm rounded-sm active:scale-95 border border-slate-700"
              >
                [ 나가기 ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 승리 보상 모달 */}
      {gameState === 'victory' && rewardReceipt && (
        <VictoryRewardModal
          isOpen={true}
          receipt={rewardReceipt}
          onClose={handleExit}
        />
      )}

      {/* 중도 포기 확인 모달 */}
      {showExitModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-40">
          <div className="bg-slate-900 border border-slate-700 p-5 max-w-xs w-full text-center rounded-sm">
            <h3 className="text-lg font-bold text-white mb-2">경기를 포기할까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지 성공한 득점과 선방에 따라 SNS 보상이 안전하게 정산됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmExit}
                className="flex-1 py-2 bg-red-600 text-white font-bold text-xs rounded-sm active:scale-95"
              >
                포기하기
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2 bg-slate-700 text-slate-200 font-bold text-xs rounded-sm active:scale-95"
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { PokiPenaltyShooters2Game };
