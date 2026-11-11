import React, { useEffect, useMemo, useState } from 'react';
import { hsAudio } from '../audio';
import {
  CLASSIC_RANK_NAMES,
  CLASS_CREST_URL,
  cardDb,
  getHeroArtUrl,
} from '../cardDb';
import { hsStorage } from '../storage';
import {
  BoardThemeId,
  CLASSIC_HEROES,
  CustomDeck,
  GameMode,
  HERO_CLASS_ORDER,
  HeroClass,
} from '../types';

export interface HeroDeckSelectScreenProps {
  initialMode: GameMode;
  onBack: () => void;
  onEditDecks: () => void;
  onLaunchBattle: (params: {
    mode: GameMode;
    deck: CustomDeck;
    preferredOpponentClass?: HeroClass;
    boardTheme?: BoardThemeId;
  }) => void;
}

const DEFAULT_SPINNER_TITLES = [
  '가치 있는 상대',
  '멀록 조련사',
  '치즈 장인',
  '전설의 카드 수집가',
  '동전 던지기 달인',
  '화난 닭 사육사',
  '여관의 단골손님',
  '비전 마법 학도',
  '검투사 지망생',
  '비밀 결사단원',
  '주사위의 신',
  '전장의 지휘관',
];

export const HeroDeckSelectScreen: React.FC<HeroDeckSelectScreenProps> = ({
  initialMode,
  onBack,
  onEditDecks,
  onLaunchBattle,
}) => {
  const decks = useMemo(() => hsStorage.getDecks(), []);
  const profile = useMemo(() => hsStorage.getProfile(), []);

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'preset_mage');
  const [practiceOpponentClass, setPracticeOpponentClass] = useState<HeroClass>('WARRIOR');
  const [boardTheme, setBoardTheme] = useState<BoardThemeId | 'RANDOM'>('RANDOM');

  const [matching, setMatching] = useState(false);
  const [wheelIndex, setWheelIndex] = useState(0);
  const [wheelLocked, setWheelLocked] = useState(false);

  const spinnerTitles = useMemo(() => {
    const fromManifest = cardDb.getManifest()?.koKR?.spinnerTitles;
    if (fromManifest && fromManifest.length >= 8) {
      return ['가치 있는 상대', ...fromManifest.filter((x) => x !== '가치 있는 상대')];
    }
    return DEFAULT_SPINNER_TITLES;
  }, []);

  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) || decks[0],
    [decks, selectedDeckId],
  );
  const hero = CLASSIC_HEROES[selectedDeck.heroClass];
  const isPractice = mode === 'PRACTICE_NORMAL' || mode === 'PRACTICE_EXPERT';

  useEffect(() => {
    if (!matching) return;
    let tick = 0;
    const maxTicks = 18;
    let timer: number;

    const step = () => {
      tick += 1;
      if (tick < maxTicks) {
        setWheelIndex((prev) => (prev + 1) % spinnerTitles.length);
        hsAudio.playSfx('ui_hover', 0.45);
        timer = window.setTimeout(step, 65 + tick * 12);
      } else {
        setWheelIndex(0);
        setWheelLocked(true);
        hsAudio.playSfx('menu_select', 0.95);
        timer = window.setTimeout(() => {
          onLaunchBattle({
            mode,
            deck: selectedDeck,
            preferredOpponentClass: isPractice ? practiceOpponentClass : undefined,
            boardTheme: boardTheme === 'RANDOM' ? undefined : boardTheme,
          });
        }, 780);
      }
    };

    timer = window.setTimeout(step, 80);
    return () => clearTimeout(timer);
  }, [
    matching,
    spinnerTitles,
    mode,
    selectedDeck,
    isPractice,
    practiceOpponentClass,
    boardTheme,
    onLaunchBattle,
  ]);

  const handleStartClick = () => {
    if (selectedDeck.cards.length < 30) return;
    hsAudio.playSfx('box_press');
    setWheelLocked(false);
    setMatching(true);
  };

  const rankMedalImg =
    profile.rank === 0 ? '/hs-assets/ui/medal_legend.webp' : '/hs-assets/ui/medal_bronze.webp';

  return (
    <div
      style={{ backgroundImage: 'url(/hs-assets/ui/box_table_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cover bg-center p-3 sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-black/62" />

      {/* Top Brass Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('box_close');
            onBack();
          }}
          className="hs-brass-btn rounded-xl px-4 py-2 text-xs font-extrabold text-amber-100 sm:text-sm"
        >
          ← 여관 상자로 돌아가기
        </button>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#c39c54] bg-stone-950/90 p-1 shadow-xl">
          {!isPractice && mode !== 'TUTORIAL' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('RANKED');
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                  mode === 'RANKED'
                    ? 'bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                <img src={rankMedalImg} alt="" className="h-4 w-4 object-contain" />
                <span>클래식 등급전</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('CASUAL');
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                  mode === 'CASUAL'
                    ? 'bg-gradient-to-b from-sky-500 to-blue-800 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                <img
                  src="/hs-assets/ui/box_compass_medallion.webp"
                  alt=""
                  className="h-4 w-4 object-contain"
                />
                <span>일반전</span>
              </button>
            </>
          ) : isPractice ? (
            <>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('PRACTICE_NORMAL');
                }}
                className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                  mode === 'PRACTICE_NORMAL'
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-800 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                일반 여관주인
              </button>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('PRACTICE_EXPERT');
                }}
                className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                  mode === 'PRACTICE_EXPERT'
                    ? 'bg-gradient-to-b from-red-600 to-red-900 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                숙련 여관주인 (메타 덱)
              </button>
            </>
          ) : (
            <span className="px-4 py-1 text-xs font-extrabold text-emerald-300">
              하스스톤 실전 입문 튜토리얼
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('ui_click');
            onEditDecks();
          }}
          className="hs-brass-btn flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-amber-100 sm:text-sm"
        >
          <img
            src={CLASS_CREST_URL[selectedDeck.heroClass]}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
          <span>내 카드첩 · 덱 편집</span>
        </button>
      </header>

      {/* Main Content: 3x3 Deck Tray + Right Hero Showcase & Carved Swirl Play Button */}
      <main className="relative z-20 mx-auto my-auto grid w-full max-w-6xl grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left 7 Cols: 9-Slot Deck Selection Box */}
        <section className="hs-wood-panel rounded-3xl p-4 sm:p-5 lg:col-span-7">
          <div className="mb-3 flex items-center justify-between border-b border-amber-500/25 pb-2">
            <h2 className="hs-title text-base font-extrabold text-amber-100 sm:text-lg">
              전투에 출전할 덱 선택
            </h2>
            <span className="text-xs font-bold text-amber-300/85">
              보유 덱 {decks.length}개 · 30장 편성 완료 덱만 출전 가능
            </span>
          </div>

          <div className="grid max-h-[58vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
            {decks.map((d) => {
              const dh = CLASSIC_HEROES[d.heroClass];
              const isSelected = d.id === selectedDeck.id;
              const isComplete = d.cards.length === 30;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    hsAudio.playSfx('cm_select_hero', 0.7);
                    setSelectedDeckId(d.id);
                  }}
                  style={{ background: dh.frameGradient }}
                  className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border-[3px] p-3 text-left transition ${
                    isSelected
                      ? 'scale-[1.02] border-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.8)]'
                      : 'border-[#b9934c]/70 opacity-90 hover:border-amber-300 hover:opacity-100'
                  }`}
                >
                  {/* Official Class Crest Badge in Top-Right Corner */}
                  <img
                    src={CLASS_CREST_URL[d.heroClass]}
                    alt=""
                    className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full border border-amber-200/80 object-cover shadow"
                  />

                  <div className="relative h-20 w-20 overflow-hidden rounded-t-[40px] rounded-b-xl border-2 border-[#ebd08e] bg-stone-950 shadow-lg">
                    <img
                      src={getHeroArtUrl(dh.heroId)}
                      alt={dh.nameKo}
                      className="h-full w-full scale-110 object-cover object-top transition group-hover:scale-120"
                    />
                  </div>

                  <div className="mt-2 w-full text-center">
                    <div className="hs-outline-sm truncate text-xs font-extrabold text-white">
                      {d.name}
                    </div>
                    <div className="mt-0.5 flex items-center justify-center gap-1.5 text-[10.5px] font-bold text-amber-200">
                      <span>{dh.classNameKo}</span>
                      <span>·</span>
                      <span className={isComplete ? 'text-emerald-300' : 'text-red-300'}>
                        {d.cards.length}/30장
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right 5 Cols: Hero Showcase, Rank/Opponent & Authentic Carved Swirl PLAY Button */}
        <section className="hs-wood-panel relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 text-amber-100 lg:col-span-5">
          {/* Subtle Royal Blue Banner Backdrop */}
          <img
            src="/hs-assets/ui/banner_royal_blue.webp"
            alt=""
            className="pointer-events-none absolute -top-6 right-0 w-64 object-contain opacity-20"
          />

          <div className="relative z-10 flex items-center gap-4">
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-t-[50px] rounded-b-xl border-[3.5px] border-[#e7c57c] bg-stone-950 shadow-[0_12px_26px_rgba(0,0,0,0.85)]">
              <img
                src={getHeroArtUrl(hero.heroId)}
                alt={hero.nameKo}
                className="h-full w-full scale-110 object-cover object-top"
              />
              <img
                src={CLASS_CREST_URL[selectedDeck.heroClass]}
                alt=""
                className="absolute bottom-1 right-1 h-6 w-6 rounded-full border border-amber-200 object-cover shadow"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div
                style={{ color: hero.accentColor }}
                className="text-xs font-extrabold uppercase tracking-wider"
              >
                {hero.classNameKo} · {hero.titleKo}
              </div>
              <div className="hs-title hs-outline-sm truncate text-2xl font-extrabold text-white">
                {hero.nameKo}
              </div>
              <div className="mt-0.5 truncate text-xs font-bold text-amber-200">
                출전 덱: {selectedDeck.name}
              </div>
              <div className="mt-2 rounded-xl border border-[#c8a158]/40 bg-black/45 px-2.5 py-1.5 text-[11px] leading-snug">
                <b className="text-sky-300">영웅 능력 [{hero.heroPowerNameKo}]:</b>{' '}
                {hero.heroPowerTextKo}
              </div>
            </div>
          </div>

          {/* Practice Opponent Picker OR Classic Rank Medallion */}
          {isPractice ? (
            <div className="relative z-10 my-3 rounded-2xl border border-[#c8a158]/40 bg-black/40 p-3">
              <div className="mb-2 text-xs font-extrabold text-amber-200">
                대전할 여관주인 직업 선택
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {HERO_CLASS_ORDER.map((hc) => {
                  const ch = CLASSIC_HEROES[hc];
                  const active = practiceOpponentClass === hc;
                  return (
                    <button
                      key={hc}
                      type="button"
                      onClick={() => {
                        hsAudio.playSfx('ui_click');
                        setPracticeOpponentClass(hc);
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-extrabold transition ${
                        active
                          ? 'border-yellow-300 bg-gradient-to-b from-amber-600 to-amber-900 text-white shadow'
                          : 'border-stone-700 bg-stone-900/85 text-amber-100/80 hover:border-amber-500'
                      }`}
                    >
                      <img
                        src={CLASS_CREST_URL[hc]}
                        alt=""
                        className="h-4 w-4 rounded-full object-cover"
                      />
                      <span>{ch.classNameKo}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="relative z-10 my-3 flex items-center justify-between rounded-2xl border border-[#c8a158]/40 bg-black/40 p-3.5">
              <div>
                <div className="text-[11px] font-bold text-amber-300">현재 오리지널 등급</div>
                <div className="hs-title text-lg font-extrabold text-white">
                  {profile.rank === 0
                    ? '전설 (LEGEND)'
                    : `${profile.rank}등급 · ${CLASSIC_RANK_NAMES[profile.rank]}`}
                </div>
                <div className="mt-0.5 text-[11px] text-amber-200/75">
                  승리 시 별 획득 · 연승 보너스 및 3승당 10골드 지급
                </div>
              </div>
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <img
                  src={rankMedalImg}
                  alt="등급 메달"
                  className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                />
                {profile.rank > 0 && (
                  <span className="hs-num absolute bottom-0 right-0 rounded-full border border-amber-200 bg-stone-950/90 px-1.5 text-xs text-amber-200">
                    {profile.rank}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Battlefield Theme Selector */}
          <div className="relative z-10 mb-3 flex items-center justify-between rounded-xl border border-[#c8a158]/35 bg-black/35 px-3 py-2 text-xs">
            <span className="font-bold text-amber-200">전장 보드</span>
            <div className="flex gap-1">
              {(
                [
                  { id: 'RANDOM', label: '무작위' },
                  { id: 'STORMWIND', label: '스톰윈드' },
                  { id: 'ORGRIMMAR', label: '오그리마' },
                  { id: 'PANDARIA', label: '판다리아' },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBoardTheme(b.id)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                    boardTheme === b.id
                      ? 'bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow'
                      : 'bg-stone-900 text-amber-200/70 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Iconic Hearthstone Carved-Stone Swirl PLAY Medallion Button */}
          <div className="relative z-10 flex flex-col items-center pt-1">
            <button
              type="button"
              disabled={selectedDeck.cards.length < 30}
              onClick={handleStartClick}
              className="hs-arcane-btn group relative flex w-full items-center justify-center gap-3 rounded-2xl py-3.5 text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <img
                src="/hs-assets/ui/play_swirl_medallion.webp"
                alt=""
                className="h-11 w-11 rounded-full object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.9)] transition group-hover:rotate-12 group-hover:scale-110"
              />
              <span className="hs-title hs-outline text-2xl font-extrabold tracking-widest">
                대전 시작
              </span>
            </button>
          </div>
        </section>
      </main>

      <div />

      {/* Authentic Hearthstone Slot-Machine Matchmaking Wheel Modal */}
      {matching && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm">
          <div className="hs-wood-panel flex w-full max-w-md flex-col items-center rounded-3xl p-7 text-center">
            <img
              src="/hs-assets/ui/box_compass_medallion.webp"
              alt=""
              className={`mb-2 h-14 w-14 object-contain drop-shadow ${
                wheelLocked ? '' : 'animate-[hsSlowSpin_3s_linear_infinite]'
              }`}
            />
            <div className="hs-title mb-2 text-base font-extrabold tracking-widest text-amber-200">
              {wheelLocked ? '상대를 찾았습니다!' : '상대 찾는 중...'}
            </div>

            {/* Parchment Slot Machine Window */}
            <div className="relative my-3 flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-[4px] border-[#8b6532] bg-gradient-to-b from-[#d8c398] via-[#f7ecd2] to-[#d5be90] px-4 shadow-[inset_0_8px_18px_rgba(40,22,8,0.55)]">
              <div className="text-xs font-bold text-stone-500 opacity-65">
                {spinnerTitles[(wheelIndex + spinnerTitles.length - 1) % spinnerTitles.length]}
              </div>
              <div
                className={`hs-title my-2 w-full rounded-xl border-y-2 border-amber-800/40 px-4 py-2 text-xl font-black tracking-tight transition-all ${
                  wheelLocked
                    ? 'scale-105 bg-amber-300/70 text-[#2b180a] shadow'
                    : 'text-[#241509]'
                }`}
              >
                {spinnerTitles[wheelIndex]}
              </div>
              <div className="text-xs font-bold text-stone-500 opacity-65">
                {spinnerTitles[(wheelIndex + 1) % spinnerTitles.length]}
              </div>
            </div>

            <p className="mt-2 text-xs font-semibold text-amber-200/80">
              스톤브루의 여관에서 실력이 비슷한 상대를 탐색하고 있습니다...
            </p>

            {!wheelLocked && (
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('box_close');
                  setMatching(false);
                }}
                className="hs-brass-btn mt-4 rounded-xl px-6 py-1.5 text-xs font-extrabold text-amber-100"
              >
                탐색 취소
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
