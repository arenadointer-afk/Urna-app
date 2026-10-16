import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

import { TikTokLiveConnection } from 'tiktok-live-connector';

// Safe process handlers to prevent dev server crash from background socket/network errors
process.on('uncaughtException', (err) => {
  console.warn('[Server] Uncaught exception caught safely:', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[Server] Unhandled rejection caught safely:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, 'server_state.json');

// Initialize Firebase Firestore for Cloud Persistence across devices
let firestoreDb: any = null;
let isFirestoreAdmin = false;
let isFirestoreQuotaExceeded = false;

function isQuotaError(err: any): boolean {
  const msg = err?.message || String(err);
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('quota metric') ||
    msg.includes('8 RESOURCE_EXHAUSTED')
  );
}

// 1. Prioridade A: Tenta conectar via Firebase Admin SDK (Chave Privada / Service Account JSON)
// Garante 100% de permissões totais no backend sem depender de regras de segurança públicas
try {
  let saJson: any = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      saJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch {
      saJson = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8'));
    }
  } else if (fs.existsSync(path.resolve(__dirname, 'serviceAccountKey.json'))) {
    saJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'serviceAccountKey.json'), 'utf-8'));
  } else if (fs.existsSync(path.resolve(__dirname, 'firebase-service-account.json'))) {
    saJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'firebase-service-account.json'), 'utf-8'));
  }

  if (saJson) {
    const adminApp = !getAdminApps().length
      ? initAdminApp({
          credential: cert(saJson),
          projectId: saJson.project_id || 'appurna',
        })
      : getAdminApps()[0];
    firestoreDb = getAdminFirestore(adminApp);
    isFirestoreAdmin = true;
    console.log('[Server] Firebase Firestore conectado via Firebase Admin SDK (Privilégios Totais)!');
  }
} catch (e) {
  console.warn('[Server] Falha ao inicializar Firebase Admin SDK:', e);
}

// 2. Prioridade B: Conecta via Firebase Client Web SDK (usando firebase-applet-config.json)
if (!firestoreDb) {
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (process.env.FIREBASE_API_KEY) {
        rawConfig.apiKey = process.env.FIREBASE_API_KEY;
      }
      const fbApp = !getApps().length ? initializeApp(rawConfig) : getApps()[0];
      firestoreDb =
        rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)'
          ? getFirestore(fbApp, rawConfig.firestoreDatabaseId)
          : getFirestore(fbApp);
      console.log('[Server] Firebase Firestore conectado via Web SDK!');
    }
  } catch (e) {
    console.warn('[Server] Falha ao inicializar Firebase Firestore Web SDK:', e);
  }
}

// Funções utilitárias unificadas para persistência na nuvem
async function fetchCloudGameState(): Promise<any> {
  if (!firestoreDb) return null;
  try {
    if (isFirestoreAdmin) {
      const snap = await firestoreDb.collection('game_state').doc('current').get();
      return snap.exists ? snap.data() : null;
    } else {
      const docRef = doc(firestoreDb, 'game_state', 'current');
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    }
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      console.warn('[Server] Firestore: Permissão negada. As regras do Firestore no Console do Firebase precisam de "allow read, write: if true;".');
    } else {
      console.warn('[Server] Falha ao consultar game_state do Firestore:', msg);
    }
    return null;
  }
}

async function writeCloudGameState(state: any) {
  if (!firestoreDb || isFirestoreQuotaExceeded) return;
  try {
    const clean = { ...state, updatedAt: Date.now() };
    if (isFirestoreAdmin) {
      await firestoreDb.collection('game_state').doc('current').set(clean, { merge: true });
    } else {
      const docRef = doc(firestoreDb, 'game_state', 'current');
      await setDoc(docRef, clean, { merge: true });
    }
  } catch (err: any) {
    if (isQuotaError(err)) {
      isFirestoreQuotaExceeded = true;
      console.warn('[Server] Quota de gravação do Firestore excedida.');
    } else {
      console.warn('[Server] Falha ao gravar game_state no Firestore:', err?.message || err);
    }
  }
}

async function writeCloudLiveEvent(event: any) {
  if (!firestoreDb || isFirestoreQuotaExceeded) return;
  try {
    if (isFirestoreAdmin) {
      await firestoreDb.collection('live_events').doc(event.id).set(event);
    } else {
      const docRef = doc(firestoreDb, 'live_events', event.id);
      await setDoc(docRef, event);
    }
  } catch (err: any) {
    if (isQuotaError(err)) isFirestoreQuotaExceeded = true;
  }
}

async function writeCloudChatMessage(msg: any) {
  if (!firestoreDb || isFirestoreQuotaExceeded) return;
  try {
    if (isFirestoreAdmin) {
      await firestoreDb.collection('chat_messages').doc(msg.id).set(msg);
    } else {
      const docRef = doc(firestoreDb, 'chat_messages', msg.id);
      await setDoc(docRef, msg);
    }
  } catch (err: any) {
    if (isQuotaError(err)) isFirestoreQuotaExceeded = true;
  }
}

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.use(express.json({ limit: '10mb' }));

