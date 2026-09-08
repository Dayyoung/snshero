import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiObbyRoadsGameProps {
  onBack: () => void;
}

const FINISH_DISTANCE = 500;

interface ObstacleObj {
  group: THREE.Group;
  z: number;
  type: 'roller' | 'ramp';
  rotSpeed?: number;
}

interface BoostParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export const PokiObbyRoadsGame: React.FC<PokiObbyRoadsGameProps> = ({ onBack }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 게임 진행 상태
  const [currentDist, setCurrentDist] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(80);
  const [isNitro, setIsNitro] = useState(false);
  const [isBraking, setIsBraking] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [toastText, setToastText] = useState('');

  const isNitroRef = useRef(false);
  isNitroRef.current = isNitro;
  const isBrakingRef = useRef(false);
  isBrakingRef.current = isBraking;
  const gameWonRef = useRef(false);
  gameWonRef.current = gameWon;

  const startTimeRef = useRef<number>(Date.now());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);

  // 3D 차량 오브젝트
  const carGroupRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);
  const obstaclesRef = useRef<ObstacleObj[]>([]);
  const boostParticlesRef = useRef<BoostParticle[]>([]);

  // 차량 물리 상태
  const physics = useRef({
    pos: new THREE.Vector3(0, 0.4, 0),
    vel: new THREE.Vector3(0, 0, 0),
    speed: 24, // 기본 속도 (m/s)
    steerAngle: 0,
    targetSteer: 0,
    inAir: false,
    groundY: 0.4,
  });

  // 터치 조작 상태
  const touchState = useRef({
    active: false,
    startX: 0,
    currentX: 0,
  });

  // 햅틱 진동
  const triggerHaptic = (duration = 40) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const showToast = (text: string) => {
    setToastText(text);
    setTimeout(() => {
      setToastText((prev) => (prev === text ? '' : prev));
    }, 1800);
  };

  // 니트로 부스트 파티클 스폰
  const spawnBoostFlame = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const colors = [0x38bdf8, 0x0284c7, 0xf97316, 0xffffff];

    for (let i = 0; i < 4; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.3,
        pos.y + (Math.random() - 0.5) * 0.2,
        pos.z + 1.2
      );

      const p: BoostParticle = {
        mesh,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: Math.random() * 8 + 6,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.15,
      };
      sceneRef.current.add(mesh);
      boostParticlesRef.current.push(p);
    }
  };

  // 컨페티 폭죽
  const spawnConfetti = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;
    const colors = [0xf59e0b, 0x10b981, 0x38bdf8, 0xec4899, 0xffffff];
    const geo = new THREE.PlaneGeometry(0.25, 0.25);

    for (let i = 0; i < 60; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const p: BoostParticle = {
        mesh,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * 12 + 4,
        vz: (Math.random() - 0.5) * 12,
        life: 0,
        maxLife: 1.8 + Math.random() * 0.8,
      };
      sceneRef.current.add(mesh);
      boostParticlesRef.current.push(p);
    }
  };

  // 안전 리스폰
  const respawnCar = useCallback(() => {
    const phys = physics.current;
    phys.pos.x = 0;
    phys.pos.y = phys.groundY;
    phys.vel.set(0, 0, 0);
    phys.steerAngle = 0;
    phys.targetSteer = 0;
    phys.inAir = false;
    triggerHaptic(50);
    showToast('🔄 트랙 중앙으로 복귀했습니다.');
  }, []);

  // Three.js 초기화
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬 & 카메라
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0284c7);
    scene.fog = new THREE.FogExp2(0x0284c7, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(56, width / height, 0.1, 300);
    camera.position.set(0, 3.8, 8.5);
    camera.lookAt(0, 0.8, -10);
    cameraRef.current = camera;

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // ==========================================
    // 3D 고공 서스펜디드 오비 트랙 (520m)
    // ==========================================
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);

    // 메인 아스팔트 도로 트랙
    const roadGeo = new THREE.BoxGeometry(14, 1.2, 540);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.1 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, -0.6, -260);
    road.receiveShadow = true;
    trackGroup.add(road);

    // 좌우 네온 가드레일
    const railGeo = new THREE.BoxGeometry(0.4, 0.8, 540);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
    });
    const railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-6.8, 0.4, -260);
    trackGroup.add(railL);

    const railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(6.8, 0.4, -260);
    trackGroup.add(railR);

    // 센터라인 대시 마킹
    const dashCount = 50;
    const dashGeo = new THREE.PlaneGeometry(0.4, 4.5);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let i = 0; i < dashCount; i++) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, -i * 10.5);
      trackGroup.add(dash);
    }

    // ==========================================
    // 장애물 기믹 (점프대 & 회전 롤러)
    // ==========================================
    const obstacles: ObstacleObj[] = [];

    // 점프대 3개
    const rampZPositions = [-120, -250, -380];
    rampZPositions.forEach((z) => {
      const rampGroup = new THREE.Group();
      rampGroup.position.set(0, 0, z);
      trackGroup.add(rampGroup);

      const rampMesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1.6, 6),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 })
      );
      rampMesh.rotation.x = -0.25;
      rampMesh.position.set(0, 0.5, 0);
      rampGroup.add(rampMesh);

      obstacles.push({ group: rampGroup, z, type: 'ramp' });
    });

    // 회전 롤러 스파이크 3개
    const rollerZPositions = [-75, -185, -320, -430];
    rollerZPositions.forEach((z, idx) => {
      const rollerGroup = new THREE.Group();
      rollerGroup.position.set(0, 1.4, z);
      trackGroup.add(rollerGroup);

      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 13.5),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
      );
      shaft.rotation.z = Math.PI / 2;
      rollerGroup.add(shaft);

      // 스파이크 패들
      for (let p = 0; p < 4; p++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(12, 0.15, 1.2),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
        );
        blade.rotation.x = (p * Math.PI) / 2;
        rollerGroup.add(blade);
      }

      obstacles.push({
        group: rollerGroup,
        z,
        type: 'roller',
        rotSpeed: idx % 2 === 0 ? 3.5 : -3.5,
      });
    });
    obstaclesRef.current = obstacles;

    // ==========================================
    // 500m 결승 피니시 게이트 & No.110 영웅 배지
    // ==========================================
    const finishGroup = new THREE.Group();
    finishGroup.position.set(0, 0, -FINISH_DISTANCE);
    trackGroup.add(finishGroup);

    // 아치 트러스 기둥 2개
    const pMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 8), pMat);
    colL.position.set(-6.5, 4, 0);
    finishGroup.add(colL);

    const colR = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 8), pMat);
    colR.position.set(6.5, 4, 0);
    finishGroup.add(colR);

    // 상단 아치 빔
    const beam = new THREE.Mesh(new THREE.BoxGeometry(14, 1.5, 1.2), pMat);
    beam.position.set(0, 8, 0);
    finishGroup.add(beam);

    // 아치 중앙 No.110 공식 카드 영웅 배지 홀로그램 전광판 (최종 피날레!)
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#78350f';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#fbbf24';
      bctx.lineWidth = 14;
      bctx.strokeRect(7, 7, 242, 242);
      drawCardSprite(bctx, 110, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    badgeMesh.position.set(0, 9.8, 0);
    finishGroup.add(badgeMesh);

    // ==========================================
    // 3D 스턴트 레이싱 버기카 모델링
    // ==========================================
    const carGroup = new THREE.Group();
    carGroup.position.copy(physics.current.pos);
    scene.add(carGroup);
    carGroupRef.current = carGroup;

    // 바디 섀시
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.6, 3.2);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.2,
      metalness: 0.4,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.set(0, 0.35, 0);
    chassis.castShadow = true;
    carGroup.add(chassis);

    // 롤케이지 콕핏
    const cageGeo = new THREE.BoxGeometry(1.2, 0.7, 1.4);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.8,
    });
    const cage = new THREE.Mesh(cageGeo, cageMat);
    cage.position.set(0, 0.85, -0.2);
    carGroup.add(cage);

    // 보닛 No.110 공식 카드 영웅 배지 데칼
    const heroCanvas = document.createElement('canvas');
    heroCanvas.width = 128;
    heroCanvas.height = 128;
    const hctx = heroCanvas.getContext('2d');
    if (hctx) {
      drawCardSprite(hctx, 110, 8, 8, 112, 112, { circleClip: true });
    }
    const heroTex = new THREE.CanvasTexture(heroCanvas);
    const heroBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.7),
      new THREE.MeshBasicMaterial({ map: heroTex, transparent: true })
    );
    heroBadge.rotation.x = -Math.PI / 2;
    heroBadge.position.set(0, 0.66, -0.8);
    carGroup.add(heroBadge);

    // 리어 스포일러 윙
    const wingGeo = new THREE.BoxGeometry(1.8, 0.08, 0.4);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 1.0, 1.4);
    carGroup.add(wing);

    // 바퀴 4개 (Wheels)
    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    const wheelOffsets = [
      { x: -0.9, y: 0.2, z: -1.0 },
      { x: 0.9, y: 0.2, z: -1.0 },
      { x: -0.9, y: 0.2, z: 1.0 },
      { x: 0.9, y: 0.2, z: 1.0 },
    ];

    wheelOffsets.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      carGroup.add(wheel);
      wheels.push(wheel);
    });
    wheelsRef.current = wheels;

    // 리사이즈 옵저버
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false);
        }
      }
    });
    resizeObserver.observe(container);

    // ==========================================
    // 애니메이션 렌더 루프
    // ==========================================
    let lastTime = performance.now();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const phys = physics.current;

      // 1. 속도 계산 (니트로 부스트 & 브레이크)
      let targetSpeed = 26; // 기본 약 95km/h
      if (isNitro) targetSpeed = 46; // 니트로 165km/h
      else if (isBraking) targetSpeed = 12; // 감속 45km/h

      phys.speed += (targetSpeed - phys.speed) * (isNitro ? 0.15 : 0.08);
      const kmh = Math.round(phys.speed * 3.6);
      setSpeedKmh(kmh);

      // 2. 조향 보간 (Screen-relative 완벽 일치)
      phys.steerAngle += (phys.targetSteer - phys.steerAngle) * 0.2;
      phys.pos.x += phys.steerAngle * phys.speed * 0.45 * dt;

      // 전진 이동 (Z축 음수 방향)
      phys.pos.z -= phys.speed * dt;

      // 트랙 이탈 방지
      if (phys.pos.x < -6.0) {
        phys.pos.x = -6.0;
        phys.steerAngle = 0;
        triggerHaptic(20);
      } else if (phys.pos.x > 6.0) {
        phys.pos.x = 6.0;
        phys.steerAngle = 0;
        triggerHaptic(20);
      }

      // 3. 점프대 및 수직 물리
      if (phys.inAir) {
        phys.vel.y -= 22 * dt;
        phys.pos.y += phys.vel.y * dt;
        if (phys.pos.y <= phys.groundY) {
          phys.pos.y = phys.groundY;
          phys.vel.y = 0;
          phys.inAir = false;
          triggerHaptic(40);
        }
      }

      // 점프대 감지
      obstaclesRef.current.forEach((obs) => {
        if (obs.type === 'ramp') {
          if (Math.abs(phys.pos.z - obs.z) < 3.0 && !phys.inAir) {
            phys.inAir = true;
            phys.vel.y = 12.0;
            triggerHaptic(80);
            showToast('🚀 MEGA RAMP JUMP!');
          }
        } else if (obs.type === 'roller' && obs.rotSpeed) {
          // 롤러 회전
          obs.group.rotation.x += obs.rotSpeed * dt;
          // 충돌 감지
          if (Math.abs(phys.pos.z - obs.z) < 1.5 && phys.pos.y < 1.8) {
            triggerHaptic(90);
            phys.speed = Math.max(8, phys.speed * 0.6);
            showToast('💥 롤러 장애물 충돌!');
          }
        }
      });

      // 바퀴 회전
      wheelsRef.current.forEach((w) => {
        w.rotation.x += phys.speed * dt * 2.5;
      });

      // 니트로 화염 분출
      if (isNitroRef.current) {
        spawnBoostFlame(phys.pos);
      }

      // 거리 진행도 갱신
      const dist = Math.min(FINISH_DISTANCE, Math.max(0, Math.floor(-phys.pos.z)));
      setCurrentDist(dist);

      // 결승 피니시 돌파 승리!
      if (dist >= FINISH_DISTANCE && !gameWonRef.current) {
        gameWonRef.current = true;
        setGameWon(true);
        triggerHaptic(180);
        spawnConfetti(phys.pos);
        showToast('🏆 500m 오비 로드 완주! Poki 110선 전수 정복 달성!');

        setTimeout(() => {
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki-110',
            gameTitle: 'Obby Roads 3D',
            isVictory: true,
            score: 500,
            maxTargetScore: 500,
            durationSeconds: dur,
          });
          setRewardReceipt(receipt);
        }, 900);
      }

      // 차량 메쉬 위치 & 롤링 뱅크 회전
      if (carGroupRef.current) {
        carGroupRef.current.position.copy(phys.pos);
        carGroupRef.current.rotation.y = -phys.steerAngle * 0.4;
        carGroupRef.current.rotation.z = -phys.steerAngle * 0.25;
        if (phys.inAir) {
          carGroupRef.current.rotation.x = 0.2;
        } else {
          carGroupRef.current.rotation.x = 0;
        }
      }

      // 체이스 카메라 위치 추적
      if (cameraRef.current) {
        cameraRef.current.position.x = phys.pos.x * 0.7;
        cameraRef.current.position.y = phys.pos.y + 3.4;
        cameraRef.current.position.z = phys.pos.z + 7.8;
        cameraRef.current.lookAt(phys.pos.x, phys.pos.y + 0.8, phys.pos.z - 6);
      }

      // 부스트 및 컨페티 파티클 시뮬레이션
      const parts = boostParticlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          if (Array.isArray(p.mesh.material)) {
            p.mesh.material.forEach((m) => m.dispose());
          } else {
            p.mesh.material.dispose();
          }
          parts.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 터치 스와이프 조향
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchState.current = { active: true, startX: clientX, currentX: clientX };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchState.current.active) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    touchState.current.currentX = clientX;

    const diffX = clientX - touchState.current.startX;
    // Screen-relative 조향 (오른쪽 스와이프 시 오른쪽, 왼쪽 스와이프 시 왼쪽)
    const steer = Math.max(-1.0, Math.min(1.0, diffX / 90));
    physics.current.targetSteer = steer;
  };

  const handleTouchEnd = () => {
    touchState.current.active = false;
    physics.current.targetSteer = 0;
  };

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki-110',
      gameTitle: 'Obby Roads 3D',
      isVictory: false,
      score: currentDist,
      maxTargetScore: FINISH_DISTANCE,
      durationSeconds: dur,
    });
    setRewardReceipt(receipt);
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#0284c7]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      {/* 3D 뷰포트 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="OBBY ROADS 3D // FINALE"
        missionTarget={`결승 피니시: ${currentDist}m/${FINISH_DISTANCE}m`}
        currentScore={currentDist}
        onBack={onBack}
        onForfeit={handleForfeit}
      />

      {/* 상단 속도계 및 토스트 피드백 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {toastText ? (
          <div className="bg-amber-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/50">
            {toastText}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs text-amber-300 border border-amber-500/30 font-mono flex items-center gap-3">
            <span className="text-white font-bold">{speedKmh} KM/H</span>
            <span>|</span>
            <span>화면을 좌우로 스와이프해 장애물을 회피하세요!</span>
          </div>
        )}
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 패널 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-20 pointer-events-auto">
        {/* 브레이크 버튼 */}
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsBraking(true);
            triggerHaptic(30);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            setIsBraking(false);
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 active:bg-slate-700 text-white font-mono text-xs border border-white/20 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🛑</span>
          <span className="text-[10px]">BRAKE</span>
        </button>

        {/* 대형 니트로 부스트 버튼 */}
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsNitro(true);
            triggerHaptic(90);
            showToast('⚡ NITRO BOOST ON!');
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            setIsNitro(false);
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-cyan-500 to-blue-700 active:from-cyan-600 active:to-blue-800 text-white font-black text-sm border-2 border-cyan-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">🚀</span>
          <span className="tracking-wider text-xs font-mono font-bold">NITRO!</span>
        </button>

        {/* 안전 리스폰 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            respawnCar();
          }}
          className="w-16 h-16 rounded-full bg-orange-800/80 active:bg-orange-700 text-white font-mono text-xs border border-orange-400/40 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🔄</span>
          <span className="text-[10px]">RESET</span>
        </button>
      </div>

      {/* 승리 및 정산 모달 */}
      {rewardReceipt && (
        <VictoryRewardModal
          receipt={rewardReceipt}
          onClose={onBack}
        />
      )}
    </div>
  );
};

export default PokiObbyRoadsGame;
