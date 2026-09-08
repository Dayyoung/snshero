import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Shield, Sparkles, Trophy, Zap } from 'lucide-react';

interface PokiRagdollHitGameProps {
  onBack?: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (name: string) => void;

  onClose?: () => void;
}

interface FighterState {
  x: number;
  z: number;
  vx: number;
  vz: number;
  facing: number; // 1: right, -1: left
  hp: number;
  maxHp: number;
  isGuarding: boolean;
  isPunching: boolean;
  isKicking: boolean;
  actionTimer: number;
  cooldown: number;
  bodyTilt: number;
}

interface RoundConfig {
  name: string;
  enemyName: string;
  enemyHp: number;
  enemySpeed: number;
  enemyDamage: number;
  enemyColor: number;
  weapon: 'NONE' | 'BAT' | 'HAMMER';
}

const ROUNDS: RoundConfig[] = [
  {
    name: 'ROUND 1: 아마추어 매치',
    enemyName: '블러드 스틱맨',
    enemyHp: 80,
    enemySpeed: 3.2,
    enemyDamage: 12,
    enemyColor: 0xef4444,
    weapon: 'NONE',
  },
  {
    name: 'ROUND 2: 하이라이트 매치',
    enemyName: '아이언 브루저',
    enemyHp: 110,
    enemySpeed: 3.8,
    enemyDamage: 18,
    enemyColor: 0xf97316,
    weapon: 'BAT',
  },
  {
    name: 'ROUND 3: 챔피언십 파이널',
    enemyName: '쉐도우 챔피언',
    enemyHp: 140,
    enemySpeed: 4.5,
    enemyDamage: 25,
    enemyColor: 0x8b5cf6,
    weapon: 'HAMMER',
  },
];

