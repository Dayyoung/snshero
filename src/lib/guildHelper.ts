import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from './firebaseMock';
import { Guild, GuildMember } from '../types';
import { getUserCollectionName } from './utils';

const DEBUG = false;

const LOCAL_STORAGE_KEY = 'snshero_guilds';

// 더미 데이터 초기화용 (최소 하나 이상의 운영 중인 길드가 가입리스트에 보이도록 기본 길드 제공)
const DEFAULT_GUILDS: Guild[] = [
  {
    id: 'guild_alpha',
    name: 'Alpha Hunters',
    mark: '🔥',
    language: 'ko',
    level: 3,
    exp: 3500,
    leaderId: 'bot_alpha_leader',
    leaderName: 'AlphaLeader',
    members: [
      { uid: 'bot_alpha_leader', displayName: 'AlphaLeader', joinedAt: Date.now() - 86400000 * 10, role: 'leader' },
      { uid: 'bot_alpha_member1', displayName: 'HunterKim', joinedAt: Date.now() - 86400000 * 5, role: 'member' },
      { uid: 'bot_alpha_member2', displayName: 'HunterLee', joinedAt: Date.now() - 86400000 * 2, role: 'member' }
    ]
  },
  {
    id: 'guild_global',
    name: 'Global Warriors',
    mark: '🌍',
    language: 'en',
    level: 1,
    exp: 400,
    leaderId: 'bot_global_leader',
    leaderName: 'Smith',
    members: [
      { uid: 'bot_global_leader', displayName: 'Smith', joinedAt: Date.now() - 86400000 * 4, role: 'leader' },
      { uid: 'bot_global_member1', displayName: 'John', joinedAt: Date.now() - 86400000 * 1, role: 'member' }
    ]
  }
];

// Firestore에서 실제 사용자(가상 유저 포함)를 조회합니다.
async function getRealUsersForGuilds(season: string): Promise<{ uid: string; displayName: string }[]> {
  try {
    const colName = getUserCollectionName(season);
    const querySnapshot = await getDocs(collection(db, colName));
    const users: { uid: string; displayName: string }[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (docSnap.id !== 'guest-id') {
        users.push({
          uid: docSnap.id,
          displayName: data.displayName || data.email || 'Hunter'
        });
      }
    });
    return users;
  } catch (e) {
    console.warn('[GuildHelper] Failed to fetch real users for guild mapping:', e);
  }
  return [];
}

// 길드의 봇 멤버들을 실제 가입된 사용자들로 변경합니다.
async function fillGuildsWithRealUsers(guilds: Guild[], season: string): Promise<Guild[]> {
  const realUsers = await getRealUsersForGuilds(season);
  if (realUsers.length === 0) {
    if (DEBUG) console.log('[GuildHelper] No real users found in Firestore to map. Keeping default bots.');
    return guilds;
  }

  if (DEBUG) console.log(`[GuildHelper] Mapping ${realUsers.length} real users into guilds...`);
  
  let userIdx = 0;
  return guilds.map(guild => {
    const hasBotMembers = guild.members.some(m => m.uid.startsWith('bot_')) || guild.leaderId.startsWith('bot_');
    if (!hasBotMembers) return guild;

    const updatedMembers = [...guild.members];
    
    // 리더 교체
    if (guild.leaderId.startsWith('bot_') && userIdx < realUsers.length) {
      const leaderUser = realUsers[userIdx++];
      guild.leaderId = leaderUser.uid;
      guild.leaderName = leaderUser.displayName;
      
      const leaderIndex = updatedMembers.findIndex(m => m.role === 'leader');
      if (leaderIndex !== -1) {
        updatedMembers[leaderIndex] = {
          uid: leaderUser.uid,
          displayName: leaderUser.displayName,
          joinedAt: updatedMembers[leaderIndex].joinedAt,
          role: 'leader'
        };
      }
    }

    // 멤버 교체
    for (let i = 0; i < updatedMembers.length; i++) {
      if (updatedMembers[i].uid.startsWith('bot_') && updatedMembers[i].role !== 'leader') {
        if (userIdx < realUsers.length) {
          const memberUser = realUsers[userIdx++];
          updatedMembers[i] = {
            uid: memberUser.uid,
            displayName: memberUser.displayName,
            joinedAt: updatedMembers[i].joinedAt,
            role: 'member'
          };
        } else {
          // 유저가 부족할 경우 봇 멤버는 제거
          updatedMembers[i] = null as any;
        }
      }
    }

    guild.members = updatedMembers.filter(m => m !== null);
    return guild;
  });
}

// LocalStorage Helper
function getLocalGuilds(): Guild[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_GUILDS));
    return DEFAULT_GUILDS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_GUILDS;
  }
}

function saveLocalGuilds(guilds: Guild[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(guilds));
  }
}

