import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { TikTokLiveConnection } from 'tiktok-live-connector';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Carrega configuração do Firebase
let config;
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (e) {
  console.error('❌ Erro ao ler firebase-applet-config.json:', e.message);
  process.exit(1);
}

const db =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? getFirestore(fbApp, config.firestoreDatabaseId)
    : getFirestore(fbApp);

// 2. Define o usuário do TikTok (pode passar por argumento: node tiktok-bridge.js seu_usuario)
const targetUser = (process.argv[2] || 'leonardosutello').replace(/^@/, '').trim();

console.log('====================================================');
console.log('🗳️  PONTE TIKTOK LIVE -> FIREBASE FIRESTORE (VERCEL)');
console.log('====================================================');
console.log(`📡 Usuário TikTok: @${targetUser}`);
console.log(`☁️  Banco Firebase: ${config.firestoreDatabaseId}`);
console.log('Conectando ao TikTok...\n');

let serverState = null;

// Carrega estado atual
async function loadState() {
  try {
    const snap = await getDoc(doc(db, 'game_state', 'current'));
    if (snap.exists()) {
      serverState = snap.data();
    }
  } catch (e) {
    console.warn('Aviso ao carregar estado inicial do Firebase:', e.message);
  }
}

async function addVote(side, amount, giftName, giftIcon, username) {
  const user = username || '@fa_live';
  const isGift = Boolean(giftName && !giftName.includes('Comentário'));
  const actionText = `${giftName || 'Presente'} • +${amount} ponto${amount > 1 ? 's' : ''}`;

  console.log(`🗳️ VOTO: [${side.toUpperCase()}] +${amount} pontos de ${user} (${giftName || 'voto'})`);

  try {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const evtRef = doc(db, 'live_events', id);
    await setDoc(evtRef, {
      id,
      type: isGift ? 'gift' : 'vote',
      side,
      amount,
      giftName: giftName || '',
      giftIcon: giftIcon || '🎁',
      username: user,
      isEpic: amount >= 10,
      timestamp: Date.now(),
    });

    // Atualiza estado do jogo no Firebase
    if (serverState) {
      if (side === 'left') {
        serverState.leftPoints = (serverState.leftPoints || 0) + amount;
        serverState.lastLeftUser = user;
        serverState.lastLeftText = actionText;
      } else {
        serverState.rightPoints = (serverState.rightPoints || 0) + amount;
        serverState.lastRightUser = user;
        serverState.lastRightText = actionText;
      }
      serverState.updatedAt = Date.now();
      await setDoc(doc(db, 'game_state', 'current'), serverState, { merge: true });
    }
  } catch (err) {
    console.error('Erro ao gravar no Firebase:', err.message);
  }
}

async function startBridge() {
  await loadState();

  const conn = new TikTokLiveConnection(targetUser, {
    processInitialData: false,
    enableExtendedGiftInfo: true,
    clientParams: {
      app_language: 'pt-BR',
      device_platform: 'web',
    },
  });

  conn.on('connected', (state) => {
    console.log(`\n✅ CONECTADO COM SUCESSO NA LIVE DE @${targetUser}!`);
    console.log(`👥 Espectadores online: ${state?.roomInfo?.user_count || 0}`);
    console.log('Os presentes e votos aparecerão na sua tela da Vercel automaticamente!\n');
  });

  conn.on('disconnected', () => {
    console.log(`⚠️ Desconectado de @${targetUser}. Tentando reconectar em 10s...`);
    setTimeout(startBridge, 10000);
  });

  conn.on('streamEnd', () => {
    console.log(`🛑 Live de @${targetUser} finalizada pelo streamer.`);
  });

  conn.on('error', (err) => {
    console.error('Erro de conexão:', err?.message || err);
  });

  // Evento de presentes
  conn.on('gift', (data) => {
    if (data.giftType === 1 && !data.repeatEnd) return;
    const repeatCount = data.repeatCount || 1;
    const giftName = data.giftName || 'Presente';
    const user = data.uniqueId || data.nickname || '@fa_live';
    const lower = giftName.toLowerCase();

    // Determina lado
    if (lower.includes('rosa') || lower.includes('rose') || lower.includes('coração') || lower.includes('galáxia')) {
      addVote('left', repeatCount, giftName, '🌹', user);
    } else if (lower.includes('sorvete') || lower.includes('ice') || lower.includes('donut') || lower.includes('leão')) {
      addVote('right', repeatCount, giftName, '🍦', user);
    } else {
      const side = (serverState?.leftPoints || 0) <= (serverState?.rightPoints || 0) ? 'left' : 'right';
      addVote(side, repeatCount, giftName, '🎁', user);
    }
  });

  // Evento de chat
  let leftProgress = 0;
  let rightProgress = 0;

  conn.on('chat', (data) => {
    const text = (data.comment || '').trim();
    const user = data.uniqueId || data.nickname || '@usuario';

    if (text.includes('13') || text.toLowerCase().includes('lula')) {
      leftProgress++;
      console.log(`💬 Chat: ${user} comentou 13 (${leftProgress}/5)`);
      if (leftProgress >= 5) {
        leftProgress = 0;
        addVote('left', 1, '5 Comentários no Chat', '💬', user);
      }
    } else if (text.includes('22') || text.toLowerCase().includes('bolsonaro')) {
      rightProgress++;
      console.log(`💬 Chat: ${user} comentou 22 (${rightProgress}/5)`);
      if (rightProgress >= 5) {
        rightProgress = 0;
        addVote('right', 1, '5 Comentários no Chat', '💬', user);
      }
    }
  });

  try {
    await conn.connect();
  } catch (err) {
    console.warn(`⏳ @${targetUser} ainda não está ao vivo no TikTok. Aguardando a live abrir... (tentando novamente em 15s)`);
    setTimeout(startBridge, 15000);
  }
}

startBridge();
