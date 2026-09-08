import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiCountControlGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;

  onClose?: () => void;
}

interface MathGate3D {
  z: number;
  leftText: string;
  leftOp: (n: number) => number;
  leftColor: number;
  rightText: string;
  rightOp: (n: number) => number;
  rightColor: number;
  passed: boolean;
  leftMesh: THREE.Mesh;
  rightMesh: THREE.Mesh;
}

export const PokiCountControlGame: React.FC<PokiCountControlGameProps> = ({
  onBack,
  onExit,
  cardId = 47,
  lowSpecMode = false,
  playSfx,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [squadCount, setSquadCount] = useState(10);
  const [castleHp, setCastleHp] = useState(150);
  const [distance, setDistance] = useState(0);
  const [score, setScore] = useState(0);
  const [inSiege, setInSiege] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // 모바일 터치 드래그 상태
  const touchStartRef = useRef<{ x: number; playerX: number } | null>(null);

  // 3D 씬 레퍼런스
  const gameLoopRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animId: 0,
    isGameOver: false,
    isGameWon: false,
    scoreVal: 0,
    squadCountVal: 10,
    targetSquadCount: 10,

    // 플레이어 지휘관 및 군단
    commander: {
      pos: new THREE.Vector3(0, 0.45, 0), // 시작 안전 안착
      targetX: 0,
      speed: 24.0,
      baseSpeed: 24.0,
      isRushing: false,
    },

    crowdMeshes: [] as THREE.Group[],
    crowdPool: [] as THREE.Group[],

    // 게이트 및 장애물
    gates: [] as MathGate3D[],
    sawBlades: [] as { mesh: THREE.Mesh; z: number; x: number; rotSpeed: number }[],

    // 결승 성채
    castle: {
      group: null as THREE.Group | null,
      z: -150,
      hp: 150,
      maxHp: 150,
      gateMesh: null as THREE.Mesh | null,
      breached: false,
    },

    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    trackWidth: 12.0,
    trackLength: 165.0,
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
      gameId: 'poki_count_control_legends',
      gameTitle: 'Count Control Legends 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: 30,
    });
    setRewardResult(result);
  }, []);

  // 단일 스틱맨 메쉬 생성 헬퍼
  const createStickman = (isCommander = false): THREE.Group => {
    const group = new THREE.Group();
    const color = isCommander ? 0xf59e0b : 0x3b82f6;

    // 머리
    const headGeo = new THREE.SphereGeometry(0.24, 10, 10);
    const headMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    head.castShadow = !lowSpecMode;
    group.add(head);

    // 몸통
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.75, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    body.castShadow = !lowSpecMode;
    group.add(body);

    // 팔 2개
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6);
    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.24, 0.95, 0);
    armL.rotation.z = Math.PI / 6;
    group.add(armL);

    const armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(0.24, 0.95, 0);
    armR.rotation.z = -Math.PI / 6;
    group.add(armR);

    // 다리 2개
    const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 6);
    const legL = new THREE.Mesh(legGeo, bodyMat);
    legL.position.set(-0.14, 0.3, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, bodyMat);
    legR.position.set(0.14, 0.3, 0);
    group.add(legR);

    return group;
  };

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc5e8eb);
    scene.fog = new THREE.FogExp2(0xc5e8eb, 0.016);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 200);
    camera.position.set(0, 8.5, 15);
    camera.lookAt(0, 1.5, -12);
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

    // 3. 조명 (웅장한 런웨이 조명 & 네온 게이트 광원)
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
    dirLight.position.set(15, 35, 20);
    dirLight.castShadow = !lowSpecMode;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      const d = 25;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
    }
    scene.add(dirLight);

    // 4. 석조 런웨이 트랙 (길이 170m x 폭 12m)
    const trackW = 12.0;
    const trackL = 165.0;
    gameLoopRef.current.trackWidth = trackW;
    gameLoopRef.current.trackLength = trackL;

    const trackGeo = new THREE.BoxGeometry(trackW, 0.6, trackL);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.2,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.position.set(0, -0.3, -trackL / 2 + 5);
    trackMesh.receiveShadow = !lowSpecMode;
    scene.add(trackMesh);

    // 사이드 네온 가이드 레일 (좌/우)
    const railGeo = new THREE.BoxGeometry(0.35, 0.8, trackL);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, roughness: 0.3 });

    const railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-trackW / 2, 0.4, -trackL / 2 + 5);
    scene.add(railL);

    const railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(trackW / 2, 0.4, -trackL / 2 + 5);
    scene.add(railR);

    // 5. 4쌍의 3D 수학 연산 게이트 생성
    const gateDefs = [
      {
        z: -35,
        leftText: '+20',
        leftOp: (n: number) => n + 20,
        leftColor: 0x3b82f6,
        rightText: 'x2',
        rightOp: (n: number) => n * 2,
        rightColor: 0xf59e0b,
      },
      {
        z: -65,
        leftText: 'x3',
        leftOp: (n: number) => n * 3,
        leftColor: 0xf59e0b,
        rightText: '-15',
        rightOp: (n: number) => Math.max(1, n - 15),
        rightColor: 0xef4444,
      },
      {
        z: -95,
        leftText: '+50',
        leftOp: (n: number) => n + 50,
        leftColor: 0x10b981,
        rightText: 'x2',
        rightOp: (n: number) => n * 2,
        rightColor: 0xf59e0b,
      },
      {
        z: -125,
        leftText: 'x2',
        leftOp: (n: number) => n * 2,
        leftColor: 0xf59e0b,
        rightText: '+30',
        rightOp: (n: number) => n + 30,
        rightColor: 0x3b82f6,
      },
    ];

    const gates: MathGate3D[] = [];
    const gateW = trackW / 2 - 0.3;
    const gateH = 4.2;

    gateDefs.forEach((def) => {
      // 좌측 게이트
      const lGeo = new THREE.BoxGeometry(gateW, gateH, 0.4);
      const lMat = new THREE.MeshStandardMaterial({
        color: def.leftColor,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8,
      });
      const lMesh = new THREE.Mesh(lGeo, lMat);
      lMesh.position.set(-trackW / 4, gateH / 2, def.z);
      scene.add(lMesh);

      // 우측 게이트
      const rGeo = new THREE.BoxGeometry(gateW, gateH, 0.4);
      const rMat = new THREE.MeshStandardMaterial({
        color: def.rightColor,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8,
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.set(trackW / 4, gateH / 2, def.z);
      scene.add(rMesh);

      gates.push({
        ...def,
        passed: false,
        leftMesh: lMesh,
        rightMesh: rMesh,
      });
    });
    gameLoopRef.current.gates = gates;

    // 6. 회전 톱니 날 트랩 3개
    const sawLocations = [
      { z: -50, x: -2.5, rotSpeed: 6.0 },
      { z: -80, x: 2.8, rotSpeed: -6.5 },
      { z: -110, x: 0.0, rotSpeed: 7.0 },
    ];

    const sawMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.9, roughness: 0.2 });
    sawLocations.forEach((loc) => {
      const sGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.25, 16);
      const sMesh = new THREE.Mesh(sGeo, sawMat);
      sMesh.rotation.x = Math.PI / 2;
      sMesh.position.set(loc.x, 1.0, loc.z);
      scene.add(sMesh);

      gameLoopRef.current.sawBlades.push({
        mesh: sMesh,
        z: loc.z,
        x: loc.x,
        rotSpeed: loc.rotSpeed,
      });
    });

    // 7. 결승 성채 요새 (Enemy Fortress, HP 150)
    const castleGroup = new THREE.Group();

    // 성벽
    const wallGeo = new THREE.BoxGeometry(trackW, 6.0, 3.0);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.3 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 3.0;
    castleGroup.add(wall);

    // 거대 목재 성문
    const gateGeo = new THREE.BoxGeometry(4.5, 4.5, 1.2);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.6 });
    const gateMesh = new THREE.Mesh(gateGeo, gateMat);
    gateMesh.position.set(0, 2.25, 1.2);
    castleGroup.add(gateMesh);

    // 성채 HP 엠블럼 바
    const hpBarGeo = new THREE.BoxGeometry(6.0, 0.5, 0.2);
    const hpBarMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const hpBar = new THREE.Mesh(hpBarGeo, hpBarMat);
    hpBar.position.set(0, 6.6, 1.6);
    castleGroup.add(hpBar);

    castleGroup.position.set(0, 0, -150);
    scene.add(castleGroup);
    gameLoopRef.current.castle.group = castleGroup;
    gameLoopRef.current.castle.gateMesh = gateMesh;

    // 8. 초기 군단 스틱맨 풀링 (최대 180명)
    for (let i = 0; i < 180; i++) {
      const sm = createStickman(i === 0);
      sm.visible = i < 10;
      scene.add(sm);
      gameLoopRef.current.crowdPool.push(sm);
    }

    // 9. 리사이즈 핸들러
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

    // 10. 메인 루프
    let lastTime = performance.now();

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const gl = gameLoopRef.current;
      const cmd = gl.commander;
      const cst = gl.castle;

      if (!gl.isGameOver && !gl.isGameWon) {
        // --- 톱니 날 회전 ---
        gl.sawBlades.forEach((saw) => {
          saw.mesh.rotation.z += saw.rotSpeed * dt;
        });

        // --- 지휘관 전진 및 스티어링 ---
        if (!cst.breached && cmd.pos.z > cst.z + 4.5) {
          const rushSpeed = cmd.isRushing ? cmd.baseSpeed * 1.65 : cmd.baseSpeed;
          cmd.pos.z -= rushSpeed * dt;

          // 목표 X 부드러운 보간
          cmd.pos.x += (cmd.targetX - cmd.pos.x) * 12.0 * dt;

          // 트랙 경계 클램핑
          const halfW = gl.trackWidth / 2 - 1.5;
          cmd.pos.x = Math.max(-halfW, Math.min(halfW, cmd.pos.x));

          setDistance(Math.floor(-cmd.pos.z));
          gl.scoreVal = Math.floor(-cmd.pos.z * 2 + gl.squadCountVal * 5);
          setScore(gl.scoreVal);

          // --- 톱니 날 충돌 체크 ---
          gl.sawBlades.forEach((saw) => {
            const dZ = Math.abs(cmd.pos.z - saw.z);
            const dX = Math.abs(cmd.pos.x - saw.x);
            if (dZ < 2.0 && dX < 2.2) {
              // 병력 감소
              gl.targetSquadCount = Math.max(1, gl.targetSquadCount - 8);
              triggerHaptic([35, 45]);
              if (playSfx) playSfx('hit');
            }
          });

          // --- 수학 게이트 통과 판정 ---
          gl.gates.forEach((gate) => {
            if (!gate.passed && cmd.pos.z <= gate.z + 1.0 && cmd.pos.z >= gate.z - 2.5) {
              gate.passed = true;
              let newCount = gl.squadCountVal;

              // 좌/우 선택 판정
              if (cmd.pos.x < 0) {
                newCount = Math.min(180, Math.max(1, Math.floor(gate.leftOp(newCount))));
                triggerHaptic([40, 60, 90]);
              } else {
                newCount = Math.min(180, Math.max(1, Math.floor(gate.rightOp(newCount))));
                triggerHaptic([40, 60, 90]);
              }

              gl.targetSquadCount = newCount;
              if (playSfx) playSfx('powerup');
            }
          });
        } else {
          // --- 결승 성채 공성전 (Castle Siege) ---
          setInSiege(true);

          if (!cst.breached) {
            // 군단이 성채 문을 맹타격
            const dHp = Math.min(cst.hp, Math.ceil(gl.squadCountVal * 1.5 * dt));
            cst.hp -= dHp;
            setCastleHp(Math.max(0, cst.hp));

            triggerHaptic(20);

            if (cst.hp <= 0) {
              cst.breached = true;
              if (cst.gateMesh) scene.remove(cst.gateMesh);

              gl.isGameWon = true;
              setGameWon(true);
              triggerHaptic([50, 100, 150, 250]);
              handleClaimReward(true, gl.scoreVal + 500);
              return;
            }
          }
        }

        // --- 병력 수치 부드러운 증감 보간 ---
        if (gl.squadCountVal !== gl.targetSquadCount) {
          const diff = gl.targetSquadCount - gl.squadCountVal;
          gl.squadCountVal += Math.sign(diff) * Math.min(Math.abs(diff), 4);
          setSquadCount(gl.squadCountVal);
        }

        // --- 피보나치 나선형 군단 클러스터링 배치 ---
        const count = gl.squadCountVal;
        const goldenAngle = 2.39996; // 137.5도 (라디안)

        for (let i = 0; i < gl.crowdPool.length; i++) {
          const sm = gl.crowdPool[i];

          if (i < count) {
            sm.visible = true;

            if (i === 0) {
              // 지휘관
              sm.position.set(cmd.pos.x, 0, cmd.pos.z);
            } else {
              // 군단 병사들 (피보나치 나선 분산)
              const r = 0.55 * Math.sqrt(i);
              const theta = i * goldenAngle;
              const ox = Math.cos(theta) * r;
              const oz = Math.sin(theta) * r;

              sm.position.set(cmd.pos.x + ox, 0, cmd.pos.z + oz);
            }

            // 달리기 다리/팔 흔들림 애니메이션
            const legSwing = Math.sin(now * 0.015 + i) * 0.45;
            sm.children[3].rotation.x = legSwing; // legL
            sm.children[4].rotation.x = -legSwing; // legR
          } else {
            sm.visible = false;
          }
        }

        // --- 카메라 추종 (3인칭 쿼터뷰 후방) ---
        if (gl.camera) {
          const camTargetX = cmd.pos.x * 0.4;
          const camTargetZ = cmd.pos.z + 15.0;
          gl.camera.position.x += (camTargetX - gl.camera.position.x) * 0.1;
          gl.camera.position.z += (camTargetZ - gl.camera.position.z) * 0.12;
          gl.camera.lookAt(cmd.pos.x * 0.3, 1.5, cmd.pos.z - 10.0);
        }
      }

      if (gl.renderer && gl.scene && gl.camera) {
        gl.renderer.render(gl.scene, gl.camera);
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

  // 돌격 러시 액션
  const handleRushStart = useCallback(() => {
    gameLoopRef.current.commander.isRushing = true;
    triggerHaptic([30, 40]);
  }, [triggerHaptic]);

  const handleRushEnd = useCallback(() => {
    gameLoopRef.current.commander.isRushing = false;
  }, []);

  // 레인 조향 버튼 백업
  const handleSteerLane = useCallback((dir: number) => {
    const cmd = gameLoopRef.current.commander;
    const halfW = gameLoopRef.current.trackWidth / 2 - 1.5;
    cmd.targetX = Math.max(-halfW, Math.min(halfW, cmd.targetX + dir * 2.5));
    triggerHaptic(15);
  }, [triggerHaptic]);

  // 모바일 가로 드래그 스티어링
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      playerX: gameLoopRef.current.commander.targetX,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = (touch.clientX - touchStartRef.current.x) * 0.035;

    const halfW = gameLoopRef.current.trackWidth / 2 - 1.5;
    gameLoopRef.current.commander.targetX = Math.max(
      -halfW,
      Math.min(halfW, touchStartRef.current.playerX + dx)
    );
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#c5e8eb] font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 3D 캔버스 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 HUD */}
      <MinimalistMissionHUD
        gameTitle="Count Control Legends 3D"
        score={score}
        targetScore={100}
        onBack={handleExit} onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 상단 미션 대시보드 */}
      <div className="absolute top-16 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3">
          {/* 군단 병력 수 */}
          <div className="bg-slate-900/90 border border-blue-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-blue-400 font-bold block">SQUAD COUNT</span>
            <span className="text-base text-yellow-300 font-black">{squadCount} 👥</span>
          </div>

          {/* 성채 HP 바 (공성전 또는 결승 접근 시) */}
          <div className="bg-slate-900/90 border border-red-500/50 px-3 py-1.5 rounded-sm backdrop-blur-sm min-w-[120px]">
            <div className="flex justify-between text-[10px] text-red-400 font-bold mb-0.5">
              <span>CASTLE</span>
              <span>{castleHp} / 150</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-100"
                style={{ width: `${(castleHp / 150) * 100}%` }}
              />
            </div>
          </div>

          {/* 전진 거리 */}
          <div className="bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-sm backdrop-blur-sm">
            <span className="text-[10px] text-slate-400 font-bold block">DISTANCE</span>
            <span className="text-sm text-slate-200 font-black">{distance}m / 150m</span>
          </div>
        </div>

        {/* 영웅 배지 */}
        <div className="w-12 h-14 bg-slate-900/90 border border-amber-500/40 rounded-sm overflow-hidden flex flex-col items-center justify-center p-0.5">
          <canvas ref={heroCanvasRef} width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-[9px] text-amber-300 font-black leading-none mt-0.5">No.{cardId}</span>
        </div>
      </div>

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

      {/* 우측 하단 돌격 가속 버튼 */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
        <button
          onTouchStart={handleRushStart}
          onTouchEnd={handleRushEnd}
          onMouseDown={handleRushStart}
          onMouseUp={handleRushEnd}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 active:from-amber-400 active:to-yellow-300 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-yellow-300/80 shadow-2xl active:scale-95 transition-transform"
        >
          <span className="text-2xl">⚡</span>
          <span>RUSH</span>
        </button>
      </div>

      {/* 하단 중앙 가이드 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-slate-400 pointer-events-none z-10 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/50">
        <span>↔️ 화면 좌우 드래그로 군단 조향</span>
      </div>

      {/* 중도 포기 확인 모달 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">원정을 중단할까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              현재까지 증폭한 군단 병력과 전진 거리에 비례한 SNS 포인트가 정산됩니다.
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
                      gameId: 'poki_count_control_legends',
                      gameTitle: 'Count Control Legends 3D',
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
                포기하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="Count Control Legends 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '군단 증폭 & 적군 성채 함락',
              desc: '170m 런웨이를 달리며 수학 게이트를 통해 군단을 불리고 결승 성채(HP 150)를 함락시키세요!',
            },
            {
              iconType: 'GESTURES',
              title: '좌우 스티어링 & 돌격 러시',
              desc: '화면 좌우 드래그로 최적의 연산 문을 통과하고, [RUSH]로 빠르게 질주해 톱니를 피하세요.',
            },
            {
              iconType: 'REWARDS',
              title: '성채 함락 SNS 보상',
              desc: '성채를 함락시키고 승리 시 최대 50 SNS 포인트를 영구 획득합니다.',
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
