import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Trophy, Award, ShieldAlert, Sparkles, Flame, RefreshCw } from 'lucide-react';

interface PokiSoccerSkillsWorldCupGameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

interface MatchConfig {
  stageName: string;
  opponent: string;
  oppFlag: string;
  requiredGoals: number;
  totalAttempts: number;
  hasWall: boolean;
  wallCount: number;
  gkSpeed: number;
  gkSkill: number;
}

const TOURNAMENT_ROUNDS: MatchConfig[] = [
  {
    stageName: '8강전 (Quarter-Final)',
    opponent: '호주 (AUS)',
    oppFlag: '🇦🇺',
    requiredGoals: 2,
    totalAttempts: 5,
    hasWall: false,
    wallCount: 0,
    gkSpeed: 2.2,
    gkSkill: 0.65,
  },
  {
    stageName: '4강전 (Semi-Final)',
    opponent: '브라질 (BRA)',
    oppFlag: '🇧🇷',
    requiredGoals: 3,
    totalAttempts: 5,
    hasWall: true,
    wallCount: 2,
    gkSpeed: 3.0,
    gkSkill: 0.8,
  },
  {
    stageName: '결승전 (World Cup Final)',
    opponent: '프랑스 (FRA)',
    oppFlag: '🇫🇷',
    requiredGoals: 3,
    totalAttempts: 5,
    hasWall: true,
    wallCount: 3,
    gkSpeed: 3.8,
    gkSkill: 0.9,
  },
];

