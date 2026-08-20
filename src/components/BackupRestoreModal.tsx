import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import LZString from 'lz-string';
import { Play, Pause, ChevronLeft, ChevronRight, Copy, Check, Download, Upload, FileText, Camera, ShieldCheck, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { Language } from '../types';
import { t } from '../lib/i18n';

interface BackupRestoreModalProps {
  mode: 'backup' | 'restore' | null;
  onClose: () => void;
  lang: Language;
}

// QR 코드가 가장 많은 데이터를 담으면서도 모바일 카메라로 0.1초 만에 식별 가능한 최적 크기
const CHUNK_DATA_SIZE = 750;

// 백업 시 제외할 대용량 임시 로그, 캐시 및 미디어 데이터 키
const EXCLUDED_STORAGE_KEYS = new Set([
  'hero_game_logs', // 전투 텍스트 로그 (수백 KB)
  'hero_custom_card_image', // Base64 커스텀 카드 이미지
  'hero_snshero_app_state_v1', // SNS 모의 서비스 데모 데이터
  'hero_modoo_status_cache', // 모두의 상태 캐시
  'hero_match_history', // PVP 매치 히스토리
  'hero_running_session_data', // GPS/좌표 데이터
  'hero_sns_history', // 포인트 변동 상세 로그
  'hero_daily_missions_history', // 과거 일일 미션 로그
  'hero_build_version', // 빌드 체크 플래그
  'hero_last_version_check', // 빌드 체크 플래그
  'hero_boot_gate_shown', // 부팅 게이트 플래그
  'hero_goods_pending_payment', // 임시 결제 대기
  'hero_goods_pending_order', // 임시 주문 대기
]);

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ mode, onClose, lang }) => {
  // 백업 상태
  const [backupFullJson, setBackupFullJson] = useState<string>('');
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentChunkIdx, setCurrentChunkIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMs, setSpeedMs] = useState<number>(600); // 0.6초 루프
  const [copied, setCopied] = useState<boolean>(false);
  const [backupStats, setBackupStats] = useState<{ totalKeys: number; rawSize: number; compressedSize: number }>({
    totalKeys: 0,
    rawSize: 0,
    compressedSize: 0,
  });

  // 복원 상태
  const [scanSessionId, setScanSessionId] = useState<string | null>(null);
  const [totalChunksExpected, setTotalChunksExpected] = useState<number | null>(null);
  const [isCompressedSession, setIsCompressedSession] = useState<boolean>(false);
  const [receivedChunks, setReceivedChunks] = useState<Record<number, string>>({});
  const [lastScannedIdx, setLastScannedIdx] = useState<number | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);
  const [restoredKeyCount, setRestoredKeyCount] = useState<number>(0);
  const [manualText, setManualText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'file' | 'text'>('camera');
  const [cameraStarted, setCameraStarted] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  // 사운드 효과
  const playSfx = (url: string) => {
    try {
      const audio = new Audio(url);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {}
  };

  // 1. 스마트 필터링 및 고밀도 LZ 압축 백업 데이터 생성
  useEffect(() => {
    if (mode === 'backup') {
      try {
        const backupPayload: Record<string, string | null> = {};
        let keyCount = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('hero_') || key === 'firebase_db_mode')) {
            // 대용량 임시 로그 및 캐시 제외 필터링
            if (EXCLUDED_STORAGE_KEYS.has(key)) {
              continue;
            }
            const val = localStorage.getItem(key);
            if (val !== null && val !== '') {
              backupPayload[key] = val;
              keyCount++;
            }
          }
        }

        const fullDataObj = {
          app: 'SNSHero Revolution',
          version: '2.2',
          timestamp: Date.now(),
          totalKeys: keyCount,
          data: backupPayload,
        };

        const rawJsonString = JSON.stringify(fullDataObj);
        setBackupFullJson(rawJsonString);

        // LZ-String 고밀도 압축 (URL/QR Safe 포맷)
        const compressed = LZString.compressToEncodedURIComponent(rawJsonString);
        const rawSize = new Blob([rawJsonString]).size;
        const compressedSize = new Blob([compressed]).size;

        setBackupStats({
          totalKeys: keyCount,
          rawSize,
          compressedSize,
        });

        // 고유 세션 ID 생성 (6자리)
        const sessionId = Math.random().toString(36).substring(2, 8);

        // 고용량 QR 청크 분할
        const chunkList: string[] = [];
        if (compressed.length <= CHUNK_DATA_SIZE) {
          // 단일 QR로 충분히 들어감! (대부분의 경우 1개로 완성)
          chunkList.push(`SNSHERO_LZ|${compressed}`);
        } else {
          const total = Math.ceil(compressed.length / CHUNK_DATA_SIZE);
          for (let i = 0; i < total; i++) {
            const start = i * CHUNK_DATA_SIZE;
            const end = start + CHUNK_DATA_SIZE;
            const slice = compressed.slice(start, end);
            chunkList.push(`SNSHERO_LZCHUNK|${sessionId}|${total}|${i + 1}|${slice}`);
          }
        }

        setChunks(chunkList);
        setCurrentChunkIdx(0);
        setIsPlaying(chunkList.length > 1);
      } catch (err) {
        console.error('Backup generation failed:', err);
      }
    }
  }, [mode]);

  // 2. 백업 모드 애니메이션 QR 롤링 루프
  useEffect(() => {
    if (mode !== 'backup' || chunks.length <= 1 || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentChunkIdx((prev) => (prev + 1) % chunks.length);
    }, speedMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, chunks, isPlaying, speedMs]);

  // 3. 복원 처리 공통 함수
  const applyRestoreJson = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON format');
      }

      // data 속성이 있는 구조 또는 direct key-value 구조 지원
      const dataObj = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      let appliedCount = 0;

      Object.keys(dataObj).forEach((key) => {
        if (dataObj[key] !== null && typeof dataObj[key] === 'string') {
          localStorage.setItem(key, dataObj[key]);
          appliedCount++;
        }
      });

      if (appliedCount === 0) {
        throw new Error('No valid game keys found in backup data');
      }

      setRestoredKeyCount(appliedCount);
      setRestoreSuccess(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

      // 성공 안내 후 1.8초 뒤 앱 자동 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (err: any) {
      console.error('Restore error:', err);
      setScanError(lang === 'ko' ? `복원 실패: ${err.message || '데이터 손상'}` : `Restore failed: ${err.message || 'Corrupted data'}`);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }
  }, [lang]);

  // 4. 스캔된 텍스트 청크 수집 및 조합기 (압축/비압축/단일/분할 포맷 완벽 감지)
  const processScannedText = useCallback((scannedText: string) => {
    if (!scannedText || typeof scannedText !== 'string') return;
    const text = scannedText.trim();

    // A. 단일 고밀도 LZ 압축 포맷
    if (text.startsWith('SNSHERO_LZ|')) {
      const compressed = text.slice('SNSHERO_LZ|'.length);
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
        if (decompressed) {
          applyRestoreJson(decompressed);
          return;
        }
      } catch (e) {
        console.error('Decompression error', e);
      }
    }

    // B. 분할 LZ 압축 청크 포맷
    if (text.startsWith('SNSHERO_LZCHUNK|')) {
      const parts = text.split('|');
      if (parts.length >= 5) {
        const [, sessId, totalStr, indexStr] = parts;
        const chunkData = parts.slice(4).join('|');
        const total = parseInt(totalStr, 10);
        const index = parseInt(indexStr, 10);

        if (isNaN(total) || isNaN(index) || total <= 0 || index <= 0) return;

        setReceivedChunks((prev) => {
          if (scanSessionId !== sessId || !isCompressedSession) {
            setScanSessionId(sessId);
            setIsCompressedSession(true);
            setTotalChunksExpected(total);
            setLastScannedIdx(index);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
            const newMap: Record<number, string> = { [index]: chunkData };

            if (total === 1) {
              const decompressed = LZString.decompressFromEncodedURIComponent(chunkData);
              if (decompressed) applyRestoreJson(decompressed);
            }
            return newMap;
          }

          if (prev[index]) return prev;

          const updated = { ...prev, [index]: chunkData };
          setLastScannedIdx(index);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');

          if (Object.keys(updated).length >= total) {
            let fullCompressed = '';
            for (let i = 1; i <= total; i++) {
              if (!updated[i]) return updated;
              fullCompressed += updated[i];
            }
            const decompressed = LZString.decompressFromEncodedURIComponent(fullCompressed);
            if (decompressed) {
              applyRestoreJson(decompressed);
            } else {
              setScanError(lang === 'ko' ? '데이터 압축 해제에 실패했습니다.' : 'Decompression failed.');
            }
          }
          return updated;
        });
        return;
      }
    }

    // C. 레거시 일반 비압축 분할 청크 포맷
    if (text.startsWith('SNSHERO_CHUNK|')) {
      const parts = text.split('|');
      if (parts.length >= 5) {
        const [, sessId, totalStr, indexStr] = parts;
        const chunkData = parts.slice(4).join('|');
        const total = parseInt(totalStr, 10);
        const index = parseInt(indexStr, 10);

        if (isNaN(total) || isNaN(index) || total <= 0 || index <= 0) return;

        setReceivedChunks((prev) => {
          if (scanSessionId !== sessId || isCompressedSession) {
            setScanSessionId(sessId);
            setIsCompressedSession(false);
            setTotalChunksExpected(total);
            setLastScannedIdx(index);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
            const newMap: Record<number, string> = { [index]: chunkData };

            if (total === 1) {
              applyRestoreJson(chunkData);
            }
            return newMap;
          }

          if (prev[index]) return prev;

          const updated = { ...prev, [index]: chunkData };
          setLastScannedIdx(index);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');

          if (Object.keys(updated).length >= total) {
            let fullStr = '';
            for (let i = 1; i <= total; i++) {
              if (!updated[i]) return updated;
              fullStr += updated[i];
            }
            applyRestoreJson(fullStr);
          }
          return updated;
        });
        return;
      }
    }

    // D. 단일 레거시 JSON 포맷
    if (text.startsWith('{') && text.endsWith('}')) {
      applyRestoreJson(text);
    }
  }, [scanSessionId, isCompressedSession, applyRestoreJson, lang]);

  // 5. 카메라 비디오 스트림 및 jsQR 스캐닝 루프
  useEffect(() => {
    if (mode !== 'restore' || activeTab !== 'camera' || restoreSuccess) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      setCameraStarted(false);
      return;
    }

    let isScanning = true;

    const startCamera = async () => {
      try {
        setScanError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setCameraStarted(true);
          requestAnimationFrame(scanQRCode);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setScanError(t('camera_permission_error', lang));
      }
    };

    const scanQRCode = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            processScannedText(code.data);
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(scanQRCode);
    };

    startCamera();

    return () => {
      isScanning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setCameraStarted(false);
    };
  }, [mode, activeTab, restoreSuccess, processScannedText, lang]);

  // 클립보드 복사
  const handleCopyText = () => {
    if (!backupFullJson) return;
    navigator.clipboard.writeText(backupFullJson).then(() => {
      setCopied(true);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // JSON 파일 다운로드
  const handleDownloadFile = () => {
    if (!backupFullJson) return;
    try {
      const blob = new Blob([backupFullJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `snshero_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  // 단일/다중 QR 이미지 파일 업로드 스캔
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
              processScannedText(code.data);
            } else {
              setScanError(lang === 'ko' ? '이미지에서 QR코드를 인식하지 못했습니다.' : 'Could not decode QR from image.');
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // JSON 파일 업로드 복원
  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        applyRestoreJson(content);
      }
    };
    reader.readAsText(file);
  };

  // 수동 텍스트 직접 입력 복원
  const handleManualTextSubmit = () => {
    if (!manualText.trim()) return;
    const text = manualText.trim();
    if (text.startsWith('SNSHERO_') || text.startsWith('{')) {
      processScannedText(text);
      setManualText('');
    } else {
      // 압축 텍스트 직접 입력인 경우 시도
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(text);
        if (decompressed) {
          applyRestoreJson(decompressed);
          setManualText('');
          return;
        }
      } catch {}
      applyRestoreJson(text);
    }
  };

  if (!mode) return null;

  const currentChunkString = chunks[currentChunkIdx] || '';
  const totalChunksCount = chunks.length;
  const receivedCount = Object.keys(receivedChunks).length;
  const progressPercent = totalChunksExpected && totalChunksExpected > 0 
    ? Math.round((receivedCount / totalChunksExpected) * 100) 
    : 0;

  const compressionRatio = backupStats.rawSize > 0 
    ? Math.round((1 - backupStats.compressedSize / backupStats.rawSize) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] border-2 border-[#201d1d] rounded-none p-4 sm:p-5 w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl relative text-[#201d1d] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/20 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#201d1d]" />
            <h2 className="text-sm sm:text-base font-black tracking-tight text-[#201d1d]">
              {mode === 'backup' 
                ? (lang === 'ko' ? '고밀도 초압축 QR 백업' : 'ULTRA-COMPACT QR BACKUP')
                : (lang === 'ko' ? '초고속 QR 스캔 계정 복원' : 'FAST QR RESTORE')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 border border-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc] transition-colors rounded-sm font-bold cursor-pointer"
          >
            [X] {lang === 'ko' ? '닫기' : 'CLOSE'}
          </button>
        </div>

        {/* MODE: BACKUP */}
        {mode === 'backup' && (
          <div className="flex flex-col items-center space-y-3">
            {/* Optimization Status Badge */}
            <div className="bg-[#201d1d]/5 border border-[#201d1d]/15 p-2.5 rounded-none text-left w-full text-[11px] leading-relaxed text-[#201d1d]/80">
              <div className="flex items-center gap-1.5 font-bold text-[#201d1d] mb-1">
                <Zap size={13} className="text-amber-600 fill-amber-500" />
                <span>{lang === 'ko' ? '스마트 필터링 & 고밀도 무손실 압축 적용' : 'Smart Filter & High-Density Compression'}</span>
              </div>
              <p>
                {lang === 'ko' ? (
                  <>
                    불필요한 임시 로그/캐시를 제외하고 <b>진짜 계정 데이터 {backupStats.totalKeys}개 항목</b>을 초압축하여 <b>단 {totalChunksCount}개의 고용량 QR</b>로 생성했습니다. (압축 절감률: <b>{compressionRatio}%</b>)
                  </>
                ) : (
                  <>
                    Excluded temporary cache/logs and compressed <b>{backupStats.totalKeys} essential account keys</b> into <b>{totalChunksCount} high-density QR chunk(s)</b> ({compressionRatio}% reduction).
                  </>
                )}
              </p>
            </div>

            {/* QR Canvas Box */}
            <div className="relative bg-white p-3 sm:p-4 border-2 border-[#201d1d] rounded-none shadow-md flex flex-col items-center justify-center my-1 min-h-[270px] w-full max-w-[290px]">
              {currentChunkString ? (
                <>
                  <QRCodeSVG
                    value={currentChunkString}
                    size={240}
                    level="L" // 최대 데이터 수용량 (Low error correction)
                    includeMargin={false}
                  />
                  {/* Floating Frame Index Badge */}
                  <div className="mt-2.5 px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs font-black rounded-none flex items-center gap-2">
                    <span>
                      {totalChunksCount === 1 
                        ? (lang === 'ko' ? '단일 고용량 QR (100%)' : 'SINGLE HIGH-CAPACITY QR')
                        : `CHUNK: ${currentChunkIdx + 1} / ${totalChunksCount}`}
                    </span>
                    {totalChunksCount > 1 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                  </div>
                </>
              ) : (
                <div className="py-12 text-xs font-bold text-slate-500 animate-pulse">
                  Generating High-Density QR...
                </div>
              )}
            </div>

            {/* Chunk Progress Bar & Dots (Only if multi-chunk) */}
            {totalChunksCount > 1 && (
              <div className="w-full space-y-1.5 px-1">
                <div className="flex items-center justify-between text-[10px] text-[#201d1d]/70 font-bold">
                  <span>{lang === 'ko' ? '조각 롤링 진행률' : 'Chunk Rotation'}</span>
                  <span>{Math.round(((currentChunkIdx + 1) / totalChunksCount) * 100)}%</span>
                </div>
                <div className="w-full bg-[#201d1d]/10 h-1.5 rounded-none overflow-hidden">
                  <div
                    className="bg-[#201d1d] h-full transition-all duration-200"
                    style={{ width: `${((currentChunkIdx + 1) / totalChunksCount) * 100}%` }}
                  />
                </div>
                {/* Chunk Dot Grid */}
                <div className="flex flex-wrap items-center justify-center gap-1 pt-1 max-h-12 overflow-y-auto">
                  {chunks.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentChunkIdx(idx);
                      }}
                      className={`text-[9px] px-1.5 py-0.5 border transition-all cursor-pointer ${
                        idx === currentChunkIdx
                          ? 'bg-[#201d1d] text-white border-[#201d1d] font-black scale-105'
                          : 'bg-white text-[#201d1d]/70 border-[#201d1d]/20 hover:border-[#201d1d]'
                      }`}
                    >
                      #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Playback Controls & Speed Options (Only if multi-chunk) */}
            {totalChunksCount > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full pt-1 border-t border-[#201d1d]/10">
                {/* Play/Pause & Step Buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentChunkIdx((prev) => (prev - 1 + chunks.length) % chunks.length);
                    }}
                    className="p-2 border border-[#201d1d] hover:bg-[#201d1d] hover:text-white transition-colors cursor-pointer"
                    title="Previous Chunk"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-2 border border-[#201d1d] bg-[#201d1d] text-white hover:opacity-90 transition-opacity font-bold text-xs flex items-center gap-1.5 cursor-pointer min-w-[90px] justify-center"
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={14} />
                        <span>[ {lang === 'ko' ? '일시정지' : 'PAUSE'} ]</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        <span>[ {lang === 'ko' ? '자동재생' : 'PLAY'} ]</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentChunkIdx((prev) => (prev + 1) % chunks.length);
                    }}
                    className="p-2 border border-[#201d1d] hover:bg-[#201d1d] hover:text-white transition-colors cursor-pointer"
                    title="Next Chunk"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Speed Select Buttons */}
                <div className="flex items-center gap-1 text-[10px] w-full sm:w-auto justify-center">
                  <span className="text-[#201d1d]/60 font-bold mr-0.5">{lang === 'ko' ? '속도:' : 'SPEED:'}</span>
                  {[
                    { ms: 300, label: '0.3s' },
                    { ms: 600, label: '0.6s' },
                    { ms: 1000, label: '1.0s' },
                  ].map((item) => (
                    <button
                      key={item.ms}
                      onClick={() => setSpeedMs(item.ms)}
                      className={`px-1.5 py-1 border transition-all cursor-pointer font-bold ${
                        speedMs === item.ms
                          ? 'bg-[#201d1d] text-white border-[#201d1d]'
                          : 'bg-white text-[#201d1d] border-[#201d1d]/20 hover:bg-[#201d1d]/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stats & Alternative Export Buttons */}
            <div className="w-full space-y-2 pt-2 border-t border-[#201d1d]/10">
              <div className="flex items-center justify-between text-[11px] text-[#201d1d]/70 px-1">
                <span>
                  {lang === 'ko' 
                    ? `용량: ${(backupStats.rawSize / 1024).toFixed(1)} KB → ${(backupStats.compressedSize / 1024).toFixed(1)} KB` 
                    : `Size: ${(backupStats.rawSize / 1024).toFixed(1)} KB → ${(backupStats.compressedSize / 1024).toFixed(1)} KB`}
                </span>
                <span>{lang === 'ko' ? `핵심 데이터: ${backupStats.totalKeys}개 항목` : `Keys: ${backupStats.totalKeys}`}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleCopyText}
                  className="py-2.5 px-3 border border-[#201d1d] bg-white text-[#201d1d] text-xs font-bold hover:bg-[#201d1d]/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? (lang === 'ko' ? '복사 완료!' : 'COPIED!') : (lang === 'ko' ? '[+] 전체 텍스트 복사' : '[+] COPY FULL JSON')}</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="py-2.5 px-3 border border-[#201d1d] bg-[#201d1d] text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  <span>{lang === 'ko' ? '[+] 백업 파일 (.json) 저장' : '[+] DOWNLOAD .JSON'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE: RESTORE */}
        {mode === 'restore' && (
          <div className="flex flex-col items-center space-y-3">
            {/* Tab Selector */}
            <div className="flex w-full border-b border-[#201d1d]/20 mb-1">
              <button
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'camera'
                    ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                    : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
                }`}
              >
                <Camera size={14} />
                <span>{lang === 'ko' ? '카메라 스캔 복원' : 'CAMERA SCAN'}</span>
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'file'
                    ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                    : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
                }`}
              >
                <Upload size={14} />
                <span>{lang === 'ko' ? '파일 불러오기' : 'FILE IMPORT'}</span>
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'text'
                    ? 'border-[#201d1d] text-[#201d1d] bg-[#201d1d]/5'
                    : 'border-transparent text-[#201d1d]/50 hover:text-[#201d1d]'
                }`}
              >
                <FileText size={14} />
                <span>{lang === 'ko' ? '텍스트 붙여넣기' : 'TEXT PASTE'}</span>
              </button>
            </div>

            {/* RESTORE SUCCESS PANEL */}
            {restoreSuccess ? (
              <div className="w-full p-6 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 flex flex-col items-center text-center space-y-3 my-4 animate-in fade-in zoom-in-95">
                <ShieldCheck size={48} className="text-emerald-600 animate-bounce" />
                <h3 className="text-base font-black text-emerald-900">
                  {lang === 'ko' ? '✓ 계정 데이터 복원 완료!' : '✓ ACCOUNT RESTORE COMPLETED!'}
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {lang === 'ko'
                    ? `총 ${restoredKeyCount}개 항목의 덱, 룬, 레벨, 퀘스트, 재화 데이터가 안전하게 복원되었습니다.\n잠시 후 게임이 자동으로 새로고침됩니다.`
                    : `Successfully restored ${restoredKeyCount} data keys (decks, runes, gold, progress).\nApp will reload momentarily.`}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-5 py-2.5 bg-emerald-700 text-white font-black text-xs rounded-none hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  <span>{lang === 'ko' ? '즉시 새로고침' : 'RELOAD NOW'}</span>
                </button>
              </div>
            ) : (
              <>
                {/* TAB 1: CAMERA SCAN */}
                {activeTab === 'camera' && (
                  <div className="w-full flex flex-col items-center space-y-3">
                    <p className="text-[11px] text-[#201d1d]/70 text-center leading-relaxed">
                      {lang === 'ko'
                        ? '다른 기기의 백업 QR 화면을 카메라 중앙에 비춰주세요. 0.1초 만에 감지되어 즉시 복원됩니다.'
                        : 'Aim camera at the backup QR code. It will instantly decode and restore all data.'}
                    </p>

                    {/* Camera Video Viewport */}
                    <div className="relative w-full max-w-[320px] aspect-square bg-black border-2 border-[#201d1d] overflow-hidden flex items-center justify-center shadow-inner">
                      <video ref={videoRef} className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Viewfinder Target Overlay */}
                      <div className="absolute inset-4 border border-emerald-400/50 pointer-events-none flex flex-col justify-between p-1">
                        <div className="flex justify-between">
                          <span className="w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                          <span className="w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                        </div>
                        <div className="flex justify-between">
                          <span className="w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                          <span className="w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                        </div>
                      </div>

                      {/* Active Scan Laser Line */}
                      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse pointer-events-none" />

                      {/* Last Scanned Feedback Toast */}
                      {lastScannedIdx !== null && (
                        <div className="absolute bottom-2 inset-x-2 bg-black/80 text-emerald-400 text-[10px] font-black py-1 px-2 text-center border border-emerald-500/50 flex items-center justify-center gap-1">
                          <Check size={12} />
                          <span>CAPTURED CHUNK #{lastScannedIdx}</span>
                        </div>
                      )}
                    </div>

                    {/* Live Progress Bar & Chunk Grid Indicator (if multiple chunks) */}
                    {totalChunksExpected && totalChunksExpected > 1 && (
                      <div className="w-full bg-[#201d1d]/5 border border-[#201d1d]/20 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-[#201d1d]">
                          <span>
                            {lang === 'ko' ? '조각 수집 진행도:' : 'Chunks Collected:'}{' '}
                            <span className="text-emerald-700 font-black">
                              {receivedCount} / {totalChunksExpected}
                            </span>
                          </span>
                          <span className="font-mono text-emerald-700 font-black">{progressPercent}%</span>
                        </div>

                        <div className="w-full bg-slate-200 h-2 rounded-none overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* Chunk Badge Statuses */}
                        <div className="flex flex-wrap gap-1 pt-1 justify-center max-h-16 overflow-y-auto">
                          {Array.from({ length: totalChunksExpected }, (_, i) => i + 1).map((idx) => {
                            const isCollected = !!receivedChunks[idx];
                            return (
                              <span
                                key={idx}
                                className={`text-[9px] px-1.5 py-0.5 border font-bold flex items-center gap-0.5 ${
                                  isCollected
                                    ? 'bg-emerald-600 text-white border-emerald-700 font-black'
                                    : 'bg-white text-slate-400 border-slate-200'
                                }`}
                              >
                                {isCollected ? '✓' : '·'} #{idx}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {scanError && (
                      <div className="w-full p-2 bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{scanError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: FILE IMPORT */}
                {activeTab === 'file' && (
                  <div className="w-full space-y-4 py-2">
                    <div className="p-3 border border-[#201d1d]/20 bg-[#201d1d]/5 space-y-2">
                      <label className="block text-xs font-black text-[#201d1d]">
                        [1] {lang === 'ko' ? '백업 JSON 파일 직접 복원 (.json)' : 'Restore from Backup File (.json)'}
                      </label>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleJsonFileUpload}
                        className="w-full text-xs p-1.5 border border-[#201d1d]/30 bg-white cursor-pointer"
                      />
                    </div>

                    <div className="p-3 border border-[#201d1d]/20 bg-[#201d1d]/5 space-y-2">
                      <label className="block text-xs font-black text-[#201d1d]">
                        [2] {lang === 'ko' ? 'QR 코드 이미지 파일 스캔 (다중 선택 가능)' : 'Scan QR Image Files (Multiple)'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFileUpload}
                        className="w-full text-xs p-1.5 border border-[#201d1d]/30 bg-white cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: TEXT PASTE */}
                {activeTab === 'text' && (
                  <div className="w-full space-y-3 py-2">
                    <p className="text-[11px] text-[#201d1d]/70 leading-relaxed">
                      {lang === 'ko'
                        ? '클립보드에 복사된 전체 백업 JSON, 분할 청크 텍스트 또는 압축 코드를 붙여넣고 복원을 클릭하세요.'
                        : 'Paste full JSON text, chunk text, or compressed string below and click Restore.'}
                    </p>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      rows={5}
                      placeholder={lang === 'ko' ? '백업 JSON 또는 압축 코드를 여기에 붙여넣으세요...' : 'Paste backup JSON or compressed string here...'}
                      className="w-full text-xs p-2 border border-[#201d1d]/30 bg-white focus:outline-none focus:border-[#201d1d] font-mono"
                    />
                    <button
                      onClick={handleManualTextSubmit}
                      disabled={!manualText.trim()}
                      className="w-full py-2.5 bg-[#201d1d] text-white text-xs font-bold hover:opacity-90 disabled:opacity-30 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>{lang === 'ko' ? '[+] 데이터 복원 적용' : '[+] APPLY RESTORE'}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

