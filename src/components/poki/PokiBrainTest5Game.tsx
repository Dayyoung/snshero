import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiBrainTest5GameProps {
  onBack: () => void;

  onExit?: () => void;
  onClose?: () => void;
}

const TOTAL_STAGES = 3;

export const PokiBrainTest5Game: React.FC<PokiBrainTest5GameProps> = ({
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

  // 조명 레퍼런스
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const candleLightRef = useRef<THREE.PointLight | null>(null);

  // 스테이지 그룹 및 오브젝트 레퍼런스
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const activeDraggableRef = useRef<THREE.Object3D | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const planeIntersect = useRef(new THREE.Vector3());

  // 스테이지별 개별 상태
  const stageData = useRef({
    // Stage 1
    appleScale: 1.0,
    targetFruitMesh: null as THREE.Mesh | null,
    // Stage 2
    catMesh: null as THREE.Group | null,
    canMesh: null as THREE.Group | null,
    catAwake: false,
    canOpened: false,
    // Stage 3
    matchMesh: null as THREE.Group | null,
    matchBoxMesh: null as THREE.Mesh | null,
    candleMesh: null as THREE.Group | null,
    matchLit: false,
    candleLit: false,
    flameMesh: null as THREE.Mesh | null,
    matchFlameMesh: null as THREE.Mesh | null,
  });

  // 진동 헬퍼
  const triggerHaptic = (duration = 40) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  // 피드백 토스트
  const showToast = (text: string) => {
    setToastText(text);
    setTimeout(() => {
      setToastText((prev) => (prev === text ? '' : prev));
    }, 2200);
  };

  // ==========================================
  // 스테이지 전환 및 3D 씬 구축
  // ==========================================
  const loadStage = useCallback((stageNum: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 기존 스테이지 오브젝트 정리
    if (stageGroupRef.current) {
      scene.remove(stageGroupRef.current);
    }

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);
    stageGroupRef.current = stageGroup;

    setStageCleared(false);
    activeDraggableRef.current = null;

    // 조명 기본 리셋
    if (ambientLightRef.current) ambientLightRef.current.intensity = 1.4;
    if (dirLightRef.current) dirLightRef.current.intensity = 1.6;
    if (candleLightRef.current) candleLightRef.current.intensity = 0;

    if (stageNum === 1) {
      // ----------------------------------------------------
      // [STAGE 1] 가장 큰 과일을 찾아라!
      // ----------------------------------------------------
      setHintMessage('테이블 위의 과일들을 자세히 보세요. 터치하면 마법처럼 커질지도?!');

      // 3D 우드 테이블
      const tableGeo = new THREE.BoxGeometry(7, 0.4, 3.5);
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.4 });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(0, -1.8, 0);
      stageGroup.add(table);

      // 테이블 다리 2개
      const legGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.5);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x713f12 });
      const leg1 = new THREE.Mesh(legGeo, legMat);
      leg1.position.set(-2.8, -3.0, 0);
      stageGroup.add(leg1);
      const leg2 = new THREE.Mesh(legGeo, legMat);
      leg2.position.set(2.8, -3.0, 0);
      stageGroup.add(leg2);

      // 과일 1: 작은 체리 (좌측)
      const cherry = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2 })
      );
      cherry.position.set(-2.0, -1.2, 0.2);
      stageGroup.add(cherry);

      // 과일 2: 바나나 (우측)
      const banana = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 1.4, 16),
        new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 })
      );
      banana.rotation.z = Math.PI / 3;
      banana.position.set(2.0, -1.2, 0.2);
      stageGroup.add(banana);

      // 과일 3: 마법의 사과 (중앙 - 탭할 때마다 거대 수박으로 변신!)
      const appleGeo = new THREE.SphereGeometry(0.65, 32, 32);
      const appleMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.2,
        metalness: 0.1,
      });
      const apple = new THREE.Mesh(appleGeo, appleMat);
      apple.position.set(0, -0.9, 0.5);
      apple.name = 'clickable_apple';
      stageGroup.add(apple);

      // 꼭지
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x15803d })
      );
      stem.position.set(0, 0.7, 0);
      apple.add(stem);

      stageData.current.targetFruitMesh = apple;
      stageData.current.appleScale = 1.0;
    } else if (stageNum === 2) {
      // ----------------------------------------------------
      // [STAGE 2] 깊이 잠든 고양이를 깨워라!
      // ----------------------------------------------------
      setHintMessage('잠든 냥이를 깨우려면 맛있는 참치캔을 따서 코앞으로 가져가보세요!');

      // 3D 소파
      const sofaBase = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 1.2, 2.8),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 })
      );
      sofaBase.position.set(1.2, -1.8, 0);
      stageGroup.add(sofaBase);

      const sofaBack = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 2.5, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.6 })
      );
      sofaBack.position.set(1.2, -0.6, -1.0);
      stageGroup.add(sofaBack);

      // 잠자는 고양이 모델 그룹
      const catGroup = new THREE.Group();
      catGroup.position.set(1.2, -0.7, 0.2);
      stageGroup.add(catGroup);
      stageData.current.catMesh = catGroup;
      stageData.current.catAwake = false;

      // 몸체
      const catBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 })
      );
      catGroup.add(catBody);

      // 머리
      const catHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 })
      );
      catHead.position.set(-0.6, 0.35, 0.2);
      catGroup.add(catHead);

      // 귀 2개
      const catEar1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.35, 16),
        new THREE.MeshStandardMaterial({ color: 0xea580c })
      );
      catEar1.position.set(-0.7, 0.8, 0.3);
      catEar1.rotation.z = 0.3;
      catGroup.add(catEar1);

      const catEar2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.35, 16),
        new THREE.MeshStandardMaterial({ color: 0xea580c })
      );
      catEar2.position.set(-0.5, 0.8, 0.1);
      catEar2.rotation.z = -0.3;
      catGroup.add(catEar2);

      // 눈 (감은 눈 텍스처/메시)
      const closedEyeGeo = new THREE.BoxGeometry(0.18, 0.04, 0.05);
      const closedEyeMat = new THREE.MeshBasicMaterial({ color: 0x431407 });
      const eyeL = new THREE.Mesh(closedEyeGeo, closedEyeMat);
      eyeL.position.set(-0.95, 0.35, 0.4);
      catGroup.add(eyeL);

      // 꼬리
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.0),
        new THREE.MeshStandardMaterial({ color: 0xf97316 })
      );
      tail.position.set(0.8, -0.2, 0.3);
      tail.rotation.z = 1.2;
      catGroup.add(tail);

      // 참치 캔 (드래그 가능)
      const canGroup = new THREE.Group();
      canGroup.position.set(-2.8, -1.8, 0.5);
      canGroup.name = 'draggable_can';
      stageGroup.add(canGroup);
      stageData.current.canMesh = canGroup;
      stageData.current.canOpened = false;

      const canBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.45, 24),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
      );
      canGroup.add(canBody);

      // 캔 라벨
      const canLabel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.505, 0.505, 0.25, 24),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      canGroup.add(canLabel);

      // 캔 뚜껑 링
      const pullRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.03, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
      );
      pullRing.position.set(0, 0.24, 0);
      pullRing.rotation.x = Math.PI / 2;
      canGroup.add(pullRing);
    } else if (stageNum === 3) {
      // ----------------------------------------------------
      // [STAGE 3] 어두운 방을 환하게 밝혀라!
      // ----------------------------------------------------
      setHintMessage('성냥을 집어 성냥갑에 긁어 불을 붙인 뒤, 양초에 촛불을 켜보세요!');

      // 어둑한 방 연출
      if (ambientLightRef.current) ambientLightRef.current.intensity = 0.25;
      if (dirLightRef.current) dirLightRef.current.intensity = 0.2;

      // 테이블
      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 2.0, 0.4, 24),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
      );
      stand.position.set(0, -2.0, 0);
      stageGroup.add(stand);

      // 3D 촛대 & 양초 그룹
      const candleGroup = new THREE.Group();
      candleGroup.position.set(1.5, -0.6, 0);
      stageGroup.add(candleGroup);
      stageData.current.candleMesh = candleGroup;
      stageData.current.candleLit = false;

      // 양초 몸체
      const wax = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 1.8, 20),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })
      );
      wax.position.set(0, 0, 0);
      candleGroup.add(wax);

      // 심지
      const wick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.25),
        new THREE.MeshBasicMaterial({ color: 0x1c1917 })
      );
      wick.position.set(0, 1.0, 0);
      candleGroup.add(wick);

      // 촛불 불꽃 (처음엔 비활성)
      const flameGeo = new THREE.ConeGeometry(0.2, 0.6, 16);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 1.35, 0);
      flame.visible = false;
      candleGroup.add(flame);
      stageData.current.flameMesh = flame;

      // 성냥갑 (Matchbox)
      const boxGeo = new THREE.BoxGeometry(1.6, 0.5, 1.0);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
      const matchBox = new THREE.Mesh(boxGeo, boxMat);
      matchBox.position.set(-2.0, -1.7, 0);
      stageGroup.add(matchBox);
      stageData.current.matchBoxMesh = matchBox;

      // 성냥갑 옆면 스트라이커 (마찰 스트라이프)
      const striker = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x451a03, side: THREE.DoubleSide })
      );
      striker.position.set(0, 0, 0.51);
      matchBox.add(striker);

      // 3D 성냥개비 (드래그 가능)
      const matchGroup = new THREE.Group();
      matchGroup.position.set(-2.0, -0.6, 0.5);
      matchGroup.name = 'draggable_match';
      stageGroup.add(matchGroup);
      stageData.current.matchMesh = matchGroup;
      stageData.current.matchLit = false;

      // 나무 막대
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xfef3c7 })
      );
      stick.rotation.z = Math.PI / 4;
      matchGroup.add(stick);

      // 황 머리
      const matchHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 })
      );
      matchHead.position.set(-0.45, 0.45, 0);
      matchGroup.add(matchHead);

      // 성냥 머리 불꽃 (처음엔 비활성)
      const mFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.35, 12),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      mFlame.position.set(-0.55, 0.65, 0);
      mFlame.visible = false;
      matchGroup.add(mFlame);
      stageData.current.matchFlameMesh = mFlame;
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
          // 최종 승리!
          setGameWon(true);
          const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const receipt = calculateAndDepositMissionReward({
            gameId: 'poki-104',
            gameTitle: 'Brain Test 5 3D',
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

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 9.5);
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
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    dirLight.position.set(4, 8, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 양초 불꽃 포인트 라이트
    const candleLight = new THREE.PointLight(0xf59e0b, 0, 15);
    candleLight.position.set(1.5, 0.8, 0.2);
    scene.add(candleLight);
    candleLightRef.current = candleLight;

    // 룸 배경 벽면 & 바닥
    const roomFloorGeo = new THREE.PlaneGeometry(24, 12);
    const roomFloorMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.6 });
    const roomFloor = new THREE.Mesh(roomFloorGeo, roomFloorMat);
    roomFloor.position.set(0, -3.2, 0);
    roomFloor.rotation.x = -Math.PI / 2;
    scene.add(roomFloor);

    const roomWallGeo = new THREE.PlaneGeometry(24, 14);
    const roomWallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const roomWall = new THREE.Mesh(roomWallGeo, roomWallMat);
    roomWall.position.set(0, 2.5, -3.5);
    scene.add(roomWall);

    // 상단 No.104 공식 카드 영웅 배지 액자
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bctx = badgeCanvas.getContext('2d');
    if (bctx) {
      bctx.fillStyle = '#312e81';
      bctx.fillRect(0, 0, 256, 256);
      bctx.strokeStyle = '#fbbf24';
      bctx.lineWidth = 12;
      bctx.strokeRect(6, 6, 244, 244);
      drawCardSprite(bctx, 104, 28, 28, 200, 200, { circleClip: true });
    }
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const frameMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.6),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    frameMesh.position.set(0, 3.2, -3.4);
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

    // 렌더 루프
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const time = performance.now() * 0.003;

      // 양초 불꽃 미세 깜빡임
      if (stageData.current.candleLit && candleLightRef.current && stageData.current.flameMesh) {
        const flicker = 1.0 + Math.sin(time * 8) * 0.15 + (Math.random() - 0.5) * 0.1;
        candleLightRef.current.intensity = 2.8 * flicker;
        stageData.current.flameMesh.scale.set(flicker, flicker, flicker);
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
  }, [loadStage]);

  // ==========================================
  // 터치 & 마우스 드래그 레이캐스팅
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
      // Stage 1: 사과 탭 시 거대 수박으로 변신
      const apple = stageData.current.targetFruitMesh;
      if (apple) {
        const intersects = raycaster.current.intersectObject(apple, true);
        if (intersects.length > 0) {
          triggerHaptic(50);
          stageData.current.appleScale += 0.65;
          apple.scale.set(
            stageData.current.appleScale,
            stageData.current.appleScale,
            stageData.current.appleScale
          );

          if (stageData.current.appleScale >= 2.8) {
            // 거대 수박/자이언트 과일 달성!
            (apple.material as THREE.MeshStandardMaterial).color.set(0x15803d);
            showToast('🍉 사과가 마법의 거대 수박으로 자라났습니다!');
            handleStageSuccess('가장 큰 과일 발견 성공!');
          }
        }
      }
    } else if (currentStage === 2) {
      // Stage 2: 캔 터치 감지
      const can = stageData.current.canMesh;
      if (can) {
        const intersects = raycaster.current.intersectObject(can, true);
        if (intersects.length > 0) {
          activeDraggableRef.current = can;
          triggerHaptic(30);
        }
      }
    } else if (currentStage === 3) {
      // Stage 3: 성냥 터치 감지
      const match = stageData.current.matchMesh;
      if (match) {
        const intersects = raycaster.current.intersectObject(match, true);
        if (intersects.length > 0) {
          activeDraggableRef.current = match;
          triggerHaptic(30);
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
      activeDraggableRef.current.position.set(
        planeIntersect.current.x,
        planeIntersect.current.y,
        0.6
      );

      // Stage 2 충돌/도달 검사: 캔을 고양이 코앞으로
      if (currentStage === 2 && !stageData.current.catAwake) {
        const cat = stageData.current.catMesh;
        if (cat) {
          const dist = activeDraggableRef.current.position.distanceTo(cat.position);
          if (dist < 1.6) {
            stageData.current.catAwake = true;
            triggerHaptic(80);
            showToast('🐱 냥이가 맛있는 참치 캔 냄새를 맡고 일어났습니다!');

            // 고양이 번쩍 일어남
            cat.position.y += 0.5;
            cat.rotation.y = Math.PI / 4;
            handleStageSuccess('잠든 고양이 깨우기 성공!');
          }
        }
      }

      // Stage 3 충돌 검사: 성냥 마찰 & 양초 점화
      if (currentStage === 3) {
        const matchPos = activeDraggableRef.current.position;
        const box = stageData.current.matchBoxMesh;
        const candle = stageData.current.candleMesh;

        // 1. 성냥갑에 긁어 발화
        if (!stageData.current.matchLit && box) {
          if (matchPos.distanceTo(box.position) < 1.2) {
            stageData.current.matchLit = true;
            triggerHaptic(60);
            showToast('🔥 치익~ 성냥에 불이 붙었습니다!');
            if (stageData.current.matchFlameMesh) {
              stageData.current.matchFlameMesh.visible = true;
            }
          }
        }

        // 2. 불붙은 성냥을 양초 심지로 가져가 점등
        if (stageData.current.matchLit && !stageData.current.candleLit && candle) {
          if (matchPos.distanceTo(candle.position) < 1.4) {
            stageData.current.candleLit = true;
            triggerHaptic(90);
            showToast('🕯️ 양초에 불이 환하게 밝혀졌습니다!');

            if (stageData.current.flameMesh) {
              stageData.current.flameMesh.visible = true;
            }
            if (ambientLightRef.current) ambientLightRef.current.intensity = 1.6;
            if (dirLightRef.current) dirLightRef.current.intensity = 1.8;
            if (candleLightRef.current) candleLightRef.current.intensity = 3.0;

            handleStageSuccess('어두운 방을 환하게 밝혔습니다!');
          }
        }
      }
    }
  };

  const handlePointerUp = () => {
    activeDraggableRef.current = null;
  };

  // 힌트 / 원클릭 해결 액션
  const handleSolveAction = () => {
    if (stageCleared || gameWon) return;
    triggerHaptic(40);

    if (currentStage === 1) {
      const apple = stageData.current.targetFruitMesh;
      if (apple) {
        stageData.current.appleScale = 3.0;
        apple.scale.set(3, 3, 3);
        (apple.material as THREE.MeshStandardMaterial).color.set(0x15803d);
        showToast('💡 힌트 액션: 사과를 초거대 수박으로 키웠습니다!');
        handleStageSuccess('가장 큰 과일 발견 성공!');
      }
    } else if (currentStage === 2) {
      const can = stageData.current.canMesh;
      const cat = stageData.current.catMesh;
      if (can && cat) {
        can.position.set(0.5, -0.6, 0.5);
        stageData.current.catAwake = true;
        cat.position.y += 0.5;
        cat.rotation.y = Math.PI / 4;
        showToast('💡 힌트 액션: 참치 캔을 냥이 코앞으로 가져갔습니다!');
        handleStageSuccess('잠든 고양이 깨우기 성공!');
      }
    } else if (currentStage === 3) {
      stageData.current.matchLit = true;
      stageData.current.candleLit = true;
      if (stageData.current.flameMesh) stageData.current.flameMesh.visible = true;
      if (ambientLightRef.current) ambientLightRef.current.intensity = 1.6;
      if (dirLightRef.current) dirLightRef.current.intensity = 1.8;
      if (candleLightRef.current) candleLightRef.current.intensity = 3.0;
      showToast('💡 힌트 액션: 성냥으로 양초에 촛불을 켰습니다!');
      handleStageSuccess('어두운 방을 환하게 밝혔습니다!');
    }
  };

  // 포기 시 보상 정산
  const handleForfeit = () => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const receipt = calculateAndDepositMissionReward({
      gameId: 'poki-104',
      gameTitle: 'Brain Test 5 3D',
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
        gameTitle="BRAIN TEST 5 3D"
        missionTarget={`수수께끼: 스테이지 ${currentStage}/${TOTAL_STAGES}`}
        currentScore={currentScore}
        onBack={onBack}
        onForfeit={handleForfeit}
      />

      {/* 상단 가이드 & 토스트 메시지 */}
      <div className="absolute top-18 left-0 right-0 flex flex-col items-center pointer-events-none z-10 px-4">
        {toastText ? (
          <div className="bg-amber-400 text-black font-black text-sm px-4 py-1.5 rounded-full shadow-lg animate-bounce border border-white/50">
            {toastText}
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-white/90 border border-white/20 font-mono text-center max-w-sm shadow-xl">
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
          className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-400 to-yellow-600 active:from-amber-500 active:to-yellow-700 text-black font-black text-sm border-2 border-yellow-200 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all animate-pulse"
        >
          <span className="text-2xl">💡</span>
          <span className="tracking-wider text-xs font-mono font-bold">HINT!</span>
        </button>

        {/* 다음 스테이지 스킵/힌트 안내 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            showToast(hintMessage);
            triggerHaptic(20);
          }}
          className="w-16 h-16 rounded-full bg-indigo-700/80 active:bg-indigo-600 text-white font-mono text-xs border border-indigo-400/40 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
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

export default PokiBrainTest5Game;
