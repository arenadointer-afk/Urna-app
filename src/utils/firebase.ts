import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
export const auth = getAuth(app);

// Error Handling per Firebase Integration Skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Circuit breaker for Firestore free tier write quota
let isFirestoreQuotaExceeded =
  typeof window !== 'undefined' &&
  (localStorage.getItem('firestore_quota_exceeded') === 'true' ||
    sessionStorage.getItem('firestore_quota_exceeded') === 'true');
let quotaWarningLogged = false;

export type FirebaseConnectionStatus = 'checking' | 'connected' | 'permission_denied' | 'error';
let currentFirebaseStatus: FirebaseConnectionStatus = 'checking';
let currentFirebaseErrorMsg = '';
const statusListeners = new Set<(status: FirebaseConnectionStatus, errorMsg: string) => void>();

function notifyStatus(status: FirebaseConnectionStatus, errorMsg = '') {
  currentFirebaseStatus = status;
  currentFirebaseErrorMsg = errorMsg;
  statusListeners.forEach((fn) => {
    try {
      fn(status, errorMsg);
    } catch (_) {}
  });
}

export function getFirebaseConnectionState(): { status: FirebaseConnectionStatus; error: string } {
  return { status: currentFirebaseStatus, error: currentFirebaseErrorMsg };
}

export function subscribeFirebaseConnectionState(fn: (status: FirebaseConnectionStatus, errorMsg: string) => void) {
  statusListeners.add(fn);
  fn(currentFirebaseStatus, currentFirebaseErrorMsg);
  return () => {
    statusListeners.delete(fn);
  };
}

export function checkQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('quota metric') ||
    msg.includes('8 RESOURCE_EXHAUSTED') ||
    msg.includes('resource-exhausted')
  ) {
    if (!isFirestoreQuotaExceeded) {
      isFirestoreQuotaExceeded = true;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('firestore_quota_exceeded', 'true');
          sessionStorage.setItem('firestore_quota_exceeded', 'true');
        } catch (_) {}
      }
      if (!quotaWarningLogged) {
        quotaWarningLogged = true;
        console.warn(
          '[Firebase] Cota diária gratuita de gravações do Firestore atingida. Modo local/servidor ativo (o jogo continua 100% funcional via servidor Node.js, SSE e storage).'
        );
      }
    }
    return true;
  }
  return false;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  if (checkQuotaError(error)) {
    return {
      error: 'RESOURCE_EXHAUSTED',
      operationType,
      path,
      authInfo: {},
    };
  }

  const errorString = error instanceof Error ? error.message : String(error);
  if (
    errorString.includes('permission-denied') ||
    errorString.includes('Missing or insufficient permissions')
  ) {
    notifyStatus(
      'permission_denied',
      'Regras do Firestore bloqueadas no Console do Firebase (Missing or insufficient permissions).'
    );
  } else if (!errorString.includes('offline')) {
    notifyStatus('error', errorString);
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorString,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Handled:', JSON.stringify(errInfo));
  return errInfo;
}

// Initial Connection Test as required by Skill
export async function testConnection() {
  if (isFirestoreQuotaExceeded) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    notifyStatus('connected');
  } catch (error: any) {
    if (checkQuotaError(error)) return;
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('permission-denied') ||
      msg.includes('Missing or insufficient permissions')
    ) {
      notifyStatus(
        'permission_denied',
        'Regras do Firestore bloqueadas no Console do Firebase (Missing or insufficient permissions).'
      );
    } else if (msg.includes('the client is offline')) {
      console.warn('[Firebase] Verifique a conexão com o Firebase Firestore.');
    } else {
      notifyStatus('connected'); // getDocFromServer on non-existent doc throws or succeeds
    }
  }
}
if (typeof window !== 'undefined' && !isFirestoreQuotaExceeded) {
  testConnection();
}

const GAME_STATE_PATH = 'game_state';
const GAME_STATE_DOC_ID = 'current';

let saveGameStateDebounceTimer: any = null;
let pendingStateToSave: any = null;

/**
 * Salva ou atualiza o estado geral do jogo no Firestore (acessível por qualquer dispositivo)
 */
