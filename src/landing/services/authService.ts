/**
 * src/landing/services/authService.ts
 *
 * Real Google Authentication & Guest Authentication Service for Landing.
 * Integrates with src/lib/googleAuthService (Firebase Auth).
 */

import { signInWithGoogleAccount, signOutGoogleAccount } from '../../lib/googleAuthService';

export interface LandingUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  isAnonymous: boolean;
  providerId: 'google.com' | 'guest';
}

const STORAGE_KEY_PROFILE = 'hero_user_profile';
const STORAGE_KEY_NAME = 'hero_user_name';
const STORAGE_KEY_AVATAR = 'hero_user_avatar';

export function getCurrentUser(): LandingUser {
  if (typeof localStorage === 'undefined') {
    return {
      uid: 'guest_offline',
      displayName: '게스트 모험가',
      email: '',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      isAnonymous: true,
      providerId: 'guest',
    };
  }

  const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.uid) {
        return {
          uid: parsed.uid,
          displayName: parsed.displayName || '모험가',
          email: parsed.email || '',
          photoURL: parsed.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${parsed.displayName || 'Hero'}`,
          isAnonymous: Boolean(parsed.isAnonymous),
          providerId: parsed.providerId || (parsed.isAnonymous ? 'guest' : 'google.com'),
        };
      }
    } catch {}
  }

  // Fallback: check hero_user_name
  const name = localStorage.getItem(STORAGE_KEY_NAME) || '게스트 모험가';
  const avatar = localStorage.getItem(STORAGE_KEY_AVATAR) || 'https://api.dicebear.com/7.x/bottts/svg?seed=guest';
  const guestUser: LandingUser = {
    uid: 'guest_' + Math.random().toString(36).substring(2, 9),
    displayName: name,
    email: '',
    photoURL: avatar,
    isAnonymous: true,
    providerId: 'guest',
  };

  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(guestUser));
  } catch {}

  return guestUser;
}

export async function loginWithGoogle(): Promise<{
  success: boolean;
  user?: LandingUser;
  error?: string;
  isCancelled?: boolean;
  isDomainUnauthorized?: boolean;
}> {
  try {
    const authResult = await signInWithGoogleAccount();
    if (authResult.success && authResult.user) {
      const realUser = authResult.user;
      const user: LandingUser = {
        uid: realUser.uid,
        displayName: realUser.displayName || 'Google Hero',
        email: realUser.email || '',
        photoURL: realUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${realUser.displayName || 'Hero'}`,
        isAnonymous: false,
        providerId: 'google.com',
      };

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEY_NAME, user.displayName);
        localStorage.setItem(STORAGE_KEY_AVATAR, user.photoURL);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('snshero_auth_changed'));
      }

      return { success: true, user };
    }

    if (authResult.isCancelled) {
      return { success: false, isCancelled: true };
    }

    if (authResult.isDomainUnauthorized) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      return {
        success: false,
        isDomainUnauthorized: true,
        error: `Firebase 승인 도메인 오류 (auth/unauthorized-domain): 현재 도메인(${currentHost})이 Firebase 콘솔에 등록되지 않은 임시/터널 도메인입니다.`,
      };
    }

    return {
      success: false,
      error: authResult.errorMessage || '구글 로그인에 실패하였습니다.',
    };
  } catch (e: any) {
    const isDomainError = e?.message?.includes('unauthorized-domain') || e?.code === 'auth/unauthorized-domain';
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    return {
      success: false,
      isDomainUnauthorized: isDomainError,
      error: isDomainError
        ? `Firebase 승인 도메인 오류 (auth/unauthorized-domain): 현재 도메인(${currentHost})이 Firebase 콘솔에 미등록되었습니다.`
        : e?.message || '로그인 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Log in with a simulated or local Google account for dev/tunnel domains (e.g. Tailscale *.ts.net)
 * where Firebase Authorized Domains is restricted.
 */
export function loginWithSimulatedGoogle(customName?: string, customEmail?: string): { success: boolean; user: LandingUser } {
  const name = customName?.trim() || 'Google Adventurer';
  const email = customEmail?.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
  const uid = 'google_local_' + Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)).toString(36) + '_' + Date.now().toString(36);
  
  const user: LandingUser = {
    uid,
    displayName: name,
    email,
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
    isAnonymous: false,
    providerId: 'google.com',
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_NAME, user.displayName);
    localStorage.setItem(STORAGE_KEY_AVATAR, user.photoURL);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_auth_changed'));
  }

  return { success: true, user };
}

export function loginAsGuest(customName?: string): { success: boolean; user: LandingUser } {
  const guestUid = 'guest_' + Date.now().toString(36);
  const name = customName?.trim() || '게스트 모험가';
  const user: LandingUser = {
    uid: guestUid,
    displayName: name,
    email: '',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestUid}`,
    isAnonymous: true,
    providerId: 'guest',
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_NAME, user.displayName);
    localStorage.setItem(STORAGE_KEY_AVATAR, user.photoURL);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_auth_changed'));
  }

  return { success: true, user };
}

export async function logoutUser(): Promise<void> {
  try {
    await signOutGoogleAccount();
  } catch {}

  // Switch to new guest user
  loginAsGuest('게스트 모험가');
}
