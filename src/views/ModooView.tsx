import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, ExternalLink, ArrowLeft, CheckCircle2, Clock, PlayCircle, Search, Layers, ListFilter } from 'lucide-react';
import { ViewType, Language } from '../types';

interface ModooViewProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
}

interface StatusRow {
  timestamp: string;
  department: string;
  taskName: string;
  status: string;
  details: string;
}

const SPREADSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8/gviz/tq?tqx=out:csv';
const SPREADSHEET_EDIT_URL = 'https://docs.google.com/spreadsheets/d/1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8/edit?usp=sharing';
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/viewform';

const DEPARTMENTS = [
  { 
    id: '기획', 
    nameKo: '기획팀', 
    nameEn: 'Product Planning', 
    roleTitle: '서비스 기획자 PM',
    emoji: '👨‍💼', 
    avatarBg: 'bg-amber-100 text-amber-900 border-amber-400',
    deskItems: ['☕️ 아메리카노', '📝 와이어프레임', '💡 아이디어 노트'],
    statusEmotes: ['💭 생각 중...', '📄 기획서 수립!', '☕ 커피 충전'],
  },
  { 
    id: '개발', 
    nameKo: '개발팀', 
    nameEn: 'Software Engineering', 
    roleTitle: '수석 풀스택 개발자',
    emoji: '👨‍💻', 
    avatarBg: 'bg-emerald-100 text-emerald-900 border-emerald-400',
    deskItems: ['🎧 헤드폰', '⌨️ 기계식 키보드', '⚡️ 몬스터 에너시'],
    statusEmotes: ['🔥 빌드 수정 중', '🚀 구글 폼 연동!', '🐛 버그 박멸'],
  },
  { 
    id: '디자인', 
    nameKo: '디자인팀', 
    nameEn: 'UI/UX Design', 
    roleTitle: '비주얼 아트 디자이너',
    emoji: '👩‍🎨', 
    avatarBg: 'bg-purple-100 text-purple-900 border-purple-400',
    deskItems: ['📐 피그마 가이드', '🪴 미니 화분', '🖌️ 타블릿 펜'],
    statusEmotes: ['✨ 픽셀 정렬 중', '🎨 웜크림 컬러픽', '👁️ 눈높이 맞춤'],
  },
];

// RFC 4180 Compliant CSV Parser
function parseRFC4180CSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Normalize Department Name
function normalizeDept(rawDept: string, task: string, details: string): string {
  const clean = (rawDept || '').trim();
  if (clean.includes('기획') || clean.includes('PM') || clean.toLowerCase().includes('plan')) return '기획';
  if (clean.includes('디자인') || clean.includes('Design') || clean.includes('ART')) return '디자인';
  if (clean.includes('개발') || clean.includes('Dev') || clean.toLowerCase().includes('eng')) return '개발';

  const combined = `${task} ${details}`.toLowerCase();
  if (combined.includes('피그마') || combined.includes('디자인') || combined.includes('컬러') || combined.includes('아이콘') || combined.includes('font') || combined.includes('theme')) {
    return '디자인';
  }
  if (combined.includes('기획') || combined.includes('스펙') || combined.includes('밸런스') || combined.includes('시즌') || combined.includes('보상 규정')) {
    return '기획';
  }
  return '개발';
}

// Normalize Status Value
function normalizeStatus(rawStatus: string, task: string, details: string): string {
  const clean = (rawStatus || '').trim();
  if (clean.includes('완료') || clean.includes('성공') || clean.toLowerCase().includes('done') || clean.toLowerCase().includes('complete')) {
    return '작업완료';
  }
  if (clean.includes('중') || clean.includes('진행') || clean.toLowerCase().includes('progress')) {
    return '작업중';
  }
  if (clean.includes('대기') || clean.includes('전') || clean.toLowerCase().includes('pending')) {
    return '작업대기';
  }

  const combined = `${task} ${details}`.toLowerCase();
  if (combined.includes('완료') || combined.includes('수정완료') || combined.includes('해결') || combined.includes('반영') || combined.includes('성공')) {
    return '작업완료';
  }
  if (combined.includes('진행') || combined.includes('수정중')) {
    return '작업중';
  }
  return '작업완료';
}

