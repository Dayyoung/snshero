import React, { useMemo, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

type SpeechRecognitionEventLike = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface CortanaCommandButtonProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  playSfx: (url: string) => void;
  showCustomAlert: (title: string, message: string) => void;
  setIsAutoBattle: (val: boolean) => void;
  isAlignedWithLowChatButton: boolean;
  hidden?: boolean;
  lowSpecMode?: boolean;
}

interface CommandItem {
  key: string;
  labelKey: string;
  target: ViewType;
  aliases: string[];
  priority: 'primary' | 'secondary' | 'utility';
  autoBattle?: boolean;
}

const COMMANDS: CommandItem[] = [
  {
    key: 'ai-battle',
    labelKey: 'cortana_cmd_ai_battle',
    target: 'play',
    aliases: ['ai대전', 'ai 대전', 'ai battle', 'battle', '대전', '플레이', 'play'],
    priority: 'primary',
    autoBattle: true,
  },
  {
    key: 'ranking',
    labelKey: 'cortana_cmd_ranking',
    target: 'ranking',
    aliases: ['랭킹대전', '랭킹', 'ranking', 'rank', 'leaderboard'],
    priority: 'primary',
  },
  {
    key: 'draw',
    labelKey: 'cortana_cmd_draw',
    target: 'shop',
    aliases: ['카드뽑기', '카드 뽑기', '뽑기', '가챠', 'draw', 'gacha', 'card draw'],
    priority: 'primary',
  },
  {
    key: 'deck',
    labelKey: 'cortana_cmd_deck',
    target: 'mydeck',
    aliases: ['내덱', '내 덱', '덱', '카드덱', 'deck', 'my deck'],
    priority: 'primary',
  },
  {
    key: 'event',
    labelKey: 'cortana_cmd_event',
    target: 'event',
    aliases: ['이벤트보기', '이벤트', 'event'],
    priority: 'secondary',
  },
  {
    key: 'skill',
    labelKey: 'cortana_cmd_skill',
    target: 'skill',
    aliases: ['스킬', '스킬강화', '스킬 강화', 'skill', 'skills', 'upgrade skill'],
    priority: 'secondary',
  },
  {
    key: 'companion',
    labelKey: 'cortana_cmd_companion',
    target: 'companion',
    aliases: ['동료', '동료관리', '동료 관리', 'companion', 'buddy'],
    priority: 'secondary',
  },
  {
    key: 'cards',
    labelKey: 'cortana_cmd_cards',
    target: 'wiki-card',
    aliases: ['카드도감', '카드 도감', '도감', 'card wiki', 'cards', 'collection'],
    priority: 'secondary',
  },
  {
    key: 'community',
    labelKey: 'cortana_cmd_community',
    target: 'community',
    aliases: ['커뮤니티', '게시판', '피드', 'community', 'feed'],
    priority: 'utility',
  },
  {
    key: 'guild',
    labelKey: 'cortana_cmd_guild',
    target: 'guild-list',
    aliases: ['길드', '길드관리', '길드 관리', 'guild'],
    priority: 'utility',
  },
  {
    key: 'goods',
    labelKey: 'cortana_cmd_goods',
    target: 'shop',
    aliases: ['굿즈 구매', '굿즈', '상품', 'goods', 'merch', 'shop'],
    priority: 'utility',
  },
  {
    key: 'howto',
    labelKey: 'cortana_cmd_howto',
    target: 'wiki-howtoplay',
    aliases: ['플레이방법', '게임플레이방법', '게임 플레이 방법', '게임방법', '방법', '도움말', 'how to play', 'guide', 'help'],
    priority: 'utility',
  },
];

const getSpeechLanguage = (language: Language): string => {
  if (language === 'ko') return 'ko-KR';
  if (language === 'ja') return 'ja-JP';
  if (language === 'zh-CN') return 'zh-CN';
  if (language === 'zh-TW') return 'zh-TW';
  if (language === 'de') return 'de-DE';
  if (language === 'es') return 'es-ES';
  if (language === 'fr') return 'fr-FR';
  if (language === 'id') return 'id-ID';
  if (language === 'ru') return 'ru-RU';
  if (language === 'th') return 'th-TH';
  if (language === 'vi') return 'vi-VN';
  return 'en-US';
};

const normalizeCommand = (value: string): string => value.toLowerCase().replace(/\s+/g, '');

const commandColorClass: Record<CommandItem['priority'], string> = {
  primary: 'border-rose-200/70 bg-rose-500/82 text-white shadow-[0_0_22px_rgba(244,63,94,0.34)] hover:border-rose-100 hover:bg-rose-400/85',
  secondary: 'border-cyan-200/60 bg-cyan-500/72 text-white shadow-[0_0_20px_rgba(34,211,238,0.28)] hover:border-cyan-100 hover:bg-cyan-400/80',
  utility: 'border-violet-200/55 bg-violet-500/66 text-white shadow-[0_0_18px_rgba(139,92,246,0.26)] hover:border-violet-100 hover:bg-violet-400/76',
};

