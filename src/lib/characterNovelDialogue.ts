import { CARD_DATABASE } from '../cardDatabase';
import { KADAN_RPG_NOVEL_SCRIPTS } from '../content/kadanRpgNovelScript';
import { getCharacterIpProfile } from '../content/characterIpUtils';
import { t } from './i18n';
import type { Language } from '../types';

export interface CharacterNovelDialogueResult {
  cardId: number;
  characterName: string;
  speakerTitle: string;
  dialogue: string;
  sourceNovel: string;
  episodeName?: string;
  faction?: string;
  element?: string;
}

/**
 * 미션 대결 상대 카드가 웹소설 《카단 & 아케인 에코즈》 및 공식 IP 설정에서
 * 발언한 실제 대사를 조회하여 반환합니다.
 */
export function getCharacterNovelDialogue(cardId: number, language: Language = 'ko'): CharacterNovelDialogueResult {
  const safeCardId = CARD_DATABASE[cardId] ? cardId : 1;
  const dbCard = CARD_DATABASE[safeCardId];
  const isKo = language === 'ko';
  const charName = isKo ? (dbCard.title || `영웅 #${safeCardId}`) : (dbCard.title_en || `Hero #${safeCardId}`);
  const profile = getCharacterIpProfile(safeCardId);

  let novelLineText: string | null = null;
  let novelEpisodeTitle: string | null = null;

  // 1. 한국어 모드일 때 KADAN_RPG_NOVEL_SCRIPTS에 직접 매핑된 대사가 있는지 확인
  if (isKo) {
    for (const [epNum, scriptList] of Object.entries(KADAN_RPG_NOVEL_SCRIPTS)) {
      const directLine = scriptList.find(s => s.cardId === safeCardId && s.speaker !== 'narrator');
      if (directLine && directLine.text) {
        const cleaned = directLine.text.replace(/^[“"']|[”"']$/g, '').trim();
        if (cleaned.length > 3) {
          novelLineText = cleaned;
          const narratorLine = scriptList.find(s => s.speaker === 'narrator');
          novelEpisodeTitle = narratorLine?.name || `제 ${epNum}화`;
          break;
        }
      }
    }
  }

  // 2. KADAN_RPG_NOVEL_SCRIPTS에 없거나 영어 등 타 언어일 경우 IP 공식 signatureLineKey 활용
  if (!novelLineText && profile?.signatureLineKey) {
    const rawLine = t(profile.signatureLineKey, language);
    if (rawLine && rawLine !== profile.signatureLineKey) {
      // "..." — 이름 형태에서 인용구 분리 및 정제
      const cleaned = rawLine
        .replace(/—\s*[^"—]+$/, '')
        .replace(/^["“']|["”']$/g, '')
        .trim();
      if (cleaned.length > 3) {
        novelLineText = cleaned;
        novelEpisodeTitle = isKo ? `No.${safeCardId} ${charName}의 결의` : `No.${safeCardId} ${charName}'s Vow`;
      }
    }
  }

  // 3. 대체 텍스트: 배경 설정 (lore)
  if (!novelLineText) {
    if (isKo && dbCard.lore_ko) {
      novelLineText = dbCard.lore_ko.slice(0, 120);
    } else if (dbCard.lore_en) {
      novelLineText = dbCard.lore_en.slice(0, 120);
    } else {
      novelLineText = isKo
        ? '“내 무기와 영혼에 깃든 아케인의 힘을 증명하겠다. 전력을 다해 덤벼라!”'
        : '“I shall prove the arcane strength dwelling in my soul. Face me with all your might!”';
    }
    novelEpisodeTitle = isKo ? `No.${safeCardId} 캐릭터 스토리` : `No.${safeCardId} Character Story`;
  }

  const elementTitles: Record<string, { ko: string; en: string }> = {
    water: { ko: '수류 수호자', en: 'Water Guardian' },
    fire: { ko: '화염 집행자', en: 'Fire Enforcer' },
    wind: { ko: '질풍 정찰자', en: 'Gale Scout' },
    earth: { ko: '대지 파수꾼', en: 'Earth Sentinel' },
    holy: { ko: '신성 성기사', en: 'Holy Paladin' },
    dragon: { ko: '용맥 계승자', en: 'Dragon Scion' },
    undead: { ko: '심연 사령관', en: 'Abyssal Commander' },
    monster: { ko: '야수 맹주', en: 'Beast Overlord' },
  };

  const elemKey = (dbCard.element || 'neutral').toLowerCase();
  const elemTitle = elementTitles[elemKey] || { ko: '아케인 수호자', en: 'Arcane Guardian' };

  return {
    cardId: safeCardId,
    characterName: charName,
    speakerTitle: isKo ? elemTitle.ko : elemTitle.en,
    dialogue: novelLineText,
    sourceNovel: isKo ? '웹소설 《카단 & 아케인 에코즈》' : 'Novel "Kadan & Arcane Echoes"',
    episodeName: novelEpisodeTitle || undefined,
    faction: profile?.faction,
    element: dbCard.element
  };
}