// Initial Default Candidates
const DEFAULT_LEFT_CANDIDATE = {
  id: 'left',
  number: '13',
  name: 'LUIZ INÁCIO LULA',
  role: 'PRESIDENTE',
  party: 'PT',
  coalition: 'BRASIL DA ESPERANÇA',
  vice: 'GERALDO ALCKMIN',
  color: '#dc2626',
  colorClass: 'text-red-500 border-red-500 bg-red-500',
  bgGradient: 'from-red-600 via-red-700 to-rose-600',
  photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  primaryGift: {
    id: 'rose',
    name: 'Rosa',
    icon: '🌹',
    points: 1,
    badge: '1 VOTO',
  },
  bonusGifts: [
    { id: 'heart', name: 'Coração', icon: '💖', points: 10, badge: '10 VOTOS' },
    { id: 'star', name: 'Estrela 13', icon: '⭐', points: 30, badge: '30 VOTOS' },
    { id: 'galaxy', name: 'Galáxia Épica', icon: '🌌', points: 100, badge: '100 VOTOS' },
  ],
};

const DEFAULT_RIGHT_CANDIDATE = {
  id: 'right',
  number: '22',
  name: 'FLÁVIO BOLSONARO',
  role: 'PRESIDENTE',
  party: 'PL',
  coalition: 'PELO BEM DO BRASIL',
  vice: 'BRAGA NETTO',
  color: '#2563eb',
  colorClass: 'text-blue-500 border-blue-500 bg-blue-500',
  bgGradient: 'from-blue-600 via-blue-700 to-amber-500',
  photoUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=300&auto=format&fit=crop&q=80',
  primaryGift: {
    id: 'icecream',
    name: 'Sorvete',
    icon: '🍦',
    points: 1,
    badge: '1 VOTO',
  },
  bonusGifts: [
    { id: 'donut', name: 'Donut', icon: '🍩', points: 10, badge: '10 VOTOS' },
    { id: 'cap', name: 'Boné 22', icon: '🧢', points: 30, badge: '30 VOTOS' },
    { id: 'lion', name: 'Leão Lendário', icon: '🦁', points: 100, badge: '100 VOTOS' },
  ],
};

// Authoritative Server State
interface ServerGameState {
  leftCandidate: any;
  rightCandidate: any;
  roundNumber: number;
  roundDuration: number;
  timeLeft: number;
  isPaused: boolean;
  leftPoints: number;
  rightPoints: number;
  leftGiftsCount: number;
  rightGiftsCount: number;
  leftCommentProgress: number;
  rightCommentProgress: number;
  victoryScore: { left: number; right: number };
  lastLeftUser: string;
  lastLeftText: string;
  lastRightUser: string;
  lastRightText: string;
  isRoundOver: boolean;
  winner: 'left' | 'right' | 'draw' | null;
  resetCountdown: number;
  chatMessages: any[];
  tiktokUsername: string;
  botEnabled: boolean;
}

let serverState: ServerGameState = {
  leftCandidate: DEFAULT_LEFT_CANDIDATE,
  rightCandidate: DEFAULT_RIGHT_CANDIDATE,
  roundNumber: 1,
  roundDuration: 125,
  timeLeft: 125,
  isPaused: false,
  leftPoints: 0,
  rightPoints: 0,
  leftGiftsCount: 0,
  rightGiftsCount: 0,
  leftCommentProgress: 0,
  rightCommentProgress: 0,
  victoryScore: { left: 0, right: 0 },
  lastLeftUser: '@Mara',
  lastLeftText: 'Rosa x1 • +1 ponto',
  lastRightUser: '@Lucimara',
  lastRightText: 'Sorvete x1 • +1 ponto',
  isRoundOver: false,
  winner: null,
  resetCountdown: 5,
  chatMessages: [],
  tiktokUsername: 'leonardosutello',
  botEnabled: false,
};

// Load saved state from disk if exists
try {
  if (fs.existsSync(STATE_FILE)) {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    serverState = { ...serverState, ...parsed };
    if (!serverState.tiktokUsername) {
      serverState.tiktokUsername = 'leonardosutello';
    }
    console.log('[Server] Estado restaurado do disco com sucesso!');
  }
} catch (e) {
  console.warn('[Server] Falha ao ler server_state.json', e);
}

// Persist state to disk and Firestore safely
let saveTimeout: any = null;
function saveStateToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(serverState, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Server] Erro ao salvar estado no disco:', e);
    }

    writeCloudGameState(serverState);
  }, 400);
}

// Active SSE client connections
const sseClients: Response[] = [];

