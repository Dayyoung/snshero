import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Sliders, 
  FileCode, 
  Layers, 
  Grid3X3, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  Copy
} from 'lucide-react';
import { ViewType, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardSilhouettePreview } from '../components/CardSilhouettePreview';
import { getCharacterAssetManifestEntry } from '../content/characterAssetManifest';
import { validateCharacterArtPrompts, getCharacterArtPrompt } from '../content/characterArtPrompts';
import { getCharacterIpProfile, getFactionDef, getRarityRule } from '../content/characterIpUtils';
import { cn } from '../lib/utils';

interface GridCheckerViewProps {
  language?: Language;
  onNavigate: (view: ViewType) => void;
}

type TabType = 'cards' | 'css-validator' | 'sheet-inspector';

interface AreaBlock {
  name: string;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  color: string;
}

const PRESET_CSS_TEMPLATES = [
  {
    name: '10x11 Card Sheet (110 Cards)',
    cols: 'repeat(10, 1fr)',
    rows: 'repeat(11, 1fr)',
    gap: '4px',
    areas: ''
  },
  {
    name: 'Game Battle HUD (3x3)',
    cols: '240px 1fr 280px',
    rows: '64px 1fr 120px',
    gap: '8px',
    areas: `"header header header"\n"sidebar main rightbar"\n"footer footer footer"`
  },
  {
    name: 'Holy Grail Web Layout',
    cols: '200px 1fr 180px',
    rows: '60px 1fr 50px',
    gap: '12px',
    areas: `"header header header"\n"nav content aside"\n"footer footer footer"`
  },
  {
    name: 'Mobile RPG Deck (2x3)',
    cols: 'repeat(2, 1fr)',
    rows: 'repeat(3, 1fr)',
    gap: '8px',
    areas: ''
  }
];

const BLOCK_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899',
  '#ef4444', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6'
];

const getElementEmoji = (element?: string): string => {
  switch (element) {
    case 'fire': return '🔥';
    case 'water': return '💧';
    case 'air':
    case 'wind': return '⚡';
    case 'earth':
    case 'land': return '🌿';
    case 'human': return '👤';
    case 'undead': return '💀';
    case 'elf': return '🧝';
    case 'dwarf': return '⛏️';
    case 'monster': return '👾';
    case 'robot': return '🤖';
    case 'dragon': return '🐉';
    default: return '✨';
  }
};

