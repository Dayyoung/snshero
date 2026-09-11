import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Hand, 
  MousePointer, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import { ViewType, Language } from '../types';
import { cn } from '../lib/utils';

interface GridCheckerViewProps {
  language?: Language;
  onNavigate: (view: ViewType) => void;
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

        // 어떤 이미지 배경에서도 뚜렷하게 식별되도록 검은색 그림자 외곽선 스트로크
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

  // 그리드 규격 (기본 10x10)
  const [gridCols, setGridCols] = useState<number>(10);
  const [gridRows, setGridRows] = useState<number>(10);

  // 이미지 상태
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // 뷰어 줌 레벨 (캔버스 뷰 확대/축소)
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // ── 원본 이미지 변환 상태 (확대/축소 및 상하좌우 이동) ──
  const [imageScale, setImageScale] = useState<number>(1.0); // 1.0 = 100%
  const [imageOffsetX, setImageOffsetX] = useState<number>(0); // px
  const [imageOffsetY, setImageOffsetY] = useState<number>(0); // px
  
  // ── 원본 이미지 선택 상태 (선택 시에만 이동/확대축소 조작 가능) ──
  const [isImageSelected, setIsImageSelected] = useState<boolean>(true);
  const [isPanningImage, setIsPanningImage] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number } | null>(null);

  // 그리드 옵션
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showCellNumbers, setShowCellNumbers] = useState<boolean>(true);
  const gridColor = '#10b981'; // 선명한 에메랄드 그린
  const gridLineWidth = 1;

  // Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewGridCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 10x10 기본 번호 패턴 캔버스 생성 함수 (초기 로드 데모)
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

        // 셀 배경 교차 색상
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#334155';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

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
    setImageScale(1.0);
    setImageOffsetX(0);
    setImageOffsetY(0);
    setIsImageSelected(true);
    setImageError(null);
  };

  // 초기 마운트 시 10x10 기본 데모 패턴 로드
  useEffect(() => {
    generate10x10TestPattern();
  }, []);

  // 클립보드 붙여넣기 (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
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
  }, []);

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
        setImageScale(1.0);
        setImageOffsetX(0);
        setImageOffsetY(0);
        setIsImageSelected(true);
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
      setImageScale(1.0);
      setImageOffsetX(0);
      setImageOffsetY(0);
      setIsImageSelected(true);
      setImageLoading(false);
    };
    img.onerror = () => {
      setLoadedImageSrc(url);
      setImageFileName(url.split('/').pop() || 'remote-image.png');
      setImageNaturalSize({ width: 1000, height: 1000 });
      setImageScale(1.0);
      setImageOffsetX(0);
      setImageOffsetY(0);
      setIsImageSelected(true);
      setImageLoading(false);
      setImageError(isKo ? '외부 이미지 로드 완료 (CORS 도메인 제한 가능성 있음).' : 'External image loaded.');
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

  // 그리드 및 셀 크기 계산
  const cellCalculations = useMemo(() => {
    const totalW = imageNaturalSize?.width || 1000;
    const totalH = imageNaturalSize?.height || 1000;
    const cellW = Math.max(1, totalW / gridCols);
    const cellH = Math.max(1, totalH / gridRows);

    return {
      totalW,
      totalH,
      cellW: Number(cellW.toFixed(2)),
      cellH: Number(cellH.toFixed(2)),
      totalCells: gridCols * gridRows
    };
  }, [imageNaturalSize, gridCols, gridRows]);

  // 원본 이미지 렌더링 좌표 및 크기 계산
  const imageDrawParams = useMemo(() => {
    const totalW = cellCalculations.totalW;
    const totalH = cellCalculations.totalH;
    const drawnW = totalW * imageScale;
    const drawnH = totalH * imageScale;
    const drawnX = (totalW - drawnW) / 2 + imageOffsetX;
    const drawnY = (totalH - drawnH) / 2 + imageOffsetY;

    return {
      totalW,
      totalH,
      drawnW: Math.round(drawnW),
      drawnH: Math.round(drawnH),
      drawnX: Math.round(drawnX),
      drawnY: Math.round(drawnY)
    };
  }, [cellCalculations.totalW, cellCalculations.totalH, imageScale, imageOffsetX, imageOffsetY]);

  // ── 프리뷰 그리드 캔버스 실시간 렌더링 ──
  useEffect(() => {
    const canvas = previewGridCanvasRef.current;
    if (!canvas) return;
    canvas.width = cellCalculations.totalW;
    canvas.height = cellCalculations.totalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGridOverlay) {
      drawInspectionGridOnCanvas(ctx, {
        totalW: cellCalculations.totalW,
        totalH: cellCalculations.totalH,
        gridCols,
        gridRows,
        cellW: cellCalculations.cellW,
        cellH: cellCalculations.cellH,
        gridColor,
        gridLineWidth,
        showCellNumbers
      });
    }
  }, [cellCalculations, gridCols, gridRows, showGridOverlay, showCellNumbers]);

  // ── 이미지 저장 핸들러 (검수본 또는 순수 최적화 이미지) ──
  const handleDownloadImage = (includeGrid: boolean) => {
    if (!loadedImageSrc || !imageNaturalSize) return;
    const canvas = document.createElement('canvas');
    canvas.width = cellCalculations.totalW;
    canvas.height = cellCalculations.totalH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. 투명 클리어
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. 조정된 크기 및 오프셋으로 원본 이미지 렌더링
      ctx.drawImage(
        img,
        imageDrawParams.drawnX,
        imageDrawParams.drawnY,
        imageDrawParams.drawnW,
        imageDrawParams.drawnH
      );

      // 3. 검수본 저장 시 프리뷰와 100% 동일한 함수로 그리드 합성
      if (includeGrid && showGridOverlay) {
        drawInspectionGridOnCanvas(ctx, {
          totalW: cellCalculations.totalW,
          totalH: cellCalculations.totalH,
          gridCols,
          gridRows,
          cellW: cellCalculations.cellW,
          cellH: cellCalculations.cellH,
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
          ? `grid_checked_${gridCols}x${gridRows}_${baseName}.png`
          : `optimized_${gridCols}x${gridRows}_${baseName}.png`;
        a.click();
      } catch (err) {
        setImageError(isKo ? 'CORS 제약으로 인해 다운로드가 차단되었습니다. 로컬 파일 업로드를 이용해 주세요.' : 'Download blocked due to CORS.');
      }
    };
    img.src = loadedImageSrc;
  };

  const handleDownloadFullInspectedImage = () => handleDownloadImage(true);
  const handleDownloadCleanOptimizedImage = () => handleDownloadImage(false);

  // ── 원본 이미지 드래그 이동 핸들러 (선택 시에만 이동 가능) ──
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    // 원본 이미지 선택 활성화 및 드래그 시작
    setIsImageSelected(true);
    setIsPanningImage(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: imageOffsetX,
      startOffsetY: imageOffsetY
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanningImage || !dragStartRef.current || !isImageSelected) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const scaleFactor = Math.max(0.1, zoomLevel / 100);
    const realDx = dx / scaleFactor;
    const realDy = dy / scaleFactor;

    setImageOffsetX(Math.round(dragStartRef.current.startOffsetX + realDx));
    setImageOffsetY(Math.round(dragStartRef.current.startOffsetY + realDy));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanningImage) {
      setIsPanningImage(false);
      dragStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // ── 마우스 휠 스크롤 시 원본 이미지 확대/축소 (선택된 상태일 때만 동작) ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // 이미지가 선택되어 있을 때만 원본 이미지 스케일 조절
      if (!isImageSelected) return;

      e.preventDefault();
      e.stopPropagation();

      const step = e.deltaY < 0 ? 0.05 : -0.05;
      setImageScale(prev => {
        const next = Number((prev + step).toFixed(2));
        return Math.min(5.0, Math.max(0.1, next));
      });
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, [isImageSelected]);

  // ── 키보드 방향키(↑, ↓, ←, →)로 선택된 원본 이미지 정밀 이동 (선택 시에만) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (!isImageSelected) return;

      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setImageOffsetY(prev => prev - step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setImageOffsetY(prev => prev + step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setImageOffsetX(prev => prev - step);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setImageOffsetX(prev => prev + step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageSelected]);

  return (
    <div className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col selection:bg-amber-100">
      {/* ── Top Header & Slim Action Toolbar ── */}
      <header className="sticky top-0 z-30 bg-[#fdfcfc]/95 backdrop-blur-md border-b border-[rgba(15,0,0,0.12)] px-4 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Brand & Navigation */}
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
                <span>{isKo ? '그리드 검수기' : 'Grid Checker'}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold rounded-xs">
                {gridCols}×{gridRows}
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

            {/* URL Load Input */}
            <div className="flex items-center border border-[rgba(15,0,0,0.2)] rounded-sm overflow-hidden bg-white">
              <div className="pl-2 pr-1 text-slate-400">
                <LinkIcon size={12} />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
                placeholder={isKo ? '이미지 URL 주소...' : 'Image URL...'}
                className="w-36 sm:w-48 py-1 pr-2 text-xs bg-transparent focus:outline-none"
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

            {/* Reset Transform */}
            {(imageScale !== 1.0 || imageOffsetX !== 0 || imageOffsetY !== 0) && (
              <button
                onClick={() => {
                  setImageScale(1.0);
                  setImageOffsetX(0);
                  setImageOffsetY(0);
                }}
                className="px-2 py-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-sm font-bold cursor-pointer flex items-center gap-1"
                title={isKo ? '원본 이미지 크기 및 위치 초기화' : 'Reset Transform'}
              >
                <RotateCcw size={12} />
                <span>{isKo ? '위치 리셋' : 'Reset'}</span>
              </button>
            )}
          </div>

          {/* Right: Grid Toggles & Save Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Grid Toggle */}
            <button
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              className={cn(
                "px-2.5 py-1.5 text-xs font-bold rounded-sm border cursor-pointer flex items-center gap-1 transition-colors",
                showGridOverlay ? "bg-emerald-50 text-emerald-900 border-emerald-400" : "bg-white text-slate-500 border-slate-300"
              )}
              title={isKo ? '그리드 오버레이 켜기/끄기' : 'Toggle Grid'}
            >
              {showGridOverlay ? <Eye size={12} /> : <EyeOff size={12} />}
              <span>{showGridOverlay ? (isKo ? '격자 ON' : 'Grid ON') : (isKo ? '격자 OFF' : 'Grid OFF')}</span>
            </button>

            {/* Number Toggle */}
            <button
              onClick={() => setShowCellNumbers(!showCellNumbers)}
              className={cn(
                "px-2 py-1.5 text-xs font-bold rounded-sm border cursor-pointer transition-colors",
                showCellNumbers ? "bg-slate-100 text-slate-800 border-slate-300" : "bg-white text-slate-400 border-slate-200"
              )}
              title={isKo ? '셀 번호 (#1~#100) 표시 토글' : 'Toggle Cell Numbers'}
            >
              #1~#100
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-0.5 hidden sm:block" />

            {/* Clean Optimized Image Save */}
            <button
              onClick={handleDownloadCleanOptimizedImage}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-sm cursor-pointer flex items-center gap-1 shadow-xs"
              title={isKo ? '격자선 없는 100칸 최적화 신규 이미지 저장' : 'Save Clean Optimized Image (No Grid)'}
            >
              <Sparkles size={13} />
              <span>{isKo ? '최적화 이미지 저장' : 'Save Image'}</span>
            </button>

            {/* Full Inspected Image Save */}
            <button
              onClick={handleDownloadFullInspectedImage}
              className="px-3 py-1.5 bg-[#201d1d] text-white hover:bg-black text-xs font-bold rounded-sm cursor-pointer flex items-center gap-1 shadow-xs"
              title={isKo ? '격자선 합성 검수본 이미지 다운로드' : 'Download Inspected Image with Grid'}
            >
              <Download size={13} />
              <span>{isKo ? '검수본 저장' : 'Save with Grid'}</span>
            </button>
          </div>

        </div>

        {/* Error Alert */}
        {imageError && (
          <div className="max-w-[1600px] mx-auto mt-2 p-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-700 shrink-0" />
              <span>{imageError}</span>
            </div>
            <button onClick={() => setImageError(null)} className="text-slate-500 hover:text-black font-bold">×</button>
          </div>
        )}
      </header>

      {/* ── Main Canvas Workspace (오직 그리드와 원본이미지 전용) ── */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 bg-[#0f172a] relative overflow-hidden select-none">
        
        {/* Floating Instruction & Zoom Bar */}
        <div className="flex items-center justify-between gap-3 mb-2 px-2 text-xs">
          
          {/* Status Badge: Image Selection Status */}
          <div className="flex items-center gap-2">
            {isImageSelected ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 rounded-xs text-[11px] font-bold shadow-xs">
                <MousePointer size={12} className="animate-pulse text-cyan-400" />
                <span>{isKo ? '원본 이미지 선택됨 · 드래그: 이동 · 휠: 확대/축소' : 'Image Selected · Drag: Move · Wheel: Zoom'}</span>
                <span className="text-[10px] text-cyan-400/80 font-mono ml-1">
                  ({Math.round(imageScale * 100)}% · X:{imageOffsetX} Y:{imageOffsetY})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 text-slate-300 border border-slate-600 rounded-xs text-[11px]">
                <Hand size={12} />
                <span>{isKo ? '원본 이미지를 클릭/드래그하여 선택하세요' : 'Click/drag original image to select and move'}</span>
              </div>
            )}
          </div>

          {/* Viewer Zoom Level */}
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

        {/* ── Central Viewer Box ── */}
        <div 
          ref={containerRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            // 배경 빈 곳 클릭 시 선택 해제
            if (e.target === e.currentTarget) {
              setIsImageSelected(false);
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

          {loadedImageSrc ? (
            /* 10x10 격자 기준 프레임 (그리드 프레임 박스) */
            <div 
              className="relative transition-transform origin-center overflow-hidden border border-slate-600 bg-slate-950 shadow-2xl shrink-0"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                width: `${cellCalculations.totalW}px`,
                height: `${cellCalculations.totalH}px`
              }}
            >
              {/* ── 원본 이미지 레이어 (선택 시 드래그 이동 및 휠 확대축소) ── */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageSelected(true);
                }}
                className={cn(
                  "absolute transition-none select-none",
                  isPanningImage ? "cursor-grabbing" : "cursor-grab"
                )}
                style={{
                  width: `${imageDrawParams.drawnW}px`,
                  height: `${imageDrawParams.drawnH}px`,
                  left: `${imageDrawParams.drawnX}px`,
                  top: `${imageDrawParams.drawnY}px`,
                }}
              >
                {/* 실제 원본 이미지 */}
                <img
                  src={loadedImageSrc}
                  alt="Original Loaded Sheet"
                  draggable={false}
                  className="w-full h-full object-fill pointer-events-none select-none"
                />

                {/* ── 선택 시 나타나는 직관적인 바운딩 박스 & 모서리 핸들 ── */}
                {isImageSelected && (
                  <div className="absolute inset-0 border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] pointer-events-none">
                    {/* 4개 모서리 핸들 박스 */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500" />
                  </div>
                )}
              </div>

              {/* ── 고정된 고정밀 그리드 오버레이 (검수본 저장과 100% 동일한 캔버스) ── */}
              {showGridOverlay && (
                <canvas
                  ref={previewGridCanvasRef}
                  width={cellCalculations.totalW}
                  height={cellCalculations.totalH}
                  className="absolute inset-0 pointer-events-none select-none z-10"
                  style={{
                    width: `${cellCalculations.totalW}px`,
                    height: `${cellCalculations.totalH}px`,
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

        {/* Bottom Footer Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2">
          <span>{imageFileName ? `이미지: ${imageFileName} (${imageNaturalSize?.width}×${imageNaturalSize?.height}px)` : '10x10 기본 그리드'}</span>
          <span className="text-emerald-400 font-bold">
            {isKo ? '검수본 저장 시 화면의 그리드와 원본 이미지가 100% 동일하게 저장됩니다.' : 'What you see is 100% what is saved.'}
          </span>
        </div>
      </main>
    </div>
  );
};
