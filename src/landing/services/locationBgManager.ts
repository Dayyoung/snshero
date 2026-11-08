/**
 * locationBgManager.ts
 * 
 * 판타지 웹소설 에피소드 및 대화 씬에 최적화된 캐노니컬 배경 장소(LOC-001 ~ LOC-020) 매니저
 * public/anime-character-sheets/locations/art 리소스를 활용하여
 * 챕터 맥락 및 대사 텍스트에 부합하는 와이드 배경 이미지를 동적으로 제공합니다.
 */

export interface LocationMeta {
  id: string; // e.g. 'LOC-001'
  code: string; // e.g. 'LOC_001_Elwin_Village'
  nameKo: string;
  nameEn: string;
  nameJa: string;
  descriptionKo: string;
  bgJpgUrl: string;
  keywords: string[];
}

export const CANONICAL_LOCATIONS: Record<string, LocationMeta> = {
  'LOC-001': {
    id: 'LOC-001',
    code: 'LOC_001_Elwin_Village',
    nameKo: '엘윈 마을',
    nameEn: 'Elwin Village',
    nameJa: 'エルウィン村',
    descriptionKo: '설원 속 작은 변경 마을이자 카단과 알리시아의 고향',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_001_Elwin_Village.jpg?v=20261105u2',
    keywords: ['엘윈', '마을', '고향', '설원', '눈보라', '집', '오두막', 'elwin', 'village', 'snow'],
  },
  'LOC-002': {
    id: 'LOC-002',
    code: 'LOC_002_Drunken_Bell_Tower',
    nameKo: '취종루 (취한 종탑)',
    nameEn: 'Drunken Bell Tower',
    nameJa: '酔鐘楼',
    descriptionKo: '오랜 역사를 간직한 변경의 종탑과 모험가들의 주점',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_002_Drunken_Bell_Tower.jpg?v=20261105u2',
    keywords: ['종탑', '주점', '취종루', '술집', '선술집', '탑', 'tavern', 'bell tower'],
  },
  'LOC-003': {
    id: 'LOC-003',
    code: 'LOC_003_Mistfall_Cliff',
    nameKo: '안개 절벽 (미스트폴)',
    nameEn: 'Mistfall Cliff',
    nameJa: '霧降の崖',
    descriptionKo: '자욱한 독안개와 험준한 암벽이 이어지는 운명의 낭떠러지',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_003_Mistfall_Cliff.jpg?v=20261105u2',
    keywords: ['절벽', '안개', '미스트폴', '낭떠러지', '낙하', '추락', 'cliff', 'mistfall'],
  },
  'LOC-004': {
    id: 'LOC-004',
    code: 'LOC_004_Great_Plains_of_the_Wildlands',
    nameKo: '황무지 대평원',
    nameEn: 'Great Plains of the Wildlands',
    nameJa: '荒野の大平原',
    descriptionKo: '끝없는 지평선과 몬스터들이 출몰하는 거친 황야',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_004_Great_Plains_of_the_Wildlands.jpg?v=20261105u2',
    keywords: ['평원', '황무지', '황야', '들판', '초원', '대평원', 'plains', 'wildlands'],
  },
  'LOC-005': {
    id: 'LOC-005',
    code: 'LOC_005_Pegasus_Valley',
    nameKo: '천마 계곡 (페가수스 밸리)',
    nameEn: 'Pegasus Valley',
    nameJa: '天馬の谷',
    descriptionKo: '하늘을 가르는 야생 기수들과 적갈기의 전설이 서린 협곡',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_005_Pegasus_Valley.jpg?v=20261105u2',
    keywords: ['천마', '페가수스', '계곡', '적갈기', '기수', '말', '길들이기', '협곡', 'valley', 'pegasus'],
  },
  'LOC-006': {
    id: 'LOC-006',
    code: 'LOC_006_Lighthaven_Inner_Forum',
    nameKo: '라이트헤이븐 중앙 광장',
    nameEn: 'Lighthaven Inner Forum',
    nameJa: 'ライトヘイブン中央広場',
    descriptionKo: '왕국의 번화한 중심지이자 수많은 모험가들이 교류하는 광장',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_006_Lighthaven_Inner_Forum.jpg?v=20261105u2',
    keywords: ['광장', '라이트헤이븐', '시장', '도시', '중앙', '시가지', 'lighthaven', 'forum', 'plaza'],
  },
  'LOC-007': {
    id: 'LOC-007',
    code: 'LOC_007_Red_Glass_Palace',
    nameKo: '홍유리궁 (적유리 궁전)',
    nameEn: 'Red Glass Palace',
    nameJa: '紅硝子宮',
    descriptionKo: '핏빛 유리와 불꽃의 마력이 깃든 비밀 궁전',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_007_Red_Glass_Palace.jpg?v=20261105u2',
    keywords: ['궁전', '홍유리궁', '궁', '성', '적유리', 'palace', 'glass palace'],
  },
  'LOC-008': {
    id: 'LOC-008',
    code: 'LOC_008_Seventh_Subterranean_Labor_Camp',
    nameKo: '제7 지하 노역소',
    nameEn: 'Seventh Subterranean Labor Camp',
    nameJa: '第七地下強制労働所',
    descriptionKo: '어두운 지하 깊숙한 갱도와 노예 노동자들의 반란이 일어난 현장',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_008_Seventh_Subterranean_Labor_Camp.jpg?v=20261105u2',
    keywords: ['노역소', '지하', '갱도', '광산', '감옥', '수용소', '채굴', 'labor camp', 'mine', 'subterranean'],
  },
  'LOC-009': {
    id: 'LOC-009',
    code: 'LOC_009_Cloud_Return_Manor_Mist_Lake',
    nameKo: '구름귀환장 안개 호수',
    nameEn: 'Cloud Return Manor Mist Lake',
    nameJa: '雲還荘の霧湖',
    descriptionKo: '신비로운 안개와 물안개가 피어오르는 명문 가문의 은신처',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_009_Cloud_Return_Manor_Mist_Lake.jpg?v=20261105u2',
    keywords: ['호수', '구름귀환장', '장원', '연못', '물가', '정원', 'mist lake', 'manor'],
  },
  'LOC-010': {
    id: 'LOC-010',
    code: 'LOC_010_Whispering_Wind_Island',
    nameKo: '속삭이는 바람의 섬',
    nameEn: 'Whispering Wind Island',
    nameJa: '囁く風の島',
    descriptionKo: '신성한 바람의 결계와 고대 비전이 잠든 성역의 섬',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_010_Whispering_Wind_Island.jpg?v=20261105u2',
    keywords: ['바람의 섬', '섬', '바람', '해안', '신전', '바다', 'island', 'wind island'],
  },
  'LOC-011': {
    id: 'LOC-011',
    code: 'LOC_011_Black_Temple_Jade_Barrier_Spire',
    nameKo: '흑사당 옥결계 첨탑',
    nameEn: 'Black Temple Jade Barrier Spire',
    nameJa: '黒祠堂の玉結界尖塔',
    descriptionKo: '어둠의 사당과 비취 결계가 충돌하는 영혼의 첨탑',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_011_Black_Temple_Jade_Barrier_Spire.jpg?v=20261105u2',
    keywords: ['사당', '흑사당', '첨탑', '결계', '탑', '신당', 'temple', 'spire', 'barrier'],
  },
  'LOC-012': {
    id: 'LOC-012',
    code: 'LOC_012_Sky_Altar',
    nameKo: '천공 제단 (하늘 제단)',
    nameEn: 'Sky Altar',
    nameJa: '天空の祭壇',
    descriptionKo: '구름 위 드높은 하늘에서 별과 신의 계시를 받는 신성한 제단',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_012_Sky_Altar.jpg?v=20261105u2',
    keywords: ['천공', '하늘 제단', '제단', '하늘', '성진', '별', 'altar', 'sky altar'],
  },
  'LOC-013': {
    id: 'LOC-013',
    code: 'LOC_013_Flower_Ship_Siren_Strait',
    nameKo: '꽃배 세이렌 해협',
    nameEn: 'Flower Ship Siren Strait',
    nameJa: '花船のセイレン海峡',
    descriptionKo: '화려한 유람선과 치명적인 마물의 노랫소리가 울리는 해협',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_013_Flower_Ship_Siren_Strait.jpg?v=20261105u2',
    keywords: ['꽃배', '세이렌', '해협', '배', '선상', '바다', '항해', 'ship', 'strait', 'siren'],
  },
  'LOC-014': {
    id: 'LOC-014',
    code: 'LOC_014_Mount_Dragonhorn_Dragon_Grotto',
    nameKo: '용각산 용동 (용의 동굴)',
    nameEn: 'Mount Dragonhorn Dragon Grotto',
    nameJa: '竜角山の竜洞',
    descriptionKo: '고대 용의 숨결과 마그마가 잠든 험준한 산악 동굴',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_014_Mount_Dragonhorn_Dragon_Grotto.jpg?v=20261105u2',
    keywords: ['용각산', '용동', '용', '동굴', '화산', '용의 둥지', 'dragon', 'grotto', 'cave'],
  },
  'LOC-015': {
    id: 'LOC-015',
    code: 'LOC_015_The_Sealed_Chamber',
    nameKo: '봉인된 밀실',
    nameEn: 'The Sealed Chamber',
    nameJa: '封印の密室',
    descriptionKo: '수백 년간 아무도 발을 들이지 못한 고대 봉인의 방',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_015_The_Sealed_Chamber.jpg?v=20261105u2',
    keywords: ['밀실', '봉인', '비밀방', '금지구역', 'chamber', 'sealed chamber'],
  },
  'LOC-016': {
    id: 'LOC-016',
    code: 'LOC_016_Jade_Council_Hall',
    nameKo: '비취 평의회 의사당',
    nameEn: 'Jade Council Hall',
    nameJa: '翡翠評議会議事堂',
    descriptionKo: '권력과 정쟁이 오가는 왕국 최고 원로들의 호화로운 회의장',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_016_Jade_Council_Hall.jpg?v=20261105u2',
    keywords: ['평의회', '의사당', '비취', '원로회', '회의실', '심판', 'council', 'hall'],
  },
  'LOC-017': {
    id: 'LOC-017',
    code: 'LOC_017_Citadel_of_the_Four_Gates',
    nameKo: '네 수문 성채 (4대 관문 요새)',
    nameEn: 'Citadel of the Four Gates',
    nameJa: '四門の城砦',
    descriptionKo: '수천의 군세를 막아서는 난공불락의 거대한 철벽 요새',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_017_Citadel_of_the_Four_Gates.jpg?v=20261105u2',
    keywords: ['성채', '사문', '관문', '요새', '성벽', '공성전', '성문', 'citadel', 'fortress'],
  },
  'LOC-018': {
    id: 'LOC-018',
    code: 'LOC_018_Quicksand_River_Black_Marsh',
    nameKo: '유사하 흑늪 (검은 늪지대)',
    nameEn: 'Quicksand River Black Marsh',
    nameJa: '流砂河の黒沼',
    descriptionKo: '발을 디디면 삼켜지는 유사와 맹독 마수가 도사리는 검은 늪',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_018_Quicksand_River_Black_Marsh.jpg?v=20261105u2',
    keywords: ['늪', '유사하', '흑늪', '늪지대', '진흙', '수렁', 'marsh', 'swamp'],
  },
  'LOC-019': {
    id: 'LOC-019',
    code: 'LOC_019_Black_Citadel_Starlight_Archive',
    nameKo: '흑성 성광 서고',
    nameEn: 'Black Citadel Starlight Archive',
    nameJa: '黒城の星光書庫',
    descriptionKo: '세계의 모든 비밀과 금단의 마법서가 보관된 거대한 도서관',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_019_Black_Citadel_Starlight_Archive.jpg?v=20261105u2',
    keywords: ['서고', '도서관', '흑성', '책', '문헌', '기록', '비기', 'archive', 'library'],
  },
  'LOC-020': {
    id: 'LOC-020',
    code: 'LOC_020_Altar_of_Ruin_Two_Graves',
    nameKo: '파멸 제단 두 무덤',
    nameEn: 'Altar of Ruin Two Graves',
    nameJa: '破滅の祭壇・二つの墓',
    descriptionKo: '숙명의 라이벌과 영웅들의 최후 결전이 펼쳐지는 파멸의 제단',
    bgJpgUrl: '/anime-character-sheets/locations/art/LOC_020_Altar_of_Ruin_Two_Graves.jpg?v=20261105u2',
    keywords: ['파멸 제단', '무덤', '결전', '두 무덤', '종말', '묘지', 'graves', 'altar of ruin'],
  },
};

