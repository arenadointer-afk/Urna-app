import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createRequire } from 'module';
import path from 'path';
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

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// In-memory TikTok connection state
let tiktokLiveConnection: any = null;
let currentUsername = '';
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
let viewersCount = 0;
let totalLikesCount = 0;
let lastErrorMessage = '';

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

// SSE stream for real-time live events to frontend tabs
app.get('/api/tiktok/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.push(res);

  // Send initial status
  res.write(
    `data: ${JSON.stringify({
      type: 'status',
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

// Connect to TikTok Live
app.post('/api/tiktok/connect', async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Nome de usuário inválido' });
  }

  const cleanUsername = username.replace(/^@/, '').trim();
  if (!cleanUsername) {
    return res.status(400).json({ error: 'Nome de usuário vazio' });
  }

  // Disconnect existing if any
  if (tiktokLiveConnection) {
    try {
      tiktokLiveConnection.disconnect();
    } catch (e) {}
    tiktokLiveConnection = null;
  }

  currentUsername = cleanUsername;
  connectionStatus = 'connecting';
  lastErrorMessage = '';
  viewersCount = 0;
  totalLikesCount = 0;

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
    tiktokLiveConnection = new TikTokLiveConnectionClass(cleanUsername, {
      processInitialData: false,
      enableExtendedGiftInfo: true,
      requestPollingIntervalMs: 1000,
      clientParams: {
        app_language: 'pt-BR',
        device_platform: 'web',
      },
    });

    tiktokLiveConnection.on('connected', (state: any) => {
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

    tiktokLiveConnection.on('disconnected', () => {
      connectionStatus = 'disconnected';
      console.log(`[TikTok LIVE] Desconectado de @${cleanUsername}`);
      broadcastToClients({
        type: 'status',
        status: 'disconnected',
        username: cleanUsername,
      });
    });

    tiktokLiveConnection.on('streamEnd', () => {
      connectionStatus = 'disconnected';
      lastErrorMessage = 'A transmissão do TikTok foi encerrada pelo streamer.';
      console.log(`[TikTok LIVE] Live encerrada de @${cleanUsername}`);
      broadcastToClients({
        type: 'status',
        status: 'disconnected',
        username: cleanUsername,
        lastError: lastErrorMessage,
      });
    });

    tiktokLiveConnection.on('error', (err: any) => {
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

    // Chat comment event
    tiktokLiveConnection.on('chat', (data: any) => {
      broadcastToClients({
        type: 'chat',
        uniqueId: data.uniqueId || data.nickname || '@usuario',
        nickname: data.nickname || data.uniqueId || 'Espectador',
        comment: data.comment || '',
        profilePictureUrl: data.profilePictureUrl || '',
        timestamp: Date.now(),
      });
    });

    // Gift event
    tiktokLiveConnection.on('gift', (data: any) => {
      // Repeat gifts handling: giftType 1 has repeats
      if (data.giftType === 1 && !data.repeatEnd) {
        return;
      }
      const repeatCount = data.repeatCount || 1;
      const diamondCount = (data.diamondCount || 1) * repeatCount;
      broadcastToClients({
        type: 'gift',
        uniqueId: data.uniqueId || data.nickname || '@usuario',
        nickname: data.nickname || data.uniqueId || 'Espectador',
        giftName: data.giftName || 'Presente',
        repeatCount,
        diamondCount,
        giftPictureUrl: data.giftPictureUrl || '',
        timestamp: Date.now(),
      });
    });

    // Likes event
    tiktokLiveConnection.on('like', (data: any) => {
      totalLikesCount = data.totalLikes || totalLikesCount + (data.likeCount || 1);
      broadcastToClients({
        type: 'like',
        likeCount: data.likeCount || 1,
        totalLikes: totalLikesCount,
        uniqueId: data.uniqueId || '@usuario',
      });
    });

    // Room user count updates
    tiktokLiveConnection.on('roomUser', (data: any) => {
      if (data.viewerCount) {
        viewersCount = data.viewerCount;
      }
    });

    await tiktokLiveConnection.connect();
    return res.json({ success: true, message: `Conectando à live de @${cleanUsername}...` });
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
    return res.status(500).json({ error: errorText });
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

// Test event trigger (for Live Nuvem tests without requiring an active TikTok live)
app.post('/api/tiktok/test-event', (req: Request, res: Response) => {
  const { type, data } = req.body;
  if (type === 'gift') {
    broadcastToClients({
      type: 'gift',
      uniqueId: data?.uniqueId || '@test_fan',
      nickname: data?.nickname || 'Testador Nuvem',
      giftName: data?.giftName || 'Rosa',
      repeatCount: data?.repeatCount || 1,
      diamondCount: data?.diamondCount || 1,
      giftPictureUrl: data?.giftPictureUrl || '',
      timestamp: Date.now(),
    });
    return res.json({ success: true, message: 'Presente de teste enviado!' });
  }

  if (type === 'chat') {
    broadcastToClients({
      type: 'chat',
      uniqueId: data?.uniqueId || '@test_fan',
      nickname: data?.nickname || 'Testador Nuvem',
      comment: data?.comment || '22',
      profilePictureUrl: data?.profilePictureUrl || '',
      timestamp: Date.now(),
    });
    return res.json({ success: true, message: 'Comentário de teste enviado!' });
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
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
});
