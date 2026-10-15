import React from 'react';
import { Candidate } from '../types';

interface TopHeaderProps {
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  leftPoints: number;
  rightPoints: number;
  timeLeft: number;
  onOpenAdmin: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  leftCandidate,
  rightCandidate,
  leftPoints,
  rightPoints,
  timeLeft,
  onOpenAdmin,
}) => {
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

      {/* 2. Timer & Gifts Row (Rosa +1 - Timer 02:05 - Sorvete +1 + AO VIVO) */}
      <div className="w-full max-w-md flex items-center justify-between px-1 my-1">
        {/* Left: Rose +1 / Voto 22 */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-2xl border border-blue-500/60 shadow">
            <span className="text-2xl sm:text-3xl filter drop-shadow">
              {leftCandidate.primaryGift.icon || '🌹'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-black font-digital text-[11px] shadow border border-white/80">
              +1
            </span>
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[9px] sm:text-[10px] tracking-tight uppercase shadow border border-blue-400 whitespace-nowrap">
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

        {/* Right: Sorvete +1 / Voto 13 + AO VIVO badge */}
        <div className="flex flex-col items-center relative">
          {/* AO VIVO pill badge */}
          <div className="absolute -top-2.5 -right-1 z-20 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-black text-[7.5px] uppercase tracking-wider animate-pulse shadow">
            AO VIVO
          </div>
          <div className="relative flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-2xl border border-red-500/60 shadow">
            <span className="text-2xl sm:text-3xl filter drop-shadow">
              {rightCandidate.primaryGift.icon || '🍦'}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black font-digital text-[11px] shadow border border-white/80">
              +1
            </span>
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[9px] sm:text-[10px] tracking-tight uppercase shadow border border-red-400 whitespace-nowrap">
            VOTO NO {rightCandidate.number}
          </div>
        </div>
      </div>

      {/* 3. Status Bar: TOTAL 145 | DIFERENÇA 33 | 13 NA FRENTE */}
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
          className={`py-1 px-1.5 rounded-xl text-center flex flex-col justify-center shadow-lg transition-all ${
            leader === 'left'
              ? 'bg-blue-600 border border-blue-400 text-white animate-pulse'
              : leader === 'right'
              ? 'bg-red-600 border border-red-400 text-white animate-pulse'
              : 'bg-amber-600 border border-amber-400 text-white'
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
