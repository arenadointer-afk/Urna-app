import React, { useState } from 'react';
import { Candidate, VictoryScore } from '../types';
import { MusicTrackType } from '../utils/audio';
import { ChevronDown } from 'lucide-react';

interface TopHeaderProps {
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  leftPoints: number;
  rightPoints: number;
  timeLeft: number;
  onOpenAdmin: () => void;
  victoryScore: VictoryScore;
  roundNumber: number;
  onUpdateRoundNumber?: (num: number) => void;
  musicTrack?: MusicTrackType;
  onChangeMusicTrack?: (track: MusicTrackType) => void;
}

const TRACK_OPTIONS: { id: MusicTrackType; name: string; icon: string; badge: string }[] = [
  { id: 'suspense', name: 'Suspense Épico', icon: '🔥', badge: 'DRAMA' },
  { id: 'hype', name: 'Plantão / Hype', icon: '🚨', badge: 'GLOBO' },
  { id: 'marchinha', name: 'Hino Eleições', icon: '🇧🇷', badge: 'OFICIAL' },
  { id: 'retro', name: 'Cyber Chiptune', icon: '⚡', badge: 'BATIDA' },
  { id: 'off', name: 'Desligado (Sem Som)', icon: '🔇', badge: 'MUDO' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  leftCandidate,
  rightCandidate,
  leftPoints,
  rightPoints,
  timeLeft,
  onOpenAdmin,
  victoryScore,
  roundNumber,
  onUpdateRoundNumber,
  musicTrack = 'off',
  onChangeMusicTrack,
}) => {
  const [isMusicMenuOpen, setIsMusicMenuOpen] = useState(false);
  const total = leftPoints + rightPoints;
  const difference = Math.abs(leftPoints - rightPoints);

  const leader =
    leftPoints > rightPoints ? 'left' : rightPoints > leftPoints ? 'right' : 'draw';

  // Format timer 02:05
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <header className="w-full flex flex-col items-center select-none pt-1 shrink-0 px-2">
      {/* 1. Golden 3D Title Banner: ELEIÇÕES 2026 INTERATIVO (Secret tap to open ADM) */}
      <div
        onClick={onOpenAdmin}
        title="Eleições 2026 Interativo"
        className="relative flex flex-col items-center mb-1 cursor-default active:scale-[0.99] transition-transform"
      >
        {/* Brazilian Ribbon background */}
        <div className="absolute -inset-x-6 -top-1 h-10 bg-gradient-to-r from-emerald-600 via-yellow-400 to-emerald-600 rounded-full blur-[2px] opacity-70" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Main Gold 3D Title */}
          <h1
            className="text-2xl sm:text-3xl font-black italic tracking-wider uppercase text-yellow-300 drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]"
            style={{
              textShadow: '0 2px 0 #b45309, 0 4px 0 #78350f, 0 6px 12px rgba(0,0,0,0.9)',
              fontFamily: "'Chakra Petch', sans-serif",
            }}
          >
            ELEIÇÕES 2026
          </h1>

          {/* INTERATIVO Blue Banner Badge */}
          <div className="px-5 py-0.5 -mt-1 rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700 border-2 border-yellow-300 shadow-md">
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-white uppercase drop-shadow">
              INTERATIVO
            </span>
          </div>
        </div>
      </div>

      {/* PLACAR DE VITÓRIAS GERAL DA SÉRIE (NUNCA ZERA AO RECARREGAR) */}
      <div className="w-full max-w-md flex items-center justify-between px-2 py-0.5 mb-1 bg-black/70 rounded-full border border-amber-500/40 shadow-lg">
        <div className="flex items-center gap-1.5 pl-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black tracking-wider text-amber-400 uppercase">
              RODADA #{roundNumber}
            </span>
            {onUpdateRoundNumber && (
              <div className="flex items-center gap-0.5 ml-0.5">
                <button
                  type="button"
                  onClick={() => onUpdateRoundNumber(Math.max(1, roundNumber - 1))}
                  title="Diminuir rodada"
                  className="w-4 h-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-[10px] font-bold border border-slate-700 cursor-pointer"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateRoundNumber(roundNumber + 1)}
                  title="Avançar rodada"
                  className="w-4 h-4 rounded-full bg-amber-500/80 hover:bg-amber-400 text-zinc-950 flex items-center justify-center text-[10px] font-black border border-amber-400 cursor-pointer"
                >
                  +
                </button>
              </div>
            )}
          </div>
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 uppercase font-black tracking-tight flex items-center gap-0.5">
            <span>☁️</span> Nuvem
          </span>
        </div>

        <div className="flex items-center gap-1.5 pr-1">
          {/* Quick Music Toggle */}
          {onChangeMusicTrack && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMusicMenuOpen((prev) => !prev)}
                title="Mudar Música da Live (ou aperte a tecla M)"
                className="px-2 py-0.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-black text-[9px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow"
              >
                <span>🎵</span>
                <span className="capitalize text-[8.5px]">
                  {musicTrack === 'off' ? 'Mudo' : musicTrack}
                </span>
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isMusicMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMusicMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMusicMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-6 z-50 w-52 p-1.5 rounded-2xl bg-zinc-950/95 border-2 border-amber-500/80 shadow-2xl backdrop-blur-md flex flex-col gap-1 text-white animate-fade-in">
                    <div className="px-2 py-1 border-b border-zinc-800 flex items-center justify-between text-[10px] text-amber-400 font-black uppercase">
                      <span>Música de Fundo</span>
                      <span className="text-[8px] text-slate-400 font-mono">Tecla [M]</span>
                    </div>
                    {TRACK_OPTIONS.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => {
                          onChangeMusicTrack(track.id);
                          setIsMusicMenuOpen(false);
                        }}
                        className={`px-2 py-1.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          musicTrack === track.id
                            ? 'bg-amber-500 text-zinc-950 font-black'
                            : 'hover:bg-zinc-800/80 text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{track.icon}</span>
                          <span>{track.name}</span>
                        </div>
                        <span className={`text-[8px] px-1 py-0.2 rounded font-black uppercase ${
                          musicTrack === track.id ? 'bg-zinc-950 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {track.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-300 hidden sm:inline">
            PLACAR:
          </span>
          <div className="flex items-center gap-1 font-digital font-black text-xs sm:text-sm">
            <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white shadow border border-red-400">
              {victoryScore.left}
            </span>
            <span className="text-yellow-400 font-extrabold text-xs">✕</span>
            <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white shadow border border-blue-400">
              {victoryScore.right}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Timer & Gifts Row (Rosa +1 - Timer 02:05 - Sorvete +1 + AO VIVO) */}
      <div className="w-full max-w-md flex items-center justify-between px-1 my-1">
        {/* Left: Gift +1 / Voto Left (Vermelho) */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-2xl border border-red-500/80 shadow">
            <span className="text-2xl sm:text-3xl filter drop-shadow">
              {leftCandidate.primaryGift.icon || '🌹'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-white font-black font-digital text-[11px] shadow border border-white/80 bg-red-600">
              +1
            </span>
          </div>
          <div className="mt-1 px-2.5 py-0.5 rounded-md text-white font-black text-[9px] sm:text-[10px] tracking-tight uppercase shadow border border-red-400 bg-red-600 whitespace-nowrap">
            VOTO NO {leftCandidate.number}
          </div>
        </div>

        {/* Center: Black Pill Timer (02:05) */}
        <div className="flex flex-col items-center mx-1">
          <div
            className={`px-4 sm:px-6 py-1 rounded-2xl bg-black/95 border-2 shadow-2xl font-digital font-black text-2xl sm:text-3xl tracking-widest text-white ${
              timeLeft <= 10
                ? 'border-red-500 text-red-400 animate-pulse scale-105 shadow-red-500/50'
                : 'border-slate-700 text-white'
            }`}
          >
            {formattedTime}
          </div>
        </div>

        {/* Right: Gift +1 / Voto Right (Azul) + AO VIVO badge */}
        <div className="flex flex-col items-center relative">
          {/* AO VIVO pill badge */}
          <div className="absolute -top-2.5 -right-1 z-20 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black text-[7.5px] uppercase tracking-wider animate-pulse shadow">
            AO VIVO
          </div>
          <div className="relative flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-2xl border border-blue-500/80 shadow">
            <span className="text-2xl sm:text-3xl filter drop-shadow">
              {rightCandidate.primaryGift.icon || '🍦'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-white font-black font-digital text-[11px] shadow border border-white/80 bg-blue-600">
              +1
            </span>
          </div>
          <div className="mt-1 px-2.5 py-0.5 rounded-md text-white font-black text-[9px] sm:text-[10px] tracking-tight uppercase shadow border border-blue-400 bg-blue-600 whitespace-nowrap">
            VOTO NO {rightCandidate.number}
          </div>
        </div>
      </div>

      {/* 3. Status Bar: TOTAL | DIFERENÇA | LÍDER */}
      <div className="w-full max-w-md grid grid-cols-3 gap-1.5 px-1 my-1">
        {/* TOTAL */}
        <div className="py-1 px-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-center flex flex-col justify-center">
          <span className="text-[8px] font-black tracking-wider text-slate-400 uppercase">
            TOTAL
          </span>
          <span className="text-sm sm:text-base font-black font-digital text-white leading-none mt-0.5">
            {total}
          </span>
        </div>

        {/* DIFERENÇA */}
        <div className="py-1 px-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-center flex flex-col justify-center">
          <span className="text-[8px] font-black tracking-wider text-slate-400 uppercase">
            DIFERENÇA
          </span>
          <span className="text-sm sm:text-base font-black font-digital text-amber-300 leading-none mt-0.5">
            {difference}
          </span>
        </div>

        {/* LEADER BADGE */}
        <div
          className={`py-1 px-1.5 rounded-xl text-center flex flex-col justify-center shadow-lg transition-all text-white font-black uppercase ${
            leader === 'left'
              ? 'bg-red-600 border border-red-400 animate-pulse'
              : leader === 'right'
              ? 'bg-blue-600 border border-blue-400 animate-pulse'
              : 'bg-amber-600 border border-amber-400'
          }`}
        >
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight truncate leading-tight">
            {leader === 'left'
              ? `${leftCandidate.number} NA FRENTE`
              : leader === 'right'
              ? `${rightCandidate.number} NA FRENTE`
              : 'TUDO IGUAL'}
          </span>
        </div>
      </div>
    </header>
  );
};
