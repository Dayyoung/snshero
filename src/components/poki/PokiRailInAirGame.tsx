import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Gauge, AlertTriangle, Bell, Zap, RotateCcw, Volume2, VolumeX, CheckCircle } from 'lucide-react';

interface PokiRailInAirGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;
}

interface StationInfo {
  dist: number;
  name: string;
  cleared: boolean;
}

// 2,400m 3D 공중 레일 트랙 좌표 계산기
function getTrackPoint(dist: number): THREE.Vector3 {
  const z = dist;
  let x = 0;
  let y = 30 + Math.sin(dist * 0.006) * 6;

  // 1구간 우측 급커브 (450m ~ 700m)
  if (dist >= 450 && dist <= 700) {
    const t = (dist - 450) / 250;
    x = (1 - Math.cos(t * Math.PI)) * 25;
  } else if (dist > 700 && dist < 1250) {
    const t = (dist - 700) / 550;
    x = 50 + Math.sin(t * Math.PI * 2) * 12;
  }
  // 2구간 좌측 급커브 (1250m ~ 1550m)
  else if (dist >= 1250 && dist <= 1550) {
    const t = (dist - 1250) / 300;
    x = 50 - (1 - Math.cos(t * Math.PI)) * 35;
  } else if (dist > 1550) {
    x = -20 + Math.sin((dist - 1550) * 0.005) * 8;
  }

  return new THREE.Vector3(x, y, z);
}

// 트랙 진행 방향 벡터
function getTrackTangent(dist: number): THREE.Vector3 {
  const delta = 0.5;
  const p1 = getTrackPoint(dist - delta);
  const p2 = getTrackPoint(dist + delta);
  return p2.sub(p1).normalize();
}

// 해당 지점의 급커브 위험도 계수 (0.0 ~ 1.0)
function getCurveIntensity(dist: number): number {
  if (dist >= 480 && dist <= 680) return 0.85; // 제1 급커브
  if (dist >= 1280 && dist <= 1520) return 0.95; // 제2 헤어핀 커브
  if (dist >= 900 && dist <= 1050) return 0.45;
  return 0.1;
}