function broadcastToClients(event: any) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const res = sseClients[i];
    try {
      res.write(payload);
    } catch (e) {
      sseClients.splice(i, 1);
    }
  }
}

// Live TikTok connection state
let tiktokLiveConnection: any = null;
let currentUsername = serverState.tiktokUsername || 'leonardosutello';
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
let viewersCount = 0;
let totalLikesCount = 0;
let lastErrorMessage = '';

// Central vote logic
function addVote(
  side: 'left' | 'right',
  amount: number,
  giftName?: string,
  giftIcon?: string,
  username?: string,
  clientId?: string
) {
  if (serverState.isRoundOver) return;

  const user = username || '@fa_live';
  const isGift = Boolean(giftName && giftName !== 'Manual' && !giftName.includes('Comentário'));
  const actionText = isGift
    ? `${giftName || 'Presente'} • +${amount} pontos`
    : `${giftName || 'Voto'} • +${amount} ponto`;

  if (side === 'left') {
    serverState.leftPoints += amount;
    if (isGift) serverState.leftGiftsCount += (amount > 1 ? amount : 1);
    serverState.lastLeftUser = user;
    serverState.lastLeftText = actionText;
  } else {
    serverState.rightPoints += amount;
    if (isGift) serverState.rightGiftsCount += (amount > 1 ? amount : 1);
    serverState.lastRightUser = user;
    serverState.lastRightText = actionText;
  }

  // Add chat message
  const newMsg = {
    id: `msg-${Date.now()}-${Math.random()}`,
    username: user,
    avatar: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 500)}?w=100&auto=format&fit=crop&q=80`,
    text: isGift ? `${giftName} (+${amount} pontos)` : `${side === 'left' ? serverState.leftCandidate.number : serverState.rightCandidate.number}`,
    side,
    timestamp: Date.now(),
    isGift,
    giftIcon: giftIcon || (side === 'left' ? serverState.leftCandidate.primaryGift.icon : serverState.rightCandidate.primaryGift.icon),
    points: amount,
  };
  serverState.chatMessages = [...serverState.chatMessages.slice(-25), newMsg];

  saveStateToDisk();

  // Apenas grava no Firestore se o evento não tiver vindo de um cliente que já o gravou
  if (!clientId) {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    writeCloudLiveEvent({
      id,
      type: isGift ? 'gift' : 'vote',
      side,
      amount,
      giftName: giftName || '',
      giftIcon: newMsg.giftIcon || '🎁',
      username: user,
      isEpic: amount >= 10,
      clientId: '',
      timestamp: Date.now(),
    });
    writeCloudChatMessage(newMsg);
  }

  broadcastToClients({
    type: 'VOTE_TRIGGER',
    side,
    amount,
    giftName,
    giftIcon: newMsg.giftIcon,
    username: user,
    isEpic: amount >= 10,
    clientId,
    state: serverState,
  });
}

// Central chat comment logic: 5 comments with number = +1 point!
function addComment(text: string, username?: string) {
  const trimmed = text.trim();
  const author = username || '@espectador';
  const leftNum = String(serverState.leftCandidate.number);
  const rightNum = String(serverState.rightCandidate.number);
  const leftName = serverState.leftCandidate.name.split(' ')[0].toLowerCase();
  const rightName = serverState.rightCandidate.name.split(' ')[0].toLowerCase();

  const hasLeft = trimmed.includes(leftNum) || trimmed.toLowerCase().includes(leftName);
  const hasRight = trimmed.includes(rightNum) || trimmed.toLowerCase().includes(rightName);

  if (hasLeft) {
    serverState.leftCommentProgress += 1;
    if (serverState.leftCommentProgress >= 5) {
      serverState.leftCommentProgress = 0;
      addVote('left', 1, '5 Comentários no Chat', '💬', author);
      return;
    }
    const newMsg = {
      id: `cmt-${Date.now()}-${Math.random()}`,
      username: author,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: `${leftNum} (${serverState.leftCommentProgress}/5 p/ +1 ponto)`,
      side: 'left',
      timestamp: Date.now(),
    };
    serverState.chatMessages = [...serverState.chatMessages.slice(-25), newMsg];
  } else if (hasRight) {
    serverState.rightCommentProgress += 1;
    if (serverState.rightCommentProgress >= 5) {
      serverState.rightCommentProgress = 0;
      addVote('right', 1, '5 Comentários no Chat', '💬', author);
      return;
    }
    const newMsg = {
      id: `cmt-${Date.now()}-${Math.random()}`,
      username: author,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: `${rightNum} (${serverState.rightCommentProgress}/5 p/ +1 ponto)`,
      side: 'right',
      timestamp: Date.now(),
    };
    serverState.chatMessages = [...serverState.chatMessages.slice(-25), newMsg];
  } else {
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random()}`,
      username: author,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: trimmed,
      side: 'neutral',
      timestamp: Date.now(),
    };
    serverState.chatMessages = [...serverState.chatMessages.slice(-25), newMsg];
  }

  saveStateToDisk();

  const evtId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  writeCloudLiveEvent({
    id: evtId,
    type: 'chat',
    comment: trimmed,
    username: author,
    timestamp: Date.now(),
  });

  broadcastToClients({
    type: 'CHAT_TRIGGER',
    state: serverState,
  });
}

