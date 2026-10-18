import { CARD_DATABASE } from '../../../src/cardDatabase';
import { CHARACTER_IP_PROFILES, CHARACTER_FACTIONS, CHARACTER_RARITY_RULES } from '../../../src/content/characterIp';
import { getCardSpriteCoords } from '../../../src/lib/utils';
import fs from 'fs';
import path from 'path';

const seatFiles = fs.readdirSync('public/seat');

const report = {
  factions: CHARACTER_FACTIONS,
  rarityRules: CHARACTER_RARITY_RULES,
  cards: [] as any[]
};

for (let id = 1; id <= 110; id++) {
  const card = CARD_DATABASE[id];
  const ip = CHARACTER_IP_PROFILES[id];
  const coordsCards = getCardSpriteCoords(id);
  const coordsLegacy = getCardSpriteCoords(id, '/card100.png');
  
  const enName = card?.title_en || '';
  const expected1 = enName.replace(/ /g, '_') + '.png';
  const expected2 = enName + '.png';
  const seatFile = seatFiles.find(f => f.toLowerCase() === expected1.toLowerCase() || f.toLowerCase() === expected2.toLowerCase()) || null;

  report.cards.push({
    id,
    title_ko: card?.title,
    title_en: card?.title_en,
    title_dis: card?.title_dis,
    faction: ip?.faction,
    element: card?.element,
    db_rarity: card?.rarity,
    ip_rarity: ip?.rarityTier,
    power: card?.power,
    level: card?.level,
    stats: card?.stats, // [top/N, right/E, bottom/S, left/W]
    ability: card?.ability || null,
    lore_ko: card?.lore_ko || null,
    lore_en: card?.lore_en || null,
    archetype: ip?.archetype,
    personality: ip?.personality,
    originStoryKey: ip?.originStoryKey,
    growthArcKey: ip?.growthArcKey,
    signatureLineKey: ip?.signatureLineKey,
    webtoonHookKey: ip?.webtoonHookKey,
    marketingTags: ip?.marketingTags,
    relationships: {
      relationshipIds: ip?.relationshipIds,
      rivalIds: ip?.rivalIds,
      allyIds: ip?.allyIds,
    },
    art: ip?.artDirection,
    animation: ip?.animationProfile,
    seatFile,
    sprite: {
      source: coordsCards.source,
      col: coordsCards.col,
      row: coordsCards.row,
      cols: coordsCards.cols,
      rows: coordsCards.rows,
      xPercent: coordsCards.xPercent,
      yPercent: coordsCards.yPercent,
    },
    legacySprite: {
      source: coordsLegacy.source,
      col: coordsLegacy.col,
      row: coordsLegacy.row,
      cols: coordsLegacy.cols,
      rows: coordsLegacy.rows,
      xPercent: coordsLegacy.xPercent,
      yPercent: coordsLegacy.yPercent,
    }
  });
}

fs.writeFileSync(
  '.agents/teamwork/explorer_survey_1/cards_dataset.json',
  JSON.stringify(report, null, 2),
  'utf-8'
);

console.log('Successfully wrote cards_dataset.json with 110 cards.');
