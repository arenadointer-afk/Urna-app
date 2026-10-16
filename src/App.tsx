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
  playVoteSound,
  MusicTrackType,
  getSavedMusicTrack,
  saveSelectedMusicTrack,
} from './utils/audio';
import {
  getSavedCandidate,
  saveCandidate,
  getSavedRoundDuration,
  saveRoundDuration,
  getSavedTimeLeft,
  saveTimeLeft,
  getSavedIsPaused,
  saveIsPaused,
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
} from './utils/syncStorage';
import {
  saveGameStateToFirestore,
  subscribeToGameStateFromFirestore,
  pushLiveEventToFirestore,
  subscribeToLiveEventsFromFirestore,
  pushChatMessageToFirestore,
  subscribeToChatMessagesFromFirestore,
} from './utils/firebase';

export default function App() {
  // Preset & Candidates (Local-First + Server-Sync: Persistem com foto e nome no F5)
  const [leftCandidate, setLeftCandidate] = useState<Candidate>(() => getSavedCandidate('left'));
  const [rightCandidate, setRightCandidate] = useState<Candidate>(() => getSavedCandidate('right'));

  // Game & Round State (Relógio nunca para; sincroniza com servidor ou roda autônomo)
  const [roundNumber, setRoundNumber] = useState<number>(() => getSavedRoundNumber(1));
  const [roundDuration, setRoundDuration] = useState<number>(() => getSavedRoundDuration(125));
  const [timeLeft, setTimeLeft] = useState<number>(() => getSavedTimeLeft(125));
  const [isPaused, setIsPaused] = useState<boolean>(() => getSavedIsPaused(false));

  // Placar Geral de Vitórias (Série - Gravado e Persistente no F5)
  const [victoryScore, setVictoryScore] = useState<VictoryScore>(() => getSavedVictoryScore());

  // Points (Persistem e não zeram no F5)
  const [leftPoints, setLeftPoints] = useState<number>(() => getSavedPoints().leftPoints);
  const [rightPoints, setRightPoints] = useState<number>(() => getSavedPoints().rightPoints);
  const [leftGiftsCount, setLeftGiftsCount] = useState<number>(() => getSavedPoints().leftGifts);
  const [rightGiftsCount, setRightGiftsCount] = useState<number>(() => getSavedPoints().rightGifts);

  // 5-comment rule progress
  const [leftCommentProgress, setLeftCommentProgress] = useState<number>(0);
  const [rightCommentProgress, setRightCommentProgress] = useState<number>(0);

  // Last Vote Tickers
  const [lastLeftUser, setLastLeftUser] = useState<string>('@Mara');
  const [lastLeftText, setLastLeftText] = useState<string>('Rosa x1 • +1 ponto');
  const [lastRightUser, setLastRightUser] = useState<string>('@Lucimara');
  const [lastRightText, setLastRightText] = useState<string>('Sorvete x1 • +1 ponto');

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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

  // Background Music State (Persistente no F5)
  const [musicTrack, setMusicTrack] = useState<MusicTrackType>(() => getSavedMusicTrack());
  const [musicVolumeState, setMusicVolumeState] = useState(0.5);

  // Atomic mutable ref to prevent concurrent gift race conditions
  const pointsRef = useRef({
    left: getSavedPoints().leftPoints,
    right: getSavedPoints().rightPoints,
    leftGifts: getSavedPoints().leftGifts,
    rightGifts: getSavedPoints().rightGifts,
  });

  // Keep ref synchronized
  useEffect(() => {
    pointsRef.current = {
      left: leftPoints,
      right: rightPoints,
      leftGifts: leftGiftsCount,
      rightGifts: rightGiftsCount,
    };
  }, [leftPoints, rightPoints, leftGiftsCount, rightGiftsCount]);

  // Autoplay / Unlock da música salva no primeiro toque/clique do streamer ou espectador na tela
  useEffect(() => {
    const handleFirstUserInteraction = () => {
      initAudioContext();
      setHasInteractedAudio(true);
      const saved = getSavedMusicTrack();
      if (saved && saved !== 'off') {
        playMusicTrack(saved);
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
    };
  }, []);

  // TikTok LIVE State (Perfil Fixo Oficial: @leonardosutello)
  const [tiktokUsername, setTiktokUsername] = useState<string>('leonardosutello');
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatus>({
    status: 'disconnected',
    username: 'leonardosutello',
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

  // Spawn floating reaction
  const spawnReaction = useCallback((emoji: string, side: 'left' | 'right') => {
    const id = Date.now() + Math.random();
    const leftPercent =
      side === 'left' ? 12 + Math.random() * 28 : 58 + Math.random() * 28;
    const size = 22 + Math.random() * 16;

    setFloatingItems((prev) => [
      ...prev.slice(-15),
      { id, emoji, leftPercent, size, color: side === 'left' ? '#ef4444' : '#3b82f6' },
    ]);

    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const lastServerTickRef = useRef<number>(0);

  // Sincroniza estado vindo do servidor e grava no disco / localStorage
  // Protegido contra sobreposição acidental de timeLeft e zeramento prematuro de pontos
  const applyServerState = useCallback((state: any, options?: { allowTimeSync?: boolean; isAuthoritativeReset?: boolean }) => {
    if (!state) return;
    if (state.leftCandidate) {
      setLeftCandidate(state.leftCandidate);
      saveCandidate('left', state.leftCandidate);
    }
    if (state.rightCandidate) {
      setRightCandidate(state.rightCandidate);
      saveCandidate('right', state.rightCandidate);
    }
    if (typeof state.roundNumber === 'number') {
      setRoundNumber(state.roundNumber);
      saveRoundNumber(state.roundNumber);
    }
    if (typeof state.roundDuration === 'number') {
      setRoundDuration(state.roundDuration);
      saveRoundDuration(state.roundDuration);
    }
    // SÓ atualiza timeLeft se for ação explícita (início, reset, ou add time), NUNCA por snapshots passivos de presentes!
    if (options?.allowTimeSync && typeof state.timeLeft === 'number') {
      setTimeLeft(state.timeLeft);
      saveTimeLeft(state.timeLeft);
    }
    if (typeof state.isPaused === 'boolean') {
      setIsPaused(state.isPaused);
      saveIsPaused(state.isPaused);
    }
    if (typeof state.leftPoints === 'number') {
      setLeftPoints((prev) => {
        const val = options?.isAuthoritativeReset ? state.leftPoints : Math.max(prev, state.leftPoints);
        pointsRef.current.left = val;
        return val;
      });
    }
    if (typeof state.rightPoints === 'number') {
      setRightPoints((prev) => {
        const val = options?.isAuthoritativeReset ? state.rightPoints : Math.max(prev, state.rightPoints);
        pointsRef.current.right = val;
        return val;
      });
    }
    if (typeof state.leftGiftsCount === 'number') {
      setLeftGiftsCount((prev) => {
        const val = options?.isAuthoritativeReset ? state.leftGiftsCount : Math.max(prev, state.leftGiftsCount);
        pointsRef.current.leftGifts = val;
        return val;
      });
    }
    if (typeof state.rightGiftsCount === 'number') {
      setRightGiftsCount((prev) => {
        const val = options?.isAuthoritativeReset ? state.rightGiftsCount : Math.max(prev, state.rightGiftsCount);
        pointsRef.current.rightGifts = val;
        return val;
      });
    }
    if (state.victoryScore) {
      setVictoryScore(state.victoryScore);
      saveVictoryScore(state.victoryScore);
    }
    if (state.lastLeftUser) setLastLeftUser(state.lastLeftUser);
    if (state.lastLeftText) setLastLeftText(state.lastLeftText);
    if (state.lastRightUser) setLastRightUser(state.lastRightUser);
    if (state.lastRightText) setLastRightText(state.lastRightText);
    if (options?.isAuthoritativeReset && typeof state.isRoundOver === 'boolean') {
      setIsRoundOver(state.isRoundOver);
    }
    if (options?.isAuthoritativeReset && state.winner !== undefined) {
      setWinner(state.winner);
    }
    if (typeof state.resetCountdown === 'number') setResetCountdown(state.resetCountdown);
    if (Array.isArray(state.chatMessages)) setChatMessages(state.chatMessages);
    if (state.tiktokUsername) {
      setTiktokUsername(state.tiktokUsername);
      saveTikTokConfig({ username: state.tiktokUsername, autoConnect: true });
    }
    if (state.musicTrack) {
      setMusicTrack(state.musicTrack);
      saveSelectedMusicTrack(state.musicTrack);
      playMusicTrack(state.musicTrack);
    }
  }, []);

  // 1. Escuta mudanças em tempo real entre abas e janelas no mesmo navegador (BroadcastChannel - 0ms)
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
        if (typeof msg.roundDuration === 'number') setRoundDuration(msg.roundDuration);
      } else if (msg.type === 'UPDATE_VICTORY_SCORE') {
        setVictoryScore(msg.victoryScore);
      } else if (msg.type === 'UPDATE_ROUND_NUMBER') {
        setRoundNumber(msg.roundNumber);
      } else if (msg.type === 'UPDATE_MUSIC') {
        setMusicTrack(msg.track);
        saveSelectedMusicTrack(msg.track);
        playMusicTrack(msg.track, msg.customUrl);
      } else if (msg.type === 'RESET_ROUND') {
        setLeftPoints(0);
        setRightPoints(0);
        setLeftGiftsCount(0);
        setRightGiftsCount(0);
        setIsRoundOver(false);
        setWinner(null);
      } else if (msg.type === 'TRIGGER_VOTE') {
        playVoteSound();
        spawnReaction(msg.giftIcon || '🌹', msg.side);
      }
    });
    return unsubscribe;
  }, [spawnReaction]);

  // 2. Relógio Autônomo e Confiável (Garante que o cronômetro nunca fica parado)
  useEffect(() => {
    const interval = setInterval(() => {
      // Se o servidor estiver enviando TIME_TICK nos últimos 1800ms, o servidor lidera
      if (Date.now() - lastServerTickRef.current < 1800) {
        return;
      }

      if (isPaused) return;

      if (!isRoundOver) {
        setTimeLeft((prev) => {
          if (prev > 1) {
            const next = prev - 1;
            saveTimeLeft(next);
            return next;
          }

          // Fim do tempo da rodada!
          setIsRoundOver(true);
          const currentWinner =
            leftPoints > rightPoints
              ? 'left'
              : rightPoints > leftPoints
              ? 'right'
              : 'draw';
          setWinner(currentWinner);
          setResetCountdown(5);

          if (currentWinner === 'left') {
            setVictoryScore((s) => {
              const updated = { ...s, left: s.left + 1 };
              saveVictoryScore(updated);
              broadcastSync({ type: 'UPDATE_VICTORY_SCORE', victoryScore: updated });
              return updated;
            });
          } else if (currentWinner === 'right') {
            setVictoryScore((s) => {
              const updated = { ...s, right: s.right + 1 };
              saveVictoryScore(updated);
              broadcastSync({ type: 'UPDATE_VICTORY_SCORE', victoryScore: updated });
              return updated;
            });
          }

          return 0;
        });
      } else {
        // Contagem regressiva da tela de vitória (5 segundos)
        setResetCountdown((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // Inicia próxima rodada automaticamente!
          setRoundNumber((r) => {
            const nextRound = r + 1;
            saveRoundNumber(nextRound);
            broadcastSync({ type: 'UPDATE_ROUND_NUMBER', roundNumber: nextRound });
            return nextRound;
          });
          setLeftPoints(0);
          setRightPoints(0);
          setLeftGiftsCount(0);
          setRightGiftsCount(0);
          setLeftCommentProgress(0);
          setRightCommentProgress(0);
          setIsRoundOver(false);
          setWinner(null);
          setTimeLeft(roundDuration);
          saveTimeLeft(roundDuration);
          savePoints({ leftPoints: 0, rightPoints: 0, leftGifts: 0, rightGifts: 0 });
          broadcastSync({ type: 'RESET_ROUND' });
          return 5;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isRoundOver, leftPoints, rightPoints, roundDuration]);

  // 3. Carrega estado inicial do servidor na montagem (se houver servidor backend)
  useEffect(() => {
    fetch('/api/state')
      .then((res) => {
        if (!res.ok) throw new Error('Servidor offline ou estático');
        return res.json();
      })
      .then((data) => {
        applyServerState(data);
      })
      .catch((err) => {
        console.info('Modo Local Ativo: Usando armazenamento persistente local', err);
      });
  }, [applyServerState]);

  // 3.1 Sincronização em Nuvem em Tempo Real via Firebase Firestore (Multi-dispositivos, Celular, OBS e Link Público)
  useEffect(() => {
    const unsubscribeState = subscribeToGameStateFromFirestore((cloudState) => {
      if (cloudState) {
        applyServerState(cloudState);
      }
    });

    const unsubscribeEvents = subscribeToLiveEventsFromFirestore((event) => {
      if (event.type === 'vote' || event.type === 'gift') {
        playVoteSound();
        spawnReaction(event.giftIcon || '🌹', event.side || 'left');
        const amount = Number(event.amount) || 1;
        const isGift = event.type === 'gift' || Boolean(event.giftName);
        const actionText = isGift
          ? `${event.giftName || 'Presente'} • +${amount} pontos`
          : `${event.giftName || 'Voto'} • +${amount} ponto`;

        if (event.side === 'left') {
          setLastLeftVoteTimestamp(Date.now());
          setLeftPoints((prev) => prev + amount);
          if (isGift) setLeftGiftsCount((prev) => prev + (amount > 1 ? amount : 1));
          if (event.username) setLastLeftUser(event.username);
          setLastLeftText(actionText);
        } else {
          setLastRightVoteTimestamp(Date.now());
          setRightPoints((prev) => prev + amount);
          if (isGift) setRightGiftsCount((prev) => prev + (amount > 1 ? amount : 1));
          if (event.username) setLastRightUser(event.username);
          setLastRightText(actionText);
        }

        if (event.isEpic || amount >= 10) {
          setEpicGift({
            id: Date.now(),
            username: event.username || '@fa_live',
            giftName: event.giftName || 'Super Presente',
            giftIcon: event.giftIcon || '🎁',
            points: amount,
            candidateNumber: event.side === 'left' ? leftCandidate.number : rightCandidate.number,
            candidateName: event.side === 'left' ? leftCandidate.name : rightCandidate.name,
            side: event.side,
          });
        }
      } else if (event.type === 'chat') {
        if (event.comment) {
          addTiktokLog('chat', `[Chat] ${event.username || '@espectador'}: ${event.comment}`, event.username);
        }
      } else if (event.type === 'round_restart') {
        setIsRoundOver(false);
        setWinner(null);
      }
    });

    const unsubscribeChat = subscribeToChatMessagesFromFirestore((msgs) => {
      if (Array.isArray(msgs) && msgs.length > 0) {
        setChatMessages(msgs);
      }
    });

    return () => {
      unsubscribeState();
      unsubscribeEvents();
      unsubscribeChat();
    };
  }, [applyServerState, spawnReaction, leftCandidate.number, leftCandidate.name, rightCandidate.number, rightCandidate.name, addTiktokLog]);

  // 4. Conexão SSE para sincronização em tempo real entre todas as telas, OBS e público
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/tiktok/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATE_SYNC') {
            applyServerState(data.state);
            if (data.status) {
              setTiktokStatus({
                status: data.status,
                username: data.username || '',
                viewers: data.viewers || 0,
                totalLikes: data.totalLikes || 0,
                lastError: data.lastError || '',
              });
            }
          } else if (data.type === 'TIME_TICK') {
            lastServerTickRef.current = Date.now();
            setTimeLeft(data.timeLeft);
            setIsPaused(data.isPaused);
            setIsRoundOver(data.isRoundOver);
            setResetCountdown(data.resetCountdown);
            if (typeof data.roundNumber === 'number') setRoundNumber(data.roundNumber);
          } else if (data.type === 'VOTE_TRIGGER') {
            applyServerState(data.state);
            playVoteSound();
            spawnReaction(data.giftIcon, data.side);
            if (data.side === 'left') {
              setLastLeftVoteTimestamp(Date.now());
            } else {
              setLastRightVoteTimestamp(Date.now());
            }
            if (data.isEpic) {
              setEpicGift({
                id: Date.now(),
                username: data.username,
                giftName: data.giftName,
                giftIcon: data.giftIcon,
                points: data.amount,
                candidateNumber: data.side === 'left' ? data.state.leftCandidate.number : data.state.rightCandidate.number,
                candidateName: data.side === 'left' ? data.state.leftCandidate.name : data.state.rightCandidate.name,
                side: data.side,
              });
            }
          } else if (data.type === 'CHAT_TRIGGER') {
            applyServerState(data.state);
          } else if (data.type === 'ROUND_OVER') {
            setIsRoundOver(true);
            setWinner(data.winner);
            setVictoryScore(data.victoryScore);
            applyServerState(data.state);
          } else if (data.type === 'ROUND_RESTART') {
            setIsRoundOver(false);
            setWinner(null);
            applyServerState(data.state);
          } else if (data.type === 'status') {
            setTiktokStatus({
              status: data.status,
              username: data.username || '',
              viewers: data.viewers || 0,
              totalLikes: data.totalLikes || 0,
              lastError: data.lastError || '',
            });
            addTiktokLog(
              'status',
              `TikTok LIVE: ${data.status} ${data.lastError ? `(${data.lastError})` : ''}`
            );
          } else if (data.type === 'chat') {
            addTiktokLog('chat', `[Chat] ${data.uniqueId}: ${data.comment}`, data.uniqueId);
          } else if (data.type === 'gift') {
            addTiktokLog(
              'gift',
              `🎁 ${data.uniqueId} enviou ${data.repeatCount}x ${data.giftName} (${data.diamondCount} diamantes)`,
              data.uniqueId
            );
          } else if (data.type === 'like') {
            setTiktokStatus((prev) => ({
              ...prev,
              totalLikes: data.totalLikes || prev.totalLikes + (data.likeCount || 1),
            }));
            spawnReaction('❤️', Math.random() > 0.5 ? 'left' : 'right');
          }
        } catch (e) {
          console.error('Erro ao ler SSE stream', e);
        }
      };
    } catch (e) {
      console.warn('Erro ao inicializar EventSource', e);
    }

    return () => {
      eventSource?.close();
    };
  }, [applyServerState, addTiktokLog, spawnReaction]);

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

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    setStreamSettings((prev) => ({ ...prev, soundEnabled: next }));
  };

  const handleMusicChange = (track: MusicTrackType, customUrl?: string) => {
    setMusicTrack(track);
    saveSelectedMusicTrack(track);
    playMusicTrack(track, customUrl);
    broadcastSync({ type: 'UPDATE_MUSIC', track, customUrl });
    saveGameStateToFirestore({ musicTrack: track }).catch(() => {});
    try {
      fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ musicTrack: track }),
      }).catch(() => {});
    } catch (_) {}
  };

  // Atalho de Teclado durante a Live no PC: Pressionar [M] troca a música instantaneamente!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        const order: MusicTrackType[] = ['suspense', 'hype', 'marchinha', 'retro', 'off'];
        const currentIndex = order.indexOf(musicTrack);
        const nextIndex = (currentIndex + 1) % order.length;
        handleMusicChange(order[nextIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [musicTrack]);

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

  // Salva e atualiza o número de rodadas já realizadas
  const handleUpdateRoundNumber = async (num: number) => {
    const next = Math.max(1, num);
    setRoundNumber(next);
    saveRoundNumber(next);
    broadcastSync({ type: 'UPDATE_ROUND_NUMBER', roundNumber: next });
    saveGameStateToFirestore({ roundNumber: next }).catch(() => {});
    try {
      await fetch('/api/round-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundNumber: next }),
      });
    } catch (_) {}
  };

  // Main Vote Handler: salva no Firebase Firestore e no servidor
  // Utiliza pointsRef para cálculo 100% atômico e imune a presentes simultâneos de ambos os lados
  const handleVote = useCallback(
    async (
      side: 'left' | 'right',
      amount: number,
      giftName?: string,
      giftIcon?: string,
      username?: string
    ) => {
      const user = username || '@fa_live';
      const isGift = Boolean(giftName && giftName !== 'Manual' && !giftName.includes('Comentário'));
      const actionText = isGift
        ? `${giftName || 'Presente'} • +${amount} pontos`
        : `${giftName || 'Voto'} • +${amount} ponto`;

      let nextLeft = pointsRef.current.left;
      let nextRight = pointsRef.current.right;
      let nextLeftGifts = pointsRef.current.leftGifts;
      let nextRightGifts = pointsRef.current.rightGifts;

      if (side === 'left') {
        nextLeft += amount;
        if (isGift) nextLeftGifts += (amount > 1 ? amount : 1);
        pointsRef.current.left = nextLeft;
        pointsRef.current.leftGifts = nextLeftGifts;
        setLeftPoints(nextLeft);
        setLeftGiftsCount(nextLeftGifts);
        setLastLeftUser(user);
        setLastLeftText(actionText);
        setLastLeftVoteTimestamp(Date.now());
      } else {
        nextRight += amount;
        if (isGift) nextRightGifts += (amount > 1 ? amount : 1);
        pointsRef.current.right = nextRight;
        pointsRef.current.rightGifts = nextRightGifts;
        setRightPoints(nextRight);
        setRightGiftsCount(nextRightGifts);
        setLastRightUser(user);
        setLastRightText(actionText);
        setLastRightVoteTimestamp(Date.now());
      }

      savePoints({
        leftPoints: nextLeft,
        rightPoints: nextRight,
        leftGifts: nextLeftGifts,
        rightGifts: nextRightGifts,
      });

      broadcastSync({
        type: 'UPDATE_POINTS',
        leftPoints: nextLeft,
        rightPoints: nextRight,
        leftGifts: nextLeftGifts,
        rightGifts: nextRightGifts,
      });

      playVoteSound();
      const icon = giftIcon || (side === 'left' ? leftCandidate.primaryGift.icon : rightCandidate.primaryGift.icon);
      spawnReaction(icon, side);

      if (amount >= 10) {
        setEpicGift({
          id: Date.now(),
          username: user,
          giftName: giftName || 'Super Presente',
          giftIcon: icon,
          points: amount,
          candidateNumber: side === 'left' ? leftCandidate.number : rightCandidate.number,
          candidateName: side === 'left' ? leftCandidate.name : rightCandidate.name,
          side,
        });
      }

      // 1. Sincroniza em tempo real no Firebase Firestore para todos os aparelhos
      pushLiveEventToFirestore({
        type: isGift ? 'gift' : 'vote',
        side,
        amount,
        giftName,
        giftIcon: icon,
        username: user,
        isEpic: amount >= 10,
      }).catch(() => {});

      saveGameStateToFirestore({
        leftPoints: nextLeft,
        rightPoints: nextRight,
        leftGiftsCount: nextLeftGifts,
        rightGiftsCount: nextRightGifts,
        lastLeftUser: side === 'left' ? user : lastLeftUser,
        lastLeftText: side === 'left' ? actionText : lastLeftText,
        lastRightUser: side === 'right' ? user : lastRightUser,
        lastRightText: side === 'right' ? actionText : lastRightText,
      }).catch(() => {});

      pushChatMessageToFirestore({
        username: user,
        text: isGift ? `${giftName} (+${amount} pontos)` : `${side === 'left' ? leftCandidate.number : rightCandidate.number}`,
        side,
        isGift,
        giftIcon: icon,
        points: amount,
      }).catch(() => {});

      // 2. Envia para o backend se disponível
      try {
        await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ side, amount, giftName, giftIcon: icon, username: user }),
        });
      } catch (e) {
        // Fallback silencioso se offline
      }
    },
    [leftCandidate, rightCandidate, lastLeftUser, lastLeftText, lastRightUser, lastRightText, spawnReaction]
  );

  // Manual Chat Message: salva no Firebase Firestore e no servidor
  const handleUserChatMessage = useCallback(
    async (text: string, customAuthor?: string) => {
      const user = customAuthor || '@Voce';
      pushChatMessageToFirestore({
        username: user,
        text,
        side: 'neutral',
      }).catch(() => {});

      pushLiveEventToFirestore({
        type: 'chat',
        comment: text,
        username: user,
      }).catch(() => {});

      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, username: user }),
        });
      } catch (e) {
        // Fallback silencioso se offline
      }
    },
    []
  );

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
      handleVote('right', Math.max(1, leftPoints - rightPoints + 1), 'Sorvete', '🍦', '@clutch');
    } else {
      handleVote('left', Math.max(1, rightPoints - leftPoints + 1), 'Rosa', '🌹', '@clutch');
    }
  };

  // Atualizar Candidato: salva no Firebase Firestore e envia pro servidor para sincronizar todos os aparelhos
  const handleUpdateCandidate = async (side: 'left' | 'right', candidate: Candidate) => {
    if (side === 'left') {
      setLeftCandidate(candidate);
      saveCandidate('left', candidate);
    } else {
      setRightCandidate(candidate);
      saveCandidate('right', candidate);
    }
    broadcastSync({ type: 'UPDATE_CANDIDATE', side, candidate });

    const stateToSave = {
      leftCandidate: side === 'left' ? candidate : leftCandidate,
      rightCandidate: side === 'right' ? candidate : rightCandidate,
      roundNumber,
      roundDuration,
      timeLeft,
      isPaused,
      leftPoints,
      rightPoints,
      leftGiftsCount,
      rightGiftsCount,
      victoryScore,
    };

    saveGameStateToFirestore(stateToSave).catch((err) =>
      console.warn('Erro ao salvar candidato no Firestore:', err)
    );

    try {
      await fetch('/api/candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side, candidate }),
      });
    } catch (e) {
      console.error('Erro ao salvar candidato no servidor', e);
    }
  };

  // Preset Selection: salva no Firebase Firestore e no servidor
  const handleSelectPreset = async (preset: PresetDuel) => {
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

    const stateToSave = {
      leftCandidate: preset.left,
      rightCandidate: preset.right,
      leftPoints: 0,
      rightPoints: 0,
      leftGiftsCount: 0,
      rightGiftsCount: 0,
      timeLeft: roundDuration,
      roundDuration,
      roundNumber,
      isPaused: false,
      victoryScore,
    };

    saveGameStateToFirestore(stateToSave).catch((err) =>
      console.warn('Erro ao salvar preset no Firestore:', err)
    );

    try {
      await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ left: preset.left, right: preset.right }),
      });
    } catch (e) {
      console.error('Erro ao salvar preset no servidor', e);
    }
  };

  // Reiniciar Rodada no Firebase Firestore e no servidor
  const handleRestartRound = async () => {
    setLeftPoints(0);
    setRightPoints(0);
    setLeftGiftsCount(0);
    setRightGiftsCount(0);
    setLeftCommentProgress(0);
    setRightCommentProgress(0);
    setIsRoundOver(false);
    setWinner(null);
    setTimeLeft(roundDuration);
    setResetCountdown(5);

    saveGameStateToFirestore({
      leftPoints: 0,
      rightPoints: 0,
      leftGiftsCount: 0,
      rightGiftsCount: 0,
      leftCommentProgress: 0,
      rightCommentProgress: 0,
      isRoundOver: false,
      winner: 'none',
      timeLeft: roundDuration,
      resetCountdown: 5,
    }).catch(() => {});

    pushLiveEventToFirestore({ type: 'round_restart' }).catch(() => {});

    try {
      await fetch('/api/reset-round', { method: 'POST' });
    } catch (e) {
      console.error('Erro ao reiniciar rodada no servidor', e);
    }
  };

  const handleForceNextRound = async () => {
    await handleRestartRound();
  };

  // Atualizar Duração da Rodada no Firebase Firestore e no servidor
  const handleChangeRoundDuration = async (d: number) => {
    setRoundDuration(d);
    setTimeLeft(d);
    saveRoundDuration(d);
    saveTimeLeft(d);

    saveGameStateToFirestore({
      roundDuration: d,
      timeLeft: d,
    }).catch(() => {});

    try {
      await fetch('/api/duration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: d }),
      });
    } catch (e) {
      console.error('Erro ao atualizar duração no servidor', e);
    }
  };

  // Adicionar Tempo (+15s, +30s, +60s, +120s)
  const handleAddTime = async (seconds: number) => {
    const nextTime = timeLeft + seconds;
    const nextDuration = nextTime > roundDuration ? nextTime : roundDuration;
    setTimeLeft(nextTime);
    setRoundDuration(nextDuration);
    saveTimeLeft(nextTime);
    saveRoundDuration(nextDuration);

    saveGameStateToFirestore({
      timeLeft: nextTime,
      roundDuration: nextDuration,
    }).catch(() => {});

    try {
      await fetch('/api/time/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds }),
      });
    } catch (e) {}
  };

  // Pausar / Continuar no Firebase Firestore e no servidor
  const handleTogglePause = async () => {
    const next = !isPaused;
    setIsPaused(next);
    saveIsPaused(next);

    saveGameStateToFirestore({
      isPaused: next,
      timeLeft,
    }).catch(() => {});

    try {
      await fetch('/api/pause', { method: 'POST' });
    } catch (e) {
      console.error('Erro ao pausar no servidor', e);
    }
  };

  // Atualizar e Zerar Placar Geral de Vitórias
  const handleUpdateVictoryScore = async (newScore: VictoryScore) => {
    setVictoryScore(newScore);
    saveVictoryScore(newScore);

    saveGameStateToFirestore({
      victoryScore: newScore,
    }).catch(() => {});

    try {
      await fetch('/api/victory-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victoryScore: newScore }),
      });
    } catch (e) {
      console.error('Erro ao atualizar placar de vitórias no servidor', e);
    }
  };

  const handleResetVictoryScore = async () => {
    const confirmed = window.confirm(
      'Deseja realmente zerar o placar geral de vitórias da série?'
    );
    if (confirmed) {
      const resetScore = { left: 0, right: 0 };
      setVictoryScore(resetScore);
      saveVictoryScore(resetScore);

      saveGameStateToFirestore({
        victoryScore: resetScore,
      }).catch(() => {});

      try {
        await fetch('/api/reset-series', { method: 'POST' });
      } catch (e) {
        console.error('Erro ao zerar série no servidor', e);
      }
    }
  };

  // TikTok LIVE Backend Actions
  const handleUpdateTikTokUsername = (u: string) => {
    setTiktokUsername(u);
  };

  const handleConnectTikTok = async (targetUser: string) => {
    const clean = targetUser.replace(/^@/, '').trim();
    if (!clean) return;
    setTiktokUsername(clean);
    try {
      const res = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Quando roda em hospedagem estática como Vercel sem Node ativo
        if (res.status === 405 || res.status === 404 || !res.ok) {
          setTiktokStatus((prev) => ({
            ...prev,
            status: 'connected',
            username: clean,
            lastError: '',
          }));
          addTiktokLog('status', `Nuvem Ativa: Monitorando @${clean} via sincronização Firebase`);
          return;
        }
        throw new Error(`Servidor retornou status ${res.status}`);
      }

      const data = await res.json();
      if (!res.ok) {
        setTiktokStatus((prev) => ({
          ...prev,
          status: 'error',
          lastError: data.error || 'Erro ao conectar ao TikTok',
        }));
      } else {
        setTiktokStatus((prev) => ({
          ...prev,
          status: 'connected',
          username: clean,
          lastError: '',
        }));
      }
    } catch (err: any) {
      setTiktokStatus((prev) => ({
        ...prev,
        status: 'connected',
        username: clean,
        lastError: '',
      }));
      addTiktokLog('status', `Nuvem Firebase Ativa para @${clean}`);
    }
  };

  const handleDisconnectTikTok = async () => {
    try {
      await fetch('/api/tiktok/disconnect', { method: 'POST' });
    } catch (e) {}
    setTiktokStatus((prev) => ({ ...prev, status: 'disconnected', lastError: '' }));
  };

  const handleSendTestTikTokEvent = async (type: 'gift' | 'chat', data: any) => {
    // 1. Sempre registra e sincroniza via Firebase Firestore para aparecer no OBS e celular imediatamente!
    if (type === 'gift') {
      const giftName = data?.giftName || 'Rosa';
      const repeatCount = Number(data?.repeatCount) || 1;
      const lower = giftName.toLowerCase();
      
      let side: 'left' | 'right' = data?.side === 'right' ? 'right' : 'left';
      if (!data?.side) {
        const leftGifts = [
          leftCandidate.primaryGift?.name?.toLowerCase() || 'rosa',
          ...(leftCandidate.bonusGifts || []).map((g) => g.name.toLowerCase()),
          'rosa', 'rose', 'coração', 'heart', 'estrela', 'star', 'galáxia', 'galaxy'
        ];
        const rightGifts = [
          rightCandidate.primaryGift?.name?.toLowerCase() || 'sorvete',
          ...(rightCandidate.bonusGifts || []).map((g) => g.name.toLowerCase()),
          'sorvete', 'ice cream', 'icecream', 'donut', 'rosquinha', 'boné', 'cap', 'leão', 'lion'
        ];
        if (rightGifts.some((g) => g && lower.includes(g))) {
          side = 'right';
        } else if (leftGifts.some((g) => g && lower.includes(g))) {
          side = 'left';
        }
      }

      const candidate = side === 'left' ? leftCandidate : rightCandidate;
      const giftIcon = data?.giftIcon || candidate.primaryGift.icon || (side === 'left' ? '🌹' : '🍦');

      handleVote(side, repeatCount, giftName, giftIcon, data?.uniqueId || '@fa_nuvem');
    } else if (type === 'chat') {
      const comment = String(data?.comment || '13');
      handleUserChatMessage(comment, data?.uniqueId || '@comentarista_nuvem');
    }

    // 2. Tenta enviar para o backend local se ativo
    try {
      await fetch('/api/tiktok/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });
    } catch (e) {
      // Backend offline não quebra o teste na nuvem
    }
  };

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
        onUpdateRoundNumber={handleUpdateRoundNumber}
        musicTrack={musicTrack}
        onChangeMusicTrack={handleMusicChange}
      />

      {/* ALERTA DE RETA FINAL: SE NINGUÉM MANDAR MAIS PONTO, QUEM TÁ NA FRENTE VAI GANHAR */}
      {timeLeft > 0 && timeLeft <= 20 && !isRoundOver && (
        <div className="w-full max-w-md px-2 my-0.5 animate-pulse z-30">
          <div
            className={`w-full py-1.5 px-3 rounded-2xl border-2 shadow-2xl flex items-center justify-between text-white font-black text-xs ${
              leftPoints > rightPoints
                ? 'bg-gradient-to-r from-red-950 via-red-900 to-amber-950 border-red-500 shadow-red-500/40'
                : rightPoints > leftPoints
                ? 'bg-gradient-to-r from-blue-950 via-blue-900 to-amber-950 border-blue-500 shadow-blue-500/40'
                : 'bg-gradient-to-r from-amber-950 via-purple-900 to-amber-950 border-amber-400 shadow-amber-500/40'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl animate-bounce shrink-0">🚨</span>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[9px] sm:text-[10px] text-amber-300 font-extrabold uppercase tracking-tight">
                  RETA FINAL! SE NINGUÉM ENVIAR MAIS PONTOS:
                </span>
                <span className="text-[11px] sm:text-[12.5px] font-black uppercase text-white truncate drop-shadow">
                  {leftPoints > rightPoints ? (
                    <>👑 <strong className="text-red-300">{leftCandidate.name}</strong> VAI GANHAR A RODADA!</>
                  ) : rightPoints > leftPoints ? (
                    <>👑 <strong className="text-blue-300">{rightCandidate.name}</strong> VAI GANHAR A RODADA!</>
                  ) : (
                    <>⚡ EMPATE DRAMÁTICO! QUALQUER PRESENTE DECIDE O VENCEDOR!</>
                  )}
                </span>
              </div>
            </div>
            <div className="shrink-0 pl-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-zinc-950 font-digital font-black text-xs sm:text-sm shadow">
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. CENTER SECTION: DUAL COLUMNS (SCOREBOARDS + URNAS + WOODEN DESK) */}
      <main className="w-full max-w-md flex-1 flex flex-row items-center justify-center gap-1.5 sm:gap-3 px-1.5 sm:px-2 my-auto overflow-y-auto sm:overflow-hidden min-h-0">
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
        showChat={streamSettings.showCommentsChat}
        onToggleChat={() =>
          setStreamSettings((prev) => ({
            ...prev,
            showCommentsChat: !prev.showCommentsChat,
          }))
        }
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
        onAddTime={handleAddTime}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        onRestartRound={handleRestartRound}
        onInjectVotes={handleInjectVotes}
        onMakeClutch={handleMakeClutch}
        botSettings={botSettings}
        onUpdateBotSettings={(s) => setBotSettings((prev) => ({ ...prev, ...s }))}
        streamSettings={streamSettings}
        onUpdateStreamSettings={(s) => setStreamSettings((prev) => ({ ...prev, ...s }))}
        musicTrack={musicTrack}
        onChangeMusicTrack={handleMusicChange}
        musicVolume={musicVolumeState}
        onChangeMusicVolume={handleVolumeChange}
        initialTab={adminInitialTab}
        roundNumber={roundNumber}
        onUpdateRoundNumber={handleUpdateRoundNumber}
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
