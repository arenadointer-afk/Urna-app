import React from 'react';
import { Candidate } from '../types';
import { Volume2, VolumeX, Flame, Zap, Trophy } from 'lucide-react';

interface ScoreBoardProps {
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  leftPoints: number;
  rightPoints: number;
  timeLeft: number;
  roundNumber: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  leftCandidate,
  rightCandidate,
  leftPoints,
  rightPoints,
  timeLeft,
  roundNumber,
  soundEnabled,
  onToggleSound,
}) => {
  const totalPoints = leftPoints + rightPoints;
  const difference = Math.abs(leftPoints - rightPoints);

  // Percentage calculations
  let leftPct = 50;
  let rightPct = 50;
  if (totalPoints > 0) {
    leftPct = Math.round((leftPoints / totalPoints) * 100);
    rightPct = 100 - leftPct;
  }

  // Leader status
  const leader =
    leftPoints > rightPoints
      ? 'left'
      : rightPoints > leftPoints
      ? 'right'
      : 'tied';

  // Format timer 00:35
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="w-full flex flex-col items-center gap-2 max-w-4xl px-2">
      {/* Top Header Bar: Round, Sound toggle, and Live Badge */}
      <div className="w-full flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black tracking-wider uppercase text-[10px] animate-pulse shadow-lg shadow-red-900/50">
            <span className="w-2 h-2 rounded-full bg-white" />
            AO VIVO
          </span>
          <span className="font-extrabold text-slate-300 text-xs tracking-wide">
            RODADA #{roundNumber}
          </span>
        </div>

        {/* Audio Mute/Unmute Quick Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer text-xs"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-bold">SOM ATIVADO</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-bold">MUTADO</span>
            </>
          )}
        </button>
      </div>

      {/* Main Top Center Card: Cronômetro & Selo de Liderança */}
      <div className="w-full bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/95 border-2 border-slate-700/70 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col items-center">
        {/* Timer & Difference Row */}
        <div className="flex items-center justify-between w-full mb-1">
          {/* Total de Votos */}
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              TOTAL DE VOTOS
            </span>
            <span className="text-lg sm:text-xl font-black font-digital text-amber-400 tracking-wider">
              {totalPoints}
            </span>
          </div>

          {/* Central Animated Countdown Timer (00:35) */}
          <div className="flex flex-col items-center">
            <div
              className={`px-4 py-1 rounded-xl border-2 font-digital font-black text-2xl sm:text-3xl tracking-widest shadow-inner ${
                timeLeft <= 10
                  ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse scale-105 shadow-red-500/50'
                  : 'bg-slate-950 border-amber-500/60 text-amber-300'
              }`}
            >
              ⏱️ {formattedTime}
            </div>
            <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
              Tempo Restante
            </span>
          </div>

          {/* Diferença */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              DIFERENÇA
            </span>
            <span className="text-lg sm:text-xl font-black font-digital text-white tracking-wider">
              {difference}
            </span>
          </div>
        </div>

        {/* Dynamic Leader Status Badge */}
        <div className="my-1">
          {leader === 'left' && (
            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-red-600/90 text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-red-400 shadow-lg shadow-red-600/50 animate-bounce">
              <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>{leftCandidate.number} NA FRENTE!</span>
              <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </div>
          )}
          {leader === 'right' && (
            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-blue-600/90 text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-blue-400 shadow-lg shadow-blue-600/50 animate-bounce">
              <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>{rightCandidate.number} NA FRENTE!</span>
              <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </div>
          )}
          {leader === 'tied' && (
            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/90 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-amber-300 shadow-lg shadow-amber-500/50 animate-pulse">
              <Zap className="w-4 h-4 fill-zinc-950" />
              <span>EMPATE DISPUTADO! MANDE PRESENTE!</span>
              <Zap className="w-4 h-4 fill-zinc-950" />
            </div>
          )}
        </div>

        {/* Big Scoreboards: Points and Percentage */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full my-1 sm:my-1.5">
          {/* Left Placard (Red) */}
          <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-red-950/80 to-red-900/40 border border-red-500/40 shadow-inner min-w-0 overflow-hidden">
            <span className="text-[10px] sm:text-xs font-black text-red-300 tracking-tight truncate max-w-full text-center px-1">
              {leftCandidate.name} ({leftCandidate.number})
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-4xl font-black font-digital text-white drop-shadow-[0_2px_10px_rgba(239,68,68,0.6)]">
                {leftPoints}
              </span>
              <span className="text-base sm:text-xl font-black font-digital text-red-400">
                {leftPct}%
              </span>
            </div>
          </div>

          {/* Right Placard (Blue) */}
          <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-950/80 to-blue-900/40 border border-blue-500/40 shadow-inner min-w-0 overflow-hidden">
            <span className="text-[10px] sm:text-xs font-black text-blue-300 tracking-tight truncate max-w-full text-center px-1">
              {rightCandidate.name} ({rightCandidate.number})
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-4xl font-black font-digital text-white drop-shadow-[0_2px_10px_rgba(59,130,246,0.6)]">
                {rightPoints}
              </span>
              <span className="text-base sm:text-xl font-black font-digital text-blue-400">
                {rightPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Tug of war progress bar */}
        <div className="w-full h-4 sm:h-5 rounded-full overflow-hidden flex bg-zinc-900 border-2 border-zinc-700 shadow-inner mt-1">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 flex items-center justify-start pl-2"
            style={{ width: `${leftPct}%` }}
          >
            {leftPct > 12 && (
              <span className="text-[10px] font-black text-white drop-shadow">
                {leftCandidate.number} ({leftPct}%)
              </span>
            )}
          </div>
          <div
            className="h-full bg-gradient-to-l from-blue-600 to-blue-400 transition-all duration-300 flex items-center justify-end pr-2"
            style={{ width: `${rightPct}%` }}
          >
            {rightPct > 12 && (
              <span className="text-[10px] font-black text-white drop-shadow">
                ({rightPct}%) {rightCandidate.number}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
