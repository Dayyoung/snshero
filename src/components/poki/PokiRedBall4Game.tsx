import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Star, Heart, ArrowUp, ShieldAlert, Sparkles, RefreshCw, Flag } from 'lucide-react';

interface PokiRedBall4GameProps {
  onBack: () => void;
  cardId?: number;

  onExit?: () => void;
  onClose?: () => void;
}

interface CollectibleStar {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  collected: boolean;
}

interface SquareMinion {
  group: THREE.Group;
  pos: THREE.Vector3;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
  squashTimer: number;
}

export const PokiRedBall4Game: React.FC<PokiRedBall4GameProps> = ({
  onBack,
  cardId = 59,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // UI state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [starsCount, setStarsCount] = useState(0);
  const [eventBanner, setEventBanner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  // Input tracking
  const inputXRef = useRef<number>(0);
  const touchLeftIdRef = useRef<number | null>(null);
  const touchLeftStartXRef = useRef<number>(0);

  // Stats refs
  const startTimeRef = useRef<number>(Date.now());
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const starsRef = useRef<number>(0);

  useEffect(() => {
    scoreRef.current = score;
    livesRef.current = lives;
    starsRef.current = starsCount;
  }, [score, lives, starsCount]);

  // Three.js context
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    ballMesh: THREE.Mesh;
    ballShadow: THREE.Mesh;
    ballPos: THREE.Vector3;
    ballVel: THREE.Vector3;
    isGrounded: boolean;
    invincibleTimer: number;
    stars: CollectibleStar[];
    minions: SquareMinion[];
    flagGroup: THREE.Group;
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  // Helper: Red Ball Cartoon Face Texture
  const createBallFaceTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 0, 512, 512);

    // Big expressive cartoon eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(190, 220, 45, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(322, 220, 45, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    // Black pupils
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(205, 230, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(337, 230, 24, 0, Math.PI * 2);
    ctx.fill();

    // White highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(212, 222, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(344, 222, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cheerful smile
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(256, 290, 60, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  };

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

  // Helper: Square Minion Grumpy Face Texture
  const createMinionFaceTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);

    // Angry angular eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(40, 70, 65, 45);
    ctx.fillRect(151, 70, 65, 45);

    // Black pupils
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(60, 80, 30, 30);
    ctx.fillRect(166, 80, 30, 30);

    // Grumpy mouth
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(70, 165, 116, 20);

    return new THREE.CanvasTexture(canvas);
  };

  // Trigger Sparkle Particles (Gold for Stars, Red for Minion stomp)
  const triggerParticles = useCallback((x: number, y: number, z: number, isStar = true) => {
    const three = threeRef.current;
    if (!three) return;

    if (navigator.vibrate) {
      navigator.vibrate(isStar ? [40, 20, 50] : [60, 30, 90]);
    }

    const count = 40;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = x + (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;

      const c = isStar
        ? new THREE.Color(0xfacc15)
        : new THREE.Color(0xef4444);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        2.5 + Math.random() * 4,
        (Math.random() - 0.5) * 3
      ));
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    if (three.particles) {
      three.scene.remove(three.particles);
    }
    three.particles = new THREE.Points(geo, mat);
    three.particleVels = vels;
    three.scene.add(three.particles);
  }, []);

  // Jump Action Handler
  const handleJump = () => {
    const three = threeRef.current;
    if (!three || !three.isGrounded || gameOver || gameWon) return;

    three.ballVel.y = 11.5;
    three.isGrounded = false;
    if (navigator.vibrate) navigator.vibrate(35);
  };

  // Check Track Ground Height
  const getTrackY = (x: number): { y: number; slope: number } => {
    // 0 ~ 15m: Start Platform (Safe Broad Ground Y = 1.0)
    if (x <= 15) return { y: 1.0, slope: 0 };

    // 15 ~ 25m: Uphill Ramp
    if (x > 15 && x <= 25) {
      const t = (x - 15) / 10;
      return { y: 1.0 + t * 3.5, slope: 0.35 };
    }

    // 25 ~ 33m: High Plateau (Y = 4.5)
    if (x > 25 && x <= 33) return { y: 4.5, slope: 0 };

    // 33 ~ 38m: Downhill Slope
    if (x > 33 && x <= 38) {
      const t = (x - 33) / 5;
      return { y: 4.5 - t * 2.5, slope: -0.5 };
    }

    // 38 ~ 46m: Mid Plateau (Y = 2.0)
    if (x > 38 && x <= 46) return { y: 2.0, slope: 0 };

    // 46 ~ 54m: Gap / Low Valley (Y = 0.5)
    if (x > 46 && x <= 54) return { y: 0.5, slope: 0 };

    // 54 ~ 62m: Floating Island Jump Pad (Y = 3.5)
    if (x > 54 && x <= 62) return { y: 3.5, slope: 0 };

    // 62 ~ 85m: Finish Meadow (Y = 1.5)
    if (x > 62) return { y: 1.5, slope: 0 };

    return { y: 1.0, slope: 0 };
  };

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3f7); // Sunny blue sky
    scene.fog = new THREE.FogExp2(0xbfe3f7, 0.01);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 150);
    camera.position.set(0, 5, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Warm Sun Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 1.25);
    sunLight.position.set(20, 40, 30);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Background Clouds
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 10; i++) {
      const cloud = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5, 1), cloudMat);
      cloud.position.set(i * 12 - 10, 16 + Math.sin(i) * 3, -18);
      scene.add(cloud);
    }

    // Track Geometry & Platforms
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x22c55e }); // Lush green grass
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x78350f }); // Earthy brown soil

    const createPlatform = (x: number, y: number, w: number, h: number, d = 4.5) => {
      const g = new THREE.Group();
      g.position.set(x, y - h / 2, 0);

      // Top grass layer
      const grass = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), grassMat);
      grass.position.y = h / 2 - 0.2;
      grass.receiveShadow = true;
      g.add(grass);

      // Soil base
      const soil = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.4, d - 0.2), dirtMat);
      soil.position.y = -0.2;
      soil.receiveShadow = true;
      g.add(soil);

      scene.add(g);
    };

    // Build 3D Track Segments
    // 1) 0 ~ 15m Start Platform (Safe Broad Start 15m)
    createPlatform(7.5, 1.0, 15, 2.0);

    // 2) 15 ~ 25m Uphill Ramp
    const rampMesh = new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 4.5), grassMat);
    rampMesh.rotation.z = Math.atan2(3.5, 10);
    rampMesh.position.set(20, 2.75, 0);
    scene.add(rampMesh);

    // 3) 25 ~ 33m High Plateau (Y=4.5)
    createPlatform(29, 4.5, 8, 4.0);

    // 4) 33 ~ 38m Downhill Ramp
    const downRamp = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 4.5), grassMat);
    downRamp.rotation.z = -Math.atan2(2.5, 5);
    downRamp.position.set(35.5, 3.25, 0);
    scene.add(downRamp);

    // 5) 38 ~ 46m Mid Plateau (Y=2.0)
    createPlatform(42, 2.0, 8, 2.0);

    // 6) 46 ~ 54m Low Valley (Y=0.5)
    createPlatform(50, 0.5, 8, 2.0);

    // 7) 54 ~ 62m Floating Jump Pad (Y=3.5)
    createPlatform(58, 3.5, 8, 1.5);

    // 8) 62 ~ 85m Finish Meadow (Y=1.5)
    createPlatform(73.5, 1.5, 23, 2.5);

    // 3D Red Ball Player
    const ballGeo = new THREE.SphereGeometry(0.65, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      map: createBallFaceTexture(),
      roughness: 0.2,
      metalness: 0.15,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(2.0, 1.65, 0);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    // Ball Ground Shadow
    const shadowGeo = new THREE.CircleGeometry(0.65, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const ballShadow = new THREE.Mesh(shadowGeo, shadowMat);
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.position.set(2.0, 1.01, 0);
    scene.add(ballShadow);

    // No.059 Hero Badge above Red Ball
    const badgeGeo = new THREE.PlaneGeometry(0.6, 0.75);
    const badgeMat = new THREE.MeshBasicMaterial({
      map: createCardBadgeTexture(cardId),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 1.25, 0);
    ballMesh.add(badge);

    // 5 Collectible 3D Golden Stars
    const stars: CollectibleStar[] = [];
    const starGeo = new THREE.OctahedronGeometry(0.45, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });

    const starPositions = [
      new THREE.Vector3(12, 2.5, 0),
      new THREE.Vector3(22, 4.2, 0),
      new THREE.Vector3(31, 6.0, 0),
      new THREE.Vector3(58, 5.2, 0),
      new THREE.Vector3(70, 3.2, 0),
    ];

    for (const p of starPositions) {
      const sMesh = new THREE.Mesh(starGeo, starMat);
      sMesh.position.copy(p);
      scene.add(sMesh);
      stars.push({ mesh: sMesh, pos: p, collected: false });
    }

    // 3 Square Minions
    const minions: SquareMinion[] = [];
    const minionFaceTex = createMinionFaceTexture();
    const minionMat = new THREE.MeshStandardMaterial({
      map: minionFaceTex,
      roughness: 0.4,
      metalness: 0.2,
    });

    const spawnMinion = (x: number, y: number, minX: number, maxX: number) => {
      const g = new THREE.Group();
      g.position.set(x, y + 0.5, 0);

      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), minionMat);
      cube.castShadow = true;
      g.add(cube);

      scene.add(g);
      minions.push({
        group: g,
        pos: new THREE.Vector3(x, y + 0.5, 0),
        vx: 1.8,
        minX,
        maxX,
        alive: true,
        squashTimer: 0,
      });
    };

    spawnMinion(28, 4.5, 26, 32);
    spawnMinion(42, 2.0, 39, 45);
    spawnMinion(68, 1.5, 64, 73);

    // Finish Flag at X = 78
    const flagGroup = new THREE.Group();
    flagGroup.position.set(78, 1.5, 0);

    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.75;
    flagGroup.add(pole);

    const bannerGeo = new THREE.PlaneGeometry(1.2, 0.8);
    const bannerMat = new THREE.MeshLambertMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0.65, 3.0, 0);
    flagGroup.add(banner);

    scene.add(flagGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      ballMesh,
      ballShadow,
      ballPos: new THREE.Vector3(2.0, 1.65, 0),
      ballVel: new THREE.Vector3(0, 0, 0),
      isGrounded: false,
      invincibleTimer: 0,
      stars,
      minions,
      flagGroup,
      particles: null,
      particleVels: [],
      animId: 0,
      clock: new THREE.Clock(),
    };

    // Animation & Physics Loop
    const animate = () => {
      const three = threeRef.current;
      if (!three) return;

      const delta = Math.min(three.clock.getDelta(), 0.1);

      // Horizontal Ball Acceleration
      const inpX = inputXRef.current;
      const rollSpeed = 8.5;

      if (inpX !== 0) {
        three.ballVel.x += inpX * rollSpeed * delta * 5.0;
      } else {
        three.ballVel.x *= 0.88; // Friction
      }

      // Max velocity clamp
      three.ballVel.x = Math.max(-10, Math.min(10, three.ballVel.x));

      // Gravity
      three.ballVel.y -= 19.6 * delta;

      // Step Ball Position
      three.ballPos.x += three.ballVel.x * delta;
      three.ballPos.y += three.ballVel.y * delta;

      // Ball Rolling Rotation (Z-axis rotation for side-scroller)
      three.ballMesh.rotation.z -= (three.ballVel.x / 0.65) * delta;

      // Track Ground Collision
      const groundInfo = getTrackY(three.ballPos.x);
      const floorY = groundInfo.y + 0.65;

      if (three.ballPos.y <= floorY) {
        three.ballPos.y = floorY;
        three.ballVel.y = 0;
        three.isGrounded = true;

        // Slope acceleration
        if (groundInfo.slope !== 0) {
          three.ballVel.x -= groundInfo.slope * 12.0 * delta;
        }
      } else {
        three.isGrounded = false;
      }

      // Shadow follow
      three.ballShadow.position.x = three.ballPos.x;
      three.ballShadow.position.y = groundInfo.y + 0.02;
      const shadowScale = Math.max(0.2, 1.0 - (three.ballPos.y - floorY) * 0.25);
      three.ballShadow.scale.set(shadowScale, shadowScale, 1);

      three.ballMesh.position.copy(three.ballPos);

      // Invincibility blink
      if (three.invincibleTimer > 0) {
        three.invincibleTimer -= delta;
        three.ballMesh.visible = Math.floor(three.invincibleTimer * 10) % 2 === 0;
      } else {
        three.ballMesh.visible = true;
      }

      // Check Collectible Stars
      for (const s of three.stars) {
        if (s.collected) continue;
        s.mesh.rotation.y += delta * 3.0;

        const dist = three.ballPos.distanceTo(s.pos);
        if (dist < 1.2) {
          s.collected = true;
          s.mesh.visible = false;
          triggerParticles(s.pos.x, s.pos.y, s.pos.z, true);

          const newStars = starsRef.current + 1;
          const newScore = scoreRef.current + 100;
          setStarsCount(newStars);
          setScore(newScore);
          setEventBanner(`황금 별 수집! (${newStars}/5)`);
          setTimeout(() => setEventBanner(null), 1000);
        }
      }

      // Check Minion Interactions (Stomp vs Bump)
      for (const m of three.minions) {
        if (!m.alive) {
          if (m.squashTimer > 0) {
            m.squashTimer -= delta;
            m.group.scale.y = Math.max(0.1, m.squashTimer);
            if (m.squashTimer <= 0) {
              three.scene.remove(m.group);
            }
          }
          continue;
        }

        // Minion Patrol
        m.pos.x += m.vx * delta;
        if (m.pos.x < m.minX || m.pos.x > m.maxX) {
          m.vx *= -1;
        }
        m.group.position.copy(m.pos);

        // Distance to ball
        const dx = three.ballPos.x - m.pos.x;
        const dy = three.ballPos.y - m.pos.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 1.25) {
          // Check if Stomping from Above!
          if (dy > 0.45 && three.ballVel.y < 0) {
            // STOMP VICTORY!
            m.alive = false;
            m.squashTimer = 0.5;
            three.ballVel.y = 12.0; // High bounce!
            triggerParticles(m.pos.x, m.pos.y, m.pos.z, false);

            setScore((s) => s + 150);
            setEventBanner('스퀘어 미니언 스톰프 격파! (+150)');
            setTimeout(() => setEventBanner(null), 1200);
          } else if (three.invincibleTimer <= 0) {
            // HURT! Side collision
            three.invincibleTimer = 1.5;
            const newLives = livesRef.current - 1;
            setLives(newLives);

            // Bounce back
            three.ballVel.x = Math.sign(dx) * 7.0;
            three.ballVel.y = 6.0;

            if (navigator.vibrate) navigator.vibrate([60, 40, 80]);

            if (newLives <= 0) {
              setGameOver(true);
              const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
              const reward = calculateAndDepositMissionReward({
                gameId: 'poki-red-ball-4',
                gameTitle: 'Red Ball 4 3D',
                isVictory: false,
                score: scoreRef.current,
                maxTargetScore: 1000,
                durationSeconds: dur,
              });
              setRewardResult(reward);
            }
          }
        }
      }

      // Check Fall Out of World (Y < -4)
      if (three.ballPos.y < -4) {
        // Fall respawn
        const newLives = livesRef.current - 1;
        setLives(newLives);
        three.ballPos.set(2.0, 2.0, 0);
        three.ballVel.set(0, 0, 0);

        if (newLives <= 0) {
          setGameOver(true);
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const reward = calculateAndDepositMissionReward({
            gameId: 'poki-red-ball-4',
            gameTitle: 'Red Ball 4 3D',
            isVictory: false,
            score: scoreRef.current,
            maxTargetScore: 1000,
            durationSeconds: dur,
          });
          setRewardResult(reward);
        }
      }

      // Check Finish Flag Goal
      if (three.ballPos.x >= 77.5 && !gameOver && !gameWon) {
        setGameWon(true);
        triggerParticles(78, 3.5, 0, true);
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const reward = calculateAndDepositMissionReward({
          gameId: 'poki-red-ball-4',
          gameTitle: 'Red Ball 4 3D',
          isVictory: true,
          score: scoreRef.current + 400,
          maxTargetScore: 1000,
          durationSeconds: dur,
        });
        setRewardResult(reward);
      }

      // Camera Smooth Follow (Side-scroller)
      const targetCamX = three.ballPos.x + 3.5;
      const targetCamY = Math.max(4.0, three.ballPos.y + 2.5);
      three.camera.position.x += (targetCamX - three.camera.position.x) * 0.08;
      three.camera.position.y += (targetCamY - three.camera.position.y) * 0.08;
      three.camera.lookAt(three.camera.position.x, three.camera.position.y - 1.0, 0);

      // Particles physics
      if (three.particles && three.particleVels.length > 0) {
        const posAttr = three.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < three.particleVels.length; i++) {
          arr[i * 3] += three.particleVels[i].x * delta;
          arr[i * 3 + 1] += three.particleVels[i].y * delta;
          arr[i * 3 + 2] += three.particleVels[i].z * delta;
          three.particleVels[i].y -= 9.8 * delta;
        }
        posAttr.needsUpdate = true;
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
  }, [cardId, triggerParticles]);

  // Touch Controls
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.clientX < window.innerWidth * 0.55 && touchLeftIdRef.current === null) {
        touchLeftIdRef.current = touch.identifier;
        touchLeftStartXRef.current = touch.clientX;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === touchLeftIdRef.current) {
        const dx = touch.clientX - touchLeftStartXRef.current;
        const normalized = Math.max(-1, Math.min(1, dx / 45));
        inputXRef.current = normalized;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchLeftIdRef.current) {
        touchLeftIdRef.current = null;
        inputXRef.current = 0;
      }
    }
  };

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    setStarsCount(0);
    setGameOver(false);
    setGameWon(false);
    setRewardResult(null);
    startTimeRef.current = Date.now();

    if (threeRef.current) {
      threeRef.current.ballPos.set(2.0, 1.65, 0);
      threeRef.current.ballVel.set(0, 0, 0);
      for (const s of threeRef.current.stars) {
        s.collected = false;
        s.mesh.visible = true;
      }
      for (const m of threeRef.current.minions) {
        m.alive = true;
        m.group.scale.set(1, 1, 1);
        m.group.position.set(m.minX + 2, m.pos.y, 0);
        m.pos.x = m.minX + 2;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#bfe3f7] font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Standard HUD */}
      <MinimalistMissionHUD
        gameTitle="RED BALL 4 3D"
        onBack={onBack}
        score={score}
        targetScore={800}
      />

      {/* Lives & Stars Status Header */}
      <div className="absolute top-14 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        {/* Lives Hearts */}
        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3.5 py-2 flex items-center gap-1.5 shadow-xl">
          <span className="text-[11px] text-slate-400 mr-1">생명:</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 ${
                i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Stars Collected */}
        <div className="bg-slate-900/90 border border-amber-500/80 backdrop-blur-md px-3.5 py-2 flex items-center gap-2 shadow-xl">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-black text-yellow-300">{starsCount} / 5</span>
        </div>
      </div>

      {/* Event Banner */}
      {eventBanner && (
        <div className="absolute top-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-bounce">
          <div className="bg-rose-500 text-white font-black px-6 py-1.5 border-2 border-rose-200 text-sm md:text-base shadow-2xl uppercase tracking-wider">
            {eventBanner}
          </div>
        </div>
      )}

      {/* Bottom Left Touch Slider Guide */}
      <div className="absolute bottom-8 left-6 z-20 pointer-events-none bg-slate-900/80 border border-slate-700 px-3.5 py-2 rounded-sm text-center">
        <span className="text-[11px] text-sky-400 font-semibold block mb-0.5">
          ◀ 좌우 드래그 롤링 ▶
        </span>
        <span className="text-[10px] text-slate-400">화면 좌측을 터치하여 공을 굴리세요</span>
      </div>

      {/* Large 76px JUMP Button */}
      <div className="absolute bottom-8 right-6 z-20 pointer-events-auto">
        <button
          onClick={handleJump}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 border-2 border-emerald-200 text-slate-950 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform font-black"
        >
          <ArrowUp className="w-7 h-7 mb-0.5" />
          <span className="text-xs tracking-wider">점프</span>
        </button>
      </div>

      {/* Game Over Modal */}
      {gameOver && !rewardResult && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-rose-400 mb-1">레드 볼 탈진</h2>
            <p className="text-xs text-slate-300 mb-4">
              생명을 모두 소진하여 모험을 완주하지 못했습니다.
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
