import { Candidate, BotSettings, StreamSettings, PresetDuel } from '../types';
import { PRESET_DUELS } from './presets';

export interface VictoryScore {
  left: number;
  right: number;
}

export interface TikTokConfig {
  username: string;
  autoConnect: boolean;
}

const STORAGE_KEYS = {
  LEFT_CANDIDATE: 'urna_left_candidate_v2',
  RIGHT_CANDIDATE: 'urna_right_candidate_v2',
  ROUND_DURATION: 'urna_round_duration_v2',
  ROUND_NUMBER: 'urna_round_number_v2',
  TIME_LEFT: 'urna_time_left_v2',
  POINTS: 'urna_points_v2',
  VICTORY_SCORE: 'urna_victory_score_v2',
  BOT_SETTINGS: 'urna_bot_settings_v2',
  STREAM_SETTINGS: 'urna_stream_settings_v2',
  TIKTOK_CONFIG: 'urna_tiktok_config_v2',
};

// Cross-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('urna_live_sync_channel');
  } catch (e) {
    console.warn('BroadcastChannel not supported or failed to initialize', e);
  }
}

export type SyncMessage =
  | { type: 'UPDATE_CANDIDATE'; side: 'left' | 'right'; candidate: Candidate }
  | { type: 'UPDATE_ALL_CANDIDATES'; left: Candidate; right: Candidate }
  | { type: 'UPDATE_POINTS'; leftPoints: number; rightPoints: number; leftGifts: number; rightGifts: number }
  | { type: 'UPDATE_TIME'; timeLeft: number; isPaused: boolean; roundDuration?: number }
  | { type: 'UPDATE_VICTORY_SCORE'; victoryScore: VictoryScore }
  | { type: 'UPDATE_ROUND_NUMBER'; roundNumber: number }
  | { type: 'UPDATE_BOT_SETTINGS'; botSettings: BotSettings }
  | { type: 'UPDATE_STREAM_SETTINGS'; streamSettings: StreamSettings }
  | { type: 'RESET_ROUND' }
  | { type: 'TRIGGER_VOTE'; side: 'left' | 'right'; amount: number; giftName?: string; giftIcon?: string; username?: string };

export function broadcastSync(message: SyncMessage) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch (e) {
      console.warn('Failed to broadcast message', e);
    }
  }
}

export function subscribeToSync(handler: (msg: SyncMessage) => void) {
  if (!broadcastChannel) return () => {};
  const listener = (event: MessageEvent<SyncMessage>) => {
    if (event.data) {
      handler(event.data);
    }
  };
  broadcastChannel.addEventListener('message', listener);
  return () => {
    broadcastChannel?.removeEventListener('message', listener);
  };
}

// Safe localStorage getters and setters
export function getSavedCandidate(side: 'left' | 'right'): Candidate {
  if (typeof window === 'undefined') {
    return side === 'left' ? PRESET_DUELS[0].left : PRESET_DUELS[0].right;
  }
  try {
    const raw = localStorage.getItem(side === 'left' ? STORAGE_KEYS.LEFT_CANDIDATE : STORAGE_KEYS.RIGHT_CANDIDATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name && parsed.number) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading candidate from storage', e);
  }
  return side === 'left' ? PRESET_DUELS[0].left : PRESET_DUELS[0].right;
}

export function saveCandidate(side: 'left' | 'right', candidate: Candidate) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      side === 'left' ? STORAGE_KEYS.LEFT_CANDIDATE : STORAGE_KEYS.RIGHT_CANDIDATE,
      JSON.stringify(candidate)
    );
  } catch (e) {
    console.error('Error saving candidate to storage', e);
  }
}

export function getSavedRoundDuration(defaultValue = 125): number {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUND_DURATION);
    if (raw) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 5) return val;
    }
  } catch (e) {}
  return defaultValue;
}

export function saveRoundDuration(duration: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ROUND_DURATION, String(duration));
  } catch (e) {}
}

export function getSavedVictoryScore(): VictoryScore {
  if (typeof window === 'undefined') return { left: 0, right: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VICTORY_SCORE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.left === 'number' && typeof parsed?.right === 'number') {
        return parsed;
      }
    }
  } catch (e) {}
  return { left: 0, right: 0 };
}

export function saveVictoryScore(score: VictoryScore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.VICTORY_SCORE, JSON.stringify(score));
  } catch (e) {}
}

export function getSavedPoints(): { leftPoints: number; rightPoints: number; leftGifts: number; rightGifts: number } {
  if (typeof window === 'undefined') return { leftPoints: 0, rightPoints: 0, leftGifts: 0, rightGifts: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POINTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.leftPoints === 'number' && typeof parsed?.rightPoints === 'number') {
        return parsed;
      }
    }
  } catch (e) {}
  return { leftPoints: 0, rightPoints: 0, leftGifts: 0, rightGifts: 0 };
}

export function savePoints(data: { leftPoints: number; rightPoints: number; leftGifts: number; rightGifts: number }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.POINTS, JSON.stringify(data));
  } catch (e) {}
}

export function getSavedRoundNumber(defaultValue = 1): number {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROUND_NUMBER);
    if (raw) {
      const val = parseInt(raw, 10);
      if (!isNaN(val) && val >= 1) return val;
    }
  } catch (e) {}
  return defaultValue;
}

export function saveRoundNumber(num: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ROUND_NUMBER, String(num));
  } catch (e) {}
}

export function getSavedTikTokConfig(): TikTokConfig {
  if (typeof window === 'undefined') return { username: 'leonardosutello', autoConnect: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIKTOK_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        username: parsed?.username || 'leonardosutello',
        autoConnect: parsed?.autoConnect !== false,
      };
    }
  } catch (e) {}
  return { username: 'leonardosutello', autoConnect: true };
}

export function saveTikTokConfig(config: TikTokConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TIKTOK_CONFIG, JSON.stringify(config));
  } catch (e) {}
}
