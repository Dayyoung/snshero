import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Upload, 
  Link as LinkIcon, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Copy, 
  Check, 
  Scissors, 
  Crosshair, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { ViewType, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardSilhouettePreview } from '../components/CardSilhouettePreview';
import { validateCharacterArtPrompts, getCharacterArtPrompt } from '../content/characterArtPrompts';
import { cn } from '../lib/utils';

interface GridCheckerViewProps {
  language?: Language;
  onNavigate: (view: ViewType) => void;
}

type TabType = 'image-inspector' | 'cards' | 'css-validator';

const GRID_LINE_COLORS = [
  { name: 'Emerald', value: '#10b981', label: '에메랄드' },
  { name: 'Amber', value: '#f59e0b', label: '앰버' },
  { name: 'Cyan', value: '#06b6d4', label: '시안' },
  { name: 'Rose', value: '#f43f5e', label: '로즈' },
  { name: 'Purple', value: '#8b5cf6', label: '퍼플' },
  { name: 'White', value: '#ffffff', label: '화이트' },
  { name: 'Dark', value: '#201d1d', label: '잉크블랙' },
];

const PRESET_CSS_TEMPLATES = [
  {
    name: '10x10 Standard Grid (100 Slots)',
    cols: 'repeat(10, 1fr)',
    rows: 'repeat(10, 1fr)',
    gap: '4px',
    areas: ''
  },
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
  }
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
  const [activeTab, setActiveTab] = useState<TabType>('image-inspector');

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB 1: 10x10 기본 이미지 그리드 검수기 상태 (기본값: 10 * 10)
  // ══════════════════════════════════════════════════════════════════════════════
  const [gridCols, setGridCols] = useState<number>(10);
  const [gridRows, setGridRows] = useState<number>(10);
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // 그리드 오버레이 커스텀
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showCellNumbers, setShowCellNumbers] = useState<boolean>(true);
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(false);
  const [showDiagonals, setShowDiagonals] = useState<boolean>(false);
  const [gridColor, setGridColor] = useState<string>('#10b981');
  const [gridLineWidth, setGridLineWidth] = useState<number>(1);
  const [gridLineStyle, setGridLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [gridOpacity, setGridOpacity] = useState<number>(85); // 0~100%

  // 오프셋 & 간격 미세 조정
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [colGap, setColGap] = useState<number>(0);
  const [rowGap, setRowGap] = useState<number>(0);

  // 줌 & 뷰 컨트롤
  const [zoomLevel, setZoomLevel] = useState<number>(100); // %
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(0); // 0-indexed (0..99)
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // 캔버스 및 파일 인풋 ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 10x10 기본 번호 패턴 캔버스 생성 함수 (초기 로드용 데모)
  const generate10x10TestPattern = () => {
    const canvas = document.createElement('canvas');
    const size = 1000;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellW = size / 10;
    const cellH = size / 10;

    // 배경
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const idx = r * 10 + c + 1;
        const x = c * cellW;
        const y = r * cellH;

        // 셀 배경
        const isEven = (r + c) % 2 === 0;
        ctx.fillStyle = isEven ? '#1e293b' : '#334155';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // 셀 내부 장식
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, cellW - 6, cellH - 6);

        // 셀 번호 텍스트
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${idx}`, x + cellW / 2, y + cellH / 2 - 8);

        // 좌표 정보
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(`R${r + 1}:C${c + 1}`, x + cellW / 2, y + cellH / 2 + 14);
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    setLoadedImageSrc(dataUrl);
    setImageFileName('10x10_Standard_Test_Pattern.png');
    setImageNaturalSize({ width: size, height: size });
    setImageError(null);
  };

  // 초기 마운트 시 10x10 기본 데모 패턴 로드
  useEffect(() => {
    generate10x10TestPattern();
  }, []);

  // 클립보드 붙여넣기 (Ctrl+V / Cmd+V) 핸들러
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'image-inspector') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            loadFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  // 로컬 파일 로드 핸들러
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError(isKo ? '이미지 파일만 업로드할 수 있습니다.' : 'Only image files are supported.');
      return;
    }

    setImageLoading(true);
    setImageError(null);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setLoadedImageSrc(result);
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoading(false);
      };
      img.onerror = () => {
        setImageError(isKo ? '이미지 로드에 실패했습니다.' : 'Failed to load image.');
        setImageLoading(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // URL 이미지 로드 핸들러
  const handleLoadUrl = (targetUrl?: string) => {
    const url = (targetUrl || urlInput).trim();
    if (!url) return;

    setImageLoading(true);
    setImageError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedImageSrc(url);
      setImageFileName(url.split('/').pop() || 'remote-image.png');
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoading(false);
    };
    img.onerror = () => {
      setLoadedImageSrc(url);
      setImageFileName(url.split('/').pop() || 'remote-image.png');
      setImageNaturalSize({ width: 800, height: 800 });
      setImageLoading(false);
      setImageError(isKo 
        ? '외부 이미지 로드 완료 (CORS 보호 도메인의 경우 슬라이스 저장이 제한될 수 있습니다).' 
        : 'External image loaded (CORS restricted domains may disable canvas slicing).');
    };
    img.src = url;
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };
  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  // 계산된 셀 크기 (단위: 픽셀)
  const cellCalculations = useMemo(() => {
    const totalW = imageNaturalSize?.width || 1000;
    const totalH = imageNaturalSize?.height || 1000;
    const usableW = totalW - (gridCols - 1) * colGap;
    const usableH = totalH - (gridRows - 1) * rowGap;
    const cellW = Math.max(1, usableW / gridCols);
    const cellH = Math.max(1, usableH / gridRows);

    return {
      totalW,
      totalH,
      cellW: Number(cellW.toFixed(2)),
      cellH: Number(cellH.toFixed(2)),
      totalCells: gridCols * gridRows,
      aspectRatio: (cellW / cellH).toFixed(3)
    };
  }, [imageNaturalSize, gridCols, gridRows, colGap, rowGap]);

  // 선택된 셀의 정밀 좌표 계산
  const selectedCellCoords = useMemo(() => {
    if (selectedCellIndex === null || selectedCellIndex < 0 || selectedCellIndex >= cellCalculations.totalCells) {
      return null;
    }
    const r = Math.floor(selectedCellIndex / gridCols);
    const c = selectedCellIndex % gridCols;
    const x = offsetX + c * (cellCalculations.cellW + colGap);
    const y = offsetY + r * (cellCalculations.cellH + rowGap);

    return {
      index: selectedCellIndex + 1,
      row: r + 1,
      col: c + 1,
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(cellCalculations.cellW),
      h: Math.round(cellCalculations.cellH)
    };
  }, [selectedCellIndex, gridCols, cellCalculations, offsetX, offsetY, colGap, rowGap]);

  // 선택된 셀 크롭 캔버스 렌더링
  useEffect(() => {
    if (!selectedCellCoords || !loadedImageSrc || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = Math.max(1, selectedCellCoords.w);
      canvas.height = Math.max(1, selectedCellCoords.h);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        selectedCellCoords.x,
        selectedCellCoords.y,
        selectedCellCoords.w,
        selectedCellCoords.h,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };
    img.src = loadedImageSrc;
  }, [selectedCellCoords, loadedImageSrc]);

  // 슬라이스 이미지 단독 다운로드
  const handleDownloadSlice = () => {
    if (!cropCanvasRef.current || !selectedCellCoords) return;
    try {
      const dataUrl = cropCanvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `slice_${gridCols}x${gridRows}_cell_${String(selectedCellCoords.index).padStart(3, '0')}.png`;
      a.click();
    } catch (err) {
      setImageError(isKo ? 'CORS 보안으로 인해 외부 URL 이미지의 직접 저장이 차단되었습니다.' : 'CORS restriction blocked direct slice export.');
    }
  };

  // 격자선이 합성된 전체 검수 이미지 다운로드
  const handleDownloadFullInspectedImage = () => {
    if (!loadedImageSrc || !imageNaturalSize) return;
    const canvas = document.createElement('canvas');
    canvas.width = imageNaturalSize.width;
    canvas.height = imageNaturalSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      // 격자선 그리기
      if (showGridOverlay) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = gridLineWidth;
        ctx.globalAlpha = gridOpacity / 100;

        const cellW = cellCalculations.cellW;
        const cellH = cellCalculations.cellH;

        for (let r = 0; r < gridRows; r++) {
          for (let c = 0; c < gridCols; c++) {
            const x = offsetX + c * (cellW + colGap);
            const y = offsetY + r * (cellH + rowGap);
            ctx.strokeRect(x, y, cellW, cellH);

            if (showCellNumbers) {
              const num = r * gridCols + c + 1;
              ctx.fillStyle = gridColor;
              ctx.font = 'bold 12px monospace';
              ctx.fillText(`#${num}`, x + 4, y + 14);
            }
          }
        }
      }

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `grid_checked_${gridCols}x${gridRows}_${imageFileName || 'image'}.png`;
        a.click();
      } catch (err) {
        setImageError(isKo ? 'CORS 제약으로 인해 다운로드가 차단되었습니다. 로컬 파일 업로드를 이용해 주세요.' : 'Download blocked due to CORS.');
      }
    };
    img.src = loadedImageSrc;
  };

  const copyNotification = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB 2: 110종 카드 썸네일 검수 상태
  // ══════════════════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB 3: CSS 그리드 검수기 상태
  // ══════════════════════════════════════════════════════════════════════════════
  const [gridColsInput, setGridColsInput] = useState('repeat(10, 1fr)');
  const [gridRowsInput, setGridRowsInput] = useState('repeat(10, 1fr)');
  const [gridGapInput, setGridGapInput] = useState('4px');
  const [gridAreasInput, setGridAreasInput] = useState('');

  // CSS 그리드 파싱 및 유효성 검사
  const gridAnalysis = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

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
      rowCount: parsedMatrix.length || 10,
      colCount: parsedMatrix[0]?.length || 10
    };
  }, [gridAreasInput, gridColsInput, gridRowsInput, isKo]);

  return (
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col selection:bg-amber-100">
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
                <span className="text-xs sm:text-sm font-black tracking-tight uppercase">
                  {isKo ? '그리드 검수기 (10x10 기본)' : 'Grid Inspector (10x10 Default)'}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold rounded-xs">
                  /tool/checkgrid
                </span>
              </div>
              <span className="text-[10px] text-[#201d1d]/60">
                {isKo ? '10x10 이미지 격자 정밀 검수 · 오버레이 & 슬라이스 크롭 인스펙터' : '10x10 Image Grid Inspector & Precision Overlay Slicer'}
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
        <div className="max-w-7xl mx-auto flex border-b border-[rgba(15,0,0,0.12)] mt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('image-inspector')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'image-inspector'
                ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
            }`}
          >
            <Crosshair size={14} className="text-emerald-700" />
            <span>{isKo ? '[1] 10x10 이미지 그리드 검수기 (기본)' : '[1] 10x10 Image Grid Inspector'}</span>
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cards'
                ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
            }`}
          >
            <Layers size={14} />
            <span>{isKo ? '[2] 110종 카드 10x11 DB 검수' : '[2] 110 Cards 10x11 DB'}</span>
          </button>
          <button
            onClick={() => setActiveTab('css-validator')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'css-validator'
                ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
            }`}
          >
            <FileCode size={14} />
            <span>{isKo ? '[3] CSS 그리드 문법 & 영역 검수기' : '[3] CSS Grid Syntax Validator'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-6 flex-1 flex flex-col gap-4">
        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 1: 10x10 이미지 그리드 검수기 (Image Grid Inspector)
        ══════════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'image-inspector' && (
          <div className="space-y-4">
            
            {/* Top Control Bar: Image Loading & Presets */}
            <div className="p-4 bg-white border border-[rgba(15,0,0,0.12)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(15,0,0,0.1)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase flex items-center gap-1.5 text-emerald-800">
                    <Upload size={14} />
                    <span>{isKo ? '이미지 로드 (파일 업로드 / URL 입력)' : 'Load Image (File / URL)'}</span>
                  </span>
                  <span className="text-[10px] text-[#201d1d]/60 bg-[#fdfcfc] px-2 py-0.5 border border-[rgba(15,0,0,0.1)]">
                    {isKo ? 'Ctrl+V 붙여넣기 또는 드래그 앤 드롭 지원' : 'Paste Ctrl+V or Drag & Drop supported'}
                  </span>
                </div>

                {/* 10x10 Quick Reset Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setGridCols(10);
                      setGridRows(10);
                      setOffsetX(0);
                      setOffsetY(0);
                      setColGap(0);
                      setRowGap(0);
                    }}
                    className="px-3 py-1 bg-amber-500/10 text-amber-900 border border-amber-500/40 hover:bg-amber-500 hover:text-white text-xs font-bold rounded-sm transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>{isKo ? '[10x10 기본 규격으로 리셋]' : '[Reset to 10x10]'}</span>
                  </button>
                  <button
                    onClick={generate10x10TestPattern}
                    className="px-2.5 py-1 bg-[#201d1d]/5 hover:bg-[#201d1d] hover:text-white border border-[rgba(15,0,0,0.15)] text-xs font-bold rounded-sm transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>{isKo ? '10x10 테스트 패턴' : '10x10 Test Pattern'}</span>
                  </button>
                </div>
              </div>

              {/* Two Load Modes: File Upload & URL Input */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* 1. File Upload Button & Drag Zone (5 Cols) */}
                <div className="lg:col-span-5 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border-2 border-dashed border-[rgba(15,0,0,0.25)] hover:border-[#201d1d] text-xs font-bold rounded-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload size={15} className="text-emerald-700" />
                    <span>{isKo ? '내 컴퓨터에서 이미지 파일 선택...' : 'Browse Local Image File...'}</span>
                  </button>
                </div>

                {/* 2. URL Input & Load Button (7 Cols) */}
                <div className="lg:col-span-7 flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <LinkIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#201d1d]/40" />
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
                      placeholder={isKo ? 'https://... 웹 이미지 URL 주소 입력 후 Enter' : 'Enter image URL and press Enter...'}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-[rgba(15,0,0,0.15)] bg-[#fdfcfc] focus:outline-none focus:border-[#201d1d]"
                    />
                  </div>
                  <button
                    onClick={() => handleLoadUrl()}
                    className="px-4 py-2 bg-[#201d1d] text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                  >
                    {isKo ? 'URL 로드' : 'Load URL'}
                  </button>
                </div>
              </div>

              {/* Status Message or Warning */}
              {imageError && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-700 shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}
            </div>

            {/* Main Workbench: Config Left (4 Cols) + Canvas Center/Right (8 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* ── Left Sidebar Controls (4 Cols) ── */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                
                {/* 1. Grid Sizing & Resolution Specs */}
                <div className="p-4 bg-white border border-[rgba(15,0,0,0.12)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.1)]">
                    <span className="text-xs font-black uppercase flex items-center gap-1.5 text-slate-800">
                      <Grid3X3 size={14} className="text-emerald-700" />
                      <span>{isKo ? '1. 그리드 분할 규격' : '1. Grid Dimensions'}</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                      {gridCols} × {gridRows} ({cellCalculations.totalCells} Slots)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-1">
                        {isKo ? '가로 열 (Cols):' : 'Columns (Cols):'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={gridCols}
                        onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] font-bold text-center bg-[#fdfcfc]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-1">
                        {isKo ? '세로 행 (Rows):' : 'Rows (Rows):'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={gridRows}
                        onChange={(e) => setGridRows(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] font-bold text-center bg-[#fdfcfc]"
                      />
                    </div>
                  </div>

                  {/* Dimension Diagnostics */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                    <div className="flex justify-between text-[#201d1d]/80">
                      <span>{isKo ? '원본 해상도:' : 'Natural Size:'}</span>
                      <span className="font-bold">{cellCalculations.totalW} × {cellCalculations.totalH} px</span>
                    </div>
                    <div className="flex justify-between text-[#201d1d]/80">
                      <span>{isKo ? '셀당 계산 규격:' : 'Calculated Cell:'}</span>
                      <span className="font-bold text-emerald-700">{cellCalculations.cellW} × {cellCalculations.cellH} px</span>
                    </div>
                    <div className="flex justify-between text-[#201d1d]/80">
                      <span>{isKo ? '셀 가로세로 비율:' : 'Cell Ratio:'}</span>
                      <span className="font-bold">{cellCalculations.aspectRatio}:1</span>
                    </div>
                  </div>
                </div>

                {/* 2. Grid Overlay Styling */}
                <div className="p-4 bg-white border border-[rgba(15,0,0,0.12)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.1)]">
                    <span className="text-xs font-black uppercase flex items-center gap-1.5 text-slate-800">
                      <Sliders size={14} className="text-amber-700" />
                      <span>{isKo ? '2. 격자선 오버레이 스타일' : '2. Overlay Styling'}</span>
                    </span>
                    <button
                      onClick={() => setShowGridOverlay(!showGridOverlay)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-xs border cursor-pointer ${
                        showGridOverlay 
                          ? 'bg-emerald-700 text-white border-emerald-800' 
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {showGridOverlay ? (isKo ? '격자 ON' : 'GRID ON') : (isKo ? '격자 OFF' : 'GRID OFF')}
                    </button>
                  </div>

                  {/* Line Color Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-1">
                      {isKo ? '격자선 색상 (Line Color):' : 'Line Color:'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {GRID_LINE_COLORS.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setGridColor(c.value)}
                          className={cn(
                            "px-2 py-1 text-[10px] font-bold rounded-xs border transition-all flex items-center gap-1 cursor-pointer",
                            gridColor === c.value 
                              ? "ring-2 ring-[#201d1d] bg-[#201d1d] text-white" 
                              : "border-[rgba(15,0,0,0.15)] bg-white text-[#201d1d] hover:bg-slate-50"
                          )}
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: c.value }} />
                          <span>{isKo ? c.label : c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Width & Style */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-1">
                        {isKo ? '선 두께 (Width):' : 'Width:'}
                      </label>
                      <div className="flex gap-1">
                        {([1, 2, 3] as const).map((w) => (
                          <button
                            key={w}
                            onClick={() => setGridLineWidth(w)}
                            className={cn(
                              "flex-1 py-1 text-xs font-bold border rounded-xs cursor-pointer",
                              gridLineWidth === w ? "bg-[#201d1d] text-white" : "border-slate-200 hover:bg-slate-100"
                            )}
                          >
                            {w}px
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-1">
                        {isKo ? '선 스타일 (Style):' : 'Style:'}
                      </label>
                      <select
                        value={gridLineStyle}
                        onChange={(e) => setGridLineStyle(e.target.value as any)}
                        className="w-full text-xs p-1.5 border border-[rgba(15,0,0,0.15)] bg-white cursor-pointer"
                      >
                        <option value="solid">Solid (실선)</option>
                        <option value="dashed">Dashed (파선)</option>
                        <option value="dotted">Dotted (점선)</option>
                      </select>
                    </div>
                  </div>

                  {/* Opacity Slider */}
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-[#201d1d]/70 mb-1">
                      <span>{isKo ? '격자선 투명도 (Opacity):' : 'Opacity:'}</span>
                      <span>{gridOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={gridOpacity}
                      onChange={(e) => setGridOpacity(Number(e.target.value))}
                      className="w-full cursor-pointer accent-[#201d1d]"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="pt-2 border-t border-[rgba(15,0,0,0.1)] flex flex-col gap-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCellNumbers}
                        onChange={(e) => setShowCellNumbers(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                      />
                      <span className="text-[11px] font-bold">{isKo ? '셀 번호 인덱스 (#1 ~ #100) 표시' : 'Show Cell Index Numbers'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCrosshairs}
                        onChange={(e) => setShowCrosshairs(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                      />
                      <span className="text-[11px]">{isKo ? '셀 중앙 십자 가이드선 표시' : 'Show Center Crosshairs'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showDiagonals}
                        onChange={(e) => setShowDiagonals(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                      />
                      <span className="text-[11px]">{isKo ? '셀 대각선 (X 패턴) 가이드선 표시' : 'Show Diagonal X Guides'}</span>
                    </label>
                  </div>
                </div>

                {/* 3. Offset & Gap Fine-Tuning */}
                <div className="p-4 bg-white border border-[rgba(15,0,0,0.12)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.1)]">
                    <span className="text-xs font-black uppercase flex items-center gap-1.5 text-slate-800">
                      <Sliders size={14} className="text-blue-700" />
                      <span>{isKo ? '3. 위치 오프셋 & 간격 보정' : '3. Offset & Spacing'}</span>
                    </span>
                    {(offsetX !== 0 || offsetY !== 0 || colGap !== 0 || rowGap !== 0) && (
                      <button
                        onClick={() => {
                          setOffsetX(0);
                          setOffsetY(0);
                          setColGap(0);
                          setRowGap(0);
                        }}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        {isKo ? '오프셋 리셋' : 'Reset Offset'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-0.5">
                        Offset X (px):
                      </label>
                      <input
                        type="number"
                        value={offsetX}
                        onChange={(e) => setOffsetX(parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 border border-[rgba(15,0,0,0.15)] text-center font-bold bg-[#fdfcfc]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-0.5">
                        Offset Y (px):
                      </label>
                      <input
                        type="number"
                        value={offsetY}
                        onChange={(e) => setOffsetY(parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 border border-[rgba(15,0,0,0.15)] text-center font-bold bg-[#fdfcfc]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-0.5">
                        Col Gap (px):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={colGap}
                        onChange={(e) => setColGap(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-1.5 border border-[rgba(15,0,0,0.15)] text-center font-bold bg-[#fdfcfc]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#201d1d]/70 block mb-0.5">
                        Row Gap (px):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={rowGap}
                        onChange={(e) => setRowGap(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-1.5 border border-[rgba(15,0,0,0.15)] text-center font-bold bg-[#fdfcfc]"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Center & Right: Interactive Grid Canvas & Cell Inspector (8 Cols) ── */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                
                {/* Visual Canvas Viewer */}
                <div 
                  className={cn(
                    "border-2 bg-white p-4 flex flex-col transition-all relative",
                    isDraggingFile ? "border-emerald-600 bg-emerald-50/20" : "border-[rgba(15,0,0,0.15)]"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Canvas Top Bar: Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[rgba(15,0,0,0.1)]">
                    <div className="flex items-center gap-2">
                      <Eye size={15} className="text-emerald-700" />
                      <span className="text-xs font-black uppercase">
                        {isKo ? '그리드 뷰어 캔버스 (클릭 시 셀 상세 검수)' : 'Grid Canvas (Click Cell to Inspect)'}
                      </span>
                      {imageFileName && (
                        <span className="text-[10px] font-bold text-[#201d1d]/60 bg-slate-100 px-2 py-0.5 truncate max-w-[200px]">
                          {imageFileName}
                        </span>
                      )}
                    </div>

                    {/* Zoom & Action Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
                        className="p-1.5 border border-slate-300 hover:bg-slate-100 rounded-sm cursor-pointer"
                        title={isKo ? '축소' : 'Zoom Out'}
                      >
                        <ZoomOut size={13} />
                      </button>
                      <span className="text-[11px] font-bold w-12 text-center font-mono">
                        {zoomLevel}%
                      </span>
                      <button
                        onClick={() => setZoomLevel(prev => Math.min(400, prev + 25))}
                        className="p-1.5 border border-slate-300 hover:bg-slate-100 rounded-sm cursor-pointer"
                        title={isKo ? '확대' : 'Zoom In'}
                      >
                        <ZoomIn size={13} />
                      </button>
                      <button
                        onClick={() => setZoomLevel(100)}
                        className="px-2 py-1 text-[10px] font-bold border border-slate-300 hover:bg-slate-100 rounded-sm cursor-pointer"
                      >
                        100%
                      </button>
                      <button
                        onClick={handleDownloadFullInspectedImage}
                        className="px-2.5 py-1 bg-[#201d1d] text-white hover:bg-black text-[10px] font-bold rounded-sm cursor-pointer flex items-center gap-1"
                        title={isKo ? '격자선 합성 검수 이미지 다운로드' : 'Download Inspected Image'}
                      >
                        <Download size={12} />
                        <span>{isKo ? '검수본 저장' : 'Save Image'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Canvas Container with Scroll / Zoom */}
                  <div 
                    ref={containerRef}
                    className="w-full bg-[#1e293b] border border-dashed border-slate-700 p-4 min-h-[420px] max-h-[640px] overflow-auto flex items-center justify-center relative select-none rounded-none"
                  >
                    {isDraggingFile && (
                      <div className="absolute inset-0 bg-emerald-950/80 border-4 border-dashed border-emerald-400 z-50 flex flex-col items-center justify-center text-white">
                        <Upload size={40} className="animate-bounce mb-2" />
                        <span className="text-sm font-bold">{isKo ? '여기에 이미지 파일을 드롭하세요' : 'Drop Image File Here'}</span>
                      </div>
                    )}

                    {loadedImageSrc ? (
                      <div 
                        className="relative transition-transform origin-center"
                        style={{
                          transform: `scale(${zoomLevel / 100})`,
                          width: cellCalculations.totalW,
                          height: cellCalculations.totalH
                        }}
                      >
                        {/* Background Base Image */}
                        <img
                          ref={imageElementRef}
                          src={loadedImageSrc}
                          alt="Loaded Sprite Sheet"
                          className="w-full h-full object-contain pointer-events-none block"
                          style={{
                            width: cellCalculations.totalW,
                            height: cellCalculations.totalH
                          }}
                        />

                        {/* Interactive Grid Overlay */}
                        {showGridOverlay && (
                          <div 
                            className="absolute inset-0 grid"
                            style={{
                              gridTemplateColumns: `repeat(${gridCols}, ${cellCalculations.cellW}px)`,
                              gridTemplateRows: `repeat(${gridRows}, ${cellCalculations.cellH}px)`,
                              columnGap: `${colGap}px`,
                              rowGap: `${rowGap}px`,
                              transform: `translate(${offsetX}px, ${offsetY}px)`
                            }}
                          >
                            {Array.from({ length: cellCalculations.totalCells }).map((_, idx) => {
                              const isSelected = selectedCellIndex === idx;
                              const borderStyle = gridLineStyle;
                              const opacityVal = gridOpacity / 100;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => setSelectedCellIndex(idx)}
                                  style={{
                                    borderColor: isSelected ? '#f59e0b' : gridColor,
                                    borderWidth: isSelected ? Math.max(2, gridLineWidth + 1) : gridLineWidth,
                                    borderStyle: borderStyle,
                                    backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                                    opacity: isSelected ? 1 : opacityVal
                                  }}
                                  className={cn(
                                    "relative transition-all cursor-pointer flex flex-col justify-between p-1 overflow-hidden group hover:opacity-100",
                                    isSelected && "z-20 ring-2 ring-amber-400"
                                  )}
                                >
                                  {/* Cell Index Badge */}
                                  {showCellNumbers && (
                                    <span 
                                      style={{ color: isSelected ? '#fbbf24' : gridColor }}
                                      className="text-[9px] font-mono font-black select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                                    >
                                      #{idx + 1}
                                    </span>
                                  )}

                                  {/* Center Crosshair Option */}
                                  {showCrosshairs && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                                      <div className="w-full h-[1px] bg-white/60" />
                                      <div className="h-full w-[1px] bg-white/60 absolute" />
                                    </div>
                                  )}

                                  {/* Diagonal X Option */}
                                  {showDiagonals && (
                                    <div className="absolute inset-0 pointer-events-none opacity-30">
                                      <svg className="w-full h-full">
                                        <line x1="0" y1="0" x2="100%" y2="100%" stroke={gridColor} strokeWidth="1" strokeDasharray="2 2" />
                                        <line x1="100%" y1="0" x2="0" y2="100%" stroke={gridColor} strokeWidth="1" strokeDasharray="2 2" />
                                      </svg>
                                    </div>
                                  )}

                                  {/* Hover Highlight indicator */}
                                  <div className="opacity-0 group-hover:opacity-100 text-[8px] font-mono text-white/80 self-end">
                                    {Math.floor(idx / gridCols) + 1},{idx % gridCols + 1}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
                        <ImageIcon size={36} className="mb-2 opacity-50" />
                        <span>{isKo ? '상단에서 이미지 파일을 업로드하거나 URL을 입력하세요' : 'Upload an image file or enter URL above'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Selected Cell Precision Inspector Panel ── */}
                {selectedCellCoords && (
                  <div className="p-4 bg-amber-50/70 border-2 border-amber-300 space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Scissors size={15} className="text-amber-800" />
                        <span className="text-xs font-black uppercase text-amber-950">
                          {isKo ? `셀 #${selectedCellCoords.index} 정밀 크롭 & 좌표 인스펙터` : `Cell #${selectedCellCoords.index} Inspector & Slicer`}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-900 font-bold">
                          Row {selectedCellCoords.row} · Col {selectedCellCoords.col}
                        </span>
                      </div>

                      {copiedNotification && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-emerald-300">
                          ✓ {copiedNotification}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Left: Cropped Slice Canvas Preview (4 Cols) */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center p-2 bg-slate-900 border border-slate-700 rounded-sm">
                        <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5 px-1">
                          <span>SLICE CROP</span>
                          <span>{selectedCellCoords.w} × {selectedCellCoords.h} px</span>
                        </div>
                        <div className="max-h-36 max-w-full overflow-hidden flex items-center justify-center border border-amber-400/50 bg-black/40">
                          <canvas ref={cropCanvasRef} className="max-h-32 max-w-full object-contain" />
                        </div>
                        <button
                          onClick={handleDownloadSlice}
                          className="mt-2 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Download size={13} />
                          <span>{isKo ? '이 셀만 PNG 다운로드' : 'Download Cell Slice'}</span>
                        </button>
                      </div>

                      {/* Right: Coordinates, CSS Sprite Code & JSON Export (8 Cols) */}
                      <div className="md:col-span-8 flex flex-col justify-between gap-2">
                        {/* 4 Coordinate Boxes */}
                        <div className="grid grid-cols-4 gap-2 text-center font-mono">
                          <div className="p-2 bg-white border border-amber-200">
                            <span className="text-[9px] text-slate-500 block">X (Left)</span>
                            <span className="text-xs font-black">{selectedCellCoords.x}px</span>
                          </div>
                          <div className="p-2 bg-white border border-amber-200">
                            <span className="text-[9px] text-slate-500 block">Y (Top)</span>
                            <span className="text-xs font-black">{selectedCellCoords.y}px</span>
                          </div>
                          <div className="p-2 bg-white border border-amber-200">
                            <span className="text-[9px] text-slate-500 block">Width</span>
                            <span className="text-xs font-black text-emerald-700">{selectedCellCoords.w}px</span>
                          </div>
                          <div className="p-2 bg-white border border-amber-200">
                            <span className="text-[9px] text-slate-500 block">Height</span>
                            <span className="text-xs font-black text-emerald-700">{selectedCellCoords.h}px</span>
                          </div>
                        </div>

                        {/* Quick Code Snippet Copy Buttons */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <span>CSS Background Position:</span>
                            <button
                              onClick={() => {
                                const css = `background-position: -${selectedCellCoords.x}px -${selectedCellCoords.y}px; width: ${selectedCellCoords.w}px; height: ${selectedCellCoords.h}px;`;
                                copyNotification(css, isKo ? 'CSS 복사됨' : 'CSS Copied');
                              }}
                              className="text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={11} />
                              <span>{isKo ? 'CSS 복사' : 'Copy CSS'}</span>
                            </button>
                          </div>
                          <div className="p-2 bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto select-all">
                            background-position: -{selectedCellCoords.x}px -{selectedCellCoords.y}px; width: {selectedCellCoords.w}px; height: {selectedCellCoords.h}px;
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <span>JSON Sprite Coordinate:</span>
                            <button
                              onClick={() => {
                                const json = JSON.stringify({
                                  index: selectedCellCoords.index,
                                  row: selectedCellCoords.row,
                                  col: selectedCellCoords.col,
                                  x: selectedCellCoords.x,
                                  y: selectedCellCoords.y,
                                  width: selectedCellCoords.w,
                                  height: selectedCellCoords.h
                                }, null, 2);
                                copyNotification(json, isKo ? 'JSON 복사됨' : 'JSON Copied');
                              }}
                              className="text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={11} />
                              <span>{isKo ? 'JSON 복사' : 'Copy JSON'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════════
            TAB 2: 110 CARDS 10x11 THUMBNAIL & SILHOUETTE INSPECTION
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
                      <div className="w-full flex items-center justify-between text-[9px] font-bold text-[#201d1d]/70 mb-1">
                        <span className="font-mono">#{cardId}</span>
                        <span className="text-amber-700">★{card.rarity}</span>
                      </div>

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
            TAB 3: CSS GRID SYNTAX & AREA OVERLAP VALIDATOR
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
                    placeholder="repeat(10, 1fr)"
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
                    placeholder="repeat(10, 1fr)"
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
                    placeholder="4px or 12px"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#201d1d]">
                    grid-template-areas (선택):
                  </label>
                  <textarea
                    value={gridAreasInput}
                    onChange={(e) => setGridAreasInput(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-2 border border-[rgba(15,0,0,0.15)] font-mono bg-[#fdfcfc]"
                    placeholder={'"header header"\n"main sidebar"'}
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
                    <span>{isKo ? '실시간 CSS 그리드 렌더링 미리보기' : 'Live Visual Grid Preview'}</span>
                  </span>
                  <button
                    onClick={() => {
                      const cssCode = `display: grid;\ngrid-template-columns: ${gridColsInput};\ngrid-template-rows: ${gridRowsInput};\ngap: ${gridGapInput};\n${gridAreasInput ? `grid-template-areas:\n${gridAreasInput};` : ''}`;
                      navigator.clipboard.writeText(cssCode);
                      copyNotification(cssCode, isKo ? 'CSS 복사됨' : 'CSS Copied');
                    }}
                    className="px-2 py-1 text-[10px] font-bold border border-[rgba(15,0,0,0.15)] bg-white hover:bg-[#201d1d] hover:text-white rounded-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={12} />
                    <span>{isKo ? 'CSS 복사' : 'Copy CSS'}</span>
                  </button>
                </h3>

                {/* Render container */}
                <div className="flex-1 min-h-[300px] border border-dashed border-[rgba(15,0,0,0.2)] p-4 bg-[#fdfcfc] flex items-center justify-center overflow-auto">
                  <div 
                    className="w-full h-full min-h-[260px] grid"
                    style={{
                      gridTemplateColumns: gridColsInput,
                      gridTemplateRows: gridRowsInput,
                      gap: gridGapInput,
                      gridTemplateAreas: gridAreasInput || undefined
                    }}
                  >
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-300 bg-slate-100/60 p-2 flex items-center justify-center font-bold text-xs text-slate-700"
                      >
                        #{idx + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-4 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span>SNSHero Revolution Grid Tools</span>
          <span>·</span>
          <span className="text-emerald-700 font-bold">/tool/checkgrid</span>
        </div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <button 
            onClick={() => onNavigate('home')} 
            className="hover:underline cursor-pointer"
          >
            {isKo ? '게임 로비로 돌아가기' : 'Return to Lobby'}
          </button>
        </div>
      </footer>
    </div>
  );
};
