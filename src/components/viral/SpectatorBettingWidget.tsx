import React, { useState, useEffect, useRef } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface SpectatorBettingWidgetProps {
  deckCode: string;
  isOpen: boolean;
  onClose: () => void;
  onDeckClone?: (deckCode: string) => void;
  language?: string;
}

const SPECTATOR_I18N: Record<string, Record<string, string>> = {
  ko: {
    header: '전술 챌린지 실시간 관전 & 승부 예측',
    badge: '결정론적 AI 자율 교전 시뮬레이션',
    voteBlue: '블루팀 승리 예측 (1.85x)',
    voteRed: '레드팀 승리 예측 (2.10x)',
    voted: '예측 완료: 승부 판정 대기 중...',
    blueLabel: '블루 사령부',
    redLabel: '레드 도전자',
    simulating: '60FPS 자율 교전 관전 중',
    correctTitle: '승부 예측 적중: 200 크레딧 & 덱 복제권 획득!',
    wrongTitle: '예측 실패: 작전 분석 완료',
    correctDesc: '승리 팀의 전술 구조를 완벽히 예측하여 보급품이 지급되었습니다.',
    cloneDeckBtn: '승리 덱 1클릭 복제',
    closeBtn: '관전 종료'
  },
  en: {
    header: 'TACTICAL SPECTATOR BETTING MATRIX',
    badge: 'DETERMINISTIC AI COMBAT SIMULATION',
    voteBlue: 'VOTE BLUE COMMAND (1.85x)',
    voteRed: 'VOTE RED CHALLENGER (2.10x)',
    voted: 'VOTE LOCKED: AWAITING COMBAT RESOLUTION...',
    blueLabel: 'BLUE COMMAND',
    redLabel: 'RED CHALLENGER',
    simulating: '60FPS AUTONOMOUS COMBAT IN PROGRESS',
    correctTitle: 'PREDICTION VERIFIED: 200 CREDITS & DECK CLONE TOKEN!',
    wrongTitle: 'PREDICTION FAILED: TACTICAL AUDIT LOGGED',
    correctDesc: 'Accurately predicted the winning force. Supplies transferred.',
    cloneDeckBtn: 'CLONE WINNING DECK (1-CLICK)',
    closeBtn: 'LEAVE SPECTATOR'
  },
  ja: {
    header: '戦術観戦＆勝敗予想マトリクス',
    badge: '決定論的AI自律戦闘シミュレーション',
    voteBlue: 'ブルー勝利予想 (1.85x)',
    voteRed: 'レッド勝利予想 (2.10x)',
    voted: '予想確定: 勝敗判定待ち...',
    blueLabel: 'ブルー司令部',
    redLabel: 'レッド挑戦者',
    simulating: '60FPS 自律戦闘を観戦中',
    correctTitle: '予想的中: 200クレジット＆デッキ複製権獲得！',
    wrongTitle: '予想外れ: 戦術解析完了',
    correctDesc: '勝利チームの戦術を正確に予測しました。',
    cloneDeckBtn: '勝利デッキを1クリック複製',
    closeBtn: '観戦終了'
  },
  'zh-CN': {
    header: '战术观战对决与胜负竞猜',
    badge: '确定性AI自主推演战斗模拟',
    voteBlue: '竞猜蓝方获胜 (1.85x)',
    voteRed: '竞猜红方获胜 (2.10x)',
    voted: '竞猜已锁定: 等待交战判决...',
    blueLabel: '蓝方主力',
    redLabel: '红方挑战者',
    simulating: '60FPS 自主交战实时观战中',
    correctTitle: '竞猜成功: 获得 200 积分与卡组克隆权！',
    wrongTitle: '竞猜失准: 战报已记录',
    correctDesc: '精准预判战场胜局，战备物资已发放。',
    cloneDeckBtn: '一键克隆优胜卡组',
    closeBtn: '退出观战'
  },
  'zh-TW': {
    header: '戰術觀戰對決與勝負競猜',
    badge: '確定性AI自主推演戰鬥模擬',
    voteBlue: '競猜藍方獲勝 (1.85x)',
    voteRed: '競猜紅方獲勝 (2.10x)',
    voted: '競猜已鎖定: 等待交戰判決...',
    blueLabel: '藍方主力',
    redLabel: '紅方挑戰者',
    simulating: '60FPS 自主交戰即時觀戰中',
    correctTitle: '競猜成功: 獲得 200 積分與牌組克隆權！',
    wrongTitle: '競猜失準: 戰報已記錄',
    correctDesc: '精準預判戰場勝局，戰備物資已發放。',
    cloneDeckBtn: '一鍵克隆優勝牌組',
    closeBtn: '退出觀戰'
  },
  de: {
    header: 'ZUSCHAUER-WETT-MATRIX',
    badge: 'DETERMINISTISCHE AI-KAMPFSIMULATION',
    voteBlue: 'TEAM BLAU WÄHLEN (1.85x)',
    voteRed: 'TEAM ROT WÄHLEN (2.10x)',
    voted: 'WETTE EINGEREICHT: KAMPF LÄUFT...',
    blueLabel: 'KOMMANDO BLAU',
    redLabel: 'HERAUSFORDERER ROT',
    simulating: '60FPS AUTONOMER KAMPF',
    correctTitle: 'TREFFER: 200 CREDITS & DECK-KLON TOKEN!',
    wrongTitle: 'NICHT GETROFFEN: ANALYSE ERFOLGT',
    correctDesc: 'Siegerteam korrekt vorhergesagt.',
    cloneDeckBtn: 'SIEGER-DECK KLONEN',
    closeBtn: 'VERLASSEN'
  },
  es: {
    header: 'MATRIZ DE APUESTAS DE ESPECTADOR',
    badge: 'SIMULACIÓN DE COMBATE DETERMINISTA IA',
    voteBlue: 'VOTAR AZUL (1.85x)',
    voteRed: 'VOTAR ROJO (2.10x)',
    voted: 'VOTO BLOQUEADO: ESPERANDO RESULTADO...',
    blueLabel: 'MANDO AZUL',
    redLabel: 'RETADOR ROJO',
    simulating: 'COMBATE AUTÓNOMO A 60 FPS',
    correctTitle: '¡PREDICCIÓN CORRECTA: 200 CRÉDITOS Y CLON!',
    wrongTitle: 'PREDICCIÓN FALLIDA',
    correctDesc: 'Pronóstico acertado. Suministros transferidos.',
    cloneDeckBtn: 'CLONAR MAZO GANADOR (1 CLIC)',
    closeBtn: 'SALIR'
  },
  fr: {
    header: 'MATRICE DE PARI SPECTATEUR',
    badge: 'SIMULATION DETERMINISTE PAR IA',
    voteBlue: 'PARIER BLEU (1.85x)',
    voteRed: 'PARIER ROUGE (2.10x)',
    voted: 'VOTE VERROUILLÉ: RÉSULTAT EN COURS...',
    blueLabel: 'COMMANDEMENT BLEU',
    redLabel: 'DÉFIEUR ROUGE',
    simulating: 'COMBAT AUTONOME EN 60 FPS',
    correctTitle: 'PRÉDICTION RÉUSSIE: 200 CRÉDITS & CLONAGE !',
    wrongTitle: 'PRÉDICTION MANQUÉE',
    correctDesc: 'Victoire correctement anticipée.',
    cloneDeckBtn: 'CLONER LE DECK GAGNANT',
    closeBtn: 'QUITTER'
  },
  id: {
    header: 'MATRIKS TARUHAN PENONTON TAKTIS',
    badge: 'SIMULASI TEMPUR AI DETERMINISTIK',
    voteBlue: 'PILIH BIRU (1.85x)',
    voteRed: 'PILIH MERAH (2.10x)',
    voted: 'TARUHAN TERKUNCI: MENUNGGU HASIL...',
    blueLabel: 'KOMANDO BIRU',
    redLabel: 'PENANTANG MERAH',
    simulating: 'COMBAT 60FPS BERJALAN',
    correctTitle: 'PREDIKSI TEPAT: 200 KREDIT & TOKEN KLON DEK!',
    wrongTitle: 'PREDIKSI SALAH',
    correctDesc: 'Berhasil memprediksi tim pemenang.',
    cloneDeckBtn: 'KLON DEK PEMENANG',
    closeBtn: 'KELUAR'
  },
  ru: {
    header: 'МАТРИЦА СТАВОК НАБЛЮДАТЕЛЯ',
    badge: 'ДЕТЕРМИНИРОВАННЫЙ БОЙ ИИ',
    voteBlue: 'СТАВКА НА СИНИХ (1.85x)',
    voteRed: 'СТАВКА НА КРАСНЫХ (2.10x)',
    voted: 'СТАВКА ПРИНЯТА: ИДЕТ СРАЖЕНИЕ...',
    blueLabel: 'СИНИЕ',
    redLabel: 'КРАСНЫЕ',
    simulating: '60FPS СИМУЛЯЦИЯ БОЯ',
    correctTitle: 'УСПЕХ: 200 КРЕДИТОВ И ТОКЕН КОПИРОВАНИЯ!',
    wrongTitle: 'СТАВКА НЕ СЫГРАЛА',
    correctDesc: 'Победитель предсказан верно.',
    cloneDeckBtn: 'КЛОНИРОВАТЬ КОЛОДУ В 1 КЛИК',
    closeBtn: 'ВЫЙТИ'
  },
  th: {
    header: 'เมทริกซ์การเดิมพันของผู้ชมทางยุทธวิธี',
    badge: 'การจำลองการต่อสู้ AI แบบกำหนดแน่นอน',
    voteBlue: 'โหวตฝ่ายน้ำเงิน (1.85x)',
    voteRed: 'โหวตฝ่ายแดง (2.10x)',
    voted: 'ล็อกผลโหวตแล้ว: กำลังรอการตัดสิน...',
    blueLabel: 'บัญชาการน้ำเงิน',
    redLabel: 'ผู้ท้าชิงแดง',
    simulating: 'กำลังจำลองการต่อสู้ 60FPS',
    correctTitle: 'ทายถูก: รับ 200 เครดิตและโทเค็นโคลนเด็ค!',
    wrongTitle: 'ทายผิดพลาด',
    correctDesc: 'ทำนายทีมผู้ชนะได้อย่างถูกต้อง',
    cloneDeckBtn: 'โคลนเด็คผู้ชนะ (1 คลิก)',
    closeBtn: 'ออกจากการชม'
  },
  vi: {
    header: 'MA TRẬN DỰ ĐOÁN KHÁN GIẢ CHIẾN THUẬT',
    badge: 'MÔ PHỎNG ĐỐI ĐẦU AI TỰ ĐỘNG XÁC ĐỊNH',
    voteBlue: 'CHỌN ĐỘI XANH (1.85x)',
    voteRed: 'CHỌN ĐỘI ĐỎ (2.10x)',
    voted: 'ĐÃ KHÓA DỰ ĐOÁN: CHỜ KẾT QUẢ...',
    blueLabel: 'BỘ CHỈ HUY XANH',
    redLabel: 'KẺ THÁCH THỨC ĐỎ',
    simulating: 'MÔ PHỎNG CHIẾN ĐẤU 60FPS',
    correctTitle: 'ĐOÁN ĐÚNG: NHẬN 200 TÍN DỤNG & VÉ SAO CHÉP BỘ BÀI!',
    wrongTitle: 'ĐOÁN SAI: ĐÃ GHI NHẬN HỒ SƠ',
    correctDesc: 'Đoán chính xác phe chiến thắng.',
    cloneDeckBtn: 'SAO CHÉP BỘ BÀI THẮNG (1 CHẠM)',
    closeBtn: 'THOÁT QUAN SÁT'
  }
};

