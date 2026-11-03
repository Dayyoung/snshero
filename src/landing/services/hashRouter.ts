/**
 * src/landing/services/hashRouter.ts
 *
 * Single-Page Application Hash Navigation & Route Normalization Service.
 * Dual-entry MPA architecture: Zero React runtime, zero server dependencies.
 * Full client-side hash routing (#home, #deck, #play, #card, #shop).
 */

export type ViewKey = 'home' | 'deck' | 'play' | 'card' | 'shop' | 'mall' | 'book' | 'webtoon';
export type HashRoute = '#home' | '#deck' | '#play' | '#card' | '#shop' | '#mall' | '#book' | '#webtoon';
export type LegacyRoute =
  | '/home'
  | '/deck'
  | '/play'
  | '/main'
  | '/shop'
  | '/card'
  | '/mall'
  | '/goods'
  | '/book'
  | '/novel'
  | '/webtoon'
  | '/cartoonbook';

export const VALID_VIEWS: readonly ViewKey[] = [
  'home',
  'deck',
  'play',
  'card',
  'shop',
  'mall',
  'book',
  'webtoon',
] as const;

export const HASH_ROUTES: readonly HashRoute[] = [
  '#home',
  '#deck',
  '#play',
  '#card',
  '#shop',
  '#mall',
  '#book',
  '#webtoon',
] as const;

export const LEGACY_ROUTES: readonly LegacyRoute[] = [
  '/home',
  '/deck',
  '/play',
  '/main',
  '/shop',
  '/card',
  '/mall',
  '/goods',
  '/book',
  '/novel',
  '/webtoon',
  '/cartoonbook',
] as const;

export const HASH_VIEW_MAP: Record<string, ViewKey> = {
  home: 'home',
  'main-lobby': 'home',
  deck: 'deck',
  mydeck: 'deck',
  play: 'play',
  main: 'play',
  battle: 'play',
  card: 'card',
  cards: 'card',
  mission: 'card',
  missions: 'card',
  companion: 'card',
  shop: 'shop',
  store: 'shop',
  mall: 'mall',
  goods: 'mall',
  book: 'book',
  novel: 'book',
  webtoon: 'webtoon',
  webtoo: 'webtoon',
  cartoon: 'webtoon',
  cartoonbook: 'webtoon',
};

export const LEGACY_PATH_MAP: Record<string, ViewKey> = {
  '/home': 'home',
  '/main-lobby': 'home',
  '/deck': 'deck',
  '/mydeck': 'deck',
  '/play': 'play',
  '/main': 'play',
  '/card': 'card',
  '/cards': 'card',
  '/mission': 'card',
  '/missions': 'card',
  '/shop': 'shop',
  '/store': 'shop',
  '/mall': 'mall',
  '/goods': 'mall',
  '/book': 'book',
  '/novel': 'book',
  '/webtoon': 'webtoon',
  '/cartoonbook': 'webtoon',
};

export const LEGACY_ROUTE_MAPPING: Record<LegacyRoute, HashRoute> = {
  '/home': '#home',
  '/deck': '#deck',
  '/play': '#play',
  '/main': '#play',
  '/shop': '#shop',
  '/card': '#card',
  '/mall': '#mall',
  '/goods': '#mall',
  '/book': '#book',
  '/novel': '#book',
  '/webtoon': '#webtoon',
  '/cartoonbook': '#webtoon',
};

/**
 * Parses the current URL hash or legacy pathname into a valid ViewKey.
 * Defaults to 'home' if empty or unrecognized.
 */
export function parseRoute(hashString?: string, pathnameString?: string): ViewKey {
  const rawHash = (hashString !== undefined ? hashString : (typeof window !== 'undefined' ? window.location.hash : ''))
    .replace(/^#\/?/, '')
    .split('?')[0]
    .replace(/\/$/, '')
    .toLowerCase();

  if (rawHash && rawHash in HASH_VIEW_MAP) {
    return HASH_VIEW_MAP[rawHash];
  }

  const cleanPath = (pathnameString !== undefined ? pathnameString : (typeof window !== 'undefined' ? window.location.pathname : ''))
    .replace(/\/$/, '')
    .toLowerCase();

  if (cleanPath && cleanPath in LEGACY_PATH_MAP) {
    return LEGACY_PATH_MAP[cleanPath];
  }

  return 'home';
}

/**
 * Normalizes any raw hash string, route path, or legacy route into a canonical HashRoute.
 */
export function normalizeHashRoute(rawHashOrPath: string): HashRoute {
  if (!rawHashOrPath) return '#home';
  const clean = rawHashOrPath.split('?')[0].trim();
  if (clean in LEGACY_ROUTE_MAPPING) {
    return LEGACY_ROUTE_MAPPING[clean as LegacyRoute];
  }
  const normalizedHash = clean.startsWith('#') ? clean : `#${clean}`;
  if ((HASH_ROUTES as readonly string[]).includes(normalizedHash)) {
    return normalizedHash as HashRoute;
  }
  const view = parseRoute(clean.startsWith('#') ? clean : undefined, !clean.startsWith('#') ? clean : undefined);
  const candidate = `#${view}` as HashRoute;
  if ((HASH_ROUTES as readonly string[]).includes(candidate)) {
    return candidate;
  }
  return '#home';
}

export function isLegacyRoute(route: string): boolean {
  const clean = route.split('?')[0].trim();
  return clean in LEGACY_ROUTE_MAPPING;
}

export function getLegacyRedirect(route: string): HashRoute | null {
  const clean = route.split('?')[0].trim();
  if (clean in LEGACY_ROUTE_MAPPING) {
    return LEGACY_ROUTE_MAPPING[clean as LegacyRoute];
  }
  return null;
}
