import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';
import { Language, CardData, InventoryRecord } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { getAssetUrl, getCardSpriteAsset } from '../lib/utils';

interface ArDeckViewerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  deckCards: CardData[];
  inventory: Record<number, InventoryRecord>;
}

export const ArDeckViewer: React.FC<ArDeckViewerProps> = ({
  isOpen,
  onClose,
  language,
  deckCards,
  inventory,
}) => {
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [cardTextures, setCardTextures] = useState<string[]>([]);
  const [cardBackUrls, setCardBackUrls] = useState<string[]>([]);
  
  // 3D rotation controlled via dragging
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).AFRAME) {
      setAframeLoaded(true);
    } else {
      const checkInterval = setInterval(() => {
        if ((window as any).AFRAME) {
          setAframeLoaded(true);
          clearInterval(checkInterval);
        }
      }, 200);
      return () => clearInterval(checkInterval);
    }
  }, []);

  useEffect(() => {
    if (isOpen && deckCards.length > 0) {
      prepareAllTextures();
    }
  }, [isOpen, deckCards]);

  // Stat circle drawing helper for texture generation
  const drawStatCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, value: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(value), x, y);
    ctx.restore();
  };

  const prepareAllTextures = async () => {
    const frontPromises = deckCards.map(card => {
      return new Promise<string>((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 504;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        // Apply rounded corner clipping
        const borderRadius = 20;
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(360 - borderRadius, 0);
        ctx.quadraticCurveTo(360, 0, 360, borderRadius);
        ctx.lineTo(360, 504 - borderRadius);
        ctx.quadraticCurveTo(360, 504, 360 - borderRadius, 504);
        ctx.lineTo(borderRadius, 504);
        ctx.quadraticCurveTo(0, 504, 0, 504 - borderRadius);
        ctx.lineTo(0, borderRadius);
        ctx.quadraticCurveTo(0, 0, borderRadius, 0);
        ctx.closePath();
        ctx.clip();

        // Calculate card linear gradient matching CardItem
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

        const grad = ctx.createLinearGradient(0, 0, 360, 504);
        grad.addColorStop(0, startColor);
        grad.addColorStop(1, endColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 360, 504);

        // Draw diamond border
        const rarity = (card.rarity || 'bronze').toLowerCase();
        const isGold = rarity === 'gold' || rarity === 'legendary';
        const isSilver = rarity === 'silver' || rarity === 'magic' || rarity === 'platinum';
        let borderColor = '#c27a3a';
        if (isGold) borderColor = '#fbbf24';
        else if (isSilver) borderColor = '#cbd5e1';
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, 350, 494);

        // Load sprite
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

          ctx.drawImage(
            spriteImg,
            col * cellWidth,
            row * cellHeight,
            cellWidth,
            cellHeight,
            30,
            105,
            300,
            300
          );

          // Stats
          drawStatCircle(ctx, 180, 42, card.stats[0] || 5);
          drawStatCircle(ctx, 318, 252, card.stats[1] || 5);
          drawStatCircle(ctx, 180, 462, card.stats[2] || 5);
          drawStatCircle(ctx, 42, 252, card.stats[3] || 5);

          // Power Diamond
          ctx.save();
          ctx.translate(45, 45);
          ctx.rotate(Math.PI / 4);
          const diamondGrad = ctx.createLinearGradient(-22, -22, 22, 22);
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
          ctx.fillStyle = diamondGrad;
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 3;
          ctx.fillRect(-22, -22, 44, 44);
          ctx.strokeRect(-22, -22, 44, 44);
          ctx.restore();

          // Power Value
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(powerScore), 45, 45);

          // Name and LV
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 20px sans-serif';
          ctx.textAlign = 'center';
          const nameText = language === 'ko' ? card.title : (card.title_dis || card.title_en || 'Hero');
          ctx.fillText(nameText.toUpperCase(), 180, 415);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`LV.${card.level || 1}  •  HP 100`, 180, 435);

          resolve(canvas.toDataURL('image/png'));
        };
        spriteImg.onerror = () => resolve('');
      });
    });

    const backPromises = deckCards.map(card => {
      return new Promise<string>((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 504;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        const borderRadius = 20;
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(360 - borderRadius, 0);
        ctx.quadraticCurveTo(360, 0, 360, borderRadius);
        ctx.lineTo(360, 504 - borderRadius);
        ctx.quadraticCurveTo(360, 504, 360 - borderRadius, 504);
        ctx.lineTo(borderRadius, 504);
        ctx.quadraticCurveTo(0, 504, 0, 504 - borderRadius);
        ctx.lineTo(0, borderRadius);
        ctx.quadraticCurveTo(0, 0, borderRadius, 0);
        ctx.closePath();
        ctx.clip();

        const rarity = (card.rarity || 'bronze').toLowerCase();
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
          ctx.drawImage(backImg, 0, 0, 360, 504);
          resolve(canvas.toDataURL('image/png'));
        };
        backImg.onerror = () => resolve('');
      });
    });

    const fronts = await Promise.all(frontPromises);
    const backs = await Promise.all(backPromises);
    setCardTextures(fronts);
    setCardBackUrls(backs);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    const touch = e.touches[0];
    previousMousePosition.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - previousMousePosition.current.x;
    const deltaY = touch.clientY - previousMousePosition.current.y;
    setRotationY(prev => prev + deltaX * 0.85);
    setRotationX(prev => Math.max(-60, Math.min(60, prev + deltaY * 0.85)));
    previousMousePosition.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
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

  // 5 Cards coordinates for Above 3 (index 0,1,2) and Below 2 (index 3,4) layout
  const positions = [
    { x: -2.0, y: 0.8, z: -0.2 },   // Top Left (Card 1)
    { x: 0, y: 0.8, z: -0.2 },      // Top Center (Card 2)
    { x: 2.0, y: 0.8, z: -0.2 },    // Top Right (Card 3)
    { x: -1.0, y: -1.2, z: 0.2 },  // Bottom Left (Card 4)
    { x: 1.0, y: -1.2, z: 0.2 },   // Bottom Right (Card 5)
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 font-sans select-none overflow-hidden text-white">
        
        {/* Header HUD */}
        <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
          <button
            onClick={() => {
              setRotationX(0);
              setRotationY(0);
            }}
            className="p-2.5 bg-slate-900/80 border border-white/10 hover:bg-slate-800 text-white rounded-full transition-all pointer-events-auto cursor-pointer"
            title="Reset rotations"
          >
            <RotateCcw size={18} />
          </button>
          <div className="bg-slate-900/80 border border-white/10 px-5 py-2 rounded-full">
            <span className="text-[10px] font-black tracking-widest text-white uppercase">
              {language === 'ko' ? '나의 덱 3D 감상' : 'MY DECK 3D VIEW'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-900/80 border border-white/10 hover:bg-slate-800 text-white rounded-full transition-all pointer-events-auto cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3D scene viewport with intermediate lighting */}
        {aframeLoaded && cardTextures.length > 0 && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <a-scene embedded vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" class="w-full h-full">
              
              <a-entity camera position="0 0 5.2"></a-entity>
              <a-entity light="type: ambient; color: #ffffff; intensity: 0.65"></a-entity>
              <a-entity light="type: directional; color: #ffffff; intensity: 0.5" position="1 2 4"></a-entity>
              <a-entity light="type: point; color: #ffffff; intensity: 0.35; distance: 6" position="-1 1 2"></a-entity>
              
              {/* Group Rotation Node */}
              <a-entity 
                id="ar-deck-group" 
                rotation={`${rotationX} ${rotationY} 0`}
              >
                {deckCards.map((card, i) => {
                  const pos = positions[i] || { x: 0, y: 0, z: 0 };
                  const frontTex = cardTextures[i];
                  const backTex = cardBackUrls[i] || '/background-bronze.png';
                  
                  if (!frontTex) return null;

                  return (
                    <a-entity key={card.id} position={`${pos.x} ${pos.y} ${pos.z}`}>
                      {/* Front face */}
                      <a-plane
                        position="0 0 0.015"
                        width="1.6"
                        height="2.24"
                        src={frontTex}
                        material="shader: standard; side: front; transparent: true; metalness: 0.3; roughness: 0.5"
                      ></a-plane>

                      {/* Back face */}
                      <a-plane
                        position="0 0 -0.015"
                        rotation="0 180 0"
                        width="1.6"
                        height="2.24"
                        src={backTex}
                        material="shader: standard; side: front; transparent: true; metalness: 0.3; roughness: 0.5"
                      ></a-plane>

                      {/* Core box border */}
                      <a-box
                        position="0 0 0"
                        width="1.59"
                        height="2.23"
                        depth="0.02"
                        color="#0f172a"
                        material="shader: standard; metalness: 0.7; roughness: 0.3"
                      ></a-box>
                    </a-entity>
                  );
                })}
              </a-entity>

            </a-scene>
          </div>
        )}

        {/* Drag rotation handler */}
        <div 
          className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Footer instructions */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 border border-white/10 py-3 px-6 rounded-2xl flex flex-col items-center gap-1 shadow-2xl pointer-events-none w-[80%] max-w-xs text-center">
          <span className="text-[9px] font-black text-emerald-400 tracking-wider uppercase">
            {language === 'ko' ? '★ 덱 3D 감상 모드' : '★ DECK 3D VIEW'}
          </span>
          <p className="text-[10px] text-slate-300 font-semibold leading-relaxed">
            {language === 'ko' 
              ? '화면을 상하좌우로 드래그하여 전체 덱 카드를 회전하며 감상하세요.' 
              : 'Drag to rotate your active deck of cards in 3D space.'}
          </p>
        </div>

      </div>
    </AnimatePresence>
  );
};