export const ModooView: React.FC<ModooViewProps> = ({ language, onNavigate }) => {
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'all' | 'dedup'>('all');
  const [displayLimit, setDisplayLimit] = useState<number>(50);
  const [countdown, setCountdown] = useState<number>(45);

  const processRawRows = useCallback((rawGrid: string[][]): StatusRow[] => {
    if (rawGrid.length <= 1) return [];
    
    // Check if row 0 is header
    const startIndex = rawGrid[0][0].includes('타임스탬프') || rawGrid[0][0].includes('Timestamp') ? 1 : 0;
    const list: StatusRow[] = [];

    for (let i = startIndex; i < rawGrid.length; i++) {
      const row = rawGrid[i];
      if (!row || row.length < 2) continue;

      const timestamp = row[0] || '';
      const rawDept = row[1] || '';
      const rawTask = row[2] || '';
      const rawStatus = row[3] || '';
      const rawDetails = row[4] || '';

      const taskName = rawTask.trim() || '내용 없음';
      const department = normalizeDept(rawDept, taskName, rawDetails);
      const status = normalizeStatus(rawStatus, taskName, rawDetails);

      list.push({
        timestamp,
        department,
        taskName,
        status,
        details: rawDetails.trim(),
      });
    }
    return list;
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cacheBuster = Date.now();
      const res = await fetch(`${SPREADSHEET_CSV_URL}&_t=${cacheBuster}`);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const text = await res.text();
      
      if (text.includes('Rate exceeded') || text.includes('Quota exceeded')) {
        throw new Error('Rate limit exceeded');
      }

      const grid = parseRFC4180CSV(text);
      const parsed = processRawRows(grid);

      if (parsed.length > 0) {
        setRows(parsed);
        try {
          localStorage.setItem('hero_modoo_status_cache', JSON.stringify(parsed));
        } catch {
          // ignore storage quota error
        }
      }
      setLastRefreshed(new Date());
      setCountdown(45);
    } catch (err: unknown) {
      console.warn('Failed to fetch modoo status CSV, checking local cache:', err);
      try {
        const cached = localStorage.getItem('hero_modoo_status_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRows(parsed);
            setError('최신 데이터를 불러오는 도중 구글 시트 요청 제한이 발생하여 저장된 이전 데이터를 표시 중입니다.');
          } else {
            setError('데이터를 불러오는데 실패했습니다.');
          }
        } else {
          setError('데이터를 불러오는데 실패했습니다. 네트워크 상태 또는 시트 접근 제한을 확인해주세요.');
        }
      } catch {
        setError('데이터를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [processRawRows]);

  useEffect(() => {
    fetchData();
    const fetchInterval = setInterval(fetchData, 45000); // 45초 주기 자동 새로고침
    const timerInterval = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 45));
    }, 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(timerInterval);
    };
  }, [fetchData]);

  // 부서별 최신 작업 추출 (행 순서상 뒤쪽이 더 최신)
  const getLatestForDept = (deptId: string): StatusRow | null => {
    const matched = rows.filter(r => r.department === deptId || r.department.includes(deptId) || deptId.includes(r.department));
    if (matched.length === 0) return null;
    return matched[matched.length - 1];
  };

  const getStatusBadge = (statusStr: string) => {
    if (statusStr.includes('완료')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-xs border border-emerald-500/40 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800">
          <CheckCircle2 size={12} className="text-emerald-600" />
          <span>[작업완료]</span>
        </span>
      );
    }
    if (statusStr.includes('중') || statusStr.includes('진행')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-xs border border-amber-500/40 bg-amber-50 px-2 py-0.5 font-mono text-xs font-bold text-amber-800">
          <PlayCircle size={12} className="animate-pulse text-amber-600" />
          <span>[작업중]</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-xs border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
        <Clock size={12} className="text-slate-500" />
        <span>[{statusStr || '작업대기'}]</span>
      </span>
    );
  };

  // 대표 작업별 요약 (Deduplicated)
  const deduplicatedRows = useMemo(() => {
    const taskMap = new Map<string, StatusRow>();

    const getPriority = (statusStr: string): number => {
      if (statusStr.includes('완료')) return 3;
      if (statusStr.includes('중') || statusStr.includes('진행')) return 2;
      return 1;
    };

    rows.forEach(row => {
      const normalizedKey = `${row.department.trim()}::${row.taskName.trim().replace(/\s+/g, ' ')}`;
      const existing = taskMap.get(normalizedKey);

      if (!existing) {
        taskMap.set(normalizedKey, row);
      } else {
        const existingPriority = getPriority(existing.status);
        const currentPriority = getPriority(row.status);

        if (currentPriority >= existingPriority) {
          taskMap.set(normalizedKey, row);
        }
      }
    });

    return Array.from(taskMap.values());
  }, [rows]);

  // 통계 계산
  const totalCount = rows.length;
  const completedCount = rows.filter(r => r.status.includes('완료')).length;
  const inProgressCount = rows.filter(r => r.status.includes('중') || r.status.includes('진행')).length;
  const pendingCount = rows.filter(r => r.status.includes('대기') || r.status.includes('전')).length;

  // 필터링 및 정렬
  const sourceRows = viewMode === 'dedup' ? deduplicatedRows : rows;

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...sourceRows]
      .reverse() // 최신순
      .filter(r => {
        const matchTab = activeTab === 'all' || r.department === activeTab || r.department.includes(activeTab);
        const matchSearch = !query || 
          r.taskName.toLowerCase().includes(query) || 
          r.details.toLowerCase().includes(query) || 
          r.department.toLowerCase().includes(query) ||
          r.timestamp.toLowerCase().includes(query);
        return matchTab && matchSearch;
      });
  }, [sourceRows, activeTab, searchQuery]);

  const displayedRows = useMemo(() => {
    if (displayLimit === 0) return filteredRows;
    return filteredRows.slice(0, displayLimit);
  }, [filteredRows, displayLimit]);

  return (
    <div className="min-h-screen bg-[#fdfcfc] font-mono text-[#201d1d] selection:bg-[#201d1d] selection:text-[#fdfcfc] pb-24">
      {/* 45s Sync Progress Indicator Bar */}
      <div className="h-1 bg-slate-200 w-full overflow-hidden sticky top-0 z-40">
        <div 
          className="h-full bg-[#201d1d] transition-all duration-1000 ease-linear"
          style={{ width: `${(countdown / 45) * 100}%` }}
        />
      </div>

      {/* Top Header Navigation */}
      <header className="sticky top-1 z-30 border-b border-[#201d1d]/15 bg-[#fdfcfc]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 rounded-xs border border-[#201d1d]/20 bg-white px-2.5 py-1.5 text-xs font-bold transition-all hover:bg-[#201d1d] hover:text-[#fdfcfc] active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>[홈으로]</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏢</span>
              <div>
                <h1 className="text-sm font-black tracking-tight uppercase flex items-center gap-1.5">
                  <span>{language === 'ko' ? '모두소프트 업무현황 모니터링' : 'ModooSoft Work Monitor'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 border border-[#201d1d]/20 bg-amber-100 font-bold">LIVE</span>
                </h1>
                <p className="text-[10px] text-[#201d1d]/60 font-medium">
                  Google Sheets Realtime Synchronization Dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xs border border-[#201d1d] bg-[#201d1d] px-3 py-1.5 text-xs font-bold text-[#fdfcfc] transition-all hover:bg-[#201d1d]/80 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>[새로고침 {countdown}s]</span>
            </button>
            <a
              href={SPREADSHEET_EDIT_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1 rounded-xs border border-[#201d1d]/30 bg-white px-2.5 py-1.5 text-xs font-bold text-[#201d1d] transition-all hover:bg-slate-100"
            >
              <ExternalLink size={13} />
              <span>[시트 열기]</span>
            </a>
            <a
              href={FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1 rounded-xs border border-indigo-600 bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100"
            >
              <span>[보고 양식]</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6">
        {/* Banner Alert & Stats summary */}
        <div className="mb-6 rounded-none border border-[#201d1d]/20 bg-amber-50/50 p-3.5 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📢</span>
            <span className="font-semibold">
              실시간 모두소프트 업무 보고 현황입니다. (총 {totalCount}건 동기화됨 | 다음 자동 갱신까지 {countdown}초)
            </span>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 border border-[#201d1d]/20 bg-white font-bold">
              전체 [{totalCount}]
            </span>
            <span className="px-2 py-0.5 border border-emerald-500/40 bg-emerald-100/80 font-bold text-emerald-950">
              완료 [{completedCount}]
            </span>
            <span className="px-2 py-0.5 border border-amber-500/40 bg-amber-100/80 font-bold text-amber-950">
              작업중 [{inProgressCount}]
            </span>
            <span className="px-2 py-0.5 border border-slate-300 bg-slate-100 font-bold text-slate-800">
              대기 [{pendingCount}]
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 font-bold flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={fetchData} className="underline cursor-pointer">다시 시도</button>
          </div>
        )}

        {/* ─── 1. 부서별 최신 상태 말풍선 카드 (Department Live Speech Bubbles) ─── */}
        <div className="mb-10">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#201d1d]/80 flex items-center gap-1.5">
              <span>🖥️ [ MODOO SOFT OFFICE FLOOR - LIVE DESKS ]</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            </h2>
            <span className="text-[10px] text-[#201d1d]/60 font-mono bg-amber-100/60 px-2 py-0.5 border border-amber-300/80">
              ☕️ 실시간 부서별 최신 작업 (갱신: {lastRefreshed.toLocaleTimeString()})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEPARTMENTS.map((dept, index) => {
              const latest = getLatestForDept(dept.id);
              const emote = dept.statusEmotes[index % dept.statusEmotes.length];

              return (
                <div 
                  key={dept.id}
                  className="flex flex-col rounded-none border-2 border-[#201d1d] bg-white p-4 shadow-[5px_5px_0px_0px_rgba(32,29,29,1)] transition-transform hover:-translate-y-1"
                >
                  {/* Department Staff Profile Header */}
                  <div className="flex items-center justify-between border-b-2 border-[#201d1d]/15 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`relative flex h-12 w-12 items-center justify-center rounded-sm border-2 text-2xl shadow-xs ${dept.avatarBg}`}>
                        {dept.emoji}
                        <span className="absolute -bottom-1 -right-1 text-[10px] bg-white px-1 border border-[#201d1d] font-bold rounded-xs">
                          {dept.id === '기획' ? 'PM' : dept.id === '개발' ? 'DEV' : 'ART'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-[#201d1d]">{dept.nameKo}</span>
                          <span className="text-[10px] text-[#201d1d]/60 font-mono">({dept.roleTitle})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {latest ? `⏱️ ${latest.timestamp}` : '기록 없음'}
                        </div>
                      </div>
                    </div>
                    <div>
                      {latest ? getStatusBadge(latest.status) : (
                        <span className="text-xs text-slate-400 font-bold">[미작성]</span>
                      )}
                    </div>
                  </div>

                  {/* Office Desk Accessories Bar */}
                  <div className="my-2.5 flex items-center gap-1.5 overflow-x-auto py-1 text-[10px] text-slate-600 bg-slate-50/80 border border-slate-200/80 px-2 rounded-xs">
                    <span className="font-bold text-[#201d1d] whitespace-nowrap">🗄️ 데스크:</span>
                    {dept.deskItems.map((item, idx) => (
                      <span key={idx} className="bg-white px-1.5 py-0.5 border border-slate-300 whitespace-nowrap rounded-xs shadow-2xs font-mono">
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Speech Bubble Area (말풍선 & 이모티콘) */}
                  <div className="relative mt-2 flex-1">
                    <div className="relative rounded-sm border-2 border-[#201d1d] bg-[#fdfcfc] p-3.5 shadow-sm">
                      {/* Bubble Arrow Accent */}
                      <div className="absolute -top-2.5 left-6 h-0 w-0 border-x-8 border-x-transparent border-b-8 border-b-[#201d1d]"></div>
                      <div className="absolute -top-2 left-[25px] h-0 w-0 border-x-7 border-x-transparent border-b-7 border-b-[#fdfcfc]"></div>

                      <div className="mb-1 text-[11px] font-black uppercase text-indigo-900 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{dept.nameKo} 말풍선</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 border border-amber-300 text-amber-900 font-bold rounded-xs animate-bounce">
                          {emote}
                        </span>
                      </div>

                      <div className="text-xs font-black text-[#201d1d] leading-snug break-words">
                        {latest ? latest.taskName : '작업 내역이 등록되지 않았습니다.'}
                      </div>

                      {latest && latest.details && (
                        <div className="mt-2.5 border-t border-[#201d1d]/15 pt-2 text-[11px] text-[#201d1d]/85 leading-relaxed bg-amber-50/80 p-2 rounded-xs border border-amber-200">
                          <span className="font-extrabold text-amber-950">📝 특이사항:</span> {latest.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 2. 전체 작업 히스토리 로그 테이블 (Work Logs History Table) ─── */}
        <div>
          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#201d1d]/15 pb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#201d1d]/80">
                [ WORK REPORT LOGS ({filteredRows.length} / {rows.length}) ]
              </h2>
              {/* View Mode Toggle */}
              <div className="flex items-center border border-[#201d1d]/30 bg-white rounded-xs p-0.5 text-[11px]">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-2 py-0.5 font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'all' ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#201d1d] hover:bg-slate-100'
                  }`}
                >
                  <ListFilter size={11} />
                  <span>전체 로그</span>
                </button>
                <button
                  onClick={() => setViewMode('dedup')}
                  className={`px-2 py-0.5 font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    viewMode === 'dedup' ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#201d1d] hover:bg-slate-100'
                  }`}
                >
                  <Layers size={11} />
                  <span>대표 작업별</span>
                </button>
              </div>
            </div>

            {/* Department Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Box */}
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="작업명/내용 검색..."
                  className="pl-8 pr-2.5 py-1 text-xs border border-[#201d1d]/30 bg-white rounded-xs focus:outline-none focus:border-[#201d1d] w-36 sm:w-44"
                />
              </div>

              {/* Tab Filters */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 text-xs font-bold border transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                      : 'border-[#201d1d]/20 bg-white text-[#201d1d] hover:bg-slate-100'
                  }`}
                >
                  [전체]
                </button>
                {DEPARTMENTS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setActiveTab(d.id)}
                    className={`px-2.5 py-1 text-xs font-bold border transition-all cursor-pointer ${
                      activeTab === d.id
                        ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                        : 'border-[#201d1d]/20 bg-white text-[#201d1d] hover:bg-slate-100'
                    }`}
                  >
                    [{d.emoji} {d.nameKo}]
                  </button>
                ))}
              </div>

              {/* Limit Control */}
              <select
                value={displayLimit}
                onChange={(e) => setDisplayLimit(Number(e.target.value))}
                className="text-xs border border-[#201d1d]/30 bg-white px-2 py-1 rounded-xs font-mono font-bold cursor-pointer"
              >
                <option value={30}>30개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
                <option value={0}>전체</option>
              </select>
            </div>
          </div>

          {loading && rows.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500 border border-dashed border-slate-300">
              <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-slate-400" />
              <span>구글 스프레드시트 실시간 데이터 수신 중...</span>
            </div>
          ) : displayedRows.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500 border border-slate-200 bg-white">
              조건에 일치하는 업무 보고 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-[#201d1d] bg-white shadow-[3px_3px_0px_0px_rgba(32,29,29,1)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#201d1d] bg-slate-100 text-[11px] font-black uppercase text-[#201d1d]">
                    <th className="py-2.5 px-3 w-40 border-r border-[#201d1d]/20">타임스탬프</th>
                    <th className="py-2.5 px-3 w-28 border-r border-[#201d1d]/20">부서명</th>
                    <th className="py-2.5 px-3 w-32 border-r border-[#201d1d]/20">상태</th>
                    <th className="py-2.5 px-3">현재 작업명 / 상세 내용</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#201d1d]/10">
                  {displayedRows.map((row, idx) => {
                    const deptObj = DEPARTMENTS.find(d => d.id === row.department || d.id.includes(row.department) || row.department.includes(d.id));
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 border-r border-[#201d1d]/10 font-mono text-[11px] text-[#201d1d]/70 whitespace-nowrap">
                          {row.timestamp}
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#201d1d]/10 font-bold">
                          <span className="inline-flex items-center gap-1">
                            <span>{deptObj?.emoji || '🏢'}</span>
                            <span>{row.department}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#201d1d]/10 whitespace-nowrap">
                          {getStatusBadge(row.status)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-black text-[#201d1d]">{row.taskName}</div>
                          {row.details && (
                            <div className="mt-1 text-[11px] text-slate-600 font-medium leading-relaxed">
                              ↳ {row.details}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