export async function saveGameStateToFirestore(state: any) {
  if (isFirestoreQuotaExceeded) return;
  try {
    const docRef = doc(db, GAME_STATE_PATH, GAME_STATE_DOC_ID);
    const cleanState: Record<string, any> = {
      updatedAt: state.updatedAt || Date.now(),
    };

    if (typeof state.roundNumber === 'number') cleanState.roundNumber = state.roundNumber;
    if (typeof state.roundDuration === 'number') cleanState.roundDuration = state.roundDuration;
    if (typeof state.timeLeft === 'number') cleanState.timeLeft = Math.max(0, state.timeLeft);
    if (typeof state.isPaused === 'boolean') cleanState.isPaused = state.isPaused;
    if (typeof state.leftPoints === 'number') cleanState.leftPoints = Math.max(0, state.leftPoints);
    if (typeof state.rightPoints === 'number') cleanState.rightPoints = Math.max(0, state.rightPoints);
    if (typeof state.leftGiftsCount === 'number') cleanState.leftGiftsCount = Math.max(0, state.leftGiftsCount);
    if (typeof state.rightGiftsCount === 'number') cleanState.rightGiftsCount = Math.max(0, state.rightGiftsCount);
    if (typeof state.leftCommentProgress === 'number') cleanState.leftCommentProgress = Math.max(0, state.leftCommentProgress);
    if (typeof state.rightCommentProgress === 'number') cleanState.rightCommentProgress = Math.max(0, state.rightCommentProgress);
    if (state.victoryScore && typeof state.victoryScore.left === 'number') {
      cleanState.victoryScore = {
        left: state.victoryScore.left,
        right: state.victoryScore.right ?? 0,
      };
    }
    if (state.lastLeftUser !== undefined) cleanState.lastLeftUser = String(state.lastLeftUser).slice(0, 100);
    if (state.lastLeftText !== undefined) cleanState.lastLeftText = String(state.lastLeftText).slice(0, 150);
    if (state.lastRightUser !== undefined) cleanState.lastRightUser = String(state.lastRightUser).slice(0, 100);
    if (state.lastRightText !== undefined) cleanState.lastRightText = String(state.lastRightText).slice(0, 150);
    if (typeof state.isRoundOver === 'boolean') cleanState.isRoundOver = state.isRoundOver;
    if (state.winner !== undefined) cleanState.winner = String(state.winner || 'none').slice(0, 20);
    if (typeof state.resetCountdown === 'number') cleanState.resetCountdown = state.resetCountdown;
    if (state.tiktokUsername !== undefined) cleanState.tiktokUsername = String(state.tiktokUsername).slice(0, 100);
    if (state.musicTrack !== undefined) cleanState.musicTrack = String(state.musicTrack);
    if (typeof state.musicVolume === 'number') cleanState.musicVolume = state.musicVolume;

    if (state.leftCandidate) {
      cleanState.leftCandidate = {
        id: String(state.leftCandidate.id || 'left'),
        number: String(state.leftCandidate.number !== undefined ? state.leftCandidate.number : '13'),
        name: String(state.leftCandidate.name !== undefined ? state.leftCandidate.name : '').slice(0, 100),
        role: String(state.leftCandidate.role !== undefined ? state.leftCandidate.role : 'PRESIDENTE').slice(0, 50),
        party: String(state.leftCandidate.party !== undefined ? state.leftCandidate.party : '').slice(0, 50),
        coalition: String(state.leftCandidate.coalition || '').slice(0, 100),
        vice: String(state.leftCandidate.vice || '').slice(0, 100),
        color: String(state.leftCandidate.color || '#dc2626'),
        colorClass: String(state.leftCandidate.colorClass || 'text-red-500 border-red-500 bg-red-500'),
        bgGradient: String(state.leftCandidate.bgGradient || 'from-red-600 via-red-700 to-rose-600'),
        photoUrl: String(state.leftCandidate.photoUrl || '').slice(0, 1000000),
        primaryGift: state.leftCandidate.primaryGift || {},
        bonusGifts: state.leftCandidate.bonusGifts || [],
      };
    }

    if (state.rightCandidate) {
      cleanState.rightCandidate = {
        id: String(state.rightCandidate.id || 'right'),
        number: String(state.rightCandidate.number !== undefined ? state.rightCandidate.number : '22'),
        name: String(state.rightCandidate.name !== undefined ? state.rightCandidate.name : '').slice(0, 100),
        role: String(state.rightCandidate.role !== undefined ? state.rightCandidate.role : 'PRESIDENTE').slice(0, 50),
        party: String(state.rightCandidate.party !== undefined ? state.rightCandidate.party : '').slice(0, 50),
        coalition: String(state.rightCandidate.coalition || '').slice(0, 100),
        vice: String(state.rightCandidate.vice || '').slice(0, 100),
        color: String(state.rightCandidate.color || '#2563eb'),
        colorClass: String(state.rightCandidate.colorClass || 'text-blue-500 border-blue-500 bg-blue-500'),
        bgGradient: String(state.rightCandidate.bgGradient || 'from-blue-600 via-blue-700 to-amber-500'),
        photoUrl: String(state.rightCandidate.photoUrl || '').slice(0, 1000000),
        primaryGift: state.rightCandidate.primaryGift || {},
        bonusGifts: state.rightCandidate.bonusGifts || [],
      };
    }

    await setDoc(docRef, cleanState, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${GAME_STATE_PATH}/${GAME_STATE_DOC_ID}`);
  }
}

/**
 * Escuta mudanças em tempo real do estado do jogo no Firestore (publico para todos os aparelhos)
 */
export function subscribeToGameStateFromFirestore(onStateChange: (state: any) => void) {
  const docRef = doc(db, GAME_STATE_PATH, GAME_STATE_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onStateChange(data);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${GAME_STATE_PATH}/${GAME_STATE_DOC_ID}`);
    }
  );
}