export const SpectatorBettingWidget: React.FC<SpectatorBettingWidgetProps> = ({
  deckCode,
  isOpen,
  onClose,
  onDeckClone,
  language: propLang
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = SPECTATOR_I18N[currentLang] || SPECTATOR_I18N.ko;

  const [vote, setVote] = useState<'BLUE' | 'RED' | null>(null);
  const [stage, setStage] = useState<'BETTING' | 'SIMULATING' | 'RESULT'>('BETTING');
  const [blueHp, setBlueHp] = useState(100);
  const [redHp, setRedHp] = useState(100);
  const [winner, setWinner] = useState<'BLUE' | 'RED'>('BLUE');

  const animRef = useRef<number | null>(null);

  // Deterministic Winner based on deckCode hash
  useEffect(() => {
    if (isOpen) {
      setVote(null);
      setStage('BETTING');
      setBlueHp(100);
      setRedHp(100);

      let hash = 0;
      const code = deckCode || 'SPECTATE_SEED_01';
      for (let i = 0; i < code.length; i++) {
        hash = ((hash << 5) - hash) + code.charCodeAt(i);
        hash |= 0;
      }
      setWinner(Math.abs(hash) % 2 === 0 ? 'BLUE' : 'RED');
    } else {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    }
  }, [isOpen, deckCode]);

  const handleVote = (choice: 'BLUE' | 'RED') => {
    triggerHaptic('tap');
    setVote(choice);
    setStage('SIMULATING');

    const startTime = performance.now();
    const duration = 2800; // 2.8s 60fps autonomous duel

    const loop = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);

      if (winner === 'BLUE') {
        setRedHp(Math.max(0, Math.floor(100 * (1 - p * 1.05))));
        setBlueHp(Math.max(35, Math.floor(100 - p * 50)));
      } else {
        setBlueHp(Math.max(0, Math.floor(100 * (1 - p * 1.05))));
        setRedHp(Math.max(35, Math.floor(100 - p * 50)));
      }

      if (p < 1) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setStage('RESULT');
        triggerHaptic(choice === winner ? 'victory' : 'defeat');

        if (choice === winner) {
          try {
            const curCredits = parseInt(localStorage.getItem('hero_user_credits') || '0', 10);
            localStorage.setItem('hero_user_credits', (curCredits + 200).toString());
            const curTokens = parseInt(localStorage.getItem('hero_deck_cloner_tokens') || '0', 10);
            localStorage.setItem('hero_deck_cloner_tokens', (curTokens + 1).toString());
          } catch {}
        }
      }
    };

    animRef.current = requestAnimationFrame(loop);
  };

  const handleClone = () => {
    triggerHaptic('tap');
    if (onDeckClone) {
      onDeckClone(deckCode);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isWon = vote === winner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-lg bg-[#090d16]/95 border border-white/15 rounded-xl p-5 sm:p-6 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
              {tr.header}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Odds Ratio Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span className="text-cyan-400 font-bold">{tr.blueLabel} (58%)</span>
            <span className="text-rose-400 font-bold">{tr.redLabel} (42%)</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex border border-white/15">
            <div className="h-full bg-cyan-500 w-[58%]" />
            <div className="h-full bg-rose-500 w-[42%]" />
          </div>
        </div>

        {/* STAGE 1: BETTING SELECTION */}
        {stage === 'BETTING' && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-300">
              {tr.badge} // DECK: {deckCode}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleVote('BLUE')}
                className="min-h-[48px] p-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 rounded-lg text-xs font-bold transition-all active:scale-95"
              >
                {tr.voteBlue}
              </button>
              <button
                onClick={() => handleVote('RED')}
                className="min-h-[48px] p-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-300 rounded-lg text-xs font-bold transition-all active:scale-95"
              >
                {tr.voteRed}
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: SIMULATING 60FPS DUEL */}
        {stage === 'SIMULATING' && (
          <div className="space-y-3 py-3">
            <div className="text-xs text-center text-cyan-300 font-bold animate-pulse">
              {tr.simulating}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-400 font-bold">{tr.blueLabel}</span>
                <span className="text-white font-mono">{blueHp}%</span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-cyan-500/30">
                <div className="h-full bg-cyan-400 transition-all duration-75" style={{ width: `${blueHp}%` }} />
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className="text-rose-400 font-bold">{tr.redLabel}</span>
                <span className="text-white font-mono">{redHp}%</span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-rose-500/30">
                <div className="h-full bg-rose-500 transition-all duration-75" style={{ width: `${redHp}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: RESULT & REWARD */}
        {stage === 'RESULT' && (
          <div className="space-y-3 py-2">
            <div className={`p-3.5 rounded-lg border ${
              isWon ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-black/60 border-white/10 text-gray-400'
            }`}>
              <div className="text-xs font-bold">
                {isWon ? tr.correctTitle : tr.wrongTitle}
              </div>
              <div className="text-[10px] mt-1 text-gray-300">
                {isWon ? tr.correctDesc : `WINNER: ${winner === 'BLUE' ? tr.blueLabel : tr.redLabel}`}
              </div>
            </div>

            {isWon && (
              <button
                onClick={handleClone}
                className="w-full min-h-[44px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {tr.cloneDeckBtn}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full min-h-[40px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-xs transition-colors"
            >
              {tr.closeBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectatorBettingWidget;
