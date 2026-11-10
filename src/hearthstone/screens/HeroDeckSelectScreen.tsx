import React, { useEffect, useMemo, useState } from 'react';
import { hsAudio } from '../audio';
import { CLASSIC_RANK_NAMES, cardDb, getHeroArtUrl } from '../cardDb';
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

  // Matchmaking Wheel State
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
        setWheelIndex(0); // Lock on "가치 있는 상대"!
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
    if (selectedDeck.cards.length < 30) {
      return;
    }
    hsAudio.playSfx('box_press');
    setWheelLocked(false);
    setMatching(true);
  };

  return (
    <div
      style={{ backgroundImage: 'url(/hs-assets/ui/tavern_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cover bg-center p-3 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-black/55" />

      {/* Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('box_close');
            onBack();
          }}
          className="rounded-2xl border-2 border-[#d4af63] bg-gradient-to-b from-[#49301b] to-[#24160b] px-4 py-2 text-sm font-extrabold text-amber-100 shadow-lg hover:brightness-110"
        >
          ← 여관 상자로 돌아가기
        </button>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-[#b8924d] bg-stone-950/85 p-1">
          {!isPractice && mode !== 'TUTORIAL' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('RANKED');
                }}
                className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                  mode === 'RANKED'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                🏆 등급전 (클래식)
              </button>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('CASUAL');
                }}
                className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                  mode === 'CASUAL'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                🎲 일반전
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
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                🍺 일반 여관주인
              </button>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('PRACTICE_EXPERT');
                }}
                className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                  mode === 'PRACTICE_EXPERT'
                    ? 'bg-red-700 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                🔥 숙련 여관주인 (메타 덱)
              </button>
            </>
          ) : (
            <span className="px-4 py-1 text-xs font-extrabold text-emerald-300">
              📖 하스스톤 실전 입문 튜토리얼
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('ui_click');
            onEditDecks();
          }}
          className="rounded-2xl border-2 border-[#d4af63] bg-gradient-to-b from-[#5d3d20] to-[#2e1c0e] px-4 py-2 text-xs font-extrabold text-amber-100 shadow-lg hover:brightness-110 sm:text-sm"
        >
          📕 내 카드첩 / 덱 만들기
        </button>
      </header>

      {/* Main Content: 3x3 Deck Grid + Right Hero Preview & Play */}
      <main className="relative z-20 mx-auto my-auto grid w-full max-w-6xl grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: 9 Decks Grid */}
        <section className="rounded-3xl border-[4px] border-[#c59e56] bg-gradient-to-b from-[#3b2615]/95 to-[#1f130a]/95 p-4 shadow-2xl lg:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="hs-title text-lg font-extrabold text-amber-200">
              전투에 사용할 덱 선택 (오리지널 9직업)
            </h2>
            <span className="text-xs text-amber-300/80">총 {decks.length}개 덱 보유</span>
          </div>

          <div className="grid max-h-[58vh] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
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
                  className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border-[3px] p-2.5 text-left transition ${
                    isSelected
                      ? 'scale-[1.02] border-yellow-300 shadow-[0_0_22px_rgba(250,204,21,0.75)]'
                      : 'border-amber-600/50 opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-amber-200 shadow-lg">
                    <img
                      src={getHeroArtUrl(dh.heroId)}
                      alt={dh.nameKo}
                      className="h-full w-full scale-110 object-cover object-top"
                    />
                  </div>
                  <div className="mt-2 w-full text-center">
                    <div className="truncate text-xs font-extrabold text-white drop-shadow">
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

        {/* Right: Hero Portrait, Rank / Practice Opponent, Board Selector & PLAY Button */}
        <section className="flex flex-col justify-between rounded-3xl border-[4px] border-[#c59e56] bg-gradient-to-b from-[#352213]/95 to-[#1a1008]/95 p-5 text-amber-100 shadow-2xl lg:col-span-5">
          <div className="flex items-center gap-4">
            <div className="h-28 w-24 shrink-0 overflow-hidden rounded-t-[48px] rounded-b-xl border-[3.5px] border-[#e4c176] bg-stone-900 shadow-xl">
              <img
                src={getHeroArtUrl(hero.heroId)}
                alt={hero.nameKo}
                className="h-full w-full scale-110 object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div
                style={{ color: hero.accentColor }}
                className="text-xs font-extrabold uppercase tracking-wider"
              >
                {hero.classNameKo} · {hero.titleKo}
              </div>
              <div className="hs-title truncate text-2xl font-extrabold text-white">
                {hero.nameKo}
              </div>
              <div className="mt-1 truncate text-xs font-bold text-amber-200">
                선택 덱: {selectedDeck.name}
              </div>
              <div className="mt-2 rounded-xl border border-amber-500/35 bg-black/40 px-2.5 py-1.5 text-[11px]">
                <b className="text-sky-300">영웅 능력 [{hero.heroPowerNameKo}]:</b>{' '}
                {hero.heroPowerTextKo}
              </div>
            </div>
          </div>

          {/* Practice Opponent Selector OR Ranked Medal Preview */}
          {isPractice ? (
            <div className="my-3 rounded-2xl border border-amber-500/35 bg-black/35 p-3">
              <div className="mb-2 text-xs font-extrabold text-amber-200">
                🎯 대전할 여관주인 직업 선택:
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
                      className={`rounded-lg border px-2 py-1.5 text-xs font-extrabold transition ${
                        active
                          ? 'border-yellow-300 bg-amber-700 text-white shadow'
                          : 'border-stone-700 bg-stone-900/80 text-amber-100/80 hover:border-amber-500'
                      }`}
                    >
                      {ch.classNameKo}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="my-3 flex items-center justify-between rounded-2xl border border-amber-500/35 bg-black/35 p-3.5">
              <div>
                <div className="text-xs font-bold text-amber-300">현재 오리지널 등급</div>
                <div className="text-lg font-extrabold text-white">
                  {profile.rank === 0
                    ? '★ 전설 (LEGEND)'
                    : `${profile.rank}등급 · ${CLASSIC_RANK_NAMES[profile.rank]}`}
                </div>
                <div className="text-[11px] text-amber-200/75">
                  승리 시 별 획득 및 3승당 10골드 보너스 지급
                </div>
              </div>
              <div className="hs-num flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-b from-amber-500 to-amber-900 text-xl text-white shadow-lg">
                {profile.rank === 0 ? '★' : profile.rank}
              </div>
            </div>
          )}

          {/* Battlefield Theme Selector */}
          <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-600/30 bg-black/30 px-3 py-2 text-xs">
            <span className="font-bold text-amber-200">전장 테마:</span>
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
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                    boardTheme === b.id
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-900 text-amber-200/70 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Big Circular Hearthstone PLAY Button */}
          <button
            type="button"
            disabled={selectedDeck.cards.length < 30}
            onClick={handleStartClick}
            className="hs-outline w-full rounded-3xl border-[4px] border-[#f6dc99] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#1e3a8a] py-4 text-2xl font-extrabold tracking-widest text-white shadow-[0_10px_28px_rgba(2,132,199,0.7)] transition hover:scale-[1.02] hover:brightness-110 disabled:opacity-40"
          >
            ⚔ 대전 시작!
          </button>
        </section>
      </main>

      <div />

      {/* Authentic Hearthstone Slot-Machine Matchmaking Wheel Modal */}
      {matching && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col items-center rounded-3xl border-[5px] border-[#d6b268] bg-gradient-to-b from-[#432b17] via-[#2a1a0d] to-[#160d06] p-7 text-center shadow-[0_24px_70px_rgba(0,0,0,0.95)]">
            <div className="mb-2 text-sm font-extrabold tracking-widest text-amber-300">
              {wheelLocked ? '상대를 찾았습니다!' : '상대 찾는 중...'}
            </div>

            {/* Slot Machine Window */}
            <div className="relative my-3 flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-[4px] border-[#8b6532] bg-[#f5e8c8] px-4 shadow-inner">
              <div className="text-xs font-bold text-stone-400 opacity-65">
                {spinnerTitles[(wheelIndex + spinnerTitles.length - 1) % spinnerTitles.length]}
              </div>
              <div
                className={`my-2 rounded-xl border-y-2 border-amber-700/40 px-4 py-2 text-xl font-black tracking-tight transition-all ${
                  wheelLocked
                    ? 'scale-110 bg-amber-300/60 text-amber-950'
                    : 'text-stone-900'
                }`}
              >
                {spinnerTitles[wheelIndex]}
              </div>
              <div className="text-xs font-bold text-stone-400 opacity-65">
                {spinnerTitles[(wheelIndex + 1) % spinnerTitles.length]}
              </div>
            </div>

            <p className="mt-2 text-xs text-amber-200/80">
              스톤브루의 여관에서 실력이 비슷한 상대를 탐색하고 있습니다...
            </p>

            {!wheelLocked && (
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('box_close');
                  setMatching(false);
                }}
                className="mt-4 rounded-xl border border-amber-400/60 bg-stone-900 px-5 py-1.5 text-xs font-bold text-amber-200 hover:bg-stone-800"
              >
                취소
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
