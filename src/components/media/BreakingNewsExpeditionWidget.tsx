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
  { id: 'recon_1h', nameKey: 'reconTitle', durationHours: 1, creditsReward: 150, logItemKey: 'reconLog', sectorTag: 'SECTOR-ALPHA' },
  { id: 'patrol_2h', nameKey: 'patrolTitle', durationHours: 2, creditsReward: 300, logItemKey: 'patrolChip', sectorTag: 'SECTOR-BRAVO' },
  { id: 'deep_4h', nameKey: 'deepTitle', durationHours: 4, creditsReward: 450, logItemKey: 'deepIntel', sectorTag: 'SECTOR-OMEGA' },
];

const EXPEDITION_I18N: Record<string, Record<string, string>> = {
  ko: {
    drawerTitle: '속보 전술 파견 사령부',
    badge: '실시간 뉴스 섹터 연계 방치형 보급',
    collapsedTab: '속보 전술 파견 진행 중',
    idlePrompt: '뉴스룸 속보 섹터로 전술 요원을 파견하고 방치형 보상을 확보하세요.',
    deployBtn: '1클릭 전술 파견',
    dispatching: '파견 작전 수행 중...',
    accelerateBtn: '고속 전술 가속 [즉시 완료]',
    claimRewardBtn: '작전 성공: 450 크레딧 & 데이터 로그 수령',
    reconTitle: '속보 신속 정찰 작전 (1시간)',
    patrolTitle: '뉴스룸 섹터 순찰 작전 (2시간)',
    deepTitle: '심층 기밀 첩보 추출 (4시간)',
    reconLog: '신속 정찰 데이터 로그 x1',
    patrolChip: '전술 암호 칩셋 x1',
    deepIntel: '1급 기밀 속보 인텔 x1',
    rewardClaimed: '파견 보상 수령 완료!',
    close: '접기'
  },
  en: {
    drawerTitle: 'BREAKING NEWS EXPEDITION COMMAND',
    badge: 'REAL-TIME NEWS SECTOR IDLE DISPATCH',
    collapsedTab: 'TACTICAL EXPEDITION ACTIVE',
    idlePrompt: 'Dispatch tactical operatives into breaking news sectors for idle rewards.',
    deployBtn: '1-CLICK DISPATCH',
    dispatching: 'MISSION IN PROGRESS...',
    accelerateBtn: 'FAST-FORWARD TACTICAL LINK [INSTANT]',
    claimRewardBtn: 'MISSION COMPLETE: CLAIM 450 CREDITS & INTEL',
    reconTitle: 'FAST RECON OPERATION (1 HOUR)',
    patrolTitle: 'NEWSROOM SECTOR PATROL (2 HOURS)',
    deepTitle: 'DEEP CLASSIFIED EXTRACTION (4 HOURS)',
    reconLog: 'RECON DATA LOG x1',
    patrolChip: 'TACTICAL CIPHER CHIP x1',
    deepIntel: 'TOP SECRET DOSSIER x1',
    rewardClaimed: 'Expedition rewards claimed successfully!',
    close: 'COLLAPSE'
  },
  ja: {
    drawerTitle: '速報戦術派遣司令部',
    badge: 'リアルタイム速報セクター放置型補給',
    collapsedTab: '戦術派遣ミッション進行中',
    idlePrompt: '速報セクターへエージェントを派遣し、放置報酬を獲得してください。',
    deployBtn: '1クリック戦術派遣',
    dispatching: '作戦任務遂行中...',
    accelerateBtn: '高速完了 [即時判定]',
    claimRewardBtn: '作戦成功: 450クレジット＆データログ受取',
    reconTitle: '速報迅速偵察作戦 (1時間)',
    patrolTitle: 'ニュースセクター巡回作戦 (2時間)',
    deepTitle: '深層機密諜報抽出 (4時間)',
    reconLog: '迅速偵察ログ x1',
    patrolChip: '戦術暗号チップ x1',
    deepIntel: '最重要速報インテル x1',
    rewardClaimed: '派遣報酬受取完了！',
    close: '閉じる'
  },
  'zh-CN': {
    drawerTitle: '速报战术派遣指挥部',
    badge: '实时新闻区域挂机放置补给',
    collapsedTab: '战术派遣任务执行中',
    idlePrompt: '向速报战区派遣战术干员，挂机获取丰厚战术物资。',
    deployBtn: '一键战术派遣',
    dispatching: '作战任务执行中...',
    accelerateBtn: '战术极速推进 [立即完成]',
    claimRewardBtn: '任务成功: 领取 450 积分与情报日志',
    reconTitle: '速报快侦行动 (1小时)',
    patrolTitle: '新闻防区巡逻 (2小时)',
    deepTitle: '深层机密抽取 (4小时)',
    reconLog: '快侦数据日志 x1',
    patrolChip: '战术密码芯片 x1',
    deepIntel: '绝密速报情报 x1',
    rewardClaimed: '派遣奖励领取成功！',
    close: '收起'
  },
  'zh-TW': {
    drawerTitle: '速報戰術派遣指揮部',
    badge: '即時新聞區域掛機放置補給',
    collapsedTab: '戰術派遣任務執行中',
    idlePrompt: '向速報戰區派遣戰術幹員，掛機獲取豐厚戰術物資。',
    deployBtn: '一鍵戰術派遣',
    dispatching: '作戰任務執行中...',
    accelerateBtn: '戰術極速推進 [立即完成]',
    claimRewardBtn: '任務成功: 領取 450 積分與情報日誌',
    reconTitle: '速報快偵行動 (1小時)',
    patrolTitle: '新聞防區巡邏 (2小時)',
    deepTitle: '深層機密抽取 (4小時)',
    reconLog: '快偵數據日誌 x1',
    patrolChip: '戰術密碼晶片 x1',
    deepIntel: '絕密速報情報 x1',
    rewardClaimed: '派遣獎勵領取成功！',
    close: '收起'
  },
  de: {
    drawerTitle: 'EILMELDUNGS-EXPEDITIONSKOMMANDO',
    badge: 'ECHTZEIT-NEWS-SEKTOR-IDLE-SYSTEM',
    collapsedTab: 'EXPEDITION LÄUFT',
    idlePrompt: 'Entsenden Sie Agenten in News-Sektoren für Idle-Belohnungen.',
    deployBtn: '1-KLICK-ENTTSENDUNG',
    dispatching: 'OPERATION LÄUFT...',
    accelerateBtn: 'SOFORT BEENDEN',
    claimRewardBtn: 'ERFOLG: 450 CREDITS & INTEL ERHALTEN',
    reconTitle: 'SCHNELLE AUFKLÄRUNG (1h)',
    patrolTitle: 'SEKTOR-PATROUILLE (2h)',
    deepTitle: 'TIEFE EXTRAKTION (4h)',
    reconLog: 'AUFKLÄRUNGSLOG x1',
    patrolChip: 'CHIFFRE-CHIP x1',
    deepIntel: 'STRENG GEHEIME DATEI x1',
    rewardClaimed: 'Belohnung erfolgreich beansprucht!',
    close: 'EINKLAPPEN'
  },
  es: {
    drawerTitle: 'COMANDO DE EXPEDICIÓN DE NOTICIAS',
    badge: 'DESPLIEGUE PASIVO EN SECTOR DE NOTICIAS',
    collapsedTab: 'EXPEDICIÓN ACTIVA',
    idlePrompt: 'Despliegue agentes en sectores de noticias para recompensas inactivas.',
    deployBtn: 'DESPLIEGUE EN 1 CLIC',
    dispatching: 'OPERACIÓN EN CURSO...',
    accelerateBtn: 'AVANCE RÁPIDO [INMEDIATO]',
    claimRewardBtn: 'MISIÓN ÉXITO: 450 CRÉDITOS Y REGISTRO',
    reconTitle: 'RECONOCIMIENTO RÁPIDO (1H)',
    patrolTitle: 'PATRULLA DE SECTOR (2H)',
    deepTitle: 'EXTRACCIÓN CLASIFICADA (4H)',
    reconLog: 'REGISTRO DE RECONOCIMIENTO x1',
    patrolChip: 'CHIP TÁCTICO x1',
    deepIntel: 'INTELIGENCIA DE ALTO SECRETO x1',
    rewardClaimed: '¡Recompensas recibidas!',
    close: 'CERRAR'
  },
  fr: {
    drawerTitle: 'COMMANDEMENT D EXPÉDITION D ACTUALITÉS',
    badge: 'EXPÉDITION D ACTUALITÉS EN MODE IDLE',
    collapsedTab: 'EXPÉDITION ACTIVE',
    idlePrompt: 'Déployez des agents dans les secteurs d actualités pour des gains idle.',
    deployBtn: 'DÉPLOIEMENT EN 1 CLIC',
    dispatching: 'MISSION EN COURS...',
    accelerateBtn: 'AVANCER IMMÉDIATEMENT',
    claimRewardBtn: 'SUCCÈS: 450 CRÉDITS ET DOSSIER INTEL',
    reconTitle: 'RECONNAISSANCE RAPIDE (1H)',
    patrolTitle: 'PATROUILLE DE SECTEUR (2H)',
    deepTitle: 'EXTRACTION CLASSIFIÉE (4H)',
    reconLog: 'LOG DE RECONNAISSANCE x1',
    patrolChip: 'PUCE TACTIQUE x1',
    deepIntel: 'DOSSIER TRÈS SECRET x1',
    rewardClaimed: 'Récompenses récupérées !',
    close: 'RÉDUIRE'
  },
  id: {
    drawerTitle: 'KOMANDO EKSPEDISI BERITA UTAMA',
    badge: 'PASOKAN IDLE SEKTOR BERITA REAL-TIME',
    collapsedTab: 'EKSPEDISI BERJALAN',
    idlePrompt: 'Kirim agen ke sektor berita untuk mendapatkan hadiah pasif.',
    deployBtn: '1-KLIK LUNCURKAN',
    dispatching: 'MISI SEDANG BERJALAN...',
    accelerateBtn: 'PERCEPAT SELESAI',
    claimRewardBtn: 'MISI SUKSES: KLAIM 450 KREDIT & DATA',
    reconTitle: 'INTAI KILAT (1 JAM)',
    patrolTitle: 'PATROLI SEKTOR (2 JAM)',
    deepTitle: 'EKSTRAKSI RAHASIA (4 JAM)',
    reconLog: 'LOG DATA REKON x1',
    patrolChip: 'CHIP CIPHER TAKTIS x1',
    deepIntel: 'INTEL RAHASIA TINGGI x1',
    rewardClaimed: 'Hadiah ekspedisi berhasil diklaim!',
    close: 'TUTUP'
  },
  ru: {
    drawerTitle: 'ШТАБ ЭКСПЕДИЦИЙ СРОЧНЫХ НОВОСТЕЙ',
    badge: 'ФОНОВЫЙ СБОР РЕСУРСОВ В СЕКТОРЕ НОВОСТЕЙ',
    collapsedTab: 'ЭКСПЕДИЦИЯ В ПРОЦЕССЕ',
    idlePrompt: 'Отправляйте оперативников в зоны новостей для фонового фарма.',
    deployBtn: 'ОТПРАВИТЬ В 1 КЛИК',
    dispatching: 'МИССИЯ ВЫПОЛНЯЕТСЯ...',
    accelerateBtn: 'УСКОРИТЬ СРАЗУ',
    claimRewardBtn: 'УСПЕХ: ЗАБРАТЬ 450 КРЕДИТОВ И ДАННЫЕ',
    reconTitle: 'БЫСТРАЯ РАЗВЕДКА (1 ЧАС)',
    patrolTitle: 'ПАТРУЛЬ СЕКТОРА (2 ЧАСА)',
    deepTitle: 'СЕКРЕТНОЕ ИЗВЛЕЧЕНИЕ (4 ЧАСА)',
    reconLog: 'ЖУРНАЛ РАЗВЕДКИ x1',
    patrolChip: 'ТАКТИЧЕСКИЙ ЧИП x1',
    deepIntel: 'СОВЕРШЕННО СЕКРЕТНО x1',
    rewardClaimed: 'Награды за экспедицию получены!',
    close: 'СВЕРНУТЬ'
  },
  th: {
    drawerTitle: 'กองบัญชาการสำรวจข่าวด่วน',
    badge: 'เสบียงไอเดิลแบบเรียลไทม์จากเซกเตอร์ข่าว',
    collapsedTab: 'กำลังดำเนินการสำรวจทางยุทธวิธี',
    idlePrompt: 'ส่งเจ้าหน้าที่ไปยังเซกเตอร์ข่าวด่วนเพื่อรับรางวัลแบบปล่อยทิ้งไว้',
    deployBtn: 'ส่งกำลังพลใน 1 คลิก',
    dispatching: 'กำลังดำเนินภารกิจ...',
    accelerateBtn: 'เร่งความเร็วให้เสร็จทันที',
    claimRewardBtn: 'ภารกิจสำเร็จ: รับ 450 เครดิตและบันทึกข้อมูล',
    reconTitle: 'ลาดตระเวนด่วน (1 ชั่วโมง)',
    patrolTitle: 'ตรวจการณ์เซกเตอร์ (2 ชั่วโมง)',
    deepTitle: 'สกัดข้อมูลลับเชิงลึก (4 ชั่วโมง)',
    reconLog: 'บันทึกข้อมูลลาดตระเวน x1',
    patrolChip: 'ชิปไซเฟอร์ทางยุทธวิธี x1',
    deepIntel: 'ข่าวกรองลับสุดยอด x1',
    rewardClaimed: 'รับรางวัลการสำรวจเรียบร้อยแล้ว!',
    close: 'ย่อลง'
  },
  vi: {
    drawerTitle: 'SỞ CHỈ HUY VIỄN CHINH TIN NÓNG',
    badge: 'TIẾP TẾ TỰ ĐỘNG THEO KHU VỰC TIN TỨC',
    collapsedTab: 'ĐANG THỰC HIỆN PHÁI CHIẾN THUẬT',
    idlePrompt: 'Điều động đặc vụ đến các khu vực tin nóng để thu thập tài nguyên tự động.',
    deployBtn: 'PHÁI ĐI CHỈ 1 CHẠM',
    dispatching: 'ĐANG THỰC HIỆN NHIỆM VỤ...',
    accelerateBtn: 'TĂNG TỐC HOÀN THÀNH NGAY',
    claimRewardBtn: 'THÀNH CÔNG: NHẬN 450 TÍN DỤNG & DỮ LIỆU',
    reconTitle: 'TRINH SÁT NHANH (1 GIỜ)',
    patrolTitle: 'TUẦN TRA KHU VỰC (2 GIỜ)',
    deepTitle: 'TRÍCH XUẤT MẬT SÂU (4 GIỜ)',
    reconLog: 'NHẬT KÝ TRINH SÁT x1',
    patrolChip: 'CHIP MÃ HÓA CHIẾN THUẬT x1',
    deepIntel: 'HỒ SƠ TỐI MẬT x1',
    rewardClaimed: 'Đã nhận phần thưởng viễn chinh!',
    close: 'THU GỌN'
  }
};

