import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, HelpCircle, Play, Info, Sparkles } from 'lucide-react';
import { Language, CardData, InventoryRecord } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { getAssetUrl, getCardSpriteAsset } from '../lib/utils';

interface ArCardViewerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  ownedCards: CardData[];
  inventory: Record<number, InventoryRecord>;
  initialCard?: CardData | null;
  showCameraPreview?: boolean;
}

export const ArCardViewer: React.FC<ArCardViewerProps> = ({
  isOpen,
  onClose,
  language,
  ownedCards,
  inventory,
  initialCard = null,
  showCameraPreview = false,
}) => {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(initialCard);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States for 3D A-Frame viewer
  const [cardFrontUrl, setCardFrontUrl] = useState<string>('');
  const [cardBackUrl, setCardBackUrl] = useState<string>('/background-bronze.png');
  const [aframeLoaded, setAframeLoaded] = useState(false);

  // 3D rotation angle & zoom scale state
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [cardScale, setCardScale] = useState(1.0);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    setCardScale(prev => Math.max(0.5, Math.min(2.5, prev + zoomDelta)));
  };

  // Get distinct owned card categories or just list distinct owned cards
  const distinctOwnedCards = React.useMemo(() => {
    // 사용자가 실제로 보유한 카드(수량이 1 이상인 카드)만 필터링합니다.
    const actualOwned = ownedCards.filter(c => {
      if (c.imageIndex !== undefined) {
        const invRecord = inventory[c.imageIndex];
        return invRecord && invRecord.quantity > 0;
      }
      return false;
    });

    if (actualOwned.length === 0) {
      return [];
    }

    // Filter duplicates by card template ID (imageIndex)
    const map = new Map<number, CardData>();
    actualOwned.forEach(c => {
      if (c.imageIndex !== undefined && !map.has(c.imageIndex)) {
        map.set(c.imageIndex, c);
      }
    });
    return Array.from(map.values());
  }, [ownedCards, inventory]);

  useEffect(() => {
    if (isOpen) {
      setSelectedCard(initialCard);
    }
  }, [isOpen, initialCard]);

  useEffect(() => {
    if (isOpen && selectedCard) {
      if (showCameraPreview) {
        startCamera();
      }
      prepareCardTextures(selectedCard);
    } else {
      if (showCameraPreview) {
        stopCamera();
      }
    }
    return () => {
      if (showCameraPreview) {
        stopCamera();
      }
    };
  }, [isOpen, selectedCard, showCameraPreview]);

  // Load A-Frame check & dynamic load helper
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).AFRAME) {
      setAframeLoaded(true);
      return;
    }

    const scriptId = 'aframe-script-cdn';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
      script.async = true;
      script.onerror = (e) => {
        console.warn('A-Frame CDN script failed to load:', e);
      };
      document.head.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if ((window as any).AFRAME) {
        setAframeLoaded(true);
        clearInterval(checkInterval);
      }
    }, 200);

    return () => clearInterval(checkInterval);
  }, []);

  const drawStatCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, value: number) => {
    // Background Circle matching CardItem style (white background with alpha)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Value text inside circle
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x, y);
    ctx.restore();
  };

  const prepareCardTextures = (card: CardData) => {
    const rarity = (card.rarity || 'bronze').toLowerCase();
    // 1. Generate standard size textures (360x504) with rounded corners
    const borderRadius = 20;

    // --- FRONT SIDE CANVAS GENERATION ---
    const canvasFront = document.createElement('canvas');
    canvasFront.width = 360;
    canvasFront.height = 504;
    const ctxFront = canvasFront.getContext('2d');
    if (!ctxFront) return;

    // Apply rounded corners clip path for front
    ctxFront.beginPath();
    ctxFront.moveTo(borderRadius, 0);
    ctxFront.lineTo(360 - borderRadius, 0);
    ctxFront.quadraticCurveTo(360, 0, 360, borderRadius);
    ctxFront.lineTo(360, 504 - borderRadius);
    ctxFront.quadraticCurveTo(360, 504, 360 - borderRadius, 504);
    ctxFront.lineTo(borderRadius, 504);
    ctxFront.quadraticCurveTo(0, 504, 0, 504 - borderRadius);
    ctxFront.lineTo(0, borderRadius);
    ctxFront.quadraticCurveTo(0, 0, borderRadius, 0);
    ctxFront.closePath();
    ctxFront.clip();

    // Determine race / element from card stats database
    const dbCard = CARD_DATABASE[card.imageIndex || 0];
    let race = null;
    if (card.race) {
      race = card.race.toLowerCase();
    } else if (dbCard) {
      const titleEn = dbCard.title_en || '';
      if (titleEn.startsWith('Water')) race = 'water';
      else if (titleEn.startsWith('Fire')) race = 'fire';
      else if (titleEn.startsWith('Wind')) race = 'wind';
      else if (titleEn.startsWith('Land')) race = 'land';
      else if (titleEn.startsWith('Human')) race = 'human';
      else if (titleEn.startsWith('Undead')) race = 'undead';
      else if (titleEn.startsWith('Elf')) race = 'elf';
      else if (titleEn.startsWith('Dwarf')) race = 'dwarf';
      else if (titleEn.startsWith('Monster')) race = 'monster';
      else if (titleEn.startsWith('Robot')) race = 'robot';
      else if (titleEn.startsWith('Dragon')) race = 'dragon';
    }

    // Mix color function for card background linear gradient matching CardItem
    const raceColors: Record<string, string> = {
      water: '#3b82f6',
      fire: '#ef4444',
      wind: '#0ea5e9',
      land: '#92400e',
      human: '#ffcc99',
      undead: '#111827',
      elf: '#4ade80',
      dwarf: '#1e3a8a',
      monster: '#a855f7',
      robot: '#9ca3af',
      dragon: '#eab308',
    };

    const baseColor = raceColors[race || ''] || '#cbd5e1';
    const mixWithWhite = (hex: string, weight: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const nr = Math.floor(r * weight + 255 * (1 - weight));
      const ng = Math.floor(g * weight + 255 * (1 - weight));
      const nb = Math.floor(b * weight + 255 * (1 - weight));
      return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
    };

    const powerScore = card.power || 10;
    const endIntensity = Math.min(1.0, Math.max(0.5, powerScore / 25));
    const startIntensity = Math.max(0, endIntensity - 0.1);
    
    const startColor = mixWithWhite(baseColor, startIntensity);
    const endColor = mixWithWhite(baseColor, endIntensity);

    // Apply background gradient
    const grad = ctxFront.createLinearGradient(0, 0, 360, 504);
    grad.addColorStop(0, startColor);
    grad.addColorStop(1, endColor);
    ctxFront.fillStyle = grad;
    ctxFront.fillRect(0, 0, 360, 504);

    // Draw diamond border
    const isGold = rarity === 'gold' || rarity === 'legendary';
    const isSilver = rarity === 'silver' || rarity === 'magic' || rarity === 'platinum';
    let borderColor = '#c27a3a';
    if (isGold) borderColor = '#fbbf24';
    else if (isSilver) borderColor = '#cbd5e1';
    
    ctxFront.strokeStyle = borderColor;
    ctxFront.lineWidth = 10;
    ctxFront.strokeRect(5, 5, 350, 494);

    // Load sprite sheet to extract character art index image
    const idx = card.imageIndex || 1;
    const isCards2 = idx >= 101;
    const spriteImg = new Image();
    spriteImg.src = getAssetUrl(getCardSpriteAsset(idx));
    spriteImg.crossOrigin = 'anonymous';
    spriteImg.onload = () => {
      const col = isCards2 ? (idx - 101) % 10 : (idx - 1) % 10;
      const row = isCards2 ? 0 : Math.floor(((idx - 1) % 100) / 10);
      
      const cellWidth = spriteImg.width / 10;
      const cellHeight = spriteImg.height / 10;

      // 이미지 잘림 없이 전체 셀을 그대로 가져옵니다 (100% 맵핑)
      const cropXOffset = 0;
      const cropYOffset = 0;
      const cropWidth = cellWidth;
      const cropHeight = cellHeight;

      // 캔버스 크기(360x504)에 맞추어 카드 중앙에 알맞게 조절하여 그립니다.
      // 인게임의 w-[190%] aspect-square scale-[0.94] 및 translate-y-[-8%] 비율에 준하게
      // 가로 세로 300px 크기로 여백을 주어 배치합니다.
      ctxFront.drawImage(
        spriteImg,
        col * cellWidth + cropXOffset,
        row * cellHeight + cropYOffset,
        cropWidth,
        cropHeight,
        30,
        105,
        300,
        300
      );

      // --- IN-GAME CARD LAYOUT: DONG-SEO-NAM-BUK STATS CIRCLES (N, E, S, W) ---
      // N (Top)
      drawStatCircle(ctxFront, 180, 42, card.stats[0] || 5);
      // E (Right)
      drawStatCircle(ctxFront, 318, 252, card.stats[1] || 5);
      // S (Bottom)
      drawStatCircle(ctxFront, 180, 462, card.stats[2] || 5);
      // W (Left)
      drawStatCircle(ctxFront, 42, 252, card.stats[3] || 5);

      // --- POWER SCORE DIAMOND (Top-Left) ---
      ctxFront.save();
      ctxFront.translate(45, 45);
      ctxFront.rotate(Math.PI / 4);
      ctxFront.fillStyle = isGold 
        ? 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)' 
        : isSilver 
        ? 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)' 
        : 'linear-gradient(135deg, #c27a3a 0%, #8c4f1d 100%)';
      
      // Canvas gradient fallback for inside translation
      const diamondGrad = ctxFront.createLinearGradient(-22, -22, 22, 22);
      if (isGold) {
        diamondGrad.addColorStop(0, '#fbbf24');
        diamondGrad.addColorStop(1, '#b45309');
      } else if (isSilver) {
        diamondGrad.addColorStop(0, '#cbd5e1');
        diamondGrad.addColorStop(1, '#64748b');
      } else {
        diamondGrad.addColorStop(0, '#c27a3a');
        diamondGrad.addColorStop(1, '#8c4f1d');
      }
      ctxFront.fillStyle = diamondGrad;
      ctxFront.strokeStyle = borderColor;
      ctxFront.lineWidth = 3;
      ctxFront.fillRect(-22, -22, 44, 44);
      ctxFront.strokeRect(-22, -22, 44, 44);
      ctxFront.restore();

      // Power Text inside diamond
      ctxFront.fillStyle = '#ffffff';
      ctxFront.font = '900 22px sans-serif';
      ctxFront.textAlign = 'center';
      ctxFront.textBaseline = 'middle';
      ctxFront.fillText(String(powerScore), 45, 45);

      // --- CARD NAME & INFO AT THE BOTTOM ---
      ctxFront.textBaseline = 'alphabetic';
      ctxFront.fillStyle = '#ffffff';
      ctxFront.font = '900 20px sans-serif';
      ctxFront.textAlign = 'center';
      const nameText = language === 'ko' ? card.title : (card.title_dis || card.title_en || 'Hero');
      ctxFront.fillText(nameText.toUpperCase(), 180, 415);

      // Level Info
      ctxFront.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctxFront.font = 'bold 12px sans-serif';
      ctxFront.fillText(`LV.${card.level || 1}  •  HP 100`, 180, 435);

      // Set URL
      setCardFrontUrl(canvasFront.toDataURL('image/png'));
    };

    // --- BACK SIDE CANVAS GENERATION (Rounded and stretched 5:7) ---
    const canvasBack = document.createElement('canvas');
    canvasBack.width = 360;
    canvasBack.height = 504;
    const ctxBack = canvasBack.getContext('2d');
    if (!ctxBack) return;

    // Apply rounded corners clip path for back
    ctxBack.beginPath();
    ctxBack.moveTo(borderRadius, 0);
    ctxBack.lineTo(360 - borderRadius, 0);
    ctxBack.quadraticCurveTo(360, 0, 360, borderRadius);
    ctxBack.lineTo(360, 504 - borderRadius);
    ctxBack.quadraticCurveTo(360, 504, 360 - borderRadius, 504);
    ctxBack.lineTo(borderRadius, 504);
    ctxBack.quadraticCurveTo(0, 504, 0, 504 - borderRadius);
    ctxBack.lineTo(0, borderRadius);
    ctxBack.quadraticCurveTo(0, 0, borderRadius, 0);
    ctxBack.closePath();
    ctxBack.clip();

    // Determine back image path
    let backImagePath = '/background-bronze.png';
    if (rarity === 'gold' || rarity === 'legendary') {
      backImagePath = '/background-gold.png';
    } else if (rarity === 'silver' || rarity === 'magic' || rarity === 'platinum') {
      backImagePath = '/background-silver.png';
    }

    const backImg = new Image();
    backImg.src = backImagePath;
    backImg.crossOrigin = 'anonymous';
    backImg.onload = () => {
      // Draw background image stretched fully to 360x504 (5:7 ratio)
      ctxBack.drawImage(backImg, 0, 0, 360, 504);
      setCardBackUrl(canvasBack.toDataURL('image/png'));
    };
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Camera play error:", e));
      }
      setHasPermission(true);
    } catch (err) {
      console.error("AR camera stream error:", err);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Drag interaction math on absolute overlay to rotate 3D Card smoothly
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      previousMousePosition.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const diff = dist - touchDistanceRef.current;
      setCardScale(prev => Math.max(0.5, Math.min(2.5, prev + diff * 0.008)));
      touchDistanceRef.current = dist;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rawDeltaX = touch.clientX - previousMousePosition.current.x;
      const rawDeltaY = touch.clientY - previousMousePosition.current.y;
      
      // Clamp delta to prevent sudden touch jumps on mobile screens
      const deltaX = Math.max(-20, Math.min(20, rawDeltaX));
      const deltaY = Math.max(-20, Math.min(20, rawDeltaY));

      setRotationY(prev => prev + deltaX * 0.75);
      setRotationX(prev => Math.max(-60, Math.min(60, prev + deltaY * 0.75)));

      previousMousePosition.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    touchDistanceRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    setRotationY(prev => prev + deltaX * 0.85);
    setRotationX(prev => Math.max(-60, Math.min(60, prev + deltaY * 0.85)));

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 font-sans select-none overflow-hidden">
        
        {/* Step 1: Card Select Stage */}
        {!selectedCard && (
          <div className="absolute inset-0 z-10 flex flex-col bg-slate-950 text-white p-6">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-black tracking-wider uppercase text-emerald-450">
                  {language === 'ko' ? 'AR 히어로 선택' : 'SELECT AR HERO'}
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {language === 'ko' ? '3D AR로 입체 감상할 카드를 선택하세요.' : 'Choose card to view in 3D VR/AR environment.'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-4 pb-12">
              {distinctOwnedCards.map((card) => (
                <div 
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/60 border border-white/5 hover:border-emerald-500/40 rounded-2xl cursor-pointer hover:bg-slate-900 transition-all hover:scale-105 active:scale-95 group"
                >
                  <div className="w-full aspect-[5/7] pointer-events-none scale-95 group-hover:scale-100 transition-transform">
                    <CardItem card={card} isLocked={false} className="w-full h-full" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">
                    {language === 'ko' ? card.title : card.title_dis}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Live AR Cam & A-Frame Viewer Stage */}
        {selectedCard && (
          <div className="absolute inset-0 z-0 flex flex-col bg-black">
            
            {/* Camera Preview Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
              {showCameraPreview && hasPermission !== false ? (
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover opacity-60 pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white gap-2 p-6">
                  {showCameraPreview && (
                    <span className="text-xs font-semibold text-slate-400 tracking-wider text-center">
                      {language === 'ko' ? '카메라 화면을 불러올 수 없습니다 (시뮬레이션 모드)' : 'No camera stream available (Simulated AR bg)'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/20 via-slate-950/60 to-purple-950/20 pointer-events-none" />
                </div>
              )}
            </div>

            {/* A-Frame 3D Scene Viewport */}
            {aframeLoaded && cardFrontUrl && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <a-scene embedded vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" class="w-full h-full">
                  
                  {/* Camera light setup */}
                  <a-entity camera position="0 0 4.2"></a-entity>
                  {/* 기본 환경광(Ambient Light): 중간 밝기로 조율하여 내추럴한 색감 표현 */}
                  <a-entity light="type: ambient; color: #ffffff; intensity: 0.65"></a-entity>
                  
                  {/* 주 광원(Directional Light): 정면과 우측 상단에서 내리쬐어 자연스러운 명암 부여 */}
                  <a-entity light="type: directional; color: #ffffff; intensity: 0.5; castShadow: false" position="1 2 4"></a-entity>
                  
                  {/* 포인트 광원(Point Light): 보조 스포트라이트 조도 */}
                  <a-entity light="type: point; color: #ffffff; intensity: 0.35; distance: 6" position="-1 1 2"></a-entity>
                  
                  {/* Custom 3D Card model built via dual-sided 3D Plane textures (Front / Back) */}
                  <a-entity 
                    id="ar-card-model" 
                    rotation={`${rotationX} ${rotationY} 0`}
                    scale={`${cardScale} ${cardScale} ${cardScale}`}
                  >
                    {/* Front side of Card: standard shader with reduced metalness to prevent dark shadows */}
                    <a-plane 
                      position="0 0 0.015" 
                      width="1.8" 
                      height="2.52" 
                      src={cardFrontUrl}
                      material="shader: standard; side: front; transparent: true; metalness: 0.3; roughness: 0.5"
                    ></a-plane>

                    {/* Back side of Card */}
                    <a-plane 
                      position="0 0 -0.015" 
                      rotation="0 180 0" 
                      width="1.8" 
                      height="2.52" 
                      src={cardBackUrl}
                      material="shader: standard; side: front; transparent: true; metalness: 0.3; roughness: 0.5"
                    ></a-plane>

                    {/* Card frame thin slate core (with slight depth) */}
                    <a-box 
                      position="0 0 0" 
                      width="1.79" 
                      height="2.51" 
                      depth="0.02" 
                      color="#0f172a"
                      material="shader: standard; metalness: 0.7; roughness: 0.3"
                    ></a-box>
                  </a-entity>

                </a-scene>
              </div>
            )}

            {/* Gesture capture absolute transparent layer on top of A-Frame for custom drag rotation */}
            <div 
              className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            {/* HUD Overlays (Top Controls & Instructions) */}
            <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
              {!initialCard ? (
                <button
                  onClick={() => {
                    stopCamera();
                    setSelectedCard(null);
                  }}
                  className="p-2.5 bg-slate-950/80 border border-white/10 hover:bg-slate-900 text-white rounded-full transition-all pointer-events-auto cursor-pointer"
                  title="Select another card"
                >
                  <RotateCcw size={18} />
                </button>
              ) : (
                <div className="w-9 h-9" />
              )}
              <div className="bg-slate-950/80 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black tracking-widest text-white uppercase">
                  {selectedCard.rarity.toUpperCase()} • {language === 'ko' ? selectedCard.title : selectedCard.title_dis}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 bg-slate-950/80 border border-white/10 hover:bg-slate-900 text-white rounded-full transition-all pointer-events-auto cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Interactive rotation guide footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-950/90 border border-white/10 py-3 px-6 rounded-2xl flex flex-col items-center gap-1 shadow-2xl pointer-events-none w-[80%] max-w-xs text-center">
              <span className="text-[9px] font-black text-emerald-400 tracking-wider uppercase">
                {language === 'ko' ? '★ 3D 카드 감상 모드' : '★ 3D MODEL VIEWER'}
              </span>
              <p className="text-[10px] text-slate-350 font-semibold leading-relaxed">
                {language === 'ko' 
                  ? '화면을 상하좌우로 드래그하여 카드를 3D 회전시켜 보세요.' 
                  : 'Drag up, down, left, or right to rotate card in full 3D space.'}
              </p>
            </div>

          </div>
        )}

      </div>
    </AnimatePresence>
  );
};
