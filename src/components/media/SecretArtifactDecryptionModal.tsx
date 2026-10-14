import React, { useState, useEffect } from 'react';
import { Language, ViewType } from '../../types';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

interface SecretArtifactDecryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  articleId: string;
  sourceTitle?: string;
  language?: Language;
}

const I18N_TEXTS: Record<string, Record<string, string>> = {
  ko: {
    badge: '기밀 전술 아티팩트 감지됨',
    title: '고대 사이퍼 데이터 해독',
    subtitle: '미디어 전술 기록 열람 완료 보상',
    readyMsg: '완독한 기록 데이터에서 미지의 전술 파편이 감지되었습니다.',
    decryptBtn: '아티팩트 2초 고속 해독',
    decrypting: '암호화 블록 분석 및 사이퍼 해독 중...',
    successTitle: '해독 완료: 전술 소환 티켓 획득',
    rewardDesc: '해독된 코어 메모리가 소환 프로토콜 인가 키로 변환되었습니다.',
    rewardItem: '전술 소환 지령서 x1 획득',
    summonBtn: '소환 센터로 즉시 출격',
    closeBtn: '닫기'
  },
  en: {
    badge: 'CLASSIFIED ARTIFACT DETECTED',
    title: 'ANCIENT CIPHER DECRYPTION',
    subtitle: 'REWARD FOR FULL INTEL CONSUMPTION',
    readyMsg: 'Unknown tactical fragment intercepted from completed records.',
    decryptBtn: 'DECRYPT ARTIFACT (2s FAST SCAN)',
    decrypting: 'ANALYZING ENCRYPTED BLOCK & CIPHER KEY...',
    successTitle: 'DECRYPTION COMPLETE: SUMMON TICKET GRANTED',
    rewardDesc: 'Decrypted core memory converted into an authorized summon token.',
    rewardItem: 'TACTICAL REQUISITION TOKEN x1 ACQUIRED',
    summonBtn: 'DEPLOY TO SUMMON MATRIX',
    closeBtn: 'DISMISS'
  },
  ja: {
    badge: '機密戦術アーティファクト検知',
    title: '古代暗号データの解読',
    subtitle: 'メディア戦術記録閲覧完了リワード',
    readyMsg: '完読した記録データから未知の戦術フラグメントを検知しました。',
    decryptBtn: '2秒高速暗号解読',
    decrypting: '暗号化ブロック解析およびキー解読中...',
    successTitle: '解読完了: 戦術召喚チケット獲得',
    rewardDesc: '解読されたコアメモリが召喚プロトコル認可キーに変換されました。',
    rewardItem: '戦術召喚指令書 x1 獲得',
    summonBtn: '召喚センターへ即時出撃',
    closeBtn: '閉じる'
  },
  'zh-CN': {
    badge: '检测到机密战术神器',
    title: '古代密码数据破译',
    subtitle: '媒体战术记录全篇阅读完成奖励',
    readyMsg: '已从阅读完毕的记录数据中截获未知战术碎片。',
    decryptBtn: '2秒极速破译神器',
    decrypting: '正在分析加密区块与密码密钥...',
    successTitle: '破译完成: 获得战术召唤卷轴',
    rewardDesc: '已破译的核心内存成功转换为召唤协议授权密钥。',
    rewardItem: '获得战术征募许可卷轴 x1',
    summonBtn: '立即出击至召唤中心',
    closeBtn: '关闭'
  },
  'zh-TW': {
    badge: '檢測到機密戰術神器',
    title: '古代密碼數據解密',
    subtitle: '媒體戰術記錄全篇閱讀完成獎勵',
    readyMsg: '已從閱讀完畢的記錄數據中攔截未知戰術碎片。',
    decryptBtn: '2秒極速解密神器',
    decrypting: '正在分析加密區塊與密碼金鑰...',
    successTitle: '解密完成: 獲得戰術召喚卷軸',
    rewardDesc: '已解密的核心記憶體成功轉換為召喚協議授權金鑰。',
    rewardItem: '獲得戰術徵募許可卷軸 x1',
    summonBtn: '立即出擊至召喚中心',
    closeBtn: '關閉'
  },
  de: {
    badge: 'KLASSIFIZIERTES ARTEFAKT ENTDECKT',
    title: 'ENTSCHLÜSSELUNG ANTIKER CHIFFREN',
    subtitle: 'BELOHNUNG FÜR VOLLSTÄNDIGE ANALYSE',
    readyMsg: 'Unbekanntes taktisches Fragment in den Unterlagen abgefangen.',
    decryptBtn: 'ARTEFAKT ENTSCHLÜSSELN (2s)',
    decrypting: 'VERSCHLÜSSELTER BLOCK WIRD ANALYSIERT...',
    successTitle: 'ENTSCHLÜSSELUNG ERFOLGREICH: BESCHWÖRUNGS-TICKET',
    rewardDesc: 'Der Kernspeicher wurde in ein autorisiertes Token umgewandelt.',
    rewardItem: 'TAKTISCHES ANFORDERUNGS-TOKEN x1 ERHALTEN',
    summonBtn: 'ZUR BESCHWÖRUNGS-MATRIX',
    closeBtn: 'SCHLIESSEN'
  },
  es: {
    badge: 'ARTEFACTO CLASIFICADO DETECTADO',
    title: 'DESCIFRADO DE CIFRA ANTIGUA',
    subtitle: 'RECOMPENSA POR LECTURA COMPLETA',
    readyMsg: 'Fragmento táctico desconocido interceptado en los registros.',
    decryptBtn: 'DESCIFRAR ARTEFACTO (2s)',
    decrypting: 'ANALIZANDO BLOQUE CIFRADO Y CLAVE...',
    successTitle: 'DESCIFRADO COMPLETO: TICKET DE INVOCACIÓN',
    rewardDesc: 'Memoria central convertida en pase de invocación autorizado.',
    rewardItem: 'TOKEN DE INVOCACIÓN TÁCTICA x1 ADQUIRIDO',
    summonBtn: 'DESPLEGAR A MATRIZ DE INVOCACIÓN',
    closeBtn: 'CERRAR'
  },
  fr: {
    badge: 'ARTEFACT CLASSIFIÉ DÉTECTÉ',
    title: 'DÉCRYPTAGE DU CODE ANCIEN',
    subtitle: 'RÉCOMPENSE POUR LECTURE INTÉGRALE',
    readyMsg: 'Fragment tactique inconnu intercepté dans les archives complétées.',
    decryptBtn: 'DÉCRYPTER L ARTEFACT (2s)',
    decrypting: 'ANALYSE DU BLOC CHIFFRÉ ET DE LA CLÉ...',
    successTitle: 'DÉCRYPTAGE RÉUSSI: BILLET D INVOCATION',
    rewardDesc: 'Mémoire centrale convertie en jeton d invocation officiel.',
    rewardItem: 'JETON DE RÉQUISITION TACTIQUE x1 REÇU',
    summonBtn: 'DÉPLOYER VERS LA MATRICE D INVOCATION',
    closeBtn: 'FERMER'
  },
  id: {
    badge: 'ARTEFAK RAHASIA TERDETEKSI',
    title: 'DEKRIPSI CIPHER KUNO',
    subtitle: 'HADIAH SELESAI MEMBACA LAPORAN TAKTIS',
    readyMsg: 'Fragmen taktis tak dikenal terdeteksi dari data rekaman.',
    decryptBtn: 'DEKRIPSI ARTEFAK (2 DETIK CEPAT)',
    decrypting: 'MENGANALISIS BLOK TERENKRIPSI & KUNCI CIPHER...',
    successTitle: 'DEKRIPSI SELESAI: TIKET PEMANGGILAN DIPEROLEH',
    rewardDesc: 'Memori inti yang didekripsi diubah menjadi kunci otorisasi pemanggilan.',
    rewardItem: 'TOKEN REKUISISI TAKTIS x1 DIPEROLEH',
    summonBtn: 'LUNCURKAN KE PUSAT PEMANGGILAN',
    closeBtn: 'TUTUP'
  },
  ru: {
    badge: 'ОБНАРУЖЕН СЕКРЕТНЫЙ АРТЕФАКТ',
    title: 'РАСШИФРОВКА ДРЕВНЕГО ШИФРА',
    subtitle: 'НАГРАДА ЗА ПОЛНОЕ ОЗНАКОМЛЕНИЕ С ДАННЫМИ',
    readyMsg: 'Неизвестный тактический фрагмент перехвачен из завершенных записей.',
    decryptBtn: 'РАСШИФРОВАТЬ АРТЕФАКТ (2 СЕК)',
    decrypting: 'АНАЛИЗ ЗАШИФРОВАННОГО БЛОКА И КЛЮЧА...',
    successTitle: 'РАСШИФРОВКА ЗАВЕРШЕНА: БИЛЕТ ПРИЗЫВА',
    rewardDesc: 'Память ядра преобразована в ключ авторизации призыва.',
    rewardItem: 'ТАКТИЧЕСКИЙ ЖЕТОН ПРИЗЫВА x1 ПОЛУЧЕН',
    summonBtn: 'ВЫЙТИ К МАТРИЦЕ ПРИЗЫВА',
    closeBtn: 'ЗАКРЫТЬ'
  },
  th: {
    badge: 'ตรวจพบอาร์ติแฟกต์ลับทางยุทธวิธี',
    title: 'ถอดรหัสไซเฟอร์โบราณ',
    subtitle: 'รางวัลสำหรับการอ่านบันทึกยุทธวิธีครบถ้วน',
    readyMsg: 'ตรวจพบชิ้นส่วนยุทธวิธีที่ไม่รู้จักจากข้อมูลบันทึกที่อ่านจบแล้ว',
    decryptBtn: 'ถอดรหัสอาร์ติแฟกต์ (สแกนเร็ว 2 วินาที)',
    decrypting: 'กำลังวิเคราะห์บล็อกที่เข้ารหัสและกุญแจไซเฟอร์...',
    successTitle: 'ถอดรหัสสำเร็จ: ได้รับตั๋วอัญเชิญยุทธวิธี',
    rewardDesc: 'หน่วยความจำหลักที่ถอดรหัสแล้วถูกแปลงเป็นกุญแจอัญเชิญอย่างเป็นทางการ',
    rewardItem: 'ได้รับโทเค็นการเกณฑ์ยุทธวิธี x1',
    summonBtn: 'เคลื่อนพลไปยังศูนย์อัญเชิญ',
    closeBtn: 'ปิด'
  },
  vi: {
    badge: 'PHÁT HIỆN DI VẬT CHIẾN THUẬT BẢO MẬT',
    title: 'GIẢI MÃ MẬT MÃ CỔ ĐẠI',
    subtitle: 'PHẦN THƯỞNG ĐỌC XONG HỒ SƠ CHIẾN THUẬT',
    readyMsg: 'Mảnh chiến thuật bí ẩn được thu thập từ dữ liệu hồ sơ đã hoàn thành.',
    decryptBtn: 'GIẢI MÃ DI VẬT (2 GIÂY CỰC NHANH)',
    decrypting: 'ĐANG PHÂN TÍCH KHỐI MÃ HÓA VÀ KHÓA MẬT MÃ...',
    successTitle: 'GIẢI MÃ HOÀN TẤT: NHẬN VÉ TRIỆU HỒI',
    rewardDesc: 'Bộ nhớ lõi được giải mã chuyển hóa thành khóa cấp phép triệu hồi.',
    rewardItem: 'NHẬN THẺ TRIỆU TẬP CHIẾN THUẬT x1',
    summonBtn: 'TIẾN VÀO MA TRẬN TRIỆU HỒI',
    closeBtn: 'ĐÓNG'
  }
};

