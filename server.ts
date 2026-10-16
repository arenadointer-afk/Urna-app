import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let TikTokLiveConnectionClass: any = null;
try {
  const tlc = require('tiktok-live-connector');
  TikTokLiveConnectionClass = tlc.TikTokLiveConnection || tlc.WebcastPushConnection || tlc.default || tlc;
} catch (e) {
  console.warn('tiktok-live-connector import error:', e);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, 'server_state.json');

const app = express();
const PORT = 3000;
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
  chatMessages: [
    {
      id: 'm1',
      username: '@Lucimara',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      text: 'Sorvete (+1 ponto)',
      side: 'right',
      timestamp: Date.now() - 4000,
      isGift: true,
      giftIcon: '🍦',
      points: 1,
    },
    {
      id: 'm2',
      username: '@Mara',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      text: 'Rosa (+1 ponto)',
      side: 'left',
      timestamp: Date.now() - 2000,
      isGift: true,
      giftIcon: '🌹',
      points: 1,
    },
  ],
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

// Persist state to disk safely
let saveTimeout: any = null;
function saveStateToDisk() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(serverState, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Server] Erro ao salvar estado no disco:', e);
    }
  }, 500);
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
  username?: string
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

  broadcastToClients({
    type: 'VOTE_TRIGGER',
    side,
    amount,
    giftName,
    giftIcon: newMsg.giftIcon,
    username: user,
    isEpic: amount >= 10,
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

  broadcastToClients({
    type: 'CHAT_TRIGGER',
    state: serverState,
  });
}

// Server clock tick loop (Synchronized timer across all viewers and OBS)
setInterval(() => {
  if (serverState.isPaused) return;

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
  saveStateToDisk();
  broadcastToClients({
    type: 'STATE_SYNC',
    state: serverState,
  });
  res.json({ success: true, victoryScore: serverState.victoryScore });
});

// 9. Vote Trigger
app.post('/api/vote', (req: Request, res: Response) => {
  const { side, amount, giftName, giftIcon, username } = req.body;
  if (side === 'left' || side === 'right') {
    addVote(side, amount || 1, giftName, giftIcon, username);
    return res.json({ success: true, state: serverState });
  }
  res.status(400).json({ error: 'Lado inválido' });
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

// Reusable TikTok Live Connection Handler
async function connectToTikTok(targetUsername: string = 'leonardosutello'): Promise<{ success: boolean; message: string }> {
  const cleanUsername = (targetUsername || 'leonardosutello').replace(/^@/, '').trim();
  if (!cleanUsername) {
    return { success: false, message: 'Nome de usuário vazio' };
  }

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
    if (!TikTokLiveConnectionClass) {
      throw new Error('Módulo TikTokLiveConnection não encontrado no servidor');
    }

    const conn = new TikTokLiveConnectionClass(cleanUsername, {
      processInitialData: false,
      enableExtendedGiftInfo: true,
      requestPollingIntervalMs: 1000,
      clientParams: {
        app_language: 'pt-BR',
        device_platform: 'web',
      },
    });

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

      const leftGiftName = serverState.leftCandidate.primaryGift.name.toLowerCase();
      const rightGiftName = serverState.rightCandidate.primaryGift.name.toLowerCase();
      const lowerGift = giftName.toLowerCase();

      if (lowerGift.includes(leftGiftName) || lowerGift.includes('rosa') || lowerGift.includes('rose')) {
        addVote('left', repeatCount, giftName, serverState.leftCandidate.primaryGift.icon, user);
      } else if (lowerGift.includes(rightGiftName) || lowerGift.includes('sorvete') || lowerGift.includes('ice cream')) {
        addVote('right', repeatCount, giftName, serverState.rightCandidate.primaryGift.icon, user);
      } else if (diamondCount >= 10 || lowerGift.includes('leão') || lowerGift.includes('lion') || lowerGift.includes('galáxia')) {
        const side = Math.random() > 0.5 ? 'left' : 'right';
        addVote(side, diamondCount >= 50 ? 100 : diamondCount, giftName, '🦁', user);
      } else {
        const side = Math.random() > 0.5 ? 'left' : 'right';
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
    connectionStatus = 'error';
    lastErrorMessage = errorText;
    broadcastToClients({
      type: 'status',
      status: 'error',
      username: cleanUsername,
      lastError: errorText,
    });
    return { success: false, message: errorText };
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
    return res.status(500).json({ error: result.message });
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
        host: HOST,
        port: PORT,
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

  app.listen(PORT, HOST, () => {
    console.log(`Urna TikTok LIVE rodando em http://${HOST}:${PORT}`);

    // Conexão automática inicial ao perfil fixo @leonardosutello
    setTimeout(() => {
      console.log(`[TikTok LIVE] Conectando automaticamente ao perfil fixo @${currentUsername}...`);
      connectToTikTok(currentUsername).catch(() => {});
    }, 2000);

    // Verificador contínuo: reconecta automaticamente assim que o streamer abrir a live no TikTok
    setInterval(() => {
      if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
        connectToTikTok(currentUsername).catch(() => {});
      }
    }, 25000);
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
});
