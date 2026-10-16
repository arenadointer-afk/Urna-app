// Brazilian Urna Electronic Audio Synthesizer & Procedural Live BGM via Web Audio API
// High-fidelity, smooth audio with Master Compressor to completely eliminate noise, pops, and "chiado" (harsh static)

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let soundEnabled = true;
let soundVolume = 0.8;
let musicVolume = 0.6;

export type MusicTrackType = 'hype' | 'suspense' | 'marchinha' | 'retro' | 'custom' | 'off';

let currentMusicTrack: MusicTrackType = 'off';
let musicInterval: ReturnType<typeof setInterval> | null = null;
let customAudioElement: HTMLAudioElement | null = null;
let customAudioName = 'Música Personalizada';
let isAudioPlaying = false;

// 1. Persistência da música escolhida no localStorage
export function getSavedMusicTrack(): MusicTrackType {
  if (typeof window === 'undefined') return 'off';
  try {
    const saved = localStorage.getItem('urna_selected_music_track');
    if (saved && ['hype', 'suspense', 'marchinha', 'retro', 'custom', 'off'].includes(saved)) {
      return saved as MusicTrackType;
    }
  } catch (_) {}
  return 'off';
}

export function saveSelectedMusicTrack(track: MusicTrackType) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('urna_selected_music_track', track);
  } catch (_) {}
}

// Tenta restaurar música personalizada salva no navegador
if (typeof window !== 'undefined') {
  try {
    const savedTrack = getSavedMusicTrack();
    if (savedTrack) currentMusicTrack = savedTrack;

    const savedCustomData = localStorage.getItem('urna_custom_music_data');
    const savedCustomName = localStorage.getItem('urna_custom_music_name');
    if (savedCustomData) {
      customAudioElement = new Audio(savedCustomData);
      customAudioElement.loop = true;
      if (savedCustomName) customAudioName = savedCustomName;
    }
  } catch (e) {
    console.debug('Não foi possível restaurar áudio personalizado do cache local', e);
  }
}

export function setSoundVolume(volume: number) {
  soundVolume = Math.max(0, Math.min(1, volume));
  if (masterGain && audioCtx) {
    try {
      masterGain.gain.setValueAtTime(soundVolume, audioCtx.currentTime);
    } catch (_) {}
  }
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

export function getMusicVolume() {
  return musicVolume;
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

export function isMusicPlaying(): boolean {
  return isAudioPlaying && currentMusicTrack !== 'off';
}

export function getCustomAudioInfo() {
  return {
    hasCustom: Boolean(customAudioElement && customAudioElement.src),
    name: customAudioName,
    src: customAudioElement?.src || '',
  };
}

export function setCustomAudioData(dataUrlOrBlob: string, fileName?: string) {
  if (customAudioElement) {
    try {
      customAudioElement.pause();
    } catch (_) {}
  }
  customAudioElement = new Audio(dataUrlOrBlob);
  customAudioElement.loop = true;
  customAudioElement.volume = musicVolume * soundVolume;
  if (fileName) {
    customAudioName = fileName;
  }

  // Salva no localStorage para persistir após F5 se não exceder cota do navegador
  if (typeof window !== 'undefined') {
    try {
      if (dataUrlOrBlob.length < 5000000) {
        localStorage.setItem('urna_custom_music_data', dataUrlOrBlob);
        localStorage.setItem('urna_custom_music_name', customAudioName);
      }
    } catch (e) {
      console.warn('Áudio personalizado não pôde ser gravado no localStorage (tamanho grande):', e);
    }
  }
}

export function removeCustomAudio() {
  if (customAudioElement) {
    try {
      customAudioElement.pause();
    } catch (_) {}
    customAudioElement = null;
  }
  customAudioName = 'Música Personalizada';
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('urna_custom_music_data');
      localStorage.removeItem('urna_custom_music_name');
    } catch (_) {}
  }
  if (currentMusicTrack === 'custom') {
    stopMusic();
    saveSelectedMusicTrack('off');
  }
}