// Server clock tick loop (Synchronized timer across all viewers and OBS)
setInterval(() => {
  if (serverState.isPaused) return;

  // Se não há clientes conectados (SSE) e os pontos estão zerados, não roda o relógio em falso
  if (sseClients.length === 0 && serverState.leftPoints === 0 && serverState.rightPoints === 0) {
    return;
  }

  if (!serverState.isRoundOver) {
    if (serverState.timeLeft > 1) {
      serverState.timeLeft -= 1;
      broadcastToClients({
        type: 'TIME_TICK',
        timeLeft: serverState.timeLeft,
        isPaused: false,
        isRoundOver: false,
        resetCountdown: serverState.resetCountdown,
        roundNumber: serverState.roundNumber,
      });
    } else {
      // Round Finished! Calculate Winner and Increment Victory Score
      serverState.timeLeft = 0;
      serverState.isRoundOver = true;
      const winner =
        serverState.leftPoints > serverState.rightPoints
          ? 'left'
          : serverState.rightPoints > serverState.leftPoints
          ? 'right'
          : 'draw';
      serverState.winner = winner;
      serverState.resetCountdown = 5;

      if (winner === 'left') {
        serverState.victoryScore.left += 1;
      } else if (winner === 'right') {
        serverState.victoryScore.right += 1;
      }

      saveStateToDisk();

      broadcastToClients({
        type: 'ROUND_OVER',
        winner,
        victoryScore: serverState.victoryScore,
        state: serverState,
      });
    }
  } else {
    // In victory celebration countdown
    if (serverState.resetCountdown > 1) {
      serverState.resetCountdown -= 1;
      broadcastToClients({
        type: 'TIME_TICK',
        timeLeft: 0,
        isPaused: false,
        isRoundOver: true,
        resetCountdown: serverState.resetCountdown,
        roundNumber: serverState.roundNumber,
      });
    } else {
      // Auto restart next round
      serverState.roundNumber += 1;
      serverState.timeLeft = serverState.roundDuration;
      serverState.leftPoints = 0;
      serverState.rightPoints = 0;
      serverState.leftGiftsCount = 0;
      serverState.rightGiftsCount = 0;
      serverState.leftCommentProgress = 0;
      serverState.rightCommentProgress = 0;
      serverState.isRoundOver = false;
      serverState.winner = null;
      serverState.resetCountdown = 5;

      saveStateToDisk();

      broadcastToClients({
        type: 'ROUND_RESTART',
        state: serverState,
      });
    }
  }
}, 1000);

// API Endpoints

// 1. Get Authoritative State
app.get('/api/state', (_req: Request, res: Response) => {
  res.json(serverState);
});

// 2. Update Candidate (photo, name, number, party, gifts, etc.)
app.post('/api/candidate', (req: Request, res: Response) => {
  const { side, candidate } = req.body;
  if (side === 'left') {
    serverState.leftCandidate = candidate;
  } else if (side === 'right') {
    serverState.rightCandidate = candidate;
  }
  saveStateToDisk();
  broadcastToClients({
    type: 'STATE_SYNC',
    state: serverState,
  });
  res.json({ success: true, state: serverState });
});

// 3. Update All Candidates (Presets)
app.post('/api/candidates', (req: Request, res: Response) => {
  const { left, right } = req.body;
  if (left) serverState.leftCandidate = left;
  if (right) serverState.rightCandidate = right;
  serverState.leftPoints = 0;
  serverState.rightPoints = 0;
  serverState.leftGiftsCount = 0;
  serverState.rightGiftsCount = 0;
  serverState.timeLeft = serverState.roundDuration;
  saveStateToDisk();
  broadcastToClients({
    type: 'STATE_SYNC',
    state: serverState,
  });
  res.json({ success: true, state: serverState });
});

// 4. Update Round Duration
app.post('/api/duration', (req: Request, res: Response) => {
  const { duration } = req.body;
  const num = parseInt(duration, 10);
  if (!isNaN(num) && num >= 5) {
    serverState.roundDuration = num;
    serverState.timeLeft = num;
    saveStateToDisk();
    broadcastToClients({
      type: 'STATE_SYNC',
      state: serverState,
    });
    return res.json({ success: true, roundDuration: num });
  }
  res.status(400).json({ error: 'Duração inválida' });
});

