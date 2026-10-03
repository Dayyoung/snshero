/**
 * RedditGalleryViewer.tsx
 * 사진이 여러 장인 글(Gallery Post)을 위한 네이티브 이미지 슬라이더/캐러셀 컴포넌트
 * 좌우 넘김 버튼, 스와이프 터치 제스처, 도트 인디케이터, 썸네일 스트립 및 N/M 배지 완벽 지원
 */

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Images, ZoomIn, X } from 'lucide-react';

interface RedditGalleryViewerProps {
  images: string[];
  title?: string;
  isDark: boolean;
  isKo?: boolean;
  showThumbnailStrip?: boolean;
  maxHeight?: string;
  onImageClick?: (index: number) => void;
}

export const RedditGalleryViewer: React.FC<RedditGalleryViewerProps> = ({
  images,
  title = '',
  isDark,
  isKo = true,
  showThumbnailStrip = false,
  maxHeight = 'max-h-[500px]',
  onImageClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // 스와이프 제스처를 위한 터치 좌표 추적
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  if (!images || images.length === 0) return null;

  const total = images.length;
  const currentUrl = images[currentIndex] || images[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const handleSelectIndex = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(idx);
  };

  // 모바일 터치 제스처 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const delta = touchDeltaXRef.current;
      // 40px 이상 스와이프 시 사진 전환
      if (delta > 40) {
        handlePrev();
      } else if (delta < -40) {
        handleNext();
      }
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (onImageClick) {
      onImageClick(currentIndex);
    } else {
      e.stopPropagation();
      setIsLightboxOpen(true);
    }
  };

  return (
    <>
      <div 
        className="relative w-full rounded-xl overflow-hidden mb-3 select-none bg-black flex flex-col items-center justify-center group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 1. 메인 이미지 표시 영역 */}
        <div 
          onClick={handleContainerClick}
          className={`relative w-full flex items-center justify-center cursor-zoom-in ${maxHeight} overflow-hidden`}
        >
          <img
            src={currentUrl}
            alt={title ? `${title} (${currentIndex + 1}/${total})` : `Image ${currentIndex + 1}`}
            loading="lazy"
            className="w-full h-auto object-contain transition-all duration-300"
          />

          {/* 호버 시 확대 돋보기 아이콘 */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="p-2.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
              <ZoomIn className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. 우측 상단 갤러리 인디케이터 배지 (예: [📷 1/4]) */}
        <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md border border-white/10 pointer-events-none">
          <Images className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentIndex + 1} / {total}</span>
        </div>

        {/* 3. 좌/우 이전/다음 슬라이드 버튼 (사진이 2장 이상일 때) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label={isKo ? '이전 사진' : 'Previous Image'}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-sm transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer opacity-90 sm:opacity-0 group-hover:opacity-100 border border-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={isKo ? '다음 사진' : 'Next Image'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-sm transition-all shadow-lg hover:scale-110 active:scale-95 cursor-pointer opacity-90 sm:opacity-0 group-hover:opacity-100 border border-white/20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* 4. 하단 도트(Dot) 인디케이터 (사진이 2장 이상일 때) */}
        {total > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleSelectIndex(idx, e)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === idx 
                    ? 'w-4 h-1.5 bg-[#FF4500]' 
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/90'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. 썸네일 스트립 (상세 모달용 옵션) */}
      {showThumbnailStrip && total > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 scrollbar-thin">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleSelectIndex(idx, e)}
              className={`relative flex-shrink-0 w-16 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                currentIndex === idx 
                  ? 'border-[#FF4500] scale-105 shadow-md' 
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
              {currentIndex === idx && (
                <div className="absolute inset-0 bg-[#FF4500]/10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 6. 전체화면 라이트박스 팝업 */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* 상단 툴바 */}
          <div className="w-full flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Images className="w-4 h-4 text-[#FF4500]" />
              <span>{currentIndex + 1} / {total}</span>
              {title && <span className="opacity-60 truncate max-w-md hidden sm:inline">• {title}</span>}
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 중앙 확대 이미지 */}
          <div 
            className="relative flex-1 w-full flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentUrl}
              alt=""
              className="max-w-full max-h-[85vh] object-contain shadow-2xl"
            />

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer shadow-xl"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer shadow-xl"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* 하단 썸네일 탐색 바 */}
          {total > 1 && (
            <div 
              className="flex items-center gap-2 overflow-x-auto max-w-2xl px-4 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-14 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    currentIndex === idx ? 'border-[#FF4500] scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
