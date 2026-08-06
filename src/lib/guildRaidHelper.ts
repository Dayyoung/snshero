/**
 * 길드 레이드 헬퍼
 * 로컬 fallback과 Firestore 확장 가능성을 분리한 설계
 */
import { 
  GuildRaidBoss, 
  GuildRaidState, 
  GuildRaidMemberContribution,
  RaidParticipationResult,
  RaidRewardClaimResult,
  GuildRaidReward,
  CardElement
} from '../types';

const DEBUG = false;
const LOCAL_STORAGE_PREFIX = 'hero_guild_raid_';
const RAID_ATTACK_COOLDOWN_MS = 10 * 60 * 1000; // 10분 쿨다운

// ─── 시즌 레이드 보스 정의 ──────────────────────────────────────────

/** 시즌별 레이드 보스 목록 */
export const SEASON_RAID_BOSSES: GuildRaidBoss[] = [
  {
    id: 'raid_boss_dark_lord_season1',
    nameKey: 'raid_boss_dark_lord_name',
    descriptionKey: 'raid_boss_dark_lord_desc',
    element: 'undead',
    maxHp: 1000000,
    imageIndex: 100,
    season: 'season1',
    activeFrom: 0, // 항상 활성
    activeUntil: 9999999999999,
    defeatReward: {
      sns: 50000,
      guildExp: 10000,
      cosmeticItemKeys: ['raid_badge_dark_lord_slayer']
    },
    contributionRewards: [
      { minDamage: 0, reward: { sns: 100, guildExp: 50, cosmeticItemKeys: [] }, tierNameKey: 'raid_tier_participant' },
      { minDamage: 5000, reward: { sns: 500, guildExp: 200, cosmeticItemKeys: ['raid_badge_bronze'] }, tierNameKey: 'raid_tier_bronze' },
      { minDamage: 20000, reward: { sns: 2000, guildExp: 500, cosmeticItemKeys: ['raid_badge_silver'] }, tierNameKey: 'raid_tier_silver' },
      { minDamage: 50000, reward: { sns: 5000, guildExp: 1500, cosmeticItemKeys: ['raid_badge_gold'] }, tierNameKey: 'raid_tier_gold' },
      { minDamage: 100000, reward: { sns: 10000, guildExp: 3000, cosmeticItemKeys: ['raid_badge_legendary'] }, tierNameKey: 'raid_tier_legendary' },
    ]
  }
];

/** 전체 보스를 시즌별로 조회 */
export function getRaidBossForSeason(season: string): GuildRaidBoss | null {
  return SEASON_RAID_BOSSES.find(b => b.season === season) || SEASON_RAID_BOSSES[0] || null;
}

// ─── 로컬 저장소 헬퍼 ───────────────────────────────────────────────

function getLocalRaidStateKey(guildId: string, season: string): string {
  return `${LOCAL_STORAGE_PREFIX}${guildId}_${season}`;
}

function loadLocalRaidState(guildId: string, season: string): GuildRaidState | null {
  if (typeof window === 'undefined') return null;
  const key = getLocalRaidStateKey(guildId, season);
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as GuildRaidState;
  } catch {
    return null;
  }
}

function saveLocalRaidState(state: GuildRaidState): void {
  if (typeof window === 'undefined') return;
  const key = getLocalRaidStateKey(state.guildId, state.season);
  localStorage.setItem(key, JSON.stringify(state));
}

// ─── Firestore 인터페이스 (확장용) ─────────────────────────────────

/**
 * Firestore 연동 인터페이스.
 * 현재는 로컬 전용이지만, 추후 Cloud Functions / 서버 검증 추가 시 
 * 이 인터페이스를 구현하여 교체한다.
 */
export interface GuildRaidPersistence {
  getRaidState(guildId: string, season: string): Promise<GuildRaidState | null>;
  saveRaidState(state: GuildRaidState): Promise<void>;
  /** 서버 검증 레이드 참여 (TODO: Cloud Functions 연동) */
  verifyParticipation(guildId: string, uid: string, damage: number): Promise<boolean>;
  /** 서버 검증 보상 수령 (TODO: Cloud Functions 연동) */
  verifyRewardClaim(guildId: string, uid: string): Promise<boolean>;
}

