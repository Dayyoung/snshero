export interface ExportDeckRow {
  id: number;
  name: string;
  rarity: string;
  attack: number;
  defense: number;
  hp: number;
  speed: number;
}

export interface ExportBattleLog {
  id: string;
  date: string;
  mode: string;
  opponent: string;
  result: string;
  score: string;
}

export interface ExportSeasonStats {
  season: string;
  rank: string;
  points: number;
  wins: number;
  losses: number;
}

export interface GoogleSheetsExportPayload {
  deck: ExportDeckRow[];
  battleLogs: ExportBattleLog[];
  seasonStats: ExportSeasonStats;
}

export async function createDevelopmentRoadmapSpreadsheet(
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const title = `[SNSHero] 개발 목표 리스트 (Development Goals Roadmap) - ${new Date().toLocaleDateString('ko-KR')}`;

  // 1. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: '개발 목표 리스트' } },
        { properties: { title: '시즌 개발 로드맵 Summary' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create roadmap spreadsheet: ${errText}`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Format Roadmap values
  const roadmapValues = [
    ['Task ID', '카테고리 (Category)', '개발 목표 항목 (Goal Title)', '상세 내용 (Details)', '우선순위 (Priority)', '상태 (Status)', '담당 모듈 (Module)', '목표 일정 (Target Date)'],
    ['DEV-001', 'Core System', 'Google Sheets API 연동 및 데이터 내보내기/불러오기', '구글 OAuth 및 Sheets API를 통한 덱, 전투기록, 개발목표 스프레드시트 자동 생성', 'High', '완료 (Completed)', 'src/lib/googleSheetsService.ts', '2026-08-05'],
    ['DEV-002', 'Battle Engine', '카단 RPG 자동 전투 Visual FX 및 스킬 연출 강화', '저사양 모드(lowSpecMode) 호환 및 모노스페이스 애니메이션 오라 적용', 'High', '완료 (Completed)', 'src/components/rpg/KadanBattleGate.tsx', '2026-08-05'],
    ['DEV-003', 'UI / UX Design', 'DESIGN.md 모노스페이스 플랫 디자인 100% 가이드 준수', 'Warm Cream(#fdfcfc) 배경, Ink(#201d1d) 텍스트, 1px hairline border, [+] 마커 적용', 'High', '완료 (Completed)', 'Entire Views & Components', '2026-08-05'],
    ['DEV-004', 'i18n / 다국어', '한국어/영어 2개 주력 및 10개 언어 fallback 시스템', 'ko/en 언어팩 우선 적용, 기본 영어 fallback 메커니즘 구축', 'Medium', '완료 (Completed)', 'src/lib/i18n.ts', '2026-08-06'],
    ['DEV-005', 'Card Collection', '시즌 2 신규 카드 20종 확충 및 몬스터 애완동료 밸런싱', '메카 스킨 테마 카드 추가, 포만감/친밀도 유대 보상 시스템 고도화', 'Medium', '계획 예정 (Planned)', 'src/cardDatabase.ts', '2026-08-15'],
    ['DEV-006', 'Social & Web3', 'P2P 카드 거래소 에스크로 및 친구 초대 리퍼럴 보상 큐', '거래소 판매/구매 취소 로그 연동, 리퍼럴 튜토리얼 자동 검증', 'Medium', '진행 중 (In Progress)', 'src/lib/referral.ts', '2026-08-20'],
    ['DEV-007', 'Cloud & Auth', 'Firebase Auth 및 Firestore 클라우드 영속성 연동', '유저 프로필, 덱 상태, 매치 히스토리의 클라우드 실시간 동기화', 'High', '완료 (Completed)', 'src/lib/firebase.ts', '2026-08-05'],
  ];

  const summaryValues = [
    ['지표 (Metric)', '값 (Value)'],
    ['전체 목표 수 (Total Goals)', '7'],
    ['완료 목표 수 (Completed Goals)', '5'],
    ['진행 중 목표 수 (In Progress)', '1'],
    ['계획 예정 목표 수 (Planned)', '1'],
    ['진행률 (Overall Progress)', '71.4%'],
    ['생성 일시 (Created At)', new Date().toLocaleString('ko-KR')],
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'개발 목표 리스트'!A1",
            values: roadmapValues,
          },
          {
            range: "'시즌 개발 로드맵 Summary'!A1",
            values: summaryValues,
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to write values to roadmap spreadsheet: ${errText}`);
  }

  return { spreadsheetId, spreadsheetUrl };
}

export async function createGameDataSpreadsheet(
  accessToken: string,
  payload: GoogleSheetsExportPayload
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const title = `[SNSHero] Game Data Export - ${new Date().toLocaleDateString('ko-KR')}`;

  // 1. Create Spreadsheet with 3 sheets
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        { properties: { title: 'My Deck & Cards' } },
        { properties: { title: 'Battle History' } },
        { properties: { title: 'Season Overview' } },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create spreadsheet: ${errText}`);
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Populate values
  const deckValues = [
    ['Card ID', 'Name', 'Rarity', 'Attack', 'Defense', 'HP', 'Speed'],
    ...payload.deck.map((c) => [c.id, c.name, c.rarity, c.attack, c.defense, c.hp, c.speed]),
  ];

  const battleValues = [
    ['Log ID', 'Date & Time', 'Game Mode', 'Opponent', 'Result', 'Score'],
    ...payload.battleLogs.map((b) => [b.id, b.date, b.mode, b.opponent, b.result, b.score]),
  ];

  const seasonValues = [
    ['Metric', 'Value'],
    ['Season', payload.seasonStats.season],
    ['Rank Tier', payload.seasonStats.rank],
    ['Season Points', payload.seasonStats.points],
    ['Total Wins', payload.seasonStats.wins],
    ['Total Losses', payload.seasonStats.losses],
    ['Win Rate', payload.seasonStats.wins + payload.seasonStats.losses > 0
      ? `${((payload.seasonStats.wins / (payload.seasonStats.wins + payload.seasonStats.losses)) * 100).toFixed(1)}%`
      : '0%'],
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: "'My Deck & Cards'!A1",
            values: deckValues,
          },
          {
            range: "'Battle History'!A1",
            values: battleValues,
          },
          {
            range: "'Season Overview'!A1",
            values: seasonValues,
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to write values to spreadsheet: ${errText}`);
  }

  return { spreadsheetId, spreadsheetUrl };
}

export async function readSpreadsheetSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string = 'A1:Z100'
): Promise<string[][]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to read spreadsheet: ${errText}`);
  }

  const data = await res.json();
  return data.values || [];
}
