import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import { Language } from '../types';
import { t } from '../lib/i18n';

interface BackupRestoreModalProps {
  mode: 'backup' | 'restore' | null;
  onClose: () => void;
  lang: Language;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ mode, onClose, lang }) => {
  const [backupDataString, setBackupDataString] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Collect save data for backup
  useEffect(() => {
    if (mode === 'backup') {
      try {
        const backupPayload: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('hero_') || key === 'firebase_db_mode')) {
            backupPayload[key] = localStorage.getItem(key);
          }
        }
        const jsonString = JSON.stringify({
          version: '1.0',
          timestamp: Date.now(),
          data: backupPayload,
        });
        setBackupDataString(jsonString);
      } catch (err) {
        console.error('Backup generation failed:', err);
      }
    }
  }, [mode]);

  // Camera Scanning for Restore
  useEffect(() => {
    if (mode !== 'restore') return;

    let isScanning = true;

    const startCamera = async () => {
      try {
        setScanError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
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
            handleRestorePayload(code.data);
            isScanning = false;
            return;
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
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [mode]);

  // Restore payload processor
  const handleRestorePayload = (rawString: string) => {
    try {
      const parsed = JSON.parse(rawString);
      if (!parsed || typeof parsed !== 'object' || !parsed.data) {
        throw new Error('Invalid format');
      }

      const dataObj = parsed.data;
      Object.keys(dataObj).forEach((key) => {
        if (dataObj[key] !== null) {
          localStorage.setItem(key, dataObj[key]);
        }
      });

      setRestoreSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Restore parse error:', err);
      alert(t('restore_failed', lang));
    }
  };

  const handleCopyText = () => {
    if (!backupDataString) return;
    navigator.clipboard.writeText(backupDataString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
            handleRestorePayload(code.data);
          } else {
            alert(t('restore_failed', lang));
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualTextSubmit = () => {
    if (!manualText.trim()) return;
    handleRestorePayload(manualText.trim());
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono">
      <div className="bg-[#fdfcfc] border-2 border-[#201d1d] rounded-sm p-5 w-full max-w-md shadow-2xl relative text-[#201d1d]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-sm px-2 py-1 border border-[#201d1d] hover:bg-[#201d1d] hover:text-[#fdfcfc] transition-colors rounded-sm"
        >
          [X]
        </button>

        {mode === 'backup' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-xl font-bold border-b border-[#201d1d]/20 pb-2 w-full">
              {t('backup_modal_title', lang)}
            </h2>
            <p className="text-xs text-[#201d1d]/70">{t('backup_modal_desc', lang)}</p>

            {backupDataString ? (
              <div className="bg-white p-4 border border-[#201d1d]/30 rounded-sm shadow-inner my-2">
                <QRCodeSVG value={backupDataString} size={220} level="M" includeMargin={true} />
              </div>
            ) : (
              <div className="py-8 text-sm">Generating QR Code...</div>
            )}

            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={handleCopyText}
                className="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-sm font-semibold rounded-sm hover:opacity-90 transition-opacity"
              >
                {copied ? t('backup_success', lang) : `[+] ${t('copy_json_data', lang)}`}
              </button>
            </div>
          </div>
        )}

        {mode === 'restore' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-xl font-bold border-b border-[#201d1d]/20 pb-2 w-full">
              {t('restore_modal_title', lang)}
            </h2>
            <p className="text-xs text-[#201d1d]/70">{t('restore_modal_desc', lang)}</p>

            {restoreSuccess ? (
              <div className="p-4 bg-emerald-100 border border-emerald-500 text-emerald-900 rounded-sm text-sm my-4 font-bold">
                ✓ {t('restore_success', lang)}
              </div>
            ) : (
              <>
                <div className="relative w-64 h-64 bg-black rounded-sm overflow-hidden border border-[#201d1d]/40 my-2 flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400 opacity-60 pointer-events-none" />
                </div>

                {scanError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 border border-rose-200 rounded-sm w-full">
                    {scanError}
                  </p>
                )}

                <div className="w-full space-y-3 pt-2 text-left">
                  <div className="border-t border-[#201d1d]/10 pt-3">
                    <label className="block text-xs font-bold mb-1">[+] {t('upload_qr_image', lang)}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-xs p-1 border border-[#201d1d]/30 rounded-sm cursor-pointer"
                    />
                  </div>

                  <div className="border-t border-[#201d1d]/10 pt-3">
                    <label className="block text-xs font-bold mb-1">Backup Code Direct Input</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Paste JSON text here..."
                        className="flex-1 text-xs px-2 py-1 border border-[#201d1d]/30 rounded-sm bg-white"
                      />
                      <button
                        onClick={handleManualTextSubmit}
                        className="px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs rounded-sm font-semibold hover:opacity-90"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