// 4.1 Add Time to current round (+30s, +60s, etc.)
app.post('/api/time/add', (req: Request, res: Response) => {
  const { seconds } = req.body;
  const num = parseInt(seconds, 10);
  if (!isNaN(num) && num > 0) {
    serverState.timeLeft += num;
    if (serverState.timeLeft > serverState.roundDuration) {
      serverState.roundDuration = serverState.timeLeft;
    }
    saveStateToDisk();
    broadcastToClients({
      type: 'STATE_SYNC',
      state: serverState,
    });
    return res.json({ success: true, timeLeft: serverState.timeLeft, roundDuration: serverState.roundDuration });
  }
  res.status(400).json({ error: 'Segundos inválidos' });
});

// 5. Toggle Pause
app.post('/api/pause', (req: Request, res: Response) => {
  serverState.isPaused = !serverState.isPaused;
  saveStateToDisk();
  broadcastToClients({
    type: 'STATE_SYNC',
    state: serverState,
  });
  res.json({ isPaused: serverState.isPaused });
});

// 6. Reset Current Round
app.post('/api/reset-round', (_req: Request, res: Response) => {
  serverState.timeLeft = serverState.roundDuration;
  serverState.leftPoints = 0;
  serverState.rightPoints = 0;
  serverState.leftGiftsCount = 0;
  serverState.rightGiftsCount = 0;
  serverState.leftCommentProgress = 0;
  serverState.rightCommentProgress = 0;
  serverState.isRoundOver = false;
  serverState.winner = null;
  serverState.resetCountdown = 5;
  saveStateToDisk();
  broadcastToClients({
    type: 'ROUND_RESTART',
    state: serverState,
  });
  res.json({ success: true, state: serverState });
});

// 7. Update Victory Score
app.post('/api/victory-score', (req: Request, res: Response) => {
  const { victoryScore } = req.body;
  if (victoryScore && typeof victoryScore.left === 'number' && typeof victoryScore.right === 'number') {
    serverState.victoryScore = victoryScore;
    saveStateToDisk();
    broadcastToClients({
      type: 'STATE_SYNC',
      state: serverState,
    });
    return res.json({ success: true, victoryScore: serverState.victoryScore });
  }
  res.status(400).json({ error: 'Placar de vitórias inválido' });
});

// 8. Reset Victory Score
app.post('/api/reset-series', (_req: Request, res: Response) => {
  serverState.victoryScore = { left: 0, right: 0 };
  (serverState as any).updatedAt = Date.now();
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(serverState, null, 2), 'utf-8');
  } catch (_) {}
  saveStateToDisk();
  broadcastToClients({
    type: 'STATE_SYNC',
    state: serverState,
  });
  res.json({ success: true, victoryScore: serverState.victoryScore });
});

// 8.1 Update Round Number
app.post('/api/round-number', (req: Request, res: Response) => {
  const { roundNumber } = req.body;
  const num = parseInt(roundNumber, 10);
  if (!isNaN(num) && num >= 1) {
    serverState.roundNumber = num;
    saveStateToDisk();
    broadcastToClients({
      type: 'STATE_SYNC',
      state: serverState,
    });
    return res.json({ success: true, roundNumber: serverState.roundNumber });
  }
  res.status(400).json({ error: 'Número de rodada inválido' });
});

// 8.2 Update Music Track
app.post('/api/music', (req: Request, res: Response) => {
  const { musicTrack } = req.body;
  if (musicTrack) {
    (serverState as any).musicTrack = musicTrack;
    saveStateToDisk();
    broadcastToClients({
      type: 'STATE_SYNC',
      state: serverState,
    });
    return res.json({ success: true, musicTrack: (serverState as any).musicTrack });
  }
  res.status(400).json({ error: 'Música inválida' });
});

// 9. Vote Trigger
app.post('/api/vote', (req: Request, res: Response) => {
  const { side, amount, giftName, giftIcon, username, clientId } = req.body;
  if (side === 'left' || side === 'right') {
    addVote(side, amount || 1, giftName, giftIcon, username, clientId);
    return res.json({ success: true, state: serverState });
  }
  res.status(400).json({ error: 'Lado inválido' });
});

// 9.1 Direct Points Update (from Admin Panel - supports both /api/points and /api/state/points)
const handlePointsUpdate = (req: Request, res: Response) => {
  const { leftPoints, rightPoints } = req.body;
  if (typeof leftPoints === 'number') serverState.leftPoints = Math.max(0, leftPoints);
  if (typeof rightPoints === 'number') serverState.rightPoints = Math.max(0, rightPoints);
  (serverState as any).updatedAt = Date.now();
  saveStateToDisk();
  broadcastToClients({
    type: 'STATE_SYNC',
    state: serverState,
  });
  res.json({ success: true, state: serverState });
};
app.post('/api/points', handlePointsUpdate);
app.post('/api/state/points', handlePointsUpdate);

