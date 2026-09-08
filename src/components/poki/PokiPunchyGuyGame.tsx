import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { UniversalTutorialModal } from '../UniversalTutorialModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiPunchyGuyGameProps {
  onBack: () => void;
  onExit?: () => void;
  cardId?: number;
  deck?: any;
  language?: string;
  lowSpecMode?: boolean;
  playSfx?: (type: string) => void;

  onClose?: () => void;
}

interface Fighter {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  headMesh: THREE.Mesh;
  leftGlove: THREE.Mesh;
  rightGlove: THREE.Mesh;
  pos: THREE.Vector3;
  rotY: number;
  hp: number;
  maxHp: number;
  isPunching: boolean;
  punchHand: 'left' | 'right';
  punchProgress: number;
  isUppercut: boolean;
  uppercutProgress: number;
  isWeaving: boolean;
  weaveTimer: number;
  isKnockedOut: boolean;
  koVel: THREE.Vector3;
  color: number;
}

const OPPONENTS = [
  { name: 'Rookie Green', color: 0x00cc66, maxHp: 80, punchSpeed: 1.8, punchPower: 12 },
  { name: 'Heavy Yellow', color: 0xffaa00, maxHp: 110, punchSpeed: 2.2, punchPower: 18 },
  { name: 'Iron Champ', color: 0x222222, maxHp: 140, punchSpeed: 2.6, punchPower: 22 },
];

