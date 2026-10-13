import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';

/**
 * SNS히어로 실제 구글 인증 설정 (Firebase Auth 기반)
 * Firebase 프로젝트: gen-lang-client-0764739742
 */
export const REAL_FIREBASE_CONFIG = {
  projectId: "gen-lang-client-0764739742",
  appId: "1:482294451953:web:e262c4f6e04c1b01f5e350",
  apiKey: "AIzaSyBxWPNTFwLCtmlZPQ-qr7l5o384HN_DcJg",
  authDomain: "gen-lang-client-0764739742.firebaseapp.com",
  storageBucket: "gen-lang-client-0764739742.firebasestorage.app",
  messagingSenderId: "482294451953",
  measurementId: "",
  oAuthClientId: "482294451953-n6dd1gigato1fr52rl8grjj05pvu831h.apps.googleusercontent.com",
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedProvider: GoogleAuthProvider | null = null;

export function getRealFirebaseAuth(): { app: FirebaseApp; auth: Auth; provider: GoogleAuthProvider } {
  if (!cachedApp || !cachedAuth || !cachedProvider) {
    const existing = getApps().find(a => a.name === 'googleAuthApp');
    cachedApp = existing || initializeApp(REAL_FIREBASE_CONFIG, 'googleAuthApp');
    cachedAuth = getAuth(cachedApp);
    cachedProvider = new GoogleAuthProvider();
    // 항상 구글 계정 선택 팝업(Choose an account)이 뜨도록 설정하여 현재 로그인된 여러 구글 계정 중 원하는 계정을 선택할 수 있게 함
    cachedProvider.setCustomParameters({
      prompt: 'select_account',
    });
  }
  return { app: cachedApp, auth: cachedAuth, provider: cachedProvider };
}

export interface GoogleAuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  providerId: string;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: GoogleAuthUser;
  errorCode?: string;
  errorMessage?: string;
  isDomainUnauthorized?: boolean;
  isPopupBlocked?: boolean;
  isCancelled?: boolean;
}

/**
 * 실제 구글 계정 로그인 팝업 실행
 * 사용자가 현재 브라우저에 로그인해 둔 실제 구글 아이디를 선택하여 로그인합니다.
 */
export async function signInWithGoogleAccount(): Promise<GoogleAuthResult> {
  try {
    const { auth, provider } = getRealFirebaseAuth();
    const result = await signInWithPopup(auth, provider);
    const fbUser: FirebaseUser = result.user;

    const user: GoogleAuthUser = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google Hero',
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.displayName || 'Hero'}`,
      providerId: 'google.com',
    };

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.warn('[GoogleAuth] Sign-in exception:', error);
    const code = error?.code || 'auth/unknown';
    const message = error?.message || '구글 로그인 중 오류가 발생했습니다.';

    return {
      success: false,
      errorCode: code,
      errorMessage: message,
      isDomainUnauthorized: code === 'auth/unauthorized-domain',
      isPopupBlocked: code === 'auth/popup-blocked',
      isCancelled: code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request',
    };
  }
}

/**
 * 실제 구글 계정 로그아웃
 */
export async function signOutGoogleAccount(): Promise<void> {
  try {
    const { auth } = getRealFirebaseAuth();
    await signOut(auth);
  } catch (error) {
    console.warn('[GoogleAuth] Sign-out warning:', error);
  }
}