// 누적 exp에 다른 길드 등급(1~10) 필요 경험치
// 1->2: 1,000
// 2->3: 3,000 (누적 4,000)
// 3->4: 7,000 (누적 11,000)
// 4->5: 15,000 (누적 26,000)
// 5->6: 31,000 (누적 57,000)
// 6->7: 63,000 (누적 120,000)
// 7->8: 127,000 (누적 247,000)
// 8->9: 255,000 (누적 502,000)
// 9->10: 511,000 (누적 1,013,000)
export const getRequiredExpForNextLevel = (currentLevel: number): number => {
  if (currentLevel >= 10) return Infinity;
  // 각 레벨업에 필요한 추가 exp
  const expNeeded = [0, 1000, 3000, 7000, 15000, 31000, 63000, 127000, 255000, 511000];
  return expNeeded[currentLevel] || 1000;
};

export interface GuildBuff {
  powerPercent: number; // TP + X%
  statBonus: number; // 모든 카드 스탯 + Y
}

// 길드 등급별 대전시 유용한 전투 효과 정의
export const getGuildBuff = (level: number): GuildBuff => {
  const buffs: Record<number, GuildBuff> = {
    1: { powerPercent: 1, statBonus: 1 },
    2: { powerPercent: 3, statBonus: 2 },
    3: { powerPercent: 6, statBonus: 3 },
    4: { powerPercent: 10, statBonus: 4 },
    5: { powerPercent: 15, statBonus: 5 },
    6: { powerPercent: 21, statBonus: 6 },
    7: { powerPercent: 28, statBonus: 7 },
    8: { powerPercent: 36, statBonus: 8 },
    9: { powerPercent: 45, statBonus: 9 },
    10: { powerPercent: 55, statBonus: 10 },
  };
  return buffs[level] || { powerPercent: 0, statBonus: 0 };
};

// Firestore & LocalStorage Hybrid CRUD
export async function getGuilds(): Promise<Guild[]> {
  const currentSeason = (typeof window !== 'undefined' ? localStorage.getItem('hero_current_season') : null) || 'season1';
  try {
    const querySnapshot = await getDocs(collection(db, 'guilds'));
    let guilds: Guild[] = [];
    querySnapshot.forEach((docSnap) => {
      guilds.push({ id: docSnap.id, ...docSnap.data() } as Guild);
    });
    
    if (guilds.length > 0) {
      let hasBot = false;
      for (const g of guilds) {
        if (g.leaderId.startsWith('bot_') || g.members.some(m => m.uid.startsWith('bot_'))) {
          hasBot = true;
          break;
        }
      }

      if (hasBot) {
        if (DEBUG) console.log('[GuildHelper] Bot users detected in Firestore guilds. Upgrading to real users...');
        guilds = await fillGuildsWithRealUsers(guilds, currentSeason);
        for (const guild of guilds) {
          await setDoc(doc(db, 'guilds', guild.id), guild);
        }
      }

      saveLocalGuilds(guilds);
      return guilds;
    } else {
      if (DEBUG) console.log('[Firestore] Guilds empty. Initializing DEFAULT_GUILDS with real users...');
      let newGuilds = JSON.parse(JSON.stringify(DEFAULT_GUILDS)) as Guild[];
      newGuilds = await fillGuildsWithRealUsers(newGuilds, currentSeason);

      for (const defaultGuild of newGuilds) {
        const docRef = doc(db, 'guilds', defaultGuild.id);
        await setDoc(docRef, defaultGuild);
      }
      saveLocalGuilds(newGuilds);
      return newGuilds;
    }
  } catch (error) {
    console.warn('[Firestore] Failed to fetch guilds, falling back to LocalStorage:', error);
  }
  return getLocalGuilds();
}

export async function getGuild(guildId: string): Promise<Guild | null> {
  try {
    const docRef = doc(db, 'guilds', guildId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Guild;
    }
  } catch (error) {
    console.warn(`[Firestore] Failed to fetch guild ${guildId}, falling back to LocalStorage:`, error);
  }
  const locals = getLocalGuilds();
  return locals.find((g) => g.id === guildId) || null;
}