export function initAudioContext(): AudioContext | null {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();

      // Master Compressor + Gain Pipeline: elimina completamente chiado, estalos e clipping digital
      try {
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(soundVolume, audioCtx.currentTime);

        masterCompressor = audioCtx.createDynamicsCompressor();
        masterCompressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
        masterCompressor.knee.setValueAtTime(30, audioCtx.currentTime);
        masterCompressor.ratio.setValueAtTime(4, audioCtx.currentTime);
        masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
        masterCompressor.release.setValueAtTime(0.25, audioCtx.currentTime);

        masterGain.connect(masterCompressor);
        masterCompressor.connect(audioCtx.destination);
      } catch (e) {
        console.debug('Compressor setup error', e);
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function getDestination(): AudioNode | null {
  return masterGain || audioCtx?.destination || null;
}

/**
 * Click sound on Urna keypad (short 850Hz smooth sine beep - zero clicks / pops)
 */
export function playKeyBeep() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  const dest = getDestination();
  if (!ctx || !dest) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.05);

    osc.onended = () => {
      try {
        gain.disconnect();
        osc.disconnect();
      } catch (_) {}
    };
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
  const dest = getDestination();
  if (!ctx || !dest) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 1150, start: 0, dur: 0.09 },
      { freq: 1450, start: 0.1, dur: 0.09 },
      { freq: 1750, start: 0.2, dur: 0.09 },
      { freq: 2150, start: 0.3, dur: 0.42 },
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
        vibratoGain.gain.value = 35;
        vibrato.connect(osc.frequency);
        vibrato.start(now + start);
        vibrato.stop(now + start + dur);
        vibrato.onended = () => {
          try {
            vibratoGain.disconnect();
            vibrato.disconnect();
          } catch (_) {}
        };
      }

      const noteVolume = 0.38;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(noteVolume, now + start + 0.01);
      gain.gain.setValueAtTime(noteVolume, now + start + dur - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now + start);
      osc.stop(now + start + dur);

      osc.onended = () => {
        try {
          gain.disconnect();
          osc.disconnect();
        } catch (_) {}
      };
    });
  } catch (err) {
    console.debug('Audio error', err);
  }
}

export function playVoteSound() {
  playUrnaConfirmSound();
}

/**
 * Gift sound - pleasant harmonic chime
 */
export function playGiftSound(isHuge = false) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  const dest = getDestination();
  if (!ctx || !dest) return;

  try {
    const now = ctx.currentTime;
    const count = isHuge ? 6 : 4;
    const baseFreq = isHuge ? 520 : 780;

    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq + i * (isHuge ? 130 : 160), now + i * 0.05);

      const vol = isHuge ? 0.3 : 0.2;
      gain.gain.setValueAtTime(0.0001, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(vol, now + i * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + (isHuge ? 0.25 : 0.12));

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + (isHuge ? 0.25 : 0.12));

      osc.onended = () => {
        try {
          gain.disconnect();
          osc.disconnect();
        } catch (_) {}
      };
    }
  } catch (err) {
    console.debug('Audio error', err);
  }
}

/**
 * Huge Gift Epic Fanfare
 */
export function playHugeGiftCelebration() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  const dest = getDestination();
  if (!ctx || !dest) return;

  try {
    const now = ctx.currentTime;

    // 1. Warm bass drop
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(130, now);
    bassOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.4, now + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    bassOsc.connect(bassGain);
    bassGain.connect(dest);
    bassOsc.start(now);
    bassOsc.stop(now + 0.4);
    bassOsc.onended = () => {
      try {
        bassGain.disconnect();
        bassOsc.disconnect();
      } catch (_) {}
    };

    // 2. Rising triumphant arpeggio
    const notes = [
      { f: 523.25, t: 0.05, d: 0.12 },
      { f: 659.25, t: 0.15, d: 0.12 },
      { f: 783.99, t: 0.25, d: 0.12 },
      { f: 1046.5, t: 0.35, d: 0.4 },
      { f: 1318.51, t: 0.45, d: 0.5 },
      { f: 1567.98, t: 0.55, d: 0.7 },
    ];

    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.3, now + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + t);
      osc.stop(now + t + d);
      osc.onended = () => {
        try {
          gain.disconnect();
          osc.disconnect();
        } catch (_) {}
      };
    });
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
  const dest = getDestination();
  if (!ctx || !dest) return;

  try {
    const now = ctx.currentTime;
    const chords = [
      { freqs: [523.25, 659.25, 783.99], start: 0, dur: 0.25 },
      { freqs: [587.33, 739.99, 880.0], start: 0.25, dur: 0.25 },
      { freqs: [659.25, 830.61, 987.77], start: 0.5, dur: 0.3 },
      { freqs: [783.99, 987.77, 1174.66, 1567.98], start: 0.85, dur: 0.8 },
    ];

    chords.forEach(({ freqs, start, dur }) => {
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.22, now + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(now + start);
        osc.stop(now + start + dur);

        osc.onended = () => {
          try {
            gain.disconnect();
            osc.disconnect();
          } catch (_) {}
        };
      });
    });
  } catch (err) {
    console.debug('Audio error', err);
  }
}

