/**
 * localNotifications.ts
 * Safe Web Notification API Wrapper for SNSHero Tactical Retention Protocols
 */

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationStatus;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('hero_notification_permission_granted', 'true');
    }
    return permission as NotificationStatus;
  } catch {
    return 'denied';
  }
}

export function showTacticalNotification(title: string, body: string, icon = '/favicon.ico'): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: 'snshero-tactical-streak',
      silent: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch {
    return false;
  }
}

export function scheduleLocalDailyReminder(): void {
  try {
    localStorage.setItem('hero_notification_daily_reminder_enabled', 'true');
    localStorage.setItem('hero_notification_last_scheduled', Date.now().toString());
  } catch {
    // safe storage failover
  }
}