export async function createGuild(
  name: string,
  mark: string,
  language: string,
  leaderId: string,
  leaderName: string
): Promise<Guild> {
  const newGuild: Guild = {
    id: `guild_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    mark,
    language,
    level: 1,
    exp: 0,
    leaderId,
    leaderName,
    members: [
      {
        uid: leaderId,
        displayName: leaderName,
        joinedAt: Date.now(),
        role: 'leader'
      }
    ]
  };

  // 1. LocalStorage 저장
  const locals = getLocalGuilds();
  locals.push(newGuild);
  saveLocalGuilds(locals);

  // 2. Firestore 저장 (비동기 시도)
  try {
    const docRef = doc(db, 'guilds', newGuild.id);
    await setDoc(docRef, newGuild);
  } catch (error) {
    console.warn('[Firestore] Failed to create guild in cloud, saved locally:', error);
  }

  return newGuild;
}

export async function joinGuild(
  guildId: string,
  userId: string,
  userName: string
): Promise<Guild> {
  const guilds = await getGuilds();
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild) {
    throw new Error('Guild not found');
  }

  // 중복 가입 체크
  const alreadyJoined = guilds.some((g) => g.members.some((m) => m.uid === userId));
  if (alreadyJoined) {
    throw new Error('Already joined another guild');
  }

  if (guild.members.length >= 100) {
    throw new Error('Guild limit reached (Max 100 members)');
  }

  const newMember: GuildMember = {
    uid: userId,
    displayName: userName,
    joinedAt: Date.now(),
    role: 'member'
  };

  guild.members.push(newMember);

  // Local Storage 업데이트
  saveLocalGuilds(guilds);

  // Firestore 업데이트
  try {
    const docRef = doc(db, 'guilds', guildId);
    await updateDoc(docRef, { members: guild.members });
  } catch (error) {
    console.warn('[Firestore] Failed to update guild members in cloud, saved locally:', error);
  }

  return guild;
}

export async function leaveGuild(guildId: string, userId: string): Promise<void> {
  const guilds = await getGuilds();
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild) return;

  guild.members = guild.members.filter((m) => m.uid !== userId);

  // Local Storage 업데이트
  saveLocalGuilds(guilds);

  // Firestore 업데이트
  try {
    const docRef = doc(db, 'guilds', guildId);
    await updateDoc(docRef, { members: guild.members });
  } catch (error) {
    console.warn('[Firestore] Failed to leave guild in cloud, saved locally:', error);
  }
}

export async function donateToGuild(
  guildId: string,
  userId: string,
  amount: number
): Promise<{ guild: Guild; leveledUp: boolean }> {
  const guilds = await getGuilds();
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild) {
    throw new Error('Guild not found');
  }

  guild.exp += amount;
  
  let leveledUp = false;
  let nextNeeded = getRequiredExpForNextLevel(guild.level);

  while (guild.exp >= nextNeeded && guild.level < 10) {
    guild.exp -= nextNeeded;
    guild.level += 1;
    leveledUp = true;
    nextNeeded = getRequiredExpForNextLevel(guild.level);
  }

  // Local Storage 업데이트
  saveLocalGuilds(guilds);

  // Firestore 업데이트
  try {
    const docRef = doc(db, 'guilds', guildId);
    await updateDoc(docRef, {
      exp: guild.exp,
      level: guild.level
    });
  } catch (error) {
    console.warn('[Firestore] Failed to donate in cloud, saved locally:', error);
  }

  return { guild, leveledUp };
}

export async function getUserGuild(userId: string): Promise<Guild | null> {
  const guilds = await getGuilds();
  return guilds.find((g) => g.members.some((m) => m.uid === userId)) || null;
}

// 길드 공격 결과 시뮬레이션
export interface AttackResult {
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  attackerPower: number;
  defenderPower: number;
  attackerBuff: GuildBuff;
  defenderBuff: GuildBuff;
  log: string[];
}

export function simulateGuildAttack(
  attacker: Guild,
  defender: Guild
): AttackResult {
  const log: string[] = [];
  
  // 두 길드의 기본 전투력 산출
  // 길드 멤버 수 + (길드 레벨 * 10)을 기본 시드 파워로 하고 랜덤값 부여
  const attackerBase = 1000 + attacker.members.length * 50 + attacker.level * 200;
  const defenderBase = 1000 + defender.members.length * 50 + defender.level * 200;
  
  // 길드 등급 버프
  const aBuff = getGuildBuff(attacker.level);
  const dBuff = getGuildBuff(defender.level);

  // 버프 적용
  const attackerPower = Math.round(attackerBase * (1 + aBuff.powerPercent / 100) + aBuff.statBonus * 10);
  const defenderPower = Math.round(defenderBase * (1 + dBuff.powerPercent / 100) + dBuff.statBonus * 10);

  log.push(`[전투 시작] 공격 측: ${attacker.name} (등급 ${attacker.level}) vs 방어 측: ${defender.name} (등급 ${defender.level})`);
  log.push(`[공격 버프] Total Power +${aBuff.powerPercent}%, 모든 카드 스탯 +${aBuff.statBonus}`);
  log.push(`[방어 버프] Total Power +${dBuff.powerPercent}%, 모든 카드 스탯 +${dBuff.statBonus}`);
  log.push(`[전투력 측정] ${attacker.name}: ${attackerPower} TP | ${defender.name}: ${defenderPower} TP`);

  // 전투 진행
  const aRoll = attackerPower * (0.85 + Math.random() * 0.3); // 85% ~ 115% 변동성
  const dRoll = defenderPower * (0.85 + Math.random() * 0.3);

  log.push(`[전투 주사위] ${attacker.name} 기세: ${Math.round(aRoll)} | ${defender.name} 방벽: ${Math.round(dRoll)}`);

  const winner = aRoll >= dRoll ? attacker : defender;
  const loser = aRoll >= dRoll ? defender : attacker;

  log.push(`[전투 종료] 승리: ${winner.name}! (피해를 극복하고 진형을 붕괴시켰습니다)`);

  return {
    winnerId: winner.id,
    winnerName: winner.name,
    loserId: loser.id,
    loserName: loser.name,
    attackerPower,
    defenderPower,
    attackerBuff: aBuff,
    defenderBuff: dBuff,
    log
  };
}
