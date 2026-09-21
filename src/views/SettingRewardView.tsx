/**
 * SettingRewardView.tsx - SCR-12-13, SCR-12-14, SCR-12-15
 * 환경설정 & 계정/보상 센터 (멀티 CDN 핑 라우팅, 터치 캘리브레이션 패드, 비밀 금고 타임딜)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, Wifi, Sliders, Key, Volume2, Globe, Shield, RefreshCw, 
  CheckCircle2, ArrowRight, Zap, Database 
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { PageHeader } from '../components/PageHeader';
import { triggerHaptic } from '../lib/haptic';
import { DynamicCdnRouter, CdnRouteStatus } from '../lib/DynamicCdnRouter';
import { GestureSensitivityManager, TouchSensitivitySettings } from '../lib/GestureSensitivityManager';
import { TouchCalibrationPad } from '../components/TouchCalibrationPad';
import { SecretVaultModal } from '../components/SecretVaultModal';

interface SettingRewardViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  sns: number;
  updateSns: (amount: number, reason?: string, type?: 'earned' | 'purchased') => void;
  playSfx: (url: string) => void;
  onNavigate: (view: ViewType) => void;
  lowSpecMode: boolean;
  onToggleLowSpecMode: () => void;
  user?: any;
}

export const SettingRewardView: React.FC<SettingRewardViewProps> = ({
  language,
  onLanguageChange,
  sns,
  updateSns,
  playSfx,
  onNavigate,
  lowSpecMode,
  onToggleLowSpecMode,
  user,
}) => {
  // CDN Router (SCR-12-13)
  const routerRef = useRef<DynamicCdnRouter>(new DynamicCdnRouter());
  const [cdnStatus, setCdnStatus] = useState<CdnRouteStatus>(routerRef.current.getStatus());
  const [cdnNodes, setCdnNodes] = useState([
    { id: 'kr_seoul_primary', name: 'KR 서울 메인 노드', pingMs: 12 },
    { id: 'kr_busan_edge', name: 'KR 부산 엣지 가속', pingMs: 18 },
    { id: 'jp_tokyo_dr', name: 'JP 도쿄 재해복구 노드', pingMs: 34 },
  ]);

  // Touch Sensitivity (SCR-12-14)
  const sensitivityMgrRef = useRef<GestureSensitivityManager>(new GestureSensitivityManager());
  const [touchSettings, setTouchSettings] = useState<TouchSensitivitySettings>(
    sensitivityMgrRef.current.getSettings()
  );

  // Secret Vault Modal (SCR-12-15)
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Ping update simulation
  const handlePingTest = () => {
    triggerHaptic('medium');
    const updated = cdnNodes.map(n => ({
      ...n,
      pingMs: Math.max(9, Math.round(n.pingMs + (Math.random() * 6 - 3))),
    }));
    setCdnNodes(updated);
    const newStatus = routerRef.current.selectFastestNode(updated);
    setCdnStatus(newStatus);
  };

  const handleUpdateTouch = (partial: Partial<TouchSensitivitySettings>) => {
    sensitivityMgrRef.current.updateSettings(partial);
    setTouchSettings(sensitivityMgrRef.current.getSettings());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col select-none">
      <PageHeader
        title={language === 'ko' ? '[⚙️ 환경설정 & 계정 센터]' : '[⚙️ Settings & Account Center]'}
        description={language === 'ko' ? '초고속 CDN 자동 스왑 & 터치 감도 캘리브레이션' : 'Smart CDN Auto-Swap & Gesture Calibration'}
        onBack={() => onNavigate('home')}
        rightElement={
          <button
            type="button"
            onClick={() => setIsVaultOpen(true)}
            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 shadow-md"
          >
            <Key size={13} />
            <span>비밀 금고</span>
          </button>
        }
      />

      {/* Main Container */}
      <div className="flex-1 p-4 max-w-xl mx-auto w-full flex flex-col gap-4">
        {/* SCR-12-13: Smart Multi-CDN Routing Section */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-emerald-400" />
              <span className="text-xs font-black text-white">스마트 CDN 게이트웨이 라우팅</span>
            </div>
            <button
              type="button"
              onClick={handlePingTest}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-bold rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 border border-slate-700"
            >
              <RefreshCw size={12} />
              <span>핑 진단</span>
            </button>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">현재 활성 게이트웨이</span>
              <span className="font-black text-emerald-300">{cdnStatus.activeNodeName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">응답 지연 (Ping)</span>
              <span className="font-black text-emerald-400">{cdnStatus.pingMs} ms</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {cdnNodes.map(node => (
              <div
                key={node.id}
                onClick={() => {
                  triggerHaptic('light');
                  routerRef.current.manuallySetNode(node.id, node.name, node.pingMs);
                  setCdnStatus(routerRef.current.getStatus());
                }}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                  node.id === cdnStatus.activeNodeId
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span>{node.name}</span>
                <span className="font-bold">{node.pingMs} ms</span>
              </div>
            ))}
          </div>
        </div>

        {/* SCR-12-14: Touch Calibration Pad */}
        <TouchCalibrationPad
          settings={touchSettings}
          onUpdate={handleUpdateTouch}
        />

        {/* General Settings */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-3">
          <span className="text-xs font-black text-white">기본 시스템 설정</span>

          {/* Low spec mode toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 block">저사양 배터리 절약 모드</span>
              <span className="text-[10px] text-slate-400">파티클 및 WebGL 이펙트를 간소화하여 발열 억제</span>
            </div>
            <button
              type="button"
              onClick={onToggleLowSpecMode}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                lowSpecMode ? 'bg-amber-500' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  lowSpecMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Language Selection */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-200">언어 (Language)</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onLanguageChange('ko')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                  language === 'ko' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                }`}
              >
                한국어
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                  language === 'en' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SCR-12-15: Secret Vault Modal */}
      <SecretVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        userLevel={12}
        loginDays={18}
        onUnlockVault={(vId) => {
          updateSns(2500, `[비밀 금고 #${vId} 해제 보너스]`);
        }}
        onBuyMasterKeyPack={() => {
          updateSns(-500, '[마스터 키 팩 구매]');
        }}
      />
    </div>
  );
};
