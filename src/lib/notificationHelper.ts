export interface SystemNotification {
  id: string;
  category: 'system' | 'reward' | 'social' | 'trade';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

const STORAGE_KEY = 'hero_system_notifications';

export const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    category: 'reward',
    title: '시즌 1 출석 보상 지급 완료',
    message: '오늘의 출석 보상으로 1,000 Gold 및 카드 뽑기권 1장이 지급되었습니다.',
    timestamp: Date.now() - 30 * 60 * 1000,
    read: false,
  },
  {
    id: 'notif-2',
    category: 'social',
    title: '새로운 친구 대전 요청',
    message: '아케인 히어로 님이 1:1 카드 대전을 신청하였습니다.',
    timestamp: Date.now() - 2 * 3600 * 1000,
    read: false,
  },
  {
    id: 'notif-3',
    category: 'trade',
    title: 'P2P 카드 거래 체결',
    message: '등록하신 [볼케이노 드래곤] 카드가 1,500 Gold에 판매 완료되었습니다.',
    timestamp: Date.now() - 5 * 3600 * 1000,
    read: true,
  },
];

export function getNotifications(): SystemNotification[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function addNotification(notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>): SystemNotification {
  const current = getNotifications();
  const newNotif: SystemNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    read: false,
  };
  const updated = [newNotif, ...current].slice(0, 50); // limit to max 50
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return newNotif;
}

export function markAsRead(id: string): SystemNotification[] {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function markAllAsRead(): SystemNotification[] {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function clearAllNotifications(): SystemNotification[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
  return [];
}

export function getUnreadCount(): number {
  const current = getNotifications();
  return current.filter((n) => !n.read).length;
}