/**
 * 1~40화 대표 캐노니컬 장소 매핑 (Story-driven canonical location table)
 */
export const CHAPTER_PRIMARY_LOCATIONS: Record<number, string> = {
  1: 'LOC-001', // Elwin Village
  2: 'LOC-001', // Elwin Village
  3: 'LOC-003', // Mistfall Cliff
  4: 'LOC-004', // Great Plains of the Wildlands
  5: 'LOC-003', // Mistfall Cliff
  6: 'LOC-004', // Great Plains of the Wildlands
  7: 'LOC-005', // Pegasus Valley
  8: 'LOC-005', // Pegasus Valley
  9: 'LOC-008', // Seventh Subterranean Labor Camp
  10: 'LOC-001', // Elwin Village (귀환)
  11: 'LOC-008', // Seventh Subterranean Labor Camp
  12: 'LOC-008', // Seventh Subterranean Labor Camp
  13: 'LOC-010', // Whispering Wind Island
  14: 'LOC-009', // Cloud Return Manor Mist Lake
  15: 'LOC-009', // Cloud Return Manor Mist Lake
  16: 'LOC-009', // Cloud Return Manor Mist Lake
  17: 'LOC-010', // Whispering Wind Island
  18: 'LOC-011', // Black Temple Jade Barrier Spire
  19: 'LOC-012', // Sky Altar
  20: 'LOC-010', // Whispering Wind Island
  21: 'LOC-010', // Whispering Wind Island
  22: 'LOC-013', // Flower Ship Siren Strait
  23: 'LOC-014', // Mount Dragonhorn Dragon Grotto
  24: 'LOC-014', // Mount Dragonhorn Dragon Grotto
  25: 'LOC-010', // Whispering Wind Island
  26: 'LOC-016', // Jade Council Hall
  27: 'LOC-010', // Whispering Wind Island
  28: 'LOC-016', // Jade Council Hall
  29: 'LOC-010', // Whispering Wind Island
  30: 'LOC-017', // Citadel of the Four Gates
  31: 'LOC-018', // Quicksand River Black Marsh
  32: 'LOC-018', // Quicksand River Black Marsh
  33: 'LOC-018', // Quicksand River Black Marsh
  34: 'LOC-019', // Black Citadel Starlight Archive
  35: 'LOC-020', // Altar of Ruin Two Graves
  36: 'LOC-019', // Black Citadel Starlight Archive
  37: 'LOC-019', // Black Citadel Starlight Archive
  38: 'LOC-020', // Altar of Ruin Two Graves
  39: 'LOC-018', // Quicksand River Black Marsh
  40: 'LOC-001', // Elwin Village (평화로운 피날레)
};

