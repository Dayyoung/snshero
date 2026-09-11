import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Link as LinkIcon, 
  Download, 
  RotateCcw, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff, 
  Grid3X3, 
  MousePointer, 
  AlertTriangle,
  Scissors,
  CheckCircle2
} from 'lucide-react';
import { ViewType, Language } from '../types';
import { cn } from '../lib/utils';

interface GridCheckerViewProps {
  language?: Language;
  onNavigate: (view: ViewType) => void;
}

interface CellSlot {
  index: number;   // 0 ~ 99
  row: number;     // 0 ~ 9
  col: number;     // 0 ~ 9
  dataUrl: string; // 쪼개진 개별 이미지 조각
  scale: number;   // 개별 확대/축소 배율 (기본 1.0)
  offsetX: number; // 개별 X 오프셋 (px)
  offsetY: number; // 개별 Y 오프셋 (px)
}

interface DrawGridOptions {
  totalW: number;
  totalH: number;
  gridCols: number;
  gridRows: number;
  cellW: number;
  cellH: number;
  gridColor: string;
  gridLineWidth: number;
  showCellNumbers: boolean;
}

/**
 * 프리뷰 캔버스와 검수본 저장 이미지 모두에서 100% 동일하게 호출되는 공통 고정밀 그리드 렌더링 함수
 */
const drawInspectionGridOnCanvas = (ctx: CanvasRenderingContext2D, opts: DrawGridOptions) => {
  const {
    gridCols,
    gridRows,
    cellW,
    cellH,
    gridColor,
    gridLineWidth,
    showCellNumbers
  } = opts;

  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = gridLineWidth;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const idx = r * gridCols + c;
      const x = c * cellW;
      const y = r * cellH;

      // 1. 격자 셀 테두리 스트로크
      ctx.strokeRect(x, y, cellW, cellH);

      // 2. 셀 인덱스 번호 (#1 ~ #N) 렌더링
      if (showCellNumbers) {
        ctx.save();
        const fontSize = Math.max(10, Math.min(26, Math.round(Math.min(cellW, cellH) * 0.16)));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const textX = x + Math.max(4, cellW * 0.04);
        const textY = y + Math.max(4, cellH * 0.04);
        const textStr = `#${idx + 1}`;

        // 검은색 그림자 외곽선
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(2, fontSize * 0.22);
        ctx.strokeText(textStr, textX, textY);

        // 본문 텍스트 채우기
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = gridColor;
        ctx.fillText(textStr, textX, textY);
        ctx.restore();
      }
    }
  }

  ctx.restore();
};

