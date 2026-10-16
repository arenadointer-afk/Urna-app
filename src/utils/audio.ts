// Brazilian Urna Electronic Audio Synthesizer & Procedural Live BGM via Web Audio API
// No external assets required, 100% reliable, zero latency, zero copyright strikes

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let soundVolume = 0.8;
let musicVolume = 0.5;
export type MusicTrackType = 'hype' | 'suspense' | 'marchinha' | 'retro' | 'off';

let currentMusicTrack: MusicTrackType = 'off';
let musicInterval: ReturnType<typeof setInterval> | null = null;
let customAudioElement: HTMLAudioElement | null = null;

export function setSoundVolume(volume: number) {
  soundVolume = Math.max(0, Math.min(1, volume));
  if (customAudioElement) {
    customAudioElement.volume = musicVolume * soundVolume;
  }
}

export function setMusicVolume(volume: number) {
  musicVolume = Math.max(0, Math.min(1, volume));
  if (customAudioElement) {
    customAudioElement.volume = musicVolume * soundVolume;
  }
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (!enabled) {
    stopMusic();
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function getMusicTrack(): MusicTrackType {
  return currentMusicTrack;
}

export function initAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Click sound on Urna keypad (short 850Hz sine beep)
 */
export function playKeyBeep() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.25 * soundVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (err) {
    console.debug('Audio error', err);
  }
}

/**
 * Authentic Brazilian Urna Eletrônica "PIRILILILI" Confirmation Buzzer
 */
export function playUrnaConfirmSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 1150, start: 0, dur: 0.1 },
      { freq: 1450, start: 0.11, dur: 0.1 },
      { freq: 1750, start: 0.22, dur: 0.1 },
      { freq: 2150, start: 0.33, dur: 0.45 },
    ];

    notes.forEach(({ freq, start, dur }, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      if (idx === notes.length - 1) {
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibrato.frequency.value = 16;
        vibratoGain.gain.value = 40;
        vibrato.connect(osc.frequency);
        vibrato.start(now + start);
        vibrato.stop(now + start + dur);
      }

      const noteVolume = 0.35 * soundVolume;
      gain.gain.setValueAtTime(noteVolume, now + start);
      gain.gain.setValueAtTime(noteVolume, now + start + dur - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
    });
  } catch (err) {
    console.debug('Audio error', err);
  }
}

export function playVoteSound() {
  playUrnaConfirmSound();
}

/**
 * Gift sound
 */
export function playGiftSound(isHuge = false) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const count = isHuge ? 8 : 4;
    const baseFreq = isHuge ? 500 : 800;

    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isHuge ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(baseFreq + i * (isHuge ? 140 : 180), now + i * 0.05);

      gain.gain.setValueAtTime((isHuge ? 0.3 : 0.2) * soundVolume, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + (isHuge ? 0.25 : 0.12));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + (isHuge ? 0.25 : 0.12));
    }
  } catch (err) {
    console.debug('Audio error', err);
  }
}

/**
 * Huge Gift Epic Fanfare (Leão, Galáxia, Donut, 100x)
 */
export function playHugeGiftCelebration() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Heavy bass drop impact
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(140, now);
    bassOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
    bassGain.gain.setValueAtTime(0.4 * soundVolume, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.4);

    // 2. Rising triumphant arpeggio
    const notes = [
      { f: 523.25, t: 0.05, d: 0.12 },
      { f: 659.25, t: 0.15, d: 0.12 },
      { f: 783.99, t: 0.25, d: 0.12 },
      { f: 1046.50, t: 0.35, d: 0.4 },
      { f: 1318.51, t: 0.45, d: 0.5 },
      { f: 1567.98, t: 0.55, d: 0.7 },
    ];

    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.35 * soundVolume, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d);
    });

    // 3. Shimmering coins sparkle
    for (let c = 0; c < 6; c++) {
      const spark = ctx.createOscillator();
      const sparkGain = ctx.createGain();
      spark.type = 'sine';
      spark.frequency.setValueAtTime(2200 + c * 350, now + 0.2 + c * 0.08);
      sparkGain.gain.setValueAtTime(0.12 * soundVolume, now + 0.2 + c * 0.08);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + c * 0.08 + 0.1);
      spark.connect(sparkGain);
      sparkGain.connect(ctx.destination);
      spark.start(now + 0.2 + c * 0.08);
      spark.stop(now + 0.2 + c * 0.08 + 0.1);
    }
  } catch (err) {
    console.debug('Audio error', err);
  }
}

