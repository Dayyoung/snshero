import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Watch, Check, Sparkles, Smartphone, Eye, Layers, ChevronDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DatabaseCard, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { getFormattedCardName, getCardSpriteStyle, isSpriteSheet } from '../lib/utils';
import { resolveCardImage } from '../content/cardImageVariants';
import { useGameSettings } from '../contexts/GameSettingsContext';

interface WatchFaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCard?: DatabaseCard | null;
  language: Language;
}

export const WatchFaceModal: React.FC<WatchFaceModalProps> = ({
  isOpen,
  onClose,
  initialCard,
  language,
}) => {
  const { cardSkinTheme } = useGameSettings();
  const allCards = useMemo(() => Object.values(CARD_DATABASE), []);

  const [selectedCardId, setSelectedCardId] = useState<number>(() => {
    return initialCard?.id ?? allCards[0]?.id ?? 1;
  });

  useEffect(() => {
    if (initialCard?.id) {
      setSelectedCardId(initialCard.id);
    }
  }, [initialCard]);

  const currentCard = useMemo(() => {
    return CARD_DATABASE[selectedCardId] || allCards[0];
  }, [selectedCardId, allCards]);

  // 옵션 상태
  const [bezelType, setBezelType] = useState<'flat' | 'apple' | 'galaxy'>('apple');
  const [includeClock, setIncludeClock] = useState<boolean>(false);
  const [bgStyle, setBgStyle] = useState<'element' | 'dark' | 'cyber' | 'minimal' | 'gold'>('element');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const exportCanvasRef = useRef<HTMLDivElement>(null);

  // 실시간 시계 표시용 (10:09 기준 프리셋 또는 현재 시간)
  const [currentTime, setCurrentTime] = useState<string>('10:09');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
      
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const month = monthNames[now.getMonth()];
      const day = now.getDate();
      const dayName = dayNames[now.getDay()];
      setCurrentDate(`${dayName} ${month} ${day}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const resolvedImg = useMemo(() => {
    if (!currentCard) return { source: '' };
    return resolveCardImage(currentCard.id, { imageUrl: currentCard.imageUrl, cardSkinTheme });
  }, [currentCard, cardSkinTheme]);

  // 속성별 배경 그라데이션
  const getElementGradient = (element?: string) => {
    switch (element?.toLowerCase()) {
      case 'fire':
        return 'from-rose-950 via-red-900 to-orange-950';
      case 'water':
        return 'from-cyan-950 via-blue-900 to-indigo-950';
      case 'wind':
        return 'from-emerald-950 via-teal-900 to-cyan-950';
      case 'earth':
        return 'from-amber-950 via-yellow-900 to-stone-950';
      case 'holy':
        return 'from-purple-950 via-amber-900 to-indigo-950';
      case 'dark':
        return 'from-slate-950 via-purple-950 to-neutral-950';
      default:
        return 'from-slate-900 via-indigo-950 to-slate-950';
    }
  };

  const currentGradient = useMemo(() => {
    switch (bgStyle) {
      case 'dark':
        return 'from-black via-zinc-900 to-black';
      case 'cyber':
        return 'from-indigo-950 via-fuchsia-950 to-cyan-950';
      case 'minimal':
        return 'from-stone-900 via-neutral-900 to-stone-950';
      case 'gold':
        return 'from-amber-950 via-yellow-900 to-amber-950';
      case 'element':
      default:
        return getElementGradient(currentCard?.element);
    }
  }, [bgStyle, currentCard?.element]);

  // 이미지 다운로드 핸들러
  const handleDownloadImage = async () => {
    if (!exportCanvasRef.current || isExporting) return;

    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 80));

      const dataUrl = await toPng(exportCanvasRef.current, {
        cacheBust: true,
        pixelRatio: 3, // 3배수 고해상도 렌더링 (약 1080x1080 ~ 1200x1200)
        backgroundColor: '#09090b',
      });

      const cardName = currentCard ? getFormattedCardName(currentCard, language) : 'watchface';
      const cleanName = cardName.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
      const filename = `SNSHero_WatchFace_${cleanName}_1x1.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to export watch face image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden font-mono flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Watch size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{language === 'ko' ? '와치페이스 생성기' : 'Watch Face Generator'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    1:1 Square
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {language === 'ko' ? '스마트워치 배경화면 전용 1:1 고화질 이미지' : '1:1 HD wallpaper for smartwatch watch faces'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* 안내 배너 */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-zinc-900 border border-indigo-500/30 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <Sparkles size={14} className="text-indigo-400 shrink-0" />
                  <span>
                    {language === 'ko'
                      ? '⌚ 스마트워치(애플워치·갤럭시워치 등)의 와치페이스 배경으로 사용이 가능합니다.'
                      : '⌚ Usable as watch face background for Apple Watch, Galaxy Watch & Wear OS.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-200 underline shrink-0 cursor-pointer flex items-center gap-0.5"
                >
                  <span>{language === 'ko' ? (showGuide ? '가이드 접기' : '설정 방법') : (showGuide ? 'Hide Guide' : 'How to Set')}</span>
                  <ChevronDown size={12} className={`transform transition-transform ${showGuide ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* 접이식 가이드 */}
              {showGuide && (
                <div className="pt-2 border-t border-indigo-500/20 text-[11px] text-zinc-300 space-y-2">
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="font-bold text-white">🍎 Apple Watch (애플워치):</span>
                    <ol className="list-decimal list-inside text-zinc-400 mt-1 space-y-0.5">
                      <li>이미지를 다운로드하여 아이폰 사진 보관함에 저장</li>
                      <li>사진 앱에서 이미지 선택 후 <strong>공유(⬆) &gt; 시계 페이스 생성</strong> 탭</li>
                      <li>'사진 시계 페이스' 선택 후 워치에 추가</li>
                    </ol>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="font-bold text-white">🪐 Galaxy Watch (갤럭시워치):</span>
                    <ol className="list-decimal list-inside text-zinc-400 mt-1 space-y-0.5">
                      <li>이미지를 스마트폰 갤러리에 저장</li>
                      <li><strong>Galaxy Wearable</strong> 앱 실행 &gt; <strong>시계 화면</strong> 선택</li>
                      <li>'베이직' 카테고리의 <strong>마이 포토+</strong> 또는 <strong>사진</strong> 선택 후 이미지 지정</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* 카드 선택 셀렉터 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <label className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
                <Layers size={14} className="text-zinc-400" />
                <span>{language === 'ko' ? '대상 히어로 카드 선택' : 'Select Hero Card'}</span>
              </label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(Number(e.target.value))}
                className="bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {allCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    #{card.id} {getFormattedCardName(card, language)} ({card.element?.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* 메인 와치 프리뷰 뷰포트 (1:1 정사각형 캔버스) */}
            <div className="flex flex-col items-center justify-center p-3 sm:p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800/80">
              <div
                className={`relative transition-all duration-300 flex items-center justify-center shadow-2xl ${
                  bezelType === 'galaxy'
                    ? 'rounded-full border-4 border-zinc-700 p-2 bg-zinc-950'
                    : bezelType === 'apple'
                    ? 'rounded-[40px] border-4 border-zinc-700 p-2.5 bg-zinc-950'
                    : 'rounded-xl border border-zinc-700 p-1 bg-zinc-950'
                }`}
              >
                {/* 캡처 대상: 순수 1:1 정사각형 캔버스 */}
                <div
                  ref={exportCanvasRef}
                  style={{ width: '280px', height: '280px' }}
                  className={`relative overflow-hidden bg-gradient-to-b ${currentGradient} select-none ${
                    bezelType === 'galaxy'
                      ? 'rounded-full'
                      : bezelType === 'apple'
                      ? 'rounded-[32px]'
                      : 'rounded-lg'
                  }`}
                >
                  {/* 배경 장식 패턴 (원형 글로우 & 그리드) */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.2),transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                  {/* 속성 엠블럼 워터마크 (우측 상단) */}
                  <div className="absolute top-3 right-3 text-[10px] font-black tracking-widest text-white/30 uppercase border border-white/10 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-xs">
                    {currentCard?.element?.toUpperCase() || 'HERO'}
                  </div>

                  {/* 카드 캐릭터 일러스트 (중앙 배치) */}
                  <div className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none">
                    <div className="w-[210px] h-[210px] relative flex items-center justify-center transition-transform hover:scale-105">
                      {resolvedImg.source && !isSpriteSheet(resolvedImg.source) ? (
                        <img
                          src={resolvedImg.source}
                          alt={getFormattedCardName(currentCard, language)}
                          className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-xl filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]"
                          style={getCardSpriteStyle(Number(currentCard?.id || 1), resolvedImg.source)}
                        />
                      )}
                    </div>
                  </div>

                  {/* 하단 영웅 이름 뱃지 */}
                  <div className="absolute bottom-3 inset-x-0 flex flex-col items-center justify-center pointer-events-none px-4">
                    <div className="text-[11px] font-black tracking-wider text-white text-center px-3 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-md max-w-[90%] truncate">
                      {getFormattedCardName(currentCard, language)}
                    </div>
                  </div>

                  {/* 스마트워치 시계 HUD 오버레이 (옵션 토글) */}
                  {includeClock && (
                    <div className="absolute top-4 inset-x-0 flex flex-col items-center justify-start pointer-events-none z-10 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      <span className="text-[10px] font-bold tracking-widest text-zinc-300 uppercase">
                        {currentDate}
                      </span>
                      <span className="text-3xl font-extrabold tracking-tight leading-none font-sans">
                        {currentTime}
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-semibold text-emerald-400">
                        <span>♥ 74</span>
                        <span>⚡ 98%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 워치 화면 크기 안내 */}
              <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                {language === 'ko' ? '1:1 정사각형 캔버스 • 초고해상도 PNG (1080x1080+)' : '1:1 Square Canvas • Ultra HD PNG (1080x1080+)'}
              </div>
            </div>

            {/* 설정 컨트롤 패널 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 베젤 형태 프리뷰 */}
              <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 block">
                  {language === 'ko' ? '베젤 미리보기' : 'Bezel Preview'}
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setBezelType('apple')}
                    className={`py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                      bezelType === 'apple'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    Apple
                  </button>
                  <button
                    type="button"
                    onClick={() => setBezelType('galaxy')}
                    className={`py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                      bezelType === 'galaxy'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    Galaxy
                  </button>
                  <button
                    type="button"
                    onClick={() => setBezelType('flat')}
                    className={`py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                      bezelType === 'flat'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    Flat
                  </button>
                </div>
              </div>

              {/* 테마 배경 */}
              <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 block">
                  {language === 'ko' ? '배경 스타일' : 'Background Style'}
                </span>
                <select
                  value={bgStyle}
                  onChange={(e) => setBgStyle(e.target.value as any)}
                  className="w-full bg-zinc-800 text-zinc-200 border border-zinc-700 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="element">{language === 'ko' ? '속성 맞춤형 컬러' : 'Element Match'}</option>
                  <option value="cyber">{language === 'ko' ? '사이버펑크 네온' : 'Cyberpunk Neon'}</option>
                  <option value="dark">{language === 'ko' ? '올레드 딥 다크' : 'OLED Deep Black'}</option>
                  <option value="gold">{language === 'ko' ? '골드 럭셔리' : 'Gold Luxury'}</option>
                  <option value="minimal">{language === 'ko' ? '미니멀 스톤' : 'Minimal Stone'}</option>
                </select>
              </div>

              {/* 시계 HUD 포함 여부 */}
              <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-zinc-400 block">
                  {language === 'ko' ? '시계 HUD 오버레이' : 'Clock HUD Overlay'}
                </span>
                <button
                  type="button"
                  onClick={() => setIncludeClock(!includeClock)}
                  className={`w-full py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                    includeClock
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {includeClock
                    ? (language === 'ko' ? '✓ 시계 표시됨' : '✓ Clock On')
                    : (language === 'ko' ? '순수 배경만 (권장)' : 'Pure BG Only (Rec)')}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <Smartphone size={14} className="text-zinc-500" />
              <span>
                {language === 'ko'
                  ? '워치 자체 시계 기능을 쓰실 경우 "순수 배경만" 저장을 권장합니다.'
                  : 'For smartwatch built-in clocks, "Pure BG Only" is recommended.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isExporting}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg cursor-pointer ${
                  downloadSuccess
                    ? 'bg-emerald-600 text-white border border-emerald-500'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400'
                }`}
              >
                {downloadSuccess ? (
                  <>
                    <Check size={16} />
                    <span>{language === 'ko' ? '저장 완료!' : 'Saved!'}</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>
                      {isExporting
                        ? (language === 'ko' ? '고화질 생성 중...' : 'Generating...')
                        : (language === 'ko' ? '와치페이스 이미지 저장' : 'Save Watch Face')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
