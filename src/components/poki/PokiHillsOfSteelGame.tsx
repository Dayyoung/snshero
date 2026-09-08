import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Crosshair, Plane, Zap, RotateCcw, Volume2, VolumeX, Shield } from 'lucide-react';

interface PokiHillsOfSteelGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface EnemyUnit {
  id: number;
  type: 'scout' | 'tiger' | 'heli' | 'boss';
  mesh: THREE.Group;
  hpBarMesh: THREE.Sprite;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  speed: number;
  shootCooldown: number;
  isAlive: boolean;
  rotorMesh?: THREE.Mesh;
}

interface Shell {
  mesh: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  damage: number;
  life: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: number;
}

// 120m 언덕 지형 수식
function getHillY(x: number): number {
  if (x < -16) return 0; // 안전 광폭 스타트 진지
  return (
    Math.sin(x * 0.08) * 3.2 +
    Math.cos(x * 0.04) * 2.0 +
    Math.sin(x * 0.16) * 1.0 +
    (x > 0 ? x * 0.02 : 0)
  );
}

function getHillSlope(x: number): number {
  const dx = 0.3;
  const y1 = getHillY(x - dx);
  const y2 = getHillY(x + dx);
  return Math.atan2(y2 - y1, dx * 2);
}

export default function PokiHillsOfSteelGame({
  onClose,
  onBack,
  cardId = 66,
  onExit
}: PokiHillsOfSteelGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 진행 상태
  const [wave, setWave] = useState(1);
  const [kills, setKills] = useState(0);
  const [playerHp, setPlayerHp] = useState(150);
  const [maxPlayerHp] = useState(150);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 스킬 쿨다운
  const [cannonCd, setCannonCd] = useState(0);
  const [airstrikeCd, setAirstrikeCd] = useState(0);
  const [boostCd, setBoostCd] = useState(0);

  // 조작 상태 레프
  const inputRef = useRef({
    throttle: 0, // -1(후진) ~ 1(전진)
    fireRequested: false,
    airstrikeRequested: false,
    boostRequested: false,
  });

  const stateRef = useRef({
    playerX: -20,
    playerY: 0,
    playerAngle: 0,
    playerVx: 0,
    hp: 150,
    isBoosting: false,
    boostTime: 0,
    cannonTimer: 0,
    airstrikeTimer: 0,
    boostTimer: 0,
    wave: 1,
    kills: 0,
    enemies: [] as EnemyUnit[],
    shells: [] as Shell[],
    particles: [] as Particle[],
    startTime: Date.now(),
    ended: false,
    shake: 0,
    airBomberActive: false,
    airBomberX: -40,
    airBomberMesh: null as THREE.Group | null,
    airBombsDropped: 0,
  });

  // 오디오 효과음
  const playSound = useCallback((type: 'cannon' | 'airstrike' | 'boost' | 'hit' | 'explode' | 'win' | 'lose') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'cannon') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'airstrike') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.6);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'boost') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'explode') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'win') {
        [440, 554, 659, 880].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.2, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
          o.start(now + i * 0.12);
          o.stop(now + i * 0.12 + 0.3);
        });
      }
    } catch {
      // AudioContext 미지원 무시
    }
  }, [isMuted]);

  // Three.js 전장 및 물리 엔진
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬 및 렌더러 초기화
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc7f2d6); // 맑은 하늘색
    scene.fog = new THREE.FogExp2(0xc7f2d6, 0.007);

    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.5, 300);
    camera.position.set(-20, 10, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(30, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    // 120m 3D 굴곡 언덕 지형 메쉬 생성
    const hillLength = 180;
    const hillWidth = 24;
    const segmentsX = 360;
    const segmentsZ = 30;
    const hillGeo = new THREE.PlaneGeometry(hillLength, hillWidth, segmentsX, segmentsZ);
    hillGeo.rotateX(-Math.PI / 2);

    const posAttr = hillGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const worldX = x + 60; // 오프셋 조정 (-30 ~ +150)
      const y = getHillY(worldX);
      posAttr.setY(i, y);
    }
    hillGeo.computeVertexNormals();

    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x4caf50,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true,
    });
    const hillMesh = new THREE.Mesh(hillGeo, hillMat);
    hillMesh.position.x = 60;
    hillMesh.receiveShadow = true;
    scene.add(hillMesh);

    // 배경 산맥 및 바위/나무 소품
    const mountainGeo = new THREE.ConeGeometry(25, 45, 6);
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(-30 + i * 35, 10, -50);
      m.scale.set(1 + Math.random() * 0.4, 0.8 + Math.random() * 0.5, 1);
      scene.add(m);
    }

    // 언덕 위 3D 나무들
    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const treeLeavesGeo = new THREE.ConeGeometry(1.5, 3.5, 6);
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, flatShading: true });

    for (let x = -10; x < 140; x += 12 + Math.random() * 8) {
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.y = 1;
      trunk.castShadow = true;
      const leaves = new THREE.Mesh(treeLeavesGeo, treeLeavesMat);
      leaves.position.y = 3;
      leaves.castShadow = true;
      treeGroup.add(trunk);
      treeGroup.add(leaves);

      const zOffset = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 3);
      treeGroup.position.set(x, getHillY(x), zOffset);
      scene.add(treeGroup);
    }

    // 플레이어 탱크 생성 (블루 사이버 코브라 탱크)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(-20, getHillY(-20), 0);

    // 섀시
    const chassisGeo = new THREE.BoxGeometry(4.2, 1.3, 2.6);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e88e5, metalness: 0.5, roughness: 0.4 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.8;
    chassis.castShadow = true;
    playerGroup.add(chassis);

    // 좌우 궤도 트랙
    const trackGeo = new THREE.BoxGeometry(4.5, 0.8, 0.6);
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.8 });
    const leftTrack = new THREE.Mesh(trackGeo, trackMat);
    leftTrack.position.set(0, 0.4, 1.4);
    leftTrack.castShadow = true;
    const rightTrack = new THREE.Mesh(trackGeo, trackMat);
    rightTrack.position.set(0, 0.4, -1.4);
    rightTrack.castShadow = true;
    playerGroup.add(leftTrack);
    playerGroup.add(rightTrack);

    // 궤도 휠들
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.65, 8);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.6 });
    for (let w = -1.6; w <= 1.6; w += 1.05) {
      const wl = new THREE.Mesh(wheelGeo, wheelMat);
      wl.position.set(w, 0.4, 1.4);
      playerGroup.add(wl);
      const wr = new THREE.Mesh(wheelGeo, wheelMat);
      wr.position.set(w, 0.4, -1.4);
      playerGroup.add(wr);
    }

    // 포탑
    const turretGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.8, 8);
    const turretMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, metalness: 0.6, roughness: 0.3 });
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(0.2, 1.8, 0);
    turret.castShadow = true;
    playerGroup.add(turret);

    // 주포 바렐 (Barrel)
    const barrelPivot = new THREE.Group();
    barrelPivot.position.set(0.2, 1.8, 0);
    const barrelGeo = new THREE.CylinderGeometry(0.18, 0.22, 3.2, 8);
    barrelGeo.rotateZ(-Math.PI / 2);
    barrelGeo.translate(1.6, 0, 0);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x0d47a1, metalness: 0.7, roughness: 0.2 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.castShadow = true;
    barrelPivot.add(barrel);
    playerGroup.add(barrelPivot);

    // No.066 영웅 카드 스프라이트 배지 장착
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const badgeCtx = badgeCanvas.getContext('2d');
    if (badgeCtx) {
      drawCardSprite(badgeCtx, cardId || 66, 128, 128, 220, 220);
    }
    const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
    const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true });
    const badgeGeo = new THREE.CircleGeometry(0.7, 16);
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0.2, 2.5, 0.05);
    playerGroup.add(badgeMesh);

    scene.add(playerGroup);

    // 전술 공중 폭격기 모델
    const bomberGroup = new THREE.Group();
    const bomberBody = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1, 2),
      new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 })
    );
    const bomberWings = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.2, 14),
      new THREE.MeshStandardMaterial({ color: 0x455a64 })
    );
    bomberGroup.add(bomberBody);
    bomberGroup.add(bomberWings);
    bomberGroup.position.set(-60, 22, 0);
    bomberGroup.visible = false;
    scene.add(bomberGroup);
    stateRef.current.airBomberMesh = bomberGroup;

    // 적 생성 헬퍼 함수
    const createEnemy = (type: 'scout' | 'tiger' | 'heli' | 'boss', startX: number, id: number): EnemyUnit => {
      const eGroup = new THREE.Group();
      let hp = 60;
      let rotor: THREE.Mesh | undefined;

      if (type === 'scout') {
        // 레드 스카우트 탱크
        hp = 60;
        const eChassis = new THREE.Mesh(
          new THREE.BoxGeometry(3.6, 1.1, 2.2),
          new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4 })
        );
        eChassis.position.y = 0.6;
        eChassis.castShadow = true;
        const eTurret = new THREE.Mesh(
          new THREE.CylinderGeometry(0.9, 1.1, 0.6, 8),
          new THREE.MeshStandardMaterial({ color: 0xb71c1c })
        );
        eTurret.position.set(-0.2, 1.4, 0);
        const eBarrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.16, 2.4, 6),
          new THREE.MeshStandardMaterial({ color: 0x212121 })
        );
        eBarrel.rotateZ(Math.PI / 2);
        eBarrel.position.set(-1.4, 1.4, 0);
        eGroup.add(eChassis);
        eGroup.add(eTurret);
        eGroup.add(eBarrel);
      } else if (type === 'tiger') {
        // 중장갑 타이거 탱크
        hp = 140;
        const eChassis = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 1.5, 2.8),
          new THREE.MeshStandardMaterial({ color: 0xef6c00, roughness: 0.5 })
        );
        eChassis.position.y = 0.8;
        eChassis.castShadow = true;
        const eTurret = new THREE.Mesh(
          new THREE.CylinderGeometry(1.3, 1.5, 0.9, 8),
          new THREE.MeshStandardMaterial({ color: 0xe65100 })
        );
        eTurret.position.set(-0.2, 1.9, 0);
        const eBarrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.26, 3.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x1b1b1b })
        );
        eBarrel.rotateZ(Math.PI / 2);
        eBarrel.position.set(-1.8, 1.9, 0);
        eGroup.add(eChassis);
        eGroup.add(eTurret);
        eGroup.add(eBarrel);
      } else if (type === 'heli') {
        // 공중 공격 헬리콥터
        hp = 90;
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(3.6, 1.4, 1.6),
          new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.5 })
        );
        const tail = new THREE.Mesh(
          new THREE.BoxGeometry(2.8, 0.4, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x37474f })
        );
        tail.position.set(2.8, 0.3, 0);
        const rotorGeo = new THREE.BoxGeometry(0.2, 0.05, 5);
        const rotorMat = new THREE.MeshBasicMaterial({ color: 0x212121 });
        rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.position.set(0, 1.1, 0);
        eGroup.add(body);
        eGroup.add(tail);
        eGroup.add(rotor);
      } else if (type === 'boss') {
        // 결전 보스 [골리앗 메가 탱크]
        hp = 350;
        const eChassis = new THREE.Mesh(
          new THREE.BoxGeometry(7.0, 2.2, 4.2),
          new THREE.MeshStandardMaterial({ color: 0x880e4f, roughness: 0.3, metalness: 0.7 })
        );
        eChassis.position.y = 1.2;
        eChassis.castShadow = true;
        const eTurret = new THREE.Mesh(
          new THREE.BoxGeometry(3.5, 1.6, 3.0),
          new THREE.MeshStandardMaterial({ color: 0x4a148c, metalness: 0.8 })
        );
        eTurret.position.set(-0.4, 2.7, 0);
        // 듀얼 바렐
        const b1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.3, 4.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        b1.rotateZ(Math.PI / 2);
        b1.position.set(-2.4, 2.8, 0.6);
        const b2 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.3, 4.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        b2.rotateZ(Math.PI / 2);
        b2.position.set(-2.4, 2.8, -0.6);
        eGroup.add(eChassis);
        eGroup.add(eTurret);
        eGroup.add(b1);
        eGroup.add(b2);
      }

      // 3D HP 스프라이트
      const hpCanvas = document.createElement('canvas');
      hpCanvas.width = 128;
      hpCanvas.height = 24;
      const hCtx = hpCanvas.getContext('2d');
      if (hCtx) {
        hCtx.fillStyle = 'rgba(0,0,0,0.7)';
        hCtx.fillRect(0, 0, 128, 24);
        hCtx.fillStyle = '#ff1744';
        hCtx.fillRect(2, 2, 124, 20);
      }
      const hpTex = new THREE.CanvasTexture(hpCanvas);
      const hpMat = new THREE.SpriteMaterial({ map: hpTex });
      const hpSprite = new THREE.Sprite(hpMat);
      hpSprite.scale.set(3, 0.6, 1);
      hpSprite.position.y = type === 'boss' ? 4.8 : type === 'heli' ? 2.2 : 2.8;
      eGroup.add(hpSprite);

      const yPos = type === 'heli' ? getHillY(startX) + 7 : getHillY(startX);
      eGroup.position.set(startX, yPos, 0);
      scene.add(eGroup);

      return {
        id,
        type,
        mesh: eGroup,
        hpBarMesh: hpSprite,
        hp,
        maxHp: hp,
        x: startX,
        y: yPos,
        speed: type === 'scout' ? 3.5 : type === 'tiger' ? 2.2 : type === 'heli' ? 4.5 : 1.6,
        shootCooldown: 1.5 + Math.random() * 1.5,
        isAlive: true,
        rotorMesh: rotor,
      };
    };

    // 웨이브 스폰 함수
    const spawnWave = (waveNum: number) => {
      // 기존 적 메쉬 정리
      stateRef.current.enemies.forEach((e) => {
        scene.remove(e.mesh);
      });
      stateRef.current.enemies = [];

      if (waveNum === 1) {
        stateRef.current.enemies.push(createEnemy('scout', 25, 1));
        stateRef.current.enemies.push(createEnemy('scout', 45, 2));
      } else if (waveNum === 2) {
        stateRef.current.enemies.push(createEnemy('tiger', 35, 3));
        stateRef.current.enemies.push(createEnemy('heli', 55, 4));
      } else if (waveNum === 3) {
        stateRef.current.enemies.push(createEnemy('boss', 55, 5));
        stateRef.current.enemies.push(createEnemy('scout', 75, 6));
      }
    };

    spawnWave(1);

    // 파티클 생성 헬퍼
    const spawnExplosion = (x: number, y: number, z: number, count = 16, color = 0xff5722) => {
      for (let i = 0; i < count; i++) {
        const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const pMat = new THREE.MeshBasicMaterial({ color });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(x, y, z);
        scene.add(pMesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 6;
        stateRef.current.particles.push({
          mesh: pMesh,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 2,
          vz: (Math.random() - 0.5) * speed,
          life: 0.4 + Math.random() * 0.4,
          maxLife: 0.8,
          color,
        });
      }
      stateRef.current.shake = Math.min(stateRef.current.shake + 0.3, 0.8);
      playSound('explode');
    };

    // 포탄 발사 헬퍼
    const spawnShell = (x: number, y: number, vx: number, vy: number, isPlayer: boolean, damage: number) => {
      const geo = new THREE.SphereGeometry(isPlayer ? 0.3 : 0.25, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: isPlayer ? 0xffee58 : 0xff1744 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      scene.add(mesh);

      stateRef.current.shells.push({
        mesh,
        x,
        y,
        z: 0,
        vx,
        vy,
        isPlayer,
        damage,
        life: 4.0,
      });

      if (isPlayer) {
        playSound('cannon');
        stateRef.current.shake = Math.min(stateRef.current.shake + 0.15, 0.5);
      }
    };

    // 창 크기 변경 핸들러
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    // 애니메이션 루프
    let lastTime = performance.now();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      if (state.ended) {
        renderer.render(scene, camera);
        return;
      }

      // 플레이어 제어 (스로틀 및 부스트)
      const input = inputRef.current;
      let targetSpeed = input.throttle * 6.5;

      // 부스트 활성 시
      if (state.isBoosting) {
        state.boostTime -= dt;
        targetSpeed = 16.0;
        // 부스트 배기 파티클
        if (Math.random() < 0.6) {
          const bpGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          const bpMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
          const bpMesh = new THREE.Mesh(bpGeo, bpMat);
          bpMesh.position.set(state.playerX - 2, state.playerY + 0.8, (Math.random() - 0.5) * 0.8);
          scene.add(bpMesh);
          state.particles.push({
            mesh: bpMesh,
            vx: -8 + Math.random() * 2,
            vy: Math.random() * 2,
            vz: (Math.random() - 0.5) * 2,
            life: 0.3,
            maxLife: 0.3,
            color: 0x00e5ff,
          });
        }
        if (state.boostTime <= 0) {
          state.isBoosting = false;
        }
      }

      // 가감속 보간
      state.playerVx += (targetSpeed - state.playerVx) * Math.min(dt * 5, 1);
      state.playerX += state.playerVx * dt;
      // 시작 지점 한계 (-24m 이상)
      if (state.playerX < -24) state.playerX = -24;

      // 언덕 높이 및 차체 기울기 계산
      state.playerY = getHillY(state.playerX);
      const targetAngle = getHillSlope(state.playerX);
      state.playerAngle += (targetAngle - state.playerAngle) * Math.min(dt * 10, 1);

      // 플레이어 3D 메쉬 동기화
      playerGroup.position.set(state.playerX, state.playerY, 0);
      playerGroup.rotation.z = state.playerAngle;

      // 쿨다운 업데이트
      if (state.cannonTimer > 0) state.cannonTimer -= dt;
      if (state.airstrikeTimer > 0) state.airstrikeTimer -= dt;
      if (state.boostTimer > 0) state.boostTimer -= dt;

      setCannonCd(Math.max(0, state.cannonTimer));
      setAirstrikeCd(Math.max(0, state.airstrikeTimer));
      setBoostCd(Math.max(0, state.boostTimer));

      // 주포 사격 입력 처리
      if (input.fireRequested && state.cannonTimer <= 0) {
        input.fireRequested = false;
        state.cannonTimer = 0.8;
        const fireAngle = state.playerAngle + 0.18; // 약간 상향 사격 각도
        const shellSpeed = 22;
        const vx = Math.cos(fireAngle) * shellSpeed;
        const vy = Math.sin(fireAngle) * shellSpeed;
        spawnShell(state.playerX + Math.cos(fireAngle) * 3, state.playerY + 1.8 + Math.sin(fireAngle) * 3, vx, vy, true, 45);
      }

      // 공중 폭격 입력 처리
      if (input.airstrikeRequested && state.airstrikeTimer <= 0) {
        input.airstrikeRequested = false;
        state.airstrikeTimer = 12.0;
        state.airBomberActive = true;
        state.airBomberX = state.playerX - 35;
        state.airBombsDropped = 0;
        if (state.airBomberMesh) {
          state.airBomberMesh.visible = true;
          state.airBomberMesh.position.set(state.airBomberX, 22, 0);
        }
        playSound('airstrike');
      }

      // 부스트 입력 처리
      if (input.boostRequested && state.boostTimer <= 0) {
        input.boostRequested = false;
        state.boostTimer = 8.0;
        state.isBoosting = true;
        state.boostTime = 1.2;
        playSound('boost');
      }

      // 공중 폭격기 비행 & 폭탄 투하
      if (state.airBomberActive && state.airBomberMesh) {
        state.airBomberX += 38 * dt;
        state.airBomberMesh.position.x = state.airBomberX;

        // 적 위치 상공 통과 시 3발 분할 투하
        if (state.airBombsDropped < 3 && state.airBomberX > state.playerX + 10 + state.airBombsDropped * 8) {
          state.airBombsDropped++;
          spawnShell(state.airBomberX, 20, 8, -14, true, 80);
        }

        if (state.airBomberX > state.playerX + 60) {
          state.airBomberActive = false;
          state.airBomberMesh.visible = false;
        }
      }

      // 적 유닛 AI 업데이트
      let livingEnemies = 0;
      state.enemies.forEach((enemy) => {
        if (!enemy.isAlive) return;
        livingEnemies++;

        // 헬리콥터 프로펠러 회전
        if (enemy.rotorMesh) {
          enemy.rotorMesh.rotation.y += 25 * dt;
        }

        // 플레이어와의 거리
        const dist = enemy.x - state.playerX;

        if (enemy.type === 'heli') {
          // 헬기: 좌우 선회 및 폭탄 투하
          enemy.x += Math.sin(now * 0.002) * enemy.speed * dt;
          enemy.y = getHillY(enemy.x) + 7.5 + Math.sin(now * 0.004) * 1.5;
          enemy.mesh.position.set(enemy.x, enemy.y, 0);
        } else {
          // 지상 탱크: 플레이어 방향으로 접근 (일정 거리 유지)
          if (dist > 18) {
            enemy.x -= enemy.speed * dt;
          } else if (dist < 10) {
            enemy.x += enemy.speed * 0.6 * dt;
          }
          enemy.y = getHillY(enemy.x);
          const slope = getHillSlope(enemy.x);
          enemy.mesh.position.set(enemy.x, enemy.y, 0);
          enemy.mesh.rotation.z = slope;
        }

        // 부스트 충돌 판정
        if (state.isBoosting && Math.abs(state.playerX - enemy.x) < 3.8 && Math.abs(state.playerY - enemy.y) < 3.0) {
          enemy.hp -= 60;
          spawnExplosion(enemy.x, enemy.y + 1, 0, 10, 0x00e5ff);
          if (enemy.hp <= 0) {
            enemy.isAlive = false;
            scene.remove(enemy.mesh);
            spawnExplosion(enemy.x, enemy.y + 1, 0, 24, 0xff9800);
            state.kills++;
            setKills(state.kills);
          }
        }

        // 적 사격 AI
        enemy.shootCooldown -= dt;
        if (enemy.shootCooldown <= 0 && dist > 5 && dist < 45) {
          enemy.shootCooldown = enemy.type === 'boss' ? 1.4 : enemy.type === 'scout' ? 2.5 : 2.0;
          const bulletSpeed = 16;
          const targetY = state.playerY + 1;
          const dx = state.playerX - enemy.x;
          const dy = targetY - enemy.y;
          const angle = Math.atan2(dy, dx);
          const vx = Math.cos(angle) * bulletSpeed;
          const vy = Math.sin(angle) * bulletSpeed + 3; // 약간의 곡사
          spawnShell(enemy.x - 1.5, enemy.y + 1.2, vx, vy, false, enemy.type === 'boss' ? 35 : 18);
        }

        // HP 스프라이트 업데이트
        const pct = Math.max(0, enemy.hp / enemy.maxHp);
        enemy.hpBarMesh.scale.x = 3 * pct;
      });

      // 웨이브 클리어 체크
      if (livingEnemies === 0 && !state.ended) {
        if (state.wave < 3) {
          state.wave++;
          setWave(state.wave);
          spawnWave(state.wave);
        } else {
          // 게임 승리!
          state.ended = true;
          setIsGameWon(true);
          playSound('win');
          const finalScore = state.kills * 100 + state.hp * 2;
          const duration = Math.floor((Date.now() - state.startTime) / 1000);
          const res = calculateAndDepositMissionReward({
            gameId: 'hills-of-steel',
            gameTitle: '강철의 언덕 3D (Hills of Steel)',
            isVictory: true,
            score: finalScore,
            maxTargetScore: 800,
            durationSeconds: duration,
          });
          setRewardResult(res);
        }
      }

      // 포탄 업데이트
      for (let i = state.shells.length - 1; i >= 0; i--) {
        const shell = state.shells[i];
        shell.vy -= 16 * dt; // 중력 가속도
        shell.x += shell.vx * dt;
        shell.y += shell.vy * dt;
        shell.life -= dt;
        shell.mesh.position.set(shell.x, shell.y, 0);

        const groundY = getHillY(shell.x);
        let hit = false;

        // 지면 충돌
        if (shell.y <= groundY) {
          hit = true;
          spawnExplosion(shell.x, groundY, 0, 8, 0x8d6e63);
        }

        // 플레이어 포탄 -> 적 충돌 판정
        if (shell.isPlayer && !hit) {
          for (const enemy of state.enemies) {
            if (!enemy.isAlive) continue;
            const hitboxR = enemy.type === 'boss' ? 3.2 : enemy.type === 'heli' ? 2.5 : 2.0;
            if (Math.hypot(shell.x - enemy.x, shell.y - (enemy.type === 'heli' ? enemy.y : enemy.y + 1)) < hitboxR) {
              enemy.hp -= shell.damage;
              hit = true;
              spawnExplosion(enemy.x, enemy.y + 1, 0, 12, 0xff5722);
              playSound('hit');

              if (enemy.hp <= 0) {
                enemy.isAlive = false;
                scene.remove(enemy.mesh);
                spawnExplosion(enemy.x, enemy.y + 1, 0, 30, 0xff1744);
                state.kills++;
                setKills(state.kills);
              }
              break;
            }
          }
        }

        // 적 포탄 -> 플레이어 충돌 판정
        if (!shell.isPlayer && !hit) {
          if (Math.hypot(shell.x - state.playerX, shell.y - (state.playerY + 1)) < 2.2) {
            state.hp -= shell.damage;
            setPlayerHp(Math.max(0, state.hp));
            hit = true;
            spawnExplosion(state.playerX, state.playerY + 1, 0, 14, 0xff3d00);
            playSound('hit');

            if (state.hp <= 0 && !state.ended) {
              state.ended = true;
              setIsGameOver(true);
              playSound('lose');
              const finalScore = state.kills * 100;
              const duration = Math.floor((Date.now() - state.startTime) / 1000);
              const res = calculateAndDepositMissionReward({
                gameId: 'hills-of-steel',
                gameTitle: '강철의 언덕 3D (Hills of Steel)',
                isVictory: false,
                score: finalScore,
                maxTargetScore: 800,
                durationSeconds: duration,
              });
              setRewardResult(res);
            }
          }
        }

        // 제거
        if (hit || shell.life <= 0) {
          scene.remove(shell.mesh);
          state.shells.splice(i, 1);
        }
      }

      // 파티클 업데이트
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.vy -= 12 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.life -= dt;
        const scale = Math.max(0.01, p.life / p.maxLife);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life <= 0) {
          scene.remove(p.mesh);
          state.particles.splice(i, 1);
        }
      }

      // 카메라 팔로우 & 화면 셰이크
      const targetCamX = state.playerX + 6;
      const targetCamY = state.playerY + 7;
      camera.position.x += (targetCamX - camera.position.x) * Math.min(dt * 4, 1);
      camera.position.y += (targetCamY - camera.position.y) * Math.min(dt * 4, 1);

      if (state.shake > 0) {
        camera.position.x += (Math.random() - 0.5) * state.shake * 2.5;
        camera.position.y += (Math.random() - 0.5) * state.shake * 2.5;
        state.shake -= dt * 1.5;
      }
      camera.lookAt(state.playerX + 4, state.playerY + 2, 0);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cardId, playSound]);

  // 재도전 핸들러
  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#c7f2d6] font-mono">
      {/* 3D WebGL 캔버스 컨테이너 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="HILLS OF STEEL 3D"
        onQuit={handleExit}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 bg-black/40 text-white rounded border border-white/20 active:scale-95"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        }
      />

      {/* 상단 상태 바 (체력, 웨이브, 격파수) */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* 플레이어 탱크 HP 게이지 */}
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-cyan-500/40 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <div className="w-28 sm:w-40 bg-zinc-800 h-3 rounded-full overflow-hidden border border-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-150"
              style={{ width: `${Math.max(0, (playerHp / maxPlayerHp) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-cyan-300 font-bold">{Math.max(0, playerHp)} HP</span>
        </div>

        {/* 웨이브 및 격파수 */}
        <div className="flex items-center gap-2">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-amber-500/40 text-xs font-bold text-amber-300">
            WAVE {wave} / 3
          </div>
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-red-500/40 text-xs font-bold text-red-300">
            KILLS: {kills}
          </div>
        </div>
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 패널 */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        {/* 좌측: 전진/후진 스로틀 조향 패드 (터치 영역 64px) */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onTouchStart={() => {
              inputRef.current.throttle = -1;
              if (navigator.vibrate) navigator.vibrate(20);
            }}
            onTouchEnd={() => {
              inputRef.current.throttle = 0;
            }}
            onMouseDown={() => {
              inputRef.current.throttle = -1;
            }}
            onMouseUp={() => {
              inputRef.current.throttle = 0;
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-black/60 backdrop-blur-md border-2 border-white/40 text-white rounded-lg active:scale-95 active:bg-blue-600 flex flex-col items-center justify-center font-bold"
          >
            <span className="text-xl">◀</span>
            <span className="text-[10px] text-zinc-400">후진</span>
          </button>

          <button
            onTouchStart={() => {
              inputRef.current.throttle = 1;
              if (navigator.vibrate) navigator.vibrate(20);
            }}
            onTouchEnd={() => {
              inputRef.current.throttle = 0;
            }}
            onMouseDown={() => {
              inputRef.current.throttle = 1;
            }}
            onMouseUp={() => {
              inputRef.current.throttle = 0;
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-black/60 backdrop-blur-md border-2 border-white/40 text-white rounded-lg active:scale-95 active:bg-blue-600 flex flex-col items-center justify-center font-bold"
          >
            <span className="text-xl">▶</span>
            <span className="text-[10px] text-zinc-400">전진</span>
          </button>
        </div>

        {/* 우측: 3대 액션 버튼군 (공중폭격, 부스트, 76px 주포사격) */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* 공중 폭격 (AIRSTRIKE - 64px) */}
          <button
            onClick={() => {
              if (airstrikeCd <= 0) {
                inputRef.current.airstrikeRequested = true;
                if (navigator.vibrate) navigator.vibrate(40);
              }
            }}
            disabled={airstrikeCd > 0}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-xs active:scale-95 ${
              airstrikeCd <= 0
                ? 'bg-amber-600/80 border-amber-400 text-white active:bg-amber-500 shadow-lg shadow-amber-500/30'
                : 'bg-zinc-800/80 border-zinc-600 text-zinc-500 opacity-60'
            }`}
          >
            <Plane className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">{airstrikeCd <= 0 ? '폭격' : `${Math.ceil(airstrikeCd)}s`}</span>
          </button>

          {/* 부스트 돌진 (BOOST - 64px) */}
          <button
            onClick={() => {
              if (boostCd <= 0) {
                inputRef.current.boostRequested = true;
                if (navigator.vibrate) navigator.vibrate(40);
              }
            }}
            disabled={boostCd > 0}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-xs active:scale-95 ${
              boostCd <= 0
                ? 'bg-cyan-600/80 border-cyan-400 text-white active:bg-cyan-500 shadow-lg shadow-cyan-500/30'
                : 'bg-zinc-800/80 border-zinc-600 text-zinc-500 opacity-60'
            }`}
          >
            <Zap className="w-5 h-5 mb-0.5" />
            <span className="text-[9px]">{boostCd <= 0 ? '부스트' : `${Math.ceil(boostCd)}s`}</span>
          </button>

          {/* 대포 발사 (CANNON FIRE - 76px 메인 버튼) */}
          <button
            onClick={() => {
              if (cannonCd <= 0) {
                inputRef.current.fireRequested = true;
                if (navigator.vibrate) navigator.vibrate(30);
              }
            }}
            disabled={cannonCd > 0}
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full border-3 flex flex-col items-center justify-center font-black active:scale-90 ${
              cannonCd <= 0
                ? 'bg-red-600 border-red-300 text-white shadow-xl shadow-red-600/50 active:bg-red-500'
                : 'bg-zinc-800 border-zinc-600 text-zinc-500 opacity-70'
            }`}
          >
            <Crosshair className="w-7 h-7 animate-pulse" />
            <span className="text-[11px] tracking-wider mt-0.5">{cannonCd <= 0 ? 'FIRE' : `${cannonCd.toFixed(1)}`}</span>
          </button>
        </div>
      </div>

      {/* 게임 패배 모달 */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="text-3xl font-black text-red-500 mb-2">전차 격침 (DEFEAT)</div>
          <p className="text-zinc-400 text-xs mb-4">적 전차의 집중 포화에 플레이어 탱크가 파괴되었습니다.</p>
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-sm w-full max-w-xs mb-6 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">도달 웨이브:</span>
              <span className="font-bold text-white">{wave} / 3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">적 격파 수:</span>
              <span className="font-bold text-red-400">{kills}대</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-sm border border-red-400 active:scale-95 flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-4 h-4" /> 다시 도전
            </button>
            <button
              onClick={handleExit}
              className="px-5 py-2.5 bg-zinc-800 text-zinc-300 font-bold rounded-sm border border-zinc-600 active:scale-95 text-xs"
            >
              나가기
            </button>
          </div>
        </div>
      )}

      {/* 승리 보상 모달 */}
      {isGameWon && rewardResult && (
        <VictoryRewardModal
          isOpen={isGameWon}
          onClose={handleExit}
          reward={rewardResult}
          gameTitle="강철의 언덕 3D (Hills of Steel)"
        />
      )}
    </div>
  );
}