export const PokiPunchyGuyGame: React.FC<PokiPunchyGuyGameProps> = ({
  onBack,
  onExit,
  cardId = 40,
  lowSpecMode = false,
  playSfx,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 게임 상태
  const [kos, setKos] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(80);
  const [enemyMaxHp, setEnemyMaxHp] = useState(80);
  const [enemyName, setEnemyName] = useState(OPPONENTS[0].name);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  // 모바일 터치 조이스틱 상태
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickDelta, setJoystickDelta] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);
  const inputDirRef = useRef({ x: 0, z: 0 });

  // 3D 씬 레퍼런스
  const gameLoopRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animId: 0,
    isGameOver: false,
    isGameWon: false,
    roundIdx: 0,
    koCount: 0,
    scoreVal: 0,
    player: null as Fighter | null,
    enemy: null as Fighter | null,
    particles: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    enemyAttackTimer: 1.5,
    enemyWindup: 0, // 공격 전조
    slowMoTimer: 0,
    ringBounds: 5.5,
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

  // 햅틱 피드백
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
      gameId: 'poki_punchy_guy',
      gameTitle: 'Punchy Guy 3D',
      isVictory,
      score: finalScore,
      maxTargetScore: 100,
      durationSeconds: 30,
    });
    setRewardResult(result);
  }, []);

  // 3D 파이터 생성 헬퍼
  const createFighter = (color: number, isPlayer: boolean): Fighter => {
    const group = new THREE.Group();

    // 몸통 (상체)
    const bodyGeo = new THREE.BoxGeometry(1.1, 1.4, 0.7);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x2266dd : color,
      roughness: 0.4,
      metalness: 0.1,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 1.3;
    bodyMesh.castShadow = !lowSpecMode;
    group.add(bodyMesh);

    // 머리
    const headGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0xffcc88 : 0xddbb77,
      roughness: 0.5,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 2.25;
    headMesh.castShadow = !lowSpecMode;
    group.add(headMesh);

    // 헤드기어
    const gearGeo = new THREE.TorusGeometry(0.44, 0.08, 8, 16);
    const gearMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0x0033aa : 0x111111,
    });
    const gearMesh = new THREE.Mesh(gearGeo, gearMat);
    gearMesh.rotation.x = Math.PI / 2;
    gearMesh.position.y = 2.25;
    group.add(gearMesh);

    // 복싱 글러브 (좌/우)
    const gloveGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const gloveMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0xee2222 : 0x222222,
      roughness: 0.3,
    });

    const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
    leftGlove.position.set(-0.7, 1.4, 0.6);
    leftGlove.castShadow = !lowSpecMode;
    group.add(leftGlove);

    const rightGlove = new THREE.Mesh(gloveGeo, gloveMat);
    rightGlove.position.set(0.7, 1.4, 0.6);
    rightGlove.castShadow = !lowSpecMode;
    group.add(rightGlove);

    // 다리/쇼츠
    const shortsGeo = new THREE.BoxGeometry(1.15, 0.7, 0.75);
    const shortsMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0xffffff : 0x333333,
    });
    const shorts = new THREE.Mesh(shortsGeo, shortsMat);
    shorts.position.y = 0.55;
    group.add(shorts);

    return {
      group,
      bodyMesh,
      headMesh,
      leftGlove,
      rightGlove,
      pos: new THREE.Vector3(0, 0, 0),
      rotY: 0,
      hp: 100,
      maxHp: 100,
      isPunching: false,
      punchHand: 'right',
      punchProgress: 0,
      isUppercut: false,
      uppercutProgress: 0,
      isWeaving: false,
      weaveTimer: 0,
      isKnockedOut: false,
      koVel: new THREE.Vector3(0, 0, 0),
      color,
    };
  };

  // Three.js 환경 구축
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe3dbfc);
    scene.fog = new THREE.FogExp2(0xe3dbfc, 0.035);
    gameLoopRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    camera.position.set(0, 5.2, 7.2);
    camera.lookAt(0, 1.6, 0);
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

    // 3. 링 조명 & 스포트라이트
    const ambientLight = new THREE.AmbientLight(0xdde5ff, 0.75);
    scene.add(ambientLight);

    const ringLight = new THREE.SpotLight(0xffffff, 2.8, 25, Math.PI / 3.5, 0.35);
    ringLight.position.set(0, 12, 0);
    ringLight.target.position.set(0, 0, 0);
    ringLight.castShadow = !lowSpecMode;
    scene.add(ringLight);
    scene.add(ringLight.target);

    // 4. 복싱 링 구축 (12m x 12m)
    const ringSize = 11.5;
    const canvasMat = new THREE.MeshStandardMaterial({
      color: 0x1b2845,
      roughness: 0.6,
      metalness: 0.1,
    });
    const canvasGeo = new THREE.BoxGeometry(ringSize, 0.6, ringSize);
    const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
    canvasMesh.position.y = -0.3;
    canvasMesh.receiveShadow = !lowSpecMode;
    scene.add(canvasMesh);

    // 링 중앙 원형 엠블럼
    const emblemGeo = new THREE.RingGeometry(1.8, 2.0, 32);
    const emblemMat = new THREE.MeshBasicMaterial({ color: 0xff3355, side: THREE.DoubleSide });
    const emblem = new THREE.Mesh(emblemGeo, emblemMat);
    emblem.rotation.x = -Math.PI / 2;
    emblem.position.y = 0.02;
    scene.add(emblem);

    // 코너 포스트 4개
    const postMat = new THREE.MeshStandardMaterial({ color: 0xdd2222, metalness: 0.7, roughness: 0.3 });
    const half = ringSize / 2 - 0.3;
    const postCoords = [
      [-half, -half],
      [half, -half],
      [-half, half],
      [half, half],
    ];

    postCoords.forEach(([px, pz]) => {
      const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.2, 16);
      const postMesh = new THREE.Mesh(postGeo, postMat);
      postMesh.position.set(px, 1.3, pz);
      postMesh.castShadow = !lowSpecMode;
      scene.add(postMesh);
    });

    // 3단 탄성 로프 라인
    const ropeHeights = [0.8, 1.4, 2.0];
    const ropeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    ropeHeights.forEach((ry) => {
      // 4개 면 로프
      const rLGeo = new THREE.BoxGeometry(ringSize - 0.6, 0.05, 0.05);
      const rN = new THREE.Mesh(rLGeo, ropeMat);
      rN.position.set(0, ry, -half);
      scene.add(rN);

      const rS = new THREE.Mesh(rLGeo, ropeMat);
      rS.position.set(0, ry, half);
      scene.add(rS);

      const rWGeo = new THREE.BoxGeometry(0.05, 0.05, ringSize - 0.6);
      const rW = new THREE.Mesh(rWGeo, ropeMat);
      rW.position.set(-half, ry, 0);
      scene.add(rW);

      const rE = new THREE.Mesh(rWGeo, ropeMat);
      rE.position.set(half, ry, 0);
      scene.add(rE);
    });

    // 5. 플레이어 생성 (링 남쪽에서 북쪽을 바라봄)
    const player = createFighter(0x2266dd, true);
    player.pos.set(0, 0, 2.8);
    player.group.position.copy(player.pos);
    scene.add(player.group);
    gameLoopRef.current.player = player;

    // 6. 1라운드 상대 생성 (링 북쪽에서 남쪽을 바라봄)
    const firstOpp = OPPONENTS[0];
    const enemy = createFighter(firstOpp.color, false);
    enemy.hp = firstOpp.maxHp;
    enemy.maxHp = firstOpp.maxHp;
    enemy.pos.set(0, 0, -1.8);
    enemy.group.position.copy(enemy.pos);
    enemy.group.rotation.y = Math.PI; // 플레이어를 마주봄
    scene.add(enemy.group);
    gameLoopRef.current.enemy = enemy;

    setEnemyHp(firstOpp.maxHp);
    setEnemyMaxHp(firstOpp.maxHp);
    setEnemyName(firstOpp.name);

    // 7. 리사이즈 핸들러
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

    // 8. 파티클 스파크 생성 헬퍼
    const spawnHitParticles = (pos: THREE.Vector3, color: number = 0xffcc00) => {
      for (let i = 0; i < 8; i++) {
        const pGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const pMat = new THREE.MeshBasicMaterial({ color });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        const pVel = new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          2 + Math.random() * 4,
          (Math.random() - 0.5) * 6
        );
        gameLoopRef.current.particles.push({ mesh: pMesh, vel: pVel, life: 0.45 });
      }
    };

    // 9. 메인 게임 루프
    let lastTime = performance.now();

    const animate = (now: number) => {
      gameLoopRef.current.animId = requestAnimationFrame(animate);
      let dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const g = gameLoopRef.current;
      const p = g.player;
      const e = g.enemy;

      if (!p || !e) return;

      // 슬로우 모션 관리 (카운터 펀치/KO 시)
      if (g.slowMoTimer > 0) {
        g.slowMoTimer -= dt;
        dt *= 0.35;
      }

      if (!g.isGameOver && !g.isGameWon) {
        // --- 플레이어 이동 제어 ---
        const moveSpeed = 6.2;
        const inX = inputDirRef.current.x;
        const inZ = inputDirRef.current.z;

        p.pos.x += inX * moveSpeed * dt;
        p.pos.z += inZ * moveSpeed * dt;

        // 링 경계선 클램핑
        const bounds = g.ringBounds;
        p.pos.x = Math.max(-bounds, Math.min(bounds, p.pos.x));
        p.pos.z = Math.max(-bounds, Math.min(bounds, p.pos.z));

        // 플레이어 메쉬 위치 갱신
        p.group.position.x = p.pos.x;
        p.group.position.z = p.pos.z;

        // 항상 상대를 바라봄
        const pAngleToEnemy = Math.atan2(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
        p.group.rotation.y = pAngleToEnemy;

        // --- 플레이어 펀치 애니메이션 & 판정 ---
        if (p.isPunching) {
          p.punchProgress += dt * 7.5;
          const ext = Math.sin(p.punchProgress * Math.PI) * 1.5;
          const targetGlove = p.punchHand === 'right' ? p.rightGlove : p.leftGlove;
          targetGlove.position.z = 0.6 + ext;

          // 적중 체크 (Progress 중간 시점)
          if (p.punchProgress >= 0.45 && p.punchProgress <= 0.65) {
            const dist = p.pos.distanceTo(e.pos);
            if (dist < 2.5 && !e.isKnockedOut) {
              const dmg = 18;
              e.hp = Math.max(0, e.hp - dmg);
              setEnemyHp(e.hp);
              g.scoreVal += dmg * 2;
              setScore(Math.floor(g.scoreVal));

              // 적 헤드 넉백
              e.headMesh.position.z = -0.3;
              spawnHitParticles(new THREE.Vector3(e.pos.x, 2.2, e.pos.z), 0xffcc00);
              triggerHaptic([30, 40]);
              if (playSfx) playSfx('hit');

              // KO 체크
              if (e.hp <= 0 && !e.isKnockedOut) {
                e.isKnockedOut = true;
                e.koVel.set(0, 8, -16);
                g.slowMoTimer = 0.8;
                triggerHaptic([60, 80, 150]);
              }
            }
          }

          if (p.punchProgress >= 1.0) {
            p.isPunching = false;
            p.punchProgress = 0;
            p.rightGlove.position.z = 0.6;
            p.leftGlove.position.z = 0.6;
          }
        }

        // --- 플레이어 어퍼컷 애니메이션 ---
        if (p.isUppercut) {
          p.uppercutProgress += dt * 6.0;
          const upExt = Math.sin(p.uppercutProgress * Math.PI) * 1.8;
          p.rightGlove.position.y = 1.4 + upExt;
          p.rightGlove.position.z = 0.6 + upExt * 0.7;

          if (p.uppercutProgress >= 0.45 && p.uppercutProgress <= 0.65) {
            const dist = p.pos.distanceTo(e.pos);
            if (dist < 2.4 && !e.isKnockedOut) {
              const dmg = 35;
              e.hp = Math.max(0, e.hp - dmg);
              setEnemyHp(e.hp);
              g.scoreVal += dmg * 3;
              setScore(Math.floor(g.scoreVal));

              // 강한 공중 넉백
              e.headMesh.position.y = 2.6;
              spawnHitParticles(new THREE.Vector3(e.pos.x, 2.4, e.pos.z), 0xff2244);
              triggerHaptic([50, 60, 90]);
              if (playSfx) playSfx('explosion');

              if (e.hp <= 0 && !e.isKnockedOut) {
                e.isKnockedOut = true;
                e.koVel.set(0, 12, -22);
                g.slowMoTimer = 1.2;
                triggerHaptic([80, 120, 200]);
              }
            }
          }

          if (p.uppercutProgress >= 1.0) {
            p.isUppercut = false;
            p.uppercutProgress = 0;
            p.rightGlove.position.y = 1.4;
            p.rightGlove.position.z = 0.6;
          }
        }

        // --- 플레이어 위빙(회피) 애니메이션 ---
        if (p.isWeaving) {
          p.weaveTimer -= dt;
          p.group.position.y = -0.45; // 숙이기
          p.group.rotation.z = Math.sin(p.weaveTimer * 12) * 0.35;
          if (p.weaveTimer <= 0) {
            p.isWeaving = false;
            p.group.position.y = 0;
            p.group.rotation.z = 0;
          }
        }

        // --- 적 AI 상태 머신 ---
        if (!e.isKnockedOut) {
          // 플레이어를 향해 거리 조절 스텝
          const distToPlayer = e.pos.distanceTo(p.pos);
          const enemyConfig = OPPONENTS[g.roundIdx] || OPPONENTS[0];

          if (distToPlayer > 2.2) {
            // 전진
            const stepDir = new THREE.Vector3().subVectors(p.pos, e.pos).normalize();
            e.pos.addScaledVector(stepDir, 2.5 * dt);
          } else if (distToPlayer < 1.4) {
            // 너무 가까우면 살짝 백스텝
            const stepDir = new THREE.Vector3().subVectors(e.pos, p.pos).normalize();
            e.pos.addScaledVector(stepDir, 1.8 * dt);
          }

          e.group.position.x = e.pos.x;
          e.group.position.z = e.pos.z;

          // 플레이어를 마주봄
          const eAngleToPlayer = Math.atan2(p.pos.x - e.pos.x, p.pos.z - e.pos.z);
          e.group.rotation.y = eAngleToPlayer;

          // 적 공격 타이머
          g.enemyAttackTimer -= dt;
          if (g.enemyAttackTimer <= 0 && !e.isPunching) {
            e.isPunching = true;
            e.punchProgress = 0;
            e.punchHand = Math.random() < 0.5 ? 'left' : 'right';
            g.enemyAttackTimer = enemyConfig.punchSpeed + Math.random() * 0.8;
          }

          // 적 펀치 애니메이션
          if (e.isPunching) {
            e.punchProgress += dt * 6.5;
            const ext = Math.sin(e.punchProgress * Math.PI) * 1.5;
            const targetGlove = e.punchHand === 'right' ? e.rightGlove : e.leftGlove;
            targetGlove.position.z = 0.6 + ext;

            // 플레이어 피격 체크
            if (e.punchProgress >= 0.45 && e.punchProgress <= 0.65) {
              if (distToPlayer < 2.4) {
                // 플레이어가 위빙 중이면 미스(회피 성공 카운터 찬스!)
                if (p.isWeaving) {
                  g.slowMoTimer = 0.35;
                  triggerHaptic(15);
                } else {
                  // 플레이어 피격
                  p.hp = Math.max(0, p.hp - enemyConfig.punchPower);
                  setPlayerHp(p.hp);
                  spawnHitParticles(new THREE.Vector3(p.pos.x, 2.2, p.pos.z), 0x0088ff);
                  triggerHaptic([40, 50]);
                  if (playSfx) playSfx('hit');

                  if (p.hp <= 0) {
                    g.isGameOver = true;
                    setGameOver(true);
                    triggerHaptic([60, 100, 150]);
                    handleClaimReward(false, g.scoreVal);
                    return;
                  }
                }
              }
            }

            if (e.punchProgress >= 1.0) {
              e.isPunching = false;
              e.punchProgress = 0;
              e.rightGlove.position.z = 0.6;
              e.leftGlove.position.z = 0.6;
            }
          }
        } else {
          // --- 적 KO 래그돌 넉아웃 물리 연출 ---
          e.pos.addScaledVector(e.koVel, dt);
          e.koVel.y -= 25 * dt; // 중력
          e.group.position.copy(e.pos);
          e.group.rotation.x += 8 * dt;
          e.group.rotation.z += 5 * dt;

          // 링 밖으로 날아가 사라짐 -> 다음 라운드 소환
          if (e.pos.y < -6.0) {
            g.koCount += 1;
            setKos(g.koCount);

            if (g.koCount >= 3) {
              // 3명 전원 격파 -> 최종 승리!
              g.isGameWon = true;
              setGameWon(true);
              triggerHaptic([50, 100, 150, 250]);
              handleClaimReward(true, g.scoreVal + 100);
              return;
            } else {
              // 다음 도전자 등장
              g.roundIdx += 1;
              setCurrentRound(g.roundIdx + 1);
              const nextOpp = OPPONENTS[g.roundIdx];
              e.isKnockedOut = false;
              e.hp = nextOpp.maxHp;
              e.maxHp = nextOpp.maxHp;
              e.pos.set(0, 0, -2.5);
              e.group.position.copy(e.pos);
              e.group.rotation.set(0, Math.PI, 0);
              e.bodyMesh.material = new THREE.MeshStandardMaterial({
                color: nextOpp.color,
                roughness: 0.4,
              });

              setEnemyHp(nextOpp.maxHp);
              setEnemyMaxHp(nextOpp.maxHp);
              setEnemyName(nextOpp.name);
            }
          }
        }

        // --- 파티클 업데이트 ---
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const pt = g.particles[i];
          pt.life -= dt;
          pt.mesh.position.addScaledVector(pt.vel, dt);
          pt.vel.y -= 14 * dt;
          if (pt.life <= 0) {
            scene.remove(pt.mesh);
            g.particles.splice(i, 1);
          }
        }

        // --- 카메라 추종 (플레이어 중심 숄더 뷰) ---
        if (g.camera) {
          const camTargetX = p.pos.x * 0.6;
          const camTargetZ = p.pos.z + 5.5;
          g.camera.position.x += (camTargetX - g.camera.position.x) * 0.08;
          g.camera.position.z += (camTargetZ - g.camera.position.z) * 0.08;
          g.camera.lookAt(p.pos.x * 0.5, 1.8, p.pos.z * 0.5 - 1.2);
        }
      }

      if (g.renderer && g.scene && g.camera) {
        g.renderer.render(g.scene, g.camera);
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

  // 펀치 액션 (콤보 잽)
  const handlePunch = useCallback(() => {
    const p = gameLoopRef.current.player;
    if (!p || p.isKnockedOut || gameLoopRef.current.isGameOver) return;

    if (!p.isPunching && !p.isUppercut) {
      p.isPunching = true;
      p.punchProgress = 0;
      p.punchHand = p.punchHand === 'right' ? 'left' : 'right';
      triggerHaptic(20);
      if (playSfx) playSfx('punch');
    }
  }, [playSfx, triggerHaptic]);

  // 어퍼컷 액션
  const handleUppercut = useCallback(() => {
    const p = gameLoopRef.current.player;
    if (!p || p.isKnockedOut || gameLoopRef.current.isGameOver) return;

    if (!p.isPunching && !p.isUppercut) {
      p.isUppercut = true;
      p.uppercutProgress = 0;
      triggerHaptic(35);
      if (playSfx) playSfx('dash');
    }
  }, [playSfx, triggerHaptic]);

  // 위빙(회피) 액션
  const handleWeave = useCallback(() => {
    const p = gameLoopRef.current.player;
    if (!p || p.isKnockedOut || gameLoopRef.current.isGameOver) return;

    if (!p.isWeaving) {
      p.isWeaving = true;
      p.weaveTimer = 0.55;
      triggerHaptic([15, 20]);
      if (playSfx) playSfx('jump');
    }
  }, [playSfx, triggerHaptic]);

  // 가상 조이스틱 터치 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setJoystickActive(true);
    setJoystickPos({ x: touch.clientX, y: touch.clientY });
    setJoystickDelta({ x: 0, y: 0 });
    inputDirRef.current = { x: 0, z: 0 };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - joystickPos.x;
        const dy = touch.clientY - joystickPos.y;
        const maxDist = 55;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const nx = Math.cos(angle) * (clampedDist / maxDist);
        const ny = Math.sin(angle) * (clampedDist / maxDist);

        setJoystickDelta({ x: Math.cos(angle) * clampedDist, y: Math.sin(angle) * clampedDist });
        // 조작 방향: 오른쪽 = +X, 위쪽 = -Z (전진)
        inputDirRef.current = { x: nx, z: ny };
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setJoystickDelta({ x: 0, y: 0 });
        inputDirRef.current = { x: 0, z: 0 };
        break;
      }
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#e3dbfc] font-mono text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* 3D 렌더러 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 헤더 HUD */}
      <MinimalistMissionHUD
        gameTitle="Punchy Guy 3D"
        score={score}
        targetScore={100}
        onBack={handleExit} onQuitClick={() => setShowConfirmQuit(true)}
      />

      {/* 대전 현황 & HP 게이지 바 */}
      <div className="absolute top-16 left-4 right-4 flex flex-col gap-2 pointer-events-none z-10">
        {/* 상단 상대 및 플레이어 HP 바 */}
        <div className="flex items-center justify-between gap-4">
          {/* 플레이어 HP */}
          <div className="flex-1 bg-slate-900/90 border border-blue-500/50 p-2 rounded-sm backdrop-blur-sm">
            <div className="flex justify-between text-xs font-bold text-blue-400 mb-1">
              <span>PLAYER</span>
              <span>{playerHp} / 100</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-150"
                style={{ width: `${Math.max(0, playerHp)}%` }}
              />
            </div>
          </div>

          {/* 중앙 라운드 & KO 배지 */}
          <div className="flex flex-col items-center bg-slate-900/95 border border-yellow-500/60 px-3 py-1 rounded-sm">
            <span className="text-[10px] text-yellow-400 font-bold">ROUND {currentRound}/3</span>
            <span className="text-sm text-yellow-300 font-black">KO: {kos}</span>
          </div>

          {/* 상대 HP */}
          <div className="flex-1 bg-slate-900/90 border border-red-500/50 p-2 rounded-sm backdrop-blur-sm">
            <div className="flex justify-between text-xs font-bold text-red-400 mb-1">
              <span className="truncate max-w-[80px]">{enemyName}</span>
              <span>{enemyHp} / {enemyMaxHp}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 영웅 배지 우측 상단 */}
        <div className="self-end w-12 h-14 bg-slate-900/90 border border-amber-500/40 rounded-sm overflow-hidden flex flex-col items-center justify-center p-0.5 mt-1">
          <canvas ref={heroCanvasRef} width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-[9px] text-amber-300 font-black leading-none mt-0.5">No.{cardId}</span>
        </div>
      </div>

      {/* 다이나믹 플로팅 가상 조이스틱 UI */}
      {joystickActive && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: joystickPos.x - 45,
            top: joystickPos.y - 45,
            width: 90,
            height: 90,
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-blue-500/50 bg-blue-950/30 flex items-center justify-center backdrop-blur-xs">
            <div
              className="w-10 h-10 rounded-full bg-blue-500/80 border border-white/80 shadow-md transform"
              style={{
                transform: `translate(${joystickDelta.x}px, ${joystickDelta.y}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 모바일 액션 버튼 패널 (우측 하단) */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3 z-20 pointer-events-auto">
        {/* 위빙 회피 버튼 */}
        <button
          onClick={handleWeave}
          className="w-16 h-16 rounded-full bg-indigo-600/90 active:bg-indigo-400 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-indigo-300/80 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-base">⚡</span>
          <span>WEAVE</span>
        </button>

        {/* 어퍼컷 파워 버튼 */}
        <button
          onClick={handleUppercut}
          className="w-16 h-16 rounded-full bg-amber-600/90 active:bg-amber-400 text-white font-black text-xs flex flex-col items-center justify-center border-2 border-amber-300/80 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-base">💥</span>
          <span>UPPER</span>
        </button>

        {/* 대형 펀치 버튼 (76px) */}
        <button
          onClick={handlePunch}
          className="w-20 h-20 rounded-full bg-red-600/90 active:bg-red-400 text-white font-black text-sm flex flex-col items-center justify-center border-2 border-red-300/90 shadow-xl active:scale-95 transition-transform"
        >
          <span className="text-2xl">🥊</span>
          <span>PUNCH</span>
        </button>
      </div>

      {/* 좌측 하단 스텝 가이드 안내 */}
      {!joystickActive && (
        <div className="absolute bottom-8 left-6 text-xs text-slate-400 pointer-events-none z-10 flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-sm border border-slate-700/50">
          <span>🕹️ 화면 터치 드래그로 스텝 이동</span>
        </div>
      )}

      {/* 중도 포기 확인 모달 */}
      {showConfirmQuit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-none max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">링에서 내려갈까요?</h3>
            <p className="text-sm text-slate-300 mb-5">
              현재까지 격파한 KO 수와 타격 점수에 비례한 SNS 포인트가 정산됩니다.
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
                      gameId: 'poki_punchy_guy',
                      gameTitle: 'Punchy Guy 3D',
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
                기권하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 튜토리얼 모달 */}
      {showTutorial && (
        <UniversalTutorialModal
          gameTitle="Punchy Guy 3D"
          instructions={[
            {
              iconType: 'GOAL',
              title: '3연속 KO 챔피언 등극',
              desc: '사각 링에서 3명의 개성 넘치는 도전자들을 차례로 KO시켜 링 밖으로 날려버리세요!',
            },
            {
              iconType: 'GESTURES',
              title: '펀치 콤보 & 위빙 회피',
              desc: '[PUNCH]로 원투 잽을 날리고, 적의 주먹이 다가올 때 [WEAVE]로 숙여 피한 뒤 [UPPER]로 카운터를 날리세요.',
            },
            {
              iconType: 'REWARDS',
              title: '챔피언 벨트 & SNS 보상',
              desc: '3라운드 승리 시 최대 50 SNS 포인트를 영구 획득합니다.',
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
