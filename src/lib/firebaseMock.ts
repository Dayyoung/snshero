// Complete Offline Local Storage Stub for Firebase Auth & Firestore
// Ensures 100% offline static operation without Firebase servers or SDK network dependencies.

export const currentDbMode: 'local' | 'production' = 'local';
export const databaseId = "default";

// Mock Auth User
export const mockUser = {
  uid: 'local-hero-user',
  displayName: 'SNS Hero',
  email: 'hero@snshero.local',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=snshero',
  isAnonymous: false,
  providerData: [{ providerId: 'local' }]
};

// Mock Firebase Auth
export const auth: any = {
  currentUser: mockUser,
  onAuthStateChanged: (callback: (user: any) => void) => {
    setTimeout(() => callback(mockUser), 0);
    return () => {};
  },
  signOut: async (...args: any[]) => {},
};

export class GoogleAuthProviderMock {
  setCustomParameters(...args: any[]) {}
}
export const googleProvider = new GoogleAuthProviderMock();

// Mock Firebase Services
export const db: any = { type: 'firestore-mock' };
export const storage: any = { type: 'storage-mock' };
export const rtdb: any = { type: 'rtdb-mock' };

// Auth stubs
export const signInWithPopup = async (...args: any[]) => ({ user: mockUser });
export const signInWithEmailAndPassword = async (...args: any[]) => ({ user: mockUser });
export const createUserWithEmailAndPassword = async (...args: any[]) => ({ user: mockUser });
export const signOut = async (...args: any[]) => {};
export const onAuthStateChanged = (authObj: any, callback: (user: any) => void, ...args: any[]) => {
  setTimeout(() => callback(mockUser), 0);
  return () => {};
};

// Firestore stubs
export const doc = (dbObj: any, path: string, ...pathSegments: string[]) => {
  const fullPath = [path, ...pathSegments].filter(Boolean).join('/');
  const id = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : path;
  return { id, path: fullPath };
};

export const collection = (dbObj: any, path: string, ...pathSegments: string[]) => {
  const fullPath = [path, ...pathSegments].filter(Boolean).join('/');
  const id = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : path;
  return { id, path: fullPath };
};

export const getDoc = async (docRef: any, ...args: any[]) => {
  const key = `hero_firestore_${docRef?.path || 'default'}`;
  const raw = localStorage.getItem(key);
  if (!raw) return { id: docRef?.id || 'doc', exists: () => false, data: () => null, metadata: { fromCache: false, hasPendingWrites: false } };
  try {
    const data = JSON.parse(raw);
    return { id: docRef?.id || 'doc', exists: () => true, data: () => data, metadata: { fromCache: false, hasPendingWrites: false } };
  } catch {
    return { id: docRef?.id || 'doc', exists: () => false, data: () => null, metadata: { fromCache: false, hasPendingWrites: false } };
  }
};

export const setDoc = async (docRef: any, data: any, options?: any, ...args: any[]) => {
  const key = `hero_firestore_${docRef?.path || 'default'}`;
  let finalData = data;
  if (options?.merge) {
    const existingRaw = localStorage.getItem(key);
    if (existingRaw) {
      try {
        finalData = { ...JSON.parse(existingRaw), ...data };
      } catch {}
    }
  }
  localStorage.setItem(key, JSON.stringify(finalData));
};

export const updateDoc = async (docRef: any, data: any, ...args: any[]) => {
  return setDoc(docRef, data, { merge: true });
};

export const addDoc = async (collectionRef: any, data: any, ...args: any[]) => {
  const id = 'id_' + Math.random().toString(36).substring(2, 9);
  const docRef = doc(null, collectionRef?.path || 'collection', id);
  await setDoc(docRef, data);
  return docRef;
};

export const getDocs = async (queryRef: any, ...args: any[]) => {
  return {
    empty: true,
    docs: [],
    forEach: (cb: any) => {},
    size: 0,
    metadata: { fromCache: false, hasPendingWrites: false }
  };
};

export const onSnapshot = (refObj: any, ...args: any[]) => {
  const callback = typeof args[0] === 'function' ? args[0] : (typeof args[1] === 'function' ? args[1] : () => {});
  callback({
    id: refObj?.id || 'doc',
    exists: () => false,
    data: () => null,
    docs: [],
    forEach: () => {},
    size: 0,
    empty: true,
    metadata: { fromCache: false, hasPendingWrites: false }
  });
  return () => {};
};

export const deleteDoc = async (docRef: any, ...args: any[]) => {
  const key = `hero_firestore_${docRef?.path || 'default'}`;
  localStorage.removeItem(key);
};

export const ref = (storageObj: any, path: string, ...args: any[]) => ({ path });
export const uploadBytes = async (refObj: any, file: any, ...args: any[]) => ({ ref: refObj });
export const getDownloadURL = async (refObj: any, ...args: any[]) => 'https://api.dicebear.com/7.x/bottts/svg?seed=mockupload';
export const initializeApp = (...args: any[]) => ({});

export const query = (...args: any[]) => args[0];
export const orderBy = (...args: any[]) => {};
export const limit = (...args: any[]) => {};
export const where = (...args: any[]) => {};
export const writeBatch = (...args: any[]) => ({
  set: (...a: any[]) => {},
  update: (...a: any[]) => {},
  delete: (...a: any[]) => {},
  commit: async () => {}
});
export const serverTimestamp = (...args: any[]) => Date.now();

// Analytics mocks
export const analytics: any = null;
export const logEvent = (...args: any[]) => {};
export const setUserId = (...args: any[]) => {};
export const setUserProperties = (...args: any[]) => {};