export const SecretArtifactDecryptionModal: React.FC<SecretArtifactDecryptionModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  articleId,
  sourceTitle,
  language: propLang
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = I18N_TEXTS[currentLang] || I18N_TEXTS.ko;

  const [phase, setPhase] = useState<'READY' | 'DECRYPTING' | 'SOLVED'>('READY');
  const [progress, setProgress] = useState(0);
  const [hexSnippet, setHexSnippet] = useState('0x4F...7E');

  useEffect(() => {
    if (isOpen) {
      setPhase('READY');
      setProgress(0);
    }
  }, [isOpen]);

  const handleStartDecryption = () => {
    setPhase('DECRYPTING');
    triggerHaptic('medium');

    const hexPool = ['0x8F9A', '0xC3B4', '0xE1D0', '0x7A2F', '0x00FF', '0x1B4C', '0xD991'];
    let cur = 0;
    const interval = setInterval(() => {
      cur += 5;
      setProgress(Math.min(100, cur));
      setHexSnippet(hexPool[Math.floor(Math.random() * hexPool.length)] + '::' + hexPool[Math.floor(Math.random() * hexPool.length)]);

      if (cur >= 100) {
        clearInterval(interval);
        setPhase('SOLVED');
        triggerHaptic('success');

        // Save decryption record to sessionStorage and localStorage reward
        try {
          sessionStorage.setItem('snshero_artifact_decrypted_' + articleId, 'true');
          const curTickets = parseInt(localStorage.getItem('hero_summon_tickets') || '0', 10);
          localStorage.setItem('hero_summon_tickets', (curTickets + 1).toString());
        } catch {
          // ignore
        }
      }
    }, 100); // 20 steps * 100ms = 2000ms (2 seconds)
  };

  const handleGoToSummon = () => {
    triggerHaptic('tap');
    onClose();
    onNavigate('shop');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-md bg-[#090d16]/95 border border-cyan-500/30 rounded-xl p-5 text-cyan-400 shadow-2xl flex flex-col gap-4">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-[10px] tracking-widest text-cyan-300 uppercase font-bold">
              {tr.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Source context if provided */}
        {sourceTitle && (
          <div className="text-[10px] text-gray-400 truncate bg-white/5 px-2.5 py-1 rounded border border-white/5">
            SRC: {sourceTitle}
          </div>
        )}

        {/* Main Content Area */}
        {phase === 'READY' && (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">{tr.title}</h3>
                <p className="text-[10px] text-cyan-400/80">{tr.subtitle}</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-3 rounded border border-white/10">
              {tr.readyMsg}
            </p>
            <button
              onClick={handleStartDecryption}
              className="mt-2 w-full min-h-[44px] bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              {tr.decryptBtn}
            </button>
          </div>
        )}

        {phase === 'DECRYPTING' && (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-cyan-300">{tr.decrypting}</span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-cyan-500/40 p-0.5">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[11px] font-mono text-cyan-500/80 bg-black/50 p-2.5 rounded border border-cyan-500/20 text-center tracking-widest">
              CIPHER::RAW &gt; {hexSnippet}
            </div>
          </div>
        )}

        {phase === 'SOLVED' && (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300 tracking-wide">{tr.successTitle}</h3>
                <p className="text-[10px] text-gray-400">{tr.rewardDesc}</p>
              </div>
            </div>

            <div className="p-3 bg-cyan-950/30 border border-cyan-500/40 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="6" y1="8" x2="10" y2="8" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="16" x2="14" y2="16" />
                </svg>
                <span className="text-xs font-bold text-white">{tr.rewardItem}</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-500/30">
                GRANTED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={onClose}
                className="min-h-[44px] bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 rounded-lg text-xs font-bold transition-colors"
              >
                {tr.closeBtn}
              </button>
              <button
                onClick={handleGoToSummon}
                className="min-h-[44px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {tr.summonBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
