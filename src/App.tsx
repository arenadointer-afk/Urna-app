import React, { useState, useEffect, useCallback } from 'react';
import {
  Candidate,
  ChatMessage,
  BotSettings,
  StreamSettings,
  PresetDuel,
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
  // Preset & Candidates
  const [leftCandidate, setLeftCandidate] = useState<Candidate>(PRESET_DUELS[0].left);
  const [rightCandidate, setRightCandidate] = useState<Candidate>(PRESET_DUELS[0].right);

  // Game & Round State (Default duration 125s = 02:05)
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundDuration, setRoundDuration] = useState(125);
  const [timeLeft, setTimeLeft] = useState(125);
  const [isPaused, setIsPaused] = useState(false);

  // Points (start with lively scores)
  const [leftPoints, setLeftPoints] = useState(56);
  const [rightPoints, setRightPoints] = useState(88);
  const [leftGiftsCount, setLeftGiftsCount] = useState(56);
  const [rightGiftsCount, setRightGiftsCount] = useState(89);

  // 5-comment rule: 5 comentários número 22 = 1 ponto | 5 comentários número 13 = 1 ponto
  const [leftCommentProgress, setLeftCommentProgress] = useState(2);
  const [rightCommentProgress, setRightCommentProgress] = useState(3);

  // Last Vote Tickers (@Mara / @Lucimara)
  const [lastLeftUser, setLastLeftUser] = useState<string>('@Mara');
  const [lastLeftText, setLastLeftText] = useState<string>('Rosa x2 • +2 pontos');
  const [lastRightUser, setLastRightUser] = useState<string>('@Lucimara');
  const [lastRightText, setLastRightText] = useState<string>('Sorvete x2 • +2 pontos');

  // Round Over & Victory
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [winner, setWinner] = useState<'left' | 'right' | 'draw' | null>(null);
  const [resetCountdown, setResetCountdown] = useState(5);

  // Animation Triggers
  const [lastLeftVoteTimestamp, setLastLeftVoteTimestamp] = useState(0);
  const [lastRightVoteTimestamp, setLastRightVoteTimestamp] = useState(0);
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

  // Admin & Password Authentication (Senha: 851985)
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

  // BOT STARTS INITIALLY DISABLED AS REQUESTED ("A live tem que iniciar sem os bots ativado")
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
        setLeftPoints((prev) => prev + amount);
        if (isGift) setLeftGiftsCount((prev) => prev + (amount > 1 ? amount : 1));
        setLastLeftVoteTimestamp(Date.now());
        setLastLeftUser(user);
        setLastLeftText(actionText);
        spawnReaction(giftIcon || leftCandidate.primaryGift.icon, 'left');
      } else {
        setRightPoints((prev) => prev + amount);
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
    [isRoundOver, leftCandidate, rightCandidate, spawnReaction]
  );

  // Manual Chat Message: 5 comments with number = +1 point!
  const handleUserChatMessage = (text: string) => {
    const trimmed = text.trim();
    const hasLeft = trimmed.includes(leftCandidate.number) || trimmed.toLowerCase().includes('bolsonaro');
    const hasRight = trimmed.includes(rightCandidate.number) || trimmed.toLowerCase().includes('lula');

    if (hasLeft) {
      setLeftCommentProgress((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          handleVote('left', 1, '5 Comentários no Chat', '💬', '@Voce');
          return 0;
        }
        setChatMessages((c) => [
          ...c.slice(-20),
          {
            id: `cmt-${Date.now()}`,
            username: '@Voce',
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
          handleVote('right', 1, '5 Comentários no Chat', '💬', '@Voce');
          return 0;
        }
        setChatMessages((c) => [
          ...c.slice(-20),
          {
            id: `cmt-${Date.now()}`,
            username: '@Voce',
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
          id: `msg-${Date.now()}`,
          username: '@Voce',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          text: trimmed,
          side: 'neutral',
          timestamp: Date.now(),
        },
      ]);
    }
  };

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
      setRightPoints(Math.max(1, leftPoints - 1));
    } else {
      setLeftPoints(Math.max(1, rightPoints - 1));
    }
  };

  // Preset Selection
  const handleSelectPreset = (preset: PresetDuel) => {
    setLeftCandidate(preset.left);
    setRightCandidate(preset.right);
    setLeftPoints(0);
    setRightPoints(0);
    setLeftGiftsCount(0);
    setRightGiftsCount(0);
    setTimeLeft(roundDuration);
  };

  // Restart Round
  const handleRestartRound = () => {
    setIsRoundOver(false);
    setTimeLeft(roundDuration);
    setLeftPoints(0);
    setRightPoints(0);
    setLeftGiftsCount(0);
    setRightGiftsCount(0);
    setWinner(null);
  };

  const handleForceNextRound = () => {
    setRoundNumber((r) => r + 1);
    handleRestartRound();
  };

  // Round Timer Countdown Loop
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
          setRoundNumber((r) => r + 1);
          handleRestartRound();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRoundOver, roundDuration]);

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
        const giftName = targetSide === 'left' ? 'Rosa' : 'Sorvete';
        const giftIcon = targetSide === 'left' ? '🌹' : '🍦';
        handleVote(targetSide, giftCount, `${giftName} x${giftCount}`, giftIcon, user);
      } else {
        // Simulated comment adds progress to 5-comment rule
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

      {/* 1. TOP HEADER (ELEIÇÕES 2026 INTERATIVO + TIMER + ROSES + STATUS PILLS - 100% LIMPO) */}
      <TopHeader
        leftCandidate={leftCandidate}
        rightCandidate={rightCandidate}
        leftPoints={leftPoints}
        rightPoints={rightPoints}
        timeLeft={timeLeft}
        onOpenAdmin={() => setIsPasswordModalOpen(true)}
      />

      {/* 2. CENTER SECTION: DUAL COLUMNS (SCOREBOARDS + URNAS + WOODEN DESK) */}
      <main className="w-full max-w-md flex-1 flex flex-row items-center justify-center gap-2 sm:gap-3 px-2 my-auto overflow-hidden">
        {/* Left Urna Column (22 - Bolsonaro / Blue) */}
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

        {/* Right Urna Column (13 - Lula / Red) */}
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

      {/* 3. BOTTOM SECTION: CLEAN LIVE CHAT & 5-COMMENT RULE PROGRESS (NO ADM DATA ON SCREEN) */}
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

      {/* Victory Celebration Modal */}
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
        />
      )}

      {/* Full Admin Panel Drawer (Protected by Password 851985) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        leftCandidate={leftCandidate}
        rightCandidate={rightCandidate}
        onUpdateCandidate={(side, c) => {
          if (side === 'left') setLeftCandidate(c);
          else setRightCandidate(c);
        }}
        onSelectPreset={handleSelectPreset}
        roundDuration={roundDuration}
        onChangeRoundDuration={(d) => {
          setRoundDuration(d);
          setTimeLeft(d);
        }}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((p) => !p)}
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
      />
    </div>
  );
}
