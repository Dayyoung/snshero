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
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { ViewType, Language } from '../types';
import { cn } from '../lib/utils';

interface GridCheckerViewProps {
  language?: Language;
  onNavigate: (view: ViewType) => void;
}

type SliceMode = 'smart-transparency' | 'grid';

interface CellSlot {
  index: number;   // 0 ~ 99
  row: number;     // 0 ~ 9
  col: number;     // 0 ~ 9
  dataUrl: string; // 잘라낸 개별 캐릭터 이미지 (온전한 무손실 이미지)
  scale: number;   // 개별 확대/축소 배율 (기본 1.0)
  offsetX: number; // 개별 X 오프셋 (px)
  offsetY: number; // 개별 Y 오프셋 (px)
  originalCropW: number; // 감지된 캐릭터 원본 폭
  originalCropH: number; // 감지된 캐릭터 원본 높이
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

  // 분할 모드: 'smart-transparency' (배경 투명도 기준 스마트 분할) vs 'grid' (단순 바둑판)
  const [sliceMode, setSliceMode] = useState<SliceMode>('smart-transparency');

  // 캐시된 원본 이미지 요소 (모드 전환 시 재분할용)
  const originalImageRef = useRef<HTMLImageElement | null>(null);

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

  // ── 배경 투명도(Alpha) 기반 무손실 스마트 분할 알고리즘 ──
  const sliceImageWithEngine = useCallback((img: HTMLImageElement, mode: SliceMode) => {
    const totalW = img.naturalWidth || 1000;
    const totalH = img.naturalHeight || 1000;
    const cW = totalW / gridCols;
    const cH = totalH / gridRows;

    // 1. 오프스크린 캔버스에 원본 이미지 그리기 및 픽셀 데이터 추출
    const masterCanvas = document.createElement('canvas');
    masterCanvas.width = totalW;
    masterCanvas.height = totalH;
    const masterCtx = masterCanvas.getContext('2d', { willReadFrequently: true });
    if (!masterCtx) return [];

    masterCtx.drawImage(img, 0, 0);
    const imgData = masterCtx.getImageData(0, 0, totalW, totalH);
    const pixels = imgData.data;

    // 2. 투명 픽셀 존재 여부 판별 (투명 배경 vs 단색 배경)
    let hasTransparency = false;
    for (let i = 3; i < Math.min(pixels.length, 200000); i += 16) {
      if (pixels[i] < 30) {
        hasTransparency = true;
        break;
      }
    }

    // 단색 배경일 경우 코너 픽셀 색상 기준 비교
    const bgR = pixels[0];
    const bgG = pixels[1];
    const bgB = pixels[2];

    const isPixelTransparent = (x: number, y: number): boolean => {
      if (x < 0 || x >= totalW || y < 0 || y >= totalH) return true;
      const idx = (y * totalW + x) * 4;
      if (hasTransparency) {
        return pixels[idx + 3] < 25; // Alpha가 25 미만이면 투명 배경
      } else {
        // 배경색과의 차이가 35 미만이면 배경으로 간주
        const diff = Math.abs(pixels[idx] - bgR) + Math.abs(pixels[idx + 1] - bgG) + Math.abs(pixels[idx + 2] - bgB);
        return diff < 35;
      }
    };

    const newSlots: CellSlot[] = [];
    const cellCanvas = document.createElement('canvas');
    cellCanvas.width = cW;
    cellCanvas.height = cH;
    const cellCtx = cellCanvas.getContext('2d');

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const idx = r * gridCols + c;
        const theoreticalLeft = c * cW;
        const theoreticalTop = r * cH;
        const cx = theoreticalLeft + cW / 2;
        const cy = theoreticalTop + cH / 2;

        if (mode === 'smart-transparency') {
          // ── 스마트 투명도 감지: 바둑판 경계선 너머 20% 마진까지 확장 검색하여 캐릭터 전체 바운딩 박스 포착 ──
          const marginX = cW * 0.20;
          const marginY = cH * 0.20;
          const searchXMin = Math.max(0, Math.floor(theoreticalLeft - marginX));
          const searchXMax = Math.min(totalW - 1, Math.ceil(theoreticalLeft + cW + marginX));
          const searchYMin = Math.max(0, Math.floor(theoreticalTop - marginY));
          const searchYMax = Math.min(totalH - 1, Math.ceil(theoreticalTop + cH + marginY));

          let minX = searchXMax;
          let maxX = searchXMin;
          let minY = searchYMax;
          let maxY = searchYMin;
          let opaquePixelCount = 0;

          // 인접 셀 중심보다 현재 셀 중심에 더 가까운 비투명(캐릭터) 픽셀 탐색
          const maxDistSq = Math.pow(cW * 0.68, 2) + Math.pow(cH * 0.68, 2);

          for (let py = searchYMin; py <= searchYMax; py += 2) {
            for (let px = searchXMin; px <= searchXMax; px += 2) {
              if (!isPixelTransparent(px, py)) {
                const distSq = Math.pow(px - cx, 2) + Math.pow(py - cy, 2);
                if (distSq <= maxDistSq) {
                  opaquePixelCount++;
                  if (px < minX) minX = px;
                  if (px > maxX) maxX = px;
                  if (py < minY) minY = py;
                  if (py > maxY) maxY = py;
                }
              }
            }
          }

          // 캐릭터 픽셀이 발견된 경우 캐릭터 바운딩 박스를 통째로 크롭 (잘림 0%)
          if (opaquePixelCount > 8 && maxX > minX && maxY > minY) {
            const pad = 3;
            const cropX = Math.max(0, minX - pad);
            const cropY = Math.max(0, minY - pad);
            const cropW = Math.min(totalW - cropX, (maxX - minX) + pad * 2);
            const cropH = Math.min(totalH - cropY, (maxY - minY) + pad * 2);

            // 잘라낸 캐릭터 이미지를 위한 오프스크린 캔버스
            const charCanvas = document.createElement('canvas');
            charCanvas.width = cropW;
            charCanvas.height = cropH;
            const charCtx = charCanvas.getContext('2d');
            if (charCtx) {
              charCtx.drawImage(
                img,
                cropX, cropY, cropW, cropH,
                0, 0, cropW, cropH
              );
            }

            // 캐릭터가 셀보다 크면 기본 축소 스케일 자동 계산 (칸 안에 안전하게 쏙 들어감)
            const autoFitScale = Math.min(
              1.0,
              (cW * 0.95) / Math.max(1, cropW),
              (cH * 0.95) / Math.max(1, cropH)
            );

            newSlots.push({
              index: idx,
              row: r,
              col: c,
              dataUrl: charCanvas.toDataURL('image/png'),
              scale: Number(autoFitScale.toFixed(2)),
              offsetX: 0,
              offsetY: 0,
              originalCropW: cropW,
              originalCropH: cropH
            });
            continue;
          }
        }

        // 스마트 감지에서 캐릭터가 없거나 단순 바둑판 모드인 경우 기본 분할
        if (cellCtx) {
          cellCtx.clearRect(0, 0, cW, cH);
          cellCtx.drawImage(
            img,
            theoreticalLeft, theoreticalTop, cW, cH,
            0, 0, cW, cH
          );
        }

        newSlots.push({
          index: idx,
          row: r,
          col: c,
          dataUrl: cellCanvas.toDataURL('image/png'),
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          originalCropW: cW,
          originalCropH: cH
        });
      }
    }

