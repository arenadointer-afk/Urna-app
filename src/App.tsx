import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Candidate,
  ChatMessage,
  BotSettings,
  StreamSettings,
  PresetDuel,
  VictoryScore,
  TikTokStatus,
} from './types';
import { PRESET_DUELS } from './utils/presets';
import { TopHeader } from './components/TopHeader';
import { UrnaMachine } from './components/UrnaMachine';
import { BottomLiveFeed } from './components/BottomLiveFeed';
import { VictoryModal } from './components/VictoryModal';
import { AdminPanel } from './components/AdminPanel';
import { PasswordModal } from './components/PasswordModal';
import { FloatingReactions, FloatingItem } from './components/FloatingReactions';
import { EpicGiftAlert, EpicGiftData } from './components/EpicGiftAlert';
import { ShareLinksModal } from './components/ShareLinksModal';
import {
  setSoundEnabled,
  playMusicTrack,
  setMusicVolume,
  initAudioContext,
  MusicTrackType,
} from './utils/audio';
import {
  getSavedCandidate,
  saveCandidate,
  getSavedRoundDuration,
  saveRoundDuration,
  getSavedVictoryScore,
  saveVictoryScore,
  getSavedPoints,
  savePoints,
  getSavedRoundNumber,
  saveRoundNumber,
  getSavedTikTokConfig,
  saveTikTokConfig,
  broadcastSync,
  subscribeToSync,
  TikTokConfig,
} from './utils/syncStorage';

const RANDOM_USERNAMES = [
  '@Mara',
  '@Lucimara',
  '@pedro_br22',
  '@mariaclara.ofc',
  '@gabriel_silva',
  '@luaninha_13',
  '@thiago_cwb',
  '@aninha_live',
  '@marcos_agro',
  '@renata_vendas',
  '@felipe_motos',
  '@carlos_eduardo',
  '@diego_tubarao',
  '@camila_tiktok',
];

