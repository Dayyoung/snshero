import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiFashionLegendsGameProps {
  onBack?: () => void;
  onClose?: () => void;
  cardId?: number;

  onExit?: () => void;
}

interface FashionGate {
  z: number;
  leftChoice: { label: string; bonus: number; icon: string; isGood: boolean };
  rightChoice: { label: string; bonus: number; icon: string; isGood: boolean };
  passed: boolean;
  group: THREE.Group;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export default function PokiFashionLegendsGame({
  onBack,
  onClose,
  cardId = 84,
  onExit
}: PokiFashionLegendsGameProps) {
  const handleExit = onClose || onBack || (() => {});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'walking' | 'judging' | 'victory' | 'gameover'>('ready');
  const [fashionScore, setFashionScore] = useState<number>(50);
  const [runwayProgress, setRunwayProgress] = useState<number>(0);
  const [judgeMessage, setJudgeMessage] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);

  // 3D 내부 참조 Ref
  const stateRef = useRef({
    scene: null as THREE.Scene | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    animFrame: 0,
    clock: new THREE.Clock(),

    // 모델
    modelGroup: null as THREE.Group | null,
    modelPos: new THREE.Vector3(0, 0.4, 0),
    modelTargetX: 0,
    dressMesh: null as THREE.Mesh | null,
    tiaraMesh: null as THREE.Mesh | null,
    shoesL: null as THREE.Mesh | null,
    shoesR: null as THREE.Mesh | null,
    leftLeg: null as THREE.Mesh | null,
    rightLeg: null as THREE.Mesh | null,
    speed: 5.5,
    isBoosting: false,

    // 게이트들
    gates: [] as FashionGate[],
    particles: [] as Particle[],
    particleGeo: new THREE.SphereGeometry(0.08, 6, 6),

    // 점수 및 통계
    score: 50,
    startTime: Date.now(),
  });