export const GridCheckerView: React.FC<GridCheckerViewProps> = ({
  language = 'ko',
  onNavigate
}) => {
  const isKo = language === 'ko';

  // 기본 10x10 규격
  const gridCols = 10;
  const gridRows = 10;
  const totalCells = 100;

  // 100개 개별 슬롯 배열 상태
  const [cellSlots, setCellSlots] = useState<CellSlot[]>([]);
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(0);

  // 이미지 메타데이터
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 1000, height: 1000 });
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // 뷰어 줌 레벨 (%)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // 드래그 조작 상태
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number; index: number } | null>(null);

  // 마우스 호버 셀
  const [hoveredCellIndex, setHoveredCellIndex] = useState<number | null>(null);

  // 그리드 및 번호 토글
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showCellNumbers, setShowCellNumbers] = useState<boolean>(true);
  const gridColor = '#10b981';
  const gridLineWidth = 1;

  // Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewGridCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 계산된 셀 규격
  const cellW = useMemo(() => imageDimensions.width / gridCols, [imageDimensions.width, gridCols]);
  const cellH = useMemo(() => imageDimensions.height / gridRows, [imageDimensions.height, gridRows]);

  // ── 원본 이미지를 100개 셀로 자동 분할(Slice)하는 함수 ──
  const processAndSliceImage = useCallback((img: HTMLImageElement, fileName: string) => {
    const totalW = img.naturalWidth || 1000;
    const totalH = img.naturalHeight || 1000;
    const cW = totalW / gridCols;
    const cH = totalH / gridRows;

    setImageDimensions({ width: totalW, height: totalH });
    setImageFileName(fileName);

    const offscreen = document.createElement('canvas');
    offscreen.width = cW;
    offscreen.height = cH;
    const offCtx = offscreen.getContext('2d');

    const newSlots: CellSlot[] = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const idx = r * gridCols + c;
        const srcX = c * cW;
        const srcY = r * cH;

        if (offCtx) {
          offCtx.clearRect(0, 0, cW, cH);
          offCtx.drawImage(
            img,
            srcX, srcY, cW, cH,
            0, 0, cW, cH
          );
        }

        newSlots.push({
          index: idx,
          row: r,
          col: c,
          dataUrl: offscreen.toDataURL('image/png'),
          scale: 1.0,
          offsetX: 0,
          offsetY: 0
        });
      }
    }

    setCellSlots(newSlots);
    setSelectedCellIndex(0);
    setImageError(null);
    setImageLoading(false);
  }, [gridCols, gridRows]);

  // 10x10 기본 번호 패턴 데모 생성 함수
  const generate10x10TestPattern = useCallback(() => {
    setImageLoading(true);
    const canvas = document.createElement('canvas');
    const size = 1000;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cW = size / 10;
    const cH = size / 10;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const idx = r * 10 + c + 1;
        const x = c * cW;
        const y = r * cH;

        ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#334155';
        ctx.fillRect(x + 1, y + 1, cW - 2, cH - 2);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${idx}`, x + cW / 2, y + cH / 2 - 8);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(`R${r + 1}:C${c + 1}`, x + cW / 2, y + cH / 2 + 14);
      }
    }

    const img = new Image();
    img.onload = () => {
      processAndSliceImage(img, '10x10_Standard_Test_Pattern.png');
    };
    img.src = canvas.toDataURL('image/png');
  }, [processAndSliceImage]);

  // 초기 마운트 시 10x10 기본 패턴 로드
  useEffect(() => {
    generate10x10TestPattern();
  }, [generate10x10TestPattern]);

  // 파일 로드 핸들러
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError(isKo ? '이미지 파일만 업로드할 수 있습니다.' : 'Only image files are supported.');
      return;
    }

    setImageLoading(true);
    setImageError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        processAndSliceImage(img, file.name);
      };
      img.onerror = () => {
        setImageError(isKo ? '이미지 로드에 실패했습니다.' : 'Failed to load image.');
        setImageLoading(false);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // URL 이미지 로드
  const handleLoadUrl = (targetUrl?: string) => {
    const url = (targetUrl || urlInput).trim();
    if (!url) return;

    setImageLoading(true);
    setImageError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      processAndSliceImage(img, url.split('/').pop() || 'remote-image.png');
    };
    img.onerror = () => {
      setImageError(isKo ? 'CORS 제약 또는 잘못된 주소로 이미지를 불러오지 못했습니다.' : 'Failed to load image from URL.');
      setImageLoading(false);
    };
    img.src = url;
  };

  // 드래그 앤 드롭 파일 로드
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

  // ── 프리뷰 그리드 캔버스 렌더링 ──
  useEffect(() => {
    const canvas = previewGridCanvasRef.current;
    if (!canvas) return;
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGridOverlay) {
      drawInspectionGridOnCanvas(ctx, {
        totalW: imageDimensions.width,
        totalH: imageDimensions.height,
        gridCols,
        gridRows,
        cellW,
        cellH,
        gridColor,
        gridLineWidth,
        showCellNumbers
      });
    }
  }, [imageDimensions, gridCols, gridRows, cellW, cellH, showGridOverlay, showCellNumbers]);

  // ── 개별 셀 드래그 이동 핸들러 ──
  const handleCellPointerDown = (index: number, e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();

    setSelectedCellIndex(index);
    setIsPanning(true);

    const targetSlot = cellSlots.find(s => s.index === index);
    if (targetSlot) {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startOffsetX: targetSlot.offsetX,
        startOffsetY: targetSlot.offsetY,
        index
      };
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handleCellPointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const scaleFactor = Math.max(0.1, zoomLevel / 100);
    const realDx = dx / scaleFactor;
    const realDy = dy / scaleFactor;

    const targetIndex = dragStartRef.current.index;
    const newOffsetX = Math.round(dragStartRef.current.startOffsetX + realDx);
    const newOffsetY = Math.round(dragStartRef.current.startOffsetY + realDy);

    setCellSlots(prev => prev.map(s => {
      if (s.index === targetIndex) {
        return { ...s, offsetX: newOffsetX, offsetY: newOffsetY };
      }
      return s;
    }));
  };

  const handleCellPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      dragStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // ── 마우스 휠 스크롤로 개별 셀 이미지 확대/축소 ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // 마우스가 위치한 셀 또는 현재 선택된 셀을 대상으로 확대/축소
      const targetIdx = hoveredCellIndex !== null ? hoveredCellIndex : selectedCellIndex;
      if (targetIdx === null) return;

      e.preventDefault();
      e.stopPropagation();

      const step = e.deltaY < 0 ? 0.05 : -0.05;
      setCellSlots(prev => prev.map(s => {
        if (s.index === targetIdx) {
          const nextScale = Math.min(4.0, Math.max(0.1, Number((s.scale + step).toFixed(2))));
          return { ...s, scale: nextScale };
        }
        return s;
      }));
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, [hoveredCellIndex, selectedCellIndex]);

  // ── 키보드 방향키로 선택된 셀 정밀 이동 (1px / Shift 10px) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCellIndex === null) return;
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else return;

      e.preventDefault();
      setCellSlots(prev => prev.map(s => {
        if (s.index === selectedCellIndex) {
          return { ...s, offsetX: s.offsetX + dx, offsetY: s.offsetY + dy };
        }
        return s;
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCellIndex]);

  // ── 선택된 셀 리셋 ──
  const handleResetSelectedCell = () => {
    if (selectedCellIndex === null) return;
    setCellSlots(prev => prev.map(s => {
      if (s.index === selectedCellIndex) {
        return { ...s, scale: 1.0, offsetX: 0, offsetY: 0 };
      }
      return s;
    }));
  };

  // ── 100개 전체 셀 일괄 리셋 ──
  const handleResetAllCells = () => {
    setCellSlots(prev => prev.map(s => ({
      ...s,
      scale: 1.0,
      offsetX: 0,
      offsetY: 0
    })));
  };

  // ── 100개 셀 합성 이미지 저장 (검수본 또는 최적화 이미지) ──
  const handleDownloadImage = async (includeGrid: boolean) => {
    if (cellSlots.length === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 100개 이미지 비동기 로드 및 캔버스 합성
    const drawPromises = cellSlots.map(slot => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          // 개별 셀 경계 클리핑 (인접 셀 침범 방지)
          const cellLeft = slot.col * cellW;
          const cellTop = slot.row * cellH;
          ctx.beginPath();
          ctx.rect(cellLeft, cellTop, cellW, cellH);
          ctx.clip();

          // 조정된 크기 및 위치로 셀 이미지 렌더링
          const drawnW = cellW * slot.scale;
          const drawnH = cellH * slot.scale;
          const drawnX = cellLeft + (cellW - drawnW) / 2 + slot.offsetX;
          const drawnY = cellTop + (cellH - drawnH) / 2 + slot.offsetY;

          ctx.drawImage(img, drawnX, drawnY, drawnW, drawnH);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = slot.dataUrl;
      });
    });

    await Promise.all(drawPromises);

    // 검수본 저장 시 공통 그리드 및 번호 합성
    if (includeGrid && showGridOverlay) {
      drawInspectionGridOnCanvas(ctx, {
        totalW: imageDimensions.width,
        totalH: imageDimensions.height,
        gridCols,
        gridRows,
        cellW,
        cellH,
        gridColor,
        gridLineWidth,
        showCellNumbers
      });
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const baseName = imageFileName ? imageFileName.replace(/\.[^/.]+$/, '') : 'sheet';
      a.download = includeGrid
        ? `grid_checked_10x10_${baseName}.png`
        : `optimized_10x10_${baseName}.png`;
      a.click();
    } catch (err) {
      setImageError(isKo ? '이미지 저장 중 오류가 발생했습니다.' : 'Failed to export image.');
    }
  };

  const selectedSlot = useMemo(() => {
    if (selectedCellIndex === null) return null;
    return cellSlots.find(s => s.index === selectedCellIndex) || null;
  }, [cellSlots, selectedCellIndex]);

  return (
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col selection:bg-amber-100">
      {/* ── Top Header & Action Toolbar ── */}
      <header className="sticky top-0 z-30 bg-[#fdfcfc]/95 backdrop-blur-md border-b border-[rgba(15,0,0,0.12)] px-4 py-2.5">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Brand & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="px-2.5 py-1.5 border border-[rgba(15,0,0,0.15)] bg-white hover:bg-[#201d1d]/5 rounded-sm text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>{isKo ? '[← 홈으로]' : '[← HOME]'}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-tight flex items-center gap-1.5">
                <Grid3X3 size={16} className="text-emerald-700" />
                <span>{isKo ? '100개 개별 그리드 검수기' : '100 Slots Grid Inspector'}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold rounded-xs flex items-center gap-1">
                <Scissors size={10} className="text-emerald-700" />
                <span>100분할 독립 조작</span>
              </span>
            </div>
          </div>

          {/* Center: Image Load Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-[rgba(15,0,0,0.2)] text-xs font-bold rounded-sm transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Upload size={13} className="text-emerald-700" />
              <span>{isKo ? '파일 열기' : 'Open File'}</span>
            </button>

            {/* URL Input */}
            <div className="flex items-center border border-[rgba(15,0,0,0.2)] rounded-sm overflow-hidden bg-white">
              <div className="pl-2 pr-1 text-slate-400">
                <LinkIcon size={12} />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
                placeholder={isKo ? '이미지 URL 입력...' : 'Image URL...'}
                className="w-36 sm:w-44 py-1 pr-2 text-xs bg-transparent focus:outline-none"
              />
              <button
                onClick={() => handleLoadUrl()}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] font-bold border-l border-[rgba(15,0,0,0.15)] cursor-pointer"
              >
                {isKo ? '로드' : 'Load'}
              </button>
            </div>

            <button
              onClick={generate10x10TestPattern}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm border border-slate-300 transition-colors cursor-pointer flex items-center gap-1"
              title={isKo ? '10x10 기본 테스트 번호 패턴 로드' : 'Load 10x10 Test Pattern'}
            >
              <Sparkles size={12} className="text-amber-600" />
              <span>{isKo ? '10x10 패턴' : '10x10 Pattern'}</span>
            </button>

            {/* Reset Buttons */}
            {selectedSlot && (selectedSlot.scale !== 1.0 || selectedSlot.offsetX !== 0 || selectedSlot.offsetY !== 0) && (
              <button
                onClick={handleResetSelectedCell}
                className="px-2 py-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-sm font-bold cursor-pointer flex items-center gap-1"
                title={isKo ? '선택된 셀 크기/위치 초기화' : 'Reset Selected Cell'}
              >
                <RotateCcw size={12} />
                <span>{isKo ? `#${selectedSlot.index + 1} 셀 리셋` : 'Reset Cell'}</span>
              </button>
            )}

            <button
              onClick={handleResetAllCells}
              className="px-2 py-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-sm font-bold cursor-pointer flex items-center gap-1"
              title={isKo ? '100개 전체 셀 위치 및 배율 초기화' : 'Reset All 100 Cells'}
            >
              <span>{isKo ? '전체 리셋' : 'Reset All'}</span>
            </button>
          </div>

          {/* Right: Toggles & Save Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grid Toggle */}
            <button
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              className={cn(
                "px-2.5 py-1.5 text-xs font-bold rounded-sm border cursor-pointer flex items-center gap-1 transition-colors",
                showGridOverlay ? "bg-emerald-50 text-emerald-900 border-emerald-400" : "bg-white text-slate-500 border-slate-300"
              )}
            >
              {showGridOverlay ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>{showGridOverlay ? (isKo ? '격자 ON' : 'Grid ON') : (isKo ? '격자 OFF' : 'Grid OFF')}</span>
            </button>

            {/* Numbers Toggle */}
            <button
              onClick={() => setShowCellNumbers(!showCellNumbers)}
              className={cn(
                "px-2 py-1.5 text-xs font-bold rounded-sm border cursor-pointer transition-colors",
                showCellNumbers ? "bg-slate-100 text-slate-800 border-slate-300" : "bg-white text-slate-400 border-slate-200"
              )}
            >
              #1~#100
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-0.5 hidden sm:block" />

            {/* Clean Export */}
            <button
              onClick={() => handleDownloadImage(false)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-sm cursor-pointer flex items-center gap-1 shadow-xs"
              title={isKo ? '격자선 없는 100칸 최적화 신규 이미지 저장' : 'Save Clean Optimized Image'}
            >
              <Sparkles size={13} />
              <span>{isKo ? '최적화 이미지 저장' : 'Save Image'}</span>
            </button>

            {/* Inspected Export */}
            <button
              onClick={() => handleDownloadImage(true)}
              className="px-3 py-1.5 bg-[#201d1d] text-white hover:bg-black text-xs font-bold rounded-sm cursor-pointer flex items-center gap-1 shadow-xs"
              title={isKo ? '격자선과 번호가 합성된 검수본 이미지 다운로드' : 'Download Inspected Image with Grid'}
            >
              <Download size={13} />
              <span>{isKo ? '검수본 저장' : 'Save with Grid'}</span>
            </button>
          </div>

        </div>

        {/* Alert Notification */}
        {imageError && (
          <div className="max-w-[1700px] mx-auto mt-2 p-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-700 shrink-0" />
              <span>{imageError}</span>
            </div>
            <button onClick={() => setImageError(null)} className="text-slate-500 hover:text-black font-bold">×</button>
          </div>
        )}
      </header>

      {/* ── Main Canvas Workspace ── */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 bg-[#0f172a] relative overflow-hidden select-none">
        
        {/* Floating Instruction & Zoom Control */}
        <div className="flex items-center justify-between gap-3 mb-2 px-2 text-xs">
          
          {/* Active Cell Info Badge */}
          <div className="flex items-center gap-2">
            {selectedSlot ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 rounded-xs text-[11px] font-bold shadow-xs">
                <MousePointer size={12} className="animate-pulse text-cyan-400" />
                <span className="text-cyan-200">
                  {isKo ? `[#${selectedSlot.index + 1}번 셀 선택됨]` : `[Cell #${selectedSlot.index + 1} Selected]`}
                </span>
                <span className="text-cyan-400 font-mono">
                  배율:{Math.round(selectedSlot.scale * 100)}% · 위치(X:{selectedSlot.offsetX}px, Y:{selectedSlot.offsetY}px)
                </span>
                <span className="text-[10px] text-cyan-400/70 border-l border-cyan-700/60 pl-2 hidden sm:inline">
                  {isKo ? '마우스 드래그: 이동 · 휠: 확대/축소 · 방향키: 1px' : 'Drag: Pan · Wheel: Zoom · Arrows: 1px'}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1 bg-slate-800/80 text-slate-300 border border-slate-600 rounded-xs text-[11px]">
                {isKo ? '칸을 클릭하여 개별 이미지를 선택하세요' : 'Click any slot to select and manipulate'}
              </div>
            )}
          </div>

          {/* Canvas View Zoom */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-sm text-slate-200">
            <button
              onClick={() => setZoomLevel(prev => Math.max(25, prev - 25))}
              className="p-1 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer"
              title={isKo ? '뷰 축소' : 'Zoom Out'}
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[11px] font-mono font-bold w-12 text-center text-emerald-400">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(400, prev + 25))}
              className="p-1 hover:text-white hover:bg-slate-800 rounded-xs cursor-pointer"
              title={isKo ? '뷰 확대' : 'Zoom In'}
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 rounded-xs cursor-pointer ml-1"
            >
              100%
            </button>
          </div>
        </div>

        {/* ── 100개 개별 슬롯 그리드 캔버스 컨테이너 ── */}
        <div 
          ref={containerRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCellIndex(null);
            }
          }}
          className={cn(
            "flex-1 w-full border border-dashed border-slate-700 p-4 min-h-[500px] overflow-auto flex items-center justify-center relative select-none rounded-none touch-none",
            isDraggingFile ? "bg-emerald-950/30 border-emerald-500" : "bg-[#131b2e]"
          )}
        >
          {isDraggingFile && (
            <div className="absolute inset-0 bg-emerald-950/80 border-4 border-dashed border-emerald-400 z-50 flex flex-col items-center justify-center text-white">
              <Upload size={48} className="animate-bounce mb-3 text-emerald-400" />
              <span className="text-base font-bold">{isKo ? '여기에 이미지 파일을 드롭하세요' : 'Drop Image File Here'}</span>
            </div>
          )}

          {cellSlots.length > 0 ? (
            /* 10x10 전체 그리드 뷰포트 */
            <div 
              className="relative transition-transform origin-center overflow-hidden border border-slate-600 bg-slate-950 shadow-2xl shrink-0"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                width: `${imageDimensions.width}px`,
                height: `${imageDimensions.height}px`
              }}
            >
              {/* ── 100개 개별 슬롯 렌더링 (각 슬롯별 독립 드래그 이동 및 휠 확대축소) ── */}
              <div 
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, ${cellW}px)`,
                  gridTemplateRows: `repeat(${gridRows}, ${cellH}px)`,
                }}
              >
                {cellSlots.map(slot => {
                  const isSelected = selectedCellIndex === slot.index;
                  const drawnW = cellW * slot.scale;
                  const drawnH = cellH * slot.scale;
                  const drawnX = (cellW - drawnW) / 2 + slot.offsetX;
                  const drawnY = (cellH - drawnH) / 2 + slot.offsetY;

                  return (
                    <div
                      key={slot.index}
                      onPointerDown={(e) => handleCellPointerDown(slot.index, e)}
                      onPointerMove={handleCellPointerMove}
                      onPointerUp={handleCellPointerUp}
                      onPointerCancel={handleCellPointerUp}
                      onMouseEnter={() => setHoveredCellIndex(slot.index)}
                      onMouseLeave={() => setHoveredCellIndex(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCellIndex(slot.index);
                      }}
                      className={cn(
                        "relative overflow-hidden transition-none select-none",
                        isSelected ? "z-20 cursor-grabbing" : "cursor-grab hover:bg-white/5"
                      )}
                      style={{
                        width: `${cellW}px`,
                        height: `${cellH}px`
                      }}
                    >
                      {/* 개별 쪼개진 이미지 */}
                      <img
                        src={slot.dataUrl}
                        alt={`Cell ${slot.index + 1}`}
                        draggable={false}
                        className="absolute max-w-none pointer-events-none select-none"
                        style={{
                          width: `${drawnW}px`,
                          height: `${drawnH}px`,
                          left: `${drawnX}px`,
                          top: `${drawnY}px`
                        }}
                      />

                      {/* ── 선택된 셀 활성화 테두리 & 모서리 핸들 ── */}
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)] pointer-events-none">
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-cyan-500" />
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-cyan-500" />
                          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-cyan-500" />
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-cyan-500" />
                          <span className="absolute top-1 left-1 px-1 bg-black/80 text-cyan-300 font-mono font-black text-[9px] rounded-2xs">
                            #{slot.index + 1}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── 고정밀 10x10 격자선 및 번호 오버레이 (검수본 저장과 100% 동일) ── */}
              {showGridOverlay && (
                <canvas
                  ref={previewGridCanvasRef}
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                  className="absolute inset-0 pointer-events-none select-none z-10"
                  style={{
                    width: `${imageDimensions.width}px`,
                    height: `${imageDimensions.height}px`,
                  }}
                />
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
              <Upload size={36} className="mb-2 opacity-50" />
              <span>{isKo ? '상단에서 이미지 파일을 열거나 드롭하세요' : 'Open or drop image file above'}</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2">
          <span>
            {imageFileName ? `${imageFileName} (${imageDimensions.width}×${imageDimensions.height}px)` : '100개 슬롯 분할'}
            {selectedSlot && ` · 현재 선택: #${selectedSlot.index + 1} (배율: ${Math.round(selectedSlot.scale * 100)}%, X:${selectedSlot.offsetX}px, Y:${selectedSlot.offsetY}px)`}
          </span>
          <span className="text-emerald-400 font-bold">
            {isKo ? '각 칸의 이미지를 클릭/드래그하여 개별 위치 및 크기를 조절한 뒤 저장하세요.' : 'Adjust each slot independently and save.'}
          </span>
        </div>
      </main>
    </div>
  );
};
