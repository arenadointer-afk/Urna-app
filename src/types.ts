export interface GiftItem {
  id: string;
  name: string;
  icon: string;
  points: number;
  badge?: string;
}

export type MusicTrackType = 'hype' | 'suspense' | 'marchinha' | 'retro' | 'custom' | 'off';

export interface Candidate {
  id: 'left' | 'right';
  number: string;
  name: string;
  role: string;
  party: string;
  coalition: string;
  vice: string;
  color: string;
  colorClass: string;
  bgGradient: string;
  photoUrl: string;
  primaryGift: GiftItem;
  bonusGifts: GiftItem[];
}

export interface PresetDuel {
  id: string;
  title: string;
  description: string;
  left: Candidate;
  right: Candidate;
}

export interface VictoryScore {
  left: number;
  right: number;
}

export interface TikTokStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  username: string;
  viewers: number;
  totalLikes: number;
  lastError: string;
}

export interface TikTokLiveEvent {
  type: 'chat' | 'gift' | 'like' | 'status';
  uniqueId?: string;
  nickname?: string;
  comment?: string;
  giftName?: string;
  repeatCount?: number;
  diamondCount?: number;
  giftPictureUrl?: string;
  giftIcon?: string;
  likeCount?: number;
  totalLikes?: number;
  status?: 'disconnected' | 'connecting' | 'connected' | 'error';
  username?: string;
  lastError?: string;
  timestamp?: number;
}

export interface GameState {
  roundNumber: number;
  timeLeft: number;
  roundDuration: number;
  isPaused: boolean;
  leftPoints: number;
  rightPoints: number;
  leftGiftsCount: number;
  rightGiftsCount: number;
  victoryScore: VictoryScore;
  isRoundOver: boolean;
  winner: 'left' | 'right' | 'draw' | null;
  resetCountdown: number;
}

export interface RoundResult {
  round: number;
  winner: 'left' | 'right' | 'draw';
  leftPoints: number;
  rightPoints: number;
  leftCandidate: string;
  rightCandidate: string;
  totalGifts: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  text: string;
  side: 'left' | 'right' | 'neutral';
  timestamp: number;
  isGift?: boolean;
  giftIcon?: string;
  points?: number;
}

export interface GiftAlert {
  id: string;
  username: string;
  avatar: string;
  side: 'left' | 'right';
  giftName: string;
  giftIcon: string;
  multiplier: number;
  points: number;
  timestamp: number;
}

export interface BotSettings {
  enabled: boolean;
  intensity: 'chill' | 'normal' | 'hype' | 'viral';
  bias: 'balanced' | 'favor_left' | 'favor_right' | 'clutch';
  allowLargeGifts: boolean;
}

export interface StreamSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  layoutMode: 'vertical_9_16' | 'horizontal_16_9';
  streamViewClean: boolean; // hide admin toggles and overlays for clean screen capture
  chromaKey: 'none' | 'green' | 'blue' | 'black';
  autoRestartDelay: number; // seconds (default 5)
  showFloatingEmojis: boolean;
  showUrnaKeyboard: boolean;
  showCommentsChat: boolean;
}
