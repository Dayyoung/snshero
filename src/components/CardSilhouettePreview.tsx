import React, { useMemo } from 'react';
import { cn } from '../lib/utils';
import type { CharacterFaction } from '../types';
import { Waves, Flame, Wind, Mountain, User, Skull, Leaf, Hammer, Ghost, Bot, Zap, Shield } from 'lucide-react';
import { getCharacterIpProfile } from '../content/characterIpUtils';
import { getFactionDef } from '../content/characterIpUtils';

interface CardSilhouettePreviewProps {
  cardId: number;
  cardName?: string;
  imageUrl?: string;
  size?: number;
  className?: string;
  lowSpecMode?: boolean;
}

const FACTION_SYMBOLS: Record<CharacterFaction, React.FC<{ size?: number; className?: string }>> = {
  water: (props) => <Waves {...props} />,
  fire: (props) => <Flame {...props} />,
  wind: (props) => <Wind {...props} />,
  earth: (props) => <Mountain {...props} />,
  human: (props) => <User {...props} />,
  undead: (props) => <Skull {...props} />,
  elf: (props) => <Leaf {...props} />,
  dwarf: (props) => <Hammer {...props} />,
  monster: (props) => <Ghost {...props} />,
  robot: (props) => <Bot {...props} />,
  dragon: (props) => <Zap {...props} />,
};

/**
 * Silhouette preview mode for card thumbnails.
 * Shows a high-contrast silhouette version of a card image,
 * or a faction-based fallback symbol when no image is available.
 */
export const CardSilhouettePreview: React.FC<CardSilhouettePreviewProps> = ({
  cardId,
  cardName,
  imageUrl,
  size = 64,
  className,
  lowSpecMode = false,
}) => {
  const ipProfile = useMemo(() => getCharacterIpProfile(cardId), [cardId]);
  const factionDef = useMemo(
    () => (ipProfile ? getFactionDef(ipProfile.faction) : undefined),
    [ipProfile],
  );
  const silhouetteStrength = ipProfile?.artDirection.silhouetteStrength ?? 'moderate';

  const hasImage = Boolean(imageUrl);

  const factionColor = factionDef?.primaryColor ?? '#64748b';
  const accentColor = factionDef?.accentColor ?? '#94a3b8';

  const silhouetteFilter = useMemo(() => {
    if (lowSpecMode) return 'grayscale(1) contrast(1.5) brightness(0.3)';
    switch (silhouetteStrength) {
      case 'clean':
        return 'grayscale(1) contrast(2) brightness(0.2) drop-shadow(0 0 2px rgba(255,255,255,0.3))';
      case 'complex':
        return 'grayscale(1) contrast(1.6) brightness(0.35)';
      case 'moderate':
      default:
        return 'grayscale(1) contrast(1.8) brightness(0.25)';
    }
  }, [silhouetteStrength, lowSpecMode]);

  const SymbolIcon = ipProfile ? FACTION_SYMBOLS[ipProfile.faction] : undefined;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-lg border-2',
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: '#1e293b',
        borderColor: factionColor,
      }}
      title={cardName ?? `Card #${cardId}`}
    >
      {hasImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imageUrl})`,
            filter: silhouetteFilter,
            backgroundSize: 'cover',
          }}
        />
      ) : SymbolIcon ? (
        <SymbolIcon
          size={Math.round(size * 0.5)}
          className="transition-opacity"
          style={{ color: accentColor, opacity: 0.85 }}
        />
      ) : (
        <Shield
          size={Math.round(size * 0.45)}
          className="opacity-60"
          style={{ color: '#64748b' }}
        />
      )}

      {/* Silhouette overlay gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${factionColor}22 0%, transparent 50%, ${accentColor}22 100%)`,
        }}
      />

      {/* Faction indicator dot */}
      {ipProfile && (
        <div
          className="absolute top-1 right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: factionColor, opacity: 0.7 }}
        />
      )}
    </div>
  );
};
