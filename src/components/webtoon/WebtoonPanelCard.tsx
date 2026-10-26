import React, { useState } from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { cn, getCardSpriteStyle } from '../../lib/utils';
import { WebtoonSpeechBubble, WebtoonDialogue } from './WebtoonSpeechBubble';
import { WebtoonSfxOverlay, WebtoonSfxCue } from './WebtoonSfxOverlay';

export interface WebtoonPanelCardProps {
 episodeNumber: number;
 sceneIndex: number;
 totalScenes?: number;
 imgUrl: string;
 localArtUrl?: string;
 isKeyClimax?: boolean;
 narrationText: string;
 dialogues?: WebtoonDialogue[];
 sfxCues?: WebtoonSfxCue[];
 language: 'ko' | 'en';
 showBubbles: boolean;
 isFailedAll: boolean;
 onZoom: () => void;
 onError: () => void;
 onPlaySfx?: (cueUrl?: string) => void;
 className?: string;
}

export const WebtoonPanelCard: React.FC<WebtoonPanelCardProps> = ({
 episodeNumber,
 sceneIndex,
 totalScenes = 20,
 imgUrl,
 localArtUrl,
 isKeyClimax,
 narrationText,
 dialogues = [],
 sfxCues = [],
 language,
 showBubbles,
 isFailedAll,
 onZoom,
 onError,
 onPlaySfx,
 className,
}) => {
 const [useLocalArtFailed, setUseLocalArtFailed] = useState(false);

 // If localArtUrl is present and hasn't failed, prefer it for high-res generative visual
 const resolvedSrc = (localArtUrl && !useLocalArtFailed) ? localArtUrl : imgUrl;

 const pad2 = (n: number) => String(n).padStart(2, '0');

 return (
 <div
 className={cn(
 'w-full border-y border-x-0 border-[rgba(15,0,0,0.12)] rounded-none bg-[#fdfcfc] overflow-hidden hover:border-[#201d1d] transition-colors font-mono',
 isKeyClimax && 'border-amber-600/50 shadow-sm',
 className
 )}
 >
 {/* Scene Card Header */}
 <div className="bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] px-3 sm:px-4 py-2.5 flex items-center justify-between text-xs font-mono">
 <div className="flex items-center gap-2">
 <span className="font-bold text-[#201d1d] flex items-center gap-1.5">
 <span
 className={cn(
 'w-2 h-2 rounded-none inline-block',
 isKeyClimax ? 'bg-amber-600' : 'bg-[#201d1d]'
 )}
 />
 {sceneIndex === 0 ? `[ TITLE CARD ]` : `SCENE ${pad2(sceneIndex)} / ${pad2(totalScenes)}`}
 </span>

 {isKeyClimax && (
 <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-600/30 text-amber-800 text-[10px] font-bold rounded-sm flex items-center gap-1">
 <Sparkles size={11} className="text-amber-600" />
 <span>{language === 'ko' ? '클라이맥스 명장면' : 'CLIMAX SCENE'}</span>
 </span>
 )}
 </div>

 <button
 onClick={onZoom}
 className="min-h-[44px] px-3 py-2 border border-[rgba(15,0,0,0.12)] rounded-sm bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
 title={language === 'ko' ? '크게 보기' : 'Fullscreen'}
 >
 <Maximize2 size={14} />
 <span>{language === 'ko' ? '확대' : 'Zoom'}</span>
 </button>
 </div>

 {/* Scene Image Area */}
 <div
 className="relative w-full bg-[#201d1d] flex items-center justify-center min-h-[280px] sm:min-h-[440px] group cursor-pointer overflow-hidden select-none"
 onClick={onZoom}
 >
 {!isFailedAll ? (
 <img
 src={resolvedSrc}
 alt={`Episode ${episodeNumber} Scene ${sceneIndex}`}
 loading="lazy"
 decoding="async"
 referrerPolicy="no-referrer"
 onError={() => {
 if (localArtUrl && !useLocalArtFailed) {
 // Fall back to CDN url first
 setUseLocalArtFailed(true);
 } else {
 onError();
 }
 }}
 className="w-full h-auto block object-cover"
 />
 ) : (
 /* Fallback Character Card Panel */
 <div className="w-full py-12 px-6 flex flex-col items-center justify-center text-center font-mono bg-[#201d1d] text-[#fdfcfc]">
 <div
 style={getCardSpriteStyle(((episodeNumber * 5 + sceneIndex) % 110) + 1)}
 className="w-28 h-28 rounded-none mb-3 border border-[rgba(255,255,255,0.2)] bg-black"
 />
 <span className="text-xs font-bold text-[#fdfcfc] uppercase tracking-widest">
 [ EPISODE {episodeNumber} · {sceneIndex === 0 ? 'TITLE' : `SCENE ${pad2(sceneIndex)}`} ]
 </span>
 </div>
 )}

 {/* Speech Bubbles Overlay */}
 {showBubbles && dialogues.length > 0 && (
 dialogues.map((dialogue, dIdx) => (
 <WebtoonSpeechBubble
 key={`dialogue_${sceneIndex}_${dIdx}`}
 dialogue={dialogue}
 language={language}
 onBubbleClick={() => {
 if (onPlaySfx) onPlaySfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
 }}
 />
 ))
 )}

 {/* SFX Overlay */}
 {showBubbles && sfxCues.length > 0 && (
 sfxCues.map((sfx, sIdx) => (
 <WebtoonSfxOverlay
 key={`sfx_${sceneIndex}_${sIdx}`}
 sfx={sfx}
 language={language}
 onTriggerSfx={() => {
 if (onPlaySfx) {
 const sfxUrl = sfx.style === 'slash'
 ? 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
 : 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
 onPlaySfx(sfxUrl);
 }
 }}
 />
 ))
 )}

 {/* Hover Zoom Prompt Badge */}
 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
 <span className="bg-[#201d1d] text-[#fdfcfc] text-xs px-3 py-1.5 rounded-sm font-bold flex items-center gap-1.5 border border-[#fdfcfc]">
 <Maximize2 size={14} />
 {language === 'ko' ? '클릭하여 큰 화면으로 감상' : 'Click to View Lightbox'}
 </span>
 </div>
 </div>

        {/* Scene Bottom Novel Sentence Card */}
        {narrationText && (
          <div className="bg-[#f8f7f7] border-t border-[rgba(15,0,0,0.12)] px-4 py-3.5 sm:px-5 sm:py-4 font-mono">
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  'text-[#fdfcfc] font-bold text-[11px] px-2 py-0.5 rounded-sm mt-0.5 shrink-0 select-none',
                  isKeyClimax ? 'bg-amber-700' : 'bg-[#201d1d]'
                )}
              >
                {sceneIndex === 0 ? 'TITLE' : `#${pad2(sceneIndex)}`}
              </span>
              <p className="text-xs sm:text-[13px] leading-relaxed text-[#201d1d] font-medium select-text">
                {narrationText.includes('https://SNSHero.com') ? (
                  <>
                    {narrationText.split('https://SNSHero.com')[0]}
                    <a
                      href="https://SNSHero.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline text-amber-800 hover:text-amber-600 transition-colors"
                    >
                      https://SNSHero.com
                    </a>
                    {narrationText.split('https://SNSHero.com')[1]}
                  </>
                ) : (
                  narrationText
                )}
              </p>
            </div>
          </div>
        )}
 </div>
 );
};
