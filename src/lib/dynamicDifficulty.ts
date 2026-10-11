/**
 * dynamicDifficulty.ts
 * 전적 기반 동적 난이도 조정 (Dynamic Difficulty Adjustment, DDA) 엔진
 * 
 * 1. 최근 매치 히스토리(hero_match_history), 연승/연패, 승률 분석
 * 2. 전적에 따른 4단계 맞춤형 난이도 프로필 (mercy, easy, fair, challenging) 계산
 * 3. 랭킹대전 상대 매칭 전투력 및 AI 행동 지능(휴먼 에러율) 동적 보정
 */

export type DifficultyTier = 'mercy' | 'easy' | 'fair' | 'challenging';

export interface DynamicDifficultyProfile {
  tier: DifficultyTier;
  powerMultiplierMin: number;
  powerMultiplierMax: number;
  aiMistakeChance: number; // 최선의 수가 아닌 차선의 수를 둘 확률 (0 ~ 0.45)
  maxCardLevel: number;
  consecutiveLosses: number;
  consecutiveWins: number;
  recentWinRate: number; // 0 ~ 100
  totalMatches: number;
  labelKo: string;
  labelEn: string;
  badgeColor: string;
  descriptionKo: string;
  descriptionEn: string;
}

/**
 * 로컬스토리지에서 최근 전적 및 연승/연패를 분석하여 난이도 프로필 계산
 */
