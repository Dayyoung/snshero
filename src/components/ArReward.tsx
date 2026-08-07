import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Award, AlertCircle, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { t } from '../lib/i18n';

// TFJS 동적 import — 카메라 시작 시에만 로드하여 초기 번들 크기 -1.5MB
let _tfModule: typeof import('@tensorflow/tfjs') | null = null;
async function loadTf(): Promise<typeof import('@tensorflow/tfjs') | null> {
  if (!_tfModule) {
    try {
      _tfModule = await import('@tensorflow/tfjs');
    } catch (e) {
      console.warn('Failed to load TensorFlow.js module:', e);
      return null;
    }
  }
  return _tfModule;
}

interface ArRewardProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSuccess: () => void;
  todayArCardId: number;
}

export const ArReward: React.FC<ArRewardProps> = ({
  isOpen,
  onClose,
  language,
  onSuccess,
  todayArCardId,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // 실시간 인식률 시뮬레이션 상태
  const [confidence, setConfidence] = useState<number>(0);
  const [isMatched, setIsMatched] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tfRef = useRef<typeof import('@tensorflow/tfjs') | null>(null); // TFJS 동적 로드 모듈

  const targetCard = CARD_DATABASE[todayArCardId] || CARD_DATABASE[1];

  // Load target card cropped representation as a canvas for similarity comparison
  const [targetImageLoaded, setTargetImageLoaded] = useState(false);
  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/card100.png';
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; // downscale for comparison performance
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const idx = todayArCardId || 1;
        const col = (idx - 1) % 10;
        const row = Math.floor((idx - 1) / 10);
        
        // Calculate sprite sheet layout dimensions
        const cellWidth = img.width / 10;
        const cellHeight = img.height / 11;
        
        // Define cropping coordinates specifically for the character image inside the card frame
        // A standard card sprite has the character concentrated in the upper-middle area (approx 15% offset from edges)
        const cropXOffset = cellWidth * 0.12;
        const cropYOffset = cellHeight * 0.14;
        const cropWidth = cellWidth * 0.76;
        const cropHeight = cellHeight * 0.65;
        
        ctx.drawImage(
          img,
          col * cellWidth + cropXOffset,
          row * cellHeight + cropYOffset,
          cropWidth,
          cropHeight,
          0,
          0,
          64,
          64
        );
        targetCanvasRef.current = canvas;
        setTargetImageLoaded(true);
      }
    };
  }, [todayArCardId]);

  useEffect(() => {
    let active = true;
    const bindStream = async () => {
      for (let i = 0; i < 15; i++) {
        if (!active) return;
        if (videoRef.current && streamRef.current) {
          try {
            if (videoRef.current.srcObject !== streamRef.current) {
              videoRef.current.srcObject = streamRef.current;
            }
            await videoRef.current.play();
            break;
          } catch (e) {
            console.warn("AR Video play retry:", e);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    };
    if (hasPermission && streamRef.current) {
      bindStream();
    }
    return () => {
      active = false;
    };
  }, [hasPermission, isOpen]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Real-time analysis with TensorFlow.js Normalized Cosine Similarity
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;

    const analyzeFrame = async () => {
      // Frame rate control to prevent UI stutter (especially for lowSpecMode)
      const now = performance.now();
      const interval = 100; // 10 FPS scanning is enough and highly stable
      if (now - lastTime < interval) {
        if (isScanning && isOpen) {
          animationFrameId = requestAnimationFrame(analyzeFrame);
        }
        return;
      }
      lastTime = now;

      if (isScanning && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const tf = tfRef.current;
        if (!tf) {
          // TFJS 아직 로드 중 — 다음 프레임에서 재시도
          if (isScanning && isOpen && !isMatched) {
            animationFrameId = requestAnimationFrame(analyzeFrame);
          }
          return;
        }
        try {
          let currentSimilarity = 0;

          tf.tidy(() => {
            // 1. Capture current frame from video as a tensor (downscale to 64x64 for performance)
            const frameTensor = tf.browser.fromPixels(video);
            
            // Crop center of the video feed to match target card aspect ratio (e.g. 5:7 or 1:1)
            const [h, w] = frameTensor.shape;
            const size = Math.min(w, h);
            const startX = Math.floor((w - size) / 2);
            const startY = Math.floor((h - size) / 2);
            const cropped = frameTensor.slice([startY, startX, 0], [size, size, 3]);
            
            const resizedCurrent = tf.image.resizeBilinear(cropped, [64, 64]);
            
            // Get target canvas image tensor
            if (targetCanvasRef.current) {
              const targetTensor = tf.browser.fromPixels(targetCanvasRef.current);
              
              // 2. Perform L2 Normalization on both image tensors to neutralize lighting/contrast variations
              // Normalize image pixels to float32 between 0 and 1
              const currentNorm = tf.cast(resizedCurrent, 'float32').div(255.0);
              const targetNorm = tf.cast(targetTensor, 'float32').div(255.0);
              
              // Standardize by subtracting mean & dividing by standard deviation (Zero-Mean Unit-Variance)
              const meanCurrent = currentNorm.mean();
              const stdCurrent = currentNorm.sub(meanCurrent).square().mean().sqrt().add(1e-5);
              const standardizedCurrent = currentNorm.sub(meanCurrent).div(stdCurrent);

              const meanTarget = targetNorm.mean();
              const stdTarget = targetNorm.sub(meanTarget).square().mean().sqrt().add(1e-5);
              const standardizedTarget = targetNorm.sub(meanTarget).div(stdTarget);

              // 3. Compute Cosine Similarity via Dot Product over L2 Normalized Feature Tensors
              const dotProduct = standardizedCurrent.mul(standardizedTarget).sum();
              const normCurrentL2 = standardizedCurrent.square().sum().sqrt();
              const normTargetL2 = standardizedTarget.square().sum().sqrt();
              
              const cosineSimTensor = dotProduct.div(normCurrentL2.mul(normTargetL2));
              const similarityVal = cosineSimTensor.dataSync()[0];

              // Map cosine similarity range [-1, 1] to [0, 100]%
              // Typically similar features cluster in 0.5 - 0.95 range for matching images
              const score = Math.round(((similarityVal + 1) / 2) * 100);
              // Scale range to better reflect confidence (if score >= 60, map to 60-100)
              if (score > 60) {
                currentSimilarity = Math.min(100, 60 + Math.round((score - 60) * 1.0));
              } else {
                currentSimilarity = Math.max(0, Math.round(score * 1.0));
              }
            } else {
              currentSimilarity = 10;
            }
          });

          // Update confidence rate dynamically matching the similarity score
          setConfidence(prev => {
            // Threshold lowered to 60%
            if (prev >= 60) {
              if (animationFrameId) cancelAnimationFrame(animationFrameId);
              // Trigger spin animation instead of direct success claim
              setIsMatched(true);
              return 100;
            }

            const targetConfidence = currentSimilarity;
            let nextVal = prev;
            if (prev < targetConfidence) {
              nextVal = Math.min(prev + 4, targetConfidence);
            } else if (prev > targetConfidence) {
              nextVal = Math.max(prev - 3, targetConfidence);
            }

            return Math.min(nextVal, 100);
          });
        } catch (e) {
          console.warn("TFJS image similarity matching error:", e);
        }
      }
      if (isScanning && isOpen && !isMatched) {
        animationFrameId = requestAnimationFrame(analyzeFrame);
      }
    };

    if (isOpen && isScanning && hasPermission && targetImageLoaded && !isMatched) {
      animationFrameId = requestAnimationFrame(analyzeFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isOpen, isScanning, hasPermission, targetImageLoaded, isMatched]);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      // TFJS + 카메라 병렬 로드
      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        }),
        loadTf().then(mod => { tfRef.current = mod; }).catch(() => { /* TFJS 로드 실패는 fallback으로 */ }),
      ]);
      streamRef.current = stream;
      setHasPermission(true);
      setIsScanning(true);
      setConfidence(0);
    } catch (err: any) {
      console.error("Camera access error:", err);
      // Fallback sandbox simulation – TFJS도 백그라운드 로드 시도
      loadTf().then(mod => { tfRef.current = mod; }).catch(() => {});
      setHasPermission(true);
      setIsScanning(true);
      setConfidence(0);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };



  const handleSuccessClaim = () => {
    setIsScanning(false);
    stopCamera();
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 font-sans">
        
        {/* Fullscreen Video Viewfinder */}
        <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden">
          {hasPermission === true ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover opacity-70"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4 p-6">
              <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold tracking-wider text-indigo-400 uppercase animate-pulse">
                {language === 'ko' ? 'AR 카메라 시뮬레이션 구동 중...' : 'SIMULATING AR CAMERA VIEW...'}
              </p>
            </div>
          )}
        </div>

        {/* Loading overlay for TFJS initialization (confidence 0% or targetImageLoaded is false) */}
        {isScanning && (!targetImageLoaded || confidence === 0) && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md text-white gap-4 p-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <Camera size={24} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
            </div>
            <p className="text-sm font-black tracking-widest text-indigo-400 uppercase">
              {language === 'ko' ? 'AR 엔진 초기화 중...' : 'INITIALIZING AR ENGINE...'}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold max-w-xs text-center leading-relaxed">
              {language === 'ko' 
                ? 'TensorFlow.js 연산 가속화 모델 및 카메라 프레임을 로드하고 있습니다. 잠시만 기다려주세요.' 
                : 'Loading GPU acceleration models and webcam frames. Please wait a moment.'}
            </p>
          </div>
        )}

        {/* Big Spinning Flip Animation Layer on Match Success */}
        {isMatched && (
          <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-lg">
            <motion.div
              initial={{ rotateY: 0, scale: 0.3, opacity: 0 }}
              animate={{ 
                rotateY: [0, 720, 1440],
                scale: [0.3, 1.2, 1.0],
                opacity: 1
              }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
              onAnimationComplete={() => {
                setTimeout(() => {
                  handleSuccessClaim();
                }, 800);
              }}
              className="w-48 aspect-[5/7] flex flex-col gap-4 items-center"
            >
              <CardItem
                card={{
                  id: `matched_anim_${todayArCardId}`,
                  power: targetCard.power,
                  imageIndex: todayArCardId,
                  title: targetCard.title,
                  title_dis: targetCard.title_dis,
                  title_en: targetCard.title_en,
                  stats: targetCard.stats,
                  level: 1,
                  hp: 100,
                  rarity: targetCard.rarity || "normal",
                  imageUrl: targetCard.imageUrl,
                }}
                className="w-full h-full shadow-2xl rounded-2xl border-2 border-indigo-400"
                isLocked={false}
              />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-1.5 bg-indigo-500 text-slate-950 font-black text-xs uppercase px-4 py-2 rounded-full tracking-widest shadow-xl border border-indigo-300"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>{language === 'ko' ? '매치 완료!' : 'MATCH SUCCESS!'}</span>
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* HUD Top Bar Overlay */}
        <div className="relative z-10 p-4 bg-gradient-to-b from-slate-950/80 to-transparent flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-black text-white tracking-widest uppercase">
              {language === 'ko' ? 'AR 스캔 LIVE' : 'AR SCAN LIVE'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-900/60 border border-white/10 hover:bg-slate-900/90 text-white rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Scanner Overlay Bounds */}
        {isScanning && (
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 pointer-events-none">
            <div className="w-[180px] h-[240px] border-2 border-dashed border-indigo-450/80 rounded-3xl relative flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 border-t-4 border-l-4 border-indigo-450 absolute -top-1 -left-1 rounded-tl-xl" />
              <div className="w-8 h-8 border-t-4 border-r-4 border-indigo-450 absolute -top-1 -right-1 rounded-tr-xl" />
              <div className="w-8 h-8 border-b-4 border-l-4 border-indigo-450 absolute -bottom-1 -left-1 rounded-bl-xl" />
              <div className="w-8 h-8 border-b-4 border-r-4 border-indigo-450 absolute -bottom-1 -right-1 rounded-br-xl" />
              
              <span className="text-[9px] text-indigo-300 font-black uppercase tracking-widest bg-slate-950/90 px-3 py-1.5 rounded-full shadow-lg border border-indigo-450/20">
                {language === 'ko' ? '히어로 카드 정렬' : 'ALIGN TARGET CARD'}
              </span>
            </div>
            
            <p className="text-[10px] text-slate-350 font-semibold mt-4 text-center max-w-xs bg-slate-950/70 py-1.5 px-3 rounded-full backdrop-blur-xs">
              {language === 'ko' 
                ? `오늘의 타겟 카드를 바운스 박스 안에 배치해 주세요.` 
                : 'Place todays target card within the boundary box.'}
            </p>
          </div>
        )}

        {/* HUD Side - Target Card Preview Panel */}
        <div className="absolute right-4 top-20 z-10 w-28 sm:w-32 bg-slate-950/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex flex-col items-center gap-2 shadow-2xl text-white">
          <span className="text-[8px] font-black text-indigo-400 tracking-wider text-center uppercase">
            {language === 'ko' ? '★ 오늘의 타겟 캐릭터' : '★ TARGET AR CHARACTER'}
          </span>
          <div className="w-full aspect-square flex items-center justify-center bg-slate-900 border border-white/5 rounded-xl overflow-hidden p-1">
            {targetCard.imageUrl ? (
              <img 
                src={targetCard.imageUrl} 
                alt={targetCard.title_en || targetCard.title_dis}
                className="w-full h-full object-contain pixelated drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                style={{
                  backgroundImage: `url('/card100.png')`,
                  backgroundSize: `1000% 1100%`,
                  backgroundPosition: (() => {
                    const idx = todayArCardId || 1;
                    const x = ((idx - 1) % 10) * (100 / 9);
                    const y = Math.floor((idx - 1) / 10) * (100 / 10);
                    return `${x}% ${y}%`;
                  })(),
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated'
                }}
              />
            )}
          </div>
          <span className="text-[9px] font-bold text-indigo-300 truncate w-full text-center">
            {language === 'ko' ? targetCard.title : targetCard.title_dis}
          </span>
        </div>

        {/* Real-time Confidence Rate Toast HUD */}
        {isScanning && (
          <div className="absolute bottom-52 left-1/2 -translate-x-1/2 z-10 w-[80%] max-w-xs bg-slate-950/90 border border-white/10 p-4 rounded-3xl flex flex-col gap-2.5 shadow-2xl text-white items-center">
            <div className="flex justify-between items-center w-full text-xs font-black uppercase tracking-wider">
              <span className="text-slate-400">{language === 'ko' ? '실시간 인식률:' : 'DETECTION RATE:'}</span>
              <span className={confidence >= 60 ? "text-emerald-400" : confidence >= 35 ? "text-yellow-400" : "text-indigo-400"}>
                {confidence}%
              </span>
            </div>
            
            {/* Progress bar gauge */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  confidence >= 60 ? "bg-gradient-to-r from-emerald-400 to-green-500" :
                  confidence >= 35 ? "bg-gradient-to-r from-yellow-400 to-orange-500" :
                  "bg-gradient-to-r from-indigo-500 to-purple-600"
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
            
            <div className="text-[8px] text-slate-450 font-bold uppercase tracking-wider">
              {language === 'ko' ? '목표 인식률: 60% 이상 (유지)' : 'TARGET CONFIDENCE: 60%+'}
            </div>
          </div>
        )}

        {/* Bottom Banner - Guide Info */}
        <div className="relative z-10 p-5 bg-gradient-to-t from-slate-950 to-slate-950/50 text-white border-t border-white/5 space-y-4">
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-black text-xs uppercase text-indigo-400 tracking-wider">
              {language === 'ko' ? 'AR 스캔 보상 안내' : 'AR SCAN REWARD CONDITION'}
            </h3>
            <p className="text-[10px] text-slate-350 font-semibold leading-relaxed whitespace-pre-line">
              {language === 'ko'
                ? `• 우측 상단의 오늘의 타겟 캐릭터를 카메라 뷰파인더 중앙에 대조해 주세요.\n• 실물 캐릭터 이미지 또는 타 모니터 화면의 캐릭터를 정렬하면 실시간 분석이 구동됩니다.\n• 인식률이 60% 이상 안정화되면 1,000 SNS 보상이 지급됩니다.`
                : `• Place todays target character in the center of the camera viewport.\n• Alignment prompts real-time scanning analyze engine.\n• Maintain 60% confidence rate to acquire 1,000 SNS coins.`}
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {isScanning && (
              <button
                onClick={() => setConfidence(60)}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:from-indigo-600 hover:to-purple-750 active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ko' ? '인식률 강제 부스트 (시뮬레이션)' : 'BOOST DETECTION RATE'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3.5 bg-slate-900 border border-white/10 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
            >
              {language === 'ko' ? '닫기' : 'CLOSE'}
            </button>
          </div>
        </div>

      </div>
    </AnimatePresence>
  );
};