const STORAGE_KEY = 'snshero_breaking_news_expedition';

interface ExpeditionState {
  missionId: string;
  startTime: number;
  durationMs: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CLAIMED';
}

export const BreakingNewsExpeditionWidget: React.FC<BreakingNewsExpeditionWidgetProps> = ({
  currentSubreddit = 'news',
  language: propLang,
  onNavigateView
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = EXPEDITION_I18N[currentLang] || EXPEDITION_I18N.ko;

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState('deep_4h');
  const [expedition, setExpedition] = useState<ExpeditionState | null>(null);
  const [remainingSec, setRemainingSec] = useState(0);

  // Restore expedition from localStorage with offline timestamp calculation
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: ExpeditionState = JSON.parse(raw);
        const elapsed = Date.now() - saved.startTime;
        if (saved.status === 'ACTIVE') {
          if (elapsed >= saved.durationMs) {
            saved.status = 'COMPLETED';
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
          }
        }
        setExpedition(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Timer loop for active countdown
  useEffect(() => {
    if (!expedition || expedition.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - expedition.startTime;
      const left = Math.max(0, Math.ceil((expedition.durationMs - elapsed) / 1000));
      setRemainingSec(left);

      if (left <= 0) {
        const updated: ExpeditionState = { ...expedition, status: 'COMPLETED' };
        setExpedition(updated);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expedition]);

  const handleStartMission = (mission: ExpeditionMission) => {
    triggerHaptic('tap');
    const newState: ExpeditionState = {
      missionId: mission.id,
      startTime: Date.now(),
      durationMs: mission.durationHours * 3600 * 1000,
      status: 'ACTIVE'
    };
    setExpedition(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {}
  };

  const handleAccelerate = () => {
    triggerHaptic('medium');
    if (!expedition) return;
    const completedState: ExpeditionState = {
      ...expedition,
      status: 'COMPLETED'
    };
    setExpedition(completedState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedState));
    } catch {}
  };

  const handleClaimReward = () => {
    triggerHaptic('success');
    if (!expedition) return;
    const mission = MISSIONS.find(m => m.id === expedition.missionId) || MISSIONS[2];

    try {
      const curCredits = parseInt(localStorage.getItem('hero_user_credits') || '0', 10);
      localStorage.setItem('hero_user_credits', (curCredits + mission.creditsReward).toString());
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    setExpedition(null);
    setIsExpanded(false);
  };

  const activeMission = MISSIONS.find(m => m.id === (expedition?.missionId || selectedMissionId)) || MISSIONS[2];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center pointer-events-none select-none font-mono">
      {/* Collapsed Breathing Cyan Dock (Pointer events active) */}
      {!isExpanded && (
        <div
          onClick={() => {
            triggerHaptic('tap');
            setIsExpanded(true);
          }}
          className="pointer-events-auto cursor-pointer mb-3 px-4 py-2 bg-[#090d16]/95 border border-cyan-500/40 rounded-full text-cyan-300 text-xs shadow-xl shadow-cyan-950/40 flex items-center gap-2 transition-all hover:bg-black/90 active:scale-95 animate-pulse"
        >
          <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="font-bold tracking-wider uppercase text-[11px]">
            {expedition?.status === 'ACTIVE'
              ? `${tr.collapsedTab} [${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s]`
              : expedition?.status === 'COMPLETED'
              ? tr.claimRewardBtn
              : tr.drawerTitle}
          </span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>
      )}

      {/* Expanded Sliding Drawer (Pointer events active) */}
      {isExpanded && (
        <div className="pointer-events-auto w-full max-w-lg bg-[#090d16]/95 border-t border-x border-cyan-500/30 rounded-t-xl p-4 sm:p-5 text-white shadow-2xl space-y-3.5 animate-slideUp">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase">
                {tr.drawerTitle} // R/{currentSubreddit.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-gray-400 hover:text-white rounded border border-transparent hover:border-white/10"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <p className="text-[11px] text-gray-300">
            {tr.idlePrompt}
          </p>

          {/* ACTIVE DISPATCH VIEW */}
          {expedition?.status === 'ACTIVE' && (
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-lg space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-cyan-300 font-bold">{tr[activeMission.nameKey]}</span>
                <span className="text-white font-mono font-bold">
                  {Math.floor(remainingSec / 60)}m {remainingSec % 60}s
                </span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-cyan-500/30">
                <div
                  className="h-full bg-cyan-400 transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, ((expedition.durationMs - remainingSec * 1000) / expedition.durationMs) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                <span>ESTIMATED PAYLOAD: +{activeMission.creditsReward} CREDITS</span>
                <button
                  onClick={handleAccelerate}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 rounded font-bold transition-all active:scale-95"
                >
                  {tr.accelerateBtn}
                </button>
              </div>
            </div>
          )}

          {/* COMPLETED REWARD VIEW */}
          {expedition?.status === 'COMPLETED' && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg space-y-2">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{tr.claimRewardBtn}</span>
              </div>
              <button
                onClick={handleClaimReward}
                className="w-full min-h-[44px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold rounded-lg text-xs transition-all active:scale-[0.98]"
              >
                CLAIM +{activeMission.creditsReward} CREDITS & INTEL
              </button>
            </div>
          )}

          {/* IDLE MISSION PICKER */}
          {!expedition && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MISSIONS.map((m) => {
                  const isSelected = selectedMissionId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        triggerHaptic('tap');
                        setSelectedMissionId(m.id);
                      }}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-md'
                          : 'bg-black/50 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="text-[10px] font-bold truncate">{tr[m.nameKey]}</div>
                      <div className="text-[9px] text-gray-400 mt-1">+{m.creditsReward} CREDITS</div>
                      <div className="text-[8px] text-cyan-500/80 font-bold mt-0.5">{m.sectorTag}</div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => handleStartMission(activeMission)}
                className="w-full min-h-[44px] bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-cyan-950/50"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {tr.deployBtn} ({activeMission.durationHours}H)
              </button>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(false)}
            className="w-full min-h-[38px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-lg text-xs transition-colors"
          >
            {tr.close}
          </button>
        </div>
      )}
    </div>
  );
};

export default BreakingNewsExpeditionWidget;
