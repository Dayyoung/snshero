export interface InAppNotification {
  id?: string;
  category: string;
  title: string;
  message: string;
  timestamp?: number;
  read?: boolean;
}

const STORAGE_KEY = 'hero_inapp_notifications';

export function addNotification(notification: InAppNotification): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: InAppNotification[] = raw ? JSON.parse(raw) : [];
    const item: InAppNotification = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp || Date.now(),
      read: false,
    };
    list.unshift(item);
    if (list.length > 50) {
      list.length = 50;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero_notification_added', { detail: item }));
    }
  } catch {
    // Ignore localStorage access issues
  }
}

export function getNotifications(): InAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default {
  addNotification,
  getNotifications,
};
