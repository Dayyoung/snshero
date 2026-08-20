import { SecretStamp } from '../types';

const SECRET_STAMPS_KEY = 'hero_secret_stamps_v1';

export const INITIAL_SECRET_STAMPS: SecretStamp[] = [
  {
    id: 'PERIMETER_SWEEP',
    titleKo: '외곽선 포위 섬멸',
    titleEn: 'Perimeter Sweep',
    descKo: '외곽 8칸을 모두 아군 카드로 점령하여 완승하기',
    descEn: 'Win a match by controlling all 8 perimeter tiles with your cards.',
    icon: '🛡️',
    rewardType: 'gems',
    rewardAmount: 30,
    isUnlocked: false,
  },
  {
    id: 'CLUTCH_ONE_HP',
    titleKo: '1점 차이 기적의 역전',
    titleEn: 'Clutch 1-Point Victory',
    descKo: '마지막 9번째 수에서 1점 차이(5:4)로 극적 승리 거두기',
    descEn: 'Achieve a thrilling 5:4 comeback victory on the final move.',
    icon: '⚡',
    rewardType: 'gems',
    rewardAmount: 25,
    isUnlocked: false,
  },
  {
    id: 'ZERO_SKILL_SWEEP',
    titleKo: '순수 무투파의 정점',
    titleEn: 'Pure Stat Master',
    descKo: '특수 스킬 미보유 영웅들만으로 승리 달성하기',
    descEn: 'Win a battle without triggering any special card abilities.',
    icon: '🥊',
    rewardType: 'sns',
    rewardAmount: 150,
    isUnlocked: false,
  },
  {
    id: 'ELEMENT_PURIST',
    titleKo: '단일 원소의 순혈',
    titleEn: 'Mono-Element Purist',
    descKo: '덱 5장을 모두 동일 속성 카드로 편성하여 승리하기',
    descEn: 'Win using a deck composed entirely of a single element.',
    icon: '🔥',
    rewardType: 'gems',
    rewardAmount: 30,
    isUnlocked: false,
  },
  {
    id: 'TRIPLE_COMBO_MASTER',
    titleKo: '트리플 콤보 마스터',
    titleEn: 'Triple Flip Master',
    descKo: '한 번의 배치로 적 카드 3장 이상을 동시 뒤집기',
    descEn: 'Flip 3 or more enemy cards simultaneously in a single placement.',
    icon: '💥',
    rewardType: 'gems',
    rewardAmount: 40,
    rewardTitle: '연쇄의 마술사',
    isUnlocked: false,
  },
  {
    id: 'SPEED_DEMON',
    titleKo: '전광석화의 지휘관',
    titleEn: 'Lightning Speed Demon',
    descKo: '전투 시작 후 25초 이내에 승리 확정 짓기',
    descEn: 'Conclude and win a match within 25 seconds.',
    icon: '⏱️',
    rewardType: 'sns',
    rewardAmount: 200,
    rewardTitle: '전광석화의 지휘관',
    isUnlocked: false,
  },
  {
    id: 'DOMINO_MASTERY',
    titleKo: '도미노 연쇄 폭쇄',
    titleEn: 'Domino Chain Blast',
    descKo: '도미노 연쇄 파동으로 2차 충격파 뒤집기 성공하기',
    descEn: 'Successfully trigger a secondary shockwave flip via Domino cascade.',
    icon: '🌊',
    rewardType: 'gems',
    rewardAmount: 35,
    isUnlocked: false,
  },
  {
    id: 'DOUBLE_WEAKNESS_BREAKER',
    titleKo: '더블 브레이커',
    titleEn: 'Double Weakness Breaker',
    descKo: '보스전에서 1턴에 2개 이상의 약점을 동시 파쇄하기',
    descEn: 'Break 2 or more boss weak-points in a single turn.',
    icon: '💎',
    rewardType: 'gems',
    rewardAmount: 50,
    isUnlocked: false,
  },
];

export const getSecretStamps = (): SecretStamp[] => {
  try {
    const raw = localStorage.getItem(SECRET_STAMPS_KEY);
    if (raw) {
      const saved: Record<string, { isUnlocked: boolean; unlockedAt?: number }> = JSON.parse(raw);
      return INITIAL_SECRET_STAMPS.map(stamp => ({
        ...stamp,
        isUnlocked: saved[stamp.id]?.isUnlocked || false,
        unlockedAt: saved[stamp.id]?.unlockedAt,
      }));
    }
  } catch (e) {
    console.error('Failed to load secret stamps:', e);
  }
  return INITIAL_SECRET_STAMPS;
};

export const unlockSecretStamp = (stampId: string): SecretStamp | null => {
  const stamps = getSecretStamps();
  const target = stamps.find(s => s.id === stampId);
  if (!target || target.isUnlocked) return null;

  target.isUnlocked = true;
  target.unlockedAt = Date.now();

  try {
    const saveObj: Record<string, { isUnlocked: boolean; unlockedAt?: number }> = {};
    stamps.forEach(s => {
      saveObj[s.id] = { isUnlocked: s.isUnlocked, unlockedAt: s.unlockedAt };
    });
    localStorage.setItem(SECRET_STAMPS_KEY, JSON.stringify(saveObj));
  } catch (e) {
    console.error('Failed to save secret stamps:', e);
  }

  return target;
};
