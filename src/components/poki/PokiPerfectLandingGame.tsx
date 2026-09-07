import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPerfectLandingGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

const TARGET_LANDINGS = 3;

interface WindTurbine {
  mesh: THREE.Group;
  blades: THREE.Group;
  x: number;
  z: number;
}

export default function PokiPerfectLandingGame({
  onBack,
  onClose,
  cardId = 99,
}: PokiPerfectLandingGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleExit = onBack || onClose || (() => {});

  // Flight & Landing States
  const [landings, setLandings] = useState<number>(0);
  const [altitude, setAltitude] = useState<number>(120);
  const [speedKnots, setSpeedKnots] = useState<number>(140);
  const [flightStatus, setFlightStatus] = useState<string | null>(null);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // Joystick States
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });

  // Input & Physics Refs
  const inputRef = useRef({
    pitch: 0, // Elevators: -1 (dive) to 1 (climb)
    roll: 0,  // Ailerons: -1 (left bank) to 1 (right bank)
    isThrottle: false,
    isFlaps: false,
    airspeed: 24, // m/s (~135 knots)
  });
  const startTimeRef = useRef<number>(Date.now());
  const matchActiveRef = useRef<boolean>(true);

  // Three.js Scene References
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    planeGroup: THREE.Group;
    turbines: WindTurbine[];
    particlesGroup: THREE.Group;
    pos: THREE.Vector3;
    rot: THREE.Euler;
    landingsRef: number;
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

  // Sparkles / Landing Celebration Particles
  const spawnCelebration = useCallback((pos: THREE.Vector3, colorHex: number) => {
    if (!threeRef.current) return;
    const { particlesGroup } = threeRef.current;
    const count = 30;
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
      life += 0.05;
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + velocities[i].x * 0.02,
          posAttr.getY(i) + velocities[i].y * 0.02 - 0.03,
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

  // Victory Handler
  const handleVictory = useCallback(() => {
    if (gameWon) return;
    setGameWon(true);
    matchActiveRef.current = false;
    triggerHaptic(80);

    const durationSeconds = Math.max(15, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'pokiperfectlanding',
      gameTitle: 'Perfect Landing 3D',
      isVictory: true,
      score: 500,
      maxTargetScore: 500,
      durationSeconds,
    });
    setRewardReceipt(receipt);
  }, [gameWon]);

  // Airplane 3D Mesh Builder
  const createAirplaneMesh = (badgeTexture: THREE.CanvasTexture | null): THREE.Group => {
    const group = new THREE.Group();

    // Fuselage (White Cylinder)
    const fuselageGeom = new THREE.CylinderGeometry(0.5, 0.45, 5.2, 16);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.2 });
    const fuselage = new THREE.Mesh(fuselageGeom, planeMat);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.castShadow = true;
    group.add(fuselage);

    // Nose Cone
    const noseGeom = new THREE.ConeGeometry(0.5, 1.0, 16);
    const nose = new THREE.Mesh(noseGeom, planeMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -3.1;
    group.add(nose);

    // Cockpit Windows (Dark Blue Glass)
    const cockpitGeom = new THREE.SphereGeometry(0.48, 12, 12, 0, Math.PI * 2, 0, Math.PI / 3);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05, metalness: 0.9 });
    const cockpit = new THREE.Mesh(cockpitGeom, glassMat);
    cockpit.rotation.x = -Math.PI / 4;
    cockpit.position.set(0, 0.35, -2.2);
    group.add(cockpit);

    // Main Wings (Wide swept-back wings)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(-3.5, 0);
    wingShape.lineTo(-1.2, 1.2);
    wingShape.lineTo(1.2, 1.2);
    wingShape.lineTo(3.5, 0);
    wingShape.lineTo(1.2, -0.6);
    wingShape.lineTo(-1.2, -0.6);
    wingShape.closePath();
    const wingGeom = new THREE.ExtrudeGeometry(wingShape, { depth: 0.08, bevelEnabled: false });
    const wing = new THREE.Mesh(wingGeom, planeMat);
    wing.rotation.x = Math.PI / 2;
    wing.position.set(0, 0, 0.2);
    group.add(wing);

    // Dual Jet Engines Under Wings
    const engineGeom = new THREE.CylinderGeometry(0.24, 0.24, 1.2, 12);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 });
    const engLeft = new THREE.Mesh(engineGeom, engineMat);
    engLeft.rotation.x = Math.PI / 2;
    engLeft.position.set(-1.6, -0.3, 0.1);
    const engRight = new THREE.Mesh(engineGeom, engineMat);
    engRight.rotation.x = Math.PI / 2;
    engRight.position.set(1.6, -0.3, 0.1);
    group.add(engLeft, engRight);

    // Vertical Stabilizer (Tail fin)
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.8, 1.2);
    finShape.lineTo(1.2, 1.2);
    finShape.lineTo(1.2, 0);
    finShape.closePath();
    const finGeom = new THREE.ExtrudeGeometry(finShape, { depth: 0.06, bevelEnabled: false });
    const finMat = new THREE.MeshStandardMaterial({ color: 0x0369a1 });
    const fin = new THREE.Mesh(finGeom, finMat);
    fin.rotation.y = -Math.PI / 2;
    fin.position.set(0.03, 0.45, 2.0);
    group.add(fin);

    // Hero Badge on Wings
    if (badgeTexture) {
      const badgeGeom = new THREE.PlaneGeometry(0.7, 0.7);
      const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true });
      const badgeMesh = new THREE.Mesh(badgeGeom, badgeMat);
      badgeMesh.rotation.x = -Math.PI / 2;
      badgeMesh.position.set(-1.8, 0.08, 0.2);
      group.add(badgeMesh);
    }

    return group;
  };

  // Reset Flight Approach
  const resetApproach = useCallback((success: boolean) => {
    if (!threeRef.current) return;
    const { pos, rot } = threeRef.current;

    pos.set(0, 28, -180);
    rot.set(0, 0, 0);
    inputRef.current.airspeed = 24;
    inputRef.current.pitch = 0;
    inputRef.current.roll = 0;

    if (success) {
      setFlightStatus('✨ PERFECT LANDING! +100');
    } else {
      setFlightStatus('⚠️ GO-AROUND! 접근 재시도');
    }
    setTimeout(() => {
      setFlightStatus(null);
      matchActiveRef.current = true;
    }, 2000);
  }, []);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8); // Sky blue
    scene.fog = new THREE.Fog(0x38bdf8, 80, 240);

    // 2. Camera (Chase View)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    camera.position.set(0, 32, -165);
    camera.lookAt(0, 28, -180);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(20, 60, -50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 5. Ocean Water (Y = 0)
    const oceanGeom = new THREE.PlaneGeometry(400, 400);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.3,
    });
    const ocean = new THREE.Mesh(oceanGeom, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, 0, 0);
    scene.add(ocean);

    // 6. Island & 70m Runway (Z = -60 to 0)
    const islandGeom = new THREE.BoxGeometry(26, 1.0, 90);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });
    const island = new THREE.Mesh(islandGeom, islandMat);
    island.position.set(0, 0.5, -25);
    scene.add(island);

    // Asphalt Runway Mesh
    const runwayGeom = new THREE.PlaneGeometry(8.0, 75);
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const runway = new THREE.Mesh(runwayGeom, runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 1.02, -25);
    scene.add(runway);

    // Runway Centerline & Touchdown Markings
    const lineGeom = new THREE.PlaneGeometry(0.3, 4.0);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    for (let z = -55; z < 5; z += 8) {
      const line = new THREE.Mesh(lineGeom, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 1.03, z);
      scene.add(line);
    }

    // Touchdown Zone Marker
    const tdGeom = new THREE.PlaneGeometry(5.0, 2.0);
    const tdMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const tdMarker = new THREE.Mesh(tdGeom, tdMat);
    tdMarker.rotation.x = -Math.PI / 2;
    tdMarker.position.set(0, 1.03, -42);
    scene.add(tdMarker);

    // 7. Airport Control Tower with Hero Badge
    const heroBadgeCanvas = document.createElement('canvas');
    heroBadgeCanvas.width = 128;
    heroBadgeCanvas.height = 128;
    const badgeCtx = heroBadgeCanvas.getContext('2d')!;
    drawCardSprite(badgeCtx, cardId, 0, 0, 128, 128, { circleClip: true });
    const heroBadgeTexture = new THREE.CanvasTexture(heroBadgeCanvas);

    const towerGroup = new THREE.Group();
    const towerPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.6, 12, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    towerPillar.position.y = 6;
    towerGroup.add(towerPillar);

    const towerCabin = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 1.8, 3.0, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    towerCabin.position.y = 13;
    towerGroup.add(towerCabin);

    const badgePlaneGeom = new THREE.PlaneGeometry(2.2, 2.2);
    const badgePlaneMat = new THREE.MeshBasicMaterial({ map: heroBadgeTexture, transparent: true });
    const badgePlane = new THREE.Mesh(badgePlaneGeom, badgePlaneMat);
    badgePlane.position.set(0, 13, -2.42);
    towerGroup.add(badgePlane);

    towerGroup.position.set(8.5, 1.0, 8.0);
    scene.add(towerGroup);

    // 8. Sea Wind Turbines (Obstacles)
    const turbines: WindTurbine[] = [];
    const turbinePositions = [
      [-14, -130],
      [16, -100],
      [-15, -70],
    ];

    turbinePositions.forEach(([tx, tz]) => {
      const tGroup = new THREE.Group();
      // Tower
      const tPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.8, 25, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
      );
      tPillar.position.y = 12.5;
      tGroup.add(tPillar);

      // Blades
      const bladesGroup = new THREE.Group();
      bladesGroup.position.set(0, 25, 0.4);
      for (let b = 0; b < 3; b++) {
        const bladeGeom = new THREE.BoxGeometry(0.3, 7.5, 0.08);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
        const blade = new THREE.Mesh(bladeGeom, bladeMat);
        blade.position.y = 3.75;
        const bHolder = new THREE.Group();
        bHolder.rotation.z = (b * Math.PI * 2) / 3;
        bHolder.add(blade);
        bladesGroup.add(bHolder);
      }
      tGroup.add(bladesGroup);
      tGroup.position.set(tx, 0, tz);
      scene.add(tGroup);

      turbines.push({
        mesh: tGroup,
        blades: bladesGroup,
        x: tx,
        z: tz,
      });
    });

    // 9. Airplane Entity
    const planeGroup = createAirplaneMesh(heroBadgeTexture);
    scene.add(planeGroup);

    // 10. Particles Group
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    const initialPos = new THREE.Vector3(0, 28, -180);
    planeGroup.position.copy(initialPos);

    threeRef.current = {
      scene,
      camera,
      renderer,
      planeGroup,
      turbines,
      particlesGroup,
      pos: initialPos,
      rot: new THREE.Euler(0, 0, 0),
      landingsRef: 0,
    };

    // 11. Flight Physics Loop
    let animFrameId: number;
    const clock = new THREE.Clock();

    const gameLoop = () => {
      animFrameId = requestAnimationFrame(gameLoop);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (threeRef.current && matchActiveRef.current) {
        const input = inputRef.current;
        const { pos, rot, planeGroup, camera, turbines } = threeRef.current;

        // Rotate Wind Turbines
        turbines.forEach((t) => {
          t.blades.rotation.z += delta * 1.8;
        });

        // Airspeed & Throttle
        if (input.isThrottle) {
          input.airspeed = Math.min(36, input.airspeed + 12 * delta);
        } else if (input.isFlaps) {
          input.airspeed = Math.max(16, input.airspeed - 16 * delta);
        } else {
          input.airspeed = THREE.MathUtils.lerp(input.airspeed, 24, 0.03);
        }

        setSpeedKnots(Math.floor(input.airspeed * 5.6));

        // Pitch & Roll Attitude
        rot.x = THREE.MathUtils.lerp(rot.x, input.pitch * 0.45, 0.1);
        rot.z = THREE.MathUtils.lerp(rot.z, -input.roll * 0.65, 0.1);
        rot.y = THREE.MathUtils.lerp(rot.y, input.roll * 0.25, 0.08);

        planeGroup.rotation.copy(rot);

        // Forward and Vertical Movement
        const vy = -rot.x * input.airspeed * 1.2 - (input.isFlaps ? 2.5 : 1.2);
        const vx = input.roll * input.airspeed * 0.8;
        const vz = input.airspeed; // Moving forward along +Z towards runway (Z=0)

        pos.x += vx * delta;
        pos.y += vy * delta;
        pos.z += vz * delta;

        pos.x = THREE.MathUtils.clamp(pos.x, -22, 22);
        pos.y = Math.max(1.02, pos.y);
        planeGroup.position.copy(pos);

        setAltitude(Math.floor(pos.y * 3.28)); // Feet/meters

        // Landing & Touchdown Check
        // Runway Zone: Z in [-50, -10], X in [-4, 4], Y near 1.05
        if (pos.z >= -48 && pos.z <= -15 && pos.y <= 1.5) {
          matchActiveRef.current = false;

          const isSafeDescent = Math.abs(vy) < 4.5;
          const isCentered = Math.abs(pos.x) < 3.8;
          const isLevel = Math.abs(rot.z) < 0.35;

          if (isSafeDescent && isCentered && isLevel) {
            // Touchdown SUCCESS!
            triggerHaptic(70);
            threeRef.current.landingsRef += 1;
            const newLandings = threeRef.current.landingsRef;
            setLandings(newLandings);
            spawnCelebration(pos, 0xfacc15);

            if (newLandings >= TARGET_LANDINGS) {
              handleVictory();
            } else {
              resetApproach(true);
            }
          } else {
            // Hard Landing / Missed Approach
            triggerHaptic(50);
            resetApproach(false);
          }
        }

        // Passed Runway without landing -> Go around
        if (pos.z > -10 && pos.y > 1.5) {
          matchActiveRef.current = false;
          triggerHaptic(30);
          resetApproach(false);
        }

        // Camera Smooth Chase
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, pos.x * 0.6, 0.1);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, pos.y + 3.8, 0.1);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, pos.z - 14, 0.1);
        camera.lookAt(pos.x, pos.y + 0.5, pos.z + 10);

        threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
      }
    };
    gameLoop();

    // Resize Observer
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
      heroBadgeTexture.dispose();
    };
  }, [cardId, handleVictory, resetApproach, spawnCelebration]);

  // Touch & Flight Yoke Joystick (Mobile Pure Touch)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameWon) return;
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth * 0.65) {
      setJoystickActive(true);
      setJoystickCenter({ x: touch.clientX, y: touch.clientY });
      setJoystickKnob({ x: touch.clientX, y: touch.clientY });
      inputRef.current.roll = 0;
      inputRef.current.pitch = 0;
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
      inputRef.current.roll = dx / maxRadius;
      inputRef.current.pitch = dy / maxRadius; // Pull down to climb (+Y), push up to dive (-Y)
    } else {
      const angle = Math.atan2(dy, dx);
      setJoystickKnob({
        x: joystickCenter.x + Math.cos(angle) * maxRadius,
        y: joystickCenter.y + Math.sin(angle) * maxRadius,
      });
      inputRef.current.roll = Math.cos(angle);
      inputRef.current.pitch = Math.sin(angle);
    }
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    inputRef.current.roll = 0;
    inputRef.current.pitch = 0;
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0369a1] font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Three.js Canvas mounts here */}

      {/* Top Minimalist HUD */}
      <MinimalistMissionHUD
        gameTitle="PERFECT LANDING 3D"
        progress={Math.min(100, (landings / TARGET_LANDINGS) * 100)}
        score={landings * 150}
        maxScore={500}
        onQuit={handleExit}
      />

      {/* Flight Telemetry Status Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-5 py-2 rounded-2xl bg-slate-950/90 border border-sky-500/40 shadow-2xl backdrop-blur-md flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-amber-300">
            <span>🛬 LANDINGS:</span>
            <span>{landings}/{TARGET_LANDINGS}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-xs sm:text-sm font-bold text-sky-400">
            ALT: {altitude}m
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-xs sm:text-sm font-bold text-emerald-400">
            SPD: {speedKnots}kt
          </div>
        </div>
        <p className="mt-1 text-[10px] text-slate-200 font-bold tracking-tight drop-shadow">
          요크를 당겨 착륙 각도를 조절하고 활주로 중심선에 터치다운하세요!
        </p>
      </div>

      {/* Flight Status Banner Alert */}
      {flightStatus && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm sm:text-base tracking-wider shadow-xl border-2 border-white">
            {flightStatus}
          </div>
        </div>
      )}

      {/* Floating Yoke Joystick Visual Feedback */}
      {joystickActive && (
        <div
          className="fixed pointer-events-none z-30 -translate-x-1/2 -translate-y-1/2"
          style={{ left: joystickCenter.x, top: joystickCenter.y }}
        >
          <div className="w-[100px] h-[100px] rounded-full border-2 border-sky-400/60 bg-sky-950/40 backdrop-blur-xs flex items-center justify-center shadow-lg" />
          <div
            className="absolute w-12 h-12 rounded-full bg-sky-400/90 border border-white/80 shadow-md -translate-x-1/2 -translate-y-1/2"
            style={{
              left: joystickKnob.x - joystickCenter.x + 50,
              top: joystickKnob.y - joystickCenter.y + 50,
            }}
          />
        </div>
      )}

      {/* Flight Pedal & Flap Controls */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none flex items-center gap-3">
        {/* Throttle Boost Button */}
        <button
          type="button"
          onPointerDown={() => {
            triggerHaptic(20);
            inputRef.current.isThrottle = true;
          }}
          onPointerUp={() => { inputRef.current.isThrottle = false; }}
          onPointerLeave={() => { inputRef.current.isThrottle = false; }}
          className="pointer-events-auto w-16 h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center backdrop-blur-md cursor-pointer"
        >
          <span className="text-xl">🚀</span>
          <span className="text-[9px]">THRUST</span>
        </button>

        {/* 76px Big Flaps / Touchdown Brake Button */}
        <button
          type="button"
          onPointerDown={() => {
            triggerHaptic(30);
            inputRef.current.isFlaps = true;
          }}
          onPointerUp={() => { inputRef.current.isFlaps = false; }}
          onPointerLeave={() => { inputRef.current.isFlaps = false; }}
          className="pointer-events-auto h-[76px] px-8 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-base uppercase tracking-wider shadow-2xl shadow-sky-600/40 active:scale-95 transition-all flex items-center gap-3 border border-sky-300/60 cursor-pointer"
        >
          <span className="text-2xl">🛬</span>
          <span>FLAPS / LAND</span>
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
