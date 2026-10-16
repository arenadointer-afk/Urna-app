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

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Verifique a conexão com o Firebase Firestore.');
    }
  }
}
if (typeof window !== 'undefined') {
  testConnection();
}

const GAME_STATE_PATH = 'game_state';
const GAME_STATE_DOC_ID = 'current';

/**
 * Salva ou atualiza o estado geral do jogo no Firestore (acessível por qualquer dispositivo)
 */
export async function saveGameStateToFirestore(state: any) {
  try {
    const docRef = doc(db, GAME_STATE_PATH, GAME_STATE_DOC_ID);
    // Sanitize state for Firestore (no undefined values)
    const cleanState: Record<string, any> = {
      roundNumber: Number(state.roundNumber) || 1,
      roundDuration: Number(state.roundDuration) || 125,
      timeLeft: Math.max(0, Number(state.timeLeft) || 0),
      isPaused: Boolean(state.isPaused),
      leftPoints: Math.max(0, Number(state.leftPoints) || 0),
      rightPoints: Math.max(0, Number(state.rightPoints) || 0),
      leftGiftsCount: Math.max(0, Number(state.leftGiftsCount) || 0),
      rightGiftsCount: Math.max(0, Number(state.rightGiftsCount) || 0),
      leftCommentProgress: Math.max(0, Number(state.leftCommentProgress) || 0),
      rightCommentProgress: Math.max(0, Number(state.rightCommentProgress) || 0),
      victoryScore: {
        left: Number(state.victoryScore?.left) || 0,
        right: Number(state.victoryScore?.right) || 0,
      },
      lastLeftUser: String(state.lastLeftUser || '@Mara').slice(0, 100),
      lastLeftText: String(state.lastLeftText || 'Rosa x1 • +1 ponto').slice(0, 150),
      lastRightUser: String(state.lastRightUser || '@Lucimara').slice(0, 100),
      lastRightText: String(state.lastRightText || 'Sorvete x1 • +1 ponto').slice(0, 150),
      isRoundOver: Boolean(state.isRoundOver),
      winner: String(state.winner || 'none').slice(0, 20),
      resetCountdown: Number(state.resetCountdown) || 5,
      tiktokUsername: String(state.tiktokUsername || 'leonardosutello').slice(0, 100),
      updatedAt: Date.now(),
    };

    if (state.leftCandidate) {
      cleanState.leftCandidate = {
        id: String(state.leftCandidate.id || 'left'),
        number: String(state.leftCandidate.number || '13'),
        name: String(state.leftCandidate.name || 'LUIZ INÁCIO LULA').slice(0, 100),
        role: String(state.leftCandidate.role || 'PRESIDENTE').slice(0, 50),
        party: String(state.leftCandidate.party || 'PT').slice(0, 50),
        coalition: String(state.leftCandidate.coalition || '').slice(0, 100),
        vice: String(state.leftCandidate.vice || '').slice(0, 100),
        color: String(state.leftCandidate.color || '#dc2626'),
        colorClass: String(state.leftCandidate.colorClass || ''),
        bgGradient: String(state.leftCandidate.bgGradient || ''),
        photoUrl: String(state.leftCandidate.photoUrl || '').slice(0, 1000),
        primaryGift: state.leftCandidate.primaryGift || {},
        bonusGifts: state.leftCandidate.bonusGifts || [],
      };
    }

    if (state.rightCandidate) {
      cleanState.rightCandidate = {
        id: String(state.rightCandidate.id || 'right'),
        number: String(state.rightCandidate.number || '22'),
        name: String(state.rightCandidate.name || 'FLÁVIO BOLSONARO').slice(0, 100),
        role: String(state.rightCandidate.role || 'PRESIDENTE').slice(0, 50),
        party: String(state.rightCandidate.party || 'PL').slice(0, 50),
        coalition: String(state.rightCandidate.coalition || '').slice(0, 100),
        vice: String(state.rightCandidate.vice || '').slice(0, 100),
        color: String(state.rightCandidate.color || '#2563eb'),
        colorClass: String(state.rightCandidate.colorClass || ''),
        bgGradient: String(state.rightCandidate.bgGradient || ''),
        photoUrl: String(state.rightCandidate.photoUrl || '').slice(0, 1000),
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
}) {
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
      timestamp: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'live_events');
  }
}

/**
 * Escuta novos eventos de batalha em tempo real (para disparar animações e sons em todos os aparelhos)
 */
export function subscribeToLiveEventsFromFirestore(onEvent: (event: any) => void) {
  const colRef = collection(db, 'live_events');
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(15));
  let isFirstLoad = true;

  return onSnapshot(
    q,
    (snapshot) => {
      if (isFirstLoad) {
        isFirstLoad = false;
        return; // Ignora eventos antigos ao conectar pela primeira vez
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Apenas processa se for recente (menos de 10s)
          if (Date.now() - data.timestamp < 10000) {
            onEvent(data);
          }
        }
      });
    },
    (error) => {
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
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    }
  );
}