/**
 * Round victory fanfare
 */
export function playVictoryFanfare() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chords = [
      { freqs: [523.25, 659.25, 783.99], start: 0, dur: 0.25 },
      { freqs: [587.33, 739.99, 880.00], start: 0.25, dur: 0.25 },
      { freqs: [659.25, 830.61, 987.77], start: 0.5, dur: 0.3 },
      { freqs: [783.99, 987.77, 1174.66, 1567.98], start: 0.85, dur: 0.8 },
    ];

    chords.forEach(({ freqs, start, dur }) => {
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.15 * soundVolume, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    });
  } catch (err) {
    console.debug('Audio error', err);
  }
}

/**
 * Procedural Live Background Music Looper
 */
export function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  if (customAudioElement) {
    try {
      customAudioElement.pause();
      customAudioElement.currentTime = 0;
    } catch (_) {}
  }
  currentMusicTrack = 'off';
}

export function playMusicTrack(track: MusicTrackType, customUrl?: string) {
  stopMusic();
  currentMusicTrack = track;
  if (track === 'off' || !soundEnabled) return;

  if (customUrl) {
    try {
      if (!customAudioElement) {
        customAudioElement = new Audio(customUrl);
        customAudioElement.loop = true;
      } else {
        customAudioElement.src = customUrl;
      }
      customAudioElement.volume = musicVolume * soundVolume;
      customAudioElement.play().catch(() => {});
      return;
    } catch (e) {
      console.debug('Custom audio play error', e);
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  let step = 0;
  const tempo =
    track === 'hype' ? 220 : track === 'suspense' ? 360 : track === 'retro' ? 180 : 210;

  // Hype bassline notes (Trap / Beat agressivo)
  const hypeScale = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 123.47];
  // Suspense heartbeat sub-bass (Reta final)
  const suspenseScale = [55, 0, 55, 0, 65.41, 0, 55, 0];
  // Marchinha / Ritmo festivo brasileiro
  const marchinhaScale = [130.81, 164.81, 196, 220, 196, 164.81, 146.83, 130.81];
  // Retro 8-bit chiptune
  const retroScale = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23];

  musicInterval = setInterval(() => {
    if (!soundEnabled || currentMusicTrack === 'off') {
      stopMusic();
      return;
    }

    const activeCtx = getAudioContext();
    if (!activeCtx) return;

    try {
      const now = activeCtx.currentTime;
      let freq = 0;

      if (currentMusicTrack === 'hype') {
        freq = hypeScale[step % hypeScale.length];
      } else if (currentMusicTrack === 'suspense') {
        freq = suspenseScale[step % suspenseScale.length];
      } else if (currentMusicTrack === 'marchinha') {
        freq = marchinhaScale[step % marchinhaScale.length];
      } else if (currentMusicTrack === 'retro') {
        freq = retroScale[step % retroScale.length];
      }

      if (freq > 0) {
        const osc = activeCtx.createOscillator();
        const gain = activeCtx.createGain();

        osc.type =
          currentMusicTrack === 'suspense'
            ? 'sine'
            : currentMusicTrack === 'retro'
            ? 'square'
            : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const vol = 0.08 * musicVolume * soundVolume;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (tempo / 1000) * 0.85);

        osc.connect(gain);
        gain.connect(activeCtx.destination);

        osc.start(now);
        osc.stop(now + (tempo / 1000) * 0.85);
      }

      // Add rhythmic percussion click / hi-hat on upbeat
      if (step % 2 === 1 && currentMusicTrack !== 'suspense') {
        const hat = activeCtx.createOscillator();
        const hatGain = activeCtx.createGain();
        hat.type = 'triangle';
        hat.frequency.setValueAtTime(3500 + Math.random() * 500, now);
        hatGain.gain.setValueAtTime(0.03 * musicVolume * soundVolume, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        hat.connect(hatGain);
        hatGain.connect(activeCtx.destination);
        hat.start(now);
        hat.stop(now + 0.04);
      }

      step++;
    } catch (e) {
      console.debug('Music synth error', e);
    }
  }, tempo);
}
