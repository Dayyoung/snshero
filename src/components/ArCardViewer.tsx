import React, { useState } from 'react';
import { X, Sparkles, Camera, Eye, RotateCw } from 'lucide-react';
import type { Language, CardData } from '../types';

interface ArCardViewerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  ownedCards?: any;
  inventory?: Array<CardData | null>;
  showCameraPreview?: boolean;
  initialCard?: any;
}

export const ArCardViewer: React.FC<ArCardViewerProps> = ({
  isOpen,
  onClose,
  language,
  inventory = [],
  showCameraPreview = false,
  initialCard,
}) => {
  const [selected, setSelected] = useState<any>(initialCard || inventory[0] || null);
  const [rotated, setRotated] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none">
      <div className="relative w-full max-w-md bg-[#fdfcfc] text-[#201d1d] border border-black/20 p-5 rounded-none shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-mono font-bold text-sm tracking-wide uppercase">
              {language === 'ko' ? '[AR 카드 3D 뷰어]' : '[AR Card 3D Viewer]'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/5 active:bg-black/10 transition-colors rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-4">
          <div
            className={`w-48 h-64 border-2 border-black/20 bg-white p-4 rounded-sm flex flex-col items-center justify-between shadow-md transition-transform duration-500 ${
              rotated ? 'rotate-y-180' : ''
            }`}
          >
            <div className="w-full flex justify-between items-center text-[10px] font-mono text-black/60">
              <span>#{selected?.id || '001'}</span>
              <span className="font-bold text-indigo-600 uppercase">{selected?.rarity || 'HERO'}</span>
            </div>

            <div className="my-auto flex flex-col items-center justify-center text-center">
              <Eye className="w-12 h-12 text-black/30 mb-2" />
              <h4 className="font-mono font-bold text-sm">
                {selected?.title || selected?.title_en || selected?.name || 'Selected Hero'}
              </h4>
              <p className="font-mono text-[10px] text-black/50 mt-1">
                PWR: {selected?.power || 100} / HP: {selected?.hp || 100}
              </p>
            </div>

            <div className="w-full text-center text-[9px] font-mono text-black/40 border-t border-black/10 pt-1">
              AR HOLOGRAPHIC PROJECTION
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRotated(!rotated)}
              className="flex items-center gap-1.5 px-3 py-2 border border-black/20 bg-white hover:bg-black/5 font-mono text-xs rounded-sm min-h-[44px]"
            >
              <RotateCw className="w-4 h-4" />
              <span>{language === 'ko' ? '카드 회전' : 'Rotate'}</span>
            </button>
            {showCameraPreview && (
              <button
                onClick={() => {}}
                className="flex items-center gap-1.5 px-3 py-2 border border-black/20 bg-white hover:bg-black/5 font-mono text-xs rounded-sm min-h-[44px]"
              >
                <Camera className="w-4 h-4" />
                <span>{language === 'ko' ? 'AR 카메라' : 'AR Camera'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-black/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#201d1d] text-white font-mono text-xs uppercase font-bold rounded-sm min-h-[44px] hover:bg-black/80 transition-colors"
          >
            {language === 'ko' ? '확인' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArCardViewer;
