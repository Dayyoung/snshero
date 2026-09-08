import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiSoccerLeagueGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

const TARGET_GOALS = 3;
const PITCH_W = 20;
const PITCH_H = 32;
const GOAL_WIDTH = 5.0;

interface PlayerState {
  x: number;
  z: number;
  vx: number;
  vz: number;
  team: 'blue' | 'red';
  role: 'striker' | 'winger' | 'keeper';
  mesh: THREE.Group;
  kickCooldown: number;
}

export default function PokiSoccerLeagueGame({
  onBack,
  onClose,
  cardId = 95,
  onExit
}: PokiSoccerLeagueGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleExit = onBack || onClose || (() => {});

  // Game States
  const [blueScore, setBlueScore] = useState<number>(0);
  const [redScore, setRedScore] = useState<number>(0);
  const [matchTime, setMatchTime] = useState<number>(0);
  const [goalBanner, setGoalBanner] = useState<string | null>(null);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Joystick States
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });

  // Refs for Game Loop
  const inputRef = useRef({ moveX: 0, moveZ: 0, isShooting: false, isTackling: false });
  const startTimeRef = useRef<number>(Date.now());
  const matchActiveRef = useRef<boolean>(true);

  // Three.js References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    ballMesh: THREE.Mesh;
    ballPos: { x: number; y: number; z: number };
    ballVel: { x: number; y: number; z: number };
    players: PlayerState[];
    particlesGroup: THREE.Group;
    scoreRef: { blue: number; red: number };
  } | null>(null);

  const triggerHaptic = (duration = 20) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(duration);
      }
    } catch {
      // Ignore
    }
  };

  // Sparkles/Fireworks Emitter
  const spawnGoalFireworks = useCallback((pos: THREE.Vector3, colorHex: number) => {
    if (!threeRef.current) return;
    const { particlesGroup } = threeRef.current;
    const count = 35;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y + 0.5;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 2,
          (Math.random() - 0.5) * 6
        )
      );
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.22,
      transparent: true,
      opacity: 1,
    });
    const pSystem = new THREE.Points(geom, mat);
    particlesGroup.add(pSystem);

    let life = 0;
    const interval = setInterval(() => {
      life += 0.04;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + velocities[i].x * 0.02,
          posAttr.getY(i) + velocities[i].y * 0.02 - 0.05,
          posAttr.getZ(i) + velocities[i].z * 0.02
        );
      }
      posAttr.needsUpdate = true;
      mat.opacity = 1 - life;

      if (life >= 1) {
        clearInterval(interval);
        particlesGroup.remove(pSystem);
        geom.dispose();
        mat.dispose();
      }
    }, 30);
  }, []);

  // Player Mesh Builder
  const createPlayerMesh = (team: 'blue' | 'red', isUser: boolean, badgeTexture: THREE.CanvasTexture | null): THREE.Group => {
    const group = new THREE.Group();
    const bodyColor = team === 'blue' ? 0x2563eb : 0xdc2626;
    const shortsColor = team === 'blue' ? 0x1e3a8a : 0x7f1d1d;

    // Torso (Jersey)
    const torsoGeom = new THREE.CylinderGeometry(0.38, 0.35, 0.7, 16);
    const torsoMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4 });
    const torso = new THREE.Mesh(torsoGeom, torsoMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    group.add(torso);

    // Shorts
    const shortsGeom = new THREE.CylinderGeometry(0.35, 0.38, 0.4, 16);
    const shortsMat = new THREE.MeshStandardMaterial({ color: shortsColor, roughness: 0.5 });
    const shorts = new THREE.Mesh(shortsGeom, shortsMat);
    shorts.position.y = 0.35;
    shorts.castShadow = true;
    group.add(shorts);

    // Head
    const headGeom = new THREE.SphereGeometry(0.24, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.35;
    head.castShadow = true;
    group.add(head);

    // Hair
    const hairGeom = new THREE.SphereGeometry(0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeom, hairMat);
    hair.position.y = 1.4;
    group.add(hair);

    // User Indicator Ring & Badge
    if (isUser) {
      const ringGeom = new THREE.RingGeometry(0.65, 0.8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      group.add(ring);

      if (badgeTexture) {
        const badgeGeom = new THREE.PlaneGeometry(0.32, 0.32);
        const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true });
        const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
        badgeMesh.position.set(0, 0.85, 0.39);
        group.add(badgeMesh);
      }
    }

    return group;
  };

  // Kickoff Reset
  const resetKickoff = useCallback((scoringTeam: 'blue' | 'red') => {
    if (!threeRef.current) return;
    const { ballPos, ballVel, players } = threeRef.current;

    // Reset Ball to Center
    ballPos.x = 0;
    ballPos.y = 0.25;
    ballPos.z = 0;
    ballVel.x = 0;
    ballVel.y = 0;
    ballVel.z = 0;

    // Reset Player Positions
    players.forEach((p) => {
      if (p.team === 'blue') {
        if (p.role === 'striker') { p.x = 0; p.z = 3; }
        else if (p.role === 'winger') { p.x = -5; p.z = 7; }
        else if (p.role === 'keeper') { p.x = 0; p.z = 14; }
      } else {
        if (p.role === 'striker') { p.x = 0; p.z = -3; }
        else if (p.role === 'winger') { p.x = 5; p.z = -7; }
        else if (p.role === 'keeper') { p.x = 0; p.z = -14; }
      }
      p.vx = 0;
      p.vz = 0;
      p.mesh.position.set(p.x, 0, p.z);
    });

    setGoalBanner(scoringTeam === 'blue' ? '⚽ BLUE GOAL!!' : '🔴 RED GOAL!');
    setTimeout(() => {
      setGoalBanner(null);
      matchActiveRef.current = true;
    }, 2000);
  }, []);

  // Victory Handler
  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    triggerHaptic(80);

    const durationSeconds = Math.max(15, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokisoccerleague',
      gameTitle: 'Soccer League 3D',
      isVictory: true,
      score: 500,
      maxTargetScore: 500,
      durationSeconds,
    });
    setRewardReceipt(receipt);
  }, [gameWon]);

  // Main Three.js Initialization & Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc7f2d6);
    scene.fog = new THREE.Fog(0xc7f2d6, 25, 60);

    // 2. Camera (Quarter-view Stadium Camera)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 22, 22);
    camera.lookAt(0, 0, 2);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    mainLight.position.set(10, 25, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    // 4 Stadium Floodlights
    const floodlightColors = [0x93c5fd, 0x86efac, 0x93c5fd, 0x86efac];
    const floodPositions = [
      [-PITCH_W / 2 - 4, 15, -PITCH_H / 2 - 4],
      [PITCH_W / 2 + 4, 15, -PITCH_H / 2 - 4],
      [-PITCH_W / 2 - 4, 15, PITCH_H / 2 + 4],
      [PITCH_W / 2 + 4, 15, PITCH_H / 2 + 4],
    ];
    floodPositions.forEach(([fx, fy, fz], idx) => {
      const pl = new THREE.PointLight(floodlightColors[idx], 1.2, 35);
      pl.position.set(fx, fy, fz);
      scene.add(pl);
    });

    // 5. Pitch Grass Surface (Striped Canvas Texture)
    const pitchCanvas = document.createElement('canvas');
    pitchCanvas.width = 512;
    pitchCanvas.height = 1024;
    const pctx = pitchCanvas.getContext('2d')!;

    // Green Field Stripes
    const stripeCount = 16;
    const stripeH = pitchCanvas.height / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      pctx.fillStyle = i % 2 === 0 ? '#15803d' : '#16a34a';
      pctx.fillRect(0, i * stripeH, pitchCanvas.width, stripeH);
    }

    // White Pitch Markings
    pctx.strokeStyle = '#f8fafc';
    pctx.lineWidth = 10;
    // Outer boundary
    pctx.strokeRect(20, 20, pitchCanvas.width - 40, pitchCanvas.height - 40);
    // Halfway line
    pctx.beginPath();
    pctx.moveTo(20, pitchCanvas.height / 2);
    pctx.lineTo(pitchCanvas.width - 20, pitchCanvas.height / 2);
    pctx.stroke();
    // Center circle
    pctx.beginPath();
    pctx.arc(pitchCanvas.width / 2, pitchCanvas.height / 2, 90, 0, Math.PI * 2);
    pctx.stroke();
    // Goal boxes
    pctx.strokeRect(pitchCanvas.width / 2 - 120, 20, 240, 140);
    pctx.strokeRect(pitchCanvas.width / 2 - 120, pitchCanvas.height - 160, 240, 140);

    const pitchTexture = new THREE.CanvasTexture(pitchCanvas);
    pitchTexture.wrapS = THREE.ClampToEdgeWrapping;
    pitchTexture.wrapT = THREE.ClampToEdgeWrapping;

    const pitchGeom = new THREE.PlaneGeometry(PITCH_W, PITCH_H);
    const pitchMat = new THREE.MeshStandardMaterial({ map: pitchTexture, roughness: 0.7, metalness: 0.05 });
    const pitchMesh = new THREE.Mesh(pitchGeom, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.receiveShadow = true;
    scene.add(pitchMesh);

    // Stadium Surrounding Grass Border
    const borderGeom = new THREE.PlaneGeometry(PITCH_W + 12, PITCH_H + 12);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x0f391b, roughness: 0.9 });
    const borderMesh = new THREE.Mesh(borderGeom, borderMat);
    borderMesh.rotation.x = -Math.PI / 2;
    borderMesh.position.y = -0.05;
    scene.add(borderMesh);

    // 6. Goal Posts (Red Goal at -Z, Blue Goal at +Z)
    const createGoalPost = (zPos: number, isRedGoal: boolean) => {
      const gGroup = new THREE.Group();
      const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2 });
      const postR = 0.08;
      const postH = 2.2;

      // Left post
      const leftGeom = new THREE.CylinderGeometry(postR, postR, postH, 16);
      const leftPost = new THREE.Mesh(leftGeom, postMat);
      leftPost.position.set(-GOAL_WIDTH / 2, postH / 2, 0);
      gGroup.add(leftPost);

      // Right post
      const rightPost = new THREE.Mesh(leftGeom, postMat);
      rightPost.position.set(GOAL_WIDTH / 2, postH / 2, 0);
      gGroup.add(rightPost);

      // Crossbar
      const crossGeom = new THREE.CylinderGeometry(postR, postR, GOAL_WIDTH, 16);
      const crossbar = new THREE.Mesh(crossGeom, postMat);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, postH, 0);
      gGroup.add(crossbar);

      // Net Box (Wireframe semi-transparent)
      const netGeom = new THREE.BoxGeometry(GOAL_WIDTH, postH, 2.0);
      const netMat = new THREE.MeshBasicMaterial({
        color: isRedGoal ? 0xf87171 : 0x60a5fa,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });
      const netMesh = new THREE.Mesh(netGeom, netMat);
      netMesh.position.set(0, postH / 2, isRedGoal ? -1.0 : 1.0);
      gGroup.add(netMesh);

      gGroup.position.set(0, 0, zPos);
      return gGroup;
    };

    scene.add(createGoalPost(-PITCH_H / 2, true)); // Red team defending goal
    scene.add(createGoalPost(PITCH_H / 2, false)); // Blue team defending goal

    // 7. Hero Badge Banner (Stadium Scoreboard)
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const badgeCtx = heroBadgeCanvas.getContext('2d')!;
    drawCardSprite(badgeCtx, cardId, 0, 0, 128, 128, { circleClip: true });
    const heroBadgeTexture = new THREE.CanvasTexture(heroBadgeCanvas);

    const boardGeom = new THREE.BoxGeometry(8, 2.8, 0.4);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.6, roughness: 0.3 });
    const boardMesh = new THREE.Mesh(boardGeom, boardMat);
    boardMesh.position.set(0, 6, -PITCH_H / 2 - 4);
    scene.add(boardMesh);

    const badgePlaneGeom = new THREE.PlaneGeometry(2.0, 2.0);
    const badgePlaneMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const badgePlane = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
    badgePlane.position.set(0, 6, -PITCH_H / 2 - 3.75);
    scene.add(badgePlane);

    // 8. 3D Soccer Ball
    const ballGeom = new THREE.SphereGeometry(0.26, 20, 20);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
    const ballMesh = new THREE.Mesh(ballGeom, ballMat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // 9. Particles Group
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    // 10. Players (3 Blue vs 3 Red)
    const players: PlayerState[] = [
      // Blue Team (User is Striker)
      {
        x: 0,
        z: 3,
        vx: 0,
        vz: 0,
        team: 'blue',
        role: 'striker',
        mesh: createPlayerMesh('blue', true, heroBadgeTexture),
        kickCooldown: 0,
      },
      {
        x: -5,
        z: 7,
        vx: 0,
        vz: 0,
        team: 'blue',
        role: 'winger',
        mesh: createPlayerMesh('blue', false, null),
        kickCooldown: 0,
      },
      {
        x: 0,
        z: 14,
        vx: 0,
        vz: 0,
        team: 'blue',
        role: 'keeper',
        mesh: createPlayerMesh('blue', false, null),
        kickCooldown: 0,
      },
      // Red Team (Opponent AI)
      {
        x: 0,
        z: -3,
        vx: 0,
        vz: 0,
        team: 'red',
        role: 'striker',
        mesh: createPlayerMesh('red', false, null),
        kickCooldown: 0,
      },
      {
        x: 5,
        z: -7,
        vx: 0,
        vz: 0,
        team: 'red',
        role: 'winger',
        mesh: createPlayerMesh('red', false, null),
        kickCooldown: 0,
      },
      {
        x: 0,
        z: -14,
        vx: 0,
        vz: 0,
        team: 'red',
        role: 'keeper',
        mesh: createPlayerMesh('red', false, null),
        kickCooldown: 0,
      },
    ];

    players.forEach((p) => {
      p.mesh.position.set(p.x, 0, p.z);
      scene.add(p.mesh);
    });

    threeRef.current = {
      scene,
      camera,
      renderer,
      ballMesh,
      ballPos: { x: 0, y: 0.26, z: 0 },
      ballVel: { x: 0, y: 0, z: 0 },
      players,
      particlesGroup,
      scoreRef: { blue: 0, red: 0 },
    };

    // 11. Physics & Game Loop
    let animFrameId: number;
    const clock = new THREE.Clock();
    let secondAccumulator = 0;

    const gameLoop = () => {
      animFrameId = requestAnimationFrame(gameLoop);
      const delta = Math.min(clock.getDelta(), 0.05);

      secondAccumulator += delta;
      if (secondAccumulator >= 1.0) {
        secondAccumulator = 0;
        setMatchTime((prev) => prev + 1);
      }

      if (threeRef.current && matchActiveRef.current) {
        const { ballPos, ballVel, ballMesh, players, camera } = threeRef.current;
        const input = inputRef.current;

        // User Player Control (Striker)
        const user = players[0];
        const moveSpeed = input.isTackling ? 11.0 : 7.2;
        user.vx = input.moveX * moveSpeed;
        user.vz = input.moveZ * moveSpeed;

        // Update All Players
        players.forEach((p, idx) => {
          if (p.kickCooldown > 0) p.kickCooldown -= delta;

          if (idx !== 0) {
            // AI Players logic
            const distToBall = Math.hypot(ballPos.x - p.x, ballPos.z - p.z);

            if (p.role === 'keeper') {
              // Keeper tracks ball X within goal mouth
              const targetX = THREE.MathUtils.clamp(ballPos.x * 0.7, -GOAL_WIDTH / 2 + 0.5, GOAL_WIDTH / 2 - 0.5);
              p.vx = (targetX - p.x) * 4;
              p.vz = 0;
            } else if (p.team === 'blue') {
              // Blue Winger AI: support attack or defend
              if (ballPos.z < 0) {
                // Attack support
                const targetX = ballPos.x > 0 ? -4 : 4;
                const targetZ = ballPos.z + 3;
                p.vx = (targetX - p.x) * 3.5;
                p.vz = (targetZ - p.z) * 3.5;
              } else {
                p.vx = (ballPos.x - p.x) * 3.0;
                p.vz = (ballPos.z - p.z) * 3.0;
              }
            } else {
              // Red Team AI: chase ball & shoot toward blue goal (+Z)
              if (distToBall < 12) {
                const dirX = (ballPos.x - p.x) / (distToBall || 1);
                const dirZ = (ballPos.z - p.z) / (distToBall || 1);
                p.vx = dirX * 5.8;
                p.vz = dirZ * 5.8;
              } else {
                // Return to formation
                const homeZ = p.role === 'striker' ? -4 : -8;
                p.vx = -p.x * 2;
                p.vz = (homeZ - p.z) * 2;
              }
            }
          }

          // Apply Player Velocity
          p.x += p.vx * delta;
          p.z += p.vz * delta;

          // Pitch Clamp
          p.x = THREE.MathUtils.clamp(p.x, -PITCH_W / 2 + 0.8, PITCH_W / 2 - 0.8);
          p.z = THREE.MathUtils.clamp(p.z, -PITCH_H / 2 + 0.8, PITCH_H / 2 - 0.8);

          p.mesh.position.set(p.x, 0, p.z);
          if (Math.hypot(p.vx, p.vz) > 0.1) {
            p.mesh.rotation.y = Math.atan2(p.vx, p.vz);
          }

          // Player-to-Ball Collision / Kick
          const dBall = Math.hypot(ballPos.x - p.x, ballPos.z - p.z);
          if (dBall < 0.95 && p.kickCooldown <= 0) {
            p.kickCooldown = 0.25;

            if (idx === 0 && input.isShooting) {
              // Power Shoot towards opponent goal (-Z)
              input.isShooting = false;
              triggerHaptic(50);
              ballVel.z = -24;
              ballVel.x = (input.moveX || (Math.random() - 0.5) * 0.4) * 14;
              ballVel.y = 4;
            } else if (idx === 0 && input.isTackling) {
              // Sliding Tackle Dispossess
              input.isTackling = false;
              triggerHaptic(30);
              ballVel.z = -16;
              ballVel.x = input.moveX * 10;
            } else if (p.team === 'blue') {
              // Gentle Dribble / Push forward
              ballVel.z = Math.min(ballVel.z - 4, -8);
              ballVel.x = p.vx * 1.2;
            } else {
              // Red kick toward blue goal (+Z)
              ballVel.z = Math.max(ballVel.z + 4, 14);
              ballVel.x = (Math.random() - 0.5) * 8;
            }
          }
        });

        // Ball Physics Update
        ballPos.x += ballVel.x * delta;
        ballPos.y += ballVel.y * delta;
        ballPos.z += ballVel.z * delta;

        // Ball Gravity & Pitch Bounce
        if (ballPos.y > 0.26) {
          ballVel.y -= 18 * delta;
        } else {
          ballPos.y = 0.26;
          ballVel.y = -ballVel.y * 0.45;
          if (Math.abs(ballVel.y) < 0.3) ballVel.y = 0;
        }

        // Rolling Friction
        ballVel.x *= 0.975;
        ballVel.z *= 0.975;

        // Ball Rolling Mesh Rotation
        ballMesh.position.set(ballPos.x, ballPos.y, ballPos.z);
        ballMesh.rotation.x += ballVel.z * delta * 4;
        ballMesh.rotation.z -= ballVel.x * delta * 4;

        // Pitch Boundary Collisions (Sidelines)
        if (Math.abs(ballPos.x) > PITCH_W / 2 - 0.3) {
          ballPos.x = Math.sign(ballPos.x) * (PITCH_W / 2 - 0.3);
          ballVel.x = -ballVel.x * 0.7;
        }

        // Goal Check
        // Red Goal (-Z, defended by Red, attacked by Blue)
        if (ballPos.z < -PITCH_H / 2) {
          if (Math.abs(ballPos.x) <= GOAL_WIDTH / 2 && ballPos.y <= 2.2) {
            // GOAL FOR BLUE!
            matchActiveRef.current = false;
            threeRef.current.scoreRef.blue += 1;
            const newScore = threeRef.current.scoreRef.blue;
            setBlueScore(newScore);
            spawnGoalFireworks(new THREE.Vector3(0, 2, -PITCH_H / 2), 0x38bdf8);
            triggerHaptic(70);

            if (newScore >= TARGET_GOALS) {
              handleVictory();
            } else {
              resetKickoff('blue');
            }
          } else {
            // Out of bounds backline bounce
            ballPos.z = -PITCH_H / 2;
            ballVel.z = -ballVel.z * 0.6;
          }
        }

        // Blue Goal (+Z, defended by Blue, attacked by Red)
        if (ballPos.z > PITCH_H / 2) {
          if (Math.abs(ballPos.x) <= GOAL_WIDTH / 2 && ballPos.y <= 2.2) {
            // GOAL FOR RED!
            matchActiveRef.current = false;
            threeRef.current.scoreRef.red += 1;
            setRedScore(threeRef.current.scoreRef.red);
            spawnGoalFireworks(new THREE.Vector3(0, 2, PITCH_H / 2), 0xef4444);
            triggerHaptic(40);
            resetKickoff('red');
          } else {
            // Out of bounds backline bounce
            ballPos.z = PITCH_H / 2;
            ballVel.z = -ballVel.z * 0.6;
          }
        }

        // Dynamic Camera Tracking: follow between player and ball
        const camTargetZ = (user.z * 0.6 + ballPos.z * 0.4) + 14;
        const camTargetX = (user.x * 0.5 + ballPos.x * 0.5) * 0.6;
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.08);
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, 0.08);
        camera.lookAt(camTargetX, 0, camTargetZ - 12);

        threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
      }
    };
    gameLoop();

    // Resize Handler
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', handleResize);
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      pitchTexture.dispose();
      heroBadgeTexture.dispose();
    };
  }, [cardId, handleVictory, resetKickoff, spawnGoalFireworks]);

  // Touch & Joystick Controls (Mobile Pure Gesture)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameWon) return;
    const touch = e.touches[0];
    // If touched in the left or lower half of the screen
    if (touch.clientX < window.innerWidth * 0.65) {
      setJoystickActive(true);
      setJoystickCenter({ x: touch.clientX, y: touch.clientY });
      setJoystickKnob({ x: touch.clientX, y: touch.clientY });
      inputRef.current.moveX = 0;
      inputRef.current.moveZ = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickActive || gameWon) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickCenter.x;
    const dy = touch.clientY - joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;

    if (dist <= maxRadius) {
      setJoystickKnob({ x: touch.clientX, y: touch.clientY });
      inputRef.current.moveX = dx / maxRadius;
      inputRef.current.moveZ = dy / maxRadius;
    } else {
      const angle = Math.atan2(dy, dx);
      setJoystickKnob({
        x: joystickCenter.x + Math.cos(angle) * maxRadius,
        y: joystickCenter.y + Math.sin(angle) * maxRadius,
      });
      inputRef.current.moveX = Math.cos(angle);
      inputRef.current.moveZ = Math.sin(angle);
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    inputRef.current.moveX = 0;
    inputRef.current.moveZ = 0;
  };

  // Big Action Triggers
  const handleShoot = () => {
    triggerHaptic(40);
    inputRef.current.isShooting = true;
    setTimeout(() => {
      inputRef.current.isShooting = false;
    }, 300);
  };

  const handlePassOrTackle = () => {
    triggerHaptic(30);
    inputRef.current.isTackling = true;
    setTimeout(() => {
      inputRef.current.isTackling = false;
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#c7f2d6] font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js Canvas mounts here */}

      {/* Top Minimalist HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="SOCCER LEAGUE 3D"
        progress={Math.min(100, (blueScore / TARGET_GOALS) * 100)}
        score={blueScore * 100}
        maxScore={TARGET_GOALS * 100}
        onQuit={handleExit}
      />

      {/* Match Scoreboard Center Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-2xl backdrop-blur-md flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm sm:text-base font-black text-blue-400">BLUE</span>
            <span className="text-xl sm:text-2xl font-black text-white">{blueScore}</span>
          </div>
          <span className="text-slate-500 font-black">:</span>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white">{redScore}</span>
            <span className="text-sm sm:text-base font-black text-rose-400">RED</span>
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-slate-300">
          <span className="text-amber-400 font-mono">⏱️ {Math.floor(matchTime / 60)}:{(matchTime % 60).toString().padStart(2, '0')}</span>
          <span className="text-slate-500">|</span>
          <span>선제 3골 승리 목표</span>
        </div>
      </div>

      {/* Goal Celebration Banner */}
      {goalBanner && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-bounce">
          <div className="px-8 py-4 rounded-3xl bg-amber-500 text-slate-950 font-black text-2xl sm:text-4xl tracking-widest shadow-[0_0_40px_rgba(245,158,11,0.8)] border-4 border-white">
            {goalBanner}
          </div>
        </div>
      )}

      {/* Floating Dynamic Joystick Visual Feedback */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
          style={{ left: joystickCenter.x, top: joystickCenter.y }}
        >
          {/* Outer Ring */}
          <div className="w-[100px] h-[100px] rounded-full border-2 border-emerald-400/60 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center shadow-lg" />
          {/* Knob */}
          <div
            className="absolute w-12 h-12 rounded-full bg-emerald-400/90 border border-white/80 shadow-md -translate-x-1/2 -translate-y-1/2"
            style={{
              left: joystickKnob.x - joystickCenter.x + 50,
              top: joystickKnob.y - joystickCenter.y + 50,
            }}
          />
        </div>
      )}

      {/* Bottom Right Pure Action Buttons */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex items-center gap-3">
        {/* Pass / Tackle Button */}
        <button
          type="button"
          onClick={handlePassOrTackle}
          className="pointer-events-auto w-16 h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-md"
        >
          <span className="text-xl">🎯</span>
          <span className="text-[9px]">PASS</span>
        </button>

        {/* 76px Big Shoot Button */}
        <button
          type="button"
          onClick={handleShoot}
          className="pointer-events-auto h-[76px] px-7 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base uppercase tracking-wider shadow-2xl shadow-emerald-600/40 border border-emerald-400/50 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
        >
          <span className="text-2xl animate-spin">⚽</span>
          <span>POWER SHOOT</span>
        </button>
      </div>

      {/* Victory Reward Modal */}
      {gameWon && (
        <VictoryRewardModal
          isOpen={true}
          rewardReceipt={rewardReceipt}
          onBack={handleExit}
        />
      )}
    </div>
  );
}
