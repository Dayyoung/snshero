/**
 * `/game.html` 전용 전체화면(Fullscreen API) 및 독립형 PWA(Progressive Web App) 매니저
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};

type FullscreenEl = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let wakeLockSentinel: { release: () => Promise<void> } | null = null;
const listeners = new Set<() => void>();
let initialized = false;

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  });
}

async function acquireWakeLockIfPossible() {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & {
    wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
  };
  if (!nav.wakeLock || document.visibilityState !== 'visible') return;
  try {
    wakeLockSentinel = await nav.wakeLock.request('screen');
  } catch {
    // ignore wakeLock errors on unsupported browsers
  }
}

export function initGamePwaFullscreen(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyListeners();
  });

  document.addEventListener('fullscreenchange', notifyListeners);
  document.addEventListener('webkitfullscreenchange', notifyListeners);

  if (isStandalonePwa()) {
    acquireWakeLockIfPossible();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (isStandalonePwa() || isBrowserFullscreen())) {
      acquireWakeLockIfPossible();
    }
  });
}

export function subscribePwaFullscreen(listener: () => void): () => void {
  initGamePwaFullscreen();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    Boolean(nav.standalone)
  );
}

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDoc;
  const root = document.documentElement as FullscreenEl;
  return Boolean(
    (document.fullscreenEnabled || doc.webkitFullscreenEnabled) &&
      (typeof root.requestFullscreen === 'function' ||
        typeof root.webkitRequestFullscreen === 'function'),
  );
}

export function isBrowserFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDoc;
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export async function toggleBrowserFullscreen(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDoc;
  const root = document.documentElement as FullscreenEl;

  try {
    if (isBrowserFullscreen()) {
      if (typeof document.exitFullscreen === 'function') {
        await document.exitFullscreen();
      } else if (typeof doc.webkitExitFullscreen === 'function') {
        await doc.webkitExitFullscreen();
      }
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
      }
      notifyListeners();
      return false;
    }

    if (typeof root.requestFullscreen === 'function') {
      await root.requestFullscreen({ navigationUI: 'hide' });
    } else if (typeof root.webkitRequestFullscreen === 'function') {
      await root.webkitRequestFullscreen();
    }
    acquireWakeLockIfPossible();
    notifyListeners();
    return true;
  } catch {
    notifyListeners();
    return isBrowserFullscreen();
  }
}

export function canInstallGamePwa(): boolean {
  return Boolean(deferredInstallPrompt) && !isStandalonePwa();
}

export async function promptInstallGamePwa(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  const promptEvt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  notifyListeners();
  try {
    await promptEvt.prompt();
    const choice = await promptEvt.userChoice;
    notifyListeners();
    return choice.outcome === 'accepted';
  } catch {
    notifyListeners();
    return false;
  }
}
