import React, { useState } from 'react';
import { hsAudio } from '../audio';
import { useModalDismiss } from '../useModalDismiss';

export const RULES_SEEN_KEY = 'hero_hs_rules_seen';

export function hasSeenQuickRules(): boolean {
  try {
    return localStorage.getItem(RULES_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markQuickRulesSeen(): void {
  try {
    localStorage.setItem(RULES_SEEN_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

interface QuickRulesModalProps {
  isFirstTime?: boolean;
  inBattle?: boolean;
  onClose: () => void;
}

const CORE_RULES = [
  {
    step: '1',
    icon: '👑',
    title: '승리 조건: 적 영웅 체력 0 만들기',
    desc: '화면 위쪽 상대 영웅의 빨간 체력 방울(기본 30)을 0으로 만들면 즉시 승리합니다!',
    accent: 'border-rose-400/55 bg-rose-950/35 text-rose-200',
  },
  {
    step: '2',
    icon: '💎',
    title: '마나(파란 보석)로 초록 카드 내기',
    desc: '매 턴 최대 마나가 +1씩 늘어납니다(최대 10). 내 마나 이하의 초록색 테두리 카드를 눌러 소환하세요!',
    accent: 'border-sky-400/55 bg-sky-950/35 text-sky-200',
  },
  {
    step: '3',
    icon: '⚔️',
    title: '소환 다음 턴부터 공격 & 턴 종료',
    desc: '소환한 하수인은 첫 턴에 잠든(Zzz) 뒤, 다음 턴 초록 테두리가 켜지면 적 하수인·적 영웅을 눌러 공격합니다. 할 일이 끝나면 [턴 종료]를 누르세요.',
    accent: 'border-emerald-400/55 bg-emerald-950/35 text-emerald-200',
  },
];

const KEYWORDS = [
  { name: '🛡 도발', desc: '방패 테두리 하수인이 있으면 다른 대상보다 도발 하수인을 먼저 공격해야 합니다.' },
  { name: '⚡ 돌진', desc: '소환한 턴에도 잠들지 않고 바로 공격할 수 있습니다.' },
  { name: '✨ 천상의 보호막', desc: '처음 받는 피해를 1회 완전히 막아내는 황금 보호막입니다.' },
  { name: '📣 전투의 함성', desc: '카드를 손에서 필드로 낼 때 즉시 발동하는 효과입니다.' },
  { name: '💀 죽음의 메아리', desc: '이 하수인이 파괴될 때 발동하는 효과입니다.' },
  { name: '🌟 3장 = 3배 각성', desc: '스토리모드에서는 같은 카드를 3장 이상 모으면 공격력·체력이 3배 이상 강해집니다!' },
];

export const QuickRulesModal: React.FC<QuickRulesModalProps> = ({
  isFirstTime = false,
  inBattle = false,
  onClose,
}) => {
  const [showKeywords, setShowKeywords] = useState(false);

  const handleClose = () => {
    markQuickRulesSeen();
    hsAudio.playSfx('box_close');
    onClose();
  };

  useModalDismiss(true, handleClose);

  return (
    <div
      onClick={handleClose}
      data-testid="quick-rules-modal"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/82 p-3 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl p-4 text-amber-100 shadow-2xl sm:p-6"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-amber-500/35 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-950/70 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-200">
              <span>🧭 10초 핵심 규칙 가이드</span>
              {isFirstTime && <span className="text-yellow-300">· 첫 모험 환영!</span>}
            </div>
            <h2 className="hs-title mt-1.5 text-lg font-extrabold text-amber-100 sm:text-2xl">
              카드 배틀, 이렇게 하면 됩니다!
            </h2>
          </div>
          <button
            type="button"
            data-testid="quick-rules-close"
            onClick={handleClose}
            className="hs-brass-btn min-h-[40px] shrink-0 rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-100"
          >
            닫기 ✕
          </button>
        </div>

        {/* 3 Core Rule Cards */}
        <div className="space-y-2.5">
          {CORE_RULES.map((rule) => (
            <div
              key={rule.step}
              className={`flex items-start gap-3 rounded-2xl border p-3 sm:p-3.5 ${rule.accent}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-black/45 text-xl shadow-inner">
                {rule.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-white sm:text-base">
                  {rule.step}. {rule.title}
                </div>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-100/90 sm:text-[13px]">
                  {rule.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tip Box: Auto-Play Toggle */}
        <div className="mt-3 rounded-2xl border border-amber-400/45 bg-amber-950/45 px-3.5 py-2.5 text-xs font-semibold text-amber-100">
          <span className="font-black text-yellow-300">⚙ 자동플레이 팁:</span>{' '}
          직접 플레이하다가 막히거나 편하게 관전하고 싶을 때는 우측 상단{' '}
          <span className="rounded bg-black/50 px-1.5 py-0.5 font-extrabold text-emerald-300">
            ⚙ 자동 ON/OFF
          </span>{' '}
          버튼으로 언제든 전환할 수 있습니다!
        </div>

        {/* Collapsible Keyword Glossary */}
        <div className="mt-3">
          <button
            type="button"
            data-testid="quick-rules-keywords-toggle"
            onClick={() => {
              hsAudio.playSfx('ui_click', 0.75);
              setShowKeywords((v) => !v);
            }}
            className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[#c8a158]/50 bg-black/45 px-3.5 py-2 text-xs font-extrabold text-amber-200 transition hover:border-amber-300 sm:text-sm"
          >
            <span>📖 자주 나오는 카드 능력(키워드) 6가지 보기</span>
            <span>{showKeywords ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>

          {showKeywords && (
            <div className="mt-2 grid grid-cols-1 gap-2 rounded-2xl border border-[#c8a158]/35 bg-black/55 p-3 sm:grid-cols-2">
              {KEYWORDS.map((kw) => (
                <div
                  key={kw.name}
                  className="rounded-xl border border-amber-500/20 bg-stone-950/80 p-2.5"
                >
                  <div className="text-xs font-black text-yellow-300">{kw.name}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-amber-100/85">
                    {kw.desc}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <div className="mt-4">
          <button
            type="button"
            data-testid="quick-rules-start-btn"
            onClick={() => {
              hsAudio.playSfx('box_press');
              markQuickRulesSeen();
              onClose();
            }}
            className="hs-arcane-btn hs-title hs-outline-sm min-h-[48px] w-full rounded-2xl py-3 text-base font-extrabold text-white shadow-xl"
          >
            {inBattle ? '이해했어요! 전투 시작하기 ⚔' : '이해했어요! 여관으로 돌아가기'}
          </button>
        </div>
      </div>
    </div>
  );
};
