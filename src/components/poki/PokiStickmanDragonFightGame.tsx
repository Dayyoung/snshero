import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiStickmanDragonFightGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

interface KiBlast {
  mesh: THREE.Mesh;
  vx: number;
  vz: number;
  isPlayer: boolean;
  damage: number;
  life: number;
}

export default function PokiStickmanDragonFightGame({
  onBack,
  onClose,
  cardId = 77,
}: PokiStickmanDragonFightGameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover' | 'victory'>('ready');
  const [round, setRound] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerKi, setPlayerKi] = useState(50);
  const [enemyHp, setEnemyHp] = useState(100);
  const [enemyMaxHp, setEnemyMaxHp] = useState(100);
  const [enemyName, setEnemyName] = useState('Shadow Warrior');
  const [comboCount, setComboCount] = useState(0);
  const [teleportCooldown, setTeleportCooldown] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 3D 및 조작 Ref
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 플레이어
    playerGroup: null as THREE.Group | null,
    playerPos: new THREE.Vector3(0, 1.2, 5),
    playerVelocity: new THREE.Vector3(),
    playerRotY: 0,
    playerHp: 100,
    playerMaxHp: 100,
    playerKi: 50,
    isChargingKi: false,
    isAttacking: false,
    attackTime: 0,
    combo: 0,
    teleportCd: 0,
    dragonBeamActive: false,
    dragonBeamTime: 0,
    playerAuraMesh: null as THREE.Mesh | null,
    playerBeamMesh: null as THREE.Group | null,

    // 적
    enemyGroup: null as THREE.Group | null,
    enemyPos: new THREE.Vector3(0, 1.2, -5),
    enemyVelocity: new THREE.Vector3(),
    enemyRotY: Math.PI,
    enemyHp: 100,
    enemyMaxHp: 100,
    enemyAiTimer: 0,
    enemyAttackTime: 0,
    enemyAuraMesh: null as THREE.Mesh | null,

    // 기 탄환 및 파티클
    kiBlasts: [] as KiBlast[],
    particles: [] as Particle[],
    particleGeo: new THREE.SphereGeometry(0.08, 6, 6),
    sparkMat: new THREE.MeshBasicMaterial({ color: 0xffea00 }),
    darkMat: new THREE.MeshBasicMaterial({ color: 0xa855f7 }),

    // 조이스틱
    joystickActive: false,
    touchStart: { x: 0, y: 0 },
    touchCurrent: { x: 0, y: 0 },
    moveDir: { x: 0, z: 0 },

    // 라운드 및 보상
    round: 1,
    maxRounds: 3,
    damageDealt: 0,
    damageTaken: 0,
  });

  // 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // 화면 좌측 절반만 조이스틱 인식
    if (touch.clientX < rect.width * 0.55) {
      stateRef.current.joystickActive = true;
      stateRef.current.touchStart = { x: touch.clientX, y: touch.clientY };
      stateRef.current.touchCurrent = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!stateRef.current.joystickActive) return;
    const touch = e.touches[0];
    stateRef.current.touchCurrent = { x: touch.clientX, y: touch.clientY };
    const dx = touch.clientX - stateRef.current.touchStart.x;
    const dy = touch.clientY - stateRef.current.touchStart.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 50;
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const norm = dist > 5 ? clampedDist / maxRadius : 0;
    // Three.js 카메라 기준 좌우/상하 (Screen-relative)
    stateRef.current.moveDir = {
      x: Math.cos(angle) * norm,
      z: Math.sin(angle) * norm,
    };
  };

  const handleTouchEnd = () => {
    stateRef.current.joystickActive = false;
    stateRef.current.moveDir = { x: 0, z: 0 };
  };

  // 키 아우라/충격파 파티클 생성
  const spawnParticles = (pos: THREE.Vector3, colorHex: number, count: number, speed: number = 2) => {
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
        vy: (Math.random() - 0.2) * speed * 1.5,
        vz: (Math.random() - 0.5) * speed,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
      });
    }
  };

  // 공격 (무투 콤보)
  const triggerAttack = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    if (s.isAttacking || s.dragonBeamActive) return;

    s.isAttacking = true;
    s.attackTime = 0.25;
    s.combo = (s.combo % 4) + 1;
    setComboCount(s.combo);

    if (navigator.vibrate) navigator.vibrate(25);

    // 타격 거리 체크 (플레이어와 적 사이)
    const dist = s.playerPos.distanceTo(s.enemyPos);
    if (dist < 3.2) {
      const damage = 12 + s.combo * 4;
      s.enemyHp = Math.max(0, s.enemyHp - damage);
      s.damageDealt += damage;
      setEnemyHp(s.enemyHp);

      // 적 넉백 & 스파크
      const knockback = s.enemyPos.clone().sub(s.playerPos).normalize().multiplyScalar(0.8);
      knockback.y = 0.2;
      s.enemyVelocity.add(knockback);

      spawnParticles(s.enemyPos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xffe600, 10, 4);

      // 적 격퇴 확인
      if (s.enemyHp <= 0) {
        handleRoundClear();
      }
    } else {
      // 헛방 시 약한 스파크
      spawnParticles(s.playerPos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x38bdf8, 3, 1.5);
    }
  };

  // 기 모으기 시작/종료
  const handleKiChargeStart = () => {
    if (gameState !== 'playing') return;
    stateRef.current.isChargingKi = true;
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const handleKiChargeEnd = () => {
    stateRef.current.isChargingKi = false;
  };

  // 순간이동 (Teleport)
  const triggerTeleport = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    if (s.teleportCd > 0 || s.playerKi < 20) return;

    s.playerKi = Math.max(0, s.playerKi - 20);
    setPlayerKi(s.playerKi);
    s.teleportCd = 2.5;
    setTeleportCooldown(2.5);

    // 순간이동 전 잔상 파티클
    spawnParticles(s.playerPos.clone(), 0x38bdf8, 15, 3);

    // 적의 등 뒤로 이동 (적 시선 반대 방향)
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.enemyRotY);
    const behindPos = s.enemyPos.clone().sub(forward.multiplyScalar(2.0));
    behindPos.y = Math.max(0.5, s.enemyPos.y);

    s.playerPos.copy(behindPos);
    s.playerVelocity.set(0, 0, 0);

    // 플레이어가 적을 바라보도록 회전
    const lookAngle = Math.atan2(s.enemyPos.x - s.playerPos.x, s.enemyPos.z - s.playerPos.z);
    s.playerRotY = lookAngle;

    // 도착 잔상 파티클 & 햅틱
    spawnParticles(s.playerPos.clone(), 0x00ffff, 15, 3);
    if (navigator.vibrate) navigator.vibrate([30, 40, 50]);
  };

  // 드래곤 빔 (궁극 필살 에너지파)
  const triggerDragonBeam = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    if (s.dragonBeamActive || s.playerKi < 40) return;

    s.playerKi = Math.max(0, s.playerKi - 40);
    setPlayerKi(s.playerKi);
    s.dragonBeamActive = true;
    s.dragonBeamTime = 1.0;

    if (navigator.vibrate) navigator.vibrate([40, 40, 80, 40, 100]);

    // 전방 에너지 빔 타격 판정
    const toEnemy = s.enemyPos.clone().sub(s.playerPos);
    const dist = toEnemy.length();
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.playerRotY);
    const dot = toEnemy.clone().normalize().dot(forward);

    if (dist < 18 && dot > 0.6) {
      const damage = 55;
      s.enemyHp = Math.max(0, s.enemyHp - damage);
      s.damageDealt += damage;
      setEnemyHp(s.enemyHp);

      const knockback = forward.clone().multiplyScalar(3.5);
      s.enemyVelocity.add(knockback);

      spawnParticles(s.enemyPos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0x38bdf8, 25, 6);

      if (s.enemyHp <= 0) {
        handleRoundClear();
      }
    }
  };

  // 원거리 기탄 발사 (Ki Blast)
  const triggerKiBlast = () => {
    if (gameState !== 'playing') return;
    const s = stateRef.current;
    if (s.playerKi < 8 || !s.scene) return;

    s.playerKi = Math.max(0, s.playerKi - 8);
    setPlayerKi(s.playerKi);

    const geo = new THREE.SphereGeometry(0.28, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(s.playerPos).add(new THREE.Vector3(0, 0.5, 0));
    s.scene.add(mesh);

    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.playerRotY);
    s.kiBlasts.push({
      mesh,
      vx: forward.x * 20,
      vz: forward.z * 20,
      isPlayer: true,
      damage: 15,
      life: 1.5,
    });

    if (navigator.vibrate) navigator.vibrate(20);
  };

  // 라운드 클리어 처리
  const handleRoundClear = () => {
    const s = stateRef.current;
    if (s.round < s.maxRounds) {
      s.round += 1;
      setRound(s.round);

      // 다음 라운드 적 세팅
      let nextHp = 140;
      let nextName = 'Dragon Knight';
      if (s.round === 3) {
        nextHp = 220;
        nextName = 'Dark Dragon Lord';
      }
      s.enemyMaxHp = nextHp;
      s.enemyHp = nextHp;
      setEnemyMaxHp(nextHp);
      setEnemyHp(nextHp);
      setEnemyName(nextName);

      // 위치 리셋
      s.playerPos.set(0, 1.2, 6);
      s.enemyPos.set(0, 1.2, -6);
      s.playerVelocity.set(0, 0, 0);
      s.enemyVelocity.set(0, 0, 0);
      s.playerKi = Math.min(100, s.playerKi + 40);
      setPlayerKi(s.playerKi);

      spawnParticles(new THREE.Vector3(0, 2, 0), 0xffd700, 30, 5);
    } else {
      // 3라운드 전승 -> 승리
      setGameState('victory');
      const score = Math.min(50, 30 + Math.floor(s.damageDealt / 20));
      const duration = Math.max(1, Math.floor(s.clock.getElapsedTime()));
      const receipt = calculateAndDepositMissionReward({
        gameId: 'stickman-dragon-fight',
        gameTitle: '스틱맨 드래곤 파이트 3D',
        isVictory: true,
        score: score * 20,
        maxTargetScore: 1000,
        durationSeconds: duration,
      });
      setRewardReceipt(receipt);
    }
  };

  // 게임오버 처리
  const handleGameOver = () => {
    setGameState('gameover');
    const s = stateRef.current;
    const score = Math.max(10, Math.floor(s.damageDealt / 25));
    const duration = Math.max(1, Math.floor(s.clock.getElapsedTime()));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'stickman-dragon-fight',
      gameTitle: '스틱맨 드래곤 파이트 3D',
      isVictory: false,
      score: score * 15,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 중도 포기 정산
  const confirmExit = () => {
    setShowExitModal(false);
    const s = stateRef.current;
    const score = Math.max(5, Math.floor(s.damageDealt / 30));
    const duration = Math.max(1, Math.floor(s.clock.getElapsedTime()));
    calculateAndDepositMissionReward({
      gameId: 'stickman-dragon-fight',
      gameTitle: '스틱맨 드래곤 파이트 3D',
      isVictory: false,
      score: score * 10,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    handleExit();
  };

  // Three.js 초기화 및 게임 루프
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.025);
    stateRef.current.scene = scene;

    // 카메라
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 1, 0);
    stateRef.current.camera = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.5, 25);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // 3D 경기장 무대 (30x30m 무투 링)
    const arenaGeo = new THREE.CylinderGeometry(15, 16, 1.5, 32);
    const arenaMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.3,
    });
    const arenaMesh = new THREE.Mesh(arenaGeo, arenaMat);
    arenaMesh.position.y = -0.75;
    arenaMesh.receiveShadow = true;
    scene.add(arenaMesh);

    // 무대 테두리 골드 링
    const ringGeo = new THREE.TorusGeometry(15, 0.3, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.05;
    scene.add(ringMesh);

    // 중앙 드래곤 배틀 문양 (No.077 카드 스프라이트 텍스처)
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const badgeCtx = badgeCanvas.getContext('2d');
    if (badgeCtx) {
      drawCardSprite(badgeCtx, cardId, 0, 0, 256, 256);
      const badgeTex = new THREE.CanvasTexture(badgeCanvas);
      const badgePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, opacity: 0.85 })
      );
      badgePlane.rotation.x = -Math.PI / 2;
      badgePlane.position.y = 0.02;
      scene.add(badgePlane);
    }

    // 외곽 부유 암석 데코
    for (let i = 0; i < 8; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 8) * Math.PI * 2;
      rock.position.set(Math.cos(angle) * 19, 1 + Math.sin(i) * 1.5, Math.sin(angle) * 19);
      scene.add(rock);
    }

    // --- 플레이어 스틱맨 캐릭터 생성 ---
    const playerGroup = new THREE.Group();
    // 몸통
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 }); // 주황 도복
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.9, 8), bodyMat);
    torso.position.y = 0.45;
    playerGroup.add(torso);

    // 머리
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), headMat);
    head.position.y = 1.15;
    playerGroup.add(head);

    // 슈퍼 골드 스파이키 헤어
    for (let i = 0; i < 5; i++) {
      const hairSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.5, 6),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      hairSpike.position.set(Math.sin(i) * 0.15, 1.35, Math.cos(i) * 0.15);
      hairSpike.rotation.x = (i - 2) * 0.2;
      playerGroup.add(hairSpike);
    }

    // 양팔
    const armMat = new THREE.MeshStandardMaterial({ color: 0xfb923c });
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 6), armMat);
    leftArm.position.set(-0.45, 0.5, 0);
    playerGroup.add(leftArm);
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 6), armMat);
    rightArm.position.set(0.45, 0.5, 0);
    playerGroup.add(rightArm);

    // 양다리
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a }); // 청색 하의
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6), legMat);
    leftLeg.position.set(-0.2, -0.2, 0);
    playerGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6), legMat);
    rightLeg.position.set(0.2, -0.2, 0);
    playerGroup.add(rightLeg);

    // 가슴 No.077 영웅 배지
    if (badgeCtx) {
      const badgeTex2 = new THREE.CanvasTexture(badgeCanvas);
      const chestBadge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.35),
        new THREE.MeshBasicMaterial({ map: badgeTex2, transparent: true })
      );
      chestBadge.position.set(0, 0.55, 0.28);
      playerGroup.add(chestBadge);
    }

    // 기 아우라 메쉬 (평소엔 숨김)
    const auraGeo = new THREE.CylinderGeometry(0.9, 1.2, 2.0, 16, 1, true);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const playerAura = new THREE.Mesh(auraGeo, auraMat);
    playerAura.position.y = 0.8;
    playerGroup.add(playerAura);
    stateRef.current.playerAuraMesh = playerAura;

    // 드래곤 빔 메쉬 그룹 (평소엔 숨김)
    const beamGroup = new THREE.Group();
    const beamCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.8, 16, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    beamCyl.rotation.x = Math.PI / 2;
    beamCyl.position.z = 8;
    beamGroup.add(beamCyl);
    beamGroup.visible = false;
    playerGroup.add(beamGroup);
    stateRef.current.playerBeamMesh = beamGroup;

    playerGroup.position.copy(stateRef.current.playerPos);
    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;

    // --- 적 스틱맨 (섀도우 전사) 생성 ---
    const enemyGroup = new THREE.Group();
    const enemyBodyMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.3 });
    const enemyTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.9, 8), enemyBodyMat);
    enemyTorso.position.y = 0.45;
    enemyGroup.add(enemyTorso);

    const enemyHead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), new THREE.MeshStandardMaterial({ color: 0x1e1b4b }));
    enemyHead.position.y = 1.15;
    enemyGroup.add(enemyHead);

    // 보라색 다크 스파이크 헤어
    for (let i = 0; i < 5; i++) {
      const darkSpike = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.5, 6),
        new THREE.MeshBasicMaterial({ color: 0x9333ea })
      );
      darkSpike.position.set(Math.sin(i) * 0.15, 1.35, Math.cos(i) * 0.15);
      darkSpike.rotation.x = (i - 2) * 0.2;
      enemyGroup.add(darkSpike);
    }

    const enemyArmMat = new THREE.MeshStandardMaterial({ color: 0x581c87 });
    const enemyLArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 6), enemyArmMat);
    enemyLArm.position.set(-0.45, 0.5, 0);
    enemyGroup.add(enemyLArm);
    const enemyRArm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 6), enemyArmMat);
    enemyRArm.position.set(0.45, 0.5, 0);
    enemyGroup.add(enemyRArm);

    const enemyLegMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const enemyLLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6), enemyLegMat);
    enemyLLeg.position.set(-0.2, -0.2, 0);
    enemyGroup.add(enemyLLeg);
    const enemyRLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6), enemyLegMat);
    enemyRLeg.position.set(0.2, -0.2, 0);
    enemyGroup.add(enemyRLeg);

    // 적 다크 아우라
    const enemyAura = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.2, 2.0, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    enemyAura.position.y = 0.8;
    enemyGroup.add(enemyAura);
    stateRef.current.enemyAuraMesh = enemyAura;

    enemyGroup.position.copy(stateRef.current.enemyPos);
    scene.add(enemyGroup);
    stateRef.current.enemyGroup = enemyGroup;

    // 창 크기 리사이즈
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

      // 쿨다운 갱신
      if (s.teleportCd > 0) {
        s.teleportCd = Math.max(0, s.teleportCd - dt);
        setTeleportCooldown(parseFloat(s.teleportCd.toFixed(1)));
      }

      // 플레이어 이동 및 회전
      if (s.moveDir.x !== 0 || s.moveDir.z !== 0) {
        const speed = 7.5;
        s.playerPos.x += s.moveDir.x * speed * dt;
        s.playerPos.z += s.moveDir.z * speed * dt;

        // 이동 방향으로 부드러운 회전
        const targetAngle = Math.atan2(s.moveDir.x, s.moveDir.z);
        s.playerRotY = targetAngle;
      } else {
        // 정지 시 적을 바라봄
        const targetAngle = Math.atan2(s.enemyPos.x - s.playerPos.x, s.enemyPos.z - s.playerPos.z);
        s.playerRotY = targetAngle;
      }

      // 링 경계선 제한 (반경 13m)
      const ringRadius = 13;
      const distFromCenter = Math.hypot(s.playerPos.x, s.playerPos.z);
      if (distFromCenter > ringRadius) {
        const angle = Math.atan2(s.playerPos.z, s.playerPos.x);
        s.playerPos.x = Math.cos(angle) * ringRadius;
        s.playerPos.z = Math.sin(angle) * ringRadius;
      }

      // 플레이어 물리 및 감속
      s.playerPos.add(s.playerVelocity.clone().multiplyScalar(dt));
      s.playerVelocity.multiplyScalar(0.85);

      if (s.playerGroup) {
        s.playerGroup.position.copy(s.playerPos);
        s.playerGroup.rotation.y = s.playerRotY;
      }

      // 기 모으기 효과
      if (s.isChargingKi) {
        s.playerKi = Math.min(100, s.playerKi + 35 * dt);
        setPlayerKi(Math.floor(s.playerKi));
        if (s.playerAuraMesh) {
          (s.playerAuraMesh.material as THREE.MeshBasicMaterial).opacity = 0.65;
          s.playerAuraMesh.rotation.y += 8 * dt;
        }
        spawnParticles(s.playerPos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xfacc15, 2, 2.5);
      } else if (s.playerAuraMesh) {
        (s.playerAuraMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      // 드래곤 빔 타이머
      if (s.dragonBeamActive) {
        s.dragonBeamTime -= dt;
        if (s.playerBeamMesh) {
          s.playerBeamMesh.visible = true;
          s.playerBeamMesh.rotation.z += 10 * dt;
        }
        spawnParticles(s.playerPos.clone().add(new THREE.Vector3(0, 0.8, 0)), 0x38bdf8, 3, 4);
        if (s.dragonBeamTime <= 0) {
          s.dragonBeamActive = false;
          if (s.playerBeamMesh) s.playerBeamMesh.visible = false;
        }
      }

      // 공격 타이머
      if (s.isAttacking) {
        s.attackTime -= dt;
        if (s.attackTime <= 0) {
          s.isAttacking = false;
        }
      }

      // --- 적 AI 로직 ---
      if (gameState === 'playing') {
        s.enemyAiTimer += dt;
        const toPlayer = s.playerPos.clone().sub(s.enemyPos);
        const distToPlayer = toPlayer.length();

        // 적은 항상 플레이어를 바라봄
        s.enemyRotY = Math.atan2(toPlayer.x, toPlayer.z);

        // 거리 유지 및 공격 패턴
        const idealDist = 2.4;
        if (distToPlayer > idealDist + 0.5) {
          // 플레이어에게 접근
          const moveDir = toPlayer.clone().normalize();
          const enemySpeed = 4.5 + s.round * 0.8;
          s.enemyPos.x += moveDir.x * enemySpeed * dt;
          s.enemyPos.z += moveDir.z * enemySpeed * dt;
        } else if (distToPlayer < idealDist - 0.5) {
          // 너무 가까우면 뒤로 살짝 물러섬
          const backDir = toPlayer.clone().normalize().negate();
          s.enemyPos.x += backDir.x * 2.0 * dt;
          s.enemyPos.z += backDir.z * 2.0 * dt;
        }

        // 적 공격 주기 (1.2초마다)
        if (s.enemyAiTimer > 1.2) {
          s.enemyAiTimer = 0;
          if (distToPlayer < 3.2) {
            // 근접 콤보 공격
            const enemyDmg = 8 + s.round * 3;
            s.playerHp = Math.max(0, s.playerHp - enemyDmg);
            s.damageTaken += enemyDmg;
            setPlayerHp(s.playerHp);

            // 플레이어 넉백
            const knockback = s.playerPos.clone().sub(s.enemyPos).normalize().multiplyScalar(0.7);
            s.playerVelocity.add(knockback);
            spawnParticles(s.playerPos.clone().add(new THREE.Vector3(0, 0.5, 0)), 0xef4444, 10, 3);
            if (navigator.vibrate) navigator.vibrate(30);

            if (s.playerHp <= 0) {
              handleGameOver();
            }
          } else {
            // 원거리 암흑 기탄 발사
            const geo = new THREE.SphereGeometry(0.25, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
            const blastMesh = new THREE.Mesh(geo, mat);
            blastMesh.position.copy(s.enemyPos).add(new THREE.Vector3(0, 0.5, 0));
            scene.add(blastMesh);

            const blastDir = toPlayer.clone().normalize();
            s.kiBlasts.push({
              mesh: blastMesh,
              vx: blastDir.x * 14,
              vz: blastDir.z * 14,
              isPlayer: false,
              damage: 10 + s.round * 2,
              life: 1.8,
            });
          }
        }

        // 적 링 경계선 제한
        const enemyDistCenter = Math.hypot(s.enemyPos.x, s.enemyPos.z);
        if (enemyDistCenter > ringRadius) {
          const angle = Math.atan2(s.enemyPos.z, s.enemyPos.x);
          s.enemyPos.x = Math.cos(angle) * ringRadius;
          s.enemyPos.z = Math.sin(angle) * ringRadius;
        }

        // 적 물리 감속
        s.enemyPos.add(s.enemyVelocity.clone().multiplyScalar(dt));
        s.enemyVelocity.multiplyScalar(0.85);

        if (s.enemyGroup) {
          s.enemyGroup.position.copy(s.enemyPos);
          s.enemyGroup.rotation.y = s.enemyRotY;
        }
        if (s.enemyAuraMesh) {
          s.enemyAuraMesh.rotation.y += 4 * dt;
        }
      }

      // --- 기 탄환 업데이트 & 충돌 판정 ---
      for (let i = s.kiBlasts.length - 1; i >= 0; i--) {
        const b = s.kiBlasts[i];
        b.life -= dt;
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.z += b.vz * dt;

        if (b.isPlayer) {
          // 플레이어 탄 -> 적 피격
          if (b.mesh.position.distanceTo(s.enemyPos) < 1.4) {
            s.enemyHp = Math.max(0, s.enemyHp - b.damage);
            s.damageDealt += b.damage;
            setEnemyHp(s.enemyHp);
            spawnParticles(b.mesh.position, 0x38bdf8, 12, 4);
            scene.remove(b.mesh);
            s.kiBlasts.splice(i, 1);
            if (s.enemyHp <= 0) handleRoundClear();
            continue;
          }
        } else {
          // 적 탄 -> 플레이어 피격
          if (b.mesh.position.distanceTo(s.playerPos) < 1.4) {
            s.playerHp = Math.max(0, s.playerHp - b.damage);
            s.damageTaken += b.damage;
            setPlayerHp(s.playerHp);
            spawnParticles(b.mesh.position, 0xa855f7, 12, 4);
            scene.remove(b.mesh);
            s.kiBlasts.splice(i, 1);
            if (navigator.vibrate) navigator.vibrate(30);
            if (s.playerHp <= 0) handleGameOver();
            continue;
          }
        }

        if (b.life <= 0) {
          scene.remove(b.mesh);
          s.kiBlasts.splice(i, 1);
        }
      }

      // --- 파티클 업데이트 ---
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        const scale = Math.max(0.01, 1 - p.life / p.maxLife);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          s.particles.splice(i, 1);
        }
      }

      // --- 다이나믹 카메라 추적 ---
      // 플레이어와 적의 중심점을 바라봄
      const center = s.playerPos.clone().add(s.enemyPos).multiplyScalar(0.5);
      const targetCamX = center.x * 0.4;
      const targetCamZ = center.z * 0.4 + 13;
      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;
      camera.position.y = 8;
      camera.lookAt(center.x, 1.2, center.z);

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
  }, [cardId, gameState]);

  // 게임 시작
  const startGame = () => {
    setGameState('playing');
  };

  // 재시작
  const restartGame = () => {
    const s = stateRef.current;
    s.round = 1;
    s.playerHp = 100;
    s.playerKi = 50;
    s.enemyHp = 100;
    s.enemyMaxHp = 100;
    s.damageDealt = 0;
    s.damageTaken = 0;
    s.playerPos.set(0, 1.2, 6);
    s.enemyPos.set(0, 1.2, -6);
    s.playerVelocity.set(0, 0, 0);
    s.enemyVelocity.set(0, 0, 0);

    setRound(1);
    setPlayerHp(100);
    setPlayerKi(50);
    setEnemyHp(100);
    setEnemyMaxHp(100);
    setEnemyName('Shadow Warrior');
    setComboCount(0);
    setRewardReceipt(null);
    setGameState('playing');
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 상단 통합 HUD */}
      <MinimalistMissionHUD
        title="STICKMAN DRAGON FIGHT 3D"
        scoreDisplay={`ROUND ${round}/3 | COMBO: ${comboCount}`}
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 대전 상태 게이지 (플레이어 vs 적 보스) */}
      <div className="absolute top-16 left-3 right-3 flex justify-between items-start pointer-events-none z-10 gap-2">
        {/* 플레이어 HP & KI */}
        <div className="flex-1 bg-black/60 backdrop-blur-md p-2 border border-amber-500/40 rounded-sm">
          <div className="flex justify-between text-xs text-amber-300 font-bold mb-1">
            <span>[HERO #${cardId}]</span>
            <span>{playerHp} / 100 HP</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-150"
              style={{ width: `${Math.max(0, playerHp)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-cyan-300 font-bold mb-0.5">
            <span>KI ENERGY</span>
            <span>{playerKi}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-100"
              style={{ width: `${Math.max(0, playerKi)}%` }}
            />
          </div>
        </div>

        {/* 적 보스 HP */}
        <div className="flex-1 bg-black/60 backdrop-blur-md p-2 border border-purple-500/40 rounded-sm text-right">
          <div className="flex justify-between text-xs text-purple-300 font-bold mb-1">
            <span>{enemyHp} / {enemyMaxHp} HP</span>
            <span>[{enemyName}]</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-red-600 to-purple-500 transition-all duration-150 ml-auto"
              style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 조이스틱 시각 피드백 (좌측 영역 터치 시) */}
      {stateRef.current.joystickActive && (
        <div
          className="absolute w-28 h-28 rounded-full border-2 border-amber-400/40 bg-amber-500/10 pointer-events-none -translate-x-1/2 -translate-y-1/2 z-20"
          style={{
            left: stateRef.current.touchStart.x,
            top: stateRef.current.touchStart.y,
          }}
        >
          <div
            className="absolute w-12 h-12 rounded-full bg-amber-400/80 shadow-lg -translate-x-1/2 -translate-y-1/2"
            style={{
              left: 56 + stateRef.current.moveDir.x * 40,
              top: 56 + stateRef.current.moveDir.z * 40,
            }}
          />
        </div>
      )}

      {/* 모바일 퓨어 터치 액션 버튼 군 (우측 하단) */}
      {gameState === 'playing' && (
        <div className="absolute right-4 bottom-6 flex flex-col items-end gap-3 pointer-events-auto z-20 select-none">
          <div className="flex gap-2.5 items-center">
            {/* KI 기 모으기 (홀드 버튼) */}
            <button
              onPointerDown={handleKiChargeStart}
              onPointerUp={handleKiChargeEnd}
              onPointerLeave={handleKiChargeEnd}
              className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 text-black font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 border-yellow-200"
            >
              <span>KI</span>
              <span className="text-[9px] font-bold">CHARGE</span>
            </button>

            {/* TELEPORT 순간이동 */}
            <button
              onClick={triggerTeleport}
              disabled={teleportCooldown > 0 || playerKi < 20}
              className={`w-16 h-16 rounded-full font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 ${
                teleportCooldown > 0 || playerKi < 20
                  ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
                  : 'bg-gradient-to-b from-indigo-500 to-indigo-700 text-white border-indigo-300'
              }`}
            >
              <span>FLASH</span>
              <span className="text-[9px]">{teleportCooldown > 0 ? `${teleportCooldown}s` : '20 KI'}</span>
            </button>
          </div>

          <div className="flex gap-2.5 items-center">
            {/* 원거리 기탄 발사 */}
            <button
              onClick={triggerKiBlast}
              disabled={playerKi < 8}
              className={`w-16 h-16 rounded-full font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 ${
                playerKi < 8
                  ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
                  : 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white border-cyan-300'
              }`}
            >
              <span>BLAST</span>
              <span className="text-[9px]">8 KI</span>
            </button>

            {/* 필살 드래곤 빔 (궁극기) */}
            <button
              onClick={triggerDragonBeam}
              disabled={playerKi < 40}
              className={`w-16 h-16 rounded-full font-black text-xs shadow-lg active:scale-95 flex flex-col items-center justify-center border-2 ${
                playerKi < 40
                  ? 'bg-slate-800 text-slate-500 border-slate-700 opacity-60'
                  : 'bg-gradient-to-b from-rose-500 to-red-600 text-white border-rose-300 animate-pulse'
              }`}
            >
              <span>BEAM</span>
              <span className="text-[9px]">40 KI</span>
            </button>

            {/* 76px 대형 ATTACK 콤보 연타 */}
            <button
              onClick={triggerAttack}
              className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-yellow-400 to-orange-500 text-black font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white"
            >
              <span>ATTACK</span>
              <span className="text-[10px] font-bold">HIT!</span>
            </button>
          </div>
        </div>
      )}

      {/* 준비(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-amber-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-amber-400 mb-2">STICKMAN DRAGON FIGHT 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              3D 무투 아레나에서 펼쳐지는 애니풍 초능력 배틀!
              <br />
              <span className="text-amber-300">좌측 터치 드래그</span>로 360° 이동,
              <br />
              <span className="text-yellow-400 font-bold">[ATTACK]</span> 콤보 연타,
              <br />
              <span className="text-cyan-400 font-bold">[KI CHARGE]</span>로 기력을 모아
              <br />
              <span className="text-rose-400 font-bold">[DRAGON BEAM]</span> 필살기를 작렬하세요!
            </p>
            <button
              onClick={startGame}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ BATTLE START! ]
            </button>
          </div>
        </div>
      )}

      {/* 게임오버 모달 */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-red-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-red-500 mb-2">DEFEAT...</h2>
            <p className="text-xs text-slate-300 mb-4">
              적의 맹공에 쓰러졌습니다.
              <br />
              달성 라운드: {round} / 3
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
            <h3 className="text-lg font-bold text-white mb-2">대전을 중단할까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지의 대전 실적에 따라 SNS 보상이 안전하게 정산됩니다.
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

export { PokiStickmanDragonFightGame };
