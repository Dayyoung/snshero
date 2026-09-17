import React, { useState } from 'react';
import { Swords, X, Shield, Star, CheckCircle, Sparkles, UserCheck } from 'lucide-react';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

interface GuildMercenaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onRentMercenary: (mercenaryName: string, cardName: string) => void;
}

const MOCK_MERCENARIES = [
  { id: 'merc-1', owner: 'Hunter_Ace', cardName: '황금빛 드래곤 군주 (UR)', power: '+18%', fee: '500 Gold', element: '✦ 드래곤' },
  { id: 'merc-2', owner: 'ShadowBlade', cardName: '심연의 나이트메어 (SSR)', power: '+14%', fee: '500 Gold', element: '💀 언데드' },
  { id: 'merc-3', owner: 'FlameMaster', cardName: '진홍의 불사조 발키리 (SSR)', power: '+15%', fee: '500 Gold', element: '🔥 불' },
];

export const GuildMercenaryModal: React.FC<GuildMercenaryModalProps> = ({
  isOpen,
  onClose,
  language,
  onRentMercenary
}) => {
  const isKo = language === 'ko';
  const todayStr = new Date().toISOString().slice(0, 10);
  const [rentedId, setRentedId] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(`hero_guild_rented_merc_${todayStr}`) : null;
  });

  if (!isOpen) return null;

  const handleRent = (merc: typeof MOCK_MERCENARIES[0]) => {
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    localStorage.setItem(`hero_guild_rented_merc_${todayStr}`, merc.id);
    setRentedId(merc.id);
    onRentMercenary(merc.owner, merc.cardName);
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-sm bg-[#161313] border border-amber-500/60 p-4 text-white shadow-2xl rounded-none flex flex-col space-y-3">
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 text-white/60 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-1.5 text-amber-400">
          <Swords size={18} />
          <span className="text-xs font-black uppercase tracking-wider">
            {isKo ? '[길드 에이스 카드 용병 대여소]' : '[GUILD ACE MERCENARY POST]'}
          </span>
        </div>

        <p className="text-[11px] text-white/70 leading-relaxed">
          {isKo
            ? '길드원 최상위 랭커의 대표 에이스 카드를 일일 용병으로 고용하여 타워 및 던전 전투력을 대폭 증폭시킵니다.'
            : 'Hire top guildmates\' ace cards as daily mercenaries to boost your dungeon and tower combat power.'}
        </p>

        {/* Mercenary List */}
        <div className="space-y-2">
          {MOCK_MERCENARIES.map(merc => {
            const isRented = rentedId === merc.id;
            return (
              <div
                key={merc.id}
                className={`p-2.5 border transition-all ${
                  isRented
                    ? 'bg-amber-500/15 border-amber-400'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold">[{merc.owner}]</span>
                    <h5 className="text-xs font-black text-white">{merc.cardName}</h5>
                  </div>
                  <span className="text-xs font-black text-emerald-400">{merc.power}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
                  <span className="text-[10px] text-white/60">{merc.element} | {merc.fee}</span>
                  {isRented ? (
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                      <CheckCircle size={12} /> {isKo ? '고용 중' : 'Hired'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRent(merc)}
                      className="min-h-[36px] px-3 bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] rounded-none cursor-pointer active:scale-95"
                    >
                      {isKo ? '대여하기' : 'Hire'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full min-h-[40px] text-white/50 hover:text-white text-[11px] font-bold cursor-pointer"
        >
          [{isKo ? '닫기' : 'Close'}]
        </button>
      </div>
    </div>
  );
};