    return newSlots;
  }, [gridCols, gridRows]);

  // ── 이미지 로드 및 슬라이스 실행 ──
  const processAndSliceImage = useCallback((img: HTMLImageElement, fileName: string, mode: SliceMode = sliceMode) => {
    const totalW = img.naturalWidth || 1000;
    const totalH = img.naturalHeight || 1000;

    originalImageRef.current = img;
    setImageDimensions({ width: totalW, height: totalH });
    setImageFileName(fileName);

    const newSlots = sliceImageWithEngine(img, mode);
    setCellSlots(newSlots);
    setSelectedCellIndex(0);
    setImageError(null);
    setImageLoading(false);
  }, [sliceMode, sliceImageWithEngine]);

  // 분할 모드 전환 핸들러
  const handleToggleSliceMode = (newMode: SliceMode) => {
    setSliceMode(newMode);
    if (originalImageRef.current) {
      setImageLoading(true);
      setTimeout(() => {
        if (originalImageRef.current) {
          processAndSliceImage(originalImageRef.current, imageFileName, newMode);
        }
      }, 50);
    }
  };

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

    // 투명 배경 위에 각 셀 사각형과 번호 그리기
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const idx = r * 10 + c + 1;
        const x = c * cW + 6;
        const y = r * cH + 6;
        const w = cW - 12;
        const h = cH - 12;

        ctx.fillStyle = (r + c) % 2 === 0 ? '#1e293b' : '#334155';
        ctx.fillRect(x, y, w, h);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${idx}`, x + w / 2, y + h / 2);
      }
    }

    const img = new Image();
    img.onload = () => {
      processAndSliceImage(img, '10x10_Standard_Pattern.png');
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
          // 개별 셀 경계 클리핑
          const cellLeft = slot.col * cellW;
          const cellTop = slot.row * cellH;
          ctx.beginPath();
          ctx.rect(cellLeft, cellTop, cellW, cellH);
          ctx.clip();

          // 캐릭터 원본 비율에 맞추어 조정된 크기 및 위치로 렌더링
          const drawnW = slot.originalCropW * slot.scale;
          const drawnH = slot.originalCropH * slot.scale;
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
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
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
                <span>{isKo ? '그리드 검수기' : 'Grid Inspector'}</span>
              </span>
              
              {/* 분할 모드 배지 버튼 */}
              <button
                onClick={() => handleToggleSliceMode(sliceMode === 'smart-transparency' ? 'grid' : 'smart-transparency')}
                className={cn(
                  "text-[10px] px-2 py-0.5 border font-bold rounded-xs flex items-center gap-1 cursor-pointer transition-all",
                  sliceMode === 'smart-transparency'
                    ? "bg-cyan-50 text-cyan-950 border-cyan-400 shadow-2xs"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                )}
                title={isKo ? '클릭하여 분할 모드 전환' : 'Toggle Slice Mode'}
              >
                <Wand2 size={11} className={sliceMode === 'smart-transparency' ? "text-cyan-700" : "text-slate-500"} />
                <span>{sliceMode === 'smart-transparency' ? (isKo ? '투명도 기준 자동분할 (ON)' : 'Auto Transparency') : (isKo ? '단순 바둑판 분할' : 'Grid Slice')}</span>
              </button>
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
                placeholder={isKo ? '이미지 URL...' : 'Image URL...'}
                className="w-32 sm:w-40 py-1 pr-2 text-xs bg-transparent focus:outline-none"
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
              title={isKo ? '10x10 기본 테스트 패턴 로드' : 'Load 10x10 Test Pattern'}
            >
              <Sparkles size={12} className="text-amber-600" />
              <span>{isKo ? '10x10 패턴' : '10x10'}</span>
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
          <div className="max-w-[1750px] mx-auto mt-2 p-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
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
                  {isKo ? `[#${selectedSlot.index + 1}번 셀]` : `[Cell #${selectedSlot.index + 1}]`}
                </span>
                <span className="text-cyan-400 font-mono">
                  배율:{Math.round(selectedSlot.scale * 100)}% · X:{selectedSlot.offsetX}px, Y:{selectedSlot.offsetY}px
                </span>
                <span className="text-[10px] text-cyan-400/70 border-l border-cyan-700/60 pl-2 hidden sm:inline">
                  {isKo ? '드래그: 이동 · 휠: 확대축소 · 방향키: 1px 이동' : 'Drag: Move · Wheel: Zoom'}
                </span>
              </div>
            ) : (
              <div className="px-3 py-1 bg-slate-800/80 text-slate-300 border border-slate-600 rounded-xs text-[11px]">
                {isKo ? '칸을 클릭하여 개별 캐릭터를 선택하세요' : 'Click any cell to select'}
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
                  const drawnW = slot.originalCropW * slot.scale;
                  const drawnH = slot.originalCropH * slot.scale;
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
                      {/* 개별 온전한 캐릭터 이미지 (무손실 투명도 크롭) */}
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
          <span className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">
              {sliceMode === 'smart-transparency' ? '⚡ 투명도 감지 무손실 모드' : '격자 기준 단순 분할'}
            </span>
            <span>{imageFileName ? `(${imageDimensions.width}×${imageDimensions.height}px)` : ''}</span>
          </span>
          <span className="text-emerald-400 font-bold">
            {isKo ? '투명 배경을 기준으로 캐릭터가 잘리지 않고 온전하게 100개 슬롯에 분할됩니다.' : 'Characters are cleanly sliced based on transparency.'}
          </span>
        </div>
      </main>
    </div>
  );
};