/** 로컬 전용 Persistence 구현체 */
class LocalGuildRaidPersistence implements GuildRaidPersistence {
  async getRaidState(guildId: string, season: string): Promise<GuildRaidState | null> {
    return loadLocalRaidState(guildId, season);
  }

  async saveRaidState(state: GuildRaidState): Promise<void> {
    saveLocalRaidState(state);
  }

  async verifyParticipation(_guildId: string, _uid: string, _damage: number): Promise<boolean> {
    // 로컬 모드: 항상 허용 (클라이언트 신뢰)
    // 서버 모드: Cloud Functions에서 데미지 검증 후 true/false 반환
    return true;
  }

  async verifyRewardClaim(_guildId: string, _uid: string): Promise<boolean> {
    // 로컬 모드: 항상 허용
    // 서버 모드: Cloud Functions에서 중복 수령 검증
    return true;
  }
}

let persistence: GuildRaidPersistence = new LocalGuildRaidPersistence();

/** Persistence 교체 (Firestore 통합 시) */
export function setGuildRaidPersistence(p: GuildRaidPersistence): void {
  persistence = p;
}

export function getGuildRaidPersistence(): GuildRaidPersistence {
  return persistence;
}

// ─── 공개 API ──────────────────────────────────────────────────────

/** 길드 레이드 상태 조회 (없으면 초기화) */
export async function getGuildRaidState(
  guildId: string, 
  season: string
): Promise<GuildRaidState> {
  let state = await persistence.getRaidState(guildId, season);
  
  if (!state) {
    const boss = getRaidBossForSeason(season);
    if (!boss) {
      throw new Error('No raid boss found for this season');
    }
    
    state = {
      guildId,
      bossId: boss.id,
      season,
      cumulativeDamage: 0,
      bossHp: boss.maxHp,
      bossMaxHp: boss.maxHp,
      isDefeated: false,
      defeatedAt: null,
      contributions: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await persistence.saveRaidState(state);
  }

  return state;
}

/** 레이드 참여 (데미지 입히기) */
export async function participateInRaid(
  guildId: string,
  season: string,
  uid: string,
  displayName: string,
  baseDamage: number,
  guildLevel: number
): Promise<RaidParticipationResult> {
  const state = await getGuildRaidState(guildId, season);
  const boss = getRaidBossForSeason(season);
  
  if (!boss) {
    throw new Error('No raid boss found');
  }

  if (state.isDefeated) {
    throw new Error('Raid boss already defeated');
  }

  // 쿨다운 체크
  const existingContribution = state.contributions.find(c => c.uid === uid);
  if (existingContribution) {
    const timeSinceLastAttack = Date.now() - existingContribution.lastAttackAt;
    if (timeSinceLastAttack < RAID_ATTACK_COOLDOWN_MS) {
      const remainingSec = Math.ceil((RAID_ATTACK_COOLDOWN_MS - timeSinceLastAttack) / 1000);
      throw new Error(`Attack on cooldown. Wait ${remainingSec}s.`);
    }
  }

  // 서버 검증 (local일 때는 항상 true)
  const verified = await persistence.verifyParticipation(guildId, uid, baseDamage);
  if (!verified) {
    throw new Error('Participation verification failed');
  }

  // 길드 레벨 보너스 (레벨당 5% 추가 데미지)
  const guildBonus = 1 + (guildLevel - 1) * 0.05;
  const damageVariation = 0.9 + Math.random() * 0.2; // 90% ~ 110%
  const damageDealt = Math.round(baseDamage * guildBonus * damageVariation);

  // HP 차감
  const newHp = Math.max(0, state.bossHp - damageDealt);
  const isDefeated = newHp <= 0;

  // 기여도 업데이트
  if (existingContribution) {
    existingContribution.damage += damageDealt;
    existingContribution.attackCount += 1;
    existingContribution.lastAttackAt = Date.now();
  } else {
    state.contributions.push({
      uid,
      displayName,
      damage: damageDealt,
      attackCount: 1,
      lastAttackAt: Date.now(),
      rewardsClaimed: false,
    });
  }

  state.cumulativeDamage += damageDealt;
  state.bossHp = newHp;
  state.isDefeated = isDefeated;
  if (isDefeated) {
    state.defeatedAt = Date.now();
  }
  state.updatedAt = Date.now();

  await persistence.saveRaidState(state);

  if (DEBUG) console.log('[GuildRaid] Damage dealt:', damageDealt, 'HP remaining:', newHp);

  return {
    damageDealt,
    cumulativeDamage: state.cumulativeDamage,
    bossHpRemaining: newHp,
    isDefeated,
    personalContribution: state.contributions.find(c => c.uid === uid)!,
  };
}

/** 개인 기여도 보상 수령 */
export async function claimRaidRewards(
  guildId: string,
  season: string,
  uid: string
): Promise<RaidRewardClaimResult> {
  const state = await getGuildRaidState(guildId, season);
  const boss = getRaidBossForSeason(season);
  
  if (!boss) {
    return { claimed: false, reward: null, tierNameKey: null, reason: 'No boss found' };
  }

  const contribution = state.contributions.find(c => c.uid === uid);
  if (!contribution) {
    return { claimed: false, reward: null, tierNameKey: null, reason: 'No contribution found' };
  }

  if (contribution.rewardsClaimed) {
    return { claimed: false, reward: null, tierNameKey: null, reason: 'Rewards already claimed' };
  }

  // 서버 검증
  const verified = await persistence.verifyRewardClaim(guildId, uid);
  if (!verified) {
    return { claimed: false, reward: null, tierNameKey: null, reason: 'Reward claim verification failed' };
  }

  // 기여도 티어 계산
  let tierReward: GuildRaidReward | null = null;
  let tierNameKey = '';
  const sortedTiers = [...boss.contributionRewards].sort((a, b) => b.minDamage - a.minDamage);
  for (const tier of sortedTiers) {
    if (contribution.damage >= tier.minDamage) {
      tierReward = tier.reward;
      tierNameKey = tier.tierNameKey;
      break;
    }
  }

  // 기본 보상 + 티어 보상 합산
  const totalReward: GuildRaidReward = {
    sns: (tierReward?.sns || 0),
    guildExp: (tierReward?.guildExp || 0),
    cosmeticItemKeys: [...(tierReward?.cosmeticItemKeys || [])],
  };

  // 보스 처치 보상 추가
  if (state.isDefeated) {
    totalReward.sns += boss.defeatReward.sns;
    totalReward.guildExp += boss.defeatReward.guildExp;
    totalReward.cosmeticItemKeys.push(...boss.defeatReward.cosmeticItemKeys);
  }

  // 수령 처리
  contribution.rewardsClaimed = true;
  state.updatedAt = Date.now();
  await persistence.saveRaidState(state);

  return {
    claimed: true,
    reward: totalReward,
    tierNameKey,
  };
}

/** 레이드 공격 쿨다운 남은 시간 (ms) */
export function getRaidCooldownRemaining(
  state: GuildRaidState,
  uid: string
): number {
  const contribution = state.contributions.find(c => c.uid === uid);
  if (!contribution) return 0;
  
  const elapsed = Date.now() - contribution.lastAttackAt;
  const remaining = RAID_ATTACK_COOLDOWN_MS - elapsed;
  return Math.max(0, remaining);
}

/** 기여도 랭킹 (데미지 내림차순) */
export function getRaidRanking(state: GuildRaidState): GuildRaidMemberContribution[] {
  return [...state.contributions].sort((a, b) => b.damage - a.damage);
}

/** 레이드 진행률 (0-100) */
export function getRaidProgress(state: GuildRaidState): number {
  if (state.bossMaxHp <= 0) return 0;
  const dealt = state.bossMaxHp - state.bossHp;
  return Math.min(100, Math.round((dealt / state.bossMaxHp) * 100));
}

/** 레이드 남은 시간 (ms) */
export function getRaidTimeRemaining(boss: GuildRaidBoss): number {
  return Math.max(0, boss.activeUntil - Date.now());
}

/** 레이드가 활성화되었는지 확인 */
export function isRaidActive(boss: GuildRaidBoss): boolean {
  const now = Date.now();
  return now >= boss.activeFrom && now <= boss.activeUntil;
}