/**
 * 에피소드(챕터 1~40) 기준 기본 캐노니컬 배경 장소 반환
 */
export function getEpisodeBackground(chapter: number): LocationMeta {
  const safeChapter = Math.max(1, Math.min(40, chapter || 1));
  const locId = CHAPTER_PRIMARY_LOCATIONS[safeChapter] || 'LOC-001';
  return CANONICAL_LOCATIONS[locId] || CANONICAL_LOCATIONS['LOC-001'];
}

/**
 * 라인별 정밀 장소 판별 엔진
 * 1. 라인의 text, sceneTitleKo, sceneExplanationKo를 분석하여 20대 장소 키워드와 매칭.
 * 2. 특정 장소 키워드가 매칭되면 해당 장소 반환.
 * 3. 매칭되지 않으면 fallbackLocation 또는 챕터 대표 장소 반환.
 */
export function resolveLocationForLine(
  chapter: number,
  line?: { text?: string; textEn?: string; sceneTitleKo?: string; sceneExplanationKo?: string },
  fallbackLocation?: LocationMeta
): LocationMeta {
  if (!line) {
    return fallbackLocation || getEpisodeBackground(chapter);
  }

  const combinedText = `${line.sceneTitleKo || ''} ${line.sceneExplanationKo || ''} ${line.text || ''}`.toLowerCase();

  // 1. 장소 공식 명칭 직접 언급 검사 (가장 높은 신뢰도)
  for (const loc of Object.values(CANONICAL_LOCATIONS)) {
    // 특수 장소명(예: '엘윈', '취종루', '미스트폴', '홍유리궁', '노역소', '귀운장' 등)
    const baseName = loc.nameKo.split(' ')[0];
    if (combinedText.includes(loc.nameKo.toLowerCase()) || (baseName.length >= 2 && combinedText.includes(baseName.toLowerCase()))) {
      return loc;
    }
  }

  // 2. 키워드 기반 매칭 (신뢰도 가중치)
  for (const loc of Object.values(CANONICAL_LOCATIONS)) {
    for (const kw of loc.keywords) {
      if (kw.length >= 2 && combinedText.includes(kw.toLowerCase())) {
        return loc;
      }
    }
  }

  // 3. 별도 장소 언급이 없으면 fallbackLocation 또는 챕터 기본 장소 유지
  return fallbackLocation || getEpisodeBackground(chapter);
}

