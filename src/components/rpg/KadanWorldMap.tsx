import React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { t } from '../../lib/i18n';
import type { Language } from '../../types';
import type { KadanRpgEvent, KadanRpgRegion, KadanRpgTile } from '../../content/kadanRpgStory';

interface KadanWorldMapProps {
  region: KadanRpgRegion;
  events: KadanRpgEvent[];
  heroTile: KadanRpgTile;
  targetTile: KadanRpgTile | null;
  activeEventId?: string;
  completedEventIds: string[];
  language: Language;
  lowSpecMode: boolean;
  onTilePress: (tile: KadanRpgTile) => void;
  onEventPress: (event: KadanRpgEvent) => void;
}

const terrainClass: Record<KadanRpgRegion['terrain'], string> = {
  snow: 'from-sky-50 via-blue-50 to-slate-100 border-sky-100',
  cliff: 'from-rose-100 via-orange-100 to-stone-200 border-orange-200',
  palace: 'from-red-950 via-slate-900 to-zinc-950 border-red-800 text-white',
  cave: 'from-cyan-950 via-slate-900 to-blue-950 border-cyan-800 text-white',
  lake: 'from-cyan-100 via-blue-100 to-emerald-100 border-cyan-200',
  forest: 'from-emerald-100 via-lime-100 to-slate-100 border-emerald-200',
  island: 'from-teal-100 via-sky-100 to-indigo-100 border-sky-200',
  citadel: 'from-slate-950 via-indigo-950 to-rose-950 border-slate-800 text-white',
};

const tileClass: Record<KadanRpgRegion['terrain'], string> = {
  snow: 'bg-white/75 border-sky-100',
  cliff: 'bg-orange-50/80 border-orange-200',
  palace: 'bg-red-900/45 border-red-800',
  cave: 'bg-cyan-900/45 border-cyan-800',
  lake: 'bg-cyan-50/80 border-cyan-200',
  forest: 'bg-emerald-50/80 border-emerald-200',
  island: 'bg-sky-50/80 border-sky-200',
  citadel: 'bg-slate-900/70 border-slate-700',
};

const terrainAsset: Record<KadanRpgRegion['terrain'], string> = {
  snow: '/rpg/kadan-map/tile-snow.png',
  cliff: '/rpg/kadan-map/tile-cliff.png',
  palace: '/rpg/kadan-map/tile-palace.png',
  cave: '/rpg/kadan-map/tile-cave.png',
  lake: '/rpg/kadan-map/tile-forest.png',
  forest: '/rpg/kadan-map/tile-forest.png',
  island: '/rpg/kadan-map/tile-snow.png',
  citadel: '/rpg/kadan-map/tile-palace.png',
};

const eventAsset: Partial<Record<KadanRpgEvent['nodeType'], string>> = {
  enemy: '/rpg/kadan-map/object-enemy.png',
  chest: '/rpg/kadan-map/object-chest.png',
  portal: '/rpg/kadan-map/object-portal.png',
  story: '/rpg/kadan-map/object-portal.png',
};

const tileKey = (tile: KadanRpgTile) => `${tile.x}:${tile.y}`;

export const KadanWorldMap: React.FC<KadanWorldMapProps> = ({
  region,
  events,
  heroTile,
  targetTile,
  activeEventId,
  completedEventIds,
  language,
  lowSpecMode,
  onTilePress,
  onEventPress,
}) => {
  const blocked = new Set(region.blockedTiles.map(tileKey));
  const eventByTile = new Map<string, KadanRpgEvent>(events.map((event) => [tileKey(event.tile), event]));

  return (
    <section className={cn(
      'relative min-h-[420px] overflow-hidden rounded-lg border bg-gradient-to-br p-3 shadow-sm',
      terrainClass[region.terrain],
    )}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500/90">{t('kadan_rpg_world_map', language)}</p>
          <h2 className="text-lg font-extrabold tracking-normal">{t(region.nameKey, language)}</h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-white/80 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
          <MapPin size={16} />
          {heroTile.x + 1}, {heroTile.y + 1}
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${region.width}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: region.width * region.height }, (_, index) => {
          const tile = { x: index % region.width, y: Math.floor(index / region.width) };
          const key = tileKey(tile);
          const event = eventByTile.get(key);
          const isBlocked = blocked.has(key);
          const isHero = heroTile.x === tile.x && heroTile.y === tile.y;
          const isTarget = targetTile?.x === tile.x && targetTile?.y === tile.y;
          const isCompleted = event ? completedEventIds.includes(event.id) : false;
          const objectAsset = event ? eventAsset[event.nodeType] : null;

          return (
            <button
              key={key}
              type="button"
              disabled={isBlocked}
              onClick={() => {
                if (event) {
                  onEventPress(event);
                } else {
                  onTilePress(tile);
                }
              }}
              className={cn(
                'relative aspect-square min-h-8 rounded-md border transition-all active:scale-95',
                tileClass[region.terrain],
                isBlocked && 'cursor-not-allowed bg-slate-900/30 opacity-40',
                !isBlocked && 'cursor-pointer hover:ring-2 hover:ring-indigo-400',
                isTarget && 'ring-2 ring-amber-400',
                activeEventId === event?.id && 'ring-2 ring-indigo-500',
              )}
              aria-label={event ? t(event.chapterTitleKey, language) : t('kadan_rpg_move_tile', language)}
            >
              {isTarget && !lowSpecMode && (
                <span className="absolute inset-1 rounded-md border border-amber-400/80" />
              )}
              <img
                src={terrainAsset[region.terrain]}
                alt=""
                className={cn(
                  'absolute inset-0 h-full w-full object-cover opacity-75',
                  isBlocked && 'grayscale',
                )}
                draggable={false}
              />
              {event && (
                objectAsset ? (
                  <img
                    src={objectAsset}
                    alt={t(event.chapterTitleKey, language)}
                    className={cn(
                      'absolute left-1/2 top-1/2 z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_4px_6px_rgba(15,23,42,0.45)] sm:h-10 sm:w-10',
                      isCompleted && 'opacity-45 grayscale',
                    )}
                    draggable={false}
                  />
                ) : (
                  <span className={cn(
                    'absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-100 bg-white/95 text-indigo-700 shadow-sm',
                    isCompleted && 'opacity-45 grayscale',
                  )}>
                    <MessageCircle size={16} />
                  </span>
                )
              )}
              {isHero && (
                <span className={cn(
                  'absolute left-1/2 top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-950 shadow-lg',
                  !lowSpecMode && 'transition-transform duration-300',
                )}>
                  <img src="/rpg/kadan-map/hero-kadan.png" alt="Kadan" className="h-full w-full rounded-full object-cover" draggable={false} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