export const PokiSoccerSkillsWorldCupGame: React.FC<PokiSoccerSkillsWorldCupGameProps> = ({
  onBack,
  cardId = 56,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tournament progress state
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [currentRoundGoals, setCurrentRoundGoals] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [totalScore, setTotalScore] = useState(0);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isShotActive, setIsShotActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [roundClearModal, setRoundClearModal] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Drag aiming state
  const [isAiming, setIsAiming] = useState(false);
  const [aimVector, setAimVector] = useState<{ x: number; y: number; power: number }>({ x: 0, y: 0, power: 0 });

  // Refs for animation & loop
  const startTimeRef = useRef<number>(Date.now());
  const roundIdxRef = useRef<number>(0);
  const roundGoalsRef = useRef<number>(0);
  const attemptsRef = useRef<number>(5);
  const totalScoreRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync refs
  useEffect(() => {
    roundIdxRef.current = currentRoundIdx;
    roundGoalsRef.current = currentRoundGoals;
    attemptsRef.current = attemptsLeft;
    totalScoreRef.current = totalScore;
  }, [currentRoundIdx, currentRoundGoals, attemptsLeft, totalScore]);

  // Three.js internal scene refs
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    ballMesh: THREE.Mesh;
    ballShadow: THREE.Mesh;
    kickerGroup: THREE.Group;
    kickerRightLeg: THREE.Group;
    gkGroup: THREE.Group;
    wallGroup: THREE.Group;
    trophyGroup: THREE.Group;
    aimLine: THREE.Line;
    aimCurvePoints: THREE.Vector3[];
    confettiPoints: THREE.Points | null;
    confettiVelocities: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
    isKicking: boolean;
    kickTimer: number;
    ballInFlight: boolean;
    ballVel: THREE.Vector3;
    ballSpin: number;
    ballPos: THREE.Vector3;
    gkX: number;
    gkVx: number;
    gkDiving: boolean;
    gkDiveTarget: number;
    wallJumpY: number;
    wallJumping: boolean;
    cameraTargetPos: THREE.Vector3;
  } | null>(null);

  // Helper: Telstar soccer ball texture
  const createBallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#0f172a';
    const drawPentagon = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    };

    drawPentagon(256, 256, 50);
    drawPentagon(100, 100, 42);
    drawPentagon(412, 100, 42);
    drawPentagon(100, 412, 42);
    drawPentagon(412, 412, 42);
    drawPentagon(256, 60, 36);
    drawPentagon(256, 450, 36);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 504);

    return new THREE.CanvasTexture(canvas);
  };

  // Helper: Pitch turf texture
  const createPitchTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const stripeCount = 16;
    const stripeH = 1024 / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#16a34a';
      ctx.fillRect(0, i * stripeH, 512, stripeH);
    }

    // White goal box markings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(60, 0, 392, 280); // Penalty box
    ctx.strokeRect(140, 0, 232, 110); // 6-yard box
    ctx.beginPath();
    ctx.arc(256, 200, 8, 0, Math.PI * 2); // Penalty spot
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  };

  // Helper: No.056 Hero Card Badge Texture
  const createCardBadgeTexture = (id: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawCardSprite(ctx, id, 0, 0, 160, 200);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  };

  // Confetti trigger
  const triggerConfetti = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;
    if (navigator.vibrate) navigator.vibrate([60, 40, 100, 50, 150]);

    const count = 120;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = 2.0 + Math.random() * 2.5;
      pos[i * 3 + 2] = -0.5 + (Math.random() - 0.5) * 3;

      const c = new THREE.Color().setHSL(Math.random(), 0.9, 0.6);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        3.0 + Math.random() * 5.0,
        (Math.random() - 0.5) * 6
      ));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
    });

    if (three.confettiPoints) {
      three.scene.remove(three.confettiPoints);
    }
    three.confettiPoints = new THREE.Points(geo, mat);
    three.confettiVelocities = vels;
    three.scene.add(three.confettiPoints);
  }, []);

  // Reset ball to penalty spot
  const resetBallPosition = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;

    three.ballInFlight = false;
    three.ballVel.set(0, 0, 0);
    three.ballSpin = 0;
    three.ballPos.set(0, 0.22, 9.2);
    three.ballMesh.position.copy(three.ballPos);
    three.ballMesh.rotation.set(0, 0, 0);
    three.ballShadow.position.set(0, 0.01, 9.2);
    three.ballShadow.scale.set(1, 1, 1);

    three.gkDiving = false;
    three.gkX = 0;
    three.gkGroup.position.set(0, 0, 0.1);
    three.gkGroup.rotation.set(0, 0, 0);

    three.wallJumping = false;
    three.wallJumpY = 0;
    three.wallGroup.position.y = 0;

    three.isKicking = false;
    three.kickerRightLeg.rotation.x = 0;
    three.kickerGroup.position.set(-0.45, 0, 9.4);

    three.cameraTargetPos.set(0, 2.2, 12.2);

    setIsShotActive(false);
  }, []);

  // Update wall defenders based on round
  const updateWallDefenders = useCallback((roundIdx: number) => {
    const three = threeRef.current;
    if (!three) return;

    // Clear old children
    while (three.wallGroup.children.length > 0) {
      three.wallGroup.remove(three.wallGroup.children[0]);
    }

    const cfg = TOURNAMENT_ROUNDS[roundIdx];
    if (!cfg.hasWall || cfg.wallCount === 0) return;

    const wallMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }); // Blue uniforms for rival wall
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });

    const spacing = 0.65;
    const startX = -((cfg.wallCount - 1) * spacing) / 2;

    for (let i = 0; i < cfg.wallCount; i++) {
      const defGroup = new THREE.Group();
      defGroup.position.set(startX + i * spacing, 0, 4.8);

      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 0.25), wallMat);
      body.position.y = 1.05;
      defGroup.add(body);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), skinMat);
      head.position.y = 1.62;
      defGroup.add(head);

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8);
      const legMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      const leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.12, 0.35, 0);
      defGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.12, 0.35, 0);
      defGroup.add(rightLeg);

      three.wallGroup.add(defGroup);
    }
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f); // Deep night stadium sky
    scene.fog = new THREE.FogExp2(0x0a192f, 0.015);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 12.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.2);
    sunLight.position.set(10, 25, 15);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 4 Corner Stadium Floodlights
    const floodlightColor = 0xe0f2fe;
    const addFloodlight = (x: number, z: number) => {
      const light = new THREE.SpotLight(floodlightColor, 2.5, 40, Math.PI / 4, 0.5);
      light.position.set(x, 14, z);
      light.target.position.set(0, 1, 3);
      scene.add(light);
      scene.add(light.target);

      // Tower mesh
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.4, 14, 8),
        new THREE.MeshLambertMaterial({ color: 0x334155 })
      );
      tower.position.set(x, 7, z);
      scene.add(tower);
    };

    addFloodlight(-16, 2);
    addFloodlight(16, 2);
    addFloodlight(-16, 18);
    addFloodlight(16, 18);

    // Pitch Ground
    const pitchGeo = new THREE.PlaneGeometry(36, 44);
    const pitchMat = new THREE.MeshLambertMaterial({ map: createPitchTexture() });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0, 8);
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Surrounding Running Track & Advertising boards
    const adMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c });
    const adBoard1 = new THREE.Mesh(new THREE.BoxGeometry(26, 1.0, 0.3), adMat);
    adBoard1.position.set(0, 0.5, -2.5);
    scene.add(adBoard1);

    const adBoardL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 36), adMat);
    adBoardL.position.set(-14, 0.5, 8);
    scene.add(adBoardL);

    const adBoardR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 36), adMat);
    adBoardR.position.set(14, 0.5, 8);
    scene.add(adBoardR);

    // Stadium Grandstand back wall
    const standMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 6), standMat);
    stand.position.set(0, 5, -7);
    scene.add(stand);

    // 3D Goal Post & Crossbar (Width: 6.0m, Height: 2.6m, Depth: 1.8m)
    const postMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const goalGroup = new THREE.Group();
    goalGroup.position.set(0, 0, 0);

    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 12);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-3.0, 1.3, 0);
    goalGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(3.0, 1.3, 0);
    goalGroup.add(rightPost);

    const crossbarGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.16, 12);
    const crossbar = new THREE.Mesh(crossbarGeo, postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 2.6, 0);
    goalGroup.add(crossbar);

    // Net (Box wireframe / semi-transparent)
    const netMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const netMesh = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.6, 1.8), netMat);
    netMesh.position.set(0, 1.3, -0.9);
    goalGroup.add(netMesh);
    scene.add(goalGroup);

    // 3D Soccer Ball
    const ballGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const ballMat = new THREE.MeshLambertMaterial({ map: createBallTexture() });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(0, 0.22, 9.2);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // Ball Shadow Blob
    const shadowGeo = new THREE.CircleGeometry(0.24, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.position.set(0, 0.01, 9.2);
    scene.add(ballShadow);

    // 3D Kicker (Korea Red Devils Uniform)
    const kickerGroup = new THREE.Group();
    kickerGroup.position.set(-0.45, 0, 9.4);

    const kickerShirtMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 }); // Red shirt
    const kickerShortsMat = new THREE.MeshLambertMaterial({ color: 0x2563eb }); // Blue shorts
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });

    // Torso
    const kTorso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.65, 0.26), kickerShirtMat);
    kTorso.position.y = 1.15;
    kickerGroup.add(kTorso);

    // Head
    const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), skinMat);
    kHead.position.y = 1.65;
    kickerGroup.add(kHead);

    // No.056 Hero Card Badge above Head
    const badgeGeo = new THREE.PlaneGeometry(0.55, 0.7);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: createCardBadgeTexture(cardId),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0, 2.25, 0);
    kickerGroup.add(badgeMesh);

    // Left Leg (Plant foot)
    const kLeftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 12), kickerShortsMat);
    kLeftLeg.position.set(-0.14, 0.35, 0);
    kickerGroup.add(kLeftLeg);

    // Right Leg (Kicking foot pivot group)
    const kickerRightLeg = new THREE.Group();
    kickerRightLeg.position.set(0.14, 0.7, 0);
    const kRightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.65, 12), kickerShortsMat);
    kRightLegMesh.position.y = -0.35;
    kRightLegMesh.rotation.x = 0;
    kickerRightLeg.add(kRightLegMesh);

    const kShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    kShoe.position.set(0, -0.68, 0.06);
    kickerRightLeg.add(kShoe);
    kickerGroup.add(kickerRightLeg);

    scene.add(kickerGroup);

    // 3D Goalkeeper
    const gkGroup = new THREE.Group();
    gkGroup.position.set(0, 0, 0.1);

    const gkJerseyMat = new THREE.MeshLambertMaterial({ color: 0xeab308 }); // Bright yellow keeper kit
    const gkTrouserMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

    const gkBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.28), gkJerseyMat);
    gkBody.position.y = 1.15;
    gkGroup.add(gkBody);

    const gkHead = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), skinMat);
    gkHead.position.y = 1.7;
    gkGroup.add(gkHead);

    // Goalkeeper Gloves
    const gloveMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), gloveMat);
    leftGlove.position.set(-0.45, 1.2, 0.15);
    gkGroup.add(leftGlove);

    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), gloveMat);
    rightGlove.position.set(0.45, 1.2, 0.15);
    gkGroup.add(rightGlove);

    const gkLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 10), gkTrouserMat);
    gkLeg1.position.set(-0.16, 0.35, 0);
    gkGroup.add(gkLeg1);

    const gkLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 10), gkTrouserMat);
    gkLeg2.position.set(0.16, 0.35, 0);
    gkGroup.add(gkLeg2);

    scene.add(gkGroup);

    // Wall Group
    const wallGroup = new THREE.Group();
    scene.add(wallGroup);

    // 3D Golden World Cup Trophy (Hidden by default, shown on Final victory)
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(0, -10, 3.5); // Stored below pitch initially
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x78350f,
      emissiveIntensity: 0.3,
    });

    const trophyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.5, 16), goldMat);
    trophyBase.position.y = 0.25;
    trophyGroup.add(trophyBase);

    const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.7, 16), goldMat);
    trophyStem.position.y = 0.85;
    trophyGroup.add(trophyStem);

    const trophyCup = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20), goldMat);
    trophyCup.position.y = 1.45;
    trophyGroup.add(trophyCup);

    scene.add(trophyGroup);

    // 3D Trajectory Aim Line
    const aimPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 20; i++) {
      aimPoints.push(new THREE.Vector3(0, 0.22, 9.2));
    }
    const aimGeo = new THREE.BufferGeometry().setFromPoints(aimPoints);
    const aimMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.4,
      gapSize: 0.2,
      linewidth: 3,
    });
    const aimLine = new THREE.Line(aimGeo, aimMat);
    aimLine.computeLineDistances();
    aimLine.visible = false;
    scene.add(aimLine);

    // ThreeRef container
    threeRef.current = {
      scene,
      camera,
      renderer,
      ballMesh,
      ballShadow,
      kickerGroup,
      kickerRightLeg,
      gkGroup,
      wallGroup,
      trophyGroup,
      aimLine,
      aimCurvePoints: aimPoints,
      confettiPoints: null,
      confettiVelocities: [],
      animId: 0,
      clock: new THREE.Clock(),
      isKicking: false,
      kickTimer: 0,
      ballInFlight: false,
      ballVel: new THREE.Vector3(0, 0, 0),
      ballSpin: 0,
      ballPos: new THREE.Vector3(0, 0.22, 9.2),
      gkX: 0,
      gkVx: 2.2,
      gkDiving: false,
      gkDiveTarget: 0,
      wallJumpY: 0,
      wallJumping: false,
      cameraTargetPos: new THREE.Vector3(0, 2.2, 12.2),
    };

    updateWallDefenders(0);

    // Animation Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);
      const cfg = TOURNAMENT_ROUNDS[roundIdxRef.current] || TOURNAMENT_ROUNDS[0];

      // Kicker kick animation swing
      if (three.isKicking) {
        three.kickTimer += delta * 9.0;
        three.kickerRightLeg.rotation.x = Math.sin(three.kickTimer) * 1.3;
        if (three.kickTimer >= Math.PI) {
          three.isKicking = false;
          three.kickerRightLeg.rotation.x = 0;
        }
      }

      // Goalkeeper patrol before shot
      if (!three.ballInFlight) {
        three.gkX += three.gkVx * delta;
        if (three.gkX > 1.8) {
          three.gkX = 1.8;
          three.gkVx = -Math.abs(three.gkVx);
        } else if (three.gkX < -1.8) {
          three.gkX = -1.8;
          three.gkVx = Math.abs(three.gkVx);
        }
        three.gkGroup.position.x = three.gkX;
      }

      // Ball physics in flight
      if (three.ballInFlight) {
        // Apply curve spin & gravity
        three.ballVel.x += three.ballSpin * delta * 2.5;
        three.ballVel.y -= 9.8 * delta; // Gravity

        three.ballPos.addScaledVector(three.ballVel, delta);
        three.ballMesh.position.copy(three.ballPos);

        // Ball spin rotation
        three.ballMesh.rotation.x -= three.ballVel.z * delta * 4;
        three.ballMesh.rotation.y += three.ballSpin * delta * 6;

        // Shadow follow
        three.ballShadow.position.x = three.ballPos.x;
        three.ballShadow.position.z = three.ballPos.z;
        const shadowScale = Math.max(0.2, 1.0 - three.ballPos.y * 0.2);
        three.ballShadow.scale.set(shadowScale, shadowScale, 1);

        // Wall Jump animation
        if (three.wallJumping && cfg.hasWall) {
          three.wallJumpY = Math.max(0, Math.sin(three.clock.getElapsedTime() * 8.0) * 0.55);
          three.wallGroup.position.y = three.wallJumpY;
        }

        // Wall Block check (Z around 4.8m)
        if (cfg.hasWall && Math.abs(three.ballPos.z - 4.8) < 0.35 && three.ballPos.y < 1.9 + three.wallJumpY) {
          const wallWidth = cfg.wallCount * 0.7;
          if (Math.abs(three.ballPos.x) < wallWidth / 2) {
            // Deflected by Wall!
            three.ballInFlight = false;
            three.ballVel.set((Math.random() - 0.5) * 3, 2.5, 4.0);
            setStatusBanner('수비벽에 막혔습니다! (BLOCKED)');
            handleShotResult(false);
          }
        }

        // Goalkeeper Diving AI
        if (!three.gkDiving && three.ballPos.z < 6.0) {
          three.gkDiving = true;
          // Dive towards ball X with some human error based on cfg.gkSkill
          const predictX = three.ballPos.x * cfg.gkSkill;
          three.gkDiveTarget = Math.max(-2.5, Math.min(2.5, predictX));
        }

        if (three.gkDiving) {
          three.gkGroup.position.x += (three.gkDiveTarget - three.gkGroup.position.x) * delta * 7.5;
          // Dive tilt angle
          const diveDir = Math.sign(three.gkDiveTarget - three.gkGroup.position.x);
          three.gkGroup.rotation.z = -diveDir * 0.75;
          three.gkGroup.position.y = 0.2 + Math.abs(diveDir) * 0.3;
        }

        // Goalkeeper Save Collision (Z around 0.2m)
        if (Math.abs(three.ballPos.z - 0.2) < 0.45) {
          const gkDist = Math.hypot(three.ballPos.x - three.gkGroup.position.x, three.ballPos.y - (1.1 + three.gkGroup.position.y));
          if (gkDist < 0.95) {
            // SAVED!
            three.ballInFlight = false;
            three.ballVel.set((Math.random() - 0.5) * 4, 3, 5);
            setStatusBanner('골키퍼 슈퍼 세이브! (SAVED)');
            handleShotResult(false);
          }
        }

        // Goalpost / Crossbar Collision (Width +-3.0m, Crossbar 2.6m at Z=0)
        if (Math.abs(three.ballPos.z) < 0.3) {
          const hitLeftPost = Math.abs(three.ballPos.x - (-3.0)) < 0.3 && three.ballPos.y < 2.7;
          const hitRightPost = Math.abs(three.ballPos.x - 3.0) < 0.3 && three.ballPos.y < 2.7;
          const hitCrossbar = Math.abs(three.ballPos.y - 2.6) < 0.3 && Math.abs(three.ballPos.x) <= 3.0;

          if (hitLeftPost || hitRightPost || hitCrossbar) {
            three.ballInFlight = false;
            three.ballVel.z = 4.0;
            setStatusBanner('골대를 강타했습니다! (POST HIT)');
            if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
            handleShotResult(false);
          }
        }

        // Goal Line Detection (Z <= 0)
        if (three.ballPos.z <= 0) {
          three.ballInFlight = false;
          // Inside goal bounds: -2.9 < x < 2.9 and 0 < y < 2.55
          if (Math.abs(three.ballPos.x) < 2.85 && three.ballPos.y < 2.55 && three.ballPos.y > 0.05) {
            // GOAL!!
            setStatusBanner('GOAL! 환상적인 득점!');
            triggerConfetti();
            handleShotResult(true);
          } else {
            // Missed outside
            setStatusBanner('골문을 벗어났습니다! (MISSED)');
            handleShotResult(false);
          }
        }

        // Camera follow
        three.cameraTargetPos.x = three.ballPos.x * 0.35;
        three.cameraTargetPos.y = 2.2 + three.ballPos.y * 0.3;
      }

      // Smooth camera lerp
      three.camera.position.lerp(three.cameraTargetPos, 0.06);
      three.camera.lookAt(three.ballPos.x * 0.4, 1.2, 0);

      // Confetti physics
      if (three.confettiPoints && three.confettiVelocities.length > 0) {
        const posAttr = three.confettiPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < three.confettiVelocities.length; i++) {
          arr[i * 3] += three.confettiVelocities[i].x * delta;
          arr[i * 3 + 1] += three.confettiVelocities[i].y * delta;
          arr[i * 3 + 2] += three.confettiVelocities[i].z * delta;
          three.confettiVelocities[i].y -= 9.8 * delta;
        }
        posAttr.needsUpdate = true;
      }

      // Rotate Trophy if game won
      if (three.trophyGroup.position.y > 0) {
        three.trophyGroup.rotation.y += delta * 1.5;
      }

      renderer.render(scene, camera);
      three.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !threeRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
        threeRef.current.renderer.dispose();
        if (container.contains(threeRef.current.renderer.domElement)) {
          container.removeChild(threeRef.current.renderer.domElement);
        }
      }
    };
  }, [cardId, triggerConfetti, updateWallDefenders]);

  // Handle outcome of a single shot
  const handleShotResult = useCallback((isGoal: boolean) => {
    setIsShotActive(true);
    const newGoals = isGoal ? roundGoalsRef.current + 1 : roundGoalsRef.current;
    const newAttempts = attemptsRef.current - 1;
    const newTotalScore = isGoal ? totalScoreRef.current + 100 : totalScoreRef.current;

    setCurrentRoundGoals(newGoals);
    setAttemptsLeft(newAttempts);
    setTotalScore(newTotalScore);

    const cfg = TOURNAMENT_ROUNDS[roundIdxRef.current];

    // Wait 2.2s for celebration / replays then proceed
    setTimeout(() => {
      setStatusBanner(null);

      // Check if Round Cleared!
      if (newGoals >= cfg.requiredGoals) {
        // Round Victory!
        if (roundIdxRef.current < TOURNAMENT_ROUNDS.length - 1) {
          // Next round
          setRoundClearModal(true);
        } else {
          // Tournament Grand Victory!
          setGameWon(true);
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const reward = calculateAndDepositMissionReward({
            gameId: 'poki-soccer-skills-world-cup',
            gameTitle: 'Soccer Skills 2 World Cup 3D',
            isVictory: true,
            score: newTotalScore + 200,
            maxTargetScore: 800,
            durationSeconds: duration,
          });
          setRewardResult(reward);

          // Raise World Cup Trophy into view
          if (threeRef.current) {
            threeRef.current.trophyGroup.position.set(0, 1.2, 5.0);
            triggerConfetti();
          }
        }
        return;
      }

      // Check if Out of Attempts and cannot reach required goals
      const remainingShots = newAttempts;
      if (newGoals + remainingShots < cfg.requiredGoals) {
        // Game Over / Failed to qualify
        setGameOver(true);
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const reward = calculateAndDepositMissionReward({
          gameId: 'poki-soccer-skills-world-cup',
          gameTitle: 'Soccer Skills 2 World Cup 3D',
          isVictory: false,
          score: newTotalScore,
          maxTargetScore: 800,
          durationSeconds: duration,
        });
        setRewardResult(reward);
        return;
      }

      // Next shot attempt
      resetBallPosition();
    }, 2200);
  }, [resetBallPosition, triggerConfetti]);

  // Proceed to next round
  const handleNextRound = () => {
    const nextIdx = currentRoundIdx + 1;
    setCurrentRoundIdx(nextIdx);
    setCurrentRoundGoals(0);
    setAttemptsLeft(TOURNAMENT_ROUNDS[nextIdx].totalAttempts);
    setRoundClearModal(false);
    updateWallDefenders(nextIdx);
    resetBallPosition();
  };

  // Touch Drag & Aim Handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isShotActive || gameOver || gameWon || roundClearModal) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    touchStartRef.current = { x: clientX, y: clientY };
    setIsAiming(true);
    setAimVector({ x: 0, y: 0, power: 0 });

    if (threeRef.current) {
      threeRef.current.aimLine.visible = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isAiming || !touchStartRef.current || !threeRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - touchStartRef.current.x;
    const dy = clientY - touchStartRef.current.y;

    // Slingshot / swipe direction (pulling down shoots forward towards goal)
    const aimX = Math.max(-2.8, Math.min(2.8, (dx / 55) * 1.5));
    const aimY = Math.max(0.6, Math.min(2.5, (-dy / 60) * 1.2));
    const power = Math.min(1.0, Math.hypot(dx, dy) / 120);

    setAimVector({ x: aimX, y: aimY, power });

    // Update 3D Aim arc curve
    const points: THREE.Vector3[] = [];
    const steps = 20;
    const startP = new THREE.Vector3(0, 0.22, 9.2);
    const targetP = new THREE.Vector3(aimX, aimY, 0.2);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = THREE.MathUtils.lerp(startP.x, targetP.x, t);
      const pz = THREE.MathUtils.lerp(startP.z, targetP.z, t);
      // Arc curve
      const py = THREE.MathUtils.lerp(startP.y, targetP.y, t) + Math.sin(t * Math.PI) * (1.2 + power * 1.0);
      points.push(new THREE.Vector3(px, py, pz));
    }

    threeRef.current.aimLine.geometry.setFromPoints(points);
    threeRef.current.aimLine.computeLineDistances();
  };

  const handleTouchEnd = () => {
    if (!isAiming || !threeRef.current) return;
    setIsAiming(false);

    threeRef.current.aimLine.visible = false;

    // Minimum drag threshold to trigger shot
    if (aimVector.power < 0.18) {
      return;
    }

    // FIRE SHOT!
    const three = threeRef.current;
    three.isKicking = true;
    three.kickTimer = 0;
    three.ballInFlight = true;

    // Trigger wall jump
    three.wallJumping = true;

    // Shot velocity vector calculation
    const shotSpeed = 16.0 + aimVector.power * 6.0;
    const targetZ = 0.2;
    const distZ = 9.2 - targetZ;
    const timeToGoal = distZ / shotSpeed;

    const vx = (aimVector.x - 0) / timeToGoal;
    const vy = (aimVector.y - 0.22 + 0.5 * 9.8 * (timeToGoal * timeToGoal)) / timeToGoal;
    const vz = -shotSpeed;

    // Curve spin based on X offset
    three.ballSpin = aimVector.x * 1.8;
    three.ballVel.set(vx, vy, vz);

    if (navigator.vibrate) {
      navigator.vibrate([40, 30, 70]);
    }
  };

  // Restart match from beginning
  const handleRestart = () => {
    setCurrentRoundIdx(0);
    setCurrentRoundGoals(0);
    setAttemptsLeft(TOURNAMENT_ROUNDS[0].totalAttempts);
    setTotalScore(0);
    setGameOver(false);
    setGameWon(false);
    setRoundClearModal(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();
    updateWallDefenders(0);
    if (threeRef.current) {
      threeRef.current.trophyGroup.position.set(0, -10, 3.5);
    }
    resetBallPosition();
  };

  const activeConfig = TOURNAMENT_ROUNDS[currentRoundIdx] || TOURNAMENT_ROUNDS[0];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle="SOCCER SKILLS 2 WORLD CUP 3D"
        onBack={onBack}
        score={totalScore}
        targetScore={600}
      />

      {/* Tournament Match Scoreboard Header */}
      <div className="absolute top-14 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-5 py-2.5 rounded-none shadow-xl flex items-center gap-4 text-xs md:text-sm">
          {/* Match Stage & Opponent */}
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              {activeConfig.stageName}
            </span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              🇰🇷 대한민국 vs {activeConfig.oppFlag} {activeConfig.opponent}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Goal Targets */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">목표:</span>
            <span className="text-yellow-300 font-extrabold text-sm">
              {currentRoundGoals} / {activeConfig.requiredGoals} 골
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Attempts remaining */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">기회:</span>
            <div className="flex gap-1">
              {Array.from({ length: activeConfig.totalAttempts }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full inline-block border ${
                    i < attemptsLeft
                      ? 'bg-emerald-500 border-emerald-300'
                      : 'bg-slate-800 border-slate-600 opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Goal & Event Status Banner */}
      {statusBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-amber-500 text-slate-950 font-black px-6 py-2 border-2 border-yellow-200 text-base md:text-lg shadow-2xl uppercase tracking-wider">
            {statusBanner}
          </div>
        </div>
      )}

      {/* Aiming Drag Control Overlay Guide */}
      {!isShotActive && !gameOver && !gameWon && !roundClearModal && (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
          <div className="bg-slate-900/80 border border-emerald-500/40 px-4 py-2 rounded-sm backdrop-blur-sm text-center">
            <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              화면을 터치 후 아래/위로 드래그하여 슈팅 궤적을 조준하고 손을 떼세요!
            </p>
            {isAiming && (
              <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-slate-300">
                <span>파워: {Math.round(aimVector.power * 100)}%</span>
                <span>•</span>
                <span>방향: {aimVector.x > 0 ? `우측 +${aimVector.x.toFixed(1)}` : `좌측 ${aimVector.x.toFixed(1)}`}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Round Clear Modal (Proceed to Semi / Final) */}
      {roundClearModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-emerald-400 mb-1">
              {activeConfig.stageName} 승리!
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              상대팀을 꺾고 다음 토너먼트 라운드에 진출했습니다!
            </p>
            <div className="bg-slate-950 border border-slate-800 p-3 mb-5 text-xs text-left space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>다음 상대:</span>
                <span className="text-yellow-400 font-bold">
                  {TOURNAMENT_ROUNDS[currentRoundIdx + 1]?.opponent}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>필요 골 수:</span>
                <span className="text-emerald-400 font-bold">
                  {TOURNAMENT_ROUNDS[currentRoundIdx + 1]?.requiredGoals} 골 (5회 중)
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>상대 수비벽:</span>
                <span className="text-rose-400 font-bold">
                  {TOURNAMENT_ROUNDS[currentRoundIdx + 1]?.wallCount}명 점프 수비
                </span>
              </div>
            </div>
            <button
              onClick={handleNextRound}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-sm transition-all"
            >
              다음 라운드 진출 [▶]
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal (Failed to Qualify) */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">토너먼트 탈락</h2>
            <p className="text-xs text-slate-300 mb-4">
              기회를 모두 소진하여 {activeConfig.stageName} 돌파에 실패했습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-sm flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> 재도전
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase rounded-sm"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Reward Modal */}
      {(gameWon || (gameOver && rewardResult)) && rewardResult && (
        <VictoryRewardModal
          isOpen={true}
          reward={rewardResult}
          onClose={onBack}
        />
      )}
    </div>
  );
};
