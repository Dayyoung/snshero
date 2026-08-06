import React, { useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Bitcoin,
  Smartphone,
  Shield,
  Clock,
  Info,
  AlertTriangle,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Language } from '../types';
import { t } from '../lib/i18n';
import {
  type PaymentGateway,
  type PaymentGatewayType,
  type ComplianceNotice,
  getGatewaysByType,
  getComplianceNotices,
  isGatewayUsable,
  formatGatewayFee,
  detectAppEnvironment,
} from '../lib/paymentGateways';

// ─── Icon mapping by gateway type ────────────────────────────────────

interface PaymentGatewayIconProps {
  type: PaymentGatewayType;
  size?: number;
  className?: string;
}

function GatewayTypeIcon({ type, size = 20, className }: PaymentGatewayIconProps) {
  switch (type) {
    case 'googleplay':
      return <Smartphone size={size} className={className} />;
    case 'card':
      return <CreditCard size={size} className={className} />;
    case 'paypal':
      return <DollarSign size={size} className={className} />;
    case 'crypto':
      return <Bitcoin size={size} className={className} />;
    case 'simplePay':
      return <Smartphone size={size} className={className} />;
  }
}

// ─── Tabs ────────────────────────────────────────────────────────────

interface PaymentTabsProps {
  selectedType: PaymentGatewayType | null;
  onSelect: (type: PaymentGatewayType) => void;
  language: Language;
  lowSpecMode?: boolean;
  isAppEnvironment?: boolean;
}

const ALL_TAB_TYPES: PaymentGatewayType[] = ['googleplay', 'card', 'simplePay', 'paypal', 'crypto'];

function getInitialTab(selectedGatewayId: string | null | undefined, isApp: boolean): PaymentGatewayType {
  const grouped = getGatewaysByType();

  if (isApp) {
    return 'googleplay';
  }

  const tabTypes: PaymentGatewayType[] = ['card', 'simplePay', 'paypal', 'crypto'];
  if (selectedGatewayId) {
    for (const type of ALL_TAB_TYPES) {
      if (grouped[type].some((gateway) => gateway.id === selectedGatewayId)) {
        return type;
      }
    }
  }

  const firstActiveType = tabTypes.find((type) => grouped[type].some((gateway) => gateway.status === 'active'));
  return firstActiveType ?? 'paypal';
}

function PaymentTabs({ selectedType, onSelect, language, lowSpecMode, isAppEnvironment }: PaymentTabsProps) {
  const grouped = useMemo(() => getGatewaysByType(), []);

  // In app environment (WebView/TWA), per Google Play Store policy, only Google Play In-App Billing is shown.
  const visibleTabs = isAppEnvironment ? ['googleplay' as PaymentGatewayType] : ['paypal', 'crypto', 'card', 'simplePay'] as PaymentGatewayType[];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {visibleTabs.map((type) => {
        const gateways = grouped[type];
        const hasActive = gateways.some((g) => g.status === 'active');
        const isSelected = selectedType === type;

        return (
          <motion.button
            key={type}
            type="button"
            whileTap={lowSpecMode ? undefined : { scale: 0.95 }}
            onClick={() => onSelect(type)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer touch-target whitespace-nowrap',
              isSelected
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400',
            )}
          >
            <GatewayTypeIcon
              type={type}
              size={14}
              className={isSelected ? 'text-white' : 'text-slate-400'}
            />
            <span>{t(`pg_tab_${type}`, language)}</span>
            {hasActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Gateway Card ────────────────────────────────────────────────────

interface GatewayCardProps {
  gateway: PaymentGateway;
  language: Language;
  isSelected: boolean;
  onSelect: () => void;
  lowSpecMode?: boolean;
}

function GatewayCard({ gateway, language, isSelected, onSelect, lowSpecMode }: GatewayCardProps) {
  const isUsable = gateway.status === 'active';
  const isComingSoon = gateway.status === 'coming_soon';
  const fee = formatGatewayFee(gateway);

  return (
    <motion.button
      type="button"
      whileHover={lowSpecMode ? undefined : { y: -2 }}
      whileTap={lowSpecMode ? undefined : { scale: 0.98 }}
      onClick={isUsable ? onSelect : undefined}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-3 cursor-pointer',
        isSelected
          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
          : isUsable
            ? 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm'
            : 'border-slate-100 bg-slate-50/50',
        !isUsable && 'cursor-default',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              isUsable ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400',
            )}
          >
            <GatewayTypeIcon type={gateway.type} size={18} />
          </div>
          <div>
            <h4
              className={cn(
                'font-bold text-sm tracking-tight',
                isUsable ? 'text-slate-800' : 'text-slate-400',
              )}
            >
              {t(gateway.nameKey, language)}
            </h4>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-tight">
              {t(gateway.descriptionKey, language)}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest',
            gateway.status === 'active'
              ? 'bg-green-100 text-green-700'
              : gateway.status === 'coming_soon'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700',
          )}
        >
          {t(`pg_status_${gateway.status}`, language)}
        </span>
      </div>

      {/* Fee & Processing Time */}
      <div className="flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Shield size={12} className="text-slate-400" />
          <span className="font-bold uppercase tracking-widest">
            {t('pg_fee_label', language)}: {fee.total}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock size={12} className="text-slate-400" />
          <span className="font-bold uppercase tracking-widest">
            {t(gateway.processingTimeKey, language)}
          </span>
        </div>
      </div>

      {/* Coming Soon Notice */}
      {isComingSoon && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase tracking-widest">
            {t('pg_coming_soon_notice', language)}
          </p>
        </div>
      )}

      {/* Disabled Notice */}
      {gateway.status === 'disabled' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-600 font-bold leading-relaxed uppercase tracking-widest">
            {t('pg_disabled_notice', language)}
          </p>
        </div>
      )}

      {/* Selection indicator for active gateways */}
      {isUsable && (
        <div className="flex items-center justify-end">
          <span
            className={cn(
              'text-[9px] font-black uppercase tracking-widest',
              isSelected ? 'text-blue-600' : 'text-slate-400',
            )}
          >
            {isSelected ? t('pg_selected', language) : t('pg_select', language)}
          </span>
        </div>
      )}
    </motion.button>
  );
}

