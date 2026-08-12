import React, { useEffect, useState } from 'react';
import { X, FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { googleSignIn, googleSignOut, initGoogleAuth, getAccessToken } from '../lib/googleSheetsAuth';
import { createGameDataSpreadsheet, createDevelopmentRoadmapSpreadsheet, readSpreadsheetSheetValues, syncSpreadsheetStatusAllCompleted, GoogleSheetsExportPayload } from '../lib/googleSheetsService';
import { CARD_DATABASE } from '../cardDatabase';
import { t } from '../lib/i18n';
import type { Language } from '../types';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  season?: string;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  language,
  season = 'season1',
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportingRoadmap, setExportingRoadmap] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [exportResultUrl, setExportResultUrl] = useState<string | null>(null);
  const [roadmapResultUrl, setRoadmapResultUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmExportOpen, setConfirmExportOpen] = useState<boolean>(false);

  // Status Sync fields
  const [statusSheetId, setStatusSheetId] = useState<string>('1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s');
  const [syncingStatus, setSyncingStatus] = useState<boolean>(false);
  const [statusResultMsg, setStatusResultMsg] = useState<string | null>(null);
  const [statusResultUrl, setStatusResultUrl] = useState<string | null>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState<boolean>(false);

  const handleExportRoadmap = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage(language === 'ko' ? 'Google 로그인 액세스 토큰이 필요합니다.' : 'Google access token is missing.');
      return;
    }

    try {
      setExportingRoadmap(true);
      setErrorMessage(null);
      const res = await createDevelopmentRoadmapSpreadsheet(token);
      setRoadmapResultUrl(res.spreadsheetUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create roadmap sheet.');
    } finally {
      setExportingRoadmap(false);
    }
  };

  const handleSyncStatusAllCompleted = async () => {
    setConfirmStatusOpen(false);
    const token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage(language === 'ko' ? 'Google 로그인 액세스 토큰이 필요합니다.' : 'Google access token is missing.');
      return;
    }

    try {
      setSyncingStatus(true);
      setErrorMessage(null);
      setStatusResultMsg(null);
      const res = await syncSpreadsheetStatusAllCompleted(token, statusSheetId, '작업완료', 297);
      setStatusResultUrl(res.spreadsheetUrl);
      setStatusResultMsg(
        language === 'ko'
          ? `성공적으로 ${res.updatedCells}개 항목의 완료여부를 '작업완료'로 시트에 반영했습니다!`
          : `Successfully updated ${res.updatedCells} status cells to '작업완료'!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update sheet status.');
    } finally {
      setSyncingStatus(false);
    }
  };

  // Import fields
  const [importSheetId, setImportSheetId] = useState<string>('1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s');
  const [importedRows, setImportedRows] = useState<string[][] | null>(null);


  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setUserEmail(user.email || user.displayName || 'Google User');
        setAccessToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setUserEmail(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setErrorMessage(null);
      setIsAuthLoading(true);
      const res = await googleSignIn();
      if (res) {
        setUserEmail(res.user.email || res.user.displayName || 'Google User');
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google login failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUserEmail(null);
      setAccessToken(null);
      setExportResultUrl(null);
      setImportedRows(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const getExportPayload = (): GoogleSheetsExportPayload => {
    // Collect local storage deck & stats
    const playgroundDeckRaw = localStorage.getItem('hero_playground_deck');
    let deckIds: number[] = [1, 2, 3, 4, 5];
    if (playgroundDeckRaw) {
      try {
        const parsed = JSON.parse(playgroundDeckRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          deckIds = parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const deck = deckIds.map((id) => {
      const card = CARD_DATABASE[id] || CARD_DATABASE[1];
      return {
        id,
        name: card.title || card.title_en || card.title_dis || `Card #${id}`,
        rarity: card.rarity || 'bronze',
        attack: card.stats ? card.stats[0] : (card.top || 5),
        defense: card.stats ? card.stats[1] : (card.right || 5),
        hp: card.power || 20,
        speed: card.stats ? card.stats[3] : (card.left || 5),
      };
    });

    const matchHistoryRaw = localStorage.getItem('hero_match_history');
    let battleLogs: any[] = [];
    if (matchHistoryRaw) {
      try {
        const parsed = JSON.parse(matchHistoryRaw);
        if (Array.isArray(parsed)) {
          battleLogs = parsed.slice(0, 50).map((log, index) => ({
            id: log.id || `LOG-${index + 1}`,
            date: log.timestamp ? new Date(log.timestamp).toLocaleString() : new Date().toLocaleString(),
            mode: log.mode || 'Standard',
            opponent: log.opponent || 'AI Opponent',
            result: log.result || (log.win ? 'WIN' : 'LOSS'),
            score: log.score || `${log.playerScore || 0} - ${log.opponentScore || 0}`,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (battleLogs.length === 0) {
      battleLogs = [
        {
          id: 'LOG-001',
          date: new Date().toLocaleString(),
          mode: 'PVP Card Battle',
          opponent: 'Kadan AI',
          result: 'WIN',
          score: '3 - 1',
        },
      ];
    }

    const points = Number(localStorage.getItem('hero_current_steps') || 1250);
    const wins = battleLogs.filter((b) => b.result === 'WIN').length;
    const losses = battleLogs.filter((b) => b.result === 'LOSS').length;

    return {
      deck,
      battleLogs,
      seasonStats: {
        season: season || 'season1',
        rank: points > 2000 ? 'HERO' : points > 1000 ? 'GOLD' : 'SILVER',
        points,
        wins,
        losses,
      },
    };
  };

  const handleConfirmExport = async () => {
    setConfirmExportOpen(false);
    const token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage(language === 'ko' ? 'Google 로그인 액세스 토큰이 필요합니다.' : 'Google access token is missing.');
      return;
    }

    try {
      setExporting(true);
      setErrorMessage(null);
      const payload = getExportPayload();
      const res = await createGameDataSpreadsheet(token, payload);
      setExportResultUrl(res.spreadsheetUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportSheet = async () => {
    if (!importSheetId.trim()) {
      setErrorMessage(language === 'ko' ? '스프레드시트 ID 또는 URL을 입력해주세요.' : 'Please enter Spreadsheet ID or URL.');
      return;
    }

    // Extract ID if full URL passed
    let sheetId = importSheetId.trim();
    if (sheetId.includes('/d/')) {
      const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        sheetId = match[1];
      }
    }

    const token = accessToken || getAccessToken();
    if (!token) {
      setErrorMessage(language === 'ko' ? 'Google 로그인 액세스 토큰이 필요합니다.' : 'Google access token is missing.');
      return;
    }

    try {
      setImporting(true);
      setErrorMessage(null);
      const values = await readSpreadsheetSheetValues(token, sheetId, 'A1:G20');
      setImportedRows(values);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read Google Sheet.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono text-[#201d1d]">
      <div className="relative w-full max-w-xl rounded-none border border-[rgba(15,0,0,0.2)] bg-[#fdfcfc] shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-4 mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-[#201d1d]">
              [Google Sheets Sync]
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7] rounded-sm transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Auth status bar */}
        <div className="mb-4 p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-between text-xs">
          {isAuthLoading ? (
            <div className="flex items-center gap-2 text-[#646262]">
              <RefreshCw size={14} className="animate-spin" />
              <span>{language === 'ko' ? '인증 상태 확인 중...' : 'Checking auth status...'}</span>
            </div>
          ) : userEmail ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="font-bold">{userEmail}</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1 text-[11px] text-red-600 hover:underline cursor-pointer"
              >
                <LogOut size={12} />
                <span>{language === 'ko' ? '로그아웃' : 'Sign out'}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[#646262]">
                {language === 'ko' ? '구글 계정으로 연결 필요' : 'Google sign-in required'}
              </span>
              <button
                type="button"
                onClick={handleSignIn}
                className="flex items-center gap-2 bg-[#201d1d] text-[#fdfcfc] px-3 py-1.5 rounded-sm font-bold hover:bg-[#0f0000] cursor-pointer transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{language === 'ko' ? 'Google 로그인' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-red-600" />
            <p className="break-all">{errorMessage}</p>
          </div>
        )}

        {/* Section 0: Batch Update Completion Status */}
        <div className="border border-indigo-300 bg-indigo-50/60 p-4 rounded-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-indigo-700" />
            <h3 className="text-sm font-bold text-indigo-950">
              [+] {language === 'ko' ? '개선 항목 완료여부 구글 시트 반영 ("작업완료")' : 'Sync Sheet Completion Status ("작업완료")'}
            </h3>
          </div>
          <p className="text-xs text-indigo-900 mb-3 leading-relaxed">
            {language === 'ko'
              ? '297개 전체 개선 항목의 완료여부(Status) 열을 Google Sheets API를 통해 "작업완료"로 직접 업데이트합니다.'
              : 'Directly updates the Status column for all 297 improvement items to "작업완료" in your Google Sheet.'}
          </p>

          <div className="flex flex-col gap-1.5 mb-3">
            <label className="text-[11px] font-bold text-indigo-950">
              {language === 'ko' ? '대상 스프레드시트 URL 또는 ID:' : 'Target Spreadsheet URL or ID:'}
            </label>
            <input
              type="text"
              value={statusSheetId}
              onChange={(e) => setStatusSheetId(e.target.value)}
              placeholder="1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s"
              className="w-full bg-[#fdfcfc] border border-indigo-300 text-[#201d1d] text-xs px-3 py-1.5 rounded-sm focus:outline-none focus:border-indigo-600 font-mono"
            />
          </div>

          <button
            type="button"
            disabled={!userEmail || syncingStatus}
            onClick={() => setConfirmStatusOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-700 text-white py-2 px-4 rounded-sm font-bold text-xs hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
          >
            {syncingStatus ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{language === 'ko' ? '구글 시트에 반영 중...' : 'Updating Google Sheet...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>{language === 'ko' ? '전체 297개 항목 "작업완료" 시트 업데이트 실행' : 'Execute Status Update to "작업완료"'}</span>
              </>
            )}
          </button>

          {statusResultMsg && (
            <div className="mt-3 p-3 bg-white border border-indigo-300 rounded-sm text-xs text-indigo-950">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>{statusResultMsg}</span>
              </div>
              {statusResultUrl && (
                <a
                  href={statusResultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-700 underline font-bold hover:text-indigo-900 mt-1"
                >
                  <span>{language === 'ko' ? '업데이트된 Google Sheet 바로가기' : 'Open Updated Google Sheet'}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Section 0.5: Export Development Roadmap Sheet */}
        <div className="border border-emerald-300 bg-emerald-50/50 p-4 rounded-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet size={16} className="text-emerald-700" />
            <h3 className="text-sm font-bold text-emerald-950">
              [+] {language === 'ko' ? '개발 목표 리스트 Google Sheet 생성' : 'Generate Dev Goals Google Sheet'}
            </h3>
          </div>
          <p className="text-xs text-emerald-800 mb-3 leading-relaxed">
            {language === 'ko'
              ? 'SNSHero 프로젝트의 개발 목표, 상태, 우선순위가 정리된 구글 시트를 사용자의 구글 드라이브에 직접 생성합니다.'
              : 'Generates a pre-formatted Development Goals & Roadmap Google Sheet in your Google Drive.'}
          </p>

          <button
            type="button"
            disabled={!userEmail || exportingRoadmap}
            onClick={handleExportRoadmap}
            className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white py-2 px-4 rounded-sm font-bold text-xs hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
          >
            {exportingRoadmap ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{language === 'ko' ? '개발 목표 시트 생성 중...' : 'Generating Dev Goals Sheet...'}</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={14} />
                <span>{language === 'ko' ? '개발 목표 리스트 시트 생성 및 링크 받기' : 'Create Dev Goals Sheet'}</span>
              </>
            )}
          </button>

          {roadmapResultUrl && (
            <div className="mt-3 p-3 bg-white border border-emerald-300 rounded-sm text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>{language === 'ko' ? '개발 목표 시트 생성 완료!' : 'Dev Goals Sheet Created!'}</span>
              </div>
              <a
                href={roadmapResultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 underline font-bold hover:text-emerald-900 mt-1"
              >
                <span>{roadmapResultUrl}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Section 1: Export Game Data */}
        <div className="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 rounded-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Download size={16} className="text-[#201d1d]" />
            <h3 className="text-sm font-bold text-[#201d1d]">
              [+] {language === 'ko' ? '게임 데이터 Sheets로 내보내기' : 'Export Game Data to Sheets'}
            </h3>
          </div>
          <p className="text-xs text-[#646262] mb-3 leading-relaxed">
            {language === 'ko'
              ? '현재 덱, 전투 히스토리, 시즌 포인트를 구글 스프레드시트에 새로 생성하여 저장합니다.'
              : 'Export your current deck, battle history, and season stats into a new Google Spreadsheet.'}
          </p>

          <button
            type="button"
            disabled={!userEmail || exporting}
            onClick={() => setConfirmExportOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#201d1d] text-[#fdfcfc] py-2 px-4 rounded-sm font-bold text-xs hover:bg-[#0f0000] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {exporting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{language === 'ko' ? '시트 생성 및 내보내는 중...' : 'Exporting to Google Sheets...'}</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={14} />
                <span>{language === 'ko' ? '스프레드시트로 내보내기' : 'Export to Google Sheets'}</span>
              </>
            )}
          </button>

          {/* Export Success Result */}
          {exportResultUrl && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-xs text-emerald-800">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>{language === 'ko' ? '내보내기 완료!' : 'Export Completed!'}</span>
              </div>
              <a
                href={exportResultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 underline font-bold hover:text-emerald-900 mt-1"
              >
                <span>{language === 'ko' ? 'Google Sheet 바로가기' : 'Open Google Sheet'}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Section 2: Import / Read Sheet */}
        <div className="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <Upload size={16} className="text-[#201d1d]" />
            <h3 className="text-sm font-bold text-[#201d1d]">
              [+] {language === 'ko' ? 'Google Sheet 데이터 불러오기' : 'Import / Read Google Sheet'}
            </h3>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={importSheetId}
              onChange={(e) => setImportSheetId(e.target.value)}
              placeholder={language === 'ko' ? '스프레드시트 URL 또는 ID' : 'Spreadsheet URL or ID'}
              className="flex-1 bg-[#fdfcfc] border border-[rgba(15,0,0,0.2)] text-[#201d1d] text-xs px-3 py-1.5 rounded-sm focus:outline-none focus:border-[#201d1d]"
            />
            <button
              type="button"
              disabled={!userEmail || importing}
              onClick={handleImportSheet}
              className="bg-[#201d1d] text-[#fdfcfc] px-4 py-1.5 rounded-sm font-bold text-xs hover:bg-[#0f0000] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {importing ? <RefreshCw size={12} className="animate-spin" /> : (language === 'ko' ? '조회' : 'Read')}
            </button>
          </div>

          {importedRows && importedRows.length > 0 && (
            <div className="mt-2 max-h-40 overflow-auto border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-2 text-[11px] rounded-sm">
              <p className="font-bold mb-1 text-[#201d1d]">
                {language === 'ko' ? '스프레드시트 미리보기 (상위 20행):' : 'Spreadsheet Preview (First 20 rows):'}
              </p>
              <table className="w-full text-left border-collapse">
                <tbody>
                  {importedRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-200 hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-1 border-r border-slate-200 truncate max-w-[100px]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirmation Modal overlay for Status Sync */}
        {confirmStatusOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-[#fdfcfc] border border-[#201d1d] p-5 shadow-xl rounded-none font-mono">
              <h4 className="text-sm font-bold text-[#201d1d] mb-2">
                {language === 'ko' ? '[확인] 구글 시트 완료여부 "작업완료" 반영' : '[Confirm] Update Google Sheet Status'}
              </h4>
              <p className="text-xs text-[#424245] mb-4 leading-relaxed">
                {language === 'ko'
                  ? '지정한 구글 스프레드시트의 297개 개선 항목 완료여부 열을 "작업완료" 값으로 업데이트합니다. 진행하시겠습니까?'
                  : 'This will update the status column for 297 items in the target Google Sheet to "작업완료". Proceed?'}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmStatusOpen(false)}
                  className="px-3 py-1.5 border border-[rgba(15,0,0,0.2)] bg-[#fdfcfc] text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] rounded-sm cursor-pointer"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSyncStatusAllCompleted}
                  className="px-3 py-1.5 bg-indigo-700 text-white text-xs font-bold hover:bg-indigo-800 rounded-sm cursor-pointer"
                >
                  {language === 'ko' ? '승인 및 업데이트' : 'Confirm & Update'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal overlay */}
        {confirmExportOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-[#fdfcfc] border border-[#201d1d] p-5 shadow-xl rounded-none">
              <h4 className="text-sm font-bold text-[#201d1d] mb-2">
                {language === 'ko' ? '[확인] 구글 시트 생성 및 내보내기' : '[Confirm] Export to Google Sheets'}
              </h4>
              <p className="text-xs text-[#424245] mb-4 leading-relaxed">
                {language === 'ko'
                  ? '구글 계정에 새로운 스프레드시트를 생성하고 덱 데이터, 최근 전투 기록, 시즌 스탯을 저장합니다. 진행하시겠습니까?'
                  : 'This will create a new Google Sheet in your account and write your deck, battle logs, and season stats. Proceed?'}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmExportOpen(false)}
                  className="px-3 py-1.5 border border-[rgba(15,0,0,0.2)] bg-[#fdfcfc] text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] rounded-sm cursor-pointer"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExport}
                  className="px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold hover:bg-[#0f0000] rounded-sm cursor-pointer"
                >
                  {language === 'ko' ? '승인 및 내보내기' : 'Confirm & Export'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