// 9.2 Restore state from active client when server wakes up or restarts
app.post('/api/state/restore', (req: Request, res: Response) => {
  const { leftPoints, rightPoints, victoryScore, roundNumber, leftCandidate, rightCandidate } = req.body;
  let changed = false;
  if (typeof leftPoints === 'number' && leftPoints > serverState.leftPoints) {
    serverState.leftPoints = leftPoints;
    changed = true;
  }
  if (typeof rightPoints === 'number' && rightPoints > serverState.rightPoints) {
    serverState.rightPoints = rightPoints;
    changed = true;
  }
  if (victoryScore && typeof victoryScore.left === 'number' && typeof victoryScore.right === 'number') {
    if (victoryScore.left > serverState.victoryScore.left || victoryScore.right > serverState.victoryScore.right) {
      serverState.victoryScore = victoryScore;
      changed = true;
    }
  }
  if (typeof roundNumber === 'number' && roundNumber > serverState.roundNumber) {
    serverState.roundNumber = roundNumber;
    changed = true;
  }
  if (leftCandidate && leftCandidate.name && (!serverState.leftCandidate?.name || serverState.leftCandidate.name === 'LUIZ INÁCIO LULA')) {
    serverState.leftCandidate = leftCandidate;
    changed = true;
  }
  if (rightCandidate && rightCandidate.name && (!serverState.rightCandidate?.name || serverState.rightCandidate.name === 'FLÁVIO BOLSONARO')) {
    serverState.rightCandidate = rightCandidate;
    changed = true;
  }

  if (changed) {
    (serverState as any).updatedAt = Date.now();
    saveStateToDisk();
    broadcastToClients({
      type: 'STATE_SYNC',
      state: serverState,
    });
    console.log('[Server] Estado restaurado e atualizado via cliente ativo!');
  }
  res.json({ success: true, state: serverState });
});

// 10. Chat Trigger
app.post('/api/chat', (req: Request, res: Response) => {
  const { text, username } = req.body;
  if (text) {
    addComment(text, username);
    return res.json({ success: true, state: serverState });
  }
  res.status(400).json({ error: 'Mensagem vazia' });
});