export default function App() {
  // Preset & Candidates (Carregados da memória persistente)
  const [leftCandidate, setLeftCandidate] = useState<Candidate>(() => getSavedCandidate('left'));
  const [rightCandidate, setRightCandidate] = useState<Candidate>(() => getSavedCandidate('right'));

  // Game & Round State (Carregados da memória persistente)
  const [roundNumber, setRoundNumber] = useState<number>(() => getSavedRoundNumber(1));
  const [roundDuration, setRoundDuration] = useState<number>(() => getSavedRoundDuration(125));
  const [timeLeft, setTimeLeft] = useState<number>(() => getSavedRoundDuration(125));
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Placar Geral de Vitórias (Série - NUNCA ZERA ao atualizar a página)
  const [victoryScore, setVictoryScore] = useState<VictoryScore>(() => getSavedVictoryScore());

  // Points (Carregados da memória persistente para não zerar no refresh acidental)
  const savedPoints = getSavedPoints();
  const [leftPoints, setLeftPoints] = useState<number>(savedPoints.leftPoints);
  const [rightPoints, setRightPoints] = useState<number>(savedPoints.rightPoints);
  const [leftGiftsCount, setLeftGiftsCount] = useState<number>(savedPoints.leftGifts);
  const [rightGiftsCount, setRightGiftsCount] = useState<number>(savedPoints.rightGifts);

  // 5-comment rule: 5 comentários número 22 = 1 ponto | 5 comentários número 13 = 1 ponto
  const [leftCommentProgress, setLeftCommentProgress] = useState<number>(0);
  const [rightCommentProgress, setRightCommentProgress] = useState<number>(0);

  // Last Vote Tickers
  const [lastLeftUser, setLastLeftUser] = useState<string>('@Mara');
  const [lastLeftText, setLastLeftText] = useState<string>('Rosa x2 • +2 pontos');
  const [lastRightUser, setLastRightUser] = useState<string>('@Lucimara');
  const [lastRightText, setLastRightText] = useState<string>('Sorvete x2 • +2 pontos');

  // Round Over & Victory
  const [isRoundOver, setIsRoundOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<'left' | 'right' | 'draw' | null>(null);
  const [resetCountdown, setResetCountdown] = useState<number>(5);

  // Animation Triggers
  const [lastLeftVoteTimestamp, setLastLeftVoteTimestamp] = useState<number>(0);
  const [lastRightVoteTimestamp, setLastRightVoteTimestamp] = useState<number>(0);
  const [floatingItems, setFloatingItems] = useState<FloatingItem[]>([]);
  const [epicGift, setEpicGift] = useState<EpicGiftData | null>(null);

  // Live Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
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
  ]);

  // Admin & Modals
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isShareLinksOpen, setIsShareLinksOpen] = useState(false);
  const [isLiveOnlyMode, setIsLiveOnlyMode] = useState(false);
  const [hasInteractedAudio, setHasInteractedAudio] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<
    'first-live' | 'boosters' | 'candidates' | 'bot' | 'presets' | 'round' | 'cloud' | 'stream' | 'music'
  >('boosters');
  const [soundActive, setSoundActive] = useState(true);

  // Background Music State
  const [musicTrack, setMusicTrack] = useState<MusicTrackType>('off');
  const [musicVolumeState, setMusicVolumeState] = useState(0.5);

  // TikTok LIVE Ao Vivo & Testes de Nuvem State
  const savedTikTok = getSavedTikTokConfig();
  const [tiktokUsername, setTiktokUsername] = useState<string>(savedTikTok.username || '');
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatus>({
    status: 'disconnected',
    username: savedTikTok.username || '',
    viewers: 0,
    totalLikes: 0,
    lastError: '',
  });
  const [tiktokLogs, setTiktokLogs] = useState<Array<{ id: string; timestamp: number; type: 'gift' | 'chat' | 'status' | 'like'; text: string; user?: string }>>([]);

  const addTiktokLog = useCallback((type: 'gift' | 'chat' | 'status' | 'like', text: string, user?: string) => {
    setTiktokLogs((prev) => [
      { id: `${Date.now()}-${Math.random()}`, timestamp: Date.now(), type, text, user },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // Bot Settings
  const [botSettings, setBotSettings] = useState<BotSettings>({
    enabled: false,
    intensity: 'hype',
    bias: 'balanced',
    allowLargeGifts: true,
  });

  const [streamSettings, setStreamSettings] = useState<StreamSettings>({
    soundEnabled: true,
    soundVolume: 0.8,
    layoutMode: 'vertical_9_16',
    streamViewClean: true,
    chromaKey: 'none',
    autoRestartDelay: 5,
    showFloatingEmojis: true,
    showUrnaKeyboard: true,
    showCommentsChat: true,
  });

  // URL Mode Check on Load (?mode=live vs ?mode=admin)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (search.includes('mode=live') || search.includes('live=1') || hash === '#live') {
      setIsLiveOnlyMode(true);
    }
    if (search.includes('mode=admin') || search.includes('admin=1') || hash === '#admin') {
      setIsPasswordModalOpen(true);
    }
  }, []);

  // Atalho secreto: Tecla 'A' abre o modal de senha do ADM discretamente
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      if (e.key === 'a' || e.key === 'A') {
        setIsPasswordModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Salvar pontos persistentes no localStorage
  useEffect(() => {
    savePoints({ leftPoints, rightPoints, leftGifts: leftGiftsCount, rightGifts: rightGiftsCount });
  }, [leftPoints, rightPoints, leftGiftsCount, rightGiftsCount]);

  // Sincronização em tempo real entre abas (BroadcastChannel)
  useEffect(() => {
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === 'UPDATE_CANDIDATE') {
        if (msg.side === 'left') setLeftCandidate(msg.candidate);
        else setRightCandidate(msg.candidate);
      } else if (msg.type === 'UPDATE_ALL_CANDIDATES') {
        setLeftCandidate(msg.left);
        setRightCandidate(msg.right);
      } else if (msg.type === 'UPDATE_POINTS') {
        setLeftPoints(msg.leftPoints);
        setRightPoints(msg.rightPoints);
        setLeftGiftsCount(msg.leftGifts);
        setRightGiftsCount(msg.rightGifts);
      } else if (msg.type === 'UPDATE_TIME') {
        setTimeLeft(msg.timeLeft);
        setIsPaused(msg.isPaused);
        if (msg.roundDuration) setRoundDuration(msg.roundDuration);
      } else if (msg.type === 'UPDATE_VICTORY_SCORE') {
        setVictoryScore(msg.victoryScore);
      } else if (msg.type === 'UPDATE_ROUND_NUMBER') {
        setRoundNumber(msg.roundNumber);
      } else if (msg.type === 'UPDATE_BOT_SETTINGS') {
        setBotSettings(msg.botSettings);
      } else if (msg.type === 'UPDATE_STREAM_SETTINGS') {
        setStreamSettings(msg.streamSettings);
      } else if (msg.type === 'RESET_ROUND') {
        handleLocalRestartRound();
      }
    });

    return unsubscribe;
  }, []);

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    setStreamSettings((prev) => ({ ...prev, soundEnabled: next }));
  };

  const handleMusicChange = (track: MusicTrackType, customUrl?: string) => {
    setMusicTrack(track);
    playMusicTrack(track, customUrl);
  };

  const handleVolumeChange = (volume: number) => {
    setMusicVolumeState(volume);
    setMusicVolume(volume);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleActivateLiveAudio = () => {
    initAudioContext();
    setHasInteractedAudio(true);
    if (musicTrack !== 'off') {
      playMusicTrack(musicTrack);
    }
  };

  // Spawn floating reaction
  const spawnReaction = useCallback((emoji: string, side: 'left' | 'right') => {
    const id = Date.now() + Math.random();
    const leftPercent =
      side === 'left' ? 12 + Math.random() * 28 : 58 + Math.random() * 28;
    const size = 22 + Math.random() * 16;

    setFloatingItems((prev) => [
      ...prev.slice(-15),
      { id, emoji, leftPercent, size, color: side === 'left' ? '#3b82f6' : '#ef4444' },
    ]);

    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  // Main Vote Handler
  const handleVote = useCallback(
    (
      side: 'left' | 'right',
      amount: number,
      giftName?: string,
      giftIcon?: string,
      username?: string
    ) => {
      if (isRoundOver) return;

      const user = username || RANDOM_USERNAMES[Math.floor(Math.random() * RANDOM_USERNAMES.length)];
      const isGift = Boolean(giftName && giftName !== 'Manual' && !giftName.includes('Comentário'));
      const actionText = isGift
        ? `${giftName || 'Presente'} • +${amount} pontos`
        : `${giftName || 'Voto'} • +${amount} ponto`;

      if (side === 'left') {
        setLeftPoints((prev) => {
          const next = prev + amount;
          broadcastSync({
            type: 'UPDATE_POINTS',
            leftPoints: next,
            rightPoints,
            leftGifts: leftGiftsCount + (isGift ? (amount > 1 ? amount : 1) : 0),
            rightGifts: rightGiftsCount,
          });
          return next;
        });
        if (isGift) setLeftGiftsCount((prev) => prev + (amount > 1 ? amount : 1));
        setLastLeftVoteTimestamp(Date.now());
        setLastLeftUser(user);
        setLastLeftText(actionText);
        spawnReaction(giftIcon || leftCandidate.primaryGift.icon, 'left');
      } else {
        setRightPoints((prev) => {
          const next = prev + amount;
          broadcastSync({
            type: 'UPDATE_POINTS',
            leftPoints,
            rightPoints: next,
            leftGifts: leftGiftsCount,
            rightGifts: rightGiftsCount + (isGift ? (amount > 1 ? amount : 1) : 0),
          });
          return next;
        });
        if (isGift) setRightGiftsCount((prev) => prev + (amount > 1 ? amount : 1));
        setLastRightVoteTimestamp(Date.now());
        setLastRightUser(user);
        setLastRightText(actionText);
        spawnReaction(giftIcon || rightCandidate.primaryGift.icon, 'right');
      }

      // Check for Mega Gift blast (points >= 10: e.g. Donut +10, Lion +100)
      if (amount >= 10) {
        setEpicGift({
          id: Date.now(),
          username: user,
          giftName: giftName || 'Super Presente',
          giftIcon: giftIcon || (side === 'left' ? '🦁' : '🌌'),
          points: amount,
          candidateNumber: side === 'left' ? leftCandidate.number : rightCandidate.number,
          candidateName: side === 'left' ? leftCandidate.name : rightCandidate.name,
          side,
        });
      }

      // Add to Chat Feed
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        username: user,
        avatar: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 500)}?w=100&auto=format&fit=crop&q=80`,
        text: isGift
          ? `${giftName} (+${amount} pontos)`
          : `${side === 'left' ? leftCandidate.number : rightCandidate.number}`,
        side,
        timestamp: Date.now(),
        isGift,
        giftIcon,
        points: amount,
      };

      setChatMessages((prev) => [...prev.slice(-20), newMsg]);
    },
    [isRoundOver, leftCandidate, rightCandidate, leftPoints, rightPoints, leftGiftsCount, rightGiftsCount, spawnReaction]
  );

  // Manual Chat Message: 5 comments with number = +1 point!
  const handleUserChatMessage = useCallback(
    (text: string, customAuthor?: string) => {
      const trimmed = text.trim();
      const author = customAuthor || '@Voce';
      const hasLeft =
        trimmed.includes(leftCandidate.number) ||
        trimmed.toLowerCase().includes(leftCandidate.name.split(' ')[0].toLowerCase());
      const hasRight =
        trimmed.includes(rightCandidate.number) ||
        trimmed.toLowerCase().includes(rightCandidate.name.split(' ')[0].toLowerCase());

      if (hasLeft) {
        setLeftCommentProgress((prev) => {
          const next = prev + 1;
          if (next >= 5) {
            handleVote('left', 1, '5 Comentários no Chat', '💬', author);
            return 0;
          }
          setChatMessages((c) => [
            ...c.slice(-20),
            {
              id: `cmt-${Date.now()}-${Math.random()}`,
              username: author,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              text: `${leftCandidate.number} (${next}/5 p/ +1 ponto)`,
              side: 'left',
              timestamp: Date.now(),
            },
          ]);
          return next;
        });
      } else if (hasRight) {
        setRightCommentProgress((prev) => {
          const next = prev + 1;
          if (next >= 5) {
            handleVote('right', 1, '5 Comentários no Chat', '💬', author);
            return 0;
          }
          setChatMessages((c) => [
            ...c.slice(-20),
            {
              id: `cmt-${Date.now()}-${Math.random()}`,
              username: author,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              text: `${rightCandidate.number} (${next}/5 p/ +1 ponto)`,
              side: 'right',
              timestamp: Date.now(),
            },
          ]);
          return next;
        });
      } else {
        setChatMessages((prev) => [
          ...prev.slice(-20),
          {
            id: `msg-${Date.now()}-${Math.random()}`,
            username: author,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            text: trimmed,
            side: 'neutral',
            timestamp: Date.now(),
          },
        ]);
      }
    },
    [leftCandidate, rightCandidate, handleVote]
  );

  // Conexão em tempo real com o backend SSE para TikTok LIVE Ao Vivo e testes da nuvem
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/tiktok/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setTiktokStatus({
              status: data.status,
              username: data.username,
              viewers: data.viewers || 0,
              totalLikes: data.totalLikes || 0,
              lastError: data.lastError || '',
            });
            addTiktokLog(
              'status',
              `TikTok LIVE: ${data.status} ${data.lastError ? `(${data.lastError})` : ''}`
            );
          } else if (data.type === 'chat') {
            const comment = String(data.comment || '').trim();
            handleUserChatMessage(comment, data.uniqueId);
            addTiktokLog('chat', `[Chat] ${data.uniqueId}: ${comment}`, data.uniqueId);
          } else if (data.type === 'gift') {
            const giftName = String(data.giftName || 'Presente').toLowerCase();
            const repeatCount = Number(data.repeatCount || 1);
            const diamondCount = Number(data.diamondCount || 1);
            const user = data.uniqueId || '@fa_tiktok';

            const leftGift = leftCandidate.primaryGift.name.toLowerCase();
            const rightGift = rightCandidate.primaryGift.name.toLowerCase();

            if (giftName.includes(leftGift) || giftName.includes('rosa') || giftName.includes('rose')) {
              handleVote('left', repeatCount, data.giftName, leftCandidate.primaryGift.icon, user);
            } else if (
              giftName.includes(rightGift) ||
              giftName.includes('sorvete') ||
              giftName.includes('ice cream')
            ) {
              handleVote('right', repeatCount, data.giftName, rightCandidate.primaryGift.icon, user);
            } else if (
              diamondCount >= 10 ||
              giftName.includes('leão') ||
              giftName.includes('lion') ||
              giftName.includes('galáxia') ||
              giftName.includes('galaxy')
            ) {
              // Super presente épico na live!
              const targetSide: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
              handleVote(
                targetSide,
                diamondCount >= 50 ? 100 : diamondCount,
                data.giftName,
                '🦁',
                user
              );
            } else {
              // Presente genérico
              const side: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
              handleVote(
                side,
                repeatCount,
                data.giftName,
                side === 'left' ? leftCandidate.primaryGift.icon : rightCandidate.primaryGift.icon,
                user
              );
            }

            addTiktokLog(
              'gift',
              `🎁 ${user} mandou ${repeatCount}x ${data.giftName} (${diamondCount} diamantes)`,
              user
            );
          } else if (data.type === 'like') {
            setTiktokStatus((prev) => ({
              ...prev,
              totalLikes: data.totalLikes || prev.totalLikes + (data.likeCount || 1),
            }));
            spawnReaction('❤️', Math.random() > 0.5 ? 'left' : 'right');
          }
        } catch (e) {
          console.error('Erro ao processar mensagem do SSE', e);
        }
      };
    } catch (e) {
      console.warn('SSE EventSource não suportado no ambiente', e);
    }

    return () => {
      eventSource?.close();
    };
  }, [leftCandidate, rightCandidate, handleVote, handleUserChatMessage, addTiktokLog, spawnReaction]);

  // Sair do Zero & Fake Booster Handlers
  const handleInjectVotes = (
    side: 'left' | 'right' | 'both',
    amount: number,
    isGift = false,
    giftName?: string
  ) => {
    if (side === 'both') {
      handleVote('left', amount, 'Rosa x1', '🌹', '@impulso');
      handleVote('right', amount, 'Sorvete x1', '🍦', '@impulso');
    } else if (side === 'left') {
      handleVote('left', amount, giftName || 'Rosa', '🌹', '@Mara');
    } else {
      handleVote('right', amount, giftName || 'Sorvete', '🍦', '@Lucimara');
    }
  };

  // Make Clutch
  const handleMakeClutch = () => {
    if (leftPoints >= rightPoints) {
      const nextRight = Math.max(1, leftPoints - 1);
      setRightPoints(nextRight);
      broadcastSync({
        type: 'UPDATE_POINTS',
        leftPoints,
        rightPoints: nextRight,
        leftGifts: leftGiftsCount,
        rightGifts: rightGiftsCount,
      });
    } else {
      const nextLeft = Math.max(1, rightPoints - 1);
      setLeftPoints(nextLeft);
      broadcastSync({
        type: 'UPDATE_POINTS',
        leftPoints: nextLeft,
        rightPoints,
        leftGifts: leftGiftsCount,
        rightGifts: rightGiftsCount,
      });
    }
  };

  // Atualizar Candidato (com persistência e broadcast instantâneo)
  const handleUpdateCandidate = (side: 'left' | 'right', candidate: Candidate) => {
    if (side === 'left') {
      setLeftCandidate(candidate);
      saveCandidate('left', candidate);
    } else {
      setRightCandidate(candidate);
      saveCandidate('right', candidate);
    }
    broadcastSync({ type: 'UPDATE_CANDIDATE', side, candidate });
  };

  // Preset Selection
  const handleSelectPreset = (preset: PresetDuel) => {
    setLeftCandidate(preset.left);
    setRightCandidate(preset.right);
    saveCandidate('left', preset.left);
    saveCandidate('right', preset.right);
    broadcastSync({ type: 'UPDATE_ALL_CANDIDATES', left: preset.left, right: preset.right });
    setLeftPoints(0);
    setRightPoints(0);
    setLeftGiftsCount(0);
    setRightGiftsCount(0);
    setTimeLeft(roundDuration);
    savePoints({ leftPoints: 0, rightPoints: 0, leftGifts: 0, rightGifts: 0 });
    broadcastSync({
      type: 'UPDATE_POINTS',
      leftPoints: 0,
      rightPoints: 0,
      leftGifts: 0,
      rightGifts: 0,
    });
  };

  // Local Restart Round
  const handleLocalRestartRound = () => {
    setIsRoundOver(false);
    setTimeLeft(roundDuration);
    setLeftPoints(0);
    setRightPoints(0);
    setLeftGiftsCount(0);
    setRightGiftsCount(0);
    setWinner(null);
    savePoints({ leftPoints: 0, rightPoints: 0, leftGifts: 0, rightGifts: 0 });
  };

  // Restart Round
  const handleRestartRound = () => {
    handleLocalRestartRound();
    broadcastSync({ type: 'RESET_ROUND' });
  };

  const handleForceNextRound = () => {
    const nextR = roundNumber + 1;
    setRoundNumber(nextR);
    saveRoundNumber(nextR);
    broadcastSync({ type: 'UPDATE_ROUND_NUMBER', roundNumber: nextR });
    handleRestartRound();
  };

  // Atualizar Duração da Rodada
  const handleChangeRoundDuration = (d: number) => {
    setRoundDuration(d);
    setTimeLeft(d);
    saveRoundDuration(d);
    broadcastSync({ type: 'UPDATE_TIME', timeLeft: d, isPaused, roundDuration: d });
  };

  // Pausar / Continuar
  const handleTogglePause = () => {
    setIsPaused((p) => {
      const next = !p;
      broadcastSync({ type: 'UPDATE_TIME', timeLeft, isPaused: next });
      return next;
    });
  };

  // Atualizar e Zerar Placar Geral de Vitórias
  const handleUpdateVictoryScore = (newScore: VictoryScore) => {
    setVictoryScore(newScore);
    saveVictoryScore(newScore);
    broadcastSync({ type: 'UPDATE_VICTORY_SCORE', victoryScore: newScore });
  };

  const handleResetVictoryScore = () => {
    const confirmed = window.confirm(
      'Deseja realmente zerar o placar geral de vitórias da série?'
    );
    if (confirmed) {
      const zero = { left: 0, right: 0 };
      setVictoryScore(zero);
      saveVictoryScore(zero);
      broadcastSync({ type: 'UPDATE_VICTORY_SCORE', victoryScore: zero });
    }
  };

  // TikTok LIVE Backend Actions
  const handleUpdateTikTokUsername = (u: string) => {
    setTiktokUsername(u);
    saveTikTokConfig({ ...savedTikTok, username: u });
  };

  const handleConnectTikTok = async (targetUser: string) => {
    const clean = targetUser.replace(/^@/, '').trim();
    if (!clean) return;
    setTiktokUsername(clean);
    saveTikTokConfig({ ...savedTikTok, username: clean });
    try {
      const res = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTiktokStatus((prev) => ({
          ...prev,
          status: 'error',
          lastError: data.error || 'Erro ao conectar ao TikTok',
        }));
      }
    } catch (err: any) {
      setTiktokStatus((prev) => ({
        ...prev,
        status: 'error',
        lastError: err?.message || 'Falha de comunicação com o servidor',
      }));
    }
  };

  const handleDisconnectTikTok = async () => {
    try {
      await fetch('/api/tiktok/disconnect', { method: 'POST' });
    } catch (e) {}
    setTiktokStatus((prev) => ({ ...prev, status: 'disconnected', lastError: '' }));
  };

  const handleSendTestTikTokEvent = async (type: 'gift' | 'chat', data: any) => {
    try {
      await fetch('/api/tiktok/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });
    } catch (e) {
      console.error('Falha ao enviar evento de teste da nuvem', e);
    }
  };

  // Round Timer Countdown Loop: Atualiza Placar Geral de Vitórias ao Acabar
  useEffect(() => {
    if (isPaused || isRoundOver) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRoundOver(true);
          const currentWinner =
            leftPoints > rightPoints ? 'left' : rightPoints > leftPoints ? 'right' : 'draw';
          setWinner(currentWinner);
          setResetCountdown(streamSettings.autoRestartDelay || 5);

          // ATUALIZA O PLACAR GERAL DE VITÓRIAS (1x0, 2x1, ETC.) GRAVADO NA MEMÓRIA
          if (currentWinner === 'left') {
            setVictoryScore((prevScore) => {
              const next = { ...prevScore, left: prevScore.left + 1 };
              saveVictoryScore(next);
              broadcastSync({ type: 'UPDATE_VICTORY_SCORE', victoryScore: next });
              return next;
            });
          } else if (currentWinner === 'right') {
            setVictoryScore((prevScore) => {
              const next = { ...prevScore, right: prevScore.right + 1 };
              saveVictoryScore(next);
              broadcastSync({ type: 'UPDATE_VICTORY_SCORE', victoryScore: next });
              return next;
            });
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isRoundOver, leftPoints, rightPoints, streamSettings.autoRestartDelay]);

  // Round Over auto-restart loop
  useEffect(() => {
    if (!isRoundOver) return;

    const timer = setInterval(() => {
      setResetCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const nextR = roundNumber + 1;
          setRoundNumber(nextR);
          saveRoundNumber(nextR);
          broadcastSync({ type: 'UPDATE_ROUND_NUMBER', roundNumber: nextR });
          handleRestartRound();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRoundOver, roundNumber]);

  // Ghost Bot Engine (ONLY RUNS IF BOT IS EXPLICITLY TURNED ON BY STREAMER)
  useEffect(() => {
    if (!botSettings.enabled || isRoundOver || isPaused) return;

    let intervalTime = 2200;
    if (botSettings.intensity === 'chill') intervalTime = 4500;
    if (botSettings.intensity === 'normal') intervalTime = 2400;
    if (botSettings.intensity === 'hype') intervalTime = 1200;
    if (botSettings.intensity === 'viral') intervalTime = 600;

    const botInterval = setInterval(() => {
      let targetSide: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';

      if (botSettings.bias === 'favor_left') {
        targetSide = Math.random() < 0.65 ? 'left' : 'right';
      } else if (botSettings.bias === 'favor_right') {
        targetSide = Math.random() < 0.65 ? 'right' : 'left';
      } else if (botSettings.bias === 'clutch') {
        targetSide = leftPoints < rightPoints ? 'left' : 'right';
      }

      const user = RANDOM_USERNAMES[Math.floor(Math.random() * RANDOM_USERNAMES.length)];
      const isGift = Math.random() < 0.55;

      if (isGift) {
        const giftCount = Math.random() < 0.2 ? (Math.random() < 0.5 ? 2 : 5) : 1;
        const giftName = targetSide === 'left' ? leftCandidate.primaryGift.name : rightCandidate.primaryGift.name;
        const giftIcon = targetSide === 'left' ? leftCandidate.primaryGift.icon : rightCandidate.primaryGift.icon;
        handleVote(targetSide, giftCount, `${giftName} x${giftCount}`, giftIcon, user);
      } else {
        // Simulated comment
        if (targetSide === 'left') {
          setLeftCommentProgress((p) => {
            const next = p + 1;
            if (next >= 5) {
              handleVote('left', 1, '5 Comentários no Chat', '💬', user);
              return 0;
            }
            return next;
          });
        } else {
          setRightCommentProgress((p) => {
            const next = p + 1;
            if (next >= 5) {
              handleVote('right', 1, '5 Comentários no Chat', '💬', user);
              return 0;
            }
            return next;
          });
        }
      }
    }, intervalTime);

    return () => clearInterval(botInterval);
  }, [botSettings, isRoundOver, isPaused, leftPoints, rightPoints, leftCandidate, rightCandidate, handleVote]);

  // Percentage calculation
  const total = leftPoints + rightPoints;
  const leftPct = total > 0 ? (leftPoints / total) * 100 : 50;
  const rightPct = 100 - leftPct;

  return (
    <div
      onClick={() => {
        if (!hasInteractedAudio) handleActivateLiveAudio();
      }}
      className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col justify-between items-center bg-gradient-to-b from-[#0b101e] via-[#0d1424] to-[#070b14] text-white select-none relative"
    >
      {/* Floating Reactions across screen */}
      <FloatingReactions items={floatingItems} />

      {/* Epic Mega Gift Celebration Banner */}
      <EpicGiftAlert gift={epicGift} onDismiss={() => setEpicGift(null)} />

      {/* Unobtrusive Audio Activator Banner if Browser requires tap */}
      {!hasInteractedAudio && isLiveOnlyMode && (
        <div
          onClick={handleActivateLiveAudio}
          className="absolute top-1 z-40 px-3 py-1 rounded-full bg-amber-500 text-zinc-950 font-black text-[10px] animate-bounce shadow-xl cursor-pointer border border-yellow-300"
        >
          🔊 Toque na tela para ativar o som e trilha sonora da Live!
        </div>
      )}

      {/* 1. TOP HEADER (ELEIÇÕES 2026 INTERATIVO + PLACAR GERAL DE VITÓRIAS + TIMER + ROSES + STATUS PILLS) */}
      <TopHeader
        leftCandidate={leftCandidate}
        rightCandidate={rightCandidate}
        leftPoints={leftPoints}
        rightPoints={rightPoints}
        timeLeft={timeLeft}
        onOpenAdmin={() => setIsPasswordModalOpen(true)}
        victoryScore={victoryScore}
        roundNumber={roundNumber}
      />

      {/* 2. CENTER SECTION: DUAL COLUMNS (SCOREBOARDS + URNAS + WOODEN DESK) */}
      <main className="w-full max-w-md flex-1 flex flex-row items-center justify-center gap-2 sm:gap-3 px-2 my-auto overflow-hidden">
        {/* Left Urna Column */}
        <UrnaMachine
          candidate={leftCandidate}
          points={leftPoints}
          giftsCount={leftGiftsCount}
          percentage={leftPct}
          commentCount={leftCommentProgress}
          isLeading={leftPoints > rightPoints}
          isRoundOver={isRoundOver}
          onVote={handleVote}
          lastVoteTimestamp={lastLeftVoteTimestamp}
          lastVoteUser={lastLeftUser}
          lastVoteText={lastLeftText}
        />

        {/* Right Urna Column */}
        <UrnaMachine
          candidate={rightCandidate}
          points={rightPoints}
          giftsCount={rightGiftsCount}
          percentage={rightPct}
          commentCount={rightCommentProgress}
          isLeading={rightPoints > leftPoints}
          isRoundOver={isRoundOver}
          onVote={handleVote}
          lastVoteTimestamp={lastRightVoteTimestamp}
          lastVoteUser={lastRightUser}
          lastVoteText={lastRightText}
        />
      </main>

      {/* 3. BOTTOM SECTION: CLEAN LIVE CHAT & 5-COMMENT RULE PROGRESS */}
      <BottomLiveFeed
        messages={chatMessages}
        leftCandidate={leftCandidate}
        rightCandidate={rightCandidate}
        leftCommentProgress={leftCommentProgress}
        rightCommentProgress={rightCommentProgress}
        onSendChatMessage={handleUserChatMessage}
        onRequestAdmin={() => setIsPasswordModalOpen(true)}
        onToggleFullscreen={toggleFullscreen}
        isLiveOnlyMode={isLiveOnlyMode}
      />

      {/* Password Modal (Protegido por senha: 851985) */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setIsPasswordModalOpen(false);
          setIsAdminOpen(true);
        }}
      />

      {/* Share Links Modal (Público vs ADM) */}
      <ShareLinksModal
        isOpen={isShareLinksOpen}
        onClose={() => setIsShareLinksOpen(false)}
      />

      {/* Victory Celebration Modal com Placar Geral da Série */}
      {isRoundOver && winner && (
        <VictoryModal
          winner={winner}
          leftCandidate={leftCandidate}
          rightCandidate={rightCandidate}
          leftPoints={leftPoints}
          rightPoints={rightPoints}
          roundNumber={roundNumber}
          resetCountdown={resetCountdown}
          onForceNextRound={handleForceNextRound}
          victoryScore={victoryScore}
        />
      )}

      {/* Full Admin Panel Drawer (Protected by Password 851985) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        leftCandidate={leftCandidate}
        rightCandidate={rightCandidate}
        onUpdateCandidate={handleUpdateCandidate}
        onSelectPreset={handleSelectPreset}
        roundDuration={roundDuration}
        onChangeRoundDuration={handleChangeRoundDuration}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onRestartRound={handleRestartRound}
        onInjectVotes={handleInjectVotes}
        onMakeClutch={handleMakeClutch}
        botSettings={botSettings}
        onUpdateBotSettings={(s) => {
          setBotSettings((prev) => {
            const next = { ...prev, ...s };
            broadcastSync({ type: 'UPDATE_BOT_SETTINGS', botSettings: next });
            return next;
          });
        }}
        streamSettings={streamSettings}
        onUpdateStreamSettings={(s) => {
          setStreamSettings((prev) => {
            const next = { ...prev, ...s };
            broadcastSync({ type: 'UPDATE_STREAM_SETTINGS', streamSettings: next });
            return next;
          });
        }}
        musicTrack={musicTrack}
        onChangeMusicTrack={handleMusicChange}
        musicVolume={musicVolumeState}
        onChangeMusicVolume={handleVolumeChange}
        initialTab={adminInitialTab}
        victoryScore={victoryScore}
        onUpdateVictoryScore={handleUpdateVictoryScore}
        onResetVictoryScore={handleResetVictoryScore}
        tiktokStatus={tiktokStatus}
        tiktokUsername={tiktokUsername}
        onChangeTikTokUsername={handleUpdateTikTokUsername}
        onConnectTikTok={handleConnectTikTok}
        onDisconnectTikTok={handleDisconnectTikTok}
        onSendTestTikTokEvent={handleSendTestTikTokEvent}
        tiktokLogs={tiktokLogs}
      />
    </div>
  );
}
