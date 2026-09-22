import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  RotateCcw, 
  Layers, 
  Grid3X3, 
  Plus, 
  Minus, 
  Code, 
  Eye, 
  Download, 
  Trash2, 
  Sparkles, 
  Sliders,
  Maximize2
} from 'lucide-react';
import { ViewType, Language } from '../types';

interface GridToolViewProps {
  language?: Language;
  onNavigate: (view: ViewType) => void;
}

interface GridItem {
  id: string;
  name: string;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  color: string;
}

const PRESET_COLORS = [
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const GridToolView: React.FC<GridToolViewProps> = ({
  language = 'ko',
  onNavigate
}) => {
  const isKo = language === 'ko';

  // Grid Structure State
  const [columns, setColumns] = useState<number>(3);
  const [rows, setRows] = useState<number>(3);
  const [colUnit, setColUnit] = useState<string>('1fr');
  const [rowUnit, setRowUnit] = useState<string>('1fr');
  const [rowGap, setRowGap] = useState<number>(12);
  const [colGap, setColGap] = useState<number>(12);
  const [gapUnit, setGapUnit] = useState<'px' | 'rem' | '%'>('px');

  // Custom Tracks (optional custom fr/px per track)
  const [customCols, setCustomCols] = useState<string[]>(['1fr', '1fr', '1fr']);
  const [customRows, setCustomRows] = useState<string[]>(['1fr', '1fr', '1fr']);
  const [useCustomTracks, setUseCustomTracks] = useState<boolean>(false);

  // Selected Grid Items / Areas
  const [items, setItems] = useState<GridItem[]>([
    { id: '1', name: 'Header', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4, color: '#f59e0b' },
    { id: '2', name: 'Sidebar', rowStart: 2, rowEnd: 4, colStart: 1, colEnd: 2, color: '#3b82f6' },
    { id: '3', name: 'Main', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 4, color: '#10b981' },
    { id: '4', name: 'Footer', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 4, color: '#8b5cf6' },
  ]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>('1');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'css' | 'html' | 'tailwind'>('css');

  // Drag selection state for visual area creation
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ row: number; col: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sync custom tracks when rows/cols change
  const handleColumnsChange = (newCols: number) => {
    const validCols = Math.max(1, Math.min(12, newCols));
    setColumns(validCols);
    setCustomCols(prev => {
      if (validCols > prev.length) {
        return [...prev, ...Array(validCols - prev.length).fill(colUnit)];
      }
      return prev.slice(0, validCols);
    });
  };

  const handleRowsChange = (newRows: number) => {
    const validRows = Math.max(1, Math.min(12, newRows));
    setRows(validRows);
    setCustomRows(prev => {
      if (validRows > prev.length) {
        return [...prev, ...Array(validRows - prev.length).fill(rowUnit)];
      }
      return prev.slice(0, validRows);
    });
  };

  // Generate CSS Code
  const generatedCss = useMemo(() => {
    const colTemplate = useCustomTracks 
      ? customCols.join(' ') 
      : `repeat(${columns}, ${colUnit})`;
    const rowTemplate = useCustomTracks 
      ? customRows.join(' ') 
      : `repeat(${rows}, ${rowUnit})`;
    
    let code = `.parent {\n`;
    code += `  display: grid;\n`;
    code += `  grid-template-columns: ${colTemplate};\n`;
    code += `  grid-template-rows: ${rowTemplate};\n`;
    if (rowGap === colGap) {
      code += `  gap: ${rowGap}${gapUnit};\n`;
    } else {
      code += `  row-gap: ${rowGap}${gapUnit};\n`;
      code += `  column-gap: ${colGap}${gapUnit};\n`;
    }
    code += `}\n\n`;

    items.forEach((item, idx) => {
      const selector = item.name ? `.${item.name.toLowerCase().replace(/\s+/g, '-')}` : `.div${idx + 1}`;
      code += `${selector} {\n`;
      code += `  grid-column: ${item.colStart} / ${item.colEnd};\n`;
      code += `  grid-row: ${item.rowStart} / ${item.rowEnd};\n`;
      code += `}\n`;
    });

    return code;
  }, [columns, rows, colUnit, rowUnit, rowGap, colGap, gapUnit, customCols, customRows, useCustomTracks, items]);

  // Generate HTML Code
  const generatedHtml = useMemo(() => {
    let html = `<div class="parent">\n`;
    items.forEach((item, idx) => {
      const cls = item.name ? item.name.toLowerCase().replace(/\s+/g, '-') : `div${idx + 1}`;
      html += `  <div class="${cls}">${item.name || `Item ${idx + 1}`}</div>\n`;
    });
    html += `</div>`;
    return html;
  }, [items]);

  // Generate Tailwind CSS Classes
  const generatedTailwind = useMemo(() => {
    let code = `<!-- Tailwind Parent Container -->\n`;
    const gapClass = gapUnit === 'px' ? `gap-[${colGap}px]` : `gap-3`;
    code += `<div class="grid grid-cols-${columns} grid-rows-${rows} ${gapClass} w-full h-full">\n`;
    items.forEach((item, idx) => {
      const colSpan = item.colEnd - item.colStart;
      const rowSpan = item.rowEnd - item.rowStart;
      const colClass = `col-start-${item.colStart} col-span-${colSpan}`;
      const rowClass = `row-start-${item.rowStart} row-span-${rowSpan}`;
      code += `  <div class="${colClass} ${rowClass} p-4 rounded bg-amber-50 border">\n`;
      code += `    ${item.name || `Item ${idx + 1}`}\n`;
      code += `  </div>\n`;
    });
    code += `</div>`;
    return code;
  }, [columns, rows, colGap, gapUnit, items]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Cell Interaction Handlers
  const handleCellMouseDown = (r: number, c: number) => {
    setIsDragging(true);
    setDragStart({ row: r, col: c });
    setDragEnd({ row: r, col: c });
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isDragging) {
      setDragEnd({ row: r, col: c });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const rStart = Math.min(dragStart.row, dragEnd.row);
      const rEnd = Math.max(dragStart.row, dragEnd.row) + 1;
      const cStart = Math.min(dragStart.col, dragEnd.col);
      const cEnd = Math.max(dragStart.col, dragEnd.col) + 1;

      const newItemId = String(Date.now());
      const nextColor = PRESET_COLORS[items.length % PRESET_COLORS.length];
      const newItem: GridItem = {
        id: newItemId,
        name: `Area ${items.length + 1}`,
        rowStart: rStart,
        rowEnd: rEnd,
        colStart: cStart,
        colEnd: cEnd,
        color: nextColor
      };

      setItems(prev => [...prev, newItem]);
      setSelectedItemId(newItemId);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Quick Preset Layouts
  const applyPreset = (preset: 'holy-grail' | 'dashboard' | 'bento' | 'split-hero' | 'gallery') => {
    if (preset === 'holy-grail') {
      setColumns(3);
      setRows(3);
      setItems([
        { id: '1', name: 'Header', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 4, color: '#f59e0b' },
        { id: '2', name: 'Nav', rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, color: '#3b82f6' },
        { id: '3', name: 'Content', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, color: '#10b981' },
        { id: '4', name: 'Aside', rowStart: 2, rowEnd: 3, colStart: 3, colEnd: 4, color: '#8b5cf6' },
        { id: '5', name: 'Footer', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 4, color: '#ec4899' },
      ]);
    } else if (preset === 'dashboard') {
      setColumns(4);
      setRows(3);
      setItems([
        { id: '1', name: 'Sidebar', rowStart: 1, rowEnd: 4, colStart: 1, colEnd: 2, color: '#3b82f6' },
        { id: '2', name: 'Topbar', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 5, color: '#f59e0b' },
        { id: '3', name: 'Stat-A', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, color: '#10b981' },
        { id: '4', name: 'Stat-B', rowStart: 2, rowEnd: 3, colStart: 3, colEnd: 4, color: '#06b6d4' },
        { id: '5', name: 'Stat-C', rowStart: 2, rowEnd: 3, colStart: 4, colEnd: 5, color: '#84cc16' },
        { id: '6', name: 'Main-Chart', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 5, color: '#8b5cf6' },
      ]);
    } else if (preset === 'bento') {
      setColumns(3);
      setRows(3);
      setItems([
        { id: '1', name: 'Feature Hero', rowStart: 1, rowEnd: 3, colStart: 1, colEnd: 3, color: '#f59e0b' },
        { id: '2', name: 'Side Widget 1', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, color: '#10b981' },
        { id: '3', name: 'Side Widget 2', rowStart: 2, rowEnd: 4, colStart: 3, colEnd: 4, color: '#3b82f6' },
        { id: '4', name: 'Bottom Card 1', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2, color: '#8b5cf6' },
        { id: '5', name: 'Bottom Card 2', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 3, color: '#ec4899' },
      ]);
    } else if (preset === 'split-hero') {
      setColumns(2);
      setRows(2);
      setItems([
        { id: '1', name: 'Nav', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 3, color: '#3b82f6' },
        { id: '2', name: 'Hero Text', rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, color: '#f59e0b' },
        { id: '3', name: 'Hero Image', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, color: '#10b981' },
      ]);
    } else if (preset === 'gallery') {
      setColumns(3);
      setRows(2);
      setItems([
        { id: '1', name: 'Photo 1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, color: '#f59e0b' },
        { id: '2', name: 'Photo 2', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, color: '#10b981' },
        { id: '3', name: 'Photo 3', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, color: '#3b82f6' },
        { id: '4', name: 'Wide Banner', rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 4, color: '#8b5cf6' },
      ]);
    }
  };

  const selectedItem = items.find(i => i.id === selectedItemId);

  return (
    <div 
      className="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col selection:bg-amber-100"
      onMouseUp={handleMouseUp}
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#fdfcfc]/95 backdrop-blur border-b border-[#201d1d]/15 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 border border-[#201d1d]/20 hover:bg-[#201d1d]/5 active:scale-95 transition-all text-xs flex items-center gap-1 cursor-pointer"
            title={isKo ? '홈으로 복귀' : 'Back to Home'}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">[ESC/BACK]</span>
          </button>
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-amber-600" />
            <h1 className="font-bold text-sm sm:text-base tracking-tight uppercase">
              {isKo ? 'CSS 그리드 생성기' : 'CSS GRID GENERATOR'}{' '}
              <span className="text-[10px] font-mono font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-300 rounded-xs">
                /tool/makegrid
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('tool-checkgrid')}
            className="px-2.5 py-1.5 border border-[#201d1d]/20 bg-white hover:bg-[#201d1d]/5 text-xs font-bold flex items-center gap-1 cursor-pointer"
            title={isKo ? '그리드 검수기로 이동' : 'Switch to Grid Checker'}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isKo ? '[검수기 이동]' : '[Grid Checker]'}</span>
          </button>
          <button
            onClick={() => {
              setItems([]);
              setSelectedItemId(null);
            }}
            className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs flex items-center gap-1 cursor-pointer"
            title={isKo ? '전체 초기화' : 'Clear All'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isKo ? '초기화' : 'Reset'}</span>
          </button>
          <button
            onClick={() => copyToClipboard(activeTab === 'css' ? generatedCss : activeTab === 'html' ? generatedHtml : generatedTailwind)}
            className="px-3.5 py-1.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-black active:scale-95 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? (isKo ? '복사완료!' : 'COPIED!') : (isKo ? '코드 복사' : 'COPY CODE')}</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout: Grid Builder + Controls + Code Output */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left / Top Column: Configuration Controls (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Grid Template & Sizing Panel */}
          <div className="border border-[#201d1d]/15 bg-white p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#201d1d]/10">
              <span className="font-bold text-xs uppercase flex items-center gap-1.5 text-amber-700">
                <Sliders className="w-3.5 h-3.5" />
                {isKo ? '1. 그리드 규격 설정 (Grid Sizing)' : '1. Grid Dimensions'}
              </span>
              <span className="text-[11px] text-slate-400">
                {columns} × {rows} GRID
              </span>
            </div>

            {/* Columns & Rows Controls */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {isKo ? '열 개수 (Columns)' : 'Columns'}
                </label>
                <div className="flex items-center border border-[#201d1d]/20">
                  <button 
                    onClick={() => handleColumnsChange(columns - 1)}
                    className="p-2 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={columns}
                    onChange={(e) => handleColumnsChange(parseInt(e.target.value) || 1)}
                    className="w-full text-center text-xs font-bold py-1.5 focus:outline-none bg-transparent"
                  />
                  <button 
                    onClick={() => handleColumnsChange(columns + 1)}
                    className="p-2 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {isKo ? '행 개수 (Rows)' : 'Rows'}
                </label>
                <div className="flex items-center border border-[#201d1d]/20">
                  <button 
                    onClick={() => handleRowsChange(rows - 1)}
                    className="p-2 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={rows}
                    onChange={(e) => handleRowsChange(parseInt(e.target.value) || 1)}
                    className="w-full text-center text-xs font-bold py-1.5 focus:outline-none bg-transparent"
                  />
                  <button 
                    onClick={() => handleRowsChange(rows + 1)}
                    className="p-2 hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Gap Settings */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {isKo ? '열 간격 (Column Gap)' : 'Column Gap'}
                </label>
                <div className="flex items-center border border-[#201d1d]/20 px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={colGap}
                    onChange={(e) => setColGap(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs font-bold focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{gapUnit}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  {isKo ? '행 간격 (Row Gap)' : 'Row Gap'}
                </label>
                <div className="flex items-center border border-[#201d1d]/20 px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rowGap}
                    onChange={(e) => setRowGap(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs font-bold focus:outline-none bg-transparent"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{gapUnit}</span>
                </div>
              </div>
            </div>

            {/* Units & Custom Tracks Toggle */}
            <div className="pt-2 border-t border-[#201d1d]/10 flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={useCustomTracks}
                  onChange={(e) => setUseCustomTracks(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-0"
                />
                <span className="text-[11px]">{isKo ? '개별 트랙 단위 커스텀' : 'Custom Track Sizes'}</span>
              </label>

              <div className="flex items-center gap-1">
                {(['px', 'rem', '%'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setGapUnit(u)}
                    className={`px-1.5 py-0.5 text-[10px] border ${gapUnit === u ? 'bg-[#201d1d] text-white border-[#201d1d]' : 'border-slate-200 text-slate-600'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Track Inputs if Enabled */}
            {useCustomTracks && (
              <div className="mt-3 pt-3 border-t border-dashed border-slate-200 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">
                    Columns: {customCols.map((c, i) => `Col ${i + 1}`).join(', ')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {customCols.map((val, i) => (
                      <input
                        key={i}
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const next = [...customCols];
                          next[i] = e.target.value;
                          setCustomCols(next);
                        }}
                        className="w-14 text-center text-[10px] p-1 border border-slate-300 font-mono"
                        placeholder="1fr"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">
                    Rows: {customRows.map((r, i) => `Row ${i + 1}`).join(', ')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {customRows.map((val, i) => (
                      <input
                        key={i}
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const next = [...customRows];
                          next[i] = e.target.value;
                          setCustomRows(next);
                        }}
                        className="w-14 text-center text-[10px] p-1 border border-slate-300 font-mono"
                        placeholder="1fr"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Layout Presets */}
          <div className="border border-[#201d1d]/15 bg-white p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#201d1d]/10">
              <span className="font-bold text-xs uppercase flex items-center gap-1.5 text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isKo ? '2. 프리셋 레이아웃 (Presets)' : '2. Presets'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                onClick={() => applyPreset('holy-grail')}
                className="p-2 text-[11px] border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all"
              >
                <div className="font-bold">Holy Grail</div>
                <div className="text-[9px] text-slate-400">Header/Nav/Main/Footer</div>
              </button>
              <button
                onClick={() => applyPreset('dashboard')}
                className="p-2 text-[11px] border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all"
              >
                <div className="font-bold">Dashboard</div>
                <div className="text-[9px] text-slate-400">Sidebar + 3 Stats</div>
              </button>
              <button
                onClick={() => applyPreset('bento')}
                className="p-2 text-[11px] border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all"
              >
                <div className="font-bold">Bento Grid</div>
                <div className="text-[9px] text-slate-400">Apple-style bento</div>
              </button>
              <button
                onClick={() => applyPreset('split-hero')}
                className="p-2 text-[11px] border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all"
              >
                <div className="font-bold">Split Hero</div>
                <div className="text-[9px] text-slate-400">50:50 Landing</div>
              </button>
              <button
                onClick={() => applyPreset('gallery')}
                className="p-2 text-[11px] border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all"
              >
                <div className="font-bold">Gallery</div>
                <div className="text-[9px] text-slate-400">3x Photos + Banner</div>
              </button>
            </div>
          </div>

          {/* Selected Item Editor / Area Manager */}
          <div className="border border-[#201d1d]/15 bg-white p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#201d1d]/10">
              <span className="font-bold text-xs uppercase flex items-center gap-1.5 text-slate-700">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                {isKo ? '3. 영역 관리 (Grid Items)' : '3. Area Items'}
              </span>
              <span className="text-[10px] text-slate-400">{items.length} items</span>
            </div>

            {items.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200">
                {isKo ? '오른쪽 그리드를 드래그하여 새 영역을 만드세요' : 'Drag on the grid to create items'}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-2 border text-xs flex items-center justify-between cursor-pointer transition-all ${selectedItemId === item.id ? 'border-amber-500 bg-amber-50/40' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems(prev => prev.map(i => i.id === item.id ? { ...i, name: val } : i));
                        }}
                        className="font-bold bg-transparent focus:outline-none w-28 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        C:{item.colStart}-{item.colEnd} R:{item.rowStart}-{item.rowEnd}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItems(prev => prev.filter(i => i.id !== item.id));
                          if (selectedItemId === item.id) setSelectedItemId(null);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Visual Interactive Canvas + Code Output (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Visual Interactive Canvas */}
          <div className="border border-[#201d1d]/15 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs uppercase tracking-tight">
                  {isKo ? '인터랙티브 캔버스 (클릭 & 드래그로 영역 생성)' : 'Interactive Canvas (Click & Drag)'}
                </span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 border border-slate-200">
                {columns} Columns × {rows} Rows
              </span>
            </div>

            {/* Grid Preview Container */}
            <div className="w-full bg-slate-50 border border-dashed border-slate-300 p-4 min-h-[320px] flex items-center justify-center select-none overflow-auto">
              <div 
                className="w-full h-full min-h-[280px] grid relative transition-all"
                style={{
                  gridTemplateColumns: useCustomTracks ? customCols.join(' ') : `repeat(${columns}, 1fr)`,
                  gridTemplateRows: useCustomTracks ? customRows.join(' ') : `repeat(${rows}, 1fr)`,
                  gap: `${rowGap}${gapUnit} ${colGap}${gapUnit}`
                }}
              >
                {/* Background Grid Cells for Dragging */}
                {Array.from({ length: rows }).map((_, rIdx) => (
                  Array.from({ length: columns }).map((_, cIdx) => {
                    const rowNum = rIdx + 1;
                    const colNum = cIdx + 1;

                    const isHighlighted = isDragging && dragStart && dragEnd &&
                      rowNum >= Math.min(dragStart.row, dragEnd.row) &&
                      rowNum <= Math.max(dragStart.row, dragEnd.row) &&
                      colNum >= Math.min(dragStart.col, dragEnd.col) &&
                      colNum <= Math.max(dragStart.col, dragEnd.col);

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        onMouseDown={() => handleCellMouseDown(rowNum, colNum)}
                        onMouseEnter={() => handleCellMouseEnter(rowNum, colNum)}
                        className={`border border-dashed transition-colors flex items-center justify-center text-[10px] font-mono cursor-crosshair min-h-[50px] ${
                          isHighlighted 
                            ? 'bg-amber-200/60 border-amber-500 text-amber-900 font-bold' 
                            : 'border-slate-300/80 hover:bg-slate-200/50 text-slate-400'
                        }`}
                      >
                        {colNum},{rowNum}
                      </div>
                    );
                  })
                ))}

                {/* Render Defined Items Over Grid */}
                {items.map((item) => {
                  const isSelected = selectedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`relative z-10 p-3 rounded flex flex-col justify-between cursor-pointer border transition-all shadow-sm ${
                        isSelected 
                          ? 'ring-2 ring-amber-600 ring-offset-1 z-20' 
                          : 'opacity-90 hover:opacity-100'
                      }`}
                      style={{
                        gridColumn: `${item.colStart} / ${item.colEnd}`,
                        gridRow: `${item.rowStart} / ${item.rowEnd}`,
                        backgroundColor: `${item.color}20`,
                        borderColor: item.color,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs tracking-tight" style={{ color: item.color }}>
                          {item.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.5 bg-white/80 rounded text-slate-600 border border-slate-200">
                          {item.colStart}/{item.colEnd} · {item.rowStart}/{item.rowEnd}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-2 truncate">
                        .{item.name.toLowerCase().replace(/\s+/g, '-')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Helper Text */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>💡 {isKo ? '마우스로 빈 칸을 드래그하면 새 블록이 지정됩니다.' : 'Drag over empty grid cells to define new grid area.'}</span>
              <span>{isKo ? '항목 클릭 시 포커스/수정' : 'Click item to select/edit'}</span>
            </div>
          </div>

          {/* Generated Code Output Box */}
          <div className="border border-[#201d1d]/15 bg-white flex flex-col">
            <div className="flex items-center justify-between border-b border-[#201d1d]/15 px-4 py-2.5 bg-[#fdfcfc]">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs uppercase">{isKo ? '생성된 코드 (Generated Code)' : 'Generated Code'}</span>
              </div>

              {/* Code Type Tabs */}
              <div className="flex items-center gap-1">
                {(['css', 'html', 'tailwind'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-xs font-bold uppercase transition-all cursor-pointer ${
                      activeTab === tab
                        ? 'bg-[#201d1d] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Display Area */}
            <div className="relative p-4 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto min-h-[220px]">
              <pre className="leading-relaxed">
                {activeTab === 'css' && generatedCss}
                {activeTab === 'html' && generatedHtml}
                {activeTab === 'tailwind' && generatedTailwind}
              </pre>

              <button
                onClick={() => copyToClipboard(activeTab === 'css' ? generatedCss : activeTab === 'html' ? generatedHtml : generatedTailwind)}
                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs flex items-center gap-1.5 rounded transition-all cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? (isKo ? '복사됨' : 'Copied') : (isKo ? '복사' : 'Copy')}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Info */}
      <footer className="mt-auto border-t border-[#201d1d]/15 bg-[#fdfcfc] px-4 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span>SNSHero Revolution Tools</span>
          <span>·</span>
          <span className="text-amber-700 font-bold">/tool/grid</span>
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