export default function PokiRailInAirGame({ onClose, onBack, cardId = 67 }: PokiRailInAirGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 HUD 상태
  const [distance, setDistance] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [derailRisk, setDerailRisk] = useState(0);
  const [currentStationName, setCurrentStationName] = useState('출발: 에어로 베이스');
  const [stationStopNotice, setStationStopNotice] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 조작 상태 레프
  const inputRef = useRef({
    throttle: false,
    brake: false,
    horn: false,
  });

  const stateRef = useRef({
    dist: 0,
    speed: 0, // 0 ~ 45 m/s (최대 약 162 km/h)
    risk: 0,
    stations: [
      { dist: 600, name: '스카이 하버 역 (Sky Harbor)', cleared: false },
      { dist: 1450, name: '클라우드 피크 역 (Cloud Peak)', cleared: false },
      { dist: 2200, name: '센트럴 에어 터미널 (Central Terminal)', cleared: false },
    ] as StationInfo[],
    stoppedAtStation: false,
    stationTimer: 0,
    passengerScore: 0,
    startTime: Date.now(),
    ended: false,
    hornTimer: 0,
    trainMeshes: [] as THREE.Group[],
    sparks: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
    birds: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number }[],
  });

  // 사운드 합성 (Web Audio API)
  const playSound = useCallback((type: 'horn' | 'brake' | 'chime' | 'alarm' | 'win' | 'derail') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'horn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.15);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'brake') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'chime') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.2, now + idx * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.35);
          o.start(now + idx * 0.12);
          o.stop(now + idx * 0.12 + 0.35);
        });
      } else if (type === 'alarm') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'derail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
      } else if (type === 'win') {
        [523, 659, 783, 1046, 1318].forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.25, now + idx * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
          o.start(now + idx * 0.1);
          o.stop(now + idx * 0.1 + 0.4);
        });
      }
    } catch {
      // AudioContext 미지원 안전 무시
    }
  }, [isMuted]);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬 및 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x70b5ff);
    scene.fog = new THREE.FogExp2(0xcce2ff, 0.003);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.5, 600);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7e6, 1.3);
    sunLight.position.set(100, 150, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // 구름 바다 (하단에 깔린 웅장한 구름 평면)
    const cloudGeo = new THREE.PlaneGeometry(800, 3000, 32, 64);
    cloudGeo.rotateX(-Math.PI / 2);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf0f7ff,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
    });
    const cloudSea = new THREE.Mesh(cloudGeo, cloudMat);
    cloudSea.position.set(0, 10, 1200);
    scene.add(cloudSea);

    // 3D 레일 트랙 생성 (좌우 듀얼 레일 + 침목 + 지지 기둥)
    const trackGroup = new THREE.Group();
    const railStep = 10;
    const totalDist = 2400;

    const sleeperGeo = new THREE.BoxGeometry(3.6, 0.3, 0.8);
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
    const pylonGeo = new THREE.CylinderGeometry(0.8, 1.2, 35, 8);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, roughness: 0.5 });

    // 레일 튜브 형상
    const leftCurvePoints: THREE.Vector3[] = [];
    const rightCurvePoints: THREE.Vector3[] = [];

    for (let d = -20; d <= totalDist; d += 8) {
      const pt = getTrackPoint(d);
      const tangent = getTrackTangent(d);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      leftCurvePoints.push(pt.clone().add(normal.clone().multiplyScalar(1.2)));
      rightCurvePoints.push(pt.clone().add(normal.clone().multiplyScalar(-1.2)));

      // 침목 배치
      if (d % railStep === 0) {
        const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
        sleeper.position.copy(pt);
        sleeper.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        trackGroup.add(sleeper);
      }

      // 교각 배치 (매 48m마다 지상으로 지탱)
      if (d % 48 === 0 && d > 0) {
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(pt.x, pt.y - 17.5, pt.z);
        trackGroup.add(pylon);
      }
    }

    const leftRailCurve = new THREE.CatmullRomCurve3(leftCurvePoints);
    const rightRailCurve = new THREE.CatmullRomCurve3(rightCurvePoints);
    const railTubeGeoLeft = new THREE.TubeGeometry(leftRailCurve, 300, 0.18, 6, false);
    const railTubeGeoRight = new THREE.TubeGeometry(rightRailCurve, 300, 0.18, 6, false);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8, roughness: 0.2 });

    const leftRailMesh = new THREE.Mesh(railTubeGeoLeft, railMat);
    const rightRailMesh = new THREE.Mesh(railTubeGeoRight, railMat);
    trackGroup.add(leftRailMesh);
    trackGroup.add(rightRailMesh);

    scene.add(trackGroup);

    // 스테이션 플랫폼 3개 생성
    const stationGeo = new THREE.BoxGeometry(10, 1.2, 40);
    const stationMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.6 });
    const roofGeo = new THREE.BoxGeometry(12, 0.5, 42);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0288d1, metalness: 0.5 });

    stateRef.current.stations.forEach((st) => {
      const stPt = getTrackPoint(st.dist);
      const stTang = getTrackTangent(st.dist);
      const stNorm = new THREE.Vector3(-stTang.z, 0, stTang.x).normalize();

      const stGroup = new THREE.Group();
      const platform = new THREE.Mesh(stationGeo, stationMat);
      platform.position.set(0, -0.6, 0);

      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 4.5, 0);

      stGroup.add(platform);
      stGroup.add(roof);
      stGroup.position.copy(stPt.clone().add(stNorm.multiplyScalar(4.5)));
      stGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), stTang);
      scene.add(stGroup);
    });

    // 3D 미래형 고속열차 생성 (기관차 1량 + 객차 2량)
    const trainCars: THREE.Group[] = [];
    const carLength = 7.5;
    const carWidth = 2.4;
    const carHeight = 2.2;

    for (let c = 0; c < 3; c++) {
      const carGroup = new THREE.Group();

      // 메인 바디
      const bodyMat = new THREE.MeshStandardMaterial({
        color: c === 0 ? 0x0288d1 : 0xe0e0e0,
        metalness: 0.6,
        roughness: 0.3,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(carWidth, carHeight, carLength), bodyMat);
      body.position.y = 1.2;
      body.castShadow = true;
      carGroup.add(body);

      // 창문 띠 (네온 블루)
      const windowMat = new THREE.MeshBasicMaterial({ color: 0x80d8ff });
      const windows = new THREE.Mesh(new THREE.BoxGeometry(carWidth + 0.05, 0.6, carLength - 1.5), windowMat);
      windows.position.y = 1.4;
      carGroup.add(windows);

      // 전두부 헤드라이트 (기관차 전용)
      if (c === 0) {
        const noseMat = new THREE.MeshStandardMaterial({ color: 0x01579b, metalness: 0.7 });
        const nose = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.2, 8), noseMat);
        nose.rotateX(Math.PI / 2);
        nose.position.set(0, 1.0, carLength / 2 + 0.8);
        carGroup.add(nose);

        // LED 헤드라이트
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffff8d });
        const lLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), lightMat);
        lLight.position.set(-0.7, 0.8, carLength / 2 + 1.2);
        const rLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), lightMat);
        rLight.position.set(0.7, 0.8, carLength / 2 + 1.2);
        carGroup.add(lLight);
        carGroup.add(rLight);

        // No.067 공식 카드 영웅 배지
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.width = 256;
        badgeCanvas.height = 256;
        const bCtx = badgeCanvas.getContext('2d');
        if (bCtx) {
          drawCardSprite(bCtx, cardId || 67, 128, 128, 220, 220);
        }
        const bTex = new THREE.CanvasTexture(badgeCanvas);
        const badgeMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
        const badgeMesh = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), badgeMat);
        badgeMesh.position.set(0, 2.5, 0);
        badgeMesh.rotateY(Math.PI);
        carGroup.add(badgeMesh);
      }

      scene.add(carGroup);
      trainCars.push(carGroup);
    }
    stateRef.current.trainMeshes = trainCars;

    // 공중 새 떼 파티클
    const birdGeo = new THREE.ConeGeometry(0.3, 0.8, 4);
    birdGeo.rotateX(Math.PI / 2);
    const birdMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let b = 0; b < 12; b++) {
      const birdMesh = new THREE.Mesh(birdGeo, birdMat);
      birdMesh.position.set((Math.random() - 0.5) * 60, 35 + Math.random() * 15, 100 + Math.random() * 300);
      scene.add(birdMesh);
      stateRef.current.birds.push({
        mesh: birdMesh,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 2,
        vz: 5 + Math.random() * 6,
      });
    }

    // 창 크기 조절
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
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
      const input = inputRef.current;

      if (state.ended) {
        renderer.render(scene, camera);
        return;
      }

      // 기차 물리 계산 (가속/감속)
      if (state.stoppedAtStation) {
        // 역 정차 대기 중
        state.speed = 0;
        state.stationTimer -= dt;
        if (state.stationTimer <= 0) {
          state.stoppedAtStation = false;
          setStationStopNotice(null);
        }
      } else {
        if (input.throttle) {
          state.speed += 9.0 * dt; // 가속 (최대 45m/s = 162 km/h)
        } else if (input.brake) {
          state.speed -= 18.0 * dt; // 급제동
          playSound('brake');
          // 브레이크 스파크 파티클
          if (state.speed > 5 && Math.random() < 0.6) {
            const spMesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.15, 0.15, 0.15),
              new THREE.MeshBasicMaterial({ color: 0xffeb3b })
            );
            const trainPt = getTrackPoint(state.dist);
            spMesh.position.set(trainPt.x + (Math.random() - 0.5) * 2, trainPt.y, trainPt.z);
            scene.add(spMesh);
            state.sparks.push({
              mesh: spMesh,
              vx: (Math.random() - 0.5) * 6,
              vy: 2 + Math.random() * 4,
              vz: -state.speed + (Math.random() - 0.5) * 4,
              life: 0.25,
            });
          }
        } else {
          // 자연 관성 서행
          state.speed -= 2.5 * dt;
        }
      }

      state.speed = Math.max(0, Math.min(state.speed, 45));
      state.dist += state.speed * dt;

      // HUD 표시 동기화
      const kmh = Math.round(state.speed * 3.6);
      setSpeedKmh(kmh);
      setDistance(Math.round(state.dist));

      // 급커브 및 탈선 위험도(Derail Risk) 물리
      const intensity = getCurveIntensity(state.dist);
      if (intensity > 0.4) {
        // 커브 구간 과속 시 위험도 상승 (기준 안전 속도: 75 km/h)
        if (kmh > 75) {
          const excess = (kmh - 75) / 50; // 과속 정도
          state.risk += excess * intensity * 35 * dt;
          playSound('alarm');
          if (navigator.vibrate) navigator.vibrate(30);
        } else {
          state.risk = Math.max(0, state.risk - 25 * dt);
        }
      } else {
        // 직선 구간에서는 위험도 점진 감소
        state.risk = Math.max(0, state.risk - 40 * dt);
      }
      setDerailRisk(Math.min(100, Math.round(state.risk)));

      // 탈선 판정 (위험도 100% 도달 시)
      if (state.risk >= 100 && !state.ended) {
        state.ended = true;
        setIsGameOver(true);
        playSound('derail');
        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const res = calculateAndDepositMissionReward({
          gameId: 'rail-in-the-air',
          gameTitle: '공중 철도 3D (Rail in the Air)',
          isVictory: false,
          score: Math.round(state.dist + state.passengerScore),
          maxTargetScore: 2500,
          durationSeconds: duration,
        });
        setRewardResult(res);
      }

      // 스테이션 정차 판정
      state.stations.forEach((st) => {
        if (!st.cleared && Math.abs(state.dist - st.dist) < 18) {
          setCurrentStationName(st.name);
          if (state.speed < 2.0 && !state.stoppedAtStation) {
            // 정차 성공!
            st.cleared = true;
            state.stoppedAtStation = true;
            state.stationTimer = 2.8;
            state.passengerScore += 300;
            playSound('chime');
            setStationStopNotice(`[${st.name}] 승객 승하차 완료! (+300점)`);
            if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
          }
        }
      });

      // 완주 판정 (2200m 센트럴 터미널 도착)
      if (state.dist >= 2200 && !state.ended) {
        state.ended = true;
        setIsGameWon(true);
        playSound('win');
        const finalScore = 2200 + state.passengerScore + (100 - state.risk) * 5;
        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        const res = calculateAndDepositMissionReward({
          gameId: 'rail-in-the-air',
          gameTitle: '공중 철도 3D (Rail in the Air)',
          isVictory: true,
          score: Math.round(finalScore),
          maxTargetScore: 2500,
          durationSeconds: duration,
        });
        setRewardResult(res);
      }

      // 경적(HORN) 입력 처리
      if (input.horn) {
        input.horn = false;
        playSound('horn');
        if (navigator.vibrate) navigator.vibrate(50);
        // 주변 새 떼 흩어짐
        state.birds.forEach((b) => {
          b.vx += (Math.random() - 0.5) * 15;
          b.vy += 8;
        });
      }

      // 3량 열차 메쉬 위치 및 뱅킹 틸트 동기화
      const carSpacing = 8.5;
      state.trainMeshes.forEach((car, idx) => {
        const carDist = Math.max(0, state.dist - idx * carSpacing);
        const pt = getTrackPoint(carDist);
        const tangent = getTrackTangent(carDist);

        car.position.copy(pt);
        car.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

        // 원심력에 의한 뱅킹 틸트 (Banking Tilt)
        const curveSign = (carDist >= 450 && carDist <= 700) ? 1 : (carDist >= 1250 && carDist <= 1550) ? -1 : 0;
        const rollAngle = -curveSign * (state.speed / 45) * 0.18;
        car.rotateZ(rollAngle);
      });

      // 카메라 트래킹 (기관차 후방 상단 숄더뷰)
      const headPt = getTrackPoint(state.dist);
      const headTang = getTrackTangent(state.dist);
      const camOffset = headTang.clone().multiplyScalar(-14).add(new THREE.Vector3(0, 6.5, 0));
      const targetCamPos = headPt.clone().add(camOffset);

      camera.position.lerp(targetCamPos, 0.12);
      camera.lookAt(headPt.clone().add(new THREE.Vector3(0, 2, 8)));

      // 스파크 파티클 업데이트
      for (let i = state.sparks.length - 1; i >= 0; i--) {
        const sp = state.sparks[i];
        sp.vy -= 15 * dt;
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        sp.life -= dt;
        if (sp.life <= 0) {
          scene.remove(sp.mesh);
          state.sparks.splice(i, 1);
        }
      }

      // 새 떼 애니메이션
      state.birds.forEach((b) => {
        b.mesh.position.x += b.vx * dt;
        b.mesh.position.y += b.vy * dt;
        b.mesh.position.z += b.vz * dt;
        if (b.mesh.position.z < state.dist - 50) {
          b.mesh.position.z = state.dist + 250 + Math.random() * 100;
        }
      });

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

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-slate-900 font-mono">
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 미션 표준 HUD */}
      <MinimalistMissionHUD
        title="RAIL IN THE AIR 3D"
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

      {/* 상단 속도계 및 탈선 위험도 인디케이터 */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* 디지털 속도계 & 주행 거리 */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-cyan-500/40 flex items-center gap-3">
          <Gauge className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <div className="text-xl font-black text-cyan-300 leading-none">
              {speedKmh} <span className="text-xs font-normal text-zinc-400">km/h</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">{distance}m / 2,200m</div>
          </div>
        </div>

        {/* 탈선 위험도 게이지 (Derail Risk) */}
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-sm border border-red-500/40 flex items-center gap-2.5">
          <AlertTriangle className={`w-5 h-5 ${derailRisk > 60 ? 'text-red-500 animate-ping' : 'text-amber-400'}`} />
          <div>
            <div className="flex justify-between items-center text-[10px] text-zinc-300 mb-0.5">
              <span>탈선 위험도</span>
              <span className={`font-bold ${derailRisk > 70 ? 'text-red-400' : 'text-amber-400'}`}>{derailRisk}%</span>
            </div>
            <div className="w-24 sm:w-32 bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
              <div
                className={`h-full transition-all duration-100 ${
                  derailRisk > 70 ? 'bg-red-500' : derailRisk > 40 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${derailRisk}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 스테이션 정차 안내 토스트 배너 */}
      {stationStopNotice && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 bg-cyan-900/90 text-cyan-200 border-2 border-cyan-400 px-4 py-2 rounded-sm text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-cyan-300" />
          {stationStopNotice}
        </div>
      )}

      {/* 현재 역 안내 */}
      <div className="absolute top-28 right-4 z-10 pointer-events-none bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-sm border border-white/20 text-[10px] text-zinc-300">
        역: <span className="text-white font-bold">{currentStationName}</span>
      </div>

      {/* 하단 모바일 퓨어 터치 컨트롤 바 */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        {/* 좌측: 경적 (HORN - 64px) */}
        <div className="pointer-events-auto">
          <button
            onClick={() => {
              inputRef.current.horn = true;
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-600/80 backdrop-blur-md border-2 border-amber-400 text-white rounded-lg active:scale-95 active:bg-amber-500 flex flex-col items-center justify-center font-bold shadow-lg shadow-amber-600/30"
          >
            <Bell className="w-6 h-6 mb-0.5 animate-bounce" />
            <span className="text-[10px]">경적 HORN</span>
          </button>
        </div>

        {/* 우측: 제동 (BRAKE - 64px) & 가속 (THROTTLE - 76px 메인 버튼) */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* 비상 제동 (BRAKE) */}
          <button
            onTouchStart={() => {
              inputRef.current.brake = true;
            }}
            onTouchEnd={() => {
              inputRef.current.brake = false;
            }}
            onMouseDown={() => {
              inputRef.current.brake = true;
            }}
            onMouseUp={() => {
              inputRef.current.brake = false;
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600/80 backdrop-blur-md border-2 border-red-400 text-white rounded-lg active:scale-95 active:bg-red-500 flex flex-col items-center justify-center font-bold shadow-lg shadow-red-600/30"
          >
            <span className="text-lg">STOP</span>
            <span className="text-[9px] text-red-200">제동 BRAKE</span>
          </button>

          {/* 가속 레버 (THROTTLE - 76px 대형 버튼) */}
          <button
            onTouchStart={() => {
              inputRef.current.throttle = true;
            }}
            onTouchEnd={() => {
              inputRef.current.throttle = false;
            }}
            onMouseDown={() => {
              inputRef.current.throttle = true;
            }}
            onMouseUp={() => {
              inputRef.current.throttle = false;
            }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-cyan-600 border-3 border-cyan-300 text-white rounded-full active:scale-90 flex flex-col items-center justify-center font-black shadow-xl shadow-cyan-600/50 active:bg-cyan-500"
          >
            <Zap className="w-8 h-8" />
            <span className="text-[11px] tracking-wider mt-0.5">가속 RUN</span>
          </button>
        </div>
      </div>

      {/* 게임 패배(탈선) 모달 */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="text-3xl font-black text-red-500 mb-2 animate-bounce">기차 탈선 (DERAILED)</div>
          <p className="text-zinc-400 text-xs mb-4">급커브 구간에서 과속하여 공중 레일을 이탈했습니다!</p>
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-sm w-full max-w-xs mb-6 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">주행 거리:</span>
              <span className="font-bold text-white">{distance}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">최종 속도:</span>
              <span className="font-bold text-red-400">{speedKmh} km/h</span>
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
          gameTitle="공중 철도 3D (Rail in the Air)"
        />
      )}
    </div>
  );
}