export const CortanaCommandButton: React.FC<CortanaCommandButtonProps> = ({
  language,
  onNavigate,
  playSfx,
  showCustomAlert,
  setIsAutoBattle,
  isAlignedWithLowChatButton,
  hidden = false,
  lowSpecMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const commandButtons = useMemo(() => {
    const tierCount = 3;
    const tiers = Array.from({ length: tierCount }, (_, tierIndex) => {
      const start = Math.floor((COMMANDS.length * tierIndex) / tierCount);
      const end = Math.floor((COMMANDS.length * (tierIndex + 1)) / tierCount);
      return COMMANDS.slice(start, end);
    });
    const tierRadius = [240, 165, 90];
    const tierAngles = [
      [220, 248, 292, 320], // Outer tier: spaced wider
      [220, 248, 292, 320], // Middle tier: spaced wider
      [220, 248, 292, 320], // Inner tier: spaced wider
    ];

    return tiers.flatMap((commands, tierIndex) => {
      return commands.map((command, commandIndex) => {
        const angle = (tierAngles[tierIndex][commandIndex] ?? 270) * (Math.PI / 180);
        const radius = tierRadius[tierIndex];
        return {
          command,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
      });
    });
  }, []);

  const closeOverlay = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setIsOpen(false);
  };

  const executeCommand = (command: CommandItem) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setIsAutoBattle(Boolean(command.autoBattle));
    onNavigate(command.target);
    closeOverlay();
  };

  const matchCommand = (transcript: string): CommandItem | null => {
    // 1. Lowercase and strip all whitespace
    const cleanTranscript = transcript.toLowerCase().replace(/\s+/g, '');
    
    // 2. Normalize and strip trailing Korean particles (조사) to isolate keywords (e.g. 랭킹대전으로 -> 랭킹대전)
    const normalizedKeyword = cleanTranscript.replace(/[을를이가은는에으로]+$/, '');

    return COMMANDS.find(command =>
      command.aliases.some(alias => {
        const cleanAlias = alias.toLowerCase().replace(/\s+/g, '');
        return normalizedKeyword.includes(cleanAlias) || cleanAlias.includes(normalizedKeyword);
      })
    ) ?? null;
  };

  const showUnknownCommand = () => {
    closeOverlay();
    showCustomAlert(
      t('cortana_unknown_title', language),
      t('cortana_unknown_message', language)
    );
  };

  const startVoiceCommand = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      showUnknownCommand();
      return;
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    const recognition = new Recognition();
    recognition.lang = getSpeechLanguage(language);
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      const command = matchCommand(transcript);
      if (command) {
        executeCommand(command);
      } else {
        showUnknownCommand();
      }
    };

    recognition.onerror = () => {
      showUnknownCommand();
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };

  if (hidden) return null;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            setIsOpen(true);
          }}
          className={cn(
            "fixed left-1/2 z-[9998] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-cyan-300/80 bg-slate-950/92 text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.45)] backdrop-blur-xl transition-all active:scale-95",
            isAlignedWithLowChatButton ? "bottom-4" : "bottom-28",
            !lowSpecMode && "hover:scale-105"
          )}
          aria-label={t('cortana_open', language)}
          title={t('cortana_open', language)}
        >
          <span className={cn("absolute inset-1 rounded-full border border-cyan-300/30", !lowSpecMode && "animate-ping")} />
          <Mic size={24} className="relative z-10" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOverlay}
            className="fixed inset-0 z-[10002] bg-slate-950/75 backdrop-blur-[2px] flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[360px] bg-slate-900/90 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-6 pointer-events-auto"
            >
              {/* Header Title */}
              <div className="text-center">
                <h3 className="text-sm font-black text-cyan-400 tracking-wider uppercase">
                  {t('cortana_open', language)}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  {language === 'ko' ? '원하는 전술 메뉴를 선택하거나 음성으로 명령해보세요.' : 'Select a menu or speak your command.'}
                </p>
              </div>

              {/* Grid of commands */}
              <div className="grid grid-cols-3 gap-2 w-full">
                {COMMANDS.map((command, index) => (
                  <motion.button
                    key={command.key}
                    type="button"
                    initial={lowSpecMode ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: lowSpecMode ? 0 : index * 0.02 }}
                    onClick={() => {
                      executeCommand(command);
                    }}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-xl border px-2 text-center text-[11px] font-black leading-none backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap cursor-pointer",
                      commandColorClass[command.priority]
                    )}
                  >
                    <span className="tracking-tight leading-none select-none">
                      {(() => {
                        const rawText = t(command.labelKey as any, language);
                        if (rawText.startsWith('AI')) {
                          return (
                            <>
                              <span className="inline-block scale-x-[-1] mr-0.5">AI</span>
                              {rawText.substring(2)}
                            </>
                          );
                        }
                        return rawText;
                      })()}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Voice Command Section at bottom */}
              <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5 w-full">
                <button
                  type="button"
                  onClick={startVoiceCommand}
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/40 bg-cyan-400 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.5)] transition-all active:scale-95",
                    isListening && !lowSpecMode ? "animate-pulse" : "hover:bg-cyan-300"
                  )}
                  aria-label={t('cortana_voice', language)}
                  title={t('cortana_voice', language)}
                >
                  <Mic size={34} />
                </button>
                <span className="rounded-full border border-white/15 bg-slate-950/45 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100 backdrop-blur-md">
                  {isListening ? t('cortana_listening', language) : t('cortana_voice', language)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
