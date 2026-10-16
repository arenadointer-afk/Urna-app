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

  // Background Music State
  const [musicTrack, setMusicTrack] = useState<MusicTrackType>('off');
  const [musicVolumeState, setMusicVolumeState] = useState(0.5);

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
      { id, emoji, leftPercent, size, color: side === 'left' ? '#3b82f6' : '#ef4444' },
    ]);

    setTimeout(() => {
      setFloatingItems((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const lastServerTickRef = useRef<number>(0);

  // Sincroniza estado vindo do servidor e grava no disco / localStorage
  const applyServerState = useCallback((state: any) => {
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
    if (typeof state.timeLeft === 'number') {
      setTimeLeft(state.timeLeft);
      saveTimeLeft(state.timeLeft);
    }
    if (typeof state.isPaused === 'boolean') {
      setIsPaused(state.isPaused);
      saveIsPaused(state.isPaused);
    }
    if (typeof state.leftPoints === 'number') setLeftPoints(state.leftPoints);
    if (typeof state.rightPoints === 'number') setRightPoints(state.rightPoints);
    if (typeof state.leftGiftsCount === 'number') setLeftGiftsCount(state.leftGiftsCount);
    if (typeof state.rightGiftsCount === 'number') setRightGiftsCount(state.rightGiftsCount);
    if (typeof state.leftPoints === 'number' && typeof state.rightPoints === 'number') {
      savePoints({
        leftPoints: state.leftPoints,
        rightPoints: state.rightPoints,
        leftGifts: state.leftGiftsCount || 0,
        rightGifts: state.rightGiftsCount || 0,
      });
    }
    if (typeof state.leftCommentProgress === 'number') setLeftCommentProgress(state.leftCommentProgress);
    if (typeof state.rightCommentProgress === 'number') setRightCommentProgress(state.rightCommentProgress);
    if (state.victoryScore) {
      setVictoryScore(state.victoryScore);
      saveVictoryScore(state.victoryScore);
    }
    if (state.lastLeftUser) setLastLeftUser(state.lastLeftUser);
    if (state.lastLeftText) setLastLeftText(state.lastLeftText);
    if (state.lastRightUser) setLastRightUser(state.lastRightUser);
    if (state.lastRightText) setLastRightText(state.lastRightText);
    if (typeof state.isRoundOver === 'boolean') setIsRoundOver(state.isRoundOver);
    if (state.winner !== undefined) setWinner(state.winner);
    if (typeof state.resetCountdown === 'number') setResetCountdown(state.resetCountdown);
    if (Array.isArray(state.chatMessages)) setChatMessages(state.chatMessages);
    if (state.tiktokUsername) {
      setTiktokUsername(state.tiktokUsername);
      saveTikTokConfig({ username: state.tiktokUsername, autoConnect: true });
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

  // Main Vote Handler: salva no servidor
  const handleVote = useCallback(
    async (
      side: 'left' | 'right',
      amount: number,
      giftName?: string,
      giftIcon?: string,
      username?: string
    ) => {
      try {
        await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ side, amount, giftName, giftIcon, username }),
        });
      } catch (e) {
        console.error('Erro ao enviar voto pro servidor', e);
      }
    },
    []
  );

  // Manual Chat Message: salva no servidor
  const handleUserChatMessage = useCallback(
    async (text: string, customAuthor?: string) => {
      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, username: customAuthor || '@Voce' }),
        });
      } catch (e) {
        console.error('Erro ao enviar mensagem pro chat', e);
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

  // Atualizar Candidato: envia pro servidor para salvar no disco e sincronizar com o público
  const handleUpdateCandidate = async (side: 'left' | 'right', candidate: Candidate) => {
    if (side === 'left') setLeftCandidate(candidate);
    else setRightCandidate(candidate);

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

  // Preset Selection: envia pro servidor
  const handleSelectPreset = async (preset: PresetDuel) => {
    setLeftCandidate(preset.left);
    setRightCandidate(preset.right);
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

  // Reiniciar Rodada no servidor
  const handleRestartRound = async () => {
    try {
      await fetch('/api/reset-round', { method: 'POST' });
    } catch (e) {
      console.error('Erro ao reiniciar rodada no servidor', e);
    }
  };

  const handleForceNextRound = async () => {
    await handleRestartRound();
  };

  // Atualizar Duração da Rodada no servidor
  const handleChangeRoundDuration = async (d: number) => {
    setRoundDuration(d);
    setTimeLeft(d);
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

  // Pausar / Continuar no servidor
  const handleTogglePause = async () => {
    try {
      await fetch('/api/pause', { method: 'POST' });
    } catch (e) {
      console.error('Erro ao pausar no servidor', e);
    }
  };

  // Atualizar e Zerar Placar Geral de Vitórias
  const handleUpdateVictoryScore = async (newScore: VictoryScore) => {
    setVictoryScore(newScore);
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
        onUpdateBotSettings={(s) => setBotSettings((prev) => ({ ...prev, ...s }))}
        streamSettings={streamSettings}
        onUpdateStreamSettings={(s) => setStreamSettings((prev) => ({ ...prev, ...s }))}
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
