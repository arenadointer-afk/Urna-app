import React from 'react';
import { Candidate, VictoryScore } from '../types';

interface TopHeaderProps {
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  leftPoints: number;
  rightPoints: number;
  timeLeft: number;
  onOpenAdmin: () => void;
  victoryScore: VictoryScore;
  roundNumber: number;
  isLiveOnly?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  leftCandidate,
  rightCandidate,
  timeLeft,
  onOpenAdmin,
  victoryScore,
  roundNumber,
  isLiveOnly = false,
}) => {
  // Format timer 02:05
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <header className="w-full max-w-md flex flex-col items-center select-none pt-1 shrink-0 px-2 z-20">
      {/* 1. COMPACT GOLDEN TITLE (Secret tap opens Admin only in admin mode) */}
      <div
        onClick={!isLiveOnly ? onOpenAdmin : undefined}
        title={!isLiveOnly ? "Toque para Painel Admin" : undefined}
        className={`flex items-center justify-center gap-1.5 ${!isLiveOnly ? 'cursor-pointer active:scale-95' : 'cursor-default'} transition-transform mb-1`}
      >
        <span className="text-sm">🗳️</span>
        <h1
          className="text-base sm:text-lg font-black italic tracking-wider uppercase text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
          style={{ fontFamily: "'Chakra Petch', sans-serif" }}
        >
          ELEIÇÕES 2026
        </h1>
        <span className="px-2 py-0.2 rounded-full bg-blue-600 border border-yellow-300 text-[8px] sm:text-[9px] font-black tracking-widest text-white uppercase shadow">
          INTERATIVO
        </span>
      </div>

      {/* 2. UNIFIED COMPACT STATUS BAR: RODADA, PLACAR GERAL, DIGITAL TIMER & AO VIVO */}
      <div className="w-full flex items-center justify-between px-2.5 py-1 bg-black/90 rounded-xl border border-amber-500/50 shadow-xl backdrop-blur-md">
        {/* Left: Rodada + Placar Left */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-black tracking-wider text-amber-400 uppercase font-digital">
            R#{roundNumber}
          </span>
          <div className="flex items-center gap-1 ml-1 bg-red-950/80 px-1.5 py-0.5 rounded-lg border border-red-500/60 shadow">
            <span className="text-[7.5px] font-black text-red-300 uppercase truncate max-w-[40px]">
              {leftCandidate.name.split(' ')[0]}
            </span>
            <span className="font-digital font-black text-xs sm:text-sm text-white">
              {victoryScore.left}
            </span>
          </div>
        </div>

        {/* Center: BIG DIGITAL TIMER */}
        <div className="flex flex-col items-center justify-center px-1">
          <div
            className={`px-3 py-0.5 rounded-xl bg-black border font-digital font-black text-base sm:text-lg tracking-widest leading-none shadow-inner ${
              timeLeft <= 10
                ? 'border-red-500 text-red-400 animate-pulse scale-105 shadow-red-500/50'
                : 'border-slate-700 text-amber-300'
            }`}
          >
            {formattedTime}
          </div>
        </div>

        {/* Right: Placar Right + AO VIVO */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-blue-950/80 px-1.5 py-0.5 rounded-lg border border-blue-500/60 shadow">
            <span className="font-digital font-black text-xs sm:text-sm text-white">
              {victoryScore.right}
            </span>
            <span className="text-[7.5px] font-black text-blue-300 uppercase truncate max-w-[40px]">
              {rightCandidate.name.split(' ')[0]}
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-black uppercase tracking-wider shadow animate-pulse border border-red-400/80 shrink-0">
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
};