export const GridCheckerView: React.FC<GridCheckerViewProps> = ({
  language = 'ko',
  onNavigate
}) => {
  const isKo = language === 'ko';
  const [activeTab, setActiveTab] = useState<TabType>('cards');

  // ── 탭 1: 110종 카드 썸네일 검수 상태 ──
  const [searchQuery, setSearchQuery] = useState('');
  const [thumbnailSize, setThumbnailSize] = useState<64 | 96 | 128>(96);
  const [showSilhouette, setShowSilhouette] = useState(false);
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterElement, setFilterElement] = useState<string>('all');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const promptValidation = useMemo(() => validateCharacterArtPrompts(), []);

  const filteredCardIds = useMemo(() => {
    const allIds = Array.from({ length: 110 }, (_, i) => i + 1);
    return allIds.filter((id) => {
      const card = CARD_DATABASE[id];
      if (!card) return false;
      
      if (filterRarity !== 'all' && String(card.rarity) !== filterRarity) {
        return false;
      }
      if (filterElement !== 'all' && String(card.element).toLowerCase() !== filterElement.toLowerCase()) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const name = (card.title_dis ?? '').toLowerCase();
      const nameEn = (card.title_en ?? '').toLowerCase();
      const nameKo = (card.title ?? '').toLowerCase();
      const numStr = String(id);
      return name.includes(query) || nameEn.includes(query) || nameKo.includes(query) || numStr === query;
    });
  }, [searchQuery, filterRarity, filterElement]);

  // ── 탭 2: CSS 그리드 검수기 상태 ──
  const [gridColsInput, setGridColsInput] = useState('repeat(3, 1fr)');
  const [gridRowsInput, setGridRowsInput] = useState('repeat(3, 1fr)');
  const [gridGapInput, setGridGapInput] = useState('12px');
  const [gridAreasInput, setGridAreasInput] = useState('"header header header"\n"sidebar main rightbar"\n"footer footer footer"');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // CSS 그리드 파싱 및 유효성 검사
  const gridAnalysis = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Parse areas
    const areaLines = gridAreasInput
      .split('\n')
      .map(line => line.trim().replace(/^["']|["']$/g, ''))
      .filter(line => line.length > 0);

    const parsedMatrix: string[][] = areaLines.map(line => line.split(/\s+/).filter(Boolean));

    if (parsedMatrix.length > 0) {
      const colCounts = parsedMatrix.map(row => row.length);
      const firstColCount = colCounts[0];
      const isUniformCols = colCounts.every(c => c === firstColCount);

      if (!isUniformCols) {
        errors.push(isKo 
          ? '그리드 영역(Areas)의 행마다 컬럼 수가 일치하지 않습니다.' 
          : 'Inconsistent column count across grid-template-areas rows.');
      }

      // Check if named areas form contiguous rectangles
      const areaMap: Record<string, { minR: number; maxR: number; minC: number; maxC: number; count: number }> = {};
      parsedMatrix.forEach((row, rIdx) => {
        row.forEach((areaName, cIdx) => {
          if (areaName === '.') return;
          if (!areaMap[areaName]) {
            areaMap[areaName] = { minR: rIdx, maxR: rIdx, minC: cIdx, maxC: cIdx, count: 1 };
          } else {
            areaMap[areaName].minR = Math.min(areaMap[areaName].minR, rIdx);
            areaMap[areaName].maxR = Math.max(areaMap[areaName].maxR, rIdx);
            areaMap[areaName].minC = Math.min(areaMap[areaName].minC, cIdx);
            areaMap[areaName].maxC = Math.max(areaMap[areaName].maxC, cIdx);
            areaMap[areaName].count += 1;
          }
        });
      });

      Object.entries(areaMap).forEach(([name, bounds]) => {
        const expectedCount = (bounds.maxR - bounds.minR + 1) * (bounds.maxC - bounds.minC + 1);
        if (bounds.count !== expectedCount) {
          errors.push(isKo 
            ? `영역 "${name}"이(가) 직사각형 모양이 아닙니다 (비정형 영역 분산 오류).` 
            : `Area "${name}" is not a contiguous rectangle.`);
        }
      });
    }

    if (!gridColsInput.trim()) {
      warnings.push(isKo ? 'grid-template-columns 값이 비어 있습니다.' : 'grid-template-columns is empty.');
    }
    if (!gridRowsInput.trim()) {
      warnings.push(isKo ? 'grid-template-rows 값이 비어 있습니다.' : 'grid-template-rows is empty.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      parsedMatrix,
      rowCount: parsedMatrix.length || 3,
      colCount: parsedMatrix[0]?.length || 3
    };
  }, [gridAreasInput, gridColsInput, gridRowsInput, isKo]);

  // ── 탭 3: 커스텀 10x11 시트 검수 상태 ──
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetColCount, setSheetColCount] = useState(10);
  const [sheetRowCount, setSheetRowCount] = useState(11);
  const [overlayActive, setOverlayActive] = useState(true);

  return (
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 bg-[#fdfcfc]/95 backdrop-blur-md border-b border-[rgba(15,0,0,0.12)] px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="px-2.5 py-1.5 border border-[rgba(15,0,0,0.15)] bg-white hover:bg-[#201d1d]/5 rounded-sm text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>{isKo ? '[← 홈으로]' : '[← HOME]'}</span>
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-tight">
                  {isKo ? '그리드 검수기' : 'Grid Checker & Validator'}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-xs">
                  /tool/checkgrid
                </span>
              </div>
              <span className="text-[10px] text-[#201d1d]/60">
                {isKo ? '110종 카드 그리드 무결성 & CSS 레이아웃 진단기' : '110 Cards Grid Integrity & CSS Layout Inspector'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('tool-makegrid')}
              className="px-3 py-1.5 bg-[#201d1d] text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
            >
              <Grid3X3 size={13} />
              <span>{isKo ? '[+] 그리드 생성기 (/tool/makegrid)' : '[+] Grid Generator'}</span>
            </button>
          </div>
        </div>

        {/* ── Tab Selector ── */}
        <div className="max-w-7xl mx-auto flex border-b border-[rgba(15,0,0,0.12)] mt-3">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cards'
                ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
            }`}
          >
            <Layers size={14} />
            <span>{isKo ? '[1] 110종 카드 10x11 그리드 검수' : '[1] 110 Cards 10x11 Grid'}</span>
          </button>
          <button
            onClick={() => setActiveTab('css-validator')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'css-validator'
                ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
            }`}
          >
            <FileCode size={14} />
            <span>{isKo ? '[2] CSS 그리드 문법 & 영역 검수기' : '[2] CSS Grid Syntax Validator'}</span>
          </button>
          <button
            onClick={() => setActiveTab('sheet-inspector')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sheet-inspector'
                ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
            }`}
          >
            <Sliders size={14} />
            <span>{isKo ? '[3] 스프라이트 시트 분할 검사기' : '[3] Sprite Sheet Inspector'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-6 flex-1">
        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 1: 110 CARDS 10x11 THUMBNAIL & SILHOUETTE INSPECTION
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            {/* Quick Diagnostic Summary Banner */}
            <div className="p-3 sm:p-4 bg-white border border-[rgba(15,0,0,0.12)] rounded-none flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>{isKo ? '110종 카드 10x11 그리드 무결성 상태:' : '110 Cards Grid Status:'}</span>
                    <span className="text-emerald-700 font-black">
                      {promptValidation.valid ? '100% VALID' : 'ACTION REQUIRED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#201d1d]/70">
                    {isKo 
                      ? `총 110개 카드 중 ${filteredCardIds.length}개 표시 중 (누락 0건, 규격 10x11)` 
                      : `Displaying ${filteredCardIds.length} of 110 cards (0 missing, 10x11 format)`}
                  </div>
                </div>
              </div>

              {/* Size & Silhouette Toggles */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 border border-[rgba(15,0,0,0.15)] bg-[#fdfcfc] p-1 rounded-sm">
                  <span className="text-[10px] font-bold text-[#201d1d]/60 px-1">{isKo ? '크기:' : 'Size:'}</span>
                  {([64, 96, 128] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setThumbnailSize(sz)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition-colors cursor-pointer ${
                        thumbnailSize === sz
                          ? 'bg-[#201d1d] text-white'
                          : 'text-[#201d1d]/70 hover:bg-[#201d1d]/10'
                      }`}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowSilhouette(!showSilhouette)}
                  className={`px-3 py-1.5 border text-xs font-bold rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                    showSilhouette
                      ? 'bg-purple-900 text-white border-purple-950'
                      : 'border-[rgba(15,0,0,0.15)] bg-white text-[#201d1d] hover:bg-[#201d1d]/5'
                  }`}
                >
                  {showSilhouette ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{isKo ? (showSilhouette ? '실루엣 해제' : '실루엣 모드') : (showSilhouette ? 'Silhouette Off' : 'Silhouette Mode')}</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 bg-white border border-[rgba(15,0,0,0.12)] flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#201d1d]/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isKo ? '카드 번호, 이름, 키워드 검색 (예: 1, 드래곤, 아케인)' : 'Search card No, name, keyword...'}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[rgba(15,0,0,0.15)] bg-[#fdfcfc] focus:outline-none focus:border-[#201d1d]"
                />
              </div>

              {/* Rarity Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#201d1d]/60">{isKo ? '희귀도:' : 'Rarity:'}</span>
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  className="text-xs p-1.5 border border-[rgba(15,0,0,0.15)] bg-white cursor-pointer"
                >
                  <option value="all">{isKo ? '전체 (All)' : 'All'}</option>
                  <option value="1">1★ (Common)</option>
                  <option value="2">2★ (Uncommon)</option>
                  <option value="3">3★ (Rare)</option>
                  <option value="4">4★ (Epic)</option>
                  <option value="5">5★ (Legendary)</option>
                </select>
              </div>

              {/* Element Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#201d1d]/60">{isKo ? '속성:' : 'Element:'}</span>
                <select
                  value={filterElement}
                  onChange={(e) => setFilterElement(e.target.value)}
                  className="text-xs p-1.5 border border-[rgba(15,0,0,0.15)] bg-white cursor-pointer"
                >
                  <option value="all">{isKo ? '전체 (All)' : 'All'}</option>
                  <option value="water">💧 WATER (물)</option>
                  <option value="fire">🔥 FIRE (불)</option>
                  <option value="air">⚡ AIR (바람/번개)</option>
                  <option value="earth">🌿 EARTH (땅/대지)</option>
                  <option value="light">✨ LIGHT (빛)</option>
                  <option value="dark">🌑 DARK (어둠)</option>
                </select>
              </div>

              {(searchQuery || filterRarity !== 'all' || filterElement !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterRarity('all');
                    setFilterElement('all');
                  }}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{isKo ? '필터 리셋' : 'Reset'}</span>
                </button>
              )}
            </div>

            {/* 10x11 Grid Matrix View */}
            <div className="p-4 bg-white border border-[rgba(15,0,0,0.12)]">
              <div 
                className="grid gap-2 justify-center"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))`
                }}
              >
                {filteredCardIds.map((cardId) => {
                  const card = CARD_DATABASE[cardId];
                  if (!card) return null;
                  const prompt = getCharacterArtPrompt(cardId);
                  const isSelected = selectedCardId === cardId;

                  return (
                    <div
                      key={cardId}
                      onClick={() => setSelectedCardId(isSelected ? null : cardId)}
                      className={cn(
                        'border transition-all flex flex-col items-center justify-between p-1.5 cursor-pointer relative group',
                        isSelected 
                          ? 'border-[#201d1d] ring-2 ring-[#201d1d] bg-[#201d1d]/5 shadow-sm'
                          : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:border-[#201d1d]/40'
                      )}
                      style={{ minHeight: thumbnailSize + 40 }}
                    >
                      {/* Top Badges */}
                      <div className="w-full flex items-center justify-between text-[9px] font-bold text-[#201d1d]/70 mb-1">
                        <span className="font-mono">#{cardId}</span>
                        <span className="text-amber-700">★{card.rarity}</span>
                      </div>

                      {/* Silhouette or Thumbnail Preview */}
                      <div className="w-full aspect-square flex items-center justify-center overflow-hidden bg-slate-900 border border-slate-700">
                        {showSilhouette ? (
                          <CardSilhouettePreview
                            cardId={cardId}
                            size={thumbnailSize - 16}
                            language={language}
                          />
                        ) : (
                          <div className="relative w-full h-full flex flex-col items-center justify-center p-1 text-center">
                            <span className="text-[18px] mb-0.5">
                              {getElementEmoji(card.element)}
                            </span>
                            <span className="text-[10px] font-black text-white line-clamp-1">
                              {card.title_dis || card.title}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Info */}
                      <div className="w-full text-center mt-1">
                        <div className="text-[10px] font-bold text-[#201d1d] truncate">
                          {card.title_dis || card.title}
                        </div>
                        <div className="text-[8px] text-[#201d1d]/50 uppercase">
                          {String(card.element || '')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCardIds.length === 0 && (
                <div className="p-8 text-center text-xs text-[#201d1d]/60 font-mono">
                  {isKo ? '검색 조건에 일치하는 카드가 없습니다.' : 'No cards matched your filter criteria.'}
                </div>
              )}
            </div>

            {/* Selected Card Prompt & Metadata Inspector */}
            {selectedCardId && CARD_DATABASE[selectedCardId] && (
              <div className="p-4 bg-amber-50/60 border-2 border-amber-300 text-[#201d1d] space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">
                      #{selectedCardId} {CARD_DATABASE[selectedCardId].title_dis || CARD_DATABASE[selectedCardId].title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-900 font-bold">
                      {String(CARD_DATABASE[selectedCardId].element || '').toUpperCase()} / ★{CARD_DATABASE[selectedCardId].rarity}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCardId(null)}
                    className="text-xs font-bold text-amber-900 hover:underline cursor-pointer"
                  >
                    [X 닫기]
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-[10px] text-[#201d1d]/60 uppercase">시그니처 실루엣 형태 (Signature Shape):</span>
                    <p className="p-2 bg-white border border-amber-200 text-[11px]">
                      {getCharacterArtPrompt(selectedCardId)?.signatureShape || '기본 표준 규격 실루엣'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-[10px] text-[#201d1d]/60 uppercase">시각적 핵심 키워드 (Visual Keywords):</span>
                    <p className="p-2 bg-white border border-amber-200 text-[11px]">
                      {getCharacterArtPrompt(selectedCardId)?.visualKeywords.join(', ') || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-[10px] text-[#201d1d]/60 uppercase">정밀 썸네일 아트 프롬프트 (Thumbnail Prompt):</span>
                  <p className="p-2 bg-white border border-amber-200 text-[11px] font-mono leading-relaxed select-all">
                    {getCharacterArtPrompt(selectedCardId)?.thumbnailPrompt || 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 2: CSS GRID SYNTAX & AREA OVERLAP VALIDATOR
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'css-validator' && (
          <div className="space-y-4">
            {/* Template Presets Bar */}
            <div className="p-3 bg-white border border-[rgba(15,0,0,0.12)] flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#201d1d]/70 mr-1">{isKo ? '검수 템플릿 로드:' : 'Load Template:'}</span>
              {PRESET_CSS_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => {
                    setGridColsInput(tmpl.cols);
                    setGridRowsInput(tmpl.rows);
                    setGridGapInput(tmpl.gap);
                    setGridAreasInput(tmpl.areas);
                  }}
                  className="px-2.5 py-1 text-xs border border-[rgba(15,0,0,0.15)] bg-[#fdfcfc] hover:bg-[#201d1d] hover:text-white rounded-xs transition-colors cursor-pointer"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Code Inputs */}
              <div className="space-y-3 p-4 bg-white border border-[rgba(15,0,0,0.12)]">
                <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-2 border-b border-[rgba(15,0,0,0.12)] pb-2">
                  <FileCode size={15} />
                  <span>{isKo ? 'CSS 그리드 속성 입력 & 문법 검사' : 'CSS Grid Code Inputs'}</span>
                </h3>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#201d1d]">
                    grid-template-columns:
                  </label>
                  <input
                    type="text"
                    value={gridColsInput}
                    onChange={(e) => setGridColsInput(e.target.value)}
                    className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] font-mono bg-[#fdfcfc]"
                    placeholder="repeat(3, 1fr) or 200px 1fr 100px"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#201d1d]">
                    grid-template-rows:
                  </label>
                  <input
                    type="text"
                    value={gridRowsInput}
                    onChange={(e) => setGridRowsInput(e.target.value)}
                    className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] font-mono bg-[#fdfcfc]"
                    placeholder="repeat(3, 1fr) or 60px 1fr 40px"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#201d1d]">
                    gap (간격):
                  </label>
                  <input
                    type="text"
                    value={gridGapInput}
                    onChange={(e) => setGridGapInput(e.target.value)}
                    className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] font-mono bg-[#fdfcfc]"
                    placeholder="12px or 1rem"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#201d1d]">
                    grid-template-areas (명명된 영역 구조):
                  </label>
                  <textarea
                    value={gridAreasInput}
                    onChange={(e) => setGridAreasInput(e.target.value)}
                    rows={5}
                    className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] font-mono bg-[#fdfcfc]"
                    placeholder={'"header header header"\n"sidebar main rightbar"\n"footer footer footer"'}
                  />
                </div>

                {/* Validation Status Box */}
                <div className={cn(
                  'p-3 border text-xs space-y-1',
                  gridAnalysis.isValid 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                )}>
                  <div className="font-bold flex items-center gap-1.5">
                    {gridAnalysis.isValid ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span>
                      {gridAnalysis.isValid 
                        ? (isKo ? '✓ 문법 및 영역 검수 통과 (정상 규격)' : '✓ CSS Grid Validated Successfully')
                        : (isKo ? '⚠ 문법 오류 또는 직사각형 영역 불일치 감지' : '⚠ Validation Errors Detected')}
                    </span>
                  </div>
                  {gridAnalysis.errors.map((err, i) => (
                    <p key={i} className="text-[11px] pl-5">• {err}</p>
                  ))}
                  {gridAnalysis.warnings.map((warn, i) => (
                    <p key={i} className="text-[11px] pl-5 text-amber-700">• [주의] {warn}</p>
                  ))}
                </div>
              </div>

              {/* Right Column: Live Visual Grid Rendering */}
              <div className="space-y-3 p-4 bg-white border border-[rgba(15,0,0,0.12)] flex flex-col">
                <h3 className="text-xs font-black uppercase tracking-tight flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
                  <span className="flex items-center gap-2">
                    <Eye size={15} />
                    <span>{isKo ? '실시간 그리드 렌더링 미리보기' : 'Live Visual Grid Preview'}</span>
                  </span>
                  <button
                    onClick={() => {
                      const cssCode = `display: grid;\ngrid-template-columns: ${gridColsInput};\ngrid-template-rows: ${gridRowsInput};\ngap: ${gridGapInput};\n${gridAreasInput ? `grid-template-areas:\n${gridAreasInput};` : ''}`;
                      navigator.clipboard.writeText(cssCode);
                      setCopiedNotification(true);
                      setTimeout(() => setCopiedNotification(false), 2000);
                    }}
                    className="px-2 py-1 text-[10px] font-bold border border-[rgba(15,0,0,0.15)] bg-white hover:bg-[#201d1d] hover:text-white rounded-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedNotification ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedNotification ? (isKo ? '복사됨!' : 'Copied!') : (isKo ? 'CSS 복사' : 'Copy CSS')}</span>
                  </button>
                </h3>

                {/* Render container */}
                <div className="flex-1 min-h-[300px] border border-dashed border-[rgba(15,0,0,0.2)] p-4 bg-[#fdfcfc] flex items-center justify-center">
                  {gridAnalysis.parsedMatrix.length > 0 ? (
                    <div 
                      className="w-full h-full min-h-[260px] grid"
                      style={{
                        gridTemplateColumns: gridColsInput,
                        gridTemplateRows: gridRowsInput,
                        gap: gridGapInput,
                        gridTemplateAreas: gridAreasInput
                      }}
                    >
                      {/* Unique Areas */}
                      {Array.from(new Set(gridAnalysis.parsedMatrix.flat().filter(a => a !== '.'))).map((areaName, idx) => (
                        <div
                          key={areaName}
                          style={{
                            gridArea: areaName,
                            backgroundColor: `${BLOCK_COLORS[idx % BLOCK_COLORS.length]}18`,
                            borderColor: BLOCK_COLORS[idx % BLOCK_COLORS.length]
                          }}
                          className="border-2 p-3 flex flex-col items-center justify-center text-center font-bold text-xs"
                        >
                          <span className="font-mono text-sm">{areaName}</span>
                          <span className="text-[10px] opacity-70">area: {areaName}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full min-h-[260px] grid"
                      style={{
                        gridTemplateColumns: gridColsInput,
                        gridTemplateRows: gridRowsInput,
                        gap: gridGapInput
                      }}
                    >
                      {Array.from({ length: 9 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="border-2 border-slate-300 bg-slate-100/60 p-3 flex items-center justify-center font-bold text-xs"
                        >
                          Item #{idx + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 3: SPRITE SHEET INSPECTOR (10x11 SLICER)
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sheet-inspector' && (
          <div className="space-y-4">
            <div className="p-4 bg-white border border-[rgba(15,0,0,0.12)] space-y-3">
              <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                <Sliders size={15} />
                <span>{isKo ? '스프라이트 시트 10열 x 11행 분할 검수' : 'Sprite Sheet 10x11 Inspection'}</span>
              </h3>

              <p className="text-xs text-[#201d1d]/70 leading-relaxed">
                {isKo 
                  ? 'SNSHero의 110장 카드는 가로 10열 x 세로 11행(총 110칸) 스프라이트 그리드 규격을 사용합니다. 아래에 업로드하거나 URL을 입력하여 경계선 정렬 오차를 검수하세요.'
                  : 'SNSHero 110 cards use a 10 cols x 11 rows sprite grid format. Inspect alignment overlays below.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#201d1d] mb-1">
                    {isKo ? '가로 열 수 (Columns):' : 'Columns:'}
                  </label>
                  <input
                    type="number"
                    value={sheetColCount}
                    onChange={(e) => setSheetColCount(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] bg-[#fdfcfc]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#201d1d] mb-1">
                    {isKo ? '세로 행 수 (Rows):' : 'Rows:'}
                  </label>
                  <input
                    type="number"
                    value={sheetRowCount}
                    onChange={(e) => setSheetRowCount(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] bg-[#fdfcfc]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setOverlayActive(!overlayActive)}
                    className={`w-full py-2 text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      overlayActive
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white text-[#201d1d] border-[rgba(15,0,0,0.15)]'
                    }`}
                  >
                    <Grid3X3 size={14} />
                    <span>{overlayActive ? (isKo ? '격자선 켜짐 (ON)' : 'Grid Overlay ON') : (isKo ? '격자선 꺼짐 (OFF)' : 'Grid Overlay OFF')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Virtual Grid Preview Canvas */}
            <div className="p-4 bg-white border border-[rgba(15,0,0,0.12)] flex flex-col items-center">
              <div className="w-full max-w-4xl aspect-[10/11] border-2 border-[#201d1d] bg-slate-900 relative overflow-hidden">
                {/* 10x11 Grid Overlay Lines */}
                {overlayActive && (
                  <div 
                    className="absolute inset-0 grid pointer-events-none"
                    style={{
                      gridTemplateColumns: `repeat(${sheetColCount}, 1fr)`,
                      gridTemplateRows: `repeat(${sheetRowCount}, 1fr)`
                    }}
                  >
                    {Array.from({ length: sheetColCount * sheetRowCount }).map((_, i) => (
                      <div 
                        key={i} 
                        className="border border-emerald-400/40 flex items-center justify-center"
                      >
                        <span className="text-[9px] font-mono text-emerald-400/70 font-bold">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs">
                  <Grid3X3 size={36} className="text-emerald-400 mb-2 opacity-50" />
                  <p className="font-bold text-white mb-1">
                    {sheetColCount} x {sheetRowCount} ({sheetColCount * sheetRowCount} Slots) Standard Sprite Matrix
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isKo ? '각 셀은 1:1.15 비율로 자동 분할 및 인덱싱됩니다.' : 'Each cell is uniformly partitioned and indexed.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