/**
 * Stop any current playing background music
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
  isAudioPlaying = false;
  currentMusicTrack = 'off';
}

/**
 * Main function to play music: works for built-in synthesized beats or custom uploaded audio
 * Uses warm acoustic sine/triangle waves with Low-Pass filter to guarantee NO CHIADO/STATIC NOISE.
 */
export function playMusicTrack(track: MusicTrackType, customUrl?: string) {
  stopMusic();
  currentMusicTrack = track;
  saveSelectedMusicTrack(track);

  if (track === 'off' || !soundEnabled) return;

  // Unlocks audio context on user gesture
  const ctx = initAudioContext();
  const dest = getDestination();

  // Caso 1: Música Personalizada (Upload MP3 / WAV do Celular ou PC)
  if (track === 'custom' || customUrl) {
    try {
      const sourceUrl = customUrl || customAudioElement?.src;
      if (sourceUrl) {
        if (!customAudioElement) {
          customAudioElement = new Audio(sourceUrl);
        } else if (customAudioElement.src !== sourceUrl) {
          customAudioElement.src = sourceUrl;
        }
        customAudioElement.loop = true;
        customAudioElement.volume = musicVolume * soundVolume;
        const playPromise = customAudioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isAudioPlaying = true;
            })
            .catch((err) => {
              console.warn('Erro ao tocar áudio personalizado (toque na tela para liberar):', err);
            });
        }
        return;
      }
    } catch (e) {
      console.warn('Falha ao reproduzir áudio personalizado:', e);
    }
  }

  if (!ctx || !dest) return;
  isAudioPlaying = true;

  let step = 0;
  // Tempos em ms para cada batida (tempo estável sem sobrecarga de timers)
  const tempo =
    track === 'hype' ? 200 : track === 'suspense' ? 380 : track === 'retro' ? 180 : 220;

  // Melodias suaves e harmônicas
  const hypeScale = [110, 110, 146.83, 164.81, 130.81, 146.83, 164.81, 220];
  const suspenseScale = [65.41, 0, 73.42, 0, 82.41, 0, 65.41, 0];
  const marchinhaScale = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 329.63];
  const retroScale = [261.63, 329.63, 392.0, 523.25, 659.25, 523.25, 392.0, 440.0];

  musicInterval = setInterval(() => {
    if (!soundEnabled || currentMusicTrack === 'off') {
      stopMusic();
      return;
    }

    const activeCtx = getAudioContext();
    const activeDest = getDestination();
    if (!activeCtx || !activeDest) return;

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

      // 1. Sintetizador de Melodia / Baixo (com filtro passa-baixas para eliminar qualquer chiado)
      if (freq > 0) {
        const osc = activeCtx.createOscillator();
        const gain = activeCtx.createGain();
        const filter = activeCtx.createBiquadFilter();

        // Filtro passa-baixa em 1200Hz corta qualquer chiado ou ruído agudo
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        osc.type = currentMusicTrack === 'suspense' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const vol = 0.22 * musicVolume;
        // Envelope suave sem clique
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (tempo / 1000) * 0.85);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(activeDest);

        osc.start(now);
        osc.stop(now + (tempo / 1000) * 0.85);

        osc.onended = () => {
          try {
            gain.disconnect();
            filter.disconnect();
            osc.disconnect();
          } catch (_) {}
        };
      }

      // 2. Bumbo Suave (Kick Drum) no tempo forte (passo 0, 2, 4, 6)
      if (step % 2 === 0 && currentMusicTrack !== 'suspense') {
        const kickOsc = activeCtx.createOscillator();
        const kickGain = activeCtx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(100, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

        kickGain.gain.setValueAtTime(0.0001, now);
        kickGain.gain.exponentialRampToValueAtTime(0.32 * musicVolume, now + 0.01);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

        kickOsc.connect(kickGain);
        kickGain.connect(activeDest);

        kickOsc.start(now);
        kickOsc.stop(now + 0.13);

        kickOsc.onended = () => {
          try {
            kickGain.disconnect();
            kickOsc.disconnect();
          } catch (_) {}
        };
      }

      step++;
    } catch (e) {
      console.debug('Music synth tick error', e);
    }
  }, tempo);
}
