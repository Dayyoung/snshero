import React, { useState, useEffect, useRef } from 'react';
import { ChallengePayload, shareChallengeViaWebShare } from '../../utils/challengeCanvasGenerator';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface InstantRevengeModalProps {
  isOpen: boolean;
  deckCode: string;
  challengerPayload: ChallengePayload;
  onClose: () => void;
  onRevengeVictory?: () => void;
  language?: string;
}

const REVENGE_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '[설원의 설욕전 // 카단 결투 재도전]',
    buffBadge: '+20% 설원의 투지 각성 버프 활성화',
    subtitle: '알렉산다르의 가르침: 패배의 흙먼지를 털고 다시 검을 쥐다',
    startBtn: '[즉시 설욕전 결투 개시 // REVENGE DUEL]',
    simulatingTitle: '대륙 영웅 설욕전 시뮬레이션 중',
    combatLog: '서리 참격 집중 // 상대 약점 간파 중...',
    victoryTitle: '[설욕 성공: 명예로운 역전 대승!]',
    victoryDesc: '상대의 빈틈을 꿰뚫는 참격으로 전세를 뒤엎고 결투에서 승리했습니다.',
    bonusReward: '설욕전 보너스 +750 SNS & 설원 명예 훈장 지급',
    shareBtn: '[설욕전 전과 공유 (네이티브 SNS)]',
    copiedToast: '설욕전 결과가 클립보드에 복사되었습니다!',
    closeBtn: '[결투 완결]'
  },
  en: {
    modalTitle: '[FROST REVENGE DUEL // KADAN REMATCH]',
    buffBadge: '+20% FROST WILL AWAKENING BUFF ACTIVE',
    subtitle: 'Alexandar Teachings: Brush off the dust and grip the sword again.',
    startBtn: '[ENGAGE INSTANT REVENGE DUEL]',
    simulatingTitle: 'HERO REVENGE DUEL IN PROGRESS',
    combatLog: 'FOCUSING FROST SLASH // EXPLOITING OPENING...',
    victoryTitle: '[REVENGE SECURED: HONOR RECLAIMED!]',
    victoryDesc: 'Pierced the enemy defense and reversed the battlefield.',
    bonusReward: 'REVENGE BONUS +750 SNS & EXPEDITION MEDAL',
    shareBtn: '[SHARE REVENGE STATUS (NATIVE SNS)]',
    copiedToast: 'Revenge record copied to clipboard!',
    closeBtn: '[CONFIRM]'
  },
  ja: {
    modalTitle: '戦術リベンジオペレーション',
    buffBadge: '+20% 戦闘力オーバークロック適用',
    subtitle: '敗北データ解析完了: 弱点特効アルゴリズム発動',
    startBtn: '即時逆転リベンジマッチ開始',
    simulatingTitle: '60FPS 超高速リベンジシミュレーション中',
    combatLog: 'オーバークロックパルス稼働 // 弱点貫通攻撃中...',
    victoryTitle: '作戦成功: リベンジ逆転勝利を達成！',
    victoryDesc: '敵のカウンター戦術を無力化し、戦局を完全に覆しました。',
    bonusReward: 'リベンジボーナス +750 クレジット獲得',
    shareBtn: 'リベンジ戦果を共有',
    copiedToast: 'リベンジ結果がコピーされました！',
    closeBtn: '作戦完了'
  },
  'zh-CN': {
    modalTitle: '战术复仇超频行动',
    buffBadge: '+20% 战力超频增益激活',
    subtitle: '败局数据分析完毕: 弱点打击算法已装填',
    startBtn: '立即开启极限复仇决战',
    simulatingTitle: '60FPS 超高速复仇模拟对决中',
    combatLog: '超频脉冲释放中 // 致命弱点贯通打击...',
    victoryTitle: '作战大捷: 极限复仇逆转胜！',
    victoryDesc: '已彻底瓦解敌方克制战术并完全逆转战局。',
    bonusReward: '复仇奖励 +750 战术积分与徽章发放',
    shareBtn: '分享复仇战报 (原生社交矩阵)',
    copiedToast: '复仇结果已复制至剪贴板！',
    closeBtn: '完成行动'
  },
  'zh-TW': {
    modalTitle: '戰術復仇超頻行動',
    buffBadge: '+20% 戰力超頻增益啟用',
    subtitle: '敗局數據分析完畢: 弱點打擊演算法已就緒',
    startBtn: '立即開啟極限復仇決戰',
    simulatingTitle: '60FPS 超高速復仇模擬對決中',
    combatLog: '超頻脈衝釋放中 // 致命弱點貫穿打擊...',
    victoryTitle: '作戰大捷: 極限復仇逆轉勝！',
    victoryDesc: '已徹底瓦解敵方克制戰術並完全逆轉戰局。',
    bonusReward: '復仇獎勵 +750 戰術積分與徽章發放',
    shareBtn: '分享復仇戰報 (原生社交矩陣)',
    copiedToast: '復仇結果已複製至剪貼簿！',
    closeBtn: '完成行動'
  },
  de: {
    modalTitle: 'TAKTIK-REVANCHE ÜBERTAKTEST',
    buffBadge: '+20% KAMPFÜBERTAKTUNGS-BUFF AKTIV',
    subtitle: 'NIEDERLAGEN-ANALYSE ABGESCHLOSSEN: SCHWACHSTELLEN-ANGRIFF',
    startBtn: 'SOFORTIGE REVANCHE STARTEN',
    simulatingTitle: '60FPS ULTRA-SCHNELLE REVANCHE-SIMULATION',
    combatLog: 'ÜBERTAKTUNGS-IMPULS AKTIV // DURCHDRINGUNG...',
    victoryTitle: 'OPERATION ERFOLGREICH: REVANCHE-SIEG!',
    victoryDesc: 'Feindliche Taktik neutralisiert und die Front gewendet.',
    bonusReward: 'REVANCHE-BONUS +750 CREDITS & ABZEICHEN',
    shareBtn: 'REVANCHE-STATUS TEILEN',
    copiedToast: 'Revanche in die Zwischenablage kopiert!',
    closeBtn: 'MISSION BEENDEN'
  },
  es: {
    modalTitle: 'REVANCHA TÁCTICA SOBRERELOJ',
    buffBadge: '+20% BUFF DE SOBRERELOJ DE COMBATE ACTIVO',
    subtitle: 'ANÁLISIS DE DERROTA COMPLETADO: EXPLOTACIÓN DE DEBILIDADES',
    startBtn: 'INICIAR COMBATE DE REVANCHA INMEDIATA',
    simulatingTitle: 'SIMULACIÓN ULTRA RÁPIDA A 60 FPS',
    combatLog: 'PULSO DE SOBRERELOJ ACTIVADO // PERFORANDO...',
    victoryTitle: '¡OPERACIÓN EXITOSA: VICTORIA DE REVANCHA!',
    victoryDesc: 'Tácticas enemigas neutralizadas y control total del campo.',
    bonusReward: 'BONO DE REVANCHA +750 CRÉDITOS Y MEDALLA',
    shareBtn: 'COMPARTIR RESULTADO DE REVANCHA',
    copiedToast: '¡Dossier de revancha copiado al portapapeles!',
    closeBtn: 'MISIÓN COMPLETADA'
  },
  fr: {
    modalTitle: 'REVANCHE TACTIQUE SURCADENCÉE',
    buffBadge: '+20% BONUS DE COMBAT SURCADENCÉ ACTIF',
    subtitle: 'ANALYSE DE DÉFAITE TERMINÉE: ATTAQUE DE POINT FAIBLE',
    startBtn: 'ENGAGER LA REVANCHE IMMÉDIATE',
    simulatingTitle: 'SIMULATION ULTRA-RAPIDE À 60 FPS',
    combatLog: 'IMPULSION SURCADENCÉE EN COURS // PERCÉE...',
    victoryTitle: 'OPÉRATION RÉUSSIE: VICTOIRE DE LA REVANCHE !',
    victoryDesc: 'Tactiques ennemies neutralisées et champ de bataille inversé.',
    bonusReward: 'BONUS DE REVANCHE +750 CRÉDITS & INSIGNE',
    shareBtn: 'PARTAGER LE STATUT DE REVANCHE',
    copiedToast: 'Dossier de revanche copié !',
    closeBtn: 'MISSION TERMINÉE'
  },
  id: {
    modalTitle: 'OVERCLOCK BALAS DENDAM TAKTIS',
    buffBadge: '+20% BUFF OVERCLOCK TEMPUR AKTIF',
    subtitle: 'ANALISIS KEKALAHAN SELESAI: ALGORITMA TITIK LEMAH',
    startBtn: 'MULAI BALAS DENDAM INSTAN',
    simulatingTitle: 'SIMULASI ULTRA-CEPAT 60FPS BERJALAN',
    combatLog: 'PULSA OVERCLOCK AKTIF // MENEMBUS TARGET...',
    victoryTitle: 'OPERASI SUKSES: KEMENANGAN BALAS DENDAM!',
    victoryDesc: 'Taktik musuh berhasil dinetralkan dan pertempuran dibalikkan.',
    bonusReward: 'BONUS BALAS DENDAM +750 KREDIT & LENCANA',
    shareBtn: 'BAGIKAN STATUS BALAS DENDAM',
    copiedToast: 'Hasil balas dendam disalin!',
    closeBtn: 'MISI SELESAI'
  },
  ru: {
    modalTitle: 'ТАКТИЧЕСКИЙ РЕВАНШ С РАЗГОНОМ',
    buffBadge: '+20% БОЕВОЙ РАЗГОН АКТИВИРОВАН',
    subtitle: 'АНАЛИЗ ПОРАЖЕНИЯ ЗАВЕРШЕН: УДАР ПО УЯЗВИМОСТЯМ',
    startBtn: 'НАЧАТЬ МГНОВЕННЫЙ МАТЧ-РЕВАНШ',
    simulatingTitle: '60FPS УЛЬТРАСКОРОСТНАЯ СИМУЛЯЦИЯ РЕВАНША',
    combatLog: 'РАЗГОННЫЙ ИМПУЛЬС // ПРОБИТИЕ БРОНИ...',
    victoryTitle: 'ОПЕРАЦИЯ УСПЕШНА: ПОБЕДА В РЕВАНШЕ!',
    victoryDesc: 'Контртактика врага нейтрализована, ход битвы переломлен.',
    bonusReward: 'БОНУС РЕВАНША +750 КРЕДИТОВ И ЗНАЧОК',
    shareBtn: 'ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ РЕВАНША',
    copiedToast: 'Результат скопирован в буфер обмена!',
    closeBtn: 'ЗАВЕРШИТЬ'
  },
  th: {
    modalTitle: 'ปฏิบัติการแก้แค้นทางยุทธวิธีโอเวอร์คล็อก',
    buffBadge: '+20% บัฟโอเวอร์คล็อกพลังรบทำงาน',
    subtitle: 'ประมวลผลข้อมูลความพ่ายแพ้แล้ว: พร้อมเจาะจุดอ่อน',
    startBtn: 'เริ่มการแข่งขันแก้แค้นทันที',
    simulatingTitle: 'การจำลองแก้แค้นความเร็วสูง 60FPS',
    combatLog: 'พัลส์โอเวอร์คล็อกทำงาน // กำลังเจาะทะลวงเป้าหมาย...',
    victoryTitle: 'ปฏิบัติการสำเร็จ: คว้าชัยชนะในการแก้แค้น!',
    victoryDesc: 'ลบล้างยุทธวิธีการตอบโต้ของศัตรูและพลิกสถานการณ์ได้สำเร็จ',
    bonusReward: 'โบนัสแก้แค้น +750 เครดิตและตราสัญลักษณ์',
    shareBtn: 'แชร์สถานะการแก้แค้น',
    copiedToast: 'คัดลอกผลการแก้แค้นแล้ว!',
    closeBtn: 'เสร็จสิ้นภารกิจ'
  },
  vi: {
    modalTitle: 'CHIẾN DỊCH PHỤC HẬN ÉP XUNG CHIẾN THUẬT',
    buffBadge: '+20% HIỆU ỨNG ÉP XUNG CHIẾN ĐẤU HOẠT ĐỘNG',
    subtitle: 'ĐÃ PHÂN TÍCH THẤT BẠI: KHAI THÁC ĐIỂM YẾU',
    startBtn: 'BẮT ĐẦU TRẬN PHỤC HẬN LẬP TỨC',
    simulatingTitle: 'MÔ PHỎNG PHỤC HẬN SIÊU TỐC 60FPS',
    combatLog: 'XUNG ÉP XUNG ĐÃ KÍCH HOẠT // ĐANG XUYÊN PHÁ...',
    victoryTitle: 'CHIẾN DỊCH THÀNH CÔNG: CHIẾN THẮNG PHỤC HẬN!',
    victoryDesc: 'Đã vô hiệu hóa chiến thuật phản công của đối thủ và lật ngược tình thế.',
    bonusReward: 'THƯỞNG PHỤC HẬN +750 ĐIỂM TÍN DỤNG & HUY HIỆU',
    shareBtn: 'CHIA SẺ KẾT QUẢ PHỤC HẬN',
    copiedToast: 'Đã sao chép kết quả phục hận!',
    closeBtn: 'HOÀN THÀNH'
  }
};