// 11. SSE stream for real-time live events to frontend tabs
app.get('/api/tiktok/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.push(res);

  // Send current state and status immediately
  res.write(
    `data: ${JSON.stringify({
      type: 'STATE_SYNC',
      state: serverState,
      status: connectionStatus,
      username: currentUsername,
      viewers: viewersCount,
      totalLikes: totalLikesCount,
      lastError: lastErrorMessage,
    })}\n\n`
  );

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

// Status check
app.get('/api/tiktok/status', (_req: Request, res: Response) => {
  res.json({
    status: connectionStatus,
    username: currentUsername,
    viewers: viewersCount,
    totalLikes: totalLikesCount,
    lastError: lastErrorMessage,
  });
});

// Concurrency guard for TikTok connection
let isConnectingTikTok = false;

// Reusable TikTok Live Connection Handler
async function connectToTikTok(targetUsername: string = 'leonardosutello'): Promise<{ success: boolean; message: string; status?: string }> {
  const cleanUsername = (targetUsername || 'leonardosutello').replace(/^@/, '').trim();
  if (!cleanUsername) {
    return { success: false, message: 'Nome de usuário vazio' };
  }

  if (isConnectingTikTok) {
    return { success: false, message: 'Conexão já em andamento' };
  }
  isConnectingTikTok = true;

  if (tiktokLiveConnection) {
    try {
      tiktokLiveConnection.disconnect();
    } catch (e) {}
    tiktokLiveConnection = null;
  }

  currentUsername = cleanUsername;
  serverState.tiktokUsername = cleanUsername;
  saveStateToDisk();

  connectionStatus = 'connecting';
  lastErrorMessage = '';

  broadcastToClients({
    type: 'status',
    status: 'connecting',
    username: currentUsername,
    lastError: '',
  });

  try {
    const conn: any = new TikTokLiveConnection(cleanUsername, {
      processInitialData: false,
      enableExtendedGiftInfo: true,
      clientParams: {
        app_language: 'pt-BR',
        device_platform: 'web',
      },
    } as any);

    conn.on('connected', (state: any) => {
      connectionStatus = 'connected';
      viewersCount = state?.roomInfo?.user_count || 0;
      lastErrorMessage = '';
      console.log(`[TikTok LIVE] Conectado na live de @${cleanUsername}!`);
      broadcastToClients({
        type: 'status',
        status: 'connected',
        username: cleanUsername,
        viewers: viewersCount,
        totalLikes: totalLikesCount,
      });
    });

    conn.on('disconnected', () => {
      connectionStatus = 'disconnected';
      console.log(`[TikTok LIVE] Desconectado de @${cleanUsername}`);
      broadcastToClients({
        type: 'status',
        status: 'disconnected',
        username: cleanUsername,
      });
    });

    conn.on('streamEnd', () => {
      connectionStatus = 'disconnected';
      lastErrorMessage = 'A transmissão do TikTok foi finalizada pelo streamer.';
      console.log(`[TikTok LIVE] Live finalizada de @${cleanUsername}`);
      broadcastToClients({
        type: 'status',
        status: 'disconnected',
        username: cleanUsername,
        lastError: lastErrorMessage,
      });
    });

    conn.on('error', (err: any) => {
      const msg = err?.message || 'Erro de conexão com o TikTok';
      lastErrorMessage = msg;
      connectionStatus = 'error';
      console.error(`[TikTok LIVE] Erro na conexão:`, msg);
      broadcastToClients({
        type: 'status',
        status: 'error',
        username: cleanUsername,
        lastError: msg,
      });
    });

    // Chat comment event from TikTok
    conn.on('chat', (data: any) => {
      const comment = data.comment || '';
      const user = data.uniqueId || data.nickname || '@usuario';
      addComment(comment, user);
      broadcastToClients({
        type: 'chat',
        uniqueId: user,
        comment,
        timestamp: Date.now(),
      });
    });

    // Gift event from TikTok
    conn.on('gift', (data: any) => {
      if (data.giftType === 1 && !data.repeatEnd) return;
      const repeatCount = data.repeatCount || 1;
      const diamondCount = (data.diamondCount || 1) * repeatCount;
      const giftName = data.giftName || 'Presente';
      const user = data.uniqueId || data.nickname || '@fa_live';
      const lowerGift = giftName.toLowerCase();

      const leftGifts = [
        serverState.leftCandidate.primaryGift?.name?.toLowerCase() || 'rosa',
        ...(serverState.leftCandidate.bonusGifts || []).map((g: any) => g.name.toLowerCase()),
        'rosa', 'rose', 'coração', 'heart', 'estrela', 'star', 'galáxia', 'galaxy'
      ];
      const rightGifts = [
        serverState.rightCandidate.primaryGift?.name?.toLowerCase() || 'sorvete',
        ...(serverState.rightCandidate.bonusGifts || []).map((g: any) => g.name.toLowerCase()),
        'sorvete', 'ice cream', 'icecream', 'donut', 'rosquinha', 'boné', 'cap', 'leão', 'lion'
      ];

      const matchesLeft = leftGifts.some((g) => g && lowerGift.includes(g));
      const matchesRight = rightGifts.some((g) => g && lowerGift.includes(g));

      if (matchesLeft && !matchesRight) {
        addVote('left', repeatCount, giftName, serverState.leftCandidate.primaryGift.icon, user);
      } else if (matchesRight && !matchesLeft) {
        addVote('right', repeatCount, giftName, serverState.rightCandidate.primaryGift.icon, user);
      } else if (diamondCount >= 10 || lowerGift.includes('leão') || lowerGift.includes('galáxia')) {
        const side = serverState.leftPoints <= serverState.rightPoints ? 'left' : 'right';
        addVote(side, diamondCount >= 50 ? 100 : diamondCount, giftName, '🎁', user);
      } else {
        const side = serverState.leftPoints <= serverState.rightPoints ? 'left' : 'right';
        addVote(side, repeatCount, giftName, side === 'left' ? serverState.leftCandidate.primaryGift.icon : serverState.rightCandidate.primaryGift.icon, user);
      }

      broadcastToClients({
        type: 'gift',
        uniqueId: user,
        giftName,
        repeatCount,
        diamondCount,
        timestamp: Date.now(),
      });
    });

    // Likes event from TikTok
    conn.on('like', (data: any) => {
      totalLikesCount = data.totalLikes || totalLikesCount + (data.likeCount || 1);
      broadcastToClients({
        type: 'like',
        likeCount: data.likeCount || 1,
        totalLikes: totalLikesCount,
        uniqueId: data.uniqueId || '@usuario',
      });
    });

    conn.on('roomUser', (data: any) => {
      if (data.viewerCount) viewersCount = data.viewerCount;
    });

    tiktokLiveConnection = conn;
    await conn.connect();
    return { success: true, message: `Conectado à live de @${cleanUsername}!` };
  } catch (error: any) {
    const errorText = error?.message || 'Falha ao conectar no TikTok';
    const isUserOffline =
      errorText.includes("isn't online") ||
      errorText.includes('offline') ||
      errorText.includes('ended') ||
      errorText.includes('LIVE has ended');

    if (isUserOffline) {
      connectionStatus = 'disconnected';
      lastErrorMessage = `Aguardando live iniciar: @${cleanUsername} ainda não abriu transmissão ao vivo no TikTok. O servidor monitora e conectará automaticamente assim que a live abrir.`;
      console.log(`[TikTok LIVE] @${cleanUsername} está offline no momento. Monitorando...`);
      broadcastToClients({
        type: 'status',
        status: 'disconnected',
        username: cleanUsername,
        lastError: lastErrorMessage,
      });
      return {
        success: true,
        status: 'waiting',
        message: `Monitorando @${cleanUsername}: assim que você iniciar a live no TikTok, a conexão será ativada automaticamente!`,
      };
    }

    connectionStatus = 'error';
    lastErrorMessage = errorText;
    console.error(`[TikTok LIVE] Erro na conexão:`, errorText);
    broadcastToClients({
      type: 'status',
      status: 'error',
      username: cleanUsername,
      lastError: errorText,
    });
    return { success: false, message: errorText };
  } finally {
    isConnectingTikTok = false;
  }
}

// Connect to TikTok Live Endpoint
app.post('/api/tiktok/connect', async (req: Request, res: Response) => {
  const { username } = req.body;
  const targetUser = username && typeof username === 'string' && username.trim() ? username : 'leonardosutello';
  const result = await connectToTikTok(targetUser);
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(400).json({ error: result.message });
  }
});

