import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTestSpecialGameProps {
  onBack: () => void;

  onExit?: () => void;
  onClose?: () => void;
}

const TOTAL_STAGES = 3;

export const PokiBrainTestSpecialGame: React.FC<PokiBrainTestSpecialGameProps> = ({
  onBack,
  onExit,
  onClose
}) => {
  const handleExit = onBack || onExit || onClose || (() => {});
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 게임 진행 상태
  const [currentStage, setCurrentStage] = useState(1);
  const [currentScore, setCurrentScore] = useState(100);
  const [stageCleared, setStageCleared] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardReceipt, setRewardReceipt] = useState<RewardReceipt | null>(null);
  const [hintMessage, setHintMessage] = useState('');
  const [toastText, setToastText] = useState('');

  const startTimeRef = useRef<number>(Date.now());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number>(0);

  // 스테이지 그룹 및 드래그 상태
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const activeDraggableRef = useRef<THREE.Object3D | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const planeIntersect = useRef(new THREE.Vector3());

  // 스테이지별 개별 오브젝트 레퍼런스
  const stageData = useRef({
    // Stage 1
    cloudMesh: null as THREE.Group | null,
    airplaneMesh: null as THREE.Group | null,
    planeLanded: false,
    // Stage 2
    ufoDomeMesh: null as THREE.Mesh | null,
    alienMesh: null as THREE.Group | null,
    domeOpened: false,
    // Stage 3
    vaultDoorMesh: null as THREE.Group | null,
    vaultDialMesh: null as THREE.Mesh | null,
    vaultOpened: false,
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
    }, 2200);
  };

  // 스테이지 빌드
  const loadStage = useCallback((stageNum: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (stageGroupRef.current) {
      scene.remove(stageGroupRef.current);
    }

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);
    stageGroupRef.current = stageGroup;

    setStageCleared(false);
    activeDraggableRef.current = null;

    if (stageNum === 1) {
      // ----------------------------------------------------
      // [STAGE 1] 안개 속 갇힌 비행기를 착륙시켜라!
      // ----------------------------------------------------
      setHintMessage('짙은 먹구름이 활주로를 가리고 있습니다. 구름을 손으로 치워보세요!');

      // 활주로 바닥
      const runwayGeo = new THREE.BoxGeometry(4.5, 0.2, 16);
      const runwayMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const runway = new THREE.Mesh(runwayGeo, runwayMat);
      runway.position.set(0, -2.5, 0);
      stageGroup.add(runway);

      // 활주로 센터라인
      const lineGeo = new THREE.PlaneGeometry(0.2, 14);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, -2.38, 0);
      stageGroup.add(line);

      // 3D 비행기 모델
      const planeGroup = new THREE.Group();
      planeGroup.position.set(0, 3.2, 0);
      stageGroup.add(planeGroup);
      stageData.current.airplaneMesh = planeGroup;
      stageData.current.planeLanded = false;

      // 동체
      const fuselage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.4, 3.0, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      fuselage.rotation.x = Math.PI / 2;
      planeGroup.add(fuselage);

      // 주날개
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.08, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
      );
      planeGroup.add(wing);

      // 꼬리날개
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.8, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
      );
      tail.position.set(0, 0.45, -1.2);
      planeGroup.add(tail);

      // 3D 거대 구름 덩어리 (드래그 가능)
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(0, 0.2, 1.0);
      cloudGroup.name = 'draggable_cloud';
      stageGroup.add(cloudGroup);
      stageData.current.cloudMesh = cloudGroup;

      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.9,
        transparent: true,
        opacity: 0.92,
      });
      const puff1 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), cloudMat);
      cloudGroup.add(puff1);

      const puff2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 16), cloudMat);
      puff2.position.set(-1.2, -0.2, 0);
      cloudGroup.add(puff2);

      const puff3 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), cloudMat);
      puff3.position.set(1.2, -0.1, 0);
      cloudGroup.add(puff3);
    } else if (stageNum === 2) {
      // ----------------------------------------------------
      // [STAGE 2] UFO 속에 숨은 외계인을 찾아라!
      // ----------------------------------------------------
      setHintMessage('UFO의 투명 돔 덮개가 닫혀있습니다. 돔을 위로 들어올려보세요!');

      // 외계 행성 지면
      const ground = new THREE.Mesh(
        new THREE.CylinderGeometry(6, 6, 0.4, 32),
        new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.8 })
      );
      ground.position.set(0, -2.5, 0);
      stageGroup.add(ground);

      // 3D UFO 그룹
      const ufoGroup = new THREE.Group();
      ufoGroup.position.set(0, -0.2, 0);
      stageGroup.add(ufoGroup);

      // UFO 소서 바디 (메탈릭 실버)
      const saucer = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 0.8, 0.6, 32),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
      );
      ufoGroup.add(saucer);

      // LED 라이트 링
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.08, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      ring.rotation.x = Math.PI / 2;
      ufoGroup.add(ring);

      // 3D 외계인 피규어 (UFO 안에 탑승)
      const alienGroup = new THREE.Group();
      alienGroup.position.set(0, 0.3, 0);
      ufoGroup.add(alienGroup);
      stageData.current.alienMesh = alienGroup;

      const alienHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3 })
      );
      alienGroup.add(alienHead);

      // 큰 눈 2개
      const aEyeGeo = new THREE.SphereGeometry(0.16, 12, 12);
      const aEyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const aEyeL = new THREE.Mesh(aEyeGeo, aEyeMat);
      aEyeL.position.set(-0.25, 0.12, 0.45);
      alienGroup.add(aEyeL);

      const aEyeR = new THREE.Mesh(aEyeGeo, aEyeMat);
      aEyeR.position.set(0.25, 0.12, 0.45);
      alienGroup.add(aEyeR);

      // 안테나
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.4),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      antenna.position.set(0, 0.7, 0);
      alienGroup.add(antenna);

      const antBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      antBulb.position.set(0, 0.9, 0);
      alienGroup.add(antBulb);

      // 투명 UFO 글래스 돔 (드래그 가능)
      const domeGeo = new THREE.SphereGeometry(1.3, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const domeMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.85,
        opacity: 0.9,
        transparent: true,
        roughness: 0.1,
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(0, 0.3, 0);
      dome.name = 'draggable_dome';
      ufoGroup.add(dome);
      stageData.current.ufoDomeMesh = dome;
      stageData.current.domeOpened = false;
    } else if (stageNum === 3) {
      // ----------------------------------------------------
      // [STAGE 3] 열쇠 없이 황금 금고를 열어라!
      // ----------------------------------------------------
      setHintMessage('황금 금고의 비밀번호 다이얼을 터치하거나 돌려 락을 해제하세요!');

      // 금고 본체 (골든 큐브)
      const vaultBody = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 4.0, 3.2),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.25 })
      );
      vaultBody.position.set(0, -0.6, -0.5);
      stageGroup.add(vaultBody);

      // 내부 보물 더미
      const treasure = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 1.5, 16),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xeab308,
          emissiveIntensity: 0.5,
          metalness: 0.9,
        })
      );
      treasure.position.set(0, -0.8, -0.2);
      stageGroup.add(treasure);

      // 금고 문 (회전 피벗 그룹)
      const doorGroup = new THREE.Group();
      doorGroup.position.set(-1.95, -0.6, 1.15); // 좌측 힌지 피벗
      stageGroup.add(doorGroup);
      stageData.current.vaultDoorMesh = doorGroup;
      stageData.current.vaultOpened = false;

      // 도어 패널
      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(3.9, 3.9, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.7, roughness: 0.3 })
      );
      doorPanel.position.set(1.95, 0, 0);
      doorGroup.add(doorPanel);

      // 중앙 다이얼 휠 (클릭 가능)
      const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 0.25, 24),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.9, roughness: 0.2 })
      );
      dial.rotation.x = Math.PI / 2;
      dial.position.set(1.95, 0, 0.2);
      dial.name = 'clickable_dial';
      doorGroup.add(dial);
      stageData.current.vaultDialMesh = dial;
    }
  }, []);

  // 스테이지 성공 처리
  const handleStageSuccess = useCallback((nextMsg: string) => {
    setStageCleared(true);
    triggerHaptic(70);
    showToast(`🎉 정답입니다! ${nextMsg}`);

    setTimeout(() => {
      setCurrentStage((prev) => {
        const next = prev + 1;
        if (next > TOTAL_STAGES) {
          setGameWon(true);
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki-107',
            gameTitle: 'Brain Test Special 3D',
            isVictory: true,
            score: 300,
            maxTargetScore: 300,
            durationSeconds: dur,
          });
          setRewardReceipt(receipt);
          return prev;
        } else {
          setCurrentScore((s) => s + 100);
          loadStage(next);
          return next;
        }
      });
    }, 1500);
  }, [loadStage]);

  // Three.js 초기 셋업
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 씬 & 카메라
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfbf3d5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 10.5);
    camera.lookAt(0, 0, 0);
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

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    dirLight.position.set(5, 10, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 상단 No.107 공식 카드 영웅 배지 홀로그램 프레임
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#4c1d95';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#c084fc';
      bctx.lineWidth = 12;
      bctx.strokeRect(6, 6, 244, 244);
      drawCardSprite(bctx, 107, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const frameMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.6),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    frameMesh.position.set(0, 4.0, -3.0);
    scene.add(frameMesh);

    // 첫 번째 스테이지 로드
    loadStage(1);

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

    // 애니메이션 렌더 루프
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      // Stage 1 비행기 착륙 애니메이션
      if (currentStage === 1 && stageData.current.planeLanded && stageData.current.airplaneMesh) {
        const plane = stageData.current.airplaneMesh;
        if (plane.position.y > -2.2) {
          plane.position.y -= 0.06;
          plane.position.z += 0.08;
        }
      }

      // Stage 3 금고 문 열림 애니메이션
      if (currentStage === 3 && stageData.current.vaultOpened && stageData.current.vaultDoorMesh) {
        const door = stageData.current.vaultDoorMesh;
        if (door.rotation.y > -Math.PI * 0.55) {
          door.rotation.y -= 0.04;
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
  }, [loadStage, currentStage]);

  // ==========================================
  // 터치 & 마우스 레이캐스팅 인터랙션
  // ==========================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (stageCleared || gameWon) return;
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);

    if (currentStage === 1) {
      // 구름 터치 드래그 감지
      const cloud = stageData.current.cloudMesh;
      if (cloud) {
        const intersects = raycaster.current.intersectObjects(cloud.children, true);
        if (intersects.length > 0) {
          activeDraggableRef.current = cloud;
          triggerHaptic(30);
        }
      }
    } else if (currentStage === 2) {
      // UFO 돔 터치 드래그 감지
      const dome = stageData.current.ufoDomeMesh;
      if (dome) {
        const intersects = raycaster.current.intersectObject(dome, true);
        if (intersects.length > 0) {
          activeDraggableRef.current = dome;
          triggerHaptic(30);
        }
      }
    } else if (currentStage === 3) {
      // 금고 다이얼 터치 감지
      const dial = stageData.current.vaultDialMesh;
      if (dial) {
        const intersects = raycaster.current.intersectObject(dial, true);
        if (intersects.length > 0) {
          triggerHaptic(60);
          dial.rotation.z += Math.PI / 2;
          stageData.current.vaultOpened = true;
          showToast('🔓 찰칵! 금고 문이 열렸습니다!');
          handleStageSuccess('황금 금고 해제 성공!');
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDraggableRef.current || !cameraRef.current) return;
    const container = mountRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    if (raycaster.current.ray.intersectPlane(dragPlane.current, planeIntersect.current)) {
      if (currentStage === 1) {
        // 구름 좌우/상하 드래그
        activeDraggableRef.current.position.x = planeIntersect.current.x;
        activeDraggableRef.current.position.y = planeIntersect.current.y;

        // 화면 밖으로 충분히 치웠을 때
        if (Math.abs(planeIntersect.current.x) > 3.5 || planeIntersect.current.y > 3.0) {
          activeDraggableRef.current = null;
          stageData.current.planeLanded = true;
          triggerHaptic(80);
          showToast('🛬 활주로가 열렸습니다! 비행기가 안전하게 착륙합니다!');
          handleStageSuccess('안개 속 비행기 착륙 성공!');
        }
      } else if (currentStage === 2) {
        // UFO 돔 위로 들어올리기
        if (planeIntersect.current.y > 0.3) {
          activeDraggableRef.current.position.y = planeIntersect.current.y;
        }

        if (activeDraggableRef.current.position.y > 1.6 && !stageData.current.domeOpened) {
          stageData.current.domeOpened = true;
          activeDraggableRef.current = null;
          triggerHaptic(80);
          showToast('👽 삐리삐리~! 숨어있던 귀여운 외계인을 발견했습니다!');
          handleStageSuccess('외계인 찾기 성공!');
        }
      }
    }
  };

  const handlePointerUp = () => {
    activeDraggableRef.current = null;
  };

  // 힌트 및 원클릭 액션
  const handleSolveAction = () => {
    if (stageCleared || gameWon) return;
    triggerHaptic(40);

    if (currentStage === 1) {
      const cloud = stageData.current.cloudMesh;
      if (cloud) {
        cloud.position.x = 8.0; // 화면 밖으로 퇴장
        stageData.current.planeLanded = true;
        showToast('💡 힌트 액션: 구름을 걷어내고 비행기를 착륙시켰습니다!');
        handleStageSuccess('안개 속 비행기 착륙 성공!');
      }
    } else if (currentStage === 2) {
      const dome = stageData.current.ufoDomeMesh;
      if (dome) {
        dome.position.y = 2.5;
        stageData.current.domeOpened = true;
        showToast('💡 힌트 액션: UFO 돔을 열어 외계인을 찾았습니다!');
        handleStageSuccess('외계인 찾기 성공!');
      }
    } else if (currentStage === 3) {
      stageData.current.vaultOpened = true;
      showToast('💡 힌트 액션: 금고 비밀번호를 풀어 문을 열었습니다!');
      handleStageSuccess('황금 금고 해제 성공!');
    }
  };

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki-107',
      gameTitle: 'Brain Test Special 3D',
      isVictory: false,
      score: currentScore,
      maxTargetScore: 300,
      durationSeconds: dur,
    });
    // 정산 후 추가 팝업 없이 즉시 미션리스트로 이동
    const exitFn = (typeof handleExit === "function" ? handleExit : (onBack || onExit || onClose || (() => {})));
    exitFn();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hero-return-to-missions"));
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#fbf3d5]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 3D 뷰포트 마운트 */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미션 HUD */}
      <MinimalistMissionHUD
        gameTitle="BRAIN TEST SPECIAL 3D"
        missionTarget={`수수께끼: 스테이지 ${currentStage}/${TOTAL_STAGES}`}
        currentScore={currentScore}
        onBack={onBack}
        onForfeit={handleForfeit}
      />

      {/* 상단 가이드 및 토스트 피드백 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {toastText ? (
          <div className="bg-amber-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/50">
            {toastText}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-purple-200 border border-purple-500/30 font-mono text-center max-w-sm shadow-xl">
            {hintMessage}
          </div>
        )}
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 패널 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 px-6 z-20 pointer-events-auto">
        {/* 리트라이 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic(30);
            loadStage(currentStage);
            showToast('🔄 스테이지를 다시 시작합니다.');
          }}
          className="w-16 h-16 rounded-full bg-slate-800/80 active:bg-slate-700 text-white font-mono text-xs border border-white/20 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">🔄</span>
          <span className="text-[10px]">RETRY</span>
        </button>

        {/* 대형 힌트 / 솔브 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSolveAction();
          }}
          className="w-24 h-24 rounded-full bg-gradient-to-b from-purple-500 to-indigo-700 active:from-purple-600 active:to-indigo-800 text-white font-black text-sm border-2 border-purple-300 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">💡</span>
          <span className="tracking-wider text-xs font-mono font-bold">HINT!</span>
        </button>

        {/* 헬프 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            showToast(hintMessage);
            triggerHaptic(20);
          }}
          className="w-16 h-16 rounded-full bg-violet-800/80 active:bg-violet-700 text-white font-mono text-xs border border-violet-400/40 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-base">❓</span>
          <span className="text-[10px]">HELP</span>
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

export default PokiBrainTestSpecialGame;
