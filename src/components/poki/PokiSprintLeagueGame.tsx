import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Trophy, ArrowUp, Zap, ShieldAlert, Sparkles, RefreshCw, Footprints } from 'lucide-react';

interface PokiSprintLeagueGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;
}

interface RunnerEntity {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  pos: THREE.Vector3;
  lane: number;
  speed: number;
  targetSpeed: number;
  isPlayer: boolean;
  isJumping: boolean;
  jumpY: number;
  jumpVy: number;
  finished: boolean;
  finishRank: number;
  runCycle: number;
  color: number;
}

const TRACK_LENGTH = 100; // 100 meters
const LANE_WIDTH = 2.4;

export default function PokiSprintLeagueGame({
  onClose,
  onBack,
  cardId = 64,
}: PokiSprintLeagueGameProps) {
  const handleExit = onBack || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI State
  const [distance, setDistance] = useState(0);
  const [rank, setRank] = useState(1);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [burstGauge, setBurstGauge] = useState(30);
  const [isBursting, setIsBursting] = useState(false);
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Tap rhythm tracker
  const [lastTapFoot, setLastTapFoot] = useState<'L' | 'R' | null>(null);

  // Tracking refs
  const startTimeRef = useRef<number>(Date.now());
  const distRef = useRef<number>(0);
  const rankRef = useRef<number>(1);
  const speedRef = useRef<number>(0);
  const burstRef = useRef<number>(30);

  useEffect(() => {
    distRef.current = distance;
    rankRef.current = rank;
    speedRef.current = speedKmh;
    burstRef.current = burstGauge;
  }, [distance, rank, speedKmh, burstGauge]);

  // Three.js Context
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    runners: RunnerEntity[];
    hurdles: THREE.Mesh[];
    turboPads: THREE.Mesh[];
    finishRibbon: THREE.Mesh;
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
    cameraShake: number;
  } | null>(null);

  // Helper: Card Badge Texture
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

  // Helper: Track Urethane Texture
  const createTrackTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // Red-brown urethane
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 512, 1024);

    // 4 White Lane divider lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    for (let i = 1; i < 4; i++) {
      const x = (512 / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 10);
    return tex;
  };

  // Trigger Sparks & Confetti
  const triggerConfetti = useCallback((x: number, y: number, z: number) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) navigator.vibrate([60, 40, 80, 50, 120]);

    const count = 60;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 4.0;
      pos[i * 3 + 1] = y + Math.random() * 2.5;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 2.0;

      const c = new THREE.Color().setHSL(Math.random(), 0.9, 0.6);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        3.0 + Math.random() * 5,
        (Math.random() - 0.5) * 6
      ));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    if (three.particles) {
      three.scene.remove(three.particles);
    }
    three.particles = new THREE.Points(geo, mat);
    three.particleVels = vels;
    three.scene.add(three.particles);
  }, []);

  // Step Tap Acceleration
  const handleFootTap = (foot: 'L' | 'R') => {
    const three = threeRef.current;
    if (!three || gameOver || gameWon) return;

    const player = three.runners[1]; // Player is lane 1
    if (!player || player.finished) return;

    if (navigator.vibrate) navigator.vibrate(20);

    // Alternate tap gives maximum speed boost!
    const isAlternate = lastTapFoot !== null && lastTapFoot !== foot;
    setLastTapFoot(foot);

    const boostVal = isAlternate ? 1.4 : 0.6;
    player.speed = Math.min(13.5, player.speed + boostVal);

    setBurstGauge((g) => Math.min(100, g + 3.5));
  };

  // Jump Over Hurdle
  const handleJump = () => {
    const three = threeRef.current;
    if (!three || gameOver || gameWon) return;

    const player = three.runners[1];
    if (!player || player.isJumping || player.finished) return;

    player.isJumping = true;
    player.jumpVy = 9.2;
    if (navigator.vibrate) navigator.vibrate(35);
  };

  // Turbo Burst Spurt
  const handleBurst = () => {
    const three = threeRef.current;
    if (!three || burstRef.current < 100 || isBursting || gameOver || gameWon) return;

    const player = three.runners[1];
    if (!player || player.finished) return;

    setIsBursting(true);
    setBurstGauge(0);
    player.speed = 15.5; // Top Turbo speed!

    if (navigator.vibrate) navigator.vibrate([60, 30, 80, 40, 100]);
    setEventBanner('⚡ 폭풍 스퍼트 질주! (TURBO BURST)');

    setTimeout(() => {
      setIsBursting(false);
      setEventBanner(null);
    }, 2500);
  };

  // Restart Handler
  const handleRestart = () => {
    setDistance(0);
    setRank(1);
    setSpeedKmh(0);
    setBurstGauge(30);
    setIsBursting(false);
    setLastTapFoot(null);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();

    if (threeRef.current) {
      for (const r of threeRef.current.runners) {
        r.pos.z = 2.0;
        r.speed = 0;
        r.isJumping = false;
        r.jumpY = 0;
        r.jumpVy = 0;
        r.finished = false;
        r.finishRank = 0;
        r.group.position.set((r.lane - 1.5) * LANE_WIDTH, 0, 2.0);
      }
    }
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a192f); // Stadium night sky
    scene.fog = new THREE.FogExp2(0x0a192f, 0.012);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 140);
    camera.position.set(0, 3.5, -4.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.3);
    sunLight.position.set(15, 30, 25);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 100m Urethane Track (4 Lanes)
    const trackGeo = new THREE.PlaneGeometry(LANE_WIDTH * 4, TRACK_LENGTH + 20);
    const trackMat = new THREE.MeshLambertMaterial({ map: createTrackTexture() });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0, (TRACK_LENGTH + 20) / 2 - 5);
    track.receiveShadow = true;
    scene.add(track);

    // Surrounding Green Field
    const fieldGeo = new THREE.PlaneGeometry(60, TRACK_LENGTH + 40);
    const fieldMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.rotation.x = -Math.PI / 2;
    field.position.set(0, -0.05, (TRACK_LENGTH + 20) / 2);
    scene.add(field);

    // Stadium Grandstands
    const standMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const standL = new THREE.Mesh(new THREE.BoxGeometry(10, 8, TRACK_LENGTH + 20), standMat);
    standL.position.set(-15, 4, TRACK_LENGTH / 2);
    scene.add(standL);

    const standR = new THREE.Mesh(new THREE.BoxGeometry(10, 8, TRACK_LENGTH + 20), standMat);
    standR.position.set(15, 4, TRACK_LENGTH / 2);
    scene.add(standR);

    // 100m Finish Arch Gate & Ribbon
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, TRACK_LENGTH);

    const archMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 8), archMat);
    postL.position.set(-5.5, 3, 0);
    archGroup.add(postL);

    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 8), archMat);
    postR.position.set(5.5, 3, 0);
    archGroup.add(postR);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.8, 0.8), archMat);
    topBar.position.set(0, 6, 0);
    archGroup.add(topBar);

    // Finish Red Ribbon
    const ribbonGeo = new THREE.PlaneGeometry(10.5, 0.45);
    const ribbonMat = new THREE.MeshLambertMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const finishRibbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    finishRibbon.position.set(0, 1.2, 0);
    archGroup.add(finishRibbon);

    scene.add(archGroup);

    // Hurdles at 35m & 70m for all 4 lanes
    const hurdleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const hurdles: THREE.Mesh[] = [];

    const spawnHurdles = (zDist: number) => {
      for (let lane = 0; lane < 4; lane++) {
        const hGroup = new THREE.Group();
        const xPos = (lane - 1.5) * LANE_WIDTH;

        const hBar = new THREE.Mesh(new THREE.BoxGeometry(LANE_WIDTH * 0.85, 0.2, 0.08), hurdleMat);
        hBar.position.set(0, 0.85, 0);
        hGroup.add(hBar);

        const hLegL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6), hurdleMat);
        hLegL.position.set(-0.8, 0.42, 0);
        hGroup.add(hLegL);

        const hLegR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6), hurdleMat);
        hLegR.position.set(0.8, 0.42, 0);
        hGroup.add(hLegR);

        hGroup.position.set(xPos, 0, zDist);
        scene.add(hGroup);
        hurdles.push(hBar);
      }
    };

    spawnHurdles(35);
    spawnHurdles(70);

    // Turbo Speed Pads at 50m
    const turboMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    const turboPads: THREE.Mesh[] = [];
    for (let lane = 0; lane < 4; lane++) {
      const padGeo = new THREE.PlaneGeometry(LANE_WIDTH * 0.8, 3.5);
      const pad = new THREE.Mesh(padGeo, turboMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set((lane - 1.5) * LANE_WIDTH, 0.02, 52);
      scene.add(pad);
      turboPads.push(pad);
    }

    // Helper: Create 3D Runner Character
    const createRunner = (lane: number, colorHex: number, isPlayer: boolean) => {
      const group = new THREE.Group();
      const xPos = (lane - 1.5) * LANE_WIDTH;
      group.position.set(xPos, 0, 2.0);

      const suitMat = new THREE.MeshLambertMaterial({ color: colorHex });
      const skinMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
      const shortsMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.3), suitMat);
      torso.position.y = 1.05;
      group.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), skinMat);
      head.position.y = 1.62;
      group.add(head);

      // Left Arm
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.35, 1.35, 0);
      const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), suitMat);
      lArmMesh.position.y = -0.3;
      leftArm.add(lArmMesh);
      group.add(leftArm);

      // Right Arm
      const rightArm = new THREE.Group();
      rightArm.position.set(0.35, 1.35, 0);
      const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), suitMat);
      rArmMesh.position.y = -0.3;
      rightArm.add(rArmMesh);
      group.add(rightArm);

      // Left Leg
      const leftLeg = new THREE.Group();
      leftLeg.position.set(-0.16, 0.7, 0);
      const lLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), shortsMat);
      lLegMesh.position.y = -0.35;
      leftLeg.add(lLegMesh);
      group.add(leftLeg);

      // Right Leg
      const rightLeg = new THREE.Group();
      rightLeg.position.set(0.16, 0.7, 0);
      const rLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), shortsMat);
      rLegMesh.position.y = -0.35;
      rightLeg.add(rLegMesh);
      group.add(rightLeg);

      // Card Badge for Player
      if (isPlayer) {
        const badgeGeo = new THREE.PlaneGeometry(0.65, 0.82);
        const badgeMat = new THREE.MeshBasicMaterial({
          map: createCardBadgeTexture(cardId),
          transparent: true,
          side: THREE.DoubleSide,
        });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0, 2.25, 0);
        group.add(badge);
      }

      scene.add(group);

      return {
        group,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        pos: new THREE.Vector3(xPos, 0, 2.0),
        lane,
        speed: 0,
        targetSpeed: isPlayer ? 0 : 8.5 + Math.random() * 2.0,
        isPlayer,
        isJumping: false,
        jumpY: 0,
        jumpVy: 0,
        finished: false,
        finishRank: 0,
        runCycle: 0,
        color: colorHex,
      };
    };

    // 4 Runners (Lane 0: Yellow AI, Lane 1: Player Blue, Lane 2: Red AI, Lane 3: Green AI)
    const runners: RunnerEntity[] = [];
    runners.push(createRunner(0, 0xeab308, false));
    runners.push(createRunner(1, 0x2563eb, true)); // Player
    runners.push(createRunner(2, 0xdc2626, false));
    runners.push(createRunner(3, 0x16a34a, false));

    threeRef.current = {
      scene,
      camera,
      renderer,
      runners,
      hurdles,
      turboPads,
      finishRibbon,
      particles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
      cameraShake: 0,
    };

    // Main Game Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Update AI Runners pacing
      for (let i = 0; i < 4; i++) {
        const r = three.runners[i];
        if (r.finished) continue;

        if (!r.isPlayer) {
          // AI gradually accelerates
          r.speed += (r.targetSpeed - r.speed) * delta * 2.5;

          // AI Auto-Jump near hurdles (Z = 33m or 68m)
          if ((Math.abs(r.pos.z - 33.5) < 1.0 || Math.abs(r.pos.z - 68.5) < 1.0) && !r.isJumping) {
            r.isJumping = true;
            r.jumpVy = 9.0;
          }
        } else {
          // Player natural deceleration
          r.speed *= Math.pow(0.975, delta * 60);
          setDistance(Math.min(100, Math.round(r.pos.z)));
          setSpeedKmh(Math.round(r.speed * 3.6));
        }

        // Jump physics
        if (r.isJumping) {
          r.jumpY += r.jumpVy * delta;
          r.jumpVy -= 22.0 * delta; // Gravity

          if (r.jumpY <= 0) {
            r.jumpY = 0;
            r.isJumping = false;
          }
        }

        // Turbo Pad Detection (Z around 52m)
        if (Math.abs(r.pos.z - 52) < 2.0 && !r.isJumping) {
          r.speed = Math.min(16.0, r.speed + 4.0 * delta);
        }

        // Hurdle Collision (Z = 35m & 70m)
        if ((Math.abs(r.pos.z - 35) < 0.5 || Math.abs(r.pos.z - 70) < 0.5) && r.jumpY < 0.75) {
          // Tripped on Hurdle! Slow down
          r.speed *= 0.55;
          if (r.isPlayer && navigator.vibrate) navigator.vibrate(60);
        }

        // Step Runner Distance
        r.pos.z += r.speed * delta;
        r.group.position.set(r.pos.x, r.jumpY, r.pos.z);

        // Limb swinging animation
        if (r.speed > 0.5) {
          r.runCycle += r.speed * delta * 5.0;
          r.leftLeg.rotation.x = Math.sin(r.runCycle) * 0.85;
          r.rightLeg.rotation.x = -Math.sin(r.runCycle) * 0.85;
          r.leftArm.rotation.x = -Math.sin(r.runCycle) * 0.75;
          r.rightArm.rotation.x = Math.sin(r.runCycle) * 0.75;
        } else {
          r.leftLeg.rotation.x *= 0.8;
          r.rightLeg.rotation.x *= 0.8;
          r.leftArm.rotation.x *= 0.8;
          r.rightArm.rotation.x *= 0.8;
        }

        // Check Finish Line (100m)
        if (r.pos.z >= TRACK_LENGTH && !r.finished) {
          r.finished = true;
          if (r.isPlayer) {
            three.finishRibbon.visible = false;
            triggerConfetti(0, 3, TRACK_LENGTH);
          }
        }
      }

      // Calculate Real-time Player Rank
      const sortedRunners = [...three.runners].sort((a, b) => b.pos.z - a.pos.z);
      const pRank = sortedRunners.findIndex((r) => r.isPlayer) + 1;
      setRank(pRank);

      // Player Finish & Victory Check
      const player = three.runners[1];
      if (player.finished && !gameOver && !gameWon) {
        if (pRank <= 2) {
          // Top 2 Victory!
          setGameWon(true);
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const reward = calculateAndDepositMissionReward({
            gameId: 'poki-sprint-league',
            gameTitle: 'Sprint League 3D',
            isVictory: true,
            score: pRank === 1 ? 1000 : 800,
            maxTargetScore: 1000,
            durationSeconds: dur,
          });
          setRewardResult(reward);
        } else {
          // Failed to place
          setGameOver(true);
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const reward = calculateAndDepositMissionReward({
            gameId: 'poki-sprint-league',
            gameTitle: 'Sprint League 3D',
            isVictory: false,
            score: 500,
            maxTargetScore: 1000,
            durationSeconds: dur,
          });
          setRewardResult(reward);
        }
      }

      // Camera Follows Player (TPS 숄더뷰)
      const targetCamZ = player.pos.z - 5.5;
      const targetCamY = 3.2 + player.jumpY * 0.5;
      three.camera.position.z += (targetCamZ - three.camera.position.z) * 0.12;
      three.camera.position.y += (targetCamY - three.camera.position.y) * 0.12;
      three.camera.position.x = player.pos.x * 0.4;
      three.camera.lookAt(player.pos.x * 0.6, 1.4, player.pos.z + 6.0);

      // Confetti particles physics
      if (three.particles && three.particleVels.length > 0) {
        const posA = three.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posA.array as Float32Array;
        for (let i = 0; i < three.particleVels.length; i++) {
          arr[i * 3] += three.particleVels[i].x * delta;
          arr[i * 3 + 1] += three.particleVels[i].y * delta;
          arr[i * 3 + 2] += three.particleVels[i].z * delta;
          three.particleVels[i].y -= 9.8 * delta;
        }
        posA.needsUpdate = true;
      }

      renderer.render(scene, camera);
      three.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

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
  }, [cardId, triggerConfetti]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
    >
      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle="SPRINT LEAGUE 3D"
        onBack={handleExit}
        score={distance}
        targetScore={100}
      />

      {/* Real-time Rank & Speed & Distance Bar */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        {/* Current Rank Badge */}
        <div className="bg-slate-900/90 border-2 border-amber-400/90 backdrop-blur-md px-4 py-2 flex items-center gap-2 shadow-xl">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-black text-amber-300">{rank}위 (RANK {rank})</span>
        </div>

        {/* Distance & Speed */}
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-2 flex items-center gap-3 shadow-xl text-xs">
          <div>
            <span className="text-slate-400">거리: </span>
            <span className="text-emerald-400 font-extrabold">{distance}m / 100m</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div>
            <span className="text-slate-400">속도: </span>
            <span className="text-sky-400 font-extrabold">{speedKmh} km/h</span>
          </div>
        </div>
      </div>

      {/* Event Banner */}
      {eventBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-amber-500 text-slate-950 font-black px-6 py-1.5 border-2 border-yellow-200 text-sm md:text-base shadow-2xl uppercase">
            {eventBanner}
          </div>
        </div>
      )}

      {/* Bottom Pure Touch Controls */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex items-end justify-between pointer-events-auto">
        {/* Left: Alternating Foot Tap Buttons (L & R) */}
        <div className="flex gap-2">
          <button
            onClick={() => handleFootTap('L')}
            className={`w-18 h-18 rounded-full flex flex-col items-center justify-center border-2 shadow-xl active:scale-90 transition-transform font-black ${
              lastTapFoot === 'R'
                ? 'bg-gradient-to-tr from-sky-600 to-sky-400 border-yellow-300 text-slate-950 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Footprints className="w-6 h-6 mb-0.5" />
            <span className="text-xs">왼발 [L]</span>
          </button>

          <button
            onClick={() => handleFootTap('R')}
            className={`w-18 h-18 rounded-full flex flex-col items-center justify-center border-2 shadow-xl active:scale-90 transition-transform font-black ${
              lastTapFoot === 'L'
                ? 'bg-gradient-to-tr from-sky-600 to-sky-400 border-yellow-300 text-slate-950 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <Footprints className="w-6 h-6 mb-0.5" />
            <span className="text-xs">오른발 [R]</span>
          </button>
        </div>

        {/* Center: Tap Alternating Guide */}
        <div className="hidden md:block bg-slate-900/80 border border-slate-700 px-3 py-1.5 text-[11px] text-slate-300">
          왼발과 오른발을 번갈아 탭하여 최고 속도로 질주하세요!
        </div>

        {/* Right: JUMP & BURST Buttons */}
        <div className="flex items-end gap-2">
          {/* Turbo Burst Button (64px) */}
          <button
            onClick={handleBurst}
            disabled={burstGauge < 100}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-xl active:scale-95 transition-transform ${
              burstGauge >= 100
                ? 'bg-amber-500 border-yellow-200 text-slate-950 font-black animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40'
            }`}
          >
            <Zap className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-black">스퍼트</span>
          </button>

          {/* Primary JUMP Button (76px) */}
          <button
            onClick={handleJump}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 border-2 border-emerald-200 text-slate-950 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform font-black"
          >
            <ArrowUp className="w-7 h-7 mb-0.5" />
            <span className="text-xs tracking-wider">점프</span>
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">순위권 진입 실패</h2>
            <p className="text-xs text-slate-300 mb-4">
              {rank}위로 결승선을 통과하여 메달 획득에 실패했습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-sm flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> 재도전
              </button>
              <button
                onClick={handleExit}
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
          onClose={handleExit}
        />
      )}
    </div>
  );
}
