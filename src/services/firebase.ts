/**
 * Firebase Service Configuration & Integration
 * Connected to Firebase Project: test-5f2c8
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCZhUKzEEL93ICTOspBSgg6e9Dmf30y2qw",
  authDomain: "test-5f2c8.firebaseapp.com",
  projectId: "test-5f2c8",
  storageBucket: "test-5f2c8.firebasestorage.app",
  messagingSenderId: "821077986242",
  appId: "1:821077986242:web:5f757b2adb7543e5f1645b"
};

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Tài khoản được cấp quyền Admin cao nhất
export const SUPER_ADMIN_EMAIL = "admin@hotro.vn";

export type FirestoreSyncState = 'IDLE' | 'SYNCING' | 'CONNECTED' | 'PERMISSION_DENIED' | 'ERROR' | 'OFFLINE';

interface SyncStatusInfo {
  state: FirestoreSyncState;
  lastSyncTime: string | null;
  lastError: string | null;
  projectId: string;
  syncedCounts: Record<string, number>;
}

let syncStatus: SyncStatusInfo = {
  state: 'IDLE',
  lastSyncTime: null,
  lastError: null,
  projectId: firebaseConfig.projectId,
  syncedCounts: {}
};

const syncListeners: ((status: SyncStatusInfo) => void)[] = [];

export function getFirestoreSyncStatus(): SyncStatusInfo {
  return { ...syncStatus };
}

export function subscribeToSyncStatus(listener: (status: SyncStatusInfo) => void): () => void {
  syncListeners.push(listener);
  listener({ ...syncStatus });
  return () => {
    const idx = syncListeners.indexOf(listener);
    if (idx !== -1) syncListeners.splice(idx, 1);
  };
}

function updateSyncStatus(updates: Partial<SyncStatusInfo>) {
  syncStatus = { ...syncStatus, ...updates };
  syncListeners.forEach(cb => {
    try {
      cb({ ...syncStatus });
    } catch (e) {
      console.warn('Sync listener err:', e);
    }
  });
}

/**
 * Kiểm tra xem email có phải là Quản trị viên cao nhất không
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Đăng nhập bằng Email & Mật khẩu với Firebase Auth
 */
export async function loginWithFirebase(email: string, pass: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Đăng ký tài khoản mới bằng Email & Mật khẩu
 */
export async function registerWithFirebase(email: string, pass: string): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * Đăng xuất Firebase
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Lưu/Đồng bộ dữ liệu sang Firestore collection
 */
export async function syncDocToFirestore(collectionName: string, docId: string, data: any): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      syncedAt: new Date().toISOString()
    }, { merge: true });
    updateSyncStatus({
      state: 'CONNECTED',
      lastSyncTime: new Date().toISOString(),
      lastError: null
    });
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`Firestore sync note (${collectionName}/${docId}):`, msg);
    if (err?.code === 'permission-denied' || msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
      updateSyncStatus({ state: 'PERMISSION_DENIED', lastError: 'Chưa cấp quyền Firestore Rules (Cần allow read, write)' });
    } else {
      updateSyncStatus({ state: 'ERROR', lastError: msg });
    }
    return false;
  }
}

/**
 * Xóa tài liệu khỏi Firestore collection
 */
export async function deleteDocFromFirestore(collectionName: string, docId: string): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    updateSyncStatus({
      state: 'CONNECTED',
      lastSyncTime: new Date().toISOString()
    });
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`Firestore delete note (${collectionName}/${docId}):`, msg);
    return false;
  }
}

/**
 * Tải toàn bộ dữ liệu từ 1 collection trên Firestore
 */
export async function fetchCollectionFromFirestore<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() } as T);
    });
    updateSyncStatus({
      state: 'CONNECTED',
      lastSyncTime: new Date().toISOString(),
      lastError: null,
      syncedCounts: {
        ...syncStatus.syncedCounts,
        [collectionName]: items.length
      }
    });
    return items;
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`Firestore fetchCollection note (${collectionName}):`, msg);
    if (err?.code === 'permission-denied' || msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
      updateSyncStatus({ state: 'PERMISSION_DENIED', lastError: 'Chưa cấp quyền Firestore Rules (Cần allow read, write)' });
    } else {
      updateSyncStatus({ state: 'ERROR', lastError: msg });
    }
    return [];
  }
}

/**
 * Đồng bộ toàn bộ mảng dữ liệu lên Firestore
 */
export async function syncAllCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<boolean> {
  try {
    updateSyncStatus({ state: 'SYNCING' });
    const promises = items.map(item => syncDocToFirestore(collectionName, item.id, item));
    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<boolean>).value).length;
    
    updateSyncStatus({
      state: 'CONNECTED',
      lastSyncTime: new Date().toISOString(),
      syncedCounts: {
        ...syncStatus.syncedCounts,
        [collectionName]: successCount
      }
    });
    return true;
  } catch (err: any) {
    console.warn(`Firestore syncAll note (${collectionName}):`, err);
    updateSyncStatus({ state: 'ERROR', lastError: err?.message || String(err) });
    return false;
  }
}

/**
 * Lắng nghe thay đổi dữ liệu thời gian thực từ Firestore collection
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (items: T[]) => void
): () => void {
  try {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      snapshot => {
        const items: T[] = [];
        snapshot.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        if (items.length > 0) {
          updateSyncStatus({
            state: 'CONNECTED',
            lastSyncTime: new Date().toISOString(),
            lastError: null,
            syncedCounts: {
              ...syncStatus.syncedCounts,
              [collectionName]: items.length
            }
          });
          onUpdate(items);
        }
      },
      error => {
        console.warn(`Firestore listener note (${collectionName}):`, error.message);
        if (error.code === 'permission-denied') {
          updateSyncStatus({ state: 'PERMISSION_DENIED', lastError: 'Quyền truy cập Firestore bị từ chối' });
        }
      }
    );
    return unsubscribe;
  } catch (err: any) {
    console.warn(`Firestore subscribe note (${collectionName}):`, err);
    return () => {};
  }
}
