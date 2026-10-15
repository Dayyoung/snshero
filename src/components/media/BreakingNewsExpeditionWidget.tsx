import React, { useState, useEffect } from 'react';
import { ViewType } from '../../types';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface BreakingNewsExpeditionWidgetProps {
  currentSubreddit?: string;
  language?: string;
  onNavigateView?: (view: ViewType) => void;
}

interface ExpeditionMission {
  id: string;
  nameKey: string;
  durationHours: number;
  creditsReward: number;
  logItemKey: string;
  sectorTag: string;
}

const MISSIONS: ExpeditionMission[] = [
  { id: 'recon_1h', nameKey: 'reconTitle', durationHours: 1, creditsReward: 150, logItemKey: 'reconLog', sectorTag: '[엘윈 설원]' },
  { id: 'patrol_2h', nameKey: 'patrolTitle', durationHours: 2, creditsReward: 300, logItemKey: 'patrolChip', sectorTag: '[붉은 절벽]' },
  { id: 'deep_4h', nameKey: 'deepTitle', durationHours: 4, creditsReward: 450, logItemKey: 'deepIntel', sectorTag: '[서리 궁전]' },
];

const EXPEDITION_I18N: Record<string, Record<string, string>> = {
  ko: {
    drawerTitle: '[라이트헤븐 전령소 // 대륙 속보 정찰 원정]',
    badge: '대륙 속보 연계 방치형 원정대',
    collapsedTab: '[원정대 순찰 중...]',
    idlePrompt: '대륙 곳곳의 긴급 속보 징후를 추적하여 척후병을 파견하고 방치형 보상을 수확하세요.',
    deployBtn: '[1클릭 척후병 파견]',
    dispatching: '대륙 원정 수행 중...',
    accelerateBtn: '[순찰 마법 가속 // 즉시 완료]',
    claimRewardBtn: '[원정 완수: 450 SNS & 대륙 탐사록 수령]',
    reconTitle: '엘윈 설원 전초기지 순찰 (1시간)',
    patrolTitle: '붉은 절벽 협곡 수색 (2시간)',
    deepTitle: '서리 궁전 심층 탐사 (4시간)',
    reconLog: '엘윈 설원 기록지 x1',
    patrolChip: '붉은 절벽 광석 x1',
    deepIntel: '서리 궁전 고대 지도 x1',
    rewardClaimed: '원정 보상 수령 완료!',
    close: '[접기]'
  },
  en: {
    drawerTitle: '[LIGHTHEAVEN OUTPOST // SCOUT EXPEDITION]',
    badge: 'CONTINENTAL NEWS DISPATCH MATRIX',
    collapsedTab: '[EXPEDITION IN PROGRESS...]',
    idlePrompt: 'Track urgent continental signs and deploy scouts for idle expedition rewards.',
    deployBtn: '[1-CLICK DISPATCH SCOUTS]',
    dispatching: 'EXPEDITION UNDERWAY...',
    accelerateBtn: '[EXPEDITION ACCELERATE // INSTANT]',
    claimRewardBtn: '[EXPEDITION COMPLETE: CLAIM 450 SNS]',
    reconTitle: 'Elwin Wildland Outpost Patrol (1h)',
    patrolTitle: 'Red Cliff Gorge Search (2h)',
    deepTitle: 'Frost Palace Deep Exploration (4h)',
    reconLog: 'Elwin Travel Journal x1',
    patrolChip: 'Red Cliff Ore x1',
    deepIntel: 'Frost Palace Ancient Map x1',
    rewardClaimed: 'Expedition rewards claimed!',
    close: '[COLLAPSE]'
  }
};

const STORAGE_KEY = 'snshero_breaking_news_expedition_v1';

interface ExpeditionState {
  missionId: string;
  startTime: number;
  durationMs: number;
  isCompleted: boolean;
}

