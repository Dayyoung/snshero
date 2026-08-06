import React, { useState, useMemo } from 'react';
import { Language } from '../../types';
import { t } from '../../lib/i18n';
import {
  SCALEUP_GATE_TRACKS,
  ScaleupGateTrack,
  GateStatus,
  computeGateStatus,
  evaluateScaleupMetric,
} from '../../content/scaleupGates';
import {
  Gauge, TrendingUp, AlertTriangle, ShieldCheck, ShieldAlert,
  RotateCcw, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  ArrowUpRight, FileText,
} from 'lucide-react';

interface ScaleupGateBoardProps {
  language: Language;
  lowSpecMode: boolean;
}

const STATUS_CONFIG: Record<GateStatus, {
  labelKey: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
  ringClass: string;
}> = {
  ready: {
    labelKey: 'scaleup_gate_status_ready',
    icon: <ShieldCheck size={16} />,
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    ringClass: 'ring-emerald-500/20',
  },
  watching: {
    labelKey: 'scaleup_gate_status_watching',
    icon: <TrendingUp size={16} />,
    bgClass: 'bg-indigo-500/10',
    textClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/40',
    ringClass: 'ring-indigo-500/20',
  },
  hold: {
    labelKey: 'scaleup_gate_status_hold',
    icon: <Clock size={16} />,
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/40',
    ringClass: 'ring-slate-500/20',
  },
  danger: {
    labelKey: 'scaleup_gate_status_danger',
    icon: <ShieldAlert size={16} />,
    bgClass: 'bg-rose-500/10',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/40',
    ringClass: 'ring-rose-500/20',
  },
};

/** 개별 트랙 카드 */
const TrackCard: React.FC<{
  track: ScaleupGateTrack;
  language: Language;
  lowSpecMode: boolean;
}> = ({ track, language, lowSpecMode }) => {
  const [expanded, setExpanded] = useState(false);
  const status = useMemo(() => computeGateStatus(track), [track]);
  const cfg = STATUS_CONFIG[status];

  const allMet = status === 'ready';

  return (
    <div
      className={`bg-slate-900/60 border rounded-3xl overflow-hidden backdrop-blur-sm shadow-md transition-all ${
        expanded ? cfg.borderClass : 'border-slate-800/80'
      }`}
    >
      {/* 트랙 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bgClass} ${cfg.textClass} ring-1 ${cfg.ringClass}`}>
            {cfg.icon}
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-sm font-bold text-white truncate">
              {t(track.titleKey, language)}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {t(track.descKey, language)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${cfg.borderClass} ${cfg.bgClass} ${cfg.textClass}`}>
            {t(cfg.labelKey, language)}
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </div>
      </button>

      {/* 확장 영역: 지표 상세 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 지표 테이블 */}
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge size={10} />
              <span>{t('scaleup_gate_leading_metrics', language)}</span>
            </div>
            {track.prerequisiteMetrics.map((m) => {
              const evaluation = evaluateScaleupMetric(m);
              const { current, target, progress, met } = evaluation;
              return (
                <div key={m.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-medium">
                      {t(m.key, language)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                      {current.toLocaleString()}{m.unit ? ` ${m.unit}` : ''}
                      <span className="text-slate-600 mx-1">/</span>
                      {target.toLocaleString()}{m.unit ? ` ${m.unit}` : ''}
                    </span>
                  </div>
                  {/* 프로그레스 바 */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        met
                          ? 'bg-emerald-500'
                          : progress >= 0.5
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(progress * 100, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 착수 조건 + 리스크 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                <ArrowUpRight size={10} />
                <span>{t('scaleup_gate_start_condition', language)}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {t(track.startCondition, language)}
              </p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-400 uppercase tracking-wider">
                <AlertTriangle size={10} />
                <span>{t('scaleup_gate_risk_title', language)}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {t(track.riskKey, language)}
              </p>
            </div>
          </div>

          {/* 다음 행동 체크리스트 */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
              <FileText size={10} />
              <span>{t('scaleup_gate_next_action', language)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-1">
              {t(track.nextActionDocKey, language)}
            </p>
            {track.nextActionDocPath ? (
              <a
                href={track.nextActionDocPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300 hover:bg-indigo-600/25 active:scale-95 transition-all no-underline"
              >
                <ArrowUpRight size={10} />
                {t('scaleup_gate_open_next_doc', language)}
              </a>
            ) : null}
            <div className="space-y-1.5">
              {track.nextActionChecklist.map((ck, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500">
                  <div className="w-3.5 h-3.5 rounded border border-slate-700 bg-slate-800/50 flex items-center justify-center shrink-0">
                    <span className="text-[7px] text-slate-600">{i + 1}</span>
                  </div>
                  <span>{t(ck, language)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 조건 충족 상태 요약 */}
          <div className="flex items-center justify-between pt-1">
            {allMet ? (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                <CheckCircle2 size={12} />
                {t('scaleup_gate_condition_met', language)}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                <XCircle size={12} />
                {t('scaleup_gate_condition_not_met', language)}
              </div>
            )}
            {!lowSpecMode && (
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-700/60 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw size={10} />
                {t('scaleup_gate_collapse', language)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/** ─── 스케일업 게이트 보드 메인 컴포넌트 ──────────────── */

export const ScaleupGateBoard: React.FC<ScaleupGateBoardProps> = ({
  language,
  lowSpecMode,
}) => {
  const summary = useMemo(() => {
    const counts: Record<GateStatus, number> = { ready: 0, watching: 0, hold: 0, danger: 0 };
    for (const track of SCALEUP_GATE_TRACKS) {
      counts[computeGateStatus(track)]++;
    }
    return counts;
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* 상단 요약 바 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(['ready', 'watching', 'hold', 'danger'] as GateStatus[]).map((st) => {
          const cfg = STATUS_CONFIG[st];
          return (
            <div
              key={st}
              className={`rounded-2xl border p-3 ${cfg.bgClass} ${cfg.borderClass}`}
            >
              <div className="flex items-center gap-2">
                <div className={`${cfg.textClass}`}>{cfg.icon}</div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {t(cfg.labelKey, language)}
                  </div>
                  <div className={`text-lg font-extrabold ${cfg.textClass}`}>
                    {summary[st]}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 정책 문서 링크 */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-indigo-400" />
          <span className="text-[11px] font-medium text-slate-300">
            {t('scaleup_gate_policy_notice', language)}
          </span>
        </div>
        <a
          href="/doc/scaleup-gate-policy.md"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-400 hover:bg-indigo-600/30 active:scale-95 transition-all cursor-pointer no-underline"
        >
          {t('scaleup_gate_policy_link', language)}
        </a>
      </div>

      {/* 트랙 목록 */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {SCALEUP_GATE_TRACKS.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            language={language}
            lowSpecMode={lowSpecMode}
          />
        ))}
      </div>
    </div>
  );
};