export const PokiRagdollHitGame: React.FC<PokiRagdollHitGameProps> = ({
  onBack,
  onExit,
  cardId = 24,
  deck,
  lowSpecMode = false,
  onClose
}) => {
  const handleExit = onExit || onBack || (() => {});
  const playerHeroId = deck?.[0]?.id || cardId || 24;

  // DOM Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI States
  const [currentRound, setCurrentRound] = useState(0);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(80);
  const [score, setScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [roundTransition, setRoundTransition] = useState(false);

  // Time & Score
  const startTimeRef = useRef<number>(Date.now());
  const scoreRef = useRef<number>(0);

  // Touch Joystick
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickTouchIdRef = useRef<number | null>(null);

  // Internal Logic State
  const internalRef = useRef<{
    round: number;
    player: FighterState;
    enemy: FighterState;
    moveDir: { x: number; z: number };
    particles: THREE.Points | null;
    particleVels: THREE.Vector3[];
    isTransitioning: boolean;
  }>({
    round: 0,
    player: {
      x: -4.5,
      z: 0,
      vx: 0,
      vz: 0,
      facing: 1,
      hp: 100,
      maxHp: 100,
      isGuarding: false,
      isPunching: false,
      isKicking: false,
      actionTimer: 0,
      cooldown: 0,
      bodyTilt: 0,
    },
    enemy: {
      x: 4.5,
      z: 0,
      vx: 0,
      vz: 0,
      facing: -1,
      hp: 80,
      maxHp: 80,
      isGuarding: false,
      isPunching: false,
      isKicking: false,
      actionTimer: 0,
      cooldown: 1.0,
      bodyTilt: 0,
    },
    moveDir: { x: 0, z: 0 },
    particles: null,
    particleVels: [],
    isTransitioning: false,
  });

  // Three.js References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerGroup: THREE.Group;
    playerRightArm: THREE.Mesh;
    playerRightLeg: THREE.Mesh;
    enemyGroup: THREE.Group;
    enemyRightArm: THREE.Mesh;
    enemyRightLeg: THREE.Mesh;
    enemyHpBar: THREE.Mesh;
    enemyWeaponMesh: THREE.Mesh | null;
    animFrameId: number;
  } | null>(null);

  // Trigger Hit Sparks Effect
  const spawnHitSparks = useCallback((x: number, y: number, z: number, colorHex: number) => {
    const three = threeRef.current;
    if (!three) return;

    const count = 30;
    const posArr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    const vels: THREE.Vector3[] = [];
    const baseCol = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      posArr[i * 3] = x + (Math.random() - 0.5) * 0.4;
      posArr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.4;
      posArr[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;

      colArr[i * 3] = baseCol.r;
      colArr[i * 3 + 1] = baseCol.g;
      colArr[i * 3 + 2] = baseCol.b;

      vels.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 2,
          (Math.random() - 0.5) * 8
        )
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 1,
    });

    if (internalRef.current.particles) {
      three.scene.remove(internalRef.current.particles);
      internalRef.current.particles.geometry.dispose();
    }

    const pMesh = new THREE.Points(geo, mat);
    internalRef.current.particles = pMesh;
    internalRef.current.particleVels = vels;
    three.scene.add(pMesh);
  }, []);

  // Initialize a round
  const initRound = useCallback(
    (roundIdx: number) => {
      const cfg = ROUNDS[roundIdx];
      const s = internalRef.current;
      s.round = roundIdx;
      s.isTransitioning = false;

      s.player.x = -4.5;
      s.player.z = 0;
      s.player.vx = 0;
      s.player.vz = 0;
      s.player.facing = 1;
      s.player.isPunching = false;
      s.player.isKicking = false;
      s.player.isGuarding = false;
      s.player.bodyTilt = 0;

      s.enemy.x = 4.5;
      s.enemy.z = 0;
      s.enemy.vx = 0;
      s.enemy.vz = 0;
      s.enemy.facing = -1;
      s.enemy.hp = cfg.enemyHp;
      s.enemy.maxHp = cfg.enemyHp;
      s.enemy.isPunching = false;
      s.enemy.isKicking = false;
      s.enemy.isGuarding = false;
      s.enemy.bodyTilt = 0;

      setCurrentRound(roundIdx);
      setEnemyHp(cfg.enemyHp);
      setRoundTransition(false);

      const three = threeRef.current;
      if (!three) return;

      // Update Enemy Color & Weapon
      const enemyMat = new THREE.MeshStandardMaterial({
        color: cfg.enemyColor,
        roughness: 0.4,
      });
      three.enemyGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === 'enemyBodyPart') {
          child.material = enemyMat;
        }
      });

      // Enemy Weapon attach
      if (three.enemyWeaponMesh) {
        three.enemyRightArm.remove(three.enemyWeaponMesh);
        three.enemyWeaponMesh = null;
      }
      if (cfg.weapon === 'BAT') {
        const batGeo = new THREE.CylinderGeometry(0.08, 0.14, 1.1, 8);
        const batMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
        const bat = new THREE.Mesh(batGeo, batMat);
        bat.position.set(0, -0.4, 0.2);
        bat.rotation.x = Math.PI / 3;
        three.enemyRightArm.add(bat);
        three.enemyWeaponMesh = bat;
      } else if (cfg.weapon === 'HAMMER') {
        const hammerGroup = new THREE.Group();
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x334155 })
        );
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.4, 0.6),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 })
        );
        head.position.y = 0.55;
        hammerGroup.add(handle);
        hammerGroup.add(head);
        hammerGroup.position.set(0, -0.4, 0.2);
        hammerGroup.rotation.x = Math.PI / 3;
        three.enemyRightArm.add(hammerGroup);
        three.enemyWeaponMesh = hammerGroup as any;
      }
    },
    []
  );

  // Player Punch Action
  const handlePunch = useCallback(() => {
    const s = internalRef.current;
    if (s.isTransitioning || s.player.actionTimer > 0 || s.player.isGuarding) return;

    s.player.isPunching = true;
    s.player.actionTimer = 0.28;
    s.player.vx = s.player.facing * 3.5;

    if (navigator.vibrate) navigator.vibrate(25);

    // Hit Check
    const dist = Math.hypot(s.player.x - s.enemy.x, s.player.z - s.enemy.z);
    const facingTarget = (s.enemy.x - s.player.x) * s.player.facing > 0;

    if (dist < 2.4 && facingTarget) {
      const dmg = s.enemy.isGuarding ? 8 : 24;
      s.enemy.hp = Math.max(0, s.enemy.hp - dmg);
      setEnemyHp(s.enemy.hp);
      scoreRef.current += 150;
      setScore(scoreRef.current);

      s.enemy.vx += s.player.facing * (s.enemy.isGuarding ? 2 : 5.5);
      s.enemy.bodyTilt = -s.player.facing * 0.4;
      spawnHitSparks(s.enemy.x, 1.2, s.enemy.z, 0xfacc15);

      if (navigator.vibrate) navigator.vibrate(s.enemy.isGuarding ? 30 : 60);

      // Check Round Win
      if (s.enemy.hp <= 0) {
        s.isTransitioning = true;
        setRoundTransition(true);

        setTimeout(() => {
          if (s.round + 1 < ROUNDS.length) {
            initRound(s.round + 1);
          } else {
            // Victory All Rounds
            const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
            const receipt = calculateAndDepositMissionReward({
              gameId: 'poki_ragdoll_hit',
              gameTitle: 'Ragdoll Hit 3D',
              durationSeconds: duration,
              score: 1000,
              maxTargetScore: 1000,
              isVictory: true,
            });
            setRewardResult(receipt);
            setGameWon(true);
          }
        }, 1400);
      }
    }
  }, [lowSpecMode, playerHeroId]);

  // Player Flying Kick Action
  const handleKick = useCallback(() => {
    const s = internalRef.current;
    if (s.isTransitioning || s.player.actionTimer > 0 || s.player.isGuarding) return;

    s.player.isKicking = true;
    s.player.actionTimer = 0.38;
    s.player.vx = s.player.facing * 6.5;

    if (navigator.vibrate) navigator.vibrate(40);

    const dist = Math.hypot(s.player.x - s.enemy.x, s.player.z - s.enemy.z);
    const facingTarget = (s.enemy.x - s.player.x) * s.player.facing > 0;

    if (dist < 2.6 && facingTarget) {
      const dmg = s.enemy.isGuarding ? 12 : 36;
      s.enemy.hp = Math.max(0, s.enemy.hp - dmg);
      setEnemyHp(s.enemy.hp);
      scoreRef.current += 200;
      setScore(scoreRef.current);

      s.enemy.vx += s.player.facing * 8; // Heavy knockback
      s.enemy.bodyTilt = -s.player.facing * 0.7;
      spawnHitSparks(s.enemy.x, 1.0, s.enemy.z, 0xf97316);

      if (navigator.vibrate) navigator.vibrate(80);

      if (s.enemy.hp <= 0) {
        s.isTransitioning = true;
        setRoundTransition(true);

        setTimeout(() => {
          if (s.round + 1 < ROUNDS.length) {
            initRound(s.round + 1);
          } else {
            const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
            const receipt = calculateAndDepositMissionReward({
              gameId: 'poki_ragdoll_hit',
              gameTitle: 'Ragdoll Hit 3D',
              durationSeconds: duration,
              score: 1000,
              maxTargetScore: 1000,
              isVictory: true,
            });
            setRewardResult(receipt);
            setGameWon(true);
          }
        }, 1400);
      }
    }
  }, [lowSpecMode, playerHeroId]);

  // Give up / quit handler
  const handleGiveUp = useCallback(() => {
    const duration = Math.max(5, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki_ragdoll_hit',
      gameTitle: 'Ragdoll Hit 3D',
      durationSeconds: duration,
      score: scoreRef.current,
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
    scene.background = new THREE.Color(0x0f172a); // Slate Dark Arena
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 6.5, 13.5);
    camera.lookAt(0, 1.2, 0);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(5, 15, 10);
    if (!lowSpecMode) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
    }
    scene.add(dirLight);

    // 5. Octagon Arena Mat (22m x 15m)
    const matGeo = new THREE.CylinderGeometry(10.5, 11.0, 0.6, 8);
    const matMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const ringMat = new THREE.Mesh(matGeo, matMat);
    ringMat.position.y = -0.3;
    ringMat.receiveShadow = !lowSpecMode;
    scene.add(ringMat);

    // Arena Center Cyber Decal
    const decalGeo = new THREE.RingGeometry(3.5, 3.8, 32);
    const decalMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
    const decal = new THREE.Mesh(decalGeo, decalMat);
    decal.rotation.x = -Math.PI / 2;
    decal.position.y = 0.01;
    scene.add(decal);

    // Elastic Ropes & 4 Corner Posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    const postCoords = [
      { x: -9, z: -5.5 },
      { x: 9, z: -5.5 },
      { x: -9, z: 5.5 },
      { x: 9, z: 5.5 },
    ];
    postCoords.forEach((p) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.5, 12), postMat);
      post.position.set(p.x, 1.25, p.z);
      scene.add(post);
    });

    // 3 Elastic Horizontal Ropes
    [0.6, 1.2, 1.8].forEach((ry) => {
      const rPoints = [
        new THREE.Vector3(-9, ry, -5.5),
        new THREE.Vector3(9, ry, -5.5),
        new THREE.Vector3(9, ry, 5.5),
        new THREE.Vector3(-9, ry, 5.5),
        new THREE.Vector3(-9, ry, -5.5),
      ];
      const rGeo = new THREE.BufferGeometry().setFromPoints(rPoints);
      const rope = new THREE.Line(rGeo, ropeMat);
      scene.add(rope);
    });

    // 6. Build Player Ragdoll Mesh (Cyan/Blue)
    const pGroup = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }); // Sky Blue

    // Torso
    const pTorso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.4), pMat);
    pTorso.position.y = 1.1;
    pTorso.castShadow = !lowSpecMode;
    pGroup.add(pTorso);

    // Head
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), pMat);
    pHead.position.y = 1.85;
    pGroup.add(pHead);

    // Cyan Neon Eyes
    const pEye = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    pEye.position.set(0.15, 1.88, 0.25);
    pGroup.add(pEye);

    // Arms
    const pLeftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), pMat);
    pLeftArm.position.set(-0.45, 1.1, 0);
    pGroup.add(pLeftArm);

    const pRightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), pMat);
    pRightArm.position.set(0.45, 1.1, 0);
    pGroup.add(pRightArm);

    // Legs
    const pLeftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), pMat);
    pLeftLeg.position.set(-0.2, 0.35, 0);
    pGroup.add(pLeftLeg);

    const pRightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), pMat);
    pRightLeg.position.set(0.2, 0.35, 0);
    pGroup.add(pRightLeg);

    // No.024 Hero Badge Sprite on Top
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 64;
    badgeCanvas.height = 64;
    const bCtx = badgeCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, playerHeroId, 0, 0, 64, 64);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeMat = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
    const badgeSprite = new THREE.Sprite(badgeMat);
    badgeSprite.scale.set(0.65, 0.65, 0.65);
    badgeSprite.position.set(0, 2.45, 0);
    pGroup.add(badgeSprite);

    pGroup.position.set(internalRef.current.player.x, 0, internalRef.current.player.z);
    scene.add(pGroup);

    // 7. Build Enemy Ragdoll Mesh
    const eGroup = new THREE.Group();
    const eMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

    const eTorso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.4), eMat);
    eTorso.name = 'enemyBodyPart';
    eTorso.position.y = 1.1;
    eTorso.castShadow = !lowSpecMode;
    eGroup.add(eTorso);

    const eHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), eMat);
    eHead.name = 'enemyBodyPart';
    eHead.position.y = 1.85;
    eGroup.add(eHead);

    const eLeftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), eMat);
    eLeftArm.name = 'enemyBodyPart';
    eLeftArm.position.set(0.45, 1.1, 0);
    eGroup.add(eLeftArm);

    const eRightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), eMat);
    eRightArm.name = 'enemyBodyPart';
    eRightArm.position.set(-0.45, 1.1, 0);
    eGroup.add(eRightArm);

    const eLeftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), eMat);
    eLeftLeg.name = 'enemyBodyPart';
    eLeftLeg.position.set(0.2, 0.35, 0);
    eGroup.add(eLeftLeg);

    const eRightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), eMat);
    eRightLeg.name = 'enemyBodyPart';
    eRightLeg.position.set(-0.2, 0.35, 0);
    eGroup.add(eRightLeg);

    // Enemy Floating HP Bar
    const hpBg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.05), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    hpBg.position.set(0, 2.4, 0);
    eGroup.add(hpBg);

    const hpBar = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.08, 0.06), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    hpBar.position.set(0, 2.4, 0.01);
    eGroup.add(hpBar);

    eGroup.position.set(internalRef.current.enemy.x, 0, internalRef.current.enemy.z);
    scene.add(eGroup);

    threeRef.current = {
      scene,
      camera,
      renderer,
      playerGroup: pGroup,
      playerRightArm: pRightArm,
      playerRightLeg: pRightLeg,
      enemyGroup: eGroup,
      enemyRightArm: eRightArm,
      enemyRightLeg: eRightLeg,
      enemyHpBar: hpBar,
      enemyWeaponMesh: null,
      animFrameId: 0,
    };

    // Init first round
    initRound(0);

    // 8. Main Physics & Render Loop
    let lastTime = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.08);
      lastTime = now;

      const s = internalRef.current;
      const three = threeRef.current;

      if (three && !gameOver && !gameWon) {
        // --- A. Player Physics & Movement ---
        if (!s.player.isGuarding) {
          const moveSpeed = 5.8;
          s.player.x += s.moveDir.x * moveSpeed * dt + s.player.vx * dt;
          s.player.z += s.moveDir.z * moveSpeed * dt + s.player.vz * dt;
        } else {
          s.player.x += s.player.vx * dt;
          s.player.z += s.player.vz * dt;
        }

        // Friction
        s.player.vx *= 0.88;
        s.player.vz *= 0.88;
        s.player.bodyTilt *= 0.9;

        // Facing direction
        if (s.enemy.x > s.player.x) s.player.facing = 1;
        else s.player.facing = -1;

        // Arena Rope Bounce
        if (s.player.x < -8.5) { s.player.x = -8.5; s.player.vx = 4; }
        if (s.player.x > 8.5) { s.player.x = 8.5; s.player.vx = -4; }
        if (s.player.z < -4.8) { s.player.z = -4.8; s.player.vz = 3; }
        if (s.player.z > 4.8) { s.player.z = 4.8; s.player.vz = -3; }

        // Update Player Mesh Pose
        three.playerGroup.position.set(s.player.x, 0, s.player.z);
        three.playerGroup.rotation.y = s.player.facing === 1 ? 0 : Math.PI;
        three.playerGroup.rotation.z = s.player.bodyTilt;

        // Action Timer & Joint Motion
        if (s.player.actionTimer > 0) {
          s.player.actionTimer -= dt;
          if (s.player.isPunching) {
            three.playerRightArm.rotation.x = -Math.PI / 2;
            three.playerRightArm.position.z = 0.4;
          }
          if (s.player.isKicking) {
            three.playerRightLeg.rotation.x = -Math.PI / 2.2;
            three.playerRightLeg.position.z = 0.35;
          }
        } else {
          s.player.isPunching = false;
          s.player.isKicking = false;
          three.playerRightArm.rotation.x = 0;
          three.playerRightArm.position.z = 0;
          three.playerRightLeg.rotation.x = 0;
          three.playerRightLeg.position.z = 0;
        }

        // --- B. Enemy AI Physics & Behavior ---
        if (!s.isTransitioning) {
          const cfg = ROUNDS[s.round];
          const dist = Math.hypot(s.player.x - s.enemy.x, s.player.z - s.enemy.z);

          // Facing Player
          if (s.player.x > s.enemy.x) s.enemy.facing = 1;
          else s.enemy.facing = -1;

          // AI Move towards Player
          if (dist > 2.0) {
            const dx = (s.player.x - s.enemy.x) / dist;
            const dz = (s.player.z - s.enemy.z) / dist;
            s.enemy.x += dx * cfg.enemySpeed * dt + s.enemy.vx * dt;
            s.enemy.z += dz * cfg.enemySpeed * dt + s.enemy.vz * dt;
          } else {
            s.enemy.x += s.enemy.vx * dt;
            s.enemy.z += s.enemy.vz * dt;

            // AI Attack if in range
            s.enemy.cooldown -= dt;
            if (s.enemy.cooldown <= 0) {
              s.enemy.cooldown = 0.9 + Math.random() * 0.8;
              s.enemy.isPunching = true;
              s.enemy.actionTimer = 0.3;
              s.enemy.vx = s.enemy.facing * 3.5;

              // Hit Player Check
              const pDmg = s.player.isGuarding ? Math.floor(cfg.enemyDamage * 0.3) : cfg.enemyDamage;
              s.player.hp = Math.max(0, s.player.hp - pDmg);
              setPlayerHp(s.player.hp);
              s.player.vx += s.enemy.facing * (s.player.isGuarding ? 2.5 : 6);
              s.player.bodyTilt = -s.enemy.facing * 0.5;

              spawnHitSparks(s.player.x, 1.2, s.player.z, 0xef4444);
              if (navigator.vibrate) navigator.vibrate(s.player.isGuarding ? 20 : 60);

              if (s.player.hp <= 0) {
                handleGiveUp();
              }
            }
          }

          // Enemy Friction & Bounds
          s.enemy.vx *= 0.88;
          s.enemy.vz *= 0.88;
          s.enemy.bodyTilt *= 0.9;

          if (s.enemy.x < -8.5) { s.enemy.x = -8.5; s.enemy.vx = 4; }
          if (s.enemy.x > 8.5) { s.enemy.x = 8.5; s.enemy.vx = -4; }
          if (s.enemy.z < -4.8) { s.enemy.z = -4.8; s.enemy.vz = 3; }
          if (s.enemy.z > 4.8) { s.enemy.z = 4.8; s.enemy.vz = -3; }

          // Update Enemy Mesh
          three.enemyGroup.position.set(s.enemy.x, 0, s.enemy.z);
          three.enemyGroup.rotation.y = s.enemy.facing === 1 ? 0 : Math.PI;
          three.enemyGroup.rotation.z = s.enemy.bodyTilt;
          three.enemyHpBar.scale.x = Math.max(0.01, s.enemy.hp / s.enemy.maxHp);

          if (s.enemy.actionTimer > 0) {
            s.enemy.actionTimer -= dt;
            three.enemyRightArm.rotation.x = -Math.PI / 2;
            three.enemyRightArm.position.z = 0.35;
          } else {
            three.enemyRightArm.rotation.x = 0;
            three.enemyRightArm.position.z = 0;
          }
        }

        // --- C. Particle Sparks Physics ---
        if (s.particles && s.particleVels.length > 0) {
          const posAttr = s.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;

          for (let i = 0; i < s.particleVels.length; i++) {
            const v = s.particleVels[i];
            posArr[i * 3] += v.x * dt;
            posArr[i * 3 + 1] += v.y * dt;
            posArr[i * 3 + 2] += v.z * dt;
            v.y -= 12 * dt; // gravity
          }
          posAttr.needsUpdate = true;
          (s.particles.material as THREE.PointsMaterial).opacity = Math.max(
            0,
            (s.particles.material as THREE.PointsMaterial).opacity - dt * 1.5
          );
        }

        // Camera Tracking
        const midX = (s.player.x + s.enemy.x) / 2;
        three.camera.position.x += (midX * 0.3 - three.camera.position.x) * 0.08;
        three.camera.lookAt(midX * 0.5, 1.2, 0);

        three.renderer.render(three.scene, three.camera);
        three.animFrameId = requestAnimationFrame(renderLoop);
      }
    };
    threeRef.current.animFrameId = requestAnimationFrame(renderLoop);

    // Resize Observer
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

  // Touch Screen Controls (Left Joystick)
  const handleTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.clientX < window.innerWidth * 0.55 && joystickTouchIdRef.current === null) {
        joystickTouchIdRef.current = touch.identifier;
        setJoystickCenter({ x: touch.clientX, y: touch.clientY });
        setJoystickPos({ x: touch.clientX, y: touch.clientY });
        setJoystickActive(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const dist = Math.hypot(dx, dy);
        const maxR = 45;

        let clampX = dx;
        let clampY = dy;
        if (dist > maxR) {
          clampX = (dx / dist) * maxR;
          clampY = (dy / dist) * maxR;
        }

        setJoystickPos({ x: joystickCenter.x + clampX, y: joystickCenter.y + clampY });
        internalRef.current.moveDir = {
          x: clampX / maxR,
          z: clampY / maxR,
        };
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickActive(false);
        internalRef.current.moveDir = { x: 0, z: 0 };
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      updateKeyMove();
      if (e.key === ' ' || e.key.toLowerCase() === 'j') {
        handlePunch();
      } else if (e.key.toLowerCase() === 'k') {
        handleKick();
      } else if (e.key.toLowerCase() === 'l') {
        internalRef.current.player.isGuarding = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
      updateKeyMove();
      if (e.key.toLowerCase() === 'l') {
        internalRef.current.player.isGuarding = false;
      }
    };

    const updateKeyMove = () => {
      let x = 0;
      let z = 0;
      if (keys['w'] || keys['arrowup']) z -= 1;
      if (keys['s'] || keys['arrowdown']) z += 1;
      if (keys['a'] || keys['arrowleft']) x -= 1;
      if (keys['d'] || keys['arrowright']) x += 1;
      const len = Math.hypot(x, z);
      if (len > 0) {
        x /= len;
        z /= len;
      }
      internalRef.current.moveDir = { x, z };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKick, handlePunch]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        gameTitle="No.024 Ragdoll Hit 3D"
        score={score}
        scoreLabel="격투 점수"
        targetLabel="챔피언십"
        targetProgress={`${currentRound + 1} / 3 ROUND`}
        onGiveUp={handleGiveUp}
      />

      {/* Round & Health Bar Top Overlay */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Player HP */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <div className="w-24 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                playerHp > 50 ? 'bg-cyan-400' : playerHp > 25 ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${playerHp}%` }}
            />
          </div>
          <span className="text-xs font-bold text-cyan-200">{playerHp} HP</span>
        </div>

        {/* Round Badge */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 text-xs font-bold text-amber-400 flex items-center space-x-1 shadow-md">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{ROUNDS[currentRound].name}</span>
        </div>

        {/* Enemy HP */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/40 flex items-center space-x-2">
          <span className="text-xs font-bold text-rose-200">{enemyHp} HP</span>
          <div className="w-24 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-200"
              style={{ width: `${(enemyHp / ROUNDS[currentRound].enemyHp) * 100}%` }}
            />
          </div>
          <span className="text-xs font-black text-rose-400">VS</span>
        </div>
      </div>

      {/* Round Clear Pop Banner */}
      {roundTransition && (
        <div className="absolute top-28 left-0 right-0 pointer-events-none flex justify-center">
          <div className="bg-gradient-to-r from-amber-500 to-rose-600 text-white px-6 py-2 rounded-2xl text-base font-black shadow-2xl animate-bounce flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>K.O! 다음 라운드로 진출</span>
          </div>
        </div>
      )}

      {/* Dynamic Floating Touch Joystick Visual */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: joystickCenter.x, top: joystickCenter.y }}
        >
          <div className="w-24 h-24 rounded-full border-2 border-cyan-400/50 bg-cyan-950/30 backdrop-blur-sm relative flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-full bg-cyan-400/80 shadow-lg absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${joystickPos.x - joystickCenter.x}px)`,
                top: `calc(50% + ${joystickPos.y - joystickCenter.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Mobile Pure Touch Action Buttons (Right) */}
      <div className="absolute bottom-6 right-5 flex items-end space-x-3 pointer-events-auto">
        {/* Guard Button */}
        <button
          onPointerDown={() => {
            internalRef.current.player.isGuarding = true;
          }}
          onPointerUp={() => {
            internalRef.current.player.isGuarding = false;
          }}
          onPointerLeave={() => {
            internalRef.current.player.isGuarding = false;
          }}
          className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-600 text-cyan-300 flex flex-col items-center justify-center shadow-lg active:scale-95 active:bg-cyan-900/60 transition-all"
        >
          <Shield className="w-6 h-6" />
          <span className="text-[10px] font-extrabold mt-0.5">가드</span>
        </button>

        {/* Kick Button */}
        <button
          onClick={handleKick}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 border border-amber-400 text-white flex flex-col items-center justify-center shadow-xl active:scale-90 transition-transform"
        >
          <Zap className="w-6 h-6" />
          <span className="text-[10px] font-black mt-0.5">점프킥</span>
        </button>

        {/* Large 80px Punch Button */}
        <button
          onClick={handlePunch}
          className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 border-2 border-rose-300 shadow-2xl flex flex-col items-center justify-center active:scale-90 active:from-rose-700 active:to-amber-600 transition-all"
        >
          <span className="text-2xl font-black">💥</span>
          <span className="text-[11px] font-black text-white mt-0.5">스매시</span>
        </button>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="랙돌 히트 3D (Ragdoll Hit 3D)"
          category="3D 물리 랙돌 격투 액션 배틀"
          guideSteps={[
            {
              title: '360° 풋워크 이동 (Floating Joystick)',
              desc: '화면 좌측을 터치하고 드래그하여 상대를 향해 전진하거나 거리를 벌리는 풋워크를 구사하세요.',
              iconType: 'GESTURES',
            },
            {
              title: '스매시 펀치 & 플라잉 킥 (Hit & Knockback)',
              desc: '우측 80px [💥 스매시]로 연타 펀치를 날리고, [점프킥]으로 적을 링 로프까지 넉백시키세요! [가드]로 적의 강타를 방어할 수 있습니다.',
              iconType: 'GOAL',
            },
            {
              title: '3라운드 챔피언 제패 보상',
              desc: '3명의 강력한 랙돌 라이벌을 모두 K.O시키고 챔피언 트로피와 최대 50 SNS 포인트를 쟁취하세요!',
              iconType: 'REWARDS',
            },
          ]}
          onStart={() => setShowTutorial(false)}
        />
      )}

      {/* Victory / Defeat Reward Modal */}
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
