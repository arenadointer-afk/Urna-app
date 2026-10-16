import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playHugeGiftCelebration } from '../utils/audio';

export interface EpicGiftData {
  id: number;
  username: string;
  giftName: string;
  giftIcon: string;
  points: number;
  candidateNumber: string;
  candidateName: string;
  side: 'left' | 'right';
}

interface EpicGiftAlertProps {
  gift: EpicGiftData | null;
  onDismiss: () => void;
}

export const EpicGiftAlert: React.FC<EpicGiftAlertProps> = ({ gift, onDismiss }) => {
  useEffect(() => {
    if (!gift) return;

    playHugeGiftCelebration();

    // Fire golden celebration confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: gift.side === 'left' ? ['#ef4444', '#fef08a', '#ffffff'] : ['#3b82f6', '#fef08a', '#ffffff'],
      zIndex: 9999,
    });

    const timer = setTimeout(() => {
      onDismiss();
    }, 2800);

    return () => clearTimeout(timer);
  }, [gift]);

  if (!gift) return null;

  return (
    <div className="fixed inset-x-0 top-1/4 z-50 flex items-center justify-center p-3 pointer-events-none animate-bounce">
      <div
        className={`w-full max-w-sm rounded-3xl p-4 text-center shadow-2xl border-4 backdrop-blur-md transform transition-all ${
          gift.side === 'left'
            ? 'bg-gradient-to-r from-red-950 via-slate-900 to-red-900 border-amber-400 shadow-red-500/50'
            : 'bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 border-amber-400 shadow-blue-500/50'
        }`}
      >
        {/* Top Gold Badge */}
        <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-widest shadow mb-2">
          🔥 PRESENTE ÉPICO NA LIVE! 🔥
        </div>

        <div className="flex items-center justify-center gap-3 my-1">
          <span className="text-5xl animate-spin" style={{ animationDuration: '3s' }}>
            {gift.giftIcon}
          </span>
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold text-amber-300">
              {gift.username} enviou
            </span>
            <span className="text-xl font-black text-white tracking-wide uppercase">
              {gift.giftName}
            </span>
          </div>
        </div>

        {/* Big Points Blast Banner */}
        <div className="mt-2 py-1.5 px-4 rounded-2xl bg-black/80 border-2 border-yellow-400 flex items-center justify-center gap-2">
          <span className="text-2xl sm:text-3xl font-black font-digital text-yellow-300 drop-shadow-[0_2px_10px_rgba(234,179,8,0.8)]">
            +{gift.points} PONTOS
          </span>
          <span className="text-xs font-black text-white uppercase">
            P/ {gift.candidateNumber} ({gift.candidateName.split(' ')[0]})
          </span>
        </div>
      </div>
    </div>
  );
};