  // 파티클 생성
  const spawnParticles = (pos: THREE.Vector3, colorHex: number, count: number, speed: number = 3) => {
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
        vy: (Math.random() * 0.8 + 0.3) * speed,
        vz: (Math.random() - 0.5) * speed,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
      });
    }
  };

  // 터치 슬라이더로 좌우 모델 라인 조향
  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== 'walking') return;
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nx = (touch.clientX - rect.left) / rect.width; // 0 ~ 1
    // 런웨이 좌우 -2.8m ~ 2.8m
    stateRef.current.modelTargetX = (nx - 0.5) * 5.6;
  };

  // 워킹 가속 / 부스트
  const triggerSpeedBoost = () => {
    stateRef.current.isBoosting = true;
    setTimeout(() => {
      stateRef.current.isBoosting = false;
    }, 1500);
    if (navigator.vibrate) navigator.vibrate(25);
  };

  // 심사 평가 (Judging)
  const evaluateRunway = (finalScore: number) => {
    setGameState('judging');
    const s = stateRef.current;

    if (finalScore >= 75) {
      setJudgeMessage('🌟 "완벽한 오뜨 꾸뛰르 컬렉션! 만장일치 우승!"');
      spawnParticles(s.modelPos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xfacc15, 40, 5);
      if (navigator.vibrate) navigator.vibrate([50, 70, 50, 90]);

      setTimeout(() => {
        handleVictory(finalScore);
      }, 1800);
    } else {
      setJudgeMessage('💔 "스타일 매칭이 다소 아쉽습니다."');
      if (navigator.vibrate) navigator.vibrate(80);

      setTimeout(() => {
        handleGameOver(finalScore);
      }, 1800);
    }
  };

  // 승리 처리
  const handleVictory = (finalScore: number) => {
    setGameState('victory');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'fashion-legends',
      gameTitle: '패션 레전드 3D (Fashion Legends)',
      isVictory: true,
      score: finalScore * 10,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 게임오버 처리
  const handleGameOver = (finalScore: number) => {
    setGameState('gameover');
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    const receipt = calculateAndDepositMissionReward({
      gameId: 'fashion-legends',
      gameTitle: '패션 레전드 3D (Fashion Legends)',
      isVictory: false,
      score: finalScore * 8,
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    setRewardReceipt(receipt);
  };

  // 중도 포기 정산
  const confirmExit = () => {
    setShowExitModal(false);
    const s = stateRef.current;
    const duration = Math.max(1, Math.floor((Date.now() - s.startTime) / 1000));
    calculateAndDepositMissionReward({
      gameId: 'fashion-legends',
      gameTitle: '패션 레전드 3D (Fashion Legends)',
      isVictory: false,
      score: Math.floor((s.modelPos.z / 75) * 800),
      maxTargetScore: 1000,
      durationSeconds: duration,
    });
    handleExit();
  };

  // 재시작
  const restartGame = () => {
    const s = stateRef.current;
    s.score = 50;
    s.modelPos.set(0, 0.4, 0);
    s.modelTargetX = 0;
    s.gates.forEach((g) => (g.passed = false));
    s.startTime = Date.now();

    // 의상 초기화
    if (s.dressMesh) (s.dressMesh.material as THREE.MeshStandardMaterial).color.setHex(0x38bdf8);
    if (s.tiaraMesh) s.tiaraMesh.visible = false;
    if (s.shoesL) (s.shoesL.material as THREE.MeshStandardMaterial).color.setHex(0x64748b);
    if (s.shoesR) (s.shoesR.material as THREE.MeshStandardMaterial).color.setHex(0x64748b);

    setFashionScore(50);
    setRunwayProgress(0);
    setJudgeMessage(null);
    setRewardReceipt(null);
    setGameState('walking');
  };

  // Three.js 환경 초기화
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1b4b); // 딥 인디고 패션쇼 스타디움
    scene.fog = new THREE.FogExp2(0x1e1b4b, 0.015);
    stateRef.current.scene = scene;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 120);
    camera.position.set(0, 3.2, -5.5);
    camera.lookAt(0, 1.2, 5);
    stateRef.current.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    stateRef.current.renderer = renderer;

    // 조명
    const ambLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambLight);

    const spotLight = new THREE.SpotLight(0xffedd5, 1.5, 30, Math.PI / 4, 0.5);
    spotLight.position.set(0, 12, 10);
    scene.add(spotLight);

    // 80m 글래스 런웨이 트랙 (너비 7m)
    const runwayGeo = new THREE.PlaneGeometry(7.0, 85);
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.2 });
    const runwayMesh = new THREE.Mesh(runwayGeo, runwayMat);
    runwayMesh.rotation.x = -Math.PI / 2;
    runwayMesh.position.set(0, 0, 40);
    runwayMesh.receiveShadow = true;
    scene.add(runwayMesh);

    // 런웨이 사이드 네온 레일
    const railMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 85), railMat);
    railL.position.set(-3.5, 0.2, 40);
    scene.add(railL);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 85), railMat);
    railR.position.set(3.5, 0.2, 40);
    scene.add(railR);

    // 시작 지점 15m 안전 광폭 바닥 & No.084 영웅 배지
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const badgeCtx = badgeCanvas.getContext('2d');
    if (badgeCtx) {
      drawCardSprite(badgeCtx, cardId, 0, 0, 256, 256);
      const badgeTex = new THREE.CanvasTexture(badgeCanvas);
      const badgePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 3.5),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, opacity: 0.9 })
      );
      badgePlane.rotation.x = -Math.PI / 2;
      badgePlane.position.set(0, 0.02, 5);
      scene.add(badgePlane);
    }

    // 종점 심사위원 포디움 (z=75)
    const podiumGeo = new THREE.BoxGeometry(9, 0.6, 5);
    const podiumMat = new THREE.MeshStandardMaterial({ color: 0x991b1b }); // 레드 카펫
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.set(0, 0.3, 76);
    scene.add(podium);

    // 3D 게이트 3쌍 생성 (z=22, z=42, z=60)
    const gateData = [
      {
        z: 22,
        left: { label: '골드 실크 드레스', bonus: 20, icon: '👗', isGood: true },
        right: { label: '낡은 티셔츠', bonus: -10, icon: '👕', isGood: false },
      },
      {
        z: 42,
        left: { label: '투박한 운동화', bonus: -10, icon: '👟', isGood: false },
        right: { label: '크리스털 하이힐', bonus: 20, icon: '👠', isGood: true },
      },
      {
        z: 60,
        left: { label: '다이아 티아라', bonus: 20, icon: '👑', isGood: true },
        right: { label: '오래된 비니', bonus: -10, icon: '🧢', isGood: false },
      },
    ];

    const gates: FashionGate[] = [];
    gateData.forEach((gd) => {
      const gGroup = new THREE.Group();

      // 좌측 문 (그린 또는 퍼플 림)
      const gateMatL = new THREE.MeshBasicMaterial({
        color: gd.left.isGood ? 0x22c55e : 0xef4444,
        transparent: true,
        opacity: 0.45,
      });
      const meshL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 0.2), gateMatL);
      meshL.position.set(-1.75, 1.6, gd.z);
      gGroup.add(meshL);

      // 우측 문
      const gateMatR = new THREE.MeshBasicMaterial({
        color: gd.right.isGood ? 0x22c55e : 0xef4444,
        transparent: true,
        opacity: 0.45,
      });
      const meshR = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 0.2), gateMatR);
      meshR.position.set(1.75, 1.6, gd.z);
      gGroup.add(meshR);

      scene.add(gGroup);
      gates.push({
        z: gd.z,
        leftChoice: gd.left,
        rightChoice: gd.right,
        passed: false,
        group: gGroup,
      });
    });
    stateRef.current.gates = gates;

    // --- 3D 슈퍼모델 아바타 모델링 ---
    const modelGroup = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4 });

    // 머리
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14), skinMat);
    head.position.y = 1.9;
    modelGroup.add(head);

    // 헤어
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.3 });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.7), hairMat);
    hair.position.y = 1.95;
    modelGroup.add(hair);

    // 다이아몬드 티아라 (평소엔 숨김)
    const tiara = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 5), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    tiara.position.set(0, 2.3, 0);
    tiara.visible = false;
    modelGroup.add(tiara);
    stateRef.current.tiaraMesh = tiara;

    // 목걸이 (No.084 공식 카드 영웅 배지 펜던트)
    if (badgeCtx) {
      const badgeTex = new THREE.CanvasTexture(badgeCanvas);
      const pendant = new THREE.Mesh(
        new THREE.PlaneGeometry(0.24, 0.24),
        new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true })
      );
      pendant.position.set(0, 1.62, 0.25);
      modelGroup.add(pendant);
    }

    // 드레스 바디
    const dressMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.2 });
    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.48, 1.1, 12), dressMat);
    dress.position.y = 1.15;
    modelGroup.add(dress);
    stateRef.current.dressMesh = dress;

    // 양다리 & 슈즈
    const legMat = skinMat;
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.75, 6), legMat);
    legL.position.set(-0.16, 0.38, 0);
    modelGroup.add(legL);
    stateRef.current.leftLeg = legL;

    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.75, 6), legMat);
    legR.position.set(0.16, 0.38, 0);
    modelGroup.add(legR);
    stateRef.current.rightLeg = legR;

    // 하이힐 슈즈
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 });
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.3), shoeMat);
    shoeL.position.set(-0.16, 0.06, 0.05);
    modelGroup.add(shoeL);
    stateRef.current.shoesL = shoeL;

    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.3), shoeMat);
    shoeR.position.set(0.16, 0.06, 0.05);
    modelGroup.add(shoeR);
    stateRef.current.shoesR = shoeR;

    modelGroup.position.copy(stateRef.current.modelPos);
    scene.add(modelGroup);
    stateRef.current.modelGroup = modelGroup;

    // 리사이즈
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
      const time = s.clock.getElapsedTime();

      // 워킹 진행
      if (gameState === 'walking') {
        const moveSpeed = s.isBoosting ? s.speed * 1.5 : s.speed;
        s.modelPos.z += moveSpeed * dt;

        // 좌우 위치 보간
        s.modelPos.x += (s.modelTargetX - s.modelPos.x) * 0.12;

        // 캣워크 보행 애니메이션 (다리 교차 스윙)
        if (s.leftLeg && s.rightLeg) {
          const walkFreq = s.isBoosting ? 16 : 10;
          s.leftLeg.rotation.x = Math.sin(time * walkFreq) * 0.5;
          s.rightLeg.rotation.x = -Math.sin(time * walkFreq) * 0.5;
        }

        // 진행률 갱신
        const progress = Math.min(100, Math.floor((s.modelPos.z / 75) * 100));
        setRunwayProgress(progress);

        if (s.modelGroup) {
          s.modelGroup.position.copy(s.modelPos);
        }

        // 게이트 통과 판정
        s.gates.forEach((gate) => {
          if (!gate.passed && s.modelPos.z >= gate.z) {
            gate.passed = true;
            const isLeft = s.modelPos.x < 0;
            const choice = isLeft ? gate.leftChoice : gate.rightChoice;

            s.score = Math.max(0, Math.min(100, s.score + choice.bonus));
            setFashionScore(s.score);

            // 실시간 의상 변환 (Morphing)
            if (choice.isGood) {
              spawnParticles(s.modelPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xfacc15, 25, 4);
              if (navigator.vibrate) navigator.vibrate([30, 40]);

              if (gate.z === 22 && s.dressMesh) {
                // 골드 실크 드레스로 변환
                (s.dressMesh.material as THREE.MeshStandardMaterial).color.setHex(0xfacc15);
              } else if (gate.z === 42 && s.shoesL && s.shoesR) {
                // 크리스털 하이힐로 변환
                (s.shoesL.material as THREE.MeshStandardMaterial).color.setHex(0xf43f5e);
                (s.shoesR.material as THREE.MeshStandardMaterial).color.setHex(0xf43f5e);
              } else if (gate.z === 60 && s.tiaraMesh) {
                // 다이아 티아라 착용
                s.tiaraMesh.visible = true;
              }
            } else {
              spawnParticles(s.modelPos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x64748b, 15, 2.5);
              if (navigator.vibrate) navigator.vibrate(60);
            }
          }
        });

        // 종점 도달 판정 (z >= 75)
        if (s.modelPos.z >= 75) {
          s.modelPos.z = 75;
          evaluateRunway(s.score);
        }
      } else if (gameState === 'judging') {
        // 심사 포디움에서 360도 런웨이 턴 포즈
        if (s.modelGroup) {
          s.modelGroup.rotation.y += 1.8 * dt;
        }
      }

      // 파티클 업데이트
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life += dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 3.0 * dt;
        const scale = Math.max(0.01, 1 - p.life / p.maxLife);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          s.particles.splice(i, 1);
        }
      }

      // 카메라 팔로우 추적
      camera.position.z = s.modelPos.z - 5.5;
      camera.position.x = s.modelPos.x * 0.3;
      camera.lookAt(s.modelPos.x * 0.5, 1.2, s.modelPos.z + 4.0);

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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-950 font-mono"
      onTouchMove={handleTouchMove}
    >
      {/* 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="FASHION LEGENDS 3D"
        scoreDisplay={`SCORE: ${fashionScore}/100 | RUNWAY: ${runwayProgress}%`}
        onExitClick={() => setShowExitModal(true)}
      />

      {/* 심사위원 코멘트 배너 */}
      {judgeMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-black px-6 py-2.5 rounded-full text-sm shadow-2xl animate-bounce z-20 border-2 border-white pointer-events-none">
          {judgeMessage}
        </div>
      )}

      {/* 화면 조작 안내 툴팁 */}
      {gameState === 'walking' && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-pink-500/40 text-xs text-pink-300 pointer-events-none z-10">
          화면 터치 슬라이드로 좌우 게이트를 선택하세요!
        </div>
      )}

      {/* 우측 하단 퓨어 모바일 액션 버튼 군 */}
      {gameState === 'walking' && (
        <div className="absolute right-4 bottom-6 flex gap-3 items-center pointer-events-auto z-20 select-none">
          {/* 76px 워킹 가속 버튼 (STRUT & SPEED) */}
          <button
            onClick={triggerSpeedBoost}
            className="w-[76px] h-[76px] rounded-full bg-gradient-to-b from-pink-500 to-rose-600 text-white font-black text-base shadow-xl active:scale-90 flex flex-col items-center justify-center border-4 border-white animate-pulse"
          >
            <span>STRUT!</span>
            <span className="text-[9px] font-bold">워킹가속</span>
          </button>
        </div>
      )}

      {/* 시작(Ready) 모달 */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-pink-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-pink-400 mb-2">FASHION LEGENDS 3D</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              세계적인 3D 캣워크 런웨이를 질주하세요!
              <br />
              <span className="text-pink-300">화면 터치 슬라이드</span>로 좌우 이동하며
              <br />
              테마에 맞는 <span className="text-yellow-400 font-bold">드레스, 하이힐, 티아라</span> 게이트를 통과하고
              <br />
              최종 심사위원 만점을 획득해 우승 트로피를 차지하세요!
            </p>
            <button
              onClick={() => {
                setGameState('walking');
                stateRef.current.startTime = Date.now();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-base rounded-sm shadow-lg active:scale-95"
            >
              [ 캣워크 런웨이 시작! ]
            </button>
          </div>
        </div>
      )}

      {/* 게임오버 모달 */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30">
          <div className="bg-slate-900 border-2 border-red-500 p-6 max-w-sm w-full text-center rounded-sm">
            <h2 className="text-2xl font-black text-red-500 mb-2">TRY AGAIN</h2>
            <p className="text-xs text-slate-300 mb-4">
              심사위원 기준(75점)에 도달하지 못했습니다.
              <br />
              최종 패션 점수: {fashionScore}점
            </p>
            <div className="flex gap-2">
              <button
                onClick={restartGame}
                className="flex-1 py-3 bg-pink-500 text-white font-black text-sm rounded-sm active:scale-95"
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
            <h3 className="text-lg font-bold text-white mb-2">런웨이를 중단할까요?</h3>
            <p className="text-xs text-slate-400 mb-4">
              현재까지 진행한 런웨이 거리에 따라 SNS 보상이 안전하게 정산됩니다.
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

export { PokiFashionLegendsGame };