export const BreakingNewsExpeditionWidget: React.FC<BreakingNewsExpeditionWidgetProps> = ({
  currentSubreddit = 'news',
  language = 'ko',
  onNavigateView
}) => {
  const { theme } = useGameSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeExpedition, setActiveExpedition] = useState<ExpeditionState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const t = EXPEDITION_I18N[language] || EXPEDITION_I18N.ko;

  // 로컬스토리지 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ExpeditionState = JSON.parse(raw);
        setActiveExpedition(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // 타이머 틱
  useEffect(() => {
    if (!activeExpedition) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - activeExpedition.startTime;
      const remaining = Math.max(0, activeExpedition.durationMs - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0 && !activeExpedition.isCompleted) {
        const completedState: ExpeditionState = { ...activeExpedition, isCompleted: true };
        setActiveExpedition(completedState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completedState));
        triggerHaptic('victory');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExpedition]);

  const handleDeploy = (mission: ExpeditionMission) => {
    triggerHaptic('tap');
    const newState: ExpeditionState = {
      missionId: mission.id,
      startTime: Date.now(),
      durationMs: mission.durationHours * 3600 * 1000,
      isCompleted: false
    };
    setActiveExpedition(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const handleAccelerate = () => {
    if (!activeExpedition) return;
    triggerHaptic('heavy');
    const completedState: ExpeditionState = { ...activeExpedition, isCompleted: true };
    setActiveExpedition(completedState);
    setTimeRemaining(0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedState));
  };

  const handleClaim = () => {
    if (!activeExpedition) return;
    triggerHaptic('victory');
    const mission = MISSIONS.find(m => m.id === activeExpedition.missionId) || MISSIONS[0];

    // 크레딧 지급 (로컬스토리지 sync)
    try {
      const savedSns = localStorage.getItem('hero_user_sns') || '1000';
      const newSns = parseInt(savedSns, 10) + mission.creditsReward;
      localStorage.setItem('hero_user_sns', String(newSns));
      window.dispatchEvent(new CustomEvent('snshero_sns_updated'));
    } catch {
      // ignore
    }

    localStorage.removeItem(STORAGE_KEY);
    setActiveExpedition(null);
  };

  return (
    <>
      {/* 우측 하단 미니 독 토글 (OpenCode.ai 모노스페이스 플랫) */}
      {!isOpen && (
        <button
          onClick={() => {
            triggerHaptic('tap');
            setIsOpen(true);
          }}
          className="fixed bottom-14 right-4 z-40 px-3 py-2 bg-[#141212] border border-stone-800 hover:border-amber-500 text-stone-200 font-mono text-xs flex items-center gap-2 rounded-sm shadow-sm transition-all"
        >
          <div className="w-2 h-2 rounded-none bg-amber-400"></div>
          <span className="font-bold text-amber-300">
            {activeExpedition ? t.collapsedTab : t.drawerTitle}
          </span>
        </button>
      )}

      {/* 펼쳐진 서랍 패널 (OpenCode.ai 모노스페이스 플랫) */}
      {isOpen && (
        <div className="fixed bottom-14 right-4 z-40 w-80 bg-[#181616] border border-stone-800 rounded-none p-4 font-mono text-xs text-stone-200 animate-fade-in shadow-xl select-none">
          <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                {t.badge}
              </div>
              <h3 className="text-xs font-bold text-white mt-0.5">
                {t.drawerTitle}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-500 hover:text-white p-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {!activeExpedition ? (
            <div className="space-y-3">
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {t.idlePrompt}
              </p>
              <div className="space-y-2">
                {MISSIONS.map(m => (
                  <div
                    key={m.id}
                    className="p-2.5 bg-stone-900 border border-stone-800 rounded-none flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-400 font-bold">{m.sectorTag}</span>
                        <span className="text-xs font-bold text-stone-200">
                          {t[m.nameKey] || m.nameKey}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        보상: +{m.creditsReward} SNS
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeploy(m)}
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500 text-amber-300 font-bold rounded-sm text-[10px]"
                    >
                      {t.deployBtn}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-none text-center">
                <div className="text-[10px] text-amber-400 uppercase font-bold mb-1">
                  [원정 상태]
                </div>
                <div className="text-sm font-bold text-white">
                  {activeExpedition.isCompleted ? '[원정 완수 완료]' : t.dispatching}
                </div>
                {!activeExpedition.isCompleted && (
                  <div className="text-xs text-stone-400 mt-1 font-mono">
                    남은 시간: {Math.floor(timeRemaining / 60000)}m {Math.floor((timeRemaining % 60000) / 1000)}s
                  </div>
                )}
              </div>

              {activeExpedition.isCompleted ? (
                <button
                  onClick={handleClaim}
                  className="w-full min-h-[44px] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500 text-amber-300 font-bold rounded-sm text-xs"
                >
                  {t.claimRewardBtn}
                </button>
              ) : (
                <button
                  onClick={handleAccelerate}
                  className="w-full min-h-[36px] bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 font-bold rounded-sm text-xs"
                >
                  {t.accelerateBtn}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BreakingNewsExpeditionWidget;
export const GuildBountyExpeditionWidget = BreakingNewsExpeditionWidget;