export function getDynamicDifficultyProfile(playerTotalPower: number = 1500): DynamicDifficultyProfile {
  if (typeof window === 'undefined') {
    return getDefaultProfile('fair', playerTotalPower);
  }

  let consecutiveLosses = 0;
  let consecutiveWins = 0;
  let recentWins = 0;
  let recentLosses = 0;
  let totalMatches = 0;

  try {
    const rawHistory = localStorage.getItem('hero_match_history');
    if (rawHistory) {
      const history: Array<{
        winner?: string;
        result?: 'win' | 'loss' | 'draw';
        isWin?: boolean;
        player1Id?: string;
      }> = JSON.parse(rawHistory);

      if (Array.isArray(history) && history.length > 0) {
        totalMatches = history.length;
        const currentUid = localStorage.getItem('hero_user_uid') || 'guest-id';

        // 1. 최근 연속 승패 계산
        let isStreakActive = true;
        let streakType: 'win' | 'loss' | null = null;

        for (let i = 0; i < history.length; i++) {
          const m = history[i];
          const isWin = m.result === 'win' || m.isWin === true || (m.winner && (m.winner === currentUid || m.winner === 'guest-id' || m.winner === '나'));
          const isLoss = m.result === 'loss' || (m.winner && m.winner !== currentUid && m.winner !== 'guest-id' && m.winner !== 'draw' && m.winner !== '무승부');

          // 최근 10경기 승률 집계
          if (i < 10) {
            if (isWin) recentWins++;
            else if (isLoss) recentLosses++;
          }

          // 연속 승패 추적
          if (isStreakActive) {
            if (streakType === null) {
              if (isWin) {
                streakType = 'win';
                consecutiveWins = 1;
              } else if (isLoss) {
                streakType = 'loss';
                consecutiveLosses = 1;
              }
            } else if (streakType === 'win') {
              if (isWin) consecutiveWins++;
              else isStreakActive = false;
            } else if (streakType === 'loss') {
              if (isLoss) consecutiveLosses++;
              else isStreakActive = false;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[DDA] Failed to read match history for DDA:', e);
  }

  // 로컬 연승 키 보조 확인
  if (consecutiveWins === 0) {
    const savedWinStreak = parseInt(localStorage.getItem('hero_win_streak') || '0', 10);
    if (savedWinStreak > 0) consecutiveWins = savedWinStreak;
  }

  const sampleCount = recentWins + recentLosses;
  const recentWinRate = sampleCount > 0 ? Math.round((recentWins / sampleCount) * 100) : 50;

  // ─── 4단계 전적 기반 난이도 판별 ───
  // 1단계: 초특급 구제 (Mercy) - 3연패 이상 또는 최근 승률 < 30%
  if (consecutiveLosses >= 3 || (sampleCount >= 4 && recentWinRate < 30)) {
    return {
      tier: 'mercy',
      powerMultiplierMin: 0.65,
      powerMultiplierMax: 0.78,
      aiMistakeChance: 0.40, // 40% 확률로 실수 유발
      maxCardLevel: 1,
      consecutiveLosses,
      consecutiveWins: 0,
      recentWinRate,
      totalMatches,
      labelKo: '🛡️ 난이도 대폭 하향 (연패 구제)',
      labelEn: '🛡️ Difficulty Lowered (Mercy Mode)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      descriptionKo: '연패가 지속되어 상대 전투력과 카드 난이도를 대폭 완화했습니다.',
      descriptionEn: 'Opponent stats scaled down significantly due to consecutive defeats.',
    };
  }

  // 2단계: 안정 보정 (Easy) - 1~2연패 또는 최근 승률 30% ~ 45%
  if (consecutiveLosses >= 1 || (sampleCount >= 4 && recentWinRate < 45)) {
    return {
      tier: 'easy',
      powerMultiplierMin: 0.78,
      powerMultiplierMax: 0.88,
      aiMistakeChance: 0.25, // 25% 확률로 차선의 수
      maxCardLevel: 2,
      consecutiveLosses,
      consecutiveWins: 0,
      recentWinRate,
      totalMatches,
      labelKo: '🛡️ 맞춤 난이도 완화 (안정 매칭)',
      labelEn: '🛡️ Balanced Easy (Adjusted)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      descriptionKo: '전적에 맞추어 적절히 승리할 수 있도록 상대 난이도를 완화했습니다.',
      descriptionEn: 'Opponent tuned to provide a comfortable battle experience.',
    };
  }

  // 3단계: 도전 진검승부 (Challenging) - 3연승 이상 또는 최근 승률 >= 65%
  if (consecutiveWins >= 3 || (sampleCount >= 4 && recentWinRate >= 65)) {
    return {
      tier: 'challenging',
      powerMultiplierMin: 1.05,
      powerMultiplierMax: 1.18,
      aiMistakeChance: 0.0, // 완벽한 수
      maxCardLevel: 5,
      consecutiveLosses: 0,
      consecutiveWins,
      recentWinRate,
      totalMatches,
      labelKo: '🔥 강적 진검승부 (연승 도전)',
      labelEn: '🔥 Elite Challenger (Win Streak)',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      descriptionKo: '뛰어난 실력과 연승에 걸맞은 강력한 라이벌이 매칭됩니다.',
      descriptionEn: 'Matched with elite rivals commensurate with your winning streak.',
    };
  }

  // 4단계: 표준 대등 매칭 (Fair) - 기본 균형
  return getDefaultProfile('fair', playerTotalPower, consecutiveWins, recentWinRate, totalMatches);
}

function getDefaultProfile(
  tier: DifficultyTier,
  _playerTotalPower: number,
  consecutiveWins: number = 0,
  recentWinRate: number = 50,
  totalMatches: number = 0
): DynamicDifficultyProfile {
  return {
    tier: 'fair',
    powerMultiplierMin: 0.88,
    powerMultiplierMax: 1.02,
    aiMistakeChance: 0.10, // 10% 가벼운 인간적 실수
    maxCardLevel: 3,
    consecutiveLosses: 0,
    consecutiveWins,
    recentWinRate,
    totalMatches,
    labelKo: '⚔️ 대등 라이벌 (표준 밸런스)',
    labelEn: '⚔️ Even Match (Standard)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    descriptionKo: '내 전적 및 전투력과 가장 유사한 균형잡힌 라이벌이 매칭됩니다.',
    descriptionEn: 'Matched with a balanced opponent closely matching your power.',
  };
}
