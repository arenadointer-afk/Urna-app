import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Candidate } from '../types';
import { Trophy, Flame, Play, Sparkles } from 'lucide-react';
import { playVictoryFanfare } from '../utils/audio';

interface VictoryModalProps {
  winner: 'left' | 'right' | 'draw';
  leftCandidate: Candidate;
  rightCandidate: Candidate;
  leftPoints: number;
  rightPoints: number;
  roundNumber: number;
  resetCountdown: number;
  onForceNextRound: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  leftCandidate,
  rightCandidate,
  leftPoints,
  rightPoints,
  roundNumber,
  resetCountdown,
  onForceNextRound,
}) => {
  useEffect(() => {
    playVictoryFanfare();

    // Fire Confetti Blast
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: winner === 'left' ? ['#2563eb', '#60a5fa', '#fef08a'] : ['#dc2626', '#f87171', '#fef08a'],
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, [winner]);

  const total = leftPoints + rightPoints;
  const leftPct = total > 0 ? Math.round((leftPoints / total) * 100) : 50;
  const rightPct = 100 - leftPct;

  const winningCandidate = winner === 'left' ? leftCandidate : rightCandidate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-zinc-950 border-2 border-amber-500/70 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
        {/* Glowing Urna FIM seal */}
        <div className="mb-2 px-4 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-zinc-300 font-black font-screen text-xs tracking-widest uppercase">
          URNA ELETRÔNICA • F I M
        </div>

        {/* Winner Announcement */}
        {winner === 'draw' ? (
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">⚡</span>
            <h2 className="text-2xl font-black text-amber-300 uppercase tracking-tight font-digital">
              EMPATE HISTÓRICO!
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Ambos os lados terminaram com a mesma pontuação!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div
                className={`w-20 h-20 rounded-full border-4 overflow-hidden shadow-xl ${
                  winner === 'left' ? 'border-blue-500 shadow-blue-500/50' : 'border-red-500 shadow-red-500/50'
                }`}
              >
                <img
                  src={winningCandidate.photoUrl}
                  alt={winningCandidate.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-amber-400 text-zinc-950 shadow-lg animate-bounce">
                <Trophy className="w-5 h-5 fill-zinc-950" />
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>VENCEDOR DA RODADA #{roundNumber}</span>
              <Sparkles className="w-4 h-4" />
            </div>

            <h2
              className={`text-3xl font-black tracking-tight mt-1 uppercase font-digital ${
                winner === 'left' ? 'text-blue-400 drop-shadow-[0_2px_15px_rgba(59,130,246,0.8)]' : 'text-red-400 drop-shadow-[0_2px_15px_rgba(239,68,68,0.8)]'
              }`}
            >
              {winningCandidate.number} - {winningCandidate.name}
            </h2>
          </div>
        )}

        {/* Final Scoreboard Breakdown */}
        <div className="w-full grid grid-cols-2 gap-3 my-4 bg-slate-900/90 rounded-2xl p-3 border border-slate-800">
          <div
            className={`flex flex-col items-center p-2 rounded-xl ${
              winner === 'left' ? 'bg-blue-950/80 border border-blue-500/50' : 'opacity-70'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {leftCandidate.name} ({leftCandidate.number})
            </span>
            <span className="text-2xl font-black font-digital text-blue-400">
              {leftPoints}
            </span>
            <span className="text-xs font-bold text-slate-300">{leftPct}% dos votos</span>
          </div>

          <div
            className={`flex flex-col items-center p-2 rounded-xl ${
              winner === 'right' ? 'bg-red-950/80 border border-red-500/50' : 'opacity-70'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {rightCandidate.name} ({rightCandidate.number})
            </span>
            <span className="text-2xl font-black font-digital text-red-400">
              {rightPoints}
            </span>
            <span className="text-xs font-bold text-slate-300">{rightPct}% dos votos</span>
          </div>
        </div>

        {/* Auto-restart Countdown */}
        <div className="flex flex-col items-center w-full mt-1">
          <span className="text-xs text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Nova rodada começa sozinha em:
          </span>
          <div className="text-4xl font-black font-digital text-emerald-400 bg-emerald-950/50 px-6 py-1.5 rounded-2xl border border-emerald-500/40">
            {resetCountdown}s
          </div>

          <button
            type="button"
            onClick={onForceNextRound}
            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-zinc-950" />
            <span>Iniciar Rodada Agora Sem Esperar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