/**
 * Publica um evento de batalha (voto, presente épico, animação da urna, comentário)
 */
export async function pushLiveEventToFirestore(event: {
  type: string;
  side?: string;
  amount?: number;
  giftName?: string;
  giftIcon?: string;
  username?: string;
  comment?: string;
  isEpic?: boolean;
  clientId?: string;
}) {
  if (isFirestoreQuotaExceeded) return;
  try {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventRef = doc(db, 'live_events', id);
    await setDoc(eventRef, {
      id,
      type: event.type,
      side: event.side || 'neutral',
      amount: event.amount || 1,
      giftName: (event.giftName || '').slice(0, 100),
      giftIcon: (event.giftIcon || '🎁').slice(0, 20),
      username: (event.username || '@fa_live').slice(0, 100),
      comment: (event.comment || '').slice(0, 300),
      isEpic: Boolean(event.isEpic),
      clientId: (event.clientId || '').slice(0, 64),
      timestamp: Date.now(),
    });
  } catch (error) {
    if (checkQuotaError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, 'live_events');
  }
}

/**
 * Escuta novos eventos de batalha em tempo real (para disparar animações e sons em todos os aparelhos)
 */
export function subscribeToLiveEventsFromFirestore(onEvent: (event: any) => void) {
  const colRef = collection(db, 'live_events');
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(20));
  let isFirstLoad = true;
  const processedEventIds = new Set<string>();

  return onSnapshot(
    q,
    (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        // Marca eventos já existentes para não disparar sons antigos na primeira conexão
        snapshot.docs.forEach((docSnap) => {
          processedEventIds.add(docSnap.id);
        });
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          if (processedEventIds.has(docId)) return;
          processedEventIds.add(docId);

          if (processedEventIds.size > 200) {
            const first = processedEventIds.values().next().value;
            if (first) processedEventIds.delete(first);
          }

          const data = change.doc.data();
          // Aceita eventos recentes (menos de 2 minutos ou sem timestamp)
          if (!data.timestamp || Math.abs(Date.now() - data.timestamp) < 120000) {
            onEvent(data);
          }
        }
      });
    },
    (error) => {
      if (checkQuotaError(error)) return;
      handleFirestoreError(error, OperationType.GET, 'live_events');
    }
  );
}

/**
 * Envia mensagem para o feed do chat em tempo real
 */
export async function pushChatMessageToFirestore(msg: {
  username: string;
  avatar?: string;
  text: string;
  side?: string;
  isGift?: boolean;
  giftIcon?: string;
  points?: number;
}) {
  if (isFirestoreQuotaExceeded) return;
  try {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, 'chat_messages', id);
    await setDoc(docRef, {
      id,
      username: (msg.username || '@espectador').slice(0, 100),
      avatar: (msg.avatar || '').slice(0, 1000),
      text: (msg.text || '').slice(0, 300),
      side: msg.side || 'neutral',
      isGift: Boolean(msg.isGift),
      giftIcon: (msg.giftIcon || '').slice(0, 20),
      points: Number(msg.points) || 0,
      timestamp: Date.now(),
    });
  } catch (error) {
    if (checkQuotaError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, 'chat_messages');
  }
}

/**
 * Escuta feed de comentários e presentes do chat em tempo real
 */
export function subscribeToChatMessagesFromFirestore(onMessages: (msgs: any[]) => void) {
  const colRef = collection(db, 'chat_messages');
  const q = query(colRef, orderBy('timestamp', 'asc'), limit(30));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map((d) => d.data());
      if (msgs.length > 0) {
        onMessages(msgs);
      }
    },
    (error) => {
      if (checkQuotaError(error)) return;
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    }
  );
}