// Disconnect from TikTok Live
app.post('/api/tiktok/disconnect', (_req: Request, res: Response) => {
  if (tiktokLiveConnection) {
    try {
      tiktokLiveConnection.disconnect();
    } catch (e) {}
    tiktokLiveConnection = null;
  }
  connectionStatus = 'disconnected';
  lastErrorMessage = '';
  broadcastToClients({
    type: 'status',
    status: 'disconnected',
    username: currentUsername,
  });
  res.json({ success: true, message: 'Desconectado com sucesso' });
});

// Test event trigger (for Live Nuvem tests)
app.post('/api/tiktok/test-event', (req: Request, res: Response) => {
  const { type, data } = req.body;
  if (type === 'gift') {
    const giftName = data?.giftName || 'Rosa';
    const repeatCount = data?.repeatCount || 1;
    const user = data?.uniqueId || '@testador_nuvem';
    const lower = giftName.toLowerCase();
    const leftName = serverState.leftCandidate.primaryGift.name.toLowerCase();

    if (lower.includes(leftName) || lower.includes('rosa')) {
      addVote('left', repeatCount, giftName, serverState.leftCandidate.primaryGift.icon, user);
    } else {
      addVote('right', repeatCount, giftName, serverState.rightCandidate.primaryGift.icon, user);
    }

    broadcastToClients({
      type: 'gift',
      uniqueId: user,
      giftName,
      repeatCount,
      diamondCount: data?.diamondCount || 1,
      timestamp: Date.now(),
    });
    return res.json({ success: true, message: 'Presente de teste enviado com sucesso!' });
  }

  if (type === 'chat') {
    const comment = data?.comment || '22';
    const user = data?.uniqueId || '@comentador_nuvem';
    addComment(comment, user);
    broadcastToClients({
      type: 'chat',
      uniqueId: user,
      comment,
      timestamp: Date.now(),
    });
    return res.json({ success: true, message: 'Comentário de teste enviado com sucesso!' });
  }

  res.status(400).json({ error: 'Tipo de evento de teste desconhecido' });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`Urna TikTok LIVE rodando em http://${HOST}:${PORT}`);

    // Carrega estado mais recente gravado no Firebase Firestore em segundo plano (sem bloquear abertura imediata da porta 3000)
    fetchCloudGameState()
      .then((cloudData) => {
        if (cloudData) {
          serverState = { ...serverState, ...cloudData };
          console.log('[Server] Estado restaurado do Firebase Firestore com sucesso! Placar:', serverState.victoryScore);
        }
      })
      .catch((e) => {
        console.warn('[Server] Falha ao carregar estado do Firestore na inicialização:', e?.message || e);
      });

    // Conexão inicial com delay seguro para estabilização do container
    setTimeout(() => {
      console.log(`[TikTok LIVE] Conectando automaticamente ao perfil fixo @${currentUsername}...`);
      connectToTikTok(currentUsername).catch(() => {});
    }, 4000);

    // Verificador contínuo: reconecta automaticamente assim que o streamer abrir a live no TikTok
    setInterval(() => {
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        connectToTikTok(currentUsername).catch(() => {});
      }
    }, 30000);

    // Auto keep-alive para Render.com (impede a instância gratuita de dormir)
    if (process.env.RENDER_EXTERNAL_URL) {
      const renderUrl = process.env.RENDER_EXTERNAL_URL;
      console.log(`[Render] Auto keep-alive ativado para ${renderUrl}`);
      setInterval(() => {
        fetch(`${renderUrl}/api/state`).catch(() => {});
      }, 8 * 60 * 1000);
    }
  });

  const cleanup = () => {
    if (tiktokLiveConnection) {
      try {
        tiktokLiveConnection.disconnect();
      } catch (e) {}
    }
    server.close();
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

startServer().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
});
