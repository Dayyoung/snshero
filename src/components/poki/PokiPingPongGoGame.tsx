import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';
import { Trophy, Zap, RotateCcw, Volume2, VolumeX, Flame, Award, CircleDot } from 'lucide-react';

interface PokiPingPongGoGameProps {
  onClose?: () => void;
  onBack?: () => void;
  cardId?: number;

  onExit?: () => void;
}

export default function PokiPingPongGoGame({
  onClose,
  onBack,
  cardId = 74,
  onExit
}: PokiPingPongGoGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleExit = onClose || onBack || (() => {});

  // 게임 HUD 상태
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [rallyCount, setRallyCount] = useState(0);
  const [smashReady, setSmashReady] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);

  // 조작 상태 레프
  const inputRef = useRef({
    targetPaddleX: 0,
    smashRequested: false,
    spinRequested: false,
  });

  const stateRef = useRef({
    ballX: 0,
    ballY: 3.2,
    ballZ: 0,
    ballVx: 0,
    ballVy: 4,
    ballVz: 18,
    playerPaddleX: 0,
    aiPaddleX: 0,
    rally: 0,
    pScore: 0,
    aScore: 0,
    isSmash: false,
    startTime: Date.now(),
    ended: false,
    ballMesh: null as THREE.Mesh | null,
    playerPaddleMesh: null as THREE.Group | null,
    aiPaddleMesh: null as THREE.Group | null,
    particles: [] as { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[],
  });

  const WIN_SCORE = 5;
  const TABLE_Y = 2.4;
  const PLAYER_PADDLE_Z = -7.5;
  const AI_PADDLE_Z = 7.5;

  // 사운드 합성
  const playSound = useCallback((type: 'paddle' | 'table' | 'smash' | 'score' | 'win' | 'lose') => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'paddle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'table') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'smash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'score') {
        [523, 783].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.2, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.2);
        });
      } else if (type === 'win') {
        [523, 659, 783, 1046].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          g.gain.setValueAtTime(0.25, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.35);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.35);
        });
      } else if (type === 'lose') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // AudioContext 미지원 무시
    }
  }, [isMuted]);

  // 공 리셋 함수
  const serveBall = useCallback((toPlayer: boolean) => {
    const s = stateRef.current;
    s.ballX = toPlayer ? s.playerPaddleX : s.aiPaddleX;
    s.ballY = TABLE_Y + 1.2;
    s.ballZ = toPlayer ? PLAYER_PADDLE_Z + 1.0 : AI_PADDLE_Z - 1.0;
    s.ballVx = (Math.random() - 0.5) * 4;
    s.ballVy = 4.5;
    s.ballVz = toPlayer ? 18 : -18;
    s.rally = 0;
    s.isSmash = false;
    setRallyCount(0);
  }, []);

  // Three.js 3D 환경 구축
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 씬 및 렌더러
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc5e8eb); // 스포츠 스타디움 딥블루

    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.5, 120);
    camera.position.set(0, 7.8, -12.5);
    camera.lookAt(0, 2.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const stadiumSpot = new THREE.DirectionalLight(0xfffde7, 1.3);
    stadiumSpot.position.set(0, 20, 0);
    stadiumSpot.castShadow = true;
    scene.add(stadiumSpot);

    // 경기장 바닥 (우드 코트)
    const floorGeo = new THREE.PlaneGeometry(24, 28);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xc2185b, roughness: 0.5 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    // 3D 국제 규격 탁구대 (테이블 상판: 6.8m x 13.6m x 0.3m 스케일)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, TABLE_Y, 0);

    const tableTopMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.3 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.25, 13.6), tableTopMat);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // 백색 테두리 라인
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 13.6), lineMat);
    centerLine.rotateX(-Math.PI / 2);
    centerLine.position.y = 0.13;
    tableGroup.add(centerLine);

    // 중앙 네트 (Net)
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      roughness: 0.8,
    });
    const net = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.9, 0.08), netMat);
    net.position.y = 0.55;
    tableGroup.add(net);

    // 탁구대 다리 4개
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, TABLE_Y, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.7 });
    const legPos = [
      [-3.0, -TABLE_Y / 2, -5.8],
      [3.0, -TABLE_Y / 2, -5.8],
      [-3.0, -TABLE_Y / 2, 5.8],
      [3.0, -TABLE_Y / 2, 5.8],
    ];
    legPos.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, ly, lz);
      tableGroup.add(leg);
    });

    scene.add(tableGroup);

    // 3D 오렌지 탁구공
    const ballGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xff6d00, roughness: 0.3 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, TABLE_Y + 1.2, 0);
    ball.castShadow = true;
    scene.add(ball);
    stateRef.current.ballMesh = ball;

    // 플레이어 패들 (레드 러버 + 우드 핸들 + No.074 카드 영웅 배지)
    const playerPaddle = new THREE.Group();
    playerPaddle.position.set(0, TABLE_Y + 0.6, PLAYER_PADDLE_Z);

    const paddleBlade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: 0xd50000, roughness: 0.4 })
    );
    paddleBlade.rotateX(Math.PI / 2);
    paddleBlade.castShadow = true;

    const paddleHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
    );
    paddleHandle.position.set(0, -1.0, 0);

    playerPaddle.add(paddleBlade);
    playerPaddle.add(paddleHandle);

    // No.074 카드 영웅 배지
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      drawCardSprite(bCtx, cardId || 74, 128, 128, 220, 220);
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), bMat);
    badge.position.set(0, 0, -0.06);
    badge.rotateY(Math.PI);
    playerPaddle.add(badge);

    scene.add(playerPaddle);
    stateRef.current.playerPaddleMesh = playerPaddle;

    // AI 패들 (블랙 러버 + 우드 핸들)
    const aiPaddle = new THREE.Group();
    aiPaddle.position.set(0, TABLE_Y + 0.6, AI_PADDLE_Z);

    const aiBlade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.4 })
    );
    aiBlade.rotateX(Math.PI / 2);
    aiBlade.castShadow = true;

    const aiHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63 })
    );
    aiHandle.position.set(0, -1.0, 0);

    aiPaddle.add(aiBlade);
    aiPaddle.add(aiHandle);
    scene.add(aiPaddle);
    stateRef.current.aiPaddleMesh = aiPaddle;

    // 리사이즈
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

      // 플레이어 패들 X 추종 (Screen-relative 완벽 일치)
      state.playerPaddleX = THREE.MathUtils.lerp(state.playerPaddleX, input.targetPaddleX, 0.25);
      state.playerPaddleX = Math.max(-3.2, Math.min(3.2, state.playerPaddleX));

      if (state.playerPaddleMesh) {
        state.playerPaddleMesh.position.x = state.playerPaddleX;
      }

      // AI 패들 추종 (공의 X 위치를 약간의 딜레이로 추종)
      state.aiPaddleX = THREE.MathUtils.lerp(state.aiPaddleX, state.ballX, 0.12);
      state.aiPaddleX = Math.max(-3.2, Math.min(3.2, state.aiPaddleX));

      if (state.aiPaddleMesh) {
        state.aiPaddleMesh.position.x = state.aiPaddleX;
      }

      // 공 물리 계산
      state.ballVy -= 16 * dt; // 중력
      state.ballX += state.ballVx * dt;
      state.ballY += state.ballVy * dt;
      state.ballZ += state.ballVz * dt;

      // 탁구대 상판 바운스 판정
      if (state.ballY <= TABLE_Y + 0.18 && Math.abs(state.ballX) <= 3.4 && Math.abs(state.ballZ) <= 6.8) {
        state.ballY = TABLE_Y + 0.18;
        state.ballVy = Math.max(3.8, Math.abs(state.ballVy) * 0.88);
        playSound('table');
        if (navigator.vibrate) navigator.vibrate(15);
      }

      // 찬스 볼 (스매시 가능 여부: 공이 높이 떴을 때)
      const canSmash = state.ballY > TABLE_Y + 1.2 && state.ballZ < -4.5 && state.ballVz < 0;
      setSmashReady(canSmash);

      // 플레이어 라켓 타구 판정 (z: -7.5 부근)
      if (
        state.ballZ <= PLAYER_PADDLE_Z + 0.6 &&
        state.ballZ >= PLAYER_PADDLE_Z - 0.6 &&
        state.ballVz < 0 &&
        Math.abs(state.ballX - state.playerPaddleX) < 1.3
      ) {
        state.rally++;
        setRallyCount(state.rally);

        // 스매시 요청 시
        if (input.smashRequested || canSmash) {
          input.smashRequested = false;
          state.isSmash = true;
          state.ballVz = 32; // 초고속 스파이크
          state.ballVy = 4.2;
          state.ballVx = (state.ballX - state.playerPaddleX) * 4;
          playSound('smash');
          if (navigator.vibrate) navigator.vibrate([40, 80, 40]);

          // 스매시 파이어 파티클
          for (let p = 0; p < 8; p++) {
            const pMesh = new THREE.Mesh(
              new THREE.BoxGeometry(0.15, 0.15, 0.15),
              new THREE.MeshBasicMaterial({ color: 0xffd600 })
            );
            pMesh.position.set(state.ballX, state.ballY, state.ballZ);
            scene.add(pMesh);
            state.particles.push({
              mesh: pMesh,
              vx: (Math.random() - 0.5) * 4,
              vy: Math.random() * 3,
              vz: 15 + Math.random() * 10,
              life: 0.25,
            });
          }
        }
        // 스핀 요청 시
        else if (input.spinRequested) {
          input.spinRequested = false;
          state.ballVz = 20;
          state.ballVy = 5.0;
          state.ballVx = (state.ballX < 0 ? 5.5 : -5.5); // 사이드 스핀 커브
          playSound('paddle');
          if (navigator.vibrate) navigator.vibrate(25);
        } else {
          // 일반 타구
          state.ballVz = 21;
          state.ballVy = 4.8;
          state.ballVx = (state.ballX - state.playerPaddleX) * 3.5;
          playSound('paddle');
          if (navigator.vibrate) navigator.vibrate(20);
        }
      }

      // AI 라켓 타구 판정 (z: 7.5 부근)
      if (
        state.ballZ >= AI_PADDLE_Z - 0.6 &&
        state.ballZ <= AI_PADDLE_Z + 0.6 &&
        state.ballVz > 0 &&
        Math.abs(state.ballX - state.aiPaddleX) < 1.3
      ) {
        // 스매시 볼은 AI가 놓칠 확률 50%
        if (state.isSmash && Math.random() < 0.5) {
          // AI 미스!
        } else {
          state.isSmash = false;
          state.ballVz = -20;
          state.ballVy = 4.8;
          state.ballVx = (Math.random() - 0.5) * 5;
          playSound('paddle');
        }
      }

      // 득점 / 실점 판정
      // 1. 공이 AI 뒤로 날아감 -> 플레이어 득점!
      if (state.ballZ > AI_PADDLE_Z + 1.8) {
        state.pScore++;
        setPlayerScore(state.pScore);
        playSound('score');
        if (navigator.vibrate) navigator.vibrate(50);

        if (state.pScore >= WIN_SCORE) {
          state.ended = true;
          setIsGameWon(true);
          playSound('win');
          const duration = Math.floor((Date.now() - state.startTime) / 1000);
          const res = calculateAndDepositMissionReward({
            gameId: 'ping-pong-go',
            gameTitle: '핑퐁 고 3D (Ping Pong Go!)',
            isVictory: true,
            score: state.pScore * 100 + state.rally * 20,
            maxTargetScore: 800,
            durationSeconds: duration,
          });
          setRewardResult(res);
        } else {
          serveBall(true);
        }
      }
      // 2. 공이 플레이어 뒤로 날아감 -> AI 득점!
      else if (state.ballZ < PLAYER_PADDLE_Z - 1.8) {
        state.aScore++;
        setAiScore(state.aScore);
        playSound('lose');
        if (navigator.vibrate) navigator.vibrate(60);

        if (state.aScore >= WIN_SCORE) {
          state.ended = true;
          setIsGameOver(true);
          const duration = Math.floor((Date.now() - state.startTime) / 1000);
          const res = calculateAndDepositMissionReward({
            gameId: 'ping-pong-go',
            gameTitle: '핑퐁 고 3D (Ping Pong Go!)',
            isVictory: false,
            score: state.pScore * 100,
            maxTargetScore: 800,
            durationSeconds: duration,
          });
          setRewardResult(res);
        } else {
          serveBall(false);
        }
      }
      // 3. 공이 탁구대 밖 바닥으로 추락
      else if (state.ballY < 0.5) {
        if (state.ballZ > 0) {
          // 플레이어 공격 성공
          state.pScore++;
          setPlayerScore(state.pScore);
          playSound('score');
          serveBall(true);
        } else {
          state.aScore++;
          setAiScore(state.aScore);
          playSound('lose');
          serveBall(false);
        }
      }

      // 공 메쉬 동기화
      if (state.ballMesh) {
        state.ballMesh.position.set(state.ballX, state.ballY, state.ballZ);
      }

      // 파티클 업데이트
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.life -= dt;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          state.particles.splice(i, 1);
        }
      }

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
  }, [cardId, playSound, serveBall]);

  // 터치 슬라이드 라켓 조작 핸들러
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = touch.clientX - rect.left;
    const normX = (clientX / rect.width) * 2 - 1; // -1 ~ 1
    inputRef.current.targetPaddleX = normX * 3.2;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const normX = (clientX / rect.width) * 2 - 1;
    inputRef.current.targetPaddleX = normX * 3.2;
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none bg-[#c5e8eb] font-mono"
      onTouchMove={handleTouchMove}
      onMouseMove={handleMouseMove}
    >
      {/* 3D WebGL 캔버스 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* 미션 표준 상단 HUD */}
      <MinimalistMissionHUD
        onBack={handleExit}
        title="PING PONG GO 3D"
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

      {/* 상단 전광판 스코어보드 (플레이어 vs AI) */}
      <div className="absolute top-14 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        {/* 스코어보드 */}
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-sm border border-cyan-500/40 flex items-center gap-3">
          <CircleDot className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-cyan-300">YOU {playerScore}</span>
            <span className="text-xs text-zinc-400 font-bold">:</span>
            <span className="text-xl font-black text-red-400">{aiScore} AI</span>
          </div>
          <span className="text-[10px] text-zinc-400 ml-1 font-bold">(5점 선취승)</span>
        </div>

        {/* 랠리 카운트 */}
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-sm border border-amber-500/40 text-xs font-bold text-amber-300 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-400" /> 랠리: {rallyCount}회
        </div>
      </div>

      {/* 하단 모바일 컨트롤 바 */}
      <div className="absolute bottom-6 right-4 z-20 flex items-center gap-3 pointer-events-none">
        {/* 스핀 슬라이스 버튼 (64px) */}
        <button
          onClick={() => {
            inputRef.current.spinRequested = true;
          }}
          className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 bg-purple-600/90 border-2 border-purple-300 text-white rounded-lg active:scale-95 flex flex-col items-center justify-center font-bold text-xs shadow-lg shadow-purple-600/30"
        >
          <Award className="w-6 h-6 mb-0.5" />
          <span className="text-[10px]">SPIN</span>
        </button>

        {/* 파워 스매시 대형 버튼 (76px) */}
        <button
          onClick={() => {
            inputRef.current.smashRequested = true;
          }}
          className={`pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 flex flex-col items-center justify-center font-black active:scale-90 shadow-xl ${
            smashReady
              ? 'bg-amber-500 border-amber-200 text-white shadow-amber-500/50 animate-bounce'
              : 'bg-red-600 border-red-300 text-white shadow-red-600/40 active:bg-red-500'
          }`}
        >
          <Zap className="w-8 h-8" />
          <span className="text-[11px] tracking-wider mt-0.5">{smashReady ? 'CHANCE!' : 'SMASH'}</span>
        </button>
      </div>

      {/* 패배 모달 */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="text-3xl font-black text-red-500 mb-2">매치 패배 (MATCH LOST)</div>
          <p className="text-zinc-400 text-xs mb-4">AI 상대가 5점을 먼저 득점했습니다.</p>
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-sm w-full max-w-xs mb-6 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">최종 스코어:</span>
              <span className="font-bold text-white">{playerScore} : {aiScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">최다 랠리:</span>
              <span className="font-bold text-amber-400">{rallyCount}회</span>
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
          gameTitle="핑퐁 고 3D (Ping Pong Go!)"
        />
      )}
    </div>
  );
}
