/**
 * DailyHiddenHeroModal.tsx
 * 상업용 디오라마 숨은그림 찾기 게임 ("WHERE'S HERO? : DAILY CHRONICLES")
 * - 실제 고해상도 판타지 월드 일러스트 배경 + 35개 이상의 인터랙티브 사물/군중 디오라마 레이어
 * - 상업용 게임 기믹:
 * 1) 장애물 들춰보기(Interactive Props): 보물상자, 오크통, 수풀, 천막을 터치하면 흔들리며 뒤에 숨은 영웅 노출
 * 2) 군중 위장(Crowd Camouflage): 수많은 모험가/몬스터 NPC 인파 속에서 타겟 영웅 5명 정밀 식별
 * 3) 광학 돋보기 스코프(Magnifier Loupe) & 1x / 1.8x / 2.5x 정밀 줌/패닝 + 근접 레이더(HOT/WARM/COLD)
 * 4) 무작위 연타 방지 오클릭 페널티(쿨다운/감점) + 연속 발견 콤보(COMBO) & 3성급(★★★) 랭크 평가
 * 5) 매일 날짜(YYYY-MM-DD) 시드로 자동 변경되는 오늘의 스테이지 (1,500 SNS 보상) + 7대 월드 자유 투어 지원
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
 X,
 Search,
 Sparkles,
 CheckCircle2,
 Compass,
 ZoomIn,
 ZoomOut,
 Trophy,
 Zap,
 Eye,
 Star,
 AlertTriangle,
 MapPin,
 Volume2,
 VolumeX,
 RotateCcw,
} from 'lucide-react';
import { cn, getAssetUrl } from '../lib/utils';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface DailyHiddenHeroModalProps {
 isOpen: boolean;
 onClose: () => void;
 updateSns: (amount: number, reason?: string) => void;
 playSfx: (url: string) => void;
 language: Language;
}

export interface HeroCharacterDef {
 id: number;
 nameKo: string;
 nameEn: string;
 roleKo: string;
 roleEn: string;
 image: string;
 rarityBadge: string;
}

export const HIDDEN_HERO_POOL: HeroCharacterDef[] = [
 { id: 105, nameKo: '카단', nameEn: 'Kadan', roleKo: '심연의 검사', roleEn: 'Abyssal Knight', image: '/seat/Kadan.png', rarityBadge: 'UR' },
 { id: 10, nameKo: '포세이돈', nameEn: 'Poseidon', roleKo: '해왕', roleEn: 'Sea God', image: '/seat/Poseidon.png', rarityBadge: 'UR' },
 { id: 19, nameKo: '피닉스', nameEn: 'Phoenix', roleKo: '불사조', roleEn: 'Firebird', image: '/seat/Phoenix.png', rarityBadge: 'SSR' },
 { id: 9, nameKo: '크라켄', nameEn: 'Kraken', roleKo: '심해 군주', roleEn: 'Deep Titan', image: '/seat/Kraken.png', rarityBadge: 'SSR' },
 { id: 20, nameKo: '이그니시우스', nameEn: 'Ignisius', roleKo: '태양신', roleEn: 'Solar Lord', image: '/seat/Ignisius.png', rarityBadge: 'UR' },
 { id: 29, nameKo: '뇌신', nameEn: 'Raijin', roleKo: '번개 수호신', roleEn: 'Thunder God', image: '/seat/Raijin.png', rarityBadge: 'SSR' },
 { id: 1, nameKo: '아쿠아리스', nameEn: 'Aquaris', roleKo: '물의 정령', roleEn: 'Water Spirit', image: '/seat/Aquaris.png', rarityBadge: 'R' },
 { id: 11, nameKo: '이그니스', nameEn: 'Ignis', roleKo: '불꽃 정령', roleEn: 'Flame Sprite', image: '/seat/Ignis.png', rarityBadge: 'R' },
 { id: 21, nameKo: '제피로스', nameEn: 'Zephyros', roleKo: '바람 정령', roleEn: 'Wind Spirit', image: '/seat/Zephyros.png', rarityBadge: 'R' },
 { id: 31, nameKo: '가이아', nameEn: 'Gaia', roleKo: '대지 여신', roleEn: 'Earth Mother', image: '/seat/Gaia.png', rarityBadge: 'SR' },
 { id: 23, nameKo: '실피드', nameEn: 'Sylphid', roleKo: '숲의 요정', roleEn: 'Wind Nymph', image: '/seat/Sylphid.png', rarityBadge: 'SR' },
 { id: 6, nameKo: '레비아탄', nameEn: 'Leviathan', roleKo: '해양 거룡', roleEn: 'Sea Dragon', image: '/seat/Leviathan.png', rarityBadge: 'SR' },
];

// 군중 위장용 NPC 초상화 풀 (타겟과 섞여 헷갈리게 만드는 상업용 월리 기믹)
const DECOY_CROWD_IMAGES = [
 '/seat/Balbo.png',
 '/seat/Gnome.png',
 '/seat/Ghoul.png',
 '/seat/Harpy.png',
 '/seat/Kelpie.png',
 '/seat/Pyro.png',
 '/seat/Sylph.png',
 '/seat/Undine.png',
 '/seat/Walker.png',
 '/seat/Spiderbot.png',
];

export interface WorldStageTheme {
 id: string;
 titleKo: string;
 titleEn: string;
 subtitleKo: string;
 subtitleEn: string;
 bgImage: string;
 ambientOverlay: string;
 propIcons: string[];
 spots: {
 x: number;
 y: number;
 clueKo: string;
 clueEn: string;
 coverEmoji?: string; // 위에 덮여있는 장애물 (터치하여 치우기 가능)
 }[];
}

export const COMMERCIAL_WORLD_STAGES: WorldStageTheme[] = [
 {
 id: 'stage_citadel',
 titleKo: '제1장: 왕도 카멜롯 대축제 광장',
 titleEn: 'Ch.1: Camelot Festival Plaza',
 subtitleKo: '수많은 시장 천막과 보물상자, 왕국 기사단 인파 속에 숨은 영웅 5명을 찾으세요!',
 subtitleEn: 'Spot 5 hidden heroes amidst bazaar stalls, chests, and royal crowds!',
 bgImage: '/banner/010.png',
 ambientOverlay: ' ',
 propIcons: ['⛺', '🛢️', '📦', '🛡️', '🚩', '🏮', '⛲', '⚔️'],
 spots: [
 { x: 16, y: 26, clueKo: '좌측 상단 성벽 망루 깃발 뒤편', clueEn: 'Behind the upper-left watchtower banner', coverEmoji: '🚩' },
 { x: 79, y: 23, clueKo: '우측 상단 첨탑 발코니 난간', clueEn: 'Upper-right spire balcony railing' },
 { x: 48, y: 52, clueKo: '중앙 광장 황금 보물상자 속', clueEn: 'Inside the central plaza treasure chest', coverEmoji: '🧰' },
 { x: 24, y: 74, clueKo: '좌측 하단 오크통 더미 뒤', clueEn: 'Behind the lower-left wooden barrels', coverEmoji: '🛢️' },
 { x: 82, y: 71, clueKo: '우측 하단 마법 상점 천막 그늘', clueEn: 'Under the right-side merchant tent', coverEmoji: '⛺' },
 { x: 63, y: 38, clueKo: '광장 동상 오른쪽 어깨 뒤', clueEn: 'Behind the plaza statue shoulder' },
 { x: 35, y: 42, clueKo: '분수대 아치 기둥 틈새', clueEn: 'Between the fountain arch pillars' },
 ],
 },
 {
 id: 'stage_sorcery',
 titleKo: '제2장: 대현자의 아케인 비서고',
 titleEn: 'Ch.2: Grand Arcane Sanctum',
 subtitleKo: '고대 마도서 책장과 연금술 실험대, 마력 수정 사이에 몸을 숨겼습니다!',
 subtitleEn: 'Hidden among ancient grimoires, alchemy tables, and mana crystals!',
 bgImage: '/minigame_cardsorcery.png',
 ambientOverlay: ' ',
 propIcons: ['📚', '🔮', '🕯️', '⚗️', '📜', '💎', '🦉', '🗝️'],
 spots: [
 { x: 21, y: 24, clueKo: '좌측 상단 고대 마도서 책장 꼭대기', clueEn: 'Top of the upper-left bookshelf', coverEmoji: '📚' },
 { x: 77, y: 28, clueKo: '우측 상단 부유하는 보라색 수정 뒤', clueEn: 'Behind the floating purple crystal', coverEmoji: '🔮' },
 { x: 52, y: 48, clueKo: '중앙 마법진 제단 두루마리 더미', clueEn: 'Central magic circle scroll pile', coverEmoji: '📜' },
 { x: 19, y: 73, clueKo: '좌측 하단 연금술 플라스크 실험대', clueEn: 'Lower-left alchemy flask table', coverEmoji: '⚗️' },
 { x: 83, y: 76, clueKo: '우측 하단 황금 촛대 그림자', clueEn: 'Shadow of the lower-right candelabra' },
 { x: 38, y: 61, clueKo: '중앙 계단 난간 올빼미 횃대 옆', clueEn: 'Next to the owl perch on the stairs' },
 { x: 66, y: 57, clueKo: '우측 서가 비밀 열쇠 구멍 근처', clueEn: 'Near the secret keyhole on the right shelf' },
 ],
 },
 {
 id: 'stage_dungeon',
 titleKo: '제3장: 심연의 드래곤 화산 요새',
 titleEn: 'Ch.3: Abyssal Dragon Stronghold',
 subtitleKo: '타오르는 용암 협곡과 흑요석 기둥, 해골 제단 틈새를 수색하세요!',
 subtitleEn: 'Search the lava chasm, obsidian pillars, and ancient skull altars!',
 bgImage: '/minigame_dungeon.png',
 ambientOverlay: ' ',
 propIcons: ['🔥', '🪨', '💀', '⛓️', '🌋', '🗡️', '🛡️', '💎'],
 spots: [
 { x: 18, y: 27, clueKo: '좌측 상단 흑요석 종유석 뒤편', clueEn: 'Behind the upper-left obsidian stalactite' },
 { x: 81, y: 25, clueKo: '우측 상단 화룡의 둥지 화염 속', clueEn: 'Inside the upper-right dragon nest flames', coverEmoji: '🔥' },
 { x: 49, y: 44, clueKo: '중앙 용암 다리 부서진 바위 뒤', clueEn: 'Behind the broken rock on the lava bridge', coverEmoji: '🪨' },
 { x: 25, y: 75, clueKo: '좌측 하단 고대 유골 상자 속', clueEn: 'Inside the lower-left ancient bone crate', coverEmoji: '💀' },
 { x: 78, y: 72, clueKo: '우측 하단 쇠사슬 감옥 기둥', clueEn: 'Lower-right chained prison pillar' },
 { x: 36, y: 35, clueKo: '좌측 화산 분화구 가장자리', clueEn: 'Edge of the left volcanic crater' },
 { x: 64, y: 62, clueKo: '우측 용암 폭포 아래 바위 틈', clueEn: 'Rock crevice beneath the right lava fall' },
 ],
 },
 {
 id: 'stage_treasure',
 titleKo: '제4장: 황금 해적단 비밀 보물섬',
 titleEn: 'Ch.4: Golden Pirate Treasure Cove',
 subtitleKo: '산더미처럼 쌓인 금화와 난파선 갑판, 야자수 수풀 속을 조사하세요!',
 subtitleEn: 'Inspect the mountains of gold coins, shipwreck decks, and palm bushes!',
 bgImage: '/minigame_treasure.png',
 ambientOverlay: ' ',
 propIcons: ['🌴', '⚓', '🪙', '🦜', '🗺️', '🛢️', '🦀', '💎'],
 spots: [
 { x: 17, y: 22, clueKo: '좌측 상단 야자수 잎사귀 그늘', clueEn: 'Shade of the upper-left palm leaves', coverEmoji: '🌴' },
 { x: 83, y: 27, clueKo: '우측 상단 난파선 돛대 망원경 옆', clueEn: 'Next to the shipwreck mast spyglass' },
 { x: 51, y: 54, clueKo: '중앙 대왕 보물상자 금화 더미', clueEn: 'Central giant chest gold coin pile', coverEmoji: '🪙' },
 { x: 23, y: 77, clueKo: '좌측 하단 녹슨 닻 뒤편', clueEn: 'Behind the lower-left rusty anchor', coverEmoji: '⚓' },
 { x: 76, y: 74, clueKo: '우측 하단 해적 화약통 속', clueEn: 'Inside the lower-right powder keg', coverEmoji: '🛢️' },
 { x: 39, y: 40, clueKo: '동굴 입구 석상 눈동자 부근', clueEn: 'Near the cave entrance statue eye' },
 { x: 67, y: 46, clueKo: '우측 산호초 바위 게 옆', clueEn: 'Beside the crab on the coral rock' },
 ],
 },
 {
 id: 'stage_colosseum',
 titleKo: '제5장: 천공의 콜로세움 챔피언십',
 titleEn: 'Ch.5: Celestial Colosseum Arena',
 subtitleKo: '열광하는 관중석과 투기장 무기 거치대, 전차 뒤에 은신해 있습니다!',
 subtitleEn: 'Concealed among cheering stands, weapon racks, and war chariots!',
 bgImage: '/minigame_tournament.png',
 ambientOverlay: ' ',
 propIcons: ['🏛️', '⚔️', '🛡️', '🚩', '🎺', '🏆', '🦁', '👑'],
 spots: [
 { x: 19, y: 26, clueKo: '좌측 상단 귀빈석 황금 휘장 뒤', clueEn: 'Behind the VIP box golden drapery', coverEmoji: '🚩' },
 { x: 80, y: 24, clueKo: '우측 상단 승리의 나팔수 동상 옆', clueEn: 'Beside the victory trumpeter statue' },
 { x: 50, y: 50, clueKo: '투기장 중앙 대형 방패 뒤편', clueEn: 'Behind the grand shield in center arena', coverEmoji: '🛡️' },
 { x: 26, y: 73, clueKo: '좌측 하단 검투사 무기 거치대', clueEn: 'Lower-left gladiator weapon rack', coverEmoji: '⚔️' },
 { x: 79, y: 75, clueKo: '우측 하단 사자 철창 문틈', clueEn: 'Lower-right lion gate bars' },
 { x: 35, y: 60, clueKo: '좌측 전차 바퀴 그림자 속', clueEn: 'In the shadow of the left chariot wheel' },
 { x: 65, y: 39, clueKo: '우측 관중석 2층 아치 통로', clueEn: 'Right-side 2F spectator arch passage' },
 ],
 },
];

// Web Audio API 사운드 효과 합성기
class HiddenAudioSynth {
 private ctx: AudioContext | null = null;
 public muted: boolean = false;

 private init() {
 if (!this.ctx && typeof window !== 'undefined') {
 const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
 if (AudioCtx) this.ctx = new AudioCtx();
 }
 if (this.ctx && this.ctx.state === 'suspended') {
 this.ctx.resume().catch(() => {});
 }
 }

 playPropRustle() {
 if (this.muted) return;
 this.init();
 if (!this.ctx) return;
 const now = this.ctx.currentTime;
 const osc = this.ctx.createOscillator();
 const gain = this.ctx.createGain();
 osc.type = 'triangle';
 osc.frequency.setValueAtTime(190, now);
 osc.frequency.exponentialRampToValueAtTime(95, now + 0.09);
 gain.gain.setValueAtTime(0.12, now);
 gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
 osc.connect(gain);
 gain.connect(this.ctx.destination);
 osc.start(now);
 osc.stop(now + 0.1);
 }

 playHeroFound(combo: number) {
 if (this.muted) return;
 this.init();
 if (!this.ctx) return;
 const now = this.ctx.currentTime;
 const base = 523.25 + Math.min(combo, 5) * 65;
 [base, base * 1.25, base * 1.5].forEach((f, idx) => {
 if (!this.ctx) return;
 const osc = this.ctx.createOscillator();
 const gain = this.ctx.createGain();
 osc.type = 'sine';
 const st = now + idx * 0.06;
 osc.frequency.setValueAtTime(f, st);
 gain.gain.setValueAtTime(0.16, st);
 gain.gain.exponentialRampToValueAtTime(0.008, st + 0.25);
 osc.connect(gain);
 gain.connect(this.ctx.destination);
 osc.start(st);
 osc.stop(st + 0.25);
 });
 }

 playMissBuzz() {
 if (this.muted) return;
 this.init();
 if (!this.ctx) return;
 const now = this.ctx.currentTime;
 const osc = this.ctx.createOscillator();
 const gain = this.ctx.createGain();
 osc.type = 'sawtooth';
 osc.frequency.setValueAtTime(140, now);
 osc.frequency.linearRampToValueAtTime(95, now + 0.16);
 gain.gain.setValueAtTime(0.1, now);
 gain.gain.exponentialRampToValueAtTime(0.008, now + 0.18);
 osc.connect(gain);
 gain.connect(this.ctx.destination);
 osc.start(now);
 osc.stop(now + 0.18);
 }
}

const hiddenSynth = new HiddenAudioSynth();

function hashSeed(str: string): number {
 let h = 2166136261;
 for (let i = 0; i < str.length; i++) {
 h ^= str.charCodeAt(i);
 h = Math.imul(h, 16777619);
 }
 return Math.abs(h);
}

export const DailyHiddenHeroModal: React.FC<DailyHiddenHeroModalProps> = ({
 isOpen,
 onClose,
 updateSns,
 playSfx,
 language,
}) => {
 const isKo = language === 'ko';
 const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
 const dailySeed = useMemo(() => hashSeed(todayStr), [todayStr]);

 // 오늘의 기본 월드 인덱스 + 자유 스테이지 전환 지원
 const [selectedStageIdx, setSelectedStageIdx] = useState<number>(
 () => dailySeed % COMMERCIAL_WORLD_STAGES.length
 );

 const activeStage = COMMERCIAL_WORLD_STAGES[selectedStageIdx];
 const stageSeed = useMemo(
 () => hashSeed(`${todayStr}_stage_${activeStage.id}`),
 [todayStr, activeStage.id]
 );

 // 이번 스테이지에 숨겨진 5명의 타겟 영웅 & 위치 생성
 const stageTargets = useMemo(() => {
 const spotsCopy = [...activeStage.spots];
 for (let i = spotsCopy.length - 1; i > 0; i--) {
 const j = (stageSeed + i * 29) % (i + 1);
 [spotsCopy[i], spotsCopy[j]] = [spotsCopy[j], spotsCopy[i]];
 }
 const chosenSpots = spotsCopy.slice(0, 5);

 const poolCopy = [...HIDDEN_HERO_POOL];
 for (let i = poolCopy.length - 1; i > 0; i--) {
 const j = (stageSeed + i * 43) % (i + 1);
 [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
 }
 const chosenHeroes = poolCopy.slice(0, 5);

 return chosenHeroes.map((hero, idx) => ({
 ...hero,
 spot: chosenSpots[idx],
 camouflageAngle: ((stageSeed + idx * 13) % 18) - 9,
 }));
 }, [activeStage, stageSeed]);

 // 배경을 풍성하게 채우는 22개의 인터랙티브 디오라마 소품 & 군중 NPC 생성
 const dioramaCrowdAndProps = useMemo(() => {
 const items: {
 id: string;
 type: 'npc' | 'prop';
 x: number;
 y: number;
 image?: string;
 emoji?: string;
 scale: number;
 }[] = [];

 for (let i = 0; i < 22; i++) {
 const rx = 8 + ((stageSeed * (i + 3) * 17) % 84);
 const ry = 14 + ((stageSeed * (i + 7) * 23) % 74);

 // 타겟 영웅 위치와 너무 겹치지 않도록 미세 조정
 const tooClose = stageTargets.some(
 (t) => Math.hypot(t.spot.x - rx, t.spot.y - ry) < 8
 );
 const finalX = tooClose ? ((rx + 14) % 84) + 8 : rx;
 const finalY = tooClose ? ((ry + 12) % 72) + 14 : ry;

 if (i % 2 === 0) {
 items.push({
 id: `npc_${i}`,
 type: 'npc',
 x: finalX,
 y: finalY,
 image: DECOY_CROWD_IMAGES[i % DECOY_CROWD_IMAGES.length],
 scale: 0.85 + (i % 3) * 0.1,
 });
 } else {
 items.push({
 id: `prop_${i}`,
 type: 'prop',
 x: finalX,
 y: finalY,
 emoji: activeStage.propIcons[i % activeStage.propIcons.length],
 scale: 0.9 + (i % 3) * 0.15,
 });
 }
 }
 return items;
 }, [stageSeed, activeStage, stageTargets]);

 // 상태 관리
 const [foundIds, setFoundIds] = useState<Set<number>>(new Set());
 const [openedCovers, setOpenedCovers] = useState<Set<number>>(new Set());
 const [openedDecoys, setOpenedDecoys] = useState<Set<string>>(new Set());
 const [isDailyRewardClaimed, setIsDailyRewardClaimed] = useState<boolean>(false);
 const [showClearBanner, setShowClearBanner] = useState<boolean>(false);

 // 돋보기 스코프 & 줌 배율 & 레이더
 const [zoomScale, setZoomScale] = useState<number>(1.35);
 const [loupeEnabled, setLoupeEnabled] = useState<boolean>(true);
 const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
 const [selectedTargetHintId, setSelectedTargetHintId] = useState<number | null>(null);
 const [radarActiveId, setRadarActiveId] = useState<number | null>(null);
 const [radarCooldown, setRadarCooldown] = useState<number>(0);
 const [isMuted, setIsMuted] = useState<boolean>(false);

 // 콤보 & 경과 시간 & 오클릭 페널티
 const [combo, setCombo] = useState<number>(0);
 const lastFoundTimeRef = useRef<number>(0);
 const [missMarkers, setMissMarkers] = useState<{ id: number; x: number; y: number }[]>([]);
 const [foundPopups, setFoundPopups] = useState<
 { id: number; x: number; y: number; name: string; combo: number }[]
 >([]);
 const [mistakesCount, setMistakesCount] = useState<number>(0);

 // 로컬스토리지 일일 보상 상태 로드
 useEffect(() => {
 if (!isOpen) return;
 const cleared =
 localStorage.getItem(`hero_daily_hidden_cleared_${todayStr}`) === 'true';
 setIsDailyRewardClaimed(cleared);
 }, [isOpen, todayStr]);

 // 스테이지 변경 시 초기화
 useEffect(() => {
 setFoundIds(new Set());
 setOpenedCovers(new Set());
 setOpenedDecoys(new Set());
 setShowClearBanner(false);
 setCombo(0);
 setMistakesCount(0);
 setSelectedTargetHintId(null);
 }, [selectedStageIdx]);

 // 레이더 쿨다운 타이머
 useEffect(() => {
 if (radarCooldown <= 0) return;
 const t = window.setTimeout(() => setRadarCooldown((c) => c - 1), 1000);
 return () => clearTimeout(t);
 }, [radarCooldown]);

 // 현재 커서 위치와 가장 가까운 미발견 영웅 사이의 거리 계산 (근접 센서: HOT / WARM / COLD)
 const proximitySignal = useMemo(() => {
 const remaining = stageTargets.filter((t) => !foundIds.has(t.id));
 if (remaining.length === 0) return { label: 'CLEAR', color: 'text-emerald-400' };
 let minDist = 999;
 remaining.forEach((t) => {
 const d = Math.hypot(t.spot.x - pointerPos.x, t.spot.y - pointerPos.y);
 if (d < minDist) minDist = d;
 });
 if (minDist < 9) return { label: '🔥 VERY HOT!!', color: 'text-rose-400 animate-pulse' };
 if (minDist < 18) return { label: '⚡ WARM', color: 'text-amber-300' };
 return { label: '❄️ COLD', color: 'text-cyan-400/70' };
 }, [stageTargets, foundIds, pointerPos]);

 // 장애물 커버 터치 시 들춰보기
 const handleCoverPeel = (heroId: number, e: React.MouseEvent) => {
 e.stopPropagation();
 hiddenSynth.playPropRustle();
 triggerHaptic('light');
 setOpenedCovers((prev) => {
 const next = new Set(prev);
 next.add(heroId);
 return next;
 });
 };

 // 타겟 영웅 발견 핸들러
 const handleHeroCatch = (
 hero: (typeof stageTargets)[0],
 e: React.MouseEvent
 ) => {
 e.stopPropagation();
 if (foundIds.has(hero.id)) return;

 // 만약 장애물 커버가 덮여있다면 먼저 커버를 벗김
 if (hero.spot.coverEmoji && !openedCovers.has(hero.id)) {
 handleCoverPeel(hero.id, e);
 return;
 }

 const now = Date.now();
 const nextCombo = now - lastFoundTimeRef.current < 14000 ? combo + 1 : 1;
 lastFoundTimeRef.current = now;
 setCombo(nextCombo);

 hiddenSynth.playHeroFound(nextCombo);
 triggerHaptic('medium');

 const nextFound = new Set(foundIds);
 nextFound.add(hero.id);
 setFoundIds(nextFound);

 // 발견 플로팅 팝업 추가
 const popupId = Date.now() + Math.random();
 setFoundPopups((prev) => [
 ...prev,
 {
 id: popupId,
 x: hero.spot.x,
 y: hero.spot.y,
 name: isKo ? hero.nameKo : hero.nameEn,
 combo: nextCombo,
 },
 ]);
 setTimeout(() => {
 setFoundPopups((prev) => prev.filter((p) => p.id !== popupId));
 }, 1400);

 // 5명 전원 발견 시 클리어!
 if (nextFound.size === stageTargets.length) {
 handleStageComplete();
 }
 };

 // 스테이지 올클리어 처리
 const handleStageComplete = () => {
 setShowClearBanner(true);
 triggerHaptic('heavy');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

 if (!isDailyRewardClaimed) {
 const DAILY_REWARD = 1500;
 setIsDailyRewardClaimed(true);
 try {
 localStorage.setItem(`hero_daily_hidden_cleared_${todayStr}`, 'true');
 } catch (e) {
 console.error(e);
 }
 updateSns(
 DAILY_REWARD,
 isKo ? '일일 숨은 히어로 찾기 올클리어 보상' : 'Daily Hidden Hero Clear Reward'
 );
 }
 };

 // 배경 빈 곳 오클릭 핸들러
 const handleSceneMissClick = (e: React.MouseEvent<HTMLDivElement>) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = ((e.clientX - rect.left) / rect.width) * 100;
 const y = ((e.clientY - rect.top) / rect.height) * 100;

 setPointerPos({ x, y });
 setCombo(0);
 setMistakesCount((m) => m + 1);
 hiddenSynth.playMissBuzz();
 triggerHaptic('light');

 const markerId = Date.now() + Math.random();
 setMissMarkers((prev) => [...prev, { id: markerId, x, y }]);
 setTimeout(() => {
 setMissMarkers((prev) => prev.filter((m) => m.id !== markerId));
 }, 850);
 };

 // 마우스/터치 이동 시 돋보기 & 근접 센서 좌표 갱신
 const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
 const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
 setPointerPos({ x, y });
 };

 // 레이더 스캔 힌트 발동
 const triggerRadarScan = () => {
 if (radarCooldown > 0) return;
 const remaining = stageTargets.filter((t) => !foundIds.has(t.id));
 if (remaining.length === 0) return;

 const target = remaining[0];
 // 해당 영웅에 커버가 있으면 자동으로 열어줌
 if (target.spot.coverEmoji) {
 setOpenedCovers((prev) => new Set(prev).add(target.id));
 }
 setRadarActiveId(target.id);
 setSelectedTargetHintId(target.id);
 setPointerPos({ x: target.spot.x, y: target.spot.y });
 setRadarCooldown(15);
 triggerHaptic('medium');
 playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');

 setTimeout(() => {
 setRadarActiveId(null);
 }, 4500);
 };

 if (!isOpen) return null;

 const selectedClueHero =
 stageTargets.find((h) => h.id === selectedTargetHintId) ||
 stageTargets.find((h) => !foundIds.has(h.id)) ||
 stageTargets[0];

 const starCount = mistakesCount <= 2 ? 3 : mistakesCount <= 6 ? 2 : 1;

 return (
 <div className="fixed inset-0 z-[9998] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md select-none font-mono">
 <motion.div
 initial={{ opacity: 0, scale: 0.93, y: 18 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.93, y: 18 }}
 className="relative w-full max-w-2xl bg-[#0e131a] border-2 border-cyan-400/75 rounded-none shadow-[0_0_50px_rgba(6,182,212,0.28)] text-white overflow-hidden flex flex-col max-h-[94dvh]"
 >
 {/* 상단 헤더 */}
 <div className="px-3.5 py-2.5 bg-[#201d1d] from-[#101c29] via-[#162636] to-[#101c29] border-b border-cyan-500/40 flex items-center justify-between">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-sm bg-[#201d1d] flex items-center justify-center text-slate-950 font-black shadow-none shrink-0">
 <Search size={17} />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-1.5">
 <h2 className="text-xs sm:text-sm font-black tracking-wide text-cyan-300 truncate">
 {isKo ? '월리를 찾아라: 히어로 대수색' : "WHERE'S HERO? : WORLD HUNT"}
 </h2>
 <span className="px-1.5 py-0.5 text-[9px] font-black bg-rose-600 text-white rounded-sm animate-pulse shrink-0">
 PRO
 </span>
 {isDailyRewardClaimed && (
 <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500 text-slate-950 rounded-sm shrink-0">
 {isKo ? '일일 보상 완료 ✓' : 'CLAIMED ✓'}
 </span>
 )}
 </div>
 <p className="text-[10px] text-stone-300 truncate">
 {isKo ? activeStage.titleKo : activeStage.titleEn}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1 shrink-0">
 <button
 type="button"
 onClick={() => {
 hiddenSynth.muted = !isMuted;
 setIsMuted(!isMuted);
 }}
 className="w-8 min-h-[44px] rounded-sm bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-300 hover:text-white"
 >
 {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
 </button>
 <button
 type="button"
 onClick={onClose}
 className="w-8 min-h-[44px] rounded-sm bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-300 hover:bg-rose-600 hover:text-white transition-colors"
 >
 <X size={16} />
 </button>
 </div>
 </div>

 {/* 상단 컨트롤 & 근접 센서 HUD 바 */}
 <div className="px-3 py-2 bg-[#131b24] border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
 {/* 좌측: 발견 카운터 & 콤보 & 근접 센서 */}
 <div className="flex items-center gap-2.5">
 <div className="flex items-center gap-1">
 <span className="text-stone-400">{isKo ? '발견' : 'FOUND'}:</span>
 <span className="font-black text-amber-300">
 {foundIds.size}/{stageTargets.length}
 </span>
 </div>

 {combo > 1 && (
 <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-400 text-slate-950 rounded-xs transition-transform duration-300">
 {combo}x COMBO!
 </span>
 )}

 <div className="flex items-center gap-1 px-2 py-0.5 bg-stone-950 border border-stone-800 rounded-xs">
 <span className="text-[9px] text-stone-400">{isKo ? '탐지기:' : 'RADAR:'}</span>
 <span className={cn('text-[10px] font-black', proximitySignal.color)}>
 {proximitySignal.label}
 </span>
 </div>
 </div>

 {/* 우측: 스테이지 선택 & 줌 배율 & 스코프 & 레이더 힌트 */}
 <div className="flex items-center gap-1.5">
 {/* 5대 월드 스테이지 전환 */}
 <select
 value={selectedStageIdx}
 onChange={(e) => setSelectedStageIdx(Number(e.target.value))}
 className="bg-stone-950 border border-stone-700 text-[10px] font-bold text-cyan-200 px-1.5 py-1 rounded-sm outline-none"
 >
 {COMMERCIAL_WORLD_STAGES.map((st, idx) => (
 <option key={st.id} value={idx}>
 {isKo ? `월드 ${idx + 1}` : `Stage ${idx + 1}`}
 </option>
 ))}
 </select>

 {/* 돋보기 렌즈 스코프 토글 */}
 <button
 type="button"
 onClick={() => setLoupeEnabled(!loupeEnabled)}
 className={cn("min-h-[44px]", 
 'px-2 py-1 text-[10px] font-black rounded-sm border flex items-center gap-1',
 loupeEnabled
 ? 'bg-cyan-400 text-slate-950 border-cyan-200'
 : 'bg-stone-900 text-stone-400 border-stone-700'
 )}
 title="광학 스코프 조준기"
 >
 <Eye size={12} />
 <span>{isKo ? '스코프' : 'SCOPE'}</span>
 </button>

 {/* 줌 배율 버튼 */}
 <button
 type="button"
 onClick={() =>
 setZoomScale((z) => (z === 1 ? 1.35 : z === 1.35 ? 1.85 : 1))
 }
 className="min-h-[44px] px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[10px] font-black text-amber-300 rounded-sm flex items-center gap-1"
 >
 <ZoomIn size={12} />
 <span>{zoomScale.toFixed(1)}x</span>
 </button>

 {/* 레이더 힌트 */}
 <button
 type="button"
 disabled={radarCooldown > 0 || foundIds.size === stageTargets.length}
 onClick={triggerRadarScan}
 className={cn("min-h-[44px]", 
 'px-2 py-1 text-[10px] font-black rounded-sm border flex items-center gap-1 transition-all',
 radarCooldown > 0
 ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
 : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-xs'
 )}
 >
 <Compass size={12} />
 <span>
 {radarCooldown > 0
 ? `${radarCooldown}s`
 : isKo
 ? '위치 스캔'
 : 'SCAN'}
 </span>
 </button>
 </div>
 </div>

 {/* 🗺️ 메인 고해상도 인터랙티브 디오라마 탐색 뷰포트 */}
 <div className="relative flex-1 bg-stone-950 overflow-hidden flex flex-col">
 <div className="relative w-full h-[46vh] sm:h-[50vh] overflow-auto touch-pan-x touch-pan-y">
 <div
 onClick={handleSceneMissClick}
 onMouseMove={handlePointerMove}
 style={{
 width: `${zoomScale * 100}%`,
 height: `${zoomScale * 100}%`,
 minHeight: '340px',
 }}
 className="relative overflow-hidden cursor-crosshair select-none bg-stone-950"
 >
 {/* 1층: 고해상도 판타지 월드 일러스트 배경 */}
 <img
 src={getAssetUrl(activeStage.bgImage)}
 alt={activeStage.titleEn}
 className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none brightness-95 contrast-105"
 draggable={false}
 />

 {/* 분위기 조명 비네팅 오버레이 */}
 <div
 className={cn(
 'absolute inset-0 bg-[#201d1d] pointer-events-none',
 activeStage.ambientOverlay
 )}
 />

 {/* 2층: 군중 위장 NPC 및 인터랙티브 환경 소품(오크통, 보물상자, 천막 등) */}
 {dioramaCrowdAndProps.map((item) => {
 const isOpened = openedDecoys.has(item.id);
 return (
 <div
 key={item.id}
 style={{
 left: `${item.x}%`,
 top: `${item.y}%`,
 transform: `translate(-50%, -50%) scale(${item.scale})`,
 }}
 onClick={(e) => {
 e.stopPropagation();
 hiddenSynth.playPropRustle();
 triggerHaptic('light');
 setOpenedDecoys((prev) => new Set(prev).add(item.id));
 }}
 className="absolute z-10 cursor-pointer group"
 >
 {item.type === 'npc' ? (
 <div
 className={cn(
 'w-7 h-7 rounded-full overflow-hidden border border-stone-600/70 bg-stone-900/80 shadow-none transition-transform',
 isOpened ? 'opacity-35 scale-75' : 'hover:scale-110'
 )}
 >
 <img
 src={getAssetUrl(item.image || '/seat/Balbo.png')}
 alt="crowd"
 className="w-full h-full object-cover opacity-85"
 draggable={false}
 />
 </div>
 ) : (
 <motion.div
 animate={isOpened ? { rotate: [0, -15, 15, 0], scale: 0.8 } : {}}
 className={cn(
 'text-lg sm:text-xl select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] transition-opacity',
 isOpened ? 'opacity-40' : 'hover:scale-115'
 )}
 >
 {item.emoji}
 </motion.div>
 )}
 </div>
 );
 })}

 {/* 3층: 숨겨진 5명의 타겟 히어로 (카모플라주 + 장애물 커버 지원) */}
 {stageTargets.map((hero) => {
 const isFound = foundIds.has(hero.id);
 const hasCover =
 Boolean(hero.spot.coverEmoji) && !openedCovers.has(hero.id) && !isFound;
 const isRadarPing = radarActiveId === hero.id && !isFound;

 return (
 <div
 key={hero.id}
 style={{
 left: `${hero.spot.x}%`,
 top: `${hero.spot.y}%`,
 }}
 onClick={(e) => handleHeroCatch(hero, e)}
 className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
 >
 {/* 레이더 스캔 위치 펄스 링 */}
 {isRadarPing && (
 <motion.div
 animate={{ scale: [1, 2.8, 1], opacity: [0.95, 0.15, 0.95] }}
 transition={{ repeat: Infinity, duration: 1.1 }}
 className="absolute -inset-5 rounded-full border-2 border-cyan-300 bg-cyan-400/25 pointer-events-none"
 />
 )}

 {/* 숨은 영웅 본체 */}
 <motion.div
 style={{ rotate: isFound ? 0 : hero.camouflageAngle }}
 animate={
 isFound
 ? { scale: [1, 1.35, 1.15] }
 : { y: [0, -1.5, 0] }
 }
 transition={
 isFound
 ? { duration: 0.35 }
 : { repeat: Infinity, duration: 2.8 }
 }
 className={cn(
 'relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border transition-all flex items-center justify-center shadow-none',
 isFound
 ? 'border-2 border-emerald-300 ring-2 ring-emerald-500 z-30 shadow-[0_0_16px_rgba(16,185,129,0.95)]'
 : 'border-amber-200/40 bg-stone-900/75 opacity-85 hover:opacity-100 hover:scale-115'
 )}
 >
 <img
 src={getAssetUrl(hero.image)}
 alt={hero.nameEn}
 className="w-full h-full object-cover"
 draggable={false}
 />
 </motion.div>

 {/* 장애물 커버 (상자/수풀/오크통이 위를 살짝 가리고 있음 -> 터치하면 들춰짐!) */}
 {hasCover && (
 <motion.div
 whileHover={{ scale: 1.12, rotate: -6 }}
 onClick={(e) => handleCoverPeel(hero.id, e)}
 className="absolute -inset-1.5 z-30 flex items-center justify-center text-xl sm:text-2xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]"
 title={isKo ? '터치하여 들춰보기!' : 'Tap to peek behind!'}
 >
 {hero.spot.coverEmoji}
 </motion.div>
 )}

 {/* 발견 완료 체크 마크 */}
 {isFound && (
 <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 rounded-full p-0.5 shadow-none z-40">
 <CheckCircle2 size={11} />
 </div>
 )}
 </div>
 );
 })}

 {/* 발견 성공 플로팅 콤보 텍스트 */}
 {foundPopups.map((fp) => (
 <motion.div
 key={fp.id}
 initial={{ opacity: 1, y: 0, scale: 0.8 }}
 animate={{ opacity: 0, y: -32, scale: 1.15 }}
 transition={{ duration: 1.2 }}
 style={{ left: `${fp.x}%`, top: `${fp.y}%` }}
 className="pointer-events-none absolute -translate-x-1/2 -translate-y-full z-40 px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-xs shadow-none whitespace-nowrap"
 >
 ✓ {fp.name} {fp.combo > 1 ? `(${fp.combo}x COMBO!)` : 'FOUND!'}
 </motion.div>
 ))}

 {/* 오클릭(MISS) 조준 마커 */}
 {missMarkers.map((m) => (
 <motion.div
 key={m.id}
 initial={{ opacity: 1, scale: 0.5 }}
 animate={{ opacity: 0, scale: 1.6 }}
 transition={{ duration: 0.75 }}
 style={{ left: `${m.x}%`, top: `${m.y}%` }}
 className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center"
 >
 <div className="w-7 h-7 rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center text-rose-400 font-black text-xs">
 ✕
 </div>
 <span className="text-[9px] font-black text-rose-400 bg-black/80 px-1 rounded-xs mt-0.5">
 MISS
 </span>
 </motion.div>
 ))}

 {/* 광학 돋보기 스코프 크로스헤어 HUD */}
 {loupeEnabled && (
 <div
 style={{ left: `${pointerPos.x}%`, top: `${pointerPos.y}%` }}
 className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30 w-24 h-24 rounded-full border-2 border-cyan-300/80 shadow-[0_0_25px_rgba(34,211,238,0.45),inset_0_0_15px_rgba(34,211,238,0.25)] flex items-center justify-center"
 >
 <div className="w-full h-[1px] bg-cyan-300/35 absolute" />
 <div className="h-full w-[1px] bg-cyan-300/35 absolute" />
 <span className="absolute -bottom-4 px-1 py-0.2 bg-black/85 border border-cyan-500/50 text-[8px] text-cyan-300 rounded-xs">
 {Math.round(pointerPos.x)},{Math.round(pointerPos.y)}
 </span>
 </div>
 )}
 </div>
 </div>

 {/* 선택된 타겟 단서(Clue) 자막 바 */}
 <div className="px-3 py-1.5 bg-[#0b1017] border-t border-stone-800 flex items-center justify-between text-[11px]">
 <div className="flex items-center gap-1.5 truncate">
 <MapPin size={13} className="text-amber-400 shrink-0" />
 <span className="text-stone-400 shrink-0">
 {isKo ? `[${selectedClueHero.nameKo}] 단서:` : `[${selectedClueHero.nameEn}] Clue:`}
 </span>
 <span className="font-bold text-amber-200 truncate">
 {isKo ? selectedClueHero.spot.clueKo : selectedClueHero.spot.clueEn}
 </span>
 </div>
 <span className="text-[10px] text-stone-400 shrink-0 ml-2">
 {isKo ? '💡 상자·수풀을 탭하면 들춰봅니다' : '💡 Tap props to peek'}
 </span>
 </div>

 {/* 스테이지 올클리어 축하 오버레이 */}
 <AnimatePresence>
 {showClearBanner && (
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
 >
 <div className="flex items-center gap-1 mb-2">
 {[1, 2, 3].map((s) => (
 <Star
 key={s}
 size={28}
 className={cn(
 s <= starCount
 ? 'text-yellow-400 fill-yellow-400 transition-transform duration-300'
 : 'text-stone-700'
 )}
 />
 ))}
 </div>
 <h3 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-[#201d1d] ">
 {isKo ? '스테이지 수색 완벽 클리어!!' : 'STAGE CLEAR COMPLETE!!'}
 </h3>
 <p className="text-xs text-stone-300 mt-1">
 {isKo
 ? `${activeStage.titleKo}의 숨은 영웅 5명을 모두 찾아냈습니다!`
 : `Found all 5 hidden heroes in ${activeStage.titleEn}!`}
 </p>

 <div className="my-3.5 px-4 py-2 bg-stone-900 border border-amber-400/50 rounded-sm flex items-center gap-2">
 <Zap size={16} className="text-amber-400" />
 <span className="text-sm font-black text-amber-300">
 {isKo ? '일일 수색 보상 +1,500 SNS 획득 완료!' : 'Daily Reward +1,500 SNS Claimed!'}
 </span>
 </div>

 <div className="flex items-center gap-2 mt-2">
 <button
 type="button"
 onClick={() => {
 setShowClearBanner(false);
 setSelectedStageIdx((idx) => (idx + 1) % COMMERCIAL_WORLD_STAGES.length);
 }}
 className="min-h-[44px] px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-sm flex items-center gap-1 cursor-pointer"
 >
 <RotateCcw size={13} />
 <span>{isKo ? '다음 월드 스테이지 도전' : 'NEXT STAGE'}</span>
 </button>
 <button
 type="button"
 onClick={onClose}
 className="min-h-[44px] px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-sm cursor-pointer"
 >
 {isKo ? '닫기' : 'CLOSE'}
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* 하단 현상수배(WANTED) 타겟 영웅 5명 도크 */}
 <div className="p-2.5 bg-[#121922] border-t border-stone-800">
 <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1.5">
 <span className="font-bold text-cyan-300">
 🎯 {isKo ? '수배 중인 타겟 히어로 (카드를 탭하면 힌트 단서 표시)' : 'WANTED HEROES (Tap card for location clue)'}
 </span>
 <span className="text-amber-300 font-black">
 {isDailyRewardClaimed
 ? isKo
 ? '오늘 보상 수령 완료 ✓'
 : 'Daily 1,500 SNS Claimed ✓'
 : isKo
 ? '전원 발견 시 +1,500 SNS'
 : 'Find All = +1,500 SNS'}
 </span>
 </div>

 <div className="grid grid-cols-5 gap-1.5">
 {stageTargets.map((hero) => {
 const isFound = foundIds.has(hero.id);
 const isSelected = selectedClueHero.id === hero.id;

 return (
 <button
 key={hero.id}
 type="button"
 onClick={() => setSelectedTargetHintId(hero.id)}
 className={cn("min-h-[44px]", 
 'relative p-1.5 rounded-sm border flex flex-col items-center transition-all cursor-pointer',
 isFound
 ? 'bg-emerald-950/40 border-emerald-500/60 opacity-85'
 : isSelected
 ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-300'
 : 'bg-stone-900/90 border-stone-800 hover:border-stone-600'
 )}
 >
 <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xs overflow-hidden border border-white/20 bg-black mb-1">
 <img
 src={getAssetUrl(hero.image)}
 alt={hero.nameEn}
 className="w-full h-full object-cover"
 draggable={false}
 />
 {isFound && (
 <div className="absolute inset-0 bg-emerald-950/75 flex items-center justify-center">
 <span className="text-[9px] font-black text-emerald-300 border border-emerald-400 px-1 rounded-xs -rotate-12">
 FOUND
 </span>
 </div>
 )}
 </div>
 <span className="text-[10px] font-black text-stone-100 truncate w-full text-center">
 {isKo ? hero.nameKo : hero.nameEn}
 </span>
 <span className="text-[8px] text-stone-400 truncate w-full text-center">
 {isKo ? hero.roleKo : hero.roleEn}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 </motion.div>
 </div>
 );
};
