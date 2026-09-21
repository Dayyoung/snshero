/**
 * SecretVaultModal.tsx - SCR-12-15
 * 누적 로그인/레벨 기반 계정 비밀 금고(Secret Vault) & 마스터 키 팩 모달
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Lock, Unlock, Sparkles, X, Shield, Clock, Gift } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface SecretVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: number;
  loginDays: number;
  onUnlockVault: (vaultId: string) => void;
  onBuyMasterKeyPack: () => void;
}

export const SecretVaultModal: React.FC<SecretVaultModalProps> = ({
  isOpen,
  onClose,
  userLevel,
  loginDays,
  onUnlockVault,
  onBuyMasterKeyPack,
}) => {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const vaults = [
    { id: 'v1', name: '브론즈 금고 (7일 출석)', reqDays: 7, reqLevel: 5, reward: '1,000 SNS + 전설 장비 상자' },
    { id: 'v2', name: '실버 금고 (15일 출석)', reqDays: 15, reqLevel: 10, reward: '2,500 SNS + 레전더리 카드 1장' },
    { id: 'v3', name: '골든 마스터 금고 (30일 출석)', reqDays: 30, reqLevel: 20, reward: '5,000 SNS + 한정 3D 메카 아바타' },
  ];

  const handleUnlock = (v: typeof vaults[0]) => {
    triggerHaptic('heavy');
    setUnlockedIds((prev) => [...prev, v.id]);
    onUnlockVault(v.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-sm">
            <Key size={18} />
            <span>🔐 계정 비밀 금고 (Secret Vault)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3.5">
          <div className="text-[11px] text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
            내 누적 계정 기록: 출석 <span className="text-amber-400 font-bold">{loginDays}일</span> | 레벨 <span className="text-emerald-400 font-bold">Lv.{userLevel}</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {vaults.map((v) => {
              const isEligible = loginDays >= v.reqDays && userLevel >= v.reqLevel;
              const isClaimed = unlockedIds.includes(v.id);

              return (
                <div
                  key={v.id}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      {isClaimed ? (
                        <Unlock size={15} className="text-emerald-400" />
                      ) : (
                        <Lock size={15} className="text-amber-400" />
                      )}
                      <span className="text-xs font-bold text-white">{v.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      보상: <span className="text-amber-300">{v.reward}</span>
                    </span>
                  </div>

                  {isClaimed ? (
                    <span className="px-2.5 py-1 text-[10px] text-slate-500 bg-slate-950 rounded-lg">
                      해제 완료
                    </span>
                  ) : isEligible ? (
                    <button
                      type="button"
                      onClick={() => handleUnlock(v)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl active:scale-95 cursor-pointer shadow-md"
                    >
                      금고 해제
                    </button>
                  ) : (
                    <span className="px-2 py-1 text-[10px] text-slate-500 bg-slate-950 rounded-lg">
                      조건 미달
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Master Key Pack Upsell (SCR-12-15) */}
          <div className="p-3 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-2xl flex items-center justify-between mt-1">
            <div>
              <div className="flex items-center gap-1 text-xs font-black text-amber-300">
                <Key size={14} />
                <span>마스터 키 팩 (1,900원 / 90% 특가)</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                조건 무시 모든 금고 즉시 오픈 + 한정 3D 아바타 지급
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onBuyMasterKeyPack();
                setUnlockedIds(vaults.map(v => v.id));
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl active:scale-95 cursor-pointer shadow-lg shrink-0"
            >
              키 팩 구매
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