/**
 * 대사 화면 배경 헬퍼 (대사 라인의 장소 우선 적용)
 */
export function getDialogueBackground(
  chapter: number,
  line?: { text?: string; textEn?: string; sceneTitleKo?: string; sceneExplanationKo?: string },
  fallbackLocation?: LocationMeta
): LocationMeta {
  return resolveLocationForLine(chapter, line, fallbackLocation);
}

/**
 * 특정 배경 이미지 사전 캐싱
 */
const preloadedBgCache = new Set<string>();

export function preloadLocationBackground(bgUrl: string): void {
  if (!bgUrl || preloadedBgCache.has(bgUrl) || typeof window === 'undefined') return;
  try {
    const img = new Image();
    img.src = bgUrl;
    preloadedBgCache.add(bgUrl);
  } catch {
    // 무시
  }
}

/**
 * 현재 챕터 기준 전후 배경 이미지 사전 캐싱
 */
export function preloadNearbyChapterBackgrounds(chapter: number): void {
  const safeChapter = Math.max(1, Math.min(40, chapter || 1));
  const targets = [safeChapter, safeChapter + 1, safeChapter - 1];
  for (const ch of targets) {
    if (ch >= 1 && ch <= 40) {
      const locId = CHAPTER_PRIMARY_LOCATIONS[ch];
      const loc = CANONICAL_LOCATIONS[locId];
      if (loc) {
        preloadLocationBackground(loc.bgJpgUrl);
      }
    }
  }
}

export function getAllCanonicalLocations(): LocationMeta[] {
  return Object.values(CANONICAL_LOCATIONS);
}
