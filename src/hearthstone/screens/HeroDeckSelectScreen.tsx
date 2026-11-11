import React, { useEffect, useMemo, useState } from 'react';
import { hsAudio } from '../audio';
import { useModalDismiss } from '../useModalDismiss';
import {
  CLASSIC_RANK_NAMES,
  CLASS_CREST_URL,
  getHeroArtUrl,
} from '../cardDb';
import { HsGoldCoinIcon } from '../components/CardVisual';
import {
  SNS_LOCATIONS,
  SnsRankMedallion,
  SnsSnowCompassSeal,
} from '../components/SnsHeroArtKit';
import { MODE_REWARD_GUIDES, hsStorage } from '../storage';
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

const SNS_SPINNER_TITLES = [
  '가치 있는 맞수',
  '일곱 추적자 전승자',
  '녹옥회 정보원',
  '불꽃 성채 근위기사',
  '바람섬 풍궁사',
  '딥포지 대장장이',
  '엘윈마을 단골 승부사',
  '별빛 호흡 수련생',
  '아케 성기사단 분대장',
  '해심 비전 학자',
  '설원 영수 조련사',
  '눈히어로 결투장의 지배자',
];

export const HeroDeckSelectScreen: React.FC<HeroDeckSelectScreenProps> = ({
  initialMode,
  onBack,
  onEditDecks,
  onLaunchBattle,
}) => {
  const [decks, setDecks] = useState<CustomDeck[]>(() => hsStorage.getDecks());
  const [profile, setProfile] = useState(() => hsStorage.getProfile());

  useEffect(() => {
    const sync = () => {
      setDecks(hsStorage.getDecks());
      setProfile(hsStorage.getProfile());
    };
    window.addEventListener('snshero:state-changed', sync);
    return () => window.removeEventListener('snshero:state-changed', sync);
  }, []);

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'preset_priest');
  const [practiceOpponentClass, setPracticeOpponentClass] = useState<HeroClass>('WARRIOR');
  const [boardTheme, setBoardTheme] = useState<BoardThemeId | 'RANDOM'>('RANDOM');

  const [matching, setMatching] = useState(false);
  const [wheelIndex, setWheelIndex] = useState(0);
  const [wheelLocked, setWheelLocked] = useState(false);

  useModalDismiss(matching && !wheelLocked, () => {
    hsAudio.playSfx('box_close');
    setMatching(false);
  });

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
        setWheelIndex((prev) => (prev + 1) % SNS_SPINNER_TITLES.length);
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

  return (
    <div
      style={{ backgroundImage: `url(${SNS_LOCATIONS.BOX_TABLE})` }}
      className="relative flex h-full w-full select-none flex-col justify-between overflow-hidden bg-cover bg-center p-2.5 sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-black/65" />

      {/* Top Brass Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl shrink-0 flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('box_close');
            onBack();
          }}
          className="hs-brass-btn min-h-[40px] rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-100 sm:px-4 sm:py-2 sm:text-sm"
        >
          ← <span className="hidden sm:inline">엘윈마을 </span>로비로
        </button>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-2xl border-2 border-[#c39c54] bg-stone-950/90 p-1 shadow-xl sm:gap-1.5">
          {!isPractice && mode !== 'TUTORIAL' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('RANKED');
                }}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold transition sm:gap-1.5 sm:px-4 sm:text-xs ${
                  mode === 'RANKED'
                    ? 'bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                <SnsRankMedallion rank={profile.rank} size={15} />
                <span>랭킹대전 · 등급전</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('CASUAL');
                }}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold transition sm:gap-1.5 sm:px-4 sm:text-xs ${
                  mode === 'CASUAL'
                    ? 'bg-gradient-to-b from-sky-500 to-blue-800 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                <SnsSnowCompassSeal size={15} />
                <span>랭킹대전 · 일반전</span>
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
                className={`rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold transition sm:px-4 sm:text-xs ${
                  mode === 'PRACTICE_NORMAL'
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-800 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                AI대전 · 일반 AI
              </button>
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('ui_click');
                  setMode('PRACTICE_EXPERT');
                }}
                className={`rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold transition sm:px-4 sm:text-xs ${
                  mode === 'PRACTICE_EXPERT'
                    ? 'bg-gradient-to-b from-red-600 to-red-900 text-white shadow'
                    : 'text-amber-200/75 hover:text-white'
                }`}
              >
                AI대전 · 숙련 AI
              </button>
            </>
          ) : (
            <span className="px-3 py-1 text-xs font-extrabold text-emerald-300">
              스토리모드 · 카단의 여정
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('ui_click');
            onEditDecks();
          }}
          className="hs-brass-btn flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-100 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
        >
          <img
            src={CLASS_CREST_URL[selectedDeck.heroClass]}
            alt=""
            className="h-4 w-4 rounded-full object-cover sm:h-5 sm:w-5"
          />
          <span>덱 편집</span>
        </button>
      </header>

      {/* Main Content: Scrollable on Mobile Portrait + Side-by-Side 12-Col on Desktop */}
      <main className="relative z-20 mx-auto my-2 grid min-h-0 w-full max-w-6xl flex-1 grid-cols-1 gap-3 overflow-y-auto pr-0.5 lg:my-auto lg:flex-none lg:grid-cols-12 lg:gap-5 lg:overflow-visible">
        {/* Left 7 Cols: 9-Slot Faction Deck Selection Box (3x3 Visible on Mobile Portrait!) */}
        <section className="hs-wood-panel rounded-2xl p-3 sm:rounded-3xl sm:p-5 lg:col-span-7">
          <div className="mb-2 flex items-center justify-between border-b border-amber-500/25 pb-1.5 sm:mb-3 sm:pb-2">
            <h2 className="hs-title text-sm font-extrabold text-amber-100 sm:text-lg">
              전투에 출전할 종족 덱 선택
            </h2>
            <span className="text-[11px] font-bold text-amber-300/85 sm:text-xs">
              보유 덱 {decks.length}개 · 30장 완료 덱 출전
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:max-h-[58vh] sm:gap-3 sm:overflow-y-auto sm:pr-1">
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
                  className={`group relative flex flex-col items-center overflow-hidden rounded-xl border-[2.5px] p-2 text-left transition sm:rounded-2xl sm:border-[3px] sm:p-3 ${
                    isSelected
                      ? 'scale-[1.02] border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.85)]'
                      : 'border-[#b9934c]/70 opacity-90 hover:border-amber-300 hover:opacity-100'
                  }`}
                >
                  {/* Faction Crest Badge in Top-Right Corner */}
                  <img
                    src={CLASS_CREST_URL[d.heroClass]}
                    alt=""
                    className="absolute right-1.5 top-1.5 z-10 h-5 w-5 rounded-full border border-amber-200/80 object-cover shadow sm:right-2 sm:top-2 sm:h-6 sm:w-6"
                  />

                  <div
                    style={{ background: dh.frameGradient }}
                    className="relative h-14 w-14 overflow-hidden rounded-t-[28px] rounded-b-lg border-2 border-[#ebd08e] shadow-lg sm:h-20 sm:w-20 sm:rounded-t-[40px] sm:rounded-b-xl"
                  >
                    <img
                      src={getHeroArtUrl(dh.heroId)}
                      alt={dh.nameKo}
                      className="absolute left-1/2 top-[3%] h-[155%] w-[124%] max-w-none -translate-x-1/2 object-cover object-top transition group-hover:scale-108"
                    />
                  </div>

                  <div className="mt-1.5 w-full text-center sm:mt-2">
                    <div className="hs-outline-sm truncate text-[11px] font-extrabold text-white sm:text-xs">
                      {d.name}
                    </div>
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[9.5px] font-bold text-amber-200 sm:gap-1.5 sm:text-[10.5px]">
                      <span>{dh.classNameKo}</span>
                      <span>·</span>
                      <span className={isComplete ? 'text-emerald-300' : 'text-red-300'}>
                        {d.cards.length}/30
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right 5 Cols: Champion Showcase, Rank/Opponent & Carved Swirl PLAY Button */}
        <section className="hs-wood-panel relative flex flex-col justify-between overflow-hidden rounded-2xl p-3.5 text-amber-100 sm:rounded-3xl sm:p-5 lg:col-span-5">
          {/* Subtle Faction Glow Backdrop */}
          <div
            style={{
              background: `radial-gradient(circle at 85% 15%, ${hero.accentColor}33 0%, transparent 62%)`,
            }}
            className="pointer-events-none absolute inset-0"
          />

          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div
              style={{ background: hero.frameGradient }}
              className="relative h-22 w-19 shrink-0 overflow-hidden rounded-t-[40px] rounded-b-xl border-[3px] border-[#e7c57c] shadow-[0_12px_26px_rgba(0,0,0,0.85)] sm:h-28 sm:w-24 sm:rounded-t-[50px] sm:border-[3.5px]"
            >
              <img
                src={getHeroArtUrl(hero.heroId)}
                alt={hero.nameKo}
                className="absolute left-1/2 top-[3%] h-[155%] w-[124%] max-w-none -translate-x-1/2 object-cover object-top"
              />
              <img
                src={CLASS_CREST_URL[selectedDeck.heroClass]}
                alt=""
                className="absolute bottom-1 right-1 h-5 w-5 rounded-full border border-amber-200 object-cover shadow sm:h-6 sm:w-6"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div
                style={{ color: hero.accentColor }}
                className="text-[11px] font-extrabold uppercase tracking-wider sm:text-xs"
              >
                {hero.classNameKo} · {hero.titleKo}
              </div>
              <div className="hs-title hs-outline-sm truncate text-lg font-extrabold text-white sm:text-2xl">
                {hero.nameKo}
              </div>
              <div className="mt-0.5 truncate text-[11px] font-bold text-amber-200 sm:text-xs">
                출전 덱: {selectedDeck.name}
              </div>
              <div className="mt-1.5 rounded-xl border border-[#c8a158]/40 bg-black/45 px-2.5 py-1 text-[10.5px] leading-snug sm:mt-2 sm:py-1.5 sm:text-[11px]">
                <b className="text-sky-300">영웅 능력 [{hero.heroPowerNameKo}]:</b>{' '}
                {hero.heroPowerTextKo}
              </div>
            </div>
          </div>

          {/* Practice Opponent Picker OR Rank Medallion */}
          {isPractice ? (
            <div className="relative z-10 my-2 rounded-2xl border border-[#c8a158]/40 bg-black/40 p-2.5 sm:my-2.5 sm:p-3">
              <div className="mb-1.5 flex items-center justify-between gap-1 text-xs font-extrabold text-amber-200">
                <span>대전할 상대 종족 대표 선택</span>
                <span className="text-[10.5px] font-bold text-emerald-300">
                  최초 제압:{' '}
                  {mode === 'PRACTICE_EXPERT'
                    ? profile.practiceExpertCleared.length
                    : profile.practiceNormalCleared.length}
                  /9종족
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {HERO_CLASS_ORDER.map((hc) => {
                  const ch = CLASSIC_HEROES[hc];
                  const active = practiceOpponentClass === hc;
                  const alreadyCleared =
                    mode === 'PRACTICE_EXPERT'
                      ? profile.practiceExpertCleared.includes(hc)
                      : profile.practiceNormalCleared.includes(hc);
                  return (
                    <button
                      key={hc}
                      type="button"
                      onClick={() => {
                        hsAudio.playSfx('ui_click');
                        setPracticeOpponentClass(hc);
                      }}
                      className={`relative flex min-h-[36px] items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-[11px] font-extrabold transition sm:gap-1.5 sm:px-2 sm:text-xs ${
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
                      {alreadyCleared && (
                        <span
                          title="최초 제압 보상 수령 완료"
                          className="ml-0.5 text-[10px] font-black text-emerald-300"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="relative z-10 my-2 flex items-center justify-between rounded-2xl border border-[#c8a158]/40 bg-black/40 p-2.5 sm:my-2.5 sm:p-3">
              <div>
                <div className="text-[10.5px] font-bold text-amber-300 sm:text-[11px]">
                  현재 눈히어로 등급
                </div>
                <div className="hs-title text-base font-extrabold text-white sm:text-lg">
                  {profile.rank === 0
                    ? '전설의 눈히어로 (LEGEND)'
                    : `${profile.rank}등급 · ${CLASSIC_RANK_NAMES[profile.rank]}`}
                </div>
                <div className="mt-0.5 text-[10.5px] text-amber-200/80 sm:text-[11px]">
                  3승 보너스 진행도: <b className="text-yellow-300">{profile.threeWinCounter}/3승</b>
                </div>
              </div>
              <SnsRankMedallion rank={profile.rank} size={50} className="shrink-0 drop-shadow" />
            </div>
          )}

          {/* Crystal-Clear Mode Victory Reward Guarantee Box */}
          <div className="relative z-10 mb-2 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-[#231509]/95 via-[#1a1007]/95 to-[#120b05]/95 px-3 py-2 text-[11px] shadow-inner sm:mb-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 font-extrabold text-yellow-300">
                <HsGoldCoinIcon size={15} />
                <span>[{MODE_REWARD_GUIDES[mode].modeNameKo}] 확정 승리 보상</span>
              </div>
              <span className="rounded-md border border-sky-400/40 bg-sky-950/80 px-1.5 py-0.5 text-[10px] font-bold text-sky-200">
                {MODE_REWARD_GUIDES[mode].playStyleBadge}
              </span>
            </div>
            <div className="mt-1 font-extrabold text-amber-100">
              • 기본 보상: <span className="text-yellow-200">{MODE_REWARD_GUIDES[mode].baseWinRewardText}</span>
            </div>
            <div className="mt-0.5 text-[10.5px] font-semibold text-emerald-200/95">
              • 추가 특전: {MODE_REWARD_GUIDES[mode].specialBonusText}
            </div>
          </div>

          {/* Battlefield Theme Selector */}
          <div className="relative z-10 mb-2.5 flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-[#c8a158]/35 bg-black/35 px-2.5 py-2 text-xs sm:mb-3 sm:px-3">
            <span className="font-bold text-amber-200">결투 전장</span>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'RANDOM', label: '무작위' },
                  { id: 'STORMWIND', label: '엘윈마을 설원' },
                  { id: 'ORGRIMMAR', label: '불꽃 성채' },
                  { id: 'PANDARIA', label: '바람의 신전' },
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

          {/* Carved-Stone Snow-Seal PLAY Medallion Button (Desktop Inside Right Panel) */}
          <div className="relative z-10 hidden flex-col items-center pt-1 lg:flex">
            <button
              type="button"
              disabled={selectedDeck.cards.length < 30}
              onClick={handleStartClick}
              className="hs-arcane-btn group relative flex w-full items-center justify-center gap-3 rounded-2xl py-3.5 text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SnsSnowCompassSeal
                size={42}
                className="drop-shadow-[0_0_12px_rgba(56,189,248,0.9)] transition group-hover:rotate-12 group-hover:scale-110"
              />
              <span className="hs-title hs-outline text-2xl font-extrabold tracking-widest">
                대전 시작
              </span>
            </button>
          </div>
        </section>
      </main>

      {/* Always-Visible Docked Mobile/Tablet PLAY Button (`< lg`) */}
      <div className="relative z-30 mx-auto w-full max-w-6xl shrink-0 pt-1 lg:hidden">
        <button
          type="button"
          disabled={selectedDeck.cards.length < 30}
          onClick={handleStartClick}
          className="hs-arcane-btn group relative flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SnsSnowCompassSeal
            size={34}
            className="drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]"
          />
          <span className="hs-title hs-outline text-lg font-extrabold tracking-widest">
            대전 시작 ({selectedDeck.name})
          </span>
        </button>
      </div>

      {/* Matchmaking Wheel Modal */}
      {matching && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm">
          <div className="hs-wood-panel flex w-full max-w-md flex-col items-center rounded-3xl p-7 text-center">
            <SnsSnowCompassSeal
              size={56}
              spinning={!wheelLocked}
              className="mb-2 drop-shadow"
            />
            <div
              className={`hs-title hs-outline-sm mb-2 text-lg font-extrabold tracking-widest ${
                wheelLocked ? 'text-[#fef08a]' : 'text-[#fffbeb]'
              }`}
            >
              {wheelLocked ? '맞수를 찾았습니다!' : '맞수 탐색 중...'}
            </div>

            {/* High-Contrast Dark Arcane Oak Slot Machine Window */}
            <div
              style={{
                backgroundColor: '#160d06',
                backgroundImage:
                  'linear-gradient(180deg, #100904 0%, #26160b 50%, #100904 100%)',
              }}
              className="relative my-3 flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-[3.5px] border-[#d4a857] px-4 shadow-[inset_0_8px_20px_rgba(0,0,0,0.85),0_0_18px_rgba(212,168,87,0.22)]"
            >
              <div className="hs-outline-sm text-xs font-bold text-amber-100/75">
                {SNS_SPINNER_TITLES[(wheelIndex + SNS_SPINNER_TITLES.length - 1) % SNS_SPINNER_TITLES.length]}
              </div>
              <div
                className={`hs-title hs-outline-sm my-2 w-full rounded-xl border-y-2 px-4 py-2 text-xl font-black tracking-tight transition-transform duration-150 ${
                  wheelLocked
                    ? 'scale-105 border-yellow-300 bg-amber-400/30 text-[#fef08a] shadow-[0_0_20px_rgba(250,204,21,0.45)]'
                    : 'border-amber-300/55 bg-amber-400/15 text-white'
                }`}
              >
                {SNS_SPINNER_TITLES[wheelIndex]}
              </div>
              <div className="hs-outline-sm text-xs font-bold text-amber-100/75">
                {SNS_SPINNER_TITLES[(wheelIndex + 1) % SNS_SPINNER_TITLES.length]}
              </div>
            </div>

            <p className="hs-outline-sm mt-2 text-xs font-bold text-amber-50/95">
              엘윈마을 대결 광장에서 실력이 비슷한 맞수를 탐색하고 있습니다...
            </p>

            {!wheelLocked && (
              <button
                type="button"
                onClick={() => {
                  hsAudio.playSfx('box_close');
                  setMatching(false);
                }}
                className="hs-brass-btn mt-4 min-h-[40px] rounded-xl px-6 py-2 text-xs font-extrabold text-white"
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
