import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Award, AlertCircle, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';
import { Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { t } from '../lib/i18n';

interface QrRewardProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSuccess: (scannedText: string) => void;
  todayArCardId: number;
  todayQrCardId: number;
}

export const QrReward: React.FC<QrRewardProps> = ({
  isOpen,
  onClose,
  language,
  onSuccess,
  todayArCardId,
  todayQrCardId,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMatched, setIsMatched] = useState(false);
  const [scannedTextValue, setScannedTextValue] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const todayQrCard = CARD_DATABASE[todayQrCardId] || CARD_DATABASE[1];

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
            console.warn("Video play retry:", e);
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

  // Real-time frame decoding using jsQR
  useEffect(() => {
    let animationFrameId: number;
    const scanFrame = () => {
      if (isScanning && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && !isMatched) {
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code) {
            handleDetectedQr(code.data);
            return;
          }
        }
      }
      if (isScanning && isOpen && !isMatched) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    if (isOpen && isScanning && hasPermission && !isMatched) {
      animationFrameId = requestAnimationFrame(scanFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isOpen, isScanning, hasPermission, isMatched]);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      setHasPermission(true);
      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(true); // Fallback to sandbox simulation
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };



  const handleDetectedQr = (text: string) => {
    setIsScanning(false);
    stopCamera();
    setScannedTextValue(text);
    setIsMatched(true);
  };

  const handleSuccessClaim = () => {
    onSuccess(scannedTextValue);
  };

  // manual trigger simulation for sandbox
  const triggerRandomScan = () => {
    const isTarget = Math.random() < 0.9;
    const scannedId = isTarget ? todayQrCardId : (Math.floor(Math.random() * 110) + 1);
    const mockQrText = `snshero_card_${scannedId}`;
    handleDetectedQr(mockQrText);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 font-sans">
        
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
              className="w-48 aspect-[5/7] flex flex-col gap-4 items-center animate-pulse"
            >
              <CardItem
                card={{
                  id: `qr_matched_anim_${todayQrCardId}`,
                  power: todayQrCard.power,
                  imageIndex: todayQrCardId,
                  title: todayQrCard.title,
                  title_dis: todayQrCard.title_dis,
                  title_en: todayQrCard.title_en,
                  stats: todayQrCard.stats,
                  level: 1,
                  hp: 100,
                  rarity: todayQrCard.rarity || "normal",
                  imageUrl: todayQrCard.imageUrl,
                }}
                className="w-full h-full shadow-2xl rounded-2xl border-2 border-amber-400"
                isLocked={false}
              />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-xs uppercase px-4 py-2 rounded-full tracking-widest shadow-xl border border-yellow-300 animate-bounce"
              >
                <Sparkles size={14} className="animate-spin-slow" />
                <span>{language === 'ko' ? 'QR 스캔 완료!' : 'QR SCAN SUCCESS!'}</span>
              </motion.div>
            </motion.div>
          </div>
        )}
        
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
              <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold tracking-wider text-amber-400 uppercase animate-pulse">
                {language === 'ko' ? '카메라 화면 시뮬레이션 구동 중...' : 'SIMULATING CAMERA VIEW...'}
              </p>
            </div>
          )}
        </div>

        {/* HUD Top Bar Overlay */}
        <div className="relative z-10 p-4 bg-gradient-to-b from-slate-950/80 to-transparent flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-black text-white tracking-widest uppercase">
              {language === 'ko' ? 'QR 스캔 LIVE' : 'QR SCAN LIVE'}
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
            <div className="w-[200px] h-[200px] border-2 border-dashed border-amber-450/80 rounded-3xl relative flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 border-t-4 border-l-4 border-amber-450 absolute -top-1 -left-1 rounded-tl-xl" />
              <div className="w-8 h-8 border-t-4 border-r-4 border-amber-450 absolute -top-1 -right-1 rounded-tr-xl" />
              <div className="w-8 h-8 border-b-4 border-l-4 border-amber-450 absolute -bottom-1 -left-1 rounded-bl-xl" />
              <div className="w-8 h-8 border-b-4 border-r-4 border-amber-450 absolute -bottom-1 -right-1 rounded-br-xl" />
              
              <span className="text-[10px] text-amber-450 font-black uppercase tracking-widest bg-slate-950/90 px-3 py-1.5 rounded-full shadow-lg border border-amber-450/20">
                {language === 'ko' ? '타겟 QR을 비추세요' : 'ALIGN TARGET QR'}
              </span>
            </div>
            
            <p className="text-[10px] text-slate-350 font-semibold mt-4 text-center max-w-xs bg-slate-950/70 py-1.5 px-3 rounded-full backdrop-blur-xs">
              {language === 'ko' 
                ? '도감에서 오늘의 타겟 QR 코드를 화면 중앙에 맞춰주세요.' 
                : 'Center todays target QR code from the Encyclopedia in the target.'}
            </p>
          </div>
        )}

        {/* HUD Side - Target Card Preview Panel */}
        <div className="absolute right-4 top-20 z-10 w-28 sm:w-32 bg-slate-950/80 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex flex-col items-center gap-2 shadow-2xl text-white">
          <span className="text-[8px] font-black text-amber-400 tracking-wider text-center uppercase">
            {language === 'ko' ? '★ 오늘의 타겟 QR' : '★ TARGET QR CARD'}
          </span>
          <div className="w-full aspect-[5/7]">
            <CardItem
              card={{
                id: `target_qr_${todayQrCardId}`,
                power: todayQrCard.power,
                imageIndex: todayQrCardId,
                title: todayQrCard.title,
                title_dis: todayQrCard.title_dis,
                title_en: todayQrCard.title_en,
                stats: todayQrCard.stats,
                level: 1,
                hp: 100,
                rarity: todayQrCard.rarity || "normal",
                imageUrl: todayQrCard.imageUrl,
              }}
              className="w-full h-full shadow-md pointer-events-none scale-90"
              isLocked={false}
            />
          </div>
          <span className="text-[9px] font-bold text-amber-300 truncate w-full text-center">
            {language === 'ko' ? todayQrCard.title : todayQrCard.title_dis}
          </span>
        </div>

        {/* Bottom Banner - Guide Info */}
        <div className="relative z-10 p-5 bg-gradient-to-t from-slate-950 to-slate-950/50 text-white border-t border-white/5 space-y-4">
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-black text-xs uppercase text-amber-450 tracking-wider">
              {language === 'ko' ? 'QR 스캔 보상 안내' : 'QR SCAN REWARD CONDITION'}
            </h3>
            <p className="text-[10px] text-slate-300 font-semibold leading-relaxed whitespace-pre-line">
              {language === 'ko'
                ? '• 카드도감에서 오늘의 타겟 QR 카드를 클릭하여 띄운 QR 코드를 촬영하면 500 SNS를 정산받습니다.\n• 타겟 QR 카드는 오늘의 AR 카드와 겹치지 않게 매일 랜덤하게 지정됩니다.'
                : '• Scan todays target cards QR code shown in the Encyclopedia to earn 500 SNS.\n• Target QR card is randomly chosen daily and differs from todays target AR card.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {isScanning && (
              <>
                <button
                  onClick={triggerRandomScan}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-650 active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '기본 QR 시뮬레이션' : 'SIMULATE DEFAULT QR'}
                </button>
                <button
                  onClick={() => handleDetectedQr('https://snshero.com/reward1000')}
                  className="px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg hover:from-yellow-500 hover:to-amber-600 active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '10000SNS 획득 시뮬레이션' : 'SIMULATE 10,000 SNS'}
                </button>
                <button
                  onClick={() => handleDetectedQr('https://snshero.com/reward3000')}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '30000SNS 획득 시뮬레이션' : 'SIMULATE 30,000 SNS'}
                </button>
                <button
                  onClick={() => handleDetectedQr('https://snshero.com/reward4000')}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-650 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg hover:from-blue-650 hover:to-indigo-700 active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '40000SNS 획득 시뮬레이션' : 'SIMULATE 40,000 SNS'}
                </button>
                <button
                  onClick={() => handleDetectedQr('https://snshero.com/reward5000')}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg hover:from-purple-600 hover:to-indigo-600 active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'ko' ? '50000SNS 획득 시뮬레이션' : 'SIMULATE 50,000 SNS'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-900 border border-white/10 text-white font-black text-[10px] uppercase tracking-wider rounded-xl hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
            >
              {language === 'ko' ? '닫기' : 'CLOSE'}
            </button>
          </div>
        </div>

        {/* Toast Alert Popup Overlay */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-36 left-4 right-4 z-[10000] flex justify-center pointer-events-none"
            >
              <div className="bg-amber-450 text-slate-950 px-6 py-3 rounded-2xl shadow-2xl font-black text-xs tracking-wider border border-yellow-300 flex items-center gap-2">
                <Sparkles size={16} className="animate-spin-slow text-slate-950" />
                <span>{toastMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
