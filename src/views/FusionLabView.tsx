/**
 * FusionLabView.tsx - SCR-08-13, SCR-08-14, SCR-08-15
 * 소환 & 융합 연구소 (소환/합성/연금술 뷰)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, BookOpen, Crown, Zap, Plus, ArrowRight, ShieldCheck, Flame, 
  RotateCcw, Info, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Language, ViewType, CardRarity, InventoryRecord } from '../types';
import { PageHeader } from '../components/PageHeader';
import { triggerHaptic } from '../lib/haptic';
import { CARD_DATABASE } from '../cardDatabase';
import { GpuParticleBuffer } from '../lib/GpuParticleBuffer';
import { FLUID_VERTEX_SHADER, FLUID_FRAGMENT_SHADER } from '../shaders/FluidSimulationShader';
import { RecipeReverseTrackerSheet, FusionRecipe } from '../components/RecipeReverseTrackerSheet';
import { AutoEquipRecipeButton } from '../components/AutoEquipRecipeButton';
import { TripleJackpotModal } from '../components/TripleJackpotModal';

interface FusionLabViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason?: string, type?: 'earned' | 'purchased') => void;
  playSfx: (url: string) => void;
  inventory: Record<number, InventoryRecord>;
  addCard: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
  setView: (view: ViewType) => void;
  user?: any;
  syncUserData?: (data: any) => Promise<void>;
  currentSeason?: string;
}

export const FusionLabView: React.FC<FusionLabViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  inventory,
  addCard,
  setView,
}) => {
  // Slots: up to 2 material cards
  const [slotA, setSlotA] = useState<number | null>(null);
  const [slotB, setSlotB] = useState<number | null>(null);

  // States
  const [isFusing, setIsFusing] = useState(false);
  const [isRecipeSheetOpen, setIsRecipeSheetOpen] = useState(false);
  const [jackpotCard, setJackpotCard] = useState<{ name: string; rarity: string } | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Canvas ref for SCR-08-13 WebGL 2.0 Fluid Simulation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Presets recipes for SCR-08-14
  const sampleRecipes: FusionRecipe[] = useMemo(() => [
    {
      targetCardId: 42,
      targetName: '성검의 계승자 아르카',
      targetRarity: 'UR',
      materials: [
        { cardId: 1, name: '초보 기사', rarity: 'N', requiredQty: 2 },
        { cardId: 5, name: '강철 방패병', rarity: 'R', requiredQty: 1 },
      ],
      successRate: 75,
    },
    {
      targetCardId: 88,
      targetName: '심연의 마도사 벨리알',
      targetRarity: 'SSR',
      materials: [
        { cardId: 2, name: '견습 마법사', rarity: 'N', requiredQty: 2 },
        { cardId: 6, name: '불꽃 술사', rarity: 'R', requiredQty: 1 },
      ],
      successRate: 85,
    },
    {
      targetCardId: 99,
      targetName: '천상의 발키리 에스텔',
      targetRarity: 'UR',
      materials: [
        { cardId: 3, name: '숲의 궁수', rarity: 'N', requiredQty: 2 },
        { cardId: 7, name: '치유의 사제', rarity: 'R', requiredQty: 1 },
      ],
      successRate: 65,
    },
  ], []);

  // WebGL 2.0 Ping-Pong Fluid Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    // Create shaders & program with Transform Feedback
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return;
    gl.shaderSource(vs, FLUID_VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return;
    gl.shaderSource(fs, FLUID_FRAGMENT_SHADER);
    gl.compileShader(fs);

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.transformFeedbackVaryings(
      program,
      ['v_position', 'v_velocity', 'v_life'],
      gl.SEPARATE_ATTRIBS
    );
    gl.linkProgram(program);

    const gpuBuffer = new GpuParticleBuffer(isFusing ? 1000 : 300);
    gpuBuffer.init(gl, program);

    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.04, 0.04, 0.07, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      const uDt = gl.getUniformLocation(program, 'u_deltaTime');
      const uCenter = gl.getUniformLocation(program, 'u_centerGravity');
      gl.uniform1f(uDt, dt * (isFusing ? 2.5 : 1.0));
      gl.uniform2f(uCenter, 0.0, 0.0);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      // Draw particles
      gl.drawArrays(gl.POINTS, 0, gpuBuffer.getCount());

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isFusing]);

  // Execute fusion action
  const handleExecuteFusion = () => {
    if (slotA === null || slotB === null) {
      setAlertMsg({ type: 'error', text: '융합할 재료 카드를 2장 모두 선택해주세요!' });
      return;
    }

    const fusionCost = 100;
    if (sns < fusionCost) {
      setAlertMsg({ type: 'error', text: '융합 연금술 비용(100 SNS)이 부족합니다!' });
      return;
    }

    updateSns(-fusionCost, '[연금술 카드 융합 촉매 소모]');
    setIsFusing(true);
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setTimeout(() => {
      setIsFusing(false);

      // 5% 확률로 트리플 크리티컬 잭팟 (SCR-08-15)
      const isJackpot = Math.random() < 0.05;
      const targetRarity: CardRarity = Math.random() < 0.3 ? 'legendary' : 'diamond';
      const allIds = Object.keys(CARD_DATABASE).map(Number);
      const randomId = allIds[Math.floor(Math.random() * allIds.length)] || 1;
      const createdCard = CARD_DATABASE[randomId];
      const cardTitle = createdCard?.title || '황금 수호신';

      if (isJackpot) {
        setJackpotCard({ name: cardTitle, rarity: targetRarity });
        triggerHaptic('heavy');
        playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');
      } else {
        addCard(targetRarity, randomId);
        triggerHaptic('heavy');
        setAlertMsg({
          type: 'success',
          text: `🎉 [융합 대성공] [${targetRarity.toUpperCase()}] ${cardTitle} 카드를 획득했습니다!`,
        });
      }

      // Reset slots
      setSlotA(null);
      setSlotB(null);
    }, 2000);
  };

  // 1-Tap Auto Equip
  const handleAutoEquip = () => {
    const ownedIds = Object.keys(inventory).map(Number).filter(id => inventory[id]?.count > 0);
    if (ownedIds.length < 2) {
      setAlertMsg({ type: 'error', text: '융합에 필요한 보유 카드가 부족합니다 (최소 2장 필요).' });
      return;
    }
    setSlotA(ownedIds[0]);
    setSlotB(ownedIds[1]);
    triggerHaptic('heavy');
    setAlertMsg({ type: 'success', text: '보유 재료가 융합 슬롯에 자동 배치되었습니다!' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col select-none">
      <PageHeader
        title={language === 'ko' ? '[⚗️ 소환 & 융합 연구소]' : '[⚗️ Alchemy Fusion Lab]'}
        description={language === 'ko' ? '초고속 WebGL 60fps 마법 유체 융합 & 연금술 레시피' : 'GPGPU 60fps Fluid Fusion & Recipe Tracker'}
        onBack={() => setView('mydeck')}
        rightElement={
          <button
            type="button"
            onClick={() => setIsRecipeSheetOpen(true)}
            className="px-3 py-1.5 bg-amber-500/20 border border-amber-400 text-amber-300 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <BookOpen size={14} />
            <span>레시피 북</span>
          </button>
        }
      />

      {/* Main Layout */}
      <div className="flex-1 p-4 max-w-xl mx-auto w-full flex flex-col gap-4">
        {/* Alerts */}
        {alertMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              alertMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500 text-rose-300'
            }`}
          >
            {alertMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* SCR-08-13: 3D 마법 유체 WebGL 2.0 캔버스 뷰포트 */}
        <div className="relative w-full h-52 rounded-2xl bg-black border-2 border-amber-500/40 overflow-hidden shadow-2xl flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div className="relative z-10 text-center pointer-events-none">
            <span className="text-[10px] text-amber-400 font-bold bg-black/60 px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-widest block mb-1">
              {isFusing ? '⚡ 연금술 융합 반응 진행 중...' : 'WebGL 2.0 Transform Feedback GPGPU (60fps)'}
            </span>
            <h3 className="text-base font-black text-white drop-shadow-md">
              {isFusing ? '신화 카드가 합성되고 있습니다!' : '신비의 연금술 융합 가마솥'}
            </h3>
          </div>
        </div>

        {/* Fusion Slots (A & B) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Slot A */}
          <div
            onClick={() => {
              const owned = Object.keys(inventory).map(Number).filter(id => inventory[id]?.count > 0);
              if (owned.length > 0) setSlotA(owned[0]);
            }}
            className="h-28 bg-slate-900/80 border-2 border-dashed border-amber-500/40 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-all text-center"
          >
            {slotA !== null ? (
              <div>
                <span className="text-[10px] text-emerald-400 font-bold block">재료 카드 #1</span>
                <span className="text-xs font-black text-white">{CARD_DATABASE[slotA]?.title || `카드 #${slotA}`}</span>
              </div>
            ) : (
              <div className="text-slate-400 flex flex-col items-center gap-1">
                <Plus size={20} className="text-amber-400" />
                <span className="text-xs font-bold">재료 카드 1 선택</span>
              </div>
            )}
          </div>

          {/* Slot B */}
          <div
            onClick={() => {
              const owned = Object.keys(inventory).map(Number).filter(id => inventory[id]?.count > 0);
              if (owned.length > 1) setSlotB(owned[1]);
              else if (owned.length > 0) setSlotB(owned[0]);
            }}
            className="h-28 bg-slate-900/80 border-2 border-dashed border-amber-500/40 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-all text-center"
          >
            {slotB !== null ? (
              <div>
                <span className="text-[10px] text-emerald-400 font-bold block">재료 카드 #2</span>
                <span className="text-xs font-black text-white">{CARD_DATABASE[slotB]?.title || `카드 #${slotB}`}</span>
              </div>
            ) : (
              <div className="text-slate-400 flex flex-col items-center gap-1">
                <Plus size={20} className="text-amber-400" />
                <span className="text-xs font-bold">재료 카드 2 선택</span>
              </div>
            )}
          </div>
        </div>

        {/* SCR-08-14: 1-Tap Auto Equip Button */}
        <AutoEquipRecipeButton
          onAutoEquip={handleAutoEquip}
          language={language}
        />

        {/* Main Fusion Execute Button */}
        <button
          type="button"
          disabled={isFusing || slotA === null || slotB === null}
          onClick={handleExecuteFusion}
          className="h-14 w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Sparkles size={20} className="fill-slate-950" />
          <span>{isFusing ? '연금술 융합 촉매 반응 중...' : '마법 융합 시작 (소모: 100 SNS)'}</span>
        </button>

        {/* Monthly Alchemy Master Pass banner (SCR-08-15) */}
        <div className="p-3 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={22} className="text-amber-400" />
            <div>
              <span className="text-xs font-black text-amber-300 block">월간 연금술 마스터 패스 (2,200원)</span>
              <span className="text-[10px] text-slate-300">실패 시 재료 50% 보존 + 잭팟 확률 2배 상승</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              updateSns(-500, '[월간 연금술 마스터 패스 구독]');
              setAlertMsg({ type: 'success', text: '월간 연금술 마스터 패스가 활성화되었습니다!' });
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg cursor-pointer active:scale-95"
          >
            구독하기
          </button>
        </div>
      </div>

      {/* SCR-08-14: 목표 카드 연금 레시피 역추적 북 모달 */}
      <RecipeReverseTrackerSheet
        isOpen={isRecipeSheetOpen}
        onClose={() => setIsRecipeSheetOpen(false)}
        recipes={sampleRecipes}
        userInventory={inventory}
        language={language}
        onSelectRecipe={(recipe) => {
          if (recipe.materials.length >= 2) {
            setSlotA(recipe.materials[0].cardId);
            setSlotB(recipe.materials[1].cardId);
          }
        }}
      />

      {/* SCR-08-15: 대성공 5% 트리플 크리티컬 잭팟 모달 */}
      <TripleJackpotModal
        isOpen={jackpotCard !== null}
        onClose={() => setJackpotCard(null)}
        cardName={jackpotCard?.name || ''}
        cardRarity={jackpotCard?.rarity || 'UR'}
        language={language}
        onClaimAll={() => {
          if (jackpotCard) {
            addCard(jackpotCard.rarity as CardRarity);
            addCard(jackpotCard.rarity as CardRarity);
            addCard(jackpotCard.rarity as CardRarity);
          }
        }}
        onBuyMasterPass={() => {
          updateSns(-500, '[월간 연금술 마스터 패스 구독]');
          setAlertMsg({ type: 'success', text: '월간 연금술 마스터 패스가 활성화되었습니다!' });
        }}
      />
    </div>
  );
};
