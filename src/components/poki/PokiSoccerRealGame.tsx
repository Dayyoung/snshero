import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Trophy, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface PokiSoccerRealGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

export const PokiSoccerRealGame: React.FC<PokiSoccerRealGameProps> = ({
  onBack,
  onExit,
  cardId = 25,
  deck,
  lowSpecMode = false,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => {});
  const playerHeroId = deck?.[0]?.id || cardId || 25;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI State
  const [score, setScore] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [curve, setCurve] = useState(0); // -1 (left curve) ~ +1 (right curve)
  const [goalBanner, setGoalBanner] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Time & Stats tracking
  const startTimeRef = useRef<number>(Date.now());
  const scoreRef = useRef<number>(0);
  const attemptsRef = useRef<number>(5);

  // Swipe / Drag Tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Internal Game State
  const gameStateRef = useRef<{
    ballPos: THREE.Vector3;
    ballVel: THREE.Vector3;
    ballSpin: number;
    isShot: boolean;
    ballSettled: boolean;
    gkPos: THREE.Vector3;
    gkVx: number;
    gkDiving: boolean;
    wallJump: number;
    kickerLegAngle: number;
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
  }>({
    ballPos: new THREE.Vector3(0, 0.24, 9.5),
    ballVel: new THREE.Vector3(0, 0, 0),
    ballSpin: 0,
    isShot: false,
    ballSettled: false,
    gkPos: new THREE.Vector3(0, 0, 0.1),
    gkVx: 2.8,
    gkDiving: false,
    wallJump: 0,
    kickerLegAngle: 0,
    particles: null,
    particleVels: [],
  });

  // Three.js References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    ballMesh: THREE.Mesh;
    kickerGroup: THREE.Group;
    kickerLeg: THREE.Mesh;
    gkGroup: THREE.Group;
    wallGroups: THREE.Group[];
    netMesh: THREE.Mesh;
    animFrameId: number;
  } | null>(null);

  // Trigger Goal Confetti Burst
  const spawnGoalConfetti = useCallback(() => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 80, 50, 120]);
    }

    const count = 60;
    const posArr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 6;
      posArr[i * 3 + 1] = 1.5 + Math.random() * 1.5;
      posArr[i * 3 + 2] = -0.5 + (Math.random() - 0.5) * 2;

      const col = new THREE.Color().setHSL(Math.random(), 0.9, 0.6);
      colArr[i * 3] = col.r;
      colArr[i * 3 + 1] = col.g;
      colArr[i * 3 + 2] = col.b;

      vels.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 4,
          (Math.random() - 0.5) * 6
        )
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 1,
    });

    if (gameStateRef.current.particles) {
      three.scene.remove(gameStateRef.current.particles);
      gameStateRef.current.particles.geometry.dispose();
    }

    const pMesh = new THREE.Points(geo, mat);
    gameStateRef.current.particles = pMesh;
    gameStateRef.current.particleVels = vels;
    three.scene.add(pMesh);
  }, []);

  // Reset ball for next attempt
  const resetBall = useCallback(() => {
    const s = gameStateRef.current;
    s.ballPos.set(0, 0.24, 9.5);
    s.ballVel.set(0, 0, 0);
    s.ballSpin = 0;
    s.isShot = false;
    s.ballSettled = false;
    s.gkDiving = false;
    s.wallJump = 0;
    s.kickerLegAngle = 0;
    setGoalBanner(null);

    const three = threeRef.current;
    if (three) {
      three.ballMesh.position.copy(s.ballPos);
      three.ballMesh.rotation.set(0, 0, 0);
      three.gkGroup.position.set(0, 0, 0.1);
      three.gkGroup.rotation.z = 0;
    }
  }, []);

  // Execute Shoot
  const shootBall = useCallback((targetX: number, power: number, spinVal: number) => {
    const s = gameStateRef.current;
    if (s.isShot || s.ballSettled) return;

    s.isShot = true;
    attemptsRef.current--;
    setAttemptsLeft(attemptsRef.current);

    if (navigator.vibrate) navigator.vibrate(35);

    // Calculate initial velocity vector to goal (Z goes from 9.5 to ~0)
    const clampedPower = Math.min(Math.max(power, 14), 26);
    const vz = -clampedPower;
    const timeToGoal = Math.abs(9.5 / vz);
    const vx = (targetX / timeToGoal);
    const vy = Math.min(Math.max(power * 0.45, 5), 10.5);

    s.ballVel.set(vx, vy, vz);
    s.ballSpin = spinVal * 4.5;
    s.kickerLegAngle = -Math.PI / 3;

    // Goalkeeper AI Dive Decision
    setTimeout(() => {
      const predX = targetX + spinVal * 1.5;
      s.gkDiving = true;
      s.gkVx = predX > s.gkPos.x ? 4.5 : -4.5;
    }, 180);
  }, []);

  // Handle Give Up / Quit
  const handleGiveUp = useCallback(() => {
    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_soccer_real',
      gameTitle: 'Soccer REAL 3D',
      durationSeconds: duration,
      score: scoreRef.current * 200,
      maxTargetScore: 1000,
      isVictory: false,
    });
    setRewardResult(receipt);
    setGameOver(true);
  }, []);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc7f2d6); // Stadium Night Sky
    scene.fog = new THREE.FogExp2(0xc7f2d6, 0.015);

    // 2. Camera (Behind Kicker Shoulder View)
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 14.2);
    camera.lookAt(0, 1.4, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lowSpecMode,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (!lowSpecMode) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const stadiumLight1 = new THREE.DirectionalLight(0xfff7ed, 1.3);
    stadiumLight1.position.set(15, 25, 20);
    if (!lowSpecMode) {
      stadiumLight1.castShadow = true;
      stadiumLight1.shadow.mapSize.width = 1024;
      stadiumLight1.shadow.mapSize.height = 1024;
    }
    scene.add(stadiumLight1);

    const stadiumLight2 = new THREE.DirectionalLight(0xe0f2fe, 0.9);
    stadiumLight2.position.set(-15, 25, -5);
    scene.add(stadiumLight2);

    // 5. Lush Green Striped Soccer Pitch (36m x 28m)
    const pitchGeo = new THREE.PlaneGeometry(36, 28);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Vibrant grass
      roughness: 0.8,
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = !lowSpecMode;
    scene.add(pitch);

    // Pitch White Lines (Penalty Box & Arc)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const createLine = (w: number, d: number, x: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.01, z);
      scene.add(mesh);
    };
    createLine(18, 0.12, 0, 5.5);   // Penalty Box Bottom
    createLine(0.12, 5.5, -9, 2.75); // Penalty Box Left
    createLine(0.12, 5.5, 9, 2.75);  // Penalty Box Right
    createLine(24, 0.12, 0, 0);     // Goal Line

    // Penalty Spot (X: 0, Z: 9.5)
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), lineMat);
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(0, 0.012, 9.5);
    scene.add(spot);

    // 6. Large Official Goal Post (7.32m x 2.44m)
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.2 });
    const postRadius = 0.08;

    // Left Post
    const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, 2.44, 12), postMat);
    leftPost.position.set(-3.66, 1.22, 0);
    leftPost.castShadow = !lowSpecMode;
    scene.add(leftPost);

    // Right Post
    const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, 2.44, 12), postMat);
    rightPost.position.set(3.66, 1.22, 0);
    rightPost.castShadow = !lowSpecMode;
    scene.add(rightPost);

    // Crossbar
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, 7.32, 12), postMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 2.44, 0);
    crossbar.castShadow = !lowSpecMode;
    scene.add(crossbar);

    // Goal Net Mesh
    const netMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const netGeo = new THREE.BoxGeometry(7.32, 2.44, 1.8);
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(0, 1.22, -0.9);
    scene.add(netMesh);

    // 7. 3D Soccer Ball
    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = 128;
    ballCanvas.height = 128;
    const bCtx = ballCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#ffffff';
      bCtx.fillRect(0, 0, 128, 128);
      bCtx.fillStyle = '#1e293b';
      // Classic Telstar pentagons
      [
        [64, 64, 22],
        [15, 20, 14],
        [110, 20, 14],
        [15, 108, 14],
        [110, 108, 14],
      ].forEach(([bx, by, r]) => {
        bCtx.beginPath();
        bCtx.arc(bx, by, r, 0, Math.PI * 2);
        bCtx.fill();
      });
    }
    const ballTex = new THREE.CanvasTexture(ballCanvas);
    const ballGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.3,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.copy(gameStateRef.current.ballPos);
    ballMesh.castShadow = !lowSpecMode;
    scene.add(ballMesh);

    // 8. Player Kicker Group (Standing behind the ball at Z: 10.4)
    const kickerGroup = new THREE.Group();
    const kBodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }); // Blue Jersey
    const kShortsMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const kTorso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.35), kBodyMat);
    kTorso.position.y = 1.0;
    kTorso.castShadow = !lowSpecMode;
    kickerGroup.add(kTorso);

    const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    kHead.position.y = 1.6;
    kickerGroup.add(kHead);

    const kShorts = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.36), kShortsMat);
    kShorts.position.y = 0.5;
    kickerGroup.add(kShorts);

    // Kicking Right Leg
    const kickerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), kBodyMat);
    kickerLeg.position.set(0.18, 0.3, 0);
    kickerGroup.add(kickerLeg);

    const kLeftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.65, 0.2), kBodyMat);
    kLeftLeg.position.set(-0.18, 0.3, 0);
    kickerGroup.add(kLeftLeg);

    // Hero No.025 Badge Sprite
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 64;
    badgeCanvas.height = 64;
    const heroCtx = badgeCanvas.getContext('2d');
    if (heroCtx) {
      drawCardSprite(heroCtx, playerHeroId, 0, 0, 64, 64);
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex, transparent: true }));
    badgeSprite.scale.set(0.65, 0.65, 0.65);
    badgeSprite.position.set(0, 2.15, 0);
    kickerGroup.add(badgeSprite);

    kickerGroup.position.set(-0.35, 0, 10.4);
    scene.add(kickerGroup);

    // 9. Goalkeeper Group (Standing at Goal Line)
    const gkGroup = new THREE.Group();
    const gkBodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 }); // Orange Kit

    const gkTorso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.35), gkBodyMat);
    gkTorso.position.y = 1.0;
    gkTorso.castShadow = !lowSpecMode;
    gkGroup.add(gkTorso);

    const gkHead = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    gkHead.position.y = 1.6;
    gkGroup.add(gkHead);

    const gkGloveGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const gkGloveMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const gkLeftGlove = new THREE.Mesh(gkGloveGeo, gkGloveMat);
    gkLeftGlove.position.set(-0.55, 1.0, 0.1);
    const gkRightGlove = new THREE.Mesh(gkGloveGeo, gkGloveMat);
    gkRightGlove.position.set(0.55, 1.0, 0.1);
    gkGroup.add(gkLeftGlove);
    gkGroup.add(gkRightGlove);

    gkGroup.position.copy(gameStateRef.current.gkPos);
    scene.add(gkGroup);

    // 10. Defensive Wall (3 Defenders standing at Z: 4.5)
    const wallGroups: THREE.Group[] = [];
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 }); // Red Team
    const wallPositions = [-0.7, 0, 0.7];

    wallPositions.forEach((wx) => {
      const defGroup = new THREE.Group();
      const defTorso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.32), wallMat);
      defTorso.position.y = 1.0;
      defTorso.castShadow = !lowSpecMode;
      defGroup.add(defTorso);

      const defHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
      defHead.position.y = 1.6;
      defGroup.add(defHead);

      defGroup.position.set(wx, 0, 4.5);
      scene.add(defGroup);
      wallGroups.push(defGroup);
    });

    threeRef.current = {
      scene,
      camera,
      renderer,
      ballMesh,
      kickerGroup,
      kickerLeg,
      gkGroup,
      wallGroups,
      netMesh,
      animFrameId: 0,
    };

    // 11. Main Physics & Render Loop
    let lastTime = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const s = gameStateRef.current;
      const three = threeRef.current;

      if (three && !gameOver && !gameWon) {
        // --- Goalkeeper Movement ---
        if (!s.gkDiving) {
          s.gkPos.x += s.gkVx * dt;
          if (s.gkPos.x > 2.4 || s.gkPos.x < -2.4) {
            s.gkVx = -s.gkVx;
          }
        } else {
          s.gkPos.x += s.gkVx * dt;
          three.gkGroup.rotation.z = s.gkVx > 0 ? -Math.PI / 4 : Math.PI / 4;
        }
        three.gkGroup.position.copy(s.gkPos);

        // --- Defensive Wall Jump ---
        if (s.isShot && s.ballPos.z > 3.0) {
          s.wallJump = Math.min(s.wallJump + dt * 3.5, 0.65);
        } else {
          s.wallJump = Math.max(s.wallJump - dt * 2.5, 0);
        }
        three.wallGroups.forEach((wg) => {
          wg.position.y = s.wallJump;
        });

        // --- Ball Physics in Flight ---
        if (s.isShot && !s.ballSettled) {
          // Curve spin (Magnus effect)
          s.ballVel.x += s.ballSpin * dt;
          s.ballVel.y -= 15.5 * dt; // Gravity

          s.ballPos.x += s.ballVel.x * dt;
          s.ballPos.y += s.ballVel.y * dt;
          s.ballPos.z += s.ballVel.z * dt;

          // Ground bounce
          if (s.ballPos.y <= 0.24) {
            s.ballPos.y = 0.24;
            s.ballVel.y = -s.ballVel.y * 0.55;
            s.ballVel.x *= 0.85;
            s.ballVel.z *= 0.85;
          }

          // Ball Rotation
          three.ballMesh.rotation.x -= s.ballVel.z * dt * 2;
          three.ballMesh.rotation.y += s.ballVel.x * dt * 2;
          three.ballMesh.position.copy(s.ballPos);

          // Camera Dynamic Tracking
          three.camera.position.x += (s.ballPos.x * 0.35 - three.camera.position.x) * 0.06;
          three.camera.lookAt(s.ballPos.x * 0.5, 1.4, s.ballPos.z * 0.3);

          // --- Collision: Defensive Wall (Z ~ 4.5) ---
          if (Math.abs(s.ballPos.z - 4.5) < 0.35) {
            three.wallGroups.forEach((wg) => {
              const dx = Math.abs(s.ballPos.x - wg.position.x);
              const dy = s.ballPos.y;
              if (dx < 0.4 && dy < 1.8 + s.wallJump) {
                // Blocked by Wall
                s.ballSettled = true;
                s.ballVel.set((Math.random() - 0.5) * 6, 3, 5);
                setGoalBanner('수비벽에 막힘! (BLOCKED)');
                if (navigator.vibrate) navigator.vibrate(60);
                setTimeout(checkNextAttempt, 1400);
              }
            });
          }

          // --- Collision: Goalkeeper (Z ~ 0.1) ---
          if (!s.ballSettled && Math.abs(s.ballPos.z - s.gkPos.z) < 0.45) {
            const dx = Math.abs(s.ballPos.x - s.gkPos.x);
            const dy = Math.abs(s.ballPos.y - 1.0);
            if (dx < 0.9 && dy < 1.2) {
              // Saved by Goalkeeper!
              s.ballSettled = true;
              s.ballVel.set((Math.random() - 0.5) * 8, 4, 6);
              setGoalBanner('골키퍼 선방! (SAVED)');
              if (navigator.vibrate) navigator.vibrate(80);
              setTimeout(checkNextAttempt, 1400);
            }
          }

          // --- Collision: Goal Post (Crossbar & Posts) ---
          if (!s.ballSettled && Math.abs(s.ballPos.z) < 0.3) {
            // Left or Right Post hit
            if ((Math.abs(s.ballPos.x - (-3.66)) < 0.3 || Math.abs(s.ballPos.x - 3.66) < 0.3) && s.ballPos.y < 2.5) {
              s.ballSettled = true;
              s.ballVel.x = -s.ballVel.x * 0.7;
              s.ballVel.z = 4;
              setGoalBanner('골포스트 강타! (POST HIT)');
              if (navigator.vibrate) navigator.vibrate([40, 40]);
              setTimeout(checkNextAttempt, 1400);
            }
            // Crossbar hit
            if (Math.abs(s.ballPos.y - 2.44) < 0.25 && Math.abs(s.ballPos.x) < 3.66) {
              s.ballSettled = true;
              s.ballVel.y = -s.ballVel.y * 0.7;
              s.ballVel.z = 4;
              setGoalBanner('크로스바 강타! (CROSSBAR)');
              if (navigator.vibrate) navigator.vibrate([40, 40]);
              setTimeout(checkNextAttempt, 1400);
            }
          }

          // --- Goal Detection (Passing through Goal Line Z <= 0) ---
          if (!s.ballSettled && s.ballPos.z <= 0 && s.ballPos.z > -1.8) {
            if (Math.abs(s.ballPos.x) < 3.55 && s.ballPos.y > 0.2 && s.ballPos.y < 2.38) {
              // GOAL!!
              s.ballSettled = true;
              scoreRef.current++;
              setScore(scoreRef.current);
              setGoalBanner('환상적인 골!! GOAL!!! ⚽');
              spawnGoalConfetti();

              setTimeout(checkNextAttempt, 1600);
            }
          }

          // Out of Bounds Miss
          if (!s.ballSettled && s.ballPos.z < -2.5) {
            s.ballSettled = true;
            setGoalBanner('골문 빗나감! (MISSED)');
            setTimeout(checkNextAttempt, 1200);
          }
        }

        // Particle Physics
        if (s.particles && s.particleVels.length > 0) {
          const posAttr = s.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < s.particleVels.length; i++) {
            const v = s.particleVels[i];
            posArr[i * 3] += v.x * dt;
            posArr[i * 3 + 1] += v.y * dt;
            posArr[i * 3 + 2] += v.z * dt;
            v.y -= 9.8 * dt;
          }
          posAttr.needsUpdate = true;
          (s.particles.material as THREE.PointsMaterial).opacity = Math.max(
            0,
            (s.particles.material as THREE.PointsMaterial).opacity - dt * 0.8
          );
        }

        three.renderer.render(three.scene, three.camera);
        three.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    threeRef.current.animFrameId = requestAnimationFrame(renderLoop);

    const checkNextAttempt = () => {
      if (attemptsRef.current <= 0) {
        // Match Finished
        const isVic = scoreRef.current >= 3;
        const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
        const receipt = calculateAndDepositMissionReward({
          gameId: 'poki_soccer_real',
          gameTitle: 'Soccer REAL 3D',
          durationSeconds: duration,
          score: scoreRef.current * 200,
          maxTargetScore: 1000,
          isVictory: isVic,
        });
        setRewardResult(receipt);
        if (isVic) setGameWon(true);
        else setGameOver(true);
      } else {
        resetBall();
      }
    };

    // Responsive Resize
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animFrameId);
        threeRef.current.renderer.dispose();
      }
    };
  }, [lowSpecMode, playerHeroId]);

  // Touch Swipe Gesture (Swipe upward to shoot)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: performance.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Math.max(1, performance.now() - touchStartRef.current.time);
    touchStartRef.current = null;

    if (dy < -30) {
      // Swiped upward towards goal
      const speed = Math.abs(dy) / dt; // pixels per ms
      const power = Math.min(Math.max(speed * 35, 16), 26);
      const targetX = (dx / (window.innerWidth * 0.4)) * 3.5;
      shootBall(targetX, power, curve);
    }
  };

  // Preset Kick Button
  const handlePresetShoot = (direction: 'LEFT' | 'CENTER' | 'RIGHT') => {
    const targetMap = { LEFT: -2.4, CENTER: 0, RIGHT: 2.4 };
    shootBall(targetMap[direction], 21, curve);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#c7f2d6] font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="No.025 Soccer REAL 3D"
        score={score * 200}
        scoreLabel="득점 점수"
        targetLabel="토너먼트 우승"
        targetProgress={`${score} / 3 GOALS`}
        onGiveUp={handleGiveUp}
      />

      {/* Attempts & Score Status Floating Overlay */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Score Balls */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 flex items-center space-x-2">
          <span className="text-xs font-bold text-emerald-300">득점:</span>
          <div className="flex space-x-1">
            {[1, 2, 3].map((g) => (
              <span key={g} className={`text-base ${g <= score ? 'opacity-100' : 'opacity-25'}`}>
                ⚽
              </span>
            ))}
          </div>
        </div>

        {/* Attempts Badge */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-amber-300">
            남은 기회: {attemptsLeft}회
          </span>
        </div>
      </div>

      {/* Goal Notification Big Banner */}
      {goalBanner && (
        <div className="absolute top-28 left-0 right-0 pointer-events-none flex justify-center">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-3 rounded-2xl text-lg font-black shadow-2xl animate-bounce flex items-center space-x-2">
            <Sparkles className="w-6 h-6" />
            <span>{goalBanner}</span>
          </div>
        </div>
      )}

      {/* Curve Spin Selector (Bottom Left) */}
      <div className="absolute bottom-6 left-5 pointer-events-auto bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700 flex flex-col items-center space-y-1.5 shadow-xl">
        <span className="text-[10px] font-bold text-slate-300">바나나킥 커브</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurve((c) => Math.max(c - 0.5, -1))}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center active:bg-cyan-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-extrabold w-8 text-center text-cyan-400">
            {curve < 0 ? `L${Math.abs(curve) * 2}` : curve > 0 ? `R${curve * 2}` : '0'}
          </span>
          <button
            onClick={() => setCurve((c) => Math.min(c + 0.5, 1))}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center active:bg-cyan-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Aim Shoot Buttons (Bottom Right) */}
      <div className="absolute bottom-6 right-5 pointer-events-auto flex items-end space-x-2">
        <button
          onClick={() => handlePresetShoot('LEFT')}
          className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-600 text-cyan-300 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-xs font-black">◀ 좌측</span>
        </button>
        <button
          onClick={() => handlePresetShoot('CENTER')}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-300 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform"
        >
          <span className="text-sm font-black">▲ 중앙</span>
        </button>
        <button
          onClick={() => handlePresetShoot('RIGHT')}
          className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-600 text-cyan-300 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-xs font-black">우측 ▶</span>
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="사커 리얼 3D (Soccer REAL 3D)"
          category="3D 프리킥 시뮬레이션 스포츠"
          guideSteps={[
            {
              title: '화면 스와이프 슈팅 (Swipe to Shoot)',
              desc: '화면을 위로 쓸어 올리면 스와이프한 방향과 속도에 맞춰 3D 축구공이 골대로 발사됩니다.',
              iconType: 'GESTURES',
            },
            {
              title: '수비벽 & 골키퍼 돌파 (Curve & Aim)',
              desc: '점프하는 수비벽과 골키퍼 다이빙을 뚫고 골망을 흔드세요! 좌측 [바나나킥 커브]를 설정해 절묘한 회전 슛을 날릴 수 있습니다.',
              iconType: 'GOAL',
            },
            {
              title: '토너먼트 우승 보상 (3골 달성)',
              desc: '총 5번의 킥 중 3골 이상을 성공시켜 대회 우승 트로피와 최대 50 SNS 보상을 쟁취하세요!',
              iconType: 'REWARDS',
            },
          ]}
          onStart={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Defeat Modal */}
      {(gameWon || gameOver) && (
        <VictoryRewardModal
          isOpen={gameWon || gameOver}
          reward={rewardResult}
          onClose={handleExit}
        />
      )}
    </div>
  );
};