export const InstantRevengeModal: React.FC<InstantRevengeModalProps> = ({
  isOpen,
  deckCode,
  challengerPayload,
  onClose,
  onRevengeVictory,
  language: propLang
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = REVENGE_I18N[currentLang] || REVENGE_I18N.ko;

  const [stage, setStage] = useState<'READY' | 'BATTLING' | 'VICTORY'>('READY');
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [combatTick, setCombatTick] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStage('READY');
      setPlayerHp(100);
      setEnemyHp(100);
      setCombatTick(0);
      setToastVisible(false);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }
  }, [isOpen]);

  // 60FPS Rapid Local Combat Simulation
  const handleStartRevenge = () => {
    setStage('BATTLING');
    triggerHaptic('battle_start');

    let currentEnemy = 100;
    let currentPlayer = 100;
    let tickCount = 0;
    const startTime = performance.now();
    const duration = 2500; // 2.5s rapid turnaround

    const updateFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Enemy takes devastating damage from +20% buffed attacks
      currentEnemy = Math.max(0, Math.floor(100 * (1 - progress * 1.05)));
      // Player sustains light damage but dominates
      currentPlayer = Math.max(45, Math.floor(100 - progress * 40));

      setEnemyHp(currentEnemy);
      setPlayerHp(currentPlayer);
      setCombatTick(tickCount++);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateFrame);
      } else {
        setEnemyHp(0);
        setPlayerHp(currentPlayer);
        setStage('VICTORY');
        triggerHaptic('victory');

        // Grant revenge rewards
        try {
          const currentCredits = parseInt(localStorage.getItem('hero_user_credits') || '0', 10);
          localStorage.setItem('hero_user_credits', (currentCredits + 750).toString());
          localStorage.setItem('hero_revenge_badge_unlocked', 'true');
        } catch {
          // ignore
        }

        if (onRevengeVictory) {
          onRevengeVictory();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(updateFrame);
  };

  const handleShare = async () => {
    triggerHaptic('tap');
    const revengePayload: ChallengePayload = {
      ...challengerPayload,
      commanderName: `${challengerPayload.commanderName} [REVENGE CONQUERED]`
    };
    await shareChallengeViaWebShare(revengePayload);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-lg bg-[#090d16]/95 border border-rose-500/30 rounded-xl p-5 sm:p-6 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-rose-400 uppercase">
              {tr.modalTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded border border-transparent hover:border-white/10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Buff Alert Banner */}
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-900/60 border border-rose-400/50 flex items-center justify-center text-rose-300 shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold text-rose-300">{tr.buffBadge}</div>
            <div className="text-[10px] text-gray-400">{tr.subtitle}</div>
          </div>
        </div>

        {/* READY STAGE */}
        {stage === 'READY' && (
          <div className="space-y-4 py-2">
            <div className="bg-black/60 border border-white/10 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>TARGET DECK CODE:</span>
                <span className="text-rose-400 font-bold">{deckCode}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>TARGET COMMANDER:</span>
                <span className="text-white">{challengerPayload.commanderName}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>OVERCLOCK PWR BUFF:</span>
                <span className="text-emerald-400 font-bold">{(challengerPayload.totalPwr * 1.2).toLocaleString()} (+20%)</span>
              </div>
            </div>

            <button
              onClick={handleStartRevenge}
              className="w-full min-h-[48px] bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                <line x1="13" y1="19" x2="19" y2="13" />
                <line x1="16" y1="16" x2="20" y2="20" />
                <line x1="19" y1="21" x2="21" y2="19" />
              </svg>
              {tr.startBtn}
            </button>
          </div>
        )}

        {/* BATTLING STAGE (60fps animation) */}
        {stage === 'BATTLING' && (
          <div className="space-y-4 py-3">
            <div className="flex justify-between text-xs text-rose-400">
              <span>{tr.simulatingTitle}</span>
              <span>TICK #{combatTick}</span>
            </div>

            {/* Health Bars */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-emerald-400 font-bold">MY OVERCLOCKED FORCE</span>
                <span className="text-white font-bold">{playerHp}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-emerald-500/30">
                <div className="h-full bg-emerald-400 transition-all duration-75" style={{ width: `${playerHp}%` }} />
              </div>

              <div className="flex justify-between text-[11px] pt-2">
                <span className="text-rose-400 font-bold">{challengerPayload.commanderName}</span>
                <span className="text-white font-bold">{enemyHp}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/80 rounded-full overflow-hidden border border-rose-500/30">
                <div className="h-full bg-rose-500 transition-all duration-75" style={{ width: `${enemyHp}%` }} />
              </div>
            </div>

            <div className="p-2.5 bg-black/60 border border-white/10 rounded text-center text-[10px] text-gray-300 animate-pulse">
              &gt; {tr.combatLog}
            </div>
          </div>
        )}

        {/* VICTORY STAGE */}
        {stage === 'VICTORY' && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/60 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-300">{tr.victoryTitle}</div>
                <div className="text-[10px] text-gray-400">{tr.victoryDesc}</div>
              </div>
            </div>

            <div className="p-3 bg-black/60 border border-white/10 rounded-lg text-xs space-y-1">
              <div className="text-gray-400">MISSION REWARDS:</div>
              <div className="text-emerald-400 font-bold">{tr.bonusReward}</div>
            </div>

            {toastVisible && (
              <div className="p-2 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-center text-[10px] rounded">
                {tr.copiedToast}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShare}
                className="min-h-[44px] bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                {tr.shareBtn}
              </button>
              <button
                onClick={onClose}
                className="min-h-[44px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold rounded-lg text-xs flex items-center justify-center transition-all active:scale-[0.98]"
              >
                {tr.closeBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstantRevengeModal;
export const InstantRevengeDuelModal = InstantRevengeModal;
