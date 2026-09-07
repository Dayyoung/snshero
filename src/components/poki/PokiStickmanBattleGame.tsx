import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../../types';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal, TutorialStep } from '../UniversalTutorialModal';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';

interface PokiStickmanBattleGameProps {
  deck?: CardData[];
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  handleExit?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number | string;
  onReward?: (amount: number) => void;
}

type WeaponType = 'blade' | 'axe' | 'blaster';

interface EnemyFighter {
  id: number;
  name: string;
  type: 'knife' | 'axe' | 'blaster' | 'boss';
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  attackCooldown: number;
  hitBlink: number;
  isAlive: boolean;
  charId: number;
  color: number;
}

interface Projectile {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  isPlayer: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

export const PokiStickmanBattleGame: React.FC<PokiStickmanBattleGameProps> = ({
  deck = [],
  language = 'ko',
  lowSpecMode = false,
  playSfx,
  onExit,
  onBack,
  onClose,
  cardId,
  onReward,
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const isKo = language === 'ko';
  const playerHeroId = (cardId ? Number(cardId) : deck[0]?.id) || 15;
  const containerRef = useRef<HTMLDivElement>(null);
  const heroSpriteCanvasRef = useRef<HTMLCanvasElement>(null);

  // 게임 상태
  const [score, setScore] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [defeatedCount, setDefeatedCount] = useState<number>(0);
  const targetDefeats = 5;
  const [weapon, setWeapon] = useState<WeaponType>('blade');
  const [dashReady, setDashReady] = useState<boolean>(true);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  // 튜토리얼
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_stickman_battle') !== 'true';
    } catch {
      return true;
    }
  });

  // 조이스틱 상태
  const [joystick, setJoystick] = useState<{ active: boolean; startX: number; startY: number; curX: number; curY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    curX: 0,
    curY: 0,
  });

  // 물리/시뮬레이션 Ref
  const stateRef = useRef({
    player: {
      pos: new THREE.Vector3(0, 0, 4),
      vel: new THREE.Vector3(0, 0, 0),
      facingAngle: -Math.PI / 2, // 전방(-Z)
      hp: 100,
      invulnerableTimer: 0,
      attackTimer: 0,
      dashTimer: 0,
      weapon: 'blade' as WeaponType,
    },
    enemies: [] as EnemyFighter[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    wave: 1,
    defeated: 0,
    keys: { w: false, a: false, s: false, d: false, attack: false, dash: false },
    touchDir: { x: 0, y: 0 },
    isInitialized: false,
  });

  // 영웅 카드 스프라이트 페이스 캐싱
  useEffect(() => {
    if (!heroSpriteCanvasRef.current) return;
    const ctx = heroSpriteCanvasRef.current.getContext('2d');
    if (!ctx) return;
    drawCardSprite(ctx, playerHeroId, 0, 0, 64, 64);
  }, [playerHeroId]);

  // Three.js 씬 구축 & 게임 루프
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬, 카메라, 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c16);
    scene.fog = new THREE.FogExp2(0x0a0c16, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 20, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(15, 30, 15);
    dirLight.castShadow = !lowSpecMode;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -18;
    dirLight.shadow.camera.right = 18;
    dirLight.shadow.camera.top = 18;
    dirLight.shadow.camera.bottom = -18;
    scene.add(dirLight);

    const arenaPointLight = new THREE.PointLight(0x00f3ff, 2.0, 35);
    arenaPointLight.position.set(0, 10, 0);
    scene.add(arenaPointLight);

    // 1. 배틀 아레나 플랫폼 (반경 14m 견고한 원형/팔각형 플랫폼)
    const arenaRadius = 14;
    const arenaGeo = new THREE.CylinderGeometry(arenaRadius, arenaRadius + 1, 2, 32);
    const arenaMat = new THREE.MeshStandardMaterial({
      color: 0x181e2e,
      roughness: 0.4,
      metalness: 0.8,
    });
    const arenaMesh = new THREE.Mesh(arenaGeo, arenaMat);
    arenaMesh.position.y = -1;
    arenaMesh.receiveShadow = !lowSpecMode;
    scene.add(arenaMesh);

    // 아레나 내부 링 텍스처 / 네온 림
    const rimGeo = new THREE.TorusGeometry(arenaRadius - 0.2, 0.25, 16, 64);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.05;
    scene.add(rimMesh);

    const innerRimGeo = new THREE.TorusGeometry(6, 0.15, 16, 48);
    const innerRimMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const innerRim = new THREE.Mesh(innerRimGeo, innerRimMat);
    innerRim.rotation.x = Math.PI / 2;
    innerRim.position.y = 0.05;
    scene.add(innerRim);

    // 아레나 외곽 4개 에너지 펜스 기둥
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 4, 16);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.9, roughness: 0.2 });
    const pillarAngles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
    pillarAngles.forEach((ang) => {
      const pMesh = new THREE.Mesh(pillarGeo, pillarMat);
      pMesh.position.set(Math.cos(ang) * (arenaRadius - 1), 2, Math.sin(ang) * (arenaRadius - 1));
      pMesh.castShadow = !lowSpecMode;
      scene.add(pMesh);

      const lightOrb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
      lightOrb.position.set(pMesh.position.x, 4.2, pMesh.position.z);
      scene.add(lightOrb);
    });

    // 2. 스틱맨 캐릭터 생성 헬퍼 함수
    const createStickmanMesh = (color: number, isPlayer: boolean = false) => {
      const group = new THREE.Group();

      // 머리
      const headGeo = new THREE.SphereGeometry(0.55, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 2.4;
      head.castShadow = !lowSpecMode;
      group.add(head);

      // 카드 페이스 또는 바이저
      if (isPlayer) {
        const visorGeo = new THREE.BoxGeometry(0.5, 0.2, 0.3);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 2.4, -0.45);
        group.add(visor);
      } else {
        const eyeGeo = new THREE.BoxGeometry(0.4, 0.15, 0.2);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 2.4, -0.45);
        group.add(eye);
      }

      // 몸통
      const bodyGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.2, 12);
      const bodyMat = new THREE.MeshStandardMaterial({ color: isPlayer ? 0x1e3a8a : 0x332222, roughness: 0.4 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.4;
      body.castShadow = !lowSpecMode;
      group.add(body);

      // 팔/무기 피봇
      const rightArmGroup = new THREE.Group();
      rightArmGroup.name = 'rightArm';
      rightArmGroup.position.set(0.5, 1.7, 0);

      const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8);
      const armMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.position.y = -0.4;
      arm.castShadow = !lowSpecMode;
      rightArmGroup.add(arm);

      // 무기 메쉬 홀더
      const weaponMount = new THREE.Group();
      weaponMount.name = 'weaponMount';
      weaponMount.position.set(0, -0.8, -0.2);
      rightArmGroup.add(weaponMount);
      group.add(rightArmGroup);

      // 왼팔
      const leftArm = new THREE.Mesh(armGeo, armMat);
      leftArm.position.set(-0.5, 1.3, 0);
      leftArm.rotation.z = 0.2;
      group.add(leftArm);

      // 다리
      const legGeo = new THREE.CylinderGeometry(0.14, 0.12, 1.0, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });

      const rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.name = 'rightLeg';
      rightLeg.position.set(0.25, 0.5, 0);
      group.add(rightLeg);

      const leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.name = 'leftLeg';
      leftLeg.position.set(-0.25, 0.5, 0);
      group.add(leftLeg);

      return group;
    };

    // 무기 부착 함수
    const attachWeapon = (stickmanGroup: THREE.Group, type: WeaponType | 'knife') => {
      const rightArm = stickmanGroup.getObjectByName('rightArm') as THREE.Group;
      if (!rightArm) return;
      const mount = rightArm.getObjectByName('weaponMount') as THREE.Group;
      if (!mount) return;

      // 이전 무기 제거
      while (mount.children.length > 0) {
        mount.remove(mount.children[0]);
      }

      if (type === 'blade') {
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        hilt.rotation.x = Math.PI / 2;
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 1.8), new THREE.MeshBasicMaterial({ color: 0x00f3ff }));
        beam.position.z = -1.0;
        beam.rotation.x = Math.PI / 2;
        mount.add(hilt);
        mount.add(beam);
      } else if (type === 'axe') {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4), new THREE.MeshStandardMaterial({ color: 0x5a3d28 }));
        handle.rotation.x = Math.PI / 2;
        const bladeGeo = new THREE.BoxGeometry(0.1, 0.9, 0.7);
        const blade = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0xff3b30, metalness: 0.8 }));
        blade.position.z = -0.7;
        blade.position.y = 0.2;
        mount.add(handle);
        mount.add(blade);
      } else if (type === 'blaster') {
        const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.9), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 }));
        gunBody.position.z = -0.4;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5), new THREE.MeshBasicMaterial({ color: 0xd946ef }));
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.9;
        mount.add(gunBody);
        mount.add(barrel);
      } else if (type === 'knife') {
        const knife = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.9), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 }));
        knife.rotation.x = Math.PI / 2;
        knife.position.z = -0.4;
        mount.add(knife);
      }
    };

    // 플레이어 메쉬 생성 및 무기 장착
    const playerMesh = createStickmanMesh(0x38bdf8, true);
    playerMesh.position.set(0, 0, 4);
    scene.add(playerMesh);
    attachWeapon(playerMesh, 'blade');

    // 파티클 생성 함수
    const spawnSparks = (pos: THREE.Vector3, color: number, count: number = 8) => {
      for (let i = 0; i < (lowSpecMode ? count / 2 : count); i++) {
        const pMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          new THREE.MeshBasicMaterial({ color })
        );
        pMesh.position.copy(pos);
        scene.add(pMesh);
        stateRef.current.particles.push({
          mesh: pMesh,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 6 + 2,
            (Math.random() - 0.5) * 8
          ),
          life: 0.4 + Math.random() * 0.3,
        });
      }
    };

    // 적 스폰 함수
    const enemyTypes: { name: string; type: 'knife' | 'axe' | 'blaster' | 'boss'; hp: number; color: number; charId: number }[] = [
      { name: 'Ninja Stickman', type: 'knife', hp: 35, color: 0xef4444, charId: 102 },
      { name: 'Twin Blade Stick', type: 'knife', hp: 45, color: 0xf97316, charId: 106 },
      { name: 'Axe Berserker', type: 'axe', hp: 70, color: 0xec4899, charId: 111 },
      { name: 'Plasma Gunner', type: 'blaster', hp: 55, color: 0xa855f7, charId: 117 },
      { name: 'Shadow Champion BOSS', type: 'boss', hp: 120, color: 0x6366f1, charId: 125 },
    ];

    const spawnEnemy = (idx: number) => {
      const cfg = enemyTypes[idx % enemyTypes.length];
      const mesh = createStickmanMesh(cfg.color, false);

      if (cfg.type === 'boss') {
        mesh.scale.set(1.4, 1.4, 1.4);
      }

      // 아레나 반대편에 스폰
      const angle = Math.random() * Math.PI * 2;
      const dist = 7 + Math.random() * 4;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      mesh.position.set(x, 0, z);
      scene.add(mesh);
      attachWeapon(mesh, cfg.type === 'boss' ? 'axe' : (cfg.type as any));

      const enemy: EnemyFighter = {
        id: Date.now() + Math.random(),
        name: cfg.name,
        type: cfg.type,
        mesh,
        hp: cfg.hp,
        maxHp: cfg.hp,
        pos: new THREE.Vector3(x, 0, z),
        vel: new THREE.Vector3(0, 0, 0),
        attackCooldown: 1.0,
        hitBlink: 0,
        isAlive: true,
        charId: cfg.charId,
        color: cfg.color,
      };

      stateRef.current.enemies.push(enemy);
    };

    // 초기 적 1마리 스폰
    spawnEnemy(0);

    // 키보드 이벤트
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') stateRef.current.keys.w = true;
      if (k === 's' || k === 'arrowdown') stateRef.current.keys.s = true;
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = true;
      if (k === ' ' || k === 'j') executeAttack();
      if (k === 'k' || k === 'shift') executeDash();
      if (k === 'l' || k === 'q') swapWeapon();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') stateRef.current.keys.w = false;
      if (k === 's' || k === 'arrowdown') stateRef.current.keys.s = false;
      if (k === 'a' || k === 'arrowleft') stateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') stateRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 리사이즈 핸들러
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // 애니메이션 루프 변수
    let lastTime = performance.now();
    let animId = 0;

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const pState = stateRef.current.player;

      // 1. 플레이어 입력 및 이동 (화면 기준 좌우/상하 100% 일치)
      // 화면 오른쪽: +X, 화면 왼쪽: -X, 화면 위(전방): -Z, 화면 아래(후방): +Z
      let moveX = 0;
      let moveZ = 0;

      if (stateRef.current.keys.a) moveX -= 1;
      if (stateRef.current.keys.d) moveX += 1;
      if (stateRef.current.keys.w) moveZ -= 1;
      if (stateRef.current.keys.s) moveZ += 1;

      // 모바일 조이스틱 합성
      if (stateRef.current.touchDir.x !== 0 || stateRef.current.touchDir.y !== 0) {
        moveX += stateRef.current.touchDir.x;
        moveZ += stateRef.current.touchDir.y;
      }

      const len = Math.hypot(moveX, moveZ);
      const speed = pState.dashTimer > 0 ? 18 : 8;

      if (len > 0.05) {
        const normX = moveX / len;
        const normZ = moveZ / len;
        pState.vel.x = normX * speed;
        pState.vel.z = normZ * speed;
        pState.facingAngle = Math.atan2(normX, -normZ); // -Z가 전방
      } else {
        pState.vel.x *= 0.8;
        pState.vel.z *= 0.8;
      }

      // 대시 및 무적 타이머 갱신
      if (pState.dashTimer > 0) pState.dashTimer -= dt;
      if (pState.invulnerableTimer > 0) pState.invulnerableTimer -= dt;
      if (pState.attackTimer > 0) pState.attackTimer -= dt;

      // 위치 갱신
      pState.pos.x += pState.vel.x * dt;
      pState.pos.z += pState.vel.z * dt;

      // 아레나 바닥 검사 및 낙하 판정
      const distFromCenter = Math.hypot(pState.pos.x, pState.pos.z);
      if (distFromCenter > arenaRadius) {
        pState.pos.y -= 15 * dt; // 심연으로 낙하
        if (pState.pos.y < -5 && !isGameOver) {
          pState.hp = 0;
          setPlayerHp(0);
          handleGameOver(false);
        }
      } else {
        pState.pos.y = 0;
      }

      // 플레이어 메쉬 동기화
      playerMesh.position.copy(pState.pos);
      playerMesh.rotation.y = pState.facingAngle;

      // 피격 무적 점멸
      playerMesh.visible = pState.invulnerableTimer > 0 ? Math.floor(time / 80) % 2 === 0 : true;

      // 팔 애니메이션 (공격 중일 때 회전)
      const playerArm = playerMesh.getObjectByName('rightArm') as THREE.Group;
      if (playerArm) {
        if (pState.attackTimer > 0) {
          playerArm.rotation.x = -Math.PI / 2 + Math.sin(pState.attackTimer * 15) * 1.5;
        } else {
          playerArm.rotation.x = 0;
        }
      }

      // 다리 걷기 애니메이션
      const pRightLeg = playerMesh.getObjectByName('rightLeg') as THREE.Mesh;
      const pLeftLeg = playerMesh.getObjectByName('leftLeg') as THREE.Mesh;
      if (len > 0.1 && pRightLeg && pLeftLeg) {
        pRightLeg.rotation.x = Math.sin(time * 0.012) * 0.6;
        pLeftLeg.rotation.x = -Math.sin(time * 0.012) * 0.6;
      } else if (pRightLeg && pLeftLeg) {
        pRightLeg.rotation.x = 0;
        pLeftLeg.rotation.x = 0;
      }

      // 카메라 부드러운 플레이어 트래킹
      camera.position.x += (pState.pos.x - camera.position.x) * 0.08;
      camera.position.z += (pState.pos.z + 20 - camera.position.z) * 0.08;
      camera.lookAt(pState.pos.x, 0, pState.pos.z);

      // 2. 적 AI 업데이트
      stateRef.current.enemies.forEach((enemy) => {
        if (!enemy.isAlive) return;

        const toPlayer = new THREE.Vector3().subVectors(pState.pos, enemy.pos);
        const dist = toPlayer.length();

        // 넉백 감쇠
        enemy.vel.x *= 0.88;
        enemy.vel.z *= 0.88;

        // 이동 AI
        const enemySpeed = enemy.type === 'boss' ? 4.5 : enemy.type === 'knife' ? 5.5 : 4.0;
        if (dist > 1.8 && enemy.attackCooldown <= 0.4) {
          toPlayer.normalize();
          enemy.vel.x += toPlayer.x * enemySpeed * dt * 5;
          enemy.vel.z += toPlayer.z * enemySpeed * dt * 5;
        }

        enemy.pos.x += enemy.vel.x * dt;
        enemy.pos.z += enemy.vel.z * dt;

        // 아레나 외곽 낙하 검사 (적 링아웃!)
        const eDistFromCenter = Math.hypot(enemy.pos.x, enemy.pos.z);
        if (eDistFromCenter > arenaRadius) {
          enemy.pos.y -= 15 * dt;
          if (enemy.pos.y < -5) {
            killEnemy(enemy, true);
            return;
          }
        } else {
          enemy.pos.y = 0;
        }

        // 메쉬 위치 & 방향
        enemy.mesh.position.copy(enemy.pos);
        if (dist > 0.2) {
          enemy.mesh.rotation.y = Math.atan2(toPlayer.x, -toPlayer.z);
        }

        // 피격 점멸
        if (enemy.hitBlink > 0) {
          enemy.hitBlink -= dt;
          enemy.mesh.visible = Math.floor(time / 60) % 2 === 0;
        } else {
          enemy.mesh.visible = true;
        }

        // 적 공격 처리
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0 && dist < 2.4 && pState.hp > 0 && pState.pos.y >= -0.5) {
          enemy.attackCooldown = enemy.type === 'boss' ? 1.0 : 1.4;
          // 공격 실행
          if (pState.invulnerableTimer <= 0 && pState.dashTimer <= 0) {
            const damage = enemy.type === 'boss' ? 22 : 12;
            pState.hp = Math.max(0, pState.hp - damage);
            pState.invulnerableTimer = 0.8;
            setPlayerHp(pState.hp);
            spawnSparks(pState.pos, 0xff0044, 12);
            if (navigator.vibrate) navigator.vibrate(80);

            // 넉백
            const knockDir = new THREE.Vector3().subVectors(pState.pos, enemy.pos).normalize();
            pState.vel.addScaledVector(knockDir, 8);

            if (pState.hp <= 0) {
              handleGameOver(false);
            }
          }
        }
      });

      // 3. 투사체 (블래스터 탄환) 업데이트
      for (let i = stateRef.current.projectiles.length - 1; i >= 0; i--) {
        const proj = stateRef.current.projectiles[i];
        proj.pos.addScaledVector(proj.vel, dt);
        proj.mesh.position.copy(proj.pos);
        proj.life -= dt;

        // 충돌 검사
        if (proj.isPlayer) {
          // 플레이어 탄환 -> 적 타격
          for (const enemy of stateRef.current.enemies) {
            if (!enemy.isAlive) continue;
            if (proj.pos.distanceTo(enemy.pos) < 1.2) {
              hitEnemy(enemy, 25, proj.vel.clone().normalize().multiplyScalar(10));
              proj.life = 0;
              break;
            }
          }
        }

        if (proj.life <= 0) {
          scene.remove(proj.mesh);
          stateRef.current.projectiles.splice(i, 1);
        }
      }

      // 4. 파티클 업데이트
      for (let i = stateRef.current.particles.length - 1; i >= 0; i--) {
        const p = stateRef.current.particles[i];
        p.vel.y -= 9.8 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        p.mesh.scale.multiplyScalar(0.92);

        if (p.life <= 0) {
          scene.remove(p.mesh);
          stateRef.current.particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(loop);

    // 적 피격 함수
    const hitEnemy = (enemy: EnemyFighter, damage: number, knockback: THREE.Vector3) => {
      enemy.hp -= damage;
      enemy.hitBlink = 0.3;
      enemy.vel.add(knockback);
      spawnSparks(enemy.pos, 0xffbb00, 14);
      if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      if (navigator.vibrate) navigator.vibrate(40);

      setScore((s) => s + damage * 10);

      if (enemy.hp <= 0) {
        killEnemy(enemy, false);
      }
    };

    // 적 처치 함수
    const killEnemy = (enemy: EnemyFighter, isRingOut: boolean) => {
      if (!enemy.isAlive) return;
      enemy.isAlive = false;
      scene.remove(enemy.mesh);
      spawnSparks(enemy.pos, enemy.color, 24);

      setScore((s) => s + (isRingOut ? 500 : 300));
      stateRef.current.defeated += 1;
      const curDefeated = stateRef.current.defeated;
      setDefeatedCount(curDefeated);

      if (curDefeated >= targetDefeats) {
        handleGameOver(true);
      } else {
        // 다음 적 스폰 (약 1초 후)
        setTimeout(() => {
          if (!isGameOver && !isVictory) {
            spawnEnemy(curDefeated);
          }
        }, 800);
      }
    };

    // 공격 실행 함수
    const executeAttack = () => {
      const pState = stateRef.current.player;
      if (pState.attackTimer > 0 || pState.hp <= 0) return;
      pState.attackTimer = 0.25;

      if (navigator.vibrate) navigator.vibrate(30);

      const fAngle = pState.facingAngle;
      const forward = new THREE.Vector3(Math.sin(fAngle), 0, -Math.cos(fAngle));

      if (pState.weapon === 'blade') {
        // 에너지 블레이드: 전방 부채꼴 3m 범위 타격
        stateRef.current.enemies.forEach((enemy) => {
          if (!enemy.isAlive) return;
          const diff = new THREE.Vector3().subVectors(enemy.pos, pState.pos);
          const dist = diff.length();
          if (dist < 3.2) {
            const dir = diff.normalize();
            const dot = forward.dot(dir);
            if (dot > 0.4) {
              hitEnemy(enemy, 35, dir.multiplyScalar(9));
            }
          }
        });
      } else if (pState.weapon === 'axe') {
        // 거대 도끼: 360도 강력한 넉백 타격
        stateRef.current.enemies.forEach((enemy) => {
          if (!enemy.isAlive) return;
          const diff = new THREE.Vector3().subVectors(enemy.pos, pState.pos);
          const dist = diff.length();
          if (dist < 3.8) {
            const dir = diff.normalize();
            hitEnemy(enemy, 55, dir.multiplyScalar(15)); // 슈퍼 넉백으로 링아웃 유도!
          }
        });
      } else if (pState.weapon === 'blaster') {
        // 플라즈마 블래스터: 탄환 발사
        const projGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const projMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
        const projMesh = new THREE.Mesh(projGeo, projMat);
        const spawnPos = pState.pos.clone().add(forward.clone().multiplyScalar(1.2)).add(new THREE.Vector3(0, 1.4, 0));
        projMesh.position.copy(spawnPos);
        scene.add(projMesh);

        stateRef.current.projectiles.push({
          mesh: projMesh,
          pos: spawnPos,
          vel: forward.clone().multiplyScalar(22),
          life: 1.5,
          isPlayer: true,
        });
      }
    };

    // 대시 실행 함수
    const executeDash = () => {
      const pState = stateRef.current.player;
      if (pState.dashTimer > 0 || pState.hp <= 0) return;
      pState.dashTimer = 0.3;
      pState.invulnerableTimer = 0.45;
      setDashReady(false);
      setTimeout(() => setDashReady(true), 1200);

      spawnSparks(pState.pos, 0x00f3ff, 10);
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    };

    // 무기 교체 함수
    const swapWeapon = () => {
      const pState = stateRef.current.player;
      const weapons: WeaponType[] = ['blade', 'axe', 'blaster'];
      const nextIdx = (weapons.indexOf(pState.weapon) + 1) % weapons.length;
      const nextWp = weapons[nextIdx];
      pState.weapon = nextWp;
      setWeapon(nextWp);
      attachWeapon(playerMesh, nextWp);
      if (navigator.vibrate) navigator.vibrate(25);
    };

    // 승리 / 패배 처리
    const handleGameOver = (victory: boolean) => {
      if (victory) {
        setIsVictory(true);
        const receipt = calculateAndDepositMissionReward({
          gameId: 'poki_stickman_battle',
          gameTitle: 'Stickman Battle 3D',
          durationSeconds: 45,
          score: score + 1000,
          maxTargetScore: 2000,
          isVictory: true,
        });
        setSettlementReceipt(receipt);
        if (onReward) { onReward(receipt.totalSns); }
      } else {
        setIsGameOver(true);
        const receipt = calculateAndDepositMissionReward({
          gameId: 'poki_stickman_battle',
          gameTitle: 'Stickman Battle 3D',
          durationSeconds: 30,
          score: score,
          maxTargetScore: 2000,
          isVictory: false,
        });
        setSettlementReceipt(receipt);
        if (onReward) { onReward(receipt.totalSns); }
      }
    };

    // 이벤트 리스너 참조 보관
    (container as any).__executeAttack = executeAttack;
    (container as any).__executeDash = executeDash;
    (container as any).__swapWeapon = swapWeapon;

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playerHeroId, playSfx]);

  // 공격/대시/스왑 터치 핸들러
  const onAttackClick = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__executeAttack) {
      (containerRef.current as any).__executeAttack();
    }
  }, []);

  const onDashClick = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__executeDash) {
      (containerRef.current as any).__executeDash();
    }
  }, []);

  const onSwapClick = useCallback(() => {
    if (containerRef.current && (containerRef.current as any).__swapWeapon) {
      (containerRef.current as any).__swapWeapon();
    }
  }, []);

  // 터치 조이스틱 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // 화면 우측 조작 버튼 영역 제외 (좌측 65% 영역에서만 조이스틱 생성)
    if (touch.clientX > window.innerWidth * 0.65) return;

    setJoystick({
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      curX: touch.clientX,
      curY: touch.clientY,
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!joystick.active) return;
    const touch = (Array.from(e.touches) as React.Touch[]).find((t) => t.clientX < window.innerWidth * 0.7);
    if (!touch) return;

    const dx = touch.clientX - joystick.startX;
    const dy = touch.clientY - joystick.startY;
    const maxDist = 50;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    const cx = joystick.startX + Math.cos(angle) * clampedDist;
    const cy = joystick.startY + Math.sin(angle) * clampedDist;

    setJoystick((prev) => ({ ...prev, curX: cx, curY: cy }));

    // 카메라 기준 방향: 사용자 화면 오른쪽 = +X, 화면 위 = -Z
    stateRef.current.touchDir = {
      x: (dx / maxDist),
      y: (dy / maxDist),
    };
  }, [joystick.active, joystick.startX, joystick.startY]);

  const handleTouchEnd = useCallback(() => {
    setJoystick({ active: false, startX: 0, startY: 0, curX: 0, curY: 0 });
    stateRef.current.touchDir = { x: 0, y: 0 };
  }, []);

  // 튜토리얼 스텝
  const tutorialSteps: TutorialStep[] = [
    {
      title: isKo ? '스틱맨 배틀 3D 아레나' : 'Stickman Battle 3D Arena',
      badge: 'BATTLE 3D',
      description: isKo
        ? '하늘에 떠 있는 위험천만한 3D 서스펜션 아레나에서 적 스틱맨들과 물리 격투를 벌이세요!'
        : 'Fight ragdoll stickman enemies on a high-stakes floating 3D battle arena!',
      keyPoints: isKo
        ? ['좌측 화면 터치 드래그로 360° 자유 이동', '아레나 밖으로 적을 밀어내면 번지(Ring-out) 즉사 판정!']
        : ['Drag on left screen to move in 360°', 'Knock enemies off the arena for instant ring-out kills!'],
      iconType: 'GOAL',
    },
    {
      title: isKo ? '3대 무기 & 액션 시스템' : '3 Weapons & Combat Action',
      badge: 'WEAPONS',
      description: isKo
        ? '광선검, 거대 도끼, 플라즈마 블래스터를 상황에 맞게 교체하며 적을 제압하세요.'
        : 'Swap between Energy Blade, Battle Axe, and Plasma Blaster to crush your foes.',
      keyPoints: isKo
        ? ['[공격] 버튼으로 콤보 슬래시 & 원거리 사격', '[대시] 버튼으로 무적 회피', '[무기교체]로 자유로운 무기 스위칭']
        : ['[ATTACK] for combo slash & blast', '[DASH] for invulnerable evasion', '[SWAP] to switch weapons anytime'],
      iconType: 'GESTURES',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="Stickman Battle 3D"
        score={score}
        targetScore={2000}
        timeLeft={0}
        onQuit={handleExit}
        isKo={isKo}
        rewardUnit="SNS"
        customStatLabel={isKo ? '처치' : 'DEFEATS'}
        customStatValue={`${defeatedCount}/${targetDefeats}`}
      />

      {/* 플레이어 카드 스프라이트 & HP HUD 오버레이 */}
      <div className="absolute top-16 left-4 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 border border-cyan-500/40 rounded-none shadow-lg">
        <canvas ref={heroSpriteCanvasRef} width={44} height={44} className="w-11 h-11 border border-cyan-400 bg-slate-800" />
        <div className="flex flex-col">
          <div className="flex justify-between items-center text-xs text-cyan-300 font-bold gap-4">
            <span>HERO HP</span>
            <span>{playerHp}%</span>
          </div>
          <div className="w-28 h-2.5 bg-slate-700 mt-1 border border-slate-600">
            <div
              className={`h-full transition-all duration-200 ${
                playerHp > 50 ? 'bg-cyan-400' : playerHp > 20 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(0, playerHp)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 현재 무기 표시 배지 */}
      <div className="absolute top-16 right-4 z-20 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 border border-slate-700 text-xs font-bold text-slate-200">
        <span className="text-slate-400 mr-2">{isKo ? '장착 무기' : 'WEAPON'}:</span>
        <span className="text-cyan-300 uppercase font-black tracking-wider">
          {weapon === 'blade' ? '⚡ Energy Blade' : weapon === 'axe' ? '🪓 Battle Axe' : '🔫 Plasma Blaster'}
        </span>
      </div>

      {/* 모바일 다이나믹 플로팅 가상 조이스틱 링 & 놉 */}
      {joystick.active && (
        <div
          className="pointer-events-none absolute z-30"
          style={{
            left: joystick.startX - 45,
            top: joystick.startY - 45,
            width: 90,
            height: 90,
          }}
        >
          {/* 바깥 링 */}
          <div className="w-full h-full rounded-full border-2 border-cyan-400/60 bg-cyan-950/40 backdrop-blur-xs flex items-center justify-center animate-pulse" />
          {/* 안쪽 놉 */}
          <div
            className="absolute rounded-full w-8 h-8 bg-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.8)] border border-white"
            style={{
              left: 45 - 16 + (joystick.curX - joystick.startX),
              top: 45 - 16 + (joystick.curY - joystick.startY),
            }}
          />
        </div>
      )}

      {/* 모바일 퓨어 터치 우측 액션 버튼 컨트롤 패널 */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex gap-3 items-center">
          {/* 무기 교체 버튼 */}
          <button
            type="button"
            onClick={onSwapClick}
            className="w-[68px] h-[68px] rounded-sm bg-slate-800/90 border-2 border-purple-400 text-purple-200 font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-lg active:bg-purple-900/60 transition-transform"
          >
            <span className="text-lg">🔄</span>
            <span className="mt-0.5 text-[10px] tracking-tight">{isKo ? '무기교체' : 'SWAP'}</span>
          </button>

          {/* 대시/회피 버튼 */}
          <button
            type="button"
            onClick={onDashClick}
            disabled={!dashReady}
            className={`w-[68px] h-[68px] rounded-sm border-2 font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-lg transition-all ${
              dashReady
                ? 'bg-amber-950/80 border-amber-400 text-amber-200 active:bg-amber-600'
                : 'bg-slate-800/60 border-slate-600 text-slate-500 opacity-60'
            }`}
          >
            <span className="text-lg">⚡</span>
            <span className="mt-0.5 text-[10px] tracking-tight">{isKo ? '대시회피' : 'DASH'}</span>
          </button>
        </div>

        {/* 메인 공격 버튼 (80px 최적 터치 타깃) */}
        <button
          type="button"
          onClick={onAttackClick}
          className="w-20 h-20 rounded-sm bg-red-600 border-2 border-red-300 text-white font-black text-sm flex flex-col items-center justify-center active:scale-90 shadow-[0_0_20px_rgba(239,68,68,0.6)] active:bg-red-700 transition-transform"
        >
          <span className="text-2xl">⚔️</span>
          <span className="mt-0.5 tracking-wider font-extrabold">{isKo ? '공격' : 'ATTACK'}</span>
        </button>
      </div>

      {/* 좌측 하단 조작 가이드 라벨 */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:block text-slate-400 text-xs bg-slate-900/80 px-3 py-2 border border-slate-700">
        <div>[WASD / 터치드래그]: 360° 이동</div>
        <div>[Space / J / 공격]: 공격 및 발사</div>
        <div>[Shift / K / 대시]: 무적 대시 회피</div>
        <div>[Q / L / 교체]: 무기 교체 (검/도끼/총)</div>
      </div>

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          steps={tutorialSteps}
          onClose={() => {
            setShowTutorial(false);
            try {
              localStorage.setItem('hero_tutorial_stickman_battle', 'true');
            } catch {
              // ignore
            }
          }}
          isKo={isKo}
        />
      )}

      {/* 패배 모달 */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-red-500 p-6 max-w-sm w-full text-center">
            <h2 className="text-2xl font-black text-red-500 mb-2">{isKo ? '패배' : 'DEFEATED'}</h2>
            <p className="text-slate-300 text-sm mb-4">
              {isKo ? '스틱맨 아레나에서 쓰러졌습니다!' : 'You were knocked out of the stickman arena!'}
            </p>
            <div className="bg-slate-800 p-3 mb-4 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>{isKo ? '격파 수' : 'Defeated'}:</span>
                <span className="text-cyan-400 font-bold">{defeatedCount} / {targetDefeats}</span>
              </div>
              <div className="flex justify-between">
                <span>{isKo ? '최종 점수' : 'Final Score'}:</span>
                <span className="text-amber-400 font-bold">{score}</span>
              </div>
              {settlementReceipt && (
                <div className="flex justify-between text-cyan-300 pt-1 border-t border-slate-700">
                  <span>{isKo ? '지급 보상' : 'Reward'}:</span>
                  <span className="font-bold">+{settlementReceipt.totalSns} SNS</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleExit}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm border border-red-400 transition-colors"
            >
              {isKo ? '확인 및 나가기' : 'CONFIRM & EXIT'}
            </button>
          </div>
        </div>
      )}

      {/* 승리 모달 */}
      {isVictory && settlementReceipt && (
        <VictoryRewardModal
          isOpen={isVictory}
          receipt={settlementReceipt}
          onClaim={() => {
            setIsVictory(false);
            handleExit();
          }}
          isKo={isKo}
        />
      )}
    </div>
  );
};

export default PokiStickmanBattleGame;
