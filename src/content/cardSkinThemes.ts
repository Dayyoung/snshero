import { CARD_DATABASE } from '../cardDatabase';
import type { CharacterFaction } from '../types';
import { buildCharacterArtPrompt, getCharacterIpProfile, getFactionDef } from './characterIpUtils';

export type CardSkinThemeId = 'default' | 'original_mecha';

export interface CardSkinThemeVisual {
  themeId: CardSkinThemeId;
  cardId: number;
  assetPath: string | null;
  prompt: string;
  fallbackPrimaryColor: string;
  fallbackAccentColor: string;
  serialCode: string;
}

export interface CardSkinThemeDefinition {
  id: CardSkinThemeId;
  storageValue: CardSkinThemeId;
}

export const CARD_SKIN_THEME_STORAGE_KEY = 'hero_card_skin_theme';

export const CARD_SKIN_THEMES: CardSkinThemeDefinition[] = [
  { id: 'default', storageValue: 'default' },
  { id: 'original_mecha', storageValue: 'original_mecha' },
];

const FACTION_MECHA_DIRECTIVES: Record<CharacterFaction, string> = {
  water: 'amphibious abyss frame, fin-array thrusters, pressure armor, tidal reactor core',
  fire: 'volcanic siege frame, furnace vents, magma-lined armor, ignition cannons',
  wind: 'high-speed storm interceptor, feathered stabilizers, lightning capacitors, aerial blade wings',
  earth: 'tectonic guardian chassis, bedrock plating, terra drills, seismic stabilizers',
  human: 'heroic command exosuit, polished alloy plate, signal beacon mantle, civic defense insignia',
  undead: 'spectral salvage frame, haunted energy conduits, relic armor shards, soul furnace glow',
  elf: 'precision scout mech, crescent visor, living alloy weave, silent forest sensor rig',
  dwarf: 'forgeworker heavy frame, compact hammer-arms, anvil core, industrial heat shielding',
  monster: 'feral overdrive unit, asymmetrical armor, horned silhouette, predatory jump thrusters',
  robot: 'next-gen command machine, modular drone ports, chrome spine, neon telemetry lines',
  dragon: 'ancient draconic dreadnought, crown fins, scaled alloy plates, starfire propulsion',
};

const DEFAULT_PRIMARY = '#64748b';
const DEFAULT_ACCENT = '#cbd5e1';

function buildSerialCode(cardId: number): string {
  return `MCH-${String(cardId).padStart(3, '0')}`;
}

function buildOriginalMechaPrompt(cardId: number): string {
  const basePrompt = buildCharacterArtPrompt(cardId, 'en');
  const card = CARD_DATABASE[cardId];
  const profile = getCharacterIpProfile(cardId);
  const faction = profile?.faction;
  const directive = faction ? FACTION_MECHA_DIRECTIVES[faction] : 'original combat mech silhouette, proprietary SNSHero machine styling';
  const factionDef = faction ? getFactionDef(faction) : undefined;
  const palette = factionDef
    ? `palette anchored by ${factionDef.primaryColor} and ${factionDef.accentColor}`
    : 'balanced steel palette with readable accent lighting';
  const rarityTone = profile?.rarityTier ? `${profile.rarityTier} rarity frame treatment` : 'production-grade frame treatment';

  return [
    'SNSHero original mecha reinterpretation, no existing anime/game IP references, no trademarked insignia, no copied robot silhouettes',
    `Card ${cardId}: ${card?.title_dis ?? card?.title_en ?? `Card ${cardId}`}`,
    directive,
    palette,
    rarityTone,
    'preserve faction readability, preserve card silhouette clarity, preserve stat-legibility-friendly composition, dynamic but production-safe commercial concept art',
    basePrompt,
  ].join(' | ');
}

function buildOriginalMechaVisual(cardId: number): CardSkinThemeVisual {
  const profile = getCharacterIpProfile(cardId);
  const factionDef = profile ? getFactionDef(profile.faction) : undefined;

  return {
    themeId: 'original_mecha',
    cardId,
    assetPath: null,
    prompt: buildOriginalMechaPrompt(cardId),
    fallbackPrimaryColor: factionDef?.primaryColor ?? DEFAULT_PRIMARY,
    fallbackAccentColor: factionDef?.accentColor ?? DEFAULT_ACCENT,
    serialCode: buildSerialCode(cardId),
  };
}

export const ORIGINAL_MECHA_CARD_THEME_VISUALS: Record<number, CardSkinThemeVisual> = Object.fromEntries(
  Object.values(CARD_DATABASE).map((card) => [card.id, buildOriginalMechaVisual(card.id)]),
);

export function normalizeCardSkinTheme(theme: string | null | undefined): CardSkinThemeId {
  if (theme === 'default') return 'original_mecha';
  return 'original_mecha';
}

export function getCardSkinThemeVisual(themeId: CardSkinThemeId, cardId: number): CardSkinThemeVisual | null {
  if (themeId !== 'original_mecha') return null;
  return ORIGINAL_MECHA_CARD_THEME_VISUALS[cardId] ?? null;
}

export function getCardSkinThemePromptCount(themeId: CardSkinThemeId): number {
  if (themeId !== 'original_mecha') return 0;
  return Object.keys(ORIGINAL_MECHA_CARD_THEME_VISUALS).length;
}