// ─── Compliance Notice Section ───────────────────────────────────────

interface ComplianceNoticesSectionProps {
  language: Language;
  onNavigate?: (view: string) => void;
  className?: string;
}

function ComplianceNoticesSection({ language, onNavigate, className }: ComplianceNoticesSectionProps) {
  const notices = useMemo(() => getComplianceNotices(), []);

  const handleLinkClick = (notice: ComplianceNotice) => {
    if (notice.linkUrl && onNavigate) {
      onNavigate('policy-center');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Info size={14} className="text-slate-400" />
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {t('pg_compliance_title', language)}
        </h4>
      </div>

      {notices.map((notice) => (
        <div
          key={notice.key}
          className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5"
        >
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] font-bold text-slate-700 tracking-tight">
              {t(notice.titleKey, language)}
            </h5>
            {notice.linkUrl && (
              <button
                type="button"
                onClick={() => handleLinkClick(notice)}
                className="flex items-center gap-1 text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors cursor-pointer"
              >
                {t(notice.linkKey ?? 'pg_notice_read_policy', language)}
                <ExternalLink size={10} />
              </button>
            )}
          </div>
          <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
            {t(notice.bodyKey, language)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export interface PaymentMethodSelectorProps {
  language: Language;
  lowSpecMode?: boolean;
  selectedGatewayId?: string | null;
  onGatewaySelect: (gatewayId: string) => void;
  onNavigate?: (view: string) => void;
  /** 결제 단계별로 노출할 고지사항 필터 */
  showComplianceNotices?: boolean;
  className?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  language,
  lowSpecMode = false,
  selectedGatewayId = null,
  onGatewaySelect,
  onNavigate,
  showComplianceNotices = true,
  className,
}) => {
  const [isAppEnv, setIsAppEnv] = useState(false);

  useEffect(() => {
    detectAppEnvironment().then((env) => {
      if (env.isApp) {
        setIsAppEnv(true);
        onGatewaySelect('google-play');
      }
    });
  }, [onGatewaySelect]);

  const [activeTab, setActiveTab] = useState<PaymentGatewayType>(() => getInitialTab(selectedGatewayId, isAppEnv));
  const grouped = useMemo(() => getGatewaysByType(), []);

  useEffect(() => {
    setActiveTab(getInitialTab(selectedGatewayId, isAppEnv));
  }, [selectedGatewayId, isAppEnv]);

  // 선택된 type의 게이트웨이 목록
  const currentGateways = useMemo(() => grouped[activeTab] ?? [], [grouped, activeTab]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {isAppEnv && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
          <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block uppercase tracking-wider text-[10px] text-emerald-700">
              Google Play In-App Billing Compliance Active
            </span>
            <p className="text-[11px] leading-relaxed text-emerald-900">
              {t('pg_googleplay_app_only_notice', language)}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <PaymentTabs
        selectedType={activeTab}
        onSelect={setActiveTab}
        language={language}
        lowSpecMode={lowSpecMode}
        isAppEnvironment={isAppEnv}
      />

      {/* Gateway Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={lowSpecMode ? undefined : { opacity: 0, y: 8 }}
          animate={lowSpecMode ? undefined : { opacity: 1, y: 0 }}
          exit={lowSpecMode ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-3"
        >
          {currentGateways.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                {t('pg_no_gateways', language)}
              </p>
            </div>
          ) : (
            currentGateways.map((gateway) => (
              <React.Fragment key={gateway.id}>
              <GatewayCard
                gateway={gateway}
                language={language}
                isSelected={selectedGatewayId === gateway.id}
                onSelect={() => {
                  if (isGatewayUsable(gateway.id)) {
                    onGatewaySelect(gateway.id);
                  }
                }}
                lowSpecMode={lowSpecMode}
              />
              </React.Fragment>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Compliance Notices */}
      {showComplianceNotices && (
        <ComplianceNoticesSection language={language} onNavigate={onNavigate} />
      )}
    </div>
  );
};

export default PaymentMethodSelector;
